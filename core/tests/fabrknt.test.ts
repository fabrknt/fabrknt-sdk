import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Fabrknt } from '../src/core/fabrknt';
import { Guard } from '../src/guard';
import { Pulsar } from '../src/pulsar';
import type { Transaction } from '../src/types';

describe('Fabrknt', () => {
  describe('Configuration', () => {
    it('should create instance with default config', () => {
      const fabrknt = new Fabrknt();
      const config = fabrknt.getConfig();

      expect(config.network).toBe('mainnet-beta');
      expect(config.rpcUrl).toBeUndefined();
      expect(config.privacy).toBeUndefined();
    });

    it('should create instance with custom config', () => {
      const fabrknt = new Fabrknt({
        network: 'devnet',
        rpcUrl: 'https://api.devnet.solana.com',
        privacy: {
          provider: 'arbor',
          compressionLevel: 'high',
        },
      });

      const config = fabrknt.getConfig();
      expect(config.network).toBe('devnet');
      expect(config.rpcUrl).toBe('https://api.devnet.solana.com');
      expect(config.privacy?.provider).toBe('arbor');
      expect(config.privacy?.compressionLevel).toBe('high');
    });

    it('should return config copy via getConfig()', () => {
      const fabrknt = new Fabrknt({ network: 'devnet' });
      const config = fabrknt.getConfig();

      expect(config).toBeDefined();
      expect(config.network).toBe('devnet');
    });
  });

  describe('execute()', () => {
    let tx: Transaction;

    beforeEach(() => {
      tx = {
        id: 'test-tx',
        status: 'pending',
        instructions: [],
      };
    });

    it('should execute transaction without Guard', async () => {
      const result = await Fabrknt.execute(tx);

      expect(result.status).toBe('executed');
      expect(result.id).toBe('test-tx');
    });

    it('should execute transaction with valid Guard', async () => {
      const guard = new Guard({
        maxSlippage: 0.1,
        mode: 'block',
      });

      const result = await Fabrknt.execute(tx, { with: guard });

      expect(result.status).toBe('executed');
    });

    it('should fail transaction when Guard validation fails', async () => {
      const guard = new Guard({
        maxSlippage: 0.1,
        mode: 'block',
      });

      // Activate emergency stop to force validation failure
      guard.activateEmergencyStop();

      const result = await Fabrknt.execute(tx, { with: guard });

      expect(result.status).toBe('failed');
    });

    it('should preserve transaction metadata', async () => {
      const txWithMetadata: Transaction = {
        ...tx,
        metadata: { custom: 'data' },
      };

      const result = await Fabrknt.execute(txWithMetadata);

      expect(result.metadata).toEqual({ custom: 'data' });
      expect(result.status).toBe('executed');
    });
  });

  describe('execute() with Risk integration', () => {
    let tx: Transaction;

    beforeEach(() => {
      tx = {
        id: 'test-tx',
        status: 'pending',
        assetAddresses: ['asset1', 'asset2'],
        instructions: [],
      };
    });

    it('should execute when Risk is enabled but risk is within threshold', async () => {
      // Mock Pulsar.getBatchRiskMetrics to return low risk
      const mockGetBatchRiskMetrics = vi.spyOn(Pulsar, 'getBatchRiskMetrics');
      mockGetBatchRiskMetrics.mockResolvedValue(
        new Map([
          ['asset1', {
            riskScore: 0.3,
            complianceStatus: 'compliant',
            oracleReliability: 0.9,
            lastUpdated: Date.now(),
          }],
          ['asset2', {
            riskScore: 0.4,
            complianceStatus: 'compliant',
            oracleReliability: 0.9,
            lastUpdated: Date.now(),
          }],
        ])
      );

      const guard = new Guard({
        mode: 'block',
        pulsar: {
          enabled: true,
          riskThreshold: 0.7,
        },
      });

      const result = await Fabrknt.execute(tx, { with: guard });

      expect(result.status).toBe('executed');
      expect(mockGetBatchRiskMetrics).toHaveBeenCalledWith(
        tx.assetAddresses,
        expect.objectContaining({ enabled: true, riskThreshold: 0.7 })
      );

      mockGetBatchRiskMetrics.mockRestore();
    });

    it('should fail when risk exceeds threshold in block mode', async () => {
      // Mock Pulsar.getBatchRiskMetrics to return high risk
      const mockGetBatchRiskMetrics = vi.spyOn(Pulsar, 'getBatchRiskMetrics');
      mockGetBatchRiskMetrics.mockResolvedValue(
        new Map([
          ['asset1', {
            riskScore: 0.9, // Exceeds threshold
            complianceStatus: 'compliant',
            oracleReliability: 0.9,
            lastUpdated: Date.now(),
          }],
        ])
      );

      const guard = new Guard({
        mode: 'block',
        pulsar: {
          enabled: true,
          riskThreshold: 0.7,
        },
      });

      const result = await Fabrknt.execute(tx, { with: guard });

      expect(result.status).toBe('failed');

      mockGetBatchRiskMetrics.mockRestore();
    });

    it('should fail when asset is non-compliant and compliance check is enabled', async () => {
      const mockGetBatchRiskMetrics = vi.spyOn(Pulsar, 'getBatchRiskMetrics');
      mockGetBatchRiskMetrics.mockResolvedValue(
        new Map([
          ['asset1', {
            riskScore: 0.3,
            complianceStatus: 'non-compliant',
            oracleReliability: 0.9,
            lastUpdated: Date.now(),
          }],
        ])
      );

      const guard = new Guard({
        mode: 'block',
        pulsar: {
          enabled: true,
          enableComplianceCheck: true,
        },
      });

      const result = await Fabrknt.execute(tx, { with: guard });

      expect(result.status).toBe('failed');

      mockGetBatchRiskMetrics.mockRestore();
    });

    it('should continue execution when Risk API fails and fallback is enabled', async () => {
      const mockGetBatchRiskMetrics = vi.spyOn(Pulsar, 'getBatchRiskMetrics');
      mockGetBatchRiskMetrics.mockRejectedValue(new Error('Risk API unavailable'));

      const guard = new Guard({
        mode: 'block',
        pulsar: {
          enabled: true,
          fallbackOnError: true,
        },
      });

      const result = await Fabrknt.execute(tx, { with: guard });

      expect(result.status).toBe('executed');

      mockGetBatchRiskMetrics.mockRestore();
    });

    it('should fail when Risk API fails and fallback is disabled', async () => {
      const mockGetBatchRiskMetrics = vi.spyOn(Pulsar, 'getBatchRiskMetrics');
      mockGetBatchRiskMetrics.mockRejectedValue(new Error('Risk API unavailable'));

      const guard = new Guard({
        mode: 'block',
        pulsar: {
          enabled: true,
          fallbackOnError: false,
        },
      });

      const result = await Fabrknt.execute(tx, { with: guard });

      expect(result.status).toBe('failed');

      mockGetBatchRiskMetrics.mockRestore();
    });

    it('should allow execution in warn mode even with high risk', async () => {
      const mockGetBatchRiskMetrics = vi.spyOn(Pulsar, 'getBatchRiskMetrics');
      mockGetBatchRiskMetrics.mockResolvedValue(
        new Map([
          ['asset1', {
            riskScore: 0.9, // High risk
            complianceStatus: 'compliant',
            oracleReliability: 0.9,
            lastUpdated: Date.now(),
          }],
        ])
      );

      const guard = new Guard({
        mode: 'warn', // Warn mode should not block
        pulsar: {
          enabled: true,
          riskThreshold: 0.7,
        },
      });

      const result = await Fabrknt.execute(tx, { with: guard });

      // In warn mode, transaction should still execute
      expect(result.status).toBe('executed');

      mockGetBatchRiskMetrics.mockRestore();
    });

    it('should skip Risk check if no assetAddresses provided', async () => {
      const mockGetBatchRiskMetrics = vi.spyOn(Pulsar, 'getBatchRiskMetrics');

      const txWithoutAssets: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [],
      };

      const guard = new Guard({
        mode: 'block',
        pulsar: {
          enabled: true,
          riskThreshold: 0.7,
        },
      });

      const result = await Fabrknt.execute(txWithoutAssets, { with: guard });

      expect(result.status).toBe('executed');
      expect(mockGetBatchRiskMetrics).not.toHaveBeenCalled();

      mockGetBatchRiskMetrics.mockRestore();
    });
  });

  describe('executePrivate()', () => {
    let tx: Transaction;

    beforeEach(() => {
      tx = {
        id: 'test-tx',
        status: 'pending',
        instructions: [],
      };
    });

    it('should execute private transaction with default settings', async () => {
      const result = await Fabrknt.executePrivate(tx);

      expect(result.status).toBe('executed');
      expect(result.privacyMetadata).toBeDefined();
      expect(result.privacyMetadata?.requiresPrivacy).toBe(true);
      expect(result.privacyMetadata?.compressionEnabled).toBe(true);
    });

    it('should execute private transaction with Guard', async () => {
      const guard = new Guard({
        maxSlippage: 0.1,
        mode: 'block',
      });

      const result = await Fabrknt.executePrivate(tx, { with: guard });

      expect(result.status).toBe('executed');
      expect(result.privacyMetadata?.requiresPrivacy).toBe(true);
    });

    it('should fail private transaction when Guard validation fails', async () => {
      const guard = new Guard({
        maxSlippage: 0.1,
        mode: 'block',
      });
      guard.activateEmergencyStop();

      const result = await Fabrknt.executePrivate(tx, { with: guard });

      expect(result.status).toBe('failed');
    });

    it('should respect compression setting', async () => {
      const result = await Fabrknt.executePrivate(tx, {
        privacy: { compression: false },
      });

      expect(result.privacyMetadata?.compressionEnabled).toBe(false);
    });

    it('should default compression to true when not specified', async () => {
      const result = await Fabrknt.executePrivate(tx, {
        privacy: { provider: 'arbor' },
      });

      expect(result.privacyMetadata?.compressionEnabled).toBe(true);
    });

    it('should accept arbor privacy provider', async () => {
      const result = await Fabrknt.executePrivate(tx, {
        privacy: { provider: 'arbor', compression: true },
      });

      expect(result.status).toBe('executed');
      expect(result.privacyMetadata?.requiresPrivacy).toBe(true);
    });

    it('should accept light privacy provider', async () => {
      const result = await Fabrknt.executePrivate(tx, {
        privacy: { provider: 'light', compression: true },
      });

      expect(result.status).toBe('executed');
      expect(result.privacyMetadata?.requiresPrivacy).toBe(true);
    });

    it('should preserve original transaction data', async () => {
      const txWithData: Transaction = {
        ...tx,
        metadata: { original: 'data' },
      };

      const result = await Fabrknt.executePrivate(txWithData);

      expect(result.id).toBe(txWithData.id);
      expect(result.metadata).toEqual({ original: 'data' });
      expect(result.privacyMetadata).toBeDefined();
    });

    it('should add privacy metadata without removing existing metadata', async () => {
      const txWithMetadata: Transaction = {
        ...tx,
        metadata: { custom: 'value' },
      };

      const result = await Fabrknt.executePrivate(txWithMetadata, {
        privacy: { compression: true },
      });

      expect(result.metadata).toEqual({ custom: 'value' });
      expect(result.privacyMetadata).toBeDefined();
      expect(result.privacyMetadata?.requiresPrivacy).toBe(true);
      expect(result.privacyMetadata?.compressionEnabled).toBe(true);
    });
  });

  describe('Static methods', () => {
    it('should allow execute to be called as static method', async () => {
      const tx: Transaction = {
        id: 'static-test',
        status: 'pending',
        instructions: [],
      };

      const result = await Fabrknt.execute(tx);

      expect(result).toBeDefined();
      expect(result.status).toBe('executed');
    });

    it('should allow executePrivate to be called as static method', async () => {
      const tx: Transaction = {
        id: 'static-private-test',
        status: 'pending',
        instructions: [],
      };

      const result = await Fabrknt.executePrivate(tx);

      expect(result).toBeDefined();
      expect(result.status).toBe('executed');
      expect(result.privacyMetadata).toBeDefined();
    });
  });
});
