#!/bin/bash

# Script to create a USDC token account for YOUR wallet (the one in your Solana config)
# Usage: ./scripts/create-token-account.sh [network]
# Note: This creates an account for YOUR wallet (from solana config), not a different wallet

set -e

NETWORK=${1:-devnet}
USDC_MINT="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"

# Get the wallet address from Solana config
WALLET_ADDRESS=$(solana address --url "$NETWORK" 2>/dev/null || {
    echo "❌ Could not get wallet address. Please run: solana config set --url $NETWORK"
    exit 1
})

if [ -z "$WALLET_ADDRESS" ]; then
    echo "Usage: ./scripts/create-token-account.sh [network]"
    echo "Example: ./scripts/create-token-account.sh devnet"
    echo ""
    echo "Note: This creates an account for YOUR wallet (from solana config)"
    echo "      To create an account for a different wallet, use the frontend or receive USDC tokens"
    exit 1
fi

echo "🔧 Creating USDC token account"
echo "📡 Network: $NETWORK"
echo "💰 USDC Mint: $USDC_MINT"
echo "👛 Your Wallet: $WALLET_ADDRESS"
echo ""
echo "ℹ️  Note: This creates an account for YOUR wallet (from Solana config)"
echo "   To create an account for a different wallet, receive USDC tokens to that wallet"

# Set network
if [ "$NETWORK" = "devnet" ]; then
    solana config set --url devnet
    RPC_URL="https://api.devnet.solana.com"
elif [ "$NETWORK" = "mainnet" ]; then
    solana config set --url mainnet-beta
    RPC_URL="https://api.mainnet-beta.solana.com"
else
    echo "❌ Invalid network. Use 'devnet' or 'mainnet'"
    exit 1
fi

# Check if spl-token CLI is installed
if ! command -v spl-token &> /dev/null; then
    echo "❌ spl-token CLI not found. Installing..."
    cargo install spl-token-cli
fi

echo ""
echo "📝 Creating associated token account..."
echo "   This will create the account if it doesn't exist"
echo "   Fee payer: $(solana address --url "$NETWORK")"

# Check if fee payer has SOL
FEE_PAYER=$(solana address --url "$NETWORK")
FEE_PAYER_BALANCE=$(solana balance "$FEE_PAYER" --url "$NETWORK" 2>/dev/null | grep -oE '[0-9.]+' | head -1 || echo "0")

if [ -z "$FEE_PAYER_BALANCE" ] || [ "$(echo "$FEE_PAYER_BALANCE < 0.01" | bc 2>/dev/null || echo "1")" = "1" ]; then
    echo ""
    echo "⚠️  Fee payer wallet has insufficient SOL (< 0.01 SOL)"
    echo "   Fee payer: $FEE_PAYER"
    echo "   Balance: $FEE_PAYER_BALANCE SOL"
    echo ""
    echo "💡 Please fund the fee payer wallet first:"
    if [ "$NETWORK" = "devnet" ]; then
        echo "   solana airdrop 2 --url devnet"
    else
        echo "   Transfer SOL to: $FEE_PAYER"
    fi
    exit 1
fi

# Create the associated token account
# The owner and fee payer are the same (your wallet)
spl-token create-account "$USDC_MINT" \
    --url "$NETWORK" || {
    echo ""
    echo "⚠️  Account creation failed. This might mean:"
    echo "   1. The account already exists (check with: spl-token accounts --owner $WALLET_ADDRESS --url $NETWORK)"
    echo "   2. The fee payer wallet has insufficient SOL"
    echo "   3. Network connection issue"
    echo ""
    echo "💡 Alternative: Receive some USDC tokens to your wallet"
    echo "   This will automatically create the account"
    echo ""
    echo "   Or check if account exists:"
    echo "   spl-token accounts --owner $WALLET_ADDRESS --url $NETWORK"
    exit 1
}

echo ""
echo "✅ Token account created successfully!"
echo ""
echo "📋 Account Details:"
echo "   Wallet: $WALLET_ADDRESS"
TOKEN_ACCOUNT=$(spl-token accounts --url "$NETWORK" 2>/dev/null | grep "$USDC_MINT" | awk '{print $1}' | head -1 || echo "")
if [ -n "$TOKEN_ACCOUNT" ]; then
    echo "   Token Account: $TOKEN_ACCOUNT"
else
    echo "   Token Account: Check with: spl-token accounts --url $NETWORK"
fi
echo "   USDC Mint: $USDC_MINT"
echo ""
echo "🎉 You can now use this account for payments!"
echo ""
echo "💡 For other wallets: The easiest way is to receive USDC tokens"
echo "   This automatically creates the token account"

