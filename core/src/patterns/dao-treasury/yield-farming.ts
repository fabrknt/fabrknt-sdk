/**
 * Yield Farming Pattern
 *
 * Automated yield farming strategy for DAO treasuries to optimize
 * returns across multiple protocols.
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
 * Yield farming protocol
 */
export interface YieldProtocol {
  /** Protocol name */
  name: string;
  /** Protocol program ID */
  programId: string;
  /** Current APY (%) */
  apy: number;
  /** Token being farmed */
  token: Token;
  /** Minimum deposit amount */
  minDeposit?: number;
  /** Maximum deposit amount */
  maxDeposit?: number;
  /** Lock period in seconds */
  lockPeriod?: number;
}

/**
 * Yield farming configuration
 */
export interface YieldFarmingConfig extends PatternConfig {
  /** Amount to farm */
  farmAmount: number;
  /** Token to farm with */
  farmToken: Token;
  /** Available protocols */
  protocols: YieldProtocol[];
  /** Strategy: 'highest-apy' | 'diversified' | 'conservative' */
  strategy: 'highest-apy' | 'diversified' | 'conservative';
  /** Auto-compound rewards */
  autoCompound?: boolean;
  /** Compound frequency in milliseconds */
  compoundFrequency?: number;
}

/**
 * Yield Farming Pattern
 *
 * Optimizes yield farming across multiple protocols based on strategy.
 *
 * @example
 * ```typescript
 * const yieldPattern = new YieldFarmingPattern({
 *   name: 'Treasury Yield Optimization',
 *   farmAmount: 500000,
 *   farmToken: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
 *   protocols: [
 *     {
 *       name: 'Solend',
 *       programId: 'SoLE...',
 *       apy: 8.5,
 *       token: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
 *     },
 *     {
 *       name: 'Marinade',
 *       programId: 'Mari...',
 *       apy: 6.8,
 *       token: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
 *     },
 *   ],
 *   strategy: 'diversified',
 *   autoCompound: true,
 *   compoundFrequency: 7 * 24 * 60 * 60 * 1000, // Weekly
 *   guard: new Guard({ mode: 'block', maxSlippage: 0.01 }),
 * });
 *
 * const result = await yieldPattern.execute();
 * ```
 */
export class YieldFarmingPattern extends ExecutionPattern {
  protected config: YieldFarmingConfig;
  private allocations: Map<string, number> = new Map();

  constructor(config: YieldFarmingConfig) {
    super(config);
    this.config = {
      autoCompound: false,
      compoundFrequency: 7 * 24 * 60 * 60 * 1000, // Weekly default
      ...config,
    };
  }

  /**
   * Execute yield farming strategy
   */
  async execute(): Promise<PatternResult> {
    this.startTime = Date.now();

    try {
      // Validate configuration
      if (!this.validate()) {
        throw new Error('Invalid yield farming configuration');
      }

      // Calculate allocations based on strategy
      this.calculateAllocations();

      const transactions: Transaction[] = [];

      // Execute deposits to protocols
      for (const [protocolName, amount] of this.allocations) {
        const protocol = this.config.protocols.find(p => p.name === protocolName);
        if (!protocol) continue;

        const tx = await this.depositToProtocol(protocol, amount);
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
          strategy: this.config.strategy,
          allocations: Object.fromEntries(this.allocations),
          estimatedAPY: this.calculateWeightedAPY(),
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
   * Validate yield farming configuration
   */
  protected validate(): boolean {
    const { farmAmount, protocols } = this.config;

    if (farmAmount <= 0) {
      console.error('Farm amount must be positive');
      return false;
    }

    if (protocols.length === 0) {
      console.error('At least one protocol is required');
      return false;
    }

    return true;
  }

  /**
   * Calculate allocations based on strategy
   */
  private calculateAllocations(): void {
    this.allocations.clear();

    const { protocols, farmAmount, strategy } = this.config;

    switch (strategy) {
      case 'highest-apy':
        this.allocateHighestAPY(protocols, farmAmount);
        break;

      case 'diversified':
        this.allocateDiversified(protocols, farmAmount);
        break;

      case 'conservative':
        this.allocateConservative(protocols, farmAmount);
        break;
    }
  }

  /**
   * Allocate all funds to highest APY protocol
   */
  private allocateHighestAPY(
    protocols: YieldProtocol[],
    amount: number
  ): void {
    const highest = protocols.reduce((max, p) =>
      p.apy > max.apy ? p : max
    );

    this.allocations.set(highest.name, amount);
  }

  /**
   * Diversified allocation across top protocols
   */
  private allocateDiversified(
    protocols: YieldProtocol[],
    amount: number
  ): void {
    // Sort by APY descending
    const sorted = [...protocols].sort((a, b) => b.apy - a.apy);

    // Take top 3 protocols
    const top3 = sorted.slice(0, Math.min(3, sorted.length));

    // Allocate: 50% to highest, 30% to second, 20% to third
    const weights = [0.5, 0.3, 0.2];

    top3.forEach((protocol, index) => {
      const allocation = amount * (weights[index] || 0);
      if (allocation > 0) {
        this.allocations.set(protocol.name, allocation);
      }
    });
  }

  /**
   * Conservative allocation favoring safety
   */
  private allocateConservative(
    protocols: YieldProtocol[],
    amount: number
  ): void {
    // Equal weight across all protocols for maximum diversification
    const allocationPerProtocol = amount / protocols.length;

    protocols.forEach(protocol => {
      this.allocations.set(protocol.name, allocationPerProtocol);
    });
  }

  /**
   * Deposit to a yield protocol
   */
  private async depositToProtocol(
    protocol: YieldProtocol,
    amount: number
  ): Promise<Transaction> {
    // Create deposit transaction
    const tx = await Loom.weave({
      type: 'LIQUIDITY_ADD',
      input: this.config.farmToken.symbol,
      output: protocol.token.symbol,
      amount,
      parallelPriority: false,
    });

    // Return transaction (metadata stored in pattern result instead)
    return tx;
  }

  /**
   * Calculate weighted APY based on allocations
   */
  private calculateWeightedAPY(): number {
    let totalAPY = 0;
    const totalAmount = this.config.farmAmount;

    for (const [protocolName, amount] of this.allocations) {
      const protocol = this.config.protocols.find(p => p.name === protocolName);
      if (protocol) {
        const weight = amount / totalAmount;
        totalAPY += protocol.apy * weight;
      }
    }

    return totalAPY;
  }

  /**
   * Get allocation summary
   */
  getAllocationSummary(): Array<{
    protocol: string;
    amount: number;
    percentage: number;
    apy: number;
  }> {
    const summary = [];

    for (const [protocolName, amount] of this.allocations) {
      const protocol = this.config.protocols.find(p => p.name === protocolName);
      if (protocol) {
        summary.push({
          protocol: protocolName,
          amount,
          percentage: (amount / this.config.farmAmount) * 100,
          apy: protocol.apy,
        });
      }
    }

    return summary;
  }
}
