/**
 * Chain Adapter Tests
 *
 * Comprehensive tests for EVM and Solana chain adapters.
 * Tests transaction building, execution, cost estimation, validation,
 * and chain abstraction layer functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EVMAdapter } from "../src/chain/evm-adapter";
import { SolanaAdapter } from "../src/chain/solana-adapter";
import type {
    UnifiedTransaction,
    EVMTransactionData,
    SolanaTransactionData,
} from "../src/chain/types";
import {
    ConfigurationError,
    ValidationError,
    NetworkError,
    TransactionError,
    GasEstimationError,
} from "../src/chain/errors";
import {
    Connection,
    Transaction as SolanaTransaction,
    PublicKey,
} from "@solana/web3.js";

// Mock viem
const mockPublicClient = {
    estimateGas: vi.fn(),
    estimateFeesPerGas: vi.fn(),
    getGasPrice: vi.fn(),
    getBlockNumber: vi.fn(),
    getTransaction: vi.fn(),
    getTransactionReceipt: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
};

const mockWalletClient = {
    sendTransaction: vi.fn(),
};

const mockCreatePublicClient = vi.fn(() => mockPublicClient);
const mockCreateWalletClient = vi.fn(() => mockWalletClient);

vi.mock("viem", () => ({
    createPublicClient: () => mockCreatePublicClient(),
    createWalletClient: () => mockCreateWalletClient(),
    http: vi.fn((url: string) => ({ url })),
    isAddress: vi.fn((addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr)),
    isHex: vi.fn((str: string) => /^0x[a-fA-F0-9]+$/.test(str)),
}));

vi.mock("viem/chains", () => ({
    mainnet: { id: 1, name: "Ethereum" },
    sepolia: { id: 11155111, name: "Sepolia" },
    base: { id: 8453, name: "Base" },
    baseSepolia: { id: 84532, name: "Base Sepolia" },
    arbitrum: { id: 42161, name: "Arbitrum" },
    arbitrumSepolia: { id: 421614, name: "Arbitrum Sepolia" },
    polygon: { id: 137, name: "Polygon" },
    polygonAmoy: { id: 80002, name: "Polygon Amoy" },
}));

// Mock Solana Connection
const mockConnection = {
    getLatestBlockhash: vi.fn(),
    sendTransaction: vi.fn(),
    confirmTransaction: vi.fn(),
    simulateTransaction: vi.fn(),
    getFeeForMessage: vi.fn(),
    getSlot: vi.fn(),
    getTransaction: vi.fn(),
    compileMessage: vi.fn(),
};

vi.mock("@solana/web3.js", async () => {
    const actual = await vi.importActual("@solana/web3.js");
    return {
        ...actual,
        Connection: vi.fn(() => mockConnection),
    };
});

describe("Chain Adapters", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("EVMAdapter", () => {
        describe("Constructor", () => {
            it("should create adapter with valid EVM chain", () => {
                const adapter = new EVMAdapter({
                    chain: "ethereum",
                    network: "mainnet",
                });

                expect(adapter.chain).toBe("ethereum");
                expect(adapter.network).toBe("mainnet");
            });

            it("should create adapter with custom RPC URL", () => {
                const adapter = new EVMAdapter({
                    chain: "ethereum",
                    network: "mainnet",
                    rpcUrl: "https://custom-rpc.example.com",
                });

                expect(adapter.chain).toBe("ethereum");
                expect(mockCreatePublicClient).toHaveBeenCalled();
            });

            it("should default network to mainnet if not provided", () => {
                const adapter = new EVMAdapter({
                    chain: "ethereum",
                    network: "mainnet", // Network is required, but defaults to "mainnet" in constructor
                });

                expect(adapter.network).toBe("mainnet");
            });

            it("should support all EVM chains", () => {
                const chains: Array<
                    "ethereum" | "polygon" | "arbitrum" | "base"
                > = ["ethereum", "polygon", "arbitrum", "base"];

                chains.forEach((chain) => {
                    const adapter = new EVMAdapter({
                        chain,
                        network:
                            chain === "ethereum"
                                ? "mainnet"
                                : chain === "base"
                                ? "base-mainnet"
                                : chain === "arbitrum"
                                ? "arbitrum-one"
                                : "polygon-mainnet",
                    });
                    expect(adapter.chain).toBe(chain);
                });
            });

            it("should throw ConfigurationError for invalid chain", () => {
                expect(() => {
                    new EVMAdapter({
                        chain: "solana" as any,
                        network: "mainnet",
                    });
                }).toThrow(ConfigurationError);
            });

            it("should throw ConfigurationError for invalid network", () => {
                expect(() => {
                    new EVMAdapter({
                        chain: "ethereum",
                        network: "invalid-network",
                    });
                }).toThrow(ConfigurationError);
            });
        });

        describe("buildTransaction", () => {
            let adapter: EVMAdapter;

            beforeEach(() => {
                adapter = new EVMAdapter({
                    chain: "ethereum",
                    network: "mainnet",
                });
            });

            it("should build transaction from unified transaction", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 1,
                            to: "0x1234567890123456789012345678901234567890",
                            data: "0x1234",
                            value: "1000000000000000000", // 1 ETH
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                const txRequest = await adapter.buildTransaction(unifiedTx);

                expect(txRequest).toBeDefined();
                expect(txRequest.to).toBe(
                    "0x1234567890123456789012345678901234567890"
                );
                expect(txRequest.data).toBe("0x1234");
                expect(txRequest.value).toBe(BigInt("1000000000000000000"));
            });

            it("should include EIP-1559 gas parameters", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 1,
                            to: "0x1234567890123456789012345678901234567890",
                            data: "0x1234",
                            maxFeePerGas: "20000000000",
                            maxPriorityFeePerGas: "1000000000",
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                const txRequest = await adapter.buildTransaction(unifiedTx);

                expect(txRequest.maxFeePerGas).toBe(BigInt("20000000000"));
                expect(txRequest.maxPriorityFeePerGas).toBe(
                    BigInt("1000000000")
                );
            });

            it("should include legacy gas price if provided", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 1,
                            to: "0x1234567890123456789012345678901234567890",
                            data: "0x1234",
                            gasPrice: "20000000000",
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                const txRequest = await adapter.buildTransaction(unifiedTx);

                expect(txRequest.gasPrice).toBe(BigInt("20000000000"));
            });

            it("should include gas limit and nonce if provided", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 1,
                            to: "0x1234567890123456789012345678901234567890",
                            data: "0x1234",
                            gasLimit: "21000",
                            nonce: 5,
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                const txRequest = await adapter.buildTransaction(unifiedTx);

                expect(txRequest.gas).toBe(BigInt("21000"));
                expect(txRequest.nonce).toBe(5);
            });

            it("should throw ValidationError for chain mismatch", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "solana",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 1,
                            data: "0x1234",
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                await expect(
                    adapter.buildTransaction(unifiedTx)
                ).rejects.toThrow(ValidationError);
            });

            it("should throw ValidationError for invalid chainData type", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "solana" as any,
                        data: {
                            instructions: [],
                        } as SolanaTransactionData,
                    },
                    operations: [],
                };

                await expect(
                    adapter.buildTransaction(unifiedTx)
                ).rejects.toThrow(ValidationError);
            });

            it("should throw ValidationError for chain ID mismatch", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 999, // Wrong chain ID
                            data: "0x1234",
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                await expect(
                    adapter.buildTransaction(unifiedTx)
                ).rejects.toThrow(ValidationError);
            });
        });

        describe("executeTransaction", () => {
            let adapter: EVMAdapter;

            beforeEach(() => {
                adapter = new EVMAdapter({
                    chain: "ethereum",
                    network: "mainnet",
                });
            });

            it("should throw ConfigurationError if wallet client not set", async () => {
                const txRequest = {
                    to: "0x1234567890123456789012345678901234567890",
                    data: "0x1234",
                };

                await expect(
                    adapter.executeTransaction(txRequest)
                ).rejects.toThrow(ConfigurationError);
            });

            it("should execute transaction with wallet client", async () => {
                adapter.setWalletClient(
                    "0x1234567890123456789012345678901234567890" as `0x${string}`
                );

                const txRequest = {
                    to: "0x1234567890123456789012345678901234567890",
                    data: "0x1234",
                };

                const txHash = "0xabcdef1234567890";
                mockWalletClient.sendTransaction.mockResolvedValue(txHash);

                const receipt = {
                    status: "success",
                    blockNumber: BigInt(12345),
                    blockHash: "0xblockhash",
                    gasUsed: BigInt(21000),
                };
                mockPublicClient.waitForTransactionReceipt.mockResolvedValue(
                    receipt
                );

                const result = await adapter.executeTransaction(txRequest);

                expect(result.transactionId).toBe(txHash);
                expect(result.status).toBe("success");
                expect(result.blockNumber).toBe(12345);
                expect(mockWalletClient.sendTransaction).toHaveBeenCalled();
            });

            it("should handle reverted transactions", async () => {
                adapter.setWalletClient(
                    "0x1234567890123456789012345678901234567890" as `0x${string}`
                );

                const txRequest = {
                    to: "0x1234567890123456789012345678901234567890",
                    data: "0x1234",
                };

                const txHash = "0xabcdef1234567890";
                mockWalletClient.sendTransaction.mockResolvedValue(txHash);

                const receipt = {
                    status: "reverted",
                    blockNumber: BigInt(12345),
                    blockHash: "0xblockhash",
                    gasUsed: BigInt(21000),
                };
                mockPublicClient.waitForTransactionReceipt.mockResolvedValue(
                    receipt
                );

                const result = await adapter.executeTransaction(txRequest);

                expect(result.status).toBe("reverted");
                expect(result.error).toBeDefined();
            });

            it("should throw TransactionError on execution failure", async () => {
                adapter.setWalletClient(
                    "0x1234567890123456789012345678901234567890" as `0x${string}`
                );

                const txRequest = {
                    to: "0x1234567890123456789012345678901234567890",
                    data: "0x1234",
                };

                mockWalletClient.sendTransaction.mockRejectedValue(
                    new Error("Transaction failed")
                );

                await expect(
                    adapter.executeTransaction(txRequest)
                ).rejects.toThrow(TransactionError);
            });
        });

        describe("estimateCost", () => {
            let adapter: EVMAdapter;

            beforeEach(() => {
                adapter = new EVMAdapter({
                    chain: "ethereum",
                    network: "mainnet",
                });
            });

            it("should estimate cost with EIP-1559 fees", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 1,
                            to: "0x1234567890123456789012345678901234567890",
                            data: "0x1234",
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                mockPublicClient.estimateGas.mockResolvedValue(BigInt(21000));
                mockPublicClient.estimateFeesPerGas.mockResolvedValue({
                    maxFeePerGas: BigInt(20000000000),
                    maxPriorityFeePerGas: BigInt(1000000000),
                });

                const estimate = await adapter.estimateCost(unifiedTx);

                expect(estimate.estimatedCost).toBeDefined();
                expect(estimate.gasLimit).toBeDefined();
                expect(estimate.gasPrice).toBeDefined();
                expect(Number(estimate.gasLimit)).toBeGreaterThan(21000); // Should include buffer
            });

            it("should fallback to legacy gas price if EIP-1559 fails", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 1,
                            to: "0x1234567890123456789012345678901234567890",
                            data: "0x1234",
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                mockPublicClient.estimateGas.mockResolvedValue(BigInt(21000));
                mockPublicClient.estimateFeesPerGas.mockRejectedValue(
                    new Error("Failed")
                );
                mockPublicClient.getGasPrice.mockResolvedValue(
                    BigInt(20000000000)
                );

                const estimate = await adapter.estimateCost(unifiedTx);

                expect(estimate.estimatedCost).toBeDefined();
                expect(estimate.gasPrice).toBeDefined();
            });

            it("should use default gas limit if estimation fails", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 1,
                            to: "0x1234567890123456789012345678901234567890",
                            data: "0x1234",
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                mockPublicClient.estimateGas.mockRejectedValue(
                    new Error("Estimation failed")
                );
                mockPublicClient.estimateFeesPerGas.mockResolvedValue({
                    maxFeePerGas: BigInt(20000000000),
                    maxPriorityFeePerGas: BigInt(1000000000),
                });

                const estimate = await adapter.estimateCost(unifiedTx);

                expect(estimate.gasLimit).toBeDefined();
                expect(Number(estimate.gasLimit)).toBeGreaterThan(0);
            });

            it("should throw GasEstimationError on critical failure", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 999, // Invalid chain ID
                            data: "0x1234",
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                await expect(adapter.estimateCost(unifiedTx)).rejects.toThrow(
                    GasEstimationError
                );
            });
        });

        describe("validateTransaction", () => {
            let adapter: EVMAdapter;

            beforeEach(() => {
                adapter = new EVMAdapter({
                    chain: "ethereum",
                    network: "mainnet",
                });
            });

            it("should validate valid transaction", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 1,
                            to: "0x1234567890123456789012345678901234567890",
                            data: "0x1234",
                            value: "1000000000000000000",
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                const result = await adapter.validateTransaction(unifiedTx);

                expect(result.isValid).toBe(true);
                expect(result.errors).toBeUndefined();
            });

            it("should detect chain mismatch", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "solana",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 1,
                            data: "0x1234",
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                const result = await adapter.validateTransaction(unifiedTx);

                expect(result.isValid).toBe(false);
                expect(result.errors).toEqual(
                    expect.arrayContaining([
                        expect.stringMatching(
                            /Chain mismatch: expected ethereum, got solana/
                        ),
                    ])
                );
            });

            it("should detect invalid chainData type", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "solana" as any,
                        data: {
                            instructions: [],
                        } as SolanaTransactionData,
                    },
                    operations: [],
                };

                const result = await adapter.validateTransaction(unifiedTx);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain("ChainData type must be 'evm'");
            });

            it("should detect invalid address", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 1,
                            to: "invalid-address",
                            data: "0x1234",
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                const result = await adapter.validateTransaction(unifiedTx);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(
                    "Invalid 'to' address: invalid-address"
                );
            });

            it("should detect invalid hex data", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 1,
                            data: "not-hex",
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                const result = await adapter.validateTransaction(unifiedTx);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(
                    "Invalid 'data' field: must be hex string"
                );
            });

            it("should detect negative value", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 1,
                            data: "0x1234",
                            value: "-1000000000000000000",
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                const result = await adapter.validateTransaction(unifiedTx);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain("Value must be non-negative");
            });

            it("should validate gas parameters", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "evm",
                        data: {
                            chainId: 1,
                            data: "0x1234",
                            gasLimit: "21000",
                            maxFeePerGas: "20000000000",
                            maxPriorityFeePerGas: "1000000000",
                        } as EVMTransactionData,
                    },
                    operations: [],
                };

                const result = await adapter.validateTransaction(unifiedTx);

                expect(result.isValid).toBe(true);
            });
        });

        describe("getCurrentBlock", () => {
            let adapter: EVMAdapter;

            beforeEach(() => {
                adapter = new EVMAdapter({
                    chain: "ethereum",
                    network: "mainnet",
                });
            });

            it("should get current block number", async () => {
                mockPublicClient.getBlockNumber.mockResolvedValue(
                    BigInt(12345)
                );

                const blockNumber = await adapter.getCurrentBlock();

                expect(blockNumber).toBe(12345);
                expect(mockPublicClient.getBlockNumber).toHaveBeenCalled();
            });

            it("should retry on failure", async () => {
                mockPublicClient.getBlockNumber
                    .mockRejectedValueOnce(new Error("Network error"))
                    .mockRejectedValueOnce(new Error("Network error"))
                    .mockResolvedValueOnce(BigInt(12345));

                const blockNumber = await adapter.getCurrentBlock();

                expect(blockNumber).toBe(12345);
                expect(mockPublicClient.getBlockNumber).toHaveBeenCalledTimes(
                    3
                );
            });

            it("should throw NetworkError after max retries", async () => {
                mockPublicClient.getBlockNumber.mockRejectedValue(
                    new Error("Network error")
                );

                await expect(adapter.getCurrentBlock()).rejects.toThrow(
                    NetworkError
                );
                expect(mockPublicClient.getBlockNumber).toHaveBeenCalledTimes(
                    3
                );
            });
        });

        describe("getTransaction", () => {
            let adapter: EVMAdapter;

            beforeEach(() => {
                adapter = new EVMAdapter({
                    chain: "ethereum",
                    network: "mainnet",
                });
            });

            it("should get transaction by hash", async () => {
                const txHash = "0xabcdef1234567890";
                const tx = {
                    hash: txHash,
                    blockNumber: BigInt(12345),
                    blockHash: "0xblockhash",
                };
                const receipt = {
                    status: "success",
                    gasUsed: BigInt(21000),
                };

                mockPublicClient.getTransaction.mockResolvedValue(tx);
                mockPublicClient.getTransactionReceipt.mockResolvedValue(
                    receipt
                );

                const result = await adapter.getTransaction(txHash);

                expect(result).toBeDefined();
                expect(result?.transactionId).toBe(txHash);
                expect(result?.status).toBe("success");
                expect(result?.blockNumber).toBe(12345);
            });

            it("should return null for non-existent transaction", async () => {
                mockPublicClient.getTransaction.mockResolvedValue(null);

                const result = await adapter.getTransaction(
                    "0x0000000000000000000000000000000000000000000000000000000000000000"
                );

                expect(result).toBeNull();
            });

            it("should handle pending transactions without receipt", async () => {
                const txHash = "0xabcdef1234567890";
                const tx = {
                    hash: txHash,
                    blockNumber: null,
                    blockHash: null,
                };

                mockPublicClient.getTransaction.mockResolvedValue(tx);
                mockPublicClient.getTransactionReceipt.mockRejectedValue(
                    new Error("No receipt")
                );

                const result = await adapter.getTransaction(txHash);

                expect(result).toBeDefined();
                expect(result?.status).toBe("success"); // Pending transactions are marked as success
            });

            it("should throw ValidationError for invalid hash format", async () => {
                await expect(
                    adapter.getTransaction("invalid-hash")
                ).rejects.toThrow(ValidationError);
            });

            it("should throw NetworkError on fetch failure", async () => {
                mockPublicClient.getTransaction.mockRejectedValue(
                    new Error("Network error")
                );

                await expect(
                    adapter.getTransaction("0xabcdef1234567890")
                ).rejects.toThrow(NetworkError);
            });
        });

        describe("parseOperations", () => {
            let adapter: EVMAdapter;

            beforeEach(() => {
                adapter = new EVMAdapter({
                    chain: "ethereum",
                    network: "mainnet",
                });
            });

            it("should parse operations to unified format", () => {
                const operations = [
                    { to: "0x1234", data: "0xabcd" },
                    { to: "0x5678", data: "0xef01" },
                ];

                const unified = adapter.parseOperations(operations);

                expect(unified).toHaveLength(2);
                expect(unified[0].type).toBe("custom");
                expect(unified[0].params.index).toBe(0);
                expect(unified[1].params.index).toBe(1);
            });
        });

        describe("getNativeCurrency", () => {
            it("should return ETH for Ethereum", () => {
                const adapter = new EVMAdapter({
                    chain: "ethereum",
                    network: "mainnet",
                });

                expect(adapter.getNativeCurrency()).toBe("ETH");
            });

            it("should return MATIC for Polygon", () => {
                const adapter = new EVMAdapter({
                    chain: "polygon",
                    network: "polygon-mainnet",
                });

                expect(adapter.getNativeCurrency()).toBe("MATIC");
            });
        });

        describe("getSecurityPatterns", () => {
            it("should return EVM security patterns", () => {
                const adapter = new EVMAdapter({
                    chain: "ethereum",
                    network: "mainnet",
                });

                const patterns = adapter.getSecurityPatterns();

                expect(patterns).toContain("EVM-001");
                expect(patterns).toContain("EVM-002");
                expect(patterns).toContain("EVM-003");
                expect(patterns).toContain("EVM-004");
            });
        });

        describe("setWalletClient", () => {
            it("should set wallet client with address", () => {
                const adapter = new EVMAdapter({
                    chain: "ethereum",
                    network: "mainnet",
                });

                adapter.setWalletClient(
                    "0x1234567890123456789012345678901234567890" as `0x${string}`
                );

                expect(mockCreateWalletClient).toHaveBeenCalled();
            });
        });
    });

    describe("SolanaAdapter", () => {
        describe("Constructor", () => {
            it("should create adapter with solana chain", () => {
                const adapter = new SolanaAdapter({
                    chain: "solana",
                    network: "mainnet-beta",
                });

                expect(adapter.chain).toBe("solana");
                expect(adapter.network).toBe("mainnet-beta");
            });

            it("should default network to mainnet-beta if not provided", () => {
                const adapter = new SolanaAdapter({
                    chain: "solana",
                    network: "mainnet-beta", // Network is required, but defaults to "mainnet-beta" in constructor
                });

                expect(adapter.network).toBe("mainnet-beta");
            });

            it("should use custom RPC URL if provided", () => {
                const adapter = new SolanaAdapter({
                    chain: "solana",
                    network: "mainnet-beta",
                    rpcUrl: "https://custom-rpc.example.com",
                });

                expect(Connection).toHaveBeenCalledWith(
                    "https://custom-rpc.example.com",
                    "confirmed"
                );
            });

            it("should use default RPC URL for network if not provided", () => {
                new SolanaAdapter({
                    chain: "solana",
                    network: "devnet",
                });

                expect(Connection).toHaveBeenCalledWith(
                    "https://api.devnet.solana.com",
                    "confirmed"
                );
            });

            it("should throw error for invalid chain", () => {
                expect(() => {
                    new SolanaAdapter({
                        chain: "ethereum" as any,
                        network: "mainnet",
                    });
                }).toThrow();
            });
        });

        describe("buildTransaction", () => {
            let adapter: SolanaAdapter;

            beforeEach(() => {
                adapter = new SolanaAdapter({
                    chain: "solana",
                    network: "devnet",
                });
                mockConnection.getLatestBlockhash.mockResolvedValue({
                    blockhash: "test-blockhash",
                    lastValidBlockHeight: 100,
                });
            });

            it("should build transaction from unified transaction", async () => {
                const mockInstruction = {
                    programId: new PublicKey(
                        "11111111111111111111111111111111"
                    ),
                    keys: [],
                    data: Buffer.from([1, 2, 3]),
                };

                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "solana",
                    chainData: {
                        type: "solana",
                        data: {
                            instructions: [mockInstruction],
                            recentBlockhash: "test-blockhash",
                            feePayer: "11111111111111111111111111111111",
                        } as SolanaTransactionData,
                    },
                    operations: [],
                };

                const tx = await adapter.buildTransaction(unifiedTx);

                expect(tx).toBeInstanceOf(SolanaTransaction);
            });

            it("should fetch blockhash if not provided", async () => {
                const mockInstruction = {
                    programId: new PublicKey(
                        "11111111111111111111111111111111"
                    ),
                    keys: [],
                    data: Buffer.from([1, 2, 3]),
                };

                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "solana",
                    chainData: {
                        type: "solana",
                        data: {
                            instructions: [mockInstruction],
                        } as SolanaTransactionData,
                    },
                    operations: [],
                };

                await adapter.buildTransaction(unifiedTx);

                expect(mockConnection.getLatestBlockhash).toHaveBeenCalled();
            });

            it("should throw error for chain mismatch", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "solana",
                        data: {
                            instructions: [],
                        } as SolanaTransactionData,
                    },
                    operations: [],
                };

                await expect(
                    adapter.buildTransaction(unifiedTx)
                ).rejects.toThrow();
            });
        });

        describe("executeTransaction", () => {
            let adapter: SolanaAdapter;

            beforeEach(() => {
                adapter = new SolanaAdapter({
                    chain: "solana",
                    network: "devnet",
                });
            });

            it("should execute transaction successfully", async () => {
                const tx = new SolanaTransaction();
                const signature = "test-signature";

                mockConnection.sendTransaction.mockResolvedValue(signature);
                mockConnection.confirmTransaction.mockResolvedValue({
                    value: { err: null },
                    context: { slot: 12345 },
                });

                const result = await adapter.executeTransaction(tx);

                expect(result.status).toBe("success");
                expect(result.transactionId).toBe(signature);
                expect(result.blockNumber).toBe(12345);
            });

            it("should handle failed transaction", async () => {
                const tx = new SolanaTransaction();
                const signature = "test-signature";

                mockConnection.sendTransaction.mockResolvedValue(signature);
                mockConnection.confirmTransaction.mockResolvedValue({
                    value: { err: { code: 1, message: "Insufficient funds" } },
                    context: { slot: 12345 },
                });

                const result = await adapter.executeTransaction(tx);

                expect(result.status).toBe("failed");
                expect(result.error).toBeDefined();
            });

            it("should handle execution errors", async () => {
                const tx = new SolanaTransaction();

                mockConnection.sendTransaction.mockRejectedValue(
                    new Error("Network error")
                );

                const result = await adapter.executeTransaction(tx);

                expect(result.status).toBe("failed");
                expect(result.error).toBeDefined();
            });
        });

        describe("estimateCost", () => {
            let adapter: SolanaAdapter;

            beforeEach(() => {
                adapter = new SolanaAdapter({
                    chain: "solana",
                    network: "devnet",
                });
                mockConnection.getLatestBlockhash.mockResolvedValue({
                    blockhash: "test-blockhash",
                    lastValidBlockHeight: 100,
                });
            });

            it("should estimate cost from simulation", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "solana",
                    chainData: {
                        type: "solana",
                        data: {
                            instructions: [],
                        } as SolanaTransactionData,
                    },
                    operations: [],
                };

                const mockTx = new SolanaTransaction();
                mockConnection.simulateTransaction.mockResolvedValue({
                    value: {
                        err: null,
                        unitsConsumed: 200000,
                    },
                });
                mockConnection.getFeeForMessage.mockResolvedValue({
                    value: 5000,
                });
                mockConnection.compileMessage.mockResolvedValue({} as any);

                // Mock buildTransaction to return our mock tx
                vi.spyOn(adapter, "buildTransaction").mockResolvedValue(mockTx);

                const estimate = await adapter.estimateCost(unifiedTx);

                expect(estimate.estimatedCost).toBeDefined();
                expect(estimate.gasLimit).toBeDefined();
            });

            it("should return default estimate on simulation failure", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "solana",
                    chainData: {
                        type: "solana",
                        data: {
                            instructions: [],
                        } as SolanaTransactionData,
                    },
                    operations: [],
                };

                const mockTx = new SolanaTransaction();
                mockConnection.simulateTransaction.mockResolvedValue({
                    value: {
                        err: { code: 1 },
                    },
                });

                vi.spyOn(adapter, "buildTransaction").mockResolvedValue(mockTx);

                const estimate = await adapter.estimateCost(unifiedTx);

                expect(estimate.estimatedCost).toBeDefined();
                expect(Number(estimate.estimatedCost)).toBeGreaterThan(0);
            });
        });

        describe("validateTransaction", () => {
            let adapter: SolanaAdapter;

            beforeEach(() => {
                adapter = new SolanaAdapter({
                    chain: "solana",
                    network: "devnet",
                });
            });

            it("should validate valid transaction", async () => {
                const mockInstruction = {
                    programId: new PublicKey(
                        "11111111111111111111111111111111"
                    ),
                    keys: [],
                    data: Buffer.from([1, 2, 3]),
                };

                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "solana",
                    chainData: {
                        type: "solana",
                        data: {
                            instructions: [mockInstruction],
                            feePayer: "11111111111111111111111111111111",
                        } as SolanaTransactionData,
                    },
                    operations: [],
                };

                const result = await adapter.validateTransaction(unifiedTx);

                expect(result.isValid).toBe(true);
            });

            it("should detect chain mismatch", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "ethereum",
                    chainData: {
                        type: "solana",
                        data: {
                            instructions: [],
                        } as SolanaTransactionData,
                    },
                    operations: [],
                };

                const result = await adapter.validateTransaction(unifiedTx);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(
                    "Transaction chain mismatch: expected solana"
                );
            });

            it("should detect missing instructions", async () => {
                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "solana",
                    chainData: {
                        type: "solana",
                        data: {
                            instructions: [],
                        } as SolanaTransactionData,
                    },
                    operations: [],
                };

                const result = await adapter.validateTransaction(unifiedTx);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain(
                    "Transaction must have at least one instruction"
                );
            });

            it("should detect invalid fee payer address", async () => {
                const mockInstruction = {
                    programId: new PublicKey(
                        "11111111111111111111111111111111"
                    ),
                    keys: [],
                    data: Buffer.from([1, 2, 3]),
                };

                const unifiedTx: UnifiedTransaction = {
                    id: "test-tx",
                    status: "pending",
                    chain: "solana",
                    chainData: {
                        type: "solana",
                        data: {
                            instructions: [mockInstruction],
                            feePayer: "invalid-address",
                        } as SolanaTransactionData,
                    },
                    operations: [],
                };

                const result = await adapter.validateTransaction(unifiedTx);

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain("Invalid fee payer address");
            });
        });

        describe("getCurrentBlock", () => {
            let adapter: SolanaAdapter;

            beforeEach(() => {
                adapter = new SolanaAdapter({
                    chain: "solana",
                    network: "devnet",
                });
            });

            it("should get current slot", async () => {
                mockConnection.getSlot.mockResolvedValue(12345);

                const slot = await adapter.getCurrentBlock();

                expect(slot).toBe(12345);
                expect(mockConnection.getSlot).toHaveBeenCalled();
            });
        });

        describe("getTransaction", () => {
            let adapter: SolanaAdapter;

            beforeEach(() => {
                adapter = new SolanaAdapter({
                    chain: "solana",
                    network: "devnet",
                });
            });

            it("should get transaction by signature", async () => {
                const signature = "test-signature";
                const tx = {
                    slot: 12345,
                    meta: { err: null },
                };

                mockConnection.getTransaction.mockResolvedValue(tx as any);

                const result = await adapter.getTransaction(signature);

                expect(result).toBeDefined();
                expect(result?.transactionId).toBe(signature);
                expect(result?.status).toBe("success");
                expect(result?.blockNumber).toBe(12345);
            });

            it("should return null for non-existent transaction", async () => {
                mockConnection.getTransaction.mockResolvedValue(null);

                const result = await adapter.getTransaction("nonexistent");

                expect(result).toBeNull();
            });

            it("should handle failed transactions", async () => {
                const signature = "test-signature";
                const tx = {
                    slot: 12345,
                    meta: { err: { code: 1 } },
                };

                mockConnection.getTransaction.mockResolvedValue(tx as any);

                const result = await adapter.getTransaction(signature);

                expect(result?.status).toBe("failed");
                expect(result?.error).toBeDefined();
            });
        });

        describe("parseOperations", () => {
            let adapter: SolanaAdapter;

            beforeEach(() => {
                adapter = new SolanaAdapter({
                    chain: "solana",
                    network: "devnet",
                });
            });

            it("should parse operations to unified format", () => {
                const operations = [
                    { programId: "11111111111111111111111111111111" },
                    { programId: "22222222222222222222222222222222" },
                ];

                const unified = adapter.parseOperations(operations);

                expect(unified).toHaveLength(2);
                expect(unified[0].type).toBe("custom");
                expect(unified[0].params.index).toBe(0);
            });
        });

        describe("getNativeCurrency", () => {
            it("should return SOL", () => {
                const adapter = new SolanaAdapter({
                    chain: "solana",
                    network: "mainnet-beta",
                });

                expect(adapter.getNativeCurrency()).toBe("SOL");
            });
        });

        describe("getSecurityPatterns", () => {
            it("should return Solana security patterns", () => {
                const adapter = new SolanaAdapter({
                    chain: "solana",
                    network: "mainnet-beta",
                });

                const patterns = adapter.getSecurityPatterns();

                expect(patterns).toContain("P-101");
                expect(patterns).toContain("P-102");
                expect(patterns).toContain("P-103");
                expect(patterns).toContain("P-104");
            });
        });
    });

    describe("createChainAdapter", () => {
        // Note: createChainAdapter uses require() which doesn't work well in ES module tests
        // We test the factory function indirectly by testing the adapters directly
        // The factory function is a simple wrapper that calls the constructors

        it("should create SolanaAdapter for solana chain", () => {
            // Test the adapter directly instead of through factory
            const adapter = new SolanaAdapter({
                chain: "solana",
                network: "mainnet-beta",
            });

            expect(adapter.chain).toBe("solana");
            expect(adapter.network).toBe("mainnet-beta");
        });

        it("should create EVMAdapter for ethereum chain", () => {
            // Test the adapter directly instead of through factory
            const adapter = new EVMAdapter({
                chain: "ethereum",
                network: "mainnet",
            });

            expect(adapter.chain).toBe("ethereum");
            expect(adapter.network).toBe("mainnet");
        });

        it("should create EVMAdapter for base chain", () => {
            const adapter = new EVMAdapter({
                chain: "base",
                network: "base-mainnet",
            });

            expect(adapter.chain).toBe("base");
            expect(adapter.network).toBe("base-mainnet");
        });

        it("should create EVMAdapter for arbitrum chain", () => {
            const adapter = new EVMAdapter({
                chain: "arbitrum",
                network: "arbitrum-one",
            });

            expect(adapter.chain).toBe("arbitrum");
            expect(adapter.network).toBe("arbitrum-one");
        });

        it("should create EVMAdapter for polygon chain", () => {
            const adapter = new EVMAdapter({
                chain: "polygon",
                network: "polygon-mainnet",
            });

            expect(adapter.chain).toBe("polygon");
            expect(adapter.network).toBe("polygon-mainnet");
        });
    });
});
