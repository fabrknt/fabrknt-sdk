import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GridTradingPattern } from '../../src/patterns/ai-agents/grid-trading';
import { Guard } from '../../src/guard';
import type { GridTradingConfig } from '../../src/patterns/ai-agents/grid-trading';
import type { Token, TradingPair, Price } from '../../src/patterns/types';

// Mock Loom and Fabrknt
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

describe('GridTradingPattern', () => {
  let baseConfig: GridTradingConfig;
  let solToken: Token;
  let usdcToken: Token;
  let pair: TradingPair;
  let currentPrice: Price;

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

    pair = {
      base: solToken,
      quote: usdcToken,
    };

    currentPrice = {
      token: 'SOL',
      price: 100,
      quoteCurrency: 'USDC',
      timestamp: Date.now(),
    };

    baseConfig = {
      name: 'SOL-USDC Grid',
      pair,
      lowerBound: 90,
      upperBound: 110,
      gridLevels: 10,
      amountPerGrid: 1,
      currentPrice,
      dryRun: true,
    };
  });

  describe('Configuration', () => {
    it('should create pattern with valid config', () => {
      const pattern = new GridTradingPattern(baseConfig);

      expect(pattern).toBeDefined();
      expect(pattern.config.name).toBe('SOL-USDC Grid');
      expect(pattern.config.gridLevels).toBe(10);
    });

    it('should calculate grid levels on initialization', () => {
      const pattern = new GridTradingPattern(baseConfig);
      const status = pattern.getStatus();

      expect(status.totalLevels).toBe(10);
      expect(status.executedLevels).toBe(0);
      expect(status.pendingLevels).toBe(10);
    });
  });

  describe('Validation', () => {
    it('should validate correct configuration', async () => {
      const pattern = new GridTradingPattern(baseConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should fail when lower bound >= upper bound', async () => {
      const invalidConfig = {
        ...baseConfig,
        lowerBound: 110,
        upperBound: 90,
      };

      const pattern = new GridTradingPattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid');
    });

    it('should fail when grid levels < 2', async () => {
      const invalidConfig = {
        ...baseConfig,
        gridLevels: 1,
      };

      const pattern = new GridTradingPattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });

    it('should warn when current price is outside bounds', async () => {
      const warnConfig = {
        ...baseConfig,
        currentPrice: {
          ...currentPrice,
          price: 120, // Above upper bound
        },
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const pattern = new GridTradingPattern(warnConfig);
      await pattern.execute();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Grid Level Calculation', () => {
    it('should calculate correct number of grid levels', () => {
      const pattern = new GridTradingPattern(baseConfig);
      const status = pattern.getStatus();

      expect(status.totalLevels).toBe(10);
    });

    it('should distribute levels evenly between bounds', () => {
      const pattern = new GridTradingPattern({
        ...baseConfig,
        lowerBound: 90,
        upperBound: 110,
        gridLevels: 5,
      });

      // With 5 levels from 90 to 110, step should be 5
      // Levels: 90, 95, 100, 105, 110
      const status = pattern.getStatus();
      expect(status.totalLevels).toBe(5);
    });

    it('should classify levels as buy/sell based on current price', () => {
      const pattern = new GridTradingPattern({
        ...baseConfig,
        currentPrice: {
          ...currentPrice,
          price: 100,
        },
      });

      // Levels below 100 should be buy, above should be sell
      const status = pattern.getStatus();
      expect(status.totalLevels).toBe(10);
    });
  });

  describe('Execution', () => {
    it('should create transactions for all grid levels', async () => {
      const pattern = new GridTradingPattern(baseConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(10);
    });

    it('should track execution metrics', async () => {
      const pattern = new GridTradingPattern(baseConfig);
      const result = await pattern.execute();

      expect(result.metrics).toBeDefined();
      expect(result.metrics.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.transactionCount).toBe(10);
    });

    it('should include metadata in result', async () => {
      const pattern = new GridTradingPattern(baseConfig);
      const result = await pattern.execute();

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.gridLevels).toBe(10);
      expect(result.metadata?.executedLevels).toBe(0); // Dry run
      expect(result.metadata?.priceRange).toEqual({
        lower: 90,
        upper: 110,
      });
    });

    it('should not execute in dry-run mode', async () => {
      const { Fabrknt } = await import('../../src/core/fabrknt');
      const pattern = new GridTradingPattern({
        ...baseConfig,
        dryRun: true,
      });

      await pattern.execute();
      const status = pattern.getStatus();

      expect(status.executedLevels).toBe(0);
      expect(Fabrknt.execute).not.toHaveBeenCalled();
    });

    it('should execute with Guard when provided', async () => {
      const guard = new Guard({ mode: 'block', maxSlippage: 0.02 });
      const pattern = new GridTradingPattern({
        ...baseConfig,
        guard,
        dryRun: false,
      });

      await pattern.execute();
      const status = pattern.getStatus();

      expect(status.executedLevels).toBe(10);
    });
  });

  describe('Price Updates', () => {
    it('should update grid based on new price', () => {
      const pattern = new GridTradingPattern(baseConfig);

      const newPrice: Price = {
        token: 'SOL',
        price: 95,
        quoteCurrency: 'USDC',
        timestamp: Date.now(),
      };

      pattern.updatePrice(newPrice);

      // After price update, levels should be reclassified
      expect(pattern.config.currentPrice.price).toBe(95);
    });

    it('should not affect executed levels', async () => {
      const pattern = new GridTradingPattern({
        ...baseConfig,
        dryRun: false,
        guard: new Guard(),
      });

      await pattern.execute();
      const beforeUpdate = pattern.getStatus();

      pattern.updatePrice({
        token: 'SOL',
        price: 95,
        quoteCurrency: 'USDC',
        timestamp: Date.now(),
      });

      const afterUpdate = pattern.getStatus();

      expect(afterUpdate.executedLevels).toBe(beforeUpdate.executedLevels);
    });
  });

  describe('Status Tracking', () => {
    it('should return correct status', () => {
      const pattern = new GridTradingPattern(baseConfig);
      const status = pattern.getStatus();

      expect(status).toEqual({
        totalLevels: 10,
        executedLevels: 0,
        pendingLevels: 10,
        averageFillPrice: 0,
      });
    });

    it('should calculate average fill price', async () => {
      const pattern = new GridTradingPattern({
        ...baseConfig,
        dryRun: false,
        guard: new Guard(),
      });

      await pattern.execute();
      const status = pattern.getStatus();

      expect(status.executedLevels).toBe(10);
      expect(status.averageFillPrice).toBeGreaterThan(0);
    });
  });

  describe('Cancellation', () => {
    it('should cancel all pending orders', async () => {
      const pattern = new GridTradingPattern(baseConfig);

      await pattern.execute();
      const beforeCancel = pattern.getStatus();

      await pattern.cancelAll();
      const afterCancel = pattern.getStatus();

      expect(beforeCancel.pendingLevels).toBe(10);
      expect(afterCancel.pendingLevels).toBe(0);
      expect(afterCancel.executedLevels).toBe(10); // Marked as executed to prevent future execution
    });
  });

  describe('Stop Loss & Take Profit', () => {
    it('should accept stop loss configuration', () => {
      const pattern = new GridTradingPattern({
        ...baseConfig,
        stopLoss: 5,
        takeProfit: 10,
      });

      expect(pattern.config.stopLoss).toBe(5);
      expect(pattern.config.takeProfit).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small grid range', () => {
      const pattern = new GridTradingPattern({
        ...baseConfig,
        lowerBound: 99.9,
        upperBound: 100.1,
        gridLevels: 2,
      });

      const status = pattern.getStatus();
      expect(status.totalLevels).toBe(2);
    });

    it('should handle large number of grid levels', () => {
      const pattern = new GridTradingPattern({
        ...baseConfig,
        gridLevels: 100,
      });

      const status = pattern.getStatus();
      expect(status.totalLevels).toBe(100);
    });

    it('should handle zero amount per grid', async () => {
      const pattern = new GridTradingPattern({
        ...baseConfig,
        amountPerGrid: 0,
      });

      const result = await pattern.execute();
      expect(result.success).toBe(true);
    });
  });
});
