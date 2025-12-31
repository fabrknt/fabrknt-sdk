/**
 * Grid Trading Pattern
 *
 * Automated grid trading strategy that places buy and sell orders
 * at predefined price levels to profit from market volatility.
 */

import type { Transaction } from '../../types';
import { Loom } from '../../loom';
import { Fabrknt } from '../../core/fabrknt';
import {
  ExecutionPattern,
  PatternConfig,
  PatternResult,
  TradingPair,
  Price,
} from '../types';

/**
 * Grid trading configuration
 */
export interface GridTradingConfig extends PatternConfig {
  /** Trading pair */
  pair: TradingPair;
  /** Grid lower price boundary */
  lowerBound: number;
  /** Grid upper price boundary */
  upperBound: number;
  /** Number of grid levels */
  gridLevels: number;
  /** Amount to trade per grid level */
  amountPerGrid: number;
  /** Current market price */
  currentPrice: Price;
  /** Stop loss percentage (optional) */
  stopLoss?: number;
  /** Take profit percentage (optional) */
  takeProfit?: number;
}

/**
 * Grid level information
 */
interface GridLevel {
  price: number;
  type: 'buy' | 'sell';
  amount: number;
  executed: boolean;
}

/**
 * Grid Trading Pattern
 *
 * Creates a grid of buy and sell orders around current price to
 * profit from market oscillations.
 *
 * @example
 * ```typescript
 * const gridPattern = new GridTradingPattern({
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
 * const result = await gridPattern.execute();
 * ```
 */
export class GridTradingPattern extends ExecutionPattern {
  protected config: GridTradingConfig;
  private gridLevels: GridLevel[] = [];

  constructor(config: GridTradingConfig) {
    super(config);
    this.config = config;
    this.calculateGridLevels();
  }

  /**
   * Execute the grid trading pattern
   */
  async execute(): Promise<PatternResult> {
    this.startTime = Date.now();

    try {
      // Validate configuration
      if (!this.validate()) {
        throw new Error('Invalid grid trading configuration');
      }

      const transactions: Transaction[] = [];

      // Create transactions for each grid level
      for (const level of this.gridLevels) {
        if (level.executed) continue;

        const tx = await this.createGridOrder(level);
        transactions.push(tx);

        // Execute if not in dry-run mode
        if (!this.config.dryRun && this.config.guard) {
          await Fabrknt.execute(tx, { with: this.config.guard });
          level.executed = true;
        }
      }

      const metrics = this.createMetrics(transactions);

      return {
        success: true,
        transactions,
        metrics,
        metadata: {
          gridLevels: this.gridLevels.length,
          executedLevels: this.gridLevels.filter(l => l.executed).length,
          priceRange: {
            lower: this.config.lowerBound,
            upper: this.config.upperBound,
          },
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
   * Validate grid configuration
   */
  protected validate(): boolean {
    const { lowerBound, upperBound, gridLevels, currentPrice } = this.config;

    // Price bounds validation
    if (lowerBound >= upperBound) {
      console.error('Lower bound must be less than upper bound');
      return false;
    }

    // Grid levels validation
    if (gridLevels < 2) {
      console.error('Grid levels must be at least 2');
      return false;
    }

    // Current price validation
    if (currentPrice.price < lowerBound || currentPrice.price > upperBound) {
      console.warn('Current price is outside grid bounds');
    }

    return true;
  }

  /**
   * Calculate grid levels based on configuration
   */
  private calculateGridLevels(): void {
    const { lowerBound, upperBound, gridLevels, amountPerGrid, currentPrice } =
      this.config;

    const priceStep = (upperBound - lowerBound) / (gridLevels - 1);

    this.gridLevels = [];

    for (let i = 0; i < gridLevels; i++) {
      const price = lowerBound + priceStep * i;

      // Determine if this is a buy or sell level based on current price
      const type = price < currentPrice.price ? 'buy' : 'sell';

      this.gridLevels.push({
        price,
        type,
        amount: amountPerGrid,
        executed: false,
      });
    }
  }

  /**
   * Create a transaction for a grid order
   */
  private async createGridOrder(level: GridLevel): Promise<Transaction> {
    const { pair } = this.config;

    // Use Loom to create the swap transaction
    const tx = await Loom.weave({
      type: 'SINGLE_SWAP',
      input: level.type === 'buy' ? pair.quote.symbol : pair.base.symbol,
      output: level.type === 'buy' ? pair.base.symbol : pair.quote.symbol,
      amount: level.amount,
      parallelPriority: true,
    });

    // Return transaction (metadata stored in GridLevel record instead)
    return tx;
  }

  /**
   * Update grid based on current price
   * (useful for rebalancing or adjusting strategy)
   */
  updatePrice(newPrice: Price): void {
    this.config.currentPrice = newPrice;

    // Recalculate which orders should be buy vs sell
    for (const level of this.gridLevels) {
      if (!level.executed) {
        level.type = level.price < newPrice.price ? 'buy' : 'sell';
      }
    }
  }

  /**
   * Get current grid status
   */
  getStatus(): {
    totalLevels: number;
    executedLevels: number;
    pendingLevels: number;
    averageFillPrice: number;
  } {
    const executed = this.gridLevels.filter(l => l.executed);
    const averageFillPrice =
      executed.length > 0
        ? executed.reduce((sum, l) => sum + l.price, 0) / executed.length
        : 0;

    return {
      totalLevels: this.gridLevels.length,
      executedLevels: executed.length,
      pendingLevels: this.gridLevels.length - executed.length,
      averageFillPrice,
    };
  }

  /**
   * Cancel all pending orders
   */
  async cancelAll(): Promise<void> {
    // Mark all non-executed levels as cancelled
    for (const level of this.gridLevels) {
      if (!level.executed) {
        level.executed = true; // Prevent future execution
      }
    }
  }
}
