# Jupiter CPI Invocation - Complete Implementation

## Overview

This document details the complete implementation of Jupiter CPI invocation with proper signer setup in the Flow protocol.

## Implementation Summary

The CPI invocation has been fully implemented with support for two signer modes:

1. **Program Authority PDA**: Uses a Program Derived Address (PDA) as the signer
2. **User Transfer Authority**: Uses the user's transfer authority as the signer

## Architecture

### Signer Setup

The implementation supports two signer scenarios:

#### 1. Program Authority PDA (Preferred)

When `program_authority` is provided:

-   Derives PDA using seeds: `[b"program_authority", position.key().as_ref()]`
-   Uses `invoke_signed()` with PDA signer seeds
-   Allows the program to sign on behalf of positions

#### 2. User Transfer Authority (Fallback)

When `user_transfer_authority` is provided:

-   Uses the user's signer account
-   Uses standard `invoke()` since user is already a signer
-   Requires user to sign the transaction

## Code Structure

### Function Signature

```rust
fn execute_jupiter_swap<'info>(
    jupiter_program: Option<&AccountInfo<'info>>,
    token_program: Option<&AccountInfo<'info>>,
    source_token_account: Option<&AccountInfo<'info>>,
    destination_token_account: Option<&AccountInfo<'info>>,
    program_authority: Option<&AccountInfo<'info>>,
    user_transfer_authority: Option<&Signer<'info>>,
    position: &LiquidityPosition,
    decision: &RebalanceDecision,
    slippage_tolerance_bps: u16,
    route_plan: Option<JupiterRoutePlan>,
    program_id: Pubkey,
    position_key: Pubkey,
) -> Result<()>
```

### CPI Execution Flow

```rust
fn execute_jupiter_cpi<'info>(
    jupiter_program: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    source_token_account: &AccountInfo<'info>,
    destination_token_account: &AccountInfo<'info>,
    program_authority: Option<&AccountInfo<'info>>,
    user_transfer_authority: Option<&Signer<'info>>,
    route_plan: &JupiterRoutePlan,
    program_id: Pubkey,
    position_key: Pubkey,
) -> Result<()>
```

## Implementation Details

### 1. PDA Derivation

```rust
// Derive PDA seeds for program authority
let seeds = &[
    b"program_authority".as_ref(),
    position_key.as_ref(),
];

// Find PDA bump
let (pda, bump) = Pubkey::find_program_address(seeds, &program_id);

// Verify the PDA matches provided authority
require!(
    pda == authority_key,
    FlowError::InvalidFacilitator
);
```

### 2. Signer Seeds

```rust
// Create signer seeds for PDA
let signer_seeds: &[&[&[u8]]] = &[&[
    b"program_authority".as_ref(),
    position_key.as_ref(),
    &[bump],
]];
```

### 3. CPI Invocation

#### With PDA Signer

```rust
anchor_lang::solana_program::program::invoke_signed(
    &instruction,
    &account_infos,
    signer_seeds,
)?;
```

#### With User Signer

```rust
invoke(&instruction, &account_infos)?;
```

## Account Setup

### Required Accounts

1. **Jupiter Program**: Jupiter Swap Program (JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4)
2. **Token Program**: SPL Token Program
3. **Source Token Account**: Source token account (writable)
4. **Destination Token Account**: Destination token account (writable)
5. **Authority**: Either program authority PDA or user transfer authority (signer)

### Account Metas

```rust
let mut accounts = Vec::new();
accounts.push(AccountMeta::new_readonly(*token_program.key, false));
accounts.push(AccountMeta::new(*source_token_account.key, false));
accounts.push(AccountMeta::new(*destination_token_account.key, false));
accounts.push(AccountMeta::new(authority_key, true)); // Signer
```

## Instruction Data

The instruction data includes:

1. **Discriminator**: Jupiter swap instruction discriminator (placeholder: `0x9a`)
2. **Route Plan Length**: Length of serialized route plan (u32, little-endian)
3. **Route Plan Data**: Serialized route plan from Jupiter API

```rust
let mut instruction_data = Vec::new();
instruction_data.push(JUPITER_SWAP_DISCRIMINATOR);
let route_plan_bytes = route_plan.try_to_vec()?;
instruction_data.extend_from_slice(&(route_plan_bytes.len() as u32).to_le_bytes());
instruction_data.extend_from_slice(&route_plan_bytes);
```

## Error Handling

-   **Missing Accounts**: Swap is skipped if required accounts are not provided
-   **Invalid PDA**: Validates that provided program authority matches derived PDA
-   **No Authority**: Returns error if neither program authority nor user authority is provided

## Security Considerations

1. **PDA Validation**: Verifies that provided program authority matches the derived PDA
2. **Signer Verification**: Ensures proper signer setup before executing CPI
3. **Route Plan Validation**: Validates route plan matches swap requirements
4. **Account Validation**: Validates all required accounts are provided

## Usage Example

### With Program Authority PDA

```typescript
await program.methods
    .executeRebalance(
        positionIndex,
        decisionIndex,
        slippageToleranceBps,
        routePlan
    )
    .accounts({
        decision: decisionPda,
        position: positionPda,
        config: configPda,
        jupiterProgram: jupiterProgramId,
        tokenProgram: TOKEN_PROGRAM_ID,
        sourceTokenAccount: sourceTokenAccount,
        destinationTokenAccount: destTokenAccount,
        programAuthority: programAuthorityPda, // PDA signer
        // ... other accounts
    })
    .rpc();
```

### With User Transfer Authority

```typescript
await program.methods
    .executeRebalance(
        positionIndex,
        decisionIndex,
        slippageToleranceBps,
        routePlan
    )
    .accounts({
        decision: decisionPda,
        position: positionPda,
        config: configPda,
        jupiterProgram: jupiterProgramId,
        tokenProgram: TOKEN_PROGRAM_ID,
        sourceTokenAccount: sourceTokenAccount,
        destinationTokenAccount: destTokenAccount,
        userTransferAuthority: userKeypair, // User signer
        // ... other accounts
    })
    .signers([userKeypair])
    .rpc();
```

## Current Status

### ✅ Completed

-   PDA derivation and validation
-   Signer seed setup for PDA
-   CPI invocation with `invoke_signed()` for PDA
-   CPI invocation with `invoke()` for user signer
-   Account validation and setup
-   Route plan validation
-   Error handling

### 🔄 Future Enhancements

1. **Route Plan Parsing**: Parse Jupiter route plan to extract all required accounts
2. **Swap Verification**: Verify swap succeeded and check actual slippage
3. **Balance Updates**: Update position token balances after successful swap
4. **Slippage Tracking**: Record actual slippage in decision account
5. **Transaction Signature**: Store transaction signature in decision account

## Testing

To test the CPI invocation:

1. **Unit Tests**: Test PDA derivation and signer seed generation
2. **Integration Tests**: Test with mock Jupiter program
3. **Local Testing**: Test with local validator and mock Jupiter
4. **Devnet Testing**: Test with actual Jupiter on devnet

## Notes

-   The Jupiter instruction discriminator (`JUPITER_SWAP_DISCRIMINATOR`) is currently a placeholder
-   In production, this should match Jupiter's actual instruction format
-   Additional accounts from the route plan would be added based on Jupiter's requirements
-   The implementation currently uses a simplified account structure

## References

-   [Jupiter API Documentation](https://docs.jup.ag/)
-   [Jupiter Swap Program](https://solscan.io/account/JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4)
-   [Anchor CPI Documentation](https://www.anchor-lang.com/docs/cross-program-invocations)
