/**
 * Fabrknt Pattern Library
 *
 * Pre-built execution patterns for common DeFi and AI agent use cases.
 *
 * ## Pattern Categories
 *
 * ### AI Trading Agents
 * - **Grid Trading**: Profit from market volatility with automated grid orders
 * - **DCA (Dollar Cost Averaging)**: Reduce volatility impact with regular purchases
 * - **Arbitrage**: Capture price differences across multiple DEXs
 *
 * ### DAO Treasury Management
 * - **Treasury Rebalancing**: Maintain target asset allocations automatically
 * - **Yield Farming**: Optimize yields across multiple protocols
 *
 * ### DeFi Protocols
 * - **Swap**: Multi-route swap optimization with price impact minimization
 * - **Liquidity**: Automated liquidity provision and position management
 *
 * @example
 * ```typescript
 * import { GridTradingPattern, Guard } from '@fabrknt/sdk';
 *
 * const pattern = new GridTradingPattern({
 *   name: 'SOL-USDC Grid',
 *   pair: {
 *     base: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
 *     quote: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
 *   },
 *   lowerBound: 90,
 *   upperBound: 110,
 *   gridLevels: 10,
 *   amountPerGrid: 1,
 *   currentPrice: { token: 'SOL', price: 100, quoteCurrency: 'USDC', timestamp: Date.now() },
 *   guard: new Guard({ mode: 'block', maxSlippage: 0.02 }),
 * });
 *
 * const result = await pattern.execute();
 * console.log(`Executed ${result.transactions.length} transactions`);
 * ```
 *
 * @packageDocumentation
 * @module patterns
 */

// Base types and utilities
export {
  ExecutionPattern,
  PatternRegistry,
} from './types';

export type {
  PatternConfig,
  PatternResult,
  PatternMetrics,
  Token,
  Price,
  TradingPair,
  ExecutionStrategy,
} from './types';

// AI Trading Agent Patterns
export {
  GridTradingPattern,
  DCAStrategy,
  ArbitragePattern,
} from './ai-agents';

export type {
  GridTradingConfig,
  DCAConfig,
  ArbitrageConfig,
  ArbitrageOpportunity,
  DEX,
} from './ai-agents';

// DAO Treasury Management Patterns
export {
  TreasuryRebalancing,
  YieldFarmingPattern,
} from './dao-treasury';

export type {
  RebalancingConfig,
  AssetAllocation,
  YieldFarmingConfig,
  YieldProtocol,
} from './dao-treasury';

// DeFi Protocol Patterns
export {
  SwapPattern,
  LiquidityPattern,
} from './defi';

export type {
  SwapConfig,
  SwapRoute,
  LiquidityConfig,
  LiquidityPool,
  LiquidityPosition,
} from './defi';

// Financial Operations Patterns
export {
  BatchPayoutPattern,
  RecurringPaymentPattern,
  TokenVestingPattern,
} from './financial';

export type {
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
} from './financial';
