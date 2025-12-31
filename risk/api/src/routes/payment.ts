import { Router, Request, Response } from 'express';
import { Connection, PublicKey } from '@solana/web3.js';
import { PaymentService } from '../services/paymentService';

const router = Router();
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

const paymentService = new PaymentService(connection);

/**
 * GET /api/v1/payment/quote
 * Get payment quote for API access
 */
router.get('/quote', async (req: Request, res: Response) => {
  try {
    const endpoint = req.query.endpoint as string || 'default';
    
    // Get pricing based on endpoint
    const pricing = {
      default: {
        amount: '0.01',
        currency: 'USDC',
        decimals: 6,
      },
      'rwa-risk': {
        amount: '0.05',
        currency: 'USDC',
        decimals: 6,
      },
      'liquidation-params': {
        amount: '0.10',
        currency: 'USDC',
        decimals: 6,
      },
    };

    const price = pricing[endpoint as keyof typeof pricing] || pricing.default;

    res.json({
      endpoint,
      price,
      recipient: process.env.TREASURY_WALLET || '',
      network: 'solana',
      programId: process.env.PAYMENT_PROGRAM_ID || '',
    });
  } catch (error) {
    console.error('Payment quote error:', error);
    res.status(500).json({ error: 'Failed to generate payment quote' });
  }
});

/**
 * POST /api/v1/payment/verify
 * Verify payment transaction using PaymentService
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { signature, nonce, expectedAmount } = req.body;

    if (!signature) {
      return res.status(400).json({ error: 'Missing transaction signature' });
    }

    // Verify payment using PaymentService
    const verification = await paymentService.verifyPayment(
      signature,
      expectedAmount ? parseFloat(expectedAmount) : undefined,
      nonce ? parseInt(nonce, 10) : undefined
    );

    if (!verification.verified) {
      return res.status(402).json({
        verified: false,
        error: verification.error || 'Payment verification failed',
        signature,
      });
    }

    res.json({
      verified: true,
      signature: verification.signature,
      user: verification.user.toBase58(),
      amount: verification.amount / Math.pow(10, 6), // Convert to USDC (6 decimals)
      nonce: verification.nonce,
      timestamp: new Date(verification.timestamp * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      error: 'Failed to verify payment',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as paymentRouter };

