/**
 * Treasury Rebalancing Pattern
 *
 * Automated portfolio rebalancing for DAO treasuries to maintain
 * target asset allocations.
 */

import type { Transaction } from '../../types';
import { Loom } from '../../loom';
import { Fabrknt } from '../../core/fabrknt';
import {
  ExecutionPattern,
  PatternConfig,
  PatternResult,
  Token,
} from '../types';

/**
 * Asset allocation target
 */
export interface AssetAllocation {
  /** Token to hold */
  token: Token;
  /** Target percentage (0-100) */
  targetPercent: number;
  /** Current value in USD */
  currentValue: number;
  /** Target value in USD */
  targetValue?: number;
}

/**
 * Rebalancing configuration
 */
export interface RebalancingConfig extends PatternConfig {
  /** Total treasury value in USD */
  totalValue: number;
  /** Target allocations */
  allocations: AssetAllocation[];
  /** Rebalancing threshold (% deviation to trigger rebalance) */
  threshold: number;
  /** Minimum trade size in USD */
  minTradeSize?: number;
  /** Maximum slippage per trade */
  maxSlippage: number;
  /** Base currency for swaps */
  baseCurrency: Token;
}

/**
 * Rebalancing action
 */
interface RebalanceAction {
  from: Token;
  to: Token;
  amount: number;
  reason: string;
}

/**
 * Treasury Rebalancing Pattern
 *
 * Maintains target asset allocation by automatically rebalancing when
 * deviations exceed threshold.
 *
 * @example
 * ```typescript
 * const rebalancingPattern = new TreasuryRebalancing({
 *   name: 'DAO Treasury Rebalance',
 *   totalValue: 1000000, // $1M
 *   allocations: [
 *     {
 *       token: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
 *       targetPercent: 40,
 *       currentValue: 350000,
 *     },
 *     {
 *       token: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
 *       targetPercent: 40,
 *       currentValue: 450000,
 *     },
 *     {
 *       token: { mint: 'mSo...', symbol: 'mSOL', decimals: 9 },
 *       targetPercent: 20,
 *       currentValue: 200000,
 *     },
 *   ],
 *   threshold: 5, // Rebalance if any asset deviates >5%
 *   maxSlippage: 0.02,
 *   baseCurrency: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
 *   guard: new Guard({ mode: 'block', maxSlippage: 0.02 }),
 * });
 *
 * const result = await rebalancingPattern.execute();
 * ```
 */
export class TreasuryRebalancing extends ExecutionPattern {
  protected config: RebalancingConfig;
  private actions: RebalanceAction[] = [];

  constructor(config: RebalancingConfig) {
    super(config);
    this.config = {
      minTradeSize: 100, // $100 minimum
      ...config,
    };
    this.calculateTargetValues();
  }

