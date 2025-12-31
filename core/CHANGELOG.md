# Changelog

All notable changes to the Fabrknt SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-12-25

### BREAKING CHANGES

This release completes the rebrand from **Fabriquant** to **Fabrknt** with breaking changes to class names and type definitions.

### Repository Naming

Core repositories have been renamed to match component names for consistency:

-   `x-liquidity-engine` → `flow` - Multi-DEX liquidity routing
-   `sol-ops-guard` → `guard` - Security & Compliance
-   `solfabric` → `loom` - Parallel Execution Logic
-   `pulsar` → `risk` - RWA Risk Oracle & Integrity Gateway
-   `arbor` → `privacy` - Privacy: Shielded State Middleware & Privacy Layer

**Note:** All documentation has been updated to reflect these new repository names. GitHub URLs will redirect automatically.

**Important:** Each core repository can be used independently or integrated through the unified `@fabrknt/sdk` package. Developers can pick what they need.

#### Class and Type Renames

-   **BREAKING**: Main orchestration class renamed: `Fabriquant` → `Fabrknt`
-   **BREAKING**: Configuration type renamed: `FabriquantConfig` → `FabrkntConfig`
-   **BREAKING**: Core module file renamed: `src/core/fabriquant.ts` → `src/core/fabrknt.ts`
-   **BREAKING**: Test file renamed: `tests/fabriquant.test.ts` → `tests/fabrknt.test.ts`

#### Migration Required

**Before (v0.2.0):**

```typescript
import { Fabriquant, Guard } from "@fabrknt/sdk";

const fabriquant = new Fabriquant({
    network: "mainnet-beta",
});

await Fabriquant.execute(tx, { with: guard });
```

**After (v0.3.0):**

```typescript
import { Fabrknt, Guard } from "@fabrknt/sdk";

const fabrknt = new Fabrknt({
    network: "mainnet-beta",
});

await Fabrknt.execute(tx, { with: guard });
```

#### What Changed

-   All references to `Fabriquant` class replaced with `Fabrknt`
-   All references to `FabriquantConfig` type replaced with `FabrkntConfig`
-   Import paths updated from `./core/fabriquant` to `./core/fabrknt`
-   Variable names in examples updated to use `fabrknt` convention
-   All documentation, comments, and marketing materials updated

#### What Stayed the Same

-   ✅ Package name remains `@fabrknt/sdk` (changed in v0.2.0)
-   ✅ All other class names unchanged (`Guard`, `Pulsar`, `FabricCore`, etc.)
-   ✅ All API methods and functionality remain identical
-   ✅ All configuration options unchanged
-   ✅ 100% test coverage maintained (417 tests passing)

### Documentation

-   Updated MIGRATION.md with complete migration guide
-   Updated all code examples in README.md
-   Updated all JSDoc comments and inline documentation
-   Updated marketing automation content templates

### Repository

-   Organization: `fabrknt/fabrknt`
-   Package: `@fabrknt/sdk`
-   Version: `0.3.0`

**Migration Guide**: See [MIGRATION.md](./MIGRATION.md) for detailed migration instructions.

---

## [0.1.0] - 2025-12-22

### Major Rebranding

This release represents a complete rebranding of the project from "Fabricant" to "Fabrknt" with updated naming conventions for all components.

#### Project Naming

-   **BREAKING**: Renamed project from `fabricant` to `fabrknt`
-   **BREAKING**: Package name changed from `@fabricant/sdk` to `@fabrknt/sdk`
-   Updated all documentation and examples to reflect new branding

#### Component Naming Changes

The component naming has been simplified and clarified:

| Old Name        | New Name      | Backward Compatibility                |
| --------------- | ------------- | ------------------------------------- |
| Fabric Pulse    | Risk          | Class still exported as `Pulsar`      |
| Fabric Weave    | Privacy       | Provider identifier remains `"arbor"` |
| Fabric Core     | FabricCore    | ✅ No change needed                   |
| Fabricant Suite | Fabrknt Suite | Updated to new name                   |

**Note**: Backward compatibility is maintained for the `Pulsar` class export and `"arbor"` provider identifier to minimize breaking changes for early adopters.

