# Core Concepts

Understanding how Fabrknt works and how to use it effectively.

## Architecture Overview

Fabrknt uses a layered architecture optimized for Solana's parallel execution:

```
Your Application
       ↓
┌──────────────────────────────────┐
│   Pattern Library                │  ← Pre-built workflows
│   (BatchPayout, Treasury, etc)   │
├──────────────────────────────────┤
│   Core Primitives                │
│   (Guard, Loom, Flow, Risk)      │  ← Composable components
├──────────────────────────────────┤
│   Chain Abstraction Layer        │  ← Solana + EVM support
└──────────────────────────────────┘
       ↓
   Blockchain
```

## Key Design Principles

### 1. Composable

Mix and match primitives for your use case:

```typescript
// Use Guard alone for security
const guard = new Guard({ mode: "block" });

// Combine Guard + Loom for optimized execution
const pattern = new BatchPayoutPattern({
    guard,
    enableParallel: true, // Uses Loom
});

// Add Risk assessment
const pattern = new ArbitragePattern({
    guard,
    enableRealDEX: true, // Uses Flow
    riskAssessment: true, // Uses Risk
});
```

### 2. Solana-First

Optimized for Solana's parallel execution model:

-   **Sealevel optimization** - Transactions execute in parallel
-   **Account-based model** - Efficient state management
-   **Low fees** - Optimized transaction bundling

### 3. Security by Default

Security is built-in, not bolted-on:

-   **Guard** - Validates every transaction
-   **Slippage protection** - Prevents excessive losses
-   **Drain prevention** - Blocks malicious calls
-   **Risk assessment** - AI-driven risk scoring

### 4. Production-Ready

Every pattern includes:

-   **Retry logic** - Automatic retries with exponential backoff
-   **Error handling** - Comprehensive error reporting
-   **Metrics** - Performance tracking
-   **Reporting** - CSV exports for accounting

## Core Components

### Guard - Security Layer

**Purpose**: Prevent unauthorized operations and protect against common attacks.

**Key Features**:

-   Transaction validation
-   Slippage limits
-   Drain detection
-   Risk scoring

**Usage**:

```typescript
const guard = new Guard({
    mode: "block", // or "warn"
    maxSlippage: 0.01, // 1% max slippage
    riskTolerance: "low",
});
```

**When to use**: Always. Every pattern should use Guard.

### Loom - Parallel Execution

**Purpose**: Optimize transaction execution for maximum throughput and minimum gas.

**Key Features**:

-   Transaction bundling
-   Dependency analysis
-   Parallel execution
-   Gas optimization

**Usage**:

```typescript
const pattern = new BatchPayoutPattern({
    enableParallel: true, // Automatically uses Loom
    // ... config
});
```

**When to use**: When executing multiple transactions (batch payments, swaps, etc.).

### Flow - DEX Integration

**Purpose**: Multi-DEX liquidity routing with Jupiter V6 integration.

**Key Features**:

-   Real-time price feeds
-   Optimal route finding
-   Multi-DEX aggregation
-   Price impact minimization

**Usage**:

```typescript
const pattern = new ArbitragePattern({
    enableRealDEX: true, // Uses Jupiter V6
    // ... config
});
```

**When to use**: For trading, swaps, arbitrage, or any DEX operations.

### Risk - Risk Assessment

**Purpose**: AI-driven risk assessment for transactions and assets.

**Key Features**:

-   Risk scoring
-   Compliance checks
-   Asset integrity validation
-   RWA verification

**Usage**:

```typescript
const guard = new Guard({
    pulsar: {
        enabled: true,
        riskThreshold: 0.7, // Block high-risk transactions
    },
});
```

**When to use**: For high-value operations or compliance requirements.

### Privacy - ZK Compression

**Purpose**: Cost-efficient private transactions using ZK Compression.

**Key Features**:

-   Private transfers
-   Reduced costs
-   State compression
-   Privacy-preserving

**Usage**:

```typescript
import { PrivateAirdrop } from "@fabrknt/privacy";

const airdrop = new PrivateAirdrop({
    // ... config
});
```

**When to use**: For private airdrops or privacy-sensitive operations.

## Pattern Library

### What is a Pattern?

A pattern is a pre-built workflow that combines multiple primitives to solve a specific problem.