  /**
   * Execute treasury rebalancing
   */
  async execute(): Promise<PatternResult> {
    this.startTime = Date.now();

    try {
      // Validate configuration
      if (!this.validate()) {
        throw new Error('Invalid rebalancing configuration');
      }

      // Calculate rebalancing actions
      this.calculateRebalancingActions();

      const transactions: Transaction[] = [];

      // Execute rebalancing trades
      for (const action of this.actions) {
        const tx = await this.executeRebalanceAction(action);
        transactions.push(tx);

        if (!this.config.dryRun && this.config.guard) {
          await Fabrknt.execute(tx, { with: this.config.guard });
        }
      }

      const metrics = this.createMetrics(transactions);

      return {
        success: true,
        transactions,
        metrics,
        metadata: {
          actionsExecuted: this.actions.length,
          allocations: this.config.allocations.map(a => ({
            token: a.token.symbol,
            target: a.targetPercent,
            current: this.calculateCurrentPercent(a),
            deviation: this.calculateDeviation(a),
          })),
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
   * Validate rebalancing configuration
   */
  protected validate(): boolean {
    const { allocations, threshold } = this.config;

    // Check that allocations sum to 100%
    const totalPercent = allocations.reduce(
      (sum, a) => sum + a.targetPercent,
      0
    );

    if (Math.abs(totalPercent - 100) > 0.01) {
      console.error(`Allocations must sum to 100% (got ${totalPercent}%)`);
      return false;
    }

    // Check threshold is valid
    if (threshold <= 0 || threshold > 50) {
      console.error('Threshold must be between 0 and 50');
      return false;
    }

    return true;
  }

  /**
   * Calculate target values for each allocation
   */
  private calculateTargetValues(): void {
    for (const allocation of this.config.allocations) {
      allocation.targetValue =
        (this.config.totalValue * allocation.targetPercent) / 100;
    }
  }

  /**
   * Calculate current percentage for an allocation
   */
  private calculateCurrentPercent(allocation: AssetAllocation): number {
    return (allocation.currentValue / this.config.totalValue) * 100;
  }

  /**
   * Calculate deviation from target
   */
  private calculateDeviation(allocation: AssetAllocation): number {
    const currentPercent = this.calculateCurrentPercent(allocation);
    return Math.abs(currentPercent - allocation.targetPercent);
  }

  /**
   * Check if rebalancing is needed
   */
  needsRebalancing(): boolean {
    return this.config.allocations.some(
      allocation => this.calculateDeviation(allocation) > this.config.threshold
    );
  }

  /**
   * Calculate required rebalancing actions
   */
  private calculateRebalancingActions(): void {
    this.actions = [];

    if (!this.needsRebalancing()) {
      return;
    }

    // Calculate how much each asset is over/under target
    const adjustments = this.config.allocations.map(allocation => ({
      token: allocation.token,
      difference: allocation.currentValue - (allocation.targetValue || 0),
      deviation: this.calculateDeviation(allocation),
    }));

    // Sort by absolute deviation (largest first)
    adjustments.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

    // Create actions to rebalance
    const overweight = adjustments.filter(a => a.difference > 0);
    const underweight = adjustments.filter(a => a.difference < 0);

    for (const over of overweight) {
      for (const under of underweight) {
        const amount = Math.min(
          Math.abs(over.difference),
          Math.abs(under.difference)
        );

        if (amount >= (this.config.minTradeSize || 0)) {
          this.actions.push({
            from: over.token,
            to: under.token,
            amount,
            reason: `Rebalance: ${over.token.symbol} overweight by ${over.deviation.toFixed(2)}%, ${under.token.symbol} underweight`,
          });

          // Update remaining differences
          over.difference -= amount;
          under.difference += amount;
        }

        if (Math.abs(over.difference) < (this.config.minTradeSize || 0)) {
          break;
        }
      }
    }
  }

  /**
   * Execute a single rebalancing action
   */
  private async executeRebalanceAction(
    action: RebalanceAction
  ): Promise<Transaction> {
    // Use Loom to create multi-route swap if needed
    const tx = await Loom.weave({
      type: 'MULTI_ROUTE_SWAP',
      input: action.from.symbol,
      output: action.to.symbol,
      amount: action.amount,
      parallelPriority: true,
    });

    // Return transaction (metadata stored in pattern result instead)
    return tx;
  }

  /**
   * Get rebalancing summary
   */
  getSummary(): {
    needsRebalancing: boolean;
    maxDeviation: number;
    actions: RebalanceAction[];
  } {
    const maxDeviation = Math.max(
      ...this.config.allocations.map(a => this.calculateDeviation(a))
    );

    return {
      needsRebalancing: this.needsRebalancing(),
      maxDeviation,
      actions: this.actions,
    };
  }

  /**
   * Update current values (e.g., from price oracle)
   */
  updateCurrentValues(updates: Array<{ token: string; value: number }>): void {
    for (const update of updates) {
      const allocation = this.config.allocations.find(
        a => a.token.symbol === update.token
      );

      if (allocation) {
        allocation.currentValue = update.value;
      }
    }

    this.calculateTargetValues();
  }
}
