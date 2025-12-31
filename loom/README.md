# 🧵 Loom

**High-performance infrastructure for Solana DeFi - Parallel execution optimization and inclusion assurance**

> **⚠️ Beta:** Loom is currently in beta (development). Active development in progress.

Loom (SolFabric) provides the underlying infrastructure layer that delivers "Inclusion Assurance" and high-performance execution for Solana DeFi applications. It acts as a bridge between off-chain bots/users and on-chain validators, leveraging Jito Bundles and ShredStream for maximum velocity.

[Repository](https://github.com/fabrknt/fabrknt-sdk/tree/main/loom) | [SDK Documentation](./sdk/README.md) | [Issues](https://github.com/fabrknt/fabrknt-sdk/issues)

---

## Quick Start

### Installation

```bash
git clone https://github.com/fabrknt/fabrknt-sdk.git
cd fabrknt-sdk/loom/sdk
yarn install
yarn build
```

### Basic Usage

```typescript
import { Loom, TipLevel, JITO_BLOCK_ENGINE_URLS } from "./sdk/src";

// Initialize Loom
const loom = new Loom({
    endpoint: "https://api.mainnet-beta.solana.com",
    jitoBlockEngineUrl: JITO_BLOCK_ENGINE_URLS.mainnet,
    maxRetries: 3,
    timeout: 30000,
});

// Create tip instruction
const tipIx = loom.createTipInstruction(payer.publicKey, TipLevel.High);

// Submit bundle
const result = await loom.sendBundle({
    transactions: [transaction],
});
```

---

## Overview

Loom addresses the critical need for **execution predictability** in Solana's high-performance DeFi environment. While Solana offers 400ms block time, infrastructure bottlenecks like 200ms transaction propagation delay represent the true competitive frontier.

### Why Loom?

Standard transaction models are "optimistic" - for mission-critical DeFi, failure is not an option. Loom provides **"Inclusion Assurance"** as a service, integrating technologies like Jito and Raiku to guarantee that high-value transactions are not just sent, but confirmed.

Success on Solana has shifted from "average chain speed" to **"execution predictability"**. Loom democratizes expensive infrastructure, making high-frequency trading and DeFi operations accessible to all developers.

---

## Features

### 🚀 Core Capabilities

**Inclusion Assurance**

-   **Atomic Bundles** - Multi-transaction atomicity via Jito Bundles
-   **Warrantied Inclusion** - Execution certainty even during network congestion
-   **MEV Protection** - Front-running prevention through bundle sequencing

**Performance Optimization**

-   **Colocation & Shred Feeds** - API access to servers in validator data centers
-   **Parallel Submission Coordinator** - Redundant transaction attempts across endpoints
-   **Dynamic Tip Calculation** - Priority-based tip amounts for optimal inclusion

**Developer Experience**

-   **Type-Safe SDK** - Full TypeScript support with comprehensive types
-   **Automatic Retry Logic** - Exponential backoff for transient failures
-   **Bundle Status Tracking** - Real-time confirmation monitoring

### 🎯 Use Cases

-   **Liquidation Engines** - Ensure liquidations execute at intended prices (Atomliq)
-   **Yield Tokenization** - Maintain high-frequency SY-PT AMM operations (YieldSplitter)
-   **Arbitrage Bots** - Guarantee atomic multi-hop swaps
-   **HFT Trading** - Sub-second reaction times with execution certainty

---

## Architecture

Loom provides infrastructure-as-a-service (B2D) through:

### Execution Pipeline

1.  **Monitor** - Uses gRPC ShredStream to monitor account health in real-time
2.  **Pull Data** - Fetches latest prices/data via Pull Oracle requests
3.  **Bundle Construction** - Creates atomic transaction bundles with Jito tips
4.  **Execute** - Sends bundles via `Loom.sendBundle()` with guaranteed inclusion

### Key Components

-   **Loom SDK (B2D)** - Bundle submission, tip management, ShredStream client
-   **Jito Integration** - Block Engine connectivity for atomic bundles
-   **Raiku Integration** - Warrantied inclusion for critical transactions

---

## Usage Examples

### Basic Bundle Submission

```typescript
import { Loom, TipLevel } from "./sdk/src";

const loom = new Loom({
    endpoint: "https://api.mainnet-beta.solana.com",
    jitoBlockEngineUrl: JITO_BLOCK_ENGINE_URLS.mainnet,
});

// Create tip instruction
const tipIx = loom.createTipInstruction(payer.publicKey, TipLevel.High);

// Add tip to transaction
const transaction = new VersionedTransaction(message);
transaction.sign([payer]);

// Submit bundle
const result = await loom.sendBundle({
    transactions: [transaction],
});

// Wait for confirmation
const status = await loom.confirmBundle(result.bundleId);
```

### Atomic Liquidation Workflow

```typescript
// 1. Monitor account health via ShredStream
// 2. Pull latest price from Pyth Oracle
// 3. Construct 3-step bundle:
//    - Tx 1: Update Oracle price
//    - Tx 2: Execute Liquidation
//    - Tx 3: Jito Tip
// 4. Execute atomically
const bundle = {
    transactions: [oracleUpdateTx, liquidationTx, tipTx],
    tip: TipLevel.VeryHigh,
};

const result = await loom.sendBundle(bundle);
```

---

## Documentation

-   [SDK Documentation](./sdk/README.md) - Complete SDK API reference
-   [Technical Specification](./tech-spec.md) - Integration patterns and data flows
-   [SolFabric Design](./docs/solfabric_design.md) - Architecture and component details
-   [Atomliq Design](./docs/atomliq_design.md) - Liquidation engine integration
-   [YieldSplitter Design](./docs/yieldsplitter_design.md) - Yield tokenization integration

---

## Contributing

Loom is part of the [Fabrknt](https://github.com/fabrknt/fabrknt) ecosystem. Contributions are welcome!

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
-   [Flow](https://github.com/fabrknt/flow) - Multi-DEX liquidity routing
-   [Risk](https://github.com/fabrknt/risk) - AI-driven risk assessment
-   [Privacy](https://github.com/fabrknt/privacy) - ZK Compression for private transactions
