/**
 * Pattern Library Types
 *
 * Common types and interfaces for pre-built execution patterns
 */

import type { Transaction } from '../types';
import type { Guard } from '../guard';

/**
 * Base configuration for all execution patterns
 */
export interface PatternConfig {
  /** Pattern name for identification */
  name: string;
  /** Pattern description */
  description?: string;
  /** Optional Guard instance for security validation */
  guard?: Guard;
  /** Enable dry-run mode (simulate without execution) */
  dryRun?: boolean;
  /** Maximum number of retries on failure */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
}

/**
 * Pattern execution result
 */
export interface PatternResult {
  /** Whether the pattern executed successfully */
  success: boolean;
  /** Executed transactions */
  transactions: Transaction[];
  /** Execution metrics */
  metrics: PatternMetrics;
  /** Error if execution failed */
  error?: Error;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Pattern execution metrics
 */
export interface PatternMetrics {
  /** Total execution time in milliseconds */
  executionTime: number;
  /** Number of transactions executed */
  transactionCount: number;
  /** Number of retries */
  retries: number;
  /** Estimated cost in SOL */
  estimatedCost?: number;
  /** Actual cost in SOL (if available) */
  actualCost?: number;
  /** Additional custom metrics */
  custom?: Record<string, number>;
}

/**
 * Token information
 */
export interface Token {
  /** Token mint address */
  mint: string;
  /** Token symbol (e.g., "SOL", "USDC") */
  symbol: string;
  /** Token decimals */
  decimals: number;
  /** Token name */
  name?: string;
}

/**
 * Price information
 */
export interface Price {
  /** Token being priced */
  token: string;
  /** Price in quote currency */
  price: number;
  /** Quote currency (e.g., "USDC") */
  quoteCurrency: string;
  /** Timestamp of price */
  timestamp: number;
  /** Price source */
  source?: string;
}

/**
 * Trading pair configuration
 */
export interface TradingPair {
  /** Base token */
  base: Token;
  /** Quote token */
  quote: Token;
  /** Minimum trade size */
  minSize?: number;
  /** Maximum trade size */
  maxSize?: number;
}

/**
 * Execution strategy type
 */
export type ExecutionStrategy =
  | 'immediate'    // Execute immediately
  | 'twap'         // Time-weighted average price
  | 'vwap'         // Volume-weighted average price
  | 'conditional'  // Execute when conditions are met
  | 'limit';       // Limit order execution

/**
 * Base class for execution patterns
 */
export abstract class ExecutionPattern {
  protected config: PatternConfig;
  protected startTime: number = 0;
  protected retryCount: number = 0;

  constructor(config: PatternConfig) {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      dryRun: false,
      ...config,
    };
  }

  /**
   * Execute the pattern
   */
  abstract execute(): Promise<PatternResult>;

  /**
   * Validate pattern configuration
   */
  protected abstract validate(): boolean;

  /**
   * Create execution metrics
   */
  protected createMetrics(transactions: Transaction[]): PatternMetrics {
    const executionTime = Date.now() - this.startTime;

    return {
      executionTime,
      transactionCount: transactions.length,
      retries: this.retryCount,
    };
  }

  /**
   * Handle execution with retries
   */
  protected async executeWithRetry<T>(
    fn: () => Promise<T>
  ): Promise<T> {
    this.retryCount = 0;

    while (this.retryCount <= (this.config.maxRetries || 3)) {
      try {
        return await fn();
      } catch (error) {
        this.retryCount++;

        if (this.retryCount > (this.config.maxRetries || 3)) {
          throw error;
        }

        // Wait before retry
        await new Promise(resolve =>
          setTimeout(resolve, this.config.retryDelay || 1000)
        );
      }
    }

    throw new Error('Max retries exceeded');
  }
}

/**
 * Pattern registry for managing available patterns
 */
export class PatternRegistry {
  private static patterns: Map<string, typeof ExecutionPattern> = new Map();

  /**
   * Register a new pattern
   */
  static register(name: string, pattern: typeof ExecutionPattern): void {
    this.patterns.set(name, pattern);
  }

  /**
   * Get a pattern by name
   */
  static get(name: string): typeof ExecutionPattern | undefined {
    return this.patterns.get(name);
  }

  /**
   * List all registered patterns
   */
  static list(): string[] {
    return Array.from(this.patterns.keys());
  }

  /**
   * Check if pattern exists
   */
  static has(name: string): boolean {
    return this.patterns.has(name);
  }
}
