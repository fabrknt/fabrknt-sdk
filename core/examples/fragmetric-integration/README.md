# Fragmetric Integration Example

A complete example demonstrating how to safely interact with Fragmetric's fragSOL (Liquid Restaking Token) using fabrknt's Guard module for Transfer Hook validation.

## Overview

This example shows:
- ✅ Safe fragSOL transfers with automatic Guard validation
- ✅ Transfer Hook detection and verification
- ✅ Batch transfer processing with security checks
- ✅ Token extension inspection and analysis

## What is Fragmetric?

[Fragmetric](https://fragmetric.xyz) is Solana's first native liquid restaking protocol. Their **fragSOL** token uses Token-2022 Transfer Hooks to implement time-weighted reward distribution, making it an excellent real-world example of Transfer Hooks done right.

**Key Details:**
- **Token Mint**: `FRAGSEthVFL7fdqM8hxfxkfCZzUvmg21cqPJVvC1qdbo`
- **Hook Program**: `fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3`
- **Purpose**: On-chain reward distribution tracking
- **Security**: ✅ Whitelisted in fabrknt Guard

## Prerequisites

- Node.js 16+
- A Solana wallet with SOL for transaction fees
- (Optional) Some fragSOL tokens for testing transfers

## Installation

```bash
# Install dependencies
npm install

# Or from the root of fabrknt repository
npm install
```

## Configuration

Create a `.env` file:

```bash
# Required: Your wallet private key (JSON array format)
WALLET_PRIVATE_KEY='[1,2,3,...]'

# Optional: Custom RPC endpoint
RPC_URL='https://api.mainnet-beta.solana.com'

# Optional: Recipient address for transfers
RECIPIENT_ADDRESS='YourRecipientPublicKeyHere'
```

**⚠️ Security Warning**: Never commit your private key! Add `.env` to `.gitignore`.

## Examples

### Example 1: Basic fragSOL Transfer

Transfer fragSOL with automatic Guard validation:

```bash
npm start basic
```

**What it does:**
1. Checks for Transfer Hook extension on fragSOL
2. Verifies it's the official Fragmetric hook (not malicious)
3. Sets up token accounts (creates if needed)
4. Builds transfer instruction
5. Validates transaction with Guard
6. Signs and sends if validation passes

**Output:**
```
═══════════════════════════════════════════════════════
  Example 1: Basic fragSOL Transfer with Guard
═══════════════════════════════════════════════════════

🔄 Initiating fragSOL transfer...
   From: YourWalletAddress...
   To: RecipientAddress...
   Amount: 0.1 fragSOL

📋 Step 1: Checking for Transfer Hook extension...
✅ Token has Transfer Hook extension
   Program ID: fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3
   Authority: fragSkuEpEmdoj9Bcyawk9rBdsChcVJLWHfj9JX1Gby
✅ Verified: This is the official Fragmetric Transfer Hook

📋 Step 2: Setting up token accounts...
   From ATA: YourTokenAccount...
   To ATA: RecipientTokenAccount...

📋 Step 3: Building transfer instruction...
✅ Transfer instruction created

📋 Step 4: Validating transaction with Guard...

🛡️  Validating transaction with Guard...
✅ Transaction validated successfully - no issues detected

📋 Step 5: Signing and sending transaction...

✅ Transfer successful!
   Signature: 5abc...xyz
   Explorer: https://solscan.io/tx/5abc...xyz
```

### Example 2: Batch Transfers

Process multiple fragSOL transfers with validation:

```bash
npm start batch
```

**Features:**
- Validates each transfer independently
- Handles failures gracefully
- Rate limiting between transfers
- Summary report at the end

### Example 3: Inspect Transfer Hook

Inspect fragSOL token and its Transfer Hook:

```bash
npm start inspect
```

**What it shows:**
```
═══════════════════════════════════════════════════════
  Example 3: Inspect fragSOL Transfer Hook
═══════════════════════════════════════════════════════

📋 Fetching fragSOL mint information...

Token Details:
  Mint: FRAGSEthVFL7fdqM8hxfxkfCZzUvmg21cqPJVvC1qdbo
  Supply: 195771923111431
  Decimals: 9
  Mint Authority: 3TK9fNePM4qdKC4dwvDe8Bamv14prDqdVfuANxPeiryb
  Freeze Authority: None

✅ Transfer Hook Extension Found:
  Program ID: fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3
  Authority: fragSkuEpEmdoj9Bcyawk9rBdsChcVJLWHfj9JX1Gby

  ✅ This is the verified Fragmetric Transfer Hook
  Purpose: Time-weighted reward distribution
  Status: Safe (whitelisted in fabrknt Guard)

📋 Transfer Hook Program Details:
  Owner: BPFLoaderUpgradeab1e11111111111111111111111
  Executable: true
  Data Length: 3103280 bytes
  Lamports: 21600032880

✅ Inspection complete
```

## Code Structure

### Main Functions

#### `checkForTransferHook()`
Checks if a token has Transfer Hook extension:
```typescript
const hookInfo = await checkForTransferHook(connection, FRAGSOL_MINT);

if (hookInfo.hasHook) {
  console.log(`Hook Program: ${hookInfo.programId}`);
}
```

#### `validateWithGuard()`
Validates transaction with fabrknt Guard:
```typescript
const isValid = await validateWithGuard(transaction, hookProgramId);

if (!isValid) {
  throw new Error("Transaction blocked by Guard");
}
```

#### `safeFragSOLTransfer()`
Complete safe transfer flow:
```typescript
const signature = await safeFragSOLTransfer(
  connection,
  wallet,
  recipient,
  amount
);
```

## Guard Configuration

The example uses Guard with these settings:

```typescript
const guard = new Guard({
  validateTransferHooks: true,          // Enable hook validation
  allowedHookPrograms: [
    "fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3"  // Fragmetric (whitelisted)
  ],
  maxHookAccounts: 20,                  // Fragmetric uses ~17
  mode: "block"                         // Block suspicious transactions
});
```

## Security Features

### 1. Transfer Hook Verification
- ✅ Detects Token-2022 Transfer Hook extension
- ✅ Verifies it's the official Fragmetric hook
- ✅ Blocks unknown/malicious hooks

### 2. Guard Validation Patterns
The Guard checks for:
- **P-105**: Malicious Transfer Hook (excessive writable accounts)
- **P-106**: Unexpected Hook Execution (hook without transfer)
- **P-107**: Hook Reentrancy (nested token operations)
- **P-108**: Excessive Hook Accounts (>20 accounts)

### 3. Automatic Protection
If Guard detects issues:
```typescript
❌ Transaction validation failed
   Blocked by: MaliciousTransferHook
   [critical] 🚨 CRITICAL: Unknown Transfer Hook modifies 15 accounts. Possible malicious hook!
```

Transaction is **automatically blocked** before signing.

## Understanding Fragmetric's Transfer Hook

### What Happens During a Transfer

When you transfer fragSOL, the Transfer Hook:
1. **Updates sender's contribution record** - Tracks time-weighted balance
2. **Updates recipient's contribution record** - Same for recipient
3. **Syncs reward pool state** - Updates accumulated rewards
4. **Handles DeFi integrations** - If transfer is part of swap/stake

This happens **automatically** - no extra instructions needed!

### Why It's Safe

Fragmetric's hook is safe because:
- ✅ **Open source** - Code is auditable
- ✅ **Audited** - Security audit by Certora (2024)
- ✅ **Production tested** - Handling millions in TVL
- ✅ **Efficient** - Only 5,000 lamports (~$0.001) per transfer
- ✅ **Verified** - Whitelisted by fabrknt Guard

### Gas Costs

Based on real transactions:
```
Transaction Cost: ~0.000005 SOL ($0.001)
├─ Base fee: ~5,000 lamports
├─ Hook executions (6x): Included
└─ Account access (~100 accounts): Optimized with ALT
```

## Integrating into Your App

### As a Module

```typescript
import { safeFragSOLTransfer, FRAGSOL_MINT } from './fragmetric-integration';

// In your application
async function handleTransfer(userWallet, recipient, amount) {
  try {
    const signature = await safeFragSOLTransfer(
      connection,
      userWallet,
      recipient,
      amount
    );

    // Show success to user
    showSuccess(`Transfer complete: ${signature}`);
  } catch (error) {
    // Handle errors
    if (error.message.includes('validation failed')) {
      showError('Transfer blocked for security reasons');
    } else {
      showError('Transfer failed');
    }
  }
}
```

### Custom Guard Configuration

```typescript
import { Guard } from '@fabrknt/sdk';

// Stricter validation
const strictGuard = new Guard({
  validateTransferHooks: true,
  allowedHookPrograms: [FRAGMETRIC_HOOK_PROGRAM],
  maxHookAccounts: 15,      // Even stricter limit
  riskTolerance: 'strict',  // Block all warnings
  mode: 'block'
});

// More permissive (not recommended)
const permissiveGuard = new Guard({
  validateTransferHooks: true,
  maxHookAccounts: 30,
  mode: 'warn'  // Only warn, don't block
});
```

## Troubleshooting

### "Transfer Hook validation failed"

**Cause**: Transaction blocked by Guard due to security issue.

**Solution**:
1. Check the error message for specific pattern (P-105 to P-108)
2. Verify you're using the correct token mint
3. Ensure hook program is whitelisted

### "Insufficient funds"

**Cause**: Not enough fragSOL or SOL for fees.

**Solution**:
1. Check fragSOL balance: `spl-token balance FRAGSEthVFL7fdqM8hxfxkfCZzUvmg21cqPJVvC1qdbo`
2. Ensure wallet has SOL for transaction fees (~0.00001 SOL)

### "Unknown Transfer Hook program"

**Cause**: Token has a Transfer Hook not in the whitelist.

**Solution**:
1. Run `npm start inspect` to see the hook program
2. Research the program before whitelisting
3. Only add verified safe hooks to `allowedHookPrograms`

## Advanced Usage

### Adding More Safe Hooks

```typescript
const guard = new Guard({
  validateTransferHooks: true,
  allowedHookPrograms: [
    'fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3',  // Fragmetric
    'YourVerifiedHook111111111111111111111111111',  // Your protocol
  ]
});
```

### Custom Validation Logic

```typescript
async function customValidation(transaction: Transaction) {
  // Standard Guard validation
  const guardResult = await validateWithGuard(transaction);

  if (!guardResult) {
    return false;
  }

  // Your custom checks
  const yourCheck = await yourCustomValidation(transaction);

  return yourCheck;
}
```

### Monitoring Hook Performance

```typescript
const startTime = Date.now();

const signature = await safeFragSOLTransfer(
  connection,
  wallet,
  recipient,
  amount
);

const duration = Date.now() - startTime;

console.log(`Transfer completed in ${duration}ms`);

if (duration > 5000) {
  console.warn('⚠️  Transfer took longer than expected');
}
```

## Learn More

### Documentation
- [Token-2022 Transfer Hooks Guide](../../docs/token-extensions/transfer-hooks.md)
- [Security Patterns Reference](../../docs/token-extensions/security-patterns.md)
- [Guard Documentation](../../docs/GUARD.md)

### Fragmetric Resources
- [Fragmetric Website](https://fragmetric.xyz)
- [Fragmetric Docs](https://docs.fragmetric.xyz)
- [fragSOL on Solscan](https://solscan.io/token/FRAGSEthVFL7fdqM8hxfxkfCZzUvmg21cqPJVvC1qdbo)

### Solana Resources
- [Token-2022 Documentation](https://spl.solana.com/token-2022)
- [Transfer Hook Extension](https://spl.solana.com/token-2022/extensions#transfer-hook)

## Contributing

Found an issue or want to improve this example?

1. Fork the repository
2. Make your changes
3. Submit a pull request

## License

MIT

---

**Built with ❤️ using fabrknt SDK**

For more examples, visit [fabrknt/examples](../)
