# Raydium CLMM Instruction Format Research

**Status**: In Progress  
**Date**: 2025-01-XX  
**Priority**: High - Required for LP position management

## Executive Summary

Raydium CLMM (Concentrated Liquidity Market Maker) is the primary DEX for managing concentrated liquidity positions on Solana. This document consolidates research findings and outlines the implementation approach for integrating Raydium CLMM position management into Flow.

---

## Raydium CLMM Program Information

### Program ID

-   **Raydium CLMM Program**: `CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`

### Key Resources

-   Documentation: https://docs.raydium.io/
-   GitHub SDK: https://github.com/raydium-io/raydium-sdk
-   TypeScript SDK: `@raydium-io/raydium-sdk`

---

## Core Instructions

### 1. OpenPosition

**Purpose**: Create a new concentrated liquidity position

**Key Accounts** (based on research):

-   `poolState`: The CLMM pool account
-   `personalPosition`: New position account (PDA)
-   `tickArrayLower`: Tick array for lower bound
-   `tickArrayUpper`: Tick array for upper bound
-   `tokenAccount0`: Token account for token 0 (writable)
-   `tokenAccount1`: Token account for token 1 (writable)
-   `tokenVault0`: Pool's token vault 0 (writable)
-   `tokenVault1`: Pool's token vault 1 (writable)
-   `owner`: Position owner (signer)
-   `tokenProgram`: SPL Token Program
-   `systemProgram`: System Program

**Parameters**:

-   `tickLower`: Lower tick bound (i32)
-   `tickUpper`: Upper tick bound (i32)
-   `liquidity`: Initial liquidity amount (u128)
-   `amount0Max`: Maximum amount of token 0 (u64)
-   `amount1Max`: Maximum amount of token 1 (u64)

**Instruction Discriminator**: Unknown - needs research

---

### 2. IncreaseLiquidity

**Purpose**: Add liquidity to an existing position

**Key Accounts**:

-   `personalPosition`: Position account (writable)
-   `poolState`: Pool account
-   `tickArrayLower`: Tick array for lower bound
-   `tickArrayUpper`: Tick array for upper bound
-   `tokenAccount0`: Token account 0 (writable)
-   `tokenAccount1`: Token account 1 (writable)
-   `tokenVault0`: Pool vault 0 (writable)
-   `tokenVault1`: Pool vault 1 (writable)
-   `owner`: Position owner (signer)
-   `tokenProgram`: SPL Token Program

**Parameters**:

-   `liquidity`: Liquidity amount to add (u128)
-   `amount0Max`: Maximum amount of token 0 (u64)
-   `amount1Max`: Maximum amount of token 1 (u64)

---

### 3. DecreaseLiquidity

**Purpose**: Remove liquidity from a position

**Key Accounts**: Same as IncreaseLiquidity

**Parameters**:

-   `liquidity`: Liquidity amount to remove (u128)
-   `amount0Min`: Minimum amount of token 0 (u64)
-   `amount1Min`: Minimum amount of token 1 (u64)

---

### 4. Collect

**Purpose**: Collect fees and rewards from a position

**Key Accounts**:

-   `personalPosition`: Position account (writable)
-   `poolState`: Pool account
-   `tokenAccount0`: Destination token account 0 (writable)
-   `tokenAccount1`: Destination token account 1 (writable)
-   `tokenVault0`: Pool vault 0 (writable)
-   `tokenVault1`: Pool vault 1 (writable)
-   `owner`: Position owner (signer)
-   `tokenProgram`: SPL Token Program

**Parameters**:

-   `amount0Requested`: Amount of token 0 to collect (u64)
-   `amount1Requested`: Amount of token 1 to collect (u64)

---

## Account Structures

### PoolState Account

Key fields:

-   `token_0_vault`: Token 0 vault address
-   `token_1_vault`: Token 1 vault address
-   `token_0_mint`: Token 0 mint address
-   `token_1_mint`: Token 1 mint address
-   `tick_spacing`: Tick spacing (typically 60)
-   `liquidity`: Current pool liquidity
-   `sqrt_price_x64`: Current sqrt price
-   `tick_current`: Current tick

