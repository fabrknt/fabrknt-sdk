# Known Limitations

**Last Updated**: December 30, 2025
**SDK Version**: v0.3.0 (Beta)

This document provides transparency about the current limitations and development status of each Fabrknt module. We believe in clear communication about what works, what's in progress, and what requires caution.

---

## Overview

Fabrknt is actively developed and tested primarily on **devnet and testnet**. Individual modules have varying maturity levels. This document helps you make informed decisions about which modules to use in your environment.

## Module Status Summary

| Module | Devnet | Testnet | Mainnet | Primary Limitation |
|--------|--------|---------|---------|-------------------|
| **Guard** | ✅ Ready | ✅ Ready | ⚠️ Use with Caution | Minimal test coverage (1 test) |
| **Risk** | ✅ Ready | ✅ Ready | ⚠️ MVP Only | Oracle integrations incomplete |
| **Loom** | ✅ Ready | ✅ Ready | ⚠️ Partial | ShredStream gRPC not implemented |
| **Privacy** | ⚠️ Untested | ⚠️ Untested | ❌ Not Ready | No automated tests |
| **Flow** | ❌ Blocked | ❌ Blocked | ❌ Not Ready | Raydium CLMM not integrated |

---

## 1. Guard (Security Validation Layer)

### ✅ What Works
- Real-time transaction pattern detection (4 patterns implemented)
- Solana RPC integration for live transaction analysis
- Signer verification and validation
- Comprehensive error handling
- Color-coded terminal output

### ⚠️ Known Limitations

**Test Coverage**
- Only 1 unit test exists (`detector.rs` warning format test)
- No integration tests
- No RPC simulation tests
- Transaction analysis tests missing

**Missing Features**
- Discord webhook notifications referenced but not fully implemented
- No automated testing of detection patterns (P-101, P-102, P-103, P-104)

**Recommendation**
- ✅ **Devnet/Testnet**: Ready for use with basic security validation
- ⚠️ **Mainnet**: Use with caution - consider additional manual review for high-value transactions

**File Reference**: [`src/guard/`](./src/guard/)

---

## 2. Risk (RWA Risk Assessment)

### ✅ What Works
- Payment verification system
- x402 Protocol (HTTP 402 Payment Required)
- Rate limiting (IP + wallet-based)
- Authentication middleware
- Metaplex token metadata integration (real on-chain data)
- Mock data fallback system
- Good test coverage (8 test files, ~46 test cases)

### ⚠️ Known Limitations

**Oracle Integrations**
- **Switchboard**: Line 195 - TODO: Implement actual Switchboard feed query
- **Pyth Network**: Line 202 - TODO: Implement Pyth Network feed query
- Currently using mock data fallback or custom oracle only

**Production Concerns**
- Falls back to mock data on RPC errors (if `FALLBACK_TO_MOCK=true`)
- Not yet connected to real RWA risk data sources beyond Metaplex

**Recommendation**
- ✅ **Devnet/Testnet**: Ready for MVP testing
- ⚠️ **Mainnet**: MVP only - oracle integrations pending for full functionality

**File Reference**: [`src/pulsar/`](./src/pulsar/) or [`src/risk/`](./src/risk/)

---

## 3. Loom (Parallel Execution)

### ✅ What Works
- Jito Bundle integration fully functional
- Transaction serialization (base64 encoding)
- Tip instruction generation (Low, Medium, High, Turbo)
- Dynamic tip calculation
- Bundle simulation API
- Automatic retry with exponential backoff
- Real Jito Block Engine integration

### ⚠️ Known Limitations

**Missing Implementation**
- **ShredStream gRPC**: Line 325 - "Implement gRPC connection" - NOT IMPLEMENTED
  - Critical for high-velocity market data streaming
  - Required for low-latency execution
- No Raiku integration

**Test Coverage**
- Only 1 test file (`yieldsplitter.test.ts`)
- YieldSplitter AMM integration tested only
- No tests for core Jito bundle functionality
- No retry logic tests

**Recommendation**
- ✅ **Devnet/Testnet**: Ready for bundle submission
- ⚠️ **Mainnet**: Partial - bundle submission works, ShredStream unavailable

**File Reference**: [`src/loom/`](./src/loom/)

---

## 4. Privacy (ZK Compression)

### ✅ What Works
- Light Protocol SDK integration (`@lightprotocol/stateless.js`)
- Phase 2 implementation complete:
  - Compressed account creation
  - Token compression
  - Compressed transfers with ZK proofs
  - Balance checking for compressed accounts
- Working examples (private-airdrop.ts, compressed-transfer.ts)

### ⚠️ Known Limitations

**Testing**
- **Zero automated tests** - no Jest test suite
- Phase 2 status: "Ready to Test" but not validated
- No proof verification tests
- No integration tests

**Missing Features**
- Selective disclosure mechanisms not implemented
- Audit key derivation not implemented
- Nullifier tracking not implemented
- Multi-signature compressed accounts not implemented

