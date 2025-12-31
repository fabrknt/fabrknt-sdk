# Risk - The Quality Gauge Documentation

## Overview

Risk (formerly Fabric Pulse/Pulsar) is the Risk Oracle component of Fabrknt, providing AI-driven risk assessment for Real World Assets (RWA) and asset integrity validation. It integrates seamlessly with Guard to provide institutional-grade risk metrics before transaction execution.

**Note:** The class is still exported as `Pulsar` for backward compatibility, but represents the Risk component.

**Repository**: [github.com/fabrknt/risk](https://github.com/fabrknt/risk)

## Features

-   **🧭 Real-time Risk Assessment** - Continuous monitoring of risk scores, compliance status, and oracle integrity
-   **💾 Intelligent Caching** - Configurable TTL to maximize performance and minimize API overhead
-   **📦 Batch Processing** - Assess multiple assets simultaneously
-   **🔄 Fallback Support** - Graceful degradation when API unavailable
-   **🔗 Guard Integration** - Seamlessly feeds data into Guard for automated transaction blocking

## Installation

> **⚠️ Beta:** Fabrknt is currently in beta (development). npm publication is coming soon.

```bash
git clone https://github.com/fabrknt/fabrknt.git
cd fabrknt
npm install
```

**Note:** npm package `@fabrknt/sdk` will be available soon. For now, install directly from GitHub.

## Quick Start

### Basic Risk Assessment

```typescript
import { Pulsar } from "@fabrknt/sdk";

// Note: The class is still named 'Pulsar' in code, but represents Risk
// Get risk metrics for a single asset
const metrics = await Pulsar.getRiskMetrics(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

console.log("Risk Score:", metrics.riskScore);
console.log("Compliance:", metrics.complianceStatus);
console.log("Counterparty Risk:", metrics.counterpartyRisk);
console.log("Oracle Integrity:", metrics.oracleIntegrity);
```

### Batch Risk Assessment

```typescript
import { Pulsar } from "@fabrknt/sdk"; // Risk

const assetAddresses = [
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "So11111111111111111111111111111111111111112",
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
];

// Get risk metrics for multiple assets
const riskMap = await Pulsar.getBatchRiskMetrics(assetAddresses);

for (const [address, metrics] of riskMap.entries()) {
    console.log(`${address}: Risk Score = ${metrics.riskScore}`);
}
```

## Configuration

### PulsarConfig

```typescript
interface PulsarConfig {
    enabled?: boolean; // Enable Risk checks (default: true)
    riskThreshold?: number; // 0-1 scale, block if exceeded (default: 0.7)
    enableComplianceCheck?: boolean; // Check compliance status (default: true)
    enableCounterpartyCheck?: boolean; // Check counterparty risk (default: true)
    enableOracleCheck?: boolean; // Check oracle integrity (default: true)
    cacheTTL?: number; // Cache TTL in milliseconds (default: 60000)
    fallbackOnError?: boolean; // Allow transactions if API fails (default: true)
}
```

## Risk Metrics

### RiskMetrics Interface

```typescript
interface RiskMetrics {
    asset?: string; // Asset address
    riskScore: number | null; // 0-1 scale, where 1 is highest risk
    complianceStatus: "compliant" | "non-compliant" | "unknown" | null;
    counterpartyRisk: number | null; // 0-1 scale
    oracleIntegrity: number | null; // 0-1 scale, where 1 is highest integrity
    timestamp?: number; // When metrics were fetched
}
```

### Risk Score Interpretation

-   **0.0 - 0.3**: Low risk - Safe for most operations
-   **0.3 - 0.6**: Moderate risk - Review before execution
-   **0.6 - 0.8**: High risk - Block in strict mode
-   **0.8 - 1.0**: Critical risk - Block in all modes

## Caching

Risk uses an in-memory cache to reduce API calls and improve performance.

### Cache Management

```typescript
import { Pulsar } from "@fabrknt/sdk";

// Get cache statistics
const stats = Pulsar.getCacheStats();
console.log("Cache size:", stats.size);
console.log("Cached assets:", stats.entries);

// Clear cache
Pulsar.clearCache();
```

### Cache Configuration

```typescript
// Configure cache TTL (default: 60000ms = 1 minute)
const metrics = await Pulsar.getRiskMetrics(assetAddress, {
    cacheTTL: 300000, // 5 minutes
});
```

## Integration with Guard

Risk integrates automatically with Guard when enabled in the configuration:

```typescript
import { Guard } from "@fabrknt/sdk";

const guard = new Guard({
    pulsar: {
        enabled: true,
        riskThreshold: 0.7,
        enableComplianceCheck: true,
        enableCounterpartyCheck: true,
        enableOracleCheck: true,
        cacheTTL: 60000,
        fallbackOnError: true,
    },
    mode: "block",
});

// Transaction must include assetAddresses
const tx = {
    id: "tx-001",
    status: "pending",
    assetAddresses: ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"],
    instructions: [],
};

// Guard will automatically check Risk metrics
const result = await guard.validateTransaction(tx);

if (!result.isValid) {
    // Check for Risk-related warnings
    result.warnings.forEach((warning) => {
        if (
            warning.message.includes("risk") ||
            warning.message.includes("compliance")
        ) {
            console.log("Risk warning:", warning.message);
        }
    });
}
```

## Error Handling

Risk supports graceful fallback when the API is unavailable:

```typescript
const guard = new Guard({
    pulsar: {
        enabled: true,
        fallbackOnError: true, // Allow transactions if API fails
    },
});

// If Risk API fails, transaction will proceed (if fallbackOnError: true)
// If fallbackOnError: false, transaction will be blocked
```

## Use Cases

### 1. RWA Compliance Checking

```typescript
const guard = new Guard({
    pulsar: {
        // Risk configuration
        enabled: true,
        enableComplianceCheck: true,
        riskThreshold: 0.5, // Stricter for RWA
    },
    mode: "block",
});
```

### 2. High-Frequency Trading

```typescript
// Use aggressive caching for high-frequency operations
const guard = new Guard({
    pulsar: {
        // Risk configuration
        enabled: true,
        cacheTTL: 10000, // 10 seconds for faster updates
    },
});
```

### 3. Institutional DeFi

```typescript
// Comprehensive risk assessment for institutional use
const guard = new Guard({
    pulsar: {
        // Risk configuration
        enabled: true,
        riskThreshold: 0.6,
        enableComplianceCheck: true,
        enableCounterpartyCheck: true,
        enableOracleCheck: true,
    },
    riskTolerance: "strict",
});
```

## API Reference

### Pulsar Class (Risk)

**Note:** The class is exported as `Pulsar` for backward compatibility, but represents Risk functionality.

#### getRiskMetrics()

```typescript
static async getRiskMetrics(
  assetAddress?: string,
  config?: PulsarConfig
): Promise<RiskMetrics>
```

Get risk metrics for a single asset.

**Parameters:**

-   `assetAddress` (optional): The asset address to assess
-   `config` (optional): Pulsar configuration options

**Returns:** `Promise<RiskMetrics>`

#### getBatchRiskMetrics()

```typescript
static async getBatchRiskMetrics(
  assetAddresses: string[],
  config?: PulsarConfig
): Promise<Map<string, RiskMetrics>>
```

Get risk metrics for multiple assets in parallel.

**Parameters:**

-   `assetAddresses`: Array of asset addresses
-   `config` (optional): Pulsar configuration options

**Returns:** `Promise<Map<string, RiskMetrics>>`

#### clearCache()

```typescript
static clearCache(): void
```

Clear the risk metrics cache.

#### getCacheStats()

```typescript
static getCacheStats(): { size: number; entries: string[] }
```

Get cache statistics.

**Returns:** Object with cache size and list of cached asset addresses

## Performance

-   **API Call Latency**: ~50-100ms (first call, cached responses are instant)
-   **Cache Hit Rate**: High with default 1-minute TTL
-   **Batch Processing**: Processes multiple assets in parallel
-   **Memory Usage**: ~1KB per cached asset

## Roadmap

-   [ ] Full x402 protocol integration
-   [ ] Real-time risk score updates via WebSocket
-   [ ] Historical risk trend analysis
-   [ ] Custom risk scoring models
-   [ ] Multi-chain support
-   [ ] Integration with Privacy for privacy-aware risk assessment

## Support

-   GitHub Issues: https://github.com/fabrknt/fabrknt/issues
-   Documentation: https://github.com/fabrknt/fabrknt
-   Twitter: https://x.com/fabrknt
