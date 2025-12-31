/**
 * Core Fabrknt class for executing protected transactions with precision.
 *
 * The main orchestration class that coordinates transaction execution with
 * security validation (Guard), risk assessment (Pulsar), and privacy
 * preservation (Privacy/Arbor).
 *
 * @example
 * ```typescript
 * import { Fabrknt, Guard } from "@fabrknt/sdk";
 *
 * const guard = new Guard({
 *   maxSlippage: 0.1,
 *   mode: "block"
 * });
 *
 * await Fabrknt.execute(transaction, { with: guard });
 * ```
 */

import type { FabrkntConfig, Transaction } from "../types";
import type { Guard } from "../guard";
import { Pulsar } from "../pulsar";

/**
 * Fabrknt orchestration class for secure transaction execution.
 *
 * Provides two main execution methods:
 * - `execute()`: Standard transaction execution with Guard validation
 * - `executePrivate()`: Privacy-enabled execution with ZK Compression
 */
export class Fabrknt {
    private config: FabrkntConfig;

    /**
     * Creates a new Fabrknt instance with the specified configuration.
     *
     * @param config - Fabrknt configuration options
     * @param config.network - Solana network to use (default: "mainnet-beta")
     * @param config.rpcUrl - Custom RPC URL (optional)
     * @param config.privacy - Privacy configuration (optional)
     *
     * @example
     * ```typescript
     * const fabrknt = new Fabrknt({
     *   network: "devnet",
     *   rpcUrl: "https://api.devnet.solana.com"
     * });
     * ```
     */
    constructor(config: FabrkntConfig = {}) {
        this.config = {
            network: config.network || "mainnet-beta",
            rpcUrl: config.rpcUrl,
            privacy: config.privacy,
        };
    }

    /**
     * Executes a transaction with Guard protection and optional Risk assessment.
     *
     * Performs the following steps:
     * 1. Validates transaction against Guard security rules (if Guard provided)
     * 2. Assesses risk via Pulsar if enabled in Guard config
     * 3. Blocks transactions that exceed risk thresholds or fail compliance
     * 4. Executes the transaction on Solana (placeholder implementation)
     *
     * @param tx - The transaction to execute
     * @param options - Execution options
     * @param options.with - Optional Guard instance for security validation
     * @returns The executed transaction with updated status
     *
     * @example
     * ```typescript
     * import { Fabrknt, Guard } from "@fabrknt/sdk";
     *
     * // Basic execution with Guard
     * const guard = new Guard({
     *   maxSlippage: 0.1,
     *   mode: "block"
     * });
     *
     * const result = await Fabrknt.execute(transaction, { with: guard });
     * if (result.status === "executed") {
     *   console.log("Transaction executed successfully");
     * }
     * ```
     *
     * @example
     * ```typescript
     * // Execution with Risk assessment
     * const guardWithRisk = new Guard({
     *   maxSlippage: 0.05,
     *   mode: "block",
     *   pulsar: {
     *     enabled: true,
     *     riskThreshold: 0.7,
     *     enableComplianceCheck: true
     *   }
     * });
     *
     * const tx = {
     *   id: "tx-001",
     *   status: "pending",
     *   assetAddresses: ["TokenAddress..."],
     *   instructions: []
     * };
     *
     * const result = await Fabrknt.execute(tx, { with: guardWithRisk });
     * // Transaction automatically blocked if risk score > 0.7 or non-compliant
     * ```
     */
    public static async execute(
        tx: Transaction,
        options: { with?: Guard } = {}
    ): Promise<Transaction> {
        // Validate with guard if provided
        if (options.with) {
            const isValid = await options.with.validate(tx);
            if (!isValid) {
                return { ...tx, status: "failed" };
            }

            // Additional validation: Check Risk if Guard has Pulsar config
            const guardConfig = options.with.getConfig();
            if (guardConfig.pulsar?.enabled && tx.assetAddresses) {
                try {
                    const riskMetricsMap = await Pulsar.getBatchRiskMetrics(
                        tx.assetAddresses,
                        guardConfig.pulsar
                    );

                    // Check if any asset exceeds risk threshold
                    for (const [, metrics] of riskMetricsMap.entries()) {
                        if (
                            metrics.riskScore !== null &&
                            guardConfig.pulsar.riskThreshold !== undefined &&
                            metrics.riskScore > guardConfig.pulsar.riskThreshold
                        ) {
                            // Block transaction if risk is too high and mode is 'block'
                            if (guardConfig.mode === "block") {
                                return {
                                    ...tx,
                                    status: "failed",
                                };
                            }
                        }

                        // Block non-compliant assets if compliance check is enabled
                        if (
                            guardConfig.pulsar.enableComplianceCheck &&
                            metrics.complianceStatus === "non-compliant" &&
                            guardConfig.mode === "block"
                        ) {
                            return {
                                ...tx,
                                status: "failed",
                            };
                        }
                    }
                } catch (error) {
                    // If Risk fails and fallback is enabled, continue execution
                    if (!guardConfig.pulsar.fallbackOnError) {
                        return { ...tx, status: "failed" };
                    }
                }
            }
        }

        // Placeholder execution logic
        // TODO: Integrate with actual Solana transaction execution
        return { ...tx, status: "executed" };
    }

