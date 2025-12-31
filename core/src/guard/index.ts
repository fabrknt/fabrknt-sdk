/**
 * Guard - The Safety Layer (Fabric Guard)
 *
 * Prevents unauthorized drain, excessive slippage, malicious CPI calls, and
 * reentrancy attacks in real-time through pattern detection and validation.
 *
 * @example
 * ```typescript
 * const guard = new Guard({
 *   maxSlippage: 0.1,
 *   riskTolerance: "moderate",
 *   mode: "block",
 *   enablePatternDetection: true
 * });
 *
 * const result = await guard.validateTransaction(transaction);
 * if (!result.isValid) {
 *   console.log('Transaction blocked:', result.reason);
 * }
 * ```
 */

import type {
    GuardConfig,
    Transaction,
    ValidationResult,
    SecurityWarning,
} from "../types";
import { PatternId, Severity } from "../types";
import type { UnifiedTransaction } from "../chain";
import { validateTransaction, validateUnifiedTransactionWithPatterns } from "./validator";

/**
 * Guard class for transaction security validation and monitoring.
 *
 * Provides comprehensive security checks including:
 * - P-101: Excessive Slippage Detection
 * - P-102: Unauthorized Drain Prevention
 * - P-103: Malicious CPI Call Detection
 * - P-104: Reentrancy Attack Detection
 *
 * Supports three enforcement modes:
 * - "block": Reject invalid transactions (throws error)
 * - "warn": Log warnings but allow transactions
 * - "monitor": Silent monitoring for analytics
 */
export class Guard {
    private config: GuardConfig;
    private warningHistory: SecurityWarning[] = [];

    /**
     * Creates a new Guard instance with the specified configuration.
     *
     * @param config - Guard configuration options
     * @param config.maxSlippage - Maximum allowed slippage (e.g., 0.1 for 10%)
     * @param config.riskTolerance - Risk tolerance level: "low", "moderate", or "high"
     * @param config.mode - Enforcement mode: "block", "warn", or "monitor"
     * @param config.enablePatternDetection - Enable security pattern detection (default: true)
     * @param config.customPatterns - Custom security patterns to detect
     * @param config.pulsar - Risk (Pulsar) integration configuration
     * @param config.emergencyStop - Emergency stop flag (default: false)
     *
     * @example
     * ```typescript
     * const guard = new Guard({
     *   maxSlippage: 0.05,
     *   riskTolerance: "low",
     *   mode: "block"
     * });
     * ```
     */
    constructor(config: GuardConfig = {}) {
        // Set default configuration
        this.config = {
            enablePatternDetection: true,
            riskTolerance: "moderate",
            mode: "block",
            emergencyStop: false,
            ...config,
        };
    }

    /**
     * Validates a transaction against all configured Guard security rules.
     *
     * Performs comprehensive validation including:
     * - Slippage checks
     * - Pattern detection for security threats
     * - Risk assessment via Pulsar (if enabled)
     * - Emergency stop status
     *
     * @param transaction - The transaction to validate
     * @returns Validation result with isValid flag, warnings, and optional reason
     *
     * @example
     * ```typescript
     * const result = await guard.validateTransaction(transaction);
     *
     * if (!result.isValid) {
     *   console.error('Validation failed:', result.reason);
     *   result.warnings.forEach(w => console.warn(w.message));
     * } else {
     *   // Safe to execute transaction
     *   await executeTransaction(transaction);
     * }
     * ```
     */
    public async validateTransaction(
        transaction: Transaction
    ): Promise<ValidationResult> {
        const result = await validateTransaction(transaction, this.config);

        // Store warnings in history
        this.warningHistory.push(...result.warnings);

        return result;
    }

    /**
     * Legacy validation method for backward compatibility.
     *
     * Returns a simple boolean instead of detailed ValidationResult.
     * For new code, prefer validateTransaction() for detailed results.
     *
     * Note: This method is now async due to Risk integration in v0.1.0
     *
     * @param transaction - Optional transaction to validate. If omitted, checks emergency stop status only.
     * @returns True if valid (or emergency stop not active), false otherwise
     *
     * @example
     * ```typescript
     * const isValid = await guard.validate(transaction);
     * if (isValid) {
     *   await executeTransaction(transaction);
     * }
     * ```
     */
    public async validate(transaction?: Transaction): Promise<boolean> {
        if (!transaction) {
            return !this.config.emergencyStop;
        }

        const result = await this.validateTransaction(transaction);
        return result.isValid;
    }

    /**
     * Gets a copy of the current Guard configuration.
     *
     * @returns Guard configuration object (deep copy)
     *
     * @example
     * ```typescript
     * const config = guard.getConfig();
     * console.log('Max slippage:', config.maxSlippage);
     * console.log('Mode:', config.mode);
     * ```
     */
    public getConfig(): GuardConfig {
        return { ...this.config };
    }

    /**
     * Updates Guard configuration with partial updates.
     *
     * Merges the provided updates with existing configuration.
     *
     * @param updates - Partial configuration updates to apply
     *
     * @example
     * ```typescript
     * guard.updateConfig({
     *   maxSlippage: 0.15,
     *   mode: "warn"
     * });
     * ```
     */
    public updateConfig(updates: Partial<GuardConfig>): void {
        this.config = {
            ...this.config,
            ...updates,
        };
    }

