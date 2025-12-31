# Pulsar Client SDK

TypeScript SDK for interacting with the Pulsar API using the x402 protocol.

## Installation

```bash
npm install @pulsar/client
```

## Usage

```typescript
import { PulsarClient } from '@pulsar/client';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

const client = new PulsarClient({
  apiUrl: 'https://api.pulsar.example.com',
  rpcUrl: 'https://api.mainnet-beta.solana.com',
  wallet: walletAdapter, // Your wallet adapter
});

// Get payment quote
const quote = await client.getPaymentQuote('rwa-risk');

// Get RWA risk data
const riskData = await client.getRwaRiskData(tokenMint);

// Get liquidation parameters
const params = await client.getLiquidationParams(tokenMint);
```

## Features

- Wallet signature generation
- Automatic x402 protocol headers
- Payment verification
- Type-safe API client

