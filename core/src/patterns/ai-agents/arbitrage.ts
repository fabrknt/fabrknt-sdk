/**
 * Arbitrage Pattern
 *
 * Automated arbitrage strategy that detects and executes profitable
 * price differences across multiple DEXs.
 */

import type { Transaction } from '../../types';
import { Loom } from '../../loom';
import { Fabrknt } from '../../core/fabrknt';
import { FabricCore } from '../../fabric';
import {
  ExecutionPattern,
  PatternConfig,
  PatternResult,
  TradingPair,
} from '../types';
import type { DEXAdapter } from '../../dex/types';
import { JupiterAdapter } from '../../dex/jupiter';

/**
 * DEX information
 */
export interface DEX {
  /** DEX name */
  name: string;
  /** DEX program ID */
  programId: string;
  /** Fee tier */
  feeTier: number; // e.g., 0.003 for 0.3%
}

/**
 * Arbitrage opportunity
 */
export interface ArbitrageOpportunity {
  /** Buy from this DEX */
  buyDex: DEX;
  /** Sell to this DEX */
  sellDex: DEX;
  /** Trading pair */
  pair: TradingPair;
  /** Buy price */
  buyPrice: number;
  /** Sell price */
  sellPrice: number;
  /** Profit percentage (after fees) */
  profitPercent: number;
  /** Profit amount in quote currency */
  profitAmount: number;
  /** Timestamp when opportunity was detected */
  timestamp: number;
}

/**
 * Arbitrage configuration
 */
export interface ArbitrageConfig extends PatternConfig {
  /** Trading pairs to monitor */
  pairs: TradingPair[];
  /** DEXs to scan */
  dexs: DEX[];
  /** Minimum profit percentage to execute */
  minProfitPercent: number;
  /** Amount to trade per arbitrage */
  tradeAmount: number;
  /** Maximum slippage tolerance */
  maxSlippage: number;
  /** Scan interval in milliseconds */
  scanInterval?: number;
  /** Execute opportunities automatically */
  autoExecute?: boolean;
  /** Enable real DEX integration via Jupiter (default: false for testing) */
  enableRealDEX?: boolean;
  /** Custom DEX adapter (overrides default Jupiter) */
  dexAdapter?: DEXAdapter;
}

/**
 * Arbitrage Pattern
 *
 * Scans multiple DEXs for price discrepancies and executes profitable trades.
 *
 * @example
 * ```typescript
 * const arbitragePattern = new ArbitragePattern({
 *   name: 'Multi-DEX Arbitrage',
 *   pairs: [{
 *     base: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
 *     quote: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
 *   }],
 *   dexs: [
 *     { name: 'Raydium', programId: 'Rayd...', feeTier: 0.0025 },
 *     { name: 'Orca', programId: 'Orca...', feeTier: 0.003 },
 *   ],
 *   minProfitPercent: 0.5,
 *   tradeAmount: 1000,
 *   maxSlippage: 0.01,
 *   autoExecute: false,
 *   guard: new Guard({ mode: 'block', maxSlippage: 0.01 }),
 * });
 *
 * const result = await arbitragePattern.execute();
 * ```
 */
export class ArbitragePattern extends ExecutionPattern {
  protected config: ArbitrageConfig;
  private opportunities: ArbitrageOpportunity[] = [];
  private executedOpportunities: ArbitrageOpportunity[] = [];
  private scanTimer?: NodeJS.Timeout;
  private dexAdapter?: DEXAdapter;

  constructor(config: ArbitrageConfig) {
    super(config);
    this.config = {
      scanInterval: 5000, // 5 seconds default
      autoExecute: false,
      enableRealDEX: false,
      ...config,
    };

    // Initialize DEX adapter if real DEX integration is enabled
    if (this.config.enableRealDEX) {
      this.dexAdapter = this.config.dexAdapter || new JupiterAdapter();
    }
  }

