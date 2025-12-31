# Token Vesting Example

Complete example showing how to build a token vesting system using Fabrknt's TokenVestingPattern.

## Features

-   ✅ Linear vesting with cliff periods
-   ✅ Milestone-based unlocks
-   ✅ Automatic vested amount calculation
-   ✅ Claim tracking and history
-   ✅ Guard security validation
-   ✅ CSV reporting for compliance
-   ✅ Vesting progress monitoring

## Use Case

Token distribution for team members, advisors, and investors with 1-year vesting and 3-month cliff.

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
# Process vesting claims
node vesting.js

# Outputs:
# - Claimed amounts for each beneficiary
# - Vesting progress
# - Transaction hashes
# - CSV report
```

## Code Overview

This example demonstrates:

1. **Vesting Schedule Setup** - Configure cliff periods and linear vesting
2. **Automatic Calculation** - Calculate vested amounts based on time elapsed
3. **Claim Processing** - Execute token transfers for vested amounts
4. **Progress Tracking** - Monitor vesting progress for each grant
5. **Compliance Reporting** - Generate reports for regulatory compliance

## Production Considerations

-   Store vesting grants in database with audit trail
-   Implement multi-sig for vault wallet security
-   Add beneficiary self-service claim portal
-   Set up monitoring for cliff dates and full vesting
-   Archive all claims for compliance
-   Consider tax implications for beneficiaries
-   Implement grant cancellation for terminated employees
-   Add vesting acceleration clauses for M&A events

## Related Patterns

-   **BatchPayoutPattern** - For initial token airdrops
-   **RecurringPaymentPattern** - For ongoing advisor compensation
