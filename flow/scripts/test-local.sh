#!/bin/bash

# Local Validator Testing Script for Flow
# This script helps set up and run tests using a local Solana validator

set -e

echo "🚀 Flow - Local Testing Setup"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if solana-test-validator is available
if ! command -v solana-test-validator &> /dev/null; then
    echo -e "${RED}❌ solana-test-validator not found${NC}"
    echo "Please install Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

# Check if anchor is available
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ anchor not found${NC}"
    echo "Please install Anchor: https://www.anchor-lang.com/docs/installation"
    exit 1
fi

# Function to check if validator is running
check_validator() {
    if curl -s http://localhost:8899/health > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start validator
start_validator() {
    echo -e "${YELLOW}📡 Starting local Solana validator...${NC}"
    echo "   (This will run in the background)"
    
    # Kill any existing validator
    pkill -f solana-test-validator || true
    sleep 2
    
    # Start validator in background
    solana-test-validator \
        --reset \
        --quiet \
        > /tmp/solana-validator.log 2>&1 &
    
    VALIDATOR_PID=$!
    echo "   Validator PID: $VALIDATOR_PID"
    
    # Wait for validator to be ready
    echo -e "${YELLOW}⏳ Waiting for validator to initialize...${NC}"
    for i in {1..30}; do
        if check_validator; then
            echo -e "${GREEN}✅ Validator is ready!${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ Validator failed to start${NC}"
    echo "Check logs: /tmp/solana-validator.log"
    exit 1
}

# Function to configure Solana CLI
configure_cli() {
    echo -e "${YELLOW}⚙️  Configuring Solana CLI for localnet...${NC}"
    solana config set --url http://localhost:8899
    echo -e "${GREEN}✅ CLI configured${NC}"
}

# Function to airdrop SOL
airdrop_sol() {
    echo -e "${YELLOW}💰 Requesting SOL airdrop...${NC}"
    solana airdrop 10
    BALANCE=$(solana balance --lamports | awk '{print $1}')
    echo -e "${GREEN}✅ Balance: $BALANCE lamports${NC}"
}

# Function to build program
build_program() {
    echo -e "${YELLOW}🔨 Building program...${NC}"
    anchor build
    echo -e "${GREEN}✅ Build complete${NC}"
}

# Function to deploy program
deploy_program() {
    echo -e "${YELLOW}📦 Deploying program...${NC}"
    anchor deploy
    echo -e "${GREEN}✅ Deployment complete${NC}"
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}🧪 Running integration tests...${NC}"
    echo ""
    anchor test --skip-local-validator
}

# Function to cleanup
cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    if [ ! -z "$VALIDATOR_PID" ]; then
        kill $VALIDATOR_PID 2>/dev/null || true
    fi
    pkill -f solana-test-validator || true
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Trap to cleanup on exit
trap cleanup EXIT

# Main execution
main() {
    # Check if validator is already running
    if check_validator; then
        echo -e "${GREEN}✅ Validator is already running${NC}"
    else
        start_validator
    fi
    
    configure_cli
    airdrop_sol
    build_program
    deploy_program
    
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Setup complete! Running tests...${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo ""
    
    run_tests
    
    echo ""
    echo -e "${GREEN}✅ All done!${NC}"
    echo ""
    echo "To stop the validator manually, run:"
    echo "  pkill -f solana-test-validator"
    echo ""
    echo "To view validator logs:"
    echo "  tail -f /tmp/solana-validator.log"
}

# Run main function
main

