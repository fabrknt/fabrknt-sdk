# RecurringPaymentPattern

Automated recurring payment processing for subscriptions, payroll, and scheduled payments.

## Overview

`RecurringPaymentPattern` enables automated recurring payments with flexible scheduling (daily, weekly, monthly) and automatic retry logic. Perfect for subscription billing, automated payroll, and scheduled payments.

## Features

-   ✅ **Flexible Scheduling** - Daily, weekly, monthly, or custom intervals
-   ✅ **Automatic Retries** - Retry failed payments with exponential backoff
-   ✅ **Schedule Management** - Track next billing dates automatically
-   ✅ **Guard Security** - Security validation for all payments
-   ✅ **Customer Tracking** - Track payment history per customer

## Quick Start

```typescript
import { RecurringPaymentPattern, Guard } from "@fabrknt/sdk";

const subscriptions = new RecurringPaymentPattern({
    name: "Monthly Subscriptions",
    schedule: {
        interval: "monthly",
        dayOfMonth: 1, // Bill on 1st of each month
    },
    customers: [
        { id: "cust-001", wallet: "ABC...xyz", amount: 99, token: "USDC" },
        { id: "cust-002", wallet: "DEF...xyz", amount: 199, token: "USDC" },
    ],
    guard: new Guard({ mode: "block" }),
});

const result = await subscriptions.execute();
```

## API Reference

### Constructor

```typescript
new RecurringPaymentPattern(config: RecurringPaymentConfig)
```

### Configuration

```typescript
interface RecurringPaymentConfig extends PatternConfig {
    schedule: {
        interval: "daily" | "weekly" | "monthly" | "custom";
        dayOfMonth?: number; // For monthly (1-31)
        dayOfWeek?: number; // For weekly (0-6, Sunday = 0)
        customInterval?: number; // Days for custom interval
    };
    customers: Customer[];
    autoSchedule?: boolean; // Auto-calculate next billing date
}
```

## Examples

See [Subscriptions Example](../../examples/subscriptions/) for complete implementation.

## Related Patterns

-   **[BatchPayoutPattern](./batch-payout.md)** - For one-time batch payments
-   **[TokenVestingPattern](./token-vesting.md)** - For token vesting schedules
