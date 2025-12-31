# 🔒 Privacy

**ZK Compression and Privacy Infrastructure for Solana - Shielded State Middleware**

> **⚠️ Beta:** Privacy is currently in beta (development). Active development in progress.

Privacy provides ZK Compression (Zero-Knowledge Compression) infrastructure for Solana, enabling cost-efficient private transactions and state management. Built on Light Protocol's ZK Compression technology, it dramatically reduces costs while providing privacy-by-default through compressed state.

[Repository](https://github.com/fabrknt/fabrknt-sdk/tree/main/privacy) | [Documentation](./docs/) | [Issues](https://github.com/fabrknt/fabrknt-sdk/issues)

---

## Quick Start

### Standard SPL Airdrop (Working)

```bash
npm install
cp .env.example .env
# Edit .env with your configuration
npm run build
npm run example:airdrop
```

### ZK Compressed Airdrop (Phase 2 - Ready to Test)

```bash
# Get free Helius API key from https://www.helius.dev/
# Add to PHOTON_RPC_URL in .env
npm run example:transfer  # Test compressed transfers
# See PHASE2.md for full guide
```

---

## Overview

Privacy leverages **ZK Compression** technology co-developed by Light Protocol and Helius to solve Solana's "State Bloat" problem. By moving account data from expensive validator RAM to affordable ledger archives, ZK Compression enables:

-   **99.98% Cost Reduction** - Creating 100 token accounts costs 0.00004 SOL vs 0.20 SOL
-   **Privacy by Default** - Compressed data is hashed and hidden from on-chain state
-   **Massive Scale** - Airdrop to 1M users costs ~$50 USD vs ~$260,000 USD

### Why Privacy?

ZK Compression represents a paradigm shift where **"Scalability"** and **"Privacy"** become inseparable elements at Solana's base layer. Because compressed data is hashed and hidden by default, developers naturally integrate privacy features through the economic incentive of compression.

This **"ZK for Scaling"** approach cleverly avoids regulatory concerns and UX friction associated with traditional "ZK for Privacy." From 2025 onwards, privacy will likely proliferate as a byproduct of efficiency.

---

## Features

### 🎯 Core Capabilities

**ZK Compression**

-   **State Compression** - Move data from validator RAM to ledger archives
-   **Merkle Tree Management** - Sparse Binary Merkle Trees with 32-byte state roots
-   **Groth16 Proofs** - Fixed 128-byte verification regardless of tree depth
-   **Cost Optimization** - 99.98% reduction in account creation costs

**Privacy Features**

-   **Shielded Transfers** - Private token distributions without exposing recipients
-   **Compressed Accounts** - Cost-efficient account creation for millions of users
-   **Selective Disclosure** - Auditor keys for compliance without compromising privacy
-   **Nullifier Tracking** - Prevents double-spending in compressed state

**Developer Tools**

-   **TypeScript SDK** - Easy integration with existing Solana applications
-   **Photon API Integration** - Helius Photon API for compressed account data
-   **Example Implementations** - Private airdrops and compressed transfers
-   **Comprehensive Documentation** - Setup guides and technical specifications

### 🏗️ Architecture

Privacy uses Light Protocol's ZK Compression infrastructure:

-   **Sparse Binary Merkle Trees** - Dynamic state management
-   **Nullifier Queue** - Tracks used/invalidated states
-   **Address Queue** - Assigns unique addresses in 254-bit space
-   **Foresters** - Protocol participants maintaining queue state

---

## Usage Examples

### Private Airdrop

```typescript
import { PrivateAirdrop } from "privacy";

const airdrop = new PrivateAirdrop(connection, {
    mint,
    authorityKeypair,
    recipients: [
        { address: recipient1, amount: BigInt(1000000) },
        { address: recipient2, amount: BigInt(500000) },
    ],
    batchSize: 5,
    useCompression: true, // Enable ZK Compression
});

const results = await airdrop.execute();
```

### Compressed Transfer

```typescript
import {
    createCompressedAccount,
    transferCompressed,
    getCompressedBalance,
} from "./lib/compressed-account";

// Create compressed token account
const mintSig = await createCompressedAccount(
    lightRpc,
    payer,
    recipient.publicKey,
    mint,
    amount
);

// Transfer compressed tokens
const transferSig = await transferCompressed(
    lightRpc,
    payer,
    owner,
    recipient2.publicKey,
    mint,
    transferAmount
);
```

---

## Documentation

-   [Setup Guide](./SETUP.md) - Installation and configuration
-   [Demo Guide](./DEMO.md) - Complete demo walkthrough
-   [Phase 2 Guide](./PHASE2.md) - ZK Compression integration
-   [Technical Specification](./TECHSPEC.md) - Shielded State Middleware details

---

## Market Opportunities

Combined with Solana's roadmap (Firedancer, Alpenglow), four areas are expected to see high demand by 2026:

1.  **Confidential Payroll & B2B Payments** - Hide amounts while allowing auditability
2.  **Privacy-Preserving DAO Governance** - Blind voting with ZK circuits
3.  **Confidential Order Books (Dark Pools)** - MEV mitigation through hidden orders
4.  **On-Chain Gaming** - Hidden information and fog of war mechanics

---

## Contributing

Privacy is part of the [Fabrknt](https://github.com/fabrknt/fabrknt) ecosystem. Contributions are welcome!

1.  Fork the repository
2.  Create a feature branch
3.  Make your changes
4.  Submit a pull request

---

## License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## Related Projects

-   [Fabrknt SDK](https://github.com/fabrknt/fabrknt) - Main SDK integrating Guard, Loom, Flow, Risk, and Privacy
-   [Guard](https://github.com/fabrknt/guard) - Security validation layer
-   [Loom](https://github.com/fabrknt/loom) - Parallel execution optimization
-   [Flow](https://github.com/fabrknt/flow) - Multi-DEX liquidity routing
-   [Risk](https://github.com/fabrknt/risk) - AI-driven risk assessment
