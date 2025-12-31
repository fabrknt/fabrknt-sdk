/**
 * @fabrknt/sdk - The Precision Execution Stack for Solana
 *
 * Engineered for Parallelism. Built for Autonomy. Woven for Speed.
 *
 * A unified development stack designed to master Solana's Sealevel runtime,
 * providing high-performance tools and safety frameworks for AI Agents and
 * DeFi protocols to execute complex transactions with absolute precision.
 *
 * @packageDocumentation
 * @module @fabrknt/sdk
 */

/**
 * Main orchestration class for executing transactions with Guard validation
 * and privacy support.
 *
 * @example
 * ```typescript
 * import { Fabrknt, Guard } from "@fabrknt/sdk";
 *
 * const guard = new Guard({ maxSlippage: 0.1, mode: "block" });
 * await Fabrknt.execute(transaction, { with: guard });
 * ```
 */
export { Fabrknt } from "./core/fabrknt";

/**
 * Security layer for transaction validation and protection.
 *
 * Provides real-time monitoring and enforcement of security rules to prevent
 * unauthorized drains, excessive slippage, malicious CPI calls, and reentrancy attacks.
 *
 * @example
 * ```typescript
 * import { Guard } from "@fabrknt/sdk";
 *
 * const guard = new Guard({
 *   maxSlippage: 0.1,
 *   riskTolerance: "moderate",
 *   mode: "block"
 * });
 * const result = guard.validateTransaction(tx);
 * ```
 */
export { Guard, PatternId, Severity } from "./guard";

/**
 * High-velocity liquidity engine for optimized transaction routing.
 *
 * Structures state management and transaction bundling to eliminate lock contention
 * and maximize throughput across multiple DEXs.
 *
 * @example
 * ```typescript
 * import { Loom } from "@fabrknt/sdk";
 *
 * const tx = await Loom.weave({
 *   type: "MULTI_ROUTE_SWAP",
 *   input: "SOL",
 *   output: "USDC",
 *   amount: 100,
 *   parallelPriority: true
 * });
 * ```
 */
export { Loom } from "./loom";

/**
 * Performance and privacy layer for transaction optimization.
 *
 * Provides parallel execution optimization and ZK Compression support for
 * shielded, cost-efficient transaction execution.
 *
 * @example
 * ```typescript
 * import { FabricCore } from "@fabrknt/sdk";
 *
 * const optimized = FabricCore.optimize(tx, {
 *   enablePrivacy: true,
 *   compressionLevel: "high",
 *   privacyProvider: "arbor"
 * });
 *
 * const savings = FabricCore.estimateCompressionSavings(1000);
 * ```
 */
export { FabricCore } from "./fabric";

/**
 * AI-driven risk assessment gateway for RWA validation and asset integrity.
 *
 * Provides real-time risk scoring, compliance checks, and oracle integrity
 * monitoring with intelligent caching.
 *
 * Note: Class exported as "Pulsar" for backward compatibility but represents
 * the Risk component.
 *
 * @example
 * ```typescript
 * import { Pulsar } from "@fabrknt/sdk";
 *
 * const pulsar = new Pulsar({
 *   apiKey: "your-api-key",
 *   environment: "mainnet",
 *   cacheTTL: 60000
 * });
 *
 * const risk = await pulsar.assessRisk("asset-address");
 * ```
 */
export { Pulsar } from "./pulsar";

/**
 * Configuration and type definitions for the Fabrknt SDK.
 *
 * Includes interfaces for Guard, Risk (Pulsar), Privacy, Loom, transactions,
 * and validation results.
 */
export type {
    /** Configuration for the main Fabrknt orchestrator */
    FabrkntConfig,
    /** Configuration for the Guard security layer */
    GuardConfig,
    /** Configuration for the Loom liquidity engine */
    LoomConfig,
    /** Transaction structure with instructions and metadata */
    Transaction,
    /** Security warning detected by Guard pattern detection */
    SecurityWarning,
    /** Result of transaction validation by Guard */
    ValidationResult,
    /** Individual validation rule definition */
    ValidationRule,
    /** Individual transaction instruction */
    TransactionInstruction,
    /** Risk metrics from Pulsar risk assessment */
    RiskMetrics,
    /** Configuration for Pulsar (Risk) integration */
    PulsarConfig,
    /** Configuration for Privacy (Arbor) integration */
    PrivacyConfig,
} from "./types";

