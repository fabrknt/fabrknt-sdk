import { describe, it, expect } from 'vitest';
import { FabricCore } from '../src/fabric';
import type { Transaction } from '../src/types';

describe('FabricCore', () => {
  describe('optimize()', () => {
    let baseTx: Transaction;

    beforeEach(() => {
      baseTx = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: 'Program1',
            keys: [],
            data: Buffer.from([1, 2, 3]).toString('base64'),
          },
        ],
      };
    });

    it('should return transaction unchanged without privacy', () => {
      const result = FabricCore.optimize(baseTx);

      expect(result).toEqual(baseTx);
      expect(result.privacyMetadata).toBeUndefined();
    });

    it('should add privacy metadata when privacy is enabled', () => {
      const result = FabricCore.optimize(baseTx, {
        enablePrivacy: true,
      });

      expect(result.privacyMetadata).toBeDefined();
      expect(result.privacyMetadata?.requiresPrivacy).toBe(true);
      expect(result.privacyMetadata?.compressionEnabled).toBe(true);
    });

    it('should preserve original transaction data', () => {
      const result = FabricCore.optimize(baseTx, {
        enablePrivacy: true,
      });

      expect(result.id).toBe(baseTx.id);
      expect(result.status).toBe(baseTx.status);
      expect(result.instructions).toEqual(baseTx.instructions);
    });

    it('should accept low compression level', () => {
      const result = FabricCore.optimize(baseTx, {
        enablePrivacy: true,
        compressionLevel: 'low',
      });

      expect(result.privacyMetadata).toBeDefined();
    });

    it('should accept medium compression level', () => {
      const result = FabricCore.optimize(baseTx, {
        enablePrivacy: true,
        compressionLevel: 'medium',
      });

      expect(result.privacyMetadata).toBeDefined();
    });

    it('should accept high compression level', () => {
      const result = FabricCore.optimize(baseTx, {
        enablePrivacy: true,
        compressionLevel: 'high',
      });

      expect(result.privacyMetadata).toBeDefined();
    });

    it('should accept arbor privacy provider', () => {
      const result = FabricCore.optimize(baseTx, {
        enablePrivacy: true,
        privacyProvider: 'arbor',
      });

      expect(result.privacyMetadata).toBeDefined();
    });

    it('should accept light privacy provider', () => {
      const result = FabricCore.optimize(baseTx, {
        enablePrivacy: true,
        privacyProvider: 'light',
      });

      expect(result.privacyMetadata).toBeDefined();
    });

    it('should handle transaction with existing metadata', () => {
      const txWithMetadata: Transaction = {
        ...baseTx,
        metadata: { custom: 'data' },
      };

      const result = FabricCore.optimize(txWithMetadata, {
        enablePrivacy: true,
      });

      expect(result.metadata).toEqual({ custom: 'data' });
      expect(result.privacyMetadata).toBeDefined();
    });

    it('should handle empty options object', () => {
      const result = FabricCore.optimize(baseTx, {});

      expect(result).toEqual(baseTx);
    });

    it('should not modify privacy when enablePrivacy is false', () => {
      const result = FabricCore.optimize(baseTx, {
        enablePrivacy: false,
        compressionLevel: 'high',
      });

      expect(result.privacyMetadata).toBeUndefined();
    });
  });

  describe('compressWithArbor()', () => {
    let baseTx: Transaction;

    beforeEach(() => {
      baseTx = {
        id: 'compress-tx',
        status: 'pending',
        instructions: [],
      };
    });

    it('should compress transaction with default config', async () => {
      const result = await FabricCore.compressWithArbor(baseTx);

      expect(result.privacyMetadata).toBeDefined();
      expect(result.privacyMetadata?.requiresPrivacy).toBe(true);
      expect(result.privacyMetadata?.compressionEnabled).toBe(true);
    });

    it('should preserve original transaction data', async () => {
      const result = await FabricCore.compressWithArbor(baseTx);

      expect(result.id).toBe(baseTx.id);
      expect(result.status).toBe(baseTx.status);
      expect(result.instructions).toEqual(baseTx.instructions);
    });

    it('should accept low compression level', async () => {
      const result = await FabricCore.compressWithArbor(baseTx, {
        compressionLevel: 'low',
      });

      expect(result.privacyMetadata).toBeDefined();
    });

    it('should accept medium compression level', async () => {
      const result = await FabricCore.compressWithArbor(baseTx, {
        compressionLevel: 'medium',
      });

      expect(result.privacyMetadata).toBeDefined();
    });

    it('should accept high compression level', async () => {
      const result = await FabricCore.compressWithArbor(baseTx, {
        compressionLevel: 'high',
      });

      expect(result.privacyMetadata).toBeDefined();
    });

    it('should accept arbor provider', async () => {
      const result = await FabricCore.compressWithArbor(baseTx, {
        provider: 'arbor',
      });

      expect(result.privacyMetadata).toBeDefined();
    });

    it('should accept light provider', async () => {
      const result = await FabricCore.compressWithArbor(baseTx, {
        provider: 'light',
      });

      expect(result.privacyMetadata).toBeDefined();
    });

    it('should handle transaction with existing metadata', async () => {
      const txWithMetadata: Transaction = {
        ...baseTx,
        metadata: { original: 'value' },
      };

      const result = await FabricCore.compressWithArbor(txWithMetadata);

      expect(result.metadata).toEqual({ original: 'value' });
      expect(result.privacyMetadata).toBeDefined();
    });

    it('should return a Promise', () => {
      const result = FabricCore.compressWithArbor(baseTx);

      expect(result).toBeInstanceOf(Promise);
    });

    it('should handle empty config', async () => {
      const result = await FabricCore.compressWithArbor(baseTx, {});

      expect(result.privacyMetadata).toBeDefined();
    });

    it('should work with complex transactions', async () => {
      const complexTx: Transaction = {
        id: 'complex-tx',
        status: 'pending',
        instructions: [
          {
            programId: 'Program1',
            keys: [],
            data: Buffer.from([1, 2, 3]).toString('base64'),
          },
          {
            programId: 'Program2',
            keys: [],
            data: Buffer.from([4, 5, 6]).toString('base64'),
          },
        ],
        metadata: { complex: true },
      };

      const result = await FabricCore.compressWithArbor(complexTx);

      expect(result.instructions).toHaveLength(2);
      expect(result.metadata).toEqual({ complex: true });
      expect(result.privacyMetadata).toBeDefined();
    });
  });

  describe('estimateCompressionSavings()', () => {
    it('should calculate savings for 1 transaction', () => {
      const result = FabricCore.estimateCompressionSavings(1);

      expect(result.nativeCost).toBe(0.002);
      expect(result.compressedCost).toBe(0.0000004);
      expect(result.savings).toBeCloseTo(0.0019996);
      expect(result.savingsPercent).toBeCloseTo(99.98, 2);
    });

    it('should calculate savings for 100 transactions', () => {
      const result = FabricCore.estimateCompressionSavings(100);

      expect(result.nativeCost).toBe(0.2);
      expect(result.compressedCost).toBeCloseTo(0.00004, 6);
      expect(result.savings).toBeCloseTo(0.19996);
      expect(result.savingsPercent).toBeCloseTo(99.98, 2);
    });

    it('should calculate savings for 1000 transactions', () => {
      const result = FabricCore.estimateCompressionSavings(1000);

      expect(result.nativeCost).toBe(2.0);
      expect(result.compressedCost).toBeCloseTo(0.0004, 5);
      expect(result.savings).toBeCloseTo(1.9996);
      expect(result.savingsPercent).toBeCloseTo(99.98, 2);
    });

    it('should calculate savings for 10000 transactions', () => {
      const result = FabricCore.estimateCompressionSavings(10000);

      expect(result.nativeCost).toBe(20.0);
      expect(result.compressedCost).toBe(0.004);
      expect(result.savings).toBeCloseTo(19.996);
      expect(result.savingsPercent).toBeCloseTo(99.98, 2);
    });

    it('should handle 0 transactions', () => {
      const result = FabricCore.estimateCompressionSavings(0);

      expect(result.nativeCost).toBe(0);
      expect(result.compressedCost).toBe(0);
      expect(result.savings).toBe(0);
      expect(Number.isNaN(result.savingsPercent)).toBe(true); // 0/0 = NaN
    });

    it('should return all required fields', () => {
      const result = FabricCore.estimateCompressionSavings(100);

      expect(result).toHaveProperty('nativeCost');
      expect(result).toHaveProperty('compressedCost');
      expect(result).toHaveProperty('savings');
      expect(result).toHaveProperty('savingsPercent');
    });

    it('should have consistent ratio across different counts', () => {
      const result1 = FabricCore.estimateCompressionSavings(100);
      const result2 = FabricCore.estimateCompressionSavings(200);

      // Savings percent should be consistent
      expect(result1.savingsPercent).toBeCloseTo(result2.savingsPercent, 2);

      // Costs should scale linearly
      expect(result2.nativeCost).toBeCloseTo(result1.nativeCost * 2);
      expect(result2.compressedCost).toBeCloseTo(result1.compressedCost * 2);
    });

    it('should show massive cost reduction', () => {
      const result = FabricCore.estimateCompressionSavings(100);

      // Should demonstrate 99.98% savings as documented
      expect(result.savingsPercent).toBeGreaterThan(99);
      expect(result.savings).toBeGreaterThan(result.compressedCost);
    });

    it('should handle fractional transaction counts', () => {
      const result = FabricCore.estimateCompressionSavings(50.5);

      expect(result.nativeCost).toBeCloseTo(0.101);
      expect(result.compressedCost).toBeCloseTo(0.00002020);
      expect(result.savingsPercent).toBeCloseTo(99.98, 2);
    });

    it('should calculate correct absolute savings', () => {
      const result = FabricCore.estimateCompressionSavings(100);

      // Savings should equal native cost minus compressed cost
      expect(result.savings).toBeCloseTo(result.nativeCost - result.compressedCost);
    });

    it('should maintain precision for large numbers', () => {
      const result = FabricCore.estimateCompressionSavings(1000000);

      expect(result.nativeCost).toBe(2000);
      expect(result.compressedCost).toBeCloseTo(0.4, 2);
      expect(result.savings).toBeCloseTo(1999.6);
      expect(result.savingsPercent).toBeCloseTo(99.98, 2);
    });
  });

  describe('Static methods', () => {
    it('should allow optimize to be called as static method', () => {
      const tx: Transaction = {
        id: 'static-test',
        status: 'pending',
        instructions: [],
      };

      const result = FabricCore.optimize(tx, { enablePrivacy: true });

      expect(result).toBeDefined();
      expect(result.privacyMetadata).toBeDefined();
    });

    it('should allow compressWithArbor to be called as static method', async () => {
      const tx: Transaction = {
        id: 'static-compress-test',
        status: 'pending',
        instructions: [],
      };

      const result = await FabricCore.compressWithArbor(tx);

      expect(result).toBeDefined();
      expect(result.privacyMetadata).toBeDefined();
    });

    it('should allow estimateCompressionSavings to be called as static method', () => {
      const result = FabricCore.estimateCompressionSavings(100);

      expect(result).toBeDefined();
      expect(result.savingsPercent).toBeGreaterThan(0);
    });
  });
});
