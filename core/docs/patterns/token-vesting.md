# TokenVestingPattern

Token vesting with cliff periods, linear vesting, and milestone-based unlocks.

## Overview

`TokenVestingPattern` manages token vesting schedules with support for cliff periods, linear vesting, and milestone-based unlocks. Perfect for team token distribution, investor allocations, and advisor compensation.

## Features

-   ✅ **Cliff Periods** - Lock tokens for initial period
-   ✅ **Linear Vesting** - Gradual token release over time
-   ✅ **Milestone Unlocks** - Release tokens based on milestones
-   ✅ **Automatic Calculation** - Calculate vested amounts automatically
-   ✅ **Claim Tracking** - Track claim history and progress

## Quick Start

```typescript
import { TokenVestingPattern, Guard } from "@fabrknt/sdk";

const vesting = new TokenVestingPattern({
    name: "Team Vesting",
    grants: [
        {
            beneficiary: "ABC...xyz",
            amount: 1000000,
            token: "FABRKNT",
            cliffMonths: 3,
            vestingMonths: 12,
            startDate: new Date("2024-01-01"),
        },
    ],
    guard: new Guard({ mode: "block" }),
});

const result = await vesting.execute();
```

## API Reference

See [Token Vesting Example](../../examples/token-vesting/) for complete API reference and examples.

## Related Patterns

-   **[BatchPayoutPattern](./batch-payout.md)** - For initial token airdrops
-   **[RecurringPaymentPattern](./recurring-payment.md)** - For ongoing compensation
