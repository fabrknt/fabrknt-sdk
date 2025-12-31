#!/bin/bash
# Quick test script to verify the setup

echo "=== Privacy SSM Setup Verification ==="
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js: $NODE_VERSION"
else
    echo "✗ Node.js not found"
    exit 1
fi

# Check npm
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✓ npm: $NPM_VERSION"
else
    echo "✗ npm not found"
    exit 1
fi

# Check Solana CLI
echo "Checking Solana CLI..."
if command -v solana &> /dev/null; then
    SOLANA_VERSION=$(solana --version | head -n 1)
    echo "✓ Solana CLI: $SOLANA_VERSION"
else
    echo "⚠ Solana CLI not found (optional for testing)"
fi

# Check dependencies
echo ""
echo "Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✓ node_modules exists"
else
    echo "✗ node_modules not found - run 'npm install'"
    exit 1
fi

# Check .env file
echo ""
echo "Checking configuration..."
if [ -f ".env" ]; then
    echo "✓ .env file exists"
else
    echo "⚠ .env file not found - copy .env.example to .env"
fi

# Check build
echo ""
echo "Checking build..."
if [ -d "dist" ]; then
    echo "✓ dist/ directory exists"
else
    echo "⚠ Build not found - run 'npm run build'"
fi

echo ""
echo "=== Setup verification complete ==="
echo ""
echo "Next steps:"
echo "1. Configure .env file with your keys"
echo "2. Run 'npm run build' if not already built"
echo "3. Run 'npm run example:airdrop' to test"
