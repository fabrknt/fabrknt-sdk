import { describe, it, expect } from 'vitest';
import { analyzeTransaction } from '../src/guard/detector';
import { PatternId, Severity } from '../src/types';
import type { Transaction } from '../src/types';

const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

describe('Transaction Detector', () => {
  describe('Pattern Detection', () => {
    it('should return no warnings for empty transaction', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
      };

      const warnings = analyzeTransaction(tx);
      expect(warnings).toHaveLength(0);
    });

    it('should return no warnings for non-token instructions', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: 'SomeOtherProgramId',
            keys: [],
            data: Buffer.from([0, 1, 2]).toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('P-101: Mint Kill Detection', () => {
    it('should detect mint authority being set to None', () => {
      // SetAuthority instruction: [6, 0 (MintTokens authority type), 0 (COption::None)]
      const setAuthorityData = Buffer.from([6, 0, 0]);

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [
              {
                pubkey: 'MintPubkey',
                isSigner: false,
                isWritable: true,
              },
            ],
            data: setAuthorityData.toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx);
      expect(warnings.length).toBeGreaterThan(0);

      const mintKillWarning = warnings.find(
        (w) => w.patternId === PatternId.MintKill
      );
      expect(mintKillWarning).toBeDefined();
      expect(mintKillWarning?.severity).toBe(Severity.Critical);
      expect(mintKillWarning?.message).toContain('mint authority');
    });
  });

  describe('P-102: Freeze Kill Detection', () => {
    it('should detect freeze authority being set to None', () => {
      // SetAuthority instruction: [6, 1 (FreezeAccount authority type), 0 (COption::None)]
      const setAuthorityData = Buffer.from([6, 1, 0]);

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [
              {
                pubkey: 'AccountPubkey',
                isSigner: false,
                isWritable: true,
              },
            ],
            data: setAuthorityData.toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx);
      expect(warnings.length).toBeGreaterThan(0);

      const freezeKillWarning = warnings.find(
        (w) => w.patternId === PatternId.FreezeKill
      );
      expect(freezeKillWarning).toBeDefined();
      expect(freezeKillWarning?.severity).toBe(Severity.Critical);
      expect(freezeKillWarning?.message).toContain('freeze authority');
    });
  });

  describe('P-103: Signer Mismatch Detection', () => {
    it('should detect authority transfer to unsigned wallet', () => {
      // SetAuthority instruction: [6, 0 (authority type), 1 (COption::Some), ...new authority pubkey]
      const setAuthorityData = Buffer.from([6, 0, 1]);

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [
              {
                pubkey: 'OldAuthorityPubkey',
                isSigner: true,
                isWritable: true,
              },
              {
                pubkey: 'NewAuthorityPubkey',
                isSigner: false,
                isWritable: false,
              },
            ],
            data: setAuthorityData.toString('base64'),
          },
        ],
        signers: ['OldAuthorityPubkey'],
      };

      const warnings = analyzeTransaction(tx);
      expect(warnings.length).toBeGreaterThan(0);

      const signerMismatchWarning = warnings.find(
        (w) => w.patternId === PatternId.SignerMismatch
      );
      expect(signerMismatchWarning).toBeDefined();
      expect(signerMismatchWarning?.severity).toBe(Severity.Warning);
      expect(signerMismatchWarning?.message).toContain('not a current signer');
    });

    it('should not warn if new authority is a signer', () => {
      const setAuthorityData = Buffer.from([6, 0, 1]);

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [
              {
                pubkey: 'OldAuthorityPubkey',
                isSigner: true,
                isWritable: true,
              },
              {
                pubkey: 'NewAuthorityPubkey',
                isSigner: true,
                isWritable: false,
              },
            ],
            data: setAuthorityData.toString('base64'),
          },
        ],
        signers: ['OldAuthorityPubkey', 'NewAuthorityPubkey'],
      };

      const warnings = analyzeTransaction(tx);

      const signerMismatchWarning = warnings.find(
        (w) => w.patternId === PatternId.SignerMismatch
      );
      expect(signerMismatchWarning).toBeUndefined();
    });
  });

  describe('P-104: Dangerous Close Detection', () => {
    it('should detect account closure', () => {
      // CloseAccount instruction: [9]
      const closeAccountData = Buffer.from([9]);

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [
              {
                pubkey: 'AccountToClose',
                isSigner: false,
                isWritable: true,
              },
              {
                pubkey: 'Destination',
                isSigner: false,
                isWritable: true,
              },
              {
                pubkey: 'Authority',
                isSigner: true,
                isWritable: false,
              },
            ],
            data: closeAccountData.toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx);
      expect(warnings.length).toBeGreaterThan(0);

      const closeWarning = warnings.find(
        (w) => w.patternId === PatternId.DangerousClose
      );
      expect(closeWarning).toBeDefined();
      expect(closeWarning?.severity).toBe(Severity.Alert);
      expect(closeWarning?.message).toContain('Closing account');
    });
  });

  describe('Multiple Pattern Detection', () => {
    it('should detect multiple patterns in one transaction', () => {
      const mintKillData = Buffer.from([6, 0, 0]);
      const closeAccountData = Buffer.from([9]);

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [{ pubkey: 'Mint', isSigner: false, isWritable: true }],
            data: mintKillData.toString('base64'),
          },
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [
              { pubkey: 'Account', isSigner: false, isWritable: true },
              { pubkey: 'Dest', isSigner: false, isWritable: true },
              { pubkey: 'Auth', isSigner: true, isWritable: false },
            ],
            data: closeAccountData.toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx);
      expect(warnings.length).toBeGreaterThanOrEqual(2);

      const patternIds = warnings.map((w) => w.patternId);
      expect(patternIds).toContain(PatternId.MintKill);
      expect(patternIds).toContain(PatternId.DangerousClose);
    });
  });

  describe('P-105: Malicious Transfer Hook Detection', () => {
    it('should detect unknown Transfer Hook with many writable accounts', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: 'UnknownHookProgram111111111111111111111',
            keys: Array.from({ length: 20 }, (_, i) => ({
              pubkey: `Account${i}`,
              isSigner: false,
              isWritable: i < 15, // 15 writable accounts
            })),
            data: Buffer.from([18, 13, 182, 219, 153, 232, 60, 152, 0]).toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx, { validateTransferHooks: true });

      const maliciousHookWarning = warnings.find(
        (w) => w.patternId === PatternId.MaliciousTransferHook
      );
      expect(maliciousHookWarning).toBeDefined();
      expect(maliciousHookWarning?.severity).toBe(Severity.Critical);
      expect(maliciousHookWarning?.message).toContain('malicious hook');
    });

    it('should not warn for known safe Transfer Hook programs', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: 'fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3', // Fragmetric
            keys: Array.from({ length: 20 }, (_, i) => ({
              pubkey: `Account${i}`,
              isSigner: false,
              isWritable: i < 15,
            })),
            data: Buffer.from([18, 13, 182, 219, 153, 232, 60, 152, 0]).toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx, { validateTransferHooks: true });

      const maliciousHookWarning = warnings.find(
        (w) => w.patternId === PatternId.MaliciousTransferHook
      );
      expect(maliciousHookWarning).toBeUndefined();
    });
  });

  describe('P-106: Unexpected Hook Execution Detection', () => {
    it('should detect Transfer Hook without token transfer', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: 'UnknownHookProgram111111111111111111111',
            keys: Array.from({ length: 15 }, (_, i) => ({
              pubkey: `Account${i}`,
              isSigner: false,
              isWritable: i < 5,
            })),
            data: Buffer.from([195, 9, 254, 106, 255, 173, 223, 123, 0, 0]).toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx, { validateTransferHooks: true });

      const unexpectedHookWarning = warnings.find(
        (w) => w.patternId === PatternId.UnexpectedHookExecution
      );
      expect(unexpectedHookWarning).toBeDefined();
      expect(unexpectedHookWarning?.severity).toBe(Severity.Alert);
    });

    it('should not warn when Transfer Hook accompanies token transfer', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
            keys: Array.from({ length: 5 }, (_, i) => ({
              pubkey: `TokenAccount${i}`,
              isSigner: false,
              isWritable: true,
            })),
            data: Buffer.from([12, 0, 100, 0, 0, 0, 0, 0, 0]).toString('base64'), // TransferChecked
          },
          {
            programId: 'UnknownHookProgram111111111111111111111',
            keys: Array.from({ length: 15 }, (_, i) => ({
              pubkey: `Account${i}`,
              isSigner: false,
              isWritable: i < 5,
            })),
            data: Buffer.from([195, 9, 254, 106, 255, 173, 223, 123, 0, 0]).toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx, { validateTransferHooks: true });

      const unexpectedHookWarning = warnings.find(
        (w) => w.patternId === PatternId.UnexpectedHookExecution
      );
      expect(unexpectedHookWarning).toBeUndefined();
    });
  });

  describe('P-107: Hook Reentrancy Detection', () => {
    it('should detect Transfer Hook sandwiched between token operations', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [{ pubkey: 'Source', isSigner: false, isWritable: true }],
            data: Buffer.from([3]).toString('base64'), // Transfer
          },
          {
            programId: 'SuspiciousHookProgram111111111111111111',
            keys: Array.from({ length: 10 }, (_, i) => ({
              pubkey: `Account${i}`,
              isSigner: false,
              isWritable: true,
            })),
            data: Buffer.from([195, 9, 254, 106]).toString('base64'),
          },
          {
            programId: TOKEN_PROGRAM_ID,
            keys: [{ pubkey: 'Dest', isSigner: false, isWritable: true }],
            data: Buffer.from([3]).toString('base64'), // Transfer
          },
        ],
      };

      const warnings = analyzeTransaction(tx, { validateTransferHooks: true });

      const reentrancyWarning = warnings.find(
        (w) => w.patternId === PatternId.HookReentrancy
      );
      expect(reentrancyWarning).toBeDefined();
      expect(reentrancyWarning?.severity).toBe(Severity.Critical);
      expect(reentrancyWarning?.message).toContain('reentrancy');
    });

    it('should detect excessive hook invocations', () => {
      const hookProgram = 'SuspiciousHookProgram111111111111111111';

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: Array.from({ length: 8 }, () => ({
          programId: hookProgram,
          keys: Array.from({ length: 10 }, (_, i) => ({
            pubkey: `Account${i}`,
            isSigner: false,
            isWritable: true,
          })),
          data: Buffer.from([195, 9, 254, 106]).toString('base64'),
        })),
      };

      const warnings = analyzeTransaction(tx, { validateTransferHooks: true });

      const reentrancyWarning = warnings.find(
        (w) => w.patternId === PatternId.HookReentrancy && w.message.includes('8 times')
      );
      expect(reentrancyWarning).toBeDefined();
      expect(reentrancyWarning?.severity).toBe(Severity.Critical);
    });
  });

  describe('P-108: Excessive Hook Accounts Detection', () => {
    it('should detect Transfer Hook with too many accounts', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: 'UnknownHookProgram111111111111111111111',
            keys: Array.from({ length: 25 }, (_, i) => ({
              pubkey: `Account${i}`,
              isSigner: false,
              isWritable: i < 10,
            })),
            data: Buffer.from([18, 13, 182, 219]).toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx, {
        validateTransferHooks: true,
        maxHookAccounts: 20
      });

      const excessiveAccountsWarning = warnings.find(
        (w) => w.patternId === PatternId.ExcessiveHookAccounts
      );
      expect(excessiveAccountsWarning).toBeDefined();
      expect(excessiveAccountsWarning?.severity).toBe(Severity.Warning);
      expect(excessiveAccountsWarning?.message).toContain('25 accounts');
    });

    it('should respect custom maxHookAccounts config', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: 'UnknownHookProgram111111111111111111111',
            keys: Array.from({ length: 15 }, (_, i) => ({
              pubkey: `Account${i}`,
              isSigner: false,
              isWritable: false,
            })),
            data: Buffer.from([18, 13, 182, 219]).toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx, {
        validateTransferHooks: true,
        maxHookAccounts: 10
      });

      const excessiveAccountsWarning = warnings.find(
        (w) => w.patternId === PatternId.ExcessiveHookAccounts
      );
      expect(excessiveAccountsWarning).toBeDefined();
    });
  });

  describe('Transfer Hook Config Options', () => {
    it('should respect allowedHookPrograms whitelist', () => {
      const customHookProgram = 'CustomSafeHook11111111111111111111111111';

      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: customHookProgram,
            keys: Array.from({ length: 20 }, (_, i) => ({
              pubkey: `Account${i}`,
              isSigner: false,
              isWritable: i < 15,
            })),
            data: Buffer.from([18, 13, 182, 219]).toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx, {
        validateTransferHooks: true,
        allowedHookPrograms: [customHookProgram]
      });

      const maliciousHookWarning = warnings.find(
        (w) => w.patternId === PatternId.MaliciousTransferHook
      );
      expect(maliciousHookWarning).toBeUndefined();
    });

    it('should skip Transfer Hook validation when disabled', () => {
      const tx: Transaction = {
        id: 'test-tx',
        status: 'pending',
        instructions: [
          {
            programId: 'UnknownHookProgram111111111111111111111',
            keys: Array.from({ length: 25 }, (_, i) => ({
              pubkey: `Account${i}`,
              isSigner: false,
              isWritable: i < 15,
            })),
            data: Buffer.from([18, 13, 182, 219]).toString('base64'),
          },
        ],
      };

      const warnings = analyzeTransaction(tx, { validateTransferHooks: false });

      const hookWarnings = warnings.filter(
        (w) => [
          PatternId.MaliciousTransferHook,
          PatternId.UnexpectedHookExecution,
          PatternId.HookReentrancy,
          PatternId.ExcessiveHookAccounts,
        ].includes(w.patternId)
      );
      expect(hookWarnings).toHaveLength(0);
    });
  });
});
