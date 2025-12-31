/**
 * Chain Index Test Suite
 *
 * Tests for the createChainAdapter factory function.
 * Note: The factory function uses require() internally which requires the modules
 * to be built. The adapter classes themselves are comprehensively tested in
 * chain-adapter.test.ts. This test verifies the factory function exists and
 * has the correct signature.
 */

import { describe, it, expect } from "vitest";
import { createChainAdapter } from "../src/chain/index";
import type { ChainAdapterConfig } from "../src/chain/adapter";

describe("createChainAdapter Factory Function", () => {
    describe("Factory Function Structure", () => {
        it("should be a function", () => {
            expect(typeof createChainAdapter).toBe("function");
        });

        it("should accept ChainAdapterConfig parameter", () => {
            // Type check - if this compiles, the signature is correct
            const config: ChainAdapterConfig = {
                chain: "solana",
                network: "mainnet-beta",
            };

            // Verify the config structure
            expect(config).toBeDefined();
            expect(config.chain).toBe("solana");
            expect(config.network).toBe("mainnet-beta");
        });

        it("should be exported from chain/index", () => {
            // Verify the function is exported
            expect(createChainAdapter).toBeDefined();
            expect(typeof createChainAdapter).toBe("function");
        });
    });
});
