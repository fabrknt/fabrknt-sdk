import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    validateUnifiedTransactionWithPatterns,
    validateTransaction,
} from "../src/guard/validator";
import type {
    UnifiedTransaction,
    GuardConfig,
    Transaction,
} from "../src/types";
import { PatternId, Severity } from "../src/types";
import type { EVMTransactionData } from "../src/chain/types";
import { Pulsar } from "../src/pulsar";

// Mock Pulsar
vi.mock("../src/pulsar", () => ({
    Pulsar: {
        getBatchRiskMetrics: vi.fn(),
    },
}));

const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

describe("Guard Validator - Unified Transaction Validation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Emergency Stop", () => {
        it("should block all transactions when emergency stop is enabled", async () => {
            const config: GuardConfig = {
                emergencyStop: true,
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "solana",
                status: "pending",
                chainData: {
                    type: "solana",
                    data: {
                        instructions: [],
                    },
                },
            };

            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );

            expect(result.isValid).toBe(false);
            expect(result.blockedBy).toContain(PatternId.MintKill);
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0].severity).toBe(Severity.Critical);
            expect(result.warnings[0].message).toContain("EMERGENCY STOP");
        });

        it("should allow transactions when emergency stop is disabled", async () => {
            const config: GuardConfig = {
                emergencyStop: false,
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "solana",
                status: "pending",
                chainData: {
                    type: "solana",
                    data: {
                        instructions: [],
                    },
                },
            };

            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );

            expect(result.isValid).toBe(true);
            expect(result.blockedBy).toBeUndefined();
        });
    });

    describe("Solana Pattern Detection", () => {
        it("should detect Solana patterns in unified transaction", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
            };

            // Create a mint kill transaction
            const instructionData = Buffer.alloc(35);
            instructionData[0] = 6; // SetAuthority
            instructionData[1] = 0; // Mint authority
            instructionData[2] = 0; // COption::None

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "solana",
                status: "pending",
                chainData: {
                    type: "solana",
                    data: {
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
                                data: instructionData.toString("base64"),
                            },
                        ],
                    },
                },
            };

            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );

            expect(result.warnings.length).toBeGreaterThan(0);
            const mintKillWarning = result.warnings.find(
                (w) => w.patternId === PatternId.MintKill
            );
            expect(mintKillWarning).toBeDefined();
        });

        it("should skip pattern detection when disabled", async () => {
            const config: GuardConfig = {
                enablePatternDetection: false,
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "solana",
                status: "pending",
                chainData: {
                    type: "solana",
                    data: {
                        instructions: [],
                    },
                },
            };

            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );

            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(0);
        });
    });

    describe("EVM Pattern Detection", () => {
        it("should detect EVM reentrancy patterns", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
            };

            const evmData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x3ccfd60b00000000000000000000000000000000000000000000000000000000", // withdraw()
                value: "0",
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "ethereum",
                status: "pending",
                chainData: {
                    type: "evm",
                    data: evmData,
                },
            };

            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );

            expect(result.warnings.length).toBeGreaterThan(0);
            const reentrancyWarning = result.warnings.find(
                (w) => w.patternId === PatternId.ReentrancyAttack
            );
            expect(reentrancyWarning).toBeDefined();
        });

        it("should detect EVM flash loan patterns", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
            };

            const evmData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0xab9c4b5d00000000000000000000000000000000000000000000000000000000", // Aave flashLoan
                value: "0",
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "ethereum",
                status: "pending",
                chainData: {
                    type: "evm",
                    data: evmData,
                },
            };

            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );

            expect(result.warnings.length).toBeGreaterThan(0);
            const flashLoanWarning = result.warnings.find(
                (w) => w.patternId === PatternId.FlashLoanAttack
            );
            expect(flashLoanWarning).toBeDefined();
        });

        it("should detect EVM front-running patterns", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
            };

            const evmData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x",
                value: "0",
                maxPriorityFeePerGas: "300000000000", // 300 gwei - very high
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "ethereum",
                status: "pending",
                chainData: {
                    type: "evm",
                    data: evmData,
                },
            };

            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );

            expect(result.warnings.length).toBeGreaterThan(0);
            const frontRunningWarning = result.warnings.find(
                (w) => w.patternId === PatternId.FrontRunning
            );
            expect(frontRunningWarning).toBeDefined();
        });

        it("should detect EVM unauthorized access patterns", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
            };

            const evmData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0xf2fde38b00000000000000000000000000000000000000000000000000000000", // transferOwnership
                value: "0",
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "ethereum",
                status: "pending",
                chainData: {
                    type: "evm",
                    data: evmData,
                },
            };

            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );

            expect(result.warnings.length).toBeGreaterThan(0);
            const unauthorizedWarning = result.warnings.find(
                (w) => w.patternId === PatternId.UnauthorizedAccess
            );
            expect(unauthorizedWarning).toBeDefined();
        });
    });

    describe("Risk Assessment (Pulsar Integration)", () => {
        it("should integrate with Pulsar for risk assessment", async () => {
            const mockRiskMetrics = {
                "asset-1": {
                    overallRisk: 0.8,
                    complianceScore: 0.6,
                    counterpartyRisk: 0.7,
                    oracleIntegrity: 0.9,
                },
            };

            vi.mocked(Pulsar.getBatchRiskMetrics).mockResolvedValue(
                mockRiskMetrics
            );

            const config: GuardConfig = {
                pulsar: {
                    enabled: true,
                    riskThreshold: 0.7,
                },
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "solana",
                status: "pending",
                assetAddresses: ["asset-1"],
                chainData: {
                    type: "solana",
                    data: {
                        instructions: [],
                    },
                },
            };

            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );

            expect(Pulsar.getBatchRiskMetrics).toHaveBeenCalledWith(
                ["asset-1"],
                expect.any(Object)
            );
            expect(result.warnings.length).toBeGreaterThan(0);
        });

        it("should skip risk assessment when Pulsar is disabled", async () => {
            const config: GuardConfig = {
                pulsar: {
                    enabled: false,
                },
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "solana",
                status: "pending",
                assetAddresses: ["asset-1"],
                chainData: {
                    type: "solana",
                    data: {
                        instructions: [],
                    },
                },
            };

            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );

            expect(Pulsar.getBatchRiskMetrics).not.toHaveBeenCalled();
            expect(result.isValid).toBe(true);
        });

        it("should handle Pulsar errors gracefully", async () => {
            vi.mocked(Pulsar.getBatchRiskMetrics).mockRejectedValue(
                new Error("Pulsar API error")
            );

            const config: GuardConfig = {
                pulsar: {
                    enabled: true,
                    riskThreshold: 0.7,
                },
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "solana",
                status: "pending",
                assetAddresses: ["asset-1"],
                chainData: {
                    type: "solana",
                    data: {
                        instructions: [],
                    },
                },
            };

            // Should not throw
            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );
            expect(result).toBeDefined();
        });
    });

    describe("Privacy Validation", () => {
        it("should validate privacy requirements", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "solana",
                status: "pending",
                privacyMetadata: {
                    requiresPrivacy: true,
                    privacyLevel: "high",
                },
                chainData: {
                    type: "solana",
                    data: {
                        instructions: [],
                    },
                },
            };

            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );

            // Privacy validation should add warnings if requirements not met
            expect(result.warnings).toBeDefined();
        });

        it("should skip privacy validation when not required", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "solana",
                status: "pending",
                privacyMetadata: {
                    requiresPrivacy: false,
                },
                chainData: {
                    type: "solana",
                    data: {
                        instructions: [],
                    },
                },
            };

            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );

            expect(result.isValid).toBe(true);
        });
    });

    describe("Blocking Logic", () => {
        it("should block transactions with critical severity warnings", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
                blockOnCritical: true,
            };

            // Create a mint kill transaction (critical)
            const instructionData = Buffer.alloc(35);
            instructionData[0] = 6; // SetAuthority
            instructionData[1] = 0; // Mint authority
            instructionData[2] = 0; // COption::None

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "solana",
                status: "pending",
                chainData: {
                    type: "solana",
                    data: {
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
                                data: instructionData.toString("base64"),
                            },
                        ],
                    },
                },
            };

            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );

            expect(result.isValid).toBe(false);
            expect(result.blockedBy).toBeDefined();
            expect(result.blockedBy?.length).toBeGreaterThan(0);
        });

        it("should allow transactions with only warning severity", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
                blockOnCritical: true,
                blockOnWarning: false,
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "solana",
                status: "pending",
                chainData: {
                    type: "solana",
                    data: {
                        instructions: [],
                    },
                },
            };

            const result = await validateUnifiedTransactionWithPatterns(
                tx,
                config
            );

            expect(result.isValid).toBe(true);
        });
    });
});

describe("Guard Validator - Legacy Transaction Validation", () => {
    describe("Legacy validateTransaction", () => {
        it("should validate legacy Solana transaction format", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
            };

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [],
                signers: [],
            };

            const result = await validateTransaction(tx, config);

            expect(result).toBeDefined();
            expect(result.isValid).toBe(true);
        });

        it("should handle emergency stop in legacy format", async () => {
            const config: GuardConfig = {
                emergencyStop: true,
            };

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [],
                signers: [],
            };

            const result = await validateTransaction(tx, config);

            expect(result.isValid).toBe(false);
            expect(result.blockedBy).toContain(PatternId.MintKill);
        });
    });
});
