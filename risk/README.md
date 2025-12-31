# ⚠️ Risk

**Solana RWA Risk Gateway - AI-driven risk assessment and compliance checks**

> **⚠️ Beta:** Risk is currently in beta (development). Active development in progress.

Risk is a Solana-based RWA (Real-World Assets) Risk Gateway that implements the x402 protocol for pay-per-call API access. It delivers institutional-grade RWA risk data on a high-frequency, pay-per-call basis, enabling AI agents and DeFi protocols to access critical risk metrics without traditional API keys.

[Repository](https://github.com/fabrknt/fabrknt-sdk/tree/main/risk) | [Documentation](./docs/) | [Issues](https://github.com/fabrknt/fabrknt-sdk/issues)

---

## Quick Start

### Deploy to Devnet

```bash
# 1. Check setup
npm run check:devnet

# 2. Setup devnet environment
npm run setup:devnet

# 3. Build and deploy
npm run build
npm run deploy:devnet

# 4. Configure API
cd api && cp .env.example .env
# Edit .env with deployed program ID

# 5. Start services
npm run api:dev        # Terminal 1
npm run frontend:dev    # Terminal 2
```

See [docs/QUICKSTART.md](./docs/QUICKSTART.md) for detailed instructions.

---

## Overview

Risk addresses the critical need for **specialized RWA risk data** in the growing DeFAI (DeFi + AI) market. As Real-World Assets become increasingly tokenized on Solana, protocols require continuous, reliable data feeds for:

-   **Risk Assessment** - Counterparty risk, legal compliance status, oracle integrity
-   **Liquidation Modeling** - Real-time parameters for lending protocols
-   **Compliance Monitoring** - Regulatory status and audit trails

### Why Risk?

Traditional subscription-based API models create friction that hinders developer adoption. AI agents need to consume specific data feeds autonomously and frequently on a micro-granular basis. The **x402 protocol** solves this by enabling native, pay-per-call payments via wallet signatures, eliminating API keys and prior registration.

Risk leverages expertise in financial risk, counterparty risk, and legal structuring to provide **non-generic B2B data** essential for mitigating legal risk and enhancing transparency in RWA-based financial products.

---

## Features

### 🎯 Core Capabilities

**x402 Payment Protocol**

-   **Pay-Per-Call Access** - No API keys, no subscriptions
-   **Wallet-Based Authentication** - Cryptographic signature verification
-   **Micropayment Support** - Ultra-low fees ($0.00025 per transaction)
-   **Instant Finality** - 12.8-second confirmation on Solana

**RWA Risk Data Feeds**

-   **Legal & Compliance Status** - Underlying legal structure and token holder rights
-   **Counterparty Risk Indicators** - Solvency and performance data for issuers/managers
-   **Oracle Integrity Consensus** - Multi-node validation for data reliability
-   **Liquidation Parameters** - Real-time modeling parameters for lending protocols

**Developer Experience**

-   **REST API** - Standard HTTP endpoints with x402 integration
-   **Web Frontend** - Interactive demo and visualization
-   **Client SDK** - TypeScript SDK for easy integration
-   **Mock Data Support** - Offline demonstrations and testing

### 🏗️ Architecture

The system consists of four main components:

1.  **Solana Program** (`programs/risk`) - On-chain payment processing
2.  **API Server** (`api/`) - HTTP 402 endpoint implementation
3.  **Client SDK** (`client/`) - Wallet integration and API client
4.  **Web Frontend** (`frontend/`) - Interactive web interface

---

## Usage Examples

### API Client Usage

```typescript
import { RiskClient } from "@risk/client";

const client = new RiskClient({
    apiUrl: "https://api.risk.example.com",
    wallet: walletAdapter,
});

// Get payment quote
const quote = await client.getPaymentQuote("rwa-risk", {
    tokenMint: "USDC_MINT",
    amount: 0.01,
});

// Make payment and access data
const riskData = await client.getRwaRiskData({
    tokenMint: "TOKEN_MINT",
    paymentSignature: quote.signature,
});
```

### Web Frontend

The frontend provides:

-   **Wallet Integration** - Connect with Phantom, Solflare, and other Solana wallets
-   **Payment Quotes** - Real-time pricing display for different data endpoints
-   **RWA Risk Visualization** - Interactive display of compliance and risk metrics
-   **Liquidation Parameters** - Visualization of liquidation modeling parameters

---

## Documentation

-   [Quick Start Guide](./docs/QUICKSTART.md) - Get started in minutes
-   [Architecture](./docs/ARCHITECTURE.md) - System design and components
-   [Setup Guide](./docs/SETUP.md) - Development environment setup
-   [Deployment](./docs/DEPLOYMENT.md) - Deploy to devnet/mainnet
-   [Testing](./docs/TESTING.md) - Test suite and examples
-   [Integration Plan](./docs/INTEGRATION_PLAN.md) - Real data integration roadmap
-   [Frontend Guide](./docs/FRONTEND.md) - Frontend development guide
-   [Demo Guide](./docs/DEMO.md) - Customer demonstration guide

---

## Real Data Integration

Currently using mock data for MVP demonstration. See [docs/INTEGRATION_PLAN.md](./docs/INTEGRATION_PLAN.md) for the complete plan to integrate real Solana data sources:

-   **Switchboard Surge** - Low-latency oracle integration (<10ms)
-   **On-Chain Token Data** - Real-time token metadata and balances
-   **Liquidation Calculations** - Dynamic risk modeling parameters

---

## Contributing

Risk is part of the [Fabrknt](https://github.com/fabrknt/fabrknt) ecosystem. Contributions are welcome!

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
-   [Privacy](https://github.com/fabrknt/privacy) - ZK Compression for private transactions
