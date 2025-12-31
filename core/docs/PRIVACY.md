# Privacy - The Hidden Stitch Documentation

## Overview

Privacy (formerly Fabric Weave/Arbor) is the Shielded State Middleware (SSM) integration for Fabrknt, providing ZK Compression and privacy-enabled transaction execution. It acts as an abstraction layer between the Solana Virtual Machine (SVM) and the Light Protocol ZK Stack, enabling cost-efficient private transactions.

**Note:** Provider identifiers still use `'arbor'` for backward compatibility, but represent the Privacy component.

**Repository**: [github.com/fabrknt/privacy](https://github.com/fabrknt/privacy)

## Features

-   **🌿 ZK Compression** - Massive cost reduction for state storage and account creation via Sparse Binary Merkle Trees
-   **🔒 Privacy by Default** - Shielded state management to ensure transaction confidentiality
-   **💰 Cost Estimation** - Built-in tools to calculate compression savings
-   **⚡ Efficient Execution** - Dedicated API designed for privacy-enabled operations without sacrificing speed
-   **🔗 Guard Integration** - Privacy validation in transaction flow

## Cost Savings

ZK Compression provides dramatic cost reductions:

| Operation          | Native Cost   | Compressed Cost   | Savings    |
| ------------------ | ------------- | ----------------- | ---------- |
| 100 Token Accounts | 0.20 SOL      | 0.00004 SOL       | **99.98%** |
| 1M User Airdrop    | ~$260,000 USD | ~$50 USD          | **5,200x** |
| PDA Creation       | High          | 1/160th of Native | **99.37%** |

## Installation

> **⚠️ Beta:** Fabrknt is currently in beta (development). npm publication is coming soon.

```bash
git clone https://github.com/fabrknt/fabrknt.git
cd fabrknt
npm install
```

**Note:** npm package `@fabrknt/sdk` will be available soon. For now, install directly from GitHub.

## Quick Start

### Private Transaction Execution

```typescript
import { Fabrknt, Guard, FabricCore } from "@fabrknt/sdk";

const guard = new Guard({ riskTolerance: "moderate" });

const tx = {
    id: "tx-private-001",
    status: "pending",
    instructions: [],
};

// Execute as private transaction with ZK Compression via Privacy
const result = await Fabrknt.executePrivate(tx, {
    with: guard,
    privacy: {
        provider: "arbor", // Note: 'arbor' is the provider identifier, represents Privacy
        compression: true,
    },
});

console.log("Status:", result.status);
console.log("Privacy Enabled:", result.privacyMetadata?.requiresPrivacy);
console.log("Compression Enabled:", result.privacyMetadata?.compressionEnabled);
```

### Cost Estimation

```typescript
import { FabricCore } from "@fabrknt/sdk";

// Estimate cost savings for 1000 transactions
const savings = FabricCore.estimateCompressionSavings(1000);

console.log("Native Cost:", savings.nativeCost, "SOL");
console.log("Compressed Cost:", savings.compressedCost, "SOL");
console.log("Savings:", savings.savings, "SOL");
console.log("Savings Percentage:", savings.savingsPercent.toFixed(2), "%");
```

### Optimized Private Transaction

```typescript
import { FabricCore, Fabrknt } from "@fabrknt/sdk";

const tx = {
    id: "tx-001",
    status: "pending",
    instructions: [],
};

// Optimize with privacy enabled via Privacy
const optimized = FabricCore.optimize(tx, {
    enablePrivacy: true,
    compressionLevel: "high",
    privacyProvider: "arbor", // Note: 'arbor' is the provider identifier, represents Privacy
});

// Execute as private transaction
const result = await Fabrknt.executePrivate(optimized, {
    privacy: {
        provider: "arbor",
        compression: true,
    },
});
```

## Configuration

### PrivacyConfig

```typescript
interface PrivacyConfig {
    enabled?: boolean; // Enable privacy features
    provider?: "arbor" | "light"; // Privacy provider ('arbor' = Privacy)
    compressionLevel?: "low" | "medium" | "high"; // Compression level
    requirePrivacy?: boolean; // Require privacy for execution
}
```

### FabrkntConfig with Privacy

```typescript
import { Fabrknt } from "@fabrknt/sdk";

const fabrknt = new Fabrknt({
    network: "mainnet-beta",
    privacy: {
        enabled: true,
        provider: "arbor", // Privacy
        compressionLevel: "high",
    },
});
```

## API Reference

### Fabrknt.executePrivate()

```typescript
static async executePrivate(
  tx: Transaction,
  options: {
    with?: Guard;
    privacy?: {
      provider?: 'arbor' | 'light';
      compression?: boolean;
    };
  }
): Promise<Transaction>
```

Execute a transaction with privacy enabled.

**Parameters:**

-   `tx`: Transaction to execute
-   `options.with` (optional): Guard instance for validation
-   `options.privacy` (optional): Privacy configuration

**Returns:** `Promise<Transaction>` with privacy metadata

### FabricCore.optimize()

```typescript
static optimize(
  transaction: Transaction,
  options: OptimizeOptions
): Transaction
```

Optimize transaction for parallel execution with optional privacy.

**Parameters:**

-   `transaction`: Transaction to optimize
-   `options.enablePrivacy`: Enable privacy layer
-   `options.compressionLevel`: Compression level ('low' | 'medium' | 'high')
-   `options.privacyProvider`: Privacy provider ('arbor' | 'light')

**Returns:** Optimized transaction with privacy metadata

### FabricCore.compressWithArbor()

```typescript
static async compressWithArbor(
  transaction: Transaction,
  config?: PrivacyConfig
): Promise<Transaction>
```

Compress transaction state using Privacy ZK Compression.

**Note:** This is a placeholder for future implementation. Full integration with Light Protocol ZK Stack will be added in Phase 2.5.

**Parameters:**

-   `transaction`: Transaction to compress
-   `config`: Privacy configuration

**Returns:** Compressed transaction

### FabricCore.estimateCompressionSavings()

```typescript
static estimateCompressionSavings(
  transactionCount: number
): {
  nativeCost: number;
  compressedCost: number;
  savings: number;
  savingsPercent: number;
}
```

Estimate cost savings from ZK Compression.

**Parameters:**

-   `transactionCount`: Number of transactions/accounts

**Returns:** Cost comparison object

## Integration with Guard

Guard automatically validates privacy requirements:

```typescript
import { Guard } from "@fabrknt/sdk";

const guard = new Guard();

const privateTx = {
    id: "tx-private",
    status: "pending",
    privacyMetadata: {
        requiresPrivacy: true,
        compressionEnabled: true,
    },
    instructions: [],
};

// Guard will validate privacy requirements
const result = await guard.validateTransaction(privateTx);

// Guard warns if privacy is requested but compression is disabled
if (!result.isValid) {
    result.warnings.forEach((warning) => {
        if (warning.message.includes("privacy")) {
            console.log("Privacy warning:", warning.message);
        }
    });
}
```

## Use Cases

### 1. Confidential Payroll & B2B Payments

```typescript
// Hide transaction amounts while allowing disclosure to authorities via Privacy
const payrollTx = await Fabrknt.executePrivate(payrollTransaction, {
    privacy: {
        provider: "arbor", // Privacy
        compression: true,
    },
});
```

### 2. Private Airdrops

```typescript
// Mass airdrop to millions of users at minimal cost via Privacy
const airdropTx = await Fabrknt.executePrivate(airdropTransaction, {
    privacy: {
        provider: "arbor", // Privacy
        compression: true,
    },
});

// Estimate savings
const savings = FabricCore.estimateCompressionSavings(1000000);
console.log(`Savings: ${savings.savingsPercent.toFixed(2)}%`);
```

### 3. Confidential Order Books (Dark Pools)

```typescript
// Hide order size and price until execution via Privacy
const orderTx = await Fabrknt.executePrivate(orderTransaction, {
    privacy: {
        provider: "arbor", // Privacy
        compression: true,
    },
});
```

### 4. Private Governance Voting

```typescript
// Blind voting with results revealed after period ends via Privacy
const voteTx = await Fabrknt.executePrivate(voteTransaction, {
    privacy: {
        provider: "arbor", // Privacy
        compression: true,
    },
});
```

## Technical Details

### ZK Compression Architecture

Privacy uses **Sparse Binary Merkle Trees** to compress on-chain state:

1. **State Compression**: Public state → Compressed private state
2. **Proof Generation**: Groth16 proof system (128 bytes fixed size)
3. **Verification**: On-chain verification of compressed state
4. **Cost Reduction**: 99.98% reduction in storage costs

### Privacy Levels

-   **Low**: Basic compression, minimal privacy
-   **Medium**: Balanced compression and privacy
-   **High**: Maximum compression and privacy (recommended for sensitive operations)

## Performance

-   **Compression Time**: Varies by transaction complexity
-   **Proof Size**: Fixed 128 bytes (Groth16)
-   **Cost Savings**: 99.98% for token account creation
-   **Privacy**: Full state hiding with selective disclosure support

## Roadmap

### Phase 2.5: Full ZK Stack Integration

-   [ ] Complete Light Protocol ZK Stack integration
-   [ ] Sparse Binary Merkle Tree implementation
-   [ ] Groth16 proof generation
-   [ ] On-chain verification
-   [ ] Selective disclosure support
-   [ ] Auditor keys for compliance

### Future Enhancements

-   [ ] Multi-party computation (MPC) support
-   [ ] Fully homomorphic encryption (FHE)
-   [ ] Trusted execution environments (TEE)
-   [ ] Cross-chain privacy bridges

## Best Practices

1. **Use High Compression Level** - For maximum cost savings
2. **Enable Compression** - Always enable compression for cost efficiency
3. **Validate Privacy Requirements** - Use Guard to validate privacy metadata
4. **Estimate Costs First** - Use `estimateCompressionSavings()` before large operations
5. **Combine with Risk** - Use risk assessment for private transactions
6. **Monitor Privacy Metadata** - Ensure `requiresPrivacy` and `compressionEnabled` are set correctly

## Examples

See [`examples/pulsar-arbor-integration.ts`](../examples/pulsar-arbor-integration.ts) for comprehensive examples including:

-   Private transaction execution
-   Cost estimation
-   Optimized private transactions
-   Combined Risk + Privacy workflows

## Support

-   GitHub Issues: https://github.com/fabrknt/fabrknt/issues
-   Documentation: https://github.com/fabrknt/fabrknt
-   Twitter: https://x.com/fabrknt
-   Privacy Repository: https://github.com/fabrknt/privacy
