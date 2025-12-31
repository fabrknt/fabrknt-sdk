import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LiquidityPattern } from '../../src/patterns/defi/liquidity-pattern';
import { Guard } from '../../src/guard';
import type { LiquidityConfig, LiquidityPool } from '../../src/patterns/defi/liquidity-pattern';
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

describe('LiquidityPattern', () => {
  let solToken: Token;
  let usdcToken: Token;
  let pool: LiquidityPool;
  let prices: { tokenA: Price; tokenB: Price };
  let addConfig: LiquidityConfig;
  let removeConfig: LiquidityConfig;
  let rebalanceConfig: LiquidityConfig;

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

    pool = {
      name: 'Orca SOL-USDC',
      programId: 'OrcaProgram',
      tokenA: solToken,
      tokenB: usdcToken,
      apy: 12.5,
      feeTier: 0.003,
      totalLiquidity: 5000000,
      priceRatio: 100, // 1 SOL = 100 USDC
    };

    prices = {
      tokenA: {
        token: 'SOL',
        price: 100,
        quoteCurrency: 'USDC',
        timestamp: Date.now(),
      },
      tokenB: {
        token: 'USDC',
        price: 1,
        quoteCurrency: 'USD',
        timestamp: Date.now(),
      },
    };

    addConfig = {
      name: 'Add SOL-USDC Liquidity',
      action: 'add',
      pool,
      amountA: 10,
      amountB: 1000,
      prices,
      dryRun: true,
    };

    removeConfig = {
      name: 'Remove Liquidity',
      action: 'remove',
      pool,
      removePercentage: 50,
      prices,
      dryRun: true,
    };

    rebalanceConfig = {
      name: 'Rebalance Position',
      action: 'rebalance',
      pool,
      prices,
      dryRun: true,
    };
  });

  describe('Configuration', () => {
    it('should create pattern for adding liquidity', () => {
      const pattern = new LiquidityPattern(addConfig);

      expect(pattern).toBeDefined();
      expect(pattern.config.name).toBe('Add SOL-USDC Liquidity');
      expect(pattern.config.action).toBe('add');
    });

    it('should create pattern for removing liquidity', () => {
      const pattern = new LiquidityPattern(removeConfig);

      expect(pattern).toBeDefined();
      expect(pattern.config.action).toBe('remove');
    });

    it('should create pattern for rebalancing', () => {
      const pattern = new LiquidityPattern(rebalanceConfig);

      expect(pattern).toBeDefined();
      expect(pattern.config.action).toBe('rebalance');
    });

    it('should default monitorImpermanentLoss to true', () => {
      const pattern = new LiquidityPattern(addConfig);

      expect(pattern.config.monitorImpermanentLoss).toBe(true);
    });

    it('should default rebalanceThreshold to 5%', () => {
      const pattern = new LiquidityPattern(addConfig);

      expect(pattern.config.rebalanceThreshold).toBe(5);
    });
  });

  describe('Validation - Add Action', () => {
    it('should validate correct add configuration', async () => {
      const pattern = new LiquidityPattern(addConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should fail when amountA is missing', async () => {
      const invalidConfig = { ...addConfig };
      delete invalidConfig.amountA;

      const pattern = new LiquidityPattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });

    it('should fail when amountB is missing', async () => {
      const invalidConfig = { ...addConfig };
      delete invalidConfig.amountB;

      const pattern = new LiquidityPattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });

    it('should fail when amountA <= 0', async () => {
      const invalidConfig = {
        ...addConfig,
        amountA: 0,
      };

      const pattern = new LiquidityPattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });

    it('should fail when amountB <= 0', async () => {
      const invalidConfig = {
        ...addConfig,
        amountB: 0,
      };

      const pattern = new LiquidityPattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });

    it('should warn when amounts deviate from pool ratio', async () => {
      const invalidRatioConfig = {
        ...addConfig,
        amountA: 10,
        amountB: 500, // Should be 1000 (ratio mismatch)
      };

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const pattern = new LiquidityPattern(invalidRatioConfig);
      await pattern.execute();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Validation - Remove Action', () => {
    it('should validate correct remove configuration', async () => {
      const pattern = new LiquidityPattern(removeConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should fail when removePercentage is missing', async () => {
      const invalidConfig = { ...removeConfig };
      delete invalidConfig.removePercentage;

      const pattern = new LiquidityPattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });

    it('should fail when removePercentage <= 0', async () => {
      const invalidConfig = {
        ...removeConfig,
        removePercentage: 0,
      };

      const pattern = new LiquidityPattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });

    it('should fail when removePercentage > 100', async () => {
      const invalidConfig = {
        ...removeConfig,
        removePercentage: 150,
      };

      const pattern = new LiquidityPattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });
  });

  describe('Add Liquidity', () => {
    it('should add liquidity to pool', async () => {
      const pattern = new LiquidityPattern(addConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1);
      expect(result.metadata?.action).toBe('add');
    });

    it('should create position after adding liquidity', async () => {
      const pattern = new LiquidityPattern(addConfig);
      await pattern.execute();

      const position = pattern.getPositionSummary();

      expect(position).toBeDefined();
      expect(position?.amountA).toBe(10);
      expect(position?.amountB).toBe(1000);
      expect(position?.initialValue).toBe(2000); // 10*100 + 1000*1
      expect(position?.impermanentLoss).toBe(0);
    });
  });

  describe('Remove Liquidity', () => {
    it('should remove liquidity from pool', async () => {
      const pattern = new LiquidityPattern(removeConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1);
      expect(result.metadata?.action).toBe('remove');
    });

    it('should remove partial liquidity', async () => {
      const pattern = new LiquidityPattern({
        ...removeConfig,
        removePercentage: 25,
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should remove all liquidity', async () => {
      const pattern = new LiquidityPattern({
        ...removeConfig,
        removePercentage: 100,
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });
  });

  describe('Rebalance Position', () => {
    it('should rebalance liquidity position', async () => {
      const pattern = new LiquidityPattern(rebalanceConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions.length).toBeGreaterThan(0);
      expect(result.metadata?.action).toBe('rebalance');
    });
  });

  describe('Impermanent Loss Calculation', () => {
    it('should calculate impermanent loss', () => {
      const pattern = new LiquidityPattern(addConfig);

      // Initial price ratio is 100
      const il = pattern.calculateImpermanentLoss(100);

      expect(il).toBe(0); // No price change = no IL
    });

    it('should calculate positive IL when price increases', async () => {
      const pattern = new LiquidityPattern(addConfig);

      // First create a position by executing
      await pattern.execute();

      // Price doubles (100 -> 200)
      const il = pattern.calculateImpermanentLoss(200);

      expect(il).toBeLessThan(0); // IL is negative (loss)
    });

    it('should calculate positive IL when price decreases', async () => {
      const pattern = new LiquidityPattern(addConfig);

      // First create a position by executing
      await pattern.execute();

      // Price halves (100 -> 50)
      const il = pattern.calculateImpermanentLoss(50);

      expect(il).toBeLessThan(0); // IL is negative (loss)
    });

    it('should return 0 when no position exists', () => {
      const pattern = new LiquidityPattern(removeConfig);

      const il = pattern.calculateImpermanentLoss(150);

      expect(il).toBe(0);
    });
  });

  describe('Position Updates', () => {
    it('should update position with current prices', async () => {
      const pattern = new LiquidityPattern(addConfig);
      await pattern.execute();

      const newPrices = {
        tokenA: { ...prices.tokenA, price: 150 },
        tokenB: prices.tokenB,
      };

      pattern.updatePosition(newPrices);

      const position = pattern.getPositionSummary();

      expect(position?.currentValue).toBe(2500); // 10*150 + 1000*1
      expect(position?.impermanentLoss).not.toBe(0);
    });

    it('should calculate IL after position update', async () => {
      const pattern = new LiquidityPattern(addConfig);
      await pattern.execute();

      pattern.updatePosition({
        tokenA: { ...prices.tokenA, price: 200 },
        tokenB: prices.tokenB,
      });

      const position = pattern.getPositionSummary();

      expect(position?.impermanentLoss).toBeLessThan(0);
    });

    it('should not update when no position exists', () => {
      const pattern = new LiquidityPattern(removeConfig);

      pattern.updatePosition({
        tokenA: { ...prices.tokenA, price: 200 },
        tokenB: prices.tokenB,
      });

      const position = pattern.getPositionSummary();

      expect(position).toBeNull();
    });
  });

  describe('Rebalancing Detection', () => {
    it('should not need rebalancing when IL is low', async () => {
      const pattern = new LiquidityPattern({
        ...addConfig,
        rebalanceThreshold: 10,
      });

      await pattern.execute();

      // Small price change
      pattern.updatePosition({
        tokenA: { ...prices.tokenA, price: 105 },
        tokenB: prices.tokenB,
      });

      expect(pattern.needsRebalancing()).toBe(false);
    });

    it('should need rebalancing when IL exceeds threshold', async () => {
      const pattern = new LiquidityPattern({
        ...addConfig,
        rebalanceThreshold: 1, // Low threshold
      });

      await pattern.execute();

      // Large price change
      pattern.updatePosition({
        tokenA: { ...prices.tokenA, price: 200 },
        tokenB: prices.tokenB,
      });

      expect(pattern.needsRebalancing()).toBe(true);
    });

    it('should not need rebalancing when monitoring disabled', async () => {
      const pattern = new LiquidityPattern({
        ...addConfig,
        monitorImpermanentLoss: false,
      });

      await pattern.execute();

      pattern.updatePosition({
        tokenA: { ...prices.tokenA, price: 200 },
        tokenB: prices.tokenB,
      });

      expect(pattern.needsRebalancing()).toBe(false);
    });
  });

  describe('Position Summary', () => {
    it('should return null when no position exists', () => {
      const pattern = new LiquidityPattern(removeConfig);

      const summary = pattern.getPositionSummary();

      expect(summary).toBeNull();
    });

    it('should return position summary after adding liquidity', async () => {
      const pattern = new LiquidityPattern(addConfig);
      await pattern.execute();

      const summary = pattern.getPositionSummary();

      expect(summary).not.toBeNull();
      expect(summary?.pool).toEqual(pool);
      expect(summary?.amountA).toBe(10);
      expect(summary?.amountB).toBe(1000);
    });
  });

  describe('Execution Metadata', () => {
    it('should include position in metadata', async () => {
      const pattern = new LiquidityPattern(addConfig);
      const result = await pattern.execute();

      expect(result.metadata?.position).toBeDefined();
      expect(result.metadata?.impermanentLoss).toBe(0);
    });

    it('should include pool name in metadata', async () => {
      const pattern = new LiquidityPattern(addConfig);
      const result = await pattern.execute();

      expect(result.metadata?.pool).toBe('Orca SOL-USDC');
    });
  });

  describe('Guard Integration', () => {
    it('should execute with Guard when provided', async () => {
      const { Fabrknt } = await import('../../src/core/fabrknt');
      const guard = new Guard({ mode: 'block', maxSlippage: 0.01 });

      const pattern = new LiquidityPattern({
        ...addConfig,
        guard,
        dryRun: false,
      });

      await pattern.execute();

      expect(Fabrknt.execute).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small liquidity amounts', async () => {
      const pattern = new LiquidityPattern({
        ...addConfig,
        amountA: 0.01,
        amountB: 1,
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle very large liquidity amounts', async () => {
      const pattern = new LiquidityPattern({
        ...addConfig,
        amountA: 1000000,
        amountB: 100000000,
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle extreme price changes', async () => {
      const pattern = new LiquidityPattern(addConfig);
      await pattern.execute();

      pattern.updatePosition({
        tokenA: { ...prices.tokenA, price: 1000 }, // 10x increase
        tokenB: prices.tokenB,
      });

      const position = pattern.getPositionSummary();

      expect(position?.impermanentLoss).toBeLessThan(0);
    });

    it('should handle price ratio of 1:1', async () => {
      const equalPricePool = {
        ...pool,
        priceRatio: 1,
      };

      const pattern = new LiquidityPattern({
        ...addConfig,
        pool: equalPricePool,
        amountA: 100,
        amountB: 100,
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle very high rebalance threshold', async () => {
      const pattern = new LiquidityPattern({
        ...addConfig,
        rebalanceThreshold: 50,
      });

      await pattern.execute();

      pattern.updatePosition({
        tokenA: { ...prices.tokenA, price: 200 },
        tokenB: prices.tokenB,
      });

      expect(pattern.needsRebalancing()).toBe(false);
    });

    it('should handle remove 1% of liquidity', async () => {
      const pattern = new LiquidityPattern({
        ...removeConfig,
        removePercentage: 1,
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });
  });
});
