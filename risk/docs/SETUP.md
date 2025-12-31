# Risk Setup Guide

## Prerequisites

-   Rust (1.78.0+)
-   Solana CLI (1.18+)
-   Anchor CLI (0.30.0+)
-   Node.js (20+)
-   npm or yarn

## Installation

### 1. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

### 2. Install Anchor

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### 3. Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces
```

## Development Setup

### 1. Build Solana Programs

```bash
anchor build
```

### 2. Run Tests

```bash
anchor test
```

### 3. Start API Server

```bash
cd api
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 4. Start Web Frontend

```bash
# From project root
npm run frontend:dev

# Or from frontend directory
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

**Note**: The frontend works standalone with mock data if the API server is not running, making it perfect for customer demonstrations.

### 5. Deploy to Localnet

```bash
# Start local validator
solana-test-validator

# In another terminal, deploy
./scripts/deploy.sh localnet
```

## Configuration

### API Server Environment Variables

Copy `api/.env.example` to `api/.env` and configure:

-   `SOLANA_RPC_URL` - Solana RPC endpoint
-   `TREASURY_WALLET` - Wallet address to receive payments
-   `PAYMENT_PROGRAM_ID` - Deployed program ID
-   `USDC_MINT_ADDRESS` - USDC mint address

## Project Structure

```
risk/
├── programs/
│   └── risk/     # Solana program
├── api/                    # API server
│   ├── src/
│   │   ├── index.ts        # Express server
│   │   ├── routes/         # API routes
│   │   └── middleware/     # Auth middleware
├── client/                 # Client SDK
│   └── src/
│       └── index.ts        # PulsarClient
├── frontend/               # Web Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/        # React contexts
│   │   └── lib/            # API client
│   └── index.html          # HTML entry
├── tests/                  # Integration tests
└── docs/                   # Documentation
```

## Next Steps

1. Deploy program to devnet
2. Configure API server
3. Start frontend for customer demos
4. Test x402 payment flow
5. Integrate Switchboard Surge oracle
6. Add real RWA risk data sources

## Quick Start for Customer Demos

To quickly demonstrate the frontend to customers:

```bash
# Terminal 1: Start API server (optional - frontend works with mock data)
npm run api:dev

# Terminal 2: Start frontend
npm run frontend:dev
```

Open `http://localhost:5173` in your browser. The frontend will automatically use mock data if the API server is not running.
