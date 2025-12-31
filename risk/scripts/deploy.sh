#!/bin/bash

# Deploy script for Risk programs
# Usage: ./scripts/deploy.sh [localnet|devnet|mainnet]

set -e

NETWORK=${1:-localnet}

echo "🚀 Deploying Risk to $NETWORK..."

# Ensure we're using the correct Rust version
export PATH="$HOME/.cargo/bin:$PATH"

# Check if Anchor is available
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI not found. Please install Anchor first."
    exit 1
fi

# Check if Solana CLI is configured
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Please install Solana CLI first."
    exit 1
fi

case $NETWORK in
  localnet)
    echo "📡 Configuring for localnet..."
    solana config set --url localhost
    anchor build
    anchor deploy --provider.cluster localnet
    ;;
  devnet)
    echo "📡 Configuring for devnet..."
    solana config set --url https://api.devnet.solana.com
    
    # Check wallet balance
    echo "💰 Checking wallet balance..."
    BALANCE=$(solana balance --url devnet 2>/dev/null | grep -oE '[0-9.]+' | head -1 || echo "0")
    echo "   Current balance: $BALANCE SOL"
    
    # Request airdrop if balance is low
    if (( $(echo "$BALANCE < 1" | bc -l) )); then
      echo "💧 Requesting airdrop (2 SOL)..."
      solana airdrop 2 --url devnet || echo "⚠️  Airdrop failed or already requested. Continuing..."
      sleep 2
    fi
    
    echo "🔨 Building program..."
    anchor build
    
    echo "🚀 Deploying to devnet..."
    anchor deploy --provider.cluster devnet
    
    # Get deployed program ID
    PROGRAM_ID=$(solana address -k target/deploy/risk-keypair.json 2>/dev/null || echo "")
    if [ -n "$PROGRAM_ID" ]; then
      echo ""
      echo "✅ Deployment successful!"
      echo "📋 Program ID: $PROGRAM_ID"
      echo "🌐 View on Solana Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
      echo ""
      echo "⚠️  Don't forget to:"
      echo "   1. Update PAYMENT_PROGRAM_ID in api/.env.devnet"
      echo "   2. Update Anchor.toml [programs.devnet] section"
    fi
    ;;
  mainnet)
    read -p "⚠️  Are you sure you want to deploy to mainnet? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      echo "📡 Configuring for mainnet..."
      solana config set --url https://api.mainnet-beta.solana.com
      anchor build
      anchor deploy --provider.cluster mainnet
      
      PROGRAM_ID=$(solana address -k target/deploy/risk-keypair.json 2>/dev/null || echo "")
      if [ -n "$PROGRAM_ID" ]; then
        echo ""
        echo "✅ Deployment successful!"
        echo "📋 Program ID: $PROGRAM_ID"
        echo "🌐 View on Solana Explorer: https://explorer.solana.com/address/$PROGRAM_ID"
      fi
    else
      echo "Deployment cancelled."
      exit 1
    fi
    ;;
  *)
    echo "❌ Invalid network. Use: localnet, devnet, or mainnet"
    exit 1
    ;;
esac

echo ""
echo "✅ Deployment process complete!"

