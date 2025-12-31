import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

/**
 * Rate limiting per wallet address
 * Tracks requests per wallet to prevent abuse
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class WalletRateLimiter {
  private requests: Map<string, RateLimitEntry>;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.requests = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if wallet has exceeded rate limit
   */
  checkLimit(walletAddress: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.requests.get(walletAddress);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      this.requests.set(walletAddress, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs,
      };
    }

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [wallet, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(wallet);
      }
    }
  }

  /**
   * Reset rate limit for a wallet (for testing)
   */
  reset(walletAddress?: string): void {
    if (walletAddress) {
      this.requests.delete(walletAddress);
    } else {
      this.requests.clear();
    }
  }
}

// Global rate limiter instance
const walletRateLimiter = new WalletRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
);

/**
 * Middleware to rate limit requests per wallet address
 */
export const walletRateLimit = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthenticatedRequest;
  const walletAddress = authReq.wallet?.toBase58();

  // Skip rate limiting for demo mode
  if (req.headers['x-demo-mode'] === 'true' || !walletAddress) {
    return next();
  }

  const limit = walletRateLimiter.checkLimit(walletAddress);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', walletRateLimiter['maxRequests']);
  res.setHeader('X-RateLimit-Remaining', limit.remaining);
  res.setHeader('X-RateLimit-Reset', new Date(limit.resetTime).toISOString());

  if (!limit.allowed) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      resetTime: new Date(limit.resetTime).toISOString(),
    });
  }

  next();
};

