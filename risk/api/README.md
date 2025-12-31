# Pulsar API Server

API server implementing the x402 protocol for pay-per-call RWA risk data access.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure `.env` with your settings:
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `TREASURY_WALLET` - Wallet to receive payments
- `PAYMENT_PROGRAM_ID` - Deployed program ID

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Payment

- `GET /api/v1/payment/quote?endpoint=<endpoint>` - Get payment quote
- `POST /api/v1/payment/verify` - Verify payment transaction

### Data (Requires x402 Authentication)

- `GET /api/v1/data/rwa-risk/:tokenMint` - Get RWA risk metrics
- `GET /api/v1/data/liquidation-params/:tokenMint` - Get liquidation parameters

## x402 Protocol

The API implements HTTP 402 "Payment Required" status code. Clients must include:
- `x-wallet-address` - Wallet public key
- `x-message` - Request message to sign
- `x-timestamp` - Request timestamp
- `x-payment-signature` - Base64-encoded signature

