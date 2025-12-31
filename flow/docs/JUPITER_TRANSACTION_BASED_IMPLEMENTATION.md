# Jupiter Transaction-Based Integration - Implementation Complete

**Status**: ✅ Implemented  
**Date**: 2025-01-XX  
**Approach**: Transaction-Based (Recommended for MVP)

## Overview

This document describes the completed implementation of Jupiter swap integration using the **transaction-based approach**. This approach uses Jupiter's Swap API to get pre-built transactions that are executed off-chain, rather than attempting direct CPI calls.

---

## Architecture

### Flow Diagram

```
┌─────────────────┐
│  AI Service     │
│  (Off-Chain)    │
└────────┬────────┘
         │
         │ 1. Get Quote
         ▼
┌─────────────────┐
│ Jupiter Quote   │
│      API        │
└────────┬────────┘
         │
         │ 2. Get Swap Transaction
         ▼
┌─────────────────┐
│ Jupiter Swap    │
│      API        │
└────────┬────────┘
         │
         │ 3. Create Rebalance Decision
         │    (with swap transaction)
         ▼
┌─────────────────┐
│  Smart Contract │
│  (On-Chain)     │
└────────┬────────┘
         │
         │ 4. Execute Swap Transaction
         │    (Off-Chain)
         ▼
┌─────────────────┐
│  Solana Network │
└────────┬────────┘
         │
         │ 5. Execute Rebalance
         │    (with swap signature)
         ▼
┌─────────────────┐
│  Smart Contract │
│  (On-Chain)     │
└─────────────────┘
```

---

## Implementation Details

### 1. Smart Contract Changes

#### RebalanceDecision Account Updates

Added two new fields to store swap transaction data:

```rust
pub struct RebalanceDecision {
    // ... existing fields ...

    // Jupiter Swap Transaction (Transaction-Based Approach)
    /// Base64-encoded swap transaction from Jupiter Swap API
    pub jupiter_swap_transaction: Option<String>,
    /// Expected output amount from Jupiter quote (for validation)
    pub expected_output_amount: Option<u64>,

    // ... rest of fields ...
}
```

#### create_rebalance_decision Instruction

Updated to accept optional swap transaction parameters:

```rust
pub fn create_rebalance_decision(
    // ... existing parameters ...
    jupiter_swap_transaction: Option<String>,
    expected_output_amount: Option<u64>,
) -> Result<()>
```

#### execute_rebalance Instruction

Updated to handle transaction-based swaps:

```rust
pub fn execute_rebalance(
    // ... existing parameters ...
    route_plan: Option<JupiterRoutePlan>, // Legacy CPI parameter
    swap_execution_signature: Option<String>, // New: swap execution signature
) -> Result<()>
```

**Logic**:

-   If `jupiter_swap_transaction` exists → Use transaction-based approach
-   If `swap_execution_signature` provided → Record it for audit
-   Falls back to CPI approach if no transaction stored (legacy support)

---

### 2. TypeScript Helper Functions

Created `src/jupiter-api.ts` with the following functions:

#### `getJupiterQuote()`

Gets a quote from Jupiter Quote API.

```typescript
const quote = await getJupiterQuote(inputMint, outputMint, amount, slippageBps);
```

#### `getJupiterSwapTransaction()`

Gets a swap transaction from Jupiter Swap API.

```typescript
const swapTx = await getJupiterSwapTransaction(quote, userPublicKey, options);
```

#### `getJupiterSwapForRebalance()`

Convenience function that combines quote and swap transaction.

```typescript
const { quote, swapTransaction, expectedOutputAmount } =
    await getJupiterSwapForRebalance(
        inputMint,
        outputMint,
        amount,
        userPublicKey,
        slippageBps
    );
```

#### `executeJupiterSwap()`

Executes a Jupiter swap transaction.

```typescript
const signature = await executeJupiterSwap(
    swapTransaction.swapTransaction, // Base64 string
    connection,
    signers
);
```

---

## Usage Example

### Complete Flow

