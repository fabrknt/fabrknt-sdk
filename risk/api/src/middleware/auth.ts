import { Request, Response, NextFunction } from 'express';
import { Connection, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { PaymentService } from '../services/paymentService';

const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
);

// Initialize payment service
const paymentService = new PaymentService(connection);

export interface AuthenticatedRequest extends Request {
  wallet?: PublicKey;
  signature?: string;
  paymentVerification?: {
    verified: boolean;
    amount: number;
    nonce: number;
  };
}

/**
 * Middleware to verify wallet signature for x402 protocol authentication
 * Now includes payment verification for on-chain payments
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for payment transaction signature (on-chain payment)
    const paymentSignature = req.headers['x-payment-signature'] as string;
    const paymentNonce = req.headers['x-payment-nonce'] as string;
    const expectedAmount = req.headers['x-expected-amount'] as string;

    // Check for wallet signature (off-chain signature auth)
    const walletSignature = req.headers['x-wallet-signature'] as string;
    const wallet = req.headers['x-wallet-address'] as string;
    const message = req.headers['x-message'] as string;
    const timestamp = req.headers['x-timestamp'] as string;

    // Priority 1: On-chain payment verification
    if (paymentSignature) {
      const nonce = paymentNonce ? parseInt(paymentNonce, 10) : undefined;
      const amount = expectedAmount ? parseFloat(expectedAmount) : undefined;

      const verification = await paymentService.verifyPayment(
        paymentSignature,
        amount,
        nonce
      );

      if (!verification.verified) {
        return res.status(402).json({
          error: 'Payment Required',
          message: verification.error || 'Payment verification failed',
          payment: {
            amount: expectedAmount || '0.01',
            currency: 'USDC',
            recipient: process.env.TREASURY_WALLET || '',
            network: 'solana',
          },
        });
      }

      // Attach payment verification to request
      req.wallet = verification.user;
      req.signature = paymentSignature;
      req.paymentVerification = {
        verified: true,
        amount: verification.amount / Math.pow(10, 6), // Convert from lamports
        nonce: verification.nonce,
      };

      return next();
    }

    // Priority 2: Wallet signature verification (legacy/fallback)
    if (walletSignature && wallet && message && timestamp) {
      // Verify timestamp (prevent replay attacks)
      const requestTime = parseInt(timestamp, 10);
      const currentTime = Date.now();
      const timeWindow = 5 * 60 * 1000; // 5 minutes

      if (Math.abs(currentTime - requestTime) > timeWindow) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Request timestamp expired',
        });
      }

      // Verify signature
      const publicKey = new PublicKey(wallet);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = Buffer.from(walletSignature, 'base64');

      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );

      if (!isValid) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid signature',
        });
      }

      // Attach wallet info to request
      req.wallet = publicKey;
      req.signature = walletSignature;

      return next();
    }

    // No valid authentication method provided
    return res.status(402).json({
      error: 'Payment Required',
      message: 'This endpoint requires payment via x402 protocol',
      payment: {
        amount: '0.01',
        currency: 'USDC',
        recipient: process.env.TREASURY_WALLET || '',
        network: 'solana',
        programId: process.env.PAYMENT_PROGRAM_ID || '',
      },
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
};

