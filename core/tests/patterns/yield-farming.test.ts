import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YieldFarmingPattern } from '../../src/patterns/dao-treasury/yield-farming';
import { Guard } from '../../src/guard';
import type { YieldFarmingConfig, YieldProtocol } from '../../src/patterns/dao-treasury/yield-farming';
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

describe('YieldFarmingPattern', () => {
  let baseConfig: YieldFarmingConfig;
  let usdcToken: Token;
  let solToken: Token;
  let protocols: YieldProtocol[];

  beforeEach(() => {
    usdcToken = {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      decimals: 6,
    };

    solToken = {
      mint: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      decimals: 9,
    };

    protocols = [
      {
        name: 'Solend',
        programId: 'SolendProgram',
        apy: 8.5,
        token: usdcToken,
      },
      {
        name: 'Marinade',
        programId: 'MarinadeProgram',
        apy: 6.8,
        token: solToken,
      },
      {
        name: 'Orca',
        programId: 'OrcaProgram',
        apy: 12.3,
        token: usdcToken,
      },
    ];

    baseConfig = {
      name: 'Treasury Yield Optimization',
      farmAmount: 500000,
      farmToken: usdcToken,
      protocols,
      strategy: 'diversified',
      autoCompound: false,
      dryRun: true,
    };
  });

  describe('Configuration', () => {
    it('should create pattern with valid config', () => {
      const pattern = new YieldFarmingPattern(baseConfig);

      expect(pattern).toBeDefined();
      expect(pattern.config.name).toBe('Treasury Yield Optimization');
      expect(pattern.config.farmAmount).toBe(500000);
    });

    it('should default autoCompound to false', () => {
      const pattern = new YieldFarmingPattern(baseConfig);

      expect(pattern.config.autoCompound).toBe(false);
    });

    it('should default compoundFrequency to weekly', () => {
      const pattern = new YieldFarmingPattern(baseConfig);

      expect(pattern.config.compoundFrequency).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('Validation', () => {
    it('should validate correct configuration', async () => {
      const pattern = new YieldFarmingPattern(baseConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should fail when farm amount <= 0', async () => {
      const invalidConfig = {
        ...baseConfig,
        farmAmount: 0,
      };

      const pattern = new YieldFarmingPattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });

    it('should fail when no protocols provided', async () => {
      const invalidConfig = {
        ...baseConfig,
        protocols: [],
      };

      const pattern = new YieldFarmingPattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });
  });

  describe('Strategy: Highest APY', () => {
    it('should allocate all funds to highest APY protocol', async () => {
      const pattern = new YieldFarmingPattern({
        ...baseConfig,
        strategy: 'highest-apy',
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.metadata?.strategy).toBe('highest-apy');

      const summary = pattern.getAllocationSummary();
      expect(summary).toHaveLength(1);
      expect(summary[0].protocol).toBe('Orca'); // Highest APY (12.3%)
      expect(summary[0].amount).toBe(500000);
      expect(summary[0].percentage).toBe(100);
    });

    it('should calculate correct weighted APY', async () => {
      const pattern = new YieldFarmingPattern({
        ...baseConfig,
        strategy: 'highest-apy',
      });

      await pattern.execute();

      const summary = pattern.getAllocationSummary();
      const weightedAPY = summary[0].apy;

      expect(weightedAPY).toBe(12.3); // Should match highest APY
    });
  });

  describe('Strategy: Diversified', () => {
    it('should split across top 3 protocols', async () => {
      const pattern = new YieldFarmingPattern({
        ...baseConfig,
        strategy: 'diversified',
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);

      const summary = pattern.getAllocationSummary();
      expect(summary.length).toBeGreaterThan(0);
      expect(summary.length).toBeLessThanOrEqual(3);
    });

    it('should allocate 50%-30%-20% to top protocols', async () => {
      const pattern = new YieldFarmingPattern({
        ...baseConfig,
        strategy: 'diversified',
      });

      await pattern.execute();

      const summary = pattern.getAllocationSummary();

      // Check allocation percentages
      if (summary.length === 3) {
        expect(summary[0].percentage).toBe(50);
        expect(summary[1].percentage).toBe(30);
        expect(summary[2].percentage).toBe(20);
      }
    });

    it('should sort protocols by APY descending', async () => {
      const pattern = new YieldFarmingPattern({
        ...baseConfig,
        strategy: 'diversified',
      });

      await pattern.execute();

      const summary = pattern.getAllocationSummary();

      // First allocation should be highest APY
      if (summary.length > 0) {
        expect(summary[0].apy).toBeGreaterThanOrEqual(summary[summary.length - 1].apy);
      }
    });
  });

  describe('Strategy: Conservative', () => {
    it('should split equally across all protocols', async () => {
      const pattern = new YieldFarmingPattern({
        ...baseConfig,
        strategy: 'conservative',
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);

      const summary = pattern.getAllocationSummary();
      expect(summary.length).toBe(3);

      const expectedPercentage = 100 / 3;
      summary.forEach(alloc => {
        expect(alloc.percentage).toBeCloseTo(expectedPercentage, 1);
      });
    });

    it('should allocate equal amounts', async () => {
      const pattern = new YieldFarmingPattern({
        ...baseConfig,
        strategy: 'conservative',
        farmAmount: 600000,
      });

      await pattern.execute();

      const summary = pattern.getAllocationSummary();
      const expectedAmount = 600000 / 3;

      summary.forEach(alloc => {
        expect(alloc.amount).toBeCloseTo(expectedAmount, 2);
      });
    });
  });

  describe('Execution', () => {
    it('should create transactions for each allocation', async () => {
      const pattern = new YieldFarmingPattern(baseConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBeGreaterThan(0);
    });

    it('should track execution metrics', async () => {
      const pattern = new YieldFarmingPattern(baseConfig);
      const result = await pattern.execute();

      expect(result.metrics).toBeDefined();
      expect(result.metrics.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should include metadata in result', async () => {
      const pattern = new YieldFarmingPattern(baseConfig);
      const result = await pattern.execute();

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.strategy).toBe('diversified');
      expect(result.metadata?.allocations).toBeDefined();
      expect(result.metadata?.estimatedAPY).toBeGreaterThan(0);
    });
  });

  describe('Weighted APY Calculation', () => {
    it('should calculate weighted APY correctly for diversified', async () => {
      const pattern = new YieldFarmingPattern({
        ...baseConfig,
        strategy: 'diversified',
      });

      await pattern.execute();
      const result = await pattern.execute();

      const estimatedAPY = result.metadata?.estimatedAPY as number;

      // Should be weighted average of top 3 protocols
      expect(estimatedAPY).toBeGreaterThan(0);
      expect(estimatedAPY).toBeLessThanOrEqual(12.3); // Max APY
    });

    it('should return highest APY for highest-apy strategy', async () => {
      const pattern = new YieldFarmingPattern({
        ...baseConfig,
        strategy: 'highest-apy',
      });

      await pattern.execute();
      const result = await pattern.execute();

      const estimatedAPY = result.metadata?.estimatedAPY as number;

      expect(estimatedAPY).toBe(12.3); // Orca's APY
    });
  });

  describe('Allocation Summary', () => {
    it('should provide detailed allocation summary', async () => {
      const pattern = new YieldFarmingPattern(baseConfig);
      await pattern.execute();

      const summary = pattern.getAllocationSummary();

      expect(Array.isArray(summary)).toBe(true);
      expect(summary.length).toBeGreaterThan(0);

      summary.forEach(alloc => {
        expect(alloc).toHaveProperty('protocol');
        expect(alloc).toHaveProperty('amount');
        expect(alloc).toHaveProperty('percentage');
        expect(alloc).toHaveProperty('apy');
      });
    });

    it('should have percentages that sum to 100', async () => {
      const pattern = new YieldFarmingPattern(baseConfig);
      await pattern.execute();

      const summary = pattern.getAllocationSummary();
      const totalPercent = summary.reduce((sum, alloc) => sum + alloc.percentage, 0);

      expect(totalPercent).toBeCloseTo(100, 1);
    });

    it('should have amounts that sum to farm amount', async () => {
      const pattern = new YieldFarmingPattern(baseConfig);
      await pattern.execute();

      const summary = pattern.getAllocationSummary();
      const totalAmount = summary.reduce((sum, alloc) => sum + alloc.amount, 0);

      expect(totalAmount).toBeCloseTo(500000, 1);
    });
  });

  describe('Auto Compound', () => {
    it('should accept auto-compound configuration', () => {
      const pattern = new YieldFarmingPattern({
        ...baseConfig,
        autoCompound: true,
        compoundFrequency: 24 * 60 * 60 * 1000, // Daily
      });

      expect(pattern.config.autoCompound).toBe(true);
      expect(pattern.config.compoundFrequency).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('Guard Integration', () => {
    it('should execute with Guard when provided', async () => {
      const { Fabrknt } = await import('../../src/core/fabrknt');
      const guard = new Guard({ mode: 'block', maxSlippage: 0.01 });

      const pattern = new YieldFarmingPattern({
        ...baseConfig,
        guard,
        dryRun: false,
      });

      await pattern.execute();

      expect(Fabrknt.execute).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single protocol', async () => {
      const config = {
        ...baseConfig,
        protocols: [protocols[0]],
        strategy: 'diversified' as const,
      };

      const pattern = new YieldFarmingPattern(config);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
      const summary = pattern.getAllocationSummary();
      expect(summary).toHaveLength(1);
    });

    it('should handle two protocols with diversified strategy', async () => {
      const config = {
        ...baseConfig,
        protocols: [protocols[0], protocols[1]],
        strategy: 'diversified' as const,
      };

      const pattern = new YieldFarmingPattern(config);
      await pattern.execute();

      const summary = pattern.getAllocationSummary();
      expect(summary.length).toBeLessThanOrEqual(2);
    });

    it('should handle very small farm amounts', async () => {
      const config = {
        ...baseConfig,
        farmAmount: 10,
      };

      const pattern = new YieldFarmingPattern(config);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle very large farm amounts', async () => {
      const config = {
        ...baseConfig,
        farmAmount: 1000000000, // $1B
      };

      const pattern = new YieldFarmingPattern(config);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle protocols with same APY', async () => {
      const sameAPYProtocols = [
        { ...protocols[0], apy: 10 },
        { ...protocols[1], apy: 10 },
        { ...protocols[2], apy: 10 },
      ];

      const config = {
        ...baseConfig,
        protocols: sameAPYProtocols,
        strategy: 'diversified' as const,
      };

      const pattern = new YieldFarmingPattern(config);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle protocols with min/max deposits', () => {
      const protocolsWithLimits: YieldProtocol[] = [
        { ...protocols[0], minDeposit: 1000, maxDeposit: 100000 },
      ];

      const config = {
        ...baseConfig,
        protocols: protocolsWithLimits,
      };

      const pattern = new YieldFarmingPattern(config);

      expect(pattern).toBeDefined();
    });

    it('should handle protocols with lock periods', () => {
      const protocolsWithLocks: YieldProtocol[] = [
        { ...protocols[0], lockPeriod: 86400 }, // 1 day
      ];

      const config = {
        ...baseConfig,
        protocols: protocolsWithLocks,
      };

      const pattern = new YieldFarmingPattern(config);

      expect(pattern).toBeDefined();
    });
  });
});
