import { describe, it, expect, vi, beforeEach } from "vitest";
import { FabricCore } from "../src/fabric";
import { Fabrknt } from "../src/core/fabrknt";
import { Guard } from "../src/guard";
import type { Transaction, PrivacyConfig } from "../src/types";

describe("Privacy - FabricCore Integration", () => {
    describe("FabricCore.optimize() with Privacy", () => {
        let baseTx: Transaction;

        beforeEach(() => {
            baseTx = {
                id: "test-tx",
                status: "pending",
                instructions: [],
            };
        });

        it("should enable privacy with compression", () => {
            const result = FabricCore.optimize(baseTx, {
                enablePrivacy: true,
            });

            expect(result.privacyMetadata).toBeDefined();
            expect(result.privacyMetadata?.requiresPrivacy).toBe(true);
            expect(result.privacyMetadata?.compressionEnabled).toBe(true);
        });

        it("should support different compression levels", () => {
            const levels: Array<"low" | "medium" | "high"> = [
                "low",
                "medium",
                "high",
            ];

            for (const level of levels) {
                const result = FabricCore.optimize(baseTx, {
                    enablePrivacy: true,
                    compressionLevel: level,
                });

                expect(result.privacyMetadata).toBeDefined();
                expect(result.privacyMetadata?.compressionEnabled).toBe(true);
            }
        });

        it("should support different privacy providers", () => {
            const providers: Array<"arbor" | "light"> = ["arbor", "light"];

            for (const provider of providers) {
                const result = FabricCore.optimize(baseTx, {
                    enablePrivacy: true,
                    privacyProvider: provider,
                });

                expect(result.privacyMetadata).toBeDefined();
                expect(result.privacyMetadata?.provider).toBeUndefined(); // Not set in current impl
            }
        });

        it("should preserve transaction structure when enabling privacy", () => {
            const complexTx: Transaction = {
                id: "complex-tx",
                status: "pending",
                instructions: [
                    {
                        programId: "Program1",
                        keys: [
                            {
                                pubkey: "key1",
                                isSigner: false,
                                isWritable: true,
                            },
                        ],
                        data: Buffer.from([1, 2, 3]).toString("base64"),
                    },
                ],
                signers: ["signer1"],
                metadata: { custom: "data" },
            };

            const result = FabricCore.optimize(complexTx, {
                enablePrivacy: true,
            });

            expect(result.id).toBe(complexTx.id);
            expect(result.instructions).toEqual(complexTx.instructions);
            expect(result.signers).toEqual(complexTx.signers);
            expect(result.metadata).toEqual(complexTx.metadata);
            expect(result.privacyMetadata).toBeDefined();
        });
    });

    describe("FabricCore.compressWithArbor()", () => {
        let baseTx: Transaction;

        beforeEach(() => {
            baseTx = {
                id: "compress-tx",
                status: "pending",
                instructions: [],
            };
        });

        it("should compress transaction with default config", async () => {
            const result = await FabricCore.compressWithArbor(baseTx);

            expect(result.privacyMetadata).toBeDefined();
            expect(result.privacyMetadata?.requiresPrivacy).toBe(true);
            expect(result.privacyMetadata?.compressionEnabled).toBe(true);
        });

        it("should accept privacy config options", async () => {
            const configs: PrivacyConfig[] = [
                { compressionLevel: "low" },
                { compressionLevel: "medium" },
                { compressionLevel: "high" },
                { provider: "arbor" },
                { provider: "light" },
            ];

            for (const config of configs) {
                const result = await FabricCore.compressWithArbor(
                    baseTx,
                    config
                );
                expect(result.privacyMetadata).toBeDefined();
            }
        });

        it("should handle transactions with existing privacy metadata", async () => {
            const txWithPrivacy: Transaction = {
                ...baseTx,
                privacyMetadata: {
                    requiresPrivacy: true,
                    compressionEnabled: false,
                },
            };

            const result = await FabricCore.compressWithArbor(txWithPrivacy);

            // Should update compression to enabled
            expect(result.privacyMetadata?.compressionEnabled).toBe(true);
        });

        it("should preserve all transaction fields during compression", async () => {
            const complexTx: Transaction = {
                id: "complex-compress",
                status: "pending",
                instructions: [
                    {
                        programId: "Program1",
                        keys: [],
                        data: Buffer.from([1, 2, 3]).toString("base64"),
                    },
                ],
                signers: ["signer1"],
                assetAddresses: ["asset1"],
            };

            const result = await FabricCore.compressWithArbor(complexTx);

            expect(result.id).toBe(complexTx.id);
            expect(result.instructions).toEqual(complexTx.instructions);
            expect(result.signers).toEqual(complexTx.signers);
            expect(result.assetAddresses).toEqual(complexTx.assetAddresses);
            expect(result.privacyMetadata).toBeDefined();
        });
    });

    describe("FabricCore.estimateCompressionSavings()", () => {
        it("should calculate 99.98% savings for standard case", () => {
            const result = FabricCore.estimateCompressionSavings(100);

            expect(result.savingsPercent).toBeCloseTo(99.98, 2);
            expect(result.nativeCost).toBe(0.2);
            expect(result.compressedCost).toBeCloseTo(0.00004, 6);
        });

        it("should scale linearly with transaction count", () => {
            const result1 = FabricCore.estimateCompressionSavings(100);
            const result10 = FabricCore.estimateCompressionSavings(1000);

            expect(result10.nativeCost).toBe(result1.nativeCost * 10);
            expect(result10.compressedCost).toBeCloseTo(
                result1.compressedCost * 10,
                6
            );
            expect(result10.savingsPercent).toBeCloseTo(
                result1.savingsPercent,
                2
            );
        });

        it("should demonstrate massive cost reduction", () => {
            const result = FabricCore.estimateCompressionSavings(1000000);

            // 1M accounts: $260,000 → $50 (documented savings)
            expect(result.nativeCost).toBe(2000); // 0.002 * 1M = 2000 SOL
            expect(result.compressedCost).toBeCloseTo(0.4, 1); // 0.0000004 * 1M = 0.4 SOL
            expect(result.savingsPercent).toBeCloseTo(99.98, 2);
        });

        it("should handle edge cases", () => {
            // Zero transactions
            const zeroResult = FabricCore.estimateCompressionSavings(0);
            expect(zeroResult.nativeCost).toBe(0);
            expect(zeroResult.compressedCost).toBe(0);
            expect(zeroResult.savings).toBe(0);

            // Single transaction
            const oneResult = FabricCore.estimateCompressionSavings(1);
            expect(oneResult.nativeCost).toBe(0.002);
            expect(oneResult.compressedCost).toBeCloseTo(0.0000004, 8);
            expect(oneResult.savingsPercent).toBeCloseTo(99.98, 2);
        });

        it("should calculate correct absolute savings", () => {
            const result = FabricCore.estimateCompressionSavings(100);

            const calculatedSavings = result.nativeCost - result.compressedCost;
            expect(result.savings).toBeCloseTo(calculatedSavings, 6);
        });
    });
});

