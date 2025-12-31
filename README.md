# Fabrknt SDK

> Open-source SDK for building crypto financial operations on Solana and EVM chains

[![CI](https://github.com/fabrknt/fabrknt-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/fabrknt/fabrknt-sdk/actions/workflows/ci.yml)
[![Test Coverage](https://github.com/fabrknt/fabrknt-sdk/actions/workflows/test-coverage.yml/badge.svg)](https://github.com/fabrknt/fabrknt-sdk/actions/workflows/test-coverage.yml)
[![Tests](https://img.shields.io/badge/tests-545%20passing-brightgreen)](https://github.com/fabrknt/fabrknt-sdk/tree/main/core/tests)

The Fabrknt SDK provides a comprehensive toolkit for Web3 developers to build secure, efficient financial operations with built-in security validation, risk assessment, and parallel execution.

## 📦 Packages

### Core SDK

-   **[core](./core/)** - Main SDK package (`@fabrknt/sdk`)
    -   Core financial operations
    -   Chain abstraction (Solana + EVM)
    -   Pre-built patterns (DeFi, DAO treasury, AI agents)

### Security & Risk Modules

-   **[guard](./guard/)** - Real-time transaction validation

    -   8 security patterns (slippage, drain, CPI, reentrancy, etc.)
    -   3 enforcement modes (block, warn, monitor)

-   **[risk](./risk/)** - AI-driven risk assessment
    -   RWA risk scoring
    -   Compliance checks
    -   Oracle integrity monitoring

### Performance & Optimization

-   **[loom](./loom/)** - Parallel execution engine

    -   Jito bundle integration
    -   Multi-transaction optimization
    -   Gas optimization

-   **[flow](./flow/)** - DEX integration layer
    -   Jupiter V6 integration
    -   Multi-DEX liquidity routing
    -   Raydium CLMM support (in progress)

### Privacy

-   **[privacy](./privacy/)** - ZK compression
    -   Light Protocol integration
    -   Compressed state management
    -   Experimental (Phase 2)

## 🚀 Quick Start

```bash
npm install @fabrknt/sdk
# or
yarn add @fabrknt/sdk
```

```typescript
import { BatchPayoutPattern, Guard } from "@fabrknt/sdk";

// Create secure batch payout with built-in security
const payroll = new BatchPayoutPattern({
    name: "Monthly Payroll",
    recipients: [
        { address: "...", amount: 1000 },
        { address: "...", amount: 2000 },
    ],
    guard: new Guard({
        maxSlippage: 0.01,
        mode: "block",
    }),
    enableParallel: true,
});

const result = await payroll.execute();
```

## 📚 Documentation

-   **[Main SDK Docs](./core/README.md)** - Complete SDK documentation
-   **[Examples](./core/examples/)** - Code examples
-   **[Business Plan](../marketing/BUSINESS_PLAN.md)** - SDK vision and roadmap
-   **[Known Limitations](./core/KNOWN_LIMITATIONS.md)** - Current limitations

## 🏗️ Repository Structure

```
fabrknt-sdk/
├── core/             # Core SDK (@fabrknt/sdk v0.3.1)
├── guard/            # Security validation module
├── loom/             # Parallel execution module
├── flow/             # DEX integration module
├── risk/             # Risk assessment module
├── privacy/          # ZK compression module
└── docs/             # Documentation
```

## 🌟 Key Features

-   **Chain Abstraction** - Write once, run on Solana and EVM chains
-   **Built-in Security** - Real-time validation with Guard module
-   **Risk Assessment** - AI-driven risk scoring for RWA and DeFi
-   **Parallel Execution** - Optimize gas with Loom's parallel processing
-   **Pre-built Patterns** - Production-ready templates for common operations
-   **Type Safety** - Full TypeScript support

## 📊 Status

-   **Version**: 0.3.1 (Beta)
-   **Recommended**: Devnet/Testnet only
-   **Production**: Guard + Risk modules only

## 🔗 Related Projects

-   **[Fabrknt Suite](https://github.com/fabrknt/fabrknt-suite)** - SaaS applications built with Fabrknt SDK (PULSE, TRACE, FABRIC)

## 🤝 Contributing

See [CONTRIBUTING.md](./core/CONTRIBUTING.md) for contribution guidelines.

## 📄 License

See individual package licenses. Core SDK is typically MIT or Apache 2.0.

## 🆘 Support

-   **Issues**: [GitHub Issues](https://github.com/fabrknt/fabrknt-sdk/issues)
-   **Discussions**: [GitHub Discussions](https://github.com/fabrknt/fabrknt-sdk/discussions)
-   **Documentation**: [Full Docs](./core/README.md)

---

**Built with ❤️ by the Fabrknt team**
