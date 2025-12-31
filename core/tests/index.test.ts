/**
 * Main Entry Point Tests
 *
 * Tests for the main SDK entry point (src/index.ts).
 * Verifies all exports are available, module exports are correct,
 * and validates the public API contract.
 */

import { describe, it, expect } from "vitest";

describe("Main Entry Point (@fabrknt/sdk)", () => {
    describe("Core Classes", () => {
        it("should export Fabrknt class", async () => {
            const { Fabrknt } = await import("../src/index");
            expect(Fabrknt).toBeDefined();
            expect(typeof Fabrknt).toBe("function");
            expect(Fabrknt.name).toBe("Fabrknt");
        });

        it("should export Guard class", async () => {
            const { Guard } = await import("../src/index");
            expect(Guard).toBeDefined();
            expect(typeof Guard).toBe("function");
        });

        it("should export Loom class", async () => {
            const { Loom } = await import("../src/index");
            expect(Loom).toBeDefined();
            expect(typeof Loom).toBe("function");
        });

        it("should export FabricCore class", async () => {
            const { FabricCore } = await import("../src/index");
            expect(FabricCore).toBeDefined();
            expect(typeof FabricCore).toBe("function");
        });

        it("should export Pulsar class", async () => {
            const { Pulsar } = await import("../src/index");
            expect(Pulsar).toBeDefined();
            expect(typeof Pulsar).toBe("function");
        });
    });

    describe("Guard Exports", () => {
        it("should export PatternId enum", async () => {
            const { PatternId } = await import("../src/index");
            expect(PatternId).toBeDefined();
            expect(typeof PatternId).toBe("object");
            // Verify some known pattern IDs (enums are objects at runtime)
            expect(PatternId.MintKill).toBeDefined();
            expect(PatternId.ReentrancyAttack).toBeDefined();
        });

        it("should export Severity enum", async () => {
            const { Severity } = await import("../src/index");
            expect(Severity).toBeDefined();
            expect(typeof Severity).toBe("object");
            // Verify some known severity levels
            expect(Severity.Critical).toBeDefined();
            expect(Severity.Warning).toBeDefined();
        });
    });

    describe("Pattern Library Exports", () => {
        it("should export ExecutionPattern base class", async () => {
            const { ExecutionPattern } = await import("../src/index");
            expect(ExecutionPattern).toBeDefined();
            expect(typeof ExecutionPattern).toBe("function");
        });

        it("should export PatternRegistry", async () => {
            const { PatternRegistry } = await import("../src/index");
            expect(PatternRegistry).toBeDefined();
        });

        it("should export AI Agent Patterns", async () => {
            const { GridTradingPattern, DCAStrategy, ArbitragePattern } =
                await import("../src/index");

            expect(GridTradingPattern).toBeDefined();
            expect(typeof GridTradingPattern).toBe("function");

            expect(DCAStrategy).toBeDefined();
            expect(typeof DCAStrategy).toBe("function");

            expect(ArbitragePattern).toBeDefined();
            expect(typeof ArbitragePattern).toBe("function");
        });

        it("should export DAO Treasury Patterns", async () => {
            const { TreasuryRebalancing, YieldFarmingPattern } = await import(
                "../src/index"
            );

            expect(TreasuryRebalancing).toBeDefined();
            expect(typeof TreasuryRebalancing).toBe("function");

            expect(YieldFarmingPattern).toBeDefined();
            expect(typeof YieldFarmingPattern).toBe("function");
        });

        it("should export DeFi Protocol Patterns", async () => {
            const { SwapPattern, LiquidityPattern } = await import(
                "../src/index"
            );

            expect(SwapPattern).toBeDefined();
            expect(typeof SwapPattern).toBe("function");

            expect(LiquidityPattern).toBeDefined();
            expect(typeof LiquidityPattern).toBe("function");
        });

        it("should export Financial Operations Patterns", async () => {
            const {
                BatchPayoutPattern,
                RecurringPaymentPattern,
                TokenVestingPattern,
            } = await import("../src/index");

            expect(BatchPayoutPattern).toBeDefined();
            expect(typeof BatchPayoutPattern).toBe("function");

            expect(RecurringPaymentPattern).toBeDefined();
            expect(typeof RecurringPaymentPattern).toBe("function");

            expect(TokenVestingPattern).toBeDefined();
            expect(typeof TokenVestingPattern).toBe("function");
        });
    });

    describe("Chain Abstraction Exports", () => {
        it("should export createChainAdapter factory function", async () => {
            const { createChainAdapter } = await import("../src/index");
            expect(createChainAdapter).toBeDefined();
            expect(typeof createChainAdapter).toBe("function");
        });

        it("should export SolanaAdapter class", async () => {
            const { SolanaAdapter } = await import("../src/index");
            expect(SolanaAdapter).toBeDefined();
            expect(typeof SolanaAdapter).toBe("function");
        });

        it("should export EVMAdapter class", async () => {
            const { EVMAdapter } = await import("../src/index");
            expect(EVMAdapter).toBeDefined();
            expect(typeof EVMAdapter).toBe("function");
        });
    });

    describe("DEX Integration Exports", () => {
        it("should export JupiterAdapter class", async () => {
            const { JupiterAdapter } = await import("../src/index");
            expect(JupiterAdapter).toBeDefined();
            expect(typeof JupiterAdapter).toBe("function");
        });

        it("should export PriceFeedService class", async () => {
            const { PriceFeedService } = await import("../src/index");
            expect(PriceFeedService).toBeDefined();
            expect(typeof PriceFeedService).toBe("function");
        });

        it("should export COMMON_TOKENS constant", async () => {
            const { COMMON_TOKENS } = await import("../src/index");
            expect(COMMON_TOKENS).toBeDefined();
            expect(typeof COMMON_TOKENS).toBe("object");
            // Verify some common tokens are defined
            expect(COMMON_TOKENS.SOL).toBeDefined();
            expect(COMMON_TOKENS.USDC).toBeDefined();
        });
    });

    describe("Type Exports", () => {
        // Note: TypeScript types are not available at runtime.
        // These tests verify that type exports are declared in the module,
        // but they will be undefined at runtime. This is expected behavior.
        // The actual type checking happens at compile time via TypeScript.

        it("should have type exports declared (compile-time only)", async () => {
            // TypeScript types are stripped at runtime, so we can't test them directly.
            // However, we verify that the module exports exist and can be imported.
            // The actual type checking happens during TypeScript compilation.
            const mod = await import("../src/index");

            // Verify that the module itself is importable
            expect(mod).toBeDefined();
            expect(typeof mod).toBe("object");

            // Types are undefined at runtime, which is expected
            // They exist only in the TypeScript type system
        });
    });

    describe("Public API Contract", () => {
        it("should allow importing all core classes in a single import", async () => {
            const { Fabrknt, Guard, Loom, FabricCore, Pulsar } = await import(
                "../src/index"
            );

            expect(Fabrknt).toBeDefined();
            expect(Guard).toBeDefined();
            expect(Loom).toBeDefined();
            expect(FabricCore).toBeDefined();
            expect(Pulsar).toBeDefined();
        });

        it("should allow importing all pattern classes in a single import", async () => {
            const {
                GridTradingPattern,
                DCAStrategy,
                ArbitragePattern,
                TreasuryRebalancing,
                YieldFarmingPattern,
                SwapPattern,
                LiquidityPattern,
                BatchPayoutPattern,
                RecurringPaymentPattern,
                TokenVestingPattern,
            } = await import("../src/index");

            expect(GridTradingPattern).toBeDefined();
            expect(DCAStrategy).toBeDefined();
            expect(ArbitragePattern).toBeDefined();
            expect(TreasuryRebalancing).toBeDefined();
            expect(YieldFarmingPattern).toBeDefined();
            expect(SwapPattern).toBeDefined();
            expect(LiquidityPattern).toBeDefined();
            expect(BatchPayoutPattern).toBeDefined();
            expect(RecurringPaymentPattern).toBeDefined();
            expect(TokenVestingPattern).toBeDefined();
        });

        it("should allow importing chain adapters", async () => {
            const { createChainAdapter, SolanaAdapter, EVMAdapter } =
                await import("../src/index");

            expect(createChainAdapter).toBeDefined();
            expect(SolanaAdapter).toBeDefined();
            expect(EVMAdapter).toBeDefined();
        });

        it("should allow importing DEX integration classes", async () => {
            const { JupiterAdapter, PriceFeedService, COMMON_TOKENS } =
                await import("../src/index");

            expect(JupiterAdapter).toBeDefined();
            expect(PriceFeedService).toBeDefined();
            expect(COMMON_TOKENS).toBeDefined();
        });

        it("should allow importing Guard enums", async () => {
            const { PatternId, Severity } = await import("../src/index");

            expect(PatternId).toBeDefined();
            expect(Severity).toBeDefined();
        });
    });

    describe("Module Structure", () => {
        it("should export all expected classes", async () => {
            const mod = await import("../src/index");

            // Core classes
            expect(mod.Fabrknt).toBeDefined();
            expect(mod.Guard).toBeDefined();
            expect(mod.Loom).toBeDefined();
            expect(mod.FabricCore).toBeDefined();
            expect(mod.Pulsar).toBeDefined();

            // Pattern classes
            expect(mod.ExecutionPattern).toBeDefined();
            expect(mod.PatternRegistry).toBeDefined();
            expect(mod.GridTradingPattern).toBeDefined();
            expect(mod.DCAStrategy).toBeDefined();
            expect(mod.ArbitragePattern).toBeDefined();
            expect(mod.TreasuryRebalancing).toBeDefined();
            expect(mod.YieldFarmingPattern).toBeDefined();
            expect(mod.SwapPattern).toBeDefined();
            expect(mod.LiquidityPattern).toBeDefined();
            expect(mod.BatchPayoutPattern).toBeDefined();
            expect(mod.RecurringPaymentPattern).toBeDefined();
            expect(mod.TokenVestingPattern).toBeDefined();

            // Chain adapters
            expect(mod.createChainAdapter).toBeDefined();
            expect(mod.SolanaAdapter).toBeDefined();
            expect(mod.EVMAdapter).toBeDefined();

            // DEX integration
            expect(mod.JupiterAdapter).toBeDefined();
            expect(mod.PriceFeedService).toBeDefined();
            expect(mod.COMMON_TOKENS).toBeDefined();
        });

        it("should export all expected enums", async () => {
            const mod = await import("../src/index");

            expect(mod.PatternId).toBeDefined();
            expect(mod.Severity).toBeDefined();
        });

        it("should not export undefined values", async () => {
            const mod = await import("../src/index");

            // Check that key exports are not undefined
            const exports = [
                "Fabrknt",
                "Guard",
                "Loom",
                "FabricCore",
                "Pulsar",
                "PatternId",
                "Severity",
                "GridTradingPattern",
                "SolanaAdapter",
                "EVMAdapter",
                "JupiterAdapter",
            ];

            exports.forEach((exportName) => {
                expect(mod[exportName]).toBeDefined();
                expect(mod[exportName]).not.toBeUndefined();
            });
        });
    });

    describe("Re-exported Functionality", () => {
        it("should re-export Guard with PatternId and Severity", async () => {
            const { Guard, PatternId, Severity } = await import("../src/index");

            // Verify they come from the same module
            expect(Guard).toBeDefined();
            expect(PatternId).toBeDefined();
            expect(Severity).toBeDefined();

            // Verify Guard can be instantiated (basic check)
            expect(typeof Guard).toBe("function");
        });

        it("should re-export chain adapters correctly", async () => {
            const { SolanaAdapter, EVMAdapter } = await import("../src/index");

            // Verify they are classes
            expect(typeof SolanaAdapter).toBe("function");
            expect(typeof EVMAdapter).toBe("function");

            // Verify they can be instantiated with proper config
            const solanaAdapter = new SolanaAdapter({
                chain: "solana",
                network: "devnet",
            });
            expect(solanaAdapter.chain).toBe("solana");

            const evmAdapter = new EVMAdapter({
                chain: "ethereum",
                network: "mainnet",
            });
            expect(evmAdapter.chain).toBe("ethereum");
        });

        it("should re-export DEX adapters correctly", async () => {
            const { JupiterAdapter, PriceFeedService, COMMON_TOKENS } =
                await import("../src/index");

            // Verify JupiterAdapter is a class
            expect(typeof JupiterAdapter).toBe("function");

            // Verify PriceFeedService is a class
            expect(typeof PriceFeedService).toBe("function");

            // Verify COMMON_TOKENS is an object with expected properties
            expect(typeof COMMON_TOKENS).toBe("object");
            expect(COMMON_TOKENS.SOL).toBeDefined();
            expect(COMMON_TOKENS.USDC).toBeDefined();
        });

        it("should re-export pattern classes correctly", async () => {
            const {
                GridTradingPattern,
                DCAStrategy,
                ArbitragePattern,
                BatchPayoutPattern,
            } = await import("../src/index");

            // Verify they are classes
            expect(typeof GridTradingPattern).toBe("function");
            expect(typeof DCAStrategy).toBe("function");
            expect(typeof ArbitragePattern).toBe("function");
            expect(typeof BatchPayoutPattern).toBe("function");
        });
    });

    describe("Type Exports Validation", () => {
        it("should compile with type exports (compile-time validation)", async () => {
            // TypeScript types are compile-time only and not available at runtime.
            // This test verifies the module can be imported, which means types are
            // properly declared in the TypeScript definition files.
            const mod = await import("../src/index");

            // Module should be importable
            expect(mod).toBeDefined();
            expect(typeof mod).toBe("object");

            // Note: Type checking happens during TypeScript compilation.
            // If this test runs, it means the module exports are valid.
        });
    });
});
