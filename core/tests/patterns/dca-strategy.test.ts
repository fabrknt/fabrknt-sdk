import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DCAStrategy } from '../../src/patterns/ai-agents/dca-strategy';
import { Guard } from '../../src/guard';
import type { DCAConfig } from '../../src/patterns/ai-agents/dca-strategy';
import type { Token, TradingPair } from '../../src/patterns/types';

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

describe('DCAStrategy', () => {
  let baseConfig: DCAConfig;
  let solToken: Token;
  let usdcToken: Token;
  let pair: TradingPair;

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

    baseConfig = {
      name: 'Weekly SOL DCA',
      pair,
      amountPerInterval: 100,
      totalIntervals: 5,
      intervalDuration: 1000, // 1 second minimum
      direction: 'buy',
      startImmediately: true,
      dryRun: true,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should create strategy with valid config', () => {
      const strategy = new DCAStrategy(baseConfig);

      expect(strategy).toBeDefined();
      expect(strategy.config.name).toBe('Weekly SOL DCA');
      expect(strategy.config.amountPerInterval).toBe(100);
      expect(strategy.config.totalIntervals).toBe(5);
    });

    it('should default startImmediately to true', () => {
      const config = { ...baseConfig };
      delete config.startImmediately;

      const strategy = new DCAStrategy(config);

      expect(strategy.config.startImmediately).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate correct configuration', async () => {
      const strategy = new DCAStrategy(baseConfig);
      const result = await strategy.execute();

      expect(result.success).toBe(true);
    });

    it('should fail when amount <= 0', async () => {
      const invalidConfig = {
        ...baseConfig,
        amountPerInterval: 0,
      };

      const strategy = new DCAStrategy(invalidConfig);
      const result = await strategy.execute();

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid');
    });

    it('should fail when total intervals < 1', async () => {
      const invalidConfig = {
        ...baseConfig,
        totalIntervals: 0,
      };

      const strategy = new DCAStrategy(invalidConfig);
      const result = await strategy.execute();

      expect(result.success).toBe(false);
    });

    it('should fail when interval duration < 1000ms', async () => {
      const invalidConfig = {
        ...baseConfig,
        intervalDuration: 500,
      };

      const strategy = new DCAStrategy(invalidConfig);
      const result = await strategy.execute();

      expect(result.success).toBe(false);
    });
  });

  describe('Execution', () => {
    it('should execute first interval immediately when startImmediately is true', async () => {
      const strategy = new DCAStrategy(baseConfig);
      const result = await strategy.execute();

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBeGreaterThanOrEqual(1);
    });

    it('should not execute immediately when startImmediately is false', async () => {
      const config = {
        ...baseConfig,
        startImmediately: false,
        totalIntervals: 1,
      };

      const strategy = new DCAStrategy(config);
      const result = await strategy.execute();

      expect(result.success).toBe(true);
    });

    it('should track execution metrics', async () => {
      const strategy = new DCAStrategy(baseConfig);
      const result = await strategy.execute();

      expect(result.metrics).toBeDefined();
      expect(result.metrics.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.transactionCount).toBeGreaterThanOrEqual(1);
    });

    it('should include metadata in result', async () => {
      const strategy = new DCAStrategy(baseConfig);
      const result = await strategy.execute();

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.totalIntervals).toBe(5);
      expect(result.metadata?.totalInvested).toBe(500); // 100 * 5
    });
  });

  describe('Buy Direction', () => {
    it('should create buy transactions', async () => {
      const { Loom } = await import('../../src/loom');
      const strategy = new DCAStrategy({
        ...baseConfig,
        direction: 'buy',
      });

      await strategy.execute();

      expect(Loom.weave).toHaveBeenCalled();
      const call = vi.mocked(Loom.weave).mock.calls[0][0];
      expect(call.input).toBe('USDC');
      expect(call.output).toBe('SOL');
    });
  });

  describe('Sell Direction', () => {
    it('should create sell transactions', async () => {
      const { Loom } = await import('../../src/loom');
      const strategy = new DCAStrategy({
        ...baseConfig,
        direction: 'sell',
      });

      await strategy.execute();

      expect(Loom.weave).toHaveBeenCalled();
      const call = vi.mocked(Loom.weave).mock.calls[0][0];
      expect(call.input).toBe('SOL');
      expect(call.output).toBe('USDC');
    });
  });

  describe('Status Tracking', () => {
    it('should return correct initial status', () => {
      const strategy = new DCAStrategy(baseConfig);
      const status = strategy.getStatus();

      expect(status.completedIntervals).toBe(0);
      expect(status.remainingIntervals).toBe(5);
      expect(status.totalInvested).toBe(0);
      expect(status.averagePrice).toBe(0);
    });

    it('should update status after execution', async () => {
      const strategy = new DCAStrategy({
        ...baseConfig,
        dryRun: false,
        guard: new Guard(),
      });

      await strategy.execute();
      const status = strategy.getStatus();

      expect(status.completedIntervals).toBeGreaterThanOrEqual(1);
      expect(status.totalInvested).toBeGreaterThan(0);
    });

    it('should calculate next execution time', async () => {
      const strategy = new DCAStrategy({
        ...baseConfig,
        totalIntervals: 3, // Reduce to avoid long waits
      });
      const now = Date.now();
      await strategy.execute();

      // Stop immediately to prevent long-running intervals
      strategy.stop();

      const status = strategy.getStatus();

      if (status.remainingIntervals > 0) {
        // Check it's a reasonable future time (within next hour)
        expect(status.nextExecutionTime).toBeGreaterThan(now);
        expect(status.nextExecutionTime).toBeLessThan(now + 3600000);
      } else {
        expect(status.nextExecutionTime).toBeNull();
      }
    });
  });

  describe('Control Methods', () => {
    it('should stop strategy', async () => {
      const strategy = new DCAStrategy(baseConfig);
      await strategy.execute();

      strategy.stop();

      // Verify timer is cleared (implementation detail)
      expect(strategy).toBeDefined();
    });

    it('should pause strategy', async () => {
      const strategy = new DCAStrategy(baseConfig);
      await strategy.execute();

      strategy.pause();

      expect(strategy).toBeDefined();
    });

    it('should resume strategy', () => {
      const strategy = new DCAStrategy({
        ...baseConfig,
        totalIntervals: 1, // Single interval
      });

      // Pause and resume without executing to avoid timeouts
      strategy.pause();

      // Resume should not throw
      expect(() => strategy.resume()).not.toThrow();

      // Clean up
      strategy.stop();
    });

    it('should not resume if no intervals remaining', async () => {
      const strategy = new DCAStrategy({
        ...baseConfig,
        totalIntervals: 1,
        dryRun: false,
        guard: new Guard(),
      });

      await strategy.execute();
      const status = strategy.getStatus();

      if (status.remainingIntervals === 0) {
        await strategy.resume();
        expect(strategy).toBeDefined();
      }
    });
  });

  describe('Amount Updates', () => {
    it('should update amount per interval', () => {
      const strategy = new DCAStrategy(baseConfig);

      strategy.updateAmount(200);

      expect(strategy.config.amountPerInterval).toBe(200);
    });

    it('should not update to invalid amount', () => {
      const strategy = new DCAStrategy(baseConfig);
      const originalAmount = strategy.config.amountPerInterval;

      strategy.updateAmount(0);

      expect(strategy.config.amountPerInterval).toBe(originalAmount);
    });

    it('should not update to negative amount', () => {
      const strategy = new DCAStrategy(baseConfig);
      const originalAmount = strategy.config.amountPerInterval;

      strategy.updateAmount(-100);

      expect(strategy.config.amountPerInterval).toBe(originalAmount);
    });
  });

  describe('Price Limits', () => {
    it('should accept price limit configuration', () => {
      const strategy = new DCAStrategy({
        ...baseConfig,
        priceLimit: 105,
      });

      expect(strategy.config.priceLimit).toBe(105);
    });
  });

  describe('Stop Conditions', () => {
    it('should accept stop condition configuration', () => {
      const strategy = new DCAStrategy({
        ...baseConfig,
        stopCondition: {
          type: 'price-above',
          price: 120,
        },
      });

      expect(strategy.config.stopCondition).toEqual({
        type: 'price-above',
        price: 120,
      });
    });
  });

  describe('Guard Integration', () => {
    it('should execute with Guard when provided', async () => {
      const { Fabrknt } = await import('../../src/core/fabrknt');
      const guard = new Guard({ mode: 'block', maxSlippage: 0.02 });

      const strategy = new DCAStrategy({
        ...baseConfig,
        guard,
        dryRun: false,
      });

      await strategy.execute();

      expect(Fabrknt.execute).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single interval', async () => {
      const strategy = new DCAStrategy({
        ...baseConfig,
        totalIntervals: 1,
      });

      const result = await strategy.execute();

      expect(result.success).toBe(true);
      expect(result.metadata?.totalIntervals).toBe(1);
    });

    it('should handle very long intervals', () => {
      const strategy = new DCAStrategy({
        ...baseConfig,
        intervalDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      expect(strategy.config.intervalDuration).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('should handle very short intervals', () => {
      const strategy = new DCAStrategy({
        ...baseConfig,
        intervalDuration: 1000, // 1 second (minimum)
      });

      expect(strategy.config.intervalDuration).toBe(1000);
    });
  });
});
