/**
 * Chain Abstraction Layer Types
 *
 * Provides unified interfaces for multi-chain support while maintaining
 * Solana-first positioning. Portable components (Guard, Risk, Flow, Patterns)
 * work across chains via chain adapters.
 */

/**
 * Supported blockchain networks
 */
export type ChainId = "solana" | "ethereum" | "polygon" | "arbitrum" | "optimism" | "base";

/**
 * Chain-specific network identifiers
 */
export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet";
export type EVMNetwork = "mainnet" | "sepolia" | "goerli" | "polygon-mainnet" | "arbitrum-one" | "optimism-mainnet" | "base-mainnet";

/**
 * Unified transaction interface that works across chains
 */
export interface UnifiedTransaction {
    /** Unique transaction identifier */
    id: string;
    /** Transaction status */
    status: "pending" | "executed" | "failed" | "reverted";
    /** Chain this transaction targets */
    chain: ChainId;
    /** Chain-specific transaction data (opaque to portable components) */
    chainData: ChainTransactionData;
    /** Asset addresses involved in transaction (for risk assessment) */
    assetAddresses?: string[];
    /** Instructions/operations (chain-agnostic representation) */
    operations: UnifiedOperation[];
    /** Transaction metadata */
    metadata?: TransactionMetadata;
    /** Privacy metadata (for ZK compression) */
    privacyMetadata?: PrivacyMetadata;
}

/**
 * Chain-specific transaction data (opaque type)
 * Each chain adapter will handle its own format
 */
export type ChainTransactionData =
    | { type: "solana"; data: SolanaTransactionData }
    | { type: "evm"; data: EVMTransactionData };

/**
 * Solana-specific transaction data
 */
export interface SolanaTransactionData {
    /** Solana instructions */
    instructions: unknown[];
    /** Recent blockhash */
    recentBlockhash?: string;
    /** Fee payer */
    feePayer?: string;
    /** Signers */
    signers?: unknown[];
}

/**
 * EVM-specific transaction data
 */
export interface EVMTransactionData {
    /** Transaction data (hex) */
    data: string;
    /** To address */
    to?: string;
    /** Value (wei) */
    value?: string;
    /** Gas limit */
    gasLimit?: string;
    /** Gas price */
    gasPrice?: string;
    /** Max fee per gas (EIP-1559) */
    maxFeePerGas?: string;
    /** Max priority fee per gas (EIP-1559) */
    maxPriorityFeePerGas?: string;
    /** Nonce */
    nonce?: number;
    /** Chain ID */
    chainId: number;
}

/**
 * Unified operation representation (chain-agnostic)
 */
export interface UnifiedOperation {
    /** Operation type */
    type: OperationType;
    /** Operation parameters */
    params: Record<string, unknown>;
    /** Chain-specific operation data */
    chainData?: unknown;
}

/**
 * Operation types that work across chains
 */
export type OperationType =
    | "transfer"
    | "swap"
    | "liquidity_add"
    | "liquidity_remove"
    | "stake"
    | "unstake"
    | "approve"
    | "custom";

/**
 * Transaction metadata
 */
export interface TransactionMetadata {
    /** Estimated cost in native currency */
    estimatedCost?: bigint;
    /** Actual cost in native currency (after execution) */
    actualCost?: bigint;
    /** Estimated execution time (ms) */
    estimatedTime?: number;
    /** Slippage tolerance */
    slippageTolerance?: number;
    /** Timestamp */
    timestamp?: number;
    /** Custom metadata */
    custom?: Record<string, unknown>;
}

/**
 * Privacy metadata for ZK compression
 */
export interface PrivacyMetadata {
    /** Whether privacy is required */
    requiresPrivacy: boolean;
    /** Whether compression is enabled */
    compressionEnabled: boolean;
    /** Privacy provider */
    provider?: "arbor" | "light" | "zksync" | "aztec";
}

/**
 * Transaction execution result
 */
export interface TransactionResult {
    /** Transaction ID */
    transactionId: string;
    /** Execution status */
    status: "success" | "failed" | "reverted";
    /** Block number/height */
    blockNumber?: number;
    /** Block hash */
    blockHash?: string;
    /** Gas used (EVM) or compute units (Solana) */
    gasUsed?: bigint;
    /** Transaction hash */
    hash: string;
    /** Error message if failed */
    error?: string;
    /** Receipt/logs */
    receipt?: unknown;
}

/**
 * Cost estimation result
 */
export interface CostEstimate {
    /** Estimated cost in native currency (wei for EVM, lamports for Solana) */
    estimatedCost: bigint;
    /** Gas limit (EVM) or compute units (Solana) */
    gasLimit?: bigint;
    /** Gas price (EVM) or fee (Solana) */
    gasPrice?: bigint;
    /** Breakdown by operation */
    breakdown?: Array<{
        operation: string;
        cost: bigint;
    }>;
}

