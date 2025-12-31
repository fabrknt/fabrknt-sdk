import { describe, it, expect, vi } from 'vitest';
import { ExecutionPattern, PatternConfig, PatternResult } from '../../src/patterns/types';
import type { Transaction } from '../../src/types';

// Test implementation of ExecutionPattern
class TestPattern extends ExecutionPattern {
  public executeCount = 0;
  public validateCount = 0;
  public shouldValidate = true;
  public shouldFail = false;

  async execute(): Promise<PatternResult> {
    this.startTime = Date.now();
    this.executeCount++;

    try {
      if (!this.validate()) {
        throw new Error('Validation failed');
      }

      if (this.shouldFail) {
        throw new Error('Execution failed');
      }

      const transactions: Transaction[] = [
        {
          id: 'test-tx-1',
          status: 'pending',
        },
      ];

      const metrics = this.createMetrics(transactions);

      return {
        success: true,
        transactions,
        metrics,
      };
    } catch (error) {
      return {
        success: false,
        transactions: [],
        metrics: this.createMetrics([]),
        error: error as Error,
      };
    }
  }

  protected validate(): boolean {
    this.validateCount++;
    return this.shouldValidate;
  }
}

describe('ExecutionPattern (Base Class)', () => {
  describe('Configuration', () => {
    it('should create pattern with minimal config', () => {
      const pattern = new TestPattern({
        name: 'Test Pattern',
      });

      expect(pattern).toBeDefined();
      expect(pattern.config.name).toBe('Test Pattern');
      expect(pattern.config.maxRetries).toBe(3);
      expect(pattern.config.retryDelay).toBe(1000);
      expect(pattern.config.dryRun).toBe(false);
    });

    it('should create pattern with custom config', () => {
      const pattern = new TestPattern({
        name: 'Custom Pattern',
        maxRetries: 5,
        retryDelay: 2000,
        dryRun: true,
        description: 'A test pattern',
      });

      expect(pattern.config.name).toBe('Custom Pattern');
      expect(pattern.config.maxRetries).toBe(5);
      expect(pattern.config.retryDelay).toBe(2000);
      expect(pattern.config.dryRun).toBe(true);
      expect(pattern.config.description).toBe('A test pattern');
    });
  });

  describe('Execution', () => {
    it('should execute successfully', async () => {
      const pattern = new TestPattern({
        name: 'Test Pattern',
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(1);
      expect(result.error).toBeUndefined();
      expect(pattern.executeCount).toBe(1);
      expect(pattern.validateCount).toBe(1);
    });

    it('should fail when validation fails', async () => {
      const pattern = new TestPattern({
        name: 'Test Pattern',
      });
      pattern.shouldValidate = false;

      const result = await pattern.execute();

      expect(result.success).toBe(false);
      expect(result.transactions).toHaveLength(0);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Validation failed');
    });

    it('should fail when execution throws error', async () => {
      const pattern = new TestPattern({
        name: 'Test Pattern',
      });
      pattern.shouldFail = true;

      const result = await pattern.execute();

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Execution failed');
    });
  });

  describe('Metrics', () => {
    it('should create execution metrics', async () => {
      const pattern = new TestPattern({
        name: 'Test Pattern',
      });

      const result = await pattern.execute();

      expect(result.metrics).toBeDefined();
      expect(result.metrics.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.transactionCount).toBe(1);
      expect(result.metrics.retries).toBe(0);
    });

    it('should track execution time', async () => {
      const pattern = new TestPattern({
        name: 'Test Pattern',
      });

      const start = Date.now();
      const result = await pattern.execute();
      const elapsed = Date.now() - start;

      expect(result.metrics.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.executionTime).toBeLessThanOrEqual(elapsed + 10);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on failure', async () => {
      const pattern = new TestPattern({
        name: 'Test Pattern',
        maxRetries: 3,
        retryDelay: 10,
      });

      let attemptCount = 0;
      const fn = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await pattern.executeWithRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const pattern = new TestPattern({
        name: 'Test Pattern',
        maxRetries: 2,
        retryDelay: 10,
      });

      const fn = vi.fn(async () => {
        throw new Error('Permanent failure');
      });

      await expect(pattern.executeWithRetry(fn)).rejects.toThrow('Permanent failure');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should wait between retries', async () => {
      const pattern = new TestPattern({
        name: 'Test Pattern',
        maxRetries: 2,
        retryDelay: 50,
      });

      const timestamps: number[] = [];
      const fn = vi.fn(async () => {
        timestamps.push(Date.now());
        throw new Error('Failure');
      });

      await expect(pattern.executeWithRetry(fn)).rejects.toThrow();

      // Check that retries were delayed
      for (let i = 1; i < timestamps.length; i++) {
        const delay = timestamps[i] - timestamps[i - 1];
        expect(delay).toBeGreaterThanOrEqual(45); // Allow 5ms tolerance
      }
    });

    it('should succeed on first attempt without retry', async () => {
      const pattern = new TestPattern({
        name: 'Test Pattern',
        maxRetries: 3,
      });

      const fn = vi.fn(async () => 'immediate success');

      const result = await pattern.executeWithRetry(fn);

      expect(result).toBe('immediate success');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Dry Run Mode', () => {
    it('should execute in dry-run mode', async () => {
      const pattern = new TestPattern({
        name: 'Test Pattern',
        dryRun: true,
      });

      const result = await pattern.execute();

      expect(result.success).toBe(true);
      expect(pattern.config.dryRun).toBe(true);
    });
  });
});