/**
 * Pattern Library - Pre-built execution templates for common use cases.
 *
 * Provides ready-to-use patterns for AI trading agents and DAO treasury management.
 *
 * ## AI Trading Agent Patterns:
 * - **GridTradingPattern**: Automated grid trading strategy
 * - **DCAStrategy**: Dollar cost averaging automation
 * - **ArbitragePattern**: Multi-DEX arbitrage execution
 *
 * ## DAO Treasury Patterns:
 * - **TreasuryRebalancing**: Maintain target asset allocations
 * - **YieldFarmingPattern**: Optimize yields across protocols
 *
 * ## DeFi Protocol Patterns:
 * - **SwapPattern**: Multi-route swap optimization
 * - **LiquidityPattern**: Automated liquidity provision
 *
 * @example
 * ```typescript
 * import { GridTradingPattern, Guard } from "@fabrknt/sdk";
 *
 * const pattern = new GridTradingPattern({
 *   name: 'SOL-USDC Grid',
 *   pair: { base: solToken, quote: usdcToken },
 *   lowerBound: 90,
 *   upperBound: 110,
 *   gridLevels: 10,
 *   amountPerGrid: 1,
 *   currentPrice: { token: 'SOL', price: 100, quoteCurrency: 'USDC', timestamp: Date.now() },
 *   guard: new Guard({ mode: 'block', maxSlippage: 0.02 }),
 * });
 *
 * const result = await pattern.execute();
 * ```
 */
export {
    // Base pattern classes
    ExecutionPattern,
    PatternRegistry,
    // AI Agent Patterns
    GridTradingPattern,
    DCAStrategy,
    ArbitragePattern,
    // DAO Treasury Patterns
    TreasuryRebalancing,
    YieldFarmingPattern,
    // DeFi Protocol Patterns
    SwapPattern,
    LiquidityPattern,
    // Financial Operations Patterns
    BatchPayoutPattern,
    RecurringPaymentPattern,
    TokenVestingPattern,
} from "./patterns";

export type {
    // Base pattern types
    PatternConfig,
    PatternResult,
    PatternMetrics,
    Token,
    Price,
    TradingPair,
    ExecutionStrategy,
    // AI Agent Pattern types
    GridTradingConfig,
    DCAConfig,
    ArbitrageConfig,
    ArbitrageOpportunity,
    DEX,
    // DAO Treasury Pattern types
    RebalancingConfig,
    AssetAllocation,
    YieldFarmingConfig,
    YieldProtocol,
    // DeFi Protocol Pattern types
    SwapConfig,
    SwapRoute,
    LiquidityConfig,
    LiquidityPool,
    LiquidityPosition,
    // Financial Operations Pattern types
    BatchPayoutConfig,
    PayoutRecipient,
    PayoutReportEntry,
    RecurringPaymentConfig,
    RecurringPayment,
    PaymentSchedule,
    PaymentExecution,
    TokenVestingConfig,
    VestingGrant,
    VestingSchedule,
    VestingClaim,
} from "./patterns";

/**
 * Chain Abstraction Layer - Multi-chain support infrastructure.
 *
 * Provides unified interfaces for working across Solana and EVM chains.
 * Portable components (Guard, Risk, Flow, Patterns) use chain adapters
 * to work across different blockchains.
 *
 * @example
 * ```typescript
 * import { createChainAdapter, SolanaAdapter } from "@fabrknt/sdk";
 *
 * // Create Solana adapter
 * const solanaAdapter = createChainAdapter({
 *   chain: 'solana',
 *   network: 'mainnet-beta',
 *   rpcUrl: 'https://api.mainnet-beta.solana.com'
 * });
 *
 * // Use adapter with Guard for cross-chain validation
 * const guard = new Guard({
 *   chainAdapter: solanaAdapter,
 *   maxSlippage: 0.1
 * });
 * ```
 */
export {
    createChainAdapter,
    SolanaAdapter,
    EVMAdapter,
} from "./chain";

export type {
    ChainId,
    UnifiedTransaction,
    ChainAdapter,
    ChainAdapterConfig,
    TransactionResult,
    CostEstimate,
} from "./chain";

/**
 * DEX Integration - Real-time price feeds and swap routing.
 *
 * Provides integration with Solana DEX aggregators (Jupiter) for
 * real-time price data, optimal swap routing, and multi-DEX arbitrage.
 *
 * @example
 * ```typescript
 * import { JupiterAdapter, PriceFeedService, COMMON_TOKENS } from "@fabrknt/sdk";
 *
 * // Create Jupiter adapter
 * const jupiter = new JupiterAdapter();
 *
 * // Get quote for SOL->USDC swap
 * const quote = await jupiter.getQuote(
 *   COMMON_TOKENS.SOL,
 *   COMMON_TOKENS.USDC,
 *   100 // amount
 * );
 *
 * // Create price feed service
 * const priceFeed = new PriceFeedService();
 * const solPrice = await priceFeed.getPrice(COMMON_TOKENS.SOL);
 * ```
 */
export { JupiterAdapter, PriceFeedService, COMMON_TOKENS } from "./dex";

export type {
    TokenMint,
    PriceQuote,
    MarketInfo,
    SwapRoute as DEXSwapRoute,
    TokenPrice,
    DEXAdapter,
    PriceFeed,
    DEXConfig,
} from "./dex";
