# Subscription Billing Example

Complete example showing how to build a subscription billing system using Fabrknt's RecurringPaymentPattern.

## Features

-   ✅ Automated monthly subscription billing
-   ✅ Multiple subscription tiers (Basic, Pro, Enterprise)
-   ✅ Flexible scheduling (daily, weekly, monthly)
-   ✅ Guard security validation
-   ✅ Automatic retry logic for failed payments
-   ✅ Customer ID tracking
-   ✅ Next billing date calculation
-   ✅ CSV reporting for accounting

## Use Case

SaaS platform billing customers monthly in USDC on Solana.

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
# Run subscription billing
node subscriptions.js

# Outputs:
# - Processed subscription payments
# - Failed payment notifications
# - Next billing dates
# - CSV report
```

## Code Overview

This example demonstrates:

1. **Subscription Management** - Track customer subscriptions and billing schedules
2. **Automated Billing** - Execute recurring payments based on schedule
3. **Guard Configuration** - Security validation for payment processing
4. **Schedule Calculation** - Automatic next billing date calculation
5. **Failure Handling** - Retry logic and customer notification

## Production Considerations

-   Store subscription data in database (Postgres, MongoDB)
-   Implement webhook notifications for failed payments
-   Add dunning logic (retry failed payments with backoff)
-   Send billing receipts via email
-   Implement subscription pause/cancel functionality
-   Add usage-based billing for metered features
-   Set up monitoring for billing success rates
-   Comply with PCI-DSS and data privacy regulations

## Related Patterns

-   **BatchPayoutPattern** - For bulk refund processing
-   **TokenVestingPattern** - For token-based loyalty rewards
