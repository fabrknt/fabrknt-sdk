# Testing Guide

This document explains how to run tests for the Risk RWA Risk Gateway project.

## Test Structure

The project has two types of tests:

1. **Anchor Program Tests** (Solana program tests)

    - Location: `tests/payment.test.ts`
    - Framework: Mocha + Chai
    - Tests the on-chain Solana payment program

2. **API Tests** (Express API server tests)
    - Location: `api/tests/`
    - Framework: Jest + Supertest
    - Tests the REST API endpoints

## Prerequisites

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install API dependencies
cd api && npm install && cd ..
```

### 2. Start Solana Test Validator

The Anchor program tests require a running Solana test validator.

**Option A: Automatic (Recommended)**
The test script will automatically start the validator if it's not running.

**Option B: Manual Start**

```bash
# Start validator in a separate terminal
./scripts/start-validator.sh

# Or manually:
solana-test-validator \
  --reset \
  --rpc-port 8899 \
  --faucet-port 9900 \
  --limit-ledger-size 50000000
```

## Running Tests

### Run All Tests

From the project root:

```bash
# Run all tests (Anchor + API)
npm test
```

This will:

1. Check if a validator is running
2. Start one if needed
3. Run Anchor program tests
4. Run API tests

**Note:** The API tests run automatically after Anchor tests.

### Run Anchor Program Tests Only

```bash
# From project root
npm run test:anchor

# Or directly
npx ts-mocha -p ./tsconfig.json -t 1000000 tests/payment.test.ts
```

**What it tests:**

-   Gateway initialization (handles existing gateway gracefully)
-   Payment processing
-   Token transfers
-   Event emission

### Run API Tests Only

```bash
# From project root
npm run api:test

# Or from api directory
cd api
npm test

# Watch mode (auto-rerun on changes)
cd api
npm run test:watch
```

**What it tests:**

-   Health endpoints
-   Payment quotes
-   Payment verification
-   Authentication (wallet signature and on-chain payment)
-   Data endpoints (RWA risk, liquidation params)
-   x402 protocol
-   Error handling
-   Rate limiting

### Run Specific Test Files

**Anchor Tests:**

```bash
# Run specific test file
npx ts-mocha -p ./tsconfig.json -t 1000000 tests/payment.test.ts
```

**API Tests:**

```bash
cd api

# Run specific test file
npm test -- payment.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="payment"

# Run with verbose output
npm test -- --verbose
```

## Test Files

### Anchor Program Tests

-   `tests/payment.test.ts`
    -   Gateway initialization (handles existing gateway)
    -   Payment processing
    -   Fee updates
    -   Error handling

### API Tests

-   `api/tests/health.test.ts` - Health check endpoints
-   `api/tests/payment.test.ts` - Payment quote and verification
-   `api/tests/auth.test.ts` - Authentication middleware (wallet signature)
-   `api/tests/data.test.ts` - Data endpoints (RWA risk, liquidation)
-   `api/tests/x402.test.ts` - x402 protocol implementation
-   `api/tests/error-handling.test.ts` - Error handling
-   `api/tests/example.test.ts` - Example test structure

## Test Environment Setup

### Environment Variables

The tests use environment variables. Create a `.env` file in the `api` directory:

```env
# Solana Configuration
SOLANA_RPC_URL=http://localhost:8899
PAYMENT_PROGRAM_ID=84zwY58ivSmpGY8gsenAc2c4XpwBUyh1thF9XXx3LhfD
TREASURY_WALLET=<your-treasury-wallet>

# API Configuration
PORT=3000
NODE_ENV=test

