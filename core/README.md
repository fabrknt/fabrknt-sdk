# 🌐 Fabrknt

**Web3 Business Intelligence Platform**

> **⚠️ BETA - DEVNET/TESTNET RECOMMENDED**
> Fabrknt Suite and SDK are actively developed and tested on devnet/testnet. Individual modules have varying maturity levels - see [Module Status](#module-status) below. Use caution on mainnet and review module-specific limitations.

Fabrknt Suite provides Web3 business intelligence tools (PULSE, TRACE, FABRIC) that eliminate information asymmetry by providing verified proof of team vitality, marketing ROI, service activity, and project value—enabling high-trust business transfers and operations.

**Plus:** Open source SDK for developers building crypto financial operations on Solana. See [Developer SDK](#developer-sdk) below.

## Installation

```bash
npm install @fabrknt/sdk
# or
yarn add @fabrknt/sdk
# or
pnpm add @fabrknt/sdk
```

**Note:** For development or contributing, you can also install directly from GitHub.

[Documentation](https://github.com/fabrknt/fabrknt-sdk/tree/main/core) | [Examples](https://github.com/fabrknt/fabrknt-sdk/tree/main/core/examples) | [API Reference](https://github.com/fabrknt/fabrknt-sdk/tree/main/core#api-reference) | [Discord](https://discord.gg/fabrknt)

---

## Why Fabrknt?

Building financial operations on crypto is harder than it should be. Most teams end up:

-   **Reinventing transaction security** → vulnerable to drains, reentrancy, slippage
-   **Building retry logic from scratch** → unreliable execution, lost transactions
-   **Ignoring parallel execution** → high gas costs, slow processing
-   **Skipping accounting integration** → reconciliation nightmares

Fabrknt solves this with **pre-built patterns** you can use in your applications.

---

## What You Get

### 🧱 Core Primitives

**Core components for secure, efficient crypto operations. Each module can be used independently or integrated through the unified SDK:**

-   **Guard** `⚠️ Devnet/Testnet Ready` - Security validation layer with 8 security patterns detecting drains, slippage, malicious calls, and Token-2022 Transfer Hook exploits (P-101 to P-108)
-   **Loom** `⚠️ Devnet/Testnet Ready` - Parallel transaction optimization for maximum throughput, minimum gas
-   **Flow** `❌ In Development` - Multi-DEX liquidity routing with Jupiter V6 integration
-   **Risk** `✅ MVP Ready` - AI-driven risk assessment and compliance checks
-   **Privacy** `❌ Experimental` - ZK Compression for cost-efficient private transactions

See [Module Status](#module-status) for detailed readiness information.

### 📚 Pattern Library

**Pre-built execution patterns for common workflows:**

**Financial Operations**

-   `BatchPayoutPattern` - Secure batch payments with Guard protection
-   `RecurringPaymentPattern` - Scheduled payments with retry logic (subscriptions, payroll)
-   `TokenVestingPattern` - Token vesting with cliff periods and linear unlocks

**DAO Treasury**

-   `TreasuryRebalancing` - Maintain target asset allocations
-   `YieldFarmingPattern` - Optimize yields across protocols

**Trading & DeFi**

-   `GridTradingPattern` - Automated grid trading strategies
-   `DCAStrategy` - Dollar cost averaging automation
-   `ArbitragePattern` - Multi-DEX arbitrage with Jupiter V6
-   `SwapPattern` - Multi-route swap optimization
-   `LiquidityPattern` - Automated liquidity provision

### 🔗 Chain Abstraction

Portable components that work across Solana and EVM chains (Ethereum, Polygon, Arbitrum).

---

## Module Status

Current development status and production readiness for each core module:

| Module      | Devnet      | Testnet     | Mainnet             | Test Coverage         | Status                                | Known Limitations                     |
| ----------- | ----------- | ----------- | ------------------- | --------------------- | ------------------------------------- | ------------------------------------- |
| **Guard**   | ✅ Ready    | ✅ Ready    | ⚠️ Use with Caution | Good (86 tests)       | Comprehensive pattern detection       | Discord webhooks incomplete           |
| **Risk**    | ✅ Ready    | ✅ Ready    | ⚠️ MVP Only         | Good (8 test files)   | Production MVP with fallback          | Switchboard/Pyth oracles TODO         |
| **Loom**    | ✅ Ready    | ✅ Ready    | ⚠️ Partial          | Minimal (1 test file) | Jito bundles work                     | ShredStream gRPC not implemented      |
| **Privacy** | ⚠️ Untested | ⚠️ Untested | ❌ Not Ready        | None (0 tests)        | Light Protocol integrated             | Phase 2 needs validation              |
| **Flow**    | ❌ Blocked  | ❌ Blocked  | ❌ Not Ready        | Minimal (7.5%)        | Research phase                        | Raydium CLMM not integrated (4 TODOs) |

**Legend:**

-   ✅ **Ready**: Tested and functional for this environment
-   ⚠️ **Use with Caution**: Works but has limitations or incomplete features
-   ❌ **Not Ready**: Missing critical functionality or untested

**Recommendations:**

-   **Production Apps**: Use Guard (comprehensive validation) + Risk (MVP) only
-   **Development/Testing**: All modules available on devnet
-   **Experimental Features**: Flow, Privacy require additional development before production use

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on helping improve module maturity.

---

## Quick Start

### 👋 Try the Hello World Example (< 5 minutes)

The fastest way to see Fabrknt in action:

```bash
git clone https://github.com/fabrknt/fabrknt-sdk.git
cd fabrknt-sdk/core
npm install && npm run build
cd examples/hello-world
npm install
npx tsx index.ts
```

This will:

-   ✅ Auto-generate a test wallet
-   ✅ Get devnet SOL automatically
-   ✅ Send your first payment with Guard security
-   ✅ Show the transaction on Solana Explorer

**[→ View Hello World Example](./examples/hello-world)**

---

### Installation

```bash
npm install @fabrknt/sdk
```

**Note:** For development or contributing, you can also install directly from GitHub.

### Code Example: Batch Payments

```typescript
import { BatchPayoutPattern, Guard } from "@fabrknt/sdk";

// Create secure batch payout with Guard protection
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
    enableParallel: true, // Use Loom for gas optimization
    generateReport: true, // Export CSV for accounting
});

// Execute with automatic retries and Guard validation
const result = await payroll.execute();

console.log(`Processed: ${result.transactions.length} payments`);
console.log(`Gas cost: ${result.metrics.actualCost} SOL`);
console.log(`Report:`, result.metadata?.csvReport);
```

### Advanced Example: Trading Bot with Risk Management

```typescript
import { ArbitragePattern, Guard, Pulsar } from "@fabrknt/sdk";

// Create arbitrage pattern with risk assessment
const arbitrage = new ArbitragePattern({
    name: "Multi-DEX Arbitrage",
    pairs: [
        {
            base: { mint: "So11...", symbol: "SOL", decimals: 9 },
            quote: { mint: "EPjF...", symbol: "USDC", decimals: 6 },
        },
    ],
    dexs: [
        { name: "Orca", programId: "whirL...", feeTier: 0.003 },
        { name: "Raydium", programId: "Rayd...", feeTier: 0.0025 },
    ],
    minProfitPercent: 0.5,
    enableRealDEX: true, // Live Jupiter V6 integration
    guard: new Guard({
        mode: "block",
        maxSlippage: 0.02,
        pulsar: {
            enabled: true,
            riskThreshold: 0.7, // Block high-risk transactions
        },
    }),
});

const result = await arbitrage.execute();
console.log(`Profit: $${result.metadata?.totalProfit}`);
```

---

## Architecture

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

**Key Design Principles:**

-   **Composable** - Mix and match primitives for your use case
-   **Comprehensive** - Complete SDK with primitives and patterns
-   **Solana-First** - Optimized for Sealevel's parallel execution
-   **Cross-Chain** - Portable to EVM chains via abstraction layer

---

## Use Cases

### What Developers Are Building

**Crypto Payroll Systems**

```typescript
// Build automated payroll with compliance reporting
BatchPayoutPattern + Guard + accounting export
Example: Monthly USDC salary payments to 50 employees
```

**DAO Treasury Tools**

```typescript
// Build DAO treasury management dashboards
TreasuryRebalancing + Risk + governance integration
Example: Automated rebalancing for $1M+ treasuries
```

**Trading Bots**

```typescript
// Build automated trading strategies
GridTradingPattern + ArbitragePattern + Jupiter V6
Example: Market-making bots, arbitrage scanners
```

**DeFi Protocols**

```typescript
// Build swap aggregators, liquidity managers
SwapPattern + LiquidityPattern + multi-DEX routing
Example: Optimal execution for large swaps
```

**Subscription Platforms**

```typescript
// Build recurring billing systems
RecurringPaymentPattern + Guard + accounting
Example: SaaS billing in stablecoins, membership subscriptions
```

**Token Vesting Systems**

```typescript
// Build token distribution platforms
TokenVestingPattern + Guard + compliance reporting
Example: Team vesting, investor unlocks, advisor compensation
```

---

## Documentation

### Getting Started

-   [Installation Guide](./docs/installation.md) - Setup and installation
-   [Getting Started Guide](./docs/getting-started.md) - Quick start with your first pattern
-   [Core Concepts](./docs/concepts.md) - Understanding Fabrknt architecture

### Patterns

-   [Batch Payout Pattern](./docs/patterns/batch-payout.md) - Secure batch payments
-   [Recurring Payments](./docs/patterns/recurring-payment.md) - Automated recurring billing
-   [Token Vesting](./docs/patterns/token-vesting.md) - Token vesting schedules
-   [Pattern Library](./docs/PATTERNS.md) - Complete pattern documentation

### Primitives

-   [Guard (Security)](./docs/GUARD.md)
-   [Loom (Parallel Execution)](./docs/loom.md)
-   [Flow (DEX Integration)](./docs/flow.md)
-   [Risk (Risk Assessment)](./docs/RISK.md)
-   [Privacy (ZK Compression)](./docs/PRIVACY.md)

### Token Extensions

-   [Token-2022 Transfer Hooks Guide](./docs/token-extensions/) - Complete guide with Fragmetric case study
-   [Security Patterns](./docs/token-extensions/security-patterns.md) - Transfer Hook security reference

### API Reference

-   [API Overview](./docs/api/README.md) - Complete API reference
-   [TypeScript Types](./docs/api/types.md) - Type definitions

### Tutorials

-   [Building a Payroll System](./docs/tutorials/building-a-payroll-system.md) - Step-by-step payroll tutorial
-   [Building a DAO Treasury](./docs/tutorials/building-a-dao-treasury.md) - Treasury management tutorial

---

## Examples

**Getting Started:**

-   **[Hello World](./examples/hello-world)** - Your first payment in 5 minutes (Perfect for beginners!)

**Production Examples:**

-   **[Crypto Payroll](./examples/payroll)** - Batch payment processing with accounting
-   **[DAO Treasury](./examples/dao-treasury)** - Automated rebalancing and reporting
-   **[Grid Trading Bot](./examples/grid-trading)** - Automated market making
-   **[Subscription Billing](./examples/subscriptions)** - Recurring payment system
-   **[DEX Aggregator](./examples/dex-aggregator)** - Multi-route swap optimization

**[→ View All Examples](./examples)**

---

## Roadmap

-   [x] **Phase 1**: SDK Consolidation - Core primitives integrated
-   [x] **Phase 2**: Pattern Library - Trading, treasury, DeFi patterns
-   [x] **Phase 2.5**: Financial Operations - Payroll, subscription patterns
-   [ ] **Phase 3**: Chain Abstraction - Full EVM support
-   [ ] **Phase 4**: Developer Platform - Hosted APIs, monitoring, analytics
-   [ ] **Phase 5**: Enterprise Features - SLA, dedicated support, custom patterns

---

## 🌐 Fabrknt Suite

A unified platform of Web3 business intelligence and operations tools that work together to provide complete visibility into project health, growth, and value:

-   **PULSE** - Operational Verification (Team vitality & contribution scoring) - *Private Repository*
-   **TRACE** - Growth Verification (Marketing attribution & ROI tracking + comprehensive on-chain activity monitoring) - *Private Repository*
-   **FABRIC** - The Exit Layer (M&A terminal for Web3) - *Private Repository*

**Status:** In Development  
**Synergy:** PULSE proves team vitality, TRACE proves marketing ROI and service activity, FABRIC enables high-trust business transfers

The Suite eliminates information asymmetry by providing verified proof of team vitality, marketing ROI, and project value—enabling high-trust business transfers and operations.

---

## 🛠️ Developer SDK

Open source SDK for building crypto financial operations on Solana. **Built by the same team behind Fabrknt Suite.**

Fabrknt SDK is composed of five core modules, each providing specialized functionality. **Each module can be used independently** or integrated through the unified `@fabrknt/sdk` package. Pick what you need:

-   **[flow](https://github.com/fabrknt/fabrknt-sdk/tree/main/flow)** - The Liquidity Backbone
-   **[guard](https://github.com/fabrknt/fabrknt-sdk/tree/main/guard)** - Security & Compliance
-   **[loom](https://github.com/fabrknt/fabrknt-sdk/tree/main/loom)** - Parallel Execution Logic
-   **[risk](https://github.com/fabrknt/fabrknt-sdk/tree/main/risk)** - Risk: RWA Risk Oracle & Integrity Gateway
-   **[privacy](https://github.com/fabrknt/fabrknt-sdk/tree/main/privacy)** - Privacy: Shielded State Middleware & Privacy Layer

**Use independently:** Each module is a standalone package with its own documentation, tests, and implementation.
**Use together:** Integrate all modules through the unified `@fabrknt/sdk` package for a complete solution.

---

## Community & Support

### Open Source

-   **GitHub**: [github.com/fabrknt/fabrknt-sdk](https://github.com/fabrknt/fabrknt-sdk)
-   **Issues**: Report bugs, request features
-   **Discussions**: Ask questions, share ideas

### Resources

-   **Documentation**: Comprehensive guides and API reference
-   **Examples**: Production-ready code samples
-   **Blog**: Technical deep dives and tutorials

### Commercial Support (Coming Soon)

-   **Hosted API**: Managed infrastructure ($99-199/mo)
-   **Priority Support**: Direct access to maintainers ($499/mo)
-   **Enterprise**: SLA, custom integration, dedicated support (Contact)

---

## Contributing

We welcome contributions! Fabrknt is built by developers, for developers.

-   **Code**: Submit PRs for bug fixes, new patterns, documentation
-   **Patterns**: Share your production patterns with the community
-   **Feedback**: Tell us what you're building, what you need

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](./LICENSE)

Built with ❤️ for the Solana developer community

---

## Status

-   **417 Tests Passing** ✅
-   **100% TypeScript** ✅
-   **Beta - Devnet/Testnet Recommended** ⚠️
-   **Open Source** ✅

**Latest Release**: v0.3.0 (Beta)
**Recommended Environment**: Devnet/Testnet
**Module Maturity**: See [Module Status](#module-status) above

---

## Why "Fabrknt"?

In parallel execution, transactions aren't a linear chain—they're a complex fabric. Fabrknt provides the tools to design, optimize, and secure this fabric, ensuring every thread executes with maximum efficiency and zero conflict.

_Weaving reliable financial operations on-chain._
