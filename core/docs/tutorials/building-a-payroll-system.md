# Tutorial: Building a Crypto Payroll System

Step-by-step guide to building a production-ready crypto payroll system using Fabrknt.

## Overview

In this tutorial, you'll build a complete crypto payroll system that:

-   Processes monthly salary payments in USDC
-   Validates transactions with Guard
-   Optimizes gas costs with parallel execution
-   Generates accounting reports
-   Handles errors and retries

## Prerequisites

-   Node.js 18+
-   Basic TypeScript knowledge
-   Solana wallet with USDC balance (for testing)
-   RPC endpoint

## Step 1: Setup

### Install Dependencies

```bash
git clone https://github.com/fabrknt/fabrknt.git
cd fabrknt
npm install
npm install @solana/web3.js @solana/spl-token
```

### Configure Environment

Create `.env`:

```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
WALLET_PRIVATE_KEY=your-private-key-base58
DRY_RUN=true
```

## Step 2: Create Employee Data Structure

Create `employees.ts`:

```typescript
import type { PayoutRecipient } from "@fabrknt/sdk";

export const employees: PayoutRecipient[] = [
    {
        id: "emp-001",
        wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        amount: 5000,
        token: "USDC",
        memo: "Engineering - Senior Developer",
    },
    {
        id: "emp-002",
        wallet: "9zYpKmPRJYCbZqvZXgUjA3YzFwCJcPqTvJdKxLkWmNbP",
        amount: 4500,
        token: "USDC",
        memo: "Engineering - Developer",
    },
    // Add more employees...
];
```

## Step 3: Configure Guard

Create `payroll.ts`:

```typescript
import { BatchPayoutPattern, Guard } from "@fabrknt/sdk";
import { employees } from "./employees";

// Configure Guard for security
const guard = new Guard({
    mode: "block", // Block suspicious transactions
    maxSlippage: 0.01, // Max 1% slippage
    riskTolerance: "low", // Conservative approach
});
```

## Step 4: Create Payroll Pattern

```typescript
// Create batch payout pattern
const payroll = new BatchPayoutPattern({
    name: "Monthly Payroll",
    recipients: employees,
    guard,
    enableParallel: true, // Use Loom for optimization
    generateReport: true, // Generate CSV report
    batchSize: 10, // Process 10 payments in parallel
    dryRun: process.env.DRY_RUN === "true",
});
```

## Step 5: Execute Payroll

```typescript
async function runPayroll() {
    console.log("🚀 Starting monthly payroll...");
    console.log(`Processing ${employees.length} employees`);

    const result = await payroll.execute();

    if (result.success) {
        console.log("✅ Payroll completed successfully!");
        console.log(`Processed: ${result.transactions.length} payments`);
        console.log(`Gas cost: ${result.metrics.actualCost} SOL`);
        console.log(`Execution time: ${result.metrics.executionTime}ms`);

        // Save CSV report
        if (result.metadata?.csvReport) {
            const fs = require("fs");
            fs.writeFileSync("payroll-report.csv", result.metadata.csvReport);
            console.log("📊 Report saved to payroll-report.csv");
        }
    } else {
        console.error("❌ Payroll failed:", result.error);

        // Handle failed payments
        if (result.metadata?.failedPayments) {
            console.log("Failed payments:", result.metadata.failedPayments);
        }
    }
}

runPayroll().catch(console.error);
```

## Step 6: Add Error Handling

```typescript
async function runPayroll() {
    try {
        const result = await payroll.execute();

        if (!result.success) {
            // Log error
            console.error("Payroll failed:", result.error);

            // Notify administrators
            await notifyAdmins(result.error);

            // Retry failed payments
            if (result.metadata?.failedPayments) {
                await retryFailedPayments(result.metadata.failedPayments);
            }

            return;
        }

        // Success handling
        await savePayrollRecord(result);
        await notifyEmployees(result);
    } catch (error) {
        console.error("Unexpected error:", error);
        await notifyAdmins(error);
    }
}
```

## Step 7: Add Database Integration

```typescript
import { db } from "./database";

async function savePayrollRecord(result: PatternResult) {
    await db.payrolls.create({
        date: new Date(),
        employeeCount: result.transactions.length,
        totalAmount: calculateTotal(result),
        gasCost: result.metrics.actualCost,
        status: "completed",
        reportUrl: await uploadReport(result.metadata.csvReport),
    });
}
```

## Step 8: Add Monitoring

```typescript
import { monitor } from "./monitoring";

async function runPayroll() {
    const startTime = Date.now();

    try {
        const result = await payroll.execute();

        // Track metrics
        monitor.track("payroll.execution_time", Date.now() - startTime);
        monitor.track("payroll.success_rate", result.success ? 1 : 0);
        monitor.track("payroll.gas_cost", result.metrics.actualCost);
    } catch (error) {
        monitor.track("payroll.errors", 1);
        monitor.alert("Payroll execution failed", error);
    }
}
```

## Step 9: Production Checklist

-   [ ] Use environment variables for sensitive data
-   [ ] Implement multi-sig for large payrolls
-   [ ] Set up monitoring and alerting
-   [ ] Archive CSV reports for compliance
-   [ ] Add database for state management
-   [ ] Implement retry logic for failed payments
-   [ ] Add logging for all transactions
-   [ ] Test on devnet before mainnet
-   [ ] Set up backup wallet for emergencies

## Next Steps

1. ✅ Complete this tutorial
2. 📚 Read [BatchPayoutPattern Documentation](../patterns/batch-payout.md)
3. 🔍 Explore [Payroll Example](../../examples/payroll/)
4. 🛠️ Build your own features

## Resources

-   **Documentation**: [Full Documentation](../README.md)
-   **Examples**: [Examples](../../examples/)
-   **GitHub**: [github.com/fabrknt/fabrknt](https://github.com/fabrknt/fabrknt)
