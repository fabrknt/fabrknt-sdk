/**
 * Solana Chain Adapter
 *
 * Implements the ChainAdapter interface for Solana blockchain.
 * This adapter handles Solana-specific transaction building, execution,
 * and cost estimation while providing a unified interface for portable components.
 */

import type {
    UnifiedTransaction,
    TransactionResult,
    CostEstimate,
    UnifiedOperation,
    SolanaTransactionData,
} from "./types";
import type {
    ChainAdapter,
    ChainAdapterConfig,
} from "./adapter";
import { Connection, Transaction as SolanaTransaction, PublicKey } from "@solana/web3.js";

/**
 * Solana chain adapter implementation
 */
export class SolanaAdapter implements ChainAdapter {
    readonly chain: "solana" = "solana";
    readonly network: string;
    private connection: Connection;

    constructor(config: ChainAdapterConfig) {
        if (config.chain !== "solana") {
            throw new Error("SolanaAdapter requires chain: 'solana'");
        }

        this.network = config.network || "mainnet-beta";
        this.connection = new Connection(
            config.rpcUrl || this.getDefaultRpcUrl(this.network),
            "confirmed"
        );
    }

    /**
     * Get default RPC URL for Solana network
     */
    private getDefaultRpcUrl(network: string): string {
        const urls: Record<string, string> = {
            "mainnet-beta": "https://api.mainnet-beta.solana.com",
            devnet: "https://api.devnet.solana.com",
            testnet: "https://api.testnet.solana.com",
        };
        return urls[network] || urls["mainnet-beta"];
    }

    /**
     * Build a Solana transaction from unified transaction
     */
    async buildTransaction(tx: UnifiedTransaction): Promise<SolanaTransaction> {
        if (tx.chain !== "solana") {
            throw new Error("Transaction chain mismatch: expected solana");
        }

        const chainData = tx.chainData as { type: "solana"; data: SolanaTransactionData };
        const solanaTx = new SolanaTransaction();

        // Add instructions from chain data
        if (chainData.data.instructions) {
            solanaTx.add(...(chainData.data.instructions as any[]));
        }

        // Set recent blockhash if provided
        if (chainData.data.recentBlockhash) {
            solanaTx.recentBlockhash = chainData.data.recentBlockhash;
        } else {
            // Fetch recent blockhash if not provided
            const { blockhash } = await this.connection.getLatestBlockhash();
            solanaTx.recentBlockhash = blockhash;
        }

        // Set fee payer if provided
        if (chainData.data.feePayer) {
            solanaTx.feePayer = new PublicKey(chainData.data.feePayer);
        }

        return solanaTx;
    }

    /**
     * Execute a Solana transaction
     */
    async executeTransaction(tx: unknown): Promise<TransactionResult> {
        const solanaTx = tx as SolanaTransaction;

        try {
            // Sign transaction (signers should be added before calling this)
            // In production, this would use a wallet adapter

            // Send and confirm transaction
            const signature = await this.connection.sendTransaction(solanaTx, [], {
                skipPreflight: false,
            });

            // Wait for confirmation
            const confirmation = await this.connection.confirmTransaction(signature, "confirmed");

            if (confirmation.value.err) {
                return {
                    transactionId: signature,
                    status: "failed",
                    hash: signature,
                    error: JSON.stringify(confirmation.value.err),
                };
            }

            return {
                transactionId: signature,
                status: "success",
                hash: signature,
                blockNumber: confirmation.context?.slot || 0,
            };
        } catch (error) {
            return {
                transactionId: "",
                status: "failed",
                hash: "",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Estimate cost for Solana transaction
     */
    async estimateCost(tx: UnifiedTransaction): Promise<CostEstimate> {
        const solanaTx = await this.buildTransaction(tx);

        try {
            // Simulate transaction to get compute units
            const simulation = await this.connection.simulateTransaction(solanaTx);

            if (simulation.value.err) {
                throw new Error(`Simulation failed: ${JSON.stringify(simulation.value.err)}`);
            }

            // Get fee for transaction
            const fee = await this.connection.getFeeForMessage(
                await solanaTx.compileMessage()
            );

            const estimatedCost = BigInt(fee?.value || 5000); // Default 5000 lamports
            const computeUnits = BigInt(simulation.value.unitsConsumed || 200000);

            return {
                estimatedCost,
                gasLimit: computeUnits,
                gasPrice: estimatedCost / computeUnits,
            };
        } catch (error) {
            // Return default estimate on error
            return {
                estimatedCost: BigInt(5000), // Default fee
                gasLimit: BigInt(200000), // Default compute units
            };
        }
    }

    /**
     * Validate Solana transaction
     */
    async validateTransaction(tx: UnifiedTransaction): Promise<{
        isValid: boolean;
        errors?: string[];
    }> {
        const errors: string[] = [];

        if (tx.chain !== "solana") {
            errors.push("Transaction chain mismatch: expected solana");
        }

        const chainData = tx.chainData as { type: "solana"; data: SolanaTransactionData };
        if (!chainData.data.instructions || chainData.data.instructions.length === 0) {
            errors.push("Transaction must have at least one instruction");
        }

        // Validate fee payer if provided
        if (chainData.data.feePayer) {
            try {
                new PublicKey(chainData.data.feePayer);
            } catch {
                errors.push("Invalid fee payer address");
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }

    /**
     * Get current Solana slot (equivalent to block number)
     */
    async getCurrentBlock(): Promise<number> {
        const slot = await this.connection.getSlot();
        return slot;
    }

    /**
     * Get Solana transaction by signature
     */
    async getTransaction(txHash: string): Promise<TransactionResult | null> {
        try {
            const tx = await this.connection.getTransaction(txHash, {
                commitment: "confirmed",
            });

            if (!tx) {
                return null;
            }

            return {
                transactionId: txHash,
                status: tx.meta?.err ? "failed" : "success",
                hash: txHash,
                blockNumber: tx.slot,
                error: tx.meta?.err ? JSON.stringify(tx.meta.err) : undefined,
                receipt: tx,
            };
        } catch {
            return null;
        }
    }

    /**
     * Parse Solana instructions to unified operations
     */
    parseOperations(operations: unknown[]): UnifiedOperation[] {
        // This is a simplified parser - in production, you'd parse actual Solana instructions
        // For now, return generic operations
        return operations.map((op, index) => ({
            type: "custom" as UnifiedOperation["type"],
            params: { index, raw: op },
        }));
    }

    /**
     * Get native currency symbol
     */
    getNativeCurrency(): string {
        return "SOL";
    }

    /**
     * Get Solana-specific security patterns
     */
    getSecurityPatterns(): string[] {
        return [
            "P-101", // Excessive Slippage Detection
            "P-102", // Unauthorized Drain Prevention
            "P-103", // Malicious CPI Call Detection
            "P-104", // Reentrancy Attack Detection
        ];
    }
}

