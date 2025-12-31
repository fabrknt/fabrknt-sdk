import {
    Connection,
    PublicKey,
    ParsedTransactionWithMeta,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

/**
 * Payment verification result
 */
export interface PaymentVerification {
    verified: boolean;
    signature: string;
    user: PublicKey;
    amount: number;
    nonce: number;
    timestamp: number;
    error?: string;
}

/**
 * Payment event from on-chain program
 */
interface PaymentProcessedEvent {
    user: PublicKey;
    amount: BN;
    nonce: BN;
    timestamp: BN;
}

/**
 * Service for verifying on-chain payments and tracking payment state
 */
export class PaymentService {
    private connection: Connection;
    private programId: PublicKey;
    private treasuryWallet: PublicKey | null;
    private verifiedPayments: Map<string, PaymentVerification>; // signature -> verification
    private usedNonces: Map<string, Set<number>>; // wallet -> set of nonces
    private cacheTTL: number = 24 * 60 * 60 * 1000; // 24 hours

    constructor(connection: Connection) {
        this.connection = connection;
        this.programId = new PublicKey(
            process.env.PAYMENT_PROGRAM_ID ||
                "84zwY58ivSmpGY8gsenAc2c4XpwBUyh1thF9XXx3LhfD"
        );
        this.verifiedPayments = new Map();
        this.usedNonces = new Map();

        const treasuryWalletStr = process.env.TREASURY_WALLET;
        if (treasuryWalletStr) {
            try {
                this.treasuryWallet = new PublicKey(treasuryWalletStr);
            } catch (error) {
                console.warn("Invalid TREASURY_WALLET:", error);
                this.treasuryWallet = null;
            }
        } else {
            this.treasuryWallet = null;
        }

        // Clean up expired cache entries every hour
        setInterval(() => this.cleanupCache(), 60 * 60 * 1000);
    }

    /**
     * Verify payment transaction on-chain
     */
    async verifyPayment(
        signature: string,
        expectedAmount?: number,
        expectedNonce?: number
    ): Promise<PaymentVerification> {
        // Check cache first
        const cached = this.verifiedPayments.get(signature);
        if (cached) {
            // Verify nonce hasn't been reused
            if (this.isNonceUsed(cached.user.toBase58(), cached.nonce)) {
                return {
                    verified: false,
                    signature,
                    user: cached.user,
                    amount: cached.amount,
                    nonce: cached.nonce,
                    timestamp: cached.timestamp,
                    error: "Nonce already used (replay attack detected)",
                };
            }
            return cached;
        }

        try {
            // Fetch transaction from blockchain
            const tx = await this.connection.getTransaction(signature, {
                commitment: "confirmed",
                maxSupportedTransactionVersion: 0,
            });

            if (!tx) {
                return {
                    verified: false,
                    signature,
                    user: PublicKey.default,
                    amount: 0,
                    nonce: 0,
                    timestamp: 0,
                    error: "Transaction not found",
                };
            }

            // Check if transaction failed
            if (tx.meta?.err) {
                return {
                    verified: false,
                    signature,
                    user: PublicKey.default,
                    amount: 0,
                    nonce: 0,
                    timestamp: 0,
                    error: `Transaction failed: ${JSON.stringify(tx.meta.err)}`,
                };
            }

            // Handle both versioned and legacy transactions
            let paymentEvent: PaymentProcessedEvent | null = null;
            
            if (tx.version === "legacy" || !tx.version) {
                // Legacy transaction - parse directly
                paymentEvent = this.parsePaymentEvent(tx as unknown as ParsedTransactionWithMeta);
            } else {
                // Versioned transaction - extract basic info
                // For versioned transactions, we'll use a simplified approach
                paymentEvent = this.parseVersionedTransaction(tx);
            }

            if (!paymentEvent) {
                return {
                    verified: false,
                    signature,
                    user: PublicKey.default,
                    amount: 0,
                    nonce: 0,
                    timestamp: 0,
                    error: "Payment event not found in transaction",
                };
            }

            // Verify payment amount if expected
            if (expectedAmount !== undefined) {
                const expectedAmountLamports = Math.floor(
                    expectedAmount * Math.pow(10, 6)
                ); // USDC has 6 decimals
                if (paymentEvent.amount.toNumber() < expectedAmountLamports) {
                    return {
                        verified: false,
                        signature,
                        user: paymentEvent.user,
                        amount: paymentEvent.amount.toNumber(),
                        nonce: paymentEvent.nonce.toNumber(),
                        timestamp: paymentEvent.timestamp.toNumber(),
                        error: `Insufficient payment amount. Expected: ${expectedAmount}, Got: ${paymentEvent.amount.toNumber() / Math.pow(10, 6)}`,
                    };
                }
            }

            // Verify nonce if expected
            if (expectedNonce !== undefined) {
                if (paymentEvent.nonce.toNumber() !== expectedNonce) {
                    return {
                        verified: false,
                        signature,
                        user: paymentEvent.user,
                        amount: paymentEvent.amount.toNumber(),
                        nonce: paymentEvent.nonce.toNumber(),
                        timestamp: paymentEvent.timestamp.toNumber(),
                        error: `Nonce mismatch. Expected: ${expectedNonce}, Got: ${paymentEvent.nonce.toNumber()}`,
                    };
                }
            }

            // Check for nonce reuse (replay attack)
            const userAddress = paymentEvent.user.toBase58();
            if (this.isNonceUsed(userAddress, paymentEvent.nonce.toNumber())) {
                return {
                    verified: false,
                    signature,
                    user: paymentEvent.user,
                    amount: paymentEvent.amount.toNumber(),
                    nonce: paymentEvent.nonce.toNumber(),
                    timestamp: paymentEvent.timestamp.toNumber(),
                    error: "Nonce already used (replay attack detected)",
                };
            }

            // Verify transaction is to our program
            const isOurProgram = this.isTransactionToOurProgram(tx);
            if (!isOurProgram) {
                return {
                    verified: false,
                    signature,
                    user: paymentEvent.user,
                    amount: paymentEvent.amount.toNumber(),
                    nonce: paymentEvent.nonce.toNumber(),
                    timestamp: paymentEvent.timestamp.toNumber(),
                    error: "Transaction not from payment program",
                };
            }

            // Create verification result
            const verification: PaymentVerification = {
                verified: true,
                signature,
                user: paymentEvent.user,
                amount: paymentEvent.amount.toNumber(),
                nonce: paymentEvent.nonce.toNumber(),
                timestamp: paymentEvent.timestamp.toNumber(),
            };

            // Cache verification
            this.verifiedPayments.set(signature, verification);

            // Track nonce usage
            this.markNonceUsed(userAddress, paymentEvent.nonce.toNumber());

            return verification;
        } catch (error) {
            console.error("Payment verification error:", error);
            return {
                verified: false,
                signature,
                user: PublicKey.default,
                amount: 0,
                nonce: 0,
                timestamp: 0,
                error:
                    error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Parse versioned transaction (simplified)
     */
    private parseVersionedTransaction(tx: any): PaymentProcessedEvent | null {
        if (!tx.meta?.logMessages) {
            return null;
        }

        // Look for payment instruction in logs
        const logMessages = tx.meta.logMessages;
        let foundPayment = false;
        for (const log of logMessages) {
            if (
                log.includes("PaymentProcessed") ||
                log.includes("process_payment") ||
                log.includes("ProcessPayment")
            ) {
                foundPayment = true;
                break;
            }
        }

        if (!foundPayment) {
            return null;
        }

        // Extract user from static account keys (first signer)
        const accountKeys = tx.transaction.message.staticAccountKeys || [];
        if (accountKeys.length === 0) {
            return null;
        }

        const user = new PublicKey(accountKeys[0]);

        // Extract amount from token balance changes
        let amount = new BN(0);
        if (tx.meta.preTokenBalances && tx.meta.postTokenBalances) {
            for (const pre of tx.meta.preTokenBalances) {
                const post = tx.meta.postTokenBalances.find(
                    (p: any) =>
                        p.accountIndex === pre.accountIndex &&
                        p.mint === pre.mint
                );
                if (post) {
                    const preAmount = BigInt(pre.uiTokenAmount.amount);
                    const postAmount = BigInt(post.uiTokenAmount.amount);
                    const diff = postAmount - preAmount;
                    if (diff < 0) {
                        amount = amount.add(new BN(-Number(diff)));
                    }
                }
            }
        }

        // Extract nonce from signature hash as fallback
        const signatures = tx.transaction.signatures || [];
        let nonce = new BN(0);
        if (signatures.length > 0) {
            const sig = signatures[0];
            if (typeof sig === "string") {
                const sigHash = sig
                    .slice(0, 8)
                    .split("")
                    .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                nonce = new BN(sigHash);
            }
        }

        const timestamp = new BN(tx.blockTime || Math.floor(Date.now() / 1000));

        return { user, amount, nonce, timestamp };
    }

    /**
     * Parse PaymentProcessed event from legacy transaction
     * Extracts payment information from transaction logs and token balance changes
     */
    private parsePaymentEvent(
        tx: ParsedTransactionWithMeta
    ): PaymentProcessedEvent | null {
        if (!tx.meta?.logMessages) {
            return null;
        }

        // Look for PaymentProcessed event in logs
        const logMessages = tx.meta.logMessages;
        let foundPaymentInstruction = false;

        for (const log of logMessages) {
            if (
                log.includes("PaymentProcessed") ||
                log.includes("process_payment") ||
                log.includes("ProcessPayment")
            ) {
                foundPaymentInstruction = true;
                break;
            }
        }

        if (!foundPaymentInstruction) {
            return null;
        }

        // Extract user from signers (first signer is the payer)
        const accountKeys = tx.transaction.message.accountKeys;
        const message = tx.transaction.message as any;
        const numSigners = message.header?.numRequiredSignatures || 1;
        const signers = accountKeys
            .slice(0, numSigners)
            .map((key: any) => {
                if (typeof key === "string") {
                    return new PublicKey(key);
                }
                return new PublicKey(key.pubkey);
            });

        if (signers.length === 0) {
            return null;
        }

        const user = signers[0]; // First signer is the user

        // Extract amount from token balance changes
        let amount = new BN(0);
        if (tx.meta.preTokenBalances && tx.meta.postTokenBalances) {
            // Find token transfers (negative balance changes indicate outgoing transfers)
            for (const pre of tx.meta.preTokenBalances) {
                const post = tx.meta.postTokenBalances.find(
                    (p) =>
                        p.accountIndex === pre.accountIndex &&
                        p.mint === pre.mint
                );
                if (post) {
                    const preAmount = BigInt(pre.uiTokenAmount.amount);
                    const postAmount = BigInt(post.uiTokenAmount.amount);
                    const diff = postAmount - preAmount;
                    if (diff < 0) {
                        // Negative means tokens were sent (payment)
                        amount = amount.add(new BN(-Number(diff)));
                    }
                }
            }
        }

        // If we couldn't find amount from balances, try to extract from instruction data
        // This is a simplified approach - in production, decode using Anchor IDL
        if (amount.isZero()) {
            // Look for our program in instructions
            const instructions = tx.transaction.message.instructions;
            for (const ix of instructions) {
                if ("programId" in ix) {
                    try {
                        const programId = new PublicKey(ix.programId);
                        if (programId.equals(this.programId)) {
                            // Try to extract amount from instruction data
                            // Instruction data format: [discriminator (8 bytes), amount (8 bytes), nonce (8 bytes)]
                            if ("data" in ix && typeof ix.data === "string") {
                                const data = Buffer.from(ix.data, "base64");
                                if (data.length >= 24) {
                                    // Skip 8-byte discriminator, read amount (8 bytes), nonce (8 bytes)
                                    const amountBytes = data.slice(8, 16);
                                    amount = new BN(amountBytes, "le");
                                }
                            }
                            break;
                        }
                    } catch (error) {
                        // Invalid public key, skip
                        continue;
                    }
                }
            }
        }

        // Extract nonce from instruction data or use transaction signature hash as fallback
        let nonce = new BN(0);
        const instructions = tx.transaction.message.instructions;
        for (const ix of instructions) {
            if ("programId" in ix) {
                try {
                    const programId = new PublicKey(ix.programId);
                    if (programId.equals(this.programId)) {
                        if ("data" in ix && typeof ix.data === "string") {
                            const data = Buffer.from(ix.data, "base64");
                            if (data.length >= 24) {
                                // Read nonce (last 8 bytes after discriminator and amount)
                                const nonceBytes = data.slice(16, 24);
                                nonce = new BN(nonceBytes, "le");
                            }
                        }
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
        }

        // If nonce is still zero, use a hash of the signature as fallback
        // This prevents exact replay but not perfect nonce tracking
        if (nonce.isZero() && tx.transaction.signatures && tx.transaction.signatures.length > 0) {
            const sig: any = tx.transaction.signatures[0];
            if (typeof sig === "string") {
                const sigHash = sig
                    .slice(0, 8)
                    .split("")
                    .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                nonce = new BN(sigHash);
            } else if (Array.isArray(sig) && sig.length > 0) {
                const sigHash = (sig as number[])
                    .slice(0, 8)
                    .reduce((acc: number, byte: number) => acc + byte, 0);
                nonce = new BN(sigHash);
            }
        }

        // Extract timestamp from block time
        const timestamp = new BN(
            tx.blockTime || Math.floor(Date.now() / 1000)
        );

        return {
            user,
            amount,
            nonce,
            timestamp,
        };
    }

    /**
     * Check if transaction is to our payment program
     */
    private isTransactionToOurProgram(tx: any): boolean {
        // Handle both legacy and versioned transactions
        const instructions = tx.transaction?.message?.instructions || [];
        for (const ix of instructions) {
            if (ix && "programId" in ix) {
                try {
                    const programId = new PublicKey(ix.programId);
                    if (programId.equals(this.programId)) {
                        return true;
                    }
                } catch (error) {
                    continue;
                }
            }
        }
        return false;
    }

    /**
     * Check if nonce has been used (replay attack detection)
     */
    private isNonceUsed(walletAddress: string, nonce: number): boolean {
        const nonces = this.usedNonces.get(walletAddress);
        return nonces ? nonces.has(nonce) : false;
    }

    /**
     * Mark nonce as used
     */
    private markNonceUsed(walletAddress: string, nonce: number): void {
        if (!this.usedNonces.has(walletAddress)) {
            this.usedNonces.set(walletAddress, new Set());
        }
        this.usedNonces.get(walletAddress)!.add(nonce);
    }

    /**
     * Clean up expired cache entries
     */
    private cleanupCache(): void {
        const now = Date.now();
        for (const [signature, verification] of this.verifiedPayments.entries()) {
            // Remove entries older than cache TTL
            const age = now - verification.timestamp * 1000;
            if (age > this.cacheTTL) {
                this.verifiedPayments.delete(signature);
            }
        }
    }

    /**
     * Get payment verification from cache
     */
    getCachedVerification(signature: string): PaymentVerification | null {
        return this.verifiedPayments.get(signature) || null;
    }

    /**
     * Clear cache (for testing)
     */
    clearCache(): void {
        this.verifiedPayments.clear();
        this.usedNonces.clear();
    }
}

