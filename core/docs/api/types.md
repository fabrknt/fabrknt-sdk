# TypeScript Type Definitions

Complete TypeScript type definitions for Fabrknt SDK.

## Pattern Types

### PatternConfig

Base configuration for all patterns.

```typescript
interface PatternConfig {
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
```

### PatternResult

Result returned from pattern execution.

```typescript
interface PatternResult {
    /** Whether the pattern executed successfully */
    success: boolean;

    /** Array of executed transactions */
    transactions: Transaction[];

    /** Execution metrics */
    metrics: PatternMetrics;

    /** Additional metadata */
    metadata?: Record<string, any>;

    /** Error message if failed */
    error?: string;
}
```

### PatternMetrics

Execution metrics.

```typescript
interface PatternMetrics {
    /** Execution time in milliseconds */
    executionTime: number;

    /** Number of transactions */
    transactionCount: number;

    /** Number of retries */
    retries: number;

    /** Actual gas cost in SOL */
    actualCost?: number;

    /** Estimated gas cost in SOL */
    estimatedCost?: number;
}
```

## Token Types

### Token

Token definition.

```typescript
interface Token {
    /** Token mint address */
    mint: string;

    /** Token symbol */
    symbol: string;

    /** Token decimals */
    decimals: number;
}
```

## Transaction Types

### Transaction

Solana transaction.

```typescript
interface Transaction {
    /** Transaction signature */
    signature: string;

    /** Transaction status */
    status: "success" | "failed" | "pending";

    /** Error message if failed */
    error?: string;
}
```

## Guard Types

See [Guard Documentation](../GUARD.md) for Guard-specific types.

## DEX Types

See [Flow Documentation](../flow.md) for DEX integration types.

## Complete Type Exports

All types are exported from `@fabrknt/sdk`:

```typescript
import type {
    PatternConfig,
    PatternResult,
    PatternMetrics,
    Token,
    Transaction,
    // ... more types
} from "@fabrknt/sdk";
```

## Resources

-   **TypeScript**: [typescriptlang.org](https://www.typescriptlang.org/)
-   **Documentation**: [Full Documentation](../README.md)
