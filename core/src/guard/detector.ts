/**
 * Guard Detector - Security Pattern Detection (Fabric Guard)
 * Port of guard core repository detector logic to TypeScript
 */

import type {
    Transaction,
    TransactionInstruction,
    SecurityWarning,
    GuardConfig,
} from "../types";
import { PatternId as Pattern, Severity as Sev } from "../types";

// SPL Token Program IDs
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

// Instruction discriminators for SPL Token
const SET_AUTHORITY_INSTRUCTION = 6;
const CLOSE_ACCOUNT_INSTRUCTION = 9;
const TRANSFER_CHECKED_INSTRUCTION = 12;

// Known safe Transfer Hook programs (can be extended via config)
const KNOWN_SAFE_HOOKS = new Set([
    "fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3", // Fragmetric
]);

// Default max accounts for Transfer Hooks (based on Fragmetric analysis)
const DEFAULT_MAX_HOOK_ACCOUNTS = 20;

/**
 * Analyzes a transaction for dangerous patterns
 */
export function analyzeTransaction(
    transaction: Transaction,
    config?: GuardConfig
): SecurityWarning[] {
    const warnings: SecurityWarning[] = [];

    if (!transaction.instructions || transaction.instructions.length === 0) {
        return warnings;
    }

    const signers = new Set(transaction.signers || []);

    // Track Transfer Hook program invocations for reentrancy detection
    const hookInvocations = new Map<string, number>();

    for (let i = 0; i < transaction.instructions.length; i++) {
        const instruction = transaction.instructions[i];

        // Check if this is a token program instruction
        if (
            instruction.programId === TOKEN_PROGRAM_ID ||
            instruction.programId === TOKEN_2022_PROGRAM_ID
        ) {
            const instructionType = getInstructionType(instruction.data);

            if (instructionType === SET_AUTHORITY_INSTRUCTION) {
                warnings.push(...analyzeSetAuthority(instruction, signers));
            } else if (instructionType === CLOSE_ACCOUNT_INSTRUCTION) {
                warnings.push(...analyzeCloseAccount(instruction));
            }
        }

        // Check for Transfer Hook program invocations
        if (config?.validateTransferHooks !== false) {
            const hookWarnings = analyzeTransferHook(
                instruction,
                config,
                transaction.instructions,
                i
            );
            warnings.push(...hookWarnings);

            // Track hook invocations for reentrancy detection
            const count = hookInvocations.get(instruction.programId) || 0;
            hookInvocations.set(instruction.programId, count + 1);
        }
    }

    // Check for excessive hook reentrancy
    if (config?.validateTransferHooks !== false) {
        for (const [programId, count] of hookInvocations.entries()) {
            if (count > 6 && !isKnownSafeHook(programId, config)) {
                warnings.push({
                    patternId: Pattern.HookReentrancy,
                    severity: Sev.Critical,
                    message: `🚨 CRITICAL: Transfer Hook program invoked ${count} times in single transaction. Possible reentrancy attack!`,
                    affectedAccount: programId,
                    timestamp: Date.now(),
                });
            }
        }
    }

    return warnings;
}

/**
 * Analyzes SetAuthority instructions for dangerous patterns
 */
function analyzeSetAuthority(
    instruction: TransactionInstruction,
    signers: Set<string>
): SecurityWarning[] {
    const warnings: SecurityWarning[] = [];

    try {
        // Parse instruction data
        // Note: This is a simplified version. Production code should use proper Borsh deserialization
        const data = Buffer.from(instruction.data, "base64");
        const authorityType = data[1]; // Authority type is at index 1
        const hasNewAuthority = data[2] === 1; // COption indicator

        const accountPubkey = instruction.keys[0]?.pubkey;

        // P-101: Mint Kill - Setting mint authority to None
        if (authorityType === 0 && !hasNewAuthority) {
            warnings.push({
                patternId: Pattern.MintKill,
                severity: Sev.Critical,
                message:
                    "🚨 CRITICAL: Permanently disabling mint authority. This action is irreversible!",
                affectedAccount: accountPubkey,
                timestamp: Date.now(),
            });
        }

        // P-102: Freeze Kill - Setting freeze authority to None
        if (authorityType === 1 && !hasNewAuthority) {
            warnings.push({
                patternId: Pattern.FreezeKill,
                severity: Sev.Critical,
                message:
                    "🚨 CRITICAL: Permanently disabling freeze authority. You will lose freeze capability!",
                affectedAccount: accountPubkey,
                timestamp: Date.now(),
            });
        }

        // P-103: Signer Mismatch - New authority is not a current signer
        if (hasNewAuthority && instruction.keys.length > 1) {
            const newAuthority = instruction.keys[1]?.pubkey;
            if (newAuthority && !signers.has(newAuthority)) {
                warnings.push({
                    patternId: Pattern.SignerMismatch,
                    severity: Sev.Warning,
                    message: `⚠️  WARNING: New authority (${newAuthority}) is not a current signer. Risk of lockout!`,
                    affectedAccount: accountPubkey,
                    timestamp: Date.now(),
                });
            }
        }
    } catch (error) {
        // Silently skip if we can't parse the instruction
    }

    return warnings;
}

/**
 * Analyzes CloseAccount instructions for dangerous patterns
 */
