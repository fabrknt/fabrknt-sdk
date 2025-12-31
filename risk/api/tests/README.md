# API Tests

Comprehensive test suite for the Pulsar API server.

## Test Files

- **`health.test.ts`** - Health check endpoint tests
- **`payment.test.ts`** - Payment API endpoint tests (quote, verify)
- **`data.test.ts`** - Data endpoint tests (RWA risk, liquidation params)
- **`auth.test.ts`** - Authentication middleware and x402 protocol tests
- **`x402.test.ts`** - x402 protocol implementation tests
- **`error-handling.test.ts`** - Error handling and edge case tests
- **`example.test.ts`** - Main test suite entry point

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Test Coverage

The test suite covers:

### Payment Endpoints
- ✅ Payment quote generation for different endpoints
- ✅ Payment verification with transaction signatures
- ✅ Error handling for missing/invalid signatures

### Data Endpoints
- ✅ RWA risk data retrieval (demo mode and authenticated)
- ✅ Liquidation parameters retrieval
- ✅ Different token mint addresses
- ✅ Authentication requirements

### Authentication
- ✅ x402 protocol signature verification
- ✅ Timestamp validation (5-minute window)
- ✅ Invalid signature rejection
- ✅ Missing header handling
- ✅ Demo mode support

### Error Handling
- ✅ Invalid routes (404)
- ✅ Malformed requests
- ✅ Rate limiting
- ✅ CORS headers

## Test Structure

Tests use:
- **Jest** - Test framework
- **Supertest** - HTTP assertion library
- **@solana/web3.js** - For wallet/signature generation
- **tweetnacl** - For signature verification

## Writing New Tests

1. Create a new test file: `api/tests/your-feature.test.ts`
2. Import the app: `import app from '../src/index';`
3. Use supertest for HTTP requests
4. Follow existing test patterns

Example:
```typescript
import request from 'supertest';
import app from '../src/index';

describe('Your Feature', () => {
  it('should do something', async () => {
    const response = await request(app)
      .get('/api/v1/your-endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('expectedProperty');
  });
});
```

## Test Environment

Tests run with:
- `NODE_ENV=test` - Prevents server from starting
- Mock Solana RPC connection (devnet)
- Test-specific environment variables

See `tests/setup.ts` for test environment configuration.