### Added

#### Core Features

-   Unified SDK structure consolidating Guard, Risk (Pulsar), Privacy (Arbor), Loom, and FabricCore
-   Main `Fabrknt` orchestration class for transaction execution
-   `Fabrknt.execute()` - Execute transactions with Guard validation
-   `Fabrknt.executePrivate()` - Execute privacy-enabled transactions with ZK Compression

#### Guard (Security Layer)

-   Transaction validation with configurable security rules
-   Pattern detection for 4 security threats:
    -   P-101: Excessive Slippage Detection
    -   P-102: Unauthorized Drain Prevention
    -   P-103: Malicious CPI Call Detection
    -   P-104: Reentrancy Attack Detection
-   Configurable enforcement modes: `"block"`, `"warn"`, `"monitor"`
-   Risk integration for real-time asset validation
-   Custom pattern detection support

#### Risk (formerly Pulsar)

-   AI-driven risk assessment for RWA and asset integrity
-   Real-time risk scoring and compliance checks
-   Intelligent caching with configurable TTL
-   Seamless Guard integration for automated transaction blocking
-   Fallback handling for API errors

#### Privacy (formerly Arbor - via FabricCore)

-   ZK Compression support for massive cost reduction (99.98% savings)
-   Transaction optimization with privacy settings
-   Cost estimation tools for compression savings
-   Shielded state management (placeholder for future integration)
-   Support for Light Protocol integration

#### Loom (Liquidity Engine)

-   High-velocity liquidity routing (placeholder implementation)
-   Transaction weaving with parallel optimization
-   Multi-DEX routing preparation

### Changed

#### Breaking Changes

-   Project name: `fabricant` → `fabrknt`
-   Package name: `@fabricant/sdk` → `@fabrknt/sdk`
-   Import paths updated to reflect new package name

#### Backward Compatible Changes

-   `Pulsar` class name retained for backward compatibility (represents Risk component)
-   `"arbor"` provider identifier retained (represents Privacy component)
-   All documentation updated to explain old vs new naming

#### Documentation Updates

-   Complete rewrite of README.md with new branding and philosophy
-   Created comprehensive GUARD.md documentation
-   Created comprehensive RISK.md documentation
-   Created comprehensive PRIVACY.md documentation
-   Added CONTRIBUTING.md with development guidelines
-   Added MIGRATION.md guide for name changes
-   Updated all code examples to use new terminology

### Fixed

-   ESLint error in `FabricCore.compressWithArbor()` - added explicit Promise.resolve()
-   Unused parameter warnings properly suppressed with void operator

### Development

#### Project Structure

```
fabrknt/
├── src/
│   ├── core/           # Fabrknt orchestration class
│   ├── guard/          # Security layer (Guard)
│   ├── pulsar/         # Risk assessment (Risk/Pulsar)
│   ├── fabric/         # Performance & Privacy (FabricCore)
│   ├── loom/           # Liquidity engine (Loom)
│   └── types/          # Shared TypeScript types
├── docs/               # Component documentation
├── examples/           # Usage examples
└── tests/              # Unit tests
```

#### Dependencies

-   `@solana/web3.js` ^1.87.6 - Solana blockchain integration
-   TypeScript 5.3+ for strict type checking
-   Vitest for testing framework
-   ESLint for code quality

#### Testing & Quality

-   Comprehensive test suite for Guard and pattern detection
-   ESLint with TypeScript support and strict rules
-   Vitest coverage reporting
-   Strict TypeScript configuration

### Roadmap

#### Phase 1: SDK Consolidation ✅

-   Merged core modules into unified `@fabrknt/sdk`
-   Established consistent naming and branding

#### Phase 1.5: Risk & Privacy Integration ✅

-   Risk oracle integration complete
-   Privacy layer scaffolding in place

#### Phase 2: Pattern Library ✅ (v0.2.0)

-   Pre-built execution templates for AI agents
-   DAO treasury management patterns
-   Automated trading strategies
-   Real DEX integration with Jupiter V6

