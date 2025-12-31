/**
 * Jupiter Aggregator API Client
 *
 * Integrates with Jupiter V6 API for optimal swap routing across Solana DEXs
 * https://station.jup.ag/docs/apis/swap-api
 */

import type {
  DEXAdapter,
  DEXConfig,
  PriceQuote,
  SwapRoute,
  TokenPrice,
  MarketInfo,
} from './types';

/**
 * Jupiter API response types
 */
interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: {
    amount: string;
    feeBps: number;
  } | null;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  contextSlot?: number;
  timeTaken?: number;
}

interface JupiterPriceResponse {
  data: {
    [key: string]: {
      id: string;
      mintSymbol: string;
      vsToken: string;
      vsTokenSymbol: string;
      price: number;
    };
  };
  timeTaken: number;
}

/**
 * Jupiter DEX Adapter
 *
 * Provides access to Jupiter's aggregated DEX routing
 */
export class JupiterAdapter implements DEXAdapter {
  private apiUrl: string;
  private defaultSlippageBps: number;
  private timeout: number;
  private cache: Map<string, { data: any; expiry: number }>;
  private cacheTTL: number;

  constructor(config: DEXConfig = {}) {
    this.apiUrl = config.apiUrl || 'https://quote-api.jup.ag/v6';
    this.defaultSlippageBps = config.defaultSlippageBps || 50; // 0.5%
    this.timeout = config.timeout || 10000;
    this.cache = new Map();
    this.cacheTTL = config.cacheTTL || 30000; // 30 seconds default
  }

  /**
   * Get adapter name
   */
  getName(): string {
    return 'Jupiter';
  }

  /**
   * Get quote for a swap
   */
  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps?: number
  ): Promise<PriceQuote> {
    const cacheKey = `quote:${inputMint}:${outputMint}:${amount}:${slippageBps || this.defaultSlippageBps}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const slippage = slippageBps || this.defaultSlippageBps;

    // Convert amount to lamports/smallest unit
    const amountLamports = Math.floor(amount * 1e9); // Assuming 9 decimals for demo

    const url = new URL(`${this.apiUrl}/quote`);
    url.searchParams.set('inputMint', inputMint);
    url.searchParams.set('outputMint', outputMint);
    url.searchParams.set('amount', amountLamports.toString());
    url.searchParams.set('slippageBps', slippage.toString());

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Jupiter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as JupiterQuoteResponse;

      const quote: PriceQuote = {
        inputMint: data.inputMint,
        outputMint: data.outputMint,
        inAmount: data.inAmount,
        outAmount: data.outAmount,
        priceImpactPct: parseFloat(data.priceImpactPct),
        marketInfos: this.convertRoutePlanToMarketInfos(data.routePlan),
        slippageBps: data.slippageBps,
        platformFee: data.platformFee || undefined,
        contextSlot: data.contextSlot,
        timeTaken: data.timeTaken,
      };

      this.setCache(cacheKey, quote);
      return quote;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Jupiter API request timed out');
      }
      throw error;
    }
  }

  /**
   * Get best route for a swap
   */
  async getRoute(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps?: number
  ): Promise<SwapRoute> {
    const quote = await this.getQuote(inputMint, outputMint, amount, slippageBps);

    return {
      inAmount: quote.inAmount,
      outAmount: quote.outAmount,
      priceImpactPct: quote.priceImpactPct,
      marketInfos: quote.marketInfos,
      amount: quote.inAmount,
      slippageBps: quote.slippageBps || this.defaultSlippageBps,
      otherAmountThreshold: quote.outAmount,
      swapMode: 'ExactIn',
    };
  }

  /**
   * Get current price for a token pair
   */
  async getPrice(inputMint: string, outputMint: string): Promise<TokenPrice> {
    const cacheKey = `price:${inputMint}:${outputMint}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const url = new URL('https://price.jup.ag/v4/price');
    url.searchParams.set('ids', inputMint);
    url.searchParams.set('vsToken', outputMint);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Jupiter Price API error: ${response.status}`);
      }

      const data = await response.json() as JupiterPriceResponse;
      const priceData = data.data[inputMint];

      if (!priceData) {
        throw new Error(`Price data not found for ${inputMint}`);
      }

      const tokenPrice: TokenPrice = {
        id: priceData.id,
        mintSymbol: priceData.mintSymbol,
        vsToken: priceData.vsToken,
        vsTokenSymbol: priceData.vsTokenSymbol,
        price: priceData.price,
        timestamp: Date.now(),
      };

      this.setCache(cacheKey, tokenPrice);
      return tokenPrice;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Jupiter Price API request timed out');
      }
      throw error;
    }
  }

  /**
   * Check if token pair is supported
   */
  async isSupported(inputMint: string, outputMint: string): Promise<boolean> {
    try {
      // Try to get a small quote to check support
      await this.getQuote(inputMint, outputMint, 0.001, this.defaultSlippageBps);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert Jupiter route plan to market infos
   */
  private convertRoutePlanToMarketInfos(
    routePlan: JupiterQuoteResponse['routePlan']
  ): MarketInfo[] {
    return routePlan.map((route) => ({
      id: route.swapInfo.ammKey,
      label: route.swapInfo.label,
      inputMint: route.swapInfo.inputMint,
      outputMint: route.swapInfo.outputMint,
      notEnoughLiquidity: false,
      inAmount: route.swapInfo.inAmount,
      outAmount: route.swapInfo.outAmount,
      priceImpactPct: 0, // Not provided in route plan
      lpFee: {
        amount: route.swapInfo.feeAmount,
        mint: route.swapInfo.feeMint,
        pct: 0, // Would need to calculate
      },
      platformFee: {
        amount: '0',
        mint: route.swapInfo.feeMint,
        pct: 0,
      },
    }));
  }

  /**
   * Get item from cache
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set item in cache
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheTTL,
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
