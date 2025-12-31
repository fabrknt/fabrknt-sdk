import { describe, it, expect, beforeEach } from 'vitest';
import { Guard, PatternId, Severity } from '../src/guard';
import type { Transaction } from '../src/types';

describe('Guard (Fabric Guard)', () => {
  let guard: Guard;

  beforeEach(() => {
    guard = new Guard();
  });

  describe('Configuration', () => {
    it('should create guard with default config', () => {
      expect(guard).toBeDefined();
      const config = guard.getConfig();
      expect(config.enablePatternDetection).toBe(true);
      expect(config.riskTolerance).toBe('moderate');
      expect(config.mode).toBe('block');
      expect(config.emergencyStop).toBe(false);
    });

    it('should create guard with custom config', () => {
      const customGuard = new Guard({
        maxSlippage: 0.5,
        emergencyStop: true,
        riskTolerance: 'strict',
        mode: 'warn',
      });

      const config = customGuard.getConfig();
      expect(config.maxSlippage).toBe(0.5);
      expect(config.emergencyStop).toBe(true);
      expect(config.riskTolerance).toBe('strict');
      expect(config.mode).toBe('warn');
    });

    it('should update configuration', () => {
      guard.updateConfig({ maxSlippage: 1.0 });
      expect(guard.getConfig().maxSlippage).toBe(1.0);
    });
  });

  describe('Emergency Stop', () => {
    it('should block all transactions when emergency stop is active', async () => {
      guard.activateEmergencyStop();

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
      };

      const result = await guard.validateTransaction(tx);
      expect(result.isValid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('EMERGENCY STOP');
    });

    it('should allow transactions when emergency stop is deactivated', async () => {
      guard.activateEmergencyStop();
      guard.deactivateEmergencyStop();

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
      };

      const result = await guard.validateTransaction(tx);
      expect(result.isValid).toBe(true);
    });

    it('should return false from legacy validate when emergency stop is active', async () => {
      guard.activateEmergencyStop();
      expect(await guard.validate()).toBe(false);
    });
  });

  describe('Slippage Protection', () => {
    it('should accept slippage within limits', () => {
      const slippageGuard = new Guard({ maxSlippage: 1.0 });
      expect(slippageGuard.isSlippageAcceptable(0.5)).toBe(true);
      expect(slippageGuard.isSlippageAcceptable(1.0)).toBe(true);
    });

    it('should reject slippage exceeding limits', () => {
      const slippageGuard = new Guard({ maxSlippage: 1.0 });
      expect(slippageGuard.isSlippageAcceptable(1.5)).toBe(false);
    });

    it('should accept any slippage when no limit is set', () => {
      expect(guard.isSlippageAcceptable(100)).toBe(true);
    });
  });

  describe('Transaction Validation', () => {
    it('should validate empty transaction', async () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
      };

      const result = await guard.validateTransaction(tx);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate transaction with no dangerous patterns', async () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: 'SomeOtherProgram',
            keys: [],
            data: Buffer.from([0]).toString('base64'),
          },
        ],
      };

      const result = await guard.validateTransaction(tx);
      expect(result.isValid).toBe(true);
    });

    it('should work in warn mode', async () => {
      const warnGuard = new Guard({ mode: 'warn' });

      // Even with dangerous patterns, warn mode should not block
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [],
      };

      const result = await warnGuard.validateTransaction(tx);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Warning History', () => {
    it('should track warning history', () => {
      expect(guard.getWarningHistory()).toHaveLength(0);

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
      };

      guard.validateTransaction(tx);
      // History should be empty for clean transaction
      expect(guard.getWarningHistory()).toHaveLength(0);
    });

    it('should clear warning history', () => {
      guard.clearWarningHistory();
      expect(guard.getWarningHistory()).toHaveLength(0);
    });
  });

  describe('Legacy Compatibility', () => {
    it('should support legacy validate() without transaction', async () => {
      expect(await guard.validate()).toBe(true);
    });

    it('should support legacy validate() with transaction', async () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
      };

      expect(await guard.validate(tx)).toBe(true);
    });
  });

  describe('Risk Tolerance Levels', () => {
    it('should apply strict risk tolerance', () => {
      const strictGuard = new Guard({ riskTolerance: 'strict' });
      expect(strictGuard.getConfig().riskTolerance).toBe('strict');
    });

    it('should apply moderate risk tolerance', () => {
      const moderateGuard = new Guard({ riskTolerance: 'moderate' });
      expect(moderateGuard.getConfig().riskTolerance).toBe('moderate');
    });

    it('should apply permissive risk tolerance', () => {
      const permissiveGuard = new Guard({ riskTolerance: 'permissive' });
      expect(permissiveGuard.getConfig().riskTolerance).toBe('permissive');
    });
  });
});
