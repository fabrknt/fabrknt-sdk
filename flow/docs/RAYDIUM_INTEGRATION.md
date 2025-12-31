# Raydium CLMM Integration Plan

## Overview

Raydium's Concentrated Liquidity Market Maker (CLMM) is the primary DEX for managing concentrated liquidity positions on Solana. This document outlines the integration strategy for Flow to create and manage LP positions.

## Key Resources

-   **Raydium Documentation**: https://docs.raydium.io/
-   **Raydium CLMM SDK**: `@raydium-io/raydium-sdk` (TypeScript/JavaScript)
-   **Raydium CLMM Program**: `CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`
-   **GitHub**: https://github.com/raydium-io/raydium-sdk

## Integration Architecture

### Core Operations

1. **Create LP Position**

    - Initialize concentrated liquidity position
    - Set initial price range (tick_lower, tick_upper)
    - Deposit tokens

2. **Update Position Range**

    - Modify tick_lower and tick_upper
    - Rebalance liquidity
    - Handle token swaps if needed

3. **Collect Fees**

    - Withdraw accumulated trading fees
    - Calculate protocol fees
    - Transfer to fee recipient

4. **Close Position**
    - Withdraw all liquidity
    - Collect remaining fees
    - Close position account

## Implementation Strategy

### Phase 1: Research & Understanding

#### 1.1 Raydium CLMM Account Structure

**Key Accounts**:

-   `PoolState`: Main pool account
-   `PersonalPosition`: User's LP position
-   `TickArray`: Tick data for price ranges
-   `Observation`: Price observation data

**Key Instructions**:

-   `OpenPosition`: Create new LP position
-   `IncreaseLiquidity`: Add liquidity to position
-   `DecreaseLiquidity`: Remove liquidity from position
-   `UpdateReward`: Update reward information
-   `Collect`: Collect fees and rewards
-   `ClosePosition`: Close position

#### 1.2 Research Tasks

-   [ ] Review Raydium CLMM program source code
-   [ ] Understand account structure
-   [ ] Document instruction formats
-   [ ] Test CPI calls on devnet
-   [ ] Review SDK for reference implementation

### Phase 2: Basic Position Management

#### 2.1 Add Raydium Dependencies

```toml
# programs/flow/Cargo.toml
[dependencies]
anchor-lang = "0.32.1"
anchor-spl = "0.32.1"
# Raydium program interface (if available)
# Otherwise, use CPI with instruction data
```

#### 2.2 Create Position Helper Functions

```rust
// programs/flow/src/lib.rs

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

/// Raydium CLMM Program ID
pub const RAYDIUM_CLMM_PROGRAM_ID: &str = "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK";

/// Create a new concentrated liquidity position on Raydium
pub fn create_raydium_position(
    ctx: Context<CreateRaydiumPosition>,
    tick_lower: i32,
    tick_upper: i32,
    liquidity_amount: u128,
) -> Result<()> {
    msg!("Creating Raydium position: ticks [{}, {}], liquidity: {}",
         tick_lower, tick_upper, liquidity_amount);

    // CPI to Raydium CLMM program
    // Instruction: OpenPosition
    // This requires understanding Raydium's instruction format

    // TODO: Implement CPI call to Raydium
    // Accounts needed:
    // - PoolState
    // - PersonalPosition (PDA)
    // - Token accounts
    // - TickArray accounts
    // - etc.

    Ok(())
}

/// Update position range (rebalance)
pub fn update_raydium_position_range(
    ctx: Context<UpdateRaydiumPosition>,
    new_tick_lower: i32,
    new_tick_upper: i32,
) -> Result<()> {
    // Strategy:
    // 1. Decrease liquidity from old range
    // 2. Collect fees
    // 3. Swap tokens if needed (via Jupiter)
    // 4. Increase liquidity to new range

    // TODO: Implement
    Ok(())
}

/// Collect fees from Raydium position
pub fn collect_raydium_fees(
    ctx: Context<CollectRaydiumFees>,
) -> Result<()> {
    // CPI to Raydium: Collect instruction
    // Collects trading fees
    // Calculates protocol fees
    // Transfers to fee recipient

    // TODO: Implement
    Ok(())
}
```

#### 2.3 Account Contexts

```rust
#[derive(Accounts)]
pub struct CreateRaydiumPosition<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: Raydium pool state
    pub pool_state: UncheckedAccount<'info>,

    /// CHECK: Raydium CLMM program
    pub raydium_program: UncheckedAccount<'info>,

    #[account(mut)]
    pub token_a_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub token_b_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,

    // Additional accounts required by Raydium
    // (to be determined based on Raydium's requirements)
}

#[derive(Accounts)]
pub struct UpdateRaydiumPosition<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    /// CHECK: Raydium personal position
    pub position: UncheckedAccount<'info>,

    /// CHECK: Raydium pool state
    pub pool_state: UncheckedAccount<'info>,

    /// CHECK: Raydium CLMM program
    pub raydium_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,

    // Additional accounts
}
```

### Phase 3: Integration with Flow

#### 3.1 Modify `create_liquidity_position`

```rust
pub fn create_liquidity_position(
    ctx: Context<CreateLiquidityPosition>,
    position_index: u8,
    token_a: Pubkey,
    token_b: Pubkey,
    tick_lower: i32,
    tick_upper: i32,
    // ... other params ...
) -> Result<()> {
    // ... validation ...

    // Create position on Raydium
    create_raydium_position(
        // ... context ...
        tick_lower,
        tick_upper,
        initial_liquidity,
    )?;

    // Store position reference in our account
    let position = &mut ctx.accounts.position;
    position.token_a = token_a;
    position.token_b = token_b;
    position.current_tick_lower = tick_lower;
    position.current_tick_upper = tick_upper;
    // ... store Raydium position address ...

    Ok(())
}
```

