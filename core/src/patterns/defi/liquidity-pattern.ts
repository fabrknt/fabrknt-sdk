/**
 * Liquidity Provision Pattern
 *
 * Automated liquidity provision with position management and
 * impermanent loss monitoring.
 */

import type { Transaction } from '../../types';
import { Loom } from '../../loom';
import { Fabrknt } from '../../core/fabrknt';
import {
  ExecutionPattern,
  PatternConfig,
  PatternResult,
  Token,
  Price,
} from '../types';

/**
 * Liquidity pool information
 */
export interface LiquidityPool {
  /** Pool name */
  name: string;
  /** Pool program ID */
  programId: string;
  /** Token A */
  tokenA: Token;
  /** Token B */
  tokenB: Token;
  /** Current APY (%) */
  apy: number;
  /** Fee tier (%) */
  feeTier: number;
  /** Total liquidity in USD */
  totalLiquidity: number;
  /** Current price ratio */
  priceRatio: number;
}

/**
 * Liquidity position
 */
export interface LiquidityPosition {
  /** Pool */
  pool: LiquidityPool;
  /** Amount of token A deposited */
  amountA: number;
  /** Amount of token B deposited */
  amountB: number;
  /** Initial value in USD */
  initialValue: number;
  /** Current value in USD */
  currentValue: number;
  /** Impermanent loss (%) */
  impermanentLoss: number;
}

/**
 * Liquidity configuration
 */
export interface LiquidityConfig extends PatternConfig {
  /** Action: 'add' | 'remove' | 'rebalance' */
  action: 'add' | 'remove' | 'rebalance';
  /** Target pool */
  pool: LiquidityPool;
  /** Amount of token A */
  amountA?: number;
  /** Amount of token B */
  amountB?: number;
  /** Current prices */
  prices: {
    tokenA: Price;
    tokenB: Price;
  };
  /** For remove: percentage to remove (0-100) */
  removePercentage?: number;
  /** Monitor impermanent loss */
  monitorImpermanentLoss?: boolean;
  /** Auto-rebalance threshold (%) */
  rebalanceThreshold?: number;
}

/**
 * Liquidity Provision Pattern
 *
 * Manages liquidity positions with automatic rebalancing and
 * impermanent loss monitoring.
 *
 * @example
 * ```typescript
 * // Add liquidity
 * const liquidityPattern = new LiquidityPattern({
 *   name: 'Add SOL-USDC Liquidity',
 *   action: 'add',
 *   pool: {
 *     name: 'Orca SOL-USDC',
 *     programId: 'Orca...',
 *     tokenA: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
 *     tokenB: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
 *     apy: 12.5,
 *     feeTier: 0.003,
 *     totalLiquidity: 5000000,
 *     priceRatio: 100,
 *   },
 *   amountA: 10,
 *   amountB: 1000,
 *   prices: {
 *     tokenA: { token: 'SOL', price: 100, quoteCurrency: 'USDC', timestamp: Date.now() },
 *     tokenB: { token: 'USDC', price: 1, quoteCurrency: 'USD', timestamp: Date.now() },
 *   },
 *   monitorImpermanentLoss: true,
 *   guard: new Guard({ mode: 'block', maxSlippage: 0.01 }),
 * });
 *
 * const result = await liquidityPattern.execute();
 * ```
 */
export class LiquidityPattern extends ExecutionPattern {
  protected config: LiquidityConfig;
  private position?: LiquidityPosition;

  constructor(config: LiquidityConfig) {
    super(config);
    this.config = {
      monitorImpermanentLoss: true,
      rebalanceThreshold: 5, // 5% deviation
      ...config,
    };
  }

