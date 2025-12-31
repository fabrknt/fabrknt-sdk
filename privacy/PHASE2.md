# Phase 2: ZK Compression Integration - Implementation Guide

## Overview

Phase 2 adds full ZK Compression support using Light Protocol, enabling:

-   **99.98% cost reduction** compared to standard SPL tokens
-   **Privacy-preserving transfers** using zero-knowledge proofs
-   **Scalable airdrops** to millions of users
-   **Automatic Merkle proof** generation via Photon API

## What Was Implemented

### 1. Light Protocol RPC Connection (`src/lib/connection.ts`)

-   Implemented `createLightRpc()` function using Light Protocol's `createRpc`
-   Connects to Photon API for compressed state indexing
-   Enables Merkle proof fetching and ZK proof generation

### 2. Compressed Account Utilities (`src/lib/compressed-account.ts`)

**Functions implemented:**

-   `createCompressedAccount()` - Mint compressed tokens directly
-   `compressTokens()` - Compress existing SPL tokens
-   `transferCompressed()` - Transfer compressed tokens with ZK proofs
-   `getCompressedBalance()` - Query compressed token balances
-   `ensureTokenPool()` - Create token pool for a mint

**How it works:**

```typescript
// Create compressed tokens
const signature = await createCompressedAccount(
    lightRpc,
    payer,
    recipientAddress,
    mint,
    BigInt(1000000)
);

// Transfer with automatic ZK proofs
const txSig = await transferCompressed(
    lightRpc,
    payer,
    owner,
    toAddress,
    mint,
    BigInt(500000)
);
```

### 3. Enhanced PrivateAirdrop Class (`src/lib/airdrop.ts`)

**Updates:**

-   Added `lightRpc` parameter to constructor
-   Implemented `processCompressedBatch()` method
-   Automatic token pool creation
-   Batch processing with compression

**Usage:**

```typescript
const airdrop = new PrivateAirdrop(
    connection,
    config,
    lightRpc // Pass Light RPC for compression
);

// Set useCompression: true in config
const results = await airdrop.execute();
```

### 4. Examples

**Compressed Transfer Example** (`src/examples/compressed-transfer.ts`):

-   Creates compressed token mint
-   Mints compressed tokens
-   Transfers between addresses
-   Checks compressed balances

## Setup Requirements

### 1. Get a Helius API Key

Compressed tokens require a Photon RPC endpoint with indexing support.

**Free Helius Account (Recommended):**

1. Go to https://www.helius.dev/
2. Sign up for a free account
3. Create a new API key
4. Copy your API key

**Update `.env`:**

```bash
# Use your Helius API key
PHOTON_RPC_URL=https://devnet.helius-rpc.com?api-key=YOUR_HELIUS_API_KEY
```

### 2. Verify Installation

All required packages are already installed:

-   `@lightprotocol/stateless.js@0.9.0`
-   `@lightprotocol/compressed-token@0.8.0`

## Testing Phase 2

### Test 1: Compressed Transfer

```bash
# Make sure your .env has a valid PHOTON_RPC_URL
npm run example:transfer
```

**Expected output:**

```
✓ Compressed mint created: [address]
✓ Compressed tokens minted: [signature]
✓ Compressed transfer complete: [signature]

Final Balances:
Recipient 1: 50000
Recipient 2: 50000
```

### Test 2: Compressed Airdrop

Update `src/examples/private-airdrop.ts`:

```typescript
const airdrop = new PrivateAirdrop(
    connection,
    {
        mint,
        authorityKeypair,
        recipients,
        batchSize: 5,
        useCompression: true, // Enable compression!
    },
    lightRpc // Pass the Light RPC
);
```

Then run:

```bash
npm run example:airdrop
```

## Architecture

### Data Flow for Compressed Transfers

```
┌─────────────────┐
│  User Initiates │
│    Transfer     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Fetch Merkle   │◄──── Photon API
│     Proof       │      (Indexer)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Generate ZK    │
│     Proof       │◄──── Client-side
│  (Groth16)      │      WASM prover
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Submit to Chain │
│  (128 bytes)    │──────► Solana
└─────────────────┘

         │
         ▼
┌─────────────────┐
│  Update State   │
│      Root       │
└─────────────────┘
```

### Cost Comparison

| Operation       | Standard SPL | ZK Compressed | Savings |
| --------------- | ------------ | ------------- | ------- |
| 100 Airdrops    | ~0.20 SOL    | ~0.0005 SOL   | 99.75%  |
| 1,000 Airdrops  | ~2.0 SOL     | ~0.005 SOL    | 99.75%  |
| 10,000 Airdrops | ~20 SOL      | ~0.054 SOL    | 99.73%  |

## Technical Details

### Merkle Tree Structure

Compressed accounts are stored in a **Sparse Binary Merkle Tree**:

-   Each leaf = hash of compressed account data
-   Only 32-byte state root stored on-chain
-   Full account data in ledger space (cheap)

### ZK Proof System

Uses **Groth16** for constant-size proofs:

-   Proof size: 128 bytes (regardless of tree depth)
-   Verification time: O(1)
-   Proves account membership and state transitions

### Nullifier Queue

Prevents double-spending:

-   Each spent account → nullifier hash
-   Nullifier added to on-chain queue
-   Forester nodes periodically flush queue

## Troubleshooting

### Error: "HTTP error! status: 401"

**Solution:** Invalid or missing Helius API key

-   Get a free key from https://www.helius.dev/
-   Update `PHOTON_RPC_URL` in `.env`

### Error: "AccountNotInitialized: token_pool_pda"

**Solution:** Need to create token pool for the mint

-   Use `ensureTokenPool()` before minting
-   Or use `createMint()` from `@lightprotocol/compressed-token`

### Error: "Simulation failed"

**Solution:** Check these common issues:

-   Sufficient SOL balance for fees
-   Valid Photon RPC endpoint
-   Using compressed-compatible mint (not standard SPL)

## Next Steps (Phase 3)

Now that compression is working, you can:

1. **Build Production Features:**

    - Web UI for airdrop management
    - CSV upload for recipient lists
    - Real-time progress tracking

2. **Optimize Performance:**

    - Parallel batch processing
    - Proof caching
    - Custom Merkle tree parameters

3. **Add Advanced Features:**

    - Selective disclosure (audit keys)
    - Scheduled airdrops
    - Conditional distributions

4. **Deploy to Mainnet:**
    - Security audit
    - Mainnet RPC setup
    - Monitoring and alerting

## Resources

-   **Light Protocol Docs:** https://docs.lightprotocol.com/
-   **Helius Photon API:** https://docs.helius.dev/compression-and-das-api/digital-asset-standard-das-api
-   **ZK Compression Guide:** https://www.zkcompression.com/
-   **Solana Web3.js:** https://solana-labs.github.io/solana-web3.js/

## Support

For issues or questions:

-   GitHub Issues: https://github.com/fabrknt/privacy/issues
-   Light Protocol Discord: https://discord.gg/lightprotocol
-   Solana Discord: #zk-compression channel