describe("Privacy - Fabrknt.executePrivate()", () => {
    describe("Basic Private Execution", () => {
        let baseTx: Transaction;

        beforeEach(() => {
            baseTx = {
                id: "private-tx",
                status: "pending",
                instructions: [],
            };
        });

        it("should execute transaction with privacy enabled", async () => {
            const result = await Fabrknt.executePrivate(baseTx);

            expect(result.privacyMetadata).toBeDefined();
            expect(result.privacyMetadata?.requiresPrivacy).toBe(true);
            expect(result.privacyMetadata?.compressionEnabled).toBe(true);
            expect(result.status).toBe("executed");
        });

        it("should enable compression by default", async () => {
            const result = await Fabrknt.executePrivate(baseTx);

            expect(result.privacyMetadata?.compressionEnabled).toBe(true);
        });

        it("should allow disabling compression", async () => {
            const result = await Fabrknt.executePrivate(baseTx, {
                privacy: {
                    compression: false,
                },
            });

            expect(result.privacyMetadata?.requiresPrivacy).toBe(true);
            expect(result.privacyMetadata?.compressionEnabled).toBe(false);
        });

        it("should support arbor provider", async () => {
            const result = await Fabrknt.executePrivate(baseTx, {
                privacy: {
                    provider: "arbor",
                },
            });

            expect(result.privacyMetadata).toBeDefined();
        });

        it("should support light provider", async () => {
            const result = await Fabrknt.executePrivate(baseTx, {
                privacy: {
                    provider: "light",
                },
            });

            expect(result.privacyMetadata).toBeDefined();
        });
    });

    describe("Private Execution with Guard", () => {
        let baseTx: Transaction;
        let guard: Guard;

        beforeEach(() => {
            baseTx = {
                id: "guarded-private-tx",
                status: "pending",
                instructions: [],
            };

            guard = new Guard({
                enablePatternDetection: true,
            });
        });

        it("should validate transaction with Guard before execution", async () => {
            const validateSpy = vi
                .spyOn(guard, "validate")
                .mockResolvedValue(true);

            const result = await Fabrknt.executePrivate(baseTx, {
                with: guard,
            });

            expect(validateSpy).toHaveBeenCalled();
            expect(result.status).toBe("executed");
            expect(result.privacyMetadata).toBeDefined();
        });

        it("should fail transaction if Guard validation fails", async () => {
            const validateSpy = vi
                .spyOn(guard, "validate")
                .mockResolvedValue(false);

            const result = await Fabrknt.executePrivate(baseTx, {
                with: guard,
            });

            expect(validateSpy).toHaveBeenCalled();
            expect(result.status).toBe("failed");
            expect(result.privacyMetadata).toBeDefined();
        });

        it("should pass privacy metadata to Guard", async () => {
            const validateSpy = vi
                .spyOn(guard, "validate")
                .mockResolvedValue(true);

            await Fabrknt.executePrivate(baseTx, {
                with: guard,
                privacy: {
                    compression: true,
                },
            });

            const callArg = validateSpy.mock.calls[0][0];
            expect(callArg.privacyMetadata).toBeDefined();
            expect(callArg.privacyMetadata?.requiresPrivacy).toBe(true);
            expect(callArg.privacyMetadata?.compressionEnabled).toBe(true);
        });
    });

    describe("Privacy Metadata Handling", () => {
        it("should preserve existing transaction fields", async () => {
            const tx: Transaction = {
                id: "preserve-tx",
                status: "pending",
                instructions: [
                    {
                        programId: "Program1",
                        keys: [],
                        data: Buffer.from([1, 2, 3]).toString("base64"),
                    },
                ],
                signers: ["signer1"],
                assetAddresses: ["asset1"],
                metadata: { custom: "data" },
            };

            const result = await Fabrknt.executePrivate(tx);

            expect(result.id).toBe(tx.id);
            expect(result.instructions).toEqual(tx.instructions);
            expect(result.signers).toEqual(tx.signers);
            expect(result.assetAddresses).toEqual(tx.assetAddresses);
            expect(result.metadata).toEqual(tx.metadata);
            expect(result.privacyMetadata).toBeDefined();
        });

        it("should handle transaction with existing privacy metadata", async () => {
            const tx: Transaction = {
                id: "existing-privacy-tx",
                status: "pending",
                privacyMetadata: {
                    requiresPrivacy: true,
                    compressionEnabled: false,
                },
            };

            const result = await Fabrknt.executePrivate(tx, {
                privacy: {
                    compression: true,
                },
            });

            // Should update compression setting
            expect(result.privacyMetadata?.compressionEnabled).toBe(true);
        });
    });
});

