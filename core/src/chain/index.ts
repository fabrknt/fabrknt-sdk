/**
 * Chain Abstraction Layer
 *
 * Provides unified interfaces for multi-chain support while maintaining
 * Solana-first positioning. Portable components (Guard, Risk, Flow, Patterns)
 * work across chains via chain adapters.
 *
 * @packageDocumentation
 * @module chain
 */

export type {
    ChainId,
    SolanaNetwork,
    EVMNetwork,
    UnifiedTransaction,
    ChainTransactionData,
    SolanaTransactionData,
    EVMTransactionData,
    UnifiedOperation,
    OperationType,
    TransactionMetadata,
    PrivacyMetadata,
    TransactionResult,
    CostEstimate,
} from "./types";

export type {
    ChainAdapter,
    ChainAdapterConfig,
} from "./adapter";

export { SolanaAdapter } from "./solana-adapter";
export { EVMAdapter } from "./evm-adapter";

import type { ChainId } from "./types";
import type { ChainAdapter, ChainAdapterConfig } from "./adapter";

/**
 * Chain adapter factory
 *
 * Creates the appropriate chain adapter based on chain ID.
 *
 * @example
 * ```typescript
 * import { createChainAdapter } from '@fabrknt/sdk/chain';
 *
 * const solanaAdapter = createChainAdapter({
 *   chain: 'solana',
 *   network: 'mainnet-beta',
 *   rpcUrl: 'https://api.mainnet-beta.solana.com'
 * });
 *
 * const evmAdapter = createChainAdapter({
 *   chain: 'ethereum',
 *   network: 'mainnet',
 *   rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY'
 * });
 * ```
 */
export function createChainAdapter(config: ChainAdapterConfig): ChainAdapter {
    const { SolanaAdapter } = require("./solana-adapter");
    const { EVMAdapter } = require("./evm-adapter");

    if (config.chain === "solana") {
        return new SolanaAdapter(config);
    }

    const evmChains: ChainId[] = ["ethereum", "polygon", "arbitrum", "optimism", "base"];
    if (evmChains.includes(config.chain)) {
        return new EVMAdapter(config);
    }

    throw new Error(`Unsupported chain: ${config.chain}`);
}

