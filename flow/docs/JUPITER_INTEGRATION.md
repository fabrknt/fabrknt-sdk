# Jupiter Swap Integration Plan

## Overview

Jupiter is Solana's leading DEX aggregator that routes trades through multiple liquidity sources (including Raydium, Orca, etc.) to provide optimal price execution. This document outlines the integration strategy for Flow.

## Key Resources

-   **Jupiter Swap API**: https://station.jup.ag/docs/apis/swap-api
-   **Jupiter SDK**: `@jupiter-ag/api` (TypeScript/JavaScript)
-   **Program ID**: `JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4` (Jupiter v6)
-   **GitHub**: https://github.com/jup-ag/jupiter-core

## Integration Architecture

### Two Approaches

#### Approach 1: Off-Chain Quote + On-Chain Execution (Recommended)

**Flow**:

1. AI service calls Jupiter Quote API (off-chain) to get swap quote
2. AI service calls `create_rebalance_decision` with swap parameters
3. Smart contract executes swap via CPI to Jupiter program
4. Jupiter routes through optimal DEX path

**Pros**:

-   Can use Jupiter's quote API for optimal routing
-   More flexible routing options
-   Better price discovery

**Cons**:

-   Requires off-chain component (AI service)
-   Two-step process

#### Approach 2: Direct CPI to Jupiter Program

**Flow**:

1. Smart contract directly invokes Jupiter program via CPI
2. Jupiter handles routing internally

**Pros**:

-   Fully on-chain
-   Single transaction

**Cons**:

-   Less control over routing
-   May need to handle quote separately

## Implementation Strategy

### Phase 1: Basic Swap Integration

#### 1.1 Add Jupiter Dependencies

```toml
# programs/flow/Cargo.toml
[dependencies]
anchor-lang = "0.32.1"
anchor-spl = "0.32.1"
# Jupiter program interface (if available as crate)
# Otherwise, we'll use CPI with instruction data
```

#### 1.2 Create Swap Helper Function

```rust
// programs/flow/src/lib.rs

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

/// Jupiter Swap Program ID (v6)
pub const JUPITER_PROGRAM_ID: &str = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";

/// Execute a swap via Jupiter
pub fn execute_jupiter_swap(
    ctx: Context<JupiterSwapContext>,
    amount_in: u64,
    min_amount_out: u64,
    // Additional Jupiter parameters
) -> Result<()> {
    // CPI to Jupiter program
    // This will need to be implemented based on Jupiter's instruction format
    // Jupiter v6 uses a specific instruction format

    msg!("Executing Jupiter swap: {} -> min {}", amount_in, min_amount_out);

    // TODO: Implement CPI call to Jupiter
    // This requires understanding Jupiter's instruction structure

    Ok(())
}
```

#### 1.3 Research Jupiter Instruction Format

**Key Questions**:

-   What is Jupiter v6's instruction format?
-   What accounts are required for CPI?
-   How to pass swap parameters?
-   How to handle slippage?

**Action Items**:

-   [ ] Review Jupiter program source code
-   [ ] Test CPI call structure
-   [ ] Document instruction format
-   [ ] Create test cases

### Phase 2: Integration with Rebalance Flow

#### 2.1 Modify `execute_rebalance` Instruction

```rust
pub fn execute_rebalance(
    ctx: Context<ExecuteRebalance>,
    position_index: u8,
    decision_index: u32,
    slippage_tolerance_bps: u16,
) -> Result<()> {
    // ... existing validation ...

    // If rebalance requires swaps, execute via Jupiter
    if requires_swap {
        execute_jupiter_swap(
            // ... swap context ...
            amount_in,
            min_amount_out,
        )?;
    }

    // Update position ranges
    // ... existing logic ...

    Ok(())
}
```

#### 2.2 Swap Context Structure

```rust
#[derive(Accounts)]
pub struct JupiterSwapContext<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub token_in_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub token_out_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,

    /// CHECK: Jupiter program
    pub jupiter_program: UncheckedAccount<'info>,

    // Additional accounts required by Jupiter
    // (to be determined based on Jupiter's requirements)
}
```

### Phase 3: Advanced Features

