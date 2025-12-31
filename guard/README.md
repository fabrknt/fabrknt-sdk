# 🛡️ Guard

**Security validation layer for Solana transactions - Preventing operational disasters**

> **⚠️ Beta:** Guard is currently in beta (development). Active development in progress.

Guard is a monitoring tool that prevents "operational disasters" by detecting dangerous instructions in Solana transactions. It provides safety-first UX with human-readable warnings for critical authority changes, helping Solana project operators and developers avoid costly mistakes.

[Repository](https://github.com/fabrknt/fabrknt-sdk/tree/master/guard) | [Documentation](./docs/) | [Issues](https://github.com/fabrknt/fabrknt-sdk/issues)

---

## Quick Start

### Installation

```bash
git clone https://github.com/fabrknt/fabrknt-sdk.git
cd fabrknt-sdk/guard
cargo build --release
```

### Basic Usage

```bash
# Monitor a program for dangerous operations
guard watch --program-id <PUBKEY> --env mainnet

# With Discord notifications
guard watch --program-id <PUBKEY> --env mainnet --discord-webhook <URL>
```

---

## Overview

Guard monitors Solana transactions in real-time and detects dangerous patterns that could lead to operational disasters such as:

-   **Authority Loss** - Accidental mint authority revocation
-   **Fund Drains** - Unauthorized account closures with remaining balance
-   **Signer Mismatches** - Authority transfers to wallets you don't control
-   **Liquidity Risks** - LP token burns and supply shocks

### Why Guard?

Solana's high-speed environment leads to frequent "operational disasters" - accidental authority loss, treasury drains, and irreversible mistakes. Guard provides an automated "Safety Brake" through monitoring and human-readable alerts, positioning itself as the indispensable guardian for developers and project leads.

---

## Features

### 🎯 Core Detection Patterns

**Tier 1: Authority Disaster Prevention (High Priority)**

-   **P-101: Mint Kill** - Detects permanent mint authority revocation
-   **P-102: Freeze Kill** - Warns about losing freeze account ability
-   **P-103: Signer Mismatch** - Alerts when new authority isn't in transaction signers
-   **P-104: Dangerous Close** - Detects account closures with remaining balance

**Tier 2: DeFi & Scaling Safety**

-   **P-201: LP Burn** - Warns about burning liquidity pool tokens
-   **P-202: Supply Shock** - Alerts on >10% supply increases
-   **P-203: Authority to PDA** - Checks authority transfers to Program Derived Addresses

### 🔔 Notification Channels

-   **CLI Output** - ANSI color-coded warnings with transaction links
-   **Discord Webhooks** - Rich embed messages with actionable suggestions
-   **Real-time Monitoring** - Sub-10 second notification latency

### ⚡ Performance

-   **High-Performance Parsing** - Rust-based transaction analysis
-   **RPC Optimization** - Handles rate limits with intelligent backoff
-   **False Positive Minimization** - Only targets Authority and Admin level instructions

---

## Architecture

Guard operates as a lightweight CLI tool that:

1.  **Monitors** - Polls or subscribes to transactions for a given Program ID
2.  **Analyzes** - Parses `CompiledInstruction` to detect dangerous patterns
3.  **Alerts** - Sends human-readable warnings via CLI and/or Discord

### Technical Stack

-   **Language**: Rust (for high-performance transaction parsing)
-   **SDK**: `solana-client`, `solana-sdk`, `spl-token`, `spl-token-2022`
-   **Data Source**: Solana JSON RPC (Polling or WebSocket `logsSubscribe`)
-   **Notification**: Discord Webhook (JSON)

---

## Usage Examples

### Monitor a Program

```bash
# Basic monitoring
guard watch --program-id 5eKPz3P7vBT1RhMUoYadmHB4KaNwjSoaUPaNvEzjcuKx --env mainnet

# With custom RPC
guard watch --program-id <PUBKEY> --env mainnet --rpc-url https://api.mainnet-beta.solana.com

# With Discord notifications
guard watch --program-id <PUBKEY> --env mainnet --discord-webhook https://discord.com/api/webhooks/...
```

### Example Output

```
🛡️  Guard Starting...
📡 Monitoring Program ID: 5eKPz3P7vBT1RhMUoYadmHB4KaNwjSoaUPaNvEzjcuKx
🌐 Environment: mainnet
🔗 RPC Endpoint: https://api.mainnet-beta.solana.com

🔍 Transaction: https://solscan.io/tx/...
⚠️  CRITICAL: You are permanently disabling Mint Authority.
    This token can NEVER be minted again.
```

---

## Documentation

-   [System Requirements Specification](./README.md) - Complete technical specification
-   [Business Plan](./BIZPLAN.md) - Product strategy and market positioning
-   [Development Guide](./docs/) - Implementation roadmap and developer prompts

---

## Contributing

Guard is part of the [Fabrknt](https://github.com/fabrknt/fabrknt) ecosystem. Contributions are welcome!

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
-   [Loom](https://github.com/fabrknt/loom) - Parallel execution optimization
-   [Flow](https://github.com/fabrknt/flow) - Multi-DEX liquidity routing
-   [Risk](https://github.com/fabrknt/risk) - AI-driven risk assessment
-   [Privacy](https://github.com/fabrknt/privacy) - ZK Compression for private transactions
