# DEX Aggregator Example

Example showing how to build a DEX aggregator for optimal swap routing using Fabrknt.

## Features

-   ✅ Multi-DEX price comparison (Orca, Raydium, Jupiter)
-   ✅ Optimal route selection
-   ✅ Price impact minimization
-   ✅ Guard security validation
-   ✅ Real-time price feeds
-   ✅ Slippage protection

## Use Case

Swap aggregator finding best execution across multiple Solana DEXs.

## Setup

```bash
# Install Fabrknt SDK from npm
npm install @fabrknt/sdk

# Install Solana Web3.js
npm install @solana/web3.js @solana/spl-token
```

**Note:** For development or contributing, you can also install directly from GitHub.

## Usage

```bash
# Execute swap with optimal routing
node swap.js

# Outputs:
# - Price comparison across DEXs
# - Selected route
# - Execution details
# - Final amounts received
```

## Code Overview

This example demonstrates:

1. **Price Discovery** - Fetch quotes from multiple DEXs
2. **Route Optimization** - Select best execution path
3. **Swap Execution** - Execute trade with optimal route
4. **Guard Validation** - Security checks and slippage protection
5. **Analytics** - Track execution quality and savings

## Production Considerations

-   Add more DEXs for better price discovery
-   Implement split routing (e.g., 50% Orca + 50% Raydium)
-   Add MEV protection strategies
-   Monitor and optimize for gas costs
-   Implement price alerts and limit orders
-   Add historical execution analytics
-   Consider flash loan integration for arbitrage
-   Implement retry logic for failed swaps

## Related Patterns

-   **ArbitragePattern** - For cross-DEX arbitrage
-   **LiquidityPattern** - For liquidity provision
