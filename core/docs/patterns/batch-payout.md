# BatchPayoutPattern

Secure batch payment processing for payroll, token distributions, and bulk payments.

> **🚀 New to Fabrknt?** See BatchPayoutPattern in action with our [Hello World Example](../../examples/hello-world) - runs in < 5 minutes!

## Overview

`BatchPayoutPattern` enables secure batch payments to multiple recipients with Guard security validation and Loom parallel execution optimization. Perfect for payroll, token distributions, and bulk payments.

## Features

-   ✅ **Guard Security** - Validates every transaction to prevent unauthorized drains
-   ✅ **Parallel Execution** - Uses Loom for gas-optimized parallel transaction execution
-   ✅ **Automatic Retries** - Retry logic with exponential backoff for failed transactions
-   ✅ **CSV Reporting** - Generate accounting reports for reconciliation
-   ✅ **Idempotent** - Safe to retry without duplicate payments

## Installation

```bash
npm install @fabrknt/sdk
# or
yarn add @fabrknt/sdk
```

## Quick Start

```typescript
import { BatchPayoutPattern, Guard } from "@fabrknt/sdk";

const payroll = new BatchPayoutPattern({
    name: "Monthly Payroll",
    recipients: [
        { wallet: "ABC...xyz", amount: 5000, token: "USDC", id: "emp-001" },
        { wallet: "DEF...xyz", amount: 3000, token: "USDC", id: "emp-002" },
    ],
    guard: new Guard({
        mode: "block",
        maxSlippage: 0.01,
    }),
    enableParallel: true,
    generateReport: true,
});

const result = await payroll.execute();
```

## API Reference

### Constructor

```typescript
new BatchPayoutPattern(config: BatchPayoutConfig)
```

#### BatchPayoutConfig

```typescript
interface BatchPayoutConfig extends PatternConfig {
    /** List of payment recipients */
    recipients: PayoutRecipient[];

    /** Enable parallel execution via Loom (default: true) */
    enableParallel?: boolean;

    /** Generate accounting report (default: true) */
    generateReport?: boolean;

    /** Maximum batch size for parallel execution (default: 10) */
    batchSize?: number;

    /** Sender wallet address */
    senderWallet?: string;
}
```

#### PayoutRecipient

```typescript
interface PayoutRecipient {
    /** Recipient wallet address */
    wallet: string;

    /** Amount to send */
    amount: number;

    /** Token symbol (e.g., 'USDC', 'SOL') */
    token: string;

    /** Optional recipient identifier for reporting */
    id?: string;

    /** Optional memo/note */
    memo?: string;
}
```

### Methods

#### execute()

Execute the batch payout pattern.

```typescript
execute(): Promise<PatternResult>
```

**Returns**: `PatternResult` with transaction details and metrics.

**Example**:

```typescript
const result = await payroll.execute();

if (result.success) {
    console.log(`Processed ${result.transactions.length} payments`);
    console.log(`Gas cost: ${result.metrics.actualCost} SOL`);

    // Access CSV report
    if (result.metadata?.csvReport) {
        console.log(result.metadata.csvReport);
    }
}
```

## Configuration Examples

### Basic Payroll

```typescript
const payroll = new BatchPayoutPattern({
    name: "Monthly Payroll",
    recipients: employees,
    guard: new Guard({ mode: "block" }),
});
```

### With Parallel Execution

```typescript
const payroll = new BatchPayoutPattern({
    name: "Monthly Payroll",
    recipients: employees,
    guard: new Guard({ mode: "block" }),
    enableParallel: true, // Uses Loom for optimization
    batchSize: 20, // Process 20 payments in parallel
});
```

### With Reporting

```typescript
const payroll = new BatchPayoutPattern({
    name: "Monthly Payroll",
    recipients: employees,
    guard: new Guard({ mode: "block" }),
    generateReport: true, // Generate CSV report
});
```

### Dry Run Mode

```typescript
const payroll = new BatchPayoutPattern({
    name: "Monthly Payroll",
    recipients: employees,
    guard: new Guard({ mode: "block" }),
    dryRun: true, // Test without executing
});
```

## Result Structure

### PatternResult

```typescript
interface PatternResult {
    /** Whether execution was successful */
    success: boolean;

    /** Array of executed transactions */
    transactions: Transaction[];

    /** Execution metrics */
    metrics: PatternMetrics;

    /** Additional metadata */
    metadata?: {
        csvReport?: string;
        failedPayments?: PayoutRecipient[];
        // ... other metadata
    };

    /** Error message if failed */
    error?: string;
}
```

