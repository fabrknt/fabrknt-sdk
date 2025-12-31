/**
 * Utility functions for Fragmetric integration
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { FRAGSOL_MINT, FRAGSOL_DECIMALS } from "./index";

/**
 * Get fragSOL balance for a wallet
 */
export async function getFragSOLBalance(
  connection: Connection,
  walletAddress: PublicKey
): Promise<number> {
  try {
    // Derive ATA address
    const [ata] = PublicKey.findProgramAddressSync(
      [
        walletAddress.toBuffer(),
        TOKEN_2022_PROGRAM_ID.toBuffer(),
        FRAGSOL_MINT.toBuffer(),
      ],
      new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
    );

    const accountInfo = await getAccount(
      connection,
      ata,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    return Number(accountInfo.amount) / 10 ** FRAGSOL_DECIMALS;
  } catch (error) {
    // Account doesn't exist - balance is 0
    return 0;
  }
}

/**
 * Format fragSOL amount for display
 */
export function formatFragSOL(amount: number): string {
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 9,
  })} fragSOL`;
}

/**
 * Check if wallet has enough fragSOL
 */
export async function hasEnoughFragSOL(
  connection: Connection,
  walletAddress: PublicKey,
  requiredAmount: number
): Promise<{ hasEnough: boolean; balance: number; required: number }> {
  const balance = await getFragSOLBalance(connection, walletAddress);

  return {
    hasEnough: balance >= requiredAmount,
    balance,
    required: requiredAmount,
  };
}

/**
 * Get SOL balance for fees
 */
export async function getSolBalance(
  connection: Connection,
  walletAddress: PublicKey
): Promise<number> {
  const balance = await connection.getBalance(walletAddress);
  return balance / 10 ** 9; // Convert lamports to SOL
}

/**
 * Check if wallet has enough SOL for fees
 */
export async function hasEnoughSol(
  connection: Connection,
  walletAddress: PublicKey,
  requiredSol: number = 0.001
): Promise<{ hasEnough: boolean; balance: number; required: number }> {
  const balance = await getSolBalance(connection, walletAddress);

  return {
    hasEnough: balance >= requiredSol,
    balance,
    required: requiredSol,
  };
}

/**
 * Print wallet balances
 */
export async function printWalletInfo(
  connection: Connection,
  walletAddress: PublicKey
): Promise<void> {
  console.log("📊 Wallet Information");
  console.log("━".repeat(50));

  const solBalance = await getSolBalance(connection, walletAddress);
  const fragSOLBalance = await getFragSOLBalance(connection, walletAddress);

  console.log(`Address: ${walletAddress.toString()}`);
  console.log(`SOL Balance: ${solBalance.toFixed(6)} SOL`);
  console.log(`fragSOL Balance: ${formatFragSOL(fragSOLBalance)}`);
  console.log("━".repeat(50));
}

/**
 * Validate transaction size (helpful for debugging)
 */
export function estimateTransactionSize(
  numInstructions: number,
  numSigners: number = 1
): number {
  // Rough estimation
  const baseSize = 64; // Version + header
  const signatureSize = 64 * numSigners;
  const instructionSize = 32 + 256; // Program ID + accounts + data (estimate)

  return baseSize + signatureSize + numInstructions * instructionSize;
}

/**
 * Format explorer URL
 */
export function getExplorerUrl(
  signature: string,
  cluster: string = "mainnet-beta"
): string {
  const clusterParam = cluster !== "mainnet-beta" ? `?cluster=${cluster}` : "";
  return `https://solscan.io/tx/${signature}${clusterParam}`;
}

/**
 * Format token account address URL
 */
export function getTokenAccountUrl(
  address: string,
  cluster: string = "mainnet-beta"
): string {
  const clusterParam = cluster !== "mainnet-beta" ? `?cluster=${cluster}` : "";
  return `https://solscan.io/account/${address}${clusterParam}`;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, i);
      console.log(`⚠️  Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw new Error("Retry failed");
}

// Export FRAGSOL constants for convenience
export { FRAGSOL_MINT, FRAGSOL_DECIMALS };
