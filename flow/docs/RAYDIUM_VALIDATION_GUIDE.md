# Raydium CLMM Validation Guide

**Status**: Ready for Testing  
**Date**: January 2025  
**Purpose**: Validate Flow's Raydium CLMM CPI integration with real pools on devnet

---

## Overview

This guide helps you validate the Flow module's Raydium CLMM CPI integration by testing with real Raydium pools on devnet. The validation process will verify:

1. ✅ PDA derivation matches Raydium's implementation
2. ✅ Account structures and ordering are correct
3. ✅ Instruction discriminators work correctly
4. ✅ All 4 CPI calls function properly
5. ✅ Position creation, rebalancing, and fee collection work end-to-end

---

## Prerequisites

### 1. Environment Setup

```bash
# Ensure you're on devnet
solana config set --url devnet

# Check your balance (need SOL for transactions)
solana balance

# If needed, request SOL from faucet
solana airdrop 2
```

### 2. Required Information

To test with a real Raydium pool, you'll need:

-   **Pool State Address**: The Raydium CLMM pool account
-   **Token Mint 0**: First token in the pool
-   **Token Mint 1**: Second token in the pool
-   **Token Vault 0**: Pool's token vault for token 0
-   **Token Vault 1**: Pool's token vault for token 1
-   **Tick Spacing**: Usually 60 for Raydium CLMM pools
-   **Current Tick**: Current price tick of the pool

---

## Finding Raydium CLMM Pools on Devnet

### Option 1: Use Raydium SDK

```typescript
import { Connection } from "@solana/web3.js";
import { Raydium } from "@raydium-io/raydium-sdk";

const connection = new Connection("https://api.devnet.solana.com");
const raydium = new Raydium(connection);

// Fetch CLMM pools
const pools = await raydium.getClmmPools();
console.log("Available CLMM pools:", pools);
```

### Option 2: Query Raydium API

```bash
# Raydium API endpoint (if available on devnet)
curl https://api.raydium.io/v2/clmmPools
```

### Option 3: Use Solana Explorer

1. Go to https://explorer.solana.com/?cluster=devnet
2. Search for Raydium CLMM program: `CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`
3. Find pool accounts created by this program

### Option 4: Use Raydium Pool Keys Script

```bash
# Clone the pool keys fetcher
git clone https://github.com/CoreDevsLtd/getPools_solana_raydium
cd getPools_solana_raydium
npm install

# Run on devnet
RPC_URL=https://api.devnet.solana.com node index.js
```

---

## Validation Steps

### Step 1: Verify PDA Derivation

**Test**: Verify that our PDA derivation matches Raydium's implementation.

**What to Check**:

-   `derive_raydium_position_pda()` produces correct addresses
-   `derive_raydium_tick_array_pda()` produces correct addresses

**How to Verify**:

1. Use Raydium SDK to derive PDAs for a known pool
2. Compare with our derivation functions
3. If they match, ✅ PDA derivation is correct
4. If they don't match, ⚠️ Need to update derivation formulas

**Example Test**:

```typescript
// Using Raydium SDK
import { derivePositionPda, deriveTickArrayPda } from "@raydium-io/raydium-sdk";

const poolState = new PublicKey("..."); // Real pool address
const owner = new PublicKey("..."); // Your wallet
const positionIndex = 0;
const tickLower = -1000;
const tickSpacing = 60;

// Raydium SDK derivation
const raydiumPositionPda = derivePositionPda(poolState, owner, positionIndex);
const raydiumTickArrayPda = deriveTickArrayPda(
    poolState,
    tickLower,
    tickSpacing
);

// Our derivation (from Flow program)
// Compare these values
```

### Step 2: Test Position Creation

**Test**: Create a new concentrated liquidity position on Raydium.

**Required Accounts**:

-   Pool state
-   Personal position PDA (derived)
-   Tick array lower PDA (derived)
-   Tick array upper PDA (derived)
-   Token account 0 (your token account)
-   Token account 1 (your token account)
-   Token vault 0 (from pool)
-   Token vault 1 (from pool)
-   Owner (signer)
-   Token program

**Test Script**:

```typescript
// See validation-test.ts for complete example
const tx = await program.methods
    .createLiquidityPosition(
        positionIndex,
        tokenMint0,
        tokenMint1,
        tickLower,
        tickUpper,
        priceLower,
        priceUpper,
        maxPositionSize,
        maxSingleTrade
    )
    .accounts({
        // ... base accounts
        raydiumProgram: RAYDIUM_CLMM_PROGRAM_ID,
        raydiumPoolState: poolState,
        raydiumPersonalPosition: positionPda,
        raydiumTickArrayLower: tickArrayLowerPda,
        raydiumTickArrayUpper: tickArrayUpperPda,
        raydiumTokenAccount0: tokenAccount0,
        raydiumTokenAccount1: tokenAccount1,
        raydiumTokenVault0: tokenVault0,
        raydiumTokenVault1: tokenVault1,
        tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([owner])
    .rpc();
```

**Expected Results**:

-   ✅ Transaction succeeds
-   ✅ Position account created on Raydium
-   ✅ Tokens transferred to pool
-   ✅ Position visible in Raydium

**If Fails**:

