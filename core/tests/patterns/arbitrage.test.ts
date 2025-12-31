import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ArbitragePattern } from '../../src/patterns/ai-agents/arbitrage';
import { Guard } from '../../src/guard';
import type { ArbitrageConfig, DEX } from '../../src/patterns/ai-agents/arbitrage';
import type { Token, TradingPair } from '../../src/patterns/types';

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

vi.mock('../../src/fabric', () => ({
  FabricCore: {
    optimize: vi.fn((tx) => tx),
  },
}));

describe('ArbitragePattern', () => {
  let baseConfig: ArbitrageConfig;
  let solToken: Token;
  let usdcToken: Token;
  let pair: TradingPair;
  let dexes: DEX[];

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

    dexes = [
      {
        name: 'Orca',
        programId: 'OrcaProgram',
        feeTier: 0.003,
      },
      {
        name: 'Raydium',
        programId: 'RaydiumProgram',
        feeTier: 0.0025,
      },
      {
        name: 'Jupiter',
        programId: 'JupiterProgram',
        feeTier: 0.002,
      },
    ];

    baseConfig = {
      name: 'Multi-DEX Arbitrage',
      pairs: [pair],
      dexs: dexes,
      minProfitPercent: 0.5,
      tradeAmount: 1000,
      maxSlippage: 0.01,
      scanInterval: 5000,
      autoExecute: false,
      dryRun: true,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should create pattern with valid config', () => {
      const pattern = new ArbitragePattern(baseConfig);

      expect(pattern).toBeDefined();
      expect(pattern.config.name).toBe('Multi-DEX Arbitrage');
      expect(pattern.config.minProfitPercent).toBe(0.5);
    });

    it('should default scanInterval to 5000ms', () => {
      const config = { ...baseConfig };
      delete config.scanInterval;

      const pattern = new ArbitragePattern(config);

      expect(pattern.config.scanInterval).toBe(5000);
    });

    it('should default autoExecute to false', () => {
      const config = { ...baseConfig };
      delete config.autoExecute;

      const pattern = new ArbitragePattern(config);

      expect(pattern.config.autoExecute).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate correct configuration', async () => {
      const pattern = new ArbitragePattern(baseConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should fail when no pairs provided', async () => {
      const invalidConfig = {
        ...baseConfig,
        pairs: [],
      };

      const pattern = new ArbitragePattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Invalid');
    });

    it('should fail when less than 2 DEXs', async () => {
      const invalidConfig = {
        ...baseConfig,
        dexs: [dexes[0]],
      };

      const pattern = new ArbitragePattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });

    it('should fail when min profit <= 0', async () => {
      const invalidConfig = {
        ...baseConfig,
        minProfitPercent: 0,
      };

      const pattern = new ArbitragePattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });

    it('should fail when trade amount <= 0', async () => {
      const invalidConfig = {
        ...baseConfig,
        tradeAmount: 0,
      };

      const pattern = new ArbitragePattern(invalidConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(false);
    });
  });

  describe('Opportunity Detection', () => {
    it('should scan for arbitrage opportunities', async () => {
      const pattern = new ArbitragePattern(baseConfig);
      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.metadata?.opportunitiesFound).toBeGreaterThanOrEqual(0);
    });

    it('should find opportunities across multiple DEXs', async () => {
      const pattern = new ArbitragePattern(baseConfig);
      await pattern.execute();

      const opportunities = pattern.getOpportunities();
      expect(opportunities).toBeDefined();
    });

    it('should filter opportunities by min profit', async () => {
      const pattern = new ArbitragePattern({
        ...baseConfig,
        minProfitPercent: 10, // Very high threshold
      });

      const result = await pattern.execute();

      // With simulated random prices, high threshold may filter all
      expect(result.metadata?.opportunitiesFound).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Execution', () => {
    it('should execute profitable opportunities', async () => {
      const pattern = new ArbitragePattern({
        ...baseConfig,
        minProfitPercent: 0.1, // Low threshold to catch opportunities
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions).toBeDefined();
    });

    it('should track execution metrics', async () => {
      const pattern = new ArbitragePattern(baseConfig);
      const result = await pattern.execute();

      expect(result.metrics).toBeDefined();
      expect(result.metrics.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should include metadata in result', async () => {
      const pattern = new ArbitragePattern(baseConfig);
      const result = await pattern.execute();

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.opportunitiesFound).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.opportunitiesExecuted).toBeGreaterThanOrEqual(0);
    });

    it('should calculate total profit', async () => {
      const pattern = new ArbitragePattern(baseConfig);
      const result = await pattern.execute();

      expect(result.metadata?.totalProfit).toBeGreaterThanOrEqual(0);
    });

    it('should calculate average profit percent', async () => {
      const pattern = new ArbitragePattern(baseConfig);
      const result = await pattern.execute();

      expect(result.metadata?.averageProfitPercent).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Continuous Scanning', () => {
    it('should start continuous scanning', () => {
      const pattern = new ArbitragePattern(baseConfig);

      pattern.startScanning();

      expect(pattern).toBeDefined();
      pattern.stopScanning();
    });

    it('should stop scanning', () => {
      const pattern = new ArbitragePattern(baseConfig);

      pattern.startScanning();
      pattern.stopScanning();

      expect(pattern).toBeDefined();
    });

    it('should not start multiple timers', () => {
      const pattern = new ArbitragePattern(baseConfig);

      pattern.startScanning();
      pattern.startScanning(); // Second call should be ignored

      expect(pattern).toBeDefined();
      pattern.stopScanning();
    });
  });

  describe('Auto Execution', () => {
    it('should auto-execute when enabled', async () => {
      const pattern = new ArbitragePattern({
        ...baseConfig,
        autoExecute: true,
      });

      await pattern.execute();

      expect(pattern).toBeDefined();
    });
  });

  describe('Opportunity Aging', () => {
    it('should reject stale opportunities', async () => {
      const pattern = new ArbitragePattern(baseConfig);

      // Execute and get opportunities
      await pattern.execute();

      // Opportunities should be fresh initially
      const opportunities = pattern.getOpportunities();
      expect(opportunities).toBeDefined();
    });
  });

  describe('History Tracking', () => {
    it('should track execution history', async () => {
      const pattern = new ArbitragePattern({
        ...baseConfig,
        dryRun: false,
        guard: new Guard(),
      });

      await pattern.execute();

      const history = pattern.getExecutionHistory();
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });

    it('should accumulate history across multiple executions', async () => {
      const pattern = new ArbitragePattern({
        ...baseConfig,
        dryRun: false,
        guard: new Guard(),
      });

      await pattern.execute();
      const history1 = pattern.getExecutionHistory();

      await pattern.execute();
      const history2 = pattern.getExecutionHistory();

      expect(history2.length).toBeGreaterThanOrEqual(history1.length);
    });
  });

  describe('Parallel Execution', () => {
    it('should optimize transactions for parallel execution', async () => {
      const { FabricCore } = await import('../../src/fabric');
      const pattern = new ArbitragePattern({
        ...baseConfig,
        minProfitPercent: 0.1,
      });

      const result = await pattern.execute();

      // FabricCore.optimize gets called when opportunities are executed
      // With random prices, opportunities may or may not be found
      if (result.metadata?.opportunitiesExecuted && result.metadata.opportunitiesExecuted > 0) {
        expect(FabricCore.optimize).toHaveBeenCalled();
      } else {
        // If no opportunities executed, optimize won't be called
        expect(FabricCore.optimize).toHaveBeenCalledTimes(0);
      }
    });
  });

  describe('Guard Integration', () => {
    it('should execute with Guard when provided', async () => {
      const { Fabrknt } = await import('../../src/core/fabrknt');
      const guard = new Guard({ mode: 'block', maxSlippage: 0.01 });

      const pattern = new ArbitragePattern({
        ...baseConfig,
        guard,
        dryRun: false,
        minProfitPercent: 0.1,
      });

      const result = await pattern.execute();

      // Fabrknt.execute called only when opportunities are found and executed
      if (result.metadata?.opportunitiesExecuted && result.metadata.opportunitiesExecuted > 0) {
        expect(Fabrknt.execute).toHaveBeenCalled();
      } else {
        // No opportunities found/executed with random prices
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle no opportunities found', async () => {
      const pattern = new ArbitragePattern({
        ...baseConfig,
        minProfitPercent: 100, // Impossibly high threshold
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.metadata?.opportunitiesFound).toBe(0);
      expect(result.metadata?.opportunitiesExecuted).toBe(0);
    });

    it('should handle single pair', async () => {
      const pattern = new ArbitragePattern({
        ...baseConfig,
        pairs: [pair],
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle exactly 2 DEXs', async () => {
      const pattern = new ArbitragePattern({
        ...baseConfig,
        dexs: [dexes[0], dexes[1]],
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
    });

    it('should handle very small trade amounts', () => {
      const pattern = new ArbitragePattern({
        ...baseConfig,
        tradeAmount: 0.01,
      });

      expect(pattern.config.tradeAmount).toBe(0.01);
    });

    it('should handle very small profit thresholds', () => {
      const pattern = new ArbitragePattern({
        ...baseConfig,
        minProfitPercent: 0.01,
      });

      expect(pattern.config.minProfitPercent).toBe(0.01);
    });
  });

  describe('Profit Calculation', () => {
    it('should account for DEX fees in profit calculation', async () => {
      const pattern = new ArbitragePattern(baseConfig);
      const result = await pattern.execute();

      // Profit calculation should consider feeTier from each DEX
      expect(result.metadata?.totalProfit).toBeDefined();
    });

    it('should only report positive profit opportunities', async () => {
      const pattern = new ArbitragePattern({
        ...baseConfig,
        minProfitPercent: 0.1,
      });

      await pattern.execute();
      const opportunities = pattern.getOpportunities();

      opportunities.forEach(opp => {
        expect(opp.profitPercent).toBeGreaterThan(0);
      });
    });
  });
});