### PersonalPosition Account

Key fields:

-   `pool_id`: Pool this position belongs to
-   `nft_mint`: NFT mint (if applicable)
-   `liquidity`: Position liquidity
-   `tick_lower_index`: Lower tick
-   `tick_upper_index`: Upper tick
-   `token_0_amount`: Token 0 amount
-   `token_1_amount`: Token 1 amount

---

## Integration Approaches

### Approach 1: Direct CPI (Preferred)

**Flow**:

1. Smart contract directly invokes Raydium CLMM program via CPI
2. Handles all position operations on-chain
3. Single transaction for operations

**Pros**:

-   ✅ Fully on-chain
-   ✅ Single transaction
-   ✅ No off-chain dependencies

**Cons**:

-   ⚠️ Requires understanding instruction formats
-   ⚠️ Complex account setup
-   ⚠️ Need to handle tick arrays

**Implementation**:

-   Build CPI instructions manually
-   Handle account derivation (PDAs, tick arrays)
-   Manage signer setup

---

### Approach 2: Transaction-Based (Alternative)

**Flow**:

1. Off-chain service uses Raydium SDK to build transactions
2. Transactions stored in rebalance decisions
3. Execute transactions separately

**Pros**:

-   ✅ Uses Raydium SDK (well-documented)
-   ✅ Handles complexity automatically
-   ✅ No need to understand instruction format

**Cons**:

-   ⚠️ Requires off-chain component
-   ⚠️ Two-step process
-   ⚠️ Similar to Jupiter approach

---

## Research Action Items

### Immediate (This Week)

1. **Examine Raydium SDK**

    - [ ] Clone https://github.com/raydium-io/raydium-sdk
    - [ ] Find instruction definitions
    - [ ] Look for IDL files
    - [ ] Find CPI examples

2. **Search for Instruction Formats**

    - [ ] Search GitHub for "Raydium CPI" examples
    - [ ] Look for other Solana programs using Raydium
    - [ ] Check Solana program examples

3. **Test on Devnet**
    - [ ] Find devnet pool addresses
    - [ ] Test position creation
    - [ ] Test rebalancing operations

---

## Implementation Plan

### Phase 1: Basic Position Creation (Week 1)

1. Add Raydium program ID constant
2. Create helper function for `OpenPosition` CPI
3. Integrate with `create_liquidity_position`
4. Test position creation on devnet

### Phase 2: Position Management (Week 2)

1. Implement `IncreaseLiquidity` CPI
2. Implement `DecreaseLiquidity` CPI
3. Implement `Collect` CPI
4. Integrate with `execute_rebalance`
5. Integrate with `collect_fees`

### Phase 3: Testing & Refinement (Week 3)

1. Comprehensive integration tests
2. Test rebalancing flow
3. Test fee collection
4. Performance optimization

---

## Key Considerations

### Tick Math

-   Raydium uses tick-based pricing
-   Need to convert between price and ticks
-   Understand tick spacing (typically 60)
-   Tick arrays must be initialized

### Liquidity Calculation

-   Calculate liquidity from token amounts
-   Handle price range calculations
-   Account for fee tier

### Position Ownership

-   Positions are owned by creator
-   Consider using PDAs for positions
-   Handle position ownership transfer

### Account Derivation

-   PersonalPosition is a PDA
-   Tick arrays are PDAs
-   Need to derive correctly

---

## Next Steps

1. **Research**: Find actual instruction discriminators and formats
2. **Implement**: Start with OpenPosition CPI
3. **Test**: Verify on devnet
4. **Integrate**: Connect to Flow instructions
5. **Document**: Update implementation guide

---

## References

-   [Raydium Documentation](https://docs.raydium.io/)
-   [Raydium SDK GitHub](https://github.com/raydium-io/raydium-sdk)
-   [Solana CPI Guide](https://solanacookbook.com/references/programs.html#how-to-do-cross-program-invocations)
-   [Concentrated Liquidity Concepts](https://docs.uniswap.org/concepts/protocol/concentrated-liquidity)

---

**Status**: Research Phase  
**Next Review**: After examining Raydium SDK  
**Last Updated**: 2025-01-XX