  /**
   * Execute the arbitrage pattern
   */
  async execute(): Promise<PatternResult> {
    this.startTime = Date.now();

    try {
      // Validate configuration
      if (!this.validate()) {
        throw new Error('Invalid arbitrage configuration');
      }

      const transactions: Transaction[] = [];

      // Scan for opportunities
      await this.scanForOpportunities();

      // Execute profitable opportunities
      for (const opportunity of this.opportunities) {
        if (this.shouldExecute(opportunity)) {
          const txs = await this.executeArbitrage(opportunity);
          transactions.push(...txs);

          if (!this.config.dryRun) {
            this.executedOpportunities.push(opportunity);
          }
        }
      }

      const metrics = this.createMetrics(transactions);

      return {
        success: true,
        transactions,
        metrics,
        metadata: {
          opportunitiesFound: this.opportunities.length,
          opportunitiesExecuted: this.executedOpportunities.length,
          totalProfit: this.calculateTotalProfit(),
          averageProfitPercent: this.calculateAverageProfitPercent(),
        },
      };
    } catch (error) {
      return {
        success: false,
        transactions: [],
        metrics: this.createMetrics([]),
        error: error as Error,
      };
    }
  }

  /**
   * Validate arbitrage configuration
   */
  protected validate(): boolean {
    const { pairs, dexs, minProfitPercent, tradeAmount } = this.config;

    if (pairs.length === 0) {
      console.error('At least one trading pair is required');
      return false;
    }

    if (dexs.length < 2) {
      console.error('At least two DEXs are required for arbitrage');
      return false;
    }

    if (minProfitPercent <= 0) {
      console.error('Minimum profit percent must be positive');
      return false;
    }

    if (tradeAmount <= 0) {
      console.error('Trade amount must be positive');
      return false;
    }

    return true;
  }

  /**
   * Scan for arbitrage opportunities
   */
  private async scanForOpportunities(): Promise<void> {
    this.opportunities = [];

    for (const pair of this.config.pairs) {
      // Get prices from all DEXs
      const prices = await this.getPricesFromDEXs(pair);

      // Find arbitrage opportunities
      for (let i = 0; i < prices.length; i++) {
        for (let j = i + 1; j < prices.length; j++) {
          const opportunity = this.calculateOpportunity(
            pair,
            prices[i],
            prices[j]
          );

          if (opportunity && opportunity.profitPercent >= this.config.minProfitPercent) {
            this.opportunities.push(opportunity);
          }
        }
      }
    }
  }

  /**
   * Get prices from all configured DEXs
   */
  private async getPricesFromDEXs(
    pair: TradingPair
  ): Promise<Array<{ dex: DEX; price: number }>> {
    // If real DEX integration is enabled, fetch actual prices
    if (this.config.enableRealDEX && this.dexAdapter) {
      const prices: Array<{ dex: DEX; price: number }> = [];

      for (const dex of this.config.dexs) {
        try {
          // Get price from DEX adapter
          const priceData = await this.dexAdapter.getPrice(
            pair.base.mint,
            pair.quote.mint
          );

          prices.push({
            dex,
            price: priceData.price,
          });
        } catch (error) {
          console.warn(`Failed to get price from ${dex.name}:`, error);
          // Continue with other DEXs
        }
      }

      return prices;
    }

    // Fallback: Return simulated prices for testing
    return this.config.dexs.map((dex) => ({
      dex,
      price: 100 + Math.random() * 5, // Simulated price variation
    }));
  }

