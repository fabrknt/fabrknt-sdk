#!/bin/bash

# Script to set up test environment: start validator and deploy program
# Usage: ./scripts/setup-test-env.sh

echo "🔧 Setting up test environment..."

# Prioritize system Rust tools in PATH
export PATH="$HOME/.cargo/bin:$PATH"
export ANCHOR_WALLET="$HOME/.config/solana/id.json"

# Stop existing validator if running
if lsof -ti:8899 > /dev/null 2>&1; then
    echo "🛑 Stopping existing validator..."
    ./scripts/stop-validator.sh
    sleep 2
fi

# Start fresh validator
echo "🚀 Starting fresh validator..."
./scripts/start-validator.sh
sleep 8

# Set environment variables
export ANCHOR_PROVIDER_URL="http://localhost:8899"
export SOLANA_URL="http://localhost:8899"

# Build the program
echo "🔨 Building program..."
"$HOME/.cargo/bin/anchor" build

# Deploy the program
echo "📦 Deploying program to local validator..."
"$HOME/.cargo/bin/anchor" deploy --provider.cluster localnet

if [ $? -eq 0 ]; then
    echo "✅ Test environment ready!"
    echo "   Validator: http://localhost:8899"
    echo "   Program deployed and ready for tests"
else
    echo "❌ Deployment failed"
    exit 1
fi

