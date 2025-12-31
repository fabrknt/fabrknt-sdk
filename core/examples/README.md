# Fabrknt SDK Examples

Complete, production-ready examples showing how to build crypto financial applications with Fabrknt.

## 🚀 Getting Started

### 👋 [Hello World](./hello-world)

Your first Fabrknt payment in 5 minutes

**Features:** Single SOL payment, auto-setup, Guard security, beginner-friendly

**Use Case:** Learning the basics of Fabrknt SDK

```bash
cd hello-world
npm install
npx tsx index.ts
```

**Perfect for:** First-time users, quick start, understanding core concepts

---

## 📚 Production Examples

### 💰 [Crypto Payroll](./payroll)

Batch salary payments using `BatchPayoutPattern`

**Features:** Batch USDC payments, Guard security, parallel execution, CSV reports

**Use Case:** Monthly payroll for crypto-native companies

```bash
cd payroll
node payroll.ts
```

---

### 💳 [Subscription Billing](./subscriptions)

Automated recurring billing using `RecurringPaymentPattern`

**Features:** Monthly/weekly billing, automatic retries, schedule management, customer tracking

**Use Case:** SaaS platforms billing in stablecoins

```bash
cd subscriptions
node subscriptions.ts
```

---

### 🎁 [Token Vesting](./token-vesting)

Token distribution with vesting using `TokenVestingPattern`

**Features:** Cliff periods, linear vesting, milestone unlocks, claim tracking

**Use Case:** Team tokens, investor allocations, advisor compensation

```bash
cd token-vesting
node vesting.ts
```

---

### ⚖️ [DAO Treasury Rebalancing](./dao-treasury)

Automated portfolio rebalancing using `TreasuryRebalancing`

**Features:** Target allocations, multi-DEX routing, drift detection, automated rebalancing

**Use Case:** DAO treasuries maintaining asset allocations

```bash
cd dao-treasury
node rebalance.ts
```

---

### 🔄 [DEX Aggregator](./dex-aggregator)

Optimal swap routing using `SwapPattern` and Jupiter

**Features:** Multi-DEX quotes, route optimization, price impact minimization

**Use Case:** Swap aggregators, trading interfaces

```bash
cd dex-aggregator
node swap.ts
```

---

### 🪝 [Fragmetric Integration](./fragmetric-integration)

Safe Token-2022 Transfer Hook integration with Guard validation

**Features:** Transfer Hook detection, security validation, fragSOL transfers, batch processing

**Use Case:** Safely interacting with Token-2022 tokens that use Transfer Hooks

```bash
cd fragmetric-integration
npm install
npm start inspect  # Inspect fragSOL Transfer Hook
npm start basic    # Safe fragSOL transfer
npm start batch    # Batch transfers with validation
```

**Highlights:**
- ✅ Real-world Token-2022 Transfer Hook example (Fragmetric's fragSOL)
- ✅ Automatic Guard validation (P-105 to P-108 patterns)
- ✅ Transfer Hook verification and whitelisting
- ✅ Production-ready error handling

---

## 🚀 Quick Start

### Installation

```bash
# Install Fabrknt SDK from npm
npm install @fabrknt/sdk

# Install Solana Web3.js
npm install @solana/web3.js @solana/spl-token

# Or using yarn
yarn add @fabrknt/sdk
yarn add @solana/web3.js @solana/spl-token
```

> **✅ Available:** Fabrknt SDK is now available on npm! For development or contributing, you can also install directly from GitHub.

### Environment Setup

```bash
# Set environment variables
export COMPANY_WALLET="your-wallet-address"
export VAULT_WALLET="your-vault-address"
export DRY_RUN="true"  # Set to false for real transactions
```

### Running Examples

Each example is self-contained with its own README and runnable code:

```bash
# Navigate to example
cd examples/payroll

# Run example
node payroll.ts
```

---

## 📖 Example Structure

Each example includes:

-   **README.md** - Overview, features, use case, production considerations
-   **code.ts** - Complete, runnable implementation
-   **Inline comments** - Detailed explanations

---

## 🏗️ Building Your Own

These examples demonstrate best practices:

1. **Guard Configuration** - Security validation setup
2. **Error Handling** - Retry logic and failure reporting
3. **Reporting** - CSV generation for accounting/compliance
4. **Production Patterns** - Database integration, monitoring, logging

### Common Pattern

```typescript
import { Pattern, Guard } from "@fabrknt/sdk";

// 1. Configure Guard for security
const guard = new Guard({
    mode: "block",
    maxSlippage: 0.01,
    riskTolerance: "low",
});

// 2. Create pattern with your config
const pattern = new Pattern({
    name: "My Pattern",
    guard,
    // ... pattern-specific config
    dryRun: process.env.DRY_RUN === "true",
});

// 3. Execute and handle results
const result = await pattern.execute();

if (result.success) {
    console.log("Success!", result.metadata);
} else {
    console.error("Failed:", result.error);
}
```

---

## 🛠️ Production Deployment

### Security Checklist

-   [ ] Store sensitive data (wallet keys) in environment variables or secret manager
-   [ ] Use multi-sig wallets for high-value operations
-   [ ] Enable Guard security validation
-   [ ] Set appropriate slippage limits
-   [ ] Implement rate limiting

### Infrastructure

-   [ ] Set up monitoring and alerting (Datadog, Sentry)
-   [ ] Archive CSV reports for compliance
-   [ ] Implement retry logic with exponential backoff
-   [ ] Add logging for all transactions
-   [ ] Set up database for state management

### Testing

-   [ ] Test with `dryRun: true` first
-   [ ] Test on devnet before mainnet
-   [ ] Verify CSV reports are correct
-   [ ] Test failure scenarios
-   [ ] Load test for high volume

---

## 📚 Related Documentation

-   [Core Concepts](../docs/concepts.md)
-   [Guard Documentation](../docs/GUARD.md)
-   [Pattern Library](../docs/patterns/)
-   [API Reference](../docs/api/)

---

## 💬 Community

-   **GitHub**: [github.com/fabrknt/fabrknt](https://github.com/fabrknt/fabrknt)
-   **Issues**: Report bugs or request features
-   **Discussions**: Ask questions, share your builds

---

## 📄 License

These examples are MIT licensed. Feel free to use them as templates for your own applications.