**Dependencies**
- Requires Helius API key for Photon RPC
- Light Protocol infrastructure dependency

**Recommendation**
- ⚠️ **Devnet**: Untested - use at own risk
- ❌ **Testnet**: Not recommended until testing complete
- ❌ **Mainnet**: Not ready - needs comprehensive validation

**File Reference**: [`src/fabric/`](./src/fabric/) or [`src/privacy/`](./src/privacy/)

---

## 5. Flow (DEX Integration)

### ✅ What Works
- Protocol configuration (fees, limits, x402 payment)
- Jupiter V6 program ID correct
- Jupiter route data structures defined
- Slippage calculations
- Audit logging framework
- Authority validation

### ⚠️ Known Limitations

**Critical Blockers** (4 unimplemented CPI calls)
1. **Raydium OpenPosition**: Line 1169 - TODO: Implement actual CPI call
2. **Raydium IncreaseLiquidity**: Line 1200 - TODO: Implement CPI
3. **Raydium DecreaseLiquidity**: Line 1223 - TODO: Implement CPI
4. **Raydium Collect**: Line 1244 - TODO: Implement CPI

**Implementation Status**
- All Raydium CLMM functions are stubs (placeholders)
- Instruction discriminators are placeholders
- Account derivation not implemented for Raydium
- No actual CPI invocations
- Status documented as "Foundation Implemented - Research Phase"

**Test Coverage**
- Only ~7.5% code coverage (150 lines of tests / 2000+ lines of code)
- Basic happy-path tests only
- Missing: rebalancing tests, fee collection tests, error cases

**Recommendation**
- ❌ **Devnet**: Blocked - core functionality not implemented
- ❌ **Testnet**: Blocked
- ❌ **Mainnet**: Not ready - requires Raydium instruction format research and CPI implementation

**File Reference**: [`src/flow/`](./src/flow/), [`docs/RAYDIUM_INTEGRATION_STATUS.md`](./docs/RAYDIUM_INTEGRATION_STATUS.md)

---

## Production Deployment Checklist

Before deploying to **mainnet**, ensure you:

### Pre-Deployment Validation

- [ ] Review [Module Status](#module-status-summary) table
- [ ] Confirm you're only using modules marked ✅ or ⚠️ for mainnet
- [ ] Read module-specific limitations above
- [ ] Test on devnet first, then testnet
- [ ] Set up monitoring and alerting
- [ ] Have rollback plan ready

### Module-Specific Checks

**If using Guard:**
- [ ] Test detection patterns on devnet transactions
- [ ] Verify signer validation works for your use case
- [ ] Consider manual review for high-value transactions
- [ ] Monitor for false positives

**If using Risk:**
- [ ] Understand MVP limitations (no Switchboard/Pyth yet)
- [ ] Configure fallback behavior appropriately
- [ ] Test rate limiting with realistic load
- [ ] Verify authentication works

**If using Loom:**
- [ ] Test Jito bundle submission on devnet
- [ ] Validate tip amounts are appropriate
- [ ] Understand ShredStream limitation if you need market data
- [ ] Test retry logic with network failures

**If using Privacy:**
- [ ] ❌ **Do NOT use on mainnet** - insufficient testing
- [ ] Wait for comprehensive test suite
- [ ] Monitor Light Protocol status

**If using Flow:**
- [ ] ❌ **Do NOT use** - core functionality not implemented
- [ ] Wait for Raydium CLMM integration completion

---

## Reporting Issues

Found a bug or limitation not listed here?

1. **GitHub Issues**: [fabrknt/fabrknt/issues](https://github.com/fabrknt/fabrknt/issues)
2. **Security Issues**: Email security@fabrknt.com (if applicable)
3. **Discussions**: [fabrknt/fabrknt/discussions](https://github.com/fabrknt/fabrknt/discussions)

---

## Roadmap for Improvements

### Phase 1 (Immediate - Next Sprint)
- Add comprehensive test suites to Guard, Loom, Flow (target 70%+ coverage)
- Complete Flow's Raydium CPI implementation
- Implement and test Privacy's ZK compression flows

### Phase 2 (Short-term - 2-3 Weeks)
- Implement Loom's ShredStream gRPC connection
- Complete Risk oracle integrations (Switchboard, Pyth)
- Implement Guard's Discord webhook notifications

### Phase 3 (Before Mainnet)
- Full integration testing across all 5 modules
- Security audit of cryptographic operations (Privacy, Guard)
- Load testing of Jito integration (Loom) and API endpoints (Risk)
- Staging environment validation on devnet

---

## Version History

### v0.3.0 (Current - Beta)
- Initial beta release
- Guard, Risk, Loom: Devnet/Testnet ready with limitations
- Privacy: Experimental
- Flow: Research phase

---

**Questions?** Check our [Getting Started Guide](./docs/getting-started.md) or [Contributing Guide](./CONTRIBUTING.md).
