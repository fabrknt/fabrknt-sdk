import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TreasuryRebalancing } from '../../src/patterns/dao-treasury/rebalancing';
import { Guard } from '../../src/guard';
import type { RebalancingConfig, AssetAllocation } from '../../src/patterns/dao-treasury/rebalancing';
import type { Token } from '../../src/patterns/types';

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

describe('TreasuryRebalancing', () => {
  let baseConfig: RebalancingConfig;
  let solToken: Token;
  let usdcToken: Token;
  let msolToken: Token;
  let allocations: AssetAllocation[];

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

    msolToken = {
      mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
      symbol: 'mSOL',
      decimals: 9,
    };

    allocations = [
      {
        token: solToken,
        targetPercent: 40,
        currentValue: 340000, // 34% (6% under, exceeds 5% threshold)
      },
      {
        token: usdcToken,
        targetPercent: 40,
        currentValue: 460000, // 46% (6% over, exceeds 5% threshold)
      },
      {
        token: msolToken,
        targetPercent: 20,
        currentValue: 200000, // 20% (exact)
      },
    ];

    baseConfig = {
      name: 'DAO Treasury Rebalance',
      totalValue: 1000000,
      allocations,
      threshold: 5,
      maxSlippage: 0.02,
      baseCurrency: usdcToken,
      dryRun: true,
    };
  });

  describe('Configuration', () => {
    it('should create pattern with valid config', () => {
      const pattern = new TreasuryRebalancing(baseConfig);

      expect(pattern).toBeDefined();
      expect(pattern.config.name).toBe('DAO Treasury Rebalance');
      expect(pattern.config.totalValue).toBe(1000000);
    });

    it('should default minTradeSize to 100', () => {
      const pattern = new TreasuryRebalancing(baseConfig);

      expect(pattern.config.minTradeSize).toBe(100);
    });

    it('should calculate target values on initialization', () => {
      const pattern = new TreasuryRebalancing(baseConfig);

      expect(pattern.config.allocations[0].targetValue).toBe(400000); // 40% of 1M
      expect(pattern.config.allocations[1].targetValue).toBe(400000); // 40% of 1M
      expect(pattern.config.allocations[2].targetValue).toBe(200000); // 20% of 1M
    });
  });

  describe('Validation', () => {
    it('should validate correct configuration', async () => {
      const pattern = new TreasuryRebalancing(baseConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should fail when allocations do not sum to 100%', async () => {
      const invalidConfig = {
        ...baseConfig,
        allocations: [
          { token: solToken, targetPercent: 50, currentValue: 500000 },
          { token: usdcToken, targetPercent: 30, currentValue: 300000 },
          // Only 80% total
        ],
      };

      const pattern = new TreasuryRebalancing(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });

    it('should fail when threshold is <= 0', async () => {
      const invalidConfig = {
        ...baseConfig,
        threshold: 0,
      };

      const pattern = new TreasuryRebalancing(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });

    it('should fail when threshold > 50', async () => {
      const invalidConfig = {
        ...baseConfig,
        threshold: 60,
      };

      const pattern = new TreasuryRebalancing(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });
  });

  describe('Rebalancing Detection', () => {
    it('should detect when rebalancing is needed', () => {
      const pattern = new TreasuryRebalancing(baseConfig);

      expect(pattern.needsRebalancing()).toBe(true);
    });

    it('should not need rebalancing when within threshold', () => {
      const balancedConfig = {
        ...baseConfig,
        allocations: [
          { token: solToken, targetPercent: 40, currentValue: 400000 },
          { token: usdcToken, targetPercent: 40, currentValue: 400000 },
          { token: msolToken, targetPercent: 20, currentValue: 200000 },
        ],
      };

      const pattern = new TreasuryRebalancing(balancedConfig);

      expect(pattern.needsRebalancing()).toBe(false);
    });

    it('should detect deviation exceeding threshold', () => {
      const unbalancedConfig = {
        ...baseConfig,
        threshold: 3,
        allocations: [
          { token: solToken, targetPercent: 40, currentValue: 350000 }, // 35%, 5% deviation
          { token: usdcToken, targetPercent: 40, currentValue: 450000 }, // 45%, 5% deviation
          { token: msolToken, targetPercent: 20, currentValue: 200000 },
        ],
      };

      const pattern = new TreasuryRebalancing(unbalancedConfig);

      expect(pattern.needsRebalancing()).toBe(true);
    });
  });

  describe('Execution', () => {
    it('should execute rebalancing when needed', async () => {
      const pattern = new TreasuryRebalancing(baseConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBeGreaterThan(0);
    });

    it('should not create transactions when balanced', async () => {
      const balancedConfig = {
        ...baseConfig,
        allocations: [
          { token: solToken, targetPercent: 40, currentValue: 400000 },
          { token: usdcToken, targetPercent: 40, currentValue: 400000 },
          { token: msolToken, targetPercent: 20, currentValue: 200000 },
        ],
      };

      const pattern = new TreasuryRebalancing(balancedConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(0);
    });

    it('should track execution metrics', async () => {
      const pattern = new TreasuryRebalancing(baseConfig);
      const result = await pattern.execute();

      expect(result.metrics).toBeDefined();
      expect(result.metrics.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should include allocation metadata', async () => {
      const pattern = new TreasuryRebalancing(baseConfig);
      const result = await pattern.execute();

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.allocations).toBeDefined();
      expect(Array.isArray(result.metadata?.allocations)).toBe(true);
    });
  });

  describe('Summary', () => {
    it('should provide rebalancing summary', () => {
      const pattern = new TreasuryRebalancing(baseConfig);
      const summary = pattern.getSummary();

      expect(summary).toBeDefined();
      expect(summary.needsRebalancing).toBe(true);
      expect(summary.maxDeviation).toBeGreaterThan(0);
      expect(Array.isArray(summary.actions)).toBe(true);
    });

    it('should calculate max deviation correctly', () => {
      const pattern = new TreasuryRebalancing(baseConfig);
      const summary = pattern.getSummary();

      // SOL is 6% under, USDC is 6% over
      expect(summary.maxDeviation).toBe(6);
    });
  });

  describe('Value Updates', () => {
    it('should update current values', () => {
      const pattern = new TreasuryRebalancing(baseConfig);

      pattern.updateCurrentValues([
        { token: 'SOL', value: 450000 },
        { token: 'USDC', value: 350000 },
      ]);

      expect(pattern.config.allocations[0].currentValue).toBe(450000);
      expect(pattern.config.allocations[1].currentValue).toBe(350000);
    });

    it('should recalculate target values after update', () => {
      const pattern = new TreasuryRebalancing(baseConfig);

      pattern.updateCurrentValues([
        { token: 'SOL', value: 400000 },
      ]);

      expect(pattern.config.allocations[0].targetValue).toBe(400000);
    });

    it('should ignore updates for unknown tokens', () => {
      const pattern = new TreasuryRebalancing(baseConfig);
      const originalValue = pattern.config.allocations[0].currentValue;

      pattern.updateCurrentValues([
        { token: 'UNKNOWN', value: 999999 },
      ]);

      expect(pattern.config.allocations[0].currentValue).toBe(originalValue);
    });
  });

  describe('Rebalancing Actions', () => {
    it('should respect minimum trade size', async () => {
      const config = {
        ...baseConfig,
        minTradeSize: 100000, // High minimum
        allocations: [
          { token: solToken, targetPercent: 50, currentValue: 490000 }, // Only 10k difference
          { token: usdcToken, targetPercent: 50, currentValue: 510000 },
        ],
      };

      const pattern = new TreasuryRebalancing(config);
      const result = await pattern.execute();

      // Actions below minTradeSize should not be created
      expect(result.transactions.length).toBe(0);
    });

    it('should create actions for significant imbalances', async () => {
      const config = {
        ...baseConfig,
        minTradeSize: 10000,
        allocations: [
          { token: solToken, targetPercent: 50, currentValue: 300000 }, // 200k under
          { token: usdcToken, targetPercent: 50, currentValue: 700000 }, // 200k over
        ],
      };

      const pattern = new TreasuryRebalancing(config);
      const result = await pattern.execute();

      expect(result.transactions.length).toBeGreaterThan(0);
    });
  });

  describe('Guard Integration', () => {
    it('should execute with Guard when provided', async () => {
      const { Fabrknt } = await import('../../src/core/fabrknt');
      const guard = new Guard({ mode: 'block', maxSlippage: 0.02 });

      const pattern = new TreasuryRebalancing({
        ...baseConfig,
        guard,
        dryRun: false,
      });

      await pattern.execute();

      if (pattern.needsRebalancing()) {
        expect(Fabrknt.execute).toHaveBeenCalled();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle two-asset portfolio', async () => {
      const config = {
        ...baseConfig,
        allocations: [
          { token: solToken, targetPercent: 60, currentValue: 500000 },
          { token: usdcToken, targetPercent: 40, currentValue: 500000 },
        ],
      };

      const pattern = new TreasuryRebalancing(config);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle single-asset portfolio', async () => {
      const config = {
        ...baseConfig,
        allocations: [
          { token: solToken, targetPercent: 100, currentValue: 1000000 },
        ],
      };

      const pattern = new TreasuryRebalancing(config);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBe(0); // No rebalancing needed
    });

    it('should handle very small treasuries', async () => {
      const config = {
        ...baseConfig,
        totalValue: 1000,
        allocations: [
          { token: solToken, targetPercent: 50, currentValue: 450 },
          { token: usdcToken, targetPercent: 50, currentValue: 550 },
        ],
      };

      const pattern = new TreasuryRebalancing(config);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle very large treasuries', () => {
      const config = {
        ...baseConfig,
        totalValue: 1000000000, // $1B
        allocations: [
          { token: solToken, targetPercent: 50, currentValue: 450000000 },
          { token: usdcToken, targetPercent: 50, currentValue: 550000000 },
        ],
      };

      const pattern = new TreasuryRebalancing(config);

      expect(pattern.needsRebalancing()).toBe(true);
    });

    it('should handle very tight threshold', () => {
      const config = {
        ...baseConfig,
        threshold: 0.1, // 0.1% threshold
      };

      const pattern = new TreasuryRebalancing(config);

      expect(pattern.config.threshold).toBe(0.1);
    });
  });
});
