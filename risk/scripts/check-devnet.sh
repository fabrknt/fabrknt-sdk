#!/bin/bash

# Quick check script for devnet setup
# Usage: ./scripts/check-devnet.sh

echo "🔍 Checking devnet setup..."

# Check Solana CLI
if command -v solana &> /dev/null; then
    echo "✅ Solana CLI installed"
    SOLANA_VERSION=$(solana --version | head -1)
    echo "   Version: $SOLANA_VERSION"
else
    echo "❌ Solana CLI not found"
    exit 1
fi

# Check Anchor CLI
if command -v anchor &> /dev/null; then
    echo "✅ Anchor CLI installed"
    ANCHOR_VERSION=$(anchor --version 2>/dev/null || echo "unknown")
    echo "   Version: $ANCHOR_VERSION"
else
    echo "❌ Anchor CLI not found"
    exit 1
fi

# Check Solana config
echo ""
echo "📡 Solana Configuration:"
solana config get

# Check wallet
WALLET_PATH="$HOME/.config/solana/id.json"
if [ -f "$WALLET_PATH" ]; then
    WALLET_ADDRESS=$(solana address)
    echo "✅ Wallet found: $WALLET_ADDRESS"
else
    echo "❌ Wallet not found at $WALLET_PATH"
    exit 1
fi

# Check balance on devnet
echo ""
echo "💰 Devnet Balance:"
BALANCE=$(solana balance --url devnet 2>/dev/null || echo "Error checking balance")
echo "   $BALANCE"

# Check if program is built
if [ -f "target/deploy/risk.so" ]; then
    echo "✅ Program built (target/deploy/risk.so)"
    PROGRAM_SIZE=$(ls -lh target/deploy/risk.so | awk '{print $5}')
    echo "   Size: $PROGRAM_SIZE"
else
    echo "⚠️  Program not built. Run: npm run build"
fi

# Check API env file
if [ -f "api/.env" ]; then
    echo "✅ API .env file exists"
    if grep -q "PAYMENT_PROGRAM_ID" api/.env; then
        PROGRAM_ID=$(grep PAYMENT_PROGRAM_ID api/.env | cut -d '=' -f2)
        echo "   Program ID: $PROGRAM_ID"
    fi
else
    echo "⚠️  API .env file not found. Copy from api/.env.example"
fi

echo ""
echo "✅ Devnet setup check complete!"

