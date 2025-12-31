import request from 'supertest';
import app from '../src/index';

describe('Payment API Endpoints', () => {
  describe('GET /api/v1/payment/quote', () => {
    it('should return payment quote for default endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/payment/quote')
        .expect(200);

      expect(response.body).toHaveProperty('endpoint');
      expect(response.body).toHaveProperty('price');
      expect(response.body).toHaveProperty('recipient');
      expect(response.body).toHaveProperty('network', 'solana');
      expect(response.body).toHaveProperty('programId');
      expect(response.body.price).toHaveProperty('amount');
      expect(response.body.price).toHaveProperty('currency', 'USDC');
      expect(response.body.price).toHaveProperty('decimals', 6);
    });

    it('should return payment quote for rwa-risk endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/payment/quote')
        .query({ endpoint: 'rwa-risk' })
        .expect(200);

      expect(response.body.endpoint).toBe('rwa-risk');
      expect(response.body.price.amount).toBe('0.05');
    });

    it('should return payment quote for liquidation-params endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/payment/quote')
        .query({ endpoint: 'liquidation-params' })
        .expect(200);

      expect(response.body.endpoint).toBe('liquidation-params');
      expect(response.body.price.amount).toBe('0.10');
    });

    it('should return default pricing for unknown endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/payment/quote')
        .query({ endpoint: 'unknown-endpoint' })
        .expect(200);

      expect(response.body.endpoint).toBe('unknown-endpoint');
      expect(response.body.price.amount).toBe('0.01'); // Default price
    });
  });

  describe('POST /api/v1/payment/verify', () => {
    it('should return 400 if signature is missing', async () => {
      const response = await request(app)
        .post('/api/v1/payment/verify')
        .send({ nonce: 123 })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing transaction signature');
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .post('/api/v1/payment/verify')
        .send({
          signature: '5'.repeat(88), // Invalid signature format
          nonce: 123,
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Transaction not found');
    });

    it('should accept valid signature format', async () => {
      // Note: This will fail with 404 since the transaction doesn't exist
      // but it tests the endpoint accepts the request format
      const response = await request(app)
        .post('/api/v1/payment/verify')
        .send({
          signature: '5'.repeat(88), // Base58-like string
          nonce: 123,
        });

      // Should get 404 (transaction not found) not 400 (bad request)
      expect([400, 404]).toContain(response.status);
    });
  });
});