# Optional
FALLBACK_TO_MOCK=true
```

**Note:** If `.env` is not present, tests will use defaults from `api/tests/setup.ts`.

### Anchor Test Configuration

Anchor tests use the configuration in `Anchor.toml`:

```toml
[programs.localnet]
risk = "84zwY58ivSmpGY8gsenAc2c4XpwBUyh1thF9XXx3LhfD"
```

## Authentication in Tests

### Wallet Signature Authentication

For wallet signature authentication, use these headers:

-   `x-wallet-address`: Wallet public key
-   `x-wallet-signature`: Base64-encoded signature
-   `x-message`: Message that was signed
-   `x-timestamp`: Timestamp of the request

### On-Chain Payment Authentication

For on-chain payment authentication, use these headers:

-   `x-payment-signature`: Transaction signature
-   `x-payment-nonce`: Payment nonce
-   `x-expected-amount`: Expected payment amount

### Demo Mode

For testing without authentication:

-   `x-demo-mode: true`

## Troubleshooting

### Gateway Already Initialized

If you see "Gateway already initialized, skipping initialization":

This is **normal** and expected. The test will:

-   Skip initialization if gateway already exists
-   Verify the gateway has valid data
-   Continue with payment tests

To start fresh:

```bash
# Stop and restart validator (resets all state)
./scripts/stop-validator.sh
./scripts/start-validator.sh
```

### Validator Already Running

If you get "port 8899 already in use":

```bash
# Stop existing validator
./scripts/stop-validator.sh

# Or manually
pkill -f solana-test-validator
```

### Tests Failing Due to Insufficient SOL

If tests fail with "insufficient funds":

```bash
# Ensure validator is running
./scripts/start-validator.sh

# The test script will automatically airdrop SOL to test accounts
```

### API Tests Failing

If API tests fail:

1. **Check API server is not running:**

    ```bash
    # Stop any running API server
    pkill -f "tsx watch src/index.ts"
    ```

2. **Check environment variables:**

    ```bash
    cd api
    cat .env
    ```

3. **Run tests with verbose output:**

    ```bash
    cd api
    npm test -- --verbose
    ```

4. **Check for authentication header issues:**
    - Use `x-wallet-signature` for wallet signature auth
    - Use `x-payment-signature` for on-chain payment auth
    - Use `x-demo-mode: true` for demo mode

### Anchor Tests Timing Out

If Anchor tests timeout:

1. **Increase timeout:**

    ```bash
    npx ts-mocha -p ./tsconfig.json -t 3000000 tests/payment.test.ts
    ```

2. **Check validator is responding:**
    ```bash
    solana cluster-version --url http://localhost:8899
    ```

### Module Type Warning

If you see warnings about module type:

This is a harmless warning. To fix it, add to `package.json`:

```json
{
    "type": "module"
}
```

Note: This may require adjusting other configurations, so it's optional.

## Test Results

### Expected Output

**Anchor Tests:**

```
  risk
Gateway already initialized, skipping initialization
    ✔ Initializes the gateway
    ✔ Processes a payment (935ms)

  2 passing (3s)
```

**API Tests:**

```
Test Suites: 7 passed, 7 total
Tests:       35 passed, 35 total
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
              with:
                  node-version: "18"
            - name: Install dependencies
              run: npm install
            - name: Start validator
              run: ./scripts/start-validator.sh
            - name: Run tests
              run: npm test
```

## Test Coverage

### Generate Coverage Report (API Tests)

```bash
cd api
npm test -- --coverage
```

Coverage report will be in `api/coverage/`.

## Best Practices

1. **Run tests before committing:**

    ```bash
    npm test
    ```

2. **Run tests in watch mode during development:**

    ```bash
    cd api
    npm run test:watch
    ```

3. **Run specific tests when debugging:**

    ```bash
    cd api
    npm test -- --testNamePattern="payment verification"
    ```

4. **Keep validator running during development:**

    ```bash
    # Terminal 1: Keep validator running
    ./scripts/start-validator.sh

    # Terminal 2: Run tests
    npm test
    ```

## Quick Reference

```bash
# Run all tests
npm test

# Run Anchor tests only
npm run test:anchor

# Run API tests only
npm run api:test

# Start validator
./scripts/start-validator.sh

# Stop validator
./scripts/stop-validator.sh

# Run API tests in watch mode
cd api && npm run test:watch

# Run specific API test file
cd api && npm test -- payment.test.ts

# Run with verbose output
cd api && npm test -- --verbose
```

## Next Steps

After running tests successfully, you can:

1. Deploy to devnet: `npm run deploy:devnet`
2. Run the demo: `npm run demo`
3. Start development servers:
    - API: `npm run api:dev`
    - Frontend: `npm run frontend:dev`
