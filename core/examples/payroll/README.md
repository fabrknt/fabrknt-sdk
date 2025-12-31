# Crypto Payroll Example

Complete example showing how to build a crypto payroll system using Fabrknt's `BatchPayoutPattern`.

## Features

-   ✅ Batch USDC salary payments to multiple employees
-   ✅ Guard security validation to prevent unauthorized drains
-   ✅ Parallel execution for gas optimization
-   ✅ CSV accounting reports for reconciliation
-   ✅ Automatic retry logic for failed transactions
-   ✅ Employee ID tracking

## Use Case

Monthly payroll for a crypto-native company paying 10 employees in USDC on Solana.

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

### Configuration

Create a `.env` file:

```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_PRIVATE_KEY=your-private-key-base58
DRY_RUN=true  # Set to false for real transactions
```

### Run the Example

```bash
cd examples/payroll
npx tsx payroll.ts
```

## Code Example

```typescript
import { BatchPayoutPattern, Guard } from "@fabrknt/sdk";
import type { PayoutRecipient } from "@fabrknt/sdk";

// Employee payroll data
const employees: PayoutRecipient[] = [
    {
        id: "emp-001",
        wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        amount: 5000,
        token: "USDC",
        memo: "Engineering - Senior Developer",
    },
    // ... more employees
];

// Create Guard for security
const guard = new Guard({
    mode: "block",
    maxSlippage: 0.01, // Max 1% slippage
});

// Create batch payout pattern
const payroll = new BatchPayoutPattern({
    name: "Monthly Payroll",
    recipients: employees,
    guard,
    enableParallel: true, // Use Loom for gas optimization
    generateReport: true, // Generate CSV report
    dryRun: process.env.DRY_RUN === "true",
});

// Execute
const result = await payroll.execute();

if (result.success) {
    console.log(`✅ Processed ${result.transactions.length} payments`);
    console.log(`Gas cost: ${result.metrics.actualCost} SOL`);

    // CSV report available in result.metadata.csvReport
} else {
    console.error("❌ Failed:", result.error);
}
```

## Output

The example outputs:

```
🚀 Starting batch payout...
✅ Processed 10 payments
Gas cost: 0.0025 SOL
📊 CSV Report:
txHash,recipient,recipientId,amount,token,status,timestamp
abc123...,7xKXtg...,emp-001,5000,USDC,success,1234567890
...
```

## Code Overview

This example demonstrates:

1. **Employee Data Management** - Load employee wallet addresses and salaries
2. **Guard Configuration** - Security settings to prevent malicious transactions
3. **Batch Processing** - Execute multiple payments in parallel using Loom
4. **Report Generation** - Export CSV for accounting/compliance
5. **Error Handling** - Retry logic and failure reporting

## Key Concepts

### Guard Security

Guard validates every transaction to prevent:

-   Unauthorized drains
-   Excessive slippage
-   Malicious calls

```typescript
const guard = new Guard({
    mode: "block", // Block suspicious transactions
    maxSlippage: 0.01, // Max 1% slippage
});
```

### Parallel Execution

Loom optimizes transaction execution:

-   Bundles transactions for parallel execution
-   Reduces gas costs
-   Speeds up processing

```typescript
enableParallel: true; // Automatically uses Loom
```

### CSV Reporting

Generate accounting reports:

```typescript
generateReport: true; // Creates CSV in result.metadata.csvReport
```

## Troubleshooting

### "Insufficient funds"

**Problem**: Wallet doesn't have enough USDC or SOL for fees.

**Solution**:

-   Check wallet balance: `solana balance YOUR_ADDRESS`
-   For devnet, get USDC from a faucet
-   Ensure you have SOL for transaction fees (~0.0001 SOL per transaction)

### "Transaction failed"

**Problem**: Some payments failed.

**Solution**:

-   Check `result.transactions` for failed transactions
-   Review `result.error` for details
-   Failed transactions are automatically retried (up to 3 times)
-   Check Guard settings (slippage limits, etc.)

### "RPC endpoint error"

**Problem**: Cannot connect to Solana RPC.

**Solution**:

-   Verify `SOLANA_RPC_URL` in `.env`
-   Use devnet for testing: `https://api.devnet.solana.com`
-   For production, use a dedicated RPC provider (Helius, QuickNode)

### "Dry run mode"

**Problem**: Transactions not executing.

**Solution**:

-   Check `DRY_RUN` in `.env`
-   Set `DRY_RUN=false` for real transactions
-   Or set `dryRun: false` in pattern config

## Production Considerations

### Security

-   ✅ Store employee data in secure database (Postgres, MongoDB)
-   ✅ Use environment variables for wallet private keys
-   ✅ Implement multi-sig for large payrolls (>$10k)
-   ✅ Enable Guard security validation
-   ✅ Set appropriate slippage limits

### Infrastructure

-   ✅ Set up monitoring and alerting (Datadog, Sentry)
-   ✅ Archive CSV reports for compliance
-   ✅ Implement retry logic with exponential backoff
-   ✅ Add logging for all transactions
-   ✅ Set up database for state management

### Compliance

-   ✅ Generate CSV reports for accounting
-   ✅ Archive all transaction records
-   ✅ Implement audit trail
-   ✅ Consider tax implications
-   ✅ Comply with local regulations

### Optimization

-   ✅ Use parallel execution (Loom) for gas optimization
-   ✅ Batch payments to reduce transaction count
-   ✅ Consider gas price optimization for timing
-   ✅ Monitor and optimize batch sizes

## Related Patterns

-   **[RecurringPaymentPattern](../subscriptions/)** - For automated monthly payroll
-   **[TokenVestingPattern](../token-vesting/)** - For employee equity/token compensation
-   **[BatchPayoutPattern Documentation](../../docs/patterns/batch-payout.md)** - Full API reference

## Next Steps

1. ✅ Run this example
2. 📚 Read [BatchPayoutPattern Documentation](../../docs/patterns/batch-payout.md)
3. 🔍 Explore [Other Examples](../README.md)
4. 🛠️ Build your own payroll system

## Resources

-   **Documentation**: [Getting Started](../../docs/getting-started.md)
-   **API Reference**: [BatchPayoutPattern](../../docs/patterns/batch-payout.md)
-   **GitHub**: [github.com/fabrknt/fabrknt](https://github.com/fabrknt/fabrknt)
-   **Discord**: [discord.gg/fabrknt](https://discord.gg/fabrknt)
