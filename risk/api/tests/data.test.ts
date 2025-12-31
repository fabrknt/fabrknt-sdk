import request from 'supertest';
import app from '../src/index';
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';

describe('Data API Endpoints', () => {
  const testTokenMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC

  describe('GET /api/v1/data/rwa-risk/:tokenMint', () => {
    it('should return RWA risk data in demo mode', async () => {
      const response = await request(app)
        .get(`/api/v1/data/rwa-risk/${testTokenMint}`)
        .set('x-demo-mode', 'true')
        .expect(200);

      expect(response.body).toHaveProperty('tokenMint', testTokenMint);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('requestedBy', 'demo-mode');
      
      expect(response.body.metrics).toHaveProperty('legalCompliance');
      expect(response.body.metrics).toHaveProperty('counterpartyRisk');
      expect(response.body.metrics).toHaveProperty('oracleIntegrity');
      
      expect(response.body.metrics.legalCompliance).toHaveProperty('status');
      expect(response.body.metrics.legalCompliance).toHaveProperty('jurisdiction');
      expect(response.body.metrics.legalCompliance).toHaveProperty('structure');
      
      expect(response.body.metrics.counterpartyRisk).toHaveProperty('issuerRating');
      expect(response.body.metrics.counterpartyRisk).toHaveProperty('defaultProbability');
      expect(response.body.metrics.counterpartyRisk).toHaveProperty('solvencyScore');
      
      expect(response.body.metrics.oracleIntegrity).toHaveProperty('consensusNodes');
      expect(response.body.metrics.oracleIntegrity).toHaveProperty('dataReliability');
      expect(response.body.metrics.oracleIntegrity).toHaveProperty('latency');
    });

    it('should return RWA risk data with valid authentication', async () => {
      const keypair = Keypair.generate();
      const wallet = keypair.publicKey;
      const timestamp = Date.now();
      const message = `GET /api/v1/data/rwa-risk/${testTokenMint} ${timestamp}`;
      const messageBytes = new TextEncoder().encode(message);
      const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
      const signatureBase64 = Buffer.from(signature).toString('base64');

      const response = await request(app)
        .get(`/api/v1/data/rwa-risk/${testTokenMint}`)
        .set('x-wallet-address', wallet.toBase58())
        .set('x-message', message)
        .set('x-timestamp', timestamp.toString())
        .set('x-wallet-signature', signatureBase64) // Use wallet signature for auth
        .expect(200);

      expect(response.body).toHaveProperty('tokenMint', testTokenMint);
      expect(response.body).toHaveProperty('requestedBy', wallet.toBase58());
    });

    it('should return 402 without authentication or demo mode', async () => {
      const response = await request(app)
        .get(`/api/v1/data/rwa-risk/${testTokenMint}`)
        .expect(402); // Payment Required

      expect(response.body).toHaveProperty('error', 'Payment Required');
    });

    it('should handle different token mint addresses', async () => {
      const differentMint = 'So11111111111111111111111111111111111111112'; // SOL

      const response = await request(app)
        .get(`/api/v1/data/rwa-risk/${differentMint}`)
        .set('x-demo-mode', 'true')
        .expect(200);

      expect(response.body).toHaveProperty('tokenMint', differentMint);
    });
  });

  describe('GET /api/v1/data/liquidation-params/:tokenMint', () => {
    it('should return liquidation parameters in demo mode', async () => {
      const response = await request(app)
        .get(`/api/v1/data/liquidation-params/${testTokenMint}`)
        .set('x-demo-mode', 'true')
        .expect(200);

      expect(response.body).toHaveProperty('tokenMint', testTokenMint);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('parameters');
      expect(response.body).toHaveProperty('requestedBy', 'demo-mode');
      
      expect(response.body.parameters).toHaveProperty('liquidationThreshold');
      expect(response.body.parameters).toHaveProperty('maxLtv');
      expect(response.body.parameters).toHaveProperty('liquidationPenalty');
      expect(response.body.parameters).toHaveProperty('healthFactor');
      expect(response.body.parameters).toHaveProperty('volatility');
      expect(response.body.parameters).toHaveProperty('correlation');
      
      expect(response.body.parameters.correlation).toHaveProperty('sol');
      expect(response.body.parameters.correlation).toHaveProperty('usdc');
    });

    it('should return liquidation parameters with valid authentication', async () => {
      const keypair = Keypair.generate();
      const wallet = keypair.publicKey;
      const timestamp = Date.now();
      const message = `GET /api/v1/data/liquidation-params/${testTokenMint} ${timestamp}`;
      const messageBytes = new TextEncoder().encode(message);
      const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
      const signatureBase64 = Buffer.from(signature).toString('base64');

      const response = await request(app)
        .get(`/api/v1/data/liquidation-params/${testTokenMint}`)
        .set('x-wallet-address', wallet.toBase58())
        .set('x-message', message)
        .set('x-timestamp', timestamp.toString())
        .set('x-wallet-signature', signatureBase64) // Use wallet signature for auth
        .expect(200);

      expect(response.body).toHaveProperty('tokenMint', testTokenMint);
      expect(response.body).toHaveProperty('requestedBy', wallet.toBase58());
    });

    it('should return 402 without authentication or demo mode', async () => {
      const response = await request(app)
        .get(`/api/v1/data/liquidation-params/${testTokenMint}`)
        .expect(402); // Payment Required

      expect(response.body).toHaveProperty('error', 'Payment Required');
    });
  });
});

