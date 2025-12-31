# Hello World - Your First Fabrknt Payment

The simplest possible example: Send 0.01 SOL to yourself on devnet.

This example runs in **< 5 minutes** with zero setup required.

## Features

- ✅ Auto-generates test wallet
- ✅ Auto-airdrops devnet SOL
- ✅ Demonstrates BatchPayoutPattern
- ✅ Shows Guard security validation
- ✅ Provides transaction link

## Quick Start

### Step 1: Build the SDK (one-time setup)

From the root of the fabrknt repository:

```bash
cd /path/to/fabrknt
npm install
npm run build
```

### Step 2: Install Example Dependencies

```bash
cd examples/hello-world
npm install
```

### Step 3: Run the Example

```bash
npx tsx index.ts
```

That's it! The example will:

1. Generate a temporary wallet
2. Airdrop 1 SOL from devnet faucet
3. Send 0.01 SOL to itself using BatchPayoutPattern
4. Display transaction link on Solana Explorer

## What You'll See

```
🚀 Fabrknt Hello World Example
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Setup
  ✓ Generated wallet: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
  ✓ Requesting airdrop: 1 SOL...
  ✓ Balance: 1 SOL

💰 Executing Payment
  ✓ Creating BatchPayoutPattern with 1 recipient
  ✓ Guard validation: PASSED
  ✓ Transaction sent!

✅ Success!
  • Recipient: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
  • Amount: 0.01 SOL
  • Transaction: https://explorer.solana.com/tx/abc123...?cluster=devnet
  • Gas cost: 0.000005 SOL

🎉 You just executed your first Fabrknt payment!
```

## Code Walkthrough

The example demonstrates 4 key concepts:

### 1. Guard Security

```typescript
const guard = new Guard({
	mode: "block",
	maxSlippage: 0.01,
});
```

Guard validates transactions to prevent unauthorized drains and excessive slippage.

### 2. BatchPayoutPattern

```typescript
const payment = new BatchPayoutPattern({
	name: "Hello World Payment",
	recipients: [{ wallet: payer.publicKey.toBase58(), amount: 0.01, token: "SOL" }],
	guard,
});
```

Even for a single payment, the pattern handles retries, reporting, and optimization.

### 3. Execution

```typescript
const result = await payment.execute();
```

One line executes the payment with automatic Guard validation.

### 4. Result Handling

```typescript
if (result.success) {
	console.log("Transaction:", result.transactions[0].id);
}
```

Get transaction hashes, metrics, and detailed reports.

## Advanced: Reusing Wallets (Optional)

Want to reuse the same wallet across runs?

1. Create `.env` file:

```bash
cp .env.example .env
```

2. Run once to generate a wallet, then copy the private key to `.env`:

```bash
WALLET_PRIVATE_KEY=your-base58-private-key-here
SOLANA_RPC_URL=https://api.devnet.solana.com
```

3. Run again - it will reuse your wallet!

## Next Steps

1. ✅ Run this example
2. 📚 Explore [Payroll Example](../payroll) - Production-quality batch payments
3. 📚 Explore [Subscriptions Example](../subscriptions) - Recurring payments
4. 📖 Read [Core Concepts](../../docs/concepts.md)
5. 🛠️ Build your own application!

## Troubleshooting

### "Airdrop failed"

**Problem:** Devnet faucet rate limit or downtime.

**Solutions:**

- Wait 30 seconds and try again
- Use a different RPC endpoint in `.env`
- Get devnet SOL manually: https://faucet.solana.com

### "Transaction failed"

**Problem:** Network congestion or insufficient balance.

**Solutions:**

- Check your wallet balance
- Ensure devnet RPC is working
- Try again (automatic retries are built-in)

## What's Different from Production?

This example is simplified for learning. For production:

- ✅ Use persistent wallet from secure storage
- ✅ Add comprehensive error handling
- ✅ Implement database for recipient tracking
- ✅ Generate CSV reports for accounting
- ✅ Set up monitoring and alerting

See [Payroll Example](../payroll) for production-ready code.

## Resources

- **Fabrknt Documentation**: [Getting Started](../../docs/getting-started.md)
- **BatchPayoutPattern API**: [Batch Payout Pattern](../../docs/patterns/batch-payout.md)
- **GitHub**: [fabrknt/fabrknt](https://github.com/fabrknt/fabrknt)
