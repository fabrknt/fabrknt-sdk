# Installation Guide

Complete guide to installing and setting up Fabrknt.

> **🚀 Want to try Fabrknt immediately?** Check out our [Hello World Example](../examples/hello-world) - it runs in < 5 minutes with zero setup!

> **⚠️ BETA - DEVNET/TESTNET RECOMMENDED**
> Fabrknt is actively developed and tested on devnet/testnet. Individual modules have varying maturity levels. **We strongly recommend starting with devnet/testnet** before any mainnet deployment. See [Known Limitations](../KNOWN_LIMITATIONS.md) for details.

## Environment Recommendations

| Environment | Recommended For | Modules Ready | Notes |
|-------------|----------------|---------------|-------|
| **Devnet** | Development, Testing, Learning | Guard, Risk, Loom | ✅ **Start here** - Free SOL from faucet |
| **Testnet** | Integration Testing, Staging | Guard, Risk, Loom | Pre-production validation |
| **Mainnet** | Production (with caution) | Risk (MVP), Guard (basic) | ⚠️ Review [Module Status](../README.md#module-status) first |

**Not Ready for Any Environment**: Flow (in development), Privacy (experimental)

## Prerequisites

-   **Node.js**: Version 18 or higher
-   **npm** or **yarn**: Package manager
-   **TypeScript**: Recommended (Fabrknt is written in TypeScript)
-   **Solana Wallet**: For testing (use a test wallet!)

## Installation Methods

### Method 1: Install from npm (Recommended)

Install the published package from npm:

```bash
npm install @fabrknt/sdk
# or
yarn add @fabrknt/sdk
# or
pnpm add @fabrknt/sdk
```

### Method 2: Install from GitHub (Development)

For development or contributing, install directly from GitHub:

```bash
# Clone the repository
git clone https://github.com/fabrknt/fabrknt.git
cd fabrknt

# Install dependencies
npm install

# Install Solana dependencies
npm install @solana/web3.js @solana/spl-token
```

> **✅ Available:** npm package `@fabrknt/sdk` is now available on npm!

## Environment Setup

### 1. Create `.env` File

Create a `.env` file in the project root:

```bash
# Solana RPC endpoint
# Use public endpoint or get your own from:
# - Helius: https://helius.dev
# - QuickNode: https://quicknode.com
# - Alchemy: https://www.alchemy.com/solana

SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# For devnet testing (recommended for development)
# SOLANA_RPC_URL=https://api.devnet.solana.com

# Your wallet private key (base58 encoded)
# ⚠️ WARNING: Use a test wallet only! Never use your main wallet private key.
WALLET_PRIVATE_KEY=your-private-key-base58

# Enable dry-run mode (no real transactions)
# Set to "true" for testing, "false" for production
DRY_RUN=true

# Optional: Custom RPC endpoint with API key
# SOLANA_RPC_URL=https://your-rpc-endpoint.com
```

### 2. Get a Solana RPC Endpoint

#### Option A: Public Endpoint (Free, Rate Limited)

```bash
# Mainnet
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# Devnet (for testing)
SOLANA_RPC_URL=https://api.devnet.solana.com
```

#### Option B: Dedicated RPC (Recommended for Production)

**Helius** (Recommended):

1. Sign up at [helius.dev](https://helius.dev)
2. Create a new project
3. Copy your RPC URL
4. Add to `.env`: `SOLANA_RPC_URL=https://your-helius-url.com`

**QuickNode**:

1. Sign up at [quicknode.com](https://quicknode.com)
2. Create a Solana endpoint
3. Copy your RPC URL
4. Add to `.env`

### 3. Set Up a Test Wallet

**⚠️ Important**: Always use a test wallet for development!

#### Option A: Generate New Test Wallet

```typescript
import { Keypair } from "@solana/web3.js";

const testWallet = Keypair.generate();
console.log("Public Key:", testWallet.publicKey.toBase58());
console.log(
    "Private Key:",
    Buffer.from(testWallet.secretKey).toString("base58")
);
```

#### Option B: Use Solana CLI

```bash
# Generate new keypair
solana-keygen new --outfile ~/.config/solana/test-wallet.json

# Get public key
solana-keygen pubkey ~/.config/solana/test-wallet.json

# Get private key (base58)
cat ~/.config/solana/test-wallet.json | jq -r '.[:64]' | base58
```

#### Option C: Use Phantom Wallet

1. Create a new wallet in Phantom
2. Export private key (Settings → Security → Export Private Key)
3. Convert to base58 format

### 4. Fund Your Test Wallet (Devnet)

For devnet testing, get free SOL from a faucet:

```bash
# Using Solana CLI
solana airdrop 2 YOUR_WALLET_ADDRESS --url devnet

# Or use web faucet
# https://faucet.solana.com/
```

## Verify Installation

### 1. Check Node.js Version

```bash
node --version
# Should be v18.0.0 or higher
```

### 2. Verify Dependencies

```bash
npm list @solana/web3.js @solana/spl-token
# Should show installed versions
```

### 3. Test Import

Create a test file `test-import.ts`:

```typescript
import { BatchPayoutPattern, Guard } from "./src/index";
import { Connection } from "@solana/web3.js";

console.log("✅ Fabrknt imported successfully!");
console.log("✅ Solana Web3.js imported successfully!");
```

Run it:

```bash
npx tsx test-import.ts
```

If you see the success messages, installation is complete!

## Project Structure

After installation, your project structure should look like:

```
fabrknt/
├── src/                    # Source code
│   ├── patterns/          # Pattern library
│   ├── guard/             # Guard security
│   ├── loom/              # Parallel execution
│   ├── dex/               # DEX integration
│   └── ...
├── examples/              # Example implementations
├── docs/                  # Documentation
├── tests/                 # Test suite
├── package.json          # Dependencies
└── .env                   # Environment variables (create this)
```

## Next Steps

1. ✅ Installation complete
2. 📚 Read [Getting Started Guide](./getting-started.md)
3. 🔍 Explore [Examples](../examples/)
4. 🛠️ Build your first pattern

## Troubleshooting

### "Cannot find module '@fabrknt/sdk'"

You're trying to use the npm package, but it's not published yet. Install from GitHub instead:

```bash
git clone https://github.com/fabrknt/fabrknt.git
cd fabrknt
npm install
```

### "Cannot find module '@solana/web3.js'"

Install Solana dependencies:

```bash
npm install @solana/web3.js @solana/spl-token
```

### "RPC endpoint error"

-   Check your `SOLANA_RPC_URL` in `.env`
-   Verify the endpoint is accessible
-   For devnet, use `https://api.devnet.solana.com`
-   For production, use a dedicated RPC provider

### "Insufficient funds"

-   For devnet: Get SOL from [faucet.solana.com](https://faucet.solana.com)
-   For mainnet: Transfer SOL to your wallet
-   Check wallet balance: `solana balance YOUR_ADDRESS`

### TypeScript Errors

Make sure TypeScript is installed:

```bash
npm install -D typescript @types/node
```

## Production Deployment

### Security Checklist

-   [ ] Use environment variables for private keys (never hardcode)
-   [ ] Use a dedicated RPC endpoint (not public)
-   [ ] Enable Guard security validation
-   [ ] Set appropriate slippage limits
-   [ ] Use multi-sig wallets for high-value operations
-   [ ] Implement rate limiting
-   [ ] Set up monitoring and alerting

### Infrastructure

-   [ ] Set up monitoring (Datadog, Sentry, etc.)
-   [ ] Configure logging
-   [ ] Set up database for state management
-   [ ] Implement retry logic with exponential backoff
-   [ ] Archive reports for compliance

## Resources

-   **[Getting Started](./getting-started.md)** - Build your first pattern
-   **[Core Concepts](./concepts.md)** - Understand architecture
-   **[Examples](../examples/)** - Complete examples
-   **GitHub**: [github.com/fabrknt/fabrknt](https://github.com/fabrknt/fabrknt)

## Support

-   **GitHub Issues**: Report bugs or request features
-   **Discord**: [discord.gg/fabrknt](https://discord.gg/fabrknt)
-   **Documentation**: See `docs/` directory
