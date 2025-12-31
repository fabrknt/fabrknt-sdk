/**
 * Jupiter API Integration - Transaction-Based Approach
 * 
 * This module provides helper functions for interacting with Jupiter's Swap API
 * to get quotes and build swap transactions for the Flow protocol.
 */

import { PublicKey, Connection, Transaction } from "@solana/web3.js";

/**
 * Jupiter Quote API Response
 */
export interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: any;
  priceImpactPct: string;
  routePlan: any[];
}

/**
 * Jupiter Swap API Request
 */
export interface JupiterSwapRequest {
  quoteResponse: JupiterQuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: number;
  asLegacyTransaction?: boolean;
}

/**
 * Jupiter Swap API Response
 */
export interface JupiterSwapResponse {
  swapTransaction: string; // Base64 encoded transaction
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
}

/**
 * Get a quote from Jupiter API
 * 
 * @param inputMint - Source token mint address
 * @param outputMint - Destination token mint address
 * @param amount - Amount in smallest unit (lamports/decimals)
 * @param slippageBps - Slippage tolerance in basis points (default: 50 = 0.5%)
 * @param onlyDirectRoutes - Only use direct routes (default: false)
 * @returns Quote response from Jupiter API
 */
export async function getJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: string | number,
  slippageBps: number = 50,
  onlyDirectRoutes: boolean = false
): Promise<JupiterQuoteResponse> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: amount.toString(),
    slippageBps: slippageBps.toString(),
    onlyDirectRoutes: onlyDirectRoutes.toString(),
  });

  const response = await fetch(
    `https://quote-api.jup.ag/v6/quote?${params.toString()}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Jupiter quote API error: ${response.status} - ${errorText}`
    );
  }

  return await response.json();
}

/**
 * Get a swap transaction from Jupiter API
 * 
 * @param quoteResponse - Quote response from getJupiterQuote
 * @param userPublicKey - User's public key (will sign the transaction)
 * @param options - Additional options for swap transaction
 * @returns Swap transaction response from Jupiter API
 */
export async function getJupiterSwapTransaction(
  quoteResponse: JupiterQuoteResponse,
  userPublicKey: PublicKey | string,
  options: {
    wrapAndUnwrapSol?: boolean;
    dynamicComputeUnitLimit?: boolean;
    prioritizationFeeLamports?: number;
    asLegacyTransaction?: boolean;
  } = {}
): Promise<JupiterSwapResponse> {
  const swapRequest: JupiterSwapRequest = {
    quoteResponse,
    userPublicKey:
      userPublicKey instanceof PublicKey
        ? userPublicKey.toString()
        : userPublicKey,
    wrapAndUnwrapSol: options.wrapAndUnwrapSol ?? true,
    dynamicComputeUnitLimit: options.dynamicComputeUnitLimit ?? true,
    prioritizationFeeLamports: options.prioritizationFeeLamports ?? 0,
    asLegacyTransaction: options.asLegacyTransaction ?? false,
  };

  const response = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(swapRequest),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Jupiter swap API error: ${response.status} - ${errorText}`
    );
  }

  return await response.json();
}

/**
 * Deserialize a Jupiter swap transaction
 * 
 * @param swapTransaction - Base64 encoded transaction from Jupiter API
 * @param connection - Solana connection
 * @returns Deserialized Transaction object
 */
export function deserializeJupiterTransaction(
  swapTransaction: string,
  connection: Connection
): Transaction {
  const buffer = Buffer.from(swapTransaction, "base64");
  return Transaction.from(buffer);
}

/**
 * Complete flow: Get quote and swap transaction
 * 
 * This is a convenience function that combines getJupiterQuote and getJupiterSwapTransaction
 * 
 * @param inputMint - Source token mint address
 * @param outputMint - Destination token mint address
 * @param amount - Amount in smallest unit
 * @param userPublicKey - User's public key
 * @param slippageBps - Slippage tolerance in basis points (default: 50)
 * @param options - Additional options
 * @returns Object containing quote and swap transaction
 */
export async function getJupiterSwapForRebalance(
  inputMint: string,
  outputMint: string,
  amount: string | number,
  userPublicKey: PublicKey | string,
  slippageBps: number = 50,
  options: {
    wrapAndUnwrapSol?: boolean;
    dynamicComputeUnitLimit?: boolean;
    prioritizationFeeLamports?: number;
    onlyDirectRoutes?: boolean;
  } = {}
): Promise<{
  quote: JupiterQuoteResponse;
  swapTransaction: JupiterSwapResponse;
  expectedOutputAmount: string;
}> {
  // Get quote
  const quote = await getJupiterQuote(
    inputMint,
    outputMint,
    amount,
    slippageBps,
    options.onlyDirectRoutes ?? false
  );

  // Get swap transaction
  const swapTransaction = await getJupiterSwapTransaction(quote, userPublicKey, {
    wrapAndUnwrapSol: options.wrapAndUnwrapSol,
    dynamicComputeUnitLimit: options.dynamicComputeUnitLimit,
    prioritizationFeeLamports: options.prioritizationFeeLamports,
  });

  return {
    quote,
    swapTransaction,
    expectedOutputAmount: quote.outAmount,
  };
}

/**
 * Execute a Jupiter swap transaction
 * 
 * @param swapTransaction - Base64 encoded transaction from Jupiter API
 * @param connection - Solana connection
 * @param signers - Array of signers (wallet, etc.)
 * @returns Transaction signature
 */
export async function executeJupiterSwap(
  swapTransaction: string,
  connection: Connection,
  signers: any[]
): Promise<string> {
  const transaction = deserializeJupiterTransaction(swapTransaction, connection);

  // Add signers
  transaction.sign(...signers);

  // Send transaction
  const signature = await connection.sendRawTransaction(
    transaction.serialize(),
    {
      skipPreflight: false,
      maxRetries: 3,
    }
  );

  // Wait for confirmation
  await connection.confirmTransaction(signature, "confirmed");

  return signature;
}

