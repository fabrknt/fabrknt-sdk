import axios from "axios";
import { PublicKey } from "@solana/web3.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Payment state management
interface PaymentState {
    signature?: string;
    nonce?: number;
    amount?: number;
    timestamp?: number;
}

let paymentState: PaymentState | null = null;

export interface PaymentQuote {
    endpoint: string;
    price: {
        amount: string;
        currency: string;
        decimals: number;
    };
    recipient: string;
    network: string;
    programId: string;
}

export interface RwaRiskData {
    tokenMint: string;
    timestamp: string;
    metrics: {
        legalCompliance: {
            status: string;
            jurisdiction: string;
            structure: string;
            lastVerified: string;
        };
        counterpartyRisk: {
            issuerRating: string;
            defaultProbability: number;
            solvencyScore: number;
            lastUpdated: string;
        };
        oracleIntegrity: {
            consensusNodes: number;
            dataReliability: number;
            latency: string;
            lastUpdate: string;
        };
    };
    requestedBy: string;
}

export interface LiquidationParams {
    tokenMint: string;
    timestamp: string;
    parameters: {
        liquidationThreshold: number;
        maxLtv: number;
        liquidationPenalty: number;
        healthFactor: number;
        volatility: number;
        correlation: {
            sol: number;
            usdc: number;
        };
    };
    requestedBy: string;
}

// API client with real payment flow support
export const api = {
    /**
     * Set payment state (called after successful payment)
     */
    setPaymentState(state: PaymentState | null) {
        paymentState = state;
    },

    /**
     * Get current payment state
     */
    getPaymentState(): PaymentState | null {
        return paymentState;
    },

    /**
     * Clear payment state
     */
    clearPaymentState() {
        paymentState = null;
    },

    async getPaymentQuote(
        endpoint: string = "rwa-risk"
    ): Promise<PaymentQuote> {
        try {
            const response = await axios.get(
                `${API_URL}/api/v1/payment/quote`,
                {
                    params: { endpoint },
                }
            );
            return response.data;
        } catch (error) {
            // Fallback to mock data if API is not available
            console.warn("API not available, using mock data");
            return {
                endpoint,
                price: {
                    amount: endpoint === "rwa-risk" ? "0.05" : "0.10",
                    currency: "USDC",
                    decimals: 6,
                },
                recipient: "MockTreasury1111111111111111111111111",
                network: "solana",
                programId: "MockProgram1111111111111111111111111",
            };
        }
    },

    /**
     * Verify payment transaction
     */
    async verifyPayment(signature: string, nonce?: number, expectedAmount?: number): Promise<{
        verified: boolean;
        error?: string;
        user?: string;
        amount?: number;
    }> {
        try {
            const response = await axios.post(
                `${API_URL}/api/v1/payment/verify`,
                {
                    signature,
                    nonce,
                    expectedAmount,
                }
            );
            return response.data;
        } catch (error: any) {
            return {
                verified: false,
                error: error.response?.data?.error || error.message || "Payment verification failed",
            };
        }
    },

    async getRwaRiskData(
        tokenMint: string,
        wallet?: PublicKey | string,
        usePayment: boolean = true
    ): Promise<RwaRiskData> {
        try {
            const headers: Record<string, string> = {};

            // Use payment if available and not in demo mode
            if (usePayment && paymentState?.signature) {
                headers["x-payment-signature"] = paymentState.signature;
                if (paymentState.nonce) {
                    headers["x-payment-nonce"] = paymentState.nonce.toString();
                }
                if (paymentState.amount) {
                    headers["x-expected-amount"] = paymentState.amount.toString();
                }
            } else {
                // Fallback to demo mode
                headers["x-demo-mode"] = "true";
            }

            const response = await axios.get(
                `${API_URL}/api/v1/data/rwa-risk/${tokenMint}`,
                { headers }
            );
            return response.data;
        } catch (error: any) {
            // If payment required error, throw it
            if (error.response?.status === 402) {
                throw new Error("Payment required");
            }

            // Fallback mock data
            console.warn("API not available, using mock data");
            return {
                tokenMint,
                timestamp: new Date().toISOString(),
                metrics: {
                    legalCompliance: {
                        status: "compliant",
                        jurisdiction: "US",
                        structure: "tokenized_fund",
                        lastVerified: "2024-01-15T00:00:00Z",
                    },
                    counterpartyRisk: {
                        issuerRating: "A",
                        defaultProbability: 0.02,
                        solvencyScore: 0.95,
                        lastUpdated: "2024-01-15T00:00:00Z",
                    },
                    oracleIntegrity: {
                        consensusNodes: 5,
                        dataReliability: 0.99,
                        latency: "<10ms",
                        lastUpdate: new Date().toISOString(),
                    },
                },
                requestedBy: wallet
                    ? typeof wallet === "string"
                        ? wallet
                        : wallet.toBase58()
                    : "demo-wallet",
            };
        }
    },

    async getLiquidationParams(
        tokenMint: string,
        wallet?: PublicKey | string,
        usePayment: boolean = true
    ): Promise<LiquidationParams> {
        try {
            const headers: Record<string, string> = {};

            // Use payment if available and not in demo mode
            if (usePayment && paymentState?.signature) {
                headers["x-payment-signature"] = paymentState.signature;
                if (paymentState.nonce) {
                    headers["x-payment-nonce"] = paymentState.nonce.toString();
                }
                if (paymentState.amount) {
                    headers["x-expected-amount"] = paymentState.amount.toString();
                }
            } else {
                // Fallback to demo mode
                headers["x-demo-mode"] = "true";
            }

            const response = await axios.get(
                `${API_URL}/api/v1/data/liquidation-params/${tokenMint}`,
                { headers }
            );
            return response.data;
        } catch (error: any) {
            // If payment required error, throw it
            if (error.response?.status === 402) {
                throw new Error("Payment required");
            }

            // Fallback mock data
            console.warn("API not available, using mock data");
            return {
                tokenMint,
                timestamp: new Date().toISOString(),
                parameters: {
                    liquidationThreshold: 0.85,
                    maxLtv: 0.75,
                    liquidationPenalty: 0.05,
                    healthFactor: 1.25,
                    volatility: 0.12,
                    correlation: {
                        sol: 0.35,
                        usdc: 0.95,
                    },
                },
                requestedBy: wallet
                    ? typeof wallet === "string"
                        ? wallet
                        : wallet.toBase58()
                    : "demo-wallet",
            };
        }
    },
};
