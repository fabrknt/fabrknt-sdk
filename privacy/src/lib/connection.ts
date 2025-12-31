import { Connection, PublicKey } from '@solana/web3.js';
import { Rpc, createRpc } from '@lightprotocol/stateless.js';
import { NetworkConfig } from '../types';

/**
 * Creates a standard Solana connection
 */
export function createConnection(config: NetworkConfig): Connection {
  return new Connection(config.rpcUrl, 'confirmed');
}

/**
 * Creates a Light Protocol RPC connection for compressed state
 * This enables ZK compression features like compressed token transfers
 */
export function createLightRpc(config: NetworkConfig): Rpc {
  const compressionApiEndpoint = config.photonRpcUrl || config.rpcUrl;

  // Create Light Protocol RPC with compression API endpoint
  // The Photon RPC provides Merkle proofs and compressed account indexing
  const rpc = createRpc(
    config.rpcUrl,           // Standard Solana RPC
    compressionApiEndpoint    // Photon API for compression
  );

  return rpc;
}

/**
 * Validates a Solana public key
 */
export function validatePublicKey(key: string): PublicKey {
  try {
    return new PublicKey(key);
  } catch (error) {
    throw new Error(`Invalid public key: ${key}`);
  }
}

/**
 * Gets SOL balance for an address
 */
export async function getBalance(
  connection: Connection,
  address: PublicKey
): Promise<number> {
  const balance = await connection.getBalance(address);
  return balance / 1e9; // Convert lamports to SOL
}
