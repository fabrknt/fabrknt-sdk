#!/bin/bash

# Setup script for Flow development on Solana Devnet

set -e

echo "🚀 Setting up Flow development environment..."

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install it first."
    exit 1
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Please install it first."
    exit 1
fi

# Display current Solana configuration
echo ""
echo "📋 Current Solana Configuration:"
solana config get

# Check balance
echo ""
echo "💰 Checking devnet balance..."
BALANCE=$(solana balance --output json | jq -r '.balance // 0')
echo "Current balance: $BALANCE SOL"

# Request airdrop if balance is low
if (( $(echo "$BALANCE < 1" | bc -l) )); then
    echo ""
    echo "💧 Requesting devnet airdrop..."
    solana airdrop 2
    echo "✅ Airdrop received!"
fi

# Build the program
echo ""
echo "🔨 Building Anchor program..."
anchor build

# Display program ID
echo ""
echo "📝 Program ID:"
solana address -k target/deploy/x_liquidity_engine-keypair.json

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'anchor test' to test the program"
echo "  2. Run 'anchor deploy' to deploy to devnet"
echo "  3. Check docs/SETUP.md for more information"