### PatternMetrics

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

## Use Cases

### 1. Monthly Payroll

```typescript
const payroll = new BatchPayoutPattern({
    name: "Monthly Payroll",
    recipients: employees,
    guard: new Guard({ mode: "block", maxSlippage: 0.01 }),
    enableParallel: true,
    generateReport: true,
});
```

### 2. Token Distribution

```typescript
const distribution = new BatchPayoutPattern({
    name: "Token Airdrop",
    recipients: airdropRecipients,
    guard: new Guard({ mode: "block" }),
    enableParallel: true,
});
```

### 3. Refund Processing

```typescript
const refunds = new BatchPayoutPattern({
    name: "Customer Refunds",
    recipients: refundRecipients,
    guard: new Guard({ mode: "block", maxSlippage: 0.005 }),
    generateReport: true,
});
```

## Best Practices

### 1. Always Use Guard

```typescript
// ✅ Good
const payroll = new BatchPayoutPattern({
    guard: new Guard({ mode: "block" }),
    // ...
});

// ❌ Bad - No security validation
const payroll = new BatchPayoutPattern({
    // No Guard!
});
```

### 2. Enable Parallel Execution

```typescript
// ✅ Good - Faster and cheaper
enableParallel: true;

// ❌ Bad - Sequential execution
enableParallel: false;
```

### 3. Generate Reports

```typescript
// ✅ Good - For accounting/compliance
generateReport: true;
```

### 4. Use Dry Run First

```typescript
// ✅ Good - Test before real execution
dryRun: true;

// Then switch to real execution
dryRun: false;
```

### 5. Handle Errors

```typescript
const result = await payroll.execute();

if (!result.success) {
    console.error("Failed:", result.error);
    // Handle error appropriately
}
```

## Security Considerations

### Guard Configuration

Always configure Guard with appropriate settings:

```typescript
const guard = new Guard({
    mode: "block", // Block suspicious transactions
    maxSlippage: 0.01, // Max 1% slippage
    riskTolerance: "low", // Conservative risk tolerance
});
```

### Wallet Security

-   ✅ Use environment variables for private keys
-   ✅ Use multi-sig for large payrolls (>$10k)
-   ✅ Never commit private keys to git
-   ✅ Use test wallets for development

### Transaction Limits

Consider implementing limits:

```typescript
// Example: Limit total payout amount
const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);
if (totalAmount > MAX_PAYROLL_AMOUNT) {
    throw new Error("Payroll amount exceeds limit");
}
```

## Performance

### Parallel Execution

Parallel execution significantly improves performance:

-   **Sequential**: ~1 second per transaction
-   **Parallel (10 batch)**: ~1 second for 10 transactions
-   **Gas savings**: ~30-50% reduction in total gas costs

### Batch Size Optimization

Adjust `batchSize` based on your needs:

```typescript
batchSize: 10; // Small batches (faster confirmation)
batchSize: 50; // Large batches (more efficient)
```

## Troubleshooting

### "Insufficient funds"

**Cause**: Wallet doesn't have enough balance.

**Solution**:

-   Check wallet balance
-   Ensure sufficient SOL for fees
-   Verify token balances (USDC, etc.)

### "Transaction failed"

**Cause**: Individual payment failed.

**Solution**:

-   Check `result.metadata.failedPayments`
-   Review Guard settings
-   Verify recipient addresses
-   Check network conditions

### "Guard blocked transaction"

**Cause**: Guard detected suspicious activity.

**Solution**:

-   Review Guard configuration
-   Check slippage limits
-   Verify transaction amounts
-   Adjust `riskTolerance` if needed

## Related Patterns

-   **[RecurringPaymentPattern](./recurring-payment.md)** - For automated recurring payments
-   **[TokenVestingPattern](./token-vesting.md)** - For token vesting schedules

## Examples

-   **[Payroll Example](../../examples/payroll/)** - Complete payroll implementation
-   **[Getting Started Guide](../getting-started.md)** - Quick start tutorial

## Resources

-   **GitHub**: [github.com/fabrknt/fabrknt](https://github.com/fabrknt/fabrknt)
-   **Discord**: [discord.gg/fabrknt](https://discord.gg/fabrknt)
-   **Documentation**: [Full Documentation](../README.md)
