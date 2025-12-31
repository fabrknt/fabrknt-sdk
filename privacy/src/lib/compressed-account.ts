import { Connection, Keypair, PublicKey, Signer } from '@solana/web3.js';
import { Rpc, createRpc } from '@lightprotocol/stateless.js';
import {
  createMint,
  mintTo,
  compress,
  transfer,
  createTokenPool,
} from '@lightprotocol/compressed-token';
import BN from 'bn.js';

/**
 * Creates a compressed token account by minting compressed tokens directly
 * This mints tokens directly into the compressed state (ledger space)
 */
export async function createCompressedAccount(
  rpc: Rpc,
  payer: Signer,
  owner: PublicKey,
  mint: PublicKey,
  amount: bigint
): Promise<string> {
  try {
    console.log(`Minting ${amount.toString()} compressed tokens to ${owner.toBase58()}`);

    // Mint compressed tokens directly to the owner
    // This creates a compressed token account automatically
    const signature = await mintTo(
      rpc,
      payer,
      mint,
      owner,
      payer,  // Assuming payer is also mint authority
      new BN(amount.toString())
    );

    console.log(`✓ Compressed tokens minted: ${signature}`);
    return signature;
  } catch (error) {
    throw new Error(`Failed to create compressed account: ${error}`);
  }
}

/**
 * Compresses existing SPL tokens into compressed state
 * This moves tokens from standard token accounts to compressed ledger space
 */
export async function compressTokens(
  rpc: Rpc,
  payer: Signer,
  mint: PublicKey,
  amount: bigint,
  owner: Signer,
  sourceTokenAccount: PublicKey,
  toAddress: PublicKey
): Promise<string> {
  try {
    console.log(`Compressing ${amount.toString()} tokens from standard to compressed`);

    const signature = await compress(
      rpc,
      payer,
      mint,
      new BN(amount.toString()),
      owner,
      sourceTokenAccount,
      toAddress
    );

    console.log(`✓ Tokens compressed: ${signature}`);
    return signature;
  } catch (error) {
    throw new Error(`Failed to compress tokens: ${error}`);
  }
}

/**
 * Transfers compressed tokens between accounts
 * This uses ZK proofs to hide transaction amounts and maintain privacy
 */
export async function transferCompressed(
  rpc: Rpc,
  payer: Signer,
  owner: Signer,
  to: PublicKey,
  mint: PublicKey,
  amount: bigint
): Promise<string> {
  try {
    console.log(`Transferring ${amount.toString()} compressed tokens to ${to.toBase58()}`);

    // Transfer compressed tokens using Light Protocol
    // This automatically:
    // 1. Fetches Merkle proofs from Photon API
    // 2. Generates ZK proofs for the transfer
    // 3. Submits compressed transaction (only 128 bytes on-chain)
    const signature = await transfer(
      rpc,
      payer,
      mint,
      new BN(amount.toString()),
      owner,
      to
    );

    console.log(`✓ Compressed transfer complete: ${signature}`);
    return signature;
  } catch (error) {
    throw new Error(`Failed to transfer compressed tokens: ${error}`);
  }
}

/**
 * Gets the compressed token balance for an address
 * This queries the Photon API which indexes compressed account state
 */
export async function getCompressedBalance(
  rpc: Rpc,
  owner: PublicKey,
  mint: PublicKey
): Promise<bigint> {
  try {
    // Query Photon API for compressed token accounts
    // Use the Rpc instance's built-in method
    const accounts = await rpc.getCompressedTokenAccountsByOwner(owner, {
      mint,
    });

    // Sum balances from all accounts for this mint
    let totalBalance = BigInt(0);
    for (const account of accounts.items) {
      totalBalance += BigInt(account.parsed.amount.toString());
    }

    return totalBalance;
  } catch (error) {
    // If no accounts found or error, return 0
    console.warn(`Could not fetch compressed balance: ${error}`);
    return BigInt(0);
  }
}

/**
 * Creates a token pool for a mint
 * This is required before compressing tokens for the first time
 */
export async function ensureTokenPool(
  rpc: Rpc,
  payer: Signer,
  mint: PublicKey
): Promise<string | null> {
  try {
    console.log(`Creating token pool for mint ${mint.toBase58()}...`);

    const signature = await createTokenPool(rpc, payer, mint);

    console.log(`✓ Token pool created: ${signature}`);
    return signature;
  } catch (error) {
    // Pool might already exist, which is fine
    if (error instanceof Error && error.message.includes('already in use')) {
      console.log(`Token pool already exists for ${mint.toBase58()}`);
      return null;
    }
    throw new Error(`Failed to create token pool: ${error}`);
  }
}
