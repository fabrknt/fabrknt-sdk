# Transfer Hook Security Patterns

A practical guide to securing Token-2022 Transfer Hook implementations, based on analysis of Fragmetric and other protocols.

---

## Table of Contents

- [Quick Reference](#quick-reference)
- [Detection Patterns](#detection-patterns)
- [Attack Scenarios](#attack-scenarios)
- [Safe Implementation Checklist](#safe-implementation-checklist)
- [Integration Guide](#integration-guide)

---

## Quick Reference

### Pattern Summary

| Pattern ID | Name | Severity | Description |
|------------|------|----------|-------------|
| P-105 | Malicious Transfer Hook | 🔴 Critical | Unknown hook with excessive writable accounts |
| P-106 | Unexpected Hook Execution | ⚡ Alert | Hook invoked without token transfer |
| P-107 | Hook Reentrancy | 🔴 Critical | Hook calling back into token program |
| P-108 | Excessive Hook Accounts | ⚠️ Warning | Hook accessing too many accounts |

### Safe Limits (Based on Fragmetric Analysis)

```typescript
const SAFE_LIMITS = {
  maxHookInvocations: 6,        // Per transaction
  maxAccountsPerHook: 20,       // Per invocation
  maxWritableAccounts: 10,      // Per invocation
  maxGasCost: 200_000,          // Compute units
  maxTransactionSize: 1232,     // Bytes (with ALT)
};
```

---

## Detection Patterns

### P-105: Malicious Transfer Hook

**Threat Model**: Attacker creates token with malicious hook that drains funds

#### Detection Logic

```typescript
function detectMaliciousHook(
  instruction: Instruction,
  config: Config
): boolean {
  const writableAccounts = instruction.keys.filter(k => k.isWritable).length;
  const totalAccounts = instruction.keys.length;

  // Red flags
  const tooManyWritable = writableAccounts > 10;
  const tooManyTotal = totalAccounts > 15;
  const notWhitelisted = !isKnownSafe(instruction.programId, config);

  return tooManyWritable && tooManyTotal && notWhitelisted;
}
```

#### Real-World Example

```typescript
// ✅ SAFE: Fragmetric fragSOL
Hook Program: fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3
Writable Accounts: 8-10
Total Accounts: 15-17
Status: Whitelisted

// ❌ UNSAFE: Unknown malicious hook
Hook Program: MaliciousHook111111111111111111111111111
Writable Accounts: 20
Total Accounts: 30
Status: Not whitelisted → BLOCKED
```

#### Mitigation

```typescript
// Use Guard with whitelist
const guard = new Guard({
  validateTransferHooks: true,
  allowedHookPrograms: [
    "fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3"
  ]
});

const result = await guard.validateTransaction(tx);
// Blocks unknown hooks automatically
```

---

### P-106: Unexpected Hook Execution

**Threat Model**: Hook executes without legitimate token transfer to exploit context

#### Detection Logic

```typescript
function detectUnexpectedHook(
  hookInstruction: Instruction,
  allInstructions: Instruction[]
): boolean {
  const accountCount = hookInstruction.keys.length;

  // Check for token transfer in transaction
  const hasTransfer = allInstructions.some(ix =>
    isTokenProgram(ix.programId) &&
    (isTransfer(ix) || isTransferChecked(ix))
  );

  // Suspicious if hook has many accounts but no transfer
  return accountCount > 10 && !hasTransfer;
}
```

#### Attack Scenario

```typescript
// Attacker transaction (suspicious)
Transaction {
  instructions: [
    // No token transfer!
    { program: "MaliciousHook...", accounts: [/* 15 accounts */] }
  ]
}

// Why is hook executing without transfer?
// Possible exploitation of hook program's authority
```

#### Safe Pattern

```typescript
// Normal transaction (safe)
Transaction {
  instructions: [
    // 1. Token transfer
    { program: "TokenzQd...", ix: "TransferChecked" },
    // 2. Hook executes (legitimate)
    { program: "fragnAis7...", accounts: [/* 17 accounts */] }
  ]
}
```

---

### P-107: Hook Reentrancy

**Threat Model**: Hook calls back into token program creating nested execution

#### Detection Logic

```typescript
function detectReentrancy(
  instructions: Instruction[],
  currentIndex: number,
  programId: string
): boolean {
  const prev = instructions[currentIndex - 1];
  const current = instructions[currentIndex];
  const next = instructions[currentIndex + 1];

  // Pattern 1: Hook sandwiched between token ops
  const sandwiched =
    isTokenProgram(prev?.programId) &&
    !isTokenProgram(current.programId) &&
    isTokenProgram(next?.programId);

  // Pattern 2: Same hook invoked too many times
  const invocations = instructions.filter(
    ix => ix.programId === programId
  ).length;
  const tooManyInvocations = invocations > 6;

  return sandwiched || tooManyInvocations;
}
```

#### Attack Example

```typescript
// ❌ REENTRANCY ATTACK
Transaction {
  instructions: [
    { program: "Token", ix: "Transfer" },          // 1
    { program: "MaliciousHook", /* ... */ },       // 2 - Hook executes
    { program: "Token", ix: "Transfer" },          // 3 - Hook calls transfer again!
    { program: "MaliciousHook", /* ... */ },       // 4 - Hook re-enters
    // Infinite loop or double-spend
  ]
}
```

#### Safe Pattern (Fragmetric)

```typescript
// ✅ SAFE: Multiple hooks for different purposes
Transaction {
  instructions: [
    { program: "Token-2022", ix: "TransferChecked" },
    { program: "Fragmetric", ix: "UpdateSenderContribution" },    // Hook 1
    { program: "Fragmetric", ix: "UpdateSenderBalance" },         // Hook 2
    { program: "Fragmetric", ix: "ProcessSwap" },                 // Hook 3
    { program: "Fragmetric", ix: "UpdateRecipientContribution" }, // Hook 4
    { program: "Fragmetric", ix: "UpdateRecipientBalance" },      // Hook 5
    { program: "Fragmetric", ix: "Settlement" },                  // Hook 6
    // Not reentrancy - these are sequential state updates
  ]
}
```

#### Key Difference

- **Reentrancy**: Hook → Token → Hook (nested)
- **Sequential**: Hook → Hook → Hook (different purposes)

---

### P-108: Excessive Hook Accounts

**Threat Model**: Hook accesses excessive accounts causing gas bomb or suspicious behavior

#### Detection Logic

```typescript
function detectExcessiveAccounts(
  instruction: Instruction,
  maxAccounts: number = 20
): boolean {
  return instruction.keys.length > maxAccounts;
}
```

#### Analysis: Why 20 Accounts?

Based on Fragmetric's production usage:

```
Average fragSOL transfer:
├─ Hook invocations: 4-6
├─ Accounts per hook: 15-17
├─ Total unique accounts: ~50-60
├─ With ALT compression: Fits in 1232 bytes
└─ Gas cost: 5,000-10,000 lamports

Limit rationale:
- 20 accounts = comfortable headroom above 17
- Prevents gas bombs (100+ account attacks)
- Still efficient with Address Lookup Tables
```

#### Real-World Benchmarks

```typescript
// Protocol: Accounts per Hook
const benchmarks = {
  fragmetric: 17,        // ✅ Efficient
  theoretical_max: 20,   // ✅ Acceptable
  suspicious: 30,        // ⚠️ Warning
  attack: 100,           // 🚨 Likely malicious
};
```

---

## Attack Scenarios

### Scenario 1: The Drain Hook

**Attack**: Malicious token with hook that steals funds

```rust
// Malicious hook program
pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
    // Looks innocent but...
    let user_balance = ctx.accounts.source_account.amount;

    // Drains ALL tokens to attacker!
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.source_account.to_account_info(),
                to: ctx.accounts.attacker_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        user_balance, // Steal everything
    )?;

    Ok(())
}
```

**Protection**:

```typescript
const guard = new Guard({
  validateTransferHooks: true,
  allowedHookPrograms: [/* only known safe hooks */]
});

// Blocks unknown hooks
const result = await guard.validateTransaction(tx);
// result.isValid = false
// result.blockedBy = [PatternId.MaliciousTransferHook]
```

### Scenario 2: The Reentrancy Exploit

**Attack**: Hook calls transfer again creating double-spend

```rust
pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
    // First update (legitimate)
    update_balance(&mut ctx.accounts.user_state, amount)?;

    // Then re-enter! (malicious)
    token::transfer_checked(
        CpiContext::new(/* ... */),
        amount, // Transfer again!
        decimals
    )?;

    // User's balance updated twice but only transferred once
    Ok(())
}
```

**Protection**:

```typescript
// Guard detects hook sandwiched between token ops
// Pattern: Token → Hook → Token (suspicious)
const result = await guard.validateTransaction(tx);
// result.warnings includes HookReentrancy
```

### Scenario 3: The Gas Bomb

**Attack**: Hook with excessive accounts causes transaction failure

```rust
pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
    // Access 100+ accounts
    for i in 0..100 {
        let account = &ctx.remaining_accounts[i];
        // Consumes excessive compute units
        process_account(account)?;
    }
    Ok(())
}
```

**Effect**:

- Transaction exceeds 1.4M compute unit limit
- User loses SOL to failed transaction fees
- DoS attack on token usability

**Protection**:

```typescript
const guard = new Guard({
  maxHookAccounts: 20 // Enforced limit
});

// Warns if hook accesses >20 accounts
const result = await guard.validateTransaction(tx);
// result.warnings includes ExcessiveHookAccounts
```

---

## Safe Implementation Checklist

### For Token Creators

- [ ] **Audit hook program** - Get professional security audit
- [ ] **Minimize complexity** - Keep hook logic simple and focused
- [ ] **Limit account access** - Use ≤20 accounts per invocation
- [ ] **Implement upgrade path** - Allow hook program updates
- [ ] **Document behavior** - Clear docs on hook purpose and effects
- [ ] **Test thoroughly** - Extensive devnet testing
- [ ] **Monitor gas costs** - Ensure reasonable compute usage
- [ ] **Publish source code** - Open source for verification

### For Developers

- [ ] **Use Guard validation** - Always validate before signing
- [ ] **Whitelist known hooks** - Only interact with verified protocols
- [ ] **Handle hook failures** - Graceful error handling
- [ ] **Monitor performance** - Track transaction times
- [ ] **Test edge cases** - Failed hooks, missing accounts, etc.
- [ ] **User warnings** - Alert users about unknown hooks
- [ ] **Fetch hook info** - Check mint extensions before transfer
- [ ] **Update whitelists** - Keep safe hook list current

### For Protocol Integrators

- [ ] **Provide SDK** - Helper functions for your token
- [ ] **Document requirements** - Account initialization steps
- [ ] **Gas optimization** - Use Address Lookup Tables
- [ ] **Error messages** - Clear failure reasons
- [ ] **Monitoring** - Track hook execution metrics
- [ ] **Versioning** - Support hook program upgrades
- [ ] **Community support** - Developer documentation
- [ ] **Security updates** - Prompt vulnerability patches

---

## Integration Guide

### Step 1: Detect Transfer Hooks

```typescript
import { getMint, getTransferHook } from "@solana/spl-token";

async function checkForHooks(mintAddress: PublicKey) {
  const mintInfo = await getMint(
    connection,
    mintAddress,
    'confirmed',
    TOKEN_2022_PROGRAM_ID
  );

  const hook = getTransferHook(mintInfo);

  if (hook) {
    console.log("⚠️ Token has Transfer Hook");
    console.log("Program:", hook.programId.toString());
    console.log("Authority:", hook.authority.toString());
    return hook;
  }

  return null;
}
```

### Step 2: Validate with Guard

```typescript
const hook = await checkForHooks(mintAddress);

if (hook) {
  const guard = new Guard({
    validateTransferHooks: true,
    allowedHookPrograms: [
      "fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3"
    ]
  });

  const result = await guard.validateTransaction(tx);

  if (!result.isValid) {
    throw new Error(
      `Transfer Hook validation failed: ${result.blockedBy?.join(", ")}`
    );
  }
}
```

### Step 3: Build Safe Transfer

```typescript
async function safeTransfer(
  from: Keypair,
  to: PublicKey,
  amount: number,
  mintAddress: PublicKey
) {
  // 1. Check for hooks
  const hook = await checkForHooks(mintAddress);

  // 2. Build transfer instruction
  const transferIx = createTransferCheckedInstruction(
    fromAta,
    mintAddress,
    toAta,
    from.publicKey,
    amount,
    decimals,
    [],
    TOKEN_2022_PROGRAM_ID
  );

  const tx = new Transaction().add(transferIx);

  // 3. Validate if hook present
  if (hook) {
    await validateWithGuard(tx);
  }

  // 4. Execute
  return sendAndConfirmTransaction(connection, tx, [from]);
}
```

### Step 4: Handle Failures

```typescript
try {
  await safeTransfer(wallet, recipient, 1000, fragSOLMint);
} catch (error) {
  if (error.message.includes("Transfer Hook")) {
    // Hook-specific error
    console.error("Transfer Hook rejected:", error);
    notifyUser("Transfer blocked by token's security hook");
  } else if (error.logs?.includes("insufficient funds")) {
    notifyUser("Insufficient balance");
  } else {
    // Generic error
    notifyUser("Transfer failed");
  }
}
```

---

## Conclusion

Transfer Hook security requires vigilance at every level:

1. **Token Creators** - Build secure hooks with audits
2. **Developers** - Validate before every transfer
3. **Users** - Only interact with verified tokens

Use fabrknt's Guard module to automate Transfer Hook validation and protect your users from malicious hooks. The patterns detected by Guard are based on real-world analysis of production protocols like Fragmetric.

**Remember**: An ounce of prevention is worth a pound of cure. Always validate Transfer Hooks before signing transactions.

---

## Additional Resources

- [Transfer Hooks Guide](./transfer-hooks.md) - Complete implementation guide
- [Guard Documentation](../GUARD.md) - Security pattern detection
- [Fragmetric Case Study](./transfer-hooks.md#case-study-fragmetrics-fragsol) - Real-world example
