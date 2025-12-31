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
            const mockRiskMetrics = new Map([
                [
                    "asset-1",
                    {
                        riskScore: 0.8,
                        complianceScore: 0.6,
                        complianceStatus: "compliant" as const,
                        counterpartyRisk: 0.7,
                        oracleIntegrity: 0.9,
                    },
                ],
            ]);

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

    describe("Custom Rules Validation", () => {
        it("should validate custom rules when provided", async () => {
            const customRule = {
                name: "Test Rule",
                enabled: true,
                validate: vi.fn((tx: Transaction) => true),
            };

            const config: GuardConfig = {
                enablePatternDetection: true,
                customRules: [customRule],
            };

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [],
                signers: [],
            };

            const result = await validateTransaction(tx, config);

            expect(customRule.validate).toHaveBeenCalledWith(tx);
            expect(result.isValid).toBe(true);
        });

        it("should add warning when custom rule fails", async () => {
            const customRule = {
                name: "Failing Rule",
                enabled: true,
                validate: vi.fn((tx: Transaction) => false),
            };

            const config: GuardConfig = {
                enablePatternDetection: true,
                customRules: [customRule],
            };

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [],
                signers: [],
            };

            const result = await validateTransaction(tx, config);

            expect(customRule.validate).toHaveBeenCalledWith(tx);
            expect(result.warnings.length).toBeGreaterThan(0);
            const customWarning = result.warnings.find((w) =>
                w.message.includes("Custom rule violation")
            );
            expect(customWarning).toBeDefined();
            expect(customWarning?.message).toContain("Failing Rule");
        });

        it("should skip disabled custom rules", async () => {
            const customRule = {
                name: "Disabled Rule",
                enabled: false,
                validate: vi.fn((tx: Transaction) => false),
            };

            const config: GuardConfig = {
                enablePatternDetection: true,
                customRules: [customRule],
            };

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [],
                signers: [],
            };

            const result = await validateTransaction(tx, config);

            expect(customRule.validate).not.toHaveBeenCalled();
            expect(result.isValid).toBe(true);
        });

        it("should handle custom rule validation errors gracefully", async () => {
            const customRule = {
                name: "Error Rule",
                enabled: true,
                validate: vi.fn((tx: Transaction) => {
                    throw new Error("Rule validation error");
                }),
            };

            const config: GuardConfig = {
                enablePatternDetection: true,
                customRules: [customRule],
            };

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [],
                signers: [],
            };

            // Should not throw
            const result = await validateTransaction(tx, config);

            expect(result).toBeDefined();
            expect(result.isValid).toBe(true);
        });

        it("should validate multiple custom rules", async () => {
            const rule1 = {
                name: "Rule 1",
                enabled: true,
                validate: vi.fn((tx: Transaction) => true),
            };

            const rule2 = {
                name: "Rule 2",
                enabled: true,
                validate: vi.fn((tx: Transaction) => false),
            };

            const config: GuardConfig = {
                enablePatternDetection: true,
                customRules: [rule1, rule2],
            };

            const tx: Transaction = {
                id: "test-tx",
                status: "pending",
                instructions: [],
                signers: [],
            };

            const result = await validateTransaction(tx, config);

            expect(rule1.validate).toHaveBeenCalled();
            expect(rule2.validate).toHaveBeenCalled();
            expect(result.warnings.length).toBeGreaterThan(0);
        });
    });

    describe("Risk Tolerance and Blocking Logic", () => {
        it("should block critical patterns in strict mode", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
                mode: "block",
                riskTolerance: "strict",
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

        it("should block critical patterns in moderate mode", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
                mode: "block",
                riskTolerance: "moderate",
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
        });

        it("should only block mint/freeze kills in permissive mode", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
                mode: "block",
                riskTolerance: "permissive",
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

            // Should still block mint kill in permissive mode
            expect(result.isValid).toBe(false);
            expect(result.blockedBy).toBeDefined();
        });

        it("should not block in warn mode", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
                mode: "warn",
                riskTolerance: "strict",
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

            // In warn mode, should not block even critical patterns
            expect(result.isValid).toBe(true);
            expect(result.blockedBy).toBeUndefined();
            expect(result.warnings.length).toBeGreaterThan(0);
        });
    });

    describe("Pulsar Risk Assessment Edge Cases", () => {
        it("should handle compliance check failures", async () => {
            const mockRiskMetrics = new Map([
                [
                    "asset-1",
                    {
                        riskScore: 0.5,
                        complianceScore: 0.6,
                        complianceStatus: "non-compliant" as const,
                        counterpartyRisk: 0.3,
                        oracleIntegrity: 0.9,
                    },
                ],
            ]);

            vi.mocked(Pulsar.getBatchRiskMetrics).mockResolvedValue(
                mockRiskMetrics
            );

            const config: GuardConfig = {
                pulsar: {
                    enabled: true,
                    riskThreshold: 0.7,
                    enableComplianceCheck: true,
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

            expect(result.warnings.length).toBeGreaterThan(0);
            const complianceWarning = result.warnings.find((w) =>
                w.message.includes("Non-compliant asset")
            );
            expect(complianceWarning).toBeDefined();
            expect(complianceWarning?.severity).toBe(Severity.Critical);
        });

        it("should handle counterparty risk checks", async () => {
            const mockRiskMetrics = new Map([
                [
                    "asset-1",
                    {
                        riskScore: 0.5,
                        complianceScore: 0.8,
                        complianceStatus: "compliant" as const,
                        counterpartyRisk: 0.85,
                        oracleIntegrity: 0.9,
                    },
                ],
            ]);

            vi.mocked(Pulsar.getBatchRiskMetrics).mockResolvedValue(
                mockRiskMetrics
            );

            const config: GuardConfig = {
                pulsar: {
                    enabled: true,
                    riskThreshold: 0.7,
                    enableCounterpartyCheck: true,
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

            expect(result.warnings.length).toBeGreaterThan(0);
            const counterpartyWarning = result.warnings.find((w) =>
                w.message.includes("High counterparty risk")
            );
            expect(counterpartyWarning).toBeDefined();
        });

        it("should handle oracle integrity checks", async () => {
            const mockRiskMetrics = new Map([
                [
                    "asset-1",
                    {
                        riskScore: 0.5,
                        complianceScore: 0.8,
                        complianceStatus: "compliant" as const,
                        counterpartyRisk: 0.3,
                        oracleIntegrity: 0.5, // Low integrity
                    },
                ],
            ]);

            vi.mocked(Pulsar.getBatchRiskMetrics).mockResolvedValue(
                mockRiskMetrics
            );

            const config: GuardConfig = {
                pulsar: {
                    enabled: true,
                    riskThreshold: 0.7,
                    enableOracleCheck: true,
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

            expect(result.warnings.length).toBeGreaterThan(0);
            const oracleWarning = result.warnings.find((w) =>
                w.message.includes("Low oracle integrity")
            );
            expect(oracleWarning).toBeDefined();
            expect(oracleWarning?.severity).toBe(Severity.Alert);
        });

        it("should handle fallback on error when enabled", async () => {
            vi.mocked(Pulsar.getBatchRiskMetrics).mockRejectedValue(
                new Error("Pulsar API error")
            );

            const config: GuardConfig = {
                pulsar: {
                    enabled: true,
                    riskThreshold: 0.7,
                    fallbackOnError: true,
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

            // Should not add error warning when fallback is enabled
            expect(result).toBeDefined();
            const errorWarning = result.warnings.find((w) =>
                w.message.includes("Risk assessment failed")
            );
            expect(errorWarning).toBeUndefined();
        });

        it("should add error warning when fallback is disabled", async () => {
            vi.mocked(Pulsar.getBatchRiskMetrics).mockRejectedValue(
                new Error("Pulsar API error")
            );

            const config: GuardConfig = {
                pulsar: {
                    enabled: true,
                    riskThreshold: 0.7,
                    fallbackOnError: false,
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

            // Should add error warning when fallback is disabled
            expect(result.warnings.length).toBeGreaterThan(0);
            const errorWarning = result.warnings.find((w) =>
                w.message.includes("Risk assessment failed")
            );
            expect(errorWarning).toBeDefined();
        });
    });

    describe("Privacy Validation Edge Cases", () => {
        it("should warn when privacy required but compression not enabled", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "solana",
                status: "pending",
                privacyMetadata: {
                    requiresPrivacy: true,
                    compressionEnabled: false,
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

            expect(result.warnings.length).toBeGreaterThan(0);
            const privacyWarning = result.warnings.find((w) =>
                w.message.includes(
                    "Privacy requested but compression not enabled"
                )
            );
            expect(privacyWarning).toBeDefined();
        });

        it("should not warn when privacy and compression are both enabled", async () => {
            const config: GuardConfig = {
                enablePatternDetection: true,
            };

            const tx: UnifiedTransaction = {
                id: "test-tx",
                chain: "solana",
                status: "pending",
                privacyMetadata: {
                    requiresPrivacy: true,
                    compressionEnabled: true,
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

            const privacyWarning = result.warnings.find((w) =>
                w.message.includes(
                    "Privacy requested but compression not enabled"
                )
            );
            expect(privacyWarning).toBeUndefined();
        });
    });
});
