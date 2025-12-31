/**
 * DEX Integration Types
 *
 * Common types for DEX adapter implementations
 */

/**
 * Token mint information
 */
export interface TokenMint {
  address: string;
  symbol: string;
  decimals: number;
  name?: string;
  logoURI?: string;
}

/**
 * Price quote from a DEX
 */
export interface PriceQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  marketInfos: MarketInfo[];
  slippageBps?: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  contextSlot?: number;
  timeTaken?: number;
}

/**
 * Market/DEX information for a route
 */
export interface MarketInfo {
  id: string;
  label: string;
  inputMint: string;
  outputMint: string;
  notEnoughLiquidity: boolean;
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  lpFee: {
    amount: string;
    mint: string;
    pct: number;
  };
  platformFee: {
    amount: string;
    mint: string;
    pct: number;
  };
}

/**
 * Swap route information
 */
export interface SwapRoute {
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  marketInfos: MarketInfo[];
  amount: string;
  slippageBps: number;
  otherAmountThreshold: string;
  swapMode: 'ExactIn' | 'ExactOut';
  fees?: {
    signatureFee: number;
    openOrdersDeposits: number[];
    ataDeposits: number[];
    totalFeeAndDeposits: number;
    minimumSOLForTransaction: number;
  };
}

/**
 * Token price information
 */
export interface TokenPrice {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
  timestamp: number;
}

/**
 * DEX adapter interface
 */
export interface DEXAdapter {
  /**
   * Get name of the DEX
   */
  getName(): string;

  /**
   * Get a quote for a swap
   */
  getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps?: number
  ): Promise<PriceQuote>;

  /**
   * Get best route for a swap
   */
  getRoute(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps?: number
  ): Promise<SwapRoute>;

  /**
   * Get current price for a token pair
   */
  getPrice(
    inputMint: string,
    outputMint: string
  ): Promise<TokenPrice>;

  /**
   * Check if token pair is supported
   */
  isSupported(inputMint: string, outputMint: string): Promise<boolean>;
}

/**
 * Price feed interface
 */
export interface PriceFeed {
  /**
   * Get current price for a token
   */
  getPrice(mint: string, vsToken?: string): Promise<number>;

  /**
   * Get prices for multiple tokens
   */
  getPrices(mints: string[], vsToken?: string): Promise<Map<string, number>>;

  /**
   * Subscribe to price updates
   */
  subscribe(mint: string, callback: (price: number) => void): () => void;
}

/**
 * Common Solana token mints
 */
export const COMMON_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  WSOL: 'So11111111111111111111111111111111111111112',
  mSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  stSOL: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
} as const;

/**
 * DEX configuration
 */
export interface DEXConfig {
  /** RPC endpoint URL */
  rpcUrl?: string;
  /** API base URL (for aggregators like Jupiter) */
  apiUrl?: string;
  /** Default slippage in basis points */
  defaultSlippageBps?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Enable caching */
  enableCache?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
}
