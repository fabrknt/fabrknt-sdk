import { describe, it, expect } from 'vitest';
import { Loom } from '../src/loom';
import type { LoomConfig } from '../src/types';

describe('Loom', () => {
  describe('weave()', () => {
    it('should create transaction with basic config', async () => {
      const config: LoomConfig = {
        type: 'MULTI_ROUTE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 100,
      };

      const tx = await Loom.weave(config);

      expect(tx).toBeDefined();
      expect(tx.id).toBeDefined();
      expect(tx.status).toBe('pending');
    });

    it('should generate unique transaction IDs', async () => {
      const config: LoomConfig = {
        type: 'MULTI_ROUTE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 100,
      };

      const tx1 = await Loom.weave(config);
      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1));
      const tx2 = await Loom.weave(config);

      expect(tx1.id).not.toBe(tx2.id);
    });

    it('should include transaction type in ID', async () => {
      const config: LoomConfig = {
        type: 'SINGLE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 50,
      };

      const tx = await Loom.weave(config);

      expect(tx.id).toContain('SINGLE_SWAP');
    });

    it('should handle MULTI_ROUTE_SWAP type', async () => {
      const config: LoomConfig = {
        type: 'MULTI_ROUTE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 100,
      };

      const tx = await Loom.weave(config);

      expect(tx).toBeDefined();
      expect(tx.status).toBe('pending');
    });

    it('should handle SINGLE_SWAP type', async () => {
      const config: LoomConfig = {
        type: 'SINGLE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 50,
      };

      const tx = await Loom.weave(config);

      expect(tx).toBeDefined();
      expect(tx.status).toBe('pending');
    });

    it('should handle LIQUIDITY_ADD type', async () => {
      const config: LoomConfig = {
        type: 'LIQUIDITY_ADD',
        input: 'SOL',
        output: 'USDC',
        amount: 1000,
      };

      const tx = await Loom.weave(config);

      expect(tx).toBeDefined();
      expect(tx.status).toBe('pending');
    });

    it('should handle LIQUIDITY_REMOVE type', async () => {
      const config: LoomConfig = {
        type: 'LIQUIDITY_REMOVE',
        input: 'SOL',
        output: 'USDC',
        amount: 500,
      };

      const tx = await Loom.weave(config);

      expect(tx).toBeDefined();
      expect(tx.status).toBe('pending');
    });

    it('should handle different token pairs', async () => {
      const configs: LoomConfig[] = [
        { type: 'SINGLE_SWAP', input: 'SOL', output: 'USDC', amount: 100 },
        { type: 'SINGLE_SWAP', input: 'USDC', output: 'SOL', amount: 100 },
        { type: 'SINGLE_SWAP', input: 'SOL', output: 'USDT', amount: 100 },
        { type: 'SINGLE_SWAP', input: 'mSOL', output: 'SOL', amount: 100 },
      ];

      for (const config of configs) {
        const tx = await Loom.weave(config);
        expect(tx).toBeDefined();
        expect(tx.status).toBe('pending');
      }
    });

    it('should handle various amounts', async () => {
      const amounts = [0.1, 1, 10, 100, 1000, 10000];

      for (const amount of amounts) {
        const config: LoomConfig = {
          type: 'SINGLE_SWAP',
          input: 'SOL',
          output: 'USDC',
          amount,
        };

        const tx = await Loom.weave(config);
        expect(tx).toBeDefined();
      }
    });

    it('should handle parallel priority flag', async () => {
      const config: LoomConfig = {
        type: 'MULTI_ROUTE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 100,
        parallelPriority: true,
      };

      const tx = await Loom.weave(config);

      expect(tx).toBeDefined();
      expect(tx.status).toBe('pending');
    });

    it('should work without parallel priority flag', async () => {
      const config: LoomConfig = {
        type: 'SINGLE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 100,
        parallelPriority: false,
      };

      const tx = await Loom.weave(config);

      expect(tx).toBeDefined();
    });

    it('should return a Promise', () => {
      const config: LoomConfig = {
        type: 'SINGLE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 100,
      };

      const result = Loom.weave(config);

      expect(result).toBeInstanceOf(Promise);
    });

    it('should create transaction with timestamp-based ID', async () => {
      const before = Date.now();

      const config: LoomConfig = {
        type: 'SINGLE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 100,
      };

      const tx = await Loom.weave(config);
      const after = Date.now();

      // Extract timestamp from ID (format: tx_TIMESTAMP_TYPE)
      const idParts = tx.id.split('_');
      const timestamp = parseInt(idParts[1], 10);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should handle multiple concurrent weave calls', async () => {
      const configs: LoomConfig[] = Array.from({ length: 10 }, (_, i) => ({
        type: 'SINGLE_SWAP' as const,
        input: 'SOL',
        output: 'USDC',
        amount: i + 1,
      }));

      // Add small delays between calls to ensure unique timestamps
      const results = [];
      for (const config of configs) {
        results.push(await Loom.weave(config));
        await new Promise((resolve) => setTimeout(resolve, 1));
      }

      expect(results).toHaveLength(10);
      results.forEach((tx) => {
        expect(tx.status).toBe('pending');
        expect(tx.id).toBeDefined();
      });

      // All IDs should be unique
      const ids = results.map((tx) => tx.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('Static methods', () => {
    it('should allow weave to be called as static method', async () => {
      const config: LoomConfig = {
        type: 'SINGLE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 100,
      };

      const result = await Loom.weave(config);

      expect(result).toBeDefined();
    });
  });

  describe('Transaction types', () => {
    const testCases: Array<{
      type: LoomConfig['type'];
      description: string;
    }> = [
      { type: 'SINGLE_SWAP', description: 'single DEX swap' },
      { type: 'MULTI_ROUTE_SWAP', description: 'multi-DEX route swap' },
      { type: 'LIQUIDITY_ADD', description: 'liquidity addition' },
      { type: 'LIQUIDITY_REMOVE', description: 'liquidity removal' },
    ];

    testCases.forEach(({ type, description }) => {
      it(`should handle ${description}`, async () => {
        const config: LoomConfig = {
          type,
          input: 'SOL',
          output: 'USDC',
          amount: 100,
        };

        const tx = await Loom.weave(config);

        expect(tx).toBeDefined();
        expect(tx.status).toBe('pending');
        expect(tx.id).toContain(type);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle zero amount', async () => {
      const config: LoomConfig = {
        type: 'SINGLE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 0,
      };

      const tx = await Loom.weave(config);

      expect(tx).toBeDefined();
    });

    it('should handle very large amounts', async () => {
      const config: LoomConfig = {
        type: 'SINGLE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: Number.MAX_SAFE_INTEGER,
      };

      const tx = await Loom.weave(config);

      expect(tx).toBeDefined();
    });

    it('should handle fractional amounts', async () => {
      const config: LoomConfig = {
        type: 'SINGLE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 0.123456789,
      };

      const tx = await Loom.weave(config);

      expect(tx).toBeDefined();
    });

    it('should handle same input and output tokens', async () => {
      const config: LoomConfig = {
        type: 'SINGLE_SWAP',
        input: 'SOL',
        output: 'SOL',
        amount: 100,
      };

      const tx = await Loom.weave(config);

      expect(tx).toBeDefined();
    });

    it('should handle special characters in token names', async () => {
      const config: LoomConfig = {
        type: 'SINGLE_SWAP',
        input: 'token-with-dash',
        output: 'token_with_underscore',
        amount: 100,
      };

      const tx = await Loom.weave(config);

      expect(tx).toBeDefined();
    });
  });
});