-   Check account ordering
-   Verify PDA derivation
-   Check instruction discriminator
-   Verify token accounts have sufficient balance

### Step 3: Test Increase Liquidity

**Test**: Add more liquidity to an existing position.

**Required Accounts**:

-   Personal position (existing)
-   Pool state
-   Tick arrays (lower and upper)
-   Token accounts (with tokens to add)
-   Token vaults
-   Owner (signer)

**Expected Results**:

-   ✅ Transaction succeeds
-   ✅ Position liquidity increases
-   ✅ Tokens transferred to pool

### Step 4: Test Decrease Liquidity

**Test**: Remove liquidity from a position.

**Required Accounts**:

-   Personal position (existing)
-   Pool state
-   Tick arrays
-   Token accounts (to receive tokens)
-   Token vaults
-   Owner (signer)

**Expected Results**:

-   ✅ Transaction succeeds
-   ✅ Position liquidity decreases
-   ✅ Tokens returned to owner

### Step 5: Test Collect Fees

**Test**: Collect accumulated fees from a position.

**Required Accounts**:

-   Personal position (existing)
-   Pool state
-   Token accounts (to receive fees)
-   Token vaults
-   Owner (signer)

**Expected Results**:

-   ✅ Transaction succeeds
-   ✅ Fees transferred to owner
-   ✅ Position fee amounts updated

---

## Common Issues & Solutions

### Issue 1: PDA Derivation Mismatch

**Symptom**: Transaction fails with "InvalidAccountData" or "AccountNotInitialized"

**Solution**:

1. Compare PDA derivation with Raydium SDK
2. Check seed ordering
3. Verify program ID is correct
4. Update derivation function if needed

### Issue 2: Account Ordering Error

**Symptom**: Transaction fails with "InvalidAccountData" or constraint errors

**Solution**:

1. Verify account order matches Raydium's expectations
2. Check Raydium SDK for reference implementation
3. Ensure all required accounts are included
4. Verify account mutability flags (writable/readonly)

### Issue 3: Instruction Discriminator Error

**Symptom**: Transaction fails immediately or program doesn't recognize instruction

**Solution**:

1. Verify discriminator matches Raydium's implementation
2. Check if using correct 8-byte Anchor format
3. Test with Raydium SDK to get actual discriminator

### Issue 4: Insufficient Funds

**Symptom**: Transaction fails with "InsufficientFunds"

**Solution**:

1. Ensure token accounts have sufficient balance
2. Check SOL balance for transaction fees
3. Verify token accounts are associated token accounts

### Issue 5: Tick Range Invalid

**Symptom**: Transaction fails with tick-related errors

**Solution**:

1. Verify tick_lower < tick_upper
2. Check ticks are within valid range
3. Ensure ticks align with tick spacing
4. Verify current price is within range

---

## Validation Checklist

Use this checklist to track validation progress:

-   [ ] **PDA Derivation**

    -   [ ] Position PDA matches Raydium SDK
    -   [ ] Tick array PDA matches Raydium SDK
    -   [ ] Seeds are in correct order

-   [ ] **Account Structures**

    -   [ ] All required accounts provided
    -   [ ] Account ordering matches Raydium
    -   [ ] Account mutability flags correct

-   [ ] **Instruction Discriminators**

    -   [ ] OpenPosition discriminator correct
    -   [ ] IncreaseLiquidity discriminator correct
    -   [ ] DecreaseLiquidity discriminator correct
    -   [ ] Collect discriminator correct

-   [ ] **CPI Calls**

    -   [ ] OpenPosition works
    -   [ ] IncreaseLiquidity works
    -   [ ] DecreaseLiquidity works
    -   [ ] Collect works

-   [ ] **End-to-End Flow**
    -   [ ] Create position → Rebalance → Collect fees works
    -   [ ] Multiple positions per owner work
    -   [ ] Error handling works correctly

---

## Next Steps After Validation

Once validation is complete:

1. **If All Tests Pass**:

    - ✅ Update KNOWN_LIMITATIONS.md to mark as validated
    - ✅ Document any findings or edge cases
    - ✅ Consider mainnet deployment (after thorough testing)

2. **If Issues Found**:

    - ⚠️ Document specific issues
    - ⚠️ Fix PDA derivation if needed
    - ⚠️ Update account structures if needed
    - ⚠️ Verify instruction discriminators
    - ⚠️ Re-test after fixes

3. **Documentation**:
    - Update RAYDIUM_INTEGRATION_STATUS.md with validation results
    - Add any new findings to this guide
    - Create examples for common use cases

---

## Resources

-   **Raydium Documentation**: https://docs.raydium.io/
-   **Raydium SDK**: https://github.com/raydium-io/raydium-sdk
-   **Raydium CLMM Program**: `CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`
-   **Solana Explorer**: https://explorer.solana.com/?cluster=devnet
-   **Flow Program**: `5FBd3aTWH5b62DgFoAWjnnogzCptKf952ZUvgEnmzsRk` (devnet)

---

## Support

If you encounter issues during validation:

1. Check this guide's "Common Issues & Solutions" section
2. Review Raydium documentation
3. Compare with Raydium SDK examples
4. Check program logs for detailed error messages
5. Open an issue on GitHub with:
    - Error message
    - Transaction signature
    - Pool information
    - Steps to reproduce
