/**
 * Price Feed Service
 *
 * Aggregates price data from multiple DEX adapters
 */

import type { PriceFeed, DEXAdapter } from './types';
import { JupiterAdapter } from './jupiter';
import { COMMON_TOKENS } from './types';

/**
 * Price feed configuration
 */
export interface PriceFeedConfig {
  /** Default quote currency */
  defaultVsToken?: string;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** DEX adapters to use */
  adapters?: DEXAdapter[];
  /** Enable automatic fallback to other adapters */
  enableFallback?: boolean;
}

/**
 * Cached price entry
 */
interface CachedPrice {
  price: number;
  timestamp: number;
  source: string;
}

/**
 * Price Feed Service
 *
 * Provides real-time price data from DEXs with caching and fallback support
 */
export class PriceFeedService implements PriceFeed {
  private defaultVsToken: string;
  private cacheTTL: number;
  private adapters: DEXAdapter[];
  private cache: Map<string, CachedPrice>;
  private subscribers: Map<string, Set<(price: number) => void>>;
  private enableFallback: boolean;

  constructor(config: PriceFeedConfig = {}) {
    this.defaultVsToken = config.defaultVsToken || COMMON_TOKENS.USDC;
    this.cacheTTL = config.cacheTTL || 30000; // 30 seconds
    this.adapters = config.adapters || [new JupiterAdapter()];
    this.cache = new Map();
    this.subscribers = new Map();
    this.enableFallback = config.enableFallback !== false;
  }

  /**
   * Get current price for a token
   */
  async getPrice(mint: string, vsToken?: string): Promise<number> {
    const quoteMint = vsToken || this.defaultVsToken;
    const cacheKey = `${mint}:${quoteMint}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.price;
    }

    // Try each adapter
    const errors: Error[] = [];

    for (const adapter of this.adapters) {
      try {
        const priceData = await adapter.getPrice(mint, quoteMint);
        const price = priceData.price;

        // Cache the price
        this.cache.set(cacheKey, {
          price,
          timestamp: Date.now(),
          source: adapter.getName(),
        });

        // Notify subscribers
        this.notifySubscribers(mint, price);

        return price;
      } catch (error) {
        errors.push(error as Error);

        if (!this.enableFallback) {
          throw error;
        }
        // Continue to next adapter
      }
    }

    // All adapters failed
    throw new Error(
      `Failed to get price for ${mint}: ${errors.map(e => e.message).join(', ')}`
    );
  }

  /**
   * Get prices for multiple tokens
   */
  async getPrices(
    mints: string[],
    vsToken?: string
  ): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    // Fetch prices in parallel
    const results = await Promise.allSettled(
      mints.map(mint => this.getPrice(mint, vsToken))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        prices.set(mints[index], result.value);
      }
    });

    return prices;
  }

  /**
   * Subscribe to price updates
   */
  subscribe(mint: string, callback: (price: number) => void): () => void {
    if (!this.subscribers.has(mint)) {
      this.subscribers.set(mint, new Set());
    }

    this.subscribers.get(mint)!.add(callback);

    // Start polling for this token
    const pollInterval = setInterval(async () => {
      try {
        await this.getPrice(mint);
      } catch {
        // Ignore errors in polling
      }
    }, this.cacheTTL);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(mint);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(mint);
          clearInterval(pollInterval);
        }
      }
    };
  }

  /**
   * Notify subscribers of price update
   */
  private notifySubscribers(mint: string, price: number): void {
    const subscribers = this.subscribers.get(mint);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(price);
        } catch {
          // Ignore callback errors
        }
      });
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: Array<{ key: string; price: number; age: number; source: string }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      price: value.price,
      age: now - value.timestamp,
      source: value.source,
    }));

    return {
      size: this.cache.size,
      entries,
    };
  }

  /**
   * Add adapter
   */
  addAdapter(adapter: DEXAdapter): void {
    this.adapters.push(adapter);
  }

  /**
   * Remove adapter
   */
  removeAdapter(adapterName: string): void {
    this.adapters = this.adapters.filter(a => a.getName() !== adapterName);
  }

  /**
   * Get all adapter names
   */
  getAdapters(): string[] {
    return this.adapters.map(a => a.getName());
  }
}
