import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Connection } from '@solana/web3.js';
import { paymentRouter } from './routes/payment';
import { dataRouter } from './routes/data';
import { authMiddleware } from './middleware/auth';
import { DataService } from './services/dataService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Solana connection
const connection = new Connection(
  process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

// Initialize data service
const dataService = new DataService(connection);
let dataServiceInitialized = false;

// Initialize data service asynchronously
dataService.initialize()
  .then(() => {
    dataServiceInitialized = true;
    console.log('✅ Data service initialized');
  })
  .catch((error) => {
    console.error('⚠️  Data service initialization failed:', error);
    console.log('📝 Continuing with mock data fallback');
  });

// Make data service available to routes
app.locals.dataService = dataService;
app.locals.dataServiceInitialized = dataServiceInitialized;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000', '*'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    dataService: dataServiceInitialized ? 'initialized' : 'not initialized',
  });
});

// API routes
app.use('/api/v1/payment', paymentRouter);
// Data routes - allow demo mode for frontend (skip auth if x-demo-mode header is set)
app.use('/api/v1/data', (req, res, next) => {
  // Skip auth for demo mode (frontend can set x-demo-mode header)
  if (req.headers['x-demo-mode'] === 'true') {
    return next();
  }
  return authMiddleware(req, res, next);
}, dataRouter);

// x402 Protocol: HTTP 402 Payment Required handler
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/data') && !req.headers['x-payment-signature']) {
    return res.status(402).json({
      error: 'Payment Required',
      message: 'This endpoint requires payment via x402 protocol',
      payment: {
        amount: '0.01',
        currency: 'USDC',
        recipient: process.env.TREASURY_WALLET || '',
        network: 'solana',
      },
    });
  }
  next();
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Pulsar API Server running on port ${PORT}`);
    console.log(`📡 x402 Protocol enabled`);
    console.log(`🔗 Solana RPC: ${process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com'}`);
  });
}

export default app;
