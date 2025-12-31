# Setup Guide - Privacy SSM

This guide walks you through setting up the Privacy Shielded State Middleware for testing private airdrops on Solana devnet.

## Prerequisites

-   Node.js 18+ and npm
-   Solana CLI tools installed
-   Basic understanding of Solana and SPL tokens

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
SOLANA_RPC_URL=https://api.devnet.solana.com
PHOTON_RPC_URL=https://devnet.helius-rpc.com?api-key=YOUR_KEY
AIRDROP_AUTHORITY_PRIVATE_KEY=your_base58_private_key
MINT_ADDRESS=your_token_mint_address
NETWORK=devnet
```

## Step 3: Create a Wallet

If you don't have a Solana keypair:

```bash
solana-keygen new --outfile ~/.config/solana/devnet.json
```

Get the private key in base58 format:

```bash
solana-keygen pubkey ~/.config/solana/devnet.json
cat ~/.config/solana/devnet.json | jq -r '.[0:32] | @base64'
```

Or use a tool to convert the array to base58.

## Step 4: Fund Your Wallet

Get devnet SOL:

```bash
solana airdrop 2 --url devnet
```

## Step 5: Create a Test Token

Create a new SPL token mint:

```bash
spl-token create-token --decimals 6
```

Note the token mint address and add it to `.env` as `MINT_ADDRESS`.

Mint some tokens to your authority account:

```bash
spl-token create-account <MINT_ADDRESS>
spl-token mint <MINT_ADDRESS> 1000000
```

## Step 6: Build the Project

```bash
npm run build
```

## Step 7: Run Examples

### Private Airdrop (Standard SPL)

```bash
npm run example:airdrop
```

This runs a basic airdrop using standard SPL token transfers. Modify `src/examples/private-airdrop.ts` to add your own recipient addresses.

### Compressed Transfer Demo

```bash
npm run example:transfer
```

This demonstrates the workflow for compressed transfers (requires full Light Protocol integration).

## Next Steps

### For Testing with Real Recipients

1. Edit `src/examples/private-airdrop.ts`
2. Replace the dummy recipient addresses with real devnet addresses
3. Adjust the amounts as needed
4. Run `npm run example:airdrop`

### For ZK Compression Integration

To enable true privacy with ZK Compression:

1. **Deploy Light Protocol Programs**

    - Follow Light Protocol's deployment guide
    - Configure program IDs in your code

2. **Set Up Photon RPC**

    - Get API key from Helius
    - Add to `.env` as `PHOTON_RPC_URL`

3. **Implement ZK Circuits**

    - Use `zk.js` from Light Protocol
    - Create custom circuits for your use case
    - See `TECHSPEC.md` for details

4. **Enable Compression**
    - In `src/examples/private-airdrop.ts`, set `useCompression: true`
    - Implement the compressed transfer logic in `src/lib/compressed-account.ts`

## Troubleshooting

### "Transaction simulation failed"

Check that:

-   Your authority wallet has enough SOL for fees
-   You have enough tokens in your source account
-   Recipient addresses are valid Solana addresses

### "Failed to get compressed balance"

This means full Light Protocol integration is not yet complete. The current version uses standard SPL tokens as a foundation.

### Version conflicts

If you encounter dependency conflicts:

```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## Resources

-   [Light Protocol Docs](https://www.lightprotocol.com/docs)
-   [ZK Compression Guide](https://www.zkcompression.com)
-   [Solana Cookbook](https://solanacookbook.com)
-   [Helius Photon RPC](https://docs.helius.dev/compression-and-das-api/compression-rpc)
