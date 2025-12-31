# DEX Integration Research - Priority 1.2

**Status**: In Progress  
**Date**: 2025-01-XX  
**Priority**: High - Foundation for swap execution and LP management

## Overview

This document consolidates research findings for integrating Flow with Jupiter (swap aggregator) and Raydium CLMM (concentrated liquidity market maker). This research is critical for implementing Priority 2 (Jupiter Swap Integration) and Priority 3 (Raydium CLMM Integration).

---

## Part 1: Jupiter Swap Integration Research

### 1.1 Jupiter Architecture Overview

**Jupiter Program ID (v6)**: `JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4`

**Key Resources**:

-   API Documentation: https://station.jup.ag/docs/apis/swap-api
-   GitHub: https://github.com/jup-ag/jupiter-core
-   TypeScript SDK: `@jupiter-ag/api`

### 1.2 Integration Approaches

#### Approach A: Off-Chain Quote + On-Chain CPI (Recommended)

**Flow**:

1. Off-chain service calls Jupiter Quote API to get optimal swap route
2. Route plan is passed to smart contract via `create_rebalance_decision`
3. Smart contract executes swap via CPI to Jupiter program
4. Jupiter routes through optimal DEX path automatically

**Advantages**:

-   ✅ Uses Jupiter's advanced routing algorithms
-   ✅ Better price discovery across multiple DEXs
-   ✅ Can handle complex multi-hop routes
-   ✅ Optimal execution guaranteed

**Disadvantages**:

-   ⚠️ Requires off-chain component (AI service)
-   ⚠️ Two-step process (quote then execute)

#### Approach B: Direct CPI (Simpler but Limited)

**Flow**:

1. Smart contract directly invokes Jupiter program via CPI
2. Jupiter handles routing internally

**Advantages**:

-   ✅ Fully on-chain
-   ✅ Single transaction

**Disadvantages**:

-   ⚠️ Less control over routing
-   ⚠️ May not get optimal prices
-   ⚠️ Requires understanding Jupiter's instruction format

### 1.3 Jupiter API Research

#### Quote API Endpoint

```
GET https://quote-api.jup.ag/v6/quote
```

**Parameters**:

-   `inputMint`: Source token mint address
-   `outputMint`: Destination token mint address
-   `amount`: Amount in smallest unit (lamports/decimals)
-   `slippageBps`: Slippage tolerance in basis points
-   `onlyDirectRoutes`: Boolean (optional)
-   `asLegacyTransaction`: Boolean (optional)

**Response**:

```json
{
    "inputMint": "...",
    "inAmount": "1000000",
    "outputMint": "...",
    "outAmount": "995000",
    "otherAmountThreshold": "...",
    "swapMode": "ExactIn",
    "slippageBps": 50,
    "platformFee": null,
    "priceImpactPct": "0.05",
    "routePlan": [
        {
            "swapInfo": {
                "ammKey": "...",
                "label": "Raydium",
                "inputMint": "...",
                "outputMint": "...",
                "inAmount": "1000000",
                "outAmount": "995000",
                "feeAmount": "5000",
                "feeMint": "..."
            },
            "percent": 100
        }
    ],
    "contextSlot": 123456789,
    "timeTaken": 0.05
}
```

#### Swap API Endpoint

```
POST https://quote-api.jup.ag/v6/swap
```

**Request Body**:

```json
{
    "quoteResponse": {
        /* from quote API */
    },
    "userPublicKey": "...",
    "wrapAndUnwrapSol": true,
    "dynamicComputeUnitLimit": true,
    "prioritizationFeeLamports": 0
}
```

**Response**: Transaction ready to sign and send

### 1.4 CPI Implementation Research

#### Current Implementation Status

Based on `JUPITER_CPI_COMPLETE.md`, the CPI invocation is already implemented with:

✅ **Completed**:

-   PDA derivation for program authority
-   Signer seed setup
-   CPI invocation with `invoke_signed()` for PDA
-   CPI invocation with `invoke()` for user signer
-   Account validation
-   Route plan validation
-   Error handling

🔄 **Needs Research**:

