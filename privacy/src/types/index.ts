import { PublicKey } from '@solana/web3.js';

/**
 * Configuration for connecting to Solana and Light Protocol
 */
export interface NetworkConfig {
  rpcUrl: string;
  photonRpcUrl?: string;
  network: 'devnet' | 'testnet' | 'mainnet-beta';
}

/**
 * Recipient for a private airdrop
 */
export interface AirdropRecipient {
  /** Recipient's public key */
  address: PublicKey;
  /** Amount to airdrop (in token base units) */
  amount: bigint;
  /** Optional metadata (not stored on-chain) */
  metadata?: {
    label?: string;
    eligibilityReason?: string;
  };
}

/**
 * Result of an airdrop operation
 */
export interface AirdropResult {
  /** Transaction signature */
  signature: string;
  /** Recipient address */
  recipient: PublicKey;
  /** Amount airdropped */
  amount: bigint;
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Configuration for a private airdrop campaign
 */
export interface AirdropConfig {
  /** Token mint address */
  mint: PublicKey;
  /** Authority keypair for the airdrop */
  authorityKeypair: any; // Keypair type
  /** List of recipients */
  recipients: AirdropRecipient[];
  /** Batch size for processing */
  batchSize?: number;
  /** Whether to use ZK compression */
  useCompression: boolean;
}
