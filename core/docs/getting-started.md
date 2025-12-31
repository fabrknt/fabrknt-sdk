# Getting Started with Fabrknt

A quick guide to start building crypto financial operations on Solana with Fabrknt.

## 🚀 Fastest Way: Hello World Example

**The quickest way to see Fabrknt in action (< 5 minutes):**

```bash
git clone https://github.com/fabrknt/fabrknt.git
cd fabrknt
npm install && npm run build
cd examples/hello-world
npm install
npx tsx index.ts
```

This example auto-generates a wallet, gets devnet SOL, and sends your first payment with Guard security. **[→ View Hello World Example](../examples/hello-world)**

**Want to build from scratch?** Continue reading below.

---

## Prerequisites

-   Node.js 18+ installed
-   Basic knowledge of TypeScript/JavaScript
-   Solana wallet (for testing)
-   RPC endpoint (use public or get your own from [Helius](https://helius.dev) or [QuickNode](https://quicknode.com))

## Installation

### Step 1: Install Fabrknt SDK

```bash
npm install @fabrknt/sdk
# or
yarn add @fabrknt/sdk
# or
pnpm add @fabrknt/sdk
```

> **✅ Available:** Fabrknt SDK is now available on npm!

### Step 2: Install Solana Dependencies

```bash
npm install @solana/web3.js @solana/spl-token
```

### Step 3: Set Up Environment

Create a `.env` file in the project root:

```bash
# Solana RPC endpoint
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# For devnet testing
# SOLANA_RPC_URL=https://api.devnet.solana.com

# Your wallet (for testing - use a test wallet!)
WALLET_PRIVATE_KEY=your-private-key-base58

# Optional: Enable dry-run mode (no real transactions)
DRY_RUN=true
```

## Your First Pattern: Batch Payments

Let's build a simple batch payment system in 5 minutes.

### 1. Create a New File

Create `my-first-pattern.ts`:

```typescript
import { BatchPayoutPattern, Guard } from "./src/index";
import { Connection, Keypair } from "@solana/web3.js";

// Initialize Solana connection
const connection = new Connection(
    process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com"
);

// Load your wallet (use a test wallet!)
const payer = Keypair.fromSecretKey(
    Buffer.from(process.env.WALLET_PRIVATE_KEY || "", "base58")
);

// Create Guard for security
const guard = new Guard({
    mode: "block", // Block suspicious transactions
    maxSlippage: 0.01, // Max 1% slippage
});

// Create batch payout pattern
const payroll = new BatchPayoutPattern({
    name: "My First Payroll",
    recipients: [
        {
            wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
            amount: 100, // 100 USDC
            token: "USDC",
            id: "emp-001",
        },
        {
            wallet: "9zYpKmGz7XJ8KJ8KJ8KJ8KJ8KJ8KJ8KJ8KJ8KJ8KJ8K",
            amount: 200, // 200 USDC
            token: "USDC",
            id: "emp-002",
        },
    ],
    guard,
    enableParallel: true, // Use Loom for gas optimization
    generateReport: true, // Generate CSV report
    dryRun: process.env.DRY_RUN === "true",
});

// Execute
async function main() {
    console.log("🚀 Starting batch payout...");

    const result = await payroll.execute();

    if (result.success) {
        console.log("✅ Success!");
        console.log(`Processed: ${result.transactions.length} payments`);
        console.log(`Gas cost: ${result.metrics.actualCost} SOL`);

        if (result.metadata?.csvReport) {
            console.log("\n📊 CSV Report:");
            console.log(result.metadata.csvReport);
        }
    } else {
        console.error("❌ Failed:", result.error);
    }
}

main().catch(console.error);
```

### 2. Run It

```bash
# Make sure DRY_RUN=true in .env for first run
npx tsx my-first-pattern.ts
```

### 3. Check Results

-   ✅ See transaction hashes
-   ✅ View CSV report for accounting
-   ✅ Check gas costs

## Next Steps

### Explore Examples

Check out complete examples in the `examples/` directory:

-   **[Payroll](./../examples/payroll)** - Full payroll system
-   **[Subscriptions](./../examples/subscriptions)** - Recurring payments
-   **[DAO Treasury](./../examples/dao-treasury)** - Portfolio rebalancing
-   **[DEX Aggregator](./../examples/dex-aggregator)** - Swap optimization

### Learn Core Concepts

-   **[Core Concepts](./concepts.md)** - Understanding Fabrknt architecture
-   **[Guard Documentation](./GUARD.md)** - Security validation
-   **[Pattern Library](./PATTERNS.md)** - All available patterns

### Build Your Own

1. **Start with a pattern** - Use existing patterns as templates
2. **Add Guard** - Always use Guard for security
3. **Enable parallel execution** - Use Loom for gas optimization
4. **Generate reports** - Export CSV for accounting

## Common Patterns

### Pattern 1: Secure Payments

```typescript
const pattern = new BatchPayoutPattern({
    guard: new Guard({ mode: "block", maxSlippage: 0.01 }),
    // ... config
});
```

### Pattern 2: Trading with DEX Integration

```typescript
const pattern = new ArbitragePattern({
    enableRealDEX: true, // Use Jupiter V6
    guard: new Guard({ mode: "block" }),
    // ... config
});
```

### Pattern 3: Treasury Management

```typescript
const pattern = new TreasuryRebalancing({
    targetAllocations: { SOL: 0.5, USDC: 0.5 },
    guard: new Guard({ mode: "block" }),
    // ... config
});
```

## Troubleshooting

### "Cannot find module"

Make sure you've run `npm install` and are importing from the correct path.

### "Insufficient funds"

Check your wallet balance. For testing, use devnet and get SOL from a faucet.

### "Transaction failed"

-   Check `DRY_RUN` mode first
-   Verify wallet has enough SOL for fees
-   Check Guard settings (slippage limits, etc.)

## Resources

-   **GitHub**: [github.com/fabrknt/fabrknt](https://github.com/fabrknt/fabrknt)
-   **Examples**: [examples/](../examples/)
-   **API Reference**: See individual pattern documentation
-   **Discord**: [discord.gg/fabrknt](https://discord.gg/fabrknt)

## What's Next?

1. ✅ Run your first pattern
2. 📚 Read [Core Concepts](./concepts.md)
3. 🔍 Explore [Examples](../examples/)
4. 🛠️ Build your own application

Happy building! 🚀