-   Actual Jupiter instruction discriminator (currently placeholder `0x9a`)
-   Complete account structure from route plan
-   Instruction data format for Jupiter v6
-   How to parse route plan to extract all required accounts
-   Slippage verification after swap

#### Instruction Format Research Needed

**Key Questions**:

1. What is the actual instruction discriminator for Jupiter v6 swap?
2. How is the route plan serialized in the instruction data?
3. What accounts are required beyond token accounts?
4. How to handle wrapped SOL vs native SOL?
5. How to verify swap succeeded and check actual slippage?

**Research Tasks**:

-   [ ] Review Jupiter program source code (if available)
-   [ ] Test CPI calls on devnet with actual Jupiter program
-   [ ] Document exact instruction format
-   [ ] Create helper functions for instruction building
-   [ ] Test with various route plans

### 1.5 SDK Availability

**TypeScript SDK**: `@jupiter-ag/api`

-   ✅ Available on npm
-   ✅ Provides quote and swap API clients
-   ✅ Can be used in off-chain components
-   ❌ Not directly usable in Rust/Solana program

**Rust SDK**:

-   ⚠️ Need to verify if Rust SDK exists
-   ⚠️ If not, need to implement CPI manually using instruction data

**Research Tasks**:

-   [ ] Check for Rust/Jupiter SDK or crate
-   [ ] Review Jupiter program IDL if available
-   [ ] Document manual CPI implementation approach

---

## Part 2: Raydium CLMM Integration Research

### 2.1 Raydium CLMM Architecture Overview

**Raydium CLMM Program ID**: `CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`

**Key Resources**:

-   Documentation: https://docs.raydium.io/
-   GitHub SDK: https://github.com/raydium-io/raydium-sdk
-   TypeScript SDK: `@raydium-io/raydium-sdk`

### 2.2 Core Operations

#### 2.2.1 Create LP Position

**Instruction**: `OpenPosition`

**Required Accounts**:

-   `poolState`: The CLMM pool account
-   `personalPosition`: New position account (PDA)
-   `tickArrayLower`: Tick array for lower bound
-   `tickArrayUpper`: Tick array for upper bound
-   `tokenAccount0`: Token account for token 0
-   `tokenAccount1`: Token account for token 1
-   `tokenVault0`: Pool's token vault 0
-   `tokenVault1`: Pool's token vault 1
-   `owner`: Position owner (signer)
-   `tokenProgram`: SPL Token Program
-   `systemProgram`: System Program

**Parameters**:

-   `tickLower`: Lower tick bound (i32)
-   `tickUpper`: Upper tick bound (i32)
-   `liquidity`: Initial liquidity amount (u128)
-   `amount0Max`: Maximum amount of token 0 (u64)
-   `amount1Max`: Maximum amount of token 1 (u64)

#### 2.2.2 Update Position Range (Rebalance)

**Instructions**:

1. `DecreaseLiquidity`: Remove liquidity from old range
2. `Collect`: Collect fees from old range
3. `IncreaseLiquidity`: Add liquidity to new range

**Required Accounts** (for each operation):

-   `personalPosition`: Position account
-   `poolState`: Pool account
-   `tickArrayLower`: Tick array for lower bound
-   `tickArrayUpper`: Tick array for upper bound
-   `tokenAccount0`: Token account 0
-   `tokenAccount1`: Token account 1
-   `tokenVault0`: Pool vault 0
-   `tokenVault1`: Pool vault 1
-   `owner`: Position owner (signer)
-   `tokenProgram`: SPL Token Program

#### 2.2.3 Collect Fees

**Instruction**: `Collect`

**Required Accounts**:

-   `personalPosition`: Position account
-   `poolState`: Pool account
-   `tokenAccount0`: Destination token account 0
-   `tokenAccount1`: Destination token account 1
-   `tokenVault0`: Pool vault 0
-   `tokenVault1`: Pool vault 1
-   `owner`: Position owner (signer)
-   `tokenProgram`: SPL Token Program

**Parameters**:

-   `amount0Requested`: Amount of token 0 to collect (u64)
-   `amount1Requested`: Amount of token 1 to collect (u64)

### 2.3 Account Structure Research

#### PoolState Account

