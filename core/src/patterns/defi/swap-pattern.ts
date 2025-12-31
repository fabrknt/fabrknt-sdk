/**
 * Optimized Swap Pattern
 *
 * Multi-route swap optimization with price impact minimization
 * and intelligent order splitting across DEXs.
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
import type { DEXAdapter } from '../../dex/types';
import { JupiterAdapter } from '../../dex/jupiter';

/**
 * Swap route option
 */
export interface SwapRoute {
  /** DEX name */
  dex: string;
  /** DEX program ID */
  programId: string;
  /** Price for this route */
  price: number;
  /** Liquidity available */
  liquidity: number;
  /** Estimated price impact (%) */
  priceImpact: number;
  /** Fee percentage */
  fee: number;
}

/**
 * Swap configuration
 */
export interface SwapConfig extends PatternConfig {
  /** Token to swap from */
  fromToken: Token;
  /** Token to swap to */
  toToken: Token;
  /** Amount to swap */
  amount: number;
  /** Current price */
  currentPrice: Price;
  /** Available routes (optional if using real DEX) */
  routes?: SwapRoute[];
  /** Maximum price impact allowed (%) */
  maxPriceImpact: number;
  /** Split orders across routes */
  enableSplitOrders?: boolean;
  /** Minimum route allocation (%) */
  minRouteAllocation?: number;
  /** Enable real DEX integration via Jupiter (default: false for testing) */
  enableRealDEX?: boolean;
  /** Custom DEX adapter (overrides default Jupiter) */
  dexAdapter?: DEXAdapter;
}

/**
 * Optimized Swap Pattern
 *
 * Executes swaps with intelligent route selection and order splitting
 * to minimize price impact and maximize execution quality.
 *
 * @example
 * ```typescript
 * const swapPattern = new SwapPattern({
 *   name: 'SOL to USDC Swap',
 *   fromToken: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
 *   toToken: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
 *   amount: 100,
 *   currentPrice: { token: 'SOL', price: 100, quoteCurrency: 'USDC', timestamp: Date.now() },
 *   routes: [
 *     {
 *       dex: 'Orca',
 *       programId: 'Orca...',
 *       price: 100.5,
 *       liquidity: 500000,
 *       priceImpact: 0.15,
 *       fee: 0.003,
 *     },
 *     {
 *       dex: 'Raydium',
 *       programId: 'Rayd...',
 *       price: 100.2,
 *       liquidity: 300000,
 *       priceImpact: 0.25,
 *       fee: 0.0025,
 *     },
 *   ],
 *   maxPriceImpact: 0.5,
 *   enableSplitOrders: true,
 *   guard: new Guard({ mode: 'block', maxSlippage: 0.01 }),
 * });
 *
 * const result = await swapPattern.execute();
 * ```
 */
export class SwapPattern extends ExecutionPattern {
  protected config: SwapConfig;
  private allocations: Map<string, { route: SwapRoute; amount: number }> =
    new Map();
  private dexAdapter?: DEXAdapter;

  constructor(config: SwapConfig) {
    super(config);
    this.config = {
      enableSplitOrders: true,
      minRouteAllocation: 10, // 10% minimum
      enableRealDEX: false,
      routes: [],
      ...config,
    };

    // Initialize DEX adapter if real DEX integration is enabled
    if (this.config.enableRealDEX) {
      this.dexAdapter = this.config.dexAdapter || new JupiterAdapter();
    }
  }

