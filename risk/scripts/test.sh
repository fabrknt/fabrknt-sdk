#!/bin/bash

# Test script that uses system Rust and proper test configuration
# Usage: ./scripts/test.sh

echo "🧪 Running Risk tests..."

# Prioritize system Rust tools in PATH
export PATH="$HOME/.cargo/bin:$PATH"

# Set Anchor wallet (required for tests)
export ANCHOR_WALLET="$HOME/.config/solana/id.json"

# Check if validator is already running
if lsof -ti:8899 > /dev/null 2>&1; then
    echo "✅ Using existing validator on port 8899"
    echo "⚠️  Note: Gateway may already be initialized from previous test run"
    echo "   Tests will handle existing gateway gracefully"
    export ANCHOR_PROVIDER_URL="http://localhost:8899"
    export SOLANA_URL="http://localhost:8899"
    
    # Run tests directly using the test script from Anchor.toml
    # This bypasses Anchor's validator startup
    echo "📝 Running tests against existing validator..."
    npx ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts
else
    echo "⚠️  No validator found on port 8899"
    echo "   Starting validator with: ./scripts/start-validator.sh"
    ./scripts/start-validator.sh
    sleep 5
    
    echo "📝 Running tests..."
    export ANCHOR_PROVIDER_URL="http://localhost:8899"
    export SOLANA_URL="http://localhost:8899"
    npx ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts
fi
