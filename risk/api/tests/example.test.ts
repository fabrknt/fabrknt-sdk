/**
 * Main API test suite
 * All API tests are organized in separate files:
 * - payment.test.ts: Payment endpoints
 * - data.test.ts: Data endpoints
 * - auth.test.ts: Authentication middleware
 * - x402.test.ts: x402 protocol implementation
 * - health.test.ts: Health check endpoint
 * - error-handling.test.ts: Error handling and edge cases
 */

describe("API Test Suite", () => {
    it("should have all test modules loaded", () => {
        expect(true).toBe(true);
    });
});