#### 3.1 Multi-Hop Swaps

-   Support for complex routing paths
-   Handle wrapped SOL (WSOL) conversions
-   Optimize for gas costs

#### 3.2 Slippage Protection

-   Validate minimum output amounts
-   Revert if slippage exceeds tolerance
-   Log slippage events

#### 3.3 Error Handling

-   Handle Jupiter program errors
-   Provide meaningful error messages
-   Retry logic for transient failures

## Testing Strategy

### Unit Tests

-   Test swap helper functions
-   Mock Jupiter program responses
-   Test error conditions

### Integration Tests

-   Test with Jupiter on devnet
-   Verify swap execution
-   Test slippage protection
-   Test multi-hop swaps

### Test Cases

```typescript
describe("Jupiter Integration", () => {
    it("Executes simple swap successfully", async () => {
        // Test basic swap
    });

    it("Handles slippage correctly", async () => {
        // Test slippage protection
    });

    it("Fails if minimum output not met", async () => {
        // Test slippage failure
    });

    it("Executes multi-hop swap", async () => {
        // Test complex routing
    });
});
```

## Implementation Checklist

### Research Phase

-   [ ] Review Jupiter v6 program source code
-   [ ] Understand Jupiter instruction format
-   [ ] Document required accounts for CPI
-   [ ] Test CPI call structure on devnet
-   [ ] Review Jupiter SDK for reference

### Development Phase

-   [ ] Add Jupiter program ID constant
-   [ ] Create swap helper function
-   [ ] Implement CPI call to Jupiter
-   [ ] Add slippage validation
-   [ ] Integrate with `execute_rebalance`
-   [ ] Add error handling
-   [ ] Write unit tests
-   [ ] Write integration tests

### Testing Phase

-   [ ] Test on local validator
-   [ ] Test on devnet
-   [ ] Verify swap execution
-   [ ] Test error conditions
-   [ ] Performance testing

## Key Considerations

### 1. Jupiter Program Updates

-   Jupiter may update their program
-   Need to handle version changes
-   Consider program upgrade path

### 2. Compute Units

-   Swaps consume compute units
-   May need to optimize or split transactions
-   Monitor CU usage

### 3. Token Accounts

-   Need proper token account setup
-   Handle wrapped SOL conversions
-   Manage token account ownership

### 4. Price Impact

-   Large swaps may have significant price impact
-   Consider splitting large swaps
-   Monitor price impact

### 5. Routing

-   Jupiter handles routing automatically
-   May route through multiple DEXs
-   Trust Jupiter's routing logic

## Alternative: Using Jupiter SDK (Off-Chain)

If CPI integration proves complex, we can use Jupiter SDK off-chain:

```typescript
// Off-chain component (AI service)
import { Jupiter } from "@jupiter-ag/api";

const jupiter = new Jupiter({
    connection: connection,
    cluster: "devnet",
});

// Get quote
const quote = await jupiter.getQuote({
    inputMint: tokenA,
    outputMint: tokenB,
    amount: amountIn,
    slippageBps: slippageBps,
});

// Execute swap
const swapTransaction = await jupiter.exchange({
    quoteResponse: quote,
    userPublicKey: userPubkey,
});

// Send transaction
await sendTransaction(swapTransaction);
```

**Trade-off**: This requires off-chain component but may be simpler initially.

## Next Steps

1. **Immediate**: Research Jupiter v6 program instruction format
2. **Week 1**: Implement basic CPI integration
3. **Week 2**: Test and refine swap execution
4. **Week 3**: Integrate with rebalance flow
5. **Week 4**: Comprehensive testing

## References

-   [Jupiter API Documentation](https://station.jup.ag/docs/apis/swap-api)
-   [Jupiter GitHub](https://github.com/jup-ag/jupiter-core)
-   [Solana CPI Guide](https://solanacookbook.com/references/programs.html#how-to-do-cross-program-invocations)
-   [Anchor CPI Guide](https://www.anchor-lang.com/docs/cross-program-invocations)

---

**Status**: Research Phase  
**Last Updated**: Based on current project status  
**Next Review**: After Jupiter program research
