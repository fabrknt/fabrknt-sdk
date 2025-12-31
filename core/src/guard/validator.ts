/**
 * Guard Validator - Transaction Validation Logic (Fabric Guard)
 */

import type {
    Transaction,
    ValidationResult,
    GuardConfig,
    SecurityWarning,
} from "../types";
import { Severity, PatternId } from "../types";
import { analyzeTransaction } from "./detector";
import { detectAllEVMPatterns } from "./evm-detector";
import { Pulsar } from "../pulsar";
import type { UnifiedTransaction, EVMTransactionData } from "../chain/types";
import { isEVMChain } from "../chain/evm-networks";

/**
 * Validates a unified transaction against Guard rules (multi-chain support)
 */
export async function validateUnifiedTransactionWithPatterns(
    transaction: UnifiedTransaction,
    config: GuardConfig
): Promise<ValidationResult> {
    const warnings: SecurityWarning[] = [];

    // Emergency stop check
    if (config.emergencyStop) {
        return {
            isValid: false,
            warnings: [
                {
                    patternId: PatternId.MintKill, // Use generic pattern for emergency
                    severity: Severity.Critical,
                    message: "🛑 EMERGENCY STOP: All operations are halted",
                    timestamp: Date.now(),
                },
            ],
            blockedBy: [PatternId.MintKill],
        };
    }

    // Pattern detection - route to correct detector based on chain
    if (config.enablePatternDetection !== false) {
        if (isEVMChain(transaction.chain)) {
            // Use EVM detector
            if (transaction.chainData.type === "evm") {
                const evmData = transaction.chainData.data as EVMTransactionData;
                const detectedWarnings = detectAllEVMPatterns(evmData);
                warnings.push(...detectedWarnings);
            }
        } else {
            // Use Solana detector (convert to legacy format)
            const legacyTx: Transaction = {
                id: transaction.id,
                status: transaction.status === "pending" ? "pending" : transaction.status === "executed" ? "executed" : "failed",
                instructions: transaction.chainData.type === "solana" ? transaction.chainData.data.instructions as any[] : undefined,
                assetAddresses: transaction.assetAddresses,
                privacyMetadata: transaction.privacyMetadata,
            };
            const detectedWarnings = analyzeTransaction(legacyTx, config);
            warnings.push(...detectedWarnings);
        }
    }

    // Risk assessment (if enabled)
    if (config.pulsar?.enabled && transaction.assetAddresses) {
        const legacyTx: Transaction = {
            id: transaction.id,
            status: transaction.status === "pending" ? "pending" : transaction.status === "executed" ? "executed" : "failed",
            assetAddresses: transaction.assetAddresses,
            privacyMetadata: transaction.privacyMetadata,
        };
        const pulsarWarnings = await validatePulsarRisk(legacyTx, config.pulsar);
        warnings.push(...pulsarWarnings);
    }

    // Privacy compliance validation
    if (transaction.privacyMetadata?.requiresPrivacy) {
        const legacyTx: Transaction = {
            id: transaction.id,
            status: transaction.status === "pending" ? "pending" : transaction.status === "executed" ? "executed" : "failed",
            privacyMetadata: transaction.privacyMetadata,
        };
        const privacyWarnings = validatePrivacyRequirements(legacyTx);
        warnings.push(...privacyWarnings);
    }

    // Determine if transaction should be blocked
    const blockedBy = determineBlocking(warnings, config);
    const isValid = blockedBy.length === 0;

    return {
        isValid,
        warnings,
        blockedBy: blockedBy.length > 0 ? blockedBy : undefined,
    };
}

/**
 * Validates a transaction against Guard rules (legacy Solana format)
 */
export async function validateTransaction(
    transaction: Transaction,
    config: GuardConfig
): Promise<ValidationResult> {
    const warnings: SecurityWarning[] = [];

    // Emergency stop check
    if (config.emergencyStop) {
        return {
            isValid: false,
            warnings: [
                {
                    patternId: PatternId.MintKill, // Use generic pattern for emergency
                    severity: Severity.Critical,
                    message: "🛑 EMERGENCY STOP: All operations are halted",
                    timestamp: Date.now(),
                },
            ],
            blockedBy: [PatternId.MintKill],
        };
    }

    // Pattern detection (Solana only for legacy transactions)
    if (config.enablePatternDetection !== false) {
        const detectedWarnings = analyzeTransaction(transaction, config);
        warnings.push(...detectedWarnings);
    }

    // Risk assessment (if enabled)
    if (config.pulsar?.enabled && transaction.assetAddresses) {
        const pulsarWarnings = await validatePulsarRisk(
            transaction,
            config.pulsar
        );
        warnings.push(...pulsarWarnings);
    }

    // Privacy compliance validation (for Privacy integration)
    if (transaction.privacyMetadata?.requiresPrivacy) {
        const privacyWarnings = validatePrivacyRequirements(transaction);
        warnings.push(...privacyWarnings);
    }

    // Custom rules validation
    if (config.customRules && config.customRules.length > 0) {
        for (const rule of config.customRules) {
            if (rule.enabled) {
                try {
                    const ruleResult = rule.validate(transaction);
                    const isValid =
                        ruleResult instanceof Promise ? false : ruleResult; // For now, sync only

                    if (!isValid) {
                        warnings.push({
                            patternId: PatternId.SignerMismatch, // Generic pattern for custom rules
                            severity: Severity.Warning,
                            message: `Custom rule violation: ${rule.name}`,
                            timestamp: Date.now(),
                        });
                    }
                } catch (error) {
                    // Skip invalid rules
                }
            }
        }
    }

    // Determine if transaction should be blocked
    const blockedBy = determineBlocking(warnings, config);
    const isValid = blockedBy.length === 0;

    return {
        isValid,
        warnings,
        blockedBy: blockedBy.length > 0 ? blockedBy : undefined,
    };
}

