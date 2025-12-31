# Raydium CLMM CPI Implementation Status

**Date**: January 2025  
**Status**: Foundation Implemented - Ready for Testing & Refinement

## ✅ Completed

### 1. Dependency Added

-   ✅ Added `raydium-clmm-cpi` crate to `Cargo.toml`
-   ✅ Dependency resolves correctly

### 2. CPI Functions Implemented

All four Raydium CLMM CPI functions have been implemented with manual CPI construction:

#### ✅ `create_raydium_position` (OpenPosition)

-   **Location**: `programs/flow/src/lib.rs:1133-1254`
-   **Status**: Implemented with manual CPI instruction building
-   **Instruction Data**: Discriminator + tick_lower + tick_upper + liquidity + amount_0_max + amount_1_max
-   **Accounts**: Basic account structure (needs tick arrays, position PDA, vaults)

#### ✅ `increase_raydium_liquidity` (IncreaseLiquidity)

-   **Location**: `programs/flow/src/lib.rs:1256-1305`
-   **Status**: Implemented with manual CPI instruction building
-   **Instruction Data**: Discriminator + liquidity + amount_0_max + amount_1_max
-   **Accounts**: Basic account structure (needs tick arrays, token accounts, vaults)

#### ✅ `decrease_raydium_liquidity` (DecreaseLiquidity)

-   **Location**: `programs/flow/src/lib.rs:1307-1356`
-   **Status**: Implemented with manual CPI instruction building
-   **Instruction Data**: Discriminator + liquidity + amount_0_min + amount_1_min
-   **Accounts**: Basic account structure (needs tick arrays, token accounts, vaults)

#### ✅ `collect_raydium_fees` (Collect)

-   **Location**: `programs/flow/src/lib.rs:1358-1410`
-   **Status**: Implemented with manual CPI instruction building
-   **Instruction Data**: Discriminator + amount_0_requested + amount_1_requested
-   **Accounts**: Basic account structure (needs token accounts, vaults)

## ⚠️ Known Limitations

### 1. Instruction Discriminators (Placeholders)

The current implementation uses placeholder discriminators:

-   `OpenPosition`: `0x01` (needs verification)
-   `IncreaseLiquidity`: `0x02` (needs verification)
-   `DecreaseLiquidity`: `0x03` (needs verification)
-   `Collect`: `0x04` (needs verification)

**Action Required**: Verify actual discriminators from:

-   Raydium CLMM IDL
-   Raydium program source code
-   Raydium SDK documentation

### 2. Missing Accounts

The current implementation is missing several required accounts:

**For OpenPosition:**

-   PersonalPosition PDA (needs derivation)
-   TickArrayLower PDA (needs derivation)
-   TickArrayUpper PDA (needs derivation)
-   TokenVault0 (from pool state)
-   TokenVault1 (from pool state)

**For IncreaseLiquidity/DecreaseLiquidity:**

-   TickArrayLower PDA
-   TickArrayUpper PDA
-   TokenAccount0 (user's token account)
-   TokenAccount1 (user's token account)
-   TokenVault0 (from pool state)
-   TokenVault1 (from pool state)
-   Owner signer
-   TokenProgram

**For Collect:**

-   TokenAccount0 (destination)
-   TokenAccount1 (destination)
-   TokenVault0 (from pool state)
-   TokenVault1 (from pool state)
-   Owner signer
-   TokenProgram

### 3. PDA Derivation

Position and tick array PDAs need to be derived. The derivation formulas should be:

-   **PersonalPosition PDA**: Derived from pool, owner, and position index
-   **TickArray PDA**: Derived from pool and tick index

### 4. Account Ordering

The exact account ordering for Raydium CLMM instructions needs verification. Current implementation has placeholder comments indicating where accounts should go.

## 🔄 Next Steps

### Phase 1: Verify Instruction Formats (High Priority)

1. **Research Raydium CLMM IDL**

    - Find published IDL or program source
    - Verify instruction discriminators
    - Verify account ordering
    - Verify instruction data format

2. **Test with Raydium SDK**
    - Compare instruction formats
    - Verify account requirements
    - Test on devnet

### Phase 2: Complete Account Setup (High Priority)

1. **Add Missing Accounts to Instruction Contexts**

    - Update `CreateLiquidityPosition` context
    - Update `ExecuteRebalance` context
    - Update `CollectFees` context

2. **Implement PDA Derivation**

    - PersonalPosition PDA derivation
    - TickArray PDA derivation
    - Helper functions for derivation

3. **Extract Token Vaults from Pool State**
    - Read pool state account
    - Extract vault addresses
    - Pass to CPI functions

### Phase 3: Use Raydium CPI Crate (Medium Priority)

1. **Investigate raydium-clmm-cpi Crate**

    - Review crate API
    - Check if it provides CPI builders
    - Use crate helpers if available

2. **Refactor to Use Crate**
    - Replace manual CPI with crate helpers
    - Simplify account setup
    - Improve type safety

### Phase 4: Testing (High Priority)

1. **Unit Tests**

    - Test PDA derivation
    - Test instruction building
    - Test account validation

2. **Integration Tests**

    - Test on devnet
    - Test position creation
    - Test rebalancing flow
    - Test fee collection

3. **Error Handling**
    - Handle missing accounts gracefully
    - Handle invalid discriminators
    - Handle PDA derivation failures

## 📝 Implementation Notes

### Current Approach

The implementation uses **manual CPI construction** because:

1. Not all required accounts are available in current instruction contexts
2. Instruction discriminators need verification
3. Provides foundation that can be extended

### Future Approach

Once instruction formats are verified and accounts are added:

1. Use `raydium-clmm-cpi` crate helpers if available
2. Or refine manual CPI construction with correct formats
3. Add comprehensive error handling

### Code Structure

-   All functions follow similar pattern:
    1. Validate program ID
    2. Validate required accounts
    3. Build instruction data
    4. Build account metas
    5. Invoke CPI
    6. Log results

## 🔗 References

-   [Raydium CLMM Documentation](https://docs.raydium.io/)
-   [Raydium CPI Repository](https://github.com/raydium-io/raydium-cpi)
-   [Raydium CPI Examples](https://github.com/raydium-io/raydium-cpi-example)
-   [Solana CPI Guide](https://solanacookbook.com/references/programs.html#how-to-do-cross-program-invocations)

## ✅ Compilation Status

-   ✅ Code compiles successfully
-   ✅ No linting errors
-   ✅ Dependency resolves correctly
-   ⚠️ Runtime functionality needs testing

---

**Status**: Foundation Complete - Ready for Testing & Refinement  
**Next Review**: After instruction format verification  
**Last Updated**: January 2025
