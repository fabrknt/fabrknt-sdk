import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Fabrknt } from '../src/core/fabrknt';
import { Guard } from '../src/guard';
import { Pulsar } from '../src/pulsar';
import { FabricCore } from '../src/fabric';
import { Loom } from '../src/loom';
import type { Transaction } from '../src/types';

describe('Integration Tests', () => {
  beforeEach(() => {
    Pulsar.clearCache();
  });

  describe('Guard + Risk Integration', () => {
    it('should execute transaction with Guard and Risk validation', async () => {
      const mockGetBatchRiskMetrics = vi.spyOn(Pulsar, 'getBatchRiskMetrics');
      mockGetBatchRiskMetrics.mockResolvedValue(
        new Map([
          [
            'test-asset',
            {
              riskScore: 0.3,
              complianceStatus: 'compliant',
              oracleIntegrity: 0.9,
              lastUpdated: Date.now(),
            },
          ],
        ])
      );

      const guard = new Guard({
        mode: 'block',
        pulsar: {
          enabled: true,
          riskThreshold: 0.7,
          enableComplianceCheck: true,
        },
      });

      const tx: Transaction = {
        id: 'integration-tx-1',
        status: 'pending',
        assetAddresses: ['test-asset'],
        instructions: [],
      };

      const result = await Fabrknt.execute(tx, { with: guard });

      expect(result.status).toBe('executed');
      expect(mockGetBatchRiskMetrics).toHaveBeenCalled();

      mockGetBatchRiskMetrics.mockRestore();
    });

    it('should block high-risk transaction with Guard', async () => {
      const mockGetBatchRiskMetrics = vi.spyOn(Pulsar, 'getBatchRiskMetrics');
      mockGetBatchRiskMetrics.mockResolvedValue(
        new Map([
          [
            'high-risk-asset',
            {
              riskScore: 0.95, // High risk
              complianceStatus: 'compliant',
              oracleIntegrity: 0.9,
              lastUpdated: Date.now(),
            },
          ],
        ])
      );

      const guard = new Guard({
        mode: 'block',
        pulsar: {
          enabled: true,
          riskThreshold: 0.7,
        },
      });

      const tx: Transaction = {
        id: 'high-risk-tx',
        status: 'pending',
        assetAddresses: ['high-risk-asset'],
        instructions: [],
      };

      const result = await Fabrknt.execute(tx, { with: guard });

      expect(result.status).toBe('failed');

      mockGetBatchRiskMetrics.mockRestore();
    });

    it('should validate transaction and track warnings', async () => {
      const guard = new Guard({
        mode: 'warn',
        maxSlippage: 0.05,
      });

      const tx: Transaction = {
        id: 'warn-tx',
        status: 'pending',
        instructions: [],
      };

      await guard.validateTransaction(tx);
      const warnings = guard.getWarningHistory();

      // Should have tracked the validation
      expect(Array.isArray(warnings)).toBe(true);
    });
  });

  describe('Fabrknt + FabricCore Integration', () => {
    it('should optimize and execute transaction with privacy', async () => {
      const tx: Transaction = {
        id: 'privacy-tx',
        status: 'pending',
        instructions: [],
      };

      // Optimize for privacy
      const optimized = FabricCore.optimize(tx, {
        enablePrivacy: true,
        compressionLevel: 'high',
      });

      // Execute with privacy
      const result = await Fabrknt.executePrivate(optimized);

      expect(result.status).toBe('executed');
      expect(result.privacyMetadata?.requiresPrivacy).toBe(true);
      expect(result.privacyMetadata?.compressionEnabled).toBe(true);
    });

    it('should compress and execute transaction', async () => {
      const tx: Transaction = {
        id: 'compress-tx',
        status: 'pending',
        instructions: [],
      };

      // Compress with Arbor
      const compressed = await FabricCore.compressWithArbor(tx, {
        compressionLevel: 'high',
      });

      // Execute privately
      const result = await Fabrknt.executePrivate(compressed);

      expect(result.status).toBe('executed');
      expect(result.privacyMetadata?.compressionEnabled).toBe(true);
    });

    it('should estimate savings and execute compressed transaction', async () => {
      const count = 1000;
      const savings = FabricCore.estimateCompressionSavings(count);

      expect(savings.savingsPercent).toBeGreaterThan(99);

      // Execute with compression
      const tx: Transaction = {
        id: 'savings-tx',
        status: 'pending',
        instructions: [],
      };

      const result = await Fabrknt.executePrivate(tx, {
        privacy: { compression: true },
      });

      expect(result.status).toBe('executed');
    });
  });

  describe('Loom + Fabrknt Integration', () => {
    it('should weave and execute transaction', async () => {
      // Weave a transaction with Loom
      const tx = await Loom.weave({
        type: 'MULTI_ROUTE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 100,
      });

      // Execute with Fabrknt
      const result = await Fabrknt.execute(tx);

      expect(result.status).toBe('executed');
      expect(result.id).toContain('MULTI_ROUTE_SWAP');
    });

    it('should weave and execute with Guard', async () => {
      const guard = new Guard({
        mode: 'block',
        maxSlippage: 0.1,
      });

      // Weave transaction
      const tx = await Loom.weave({
        type: 'SINGLE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 50,
      });

      // Execute with Guard
      const result = await Fabrknt.execute(tx, { with: guard });

      expect(result.status).toBe('executed');
    });

    it('should weave and execute privately', async () => {
      // Weave transaction
      const tx = await Loom.weave({
        type: 'LIQUIDITY_ADD',
        input: 'SOL',
        output: 'USDC',
        amount: 1000,
      });

      // Execute privately
      const result = await Fabrknt.executePrivate(tx);

      expect(result.status).toBe('executed');
      expect(result.privacyMetadata?.requiresPrivacy).toBe(true);
    });
  });

  describe('Full Stack Integration', () => {
    it('should weave, optimize, validate with Guard+Risk, and execute privately', async () => {
      const mockGetBatchRiskMetrics = vi.spyOn(Pulsar, 'getBatchRiskMetrics');
      mockGetBatchRiskMetrics.mockResolvedValue(
        new Map([
          [
            'full-stack-asset',
            {
              riskScore: 0.4,
              complianceStatus: 'compliant',
              oracleIntegrity: 0.95,
              lastUpdated: Date.now(),
            },
          ],
        ])
      );

      // Step 1: Weave with Loom
      const woven = await Loom.weave({
        type: 'MULTI_ROUTE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 500,
        parallelPriority: true,
      });

      // Step 2: Add asset addresses for risk assessment
      const txWithAssets: Transaction = {
        ...woven,
        assetAddresses: ['full-stack-asset'],
      };

      // Step 3: Optimize for privacy
      const optimized = FabricCore.optimize(txWithAssets, {
        enablePrivacy: true,
        compressionLevel: 'high',
        privacyProvider: 'arbor',
      });

      // Step 4: Create Guard with Risk
      const guard = new Guard({
        mode: 'block',
        maxSlippage: 0.1,
        pulsar: {
          enabled: true,
          riskThreshold: 0.7,
          enableComplianceCheck: true,
          enableCounterpartyCheck: true,
        },
      });

      // Step 5: Execute privately with Guard validation
      const result = await Fabrknt.executePrivate(optimized, {
        with: guard,
        privacy: {
          provider: 'arbor',
          compression: true,
        },
      });

      // Verify full stack worked
      expect(result.status).toBe('executed');
      expect(result.privacyMetadata?.requiresPrivacy).toBe(true);
      expect(result.privacyMetadata?.compressionEnabled).toBe(true);
      expect(mockGetBatchRiskMetrics).toHaveBeenCalled();

      mockGetBatchRiskMetrics.mockRestore();
    });

    it('should handle full stack with Risk API failure and fallback', async () => {
      const mockGetBatchRiskMetrics = vi.spyOn(Pulsar, 'getBatchRiskMetrics');
      mockGetBatchRiskMetrics.mockRejectedValue(new Error('Risk API down'));

      // Weave
      const tx = await Loom.weave({
        type: 'SINGLE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 100,
      });

      const txWithAssets: Transaction = {
        ...tx,
        assetAddresses: ['fallback-asset'],
      };

      // Guard with fallback enabled
      const guard = new Guard({
        mode: 'block',
        pulsar: {
          enabled: true,
          riskThreshold: 0.7,
          fallbackOnError: true, // Should continue despite error
        },
      });

      // Should execute successfully despite Risk API failure
      const result = await Fabrknt.execute(txWithAssets, { with: guard });

      expect(result.status).toBe('executed');

      mockGetBatchRiskMetrics.mockRestore();
    });

    it('should demonstrate cost savings with privacy execution', async () => {
      // Estimate savings
      const transactionCount = 1000;
      const savings = FabricCore.estimateCompressionSavings(transactionCount);

      expect(savings.nativeCost).toBeGreaterThan(savings.compressedCost);
      expect(savings.savingsPercent).toBeCloseTo(99.98, 1);

      // Execute with compression
      const tx = await Loom.weave({
        type: 'MULTI_ROUTE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 100,
      });

      const compressed = await FabricCore.compressWithArbor(tx);
      const result = await Fabrknt.executePrivate(compressed);

      expect(result.status).toBe('executed');
      expect(result.privacyMetadata?.compressionEnabled).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle Guard rejection properly', async () => {
      const guard = new Guard({
        mode: 'block',
        maxSlippage: 0.01,
      });

      guard.activateEmergencyStop();

      const tx = await Loom.weave({
        type: 'SINGLE_SWAP',
        input: 'SOL',
        output: 'USDC',
        amount: 100,
      });

      const result = await Fabrknt.execute(tx, { with: guard });

      expect(result.status).toBe('failed');
    });

    it('should handle Risk rejection with non-compliant assets', async () => {
      const mockGetBatchRiskMetrics = vi.spyOn(Pulsar, 'getBatchRiskMetrics');
      mockGetBatchRiskMetrics.mockResolvedValue(
        new Map([
          [
            'non-compliant-asset',
            {
              riskScore: 0.3,
              complianceStatus: 'non-compliant',
              oracleIntegrity: 0.9,
              lastUpdated: Date.now(),
            },
          ],
        ])
      );

      const guard = new Guard({
        mode: 'block',
        pulsar: {
          enabled: true,
          enableComplianceCheck: true,
        },
      });

      const tx: Transaction = {
        id: 'non-compliant-tx',
        status: 'pending',
        assetAddresses: ['non-compliant-asset'],
        instructions: [],
      };

      const result = await Fabrknt.execute(tx, { with: guard });

      expect(result.status).toBe('failed');

      mockGetBatchRiskMetrics.mockRestore();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent transactions', async () => {
      const guard = new Guard({
        mode: 'block',
        maxSlippage: 0.1,
      });

      // Create multiple transactions concurrently
      const promises = Array.from({ length: 10 }, async (_, i) => {
        const tx = await Loom.weave({
          type: 'SINGLE_SWAP',
          input: 'SOL',
          output: 'USDC',
          amount: i + 1,
        });

        return Fabrknt.execute(tx, { with: guard });
      });

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.status).toBe('executed');
      });
    });

    it('should handle concurrent Risk assessments', async () => {
      const mockGetBatchRiskMetrics = vi.spyOn(Pulsar, 'getBatchRiskMetrics');
      mockGetBatchRiskMetrics.mockImplementation(async (addresses) => {
        const results = new Map();
        addresses.forEach((addr) => {
          results.set(addr, {
            riskScore: 0.3,
            complianceStatus: 'compliant',
            oracleIntegrity: 0.9,
            lastUpdated: Date.now(),
          });
        });
        return results;
      });

      const guard = new Guard({
        mode: 'block',
        pulsar: {
          enabled: true,
          riskThreshold: 0.7,
        },
      });

      // Multiple transactions with different assets
      const promises = Array.from({ length: 5 }, async (_, i) => {
        const tx: Transaction = {
          id: `concurrent-tx-${i}`,
          status: 'pending',
          assetAddresses: [`asset-${i}`],
          instructions: [],
        };

        return Fabrknt.execute(tx, { with: guard });
      });

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.status).toBe('executed');
      });

      mockGetBatchRiskMetrics.mockRestore();
    });
  });
});
