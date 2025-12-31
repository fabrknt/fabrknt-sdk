/**
 * Chain Adapter Interface
 *
 * Defines the interface that all chain adapters must implement.
 * This allows portable components (Guard, Risk, Flow, Patterns) to work
 * across different blockchains through a unified API.
 */

import type {
    ChainId,
    UnifiedTransaction,
    TransactionResult,
    CostEstimate,
    UnifiedOperation,
} from "./types";

/**
 * Chain adapter configuration
 */
export interface ChainAdapterConfig {
    /** Chain identifier */
    chain: ChainId;
    /** Network identifier (chain-specific) */
    network: string;
    /** RPC endpoint URL */
    rpcUrl?: string;
    /** Additional chain-specific configuration */
    chainConfig?: Record<string, unknown>;
}

/**
 * Chain adapter interface
 *
 * All chain adapters (Solana, EVM) must implement this interface.
 * This provides a unified API for portable components.
 */
export interface ChainAdapter {
    /** Chain identifier */
    readonly chain: ChainId;
    /** Network identifier */
    readonly network: string;

    /**
     * Build a chain-specific transaction from a unified transaction
     *
     * @param tx - Unified transaction to convert
     * @returns Chain-specific transaction ready for execution
     */
    buildTransaction(tx: UnifiedTransaction): Promise<unknown>;

    /**
     * Execute a transaction on the chain
     *
     * @param tx - Chain-specific transaction to execute
     * @returns Transaction execution result
     */
    executeTransaction(tx: unknown): Promise<TransactionResult>;

    /**
     * Estimate the cost of executing a transaction
     *
     * @param tx - Unified transaction to estimate
     * @returns Cost estimate including gas/compute units
     */
    estimateCost(tx: UnifiedTransaction): Promise<CostEstimate>;

    /**
     * Validate a transaction before execution
     *
     * @param tx - Unified transaction to validate
     * @returns Validation result
     */
    validateTransaction(tx: UnifiedTransaction): Promise<{
        isValid: boolean;
        errors?: string[];
    }>;

    /**
     * Get current block number/height
     *
     * @returns Current block number
     */
    getCurrentBlock(): Promise<number>;

    /**
     * Get transaction by hash/ID
     *
     * @param txHash - Transaction hash/ID
     * @returns Transaction result or null if not found
     */
    getTransaction(txHash: string): Promise<TransactionResult | null>;

    /**
     * Convert chain-specific operations to unified operations
     *
     * @param operations - Chain-specific operations
     * @returns Unified operations
     */
    parseOperations(operations: unknown[]): UnifiedOperation[];

    /**
     * Get native currency symbol (e.g., "SOL", "ETH", "MATIC")
     *
     * @returns Native currency symbol
     */
    getNativeCurrency(): string;

    /**
     * Get chain-specific security patterns
     *
     * @returns Array of security pattern identifiers for this chain
     */
    getSecurityPatterns(): string[];
}

