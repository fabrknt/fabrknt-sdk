#!/bin/bash

# Script to stop the Solana test validator
# Usage: ./scripts/stop-validator.sh

echo "🛑 Stopping Solana test validator..."

# Find and kill validator process
VALIDATOR_PID=$(lsof -ti:8899 2>/dev/null)

if [ -z "$VALIDATOR_PID" ]; then
    echo "ℹ️  No validator found on port 8899"
    exit 0
fi

# Kill the process
kill $VALIDATOR_PID 2>/dev/null

# Wait a moment
sleep 2

# Check if it's still running
if lsof -ti:8899 > /dev/null 2>&1; then
    echo "⚠️  Validator still running, forcing kill..."
    kill -9 $VALIDATOR_PID 2>/dev/null
    sleep 1
fi

if lsof -ti:8899 > /dev/null 2>&1; then
    echo "❌ Failed to stop validator"
    exit 1
else
    echo "✅ Validator stopped successfully"
fi

