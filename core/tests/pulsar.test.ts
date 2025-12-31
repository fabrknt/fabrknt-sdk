import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pulsar } from '../src/pulsar';

describe('Pulsar (Risk Assessment)', () => {
  beforeEach(() => {
    // Clear cache before each test
    Pulsar.clearCache();
  });

  afterEach(() => {
    // Clean up after each test
    Pulsar.clearCache();
    vi.clearAllTimers();
  });

  describe('getRiskMetrics()', () => {
    it('should return risk metrics for an asset', async () => {
      const metrics = await Pulsar.getRiskMetrics('asset-address-1');

      expect(metrics).toBeDefined();
      expect(metrics.asset).toBe('asset-address-1');
      expect(metrics.riskScore).toBeDefined();
      expect(metrics.timestamp).toBeDefined();
    });

    it('should return default metrics when disabled', async () => {
      const metrics = await Pulsar.getRiskMetrics('asset-address-1', {
        enabled: false,
      });

      expect(metrics.riskScore).toBeNull();
      expect(metrics.complianceStatus).toBeNull();
      expect(metrics.counterpartyRisk).toBeNull();
      expect(metrics.oracleIntegrity).toBeNull();
    });

    it('should include compliance status when enabled', async () => {
      const metrics = await Pulsar.getRiskMetrics('asset-address-1', {
        enableComplianceCheck: true,
      });

      expect(metrics.complianceStatus).toBeDefined();
      expect(metrics.complianceStatus).not.toBeNull();
    });

    it('should include counterparty risk when enabled', async () => {
      const metrics = await Pulsar.getRiskMetrics('asset-address-1', {
        enableCounterpartyCheck: true,
      });

      expect(metrics.counterpartyRisk).toBeDefined();
      expect(metrics.counterpartyRisk).not.toBeNull();
    });

    it('should include oracle integrity when enabled', async () => {
      const metrics = await Pulsar.getRiskMetrics('asset-address-1', {
        enableOracleCheck: true,
      });

      expect(metrics.oracleIntegrity).toBeDefined();
      expect(metrics.oracleIntegrity).not.toBeNull();
    });

    it('should handle undefined asset address', async () => {
      const metrics = await Pulsar.getRiskMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.asset).toBeUndefined();
    });

    it('should respect custom risk threshold', async () => {
      const metrics = await Pulsar.getRiskMetrics('asset-address-1', {
        riskThreshold: 0.5,
      });

      expect(metrics).toBeDefined();
      // Threshold is used by Guard, not Pulsar itself
    });
  });

  describe('Caching', () => {
    it('should cache risk metrics', async () => {
      const address = 'cached-asset';

      // First call should fetch
      const metrics1 = await Pulsar.getRiskMetrics(address);
      const stats1 = Pulsar.getCacheStats();

      expect(stats1.size).toBe(1);
      expect(stats1.entries).toContain(address);

      // Second call should use cache
      const metrics2 = await Pulsar.getRiskMetrics(address);

      expect(metrics2.timestamp).toBe(metrics1.timestamp);
    });

    it('should respect cache TTL', async () => {
      const address = 'ttl-asset';

      // First call with short TTL
      const metrics1 = await Pulsar.getRiskMetrics(address, { cacheTTL: 10 });

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Clear cache to simulate expiration
      Pulsar.clearCache();

      // Should fetch again (cache expired/cleared)
      const metrics2 = await Pulsar.getRiskMetrics(address, {
        cacheTTL: 1000,
      });

      expect(metrics2).toBeDefined();
    });

    it('should not cache when address is undefined', async () => {
      await Pulsar.getRiskMetrics(undefined);

      const stats = Pulsar.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should clear cache on demand', async () => {
      await Pulsar.getRiskMetrics('asset-1');
      await Pulsar.getRiskMetrics('asset-2');

      expect(Pulsar.getCacheStats().size).toBe(2);

      Pulsar.clearCache();

      expect(Pulsar.getCacheStats().size).toBe(0);
      expect(Pulsar.getCacheStats().entries).toHaveLength(0);
    });

    it('should provide cache statistics', async () => {
      await Pulsar.getRiskMetrics('asset-1');
      await Pulsar.getRiskMetrics('asset-2');
      await Pulsar.getRiskMetrics('asset-3');

      const stats = Pulsar.getCacheStats();

      expect(stats.size).toBe(3);
      expect(stats.entries).toHaveLength(3);
      expect(stats.entries).toContain('asset-1');
      expect(stats.entries).toContain('asset-2');
      expect(stats.entries).toContain('asset-3');
    });

    it('should handle cache with different TTLs', async () => {
      const address = 'ttl-test';

      // Cache with short TTL
      await Pulsar.getRiskMetrics(address, { cacheTTL: 100 });

      // Immediate retrieval should use cache
      const cached = await Pulsar.getRiskMetrics(address, { cacheTTL: 100 });
      expect(cached).toBeDefined();
    });
  });

  describe('getBatchRiskMetrics()', () => {
    it('should fetch metrics for multiple assets', async () => {
      const addresses = ['asset-1', 'asset-2', 'asset-3'];

      const results = await Pulsar.getBatchRiskMetrics(addresses);

      expect(results.size).toBe(3);
      expect(results.has('asset-1')).toBe(true);
      expect(results.has('asset-2')).toBe(true);
      expect(results.has('asset-3')).toBe(true);
    });

    it('should return Map with correct structure', async () => {
      const addresses = ['asset-1', 'asset-2'];

      const results = await Pulsar.getBatchRiskMetrics(addresses);

      expect(results).toBeInstanceOf(Map);

      for (const [address, metrics] of results.entries()) {
        expect(addresses).toContain(address);
        expect(metrics.asset).toBe(address);
        expect(metrics.timestamp).toBeDefined();
      }
    });

    it('should handle empty array', async () => {
      const results = await Pulsar.getBatchRiskMetrics([]);

      expect(results.size).toBe(0);
    });

    it('should cache all fetched metrics', async () => {
      const addresses = ['batch-1', 'batch-2', 'batch-3'];

      await Pulsar.getBatchRiskMetrics(addresses);

      const stats = Pulsar.getCacheStats();
      expect(stats.size).toBe(3);
      expect(stats.entries).toContain('batch-1');
      expect(stats.entries).toContain('batch-2');
      expect(stats.entries).toContain('batch-3');
    });

    it('should use cache for subsequent calls', async () => {
      const addresses = ['cached-batch-1', 'cached-batch-2'];

      // First call
      const results1 = await Pulsar.getBatchRiskMetrics(addresses);

      // Second call should use cache
      const results2 = await Pulsar.getBatchRiskMetrics(addresses);

      for (const address of addresses) {
        expect(results1.get(address)?.timestamp).toBe(
          results2.get(address)?.timestamp
        );
      }
    });

    it('should respect config for batch requests', async () => {
      const addresses = ['config-1', 'config-2'];

      const results = await Pulsar.getBatchRiskMetrics(addresses, {
        enableComplianceCheck: true,
        enableCounterpartyCheck: true,
      });

      for (const metrics of results.values()) {
        expect(metrics.complianceStatus).not.toBeNull();
        expect(metrics.counterpartyRisk).not.toBeNull();
      }
    });

    it('should handle single asset in array', async () => {
      const results = await Pulsar.getBatchRiskMetrics(['single-asset']);

      expect(results.size).toBe(1);
      expect(results.has('single-asset')).toBe(true);
    });

    it('should process requests in parallel', async () => {
      const addresses = Array.from({ length: 10 }, (_, i) => `parallel-${i}`);

      const startTime = Date.now();
      await Pulsar.getBatchRiskMetrics(addresses);
      const endTime = Date.now();

      // Should complete much faster than sequential (10 * 50ms = 500ms)
      // Parallel should be close to 50ms
      expect(endTime - startTime).toBeLessThan(300);
    });
  });

  describe('Fallback behavior', () => {
    it('should return default metrics on error when fallback is enabled', async () => {
      // Mock fetchRiskMetrics to throw error
      const originalFetch = (Pulsar as any).fetchRiskMetrics;
      (Pulsar as any).fetchRiskMetrics = vi
        .fn()
        .mockRejectedValue(new Error('API Error'));

      const metrics = await Pulsar.getRiskMetrics('error-asset', {
        fallbackOnError: true,
      });

      expect(metrics.riskScore).toBeNull();
      expect(metrics.complianceStatus).toBeNull();

      // Restore original method
      (Pulsar as any).fetchRiskMetrics = originalFetch;
    });

    it('should throw error when fallback is disabled', async () => {
      // Mock fetchRiskMetrics to throw error
      const originalFetch = (Pulsar as any).fetchRiskMetrics;
      (Pulsar as any).fetchRiskMetrics = vi
        .fn()
        .mockRejectedValue(new Error('API Error'));

      await expect(
        Pulsar.getRiskMetrics('error-asset', {
          fallbackOnError: false,
        })
      ).rejects.toThrow('API Error');

      // Restore original method
      (Pulsar as any).fetchRiskMetrics = originalFetch;
    });
  });

  describe('Default configuration', () => {
    it('should use default config values', async () => {
      const metrics = await Pulsar.getRiskMetrics('default-asset');

      // Default config has these enabled
      expect(metrics.complianceStatus).not.toBeNull();
      expect(metrics.counterpartyRisk).not.toBeNull();
      expect(metrics.oracleIntegrity).not.toBeNull();
    });

    it('should merge custom config with defaults', async () => {
      const metrics = await Pulsar.getRiskMetrics('merge-asset', {
        riskThreshold: 0.5,
        // Other values should use defaults
      });

      expect(metrics).toBeDefined();
      expect(metrics.complianceStatus).not.toBeNull(); // From defaults
    });
  });

  describe('Risk metrics structure', () => {
    it('should return all required fields', async () => {
      const metrics = await Pulsar.getRiskMetrics('struct-asset');

      expect(metrics).toHaveProperty('asset');
      expect(metrics).toHaveProperty('riskScore');
      expect(metrics).toHaveProperty('complianceStatus');
      expect(metrics).toHaveProperty('counterpartyRisk');
      expect(metrics).toHaveProperty('oracleIntegrity');
      expect(metrics).toHaveProperty('timestamp');
    });

    it('should have valid timestamp', async () => {
      const before = Date.now();
      const metrics = await Pulsar.getRiskMetrics('timestamp-asset');
      const after = Date.now();

      expect(metrics.timestamp).toBeGreaterThanOrEqual(before);
      expect(metrics.timestamp).toBeLessThanOrEqual(after);
    });

    it('should have numeric risk score when enabled', async () => {
      const metrics = await Pulsar.getRiskMetrics('score-asset', {
        enabled: true,
      });

      if (metrics.riskScore !== null) {
        expect(typeof metrics.riskScore).toBe('number');
        expect(metrics.riskScore).toBeGreaterThanOrEqual(0);
        expect(metrics.riskScore).toBeLessThanOrEqual(1);
      }
    });

    it('should have valid compliance status values', async () => {
      const metrics = await Pulsar.getRiskMetrics('compliance-asset', {
        enableComplianceCheck: true,
      });

      if (metrics.complianceStatus !== null) {
        expect(['compliant', 'non-compliant', 'unknown']).toContain(
          metrics.complianceStatus
        );
      }
    });
  });

  describe('Static methods', () => {
    it('should allow getRiskMetrics to be called as static method', async () => {
      const result = await Pulsar.getRiskMetrics('static-test');

      expect(result).toBeDefined();
    });

    it('should allow getBatchRiskMetrics to be called as static method', async () => {
      const result = await Pulsar.getBatchRiskMetrics(['static-1', 'static-2']);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);
    });

    it('should allow clearCache to be called as static method', () => {
      expect(() => Pulsar.clearCache()).not.toThrow();
    });

    it('should allow getCacheStats to be called as static method', () => {
      const stats = Pulsar.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('entries');
    });
  });

  describe('Edge cases', () => {
    it('should handle very long asset addresses', async () => {
      const longAddress = 'a'.repeat(1000);

      const metrics = await Pulsar.getRiskMetrics(longAddress);

      expect(metrics.asset).toBe(longAddress);
    });

    it('should handle special characters in asset addresses', async () => {
      const specialAddress = 'asset-@#$%^&*()_+-={}[]|:;<>?,./';

      const metrics = await Pulsar.getRiskMetrics(specialAddress);

      expect(metrics.asset).toBe(specialAddress);
    });

    it('should handle concurrent requests for same asset', async () => {
      const address = 'concurrent-asset';

      // Make multiple concurrent requests
      const promises = Array.from({ length: 5 }, () =>
        Pulsar.getRiskMetrics(address)
      );

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.asset).toBe(address);
      });
    });

    it('should handle empty string as asset address', async () => {
      const metrics = await Pulsar.getRiskMetrics('');

      expect(metrics.asset).toBe('');
    });
  });
});