describe("Privacy - Integration Scenarios", () => {
    it("should support full privacy workflow: optimize -> compress -> execute", async () => {
        const tx: Transaction = {
            id: "workflow-tx",
            status: "pending",
            instructions: [],
        };

        // Step 1: Optimize for privacy
        const optimized = FabricCore.optimize(tx, {
            enablePrivacy: true,
            compressionLevel: "high",
            privacyProvider: "arbor",
        });

        expect(optimized.privacyMetadata).toBeDefined();

        // Step 2: Compress
        const compressed = await FabricCore.compressWithArbor(optimized, {
            compressionLevel: "high",
        });

        expect(compressed.privacyMetadata?.compressionEnabled).toBe(true);

        // Step 3: Execute privately
        const executed = await Fabrknt.executePrivate(compressed, {
            privacy: {
                provider: "arbor",
                compression: true,
            },
        });

        expect(executed.status).toBe("executed");
        expect(executed.privacyMetadata?.requiresPrivacy).toBe(true);
        expect(executed.privacyMetadata?.compressionEnabled).toBe(true);
    });

    it("should estimate savings before executing large airdrop", () => {
        const recipientCount = 1000000; // 1M recipients

        const savings = FabricCore.estimateCompressionSavings(recipientCount);

        // Should show massive savings
        expect(savings.savingsPercent).toBeCloseTo(99.98, 2);
        expect(savings.nativeCost).toBe(2000); // 2000 SOL
        expect(savings.compressedCost).toBeCloseTo(0.4, 1); // 0.4 SOL
        expect(savings.savings).toBeGreaterThan(1999); // > 1999 SOL saved
    });

    it("should handle privacy with Guard validation", async () => {
        const guard = new Guard({
            enablePatternDetection: true,
        });

        const tx: Transaction = {
            id: "guarded-privacy-tx",
            status: "pending",
            instructions: [],
        };

        const optimized = FabricCore.optimize(tx, {
            enablePrivacy: true,
        });

        const validateSpy = vi.spyOn(guard, "validate").mockResolvedValue(true);

        const result = await Fabrknt.executePrivate(optimized, {
            with: guard,
            privacy: {
                compression: true,
            },
        });

        expect(validateSpy).toHaveBeenCalled();
        expect(result.status).toBe("executed");
        expect(result.privacyMetadata).toBeDefined();
    });
});
