import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { api, type PaymentQuote } from "../lib/api";
import { createPaymentService } from "../lib/payment";

interface PaymentQuoteProps {
    endpoint: string;
    onPaymentComplete?: (signature: string, nonce: number, amount: number) => void;
}

export function PaymentQuote({ endpoint, onPaymentComplete }: PaymentQuoteProps) {
    const { publicKey, sendTransaction, connected } = useWallet();
    const { connection } = useConnection();
    const [quote, setQuote] = useState<PaymentQuote | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        api.getPaymentQuote(endpoint)
            .then((data) => {
                setQuote(data);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [endpoint]);

    const handlePayment = async () => {
        if (!quote || !publicKey || !sendTransaction || !connected) {
            setError("Please connect your wallet");
            return;
        }

        setPaying(true);
        setError(null);
        setPaymentStatus("Creating payment transaction...");

        try {
            const paymentService = createPaymentService(connection);
            const amount = parseFloat(quote.price.amount);
            const nonce = paymentService.generateNonce();

            // Try to create payment transaction
            // If token account doesn't exist, we'll get a special error
            let transaction;
            try {
                transaction = await paymentService.createPaymentTransaction(
                    publicKey,
                    amount,
                    nonce,
                    quote.recipient
                );
            } catch (error: any) {
                // Check if error is about missing token account
                if (error.message && error.message.includes('TOKEN_ACCOUNT_MISSING')) {
                    const accountAddress = error.message.split(':')[1] || paymentService.getUserTokenAccountAddress(publicKey);
                    const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
                    throw new Error(
                        `Your USDC token account does not exist.\n\n` +
                        `To fix this:\n` +
                        `1. Receive some USDC tokens to your wallet (this will automatically create the account), OR\n` +
                        `2. Use a Solana tool like Jupiter or Raydium to create the account\n\n` +
                        `Your token account address: ${accountAddress}\n` +
                        `USDC Mint: ${usdcMint}`
                    );
                } else {
                    throw error;
                }
            }

            // Prepare transaction (ensure blockhash, fee payer, etc.)
            transaction = await paymentService.prepareTransaction(transaction, publicKey);

            console.log("Transaction prepared:", {
                feePayer: transaction.feePayer?.toBase58(),
                recentBlockhash: transaction.recentBlockhash,
                instructions: transaction.instructions.length,
            });

            setPaymentStatus("Please approve the transaction in your wallet...");

            // Use wallet adapter's sendTransaction method
            // This handles signing and sending in one step
            const signature = await sendTransaction(transaction, connection, {
                skipPreflight: false,
            });

            console.log("Transaction sent, signature:", signature);

            setPaymentStatus("Waiting for confirmation...");

            // Wait for confirmation
            await connection.confirmTransaction(signature, 'confirmed');

            console.log("Transaction confirmed");

            setPaymentStatus("Verifying payment...");

            // Verify payment
            const verification = await api.verifyPayment(
                signature,
                nonce,
                amount
            );

            if (!verification.verified) {
                throw new Error(verification.error || "Payment verification failed");
            }

            // Set payment state
            api.setPaymentState({
                signature,
                nonce,
                amount,
                timestamp: Date.now(),
            });

            setPaymentStatus("Payment successful!");
            
            // Call callback if provided
            if (onPaymentComplete) {
                onPaymentComplete(signature, nonce, amount);
            }

            // Clear status after 3 seconds
            setTimeout(() => {
                setPaymentStatus(null);
            }, 3000);
        } catch (err: any) {
            console.error("Payment error:", err);
            const errorMessage = err.message || err.toString() || "Payment failed";
            setError(errorMessage);
            setPaymentStatus(null);
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-gray-400">Loading quote...</div>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="text-red-400">Failed to load quote</div>
            </div>
        );
    }

    const hasPayment = api.getPaymentState()?.signature;

    return (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">
                Payment Quote
            </h3>
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Endpoint:</span>
                        <span className="text-white font-mono text-sm">
                            {quote.endpoint}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-pulsar-primary font-bold">
                            {quote.price.amount} {quote.price.currency}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Network:</span>
                        <span className="text-white">{quote.network}</span>
                    </div>
                </div>

                {hasPayment ? (
                    <div className="bg-green-900/20 border border-green-700 rounded p-3">
                        <div className="text-green-400 text-sm">
                            ✓ Payment verified
                        </div>
                        <div className="text-gray-400 text-xs mt-1 font-mono">
                            {api.getPaymentState()?.signature?.slice(0, 8)}...
                        </div>
                    </div>
                ) : (
                    <>
                        {paymentStatus && (
                            <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
                                <div className="text-blue-400 text-sm">
                                    {paymentStatus}
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-900/20 border border-red-700 rounded p-3">
                                <div className="text-red-400 text-sm whitespace-pre-line">{error}</div>
                                {error.includes("USDC token account does not exist") && (
                                    <div className="mt-3 space-y-2 p-3 bg-yellow-900/20 border border-yellow-700 rounded">
                                        <div className="text-yellow-400 text-xs font-semibold mb-2">
                                            💡 Quick Fix: Receive USDC Tokens
                                        </div>
                                        <div className="space-y-2 text-xs">
                                            <div className="text-gray-300">
                                                <strong>Step 1:</strong> Get SOL
                                            </div>
                                            <a
                                                href={`https://faucet.solana.com/?address=${publicKey?.toBase58()}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-blue-400 hover:text-blue-300 underline"
                                            >
                                                → Get SOL from Faucet
                                            </a>
                                            <div className="text-gray-300 mt-2">
                                                <strong>Step 2:</strong> Swap SOL for USDC
                                            </div>
                                            <a
                                                href="https://jup.ag/swap"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block text-blue-400 hover:text-blue-300 underline"
                                            >
                                                → Swap on Jupiter (make sure you're on Devnet!)
                                            </a>
                                            <div className="text-gray-400 mt-2 text-xs">
                                                Receiving USDC automatically creates your token account.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            onClick={handlePayment}
                            disabled={!connected || paying}
                            className="w-full bg-pulsar-primary text-black font-semibold py-2 px-4 rounded hover:bg-pulsar-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {paying
                                ? "Processing..."
                                : connected
                                ? `Pay ${quote.price.amount} ${quote.price.currency}`
                                : "Connect Wallet to Pay"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
