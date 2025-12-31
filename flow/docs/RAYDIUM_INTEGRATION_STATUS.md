# Raydium CLMM Integration - Implementation Status

**Status**: Foundation Implemented - Research Phase  
**Date**: 2025-01-XX  
**Priority**: High - Required for LP position management

## ✅ Completed

### 1. Constants and Program ID

-   ✅ Added Raydium CLMM program ID constant
-   ✅ Added `raydium_clmm_program_id()` helper function
-   ✅ Program ID: `CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`

### 2. Helper Functions (Placeholders)

-   ✅ `create_raydium_position()` - Placeholder for OpenPosition CPI
-   ✅ `increase_raydium_liquidity()` - Placeholder for IncreaseLiquidity CPI
-   ✅ `decrease_raydium_liquidity()` - Placeholder for DecreaseLiquidity CPI
-   ✅ `collect_raydium_fees()` - Placeholder for Collect CPI

### 3. Integration Points

-   ✅ Integrated into `create_liquidity_position` instruction
-   ✅ Integrated into `execute_rebalance` instruction
-   ✅ Integrated into `collect_fees` instruction

### 4. Account Contexts Updated

-   ✅ `CreateLiquidityPosition` - Added optional Raydium accounts
-   ✅ `ExecuteRebalance` - Added optional Raydium accounts
-   ✅ `CollectFees` - Added optional Raydium accounts

### 5. Documentation

-   ✅ Created `RAYDIUM_INSTRUCTION_FORMAT_RESEARCH.md` - Research document
-   ✅ Documented account structures and requirements
-   ✅ Documented integration approach

---

## ⏳ Pending / In Progress

### 1. Instruction Format Research (Critical)

**What's Needed**:

-   [ ] Find actual instruction discriminators for:
    -   `OpenPosition`
    -   `IncreaseLiquidity`
    -   `DecreaseLiquidity`
    -   `Collect`
-   [ ] Document exact instruction data serialization format
-   [ ] Document complete account list and ordering
-   [ ] Document PDA derivation for positions and tick arrays

**Research Sources**:

-   [ ] Raydium SDK GitHub: https://github.com/raydium-io/raydium-sdk
-   [ ] Raydium program IDL (if published)
-   [ ] Example CPI implementations
-   [ ] Raydium program source code

### 2. Implementation Tasks

**Phase 1: Position Creation**

-   [ ] Implement `create_raydium_position()` CPI call
-   [ ] Handle PDA derivation for PersonalPosition
-   [ ] Handle tick array account derivation
-   [ ] Test position creation on devnet

**Phase 2: Position Management**

-   [ ] Implement `increase_raydium_liquidity()` CPI call
-   [ ] Implement `decrease_raydium_liquidity()` CPI call
-   [ ] Implement `collect_raydium_fees()` CPI call
-   [ ] Test rebalancing flow

**Phase 3: Integration**

-   [ ] Complete integration with `create_liquidity_position`
-   [ ] Complete integration with `execute_rebalance`
-   [ ] Complete integration with `collect_fees`
-   [ ] Add error handling

### 3. Testing

-   [ ] Unit tests for helper functions
-   [ ] Integration tests with Raydium on devnet
-   [ ] Test position creation
-   [ ] Test rebalancing
-   [ ] Test fee collection
-   [ ] Test error conditions

---

## Current Implementation Details

### Helper Functions Structure

All helper functions follow this pattern:

1. Check if required accounts are provided (optional for now)
2. Validate program ID if provided
3. Log operation details
4. Placeholder for actual CPI implementation
5. Return success (for now)

### Integration Logic

**create_liquidity_position**:

-   Checks if `dex == Raydium`
-   If Raydium accounts provided, calls `create_raydium_position()`
-   Falls back gracefully if accounts not provided

**execute_rebalance**:

-   Checks if `dex == Raydium`
-   If Raydium accounts provided:
    1. Decreases liquidity from old range
    2. Collects fees
    3. Increases liquidity to new range
-   Falls back gracefully if accounts not provided

**collect_fees**:

-   Checks if `dex == Raydium`
-   If Raydium accounts provided, calls `collect_raydium_fees()`
-   Falls back gracefully if accounts not provided

---

## Next Steps

### Immediate (This Week)

1. **Research Instruction Formats** (Priority 1)

    - Examine Raydium SDK repository
    - Find instruction discriminators
    - Document account requirements
    - Test CPI calls on devnet

2. **Implement OpenPosition** (Priority 2)
    - Once instruction format is known
    - Implement PDA derivation
    - Test on devnet

### Short-term (Next 2 Weeks)

1. Complete all CPI implementations
2. Full integration testing
3. Error handling and edge cases
4. Performance optimization

---

## Alternative Approach

If CPI research proves difficult, we can use a **transaction-based approach** similar to Jupiter:

1. Off-chain service uses Raydium SDK to build transactions
2. Transactions stored in rebalance decisions
3. Execute transactions separately
4. Record execution signatures

**Trade-off**: Requires off-chain component but may be simpler initially.

---

## Files Modified

-   `programs/flow/src/lib.rs`
    -   Added Raydium constants
    -   Added helper functions (placeholders)
    -   Integrated into existing instructions
    -   Added optional accounts to contexts

## Files Created

-   `docs/RAYDIUM_INSTRUCTION_FORMAT_RESEARCH.md` - Research document
-   `docs/RAYDIUM_INTEGRATION_STATUS.md` - This file

---

## References

-   [Raydium Documentation](https://docs.raydium.io/)
-   [Raydium SDK GitHub](https://github.com/raydium-io/raydium-sdk)
-   [Solana CPI Guide](https://solanacookbook.com/references/programs.html#how-to-do-cross-program-invocations)

---

**Status**: Foundation Complete - Research Phase  
**Next Review**: After instruction format research  
**Last Updated**: 2025-01-XX
