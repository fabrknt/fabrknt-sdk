# Flow - Development Setup Guide

## Prerequisites

✅ **Already Installed:**

-   Rust 1.91.1
-   Solana CLI 3.0.10
-   Anchor CLI 0.32.1
-   Node.js v24.0.1

## Solana Configuration

Your Solana CLI is configured for:

-   **Cluster:** Devnet
-   **RPC URL:** https://api.devnet.solana.com
-   **Keypair:** ~/.config/solana/id.json
-   **Address:** AmSYugrtHAEZi3TDj3HP7qbjY1hw6uv1df1oFDMxKeb1

## Project Structure

```
flow/
├── programs/              # Solana programs (smart contracts)
│   └── flow/
│       ├── src/
│       │   └── lib.rs    # Main program entry point
│       └── Cargo.toml
├── tests/                # Integration tests
│   └── flow.ts
├── client/               # TypeScript client SDK (to be developed)
│   └── src/
├── scripts/              # Deployment and utility scripts
├── migrations/           # Anchor migrations
├── docs/                 # Documentation
├── Anchor.toml           # Anchor configuration
└── package.json          # Node.js dependencies
```

## Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Build the Program

```bash
anchor build
```

### 3. Run Tests

```bash
anchor test
```

### 4. Deploy to Devnet

```bash
# Make sure you have SOL in your devnet wallet
solana airdrop 2

# Deploy the program
anchor deploy
```

## Development Workflow

### Building

```bash
# Build the program
anchor build

# Build and deploy
anchor build && anchor deploy
```

### Testing

```bash
# Run all tests
anchor test

# Run tests with logs
anchor test -- --nocapture
```

### Local Development

For local development, you can use a local validator:

```bash
# Start local validator
solana-test-validator

# In another terminal, update Anchor.toml to use localnet
# Then build and deploy
anchor build
anchor deploy
```

## Next Steps

1. **Design Smart Contract Architecture**

    - Define account structures for LP positions
    - Design rebalancing logic
    - Plan x402 integration points

2. **Integrate Jupiter SDK**

    - Add Jupiter swap functionality
    - Implement slippage protection

3. **Set up x402 Integration**

    - Research PayAI Network Facilitator
    - Implement payment verification flow

4. **Create Client SDK**
    - TypeScript client for interacting with the program
    - Helper functions for common operations

## Useful Commands

```bash
# Check Solana configuration
solana config get

# Check balance
solana balance

# Get airdrop (devnet)
solana airdrop 2

# View program logs
solana logs

# Generate new keypair (if needed)
solana-keygen new
```

## Resources

-   [Anchor Documentation](https://www.anchor-lang.com/)
-   [Solana Cookbook](https://solanacookbook.com/)
-   [Jupiter API Docs](https://station.jup.ag/docs/apis/swap-api)
-   [x402 Protocol](https://x402.org/)
