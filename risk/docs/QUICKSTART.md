# Quick Start Guide - Devnet Deployment

This guide will help you quickly deploy Risk to Solana devnet.

## Prerequisites Check

Run the setup check:

```bash
npm run check:devnet
```

This will verify:

-   ✅ Solana CLI is installed
-   ✅ Anchor CLI is installed
-   ✅ Wallet is configured
-   ✅ Program is built

## Step-by-Step Deployment

### 1. Setup Devnet Environment

```bash
npm run setup:devnet
```

This will:

-   Configure Solana CLI for devnet
-   Check/create your wallet
-   Request airdrop if needed (< 2 SOL)

### 2. Build the Program

```bash
npm run build
```

### 3. Deploy to Devnet

```bash
npm run deploy:devnet
```

The script will:

-   Check your wallet balance
-   Request airdrop if needed
-   Build the program
-   Deploy to devnet
-   Display the program ID and explorer link

### 4. Configure API Server

```bash
cd api
cp .env.example .env
```

Edit `api/.env` and update:

-   `PAYMENT_PROGRAM_ID` with the deployed program ID (from step 3)
-   Verify other settings are correct

### 5. Start API Server

```bash
cd api
npm run dev
```

The API server will start on `http://localhost:3000`

### 6. Start Frontend (Optional)

```bash
npm run frontend:dev
```

The frontend will start on `http://localhost:5173`

## Verify Deployment

1. **Check Program on Explorer**: The deploy script will output an explorer URL
2. **Test API Endpoints**:
    ```bash
    curl http://localhost:3000/health
    curl http://localhost:3000/api/v1/payment/quote?endpoint=rwa-risk
    ```
3. **Test Frontend**: Open `http://localhost:5173` and try connecting a wallet

## Troubleshooting

### Insufficient SOL

If you get "insufficient funds" error:

```bash
solana airdrop 2 --url devnet
```

### Program ID Mismatch

If deployment fails with "DeclaredProgramIdMismatch":

1. Check `Anchor.toml` - ensure `[programs.devnet]` has the correct ID
2. Check `programs/risk/src/lib.rs` - ensure `declare_id!` matches
3. If using a new program ID, update both files

### API Connection Issues

If API can't connect to devnet:

1. Check `api/.env` - ensure `SOLANA_RPC_URL` is set to devnet
2. Try a different RPC endpoint (Helius, QuickNode, etc.)

## Next Steps

After successful deployment:

1. ✅ Test payment flow end-to-end
2. ✅ Initialize gateway on-chain
3. ✅ Test API endpoints with real wallet
4. ✅ Update frontend to use deployed program
5. ✅ Prepare for customer demos

## Useful Commands

```bash
# Check devnet setup
npm run check:devnet

# Setup devnet environment
npm run setup:devnet

# Build program
npm run build

# Deploy to devnet
npm run deploy:devnet

# Check program on explorer
# (URL will be shown after deployment)

# View program account
solana program show <PROGRAM_ID> --url devnet
```

## Network Information

-   **RPC URL**: `https://api.devnet.solana.com`
-   **Explorer**: `https://explorer.solana.com/?cluster=devnet`
-   **Airdrop**: Free SOL available via `solana airdrop`
