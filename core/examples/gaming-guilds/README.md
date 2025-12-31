# Gaming Guilds Example

Complete examples showing how to build gaming guild payment systems using Fabrknt's `BatchPayoutPattern`.

## Overview

Gaming guilds manage NFT assets and distribute earnings to scholars (players) and managers. These examples demonstrate automated payment systems for:

-   **Scholar Payments** - Performance-based payments to players
-   **Revenue Distribution** - Automated distribution across stakeholders

## Features

-   ✅ Performance-based scholar payments
-   ✅ Revenue share calculations
-   ✅ Multi-stakeholder distribution (scholars, managers, treasury)
-   ✅ Guard security validation
-   ✅ Parallel execution for gas optimization
-   ✅ CSV reporting for accounting

## Examples

### 1. Scholar Payments (`scholar-payments.ts`)

Automated weekly payments to scholars based on:

-   Revenue earned
-   Share percentage agreements
-   Performance scores
-   Minimum payout thresholds

**Use Case**: Weekly USDC payments to 5+ scholars across multiple games.

### 2. Revenue Distribution (`revenue-distribution.ts`)

Automated revenue distribution across:

-   Scholars (50% pool)
-   Managers (20% pool)
-   Guild treasury (30% pool)

**Use Case**: Monthly revenue distribution from NFT gaming earnings.

## Quick Start

### Prerequisites

-   Node.js 18+
-   Solana wallet with USDC balance
-   RPC endpoint (devnet or mainnet)

### Installation

```bash
# Install Fabrknt SDK from npm
npm install @fabrknt/sdk

# Install Solana dependencies
npm install @solana/web3.js @solana/spl-token
```

**Note:** For development or contributing, you can also install directly from GitHub.

### Configuration

Create a `.env` file:

```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_PRIVATE_KEY=your-private-key-base58
DRY_RUN=true  # Set to false for real transactions
```

### Run Scholar Payments

```bash
cd examples/gaming-guilds
npx tsx scholar-payments.ts
```

### Run Revenue Distribution

```bash
npx tsx revenue-distribution.ts
```

## Code Example: Scholar Payments

```typescript
import { BatchPayoutPattern, Guard } from "@fabrknt/sdk";

// Calculate payments based on performance
const recipients = scholars.map((scholar) => ({
    id: scholar.scholarId,
    wallet: scholar.wallet,
    amount: calculatePayment(scholar),
    token: "USDC",
    memo: `${scholar.game} - ${scholar.sharePercentage * 100}% share`,
}));

// Create batch payout
const guildPayout = new BatchPayoutPattern({
    name: "Weekly Scholar Payments",
    recipients,
    guard: new Guard({ mode: "block", maxSlippage: 0.01 }),
    enableParallel: true,
    generateReport: true,
});

const result = await guildPayout.execute();
```

## Code Example: Revenue Distribution

```typescript
import { BatchPayoutPattern, Guard } from "@fabrknt/sdk";

// Prepare distribution across stakeholders
const recipients = [
    // Scholars (50% of revenue)
    ...scholars.map((s) => ({
        wallet: s.wallet,
        amount: totalRevenue * 0.5 * s.sharePercentage,
        token: "USDC",
    })),
    // Managers (20% of revenue)
    ...managers.map((m) => ({
        wallet: m.wallet,
        amount: totalRevenue * 0.2 * m.sharePercentage,
        token: "USDC",
    })),
    // Treasury (30% of revenue)
    {
        wallet: treasuryWallet,
        amount: totalRevenue * 0.3,
        token: "USDC",
    },
];

const distribution = new BatchPayoutPattern({
    name: "Monthly Revenue Distribution",
    recipients,
    guard: new Guard({ mode: "block" }),
});

const result = await distribution.execute();
```

## Output

Both examples output:

```
🎮 Starting gaming guild scholar payments...

📊 Payment Summary:
============================================================
scholar-001: 570.00 USDC (Axie Infinity)
scholar-002: 204.00 USDC (Thetan Arena)
...
============================================================
Total: 2340.00 USDC

✅ Scholar payments completed successfully!
Processed: 5 payments
Gas cost: 0.0012 SOL
Execution time: 1234ms

📊 Report saved to scholar-payments-report.csv
```

## Production Considerations

### Security

-   ✅ Store scholar/manager data in secure database
-   ✅ Use environment variables for wallet private keys
-   ✅ Implement multi-sig for large distributions (>$10k)
-   ✅ Enable Guard security validation
-   ✅ Set appropriate slippage limits

### Performance Tracking

-   ✅ Integrate with game APIs for revenue data
-   ✅ Track scholar performance metrics
-   ✅ Calculate performance scores automatically
-   ✅ Store payment history for analytics

### Compliance

-   ✅ Generate CSV reports for accounting
-   ✅ Archive all transaction records
-   ✅ Implement audit trail
-   ✅ Consider tax implications
-   ✅ Comply with local regulations

## Related Patterns

-   **[BatchPayoutPattern](../../docs/patterns/batch-payout.md)** - Full API reference
-   **[Payroll Example](../payroll/)** - Similar structure for employee payroll
-   **[RecurringPaymentPattern](../../docs/patterns/recurring-payment.md)** - For automated recurring payments

## Resources

-   **Documentation**: [Getting Started](../../docs/getting-started.md)
-   **API Reference**: [BatchPayoutPattern](../../docs/patterns/batch-payout.md)
-   **GitHub**: [github.com/fabrknt/fabrknt](https://github.com/fabrknt/fabrknt)
