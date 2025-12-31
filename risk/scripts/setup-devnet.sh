#!/bin/bash

# Setup script for devnet deployment
# This script prepares the environment for devnet deployment

set -e

echo "🔧 Setting up devnet environment..."

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install it first:"
    echo "   sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Set Solana to devnet
echo "📡 Configuring Solana CLI for devnet..."
solana config set --url https://api.devnet.solana.com

# Check wallet
WALLET_PATH="$HOME/.config/solana/id.json"
if [ ! -f "$WALLET_PATH" ]; then
    echo "🔑 Creating new wallet..."
    solana-keygen new --outfile "$WALLET_PATH" --no-bip39-passphrase
fi

WALLET_ADDRESS=$(solana address)
echo "💰 Wallet address: $WALLET_ADDRESS"

# Check balance
BALANCE=$(solana balance --url devnet 2>/dev/null | grep -oE '[0-9.]+' | head -1 || echo "0")
echo "💰 Current balance: $BALANCE SOL"

# Request airdrop if needed
if (( $(echo "$BALANCE < 2" | bc -l 2>/dev/null || echo "1") )); then
    echo "💧 Requesting airdrop (2 SOL)..."
    solana airdrop 2 --url devnet || {
        echo "⚠️  Airdrop may have failed. You can request manually:"
        echo "   solana airdrop 2 --url devnet"
    }
    sleep 2
    BALANCE=$(solana balance --url devnet 2>/dev/null | grep -oE '[0-9.]+' | head -1 || echo "0")
    echo "💰 New balance: $BALANCE SOL"
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "⚠️  Anchor CLI not found. Please install it:"
    echo "   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    echo "   avm install latest"
    echo "   avm use latest"
    exit 1
fi

echo ""
echo "✅ Devnet environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Build the program: npm run build"
echo "  2. Deploy to devnet: ./scripts/deploy.sh devnet"
echo "  3. Update api/.env.devnet with the deployed program ID"
echo "  4. Start API server: cd api && npm run dev"

