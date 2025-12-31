# How to Create a USDC Token Account

If you see the error "Your USDC token account does not exist", you need to create a USDC token account before making payments.

## ⭐ Recommended: Receive USDC Tokens (Easiest) ✅

**This is the simplest and most reliable method.** Receiving USDC tokens automatically creates the token account.

### For Devnet Testing:

1. **Get SOL from Faucet:**
   - Visit: https://faucet.solana.com/
   - Enter your wallet address
   - Request SOL (you'll need ~0.1 SOL for fees)

2. **Swap SOL for USDC on Jupiter:**
   - Visit: https://jup.ag/swap
   - Connect your wallet (Phantom, Backpack, etc.)
   - Make sure you're on Devnet
   - Swap a small amount of SOL for USDC (e.g., 0.01 SOL → USDC)
   - **This automatically creates your USDC token account!**

3. **Alternative: Use a Devnet USDC Faucet:**
   - Some devnet services provide USDC
   - Or ask someone to send you USDC on devnet

### For Mainnet:

- Receive USDC from any source (exchange, another wallet, etc.)
- This automatically creates the token account

## Other Options (More Complex)

**The simplest way** is to receive some USDC tokens to your wallet. This automatically creates the token account.

**On Devnet:**
1. Get SOL from a faucet: https://faucet.solana.com/
2. Swap SOL for USDC on Jupiter: https://jup.ag/swap
3. Or ask someone to send you USDC on devnet

**On Mainnet:**
- Receive USDC from any source (exchange, another wallet, etc.)

### Option 2: Use the Script (For Your CLI Wallet)

**Note:** This method may encounter "incorrect program id" errors. **We recommend using Option 1 instead.**

We provide a helper script to create the account for **your Solana CLI wallet**:

```bash
# For devnet (creates account for your CLI wallet)
./scripts/create-token-account.sh devnet

# For mainnet
./scripts/create-token-account.sh mainnet
```

**Important:** 
- This script creates an account for **your Solana CLI wallet** (from `~/.config/solana/id.json`), not for a browser wallet
- If you get "incorrect program id" error, use Option 1 instead

**Prerequisites:**
- Solana CLI installed and configured
- `spl-token` CLI installed (`cargo install spl-token-cli`)
- Your CLI wallet has SOL for transaction fees

**For Browser Wallets:** Always use Option 1 (receive USDC tokens) - it's much easier and more reliable!

### Option 3: Use Solana CLI

```bash
# Set network
solana config set --url devnet  # or mainnet-beta

# Create associated token account
spl-token create-account EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
    --owner <your-wallet-address>
```

### Option 4: Use Jupiter or Raydium

1. Go to https://jup.ag/swap (Jupiter) or https://raydium.io/swap (Raydium)
2. Connect your wallet
3. Swap a small amount of SOL for USDC
4. This will automatically create your USDC token account

## Verify Your Account

After creating the account, verify it exists:

```bash
# Check your token accounts
spl-token accounts --owner <your-wallet-address> --url devnet

# Or check balance
spl-token balance EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
    --owner <your-wallet-address> \
    --url devnet
```

## Account Details

- **USDC Mint Address (Devnet/Mainnet):** `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- **Your Token Account Address:** Shown in the error message (e.g., `EEBdBk6LNb34ks3nEM4ADKof3yKsKJhTmK9Re14QtsqG`)

## Troubleshooting

### "Insufficient funds"
- Ensure your wallet has SOL for transaction fees (at least 0.01 SOL)

### "Account already exists"
- The account might already exist. Try the payment again.

### "Network error"
- Check your network connection
- Verify you're on the correct network (devnet vs mainnet)

## After Creating the Account

Once your USDC token account is created:
1. Refresh the frontend page
2. Try the payment again
3. The payment should work if you have USDC balance

## Need Help?

If you continue to have issues:
1. Check the browser console for detailed error messages
2. Verify your wallet is on the correct network
3. Ensure you have both SOL (for fees) and USDC (for payment)