**Example**: `BatchPayoutPattern` combines:

-   Guard (security)
-   Loom (parallel execution)
-   Reporting (CSV generation)

### Pattern Categories

#### Financial Operations

-   `BatchPayoutPattern` - Secure batch payments
-   `RecurringPaymentPattern` - Scheduled payments
-   `TokenVestingPattern` - Token distribution

#### Trading & DeFi

-   `ArbitragePattern` - Multi-DEX arbitrage
-   `SwapPattern` - Optimal swap routing
-   `GridTradingPattern` - Grid trading strategies
-   `DCAStrategy` - Dollar cost averaging

#### DAO Treasury

-   `TreasuryRebalancing` - Portfolio rebalancing
-   `YieldFarmingPattern` - Yield optimization

### Using Patterns

```typescript
// 1. Import pattern
import { BatchPayoutPattern } from "@fabrknt/sdk";

// 2. Configure
const pattern = new BatchPayoutPattern({
    name: "My Pattern",
    recipients: [...],
    guard: new Guard({ ... }),
    // ... pattern-specific config
});

// 3. Execute
const result = await pattern.execute();

// 4. Handle results
if (result.success) {
    // Success!
} else {
    // Handle error
}
```

## Execution Flow

### 1. Pattern Creation

```typescript
const pattern = new Pattern({
    // Configuration
});
```

### 2. Validation

Guard validates the configuration:

-   Security checks
-   Slippage limits
-   Risk assessment

### 3. Execution Planning

Loom optimizes execution:

-   Transaction bundling
-   Dependency analysis
-   Parallel execution plan

### 4. Execution

Pattern executes transactions:

-   Parallel execution (if enabled)
-   Retry logic for failures
-   Progress tracking

### 5. Reporting

Results are compiled:

-   Transaction hashes
-   Metrics (gas, time, success rate)
-   CSV reports (if enabled)

## Best Practices

### 1. Always Use Guard

```typescript
// ✅ Good
const pattern = new Pattern({
    guard: new Guard({ mode: "block" }),
});

// ❌ Bad
const pattern = new Pattern({
    // No Guard - vulnerable!
});
```

### 2. Enable Parallel Execution

```typescript
// ✅ Good - for batch operations
const pattern = new BatchPayoutPattern({
    enableParallel: true,
});

// ❌ Bad - sequential execution
const pattern = new BatchPayoutPattern({
    enableParallel: false, // Slower, more expensive
});
```

### 3. Use Dry-Run Mode

```typescript
// ✅ Good - test first
const pattern = new Pattern({
    dryRun: true, // Test without executing
});

// Then switch to real execution
const pattern = new Pattern({
    dryRun: false, // Real execution
});
```

### 4. Generate Reports

```typescript
// ✅ Good - for accounting/compliance
const pattern = new Pattern({
    generateReport: true, // CSV export
});
```

### 5. Handle Errors

```typescript
// ✅ Good
const result = await pattern.execute();
if (!result.success) {
    console.error("Failed:", result.error);
    // Handle error appropriately
}
```

## Common Patterns

### Pattern: Secure Batch Payments

```typescript
const payroll = new BatchPayoutPattern({
    guard: new Guard({ mode: "block", maxSlippage: 0.01 }),
    enableParallel: true,
    generateReport: true,
});
```

### Pattern: Trading with Risk Management

```typescript
const trading = new ArbitragePattern({
    enableRealDEX: true,
    guard: new Guard({
        mode: "block",
        pulsar: { enabled: true, riskThreshold: 0.7 },
    }),
});
```

### Pattern: Treasury Management

```typescript
const treasury = new TreasuryRebalancing({
    targetAllocations: { SOL: 0.5, USDC: 0.5 },
    guard: new Guard({ mode: "block" }),
    enableRealDEX: true,
});
```

## Next Steps

1. ✅ Understand core concepts
2. 📚 Read [Pattern Documentation](./PATTERNS.md)
3. 🔍 Explore [Examples](../examples/)
4. 🛠️ Build your own application

## Resources

-   **[Getting Started](./getting-started.md)** - Quick start guide
-   **[Pattern Library](./PATTERNS.md)** - All available patterns
-   **[Guard Documentation](./GUARD.md)** - Security details
-   **[Examples](../examples/)** - Complete examples