  /**
   * Execute optimized swap
   */
  async execute(): Promise<PatternResult> {
    this.startTime = Date.now();

    try {
      // Fetch real routes if enabled
      if (this.config.enableRealDEX && this.dexAdapter) {
        await this.fetchRealRoutes();
      }

      // Validate configuration
      if (!this.validate()) {
        throw new Error('Invalid swap configuration');
      }

      // Calculate optimal route allocations
      this.calculateRouteAllocations();

      const transactions: Transaction[] = [];

      // Execute swaps across selected routes
      for (const [, allocation] of this.allocations) {
        const tx = await this.executeSwapOnRoute(
          allocation.route,
          allocation.amount
        );
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
          routes: Object.fromEntries(
            Array.from(this.allocations.entries()).map(([dex, alloc]) => [
              dex,
              {
                amount: alloc.amount,
                percentage: (alloc.amount / this.config.amount) * 100,
                priceImpact: alloc.route.priceImpact,
              },
            ])
          ),
          totalPriceImpact: this.calculateTotalPriceImpact(),
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
   * Fetch real routes from DEX adapter
   */
  private async fetchRealRoutes(): Promise<void> {
    if (!this.dexAdapter) return;

    try {
      // Get quote from Jupiter for the swap
      const quote = await this.dexAdapter.getQuote(
        this.config.fromToken.mint,
        this.config.toToken.mint,
        this.config.amount
      );

      // Convert Jupiter market infos to SwapRoute format
      const routes: SwapRoute[] = quote.marketInfos.map((marketInfo) => ({
        dex: marketInfo.label,
        programId: marketInfo.id,
        price: parseFloat(marketInfo.outAmount) / parseFloat(marketInfo.inAmount),
        liquidity: 1000000, // Jupiter doesn't provide this, use default
        priceImpact: marketInfo.priceImpactPct || 0,
        fee: marketInfo.lpFee.pct / 100,
      }));

      // Update config with real routes
      this.config.routes = routes;
    } catch (error) {
      console.warn('Failed to fetch real routes:', error);
      // Fall back to configured routes if available
      if (!this.config.routes || this.config.routes.length === 0) {
        throw new Error('Failed to fetch routes and no fallback routes available');
      }
    }
  }

  /**
   * Validate swap configuration
   */
  protected validate(): boolean {
    const { amount, routes, maxPriceImpact } = this.config;

    if (amount <= 0) {
      console.error('Swap amount must be positive');
      return false;
    }

    if (!routes || routes.length === 0) {
      console.error('At least one route is required');
      return false;
    }

    // Check if any route exceeds max price impact
    if (routes.every(r => r.priceImpact > maxPriceImpact)) {
      console.error('All routes exceed maximum price impact');
      return false;
    }

    return true;
  }

  /**
   * Calculate optimal route allocations
   */
  private calculateRouteAllocations(): void {
    this.allocations.clear();

    const { routes, amount, enableSplitOrders, maxPriceImpact } = this.config;

    if (!routes || routes.length === 0) {
      throw new Error('No routes available for swap calculation');
    }

    // Filter routes by max price impact
    const validRoutes = routes
      .filter(r => r.priceImpact <= maxPriceImpact)
      .sort((a, b) => {
        // Sort by best execution (price - fees - price impact)
        const scoreA = a.price - a.price * (a.fee + a.priceImpact / 100);
        const scoreB = b.price - b.price * (b.fee + b.priceImpact / 100);
        return scoreB - scoreA;
      });

    if (validRoutes.length === 0) {
      throw new Error('No valid routes available');
    }

    if (!enableSplitOrders || validRoutes.length === 1) {
      // Use single best route
      this.allocations.set(validRoutes[0].dex, {
        route: validRoutes[0],
        amount,
      });
      return;
    }

    // Split orders across multiple routes to minimize impact
    this.splitOrdersAcrossRoutes(validRoutes, amount);
  }

  /**
   * Split orders across multiple routes
   */
  private splitOrdersAcrossRoutes(
    routes: SwapRoute[],
    totalAmount: number
  ): void {
    // Calculate allocation based on liquidity and price impact
    const scores = routes.map(route => {
      // Higher liquidity and lower price impact = higher score
      const liquidityScore = route.liquidity;
      const impactPenalty = 1 / (1 + route.priceImpact);
      return liquidityScore * impactPenalty;
    });

    const totalScore = scores.reduce((sum, score) => sum + score, 0);

    // Allocate proportionally to scores
    routes.forEach((route, index) => {
      const percentage = scores[index] / totalScore;
      const amount = totalAmount * percentage;

      // Only include if above minimum allocation
      if (
        percentage * 100 >=
        (this.config.minRouteAllocation || 0)
      ) {
        this.allocations.set(route.dex, { route, amount });
      }
    });

    // If no allocations met minimum, use best route
    if (this.allocations.size === 0) {
      this.allocations.set(routes[0].dex, {
        route: routes[0],
        amount: totalAmount,
      });
    }
  }

  /**
   * Execute swap on a specific route
   */
  private async executeSwapOnRoute(
    _route: SwapRoute,
    amount: number
  ): Promise<Transaction> {
    const tx = await Loom.weave({
      type: 'SWAP',
      input: this.config.fromToken.symbol,
      output: this.config.toToken.symbol,
      amount,
      parallelPriority: false,
    });

    // Return transaction (metadata stored in pattern result instead)
    return tx;
  }

  /**
   * Calculate total price impact across all routes
   */
  private calculateTotalPriceImpact(): number {
    let totalImpact = 0;

    for (const [, allocation] of this.allocations) {
      const weight = allocation.amount / this.config.amount;
      totalImpact += allocation.route.priceImpact * weight;
    }

    return totalImpact;
  }

  /**
   * Calculate average execution price
   */
  private calculateAveragePrice(): number {
    let totalPrice = 0;

    for (const [, allocation] of this.allocations) {
      const weight = allocation.amount / this.config.amount;
      totalPrice += allocation.route.price * weight;
    }

    return totalPrice;
  }

  /**
   * Get execution summary
   */
  getSummary(): {
    routes: Array<{
      dex: string;
      amount: number;
      percentage: number;
      priceImpact: number;
    }>;
    totalPriceImpact: number;
    averagePrice: number;
  } {
    return {
      routes: Array.from(this.allocations.entries()).map(([dex, alloc]) => ({
        dex,
        amount: alloc.amount,
        percentage: (alloc.amount / this.config.amount) * 100,
        priceImpact: alloc.route.priceImpact,
      })),
      totalPriceImpact: this.calculateTotalPriceImpact(),
      averagePrice: this.calculateAveragePrice(),
    };
  }
}