/**
 * Validates transaction against Risk metrics
 */
async function validatePulsarRisk(
    transaction: Transaction,
    pulsarConfig: NonNullable<GuardConfig["pulsar"]>
): Promise<SecurityWarning[]> {
    const warnings: SecurityWarning[] = [];

    if (
        !transaction.assetAddresses ||
        transaction.assetAddresses.length === 0
    ) {
        return warnings;
    }

    try {
        // Get risk metrics for all assets in the transaction
        const riskMetricsMap = await Pulsar.getBatchRiskMetrics(
            transaction.assetAddresses,
            pulsarConfig
        );

        // Check each asset's risk score
        for (const [assetAddress, metrics] of riskMetricsMap.entries()) {
            // Risk score check
            if (
                metrics.riskScore !== null &&
                pulsarConfig.riskThreshold !== undefined &&
                metrics.riskScore > pulsarConfig.riskThreshold
            ) {
                warnings.push({
                    patternId: PatternId.SignerMismatch, // Use generic pattern for risk warnings
                    severity: Severity.Warning,
                    message: `High risk asset detected: ${assetAddress} (risk score: ${metrics.riskScore.toFixed(
                        2
                    )})`,
                    affectedAccount: assetAddress,
                    timestamp: Date.now(),
                });
            }

            // Compliance check
            if (
                pulsarConfig.enableComplianceCheck &&
                metrics.complianceStatus === "non-compliant"
            ) {
                warnings.push({
                    patternId: PatternId.SignerMismatch,
                    severity: Severity.Critical,
                    message: `Non-compliant asset detected: ${assetAddress}`,
                    affectedAccount: assetAddress,
                    timestamp: Date.now(),
                });
            }

            // Counterparty risk check
            if (
                pulsarConfig.enableCounterpartyCheck &&
                metrics.counterpartyRisk !== null &&
                metrics.counterpartyRisk > 0.7
            ) {
                warnings.push({
                    patternId: PatternId.SignerMismatch,
                    severity: Severity.Warning,
                    message: `High counterparty risk: ${assetAddress} (risk: ${metrics.counterpartyRisk.toFixed(
                        2
                    )})`,
                    affectedAccount: assetAddress,
                    timestamp: Date.now(),
                });
            }

            // Oracle integrity check
            if (
                pulsarConfig.enableOracleCheck &&
                metrics.oracleIntegrity !== null &&
                metrics.oracleIntegrity < 0.8
            ) {
                warnings.push({
                    patternId: PatternId.SignerMismatch,
                    severity: Severity.Alert,
                    message: `Low oracle integrity: ${assetAddress} (integrity: ${metrics.oracleIntegrity.toFixed(
                        2
                    )})`,
                    affectedAccount: assetAddress,
                    timestamp: Date.now(),
                });
            }
        }
    } catch (error) {
        // If Risk fails and fallback is enabled, continue without warnings
        // Otherwise, log the error (could add error warning if needed)
        if (!pulsarConfig.fallbackOnError) {
            warnings.push({
                patternId: PatternId.SignerMismatch,
                severity: Severity.Warning,
                message: `Risk assessment failed: ${
                    error instanceof Error ? error.message : "Unknown error"
                }`,
                timestamp: Date.now(),
            });
        }
    }

    return warnings;
}

/**
 * Validates privacy requirements for transactions
 */
function validatePrivacyRequirements(
    transaction: Transaction
): SecurityWarning[] {
    const warnings: SecurityWarning[] = [];

    // Check if transaction has privacy metadata but compression is not enabled
    if (
        transaction.privacyMetadata?.requiresPrivacy &&
        !transaction.privacyMetadata.compressionEnabled
    ) {
        warnings.push({
            patternId: PatternId.SignerMismatch, // Use generic pattern
            severity: Severity.Warning,
            message:
                "Privacy requested but compression not enabled. Consider enabling ZK Compression for cost efficiency.",
            timestamp: Date.now(),
        });
    }

    return warnings;
}

/**
 * Determines which patterns should block the transaction
 */
function determineBlocking(
    warnings: SecurityWarning[],
    config: GuardConfig
): PatternId[] {
    const mode = config.mode || "block";
    const riskTolerance = config.riskTolerance || "moderate";

    // In warn mode, never block
    if (mode === "warn") {
        return [];
    }

    const blockedPatterns: PatternId[] = [];

    for (const warning of warnings) {
        const shouldBlock = shouldBlockPattern(
            warning.patternId,
            warning.severity,
            riskTolerance
        );

        if (shouldBlock && !blockedPatterns.includes(warning.patternId)) {
            blockedPatterns.push(warning.patternId);
        }
    }

    return blockedPatterns;
}

/**
 * Determines if a pattern should block based on severity and risk tolerance
 */
function shouldBlockPattern(
    pattern: PatternId,
    severity: Severity,
    riskTolerance: "strict" | "moderate" | "permissive"
): boolean {
    // Critical patterns always block in strict mode
    if (severity === Severity.Critical && riskTolerance === "strict") {
        return true;
    }

    // Moderate blocks critical patterns only
    if (severity === Severity.Critical && riskTolerance === "moderate") {
        return true;
    }

    // Permissive only blocks mint/freeze kills
    if (
        riskTolerance === "permissive" &&
        (pattern === PatternId.MintKill || pattern === PatternId.FreezeKill)
    ) {
        return true;
    }

    return false;
}