    /**
     * Activates emergency stop mode, blocking all operations.
     *
     * When emergency stop is active, all transactions will be rejected
     * regardless of other validation rules.
     *
     * @example
     * ```typescript
     * // In response to security incident
     * guard.activateEmergencyStop();
     *
     * // All transactions now blocked
     * const result = await guard.validate(tx); // Returns false
     * ```
     */
    public activateEmergencyStop(): void {
        this.config.emergencyStop = true;
    }

    /**
     * Deactivates emergency stop mode, resuming normal operations.
     *
     * @example
     * ```typescript
     * // After security incident is resolved
     * guard.deactivateEmergencyStop();
     *
     * // Normal validation resumes
     * const result = await guard.validateTransaction(tx);
     * ```
     */
    public deactivateEmergencyStop(): void {
        this.config.emergencyStop = false;
    }

    /**
     * Gets the complete history of security warnings.
     *
     * Returns all warnings accumulated since Guard initialization or
     * the last call to clearWarningHistory().
     *
     * @returns Array of security warnings (deep copy)
     *
     * @example
     * ```typescript
     * const warnings = guard.getWarningHistory();
     * console.log(`Total warnings: ${warnings.length}`);
     *
     * warnings.forEach(warning => {
     *   console.log(`[${warning.severity}] ${warning.message}`);
     *   console.log(`Pattern: ${warning.patternId}`);
     * });
     * ```
     */
    public getWarningHistory(): SecurityWarning[] {
        return [...this.warningHistory];
    }

    /**
     * Clears the accumulated warning history.
     *
     * Useful for resetting warning state after reviewing or archiving warnings.
     *
     * @example
     * ```typescript
     * // Archive warnings
     * const warnings = guard.getWarningHistory();
     * await archiveToDatabase(warnings);
     *
     * // Clear history
     * guard.clearWarningHistory();
     * ```
     */
    public clearWarningHistory(): void {
        this.warningHistory = [];
    }

    /**
     * Checks if a specific slippage value is acceptable.
     *
     * Compares the actual slippage against the configured maxSlippage threshold.
     * If maxSlippage is not configured, all slippage values are considered acceptable.
     *
     * @param actualSlippage - The actual slippage value to check (e.g., 0.05 for 5%)
     * @returns True if acceptable, false if exceeds threshold
     *
     * @example
     * ```typescript
     * const guard = new Guard({ maxSlippage: 0.1 });
     *
     * guard.isSlippageAcceptable(0.05); // true (5% < 10%)
     * guard.isSlippageAcceptable(0.15); // false (15% > 10%)
     * guard.isSlippageAcceptable(0.10); // true (10% = 10%)
     * ```
     */
    public isSlippageAcceptable(actualSlippage: number): boolean {
        if (this.config.maxSlippage === undefined) {
            return true;
        }
        return actualSlippage <= this.config.maxSlippage;
    }

    /**
     * Validates a unified transaction using chain adapter (cross-chain support).
     *
     * This method enables Guard to work across different blockchains through
     * the chain abstraction layer. When a chain adapter is configured, Guard
     * can validate transactions for Solana, EVM chains, and future chains.
     *
     * @param unifiedTx - Unified transaction to validate
     * @returns Validation result with isValid flag, warnings, and optional reason
     *
     * @example
     * ```typescript
     * import { Guard, createChainAdapter } from '@fabrknt/sdk';
     *
     * // Create chain adapter
     * const solanaAdapter = createChainAdapter({
     *   chain: 'solana',
     *   network: 'mainnet-beta'
     * });
     *
     * // Create Guard with chain adapter
     * const guard = new Guard({
     *   chainAdapter: solanaAdapter,
     *   maxSlippage: 0.1,
     *   mode: 'block'
     * });
     *
     * // Validate unified transaction
     * const result = await guard.validateUnifiedTransaction(unifiedTx);
     * if (!result.isValid) {
     *   console.error('Validation failed:', result.reason);
     * }
     * ```
     */
    public async validateUnifiedTransaction(
        unifiedTx: UnifiedTransaction
    ): Promise<ValidationResult> {
        // Use chain adapter to validate transaction structure
        if (this.config.chainAdapter) {
            const chainValidation = await this.config.chainAdapter.validateTransaction(unifiedTx);
            if (!chainValidation.isValid) {
                return {
                    isValid: false,
                    warnings: [
                        {
                            patternId: PatternId.SignerMismatch, // Generic pattern for chain validation
                            severity: Severity.Critical,
                            message: `Chain validation failed: ${chainValidation.errors?.join(", ")}`,
                            timestamp: Date.now(),
                        },
                    ],
                    blockedBy: [PatternId.SignerMismatch],
                };
            }
        }

        // Use unified transaction validator with chain-specific pattern detection
        const result = await validateUnifiedTransactionWithPatterns(unifiedTx, this.config);

        // Store warnings in history
        this.warningHistory.push(...result.warnings);

        return result;
    }
}

export type { GuardConfig };
export { PatternId, Severity } from "../types";
export type { SecurityWarning, ValidationResult } from "../types";