#### 3.2 Modify `execute_rebalance`

```rust
pub fn execute_rebalance(
    ctx: Context<ExecuteRebalance>,
    position_index: u8,
    decision_index: u32,
    slippage_tolerance_bps: u16,
) -> Result<()> {
    // ... validation ...

    let decision = &ctx.accounts.decision;
    let position = &mut ctx.accounts.position;

    // Update position range on Raydium
    update_raydium_position_range(
        // ... context ...
        decision.new_tick_lower,
        decision.new_tick_upper,
    )?;

    // Update our position account
    position.current_tick_lower = decision.new_tick_lower;
    position.current_tick_upper = decision.new_tick_upper;
    position.last_rebalance_timestamp = Clock::get()?.unix_timestamp;
    position.rebalance_count += 1;

    Ok(())
}
```

#### 3.3 Modify `collect_fees`

```rust
pub fn collect_fees(
    ctx: Context<CollectFees>,
    position_index: u8,
) -> Result<()> {
    // ... validation ...

    // Collect fees from Raydium
    let fees_collected = collect_raydium_fees(
        // ... context ...
    )?;

    // Calculate protocol fees
    let protocol_fee = fees_collected
        .checked_mul(ctx.accounts.config.protocol_fee_bps as u64)
        .unwrap()
        .checked_div(10000)
        .unwrap();

    // Transfer protocol fees
    // ... transfer logic ...

    // Update position
    let position = &mut ctx.accounts.position;
    position.total_fees_collected = position.total_fees_collected
        .checked_add(fees_collected)
        .unwrap();

    Ok(())
}
```

## Key Considerations

### 1. Tick Math

-   Raydium uses tick-based pricing
-   Need to convert between price and ticks
-   Understand tick spacing (typically 60)

### 2. Liquidity Calculation

-   Calculate liquidity amount from token amounts
-   Handle price range calculations
-   Account for fee tier

### 3. Position Ownership

-   Positions are owned by the creator
-   Need to handle position ownership transfer
-   Consider using PDAs for positions

### 4. Fee Collection

-   Fees accumulate in position
-   Need to collect periodically
-   Handle fee tier differences

### 5. Token Accounts

-   Need proper token account setup
-   Handle wrapped SOL
-   Manage account ownership

## Testing Strategy

### Unit Tests

-   Test position creation logic
-   Test range update logic
-   Test fee collection
-   Mock Raydium responses

### Integration Tests

-   Test with Raydium on devnet
-   Verify position creation
-   Test rebalancing
-   Test fee collection

### Test Cases

```typescript
describe("Raydium Integration", () => {
    it("Creates position successfully", async () => {
        // Test position creation
    });

    it("Updates position range", async () => {
        // Test rebalancing
    });

    it("Collects fees correctly", async () => {
        // Test fee collection
    });

    it("Handles invalid tick range", async () => {
        // Test validation
    });
});
```

## Alternative: Using Raydium SDK (Off-Chain)

If CPI integration proves complex, we can use Raydium SDK off-chain:

```typescript
// Off-chain component (AI service)
import { Raydium } from "@raydium-io/raydium-sdk";

const raydium = new Raydium({
    connection: connection,
    cluster: "devnet",
});

// Create position
const positionTx = await raydium.openPosition({
    poolId: poolId,
    tickLower: tickLower,
    tickUpper: tickUpper,
    liquidity: liquidity,
    owner: ownerPubkey,
});

// Send transaction
await sendTransaction(positionTx);
```

**Trade-off**: Requires off-chain component but may be simpler initially.

## Implementation Checklist

### Research Phase

-   [ ] Review Raydium CLMM program source code
-   [ ] Understand account structures
-   [ ] Document instruction formats
-   [ ] Test CPI calls on devnet
-   [ ] Review SDK for reference

### Development Phase

-   [ ] Add Raydium program ID constant
-   [ ] Create position helper functions
-   [ ] Implement CPI calls to Raydium
-   [ ] Integrate with `create_liquidity_position`
-   [ ] Integrate with `execute_rebalance`
-   [ ] Integrate with `collect_fees`
-   [ ] Add error handling
-   [ ] Write unit tests
-   [ ] Write integration tests

### Testing Phase

-   [ ] Test on local validator
-   [ ] Test on devnet
-   [ ] Verify position creation
-   [ ] Test rebalancing
-   [ ] Test fee collection
-   [ ] Performance testing

## Next Steps

1. **Immediate**: Research Raydium CLMM program instruction format
2. **Week 1**: Implement basic CPI integration
3. **Week 2**: Test and refine position management
4. **Week 3**: Integrate with rebalance flow
5. **Week 4**: Comprehensive testing

## References

-   [Raydium Documentation](https://docs.raydium.io/)
-   [Raydium SDK GitHub](https://github.com/raydium-io/raydium-sdk)
-   [Solana CPI Guide](https://solanacookbook.com/references/programs.html#how-to-do-cross-program-invocations)
-   [Concentrated Liquidity Concepts](https://docs.uniswap.org/concepts/protocol/concentrated-liquidity)

---

**Status**: Research Phase  
**Last Updated**: Based on current project status  
**Next Review**: After Raydium program research