```typescript
import {
    getJupiterSwapForRebalance,
    executeJupiterSwap,
} from "./src/jupiter-api";

// Step 1: Get swap transaction from Jupiter
const { quote, swapTransaction, expectedOutputAmount } =
    await getJupiterSwapForRebalance(
        inputMint,
        outputMint,
        swapAmount,
        user.publicKey,
        50 // slippageBps
    );

// Step 2: Create rebalance decision with swap transaction
await program.methods
    .createRebalanceDecision(
        positionIndex,
        decisionIndex,
        newTickLower,
        newTickUpper,
        newPriceLower,
        newPriceUpper,
        aiModelVersion,
        aiModelHash,
        predictionConfidence,
        marketSentimentScore,
        volatilityMetric,
        whaleActivityScore,
        decisionReason,
        swapTransaction.swapTransaction, // Base64 encoded transaction
        new BN(expectedOutputAmount) // Expected output
    )
    .accounts({
        /* ... */
    })
    .rpc();

// Step 3: Execute swap transaction off-chain
const swapSignature = await executeJupiterSwap(
    swapTransaction.swapTransaction,
    connection,
    [user]
);

// Step 4: Execute rebalance with swap signature
await program.methods
    .executeRebalance(
        positionIndex,
        decisionIndex,
        slippageBps,
        null, // route_plan (not used for transaction-based)
        swapSignature // swap_execution_signature
    )
    .accounts({
        /* ... */
    })
    .rpc();
```

---

## Advantages

### ✅ Transaction-Based Approach Benefits

1. **Well-Documented**: Uses Jupiter's official API
2. **Optimal Routing**: Jupiter handles all routing logic
3. **No Instruction Format Research**: No need to understand internal formats
4. **Handles Complexity**: Wrapped SOL, compute units, etc. handled automatically
5. **Proven**: Used by many production applications
6. **Maintainable**: Changes to Jupiter's internal format don't affect us

### ⚠️ Trade-offs

1. **Off-Chain Component Required**: Needs AI service or client to call Jupiter API
2. **Two-Step Process**: Quote → Swap → Execute
3. **Separate Transaction**: Swap executes separately from rebalance

---

## Backward Compatibility

The implementation maintains backward compatibility:

-   **CPI Approach**: Still supported via `route_plan` parameter
-   **Optional Parameters**: All new parameters are optional
-   **Existing Tests**: Updated to work with new signatures (using `null` for new params)

---

## Files Modified

### Smart Contract

-   `programs/flow/src/lib.rs`
    -   Added `jupiter_swap_transaction` and `expected_output_amount` to `RebalanceDecision`
    -   Updated `create_rebalance_decision` signature
    -   Updated `execute_rebalance` signature and logic

### TypeScript

-   `src/jupiter-api.ts` (NEW)
    -   Complete Jupiter API integration helpers
-   `examples/jupiter-transaction-based.ts` (NEW)
    -   Usage examples

### Tests

-   `tests/flow.ts`
    -   Updated all calls to include new optional parameters
-   `tests/jupiter-cpi.test.ts`
    -   Updated all calls to include new optional parameters

---

## Testing

### Unit Tests

-   ✅ All existing tests updated and passing
-   ✅ Backward compatibility verified

### Integration Tests

-   ⏳ Need to add tests for transaction-based flow
-   ⏳ Need to test with real Jupiter API (devnet)

### Test Checklist

-   [ ] Test quote API calls
-   [ ] Test swap transaction API calls
-   [ ] Test creating rebalance decision with swap transaction
-   [ ] Test executing swap transaction
-   [ ] Test executing rebalance with swap signature
-   [ ] Test error handling (invalid quotes, failed swaps, etc.)

---

## Next Steps

### Immediate

1. ✅ Implementation complete
2. ⏳ Add integration tests for transaction-based flow
3. ⏳ Test with real Jupiter API on devnet
4. ⏳ Document API usage in main README

### Future Enhancements

1. **CPI Research**: Continue researching direct CPI approach for optimization
2. **Transaction Validation**: Add on-chain validation of swap transactions
3. **Slippage Verification**: Verify actual slippage matches expected
4. **Error Recovery**: Handle failed swap transactions gracefully

---

## References

-   [Jupiter Swap API Docs](https://station.jup.ag/docs/apis/swap-api)
-   [Jupiter Quote API](https://quote-api.jup.ag/v6/quote)
-   [Jupiter Swap API](https://quote-api.jup.ag/v6/swap)
-   [Example Implementation](./examples/jupiter-transaction-based.ts)

---

**Status**: ✅ Implementation Complete  
**Last Updated**: 2025-01-XX
