# Deployment Guide

This guide covers deploying Risk to different Solana networks (localnet, devnet, and mainnet).

## Prerequisites

-   Solana CLI installed and configured
-   Anchor CLI installed
-   Rust toolchain (1.82.0+)
-   Node.js and npm installed
-   Sufficient SOL balance for deployment fees

## Quick Start

### Devnet Deployment (Recommended for Testing)

```bash
# 1. Setup devnet environment
./scripts/setup-devnet.sh

# 2. Build the program
npm run build

# 3. Deploy to devnet
./scripts/deploy.sh devnet

# 4. Update API configuration
cp api/.env.devnet api/.env
# Edit api/.env with the deployed program ID

# 5. Start API server
cd api && npm run dev
```

## Detailed Steps

### 1. Localnet Deployment

Localnet is for local development and testing.

```bash
# Start local validator
solana-test-validator

# In another terminal, deploy
./scripts/deploy.sh localnet
```

**Note**: The program ID for localnet is already configured in `Anchor.toml`.

### 2. Devnet Deployment

Devnet is Solana's public test network. It's free to use and perfect for testing.

#### Step 1: Setup Environment

```bash
# Run setup script
./scripts/setup-devnet.sh
```

This script will:

-   Configure Solana CLI for devnet
-   Check/create wallet
-   Request airdrop if needed

#### Step 2: Build Program

```bash
npm run build
```

#### Step 3: Deploy

```bash
./scripts/deploy.sh devnet
```

The script will:

-   Check wallet balance
-   Request airdrop if needed (< 1 SOL)
-   Build the program
-   Deploy to devnet
-   Display program ID and explorer link

#### Step 4: Update Configuration

After deployment, update the following:

1. **Anchor.toml**: Update `[programs.devnet]` section with the deployed program ID
2. **api/.env.devnet**: Update `PAYMENT_PROGRAM_ID` with the deployed program ID
3. **Copy env file**: `cp api/.env.devnet api/.env`

#### Step 5: Verify Deployment

```bash
# Check program on Solana Explorer
# The script will output the explorer URL

# Or check program account
solana program show <PROGRAM_ID> --url devnet
```

### 3. Mainnet Deployment

⚠️ **Warning**: Mainnet deployment requires real SOL and affects production. Only deploy when ready.

```bash
# 1. Ensure you have sufficient SOL (deployment costs ~2-3 SOL)
solana balance

# 2. Build for mainnet
npm run build

# 3. Deploy (will prompt for confirmation)
./scripts/deploy.sh mainnet
```

## Program ID Management

### Finding Your Program ID

After deployment, the program ID is:

-   Stored in: `target/deploy/risk-keypair.json`
-   Can be retrieved: `solana address -k target/deploy/risk-keypair.json`

### Updating Program ID

After deploying to a new network, update:

1. **Anchor.toml**:

    ```toml
    [programs.devnet]
    risk = "YOUR_PROGRAM_ID_HERE"
    ```

2. **api/.env**:

    ```env
    PAYMENT_PROGRAM_ID=YOUR_PROGRAM_ID_HERE
    ```

3. **programs/risk/src/lib.rs**:
    ```rust
    declare_id!("YOUR_PROGRAM_ID_HERE");
    ```

## API Server Configuration

### Environment Variables

Create `api/.env` from `api/.env.example`:

```bash
cd api
cp .env.example .env
```

Required variables:

-   `SOLANA_RPC_URL`: Solana RPC endpoint
-   `PAYMENT_PROGRAM_ID`: Deployed program ID
-   `TREASURY_WALLET`: Wallet address to receive payments
-   `USDC_MINT_ADDRESS`: USDC mint address for the network

### Network-Specific USDC Addresses

-   **Devnet**: `4zMMC9srt5Ri5X14GAgX6H8SuHpzKkXcXz4vB8kL8H9p` (test USDC)
-   **Mainnet**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (real USDC)

## Frontend Configuration

For devnet deployment, update `frontend/src/lib/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
```

Or set environment variable:

```bash
cd frontend
echo "VITE_API_URL=https://your-api-domain.com" > .env
```

## Troubleshooting

### Deployment Fails: Insufficient Funds

```bash
# Request airdrop (devnet only)
solana airdrop 2 --url devnet

# Check balance
solana balance --url devnet
```

### Program ID Mismatch

If you get "DeclaredProgramIdMismatch" error:

1. Check the program ID in `Anchor.toml`
2. Check the program ID in `programs/risk/src/lib.rs`
3. Ensure they match the deployed program ID

### Build Errors

```bash
# Clean and rebuild
anchor clean
npm run build
```

### RPC Connection Issues

If RPC is slow or timing out:

1. Use a private RPC endpoint (Helius, QuickNode, etc.)
2. Update `SOLANA_RPC_URL` in `api/.env`
3. For Anchor, set in `Anchor.toml`:
    ```toml
    [provider]
    cluster = "devnet"
    ```

## Post-Deployment Checklist

-   [ ] Program deployed successfully
-   [ ] Program ID updated in `Anchor.toml`
-   [ ] Program ID updated in `api/.env`
-   [ ] Program ID updated in `programs/risk/src/lib.rs`
-   [ ] API server starts without errors
-   [ ] Frontend can connect to API
-   [ ] Payment flow tested end-to-end
-   [ ] Program visible on Solana Explorer

## Network URLs

-   **Localnet**: `http://localhost:8899`
-   **Devnet**: `https://api.devnet.solana.com`
-   **Mainnet**: `https://api.mainnet-beta.solana.com`

## Explorer Links

After deployment, view your program:

-   **Devnet**: `https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet`
-   **Mainnet**: `https://explorer.solana.com/address/<PROGRAM_ID>`

## Next Steps

After successful deployment:

1. Test payment flow end-to-end
2. Initialize gateway on-chain
3. Test API endpoints
4. Update frontend to use deployed program
5. Prepare for mainnet deployment
