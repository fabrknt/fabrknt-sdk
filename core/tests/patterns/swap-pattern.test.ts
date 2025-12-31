import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SwapPattern } from '../../src/patterns/defi/swap-pattern';
import { Guard } from '../../src/guard';
import type { SwapConfig, SwapRoute } from '../../src/patterns/defi/swap-pattern';
import type { Token, Price } from '../../src/patterns/types';

// Mock dependencies
vi.mock('../../src/loom', () => ({
  Loom: {
    weave: vi.fn(async (config: any) => ({
      id: `tx-${config.type}`,
      status: 'pending' as const,
    })),
  },
}));

vi.mock('../../src/core/fabrknt', () => ({
  Fabrknt: {
    execute: vi.fn(async () => ({ success: true })),
  },
}));

describe('SwapPattern', () => {
  let baseConfig: SwapConfig;
  let solToken: Token;
  let usdcToken: Token;
  let currentPrice: Price;
  let routes: SwapRoute[];

  beforeEach(() => {
    solToken = {
      mint: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      decimals: 9,
    };

    usdcToken = {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      decimals: 6,
    };

    currentPrice = {
      token: 'SOL',
      price: 100,
      quoteCurrency: 'USDC',
      timestamp: Date.now(),
    };

    routes = [
      {
        dex: 'Orca',
        programId: 'OrcaProgram',
        price: 100.5,
        liquidity: 500000,
        priceImpact: 0.15,
        fee: 0.003,
      },
      {
        dex: 'Raydium',
        programId: 'RaydiumProgram',
        price: 100.2,
        liquidity: 300000,
        priceImpact: 0.25,
        fee: 0.0025,
      },
      {
        dex: 'Jupiter',
        programId: 'JupiterProgram',
        price: 100.8,
        liquidity: 400000,
        priceImpact: 0.1,
        fee: 0.002,
      },
    ];

    baseConfig = {
      name: 'Optimized SOL Swap',
      fromToken: solToken,
      toToken: usdcToken,
      amount: 100,
      currentPrice,
      routes,
      maxPriceImpact: 0.5,
      enableSplitOrders: true,
      dryRun: true,
    };
  });

  describe('Configuration', () => {
    it('should create pattern with valid config', () => {
      const pattern = new SwapPattern(baseConfig);

      expect(pattern).toBeDefined();
      expect(pattern.config.name).toBe('Optimized SOL Swap');
      expect(pattern.config.amount).toBe(100);
    });

    it('should default enableSplitOrders to true', () => {
      const pattern = new SwapPattern(baseConfig);

      expect(pattern.config.enableSplitOrders).toBe(true);
    });

    it('should default minRouteAllocation to 10%', () => {
      const pattern = new SwapPattern(baseConfig);

      expect(pattern.config.minRouteAllocation).toBe(10);
    });
  });

  describe('Validation', () => {
    it('should validate correct configuration', async () => {
      const pattern = new SwapPattern(baseConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should fail when amount <= 0', async () => {
      const invalidConfig = {
        ...baseConfig,
        amount: 0,
      };

      const pattern = new SwapPattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });

    it('should fail when no routes provided', async () => {
      const invalidConfig = {
        ...baseConfig,
        routes: [],
      };

      const pattern = new SwapPattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });

    it('should fail when all routes exceed max price impact', async () => {
      const invalidConfig = {
        ...baseConfig,
        maxPriceImpact: 0.05, // All routes have higher impact
      };

      const pattern = new SwapPattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });
  });

  describe('Route Selection', () => {
    it('should use best route when split orders disabled', async () => {
      const pattern = new SwapPattern({
        ...baseConfig,
        enableSplitOrders: false,
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1);
    });

    it('should use single route when only one route available', async () => {
      const pattern = new SwapPattern({
        ...baseConfig,
        routes: [routes[0]],
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1);
    });

    it('should split orders across multiple routes', async () => {
      const pattern = new SwapPattern({
        ...baseConfig,
        enableSplitOrders: true,
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter routes by max price impact', async () => {
      const pattern = new SwapPattern({
        ...baseConfig,
        maxPriceImpact: 0.2, // Only routes with impact <= 0.2
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
      const summary = pattern.getSummary();

      summary.routes.forEach(route => {
        expect(route.priceImpact).toBeLessThanOrEqual(0.2);
      });
    });
  });

  describe('Order Splitting', () => {
    it('should allocate based on liquidity and price impact', async () => {
      const pattern = new SwapPattern({
        ...baseConfig,
        enableSplitOrders: true,
      });

      await pattern.execute();
      const summary = pattern.getSummary();

      // Routes with higher liquidity and lower impact should get more allocation
      expect(summary.routes.length).toBeGreaterThan(0);
    });

    it('should respect minimum route allocation', async () => {
      const pattern = new SwapPattern({
        ...baseConfig,
        enableSplitOrders: true,
        minRouteAllocation: 20, // 20% minimum
      });

      await pattern.execute();
      const summary = pattern.getSummary();

      summary.routes.forEach(route => {
        expect(route.percentage).toBeGreaterThanOrEqual(20);
      });
    });

    it('should fallback to best route if no allocations meet minimum', async () => {
      const pattern = new SwapPattern({
        ...baseConfig,
        enableSplitOrders: true,
        minRouteAllocation: 90, // Impossibly high minimum
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1);
    });
  });

  describe('Execution', () => {
    it('should create transactions for selected routes', async () => {
      const pattern = new SwapPattern(baseConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBeGreaterThan(0);
    });

    it('should track execution metrics', async () => {
      const pattern = new SwapPattern(baseConfig);
      const result = await pattern.execute();

      expect(result.metrics).toBeDefined();
      expect(result.metrics.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should include metadata in result', async () => {
      const pattern = new SwapPattern(baseConfig);
      const result = await pattern.execute();

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.routes).toBeDefined();
      expect(result.metadata?.totalPriceImpact).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.averagePrice).toBeGreaterThan(0);
    });
  });

  describe('Summary', () => {
    it('should provide execution summary', async () => {
      const pattern = new SwapPattern(baseConfig);
      await pattern.execute();

      const summary = pattern.getSummary();

      expect(summary).toBeDefined();
      expect(Array.isArray(summary.routes)).toBe(true);
      expect(summary.totalPriceImpact).toBeGreaterThanOrEqual(0);
      expect(summary.averagePrice).toBeGreaterThan(0);
    });

    it('should have route percentages sum to 100', async () => {
      const pattern = new SwapPattern(baseConfig);
      await pattern.execute();

      const summary = pattern.getSummary();
      const totalPercent = summary.routes.reduce(
        (sum, route) => sum + route.percentage,
        0
      );

      expect(totalPercent).toBeCloseTo(100, 1);
    });

    it('should have route amounts sum to total amount', async () => {
      const pattern = new SwapPattern(baseConfig);
      await pattern.execute();

      const summary = pattern.getSummary();
      const totalAmount = summary.routes.reduce(
        (sum, route) => sum + route.amount,
        0
      );

      expect(totalAmount).toBeCloseTo(100, 1);
    });
  });

  describe('Price Impact Calculation', () => {
    it('should calculate weighted total price impact', async () => {
      const pattern = new SwapPattern(baseConfig);
      await pattern.execute();

      const summary = pattern.getSummary();

      expect(summary.totalPriceImpact).toBeGreaterThan(0);
      expect(summary.totalPriceImpact).toBeLessThanOrEqual(
        Math.max(...routes.map(r => r.priceImpact))
      );
    });

    it('should minimize price impact through splitting', async () => {
      const singleRoutePattern = new SwapPattern({
        ...baseConfig,
        enableSplitOrders: false,
      });

      const splitRoutePattern = new SwapPattern({
        ...baseConfig,
        enableSplitOrders: true,
      });

      await singleRoutePattern.execute();
      await splitRoutePattern.execute();

      const singleSummary = singleRoutePattern.getSummary();
      const splitSummary = splitRoutePattern.getSummary();

      // Split orders should generally have lower or equal impact
      expect(splitSummary.totalPriceImpact).toBeLessThanOrEqual(
        singleSummary.totalPriceImpact + 0.1 // Allow small tolerance
      );
    });
  });

  describe('Average Price Calculation', () => {
    it('should calculate weighted average price', async () => {
      const pattern = new SwapPattern(baseConfig);
      await pattern.execute();

      const summary = pattern.getSummary();

      expect(summary.averagePrice).toBeGreaterThan(0);
      expect(summary.averagePrice).toBeGreaterThanOrEqual(
        Math.min(...routes.map(r => r.price))
      );
      expect(summary.averagePrice).toBeLessThanOrEqual(
        Math.max(...routes.map(r => r.price))
      );
    });
  });

  describe('Guard Integration', () => {
    it('should execute with Guard when provided', async () => {
      const { Fabrknt } = await import('../../src/core/fabrknt');
      const guard = new Guard({ mode: 'block', maxSlippage: 0.01 });

      const pattern = new SwapPattern({
        ...baseConfig,
        guard,
        dryRun: false,
      });

      await pattern.execute();

      expect(Fabrknt.execute).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small swap amounts', async () => {
      const pattern = new SwapPattern({
        ...baseConfig,
        amount: 0.01,
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle very large swap amounts', async () => {
      const pattern = new SwapPattern({
        ...baseConfig,
        amount: 1000000,
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle routes with same price', async () => {
      const samePriceRoutes = routes.map(r => ({ ...r, price: 100 }));

      const pattern = new SwapPattern({
        ...baseConfig,
        routes: samePriceRoutes,
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle single route with high price impact', async () => {
      const highImpactRoute = [{
        ...routes[0],
        priceImpact: 2.0,
      }];

      const pattern = new SwapPattern({
        ...baseConfig,
        routes: highImpactRoute,
        maxPriceImpact: 3.0,
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle routes with zero liquidity', async () => {
      const zeroLiquidityRoutes = routes.map(r => ({ ...r, liquidity: 0 }));

      const pattern = new SwapPattern({
        ...baseConfig,
        routes: zeroLiquidityRoutes,
        enableSplitOrders: false,
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle very tight price impact threshold', async () => {
      const pattern = new SwapPattern({
        ...baseConfig,
        maxPriceImpact: 0.1,
      });

      const result = await pattern.execute();

      // Should succeed with Jupiter route (0.1% impact)
      expect(result.success).toBe(true);
    });
  });
});
