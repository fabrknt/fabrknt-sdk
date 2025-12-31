# API Reference

Complete API reference for Fabrknt SDK.

## Core Primitives

### Guard

Security validation layer for transaction protection.

-   **[Guard API](./guard.md)** - Security validation API

### Loom

Parallel execution optimization for transaction bundling.

-   **[Loom API](./loom.md)** - Parallel execution API

### Flow

Multi-DEX liquidity routing with Jupiter V6 integration.

-   **[Flow API](./flow.md)** - DEX integration API

### Risk

AI-driven risk assessment and compliance checks.

-   **[Risk API](./risk.md)** - Risk assessment API

### Privacy

ZK Compression for cost-efficient private transactions.

-   **[Privacy API](./privacy.md)** - Privacy layer API

## Pattern Library

### Financial Operations

-   **[BatchPayoutPattern](../patterns/batch-payout.md)** - Secure batch payments
-   **[RecurringPaymentPattern](../patterns/recurring-payment.md)** - Automated recurring payments
-   **[TokenVestingPattern](../patterns/token-vesting.md)** - Token vesting schedules

### Trading & DeFi

-   **[ArbitragePattern](../patterns/arbitrage.md)** - Multi-DEX arbitrage
-   **[SwapPattern](../patterns/swap.md)** - Optimal swap routing
-   **[GridTradingPattern](../patterns/grid-trading.md)** - Grid trading strategies
-   **[DCAStrategy](../patterns/dca.md)** - Dollar cost averaging

### DAO Treasury

-   **[TreasuryRebalancing](../patterns/treasury-rebalancing.md)** - Portfolio rebalancing
-   **[YieldFarmingPattern](../patterns/yield-farming.md)** - Yield optimization

## Base Types

### PatternConfig

Base configuration for all patterns.

```typescript
interface PatternConfig {
    name: string;
    description?: string;
    guard?: Guard;
    dryRun?: boolean;
    maxRetries?: number;
    retryDelay?: number;
}
```

### PatternResult

Result returned from pattern execution.

```typescript
interface PatternResult {
    success: boolean;
    transactions: Transaction[];
    metrics: PatternMetrics;
    metadata?: Record<string, any>;
    error?: string;
}
```

### PatternMetrics

Execution metrics.

```typescript
interface PatternMetrics {
    executionTime: number;
    transactionCount: number;
    retries: number;
    actualCost?: number;
    estimatedCost?: number;
}
```

## Type Definitions

See [TypeScript Types](./types.md) for complete type definitions.

## Examples

-   **[Examples](../../examples/)** - Complete example implementations
-   **[Getting Started](../getting-started.md)** - Quick start guide

## Resources

-   **GitHub**: [github.com/fabrknt/fabrknt](https://github.com/fabrknt/fabrknt)
-   **Documentation**: [Full Documentation](../README.md)
