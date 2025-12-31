# Guard - Security Layer Documentation

## Overview

Guard is the quality control layer of the Fabrknt SDK, designed to prevent unauthorized drain, excessive slippage, and malicious operations in Solana transactions. It provides real-time security pattern detection and configurable validation rules.

**Repository**: [github.com/fabrknt/guard](https://github.com/fabrknt/guard)

## Features

-   **🔍 Security Pattern Detection** - Detects 8 security patterns (P-101 to P-108)
-   **🪝 Transfer Hook Protection** - Validates Token-2022 Transfer Hooks for malicious behavior
-   **🛡️ Pre-Execution Validation** - Validates transactions before they're signed
-   **⚡ Emergency Stop** - Immediate halt of all operations when needed
-   **📊 Risk Tolerance Levels** - Configurable strictness (strict/moderate/permissive)
-   **📈 Slippage Protection** - Guards against excessive slippage
-   **🧭 Risk Integration** - Real-time risk assessment for RWA and asset integrity
-   **🌿 Privacy Validation** - Validates privacy requirements for Privacy integration
-   **🔧 Custom Rules** - Add your own validation logic
-   **📝 Warning History** - Track all security warnings

## Installation

> **⚠️ Beta:** Fabrknt is currently in beta (development). npm publication is coming soon.

```bash
git clone https://github.com/fabrknt/fabrknt.git
cd fabrknt
npm install
```

**Note:** npm package `@fabrknt/sdk` will be available soon. For now, install directly from GitHub.

## Quick Start

```typescript
import { Guard } from "@fabrknt/sdk";

// Create a Guard with default configuration
const guard = new Guard();

// Validate a transaction (now async due to Risk integration)
const result = await guard.validateTransaction(transaction);

if (!result.isValid) {
    console.log("Transaction blocked:", result.blockedBy);
    console.log("Warnings:", result.warnings);
}
```

## Configuration

### GuardConfig

```typescript
interface GuardConfig {
    // Slippage protection (percentage)
    maxSlippage?: number;

    // Emergency stop - halts all operations
    emergencyStop?: boolean;

    // Enable/disable pattern detection
    enablePatternDetection?: boolean;

    // Risk tolerance level
    riskTolerance?: "strict" | "moderate" | "permissive";

    // Operation mode
    mode?: "block" | "warn";

    // Custom validation rules
    customRules?: ValidationRule[];

    // Risk assessment integration
    pulsar?: PulsarConfig;

    // Transfer Hook validation (Token-2022)
    validateTransferHooks?: boolean; // Enable Transfer Hook checks (default: true)
    maxHookAccounts?: number; // Max accounts per hook (default: 20)
    allowedHookPrograms?: string[]; // Whitelist of safe hook programs
}

interface PulsarConfig {
    enabled?: boolean; // Enable Risk checks
    riskThreshold?: number; // 0-1 scale, block if exceeded
    enableComplianceCheck?: boolean; // Check compliance status
    enableCounterpartyCheck?: boolean; // Check counterparty risk
    enableOracleCheck?: boolean; // Check oracle integrity
    cacheTTL?: number; // Cache TTL in milliseconds
    fallbackOnError?: boolean; // Allow transactions if API fails
}
```

### Risk Tolerance Levels

#### Strict

-   Blocks all critical and warning-level patterns
-   Recommended for production environments
-   Maximum security

```typescript
const guard = new Guard({ riskTolerance: "strict" });
```

#### Moderate (Default)

-   Blocks only critical patterns
-   Warns on lower-severity issues
-   Balanced security and flexibility

```typescript
const guard = new Guard({ riskTolerance: "moderate" });
```

#### Permissive

-   Blocks only irreversible operations (mint/freeze kills)
-   Minimal intervention
-   For advanced users

```typescript
const guard = new Guard({ riskTolerance: "permissive" });
```

### Operation Modes

#### Block Mode (Default)

Prevents dangerous transactions from executing:

```typescript
const guard = new Guard({ mode: "block" });
```

#### Warn Mode

Allows all transactions but logs warnings:

```typescript
const guard = new Guard({ mode: "warn" });
```

## Security Patterns

Guard detects 8 security patterns based on the `guard` core repository:

### P-101: Mint Kill 🔴 CRITICAL

**Description**: Permanently disabling mint authority

**Risk**: Irreversible. No more tokens can be minted.

**Example**:

```typescript
// Detected when SetAuthority(MintTokens, None) is called
```

**Protection**: Blocked in moderate+ risk tolerance

---

### P-102: Freeze Kill 🔴 CRITICAL

**Description**: Permanently disabling freeze authority

**Risk**: Irreversible. Loss of freeze capability.

**Example**:

```typescript
// Detected when SetAuthority(FreezeAccount, None) is called
```

**Protection**: Blocked in moderate+ risk tolerance

---

### P-103: Signer Mismatch ⚠️ WARNING

**Description**: Transferring authority to unsigned wallet

**Risk**: Potential lockout if new authority is compromised.

**Example**:

```typescript
// Detected when new authority is not in transaction signers
```

**Protection**: Blocked in strict mode, warned in moderate

---

### P-104: Dangerous Close ⚡ ALERT

**Description**: Closing account without balance verification

**Risk**: Potential loss of funds if balance is not transferred.

**Example**:

```typescript
// Detected when CloseAccount instruction is used
```

**Protection**: Warned in all modes

---

### P-105: Malicious Transfer Hook 🔴 CRITICAL

**Description**: Unknown Transfer Hook program with excessive writable accounts

**Risk**: Potential fund drain, unauthorized state modification, or malicious behavior during token transfers.

**Example**:

```typescript
// Detected when:
// - Hook program is not in whitelist
// - Hook accesses > 10 writable accounts
// - Hook accesses > 15 total accounts
```

**Protection**: Blocked in moderate+ risk tolerance

**Configuration**:

```typescript
const guard = new Guard({
    validateTransferHooks: true,
    allowedHookPrograms: ["fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3"], // Fragmetric
});
```

---

### P-106: Unexpected Hook Execution ⚡ ALERT

**Description**: Transfer Hook invoked without accompanying token transfer

**Risk**: Hook may be exploiting execution context or performing unauthorized operations.

**Example**:

```typescript
// Detected when:
// - Hook program accesses > 10 accounts
// - No Transfer or TransferChecked instruction present
```

**Protection**: Warned in all modes

---

### P-107: Hook Reentrancy 🔴 CRITICAL

**Description**: Transfer Hook calling back into token program or excessive invocations

**Risk**: Reentrancy attacks, double-spending, or state manipulation.

**Example**:

```typescript
// Detected when:
// - Hook is sandwiched between token instructions
// - Same hook invoked > 6 times in single transaction
```

**Protection**: Blocked in moderate+ risk tolerance

**Note**: Legitimate protocols like Fragmetric invoke hooks 4-6 times per transfer for reward distribution - this is normal and whitelisted.

---

### P-108: Excessive Hook Accounts ⚠️ WARNING

**Description**: Transfer Hook accesses more accounts than configured limit

**Risk**: Excessive computation, potential gas bomb, or suspicious behavior.

**Example**:

```typescript
// Detected when hook accounts > maxHookAccounts (default: 20)
```

**Protection**: Warned in all modes

**Configuration**:

```typescript
const guard = new Guard({
    maxHookAccounts: 20, // Default based on Fragmetric analysis
});
```

## Transfer Hook Security (Token-2022)

### Overview

Token-2022 introduces **Transfer Hooks**, programs that execute automatically during token transfers. While powerful for features like reward distribution (as used by Fragmetric's fragSOL), they introduce new attack vectors.

### How Guard Protects You

Guard analyzes Transfer Hook invocations to detect:

1. **Malicious hooks** that attempt to drain funds
2. **Reentrancy attacks** via nested token calls
3. **Gas bombs** with excessive account access
4. **Unauthorized operations** disguised as transfers

### Known Safe Hooks

Guard includes a whitelist of verified Transfer Hook programs:

-   **Fragmetric** (`fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3`)
    -   Purpose: On-chain reward distribution for fragSOL
    -   Accounts: ~17 per invocation
    -   Invocations: 4-6 per transfer
    -   Status: ✅ Verified safe

### Adding Custom Safe Hooks

```typescript
const guard = new Guard({
    validateTransferHooks: true,
    allowedHookPrograms: [
        "fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3", // Fragmetric
        "YourCustomHook111111111111111111111111111", // Your protocol
    ],
    maxHookAccounts: 20,
});
```

### Disabling Transfer Hook Validation

If you're certain a transaction is safe:

```typescript
const guard = new Guard({
    validateTransferHooks: false, // Skip all hook checks
});
```

**⚠️ Warning**: Only disable for trusted transactions. Transfer Hooks can modify state and drain funds.

### Example: Fragmetric Transaction

```typescript
import { Guard } from "@fabrknt/sdk";

const guard = new Guard({
    validateTransferHooks: true,
    mode: "block",
});

// Transfer fragSOL - hook invoked 6 times for reward tracking
const result = await guard.validateTransaction(fragSOLTransferTx);

// ✅ Pass - Fragmetric is whitelisted
console.log(result.isValid); // true
console.log(result.warnings); // No warnings for known safe hooks
```

## API Reference

### Guard Class

#### Constructor

```typescript
constructor(config?: GuardConfig)
```

Creates a new Guard instance with optional configuration.

#### Methods

##### validateTransaction()

```typescript
validateTransaction(transaction: Transaction): Promise<ValidationResult>
```

Validates a transaction against all Guard rules. **Now async** to support Risk assessment.

**Returns**: `Promise<ValidationResult>`

-   `isValid`: boolean - Whether transaction passes validation
-   `warnings`: Array of security warnings detected
-   `blockedBy`: Array of pattern IDs that blocked the transaction

**Note**: If Risk is enabled and `transaction.assetAddresses` is provided, Guard will automatically fetch and validate risk metrics.

##### validate()

```typescript
validate(transaction?: Transaction): Promise<boolean>
```

Legacy validation method. Returns `true` if valid, `false` otherwise. **Now async**.

##### getConfig()

```typescript
getConfig(): GuardConfig
```

Returns the current Guard configuration.

##### updateConfig()

```typescript
updateConfig(updates: Partial<GuardConfig>): void
```

Updates Guard configuration at runtime.

##### activateEmergencyStop()

```typescript
activateEmergencyStop(): void
```

Immediately blocks all operations.

##### deactivateEmergencyStop()

```typescript
deactivateEmergencyStop(): void
```

Resumes normal operations.

##### isSlippageAcceptable()

```typescript
isSlippageAcceptable(actualSlippage: number): boolean
```

Checks if slippage is within acceptable limits.

##### getWarningHistory()

```typescript
getWarningHistory(): SecurityWarning[]
```

Returns all warnings detected since Guard creation.

##### clearWarningHistory()

```typescript
clearWarningHistory(): void
```

Clears the warning history.

## Usage Examples

### Basic Validation

```typescript
import { Guard } from "@fabrknt/sdk";

const guard = new Guard({
    maxSlippage: 1.0,
    riskTolerance: "moderate",
});

const result = await guard.validateTransaction(tx);

if (result.isValid) {
    // Safe to proceed
    await sendTransaction(tx);
} else {
    console.error("Transaction blocked:", result.blockedBy);
    result.warnings.forEach((warning) => {
        console.log(warning.message);
    });
}
```

### Risk Assessment

```typescript
import { Guard } from "@fabrknt/sdk";

const guard = new Guard({
    pulsar: {
        // Risk configuration
        enabled: true,
        riskThreshold: 0.7, // Block if risk > 0.7
        enableComplianceCheck: true, // Check compliance status
        enableCounterpartyCheck: true, // Check counterparty risk
        enableOracleCheck: true, // Check oracle integrity
        cacheTTL: 60000, // Cache for 1 minute
        fallbackOnError: true, // Allow if API fails
    },
    mode: "block",
    riskTolerance: "moderate",
});

// Transaction must include assetAddresses for risk assessment
const tx = {
    id: "tx-001",
    status: "pending",
    assetAddresses: ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"],
    instructions: [],
};

const result = await guard.validateTransaction(tx);

if (!result.isValid) {
    // Check if blocked by Risk assessment
    result.warnings.forEach((warning) => {
        if (warning.message.includes("risk")) {
            console.log("High risk asset detected:", warning.affectedAccount);
        }
    });
}
```

### Emergency Stop

```typescript
const guard = new Guard();

// In case of security incident
guard.activateEmergencyStop();

// All transactions will be blocked
const result = await guard.validate(); // false

// Resume when safe
guard.deactivateEmergencyStop();
```

### Custom Rules

```typescript
const guard = new Guard({
    customRules: [
        {
            id: "max-value",
            name: "Maximum Transaction Value",
            enabled: true,
            validate: (tx) => {
                // Custom logic
                return tx.value < 1000000;
            },
        },
    ],
});
```

### Slippage Protection

```typescript
const guard = new Guard({ maxSlippage: 0.5 }); // 0.5%

// Before swap execution
if (!guard.isSlippageAcceptable(actualSlippage)) {
    throw new Error("Slippage exceeds limit");
}
```

### Monitoring Warnings

```typescript
const guard = new Guard();

// Validate multiple transactions (now async)
await guard.validateTransaction(tx1);
await guard.validateTransaction(tx2);
await guard.validateTransaction(tx3);

// Review all warnings
const warnings = guard.getWarningHistory();
console.log(`Total warnings: ${warnings.length}`);

warnings.forEach((warning) => {
    console.log(`[${warning.severity}] ${warning.message}`);
});
```

### Privacy Validation

Guard automatically validates privacy requirements when transactions include privacy metadata:

```typescript
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

const result = await guard.validateTransaction(privateTx);
// Guard will warn if privacy is requested but compression is disabled
```

## Integration with Fabrknt

### Standard Execution

```typescript
import { Fabrknt, Guard } from "@fabrknt/sdk";

const guard = new Guard({
    maxSlippage: 1.0,
    emergencyStop: false,
});

// Guard is automatically used by Fabrknt.execute()
await Fabrknt.execute(tx, { with: guard });
```

### Execution with Risk Assessment

```typescript
import { Fabrknt, Guard } from "@fabrknt/sdk";

const guard = new Guard({
    pulsar: {
        // Risk configuration
        enabled: true,
        riskThreshold: 0.7,
        enableComplianceCheck: true,
    },
    mode: "block",
});

// Transaction with asset addresses
const tx = {
    id: "tx-001",
    status: "pending",
    assetAddresses: ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"],
    instructions: [],
};

// Fabrknt.execute() will check Risk before execution
const result = await Fabrknt.execute(tx, { with: guard });
```

### Private Transaction Execution

```typescript
import { Fabrknt, Guard } from "@fabrknt/sdk";

const guard = new Guard({ riskTolerance: "moderate" });

const tx = {
    id: "tx-private",
    status: "pending",
    instructions: [],
};

// Execute as private transaction with Privacy layer
const result = await Fabrknt.executePrivate(tx, {
    with: guard,
    privacy: {
        provider: "arbor", // Privacy
        compression: true,
    },
});
```

## Best Practices

1. **Always use Guard in production** - Even in permissive mode
2. **Set appropriate risk tolerance** - Balance security with flexibility
3. **Enable Risk for RWA transactions** - Critical for Real World Assets and institutional use
4. **Configure Risk caching** - Reduce API calls with appropriate TTL
5. **Monitor warning history** - Review patterns regularly
6. **Implement emergency procedures** - Have a plan for activateEmergencyStop()
7. **Test in warn mode first** - Understand warnings before blocking
8. **Use custom rules for domain logic** - Add business-specific validations
9. **Handle async validation** - All validation methods are now async due to Risk integration
10. **Set fallback behavior** - Configure `fallbackOnError` for Risk API failures
11. **Combine with Privacy** - Use privacy layer for confidential transactions

## TypeScript Types

```typescript
import type {
    GuardConfig,
    ValidationResult,
    SecurityWarning,
    ValidationRule,
    PulsarConfig,
    RiskMetrics,
} from "@fabrknt/sdk";

// Pattern IDs
import { PatternId } from "@fabrknt/sdk";
// PatternId.MintKill, FreezeKill, SignerMismatch, DangerousClose

// Severity Levels
import { Severity } from "@fabrknt/sdk";
// Severity.Critical, Warning, Alert
```

## Performance

-   **Validation Time**: < 1ms for typical transactions (without Risk)
-   **Validation Time with Risk**: ~50-100ms (includes API call, cached responses are instant)
-   **Memory**: ~1KB base + warnings history + Risk cache
-   **Pattern Detection**: O(n) where n = number of instructions
-   **Risk Cache**: Configurable TTL, reduces API calls significantly

## Roadmap

-   [x] Risk assessment integration
-   [x] Privacy validation integration
-   [x] Async validation support
-   [ ] Support for Token-2022 program patterns
-   [ ] Full x402 protocol integration for Risk
-   [ ] ML-based anomaly detection
-   [ ] Multi-signature policy enforcement
-   [ ] Time-based transaction limits
-   [ ] WebSocket notifications
-   [ ] Real-time Risk score updates

## Contributing

We welcome contributions! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.

## Support

-   GitHub Issues: https://github.com/fabrknt/fabrknt/issues
-   Documentation: https://github.com/fabrknt/fabrknt
-   Twitter: https://x.com/fabrknt
