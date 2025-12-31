import { describe, it, expect } from "vitest";
import { analyzeTransaction } from "../src/guard/detector";
import type {
    Transaction,
    TransactionInstruction,
    GuardConfig,
} from "../src/types";
import { PatternId, Severity } from "../src/types";

const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const FRAGMETRIC_HOOK = "fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3";

describe("Guard Detector - Pattern Detection", () => {
    describe("P-101: Mint Kill Detection", () => {
        it("should detect mint kill when setting mint authority to None", () => {
            // SetAuthority instruction with authority type 0 (Mint) and no new authority
            const instructionData = Buffer.alloc(35);
            instructionData[0] = 6; // SetAuthority instruction
            instructionData[1] = 0; // Mint authority type
            instructionData[2] = 0; // COption::None (no new authority)
            const data = instructionData.toString("base64");

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: TOKEN_PROGRAM_ID,
                        keys: [
                            {
                                pubkey: "mint-account",
                                isSigner: false,
                                isWritable: true,
                            },
                        ],
                        data,
                    },
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx);
            const mintKillWarning = warnings.find(
                (w) => w.patternId === PatternId.MintKill
            );

            expect(mintKillWarning).toBeDefined();
            expect(mintKillWarning?.severity).toBe(Severity.Critical);
            expect(mintKillWarning?.message).toContain(
                "Permanently disabling mint authority"
            );
        });

        it("should not detect mint kill when setting new mint authority", () => {
            const instructionData = Buffer.alloc(35);
            instructionData[0] = 6; // SetAuthority
            instructionData[1] = 0; // Mint authority
            instructionData[2] = 1; // COption::Some (has new authority)
            const data = instructionData.toString("base64");

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: TOKEN_PROGRAM_ID,
                        keys: [
                            {
                                pubkey: "mint-account",
                                isSigner: false,
                                isWritable: true,
                            },
                            {
                                pubkey: "new-authority",
                                isSigner: false,
                                isWritable: false,
                            },
                        ],
                        data,
                    },
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx);
            const mintKillWarning = warnings.find(
                (w) => w.patternId === PatternId.MintKill
            );

            expect(mintKillWarning).toBeUndefined();
        });
    });

    describe("P-102: Freeze Kill Detection", () => {
        it("should detect freeze kill when setting freeze authority to None", () => {
            const instructionData = Buffer.alloc(35);
            instructionData[0] = 6; // SetAuthority
            instructionData[1] = 1; // Freeze authority type
            instructionData[2] = 0; // COption::None
            const data = instructionData.toString("base64");

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: TOKEN_PROGRAM_ID,
                        keys: [
                            {
                                pubkey: "mint-account",
                                isSigner: false,
                                isWritable: true,
                            },
                        ],
                        data,
                    },
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx);
            const freezeKillWarning = warnings.find(
                (w) => w.patternId === PatternId.FreezeKill
            );

            expect(freezeKillWarning).toBeDefined();
            expect(freezeKillWarning?.severity).toBe(Severity.Critical);
            expect(freezeKillWarning?.message).toContain(
                "Permanently disabling freeze authority"
            );
        });
    });

    describe("P-103: Signer Mismatch Detection", () => {
        it("should detect signer mismatch when new authority is not a signer", () => {
            const instructionData = Buffer.alloc(35);
            instructionData[0] = 6; // SetAuthority
            instructionData[1] = 0; // Mint authority
            instructionData[2] = 1; // COption::Some
            const data = instructionData.toString("base64");

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: TOKEN_PROGRAM_ID,
                        keys: [
                            {
                                pubkey: "mint-account",
                                isSigner: false,
                                isWritable: true,
                            },
                            {
                                pubkey: "new-authority-not-signer",
                                isSigner: false,
                                isWritable: false,
                            },
                        ],
                        data,
                    },
                ],
                signers: ["user-wallet"], // new-authority-not-signer is NOT in signers
            };

            const warnings = analyzeTransaction(tx);
            const signerMismatchWarning = warnings.find(
                (w) => w.patternId === PatternId.SignerMismatch
            );

            expect(signerMismatchWarning).toBeDefined();
            expect(signerMismatchWarning?.severity).toBe(Severity.Warning);
            expect(signerMismatchWarning?.message).toContain(
                "not a current signer"
            );
        });

        it("should not detect signer mismatch when new authority is a signer", () => {
            const instructionData = Buffer.alloc(35);
            instructionData[0] = 6; // SetAuthority
            instructionData[1] = 0; // Mint authority
            instructionData[2] = 1; // COption::Some
            const data = instructionData.toString("base64");

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: TOKEN_PROGRAM_ID,
                        keys: [
                            {
                                pubkey: "mint-account",
                                isSigner: false,
                                isWritable: true,
                            },
                            {
                                pubkey: "new-authority",
                                isSigner: false,
                                isWritable: false,
                            },
                        ],
                        data,
                    },
                ],
                signers: ["user-wallet", "new-authority"], // new-authority IS a signer
            };

            const warnings = analyzeTransaction(tx);
            const signerMismatchWarning = warnings.find(
                (w) => w.patternId === PatternId.SignerMismatch
            );

            expect(signerMismatchWarning).toBeUndefined();
        });
    });

    describe("P-104: Dangerous Close Detection", () => {
        it("should detect dangerous close account instruction", () => {
            const instructionData = Buffer.alloc(2);
            instructionData[0] = 9; // CloseAccount instruction
            const data = instructionData.toString("base64");

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: TOKEN_PROGRAM_ID,
                        keys: [
                            {
                                pubkey: "account-to-close",
                                isSigner: false,
                                isWritable: true,
                            },
                        ],
                        data,
                    },
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx);
            const dangerousCloseWarning = warnings.find(
                (w) => w.patternId === PatternId.DangerousClose
            );

            expect(dangerousCloseWarning).toBeDefined();
            expect(dangerousCloseWarning?.severity).toBe(Severity.Alert);
            expect(dangerousCloseWarning?.message).toContain("Closing account");
        });
    });

    describe("P-105: Malicious Transfer Hook Detection", () => {
        it("should detect malicious transfer hook with excessive writable accounts", () => {
            const maliciousHookProgram = "malicious-hook-program-id";
            const keys = Array.from({ length: 20 }, (_, i) => ({
                pubkey: `account-${i}`,
                isSigner: false,
                isWritable: i < 15, // 15 writable accounts
            }));

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: maliciousHookProgram,
                        keys,
                        data: Buffer.from([1, 2, 3]).toString("base64"),
                    },
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx);
            const maliciousHookWarning = warnings.find(
                (w) => w.patternId === PatternId.MaliciousTransferHook
            );

            expect(maliciousHookWarning).toBeDefined();
            expect(maliciousHookWarning?.severity).toBe(Severity.Critical);
            expect(maliciousHookWarning?.message).toContain(
                "Possible malicious hook"
            );
        });

        it("should not detect known safe transfer hooks", () => {
            const keys = Array.from({ length: 20 }, (_, i) => ({
                pubkey: `account-${i}`,
                isSigner: false,
                isWritable: i < 15,
            }));

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: FRAGMETRIC_HOOK,
                        keys,
                        data: Buffer.from([1, 2, 3]).toString("base64"),
                    },
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx);
            const maliciousHookWarning = warnings.find(
                (w) => w.patternId === PatternId.MaliciousTransferHook
            );

            expect(maliciousHookWarning).toBeUndefined();
        });

        it("should respect custom allowed hook programs in config", () => {
            const customHookProgram = "custom-safe-hook";
            const keys = Array.from({ length: 20 }, (_, i) => ({
                pubkey: `account-${i}`,
                isSigner: false,
                isWritable: i < 15,
            }));

            const config: GuardConfig = {
                allowedHookPrograms: [customHookProgram],
            };

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: customHookProgram,
                        keys,
                        data: Buffer.from([1, 2, 3]).toString("base64"),
                    },
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx, config);
            const maliciousHookWarning = warnings.find(
                (w) => w.patternId === PatternId.MaliciousTransferHook
            );

            expect(maliciousHookWarning).toBeUndefined();
        });
    });

    describe("P-106: Unexpected Hook Execution Detection", () => {
        it("should detect hook execution without token transfer", () => {
            const unknownHookProgram = "unknown-hook-program";
            const keys = Array.from({ length: 15 }, (_, i) => ({
                pubkey: `account-${i}`,
                isSigner: false,
                isWritable: false,
            }));

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: unknownHookProgram,
                        keys,
                        data: Buffer.from([1, 2, 3]).toString("base64"),
                    },
                    // No token transfer instruction
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx);
            const unexpectedHookWarning = warnings.find(
                (w) => w.patternId === PatternId.UnexpectedHookExecution
            );

            expect(unexpectedHookWarning).toBeDefined();
            expect(unexpectedHookWarning?.severity).toBe(Severity.Alert);
            expect(unexpectedHookWarning?.message).toContain(
                "without token transfer"
            );
        });

        it("should not detect hook execution when token transfer is present", () => {
            const unknownHookProgram = "unknown-hook-program";
            const transferData = Buffer.alloc(2);
            transferData[0] = 12; // TransferChecked instruction

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: TOKEN_PROGRAM_ID,
                        keys: [],
                        data: transferData.toString("base64"),
                    },
                    {
                        programId: unknownHookProgram,
                        keys: Array.from({ length: 15 }, (_, i) => ({
                            pubkey: `account-${i}`,
                            isSigner: false,
                            isWritable: false,
                        })),
                        data: Buffer.from([1, 2, 3]).toString("base64"),
                    },
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx);
            const unexpectedHookWarning = warnings.find(
                (w) => w.patternId === PatternId.UnexpectedHookExecution
            );

            expect(unexpectedHookWarning).toBeUndefined();
        });
    });

    describe("P-107: Hook Reentrancy Detection", () => {
        it("should detect hook reentrancy when hook is sandwiched between token operations", () => {
            const hookProgram = "hook-program";
            const transferData = Buffer.alloc(2);
            transferData[0] = 12; // TransferChecked

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: TOKEN_PROGRAM_ID,
                        keys: [],
                        data: transferData.toString("base64"),
                    },
                    {
                        programId: hookProgram,
                        keys: Array.from({ length: 10 }, (_, i) => ({
                            pubkey: `account-${i}`,
                            isSigner: false,
                            isWritable: false,
                        })),
                        data: Buffer.from([1, 2, 3]).toString("base64"),
                    },
                    {
                        programId: TOKEN_PROGRAM_ID,
                        keys: [],
                        data: transferData.toString("base64"),
                    },
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx);
            const reentrancyWarning = warnings.find(
                (w) => w.patternId === PatternId.HookReentrancy
            );

            expect(reentrancyWarning).toBeDefined();
            expect(reentrancyWarning?.severity).toBe(Severity.Critical);
            expect(reentrancyWarning?.message).toContain("reentrancy");
        });
    });

    describe("P-108: Excessive Hook Accounts Detection", () => {
        it("should detect excessive hook accounts", () => {
            const hookProgram = "hook-program";
            const keys = Array.from({ length: 25 }, (_, i) => ({
                pubkey: `account-${i}`,
                isSigner: false,
                isWritable: false,
            }));

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: hookProgram,
                        keys,
                        data: Buffer.from([1, 2, 3]).toString("base64"),
                    },
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx);
            const excessiveAccountsWarning = warnings.find(
                (w) => w.patternId === PatternId.ExcessiveHookAccounts
            );

            expect(excessiveAccountsWarning).toBeDefined();
            expect(excessiveAccountsWarning?.severity).toBe(Severity.Warning);
            expect(excessiveAccountsWarning?.message).toContain("accounts");
        });

        it("should respect custom maxHookAccounts config", () => {
            const hookProgram = "hook-program";
            const keys = Array.from({ length: 15 }, (_, i) => ({
                pubkey: `account-${i}`,
                isSigner: false,
                isWritable: false,
            }));

            const config: GuardConfig = {
                maxHookAccounts: 10,
            };

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: hookProgram,
                        keys,
                        data: Buffer.from([1, 2, 3]).toString("base64"),
                    },
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx, config);
            const excessiveAccountsWarning = warnings.find(
                (w) => w.patternId === PatternId.ExcessiveHookAccounts
            );

            expect(excessiveAccountsWarning).toBeDefined();
        });

        it("should not detect excessive accounts for known safe hooks", () => {
            const keys = Array.from({ length: 25 }, (_, i) => ({
                pubkey: `account-${i}`,
                isSigner: false,
                isWritable: false,
            }));

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: FRAGMETRIC_HOOK,
                        keys,
                        data: Buffer.from([1, 2, 3]).toString("base64"),
                    },
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx);
            const excessiveAccountsWarning = warnings.find(
                (w) => w.patternId === PatternId.ExcessiveHookAccounts
            );

            expect(excessiveAccountsWarning).toBeUndefined();
        });
    });

    describe("Hook Reentrancy Count Detection", () => {
        it("should detect excessive hook invocations (>6)", () => {
            const hookProgram = "hook-program";
            const instructions: TransactionInstruction[] = Array.from(
                { length: 8 },
                () => ({
                    programId: hookProgram,
                    keys: [],
                    data: Buffer.from([1, 2, 3]).toString("base64"),
                })
            );

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions,
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx);
            const reentrancyCountWarning = warnings.find(
                (w) =>
                    w.patternId === PatternId.HookReentrancy &&
                    w.message.includes("invoked")
            );

            expect(reentrancyCountWarning).toBeDefined();
            expect(reentrancyCountWarning?.severity).toBe(Severity.Critical);
            expect(reentrancyCountWarning?.message).toContain("8 times");
        });

        it("should not detect excessive invocations for known safe hooks", () => {
            const instructions: TransactionInstruction[] = Array.from(
                { length: 8 },
                () => ({
                    programId: FRAGMETRIC_HOOK,
                    keys: [],
                    data: Buffer.from([1, 2, 3]).toString("base64"),
                })
            );

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions,
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx);
            const reentrancyCountWarning = warnings.find(
                (w) =>
                    w.patternId === PatternId.HookReentrancy &&
                    w.message.includes("invoked")
            );

            expect(reentrancyCountWarning).toBeUndefined();
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty transaction", () => {
            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [],
                signers: [],
            };

            const warnings = analyzeTransaction(tx);
            expect(warnings).toHaveLength(0);
        });

        it("should handle transaction with no instructions", () => {
            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                signers: [],
            };

            const warnings = analyzeTransaction(tx);
            expect(warnings).toHaveLength(0);
        });

        it("should handle invalid instruction data gracefully", () => {
            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: TOKEN_PROGRAM_ID,
                        keys: [],
                        data: "invalid-base64!!!",
                    },
                ],
                signers: [],
            };

            // Should not throw, should return empty warnings or handle gracefully
            expect(() => analyzeTransaction(tx)).not.toThrow();
        });

        it("should handle Token-2022 program instructions", () => {
            const instructionData = Buffer.alloc(35);
            instructionData[0] = 6; // SetAuthority
            instructionData[1] = 0; // Mint authority
            instructionData[2] = 0; // COption::None
            const data = instructionData.toString("base64");

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: TOKEN_2022_PROGRAM_ID,
                        keys: [
                            {
                                pubkey: "mint-account",
                                isSigner: false,
                                isWritable: true,
                            },
                        ],
                        data,
                    },
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx);
            const mintKillWarning = warnings.find(
                (w) => w.patternId === PatternId.MintKill
            );

            expect(mintKillWarning).toBeDefined();
        });

        it("should handle disabled transfer hook validation", () => {
            const hookProgram = "hook-program";
            const keys = Array.from({ length: 25 }, (_, i) => ({
                pubkey: `account-${i}`,
                isSigner: false,
                isWritable: i < 15,
            }));

            const config: GuardConfig = {
                validateTransferHooks: false,
            };

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [
                    {
                        programId: hookProgram,
                        keys,
                        data: Buffer.from([1, 2, 3]).toString("base64"),
                    },
                ],
                signers: ["user-wallet"],
            };

            const warnings = analyzeTransaction(tx, config);
            const hookWarnings = warnings.filter(
                (w) =>
                    w.patternId === PatternId.MaliciousTransferHook ||
                    w.patternId === PatternId.ExcessiveHookAccounts ||
                    w.patternId === PatternId.HookReentrancy
            );

            expect(hookWarnings).toHaveLength(0);
        });

        it("should ignore known safe programs", () => {
            const knownPrograms = [
                "11111111111111111111111111111111", // System Program
                "ComputeBudget111111111111111111111111111111", // Compute Budget
                "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", // Associated Token
            ];

            for (const programId of knownPrograms) {
                const tx: Transaction = {
                    id: "test-tx",
                    status: "pending",
                    instructions: [
                        {
                            programId,
                            keys: Array.from({ length: 25 }, (_, i) => ({
                                pubkey: `account-${i}`,
                                isSigner: false,
                                isWritable: true,
                            })),
                            data: Buffer.from([1, 2, 3]).toString("base64"),
                        },
                    ],
                    signers: ["user-wallet"],
                };

                const warnings = analyzeTransaction(tx);
                const hookWarnings = warnings.filter(
                    (w) =>
                        w.patternId === PatternId.MaliciousTransferHook ||
                        w.patternId === PatternId.ExcessiveHookAccounts
                );

                expect(hookWarnings).toHaveLength(0);
            }
        });
    });
});
