# Jupiter API Integration - Complete Implementation

## Overview

This document details the complete integration of Jupiter's API for route planning and CPI call execution in the Flow protocol.

## Architecture

### Off-Chain Route Planning

Route plans are obtained off-chain from Jupiter's Quote API before being passed to the on-chain program:

```
GET https://quote-api.jup.ag/v6/quote?inputMint={input}&outputMint={output}&amount={amount}
```

### On-Chain CPI Execution

The route plan is passed as instruction data to `execute_rebalance`, which then executes the swap via Jupiter CPI.

## Implementation Details

### Route Plan Structure

```rust
pub struct JupiterRoutePlan {
    pub input_mint: Pubkey,
    pub output_mint: Pubkey,
    pub in_amount: u64,
    pub out_amount: u64,
    pub slippage_bps: u16,
    pub route_data: Vec<u8>, // Serialized route from Jupiter API
}
```

### Instruction Signature

The `execute_rebalance` instruction now accepts an optional `route_plan` parameter:

```rust
pub fn execute_rebalance(
    ctx: Context<ExecuteRebalance>,
    position_index: u8,
    decision_index: u32,
    slippage_tolerance_bps: u16,
    route_plan: Option<JupiterRoutePlan>, // New parameter
) -> Result<()>
```

### CPI Execution Flow

1. **Route Plan Validation**: Validates that the route plan matches the swap requirements
2. **Account Setup**: Prepares all required accounts for Jupiter CPI
3. **Instruction Building**: Constructs Jupiter swap instruction with route plan data
4. **CPI Invocation**: Executes the swap via Cross-Program Invocation

### Key Functions

#### `execute_jupiter_swap()`

Main function that orchestrates the Jupiter swap execution:

-   Validates Jupiter program ID
-   Checks required accounts are provided
-   Calculates swap amount
-   Executes CPI if route plan is provided

#### `execute_jupiter_cpi()`

Builds and prepares the Jupiter CPI instruction:

-   Serializes route plan data
-   Builds account metas
-   Prepares instruction data
-   Handles signer setup (program authority PDA or user)

## Usage Flow

### 1. Off-Chain Route Planning

```typescript
// Get quote from Jupiter API
const quoteResponse = await fetch(
    `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}`
);
const quote = await quoteResponse.json();

// Build route plan
const routePlan: JupiterRoutePlan = {
    inputMint: new PublicKey(inputMint),
    outputMint: new PublicKey(outputMint),
    inAmount: amount,
    outAmount: quote.outAmount,
    slippageBps: slippageToleranceBps,
    routeData: Buffer.from(quote.routePlan, "base64"), // Serialized route
};
```

### 2. On-Chain Execution

```typescript
// Execute rebalance with route plan
await program.methods
    .executeRebalance(
        positionIndex,
        decisionIndex,
        slippageToleranceBps,
        routePlan // Pass route plan as instruction data
    )
    .accounts({
        decision: decisionPda,
        position: positionPda,
        config: configPda,
        jupiterProgram: jupiterProgramId,
        tokenProgram: TOKEN_PROGRAM_ID,
        sourceTokenAccount: sourceTokenAccount,
        destinationTokenAccount: destTokenAccount,
        programAuthority: programAuthorityPda,
        // ... other accounts
    })
    .rpc();
```

## Account Requirements

### Required Accounts (for Jupiter Swap)

-   `jupiter_program`: Jupiter Swap Program (JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4)
-   `token_program`: SPL Token Program
-   `source_token_account`: Source token account (writable)
-   `destination_token_account`: Destination token account (writable)
-   `program_authority`: Program authority PDA (signer) OR
-   `user_transfer_authority`: User transfer authority (signer)

### Optional Accounts

All Jupiter-related accounts are optional. If not provided, the swap will be skipped.

## Route Plan Validation

The implementation validates:

1. Input/output mints match position tokens
2. Input amount matches calculated swap amount
3. Slippage tolerance is within acceptable limits

## Error Handling

-   **Missing Accounts**: Swap is skipped if required accounts are not provided
-   **Invalid Route Plan**: Returns error if route plan doesn't match requirements
-   **Program ID Mismatch**: Validates Jupiter program ID matches expected value

## Current Status

### ✅ Completed

-   Route plan structure definition
-   Instruction parameter addition
-   Account validation
-   Route plan validation
-   CPI instruction building structure
-   Account setup and preparation

### 🔄 In Progress / TODO

-   Complete actual CPI invocation (requires proper signer seed setup)
-   Parse route plan to extract all required accounts
-   Implement slippage verification after swap
-   Add swap result verification
-   Update position balances after successful swap

## Next Steps

1. **Program Authority PDA**: Derive and use program authority PDA for signing CPI
2. **Route Plan Parsing**: Parse Jupiter route plan to extract all required accounts
3. **Complete CPI**: Uncomment and complete the actual `invoke()` call
4. **Swap Verification**: Verify swap succeeded and check actual slippage
5. **Balance Updates**: Update position token balances after successful swap

## Testing

To test the integration:

1. **Unit Tests**: Test route plan validation and account setup
2. **Integration Tests**: Test with mock Jupiter program
3. **Local Testing**: Test with local validator and mock Jupiter
4. **Devnet Testing**: Test with actual Jupiter on devnet

## References

-   [Jupiter API Documentation](https://docs.jup.ag/)
-   [Jupiter Quote API](https://quote-api.jup.ag/v6/quote)
-   [Jupiter Swap Program](https://solscan.io/account/JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4)
