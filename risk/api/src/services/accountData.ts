import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TokenInfo, TokenHolder, TokenDistribution } from '../types/data';

/**
 * Service for querying RWA token accounts and holder information
 */
export class AccountDataService {
  private connection: Connection;
  private cache: Map<string, { data: TokenDistribution; timestamp: number }>;
  private cacheTTL: number = 10 * 60 * 1000; // 10 minutes (longer than token metadata)

  constructor(connection: Connection) {
    this.connection = connection;
    this.cache = new Map();
  }

  /**
   * Get token distribution metrics for a token
   */
  async getTokenDistribution(tokenMint: string, tokenInfo?: TokenInfo): Promise<TokenDistribution> {
    // Check cache first
    const cached = this.cache.get(tokenMint);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const mintPubkey = new PublicKey(tokenMint);

      // Get all token accounts for this mint
      const tokenAccounts = await this.connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
        filters: [
          {
            dataSize: 165, // Token account data size
          },
          {
            memcmp: {
              offset: 0, // Mint address offset in token account
              bytes: mintPubkey.toBase58(),
            },
          },
        ],
      });

      // Parse token accounts
      const holders: TokenHolder[] = [];
      let totalBalance = BigInt(0);

      for (const { pubkey, account } of tokenAccounts) {
        try {
          const tokenAccount = await getAccount(this.connection, pubkey);
          if (tokenAccount.amount > 0) {
            const balance = tokenAccount.amount.toString();
            totalBalance += tokenAccount.amount;
            holders.push({
              address: pubkey.toBase58(),
              balance,
              decimals: tokenAccount.mint.toString() === tokenMint ? (tokenInfo?.decimals || 0) : 0,
            });
          }
        } catch (error) {
          // Skip invalid accounts
          console.warn(`Error parsing token account ${pubkey.toBase58()}:`, error);
        }
      }

      // Sort by balance (descending)
      holders.sort((a, b) => {
        const balanceA = BigInt(a.balance);
        const balanceB = BigInt(b.balance);
        return balanceB > balanceA ? 1 : balanceB < balanceA ? -1 : 0;
      });

      // Get top 10 holders
      const topHolders = holders.slice(0, 10);

      // Calculate average balance
      const totalHolders = holders.length;
      const averageBalance = totalHolders > 0
        ? (totalBalance / BigInt(totalHolders)).toString()
        : '0';

      // Calculate concentration (simplified - ratio of top 10 to total)
      const top10Balance = topHolders.reduce(
        (sum, holder) => sum + BigInt(holder.balance),
        BigInt(0)
      );
      const concentration = totalBalance > 0
        ? Number(top10Balance * BigInt(100) / totalBalance) / 100
        : 0;

      const distribution: TokenDistribution = {
        totalHolders,
        totalSupply: totalBalance.toString(),
        topHolders,
        averageBalance,
        concentration,
      };

      // Cache the result
      this.cache.set(tokenMint, {
        data: distribution,
        timestamp: Date.now(),
      });

      return distribution;
    } catch (error) {
      console.error(`Error fetching token distribution for ${tokenMint}:`, error);
      throw new Error(
        `Failed to fetch token distribution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get token holder information for a specific address
   */
  async getTokenHolder(tokenMint: string, holderAddress: string): Promise<TokenHolder | null> {
    try {
      const mintPubkey = new PublicKey(tokenMint);
      const holderPubkey = new PublicKey(holderAddress);

      // Get associated token account
      const ata = await getAssociatedTokenAddress(mintPubkey, holderPubkey);

      try {
        const tokenAccount = await getAccount(this.connection, ata);
        if (tokenAccount.amount > 0) {
          return {
            address: holderAddress,
            balance: tokenAccount.amount.toString(),
            decimals: tokenAccount.mint.toString() === tokenMint ? 0 : 0, // Would need to fetch decimals
          };
        }
      } catch (error) {
        // Account doesn't exist or has zero balance
        return null;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching token holder ${holderAddress} for ${tokenMint}:`, error);
      return null;
    }
  }

  /**
   * Clear cache for a specific token or all tokens
   */
  clearCache(tokenMint?: string): void {
    if (tokenMint) {
      this.cache.delete(tokenMint);
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