```rust
pub struct PoolState {
    pub amm_config: Pubkey,        // AMM configuration
    pub pool_creator: Pubkey,      // Pool creator
    pub token_0_vault: Pubkey,     // Token 0 vault
    pub token_1_vault: Pubkey,     // Token 1 vault
    pub token_0_mint: Pubkey,      // Token 0 mint
    pub token_1_mint: Pubkey,      // Token 1 mint
    pub tick_spacing: u16,         // Tick spacing
    pub liquidity: u128,            // Current liquidity
    pub sqrt_price_x64: u128,       // Current sqrt price
    pub tick_current: i32,          // Current tick
    pub observation_index: u16,    // Observation index
    pub observation_update_duration: u16,
    pub fee_growth_global_0_x64: u128,
    pub fee_growth_global_1_x64: u128,
    pub protocol_fees_token_0: u64,
    pub protocol_fees_token_1: u64,
    pub swap_in_amount_token_0: u128,
    pub swap_out_amount_token_1: u128,
    pub swap_in_amount_token_1: u128,
    pub swap_out_amount_token_0: u128,
    // ... more fields
}
```

#### PersonalPosition Account

```rust
pub struct PersonalPosition {
    pub pool_id: Pubkey,           // Pool this position belongs to
    pub nft_mint: Pubkey,          // NFT mint (if applicable)
    pub liquidity: u128,            // Position liquidity
    pub tick_lower_index: i32,      // Lower tick
    pub tick_upper_index: i32,      // Upper tick
    pub fee_growth_inside_0_last_x64: u128,
    pub fee_growth_inside_1_last_x64: u128,
    pub token_0_amount: u64,        // Token 0 amount
    pub token_1_amount: u64,        // Token 1 amount
    // ... more fields
}
```

### 2.4 SDK Availability

**TypeScript SDK**: `@raydium-io/raydium-sdk`

-   ✅ Available on npm
-   ✅ Provides position management functions
-   ✅ Can be used in off-chain components
-   ❌ Not directly usable in Rust/Solana program

**Rust SDK**:

-   ⚠️ Need to verify if Rust SDK exists
-   ⚠️ If not, need to implement CPI manually

**Research Tasks**:

-   [ ] Check for Rust/Raydium SDK or crate
-   [ ] Review Raydium CLMM program IDL
-   [ ] Document manual CPI implementation approach
-   [ ] Test CPI calls on devnet

### 2.5 Tick Calculation Research

**Key Concepts**:

-   **Tick**: Discrete price points in CLMM
-   **Tick Spacing**: Minimum tick difference (e.g., 60 for 0.01% pools)
-   **Price to Tick**: `tick = log(sqrt(price)) / log(1.0001)`
-   **Tick to Price**: `price = 1.0001^tick`

**Research Tasks**:

-   [ ] Implement tick calculation helpers
-   [ ] Understand tick array structure
-   [ ] Document price range to tick conversion
-   [ ] Test tick calculations

---

## Part 3: Integration Plan

### 3.1 Implementation Phases

#### Phase 1: Research & Documentation (Current - Priority 1.2)

-   [x] Review existing documentation
-   [x] Consolidate Jupiter integration research
-   [x] Consolidate Raydium integration research
-   [ ] Research actual instruction formats
-   [ ] Test CPI calls on devnet
-   [ ] Document complete integration approach

#### Phase 2: Jupiter Swap Integration (Priority 2)

-   [ ] Add Jupiter dependencies
-   [ ] Implement swap helper functions
-   [ ] Integrate into `execute_rebalance`
-   [ ] Add slippage validation
-   [ ] Test with devnet tokens

#### Phase 3: Raydium CLMM Integration (Priority 3)

-   [ ] Add Raydium dependencies
-   [ ] Implement position creation
-   [ ] Implement position update (rebalance)
-   [ ] Implement fee collection
-   [ ] Test with devnet pools

### 3.2 Key Integration Points

#### In `execute_rebalance` Instruction

