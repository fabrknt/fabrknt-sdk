# Token-2022 Transfer Hooks: Complete Guide

## Table of Contents

- [Overview](#overview)
- [What are Transfer Hooks?](#what-are-transfer-hooks)
- [Case Study: Fragmetric's fragSOL](#case-study-fragmetrics-fragsol)
- [How Transfer Hooks Work](#how-transfer-hooks-work)
- [Security Considerations](#security-considerations)
- [Using Guard with Transfer Hooks](#using-guard-with-transfer-hooks)
- [Best Practices](#best-practices)
- [Resources](#resources)

---

## Overview

**Token-2022** (also known as SPL Token Extensions) is Solana's next-generation token program that introduces powerful extensions to the standard SPL Token functionality. One of the most powerful features is **Transfer Hooks**, which enable custom logic to execute automatically during token transfers.

### Key Features

- **Automatic Execution** - Hooks trigger on every token transfer
- **On-Chain Logic** - Custom programs execute during transfers
- **Composability** - Hooks can interact with other programs
- **State Management** - Maintain complex on-chain state

### Program ID

```
TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
```

---

## What are Transfer Hooks?

Transfer Hooks are Solana programs that execute automatically whenever a token with the Transfer Hook extension is transferred. They enable advanced functionality like:

- **Reward Distribution** - Track balances and distribute rewards
- **Compliance Checks** - Enforce transfer restrictions
- **Fee Collection** - Implement custom fee mechanisms
- **Analytics** - Track token movements on-chain
- **Access Control** - Restrict transfers based on rules

### Architecture

```
Token Transfer Flow (Token-2022 with Transfer Hook):

1. User initiates transfer
   ↓
2. Token-2022 Program validates transfer
   ↓
3. **Transfer Hook Program executes**
   ├─ Updates state
   ├─ Validates conditions
   └─ Performs custom logic
   ↓
4. Transfer completes (or reverts if hook fails)
```

### Extension Structure

A token with Transfer Hook extension includes:

```rust
pub struct TransferHook {
    pub authority: Pubkey,      // Can update hook program
    pub program_id: Pubkey,      // Hook program to execute
}
```

---

## Case Study: Fragmetric's fragSOL

### Overview

**Fragmetric** is Solana's first native liquid restaking protocol that uses Transfer Hooks to implement precise, real-time reward distribution. Their fragSOL token is an excellent example of Transfer Hooks done right.

### Token Details

- **Token Mint**: `FRAGSEthVFL7fdqM8hxfxkfCZzUvmg21cqPJVvC1qdbo`
- **Token Program**: Token-2022 (Token Extensions)
- **Hook Program**: `fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3`
- **Supply**: ~195.77 billion fragSOL (9 decimals)

### Extensions Enabled

fragSOL uses three Token-2022 extensions:

```typescript
// 1. Transfer Hook
{
  authority: "fragSkuEpEmdoj9Bcyawk9rBdsChcVJLWHfj9JX1Gby",
  program_id: "fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3"
}

// 2. Metadata Pointer
{
  authority: "fragSkuEpEmdoj9Bcyawk9rBdsChcVJLWHfj9JX1Gby",
  metadata_address: "FRAGSEthVFL7fdqM8hxfxkfCZzUvmg21cqPJVvC1qdbo" // Self
}

// 3. Metadata
{
  name: "Fragmetric Restaked SOL",
  symbol: "fragSOL",
  uri: "https://quicknode.quicknode-ipfs.com/ipfs/QmcueajXkNzoYRhcCv323PMC8VVGiDvXaaVXkMyYcyUSRw",
  description: "fragSOL is Solana's first native LRT that provides optimized restaking rewards."
}
```

### Use Case: Time-Weighted Reward Distribution

Fragmetric uses Transfer Hooks to solve a critical problem in liquid restaking: **fair reward distribution**.

**Problem**: Traditional liquid staking tokens can't track how long each user held tokens, leading to unfair reward distribution.

**Solution**: Transfer Hooks automatically update contribution records on every transfer.

### On-Chain Analysis: How It Works

Based on analysis of transaction `5gMtBE1wEqJxtt2fDgFid9APqZ2kgR3yVVvxnxC8C2hxKLoTEn1Sc8NQ8iNPBVMcnbEvFS7uRvj64772tJnT6yyt`:

#### Transfer Anatomy

A single fragSOL transfer triggers **6 Transfer Hook invocations**:

```
Transaction Structure:
├─ Instruction 0: Compute Budget
├─ Instruction 1: Create ATA (if needed)
├─ Instruction 2: Create ATA (if needed)
├─ Instruction 3: Transfer Hook - Update sender contribution
├─ Instruction 4: Transfer Hook - Update sender balance
├─ Instruction 5: Transfer Hook - Process swap/DeFi interaction
├─ Instruction 6: Create ATA (if needed)
├─ Instruction 7: Transfer Hook - Update recipient contribution
├─ Instruction 8: Transfer Hook - Update recipient balance
├─ Instruction 9: Transfer Hook - Settlement logic
└─ Instructions 10-13: Additional processing
```

#### Hook Invocation Pattern

Each hook invocation accesses **15-20 accounts**:

```typescript
// Example: Update Contribution Hook
Accounts (17 total):
├─ [writable] User wallet
├─ [writable] Contribution PDA (sender)
├─ [writable] Contribution PDA (recipient)
├─ [writable] Reward pool reserve
├─ [readonly] Token mint
├─ [readonly] Switchboard oracle (price feed)
├─ [readonly] NCN state accounts
└─ ... (10 more accounts)
```

#### State Updates

The Transfer Hook maintains several on-chain accounts:

1. **Contribution Records** - Per-user time-weighted balance
2. **Reward Pool Reserve** - Accumulated NCN rewards
3. **Settlement Accounts** - DeFi protocol integrations
4. **Oracle Accounts** - Price feeds for calculations

### Code Example: Tracking a fragSOL Transfer

```typescript
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const fragSOLMint = new PublicKey("FRAGSEthVFL7fdqM8hxfxkfCZzUvmg21cqPJVvC1qdbo");

// Fetch transaction with Transfer Hook invocations
const signature = "5gMtBE1wEqJxtt2fDgFid9APqZ2kgR3yVVvxnxC8C2hxKLoTEn1Sc8NQ8iNPBVMcnbEvFS7uRvj64772tJnT6yyt";
const tx = await connection.getParsedTransaction(signature, {
  maxSupportedTransactionVersion: 0
});

// Analyze Transfer Hook invocations
const hookInstructions = tx?.transaction.message.instructions.filter(
  ix => ix.programId.toString() === "fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3"
);

console.log(`Transfer Hook invoked ${hookInstructions?.length} times`);
// Output: Transfer Hook invoked 6 times
```

### Gas Efficiency

Despite 6 hook invocations and ~100 account accesses:

- **Transaction Cost**: 0.000005 SOL (~$0.001)
- **Execution Time**: <400ms (single slot)
- **Success Rate**: High (Solana's atomic transactions)

### Key Insights from Fragmetric

1. **Multiple Invocations Are Normal** - 4-6 invocations per transfer for complex logic
2. **Account-Heavy Is Okay** - 15-20 accounts per invocation when optimized
3. **State Management** - Use PDAs efficiently for user data
4. **Address Lookup Tables** - Essential for reducing transaction size
5. **Atomic Execution** - All hooks succeed or transaction reverts

---

## How Transfer Hooks Work

### 1. Token Initialization

Create a token with Transfer Hook extension:

```rust
// Rust (Anchor)
use anchor_spl::token_2022::spl_token_2022;

#[derive(Accounts)]
pub struct InitializeToken<'info> {
    #[account(
        init,
        payer = payer,
        mint::decimals = 9,
        mint::authority = authority,
        extensions::transfer_hook::authority = authority,
        extensions::transfer_hook::program_id = transfer_hook_program.key(),
    )]
    pub mint: Account<'info, Mint>,
    pub transfer_hook_program: Program<'info, TransferHook>,
    // ...
}
```

### 2. Hook Program Structure

Implement the Transfer Hook interface:

```rust
use anchor_lang::prelude::*;
use anchor_spl::token_interface::TransferHook;

#[program]
pub mod my_transfer_hook {
    pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
        // Custom logic here
        msg!("Transfer Hook: {} tokens", amount);

        // Update state
        let user_state = &mut ctx.accounts.user_state;
        user_state.balance = user_state.balance.checked_add(amount).unwrap();
        user_state.last_transfer_time = Clock::get()?.unix_timestamp;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Execute<'info> {
    #[account(mut)]
    pub source: AccountInfo<'info>,
    pub mint: AccountInfo<'info>,
    #[account(mut)]
    pub destination: AccountInfo<'info>,
    pub authority: AccountInfo<'info>,

    // Custom accounts
    #[account(
        mut,
        seeds = [b"user-state", authority.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,
}

#[account]
pub struct UserState {
    pub balance: u64,
    pub last_transfer_time: i64,
}
```

### 3. Transfer Execution

When a user transfers the token:

```typescript
import { createTransferCheckedInstruction } from "@solana/spl-token";

// Token-2022 automatically invokes the Transfer Hook
const transferIx = createTransferCheckedInstruction(
  sourceAccount,
  mint,
  destinationAccount,
  owner,
  amount,
  decimals,
  [],
  TOKEN_2022_PROGRAM_ID
);

// Hook executes automatically - no additional instructions needed!
await sendAndConfirmTransaction(connection, transaction, [owner]);
```

### 4. Hook Invocation Flow

```
Transfer Instruction
       ↓
Token-2022 Program
       ↓
   Validates transfer
       ↓
Calls Transfer Hook Program
       ↓
Hook executes custom logic
       ↓
Hook succeeds → Transfer completes
Hook fails → Entire transaction reverts
```

---

## Security Considerations

### Attack Vectors

Transfer Hooks introduce new security risks:

#### 1. Malicious Hooks

**Risk**: Hook drains funds or modifies state maliciously

```typescript
// BAD: Malicious hook that steals tokens
pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
    // Transfer all tokens to attacker!
    token::transfer(/* ... to attacker wallet ... */)?;
    Ok(())
}
```

**Protection**: Use Guard's Transfer Hook validation

```typescript
import { Guard } from "@fabrknt/sdk";

const guard = new Guard({
  validateTransferHooks: true,
  allowedHookPrograms: [
    "fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3" // Only Fragmetric
  ]
});

const result = await guard.validateTransaction(tx);
if (!result.isValid) {
  console.error("Blocked malicious hook:", result.blockedBy);
}
```

#### 2. Reentrancy Attacks

**Risk**: Hook calls back into token program creating nested transfers

```typescript
// BAD: Reentrancy vulnerability
pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
    // Hook calls transfer again → infinite loop!
    token::transfer_checked(/* ... */)?;
    Ok(())
}
```

**Detection**: Guard detects hooks sandwiched between token operations

#### 3. Gas Bombs

**Risk**: Hook accesses excessive accounts causing transaction failure

```typescript
// BAD: Accessing 100+ accounts
pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
    // Iterate through massive account list
    for account in &ctx.remaining_accounts {
        // ... excessive computation
    }
    Ok(())
}
```

**Protection**: Guard enforces account limits (default: 20)

#### 4. State Manipulation

**Risk**: Hook incorrectly updates balances or accounting

```typescript
// BAD: Incorrect balance tracking
pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
    // Should subtract, but adds!
    user_state.balance += amount; // BUG
    Ok(())
}
```

**Mitigation**: Audit hook programs thoroughly

### Guard Protection Patterns

fabrknt's Guard module detects 4 Transfer Hook attack patterns:

```typescript
// P-105: Malicious Transfer Hook
// Detects: Unknown hook with >10 writable accounts
if (writableAccounts > 10 && !isWhitelisted(hookProgram)) {
  warn("Possible malicious hook");
}

// P-106: Unexpected Hook Execution
// Detects: Hook without accompanying transfer
if (!hasTransferInstruction && accountCount > 10) {
  warn("Hook executing without transfer");
}

// P-107: Hook Reentrancy
// Detects: Hook sandwiched between token ops
if (previousIx.isTokenOp && nextIx.isTokenOp) {
  warn("Possible reentrancy");
}

// P-108: Excessive Hook Accounts
// Detects: Hook accessing too many accounts
if (accountCount > maxAccounts) {
  warn("Excessive account access");
}
```

---

## Using Guard with Transfer Hooks

### Basic Setup

```typescript
import { Guard } from "@fabrknt/sdk";

const guard = new Guard({
  validateTransferHooks: true,      // Enable validation
  maxHookAccounts: 20,               // Based on Fragmetric analysis
  mode: "block"                      // Block suspicious transactions
});
```

### Whitelist Safe Hooks

```typescript
const guard = new Guard({
  validateTransferHooks: true,
  allowedHookPrograms: [
    "fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3",  // Fragmetric
    "YourProtocolHook1111111111111111111111111"    // Your protocol
  ]
});
```

### Validate Before Signing

```typescript
// Build transaction with fragSOL transfer
const tx = new Transaction().add(transferIx);

// Validate before signing
const result = await guard.validateTransaction({
  id: "tx-001",
  status: "pending",
  instructions: tx.instructions.map(ix => ({
    programId: ix.programId.toString(),
    keys: ix.keys.map(k => ({
      pubkey: k.pubkey.toString(),
      isSigner: k.isSigner,
      isWritable: k.isWritable
    })),
    data: ix.data.toString("base64")
  }))
});

if (result.isValid) {
  // Safe to sign and send
  await sendAndConfirmTransaction(connection, tx, [wallet]);
} else {
  console.error("Transaction blocked:", result.warnings);
}
```

### Handle Warnings

```typescript
const result = await guard.validateTransaction(tx);

for (const warning of result.warnings) {
  switch (warning.patternId) {
    case PatternId.MaliciousTransferHook:
      console.error("🚨 CRITICAL: Malicious hook detected");
      // Block transaction
      return;

    case PatternId.ExcessiveHookAccounts:
      console.warn("⚠️ Hook uses many accounts - verify legitimacy");
      // Ask user for confirmation
      break;

    case PatternId.UnexpectedHookExecution:
      console.info("⚡ Alert: Hook without transfer");
      // Log for monitoring
      break;
  }
}
```

---

## Best Practices

### For Token Creators

#### 1. Minimize Hook Complexity

```typescript
// GOOD: Simple, focused hook
pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
    // Single, clear purpose
    update_contribution_record(&mut ctx.accounts.user_state, amount)?;
    Ok(())
}

// BAD: Kitchen sink hook
pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
    update_contribution()?;
    check_compliance()?;
    collect_fees()?;
    update_analytics()?;
    send_notifications()?; // Too much!
    Ok(())
}
```

#### 2. Optimize Account Usage

```typescript
// GOOD: Use PDAs efficiently
#[account(
    mut,
    seeds = [b"contribution", user.key().as_ref()],
    bump
)]
pub user_contribution: Account<'info, Contribution>,

// BAD: Separate account for every field
pub contribution_amount: Account<'info, ContributionAmount>,
pub contribution_time: Account<'info, ContributionTime>,
pub contribution_index: Account<'info, ContributionIndex>,
// Use a single account with multiple fields!
```

#### 3. Use Address Lookup Tables

```typescript
// For hooks with >10 accounts, use ALTs
const lookupTable = await connection.getAddressLookupTable(lutAddress);

const message = new TransactionMessage({
  payerKey: payer.publicKey,
  recentBlockhash: blockhash,
  instructions: [transferIx]
}).compileToV0Message([lookupTable.value]);
```

#### 4. Implement Upgrade Authority

```typescript
// Allow hook program updates
pub struct TransferHook {
    pub authority: Pubkey,      // Can update program
    pub program_id: Pubkey,
}

// Update hook if bugs found
pub fn update_hook_program(
    ctx: Context<UpdateHook>,
    new_program: Pubkey
) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.authority.key(),
        ctx.accounts.hook.authority
    );
    ctx.accounts.hook.program_id = new_program;
    Ok(())
}
```

### For Developers Using Tokens with Hooks

#### 1. Always Validate Before Transfer

```typescript
// ALWAYS check for Transfer Hooks
const mintInfo = await getMint(
  connection,
  mintAddress,
  'confirmed',
  TOKEN_2022_PROGRAM_ID
);

const transferHookExtension = getTransferHook(mintInfo);

if (transferHookExtension) {
  console.log("Token has Transfer Hook:", transferHookExtension.programId);
  // Use Guard to validate
  await guard.validateTransaction(tx);
}
```

#### 2. Handle Hook Failures Gracefully

```typescript
try {
  await sendAndConfirmTransaction(connection, tx, [wallet]);
} catch (error) {
  if (error.message.includes("custom program error: 0x1")) {
    console.error("Transfer Hook rejected transaction");
    // Show user-friendly error
  }
}
```

#### 3. Whitelist Known Safe Protocols

```typescript
const SAFE_HOOKS = {
  fragmetric: "fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3",
  // Add others as verified
};

function isHookSafe(programId: string): boolean {
  return Object.values(SAFE_HOOKS).includes(programId);
}
```

#### 4. Monitor Hook Performance

```typescript
const startTime = Date.now();

await sendAndConfirmTransaction(connection, tx, [wallet]);

const duration = Date.now() - startTime;

if (duration > 5000) {
  console.warn("Transfer Hook took", duration, "ms - unusually slow");
}
```

### For Protocol Integrators

#### 1. Document Your Hook Behavior

```markdown
## Our Transfer Hook

**Purpose**: Time-weighted reward distribution
**Accounts Used**: ~17 per invocation
**Invocations per Transfer**: 4-6
**Gas Cost**: ~5,000 lamports
**Failure Modes**: Reverts if contribution PDA not initialized
```

#### 2. Provide SDKs

```typescript
// Provide helper for your protocol
export async function transferFragSOL(
  connection: Connection,
  from: Keypair,
  to: PublicKey,
  amount: number
) {
  // Handle hook initialization automatically
  const contributionPDA = await getOrCreateContributionPDA(from.publicKey);

  // Build transfer with all required accounts
  const tx = await buildFragSOLTransfer(from, to, amount, contributionPDA);

  return sendAndConfirmTransaction(connection, tx, [from]);
}
```

#### 3. Audit Regularly

```bash
# Get your hook program audited
solana-verify verify-from-repo \
  --program-id fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3 \
  https://github.com/fragmetric/transfer-hook
```

---

## Resources

### Official Documentation

- [Solana Token-2022 Guide](https://spl.solana.com/token-2022)
- [Transfer Hook Extension](https://spl.solana.com/token-2022/extensions#transfer-hook)
- [Anchor Transfer Hook Example](https://github.com/solana-developers/program-examples/tree/main/tokens/token-2022/transfer-hook)

### Tools & Libraries

- **fabrknt Guard** - Transfer Hook security validation
- **@solana/spl-token** - Token-2022 TypeScript SDK
- **Anchor Framework** - Solana program development

### Real-World Examples

- **Fragmetric** ([docs](https://docs.fragmetric.xyz))
  - Token: `FRAGSEthVFL7fdqM8hxfxkfCZzUvmg21cqPJVvC1qdbo`
  - Hook: `fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3`
  - Use Case: Time-weighted reward distribution

### Community

- [Solana StackExchange](https://solana.stackexchange.com/questions/tagged/spl-token)
- [Solana Discord](https://discord.gg/solana) - #developer-support

---

## Conclusion

Transfer Hooks are a powerful Token-2022 feature that enables sophisticated on-chain logic. Fragmetric's fragSOL demonstrates how to use them effectively for real-time reward distribution while maintaining security and efficiency.

**Key Takeaways**:

1. ✅ Transfer Hooks enable automatic execution during transfers
2. ✅ Multiple invocations (4-6) are normal for complex logic
3. ✅ Use Guard to protect against malicious hooks
4. ✅ Optimize for account usage and gas efficiency
5. ✅ Audit thoroughly before mainnet deployment

Start building with Transfer Hooks today, and use fabrknt's Guard to ensure your users are protected!
