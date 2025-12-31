/**
 * DEX Integration Tests
 *
 * Tests for Jupiter adapter, price feed service, and DEX integrations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JupiterAdapter } from '../src/dex/jupiter';
import { PriceFeedService } from '../src/dex/price-feed';
import { COMMON_TOKENS } from '../src/dex/types';
import type { DEXAdapter } from '../src/dex/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('JupiterAdapter', () => {
  let adapter: JupiterAdapter;

  beforeEach(() => {
    adapter = new JupiterAdapter();
    mockFetch.mockClear();
  });

  describe('Configuration', () => {
    it('should initialize with default config', () => {
      const adapter = new JupiterAdapter();
      expect(adapter.getName()).toBe('Jupiter');
    });

    it('should accept custom config', () => {
      const adapter = new JupiterAdapter({
        apiUrl: 'https://custom-api.example.com',
        defaultSlippageBps: 100,
        timeout: 5000,
        cacheTTL: 60000,
      });
      expect(adapter.getName()).toBe('Jupiter');
    });
  });

  describe('getQuote', () => {
    it('should fetch quote from Jupiter API', async () => {
      const mockQuoteResponse = {
        inputMint: COMMON_TOKENS.SOL,
        inAmount: '1000000000',
        outputMint: COMMON_TOKENS.USDC,
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 50,
        platformFee: null,
        priceImpactPct: '0.15',
        routePlan: [
          {
            swapInfo: {
              ammKey: 'test-amm-key',
              label: 'Orca',
              inputMint: COMMON_TOKENS.SOL,
              outputMint: COMMON_TOKENS.USDC,
              inAmount: '1000000000',
              outAmount: '100000000',
              feeAmount: '300000',
              feeMint: COMMON_TOKENS.USDC,
            },
            percent: 100,
          },
        ],
        contextSlot: 12345,
        timeTaken: 123,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuoteResponse,
      });

      const quote = await adapter.getQuote(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC, 1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('quote'),
        expect.any(Object)
      );
      expect(quote.inputMint).toBe(COMMON_TOKENS.SOL);
      expect(quote.outputMint).toBe(COMMON_TOKENS.USDC);
      expect(quote.marketInfos).toHaveLength(1);
      expect(quote.marketInfos[0].label).toBe('Orca');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        adapter.getQuote(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC, 1)
      ).rejects.toThrow('Jupiter API error');
    });

    it('should handle timeouts', async () => {
      const adapter = new JupiterAdapter({ timeout: 100 });

      // Mock a slow response that will be aborted
      mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('The operation was aborted');
            error.name = 'AbortError';
            reject(error);
          }, 150);
        });
      });

      await expect(
        adapter.getQuote(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC, 1)
      ).rejects.toThrow('timed out');
    });

    it('should cache quote results', async () => {
      const mockResponse = {
        inputMint: COMMON_TOKENS.SOL,
        inAmount: '1000000000',
        outputMint: COMMON_TOKENS.USDC,
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 50,
        platformFee: null,
        priceImpactPct: '0.15',
        routePlan: [
          {
            swapInfo: {
              ammKey: 'test-amm-key',
              label: 'Orca',
              inputMint: COMMON_TOKENS.SOL,
              outputMint: COMMON_TOKENS.USDC,
              inAmount: '1000000000',
              outAmount: '100000000',
              feeAmount: '300000',
              feeMint: COMMON_TOKENS.USDC,
            },
            percent: 100,
          },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // First call
      await adapter.getQuote(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC, 1, 50);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await adapter.getQuote(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC, 1, 50);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1
    });
  });

  describe('getRoute', () => {
    it('should convert quote to route format', async () => {
      const mockQuoteResponse = {
        inputMint: COMMON_TOKENS.SOL,
        inAmount: '1000000000',
        outputMint: COMMON_TOKENS.USDC,
        outAmount: '100000000',
        otherAmountThreshold: '99000000',
        swapMode: 'ExactIn',
        slippageBps: 50,
        platformFee: null,
        priceImpactPct: '0.15',
        routePlan: [
          {
            swapInfo: {
              ammKey: 'test-amm-key',
              label: 'Raydium',
              inputMint: COMMON_TOKENS.SOL,
              outputMint: COMMON_TOKENS.USDC,
              inAmount: '1000000000',
              outAmount: '100000000',
              feeAmount: '300000',
              feeMint: COMMON_TOKENS.USDC,
            },
            percent: 100,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuoteResponse,
      });

      const route = await adapter.getRoute(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC, 1);

      expect(route.inAmount).toBe('1000000000');
      expect(route.outAmount).toBe('100000000');
      expect(route.priceImpactPct).toBe(0.15);
      expect(route.swapMode).toBe('ExactIn');
    });
  });

  describe('getPrice', () => {
    it('should fetch price from Jupiter Price API', async () => {
      const mockPriceResponse = {
        data: {
          [COMMON_TOKENS.SOL]: {
            id: COMMON_TOKENS.SOL,
            mintSymbol: 'SOL',
            vsToken: COMMON_TOKENS.USDC,
            vsTokenSymbol: 'USDC',
            price: 100.5,
          },
        },
        timeTaken: 50,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPriceResponse,
      });

      const price = await adapter.getPrice(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('price.jup.ag'),
        expect.any(Object)
      );
      expect(price.price).toBe(100.5);
      expect(price.mintSymbol).toBe('SOL');
      expect(price.vsTokenSymbol).toBe('USDC');
    });

    it('should handle missing price data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {}, timeTaken: 50 }),
      });

      await expect(
        adapter.getPrice(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC)
      ).rejects.toThrow('Price data not found');
    });

    it('should cache price results', async () => {
      const mockResponse = {
        data: {
          [COMMON_TOKENS.SOL]: {
            id: COMMON_TOKENS.SOL,
            mintSymbol: 'SOL',
            vsToken: COMMON_TOKENS.USDC,
            vsTokenSymbol: 'USDC',
            price: 100.5,
          },
        },
        timeTaken: 50,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // First call
      await adapter.getPrice(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await adapter.getPrice(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1
    });
  });

  describe('isSupported', () => {
    it('should return true for supported pairs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          inputMint: COMMON_TOKENS.SOL,
          outputMint: COMMON_TOKENS.USDC,
          inAmount: '1000',
          outAmount: '100',
          routePlan: [],
        }),
      });

      const supported = await adapter.isSupported(
        COMMON_TOKENS.SOL,
        COMMON_TOKENS.USDC
      );
      expect(supported).toBe(true);
    });

    it('should return false for unsupported pairs', async () => {
      mockFetch.mockRejectedValueOnce(new Error('No route found'));

      const supported = await adapter.isSupported('invalid-mint', COMMON_TOKENS.USDC);
      expect(supported).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      const mockResponse = {
        data: {
          [COMMON_TOKENS.SOL]: {
            id: COMMON_TOKENS.SOL,
            mintSymbol: 'SOL',
            vsToken: COMMON_TOKENS.USDC,
            vsTokenSymbol: 'USDC',
            price: 100.5,
          },
        },
        timeTaken: 50,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // First call
      await adapter.getPrice(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      adapter.clearCache();

      // Second call should fetch again
      await adapter.getPrice(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('PriceFeedService', () => {
  let priceFeed: PriceFeedService;
  let mockAdapter: DEXAdapter;

  beforeEach(() => {
    mockAdapter = {
      getName: () => 'MockAdapter',
      getQuote: vi.fn(),
      getRoute: vi.fn(),
      getPrice: vi.fn(),
      isSupported: vi.fn(),
    };

    priceFeed = new PriceFeedService({
      adapters: [mockAdapter],
      cacheTTL: 1000,
    });
  });

  describe('Configuration', () => {
    it('should initialize with default config', () => {
      const feed = new PriceFeedService();
      expect(feed.getAdapters()).toContain('Jupiter');
    });

    it('should accept custom adapters', () => {
      const feed = new PriceFeedService({
        adapters: [mockAdapter],
      });
      expect(feed.getAdapters()).toContain('MockAdapter');
    });
  });

  describe('getPrice', () => {
    it('should fetch price from adapter', async () => {
      vi.mocked(mockAdapter.getPrice).mockResolvedValueOnce({
        id: COMMON_TOKENS.SOL,
        mintSymbol: 'SOL',
        vsToken: COMMON_TOKENS.USDC,
        vsTokenSymbol: 'USDC',
        price: 100.5,
        timestamp: Date.now(),
      });

      const price = await priceFeed.getPrice(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC);
      expect(price).toBe(100.5);
      expect(mockAdapter.getPrice).toHaveBeenCalledWith(
        COMMON_TOKENS.SOL,
        COMMON_TOKENS.USDC
      );
    });

    it('should cache prices', async () => {
      vi.mocked(mockAdapter.getPrice).mockResolvedValue({
        id: COMMON_TOKENS.SOL,
        mintSymbol: 'SOL',
        vsToken: COMMON_TOKENS.USDC,
        vsTokenSymbol: 'USDC',
        price: 100.5,
        timestamp: Date.now(),
      });

      // First call
      await priceFeed.getPrice(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC);
      expect(mockAdapter.getPrice).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await priceFeed.getPrice(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC);
      expect(mockAdapter.getPrice).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should handle adapter errors with fallback', async () => {
      const mockAdapter2: DEXAdapter = {
        getName: () => 'MockAdapter2',
        getQuote: vi.fn(),
        getRoute: vi.fn(),
        getPrice: vi.fn().mockResolvedValue({
          id: COMMON_TOKENS.SOL,
          mintSymbol: 'SOL',
          vsToken: COMMON_TOKENS.USDC,
          vsTokenSymbol: 'USDC',
          price: 101.0,
          timestamp: Date.now(),
        }),
        isSupported: vi.fn(),
      };

      const feed = new PriceFeedService({
        adapters: [mockAdapter, mockAdapter2],
        enableFallback: true,
      });

      vi.mocked(mockAdapter.getPrice).mockRejectedValueOnce(
        new Error('Adapter 1 failed')
      );

      const price = await feed.getPrice(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC);
      expect(price).toBe(101.0);
      expect(mockAdapter.getPrice).toHaveBeenCalledTimes(1);
      expect(mockAdapter2.getPrice).toHaveBeenCalledTimes(1);
    });

    it('should throw when all adapters fail', async () => {
      vi.mocked(mockAdapter.getPrice).mockRejectedValueOnce(
        new Error('Adapter failed')
      );

      await expect(
        priceFeed.getPrice(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC)
      ).rejects.toThrow('Failed to get price');
    });

    it('should not fallback when disabled', async () => {
      const feed = new PriceFeedService({
        adapters: [mockAdapter],
        enableFallback: false,
      });

      vi.mocked(mockAdapter.getPrice).mockRejectedValueOnce(
        new Error('Adapter failed')
      );

      await expect(
        feed.getPrice(COMMON_TOKENS.SOL, COMMON_TOKENS.USDC)
      ).rejects.toThrow('Adapter failed');
    });
  });

  describe('getPrices', () => {
    it('should fetch multiple prices in parallel', async () => {
      vi.mocked(mockAdapter.getPrice)
        .mockResolvedValueOnce({
          id: COMMON_TOKENS.SOL,
          mintSymbol: 'SOL',
          vsToken: COMMON_TOKENS.USDC,
          vsTokenSymbol: 'USDC',
          price: 100.5,
          timestamp: Date.now(),
        })
        .mockResolvedValueOnce({
          id: COMMON_TOKENS.USDT,
          mintSymbol: 'USDT',
          vsToken: COMMON_TOKENS.USDC,
          vsTokenSymbol: 'USDC',
          price: 1.0,
          timestamp: Date.now(),
        });

      const prices = await priceFeed.getPrices([COMMON_TOKENS.SOL, COMMON_TOKENS.USDT]);
      expect(prices.size).toBe(2);
      expect(prices.get(COMMON_TOKENS.SOL)).toBe(100.5);
      expect(prices.get(COMMON_TOKENS.USDT)).toBe(1.0);
    });

    it('should handle partial failures', async () => {
      vi.mocked(mockAdapter.getPrice)
        .mockResolvedValueOnce({
          id: COMMON_TOKENS.SOL,
          mintSymbol: 'SOL',
          vsToken: COMMON_TOKENS.USDC,
          vsTokenSymbol: 'USDC',
          price: 100.5,
          timestamp: Date.now(),
        })
        .mockRejectedValueOnce(new Error('Failed'));

      const prices = await priceFeed.getPrices([COMMON_TOKENS.SOL, COMMON_TOKENS.USDT]);
      expect(prices.size).toBe(1);
      expect(prices.get(COMMON_TOKENS.SOL)).toBe(100.5);
      expect(prices.has(COMMON_TOKENS.USDT)).toBe(false);
    });
  });

  describe('subscribe', () => {
    it('should notify subscribers on price updates', async () => {
      const callback = vi.fn();
      const unsubscribe = priceFeed.subscribe(COMMON_TOKENS.SOL, callback);

      vi.mocked(mockAdapter.getPrice).mockResolvedValue({
        id: COMMON_TOKENS.SOL,
        mintSymbol: 'SOL',
        vsToken: COMMON_TOKENS.USDC,
        vsTokenSymbol: 'USDC',
        price: 100.5,
        timestamp: Date.now(),
      });

      await priceFeed.getPrice(COMMON_TOKENS.SOL);

      expect(callback).toHaveBeenCalledWith(100.5);

      unsubscribe();
    });

    it('should allow unsubscribe', async () => {
      const callback = vi.fn();
      const unsubscribe = priceFeed.subscribe(COMMON_TOKENS.SOL, callback);

      vi.mocked(mockAdapter.getPrice).mockResolvedValue({
        id: COMMON_TOKENS.SOL,
        mintSymbol: 'SOL',
        vsToken: COMMON_TOKENS.USDC,
        vsTokenSymbol: 'USDC',
        price: 100.5,
        timestamp: Date.now(),
      });

      await priceFeed.getPrice(COMMON_TOKENS.SOL);
      expect(callback).toHaveBeenCalledTimes(1);

      callback.mockClear();
      unsubscribe();

      await priceFeed.getPrice(COMMON_TOKENS.SOL);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      vi.mocked(mockAdapter.getPrice).mockResolvedValue({
        id: COMMON_TOKENS.SOL,
        mintSymbol: 'SOL',
        vsToken: COMMON_TOKENS.USDC,
        vsTokenSymbol: 'USDC',
        price: 100.5,
        timestamp: Date.now(),
      });

      await priceFeed.getPrice(COMMON_TOKENS.SOL);
      expect(mockAdapter.getPrice).toHaveBeenCalledTimes(1);

      priceFeed.clearCache();

      await priceFeed.getPrice(COMMON_TOKENS.SOL);
      expect(mockAdapter.getPrice).toHaveBeenCalledTimes(2);
    });

    it('should provide cache statistics', async () => {
      vi.mocked(mockAdapter.getPrice).mockResolvedValue({
        id: COMMON_TOKENS.SOL,
        mintSymbol: 'SOL',
        vsToken: COMMON_TOKENS.USDC,
        vsTokenSymbol: 'USDC',
        price: 100.5,
        timestamp: Date.now(),
      });

      await priceFeed.getPrice(COMMON_TOKENS.SOL);

      const stats = priceFeed.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries[0].price).toBe(100.5);
      expect(stats.entries[0].source).toBe('MockAdapter');
    });
  });

  describe('Adapter Management', () => {
    it('should add adapter', () => {
      const newAdapter: DEXAdapter = {
        getName: () => 'NewAdapter',
        getQuote: vi.fn(),
        getRoute: vi.fn(),
        getPrice: vi.fn(),
        isSupported: vi.fn(),
      };

      priceFeed.addAdapter(newAdapter);
      expect(priceFeed.getAdapters()).toContain('NewAdapter');
    });

    it('should remove adapter', () => {
      priceFeed.removeAdapter('MockAdapter');
      expect(priceFeed.getAdapters()).not.toContain('MockAdapter');
    });
  });
});
