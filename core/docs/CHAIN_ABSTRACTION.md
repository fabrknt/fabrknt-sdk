# Chain Abstraction Layer

## Overview

The Chain Abstraction Layer enables Fabrknt's portable components (Guard, Risk, Flow, Patterns) to work across multiple blockchains through a unified interface. This architecture maintains our "Solana-First, Cross-Chain Enabled" positioning while enabling future expansion to EVM chains.

## Architecture

### Core Components

1. **Chain Adapter Interface** (`ChainAdapter`)
   - Unified API for all blockchain interactions
   - Handles transaction building, execution, cost estimation
   - Provides chain-specific security patterns

2. **Solana Adapter** (`SolanaAdapter`)
   - Full implementation for Solana blockchain
   - Handles Solana-specific transaction formats
   - Integrates with `@solana/web3.js`

3. **EVM Adapter** (`EVMAdapter`)
   - Skeleton implementation for Phase 3 (Q3 2025)
   - Will support Ethereum, Polygon, Arbitrum, Optimism, Base
   - Full implementation coming in Phase 3

### Unified Types

- **UnifiedTransaction**: Chain-agnostic transaction representation
- **ChainTransactionData**: Chain-specific data (opaque to portable components)
- **UnifiedOperation**: Chain-agnostic operation representation
- **TransactionResult**: Unified execution result format

## Usage

### Creating Chain Adapters

```typescript
import { createChainAdapter, SolanaAdapter } from '@fabrknt/sdk';

// Create Solana adapter
const solanaAdapter = createChainAdapter({
  chain: 'solana',
  network: 'mainnet-beta',
  rpcUrl: 'https://api.mainnet-beta.solana.com'
});

// Or create directly
const adapter = new SolanaAdapter({
  chain: 'solana',
  network: 'mainnet-beta'
});
```

### Using Guard with Chain Abstraction

```typescript
import { Guard, createChainAdapter } from '@fabrknt/sdk';
import type { UnifiedTransaction } from '@fabrknt/sdk';

// Create chain adapter
const adapter = createChainAdapter({
  chain: 'solana',
  network: 'mainnet-beta'
});

// Create Guard with chain adapter
const guard = new Guard({
  chainAdapter: adapter,
  maxSlippage: 0.1,
  mode: 'block'
});

// Validate unified transaction
const unifiedTx: UnifiedTransaction = {
  id: 'tx-001',
  status: 'pending',
  chain: 'solana',
  chainData: {
    type: 'solana',
    data: {
      instructions: [],
      // ... Solana-specific data
    }
  },
  operations: [],
  assetAddresses: ['TokenAddress...']
};

const result = await guard.validateUnifiedTransaction(unifiedTx);
if (!result.isValid) {
  console.error('Transaction blocked:', result.warnings);
}
```

### Backward Compatibility

Guard maintains full backward compatibility with existing `Transaction` type:

```typescript
// Existing code continues to work
const guard = new Guard({ maxSlippage: 0.1 });
const result = await guard.validateTransaction(legacyTx);
```

## Chain-Specific Features

### Solana

- **Security Patterns**: P-101, P-102, P-103, P-104
- **Native Currency**: SOL
- **Transaction Format**: Solana Transaction with instructions
- **Cost Estimation**: Compute units and lamports

### EVM (Coming in Phase 3)

- **Security Patterns**: EVM-001, EVM-002, EVM-003, EVM-004
- **Native Currency**: ETH, MATIC, etc. (chain-dependent)
- **Transaction Format**: EVM Transaction with data field
- **Cost Estimation**: Gas limit and gas price

## Implementation Status

### ✅ Completed (Phase 2.5)

- Chain abstraction layer architecture
- Chain adapter interface
- Solana adapter (full implementation)
- EVM adapter skeleton
- Guard integration with chain abstraction
- Backward compatibility maintained

### 🚧 Coming in Phase 3 (Q3 2025)

- Full EVM adapter implementation
- EVM Guard patterns
- EVM Risk (Pulsar) integration
- Cross-chain transaction support

### 🔮 Future Phases

- Flow (liquidity routing) for EVM
- Pattern library updates for cross-chain
- Cross-chain arbitrage patterns

## Design Principles

1. **Portability**: Core logic is chain-agnostic
2. **Extensibility**: Easy to add new chains via adapters
3. **Backward Compatibility**: Existing code continues to work
4. **Solana-First**: Solana features remain prioritized
5. **Type Safety**: Strong TypeScript types throughout

## Migration Guide

### For Existing Code

No changes required! Existing code using `Transaction` type continues to work.

### For New Cross-Chain Code

1. Use `UnifiedTransaction` instead of `Transaction`
2. Create chain adapter for your target chain
3. Pass adapter to Guard constructor
4. Use `validateUnifiedTransaction()` method

### Example Migration

**Before (Solana-only):**
```typescript
const guard = new Guard({ maxSlippage: 0.1 });
const result = await guard.validateTransaction(solanaTx);
```

**After (Cross-chain ready):**
```typescript
const adapter = createChainAdapter({ chain: 'solana', network: 'mainnet-beta' });
const guard = new Guard({ chainAdapter: adapter, maxSlippage: 0.1 });
const result = await guard.validateUnifiedTransaction(unifiedTx);
```

## API Reference

See the [Chain Abstraction API Reference](../src/chain/README.md) for detailed API documentation.

