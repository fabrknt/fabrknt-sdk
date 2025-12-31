/**
 * Dollar Cost Averaging (DCA) Pattern
 *
 * Automated strategy that buys or sells a fixed amount at regular intervals,
 * reducing the impact of volatility on the overall purchase.
 */

import type { Transaction } from '../../types';
import { Loom } from '../../loom';
import { Fabrknt } from '../../core/fabrknt';
import {
  ExecutionPattern,
  PatternConfig,
  PatternResult,
  TradingPair,
} from '../types';

/**
 * DCA configuration
 */
export interface DCAConfig extends PatternConfig {
  /** Trading pair */
  pair: TradingPair;
  /** Amount to invest per interval (in quote currency) */
  amountPerInterval: number;
  /** Total number of intervals */
  totalIntervals: number;
  /** Interval duration in milliseconds */
  intervalDuration: number;
  /** Buy or sell direction */
  direction: 'buy' | 'sell';
  /** Start immediately or schedule for later */
  startImmediately?: boolean;
  /** Price limit (optional, for limit DCA) */
  priceLimit?: number;
  /** Stop on price condition (optional) */
  stopCondition?: {
    type: 'price-above' | 'price-below';
    price: number;
  };
}

/**
 * DCA execution record
 */
interface DCAExecution {
  interval: number;
  timestamp: number;
  amount: number;
  price?: number;
  transaction: Transaction;
  executed: boolean;
}

/**
 * Dollar Cost Averaging Pattern
 *
 * Executes regular purchases/sales to average out price volatility.
 *
 * @example
 * ```typescript
 * // Buy 100 USDC worth of SOL every day for 30 days
 * const dcaPattern = new DCAStrategy({
 *   name: 'SOL DCA Buy',
 *   pair: {
 *     base: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
 *     quote: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
 *   },
 *   amountPerInterval: 100,
 *   totalIntervals: 30,
 *   intervalDuration: 24 * 60 * 60 * 1000, // 24 hours
 *   direction: 'buy',
 *   startImmediately: true,
 *   guard: new Guard({ mode: 'block', maxSlippage: 0.03 }),
 * });
 *
 * const result = await dcaPattern.execute();
 * ```
 */
export class DCAStrategy extends ExecutionPattern {
  protected config: DCAConfig;
  private executions: DCAExecution[] = [];
  private intervalTimer?: NodeJS.Timeout;

  constructor(config: DCAConfig) {
    super(config);
    this.config = {
      startImmediately: true,
      ...config,
    };
  }

  /**
   * Execute the DCA strategy
   */
  async execute(): Promise<PatternResult> {
    this.startTime = Date.now();

    try {
      // Validate configuration
      if (!this.validate()) {
        throw new Error('Invalid DCA configuration');
      }

      const transactions: Transaction[] = [];

      if (this.config.startImmediately) {
        // Execute first interval immediately
        const tx = await this.executeInterval(0);
        transactions.push(tx);

        if (!this.config.dryRun && this.config.guard) {
          await Fabrknt.execute(tx, { with: this.config.guard });
          this.markExecuted(0);
        }
      }

      // Schedule remaining intervals
      if (this.config.totalIntervals > 1) {
        await this.scheduleIntervals();
      }

      const metrics = this.createMetrics(transactions);

      return {
        success: true,
        transactions,
        metrics,
        metadata: {
          totalIntervals: this.config.totalIntervals,
          completedIntervals: this.executions.filter(e => e.executed).length,
          totalInvested:
            this.config.amountPerInterval * this.config.totalIntervals,
          averagePrice: this.calculateAveragePrice(),
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
   * Validate DCA configuration
   */
  protected validate(): boolean {
    const { amountPerInterval, totalIntervals, intervalDuration } = this.config;

    if (amountPerInterval <= 0) {
      console.error('Amount per interval must be positive');
      return false;
    }

    if (totalIntervals < 1) {
      console.error('Total intervals must be at least 1');
      return false;
    }

    if (intervalDuration < 1000) {
      console.error('Interval duration must be at least 1 second');
      return false;
    }

    return true;
  }

  /**
   * Execute a single DCA interval
   */
  private async executeInterval(interval: number): Promise<Transaction> {
    const { pair, direction, amountPerInterval } = this.config;

    // Create swap transaction
    const tx = await Loom.weave({
      type: 'SINGLE_SWAP',
      input: direction === 'buy' ? pair.quote.symbol : pair.base.symbol,
      output: direction === 'buy' ? pair.base.symbol : pair.quote.symbol,
      amount: amountPerInterval,
      parallelPriority: false,
    });

    // Record execution
    this.executions.push({
      interval,
      timestamp: Date.now(),
      amount: amountPerInterval,
      transaction: tx,
      executed: false,
    });

    // Return transaction (metadata stored in DCAExecution record instead)
    return tx;
  }

  /**
   * Schedule remaining intervals
   */
  private async scheduleIntervals(): Promise<void> {
    return new Promise((resolve) => {
      let intervalCount = this.config.startImmediately ? 1 : 0;

      this.intervalTimer = setInterval(async () => {
        try {
          const tx = await this.executeInterval(intervalCount);

          if (!this.config.dryRun && this.config.guard) {
            await Fabrknt.execute(tx, { with: this.config.guard });
            this.markExecuted(intervalCount);
          }

          intervalCount++;

          if (intervalCount >= this.config.totalIntervals) {
            this.stop();
            resolve();
          }
        } catch (error) {
          console.error(`DCA interval ${intervalCount} failed:`, error);
        }
      }, this.config.intervalDuration);
    });
  }

  /**
   * Mark an interval as executed
   */
  private markExecuted(interval: number): void {
    const execution = this.executions.find(e => e.interval === interval);
    if (execution) {
      execution.executed = true;
    }
  }

  /**
   * Calculate average execution price
   */
  private calculateAveragePrice(): number {
    const executedOrders = this.executions.filter(e => e.executed && e.price);

    if (executedOrders.length === 0) return 0;

    const totalPrice = executedOrders.reduce((sum, e) => sum + (e.price || 0), 0);
    return totalPrice / executedOrders.length;
  }

  /**
   * Get current DCA status
   */
  getStatus(): {
    completedIntervals: number;
    remainingIntervals: number;
    totalInvested: number;
    averagePrice: number;
    nextExecutionTime: number | null;
  } {
    const completed = this.executions.filter(e => e.executed).length;
    const remaining = this.config.totalIntervals - completed;

    const nextExecutionTime =
      remaining > 0
        ? this.startTime + this.config.intervalDuration * (completed + 1)
        : null;

    return {
      completedIntervals: completed,
      remainingIntervals: remaining,
      totalInvested: this.config.amountPerInterval * completed,
      averagePrice: this.calculateAveragePrice(),
      nextExecutionTime,
    };
  }

  /**
   * Stop DCA strategy
   */
  stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = undefined;
    }
  }

  /**
   * Pause DCA strategy
   */
  pause(): void {
    this.stop();
  }

  /**
   * Resume DCA strategy
   */
  async resume(): Promise<void> {
    const status = this.getStatus();

    if (status.remainingIntervals > 0) {
      await this.scheduleIntervals();
    }
  }

  /**
   * Update amount per interval
   */
  updateAmount(newAmount: number): void {
    if (newAmount > 0) {
      this.config.amountPerInterval = newAmount;
    }
  }
}