    /**
     * Executes a privacy-enabled transaction with ZK Compression.
     *
     * Performs the following steps:
     * 1. Marks transaction as requiring privacy
     * 2. Validates transaction against Guard security rules (if Guard provided)
     * 3. Compresses transaction state using Privacy ZK Stack (placeholder)
     * 4. Generates ZK proof for privacy preservation (placeholder)
     * 5. Executes the compressed transaction on Solana (placeholder)
     *
     * Benefits of privacy execution:
     * - Massive cost reduction (up to 99.98% savings via ZK Compression)
     * - Shielded state management for transaction confidentiality
     * - Efficient proof generation (128 bytes fixed size with Groth16)
     *
     * @param tx - The transaction to execute privately
     * @param options - Execution options
     * @param options.with - Optional Guard instance for security validation
     * @param options.privacy - Privacy configuration
     * @param options.privacy.provider - Privacy provider: "arbor" (default) or "light"
     * @param options.privacy.compression - Enable ZK Compression (default: true)
     * @returns The executed private transaction with updated status
     *
     * @example
     * ```typescript
     * import { Fabrknt, Guard, FabricCore } from "@fabrknt/sdk";
     *
     * // Optimize transaction for privacy
     * const optimized = FabricCore.optimize(transaction, {
     *   enablePrivacy: true,
     *   compressionLevel: "high",
     *   privacyProvider: "arbor"
     * });
     *
     * // Execute with privacy and compression
     * const result = await Fabrknt.executePrivate(optimized, {
     *   with: guard,
     *   privacy: {
     *     provider: "arbor",
     *     compression: true
     *   }
     * });
     *
     * // Estimate cost savings
     * const savings = FabricCore.estimateCompressionSavings(100);
     * console.log(`Saved ${savings.savingsPercent.toFixed(2)}%`);
     * ```
     *
     * @example
     * ```typescript
     * // Simple private execution with defaults
     * const result = await Fabrknt.executePrivate(transaction, {
     *   with: guard
     *   // Uses arbor provider and compression by default
     * });
     * ```
     */
    public static async executePrivate(
        tx: Transaction,
        options: {
            with?: Guard;
            privacy?: { provider?: "arbor" | "light"; compression?: boolean };
        } = {}
    ): Promise<Transaction> {
        // Mark transaction as requiring privacy
        const privateTx: Transaction = {
            ...tx,
            privacyMetadata: {
                requiresPrivacy: true,
                compressionEnabled: options.privacy?.compression ?? true,
            },
        };

        // Validate with guard if provided
        if (options.with) {
            const isValid = await options.with.validate(privateTx);
            if (!isValid) {
                return { ...privateTx, status: "failed" };
            }
        }

        // TODO: Integrate with Privacy/Light Protocol ZK Stack
        // This would:
        // 1. Compress transaction state using Sparse Binary Merkle Trees
        // 2. Generate ZK proof
        // 3. Submit compressed transaction to Solana

        // Placeholder: For now, execute normally but mark as private
        return { ...privateTx, status: "executed" };
    }

    /**
     * Gets the current Fabrknt configuration.
     *
     * @returns The Fabrknt configuration object
     *
     * @example
     * ```typescript
     * const fabrknt = new Fabrknt({
     *   network: "devnet",
     *   rpcUrl: "https://api.devnet.solana.com"
     * });
     *
     * const config = fabrknt.getConfig();
     * console.log(`Network: ${config.network}`);
     * console.log(`RPC URL: ${config.rpcUrl}`);
     * ```
     */
    public getConfig(): FabrkntConfig {
        return this.config;
    }
}
