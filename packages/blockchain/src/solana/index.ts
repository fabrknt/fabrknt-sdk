export { Connection, PublicKey, Transaction } from '@solana/web3.js';

// Placeholder for Solana-specific utilities
export const SOLANA_NETWORKS = {
  mainnet: 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
} as const;
