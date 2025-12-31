import {
    Connection,
    PublicKey,
    Transaction,
} from "@solana/web3.js";
import {
    getAssociatedTokenAddressSync,
    createTransferInstruction,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

/**
 * Payment service for handling on-chain payments
 */
export class PaymentService {
    private connection: Connection;
    private usdcMint: PublicKey;

    constructor(connection: Connection, _programId: string, usdcMint?: string) {
        this.connection = connection;
        // Default to USDC on devnet/mainnet
        this.usdcMint = new PublicKey(
            usdcMint ||
                "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // USDC
        );
    }

    /**
     * Generate a payment transaction
     */
    async createPaymentTransaction(
        wallet: PublicKey,
        amount: number,
        _nonce: number,
        treasuryWallet: string
    ): Promise<Transaction> {
        // Get user's USDC token account (using sync version for consistency)
        const userTokenAccount = getAssociatedTokenAddressSync(
            this.usdcMint,
            wallet
            // Use default program IDs
        );

        // Get treasury USDC token account
        const treasuryPubkey = new PublicKey(treasuryWallet);
        const treasuryTokenAccount = getAssociatedTokenAddressSync(
            this.usdcMint,
            treasuryPubkey
            // Use default program IDs
        );

        // Check if user's token account exists
        const userAccountInfo = await this.connection.getAccountInfo(userTokenAccount);
        const userAccountExists = userAccountInfo !== null;

        // Check if treasury token account exists
        const treasuryAccountInfo = await this.connection.getAccountInfo(treasuryTokenAccount);
        const treasuryAccountExists = treasuryAccountInfo !== null;

        // If user's token account doesn't exist, we'll need to create it separately
        // We can't create it in the same transaction due to program ID issues
        if (!userAccountExists) {
            throw new Error(
                `TOKEN_ACCOUNT_MISSING:${userTokenAccount.toBase58()}` +
                `:Your USDC token account does not exist. Please create it first.`
            );
        }

        if (!treasuryAccountExists) {
            throw new Error(
                `Treasury USDC token account does not exist. Please contact support. ` +
                `Account address: ${treasuryTokenAccount.toBase58()}`
            );
        }

        // Fetch recent blockhash
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');

        // Create transaction with blockhash
        const transaction = new Transaction();
        transaction.feePayer = wallet;
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;

        // Convert amount to lamports (USDC has 6 decimals)
        const amountLamports = Math.floor(amount * Math.pow(10, 6));

        // Create transfer instruction
        const transferInstruction = createTransferInstruction(
            userTokenAccount,
            treasuryTokenAccount,
            wallet,
            amountLamports,
            [],
            TOKEN_PROGRAM_ID
        );

        transaction.add(transferInstruction);

        // Add program instruction for payment processing
        // In a real implementation, we'd use the Anchor program
        // For now, we'll use a direct transfer and track via transaction signature

        return transaction;
    }


    /**
     * Prepare transaction for sending (ensures it has all required fields)
     * Note: The actual sending is done by the wallet adapter's sendTransaction method
     */
    async prepareTransaction(transaction: Transaction, wallet: PublicKey): Promise<Transaction> {
        // Ensure transaction has blockhash (refresh if needed)
        if (!transaction.recentBlockhash) {
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
        }

        // Ensure fee payer is set
        if (!transaction.feePayer) {
            transaction.feePayer = wallet;
        }

        return transaction;
    }

    /**
     * Verify payment transaction
     */
    async verifyPayment(signature: string): Promise<{
        verified: boolean;
        error?: string;
    }> {
        try {
            const tx = await this.connection.getTransaction(signature, {
                commitment: "confirmed",
            });

            if (!tx) {
                return {
                    verified: false,
                    error: "Transaction not found",
                };
            }

            if (tx.meta?.err) {
                return {
                    verified: false,
                    error: `Transaction failed: ${JSON.stringify(tx.meta.err)}`,
                };
            }

            return { verified: true };
        } catch (error) {
            return {
                verified: false,
                error:
                    error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    /**
     * Generate a unique nonce for payment
     */
    generateNonce(): number {
        // Generate nonce from timestamp and random number
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    /**
     * Get the user's associated token account address
     * Useful for displaying to the user if they need to create it manually
     */
    getUserTokenAccountAddress(wallet: PublicKey): string {
        const userTokenAccount = getAssociatedTokenAddressSync(
            this.usdcMint,
            wallet
        );
        return userTokenAccount.toBase58();
    }
}

/**
 * Create payment service instance
 */
export function createPaymentService(connection: Connection): PaymentService {
    const programId =
        import.meta.env.VITE_PAYMENT_PROGRAM_ID ||
        "84zwY58ivSmpGY8gsenAc2c4XpwBUyh1thF9XXx3LhfD";
    return new PaymentService(connection, programId);
}