  /**
   * Calculate arbitrage opportunity between two prices
   */
  private calculateOpportunity(
    pair: TradingPair,
    priceA: { dex: DEX; price: number },
    priceB: { dex: DEX; price: number }
  ): ArbitrageOpportunity | null {
    const { tradeAmount } = this.config;

    // Determine buy and sell DEXs
    let buyDex: DEX, sellDex: DEX, buyPrice: number, sellPrice: number;

    if (priceA.price < priceB.price) {
      buyDex = priceA.dex;
      sellDex = priceB.dex;
      buyPrice = priceA.price;
      sellPrice = priceB.price;
    } else {
      buyDex = priceB.dex;
      sellDex = priceA.dex;
      buyPrice = priceB.price;
      sellPrice = priceA.price;
    }

    // Calculate profit after fees
    const buyCost = tradeAmount * (1 + buyDex.feeTier);
    const sellRevenue = tradeAmount * (1 - sellDex.feeTier);
    const profitAmount = sellRevenue - buyCost;
    const profitPercent = (profitAmount / buyCost) * 100;

    // Only return if profitable
    if (profitPercent <= 0) {
      return null;
    }

    return {
      buyDex,
      sellDex,
      pair,
      buyPrice,
      sellPrice,
      profitPercent,
      profitAmount,
      timestamp: Date.now(),
    };
  }

  /**
   * Determine if opportunity should be executed
   */
  private shouldExecute(opportunity: ArbitrageOpportunity): boolean {
    // Check if opportunity is still fresh (< 5 seconds old)
    const age = Date.now() - opportunity.timestamp;
    if (age > 5000) {
      return false;
    }

    // Check if profit meets minimum threshold
    if (opportunity.profitPercent < this.config.minProfitPercent) {
      return false;
    }

    return true;
  }

  /**
   * Execute arbitrage opportunity
   */
  private async executeArbitrage(
    opportunity: ArbitrageOpportunity
  ): Promise<Transaction[]> {
    const { pair } = opportunity;
    const transactions: Transaction[] = [];

    // Create buy transaction
    const buyTx = await Loom.weave({
      type: 'SINGLE_SWAP',
      input: pair.quote.symbol,
      output: pair.base.symbol,
      amount: this.config.tradeAmount,
      parallelPriority: true,
    });

    // Create sell transaction
    const sellTx = await Loom.weave({
      type: 'SINGLE_SWAP',
      input: pair.base.symbol,
      output: pair.quote.symbol,
      amount: this.config.tradeAmount,
      parallelPriority: true,
    });

    // Optimize transactions for parallel execution
    const optimizedBuy = FabricCore.optimize(buyTx);
    const optimizedSell = FabricCore.optimize(sellTx);

    // Add transactions (metadata stored in pattern result instead)
    transactions.push(optimizedBuy, optimizedSell);

    // Execute transactions if not in dry-run mode
    if (!this.config.dryRun && this.config.guard) {
      for (const tx of transactions) {
        await Fabrknt.execute(tx, { with: this.config.guard });
      }
    }

    return transactions;
  }

  /**
   * Calculate total profit from executed opportunities
   */
  private calculateTotalProfit(): number {
    return this.executedOpportunities.reduce(
      (sum, opp) => sum + opp.profitAmount,
      0
    );
  }

  /**
   * Calculate average profit percentage
   */
  private calculateAverageProfitPercent(): number {
    if (this.executedOpportunities.length === 0) return 0;

    const totalPercent = this.executedOpportunities.reduce(
      (sum, opp) => sum + opp.profitPercent,
      0
    );

    return totalPercent / this.executedOpportunities.length;
  }

  /**
   * Start continuous scanning for opportunities
   */
  startScanning(): void {
    if (this.scanTimer) {
      return; // Already scanning
    }

    this.scanTimer = setInterval(async () => {
      await this.scanForOpportunities();

      if (this.config.autoExecute) {
        for (const opportunity of this.opportunities) {
          if (this.shouldExecute(opportunity)) {
            await this.executeArbitrage(opportunity);
            this.executedOpportunities.push(opportunity);
          }
        }
      }
    }, this.config.scanInterval);
  }

  /**
   * Stop scanning
   */
  stopScanning(): void {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = undefined;
    }
  }

  /**
   * Get current opportunities
   */
  getOpportunities(): ArbitrageOpportunity[] {
    return [...this.opportunities];
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): ArbitrageOpportunity[] {
    return [...this.executedOpportunities];
  }
}
