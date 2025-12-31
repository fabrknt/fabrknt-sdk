/**
 * Guard Security Pattern Detection Example
 *
 * This example demonstrates how Guard detects dangerous
 * transaction patterns (P-101 through P-104).
 */

import {
    Guard,
    PatternId,
    Severity,
    type Transaction,
    type TransactionInstruction,
} from "@fabrknt/sdk";

const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

// Example 1: Detecting Mint Kill (P-101)
function detectMintKill() {
    console.log("=== Example 1: Mint Kill Detection (P-101) ===\n");

    const guard = new Guard();

    // SetAuthority instruction that removes mint authority
    const mintKillInstruction: TransactionInstruction = {
        programId: TOKEN_PROGRAM_ID,
        keys: [
            {
                pubkey: "MintPubkey123",
                isSigner: false,
                isWritable: true,
            },
        ],
        // [6, 0, 0] = SetAuthority, MintTokens authority, None
        data: Buffer.from([6, 0, 0]).toString("base64"),
    };

    const tx: Transaction = {
        id: "mint-kill-tx",
        status: "pending",
        instructions: [mintKillInstruction],
    };

    const result = guard.validateTransaction(tx);

    console.log("Transaction Valid:", result.isValid);
    console.log("Warnings Found:", result.warnings.length);

    if (result.warnings.length > 0) {
        result.warnings.forEach((warning) => {
            console.log("\nWarning Details:");
            console.log("  Pattern ID:", warning.patternId);
            console.log("  Severity:", warning.severity);
            console.log("  Message:", warning.message);
            console.log("  Affected Account:", warning.affectedAccount);
        });
    }

    if (result.blockedBy) {
        console.log("\nBlocked by patterns:", result.blockedBy);
    }
}

// Example 2: Detecting Freeze Kill (P-102)
function detectFreezeKill() {
    console.log("\n=== Example 2: Freeze Kill Detection (P-102) ===\n");

    const guard = new Guard();

    // SetAuthority instruction that removes freeze authority
    const freezeKillInstruction: TransactionInstruction = {
        programId: TOKEN_PROGRAM_ID,
        keys: [
            {
                pubkey: "AccountPubkey456",
                isSigner: false,
                isWritable: true,
            },
        ],
        // [6, 1, 0] = SetAuthority, FreezeAccount authority, None
        data: Buffer.from([6, 1, 0]).toString("base64"),
    };

    const tx: Transaction = {
        id: "freeze-kill-tx",
        status: "pending",
        instructions: [freezeKillInstruction],
    };

    const result = guard.validateTransaction(tx);

    console.log("Transaction Valid:", result.isValid);
    console.log(
        "Warnings:",
        result.warnings.map((w) => w.patternId)
    );
}

// Example 3: Detecting Signer Mismatch (P-103)
function detectSignerMismatch() {
    console.log("\n=== Example 3: Signer Mismatch Detection (P-103) ===\n");

    const guard = new Guard();

    // Transferring authority to a wallet that's not signing
    const signerMismatchInstruction: TransactionInstruction = {
        programId: TOKEN_PROGRAM_ID,
        keys: [
            {
                pubkey: "CurrentAuthority",
                isSigner: true,
                isWritable: true,
            },
            {
                pubkey: "NewUntrustedAuthority", // Not in signers list!
                isSigner: false,
                isWritable: false,
            },
        ],
        // [6, 0, 1] = SetAuthority, MintTokens authority, Some(new authority)
        data: Buffer.from([6, 0, 1]).toString("base64"),
    };

    const tx: Transaction = {
        id: "signer-mismatch-tx",
        status: "pending",
        instructions: [signerMismatchInstruction],
        signers: ["CurrentAuthority"], // NewUntrustedAuthority is NOT a signer
    };

    const result = guard.validateTransaction(tx);

    console.log("Transaction Valid:", result.isValid);
    if (result.warnings.length > 0) {
        console.log("\nDetected Pattern:", result.warnings[0].patternId);
        console.log("Risk:", result.warnings[0].message);
    }
}

// Example 4: Detecting Dangerous Close (P-104)
function detectDangerousClose() {
    console.log("\n=== Example 4: Dangerous Close Detection (P-104) ===\n");

    const guard = new Guard();

    // CloseAccount instruction
    const closeAccountInstruction: TransactionInstruction = {
        programId: TOKEN_PROGRAM_ID,
        keys: [
            {
                pubkey: "AccountToClose",
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: "DestinationAccount",
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: "Authority",
                isSigner: true,
                isWritable: false,
            },
        ],
        // [9] = CloseAccount
        data: Buffer.from([9]).toString("base64"),
    };

    const tx: Transaction = {
        id: "close-account-tx",
        status: "pending",
        instructions: [closeAccountInstruction],
    };

    const result = guard.validateTransaction(tx);

    console.log("Transaction Valid:", result.isValid);
    console.log("Alert:", result.warnings[0]?.message);
}

// Example 5: Multiple Patterns in One Transaction
function detectMultiplePatterns() {
    console.log("\n=== Example 5: Multiple Pattern Detection ===\n");

    const guard = new Guard({
        riskTolerance: "strict",
    });

    const tx: Transaction = {
        id: "multi-pattern-tx",
        status: "pending",
        instructions: [
            // Mint kill
            {
                programId: TOKEN_PROGRAM_ID,
                keys: [{ pubkey: "Mint", isSigner: false, isWritable: true }],
                data: Buffer.from([6, 0, 0]).toString("base64"),
            },
            // Account close
            {
                programId: TOKEN_PROGRAM_ID,
                keys: [
                    { pubkey: "Account", isSigner: false, isWritable: true },
                    { pubkey: "Dest", isSigner: false, isWritable: true },
                    { pubkey: "Auth", isSigner: true, isWritable: false },
                ],
                data: Buffer.from([9]).toString("base64"),
            },
        ],
    };

    const result = guard.validateTransaction(tx);

    console.log("Transaction Valid:", result.isValid);
    console.log("Total Warnings:", result.warnings.length);
    console.log(
        "Patterns Detected:",
        result.warnings.map((w) => w.patternId)
    );
    console.log("Blocked By:", result.blockedBy);
}

// Example 6: Warn Mode vs Block Mode for Patterns
function warnVsBlockMode() {
    console.log("\n=== Example 6: Warn vs Block Mode ===\n");

    const dangerousTx: Transaction = {
        id: "dangerous-tx",
        status: "pending",
        instructions: [
            {
                programId: TOKEN_PROGRAM_ID,
                keys: [{ pubkey: "Mint", isSigner: false, isWritable: true }],
                data: Buffer.from([6, 0, 0]).toString("base64"), // Mint kill
            },
        ],
    };

    // Block mode - will prevent transaction
    const blockGuard = new Guard({ mode: "block" });
    const blockResult = blockGuard.validateTransaction(dangerousTx);
    console.log("Block Mode - Valid:", blockResult.isValid);
    console.log("Block Mode - Blocked:", blockResult.blockedBy);

    // Warn mode - will allow but log warning
    const warnGuard = new Guard({ mode: "warn" });
    const warnResult = warnGuard.validateTransaction(dangerousTx);
    console.log("\nWarn Mode - Valid:", warnResult.isValid);
    console.log("Warn Mode - Warnings:", warnResult.warnings.length);
}

// Run all examples
function runExamples() {
    detectMintKill();
    detectFreezeKill();
    detectSignerMismatch();
    detectDangerousClose();
    detectMultiplePatterns();
    warnVsBlockMode();
}

// Uncomment to run
// runExamples();