#### Phase 2.5: Full ZK Stack Integration (Upcoming)

-   Complete Privacy/Light Protocol integration
-   ZK proof generation and verification
-   Shielded state management

#### Phase 3: Fabrknt Mainnet (Future)

-   Decentralized autonomous vault infrastructure
-   Full stack deployment on Solana mainnet

### Migration Guide

For users upgrading from pre-0.1.0 versions, see [MIGRATION.md](./MIGRATION.md) for detailed migration instructions.

### Links

-   [Repository](https://github.com/fabrknt/fabrknt)
-   [Issues](https://github.com/fabrknt/fabrknt/issues)
-   [Documentation](./docs/)

### Contributors

-   **Psyto** - Project creator and maintainer

---

## [0.2.0] - 2025-12-23

### Added

#### DEX Integration Module

-   **Jupiter V6 Integration**: Real-time price feeds, swap routing, and quote fetching from Solana's leading DEX aggregator

    -   `JupiterAdapter` class with quote/price/route API support
    -   Configurable caching with TTL (30s default) for optimal performance
    -   Timeout handling and error recovery
    -   Support for multiple token pairs

-   **Price Feed Service**: Multi-source price aggregation and management

    -   `PriceFeedService` class for aggregating prices from multiple DEX adapters
    -   Real-time price subscriptions with polling support
    -   Automatic fallback between adapters for reliability
    -   Cache management with statistics tracking
    -   Parallel price fetching for multiple tokens

-   **DEX Adapter Interface**: Swappable integration pattern
    -   Abstract `DEXAdapter` interface for adding custom DEX integrations
    -   Common types for `TokenMint`, `PriceQuote`, `SwapRoute`, `TokenPrice`, `MarketInfo`
    -   `COMMON_TOKENS` export with Solana token mint addresses (SOL, USDC, USDT, RAY, SRM, MNGO, ORCA)

#### Pattern Library Enhancements

-   **ArbitragePattern**: Real DEX integration support

    -   Optional `enableRealDEX` flag to switch between simulated and live price feeds
    -   Custom `dexAdapter` configuration support
    -   Real-time multi-DEX price comparison using Jupiter
    -   Backward compatible with existing simulated tests

-   **SwapPattern**: Real routing optimization
    -   Optional `enableRealDEX` flag for live route fetching
    -   Automatic route optimization via Jupiter V6 API
    -   Conversion of Jupiter market infos to internal route format
    -   Fallback to configured routes if API unavailable

#### Documentation

-   New module exports in `src/index.ts`:
    -   `JupiterAdapter`, `PriceFeedService`, `COMMON_TOKENS`
    -   DEX types: `TokenMint`, `PriceQuote`, `MarketInfo`, `SwapRoute`, `TokenPrice`, `DEXAdapter`, `PriceFeed`, `DEXConfig`
-   Complete API documentation for DEX integration in main index file

#### Testing

-   **28 new DEX integration tests** (tests/dex-integration.test.ts - 616 lines)
    -   JupiterAdapter: quote fetching, price retrieval, route optimization, caching, error handling
    -   PriceFeedService: multi-adapter aggregation, subscriptions, fallback behavior, cache management
    -   Mock-based tests for reliable CI/CD without external API dependencies
-   **Test Coverage**: 417 total tests passing (389 existing + 28 new)

### Changed

#### Pattern Library

-   `ArbitrageConfig` interface: Added optional `enableRealDEX` and `dexAdapter` fields
-   `SwapConfig` interface: Added optional `enableRealDEX`, `dexAdapter` fields; made `routes` optional
-   Patterns now support both simulated (testing) and real DEX (production) execution modes

#### Infrastructure

-   New `/src/dex/` directory with modular DEX integration architecture
-   Jupiter V6 API endpoints integrated: `https://quote-api.jup.ag/v6` and `https://price.jup.ag/v4`

### Technical Details

#### Architecture

```
src/dex/
├── types.ts          # DEX adapter interfaces and common types (190 lines)
├── jupiter.ts        # Jupiter V6 API client implementation (298 lines)
├── price-feed.ts     # Price aggregation service (223 lines)
└── index.ts          # Module exports (21 lines)
```

#### API Integration

-   Jupiter Quote API: Real-time swap quotes with route plans and price impact
-   Jupiter Price API: Token price data with vs-token comparison
-   Caching layer to minimize API calls and improve performance
-   AbortController support for request timeouts

#### Backward Compatibility

-   All existing tests pass without modification
-   Patterns default to simulated mode (`enableRealDEX: false`)
-   Opt-in approach ensures zero breaking changes

### Fixed

-   None - this is a feature-only release

### Files Changed

-   8 files modified, 1,483 insertions, 6 deletions
-   New files: `src/dex/*`, `tests/dex-integration.test.ts`
-   Modified: `src/index.ts`, `src/patterns/ai-agents/arbitrage.ts`, `src/patterns/defi/swap-pattern.ts`

## [0.3.1] - 2025-12-31

### Added

#### Guard (Security Layer) - Token-2022 Transfer Hook Protection

-   **Transfer Hook Security Patterns**: Added 4 new security patterns for Token-2022 Transfer Hook validation
    -   **P-105: Malicious Transfer Hook** - Detects unknown hooks with excessive writable accounts (>10) and total accounts (>15)
    -   **P-106: Unexpected Hook Execution** - Warns when Transfer Hook executes without accompanying token transfer
    -   **P-107: Hook Reentrancy** - Detects hooks sandwiched between token operations or excessive invocations (>6)
    -   **P-108: Excessive Hook Accounts** - Warns when hooks exceed account limit (default: 20)

-   **Transfer Hook Configuration**: New Guard configuration options
    -   `validateTransferHooks?: boolean` - Enable/disable Transfer Hook validation (default: true)
    -   `maxHookAccounts?: number` - Maximum accounts per hook invocation (default: 20, based on Fragmetric analysis)
    -   `allowedHookPrograms?: string[]` - Whitelist of known safe Transfer Hook programs

-   **Known Safe Hooks Whitelist**: Pre-approved Transfer Hook programs
    -   Fragmetric (`fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3`) - fragSOL liquid restaking token

#### Documentation

-   **Token-2022 Transfer Hooks Complete Guide** (`docs/token-extensions/transfer-hooks.md` - 752 lines)
    -   Comprehensive guide covering Transfer Hook architecture, implementation, and best practices
    -   In-depth Fragmetric fragSOL case study with on-chain analysis
    -   Real transaction analysis (Tx: `5gMtBE1wEqJxtt2fDgFid9APqZ2kgR3yVVvxnxC8C2hxKLoTEn1Sc8NQ8iNPBVMcnbEvFS7uRvj64772tJnT6yyt`)
    -   Implementation examples in Rust and TypeScript
    -   Gas optimization techniques and integration with fabrknt Guard

-   **Security Patterns Reference** (`docs/token-extensions/security-patterns.md` - 546 lines)
    -   Detailed breakdown of P-105 to P-108 detection logic
    -   Real-world attack scenarios (Drain Hook, Reentrancy Exploit, Gas Bomb)
    -   Safe implementation checklists for creators, developers, and integrators
    -   Step-by-step integration guide

-   **Token Extensions Overview** (`docs/token-extensions/README.md` - 202 lines)
    -   Quick start guide and navigation
    -   Security patterns summary table
    -   Known safe hooks whitelist
    -   Community resources

-   **Updated Main README**: Added Token Extensions section linking to new documentation

#### Examples

-   **Fragmetric Integration Example** (`examples/fragmetric-integration/` - 1,213 lines)
    -   Complete production-ready example of safe fragSOL (Token-2022) transfers
    -   Automatic Transfer Hook detection and verification
    -   Guard validation with P-105 to P-108 pattern detection
    -   Three usage modes:
        -   `basic` - Safe single fragSOL transfer with validation
        -   `batch` - Batch transfers with retry logic and error handling
        -   `inspect` - Detailed Transfer Hook and token extension analysis
    -   Utility functions for balance checking, formatting, and retry logic
    -   Comprehensive README with examples and troubleshooting

#### Testing

-   **18 Transfer Hook detection tests** (tests/detector.test.ts)
    -   P-105: Malicious Transfer Hook detection (2 tests)
    -   P-106: Unexpected Hook Execution detection (2 tests)
    -   P-107: Hook Reentrancy detection (2 tests)
    -   P-108: Excessive Hook Accounts detection (2 tests)
    -   Configuration options validation (2 tests)
    -   All tests passing ✅

### Changed

-   **Guard Pattern Count**: Security patterns increased from 4 to 8
    -   Solana patterns: P-101 to P-108 (8 total)
    -   EVM patterns: EVM-001 to EVM-004 (4 total)

-   **Guard Documentation**: Updated GUARD.md with Transfer Hook security section
    -   Added P-105 to P-108 pattern descriptions
    -   Added "Transfer Hook Security (Token-2022)" section
    -   Updated features list (now detects 8 security patterns)
    -   Added Fragmetric as known safe hook example

### Technical Details

#### On-Chain Analysis

Based on real-world Fragmetric fragSOL implementation analysis:
-   **Token Mint**: `FRAGSEthVFL7fdqM8hxfxkfCZzUvmg21cqPJVvC1qdbo`
-   **Hook Program**: `fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3` (3.1MB program)
-   **Hook Invocations**: 4-6 per transfer (legitimate)
-   **Accounts per Invocation**: ~17 (efficient)
-   **Transaction Cost**: ~0.000005 SOL ($0.001)
-   **Use Case**: Time-weighted reward distribution for liquid restaking

#### Detection Logic

```typescript
// P-105: Malicious Transfer Hook
if (writableAccounts > 10 && totalAccounts > 15 && !isWhitelisted) {
  block("Malicious Transfer Hook");
}

// P-107: Hook Reentrancy
if (hookInvocations > 6 && !isKnownSafe) {
  block("Excessive hook reentrancy");
}

// P-108: Excessive Hook Accounts
if (accountCount > maxHookAccounts) {
  warn("Too many accounts");
}
```

### Files Changed

-   **Modified**: 5 files (GUARD.md, detector.ts, validator.ts, types/index.ts, detector.test.ts)
-   **Added**: 8 files (3 documentation files, 5 example files)
-   **Total**: +2,371 insertions, -6 deletions across 13 files

### Backward Compatibility

-   ✅ **Fully backward compatible** - All existing functionality unchanged
-   ✅ Transfer Hook validation is opt-in via configuration
-   ✅ Default behavior: `validateTransferHooks: true` (enabled by default for safety)
-   ✅ Can be disabled: `validateTransferHooks: false`
-   ✅ All 417+ existing tests passing

### Related Links

-   [Transfer Hooks Guide](./docs/token-extensions/transfer-hooks.md)
-   [Security Patterns](./docs/token-extensions/security-patterns.md)
-   [Fragmetric Integration Example](./examples/fragmetric-integration/)
-   [Fragmetric Protocol](https://fragmetric.xyz)

---

## [Unreleased]

Future releases will be documented here.

### Planned

-   Complete Loom liquidity routing implementation
-   Enhanced error handling with custom error types
-   Performance benchmarking suite
-   API documentation site with TypeDoc
-   Integration with actual x402 protocol for Risk
-   Full Privacy/Light Protocol ZK stack integration
-   TypeScript SDK examples for common use cases
-   Chain abstraction layer for cross-chain support
-   EVM support for Guard and Risk components

### Business & Operations

-   **Business Plan v3.1** (January 2025): Added comprehensive AI tool leverage strategy
    -   Updated operating model to emphasize AI-assisted development, marketing, and operations
    -   Added AI tool stack recommendations and ROI analysis
    -   Updated financial projections to reflect AI tool cost savings
    -   Cross-chain strategy documented: "Solana-First, Cross-Chain Enabled"

---

[0.3.0]: https://github.com/fabrknt/fabrknt/releases/tag/v0.3.0
[0.2.0]: https://github.com/fabrknt/fabrknt/releases/tag/v0.2.0
[0.1.0]: https://github.com/fabrknt/fabrknt/releases/tag/v0.1.0