function analyzeCloseAccount(
    instruction: TransactionInstruction
): SecurityWarning[] {
    const warnings: SecurityWarning[] = [];

    const accountPubkey = instruction.keys[0]?.pubkey;

    // P-104: Dangerous Close - Closing account without explicit balance check
    warnings.push({
        patternId: Pattern.DangerousClose,
        severity: Sev.Alert,
        message:
            "⚡ ALERT: Closing account. Ensure balance has been transferred or is zero!",
        affectedAccount: accountPubkey,
        timestamp: Date.now(),
    });

    return warnings;
}

/**
 * Extracts instruction type from instruction data
 */
function getInstructionType(data: string): number {
    try {
        const buffer = Buffer.from(data, "base64");
        return buffer.length > 0 ? buffer[0] : -1;
    } catch {
        return -1;
    }
}

/**
 * Analyzes Transfer Hook program invocations for suspicious patterns
 */
function analyzeTransferHook(
    instruction: TransactionInstruction,
    config: GuardConfig | undefined,
    allInstructions: TransactionInstruction[],
    currentIndex: number
): SecurityWarning[] {
    const warnings: SecurityWarning[] = [];

    // Skip if this is a known program (Token, System, etc.)
    const knownPrograms = [
        TOKEN_PROGRAM_ID,
        TOKEN_2022_PROGRAM_ID,
        "11111111111111111111111111111111", // System Program
        "ComputeBudget111111111111111111111111111111", // Compute Budget
        "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", // Associated Token
    ];

    if (knownPrograms.includes(instruction.programId)) {
        return warnings;
    }

    // Check if this instruction is likely a Transfer Hook
    // Transfer Hooks are typically invoked with many accounts and specific data patterns
    const accountCount = instruction.keys.length;
    const maxAccounts = config?.maxHookAccounts || DEFAULT_MAX_HOOK_ACCOUNTS;

    // P-108: Excessive Hook Accounts
    if (accountCount > maxAccounts && !isKnownSafeHook(instruction.programId, config)) {
        warnings.push({
            patternId: Pattern.ExcessiveHookAccounts,
            severity: Sev.Warning,
            message: `⚠️  WARNING: Transfer Hook accesses ${accountCount} accounts (max: ${maxAccounts}). Verify this is expected behavior.`,
            affectedAccount: instruction.programId,
            timestamp: Date.now(),
        });
    }

    // P-105: Malicious Transfer Hook - Unknown program with many writable accounts
    const writableAccounts = instruction.keys.filter((k) => k.isWritable).length;
    if (
        writableAccounts > 10 &&
        !isKnownSafeHook(instruction.programId, config) &&
        accountCount > 15
    ) {
        warnings.push({
            patternId: Pattern.MaliciousTransferHook,
            severity: Sev.Critical,
            message: `🚨 CRITICAL: Unknown Transfer Hook modifies ${writableAccounts} accounts. Possible malicious hook!`,
            affectedAccount: instruction.programId,
            timestamp: Date.now(),
        });
    }

    // P-106: Unexpected Hook Execution - Hook invoked but no token transfer detected
    const hasTokenTransfer = allInstructions.some((instr) => {
        if (
            instr.programId === TOKEN_PROGRAM_ID ||
            instr.programId === TOKEN_2022_PROGRAM_ID
        ) {
            const type = getInstructionType(instr.data);
            return type === TRANSFER_CHECKED_INSTRUCTION || type === 3; // Transfer or TransferChecked
        }
        return false;
    });

    if (!hasTokenTransfer && accountCount > 10 && !isKnownSafeHook(instruction.programId, config)) {
        warnings.push({
            patternId: Pattern.UnexpectedHookExecution,
            severity: Sev.Alert,
            message: `⚡ ALERT: Transfer Hook invoked without token transfer. Verify transaction legitimacy.`,
            affectedAccount: instruction.programId,
            timestamp: Date.now(),
        });
    }

    // P-107: Hook Reentrancy - Hook calls back into token program
    if (currentIndex > 0) {
        const previousInstr = allInstructions[currentIndex - 1];
        if (
            previousInstr &&
            (previousInstr.programId === TOKEN_PROGRAM_ID ||
                previousInstr.programId === TOKEN_2022_PROGRAM_ID) &&
            currentIndex < allInstructions.length - 1
        ) {
            const nextInstr = allInstructions[currentIndex + 1];
            if (
                nextInstr &&
                (nextInstr.programId === TOKEN_PROGRAM_ID ||
                    nextInstr.programId === TOKEN_2022_PROGRAM_ID)
            ) {
                // Hook sandwiched between token instructions - potential reentrancy
                warnings.push({
                    patternId: Pattern.HookReentrancy,
                    severity: Sev.Critical,
                    message: `🚨 CRITICAL: Transfer Hook sandwiched between token operations. Possible reentrancy!`,
                    affectedAccount: instruction.programId,
                    timestamp: Date.now(),
                });
            }
        }
    }

    return warnings;
}

/**
 * Checks if a program is a known safe Transfer Hook
 */
function isKnownSafeHook(programId: string, config?: GuardConfig): boolean {
    // Check built-in whitelist
    if (KNOWN_SAFE_HOOKS.has(programId)) {
        return true;
    }

    // Check config whitelist
    if (config?.allowedHookPrograms?.includes(programId)) {
        return true;
    }

    return false;
}
