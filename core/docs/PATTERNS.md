# Fabrknt Pattern Library

Pre-built execution patterns for common DeFi and AI agent use cases on Solana.

## Table of Contents

-   [Overview](#overview)
-   [Real DEX Integration](#real-dex-integration)
-   [Getting Started](#getting-started)
-   [Pattern Categories](#pattern-categories)
    -   [Financial Operations](#financial-operations)
    -   [AI Trading Agents](#ai-trading-agents)
    -   [DAO Treasury Management](#dao-treasury-management)
    -   [DeFi Protocols](#defi-protocols)
-   [Base Pattern API](#base-pattern-api)
-   [Pattern Registry](#pattern-registry)
-   [Best Practices](#best-practices)

## Overview

The Fabrknt Pattern Library provides ready-to-use execution templates that combine multiple SDK components (Loom, Guard, FabricCore, Pulsar) to solve common DeFi challenges. Each pattern includes:

-   **Pre-configured security**: Integrated Guard validation
-   **Optimized execution**: Loom-powered transaction routing
-   **Retry logic**: Automatic retry with exponential backoff
-   **Metrics tracking**: Built-in performance monitoring
-   **Dry-run mode**: Test without executing on-chain

## Real DEX Integration

The Pattern Library now supports real-time DEX integration via Jupiter V6 aggregator, enabling production-ready trading with live price feeds and optimal routing.

### Key Features

-   **Jupiter V6 Integration**: Real-time quotes, prices, and routes from Solana's leading DEX aggregator
-   **Price Feed Service**: Multi-source price aggregation with caching and subscriptions
-   **Flexible Architecture**: Swappable DEX adapters (Jupiter, Orca, Raydium, custom)
-   **Backward Compatible**: Opt-in via `enableRealDEX` flag - existing code works unchanged

### Quick Start

```typescript
import {
    ArbitragePattern,
    PriceFeedService,
    COMMON_TOKENS,
    Guard,
} from "@fabrknt/sdk";

// 1. Get real-time prices
const priceFeed = new PriceFeedService();
const solPrice = await priceFeed.getPrice(
    COMMON_TOKENS.SOL,
    COMMON_TOKENS.USDC
);
console.log(`SOL: $${solPrice}`);

// 2. Use real DEX in patterns
const arbitrage = new ArbitragePattern({
    name: "Live Arbitrage",
    pairs: [
        {
            base: { mint: COMMON_TOKENS.SOL, symbol: "SOL", decimals: 9 },
            quote: { mint: COMMON_TOKENS.USDC, symbol: "USDC", decimals: 6 },
        },
    ],
    dexs: [
        { name: "Orca", programId: "whirL...", feeTier: 0.003 },
        { name: "Raydium", programId: "Rayd...", feeTier: 0.0025 },
    ],
    minProfitPercent: 0.5,
    tradeAmount: 1000,
    maxSlippage: 0.01,
    enableRealDEX: true, // ✨ Enable live prices from Jupiter
    guard: new Guard({ mode: "block" }),
});

const result = await arbitrage.execute();
```

### Available Tokens

```typescript
import { COMMON_TOKENS } from "@fabrknt/sdk";

// Common Solana tokens with mint addresses
COMMON_TOKENS.SOL; // Wrapped SOL
COMMON_TOKENS.USDC; // USD Coin
COMMON_TOKENS.USDT; // Tether USD
COMMON_TOKENS.RAY; // Raydium
COMMON_TOKENS.SRM; // Serum
COMMON_TOKENS.MNGO; // Mango
COMMON_TOKENS.ORCA; // Orca
```

### Patterns Supporting Real DEX

-   **ArbitragePattern**: Live multi-DEX price comparison
-   **SwapPattern**: Optimal route fetching and execution

More patterns coming soon!

## Getting Started

> **🚀 New to Fabrknt?** Try our [Hello World Example](../examples/hello-world) first - it runs in < 5 minutes with zero setup!

### Installation

> **✅ Available:** Fabrknt SDK is now available on npm!

```bash
npm install @fabrknt/sdk
# or
yarn add @fabrknt/sdk
```

**For development or contributing:**

```bash
git clone https://github.com/fabrknt/fabrknt.git
cd fabrknt
npm install
```

```typescript
import {
    GridTradingPattern,
    SwapPattern,
    TreasuryRebalancing,
    Guard,
    JupiterAdapter, // ✨ For DEX integration
    PriceFeedService, // ✨ For price feeds
    COMMON_TOKENS, // ✨ For token mints
} from "@fabrknt/sdk";
```

### Basic Usage

All patterns follow the same execution model:

```typescript
// 1. Create pattern with configuration
const pattern = new GridTradingPattern({
    name: "My Trading Strategy",
    // ... pattern-specific config
    guard: new Guard({ mode: "block", maxSlippage: 0.02 }),
    dryRun: false, // Set to true to test without executing
});

// 2. Execute pattern
const result = await pattern.execute();

// 3. Check results
if (result.success) {
    console.log(`Executed ${result.transactions.length} transactions`);
    console.log(`Duration: ${result.metrics.totalDuration}ms`);
} else {
    console.error("Pattern failed:", result.error);
}
```

## Pattern Categories

### Financial Operations

Production-ready patterns for crypto payment systems, treasury operations, and financial workflows.

#### Batch Payout Pattern

Secure batch payment processing for payroll, token distributions, and recurring payments.

**When to use:**

-   Monthly payroll for crypto-native companies
-   Airdrop distributions
-   Bulk payment processing
-   Team compensation

**Example:**

```typescript
import { BatchPayoutPattern, Guard } from "@fabrknt/sdk";

const payroll = new BatchPayoutPattern({
    name: "Monthly Payroll",
    recipients: [
        { wallet: "7xKXtg...", amount: 5000, token: "USDC", id: "emp-001" },
        { wallet: "9zYpKm...", amount: 3000, token: "USDC", id: "emp-002" },
    ],
    guard: new Guard({
        maxSlippage: 0.01,
        mode: "block",
    }),
    enableParallel: true, // Loom optimization
    generateReport: true, // CSV accounting export
});

const result = await payroll.execute();
console.log(`Processed: ${result.transactions.length} payments`);
console.log(`Report:`, result.metadata?.csvReport);
```

**Configuration:**

```typescript
interface BatchPayoutConfig {
    name: string;
    recipients: PayoutRecipient[];
    enableParallel?: boolean; // Use parallel execution (default: true)
    generateReport?: boolean; // Generate CSV report (default: true)
    batchSize?: number; // Batch size for parallel (default: 10)
    senderWallet?: string; // Sender wallet address
    guard?: Guard;
    dryRun?: boolean;
}

interface PayoutRecipient {
    wallet: string;
    amount: number;
    token: string;
    id?: string;
    memo?: string;
}
```

**Features:**

-   Guard security validation to prevent unauthorized drains
-   Loom parallel execution for gas optimization
-   Automatic retry logic for failed transactions
-   CSV accounting reports for reconciliation
-   Idempotent execution (safe to retry)

#### Recurring Payment Pattern

Automated recurring payment processing for subscriptions, salaries, and scheduled transfers.

**When to use:**

-   SaaS subscription billing
-   Regular payroll processing
-   Membership payments
-   Scheduled transfers

**Example:**

```typescript
import { RecurringPaymentPattern, Guard } from "@fabrknt/sdk";

const subscriptions = new RecurringPaymentPattern({
    name: "Monthly Subscriptions",
    payments: [
        {
            id: "sub-001",
            wallet: "ABC...xyz",
            amount: 99,
            token: "USDC",
            schedule: {
                type: "monthly",
                startDate: Date.now(),
                dayOfMonth: 1, // Bill on 1st of each month
            },
            memo: "Pro Plan",
            active: true,
        },
    ],
    guard: new Guard({
        maxSlippage: 0.01,
        mode: "block",
    }),
    autoSchedule: true, // Calculate next billing dates
});

const result = await subscriptions.execute();
```

**Configuration:**

```typescript
interface RecurringPaymentConfig {
    name: string;
    payments: RecurringPayment[];
    maxRetries?: number; // Max retry attempts (default: 3)
    generateReport?: boolean; // Generate execution report
    senderWallet?: string;
    autoSchedule?: boolean; // Calculate next execution times
    guard?: Guard;
    dryRun?: boolean;
}

interface RecurringPayment {
    id: string;
    wallet: string;
    amount: number;
    token: string;
    schedule: PaymentSchedule;
    memo?: string;
    active?: boolean;
}

interface PaymentSchedule {
    type: "daily" | "weekly" | "monthly" | "custom";
    startDate: number;
    endDate?: number;
    dayOfMonth?: number; // For monthly (1-31)
    dayOfWeek?: number; // For weekly (0-6)
    intervalMs?: number; // For custom
}
```

**Features:**

-   Flexible scheduling (daily, weekly, monthly, custom intervals)
-   Automatic retry logic for failed payments
-   Next billing date calculation
-   Execution history and reporting
-   Individual payment enable/disable

#### Token Vesting Pattern

Token distribution with vesting for team members, advisors, and investors.

**When to use:**

-   Team token vesting with cliff periods
-   Investor token unlocks
-   Advisor compensation
-   Community rewards with vesting

**Example:**

```typescript
import { TokenVestingPattern, Guard } from "@fabrknt/sdk";

const vesting = new TokenVestingPattern({
    name: "Team Token Vesting",
    grants: [
        {
            id: "team-001",
            beneficiary: "ABC...xyz",
            totalAmount: 100000,
            token: "PROJECT_TOKEN",
            schedule: {
                type: "linear",
                duration: 365 * 24 * 60 * 60 * 1000, // 1 year
                cliffDuration: 90 * 24 * 60 * 60 * 1000, // 90 days
                startDate: Date.now(),
            },
            memo: "Co-founder",
        },
    ],
    guard: new Guard({
        maxSlippage: 0.01,
        mode: "block",
    }),
    vaultWallet: "vault-address",
    autoClaim: true,
});

const result = await vesting.execute();
console.log(`Processed ${result.metadata?.claims.length} claims`);
```

**Configuration:**

```typescript
interface TokenVestingConfig {
    name: string;
    grants: VestingGrant[];
    vaultWallet?: string; // Vault holding tokens
    autoClaim?: boolean; // Auto-claim on behalf of beneficiaries
    generateReport?: boolean; // Generate vesting report
    guard?: Guard;
    dryRun?: boolean;
}

interface VestingGrant {
    id: string;
    beneficiary: string;
    totalAmount: number;
    token: string;
    schedule: VestingSchedule;
    claimedAmount?: number;
    active?: boolean;
    memo?: string;
}

interface VestingSchedule {
    type: "linear" | "milestone";
    duration: number; // Total vesting duration
    cliffDuration?: number; // Cliff period (no tokens until cliff)
    startDate: number;
    milestones?: {
        // For milestone vesting
        percentage: number;
        date: number;
    }[];
}
```

**Features:**

-   Cliff periods (no tokens until cliff date)
-   Linear vesting over time
-   Milestone-based unlocks
-   Automatic vested amount calculation
-   Claim tracking and history
-   CSV reporting for compliance

---

### AI Trading Agents

Automated trading strategies for AI agents and bots.

#### Grid Trading Pattern

Profit from market volatility by placing buy and sell orders at predefined price levels.

**When to use:**

-   Markets with predictable volatility
-   Range-bound trading
-   Market making strategies

**Example:**

```typescript
import { GridTradingPattern, Guard } from "@fabrknt/sdk";

const pattern = new GridTradingPattern({
    name: "SOL-USDC Grid",
    pair: {
        base: { mint: "So11...", symbol: "SOL", decimals: 9 },
        quote: { mint: "EPjF...", symbol: "USDC", decimals: 6 },
    },
    lowerBound: 90, // Buy below $90
    upperBound: 110, // Sell above $110
    gridLevels: 10, // 10 price levels
    amountPerGrid: 1, // 1 SOL per level
    currentPrice: {
        token: "SOL",
        price: 100,
        quoteCurrency: "USDC",
        timestamp: Date.now(),
    },
    guard: new Guard({ mode: "block", maxSlippage: 0.02 }),
});

const result = await pattern.execute();
```

**Configuration:**

```typescript
interface GridTradingConfig {
    name: string;
    pair: TradingPair;
    lowerBound: number; // Minimum price
    upperBound: number; // Maximum price
    gridLevels: number; // Number of grid levels
    amountPerGrid: number; // Amount per level
    currentPrice: Price; // Current market price
    guard?: Guard; // Security validation
    dryRun?: boolean; // Test mode
}
```

#### Dollar Cost Averaging (DCA)

Reduce volatility impact by purchasing fixed amounts at regular intervals.

**When to use:**

-   Long-term accumulation strategies
-   Automated recurring buys
-   Reducing timing risk

**Example:**

```typescript
import { DCAStrategy, Guard } from "@fabrknt/sdk";

const pattern = new DCAStrategy({
    name: "Weekly SOL Purchase",
    buyToken: { mint: "So11...", symbol: "SOL", decimals: 9 },
    payToken: { mint: "EPjF...", symbol: "USDC", decimals: 6 },
    amountPerInterval: 100, // $100 per purchase
    intervalDuration: 7 * 24 * 60 * 60 * 1000, // Weekly
    totalIntervals: 52, // 1 year
    autoExecute: true, // Run automatically
    currentPrice: {
        token: "SOL",
        price: 100,
        quoteCurrency: "USDC",
        timestamp: Date.now(),
    },
    guard: new Guard({ mode: "block", maxSlippage: 0.03 }),
});

// Start automated execution
await pattern.execute();

// Control execution
pattern.pause(); // Pause strategy
pattern.resume(); // Resume strategy
pattern.stop(); // Stop completely
```

**Configuration:**

```typescript
interface DCAConfig {
    name: string;
    buyToken: Token;
    payToken: Token;
    amountPerInterval: number; // Amount per purchase
    intervalDuration: number; // Time between purchases (ms)
    totalIntervals: number; // Total number of purchases
    autoExecute?: boolean; // Auto-schedule intervals
    currentPrice: Price;
    guard?: Guard;
    dryRun?: boolean;
}
```

#### Arbitrage Pattern

Capture price differences across multiple DEXs with parallel execution. Supports both simulated (testing) and real DEX integration (production) via Jupiter.

**When to use:**

-   Price discrepancies between DEXs
-   High-frequency trading opportunities
-   MEV extraction

**Example (with Real DEX Integration):**

```typescript
import { ArbitragePattern, Guard, COMMON_TOKENS } from "@fabrknt/sdk";

const pattern = new ArbitragePattern({
    name: "Multi-DEX Arbitrage",
    pairs: [
        {
            base: { mint: COMMON_TOKENS.SOL, symbol: "SOL", decimals: 9 },
            quote: { mint: COMMON_TOKENS.USDC, symbol: "USDC", decimals: 6 },
        },
    ],
    dexs: [
        { name: "Orca", programId: "whirL...", feeTier: 0.003 },
        { name: "Raydium", programId: "Rayd...", feeTier: 0.0025 },
    ],
    minProfitPercent: 0.5, // 0.5% minimum profit
    tradeAmount: 1000, // $1k per trade
    maxSlippage: 0.01,
    scanInterval: 5000, // Scan every 5 seconds
    enableRealDEX: true, // ✨ Enable live price feeds from Jupiter
    guard: new Guard({ mode: "block", maxSlippage: 0.01 }),
});

const result = await pattern.execute();
console.log(`Found ${result.metadata.opportunitiesFound} opportunities`);
console.log(`Total profit: $${result.metadata.totalProfit}`);
```

**Example (with Custom DEX Adapter):**

```typescript
import { ArbitragePattern, JupiterAdapter } from "@fabrknt/sdk";

// Use custom adapter configuration
const customAdapter = new JupiterAdapter({
    cacheTTL: 10000, // 10 second cache
    timeout: 5000, // 5 second timeout
});

const pattern = new ArbitragePattern({
    name: "Custom Arbitrage",
    // ... config
    enableRealDEX: true,
    dexAdapter: customAdapter, // ✨ Use custom adapter
});
```

**Configuration:**

```typescript
interface ArbitrageConfig {
    name: string;
    pairs: TradingPair[];
    dexs: DEX[];
    minProfitPercent: number; // Minimum profit threshold
    tradeAmount: number; // Amount to trade per arbitrage
    maxSlippage: number; // Maximum slippage tolerance
    scanInterval?: number; // Scan frequency (ms)
    autoExecute?: boolean; // Execute opportunities automatically
    enableRealDEX?: boolean; // ✨ Enable real DEX integration (default: false)
    dexAdapter?: DEXAdapter; // ✨ Custom DEX adapter (overrides default Jupiter)
    guard?: Guard;
    dryRun?: boolean;
}
```

### DAO Treasury Management

Automated portfolio management for DAO treasuries.

#### Treasury Rebalancing

Maintain target asset allocations automatically by rebalancing when deviations exceed threshold.

**When to use:**

-   Multi-asset treasury management
-   Maintaining risk profiles
-   Automated portfolio rebalancing

**Example:**

```typescript
import { TreasuryRebalancing, Guard } from "@fabrknt/sdk";

const pattern = new TreasuryRebalancing({
    name: "DAO Treasury Rebalance",
    totalValue: 1000000, // $1M treasury
    allocations: [
        {
            token: { mint: "So11...", symbol: "SOL", decimals: 9 },
            targetPercent: 40,
            currentValue: 350000, // Currently at $350k (35%)
        },
        {
            token: { mint: "EPjF...", symbol: "USDC", decimals: 6 },
            targetPercent: 40,
            currentValue: 450000, // Currently at $450k (45%)
        },
        {
            token: { mint: "mSo...", symbol: "mSOL", decimals: 9 },
            targetPercent: 20,
            currentValue: 200000, // Currently at $200k (20%)
        },
    ],
    threshold: 5, // Rebalance if >5% deviation
    maxSlippage: 0.02,
    baseCurrency: { mint: "EPjF...", symbol: "USDC", decimals: 6 },
    guard: new Guard({ mode: "block", maxSlippage: 0.02 }),
});

// Check if rebalancing is needed
if (pattern.needsRebalancing()) {
    const result = await pattern.execute();
    console.log(
        `Executed ${result.metadata.actionsExecuted} rebalancing trades`
    );
}
```

**Configuration:**

```typescript
interface RebalancingConfig {
    name: string;
    totalValue: number; // Total treasury value (USD)
    allocations: AssetAllocation[];
    threshold: number; // Deviation threshold (%)
    minTradeSize?: number; // Minimum trade size (USD)
    maxSlippage: number;
    baseCurrency: Token;
    guard?: Guard;
    dryRun?: boolean;
}

interface AssetAllocation {
    token: Token;
    targetPercent: number; // Target allocation (0-100)
    currentValue: number; // Current value (USD)
}
```

#### Yield Farming Pattern

Optimize yields across multiple protocols with automated allocation strategies.

**When to use:**

-   Maximizing treasury returns
-   Multi-protocol yield optimization
-   Automated yield farming

**Example:**

```typescript
import { YieldFarmingPattern, Guard } from "@fabrknt/sdk";

const pattern = new YieldFarmingPattern({
    name: "Treasury Yield Optimization",
    farmAmount: 500000, // $500k to farm
    farmToken: { mint: "EPjF...", symbol: "USDC", decimals: 6 },
    protocols: [
        {
            name: "Solend",
            programId: "SoLE...",
            apy: 8.5,
            token: { mint: "EPjF...", symbol: "USDC", decimals: 6 },
        },
        {
            name: "Marinade",
            programId: "Mari...",
            apy: 6.8,
            token: { mint: "So11...", symbol: "SOL", decimals: 9 },
        },
        {
            name: "Orca",
            programId: "Orca...",
            apy: 12.3,
            token: { mint: "EPjF...", symbol: "USDC", decimals: 6 },
        },
    ],
    strategy: "diversified", // 'highest-apy' | 'diversified' | 'conservative'
    autoCompound: true,
    compoundFrequency: 7 * 24 * 60 * 60 * 1000, // Weekly
    guard: new Guard({ mode: "block", maxSlippage: 0.01 }),
});

const result = await pattern.execute();
const summary = pattern.getAllocationSummary();
console.log("Allocations:", summary);
```

**Strategies:**

-   **highest-apy**: Allocate 100% to highest yield protocol
-   **diversified**: Split across top 3 protocols (50%, 30%, 20%)
-   **conservative**: Equal weight across all protocols

**Configuration:**

```typescript
interface YieldFarmingConfig {
    name: string;
    farmAmount: number;
    farmToken: Token;
    protocols: YieldProtocol[];
    strategy: "highest-apy" | "diversified" | "conservative";
    autoCompound?: boolean;
    compoundFrequency?: number; // Compound interval (ms)
    guard?: Guard;
    dryRun?: boolean;
}

interface YieldProtocol {
    name: string;
    programId: string;
    apy: number; // Current APY (%)
    token: Token;
    minDeposit?: number;
    maxDeposit?: number;
    lockPeriod?: number; // Lock duration (seconds)
}
```

### DeFi Protocols

Low-level DeFi operations with intelligent optimization.

#### Swap Pattern

Multi-route swap optimization with price impact minimization and intelligent order splitting. Supports real-time route optimization via Jupiter aggregator.

**When to use:**

-   Large swaps that impact price
-   Multi-DEX routing
-   Optimized trade execution

**Example (with Real DEX Integration):**

```typescript
import { SwapPattern, Guard, COMMON_TOKENS } from "@fabrknt/sdk";

const pattern = new SwapPattern({
    name: "Optimized SOL Swap",
    fromToken: { mint: COMMON_TOKENS.SOL, symbol: "SOL", decimals: 9 },
    toToken: { mint: COMMON_TOKENS.USDC, symbol: "USDC", decimals: 6 },
    amount: 100,
    currentPrice: {
        token: "SOL",
        price: 100,
        quoteCurrency: "USDC",
        timestamp: Date.now(),
    },
    maxPriceImpact: 0.5,
    enableSplitOrders: true,
    enableRealDEX: true, // ✨ Fetch optimal routes from Jupiter
    guard: new Guard({ mode: "block", maxSlippage: 0.01 }),
});

const result = await pattern.execute();
const summary = pattern.getSummary();
console.log("Routes used:", summary.routes.length);
console.log("Total price impact:", summary.totalPriceImpact);
console.log("Average price:", summary.averagePrice);
```

**Example (with Manual Routes - Testing Mode):**

```typescript
const pattern = new SwapPattern({
    name: "Manual Route Swap",
    fromToken: { mint: COMMON_TOKENS.SOL, symbol: "SOL", decimals: 9 },
    toToken: { mint: COMMON_TOKENS.USDC, symbol: "USDC", decimals: 6 },
    amount: 100,
    currentPrice: {
        token: "SOL",
        price: 100,
        quoteCurrency: "USDC",
        timestamp: Date.now(),
    },
    routes: [
        // Manual routes for testing
        {
            dex: "Orca",
            programId: "Orca...",
            price: 100.5,
            liquidity: 500000,
            priceImpact: 0.15,
            fee: 0.003,
        },
        {
            dex: "Raydium",
            programId: "Rayd...",
            price: 100.2,
            liquidity: 300000,
            priceImpact: 0.25,
            fee: 0.0025,
        },
    ],
    maxPriceImpact: 0.5,
    enableSplitOrders: true,
    guard: new Guard({ mode: "block", maxSlippage: 0.01 }),
});
```

**Configuration:**

```typescript
interface SwapConfig {
    name: string;
    fromToken: Token;
    toToken: Token;
    amount: number;
    currentPrice: Price;
    routes?: SwapRoute[]; // ✨ Optional if using enableRealDEX
    maxPriceImpact: number; // Max allowed price impact (%)
    enableSplitOrders?: boolean; // Split across routes
    minRouteAllocation?: number; // Min allocation per route (%)
    enableRealDEX?: boolean; // ✨ Enable real DEX integration (default: false)
    dexAdapter?: DEXAdapter; // ✨ Custom DEX adapter (overrides default Jupiter)
    guard?: Guard;
    dryRun?: boolean;
}

interface SwapRoute {
    dex: string;
    programId: string;
    price: number;
    liquidity: number;
    priceImpact: number; // Estimated impact (%)
    fee: number; // Fee percentage
}
```

#### Liquidity Pattern

Automated liquidity provision with position management and impermanent loss monitoring.

**When to use:**

-   Adding/removing liquidity
-   LP position management
-   Impermanent loss tracking

**Example:**

```typescript
import { LiquidityPattern, Guard } from '@fabrknt/sdk';

// Add liquidity
const addPattern = new LiquidityPattern({
  name: 'Add SOL-USDC Liquidity',
  action: 'add',
  pool: {
    name: 'Orca SOL-USDC',
    programId: 'Orca...',
    tokenA: { mint: 'So11...', symbol: 'SOL', decimals: 9 },
    tokenB: { mint: 'EPjF...', symbol: 'USDC', decimals: 6 },
    apy: 12.5,
    feeTier: 0.003,
    totalLiquidity: 5000000,
    priceRatio: 100,
  },
  amountA: 10,    // 10 SOL
  amountB: 1000,  // 1000 USDC
  prices: {
    tokenA: { token: 'SOL', price: 100, quoteCurrency: 'USDC', timestamp: Date.now() },
    tokenB: { token: 'USDC', price: 1, quoteCurrency: 'USD', timestamp: Date.now() },
  },
  monitorImpermanentLoss: true,
  guard: new Guard({ mode: 'block', maxSlippage: 0.01 }),
});

const result = await addPattern.execute();

// Monitor position
const position = addPattern.getPositionSummary();
console.log('Impermanent loss:', position?.impermanentLoss);

// Remove liquidity
const removePattern = new LiquidityPattern({
  name: 'Remove Liquidity',
  action: 'remove',
  pool: /* same pool */,
  removePercentage: 50,  // Remove 50%
  prices: { /* current prices */ },
  guard: new Guard({ mode: 'block', maxSlippage: 0.01 }),
});

await removePattern.execute();
```

**Configuration:**

```typescript
interface LiquidityConfig {
    name: string;
    action: "add" | "remove" | "rebalance";
    pool: LiquidityPool;
    amountA?: number; // For 'add'
    amountB?: number; // For 'add'
    removePercentage?: number; // For 'remove' (0-100)
    prices: {
        tokenA: Price;
        tokenB: Price;
    };
    monitorImpermanentLoss?: boolean;
    rebalanceThreshold?: number; // Auto-rebalance at IL% threshold
    guard?: Guard;
    dryRun?: boolean;
}

interface LiquidityPool {
    name: string;
    programId: string;
    tokenA: Token;
    tokenB: Token;
    apy: number;
    feeTier: number;
    totalLiquidity: number;
    priceRatio: number;
}
```

## Base Pattern API

All patterns extend the `ExecutionPattern` base class:

```typescript
abstract class ExecutionPattern {
    // Execute the pattern
    abstract execute(): Promise<PatternResult>;

    // Validate configuration (override in subclass)
    protected abstract validate(): boolean;

    // Execute with automatic retry on failure
    protected async executeWithRetry<T>(
        fn: () => Promise<T>,
        maxRetries?: number
    ): Promise<T>;
}
```

### Pattern Result

```typescript
interface PatternResult {
    success: boolean;
    transactions: Transaction[];
    metrics: PatternMetrics;
    error?: Error;
    metadata?: Record<string, unknown>;
}

interface PatternMetrics {
    executionTime: number; // Total duration (ms)
    gasUsed?: number; // Total gas consumed
    successRate: number; // Success rate (0-1)
    retryCount: number; // Number of retries
    transactionCount: number; // Total transactions
}
```

## Pattern Registry

Register and retrieve custom patterns:

```typescript
import { PatternRegistry, ExecutionPattern } from "@fabrknt/sdk";

// Register custom pattern
class MyCustomPattern extends ExecutionPattern {
    async execute() {
        // Implementation
    }

    protected validate() {
        // Validation
    }
}

PatternRegistry.register("my-custom-pattern", MyCustomPattern);

// Retrieve pattern
const PatternClass = PatternRegistry.get("my-custom-pattern");
if (PatternClass) {
    const pattern = new PatternClass(config);
    await pattern.execute();
}
```

## Best Practices

### 1. Always Use Guard

```typescript
const guard = new Guard({
    mode: "block",
    maxSlippage: 0.02,
    riskTolerance: "moderate",
});

const pattern = new GridTradingPattern({
    // ... config
    guard, // ✅ Always include Guard
});
```

### 2. Test with Dry Run

```typescript
// Test without executing
const pattern = new SwapPattern({
    // ... config
    dryRun: true, // ✅ Test first
});

const result = await pattern.execute();
if (result.success) {
    // Now run for real
    pattern.config.dryRun = false;
    await pattern.execute();
}
```

### 3. Monitor Metrics

```typescript
const result = await pattern.execute();

console.log("Performance:", {
    duration: result.metrics.executionTime,
    gasUsed: result.metrics.gasUsed,
    successRate: result.metrics.successRate,
    retries: result.metrics.retryCount,
});
```

### 4. Handle Errors

```typescript
const result = await pattern.execute();

if (!result.success) {
    console.error("Pattern failed:", result.error);

    // Analyze failure
    if (result.error?.message.includes("slippage")) {
        // Increase slippage tolerance
    }
}
```

### 5. Use Pattern-Specific Methods

```typescript
// Grid Trading
const gridPattern = new GridTradingPattern(config);
const levels = gridPattern.getGridLevels(); // Get all grid levels

// Treasury Rebalancing
const rebalancePattern = new TreasuryRebalancing(config);
if (rebalancePattern.needsRebalancing()) {
    await rebalancePattern.execute();
}

// Swap
const swapPattern = new SwapPattern(config);
const summary = swapPattern.getSummary(); // Get execution summary
```

### 6. Keep Configurations Immutable

```typescript
// ❌ Don't modify config after creation
pattern.config.amount = 200;

// ✅ Create new pattern instance
const newPattern = new SwapPattern({
    ...config,
    amount: 200,
});
```

### 7. Combine with Privacy

```typescript
import { FabricCore } from "@fabrknt/sdk";

const pattern = new GridTradingPattern(config);
const result = await pattern.execute();

// Add privacy to transactions
for (const tx of result.transactions) {
    const optimized = FabricCore.optimize(tx, {
        enablePrivacy: true,
        privacyProvider: "arbor",
    });
}
```

## Additional Resources

-   [Main README](../README.md)
-   [API Documentation](./API.md)
-   [Examples](../examples/patterns/)
-   [Business Plan](../BUSINESS_PLAN.md)

## Support

For questions or issues:

-   GitHub Issues: [fabrknt/issues](https://github.com/your-org/fabrknt/issues)
-   Documentation: [docs.fabrknt.dev](https://docs.fabrknt.dev)
