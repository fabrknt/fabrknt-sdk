import request from 'supertest';
import app from '../src/index';
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';

describe('Authentication Middleware', () => {
  const testTokenMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

  describe('x402 Protocol Authentication', () => {
    it('should reject request without signature header', async () => {
      const response = await request(app)
        .get(`/api/v1/data/rwa-risk/${testTokenMint}`)
        .set('x-wallet-address', Keypair.generate().publicKey.toBase58())
        .set('x-message', 'test message')
        .set('x-timestamp', Date.now().toString())
        .expect(402); // Payment Required (no payment or wallet signature)

      expect(response.body).toHaveProperty('error', 'Payment Required');
    });

    it('should reject request without wallet address', async () => {
      const keypair = Keypair.generate();
      const message = 'test message';
      const messageBytes = new TextEncoder().encode(message);
      const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
      const signatureBase64 = Buffer.from(signature).toString('base64');

      // x-payment-signature is for on-chain payments, will fail verification
      // Use x-wallet-signature for wallet signature auth
      const response = await request(app)
        .get(`/api/v1/data/rwa-risk/${testTokenMint}`)
        .set('x-wallet-signature', signatureBase64)
        .set('x-message', message)
        .set('x-timestamp', Date.now().toString())
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should reject request with invalid signature', async () => {
      const keypair = Keypair.generate();
      const wallet = keypair.publicKey;
      const message = 'test message';
      const wrongMessage = 'wrong message';
      const messageBytes = new TextEncoder().encode(wrongMessage);
      const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
      const signatureBase64 = Buffer.from(signature).toString('base64');

      const response = await request(app)
        .get(`/api/v1/data/rwa-risk/${testTokenMint}`)
        .set('x-wallet-address', wallet.toBase58())
        .set('x-message', message) // Different message than signed
        .set('x-timestamp', Date.now().toString())
        .set('x-wallet-signature', signatureBase64) // Use wallet signature, not payment signature
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body).toHaveProperty('message', 'Invalid signature');
    });

    it('should reject request with expired timestamp', async () => {
      const keypair = Keypair.generate();
      const wallet = keypair.publicKey;
      const message = 'test message';
      const messageBytes = new TextEncoder().encode(message);
      const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
      const signatureBase64 = Buffer.from(signature).toString('base64');
      
      // Timestamp from 10 minutes ago (expired)
      const expiredTimestamp = Date.now() - (10 * 60 * 1000);

      const response = await request(app)
        .get(`/api/v1/data/rwa-risk/${testTokenMint}`)
        .set('x-wallet-address', wallet.toBase58())
        .set('x-message', message)
        .set('x-timestamp', expiredTimestamp.toString())
        .set('x-wallet-signature', signatureBase64) // Use wallet signature
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body).toHaveProperty('message', 'Request timestamp expired');
    });

    it('should accept request with valid signature and recent timestamp', async () => {
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
        .set('x-wallet-signature', signatureBase64) // Use wallet signature
        .expect(200);

      expect(response.body).toHaveProperty('requestedBy', wallet.toBase58());
    });

    it('should accept request with timestamp in the future (within 5 minute window)', async () => {
      const keypair = Keypair.generate();
      const wallet = keypair.publicKey;
      const futureTimestamp = Date.now() + (2 * 60 * 1000); // 2 minutes in future
      const message = `GET /api/v1/data/rwa-risk/${testTokenMint} ${futureTimestamp}`;
      const messageBytes = new TextEncoder().encode(message);
      const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
      const signatureBase64 = Buffer.from(signature).toString('base64');

      const response = await request(app)
        .get(`/api/v1/data/rwa-risk/${testTokenMint}`)
        .set('x-wallet-address', wallet.toBase58())
        .set('x-message', message)
        .set('x-timestamp', futureTimestamp.toString())
        .set('x-wallet-signature', signatureBase64) // Use wallet signature
        .expect(200);

      expect(response.body).toHaveProperty('requestedBy', wallet.toBase58());
    });
  });

  describe('Demo Mode', () => {
    it('should allow access with x-demo-mode header', async () => {
      const response = await request(app)
        .get(`/api/v1/data/rwa-risk/${testTokenMint}`)
        .set('x-demo-mode', 'true')
        .expect(200);

      expect(response.body).toHaveProperty('requestedBy', 'demo-mode');
    });

    it('should not require authentication headers in demo mode', async () => {
      const response = await request(app)
        .get(`/api/v1/data/liquidation-params/${testTokenMint}`)
        .set('x-demo-mode', 'true')
        .expect(200);

      expect(response.body).toHaveProperty('requestedBy', 'demo-mode');
    });
  });
});

