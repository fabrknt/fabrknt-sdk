# 💧 Flow

**AI-Driven Concentrated Liquidity Management Protocol for Solana**

> **⚠️ Beta:** Flow is currently in beta (development). Active development in progress.

Flow is an AI-Driven Autonomous Concentrated Liquidity Management Protocol (A-CLM) specialized for Solana's high-performance DeFi ecosystem. It maximizes capital efficiency for Liquidity Providers (LPs) on DEXs like Raydium and Orca, while generating revenue by offering high-performance market prediction services to external AI agents via x402.

[Repository](https://github.com/fabrknt/fabrknt-sdk/tree/master/flow) | [Documentation](./docs/) | [Issues](https://github.com/fabrknt/fabrknt-sdk/issues)

---

## Quick Start

### Local Development

```bash
# Clone repository
git clone https://github.com/fabrknt/fabrknt-sdk.git
cd fabrknt-sdk/flow

# Start local validator and run tests
./scripts/test-local.sh

# Or setup devnet environment
./scripts/setup-devnet.sh
```

### Deploy to Devnet

```bash
# Build and deploy
anchor build
anchor deploy --provider.cluster devnet

# Run integration tests
anchor test --provider.cluster devnet
```

See [docs/SETUP.md](./docs/SETUP.md) for detailed setup instructions.

---

## Overview

Flow addresses the critical need for **intelligent liquidity management** in Solana's high-performance DeFi environment. Traditional CLM protocols focus on automation, but Flow centers its competitive advantage on **speed, high-precision, and compliance**.

### Why Flow?

Solana's 400ms block time enables **atomic transaction execution** for complex liquidity operations. Flow leverages this speed advantage to:

-   **Maximize LP Returns** - Dynamic rebalancing via predictive analytics
-   **Minimize Slippage** - Jupiter V6 integration for optimal swap execution
-   **Ensure Execution** - Jito Bundle integration for guaranteed inclusion
-   **Monetize Intelligence** - x402 API Gateway for AI prediction services

---

## Features

### 🎯 Core Capabilities

**Dynamic Liquidity Management**

-   **AI-Driven Rebalancing** - Real-time market sentiment and volatility analysis
-   **Optimal Range Setting** - Predictive analytics for liquidity positioning
-   **Atomic Execution** - Single-transaction rebalancing on Solana's 400ms blocks
-   **Multi-DEX Routing** - Jupiter V6 integration for optimal swap execution

**Execution Optimization**

-   **Jupiter Integration** - DEX aggregation SDK for minimal slippage
-   **Jito Integration** - MEV protection and execution sequencing
-   **Parallel Processing** - Leverages Solana's Sealevel runtime
-   **Retry Logic** - Automatic retry with exponential backoff

**x402 API Gateway**

-   **Pay-Per-Call Access** - Micropayment-based API access
-   **Prediction Services** - Next rebalance prediction signals
-   **Market Analysis** - Microstructure analysis for AI agents
-   **On-Demand Pricing** - Ultra-low fees ($0.005 per call)

**Compliance & Transparency**

-   **On-Chain Audit Log** - Immutable record of AI decision rationale
-   **Policy-Controlled Wallets** - Fine-grained transaction limits
-   **Explainable AI** - Transparent decision-making process
-   **Regulatory Compliance** - Built-in AML/KYC integration

### 🏗️ Architecture

Flow consists of:

1.  **Solana Program** - On-chain liquidity management logic
2.  **AI Prediction Engine** - Market analysis and rebalancing signals
3.  **x402 API Server** - Payment gateway and data feeds
4.  **Jupiter Integration** - DEX aggregation and routing
5.  **Jito Integration** - Bundle submission and MEV protection

---

## Usage Examples

### Basic Liquidity Management

```typescript
import { Flow } from "@fabrknt/flow";

const flow = new Flow({
    rpcUrl: "https://api.mainnet-beta.solana.com",
    wallet: walletAdapter,
});

// Initialize LP position
await flow.initializePosition({
    tokenA: "SOL",
    tokenB: "USDC",
    range: { lower: 0.95, upper: 1.05 },
    amount: 1000,
});

// Enable AI-driven rebalancing
await flow.enableAutoRebalancing({
    strategy: "volatility-based",
    minRebalanceInterval: 3600, // 1 hour
});
```

### x402 API Access

```typescript
// Get rebalance prediction signal
const prediction = await flow.getRebalancePrediction({
    positionId: "POSITION_ID",
    paymentSignature: "SIGNATURE",
});

// Access market microstructure analysis
const analysis = await flow.getMarketAnalysis({
    tokenPair: "SOL/USDC",
    paymentSignature: "SIGNATURE",
});
```

---

## Documentation

-   [Setup Guide](./docs/SETUP.md) - Development environment setup
-   [Architecture](./docs/ARCHITECTURE.md) - System design and components
-   [Jupiter Integration](./docs/JUPITER_INTEGRATION.md) - DEX aggregation setup
-   [Raydium Integration](./docs/RAYDIUM_INTEGRATION.md) - CLMM integration guide
-   [Instruction Handlers](./docs/INSTRUCTION_HANDLERS.md) - Smart contract API
-   [Jupiter CPI Complete](./docs/JUPITER_CPI_COMPLETE.md) - CPI invocation details
-   [Jupiter API Integration](./docs/JUPITER_API_INTEGRATION.md) - API integration guide

---

## Technical Stack

-   **Language**: Rust (Solana Program), TypeScript (SDK & API)
-   **Framework**: Anchor Framework for Solana programs
-   **DEX Integration**: Jupiter V6 SDK, Raydium CLMM
-   **Execution**: Jito Bundles for atomic transactions
-   **Payment**: x402 Protocol for API monetization

---

## Contributing

Flow is part of the [Fabrknt](https://github.com/fabrknt/fabrknt) ecosystem. Contributions are welcome!

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
-   [Risk](https://github.com/fabrknt/risk) - AI-driven risk assessment
-   [Privacy](https://github.com/fabrknt/privacy) - ZK Compression for private transactions
