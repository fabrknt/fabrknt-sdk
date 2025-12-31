#!/bin/bash

# Script to start a fresh Solana test validator with enough SOL
# Usage: ./scripts/start-validator.sh

echo "🔄 Stopping any existing validator..."

# Kill any existing validator on port 8899
lsof -ti:8899 2>/dev/null | xargs kill -9 2>/dev/null
sleep 2

# Check if port is free
if lsof -ti:8899 > /dev/null 2>&1; then
    echo "❌ Port 8899 is still in use. Please manually stop the process."
    exit 1
fi

echo "🚀 Starting fresh Solana test validator..."

# Start validator with reset to ensure clean state and enough SOL
# The --reset flag clears any existing ledger data
# The validator starts with 1 billion SOL by default, which is plenty for tests
solana-test-validator \
    --reset \
    --rpc-port 8899 \
    --faucet-port 9900 \
    --limit-ledger-size 50000000 \
    --log > /tmp/solana-validator.log 2>&1 &

VALIDATOR_PID=$!

# Wait for validator to start
echo "⏳ Waiting for validator to initialize..."
sleep 5

# Check if validator is running
if ps -p $VALIDATOR_PID > /dev/null; then
    echo "✅ Validator started successfully (PID: $VALIDATOR_PID)"
    echo "📡 RPC URL: http://localhost:8899"
    echo "💧 Faucet URL: http://localhost:9900"
    echo ""
    echo "To stop the validator, run: kill $VALIDATOR_PID"
    echo "Or use: ./scripts/stop-validator.sh"
else
    echo "❌ Validator failed to start"
    exit 1
fi