```rust
pub fn execute_rebalance(ctx: Context<ExecuteRebalance>, ...) -> Result<()> {
    // 1. Validate decision
    // 2. Calculate required token amounts
    // 3. Execute Jupiter swap if needed (CPI)
    // 4. Update Raydium position range (CPI)
    //    - Decrease old range liquidity
    //    - Collect fees
    //    - Increase new range liquidity
    // 5. Update position account
    // 6. Emit event
}
```

#### In `create_liquidity_position` Instruction

```rust
pub fn create_liquidity_position(ctx: Context<CreateLiquidityPosition>, ...) -> Result<()> {
    // 1. Validate inputs
    // 2. Create Raydium position (CPI)
    // 3. Store position reference
    // 4. Emit event
}
```

#### In `collect_fees` Instruction

```rust
pub fn collect_fees(ctx: Context<CollectFees>, ...) -> Result<()> {
    // 1. Validate position
    // 2. Collect fees from Raydium (CPI)
    // 3. Update position account
    // 4. Transfer fees to recipient
    // 5. Emit event
}
```

### 3.3 Error Handling Strategy

**Jupiter Swap Errors**:

-   Slippage exceeded
-   Insufficient liquidity
-   Invalid route
-   Token account errors

**Raydium CLMM Errors**:

-   Invalid tick range
-   Insufficient liquidity
-   Position not found
-   Fee calculation errors

**Handling Approach**:

-   Validate inputs before CPI calls
-   Check slippage after swaps
-   Emit events for all operations
-   Store error details in decision account

### 3.4 Testing Strategy

**Unit Tests**:

-   Test helper functions
-   Test tick calculations
-   Test account validation

**Integration Tests**:

-   Test Jupiter CPI with mock program
-   Test Raydium CPI with mock program
-   Test complete rebalance flow

**Devnet Tests**:

-   Test with actual Jupiter on devnet
-   Test with actual Raydium on devnet
-   Test end-to-end rebalance flow

---

## Part 4: Research Gaps & Next Steps

### 4.1 Critical Research Gaps

1. **Jupiter Instruction Format**

    - [ ] Actual instruction discriminator
    - [ ] Complete instruction data structure
    - [ ] Account list from route plan
    - [ ] Wrapped SOL handling

2. **Raydium Instruction Format**

    - [ ] Exact instruction discriminators
    - [ ] Complete instruction data structures
    - [ ] Account derivation for tick arrays
    - [ ] Fee calculation formulas

3. **SDK Availability**
    - [ ] Check for Rust/Jupiter SDK
    - [ ] Check for Rust/Raydium SDK
    - [ ] Review program IDLs
    - [ ] Document manual implementation if needed

### 4.2 Immediate Next Steps

1. **Research Actual Instruction Formats**

    - Review Jupiter program source code
    - Review Raydium program source code
    - Test CPI calls on devnet
    - Document exact formats

2. **Create Test Implementations**

    - Create minimal Jupiter swap test
    - Create minimal Raydium position test
    - Verify CPI calls work
    - Document findings

3. **Update Integration Plans**
    - Update Jupiter integration doc with actual formats
    - Update Raydium integration doc with actual formats
    - Create implementation checklist
    - Document testing approach

### 4.3 Estimated Timeline

-   **Research Phase**: 1-2 days
-   **Documentation Update**: 0.5 days
-   **Test Implementation**: 1 day
-   **Total**: 2.5-3.5 days

---

## References

### Jupiter

-   [Jupiter API Documentation](https://station.jup.ag/docs/apis/swap-api)
-   [Jupiter GitHub](https://github.com/jup-ag/jupiter-core)
-   [Jupiter Program on Solscan](https://solscan.io/account/JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4)

### Raydium

-   [Raydium Documentation](https://docs.raydium.io/)
-   [Raydium SDK GitHub](https://github.com/raydium-io/raydium-sdk)
-   [Raydium CLMM Program on Solscan](https://solscan.io/account/CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK)

### Solana/Anchor

-   [Anchor CPI Documentation](https://www.anchor-lang.com/docs/cross-program-invocations)
-   [Solana Cookbook - CPI](https://solanacookbook.com/references/programs.html#how-to-do-cross-program-invocation)

---

## Document Status

**Last Updated**: 2025-01-XX  
**Status**: Research in progress  
**Next Review**: After devnet testing
