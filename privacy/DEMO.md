# Privacy SSM - Private Airdrop Demo

This document demonstrates the proof of concept for private airdrops using Privacy's Shielded State Middleware.

## Overview

Privacy SSM enables private token distributions on Solana with:

-   **Cost Reduction**: 99.98% cheaper than standard airdrops using ZK Compression
-   **Privacy**: Recipient amounts and identities can be shielded
-   **Scalability**: Batch processing with configurable batch sizes
-   **Flexibility**: Works with standard SPL tokens now, ZK Compression ready

## Architecture

```
┌─────────────────┐
│  Airdrop Config │
│  - Recipients   │
│  - Amounts      │
│  - Token Mint   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PrivateAirdrop  │
│    Engine       │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌────────┐ ┌──────────────┐
│ SPL    │ │ ZK Compress  │
│ Token  │ │ (Future)     │
└────────┘ └──────────────┘
```

## Current Implementation (v0.1.0)

### Standard Mode

Uses SPL token transfers with:

-   Automatic token account creation
-   Batch processing (configurable size)
-   Error handling and retry logic
-   Detailed transaction logging

### Example Usage

```typescript
import { PrivateAirdrop } from 'privacy';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

// Setup
const connection = new Connection('https://api.devnet.solana.com');
const authority = Keypair.fromSecretKey(...);
const mint = new PublicKey('...');

// Define recipients
const recipients = [
  {
    address: new PublicKey('...'),
    amount: BigInt(1000000),
    metadata: {
      label: 'Early Adopter',
      eligibilityReason: 'Held tokens > 90 days'
    }
  },
  // ... more recipients
];

// Execute airdrop
const airdrop = new PrivateAirdrop(connection, {
  mint,
  authorityKeypair: authority,
  recipients,
  batchSize: 10,
  useCompression: false
});

const results = await airdrop.execute();
```

## Cost Analysis

### Standard SPL Token Airdrop (Current)

| Recipients | Rent Exemption | Transaction Fees | Total Cost |
| ---------- | -------------- | ---------------- | ---------- |
| 100        | ~0.20 SOL      | ~0.0005 SOL      | ~0.20 SOL  |
| 1,000      | ~2.0 SOL       | ~0.005 SOL       | ~2.0 SOL   |
| 10,000     | ~20 SOL        | ~0.05 SOL        | ~20 SOL    |

### With ZK Compression (Future)

| Recipients | Storage Cost | Transaction Fees | Total Cost  | Savings |
| ---------- | ------------ | ---------------- | ----------- | ------- |
| 100        | ~0.00004 SOL | ~0.0005 SOL      | ~0.0005 SOL | 99.75%  |
| 1,000      | ~0.0004 SOL  | ~0.005 SOL       | ~0.005 SOL  | 99.75%  |
| 10,000     | ~0.004 SOL   | ~0.05 SOL        | ~0.054 SOL  | 99.73%  |

## Privacy Features

### Current (Standard SPL)

-   ✓ Recipient list not stored on-chain
-   ✓ Metadata kept off-chain
-   ✗ Transaction amounts visible
-   ✗ Recipient addresses visible

### With ZK Compression (Roadmap)

-   ✓ Recipient list not stored on-chain
-   ✓ Metadata kept off-chain
-   ✓ Transaction amounts hidden via ZK proofs
-   ✓ Recipient addresses obscured via shielded pools

## Use Cases

### 1. Token Launches

Private airdrops to early supporters without revealing allocation sizes.

### 2. Payroll Distribution

Confidential salary payments where employees can't see each other's compensation.

### 3. Rewards Programs

Gaming rewards or loyalty points distributed privately.

### 4. Governance Incentives

DAO token distributions based on private voting participation.

## Roadmap to Full ZK Compression

### Phase 1: Foundation (Current)

-   ✓ Project structure
-   ✓ Standard SPL token airdrop
-   ✓ Batch processing
-   ✓ Documentation

### Phase 2: Light Protocol Integration (Next)

-   Deploy Light Protocol programs on devnet
-   Integrate Photon RPC for Merkle proofs
-   Implement compressed account creation
-   Test basic compressed transfers

### Phase 3: ZK Proof Generation

-   Set up `zk.js` circuits
-   Implement proof generation for transfers
-   Optimize WASM prover for performance
-   Add client-side proof verification

### Phase 4: Production Ready

-   Security audit
-   Mainnet deployment
-   Forester-as-a-Service infrastructure
-   UI/UX for non-developers

## Demo Walkthrough

### Prerequisites

```bash
npm install
cp .env.example .env
# Edit .env with your configuration
```

### Step 1: Create Test Accounts

```bash
solana airdrop 2 --url devnet
spl-token create-token --decimals 6
spl-token create-account <MINT>
spl-token mint <MINT> 1000000
```

### Step 2: Configure Recipients

Edit `src/examples/private-airdrop.ts` with real addresses.

### Step 3: Run Airdrop

```bash
npm run example:airdrop
```

### Expected Output

```
=== Privacy SSM - Private Airdrop Demo ===

Network Configuration:
- RPC: https://api.devnet.solana.com
- Network: devnet

Authority: 7xK...ABC
Token Mint: 9wQ...XYZ

Recipients: 10
Authority SOL balance: 1.5 SOL

--- Starting Airdrop ---

Processing batch 1 (5 recipients)
✓ Sent 1000000 to 3dH...123
✓ Sent 500000 to 8jK...456
...

--- Airdrop Results ---
Total: 10
Successful: 10
Failed: 0

✓ Airdrop complete!
```

## Next Steps

1. **Test on Devnet**: Run the demo with small amounts
2. **Customize**: Modify recipient lists and amounts
3. **Integrate**: Add to your existing token distribution flow
4. **Prepare for ZK**: Review TECHSPEC.md for compression details
5. **Scale**: Test with larger recipient lists (100+ addresses)

## Support & Contributing

-   Issues: Report on GitHub
-   Docs: See README.md and TECHSPEC.md
-   Community: Join Solana Discord #zk-compression

## Security Considerations

-   Never commit private keys to git
-   Test thoroughly on devnet before mainnet
-   Verify recipient addresses before execution
-   Monitor transaction fees and success rates
-   Keep authority keypair secure (hardware wallet recommended)

## License

MIT License - See LICENSE file for details