  /**
   * Execute liquidity operation
   */
  async execute(): Promise<PatternResult> {
    this.startTime = Date.now();

    try {
      // Validate configuration
      if (!this.validate()) {
        throw new Error('Invalid liquidity configuration');
      }

      const transactions: Transaction[] = [];
      let tx: Transaction;

      switch (this.config.action) {
        case 'add':
          tx = await this.addLiquidity();
          transactions.push(tx);
          break;

        case 'remove':
          tx = await this.removeLiquidity();
          transactions.push(tx);
          break;

        case 'rebalance':
          const rebalanceTxs = await this.rebalancePosition();
          transactions.push(...rebalanceTxs);
          break;
      }

      // Execute transactions
      if (!this.config.dryRun && this.config.guard) {
        for (const transaction of transactions) {
          await Fabrknt.execute(transaction, { with: this.config.guard });
        }
      }

      const metrics = this.createMetrics(transactions);

      return {
        success: true,
        transactions,
        metrics,
        metadata: {
          action: this.config.action,
          pool: this.config.pool.name,
          position: this.position,
          impermanentLoss: this.position?.impermanentLoss,
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
   * Validate liquidity configuration
   */
  protected validate(): boolean {
    const { action, pool, amountA, amountB, removePercentage } = this.config;

    if (action === 'add') {
      if (!amountA || !amountB) {
        console.error('Both amountA and amountB required for add action');
        return false;
      }

      if (amountA <= 0 || amountB <= 0) {
        console.error('Amounts must be positive');
        return false;
      }

      // Check if amounts match pool ratio
      const expectedRatio = pool.priceRatio;
      const actualRatio = amountB / amountA;
      const deviation = Math.abs((actualRatio - expectedRatio) / expectedRatio);

      if (deviation > 0.05) {
        // 5% tolerance
        console.warn(
          `Amounts deviate from pool ratio by ${(deviation * 100).toFixed(2)}%`
        );
      }
    }

    if (action === 'remove') {
      if (!removePercentage || removePercentage <= 0 || removePercentage > 100) {
        console.error('Remove percentage must be between 0 and 100');
        return false;
      }
    }

    return true;
  }

  /**
   * Add liquidity to pool
   */
  private async addLiquidity(): Promise<Transaction> {
    const { pool, amountA, amountB, prices } = this.config;

    const tx = await Loom.weave({
      type: 'LIQUIDITY_ADD',
      input: pool.tokenA.symbol,
      output: pool.tokenB.symbol,
      amount: amountA!,
      parallelPriority: false,
    });

    // Calculate initial position
    const initialValue =
      amountA! * prices.tokenA.price + amountB! * prices.tokenB.price;

    this.position = {
      pool,
      amountA: amountA!,
      amountB: amountB!,
      initialValue,
      currentValue: initialValue,
      impermanentLoss: 0,
    };

    // Return transaction (metadata stored in pattern result instead)
    return tx;
  }

  /**
   * Remove liquidity from pool
   */
  private async removeLiquidity(): Promise<Transaction> {
    const { pool, removePercentage } = this.config;

    const tx = await Loom.weave({
      type: 'LIQUIDITY_REMOVE',
      input: pool.tokenA.symbol,
      output: pool.tokenB.symbol,
      amount: removePercentage!,
      parallelPriority: false,
    });

    // Return transaction (metadata stored in pattern result instead)
    return tx;
  }

  /**
   * Rebalance liquidity position
   */
  private async rebalancePosition(): Promise<Transaction[]> {
    // This would typically:
    // 1. Remove existing liquidity
    // 2. Swap tokens to match current pool ratio
    // 3. Re-add liquidity with optimal amounts

    const transactions: Transaction[] = [];

    // Remove liquidity
    const removeTx = await this.removeLiquidity();
    transactions.push(removeTx);

    // Add liquidity back
    const addTx = await this.addLiquidity();
    transactions.push(addTx);

    return transactions;
  }

  /**
   * Calculate impermanent loss
   */
  calculateImpermanentLoss(currentPriceRatio: number): number {
    if (!this.position) return 0;

    const initialRatio = this.config.pool.priceRatio;
    const priceChange = currentPriceRatio / initialRatio;

    // Impermanent loss formula
    const il =
      (2 * Math.sqrt(priceChange)) / (1 + priceChange) - 1;

    return il * 100; // Return as percentage
  }

  /**
   * Update position with current prices
   */
  updatePosition(prices: { tokenA: Price; tokenB: Price }): void {
    if (!this.position) return;

    const currentValue =
      this.position.amountA * prices.tokenA.price +
      this.position.amountB * prices.tokenB.price;

    const currentRatio = prices.tokenA.price / prices.tokenB.price;

    this.position.currentValue = currentValue;
    this.position.impermanentLoss = this.calculateImpermanentLoss(currentRatio);
  }

  /**
   * Check if rebalancing is needed
   */
  needsRebalancing(): boolean {
    if (!this.position || !this.config.monitorImpermanentLoss) {
      return false;
    }

    return (
      Math.abs(this.position.impermanentLoss) >=
      (this.config.rebalanceThreshold || 5)
    );
  }

  /**
   * Get position summary
   */
  getPositionSummary(): LiquidityPosition | null {
    return this.position || null;
  }
}
