/**
 * EVM Networks Test Suite
 *
 * Tests for EVM network configuration helper functions.
 * Covers network config retrieval, chain ID resolution, EIP-1559 compatibility,
 * and chain identification utilities.
 */

import { describe, it, expect } from "vitest";
import {
    getDefaultEVMNetworkConfig,
    getChainIdFromChain,
    isEIP1559Compatible,
    getSupportedEVMChains,
    getNetworksForChain,
    isEVMChain,
    type EVMNetworkConfig,
} from "../src/chain/evm-networks";
import type { ChainId } from "../src/chain/types";

describe("EVM Networks", () => {
    describe("getDefaultEVMNetworkConfig", () => {
        it("should return Ethereum mainnet configuration", () => {
            const config = getDefaultEVMNetworkConfig("ethereum", "mainnet");

            expect(config.name).toBe("Ethereum Mainnet");
            expect(config.chainId).toBe(1);
            expect(config.nativeCurrency).toBe("ETH");
            expect(config.decimals).toBe(18);
            expect(config.isTestnet).toBe(false);
            expect(config.rpcUrls).toHaveLength(3);
            expect(config.blockExplorer).toBe("https://etherscan.io");
            expect(config.defaultMaxPriorityFeePerGas).toBe(2_000_000_000n);
            expect(config.gasMultiplier).toBe(1.2);
        });

        it("should return Ethereum Sepolia testnet configuration", () => {
            const config = getDefaultEVMNetworkConfig("ethereum", "sepolia");

            expect(config.name).toBe("Ethereum Sepolia Testnet");
            expect(config.chainId).toBe(11155111);
            expect(config.nativeCurrency).toBe("ETH");
            expect(config.decimals).toBe(18);
            expect(config.isTestnet).toBe(true);
            expect(config.rpcUrls).toHaveLength(3);
            expect(config.blockExplorer).toBe("https://sepolia.etherscan.io");
            expect(config.defaultMaxPriorityFeePerGas).toBe(1_000_000_000n);
            expect(config.gasMultiplier).toBe(1.15);
        });

        it("should return Base mainnet configuration", () => {
            const config = getDefaultEVMNetworkConfig("base", "base-mainnet");

            expect(config.name).toBe("Base Mainnet");
            expect(config.chainId).toBe(8453);
            expect(config.nativeCurrency).toBe("ETH");
            expect(config.decimals).toBe(18);
            expect(config.isTestnet).toBe(false);
            expect(config.rpcUrls).toHaveLength(3);
            expect(config.blockExplorer).toBe("https://basescan.org");
            expect(config.defaultMaxPriorityFeePerGas).toBe(100_000n);
            expect(config.gasMultiplier).toBe(1.1);
        });

        it("should return Base Sepolia testnet configuration", () => {
            const config = getDefaultEVMNetworkConfig("base", "base-sepolia");

            expect(config.name).toBe("Base Sepolia Testnet");
            expect(config.chainId).toBe(84532);
            expect(config.nativeCurrency).toBe("ETH");
            expect(config.decimals).toBe(18);
            expect(config.isTestnet).toBe(true);
            expect(config.rpcUrls).toHaveLength(2);
            expect(config.blockExplorer).toBe("https://sepolia.basescan.org");
        });

        it("should return Arbitrum One configuration", () => {
            const config = getDefaultEVMNetworkConfig(
                "arbitrum",
                "arbitrum-one"
            );

            expect(config.name).toBe("Arbitrum One");
            expect(config.chainId).toBe(42161);
            expect(config.nativeCurrency).toBe("ETH");
            expect(config.decimals).toBe(18);
            expect(config.isTestnet).toBe(false);
            expect(config.rpcUrls).toHaveLength(3);
            expect(config.blockExplorer).toBe("https://arbiscan.io");
            expect(config.defaultMaxPriorityFeePerGas).toBe(100_000n);
            expect(config.gasMultiplier).toBe(1.15);
        });

        it("should return Arbitrum Sepolia testnet configuration", () => {
            const config = getDefaultEVMNetworkConfig(
                "arbitrum",
                "arbitrum-sepolia"
            );

            expect(config.name).toBe("Arbitrum Sepolia Testnet");
            expect(config.chainId).toBe(421614);
            expect(config.nativeCurrency).toBe("ETH");
            expect(config.decimals).toBe(18);
            expect(config.isTestnet).toBe(true);
            expect(config.rpcUrls).toHaveLength(2);
            expect(config.blockExplorer).toBe("https://sepolia.arbiscan.io");
        });

        it("should return Polygon mainnet configuration", () => {
            const config = getDefaultEVMNetworkConfig(
                "polygon",
                "polygon-mainnet"
            );

            expect(config.name).toBe("Polygon Mainnet");
            expect(config.chainId).toBe(137);
            expect(config.nativeCurrency).toBe("MATIC");
            expect(config.decimals).toBe(18);
            expect(config.isTestnet).toBe(false);
            expect(config.rpcUrls).toHaveLength(3);
            expect(config.blockExplorer).toBe("https://polygonscan.com");
            expect(config.defaultMaxPriorityFeePerGas).toBe(30_000_000_000n);
            expect(config.gasMultiplier).toBe(1.25);
        });

        it("should return Polygon Amoy testnet configuration", () => {
            const config = getDefaultEVMNetworkConfig(
                "polygon",
                "polygon-amoy"
            );

            expect(config.name).toBe("Polygon Amoy Testnet");
            expect(config.chainId).toBe(80002);
            expect(config.nativeCurrency).toBe("MATIC");
            expect(config.decimals).toBe(18);
            expect(config.isTestnet).toBe(true);
            expect(config.rpcUrls).toHaveLength(2);
            expect(config.blockExplorer).toBe("https://amoy.polygonscan.com");
            expect(config.defaultMaxPriorityFeePerGas).toBe(30_000_000_000n);
            expect(config.gasMultiplier).toBe(1.2);
        });

        it("should throw error for unsupported chain", () => {
            expect(() => {
                getDefaultEVMNetworkConfig("solana" as ChainId, "mainnet");
            }).toThrow("No network configuration found for chain: solana");
        });

        it("should throw error for unsupported network on valid chain", () => {
            expect(() => {
                getDefaultEVMNetworkConfig("ethereum", "invalid-network");
            }).toThrow(
                'No configuration found for network "invalid-network" on chain "ethereum"'
            );
        });

        it("should include available networks in error message", () => {
            try {
                getDefaultEVMNetworkConfig("ethereum", "invalid-network");
            } catch (error: any) {
                expect(error.message).toContain("Available networks");
                expect(error.message).toContain("mainnet");
                expect(error.message).toContain("sepolia");
            }
        });
    });

    describe("getChainIdFromChain", () => {
        it("should return correct chain ID for Ethereum mainnet", () => {
            const chainId = getChainIdFromChain("ethereum", "mainnet");
            expect(chainId).toBe(1);
        });

        it("should return correct chain ID for Ethereum Sepolia", () => {
            const chainId = getChainIdFromChain("ethereum", "sepolia");
            expect(chainId).toBe(11155111);
        });

        it("should return correct chain ID for Base mainnet", () => {
            const chainId = getChainIdFromChain("base", "base-mainnet");
            expect(chainId).toBe(8453);
        });

        it("should return correct chain ID for Arbitrum One", () => {
            const chainId = getChainIdFromChain("arbitrum", "arbitrum-one");
            expect(chainId).toBe(42161);
        });

        it("should return correct chain ID for Polygon mainnet", () => {
            const chainId = getChainIdFromChain("polygon", "polygon-mainnet");
            expect(chainId).toBe(137);
        });

        it("should throw error for invalid chain", () => {
            expect(() => {
                getChainIdFromChain("solana" as ChainId, "mainnet");
            }).toThrow();
        });
    });

    describe("isEIP1559Compatible", () => {
        it("should return true for Ethereum mainnet", () => {
            expect(isEIP1559Compatible(1)).toBe(true);
        });

        it("should return true for Ethereum Sepolia", () => {
            expect(isEIP1559Compatible(11155111)).toBe(true);
        });

        it("should return true for Base mainnet", () => {
            expect(isEIP1559Compatible(8453)).toBe(true);
        });

        it("should return true for Base Sepolia", () => {
            expect(isEIP1559Compatible(84532)).toBe(true);
        });

        it("should return true for Arbitrum One", () => {
            expect(isEIP1559Compatible(42161)).toBe(true);
        });

        it("should return true for Arbitrum Sepolia", () => {
            expect(isEIP1559Compatible(421614)).toBe(true);
        });

        it("should return true for Polygon mainnet", () => {
            expect(isEIP1559Compatible(137)).toBe(true);
        });

        it("should return true for Polygon Amoy", () => {
            expect(isEIP1559Compatible(80002)).toBe(true);
        });

        it("should return false for unsupported chain ID", () => {
            expect(isEIP1559Compatible(999999)).toBe(false);
        });

        it("should return false for chain ID 0", () => {
            expect(isEIP1559Compatible(0)).toBe(false);
        });

        it("should return false for negative chain ID", () => {
            expect(isEIP1559Compatible(-1)).toBe(false);
        });
    });

    describe("getSupportedEVMChains", () => {
        it("should return array of supported chain identifiers", () => {
            const chains = getSupportedEVMChains();

            expect(Array.isArray(chains)).toBe(true);
            expect(chains.length).toBe(4);
            expect(chains).toContain("ethereum");
            expect(chains).toContain("base");
            expect(chains).toContain("arbitrum");
            expect(chains).toContain("polygon");
        });

        it("should not include Solana", () => {
            const chains = getSupportedEVMChains();
            expect(chains).not.toContain("solana");
        });

        it("should return consistent results on multiple calls", () => {
            const chains1 = getSupportedEVMChains();
            const chains2 = getSupportedEVMChains();

            expect(chains1).toEqual(chains2);
        });
    });

    describe("getNetworksForChain", () => {
        it("should return networks for Ethereum", () => {
            const networks = getNetworksForChain("ethereum");

            expect(Array.isArray(networks)).toBe(true);
            expect(networks.length).toBe(2);
            expect(networks).toContain("mainnet");
            expect(networks).toContain("sepolia");
        });

        it("should return networks for Base", () => {
            const networks = getNetworksForChain("base");

            expect(Array.isArray(networks)).toBe(true);
            expect(networks.length).toBe(2);
            expect(networks).toContain("base-mainnet");
            expect(networks).toContain("base-sepolia");
        });

        it("should return networks for Arbitrum", () => {
            const networks = getNetworksForChain("arbitrum");

            expect(Array.isArray(networks)).toBe(true);
            expect(networks.length).toBe(2);
            expect(networks).toContain("arbitrum-one");
            expect(networks).toContain("arbitrum-sepolia");
        });

        it("should return networks for Polygon", () => {
            const networks = getNetworksForChain("polygon");

            expect(Array.isArray(networks)).toBe(true);
            expect(networks.length).toBe(2);
            expect(networks).toContain("polygon-mainnet");
            expect(networks).toContain("polygon-amoy");
        });

        it("should return empty array for unsupported chain", () => {
            const networks = getNetworksForChain("solana" as ChainId);

            expect(Array.isArray(networks)).toBe(true);
            expect(networks.length).toBe(0);
        });
    });

    describe("isEVMChain", () => {
        it("should return true for Ethereum", () => {
            expect(isEVMChain("ethereum")).toBe(true);
        });

        it("should return true for Base", () => {
            expect(isEVMChain("base")).toBe(true);
        });

        it("should return true for Arbitrum", () => {
            expect(isEVMChain("arbitrum")).toBe(true);
        });

        it("should return true for Polygon", () => {
            expect(isEVMChain("polygon")).toBe(true);
        });

        it("should return false for Solana", () => {
            expect(isEVMChain("solana")).toBe(false);
        });

        it("should return false for invalid chain identifier", () => {
            expect(isEVMChain("invalid" as ChainId)).toBe(false);
        });
    });

    describe("Network Configuration Properties", () => {
        it("should have all required properties in network config", () => {
            const config = getDefaultEVMNetworkConfig("ethereum", "mainnet");

            expect(config).toHaveProperty("name");
            expect(config).toHaveProperty("chainId");
            expect(config).toHaveProperty("nativeCurrency");
            expect(config).toHaveProperty("decimals");
            expect(config).toHaveProperty("rpcUrls");
            expect(config).toHaveProperty("gasMultiplier");
            expect(config).toHaveProperty("isTestnet");

            expect(typeof config.name).toBe("string");
            expect(typeof config.chainId).toBe("number");
            expect(typeof config.nativeCurrency).toBe("string");
            expect(typeof config.decimals).toBe("number");
            expect(Array.isArray(config.rpcUrls)).toBe(true);
            expect(typeof config.gasMultiplier).toBe("number");
            expect(typeof config.isTestnet).toBe("boolean");
        });

        it("should have at least one RPC URL for each network", () => {
            const chains: ChainId[] = [
                "ethereum",
                "base",
                "arbitrum",
                "polygon",
            ];

            chains.forEach((chain) => {
                const networks = getNetworksForChain(chain);
                networks.forEach((network) => {
                    const config = getDefaultEVMNetworkConfig(chain, network);
                    expect(config.rpcUrls.length).toBeGreaterThan(0);
                    expect(
                        config.rpcUrls.every((url) => typeof url === "string")
                    ).toBe(true);
                });
            });
        });

        it("should have valid gas multipliers", () => {
            const chains: ChainId[] = [
                "ethereum",
                "base",
                "arbitrum",
                "polygon",
            ];

            chains.forEach((chain) => {
                const networks = getNetworksForChain(chain);
                networks.forEach((network) => {
                    const config = getDefaultEVMNetworkConfig(chain, network);
                    expect(config.gasMultiplier).toBeGreaterThan(1);
                    expect(config.gasMultiplier).toBeLessThanOrEqual(2);
                });
            });
        });

        it("should have consistent testnet flags", () => {
            const mainnetConfig = getDefaultEVMNetworkConfig(
                "ethereum",
                "mainnet"
            );
            const testnetConfig = getDefaultEVMNetworkConfig(
                "ethereum",
                "sepolia"
            );

            expect(mainnetConfig.isTestnet).toBe(false);
            expect(testnetConfig.isTestnet).toBe(true);
        });
    });
});
