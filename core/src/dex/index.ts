/**
 * DEX Integration Module
 *
 * Provides real DEX integration for Solana via Jupiter and other aggregators
 */

export { JupiterAdapter } from './jupiter';
export { PriceFeedService } from './price-feed';

export type {
  TokenMint,
  PriceQuote,
  MarketInfo,
  SwapRoute,
  TokenPrice,
  DEXAdapter,
  PriceFeed,
  DEXConfig,
} from './types';

export { COMMON_TOKENS } from './types';
