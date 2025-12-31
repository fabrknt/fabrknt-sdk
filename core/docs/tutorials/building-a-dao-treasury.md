# Tutorial: Building a DAO Treasury Management System

Step-by-step guide to building an automated DAO treasury rebalancing system.

## Overview

Build a system that automatically maintains target asset allocations for a DAO treasury using Fabrknt's `TreasuryRebalancing` pattern.

## Prerequisites

-   Node.js 18+
-   DAO treasury wallet
-   RPC endpoint

## Step 1: Define Target Allocations

```typescript
const targetAllocations = {
    SOL: 0.4, // 40% SOL
    USDC: 0.4, // 40% USDC
    BTC: 0.2, // 20% BTC
};
```

## Step 2: Create Rebalancing Pattern

```typescript
import { TreasuryRebalancing, Guard } from "@fabrknt/sdk";

const treasury = new TreasuryRebalancing({
    name: "DAO Treasury Rebalancing",
    targetAllocations,
    treasuryWallet: "YOUR_TREASURY_WALLET",
    guard: new Guard({ mode: "block" }),
    enableRealDEX: true, // Use Jupiter V6
    rebalanceThreshold: 0.05, // Rebalance if >5% drift
});
```

## Step 3: Execute Rebalancing

```typescript
const result = await treasury.execute();

if (result.success) {
    console.log("✅ Treasury rebalanced");
    console.log(`Executed ${result.transactions.length} swaps`);
}
```

## Complete Example

See [DAO Treasury Example](../../examples/dao-treasury/) for full implementation.

## Next Steps

-   Read [TreasuryRebalancing Documentation](../patterns/treasury-rebalancing.md)
-   Explore [DAO Treasury Example](../../examples/dao-treasury/)
