# Jupiter Instruction Format Research

**Status**: In Progress  
**Date**: 2025-01-XX  
**Priority**: Critical - Required for CPI integration

## Executive Summary

After researching Jupiter v6's architecture, **Jupiter does NOT expose a simple CPI instruction interface**. Instead, Jupiter uses a **transaction-based API** where:

1. Off-chain service calls Jupiter's Quote API to get optimal route
2. Off-chain service calls Jupiter's Swap API to get a complete transaction
3. Transaction is executed (either off-chain or on-chain)

**Key Finding**: Direct CPI to Jupiter requires understanding their internal instruction structure, which is not publicly documented for program-to-program calls.

---

## Jupiter v6 Architecture

### Program ID

-   **Jupiter v6 Program**: `JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4`

### API Endpoints

#### 1. Quote API

```
GET https://quote-api.jup.ag/v6/quote
```

Returns optimal swap route with:

-   Input/output amounts
-   Route plan (array of swap steps)
-   Price impact
-   Platform fees

#### 2. Swap API

```
POST https://quote-api.jup.ag/v6/swap
```

Returns a complete Solana transaction ready to execute.

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

**Response**:

```json
{
    "swapTransaction": "<base64 encoded transaction>",
    "lastValidBlockHeight": 123456,
    "prioritizationFeeLamports": 0
}
```

---

## Integration Approaches

### Approach 1: Off-Chain Transaction Building (Recommended for MVP)

**Flow**:

1. AI service calls Jupiter Quote API
2. AI service calls Jupiter Swap API to get transaction
3. AI service includes transaction in `create_rebalance_decision` instruction data
4. Smart contract executes the transaction (or user signs and executes)

**Pros**:

-   ✅ Uses Jupiter's optimal routing
-   ✅ Handles all complexity (wrapped SOL, compute units, etc.)
-   ✅ Well-documented API
-   ✅ No need to understand internal instruction format

**Cons**:

-   ⚠️ Requires off-chain component
-   ⚠️ Transaction must be executed separately (not pure CPI)

**Implementation**:

```typescript
// Off-chain (AI service)
const quote = await fetch(`https://quote-api.jup.ag/v6/quote?${params}`);
const quoteData = await quote.json();

const swapResponse = await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey: userPubkey.toString(),
        wrapAndUnwrapSol: true,
    }),
});
const { swapTransaction } = await swapResponse.json();

// Include swapTransaction in rebalance decision
```

---

### Approach 2: Direct CPI (Requires Research)

**Challenge**: Jupiter's internal instruction format is not publicly documented for CPI usage.

**What We Need to Find**:

1. Instruction discriminator byte(s)
2. Instruction data structure (how route plan is serialized)
3. Required accounts and their ordering
4. Signer requirements

**Research Sources**:

-   [ ] Jupiter GitHub: https://github.com/jup-ag/jupiter-core
-   [ ] Jupiter program IDL (if published)
-   [ ] Example CPI implementations from other projects
-   [ ] Jupiter program source code analysis

**Hypothetical Structure** (needs verification):

```rust
// This is a PLACEHOLDER - needs actual research
pub struct JupiterSwapInstruction {
    pub discriminator: u8,  // Unknown - needs research
    pub route_plan: Vec<u8>, // Serialized route plan
    pub min_amount_out: u64,
    // ... other fields
}
```

---

### Approach 3: Hybrid - Transaction Parsing

**Flow**:

1. Off-chain service gets transaction from Jupiter Swap API
2. Parse transaction to extract instruction
3. Include instruction in smart contract
4. Smart contract executes instruction via CPI

**Pros**:

-   ✅ Uses Jupiter's routing
-   ✅ Can be done via CPI
-   ✅ No need to understand full instruction format upfront

**Cons**:

-   ⚠️ Requires transaction parsing logic
-   ⚠️ More complex implementation

---

## Current Implementation Status

### What We Have

-   ✅ Jupiter program ID constant
-   ✅ Placeholder instruction discriminator (`0x9a`)
-   ✅ Basic CPI structure in `execute_jupiter_cpi`
-   ✅ Route plan data structure (`JupiterRoutePlan`)
-   ✅ Account setup for CPI

### What We Need

-   ❌ Actual instruction discriminator
-   ❌ Exact instruction data serialization format
-   ❌ Complete account list and ordering
-   ❌ Signer seed requirements
-   ❌ Error handling for Jupiter-specific errors

---

## Research Action Items

### Immediate (This Week)

1. **Examine Jupiter GitHub Repository**

    - [ ] Clone https://github.com/jup-ag/jupiter-core
    - [ ] Find instruction definitions
    - [ ] Look for IDL files
    - [ ] Find CPI examples

2. **Search for CPI Examples**

    - [ ] Search GitHub for "Jupiter CPI" examples
    - [ ] Look for other Solana programs using Jupiter
    - [ ] Check Solana program examples

3. **Contact Jupiter Team** (if needed)
    - [ ] Check if they have CPI documentation
    - [ ] Ask about program-to-program integration
    - [ ] Request IDL or instruction format docs

### Alternative: Use Transaction-Based Approach

If CPI research proves difficult:

-   [ ] Implement off-chain transaction building
-   [ ] Store transaction in rebalance decision
-   [ ] Execute transaction separately
-   [ ] Document this as the primary integration method

---

## Recommended Next Steps

### Option A: Continue CPI Research (1-2 days)

1. Clone Jupiter repository
2. Analyze instruction format
3. Document findings
4. Update code with correct format
5. Test on devnet

### Option B: Implement Transaction-Based Approach (2-3 days)

1. Create off-chain service for Jupiter API calls
2. Modify `create_rebalance_decision` to accept transaction
3. Implement transaction execution flow
4. Test end-to-end

### Option C: Hybrid Approach (3-4 days)

1. Implement transaction-based for MVP
2. Continue CPI research in parallel
3. Migrate to CPI once format is understood

---

## References

-   [Jupiter Swap API Docs](https://station.jup.ag/docs/apis/swap-api)
-   [Jupiter GitHub](https://github.com/jup-ag/jupiter-core)
-   [Solana CPI Guide](https://solanacookbook.com/references/programs.html#how-to-do-cross-program-invocations)
-   [Anchor CPI Guide](https://www.anchor-lang.com/docs/cross-program-invocations)

---

## Conclusion

**Current Recommendation**: Start with **Approach 1 (Transaction-Based)** for MVP, while continuing research on **Approach 2 (Direct CPI)** for future optimization.

**Rationale**:

-   Transaction-based approach is well-documented and proven
-   Can be implemented immediately
-   CPI approach requires significant research
-   Can migrate to CPI later without breaking changes

---

**Status**: Research Phase  
**Next Review**: After examining Jupiter repository  
**Last Updated**: 2025-01-XX
