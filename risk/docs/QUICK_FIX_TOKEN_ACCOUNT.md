# Quick Fix: Create USDC Token Account

If you see "Your USDC token account does not exist", here's the fastest way to fix it:

## 🚀 Quick Solution (2 minutes)

### Step 1: Get SOL

1. Visit: https://faucet.solana.com/
2. Enter your wallet address: `EEBdBk6LNb34ks3nEM4ADKof3yKsKJhTmK9Re14QtsqG`
3. Request SOL (you'll get ~1-2 SOL on devnet)

### Step 2: Swap SOL for USDC

1. Visit: https://jup.ag/swap
2. **Important:** Make sure you're on Devnet (check wallet network)
3. Connect your wallet (Backpack, Phantom, etc.)
4. Swap a small amount: 0.01 SOL → USDC
5. ✅ **Done!** Your USDC token account is now created automatically

### Step 3: Try Payment Again

1. Go back to the Risk frontend
2. Refresh the page
3. Click "Pay 0.05 USDC" again
4. It should work now! 🎉

## Why This Works

When you receive USDC tokens (via swap or transfer), Solana automatically creates the associated token account. This is the standard way token accounts are created on Solana.

## Alternative: Direct USDC Transfer

If someone can send you USDC directly:

-   Your wallet address: `EEBdBk6LNb34ks3nEM4ADKof3yKsKJhTmK9Re14QtsqG`
-   USDC Mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
-   Network: Devnet

## Troubleshooting

**"Insufficient funds" when swapping:**

-   Make sure you have SOL (get more from faucet)
-   You need SOL for both the swap fee and the account creation fee

**"Network mismatch":**

-   Make sure your wallet is on Devnet
-   Check wallet settings → Network → Devnet

**Still not working:**

-   Wait a few seconds after receiving USDC
-   Refresh the frontend page
-   Check your wallet has USDC balance

## Need Help?

If you continue to have issues:

1. Check browser console for errors
2. Verify wallet is on Devnet
3. Ensure you have both SOL and USDC in your wallet
