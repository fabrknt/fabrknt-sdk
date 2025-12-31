import request from 'supertest';
import app from '../src/index';

describe('x402 Protocol Implementation', () => {
  const testTokenMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

  describe('HTTP 402 Payment Required', () => {
    it('should return 402 for data endpoints without payment signature', async () => {
      // Request without any authentication headers
      const response = await request(app)
        .get(`/api/v1/data/rwa-risk/${testTokenMint}`)
        // No headers at all
        .expect(402); // Payment Required

      expect(response.body).toHaveProperty('error', 'Payment Required');
      expect(response.body).toHaveProperty('payment');
    });

    it('should include payment details in response structure', async () => {
      // Test that payment quote endpoint provides all required x402 fields
      const response = await request(app)
        .get('/api/v1/payment/quote')
        .query({ endpoint: 'rwa-risk' })
        .expect(200);

      expect(response.body).toHaveProperty('price');
      expect(response.body.price).toHaveProperty('amount');
      expect(response.body.price).toHaveProperty('currency', 'USDC');
      expect(response.body).toHaveProperty('recipient');
      expect(response.body).toHaveProperty('network', 'solana');
      expect(response.body).toHaveProperty('programId');
    });
  });

  describe('Payment Quote Structure', () => {
    it('should return payment quote with correct structure for x402', async () => {
      const response = await request(app)
        .get('/api/v1/payment/quote')
        .query({ endpoint: 'rwa-risk' })
        .expect(200);

      // Verify x402-compatible structure
      expect(response.body.price).toHaveProperty('amount');
      expect(response.body.price).toHaveProperty('currency');
      expect(response.body.price).toHaveProperty('decimals');
      expect(typeof response.body.price.amount).toBe('string');
      expect(response.body.price.currency).toBe('USDC');
      expect(response.body.price.decimals).toBe(6);
    });

    it('should provide different pricing for different endpoints', async () => {
      const defaultQuote = await request(app)
        .get('/api/v1/payment/quote')
        .query({ endpoint: 'default' })
        .expect(200);

      const rwaRiskQuote = await request(app)
        .get('/api/v1/payment/quote')
        .query({ endpoint: 'rwa-risk' })
        .expect(200);

      const liquidationQuote = await request(app)
        .get('/api/v1/payment/quote')
        .query({ endpoint: 'liquidation-params' })
        .expect(200);

      expect(defaultQuote.body.price.amount).toBe('0.01');
      expect(rwaRiskQuote.body.price.amount).toBe('0.05');
      expect(liquidationQuote.body.price.amount).toBe('0.10');
    });
  });
});

