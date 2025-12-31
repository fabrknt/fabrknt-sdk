import { Connection, PublicKey } from '@solana/web3.js';
import { getMint, Mint } from '@solana/spl-token';
import { TokenInfo, TokenMetadata } from '../types/data';
import { MetaplexHelper } from './metaplexHelper';

/**
 * Service for fetching on-chain token metadata and information
 */
export class TokenMetadataService {
  private connection: Connection;
  private cache: Map<string, { data: TokenInfo; timestamp: number }>;
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor(connection: Connection) {
    this.connection = connection;
    this.cache = new Map();
  }

  /**
   * Get token information from on-chain
   */
  async getTokenInfo(mintAddress: string): Promise<TokenInfo> {
    // Check cache first
    const cached = this.cache.get(mintAddress);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const mintPubkey = new PublicKey(mintAddress);
      const mintInfo: Mint = await getMint(this.connection, mintPubkey);

      const tokenInfo: TokenInfo = {
        mint: mintAddress,
        decimals: mintInfo.decimals,
        supply: mintInfo.supply.toString(),
        mintAuthority: mintInfo.mintAuthority?.toBase58() || null,
        freezeAuthority: mintInfo.freezeAuthority?.toBase58() || null,
      };

      // Try to fetch additional metadata from Metaplex Token Metadata Program
      try {
        const metadata = await this.getTokenMetadata(mintPubkey);
        if (metadata) {
          tokenInfo.name = metadata.name;
          tokenInfo.symbol = metadata.symbol;
          tokenInfo.uri = metadata.uri;
        }
      } catch (error) {
        // Metadata not available, continue without it
        console.warn(`Could not fetch metadata for ${mintAddress}:`, error);
      }

      // Cache the result
      this.cache.set(mintAddress, {
        data: tokenInfo,
        timestamp: Date.now(),
      });

      return tokenInfo;
    } catch (error) {
      console.error(`Error fetching token info for ${mintAddress}:`, error);
      throw new Error(`Failed to fetch token information: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get token metadata from Metaplex Token Metadata Program
   */
  private async getTokenMetadata(mintPubkey: PublicKey): Promise<TokenMetadata | null> {
    try {
      return await MetaplexHelper.fetchTokenMetadata(this.connection, mintPubkey);
    } catch (error) {
      console.warn(`Error in getTokenMetadata for ${mintPubkey.toBase58()}:`, error);
      return null;
    }
  }

  /**
   * Clear cache for a specific token or all tokens
   */
  clearCache(mintAddress?: string): void {
    if (mintAddress) {
      this.cache.delete(mintAddress);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

