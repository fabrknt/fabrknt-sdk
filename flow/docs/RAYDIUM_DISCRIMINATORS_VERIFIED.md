# Raydium CLMM Instruction Discriminators - Verified

**Date**: January 2025  
**Status**: ✅ Verified and Updated

## Discriminator Format

Raydium CLMM uses **Anchor framework** discriminators, which are calculated as:

-   First 8 bytes of `SHA256("global:instruction_name")`

## Verified Discriminators

### 1. OpenPosition

-   **Instruction Name**: `open_position`
-   **Discriminator**: `[0x87, 0x80, 0x2f, 0x4d, 0x0f, 0x98, 0xf0, 0x31]`
-   **Calculation**: `SHA256("global:open_position")[0:8]`
-   **Constant**: `RAYDIUM_OPEN_POSITION_DISCRIMINATOR`

### 2. IncreaseLiquidity

-   **Instruction Name**: `increase_liquidity`
-   **Discriminator**: `[0x2e, 0x9c, 0xf3, 0x76, 0x0d, 0xcd, 0xfb, 0xb2]`
-   **Calculation**: `SHA256("global:increase_liquidity")[0:8]`
-   **Constant**: `RAYDIUM_INCREASE_LIQUIDITY_DISCRIMINATOR`

### 3. DecreaseLiquidity

-   **Instruction Name**: `decrease_liquidity`
-   **Discriminator**: `[0xa0, 0x26, 0xd0, 0x6f, 0x68, 0x5b, 0x2c, 0x01]`
-   **Calculation**: `SHA256("global:decrease_liquidity")[0:8]`
-   **Constant**: `RAYDIUM_DECREASE_LIQUIDITY_DISCRIMINATOR`

### 4. Collect

-   **Instruction Name**: `collect`
-   **Discriminator**: `[0xd0, 0x2f, 0xc2, 0x9b, 0x11, 0x62, 0x52, 0xec]`
-   **Calculation**: `SHA256("global:collect")[0:8]`
-   **Constant**: `RAYDIUM_COLLECT_DISCRIMINATOR`

## Verification Method

Discriminators were calculated using Python:

```python
import hashlib

def anchor_discriminator(instruction_name):
    hash_input = f'global:{instruction_name}'.encode('utf-8')
    hash_result = hashlib.sha256(hash_input).digest()
    return hash_result[:8]

instructions = ['open_position', 'increase_liquidity', 'decrease_liquidity', 'collect']
for inst in instructions:
    disc = anchor_discriminator(inst)
    print(f'{inst}: {[hex(b) for b in disc]}')
```

## Implementation

All discriminators are now defined as constants in `programs/flow/src/lib.rs`:

```rust
// RAYDIUM CLMM INSTRUCTION DISCRIMINATORS
const RAYDIUM_OPEN_POSITION_DISCRIMINATOR: [u8; 8] = [0x87, 0x80, 0x2f, 0x4d, 0x0f, 0x98, 0xf0, 0x31];
const RAYDIUM_INCREASE_LIQUIDITY_DISCRIMINATOR: [u8; 8] = [0x2e, 0x9c, 0xf3, 0x76, 0x0d, 0xcd, 0xfb, 0xb2];
const RAYDIUM_DECREASE_LIQUIDITY_DISCRIMINATOR: [u8; 8] = [0xa0, 0x26, 0xd0, 0x6f, 0x68, 0x5b, 0x2c, 0x01];
const RAYDIUM_COLLECT_DISCRIMINATOR: [u8; 8] = [0xd0, 0x2f, 0xc2, 0x9b, 0x11, 0x62, 0x52, 0xec];
```

## Changes Made

1. ✅ Replaced placeholder single-byte discriminators (`0x01`, `0x02`, `0x03`, `0x04`) with correct 8-byte Anchor discriminators
2. ✅ Updated instruction data building to use 8-byte discriminators
3. ✅ Added constants for all discriminators with documentation
4. ✅ Updated instruction data capacity calculations

## Verification Status

-   ✅ Discriminators calculated using Anchor standard formula
-   ✅ All 4 CPI functions updated with correct discriminators
-   ✅ Code compiles successfully
-   ⚠️ **Note**: Final verification requires testing on devnet with actual Raydium CLMM program

## Next Steps

1. **Test on Devnet**: Verify discriminators work correctly with actual Raydium CLMM program
2. **Cross-reference**: If possible, verify against Raydium's published IDL
3. **Monitor**: Watch for any errors during CPI execution that might indicate incorrect discriminators

---

**Status**: Verified (Pending Devnet Testing)  
**Last Updated**: January 2025
