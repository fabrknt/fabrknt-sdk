import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { walletRateLimit } from '../middleware/rateLimit';
import { DataService } from '../services/dataService';

const router = Router();

// Apply wallet rate limiting to all data routes
router.use(walletRateLimit);

/**
 * GET /api/v1/data/rwa-risk/:tokenMint
 * Get RWA risk metrics for a specific token
 */
router.get('/rwa-risk/:tokenMint', async (req: Request, res: Response) => {
  try {
    const { tokenMint } = req.params;
    const authReq = req as AuthenticatedRequest;
    
    // Allow demo mode without authentication (for frontend demo)
    const isDemoMode = !authReq.wallet && req.headers['x-demo-mode'] === 'true';
    const requestedBy = authReq.wallet?.toBase58() || (isDemoMode ? 'demo-mode' : 'unknown');

    // Get data service from app locals (initialized in index.ts)
    const dataService = req.app.locals.dataService as DataService | undefined;
    const dataServiceInitialized = req.app.locals.dataServiceInitialized as boolean;

    // Try to use real data service if available
    if (dataService && dataServiceInitialized) {
      try {
        const riskData = await dataService.getRwaRiskData(tokenMint, requestedBy);
        return res.json(riskData);
      } catch (error) {
        console.error('Error fetching real RWA risk data:', error);
        
        // Check if it's an RPC error (network issue)
        const isRpcError = error instanceof Error && (
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED')
        );

        // Fall through to mock data if fallback is enabled and it's an RPC error
        if (process.env.FALLBACK_TO_MOCK === 'true' && isRpcError) {
          console.warn('RPC error detected, falling back to mock data');
        } else if (process.env.FALLBACK_TO_MOCK !== 'true') {
          // If fallback is disabled, return error
          return res.status(500).json({
            error: 'Failed to fetch RWA risk data',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        // Otherwise fall through to mock data
      }
    }

    // Fallback to mock data (for MVP or when service not initialized)
    const riskData = {
      tokenMint,
      timestamp: new Date().toISOString(),
      metrics: {
        legalCompliance: {
          status: 'compliant',
          jurisdiction: 'US',
          structure: 'tokenized_fund',
          lastVerified: '2024-01-15T00:00:00Z',
        },
        counterpartyRisk: {
          issuerRating: 'A',
          defaultProbability: 0.02,
          solvencyScore: 0.95,
          lastUpdated: '2024-01-15T00:00:00Z',
        },
        oracleIntegrity: {
          consensusNodes: 5,
          dataReliability: 0.99,
          latency: '<10ms',
          lastUpdate: new Date().toISOString(),
        },
      },
      requestedBy,
    };

    res.json(riskData);
  } catch (error) {
    console.error('RWA risk data error:', error);
    res.status(500).json({ error: 'Failed to fetch RWA risk data' });
  }
});

/**
 * GET /api/v1/data/liquidation-params/:tokenMint
 * Get liquidation modeling parameters
 */
router.get('/liquidation-params/:tokenMint', async (req: Request, res: Response) => {
  try {
    const { tokenMint } = req.params;
    const authReq = req as AuthenticatedRequest;
    
    // Allow demo mode without authentication (for frontend demo)
    const isDemoMode = !authReq.wallet && req.headers['x-demo-mode'] === 'true';
    const requestedBy = authReq.wallet?.toBase58() || (isDemoMode ? 'demo-mode' : 'unknown');

    // Get data service from app locals (initialized in index.ts)
    const dataService = req.app.locals.dataService as DataService | undefined;
    const dataServiceInitialized = req.app.locals.dataServiceInitialized as boolean;

    // Try to use real data service if available
    if (dataService && dataServiceInitialized) {
      try {
        const liquidationParams = await dataService.getLiquidationParams(tokenMint, requestedBy);
        return res.json(liquidationParams);
      } catch (error) {
        console.error('Error fetching real liquidation parameters:', error);
        
        // Check if it's an RPC error (network issue)
        const isRpcError = error instanceof Error && (
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED')
        );

        // Fall through to mock data if fallback is enabled and it's an RPC error
        if (process.env.FALLBACK_TO_MOCK === 'true' && isRpcError) {
          console.warn('RPC error detected, falling back to mock data');
        } else if (process.env.FALLBACK_TO_MOCK !== 'true') {
          // If fallback is disabled, return error
          return res.status(500).json({
            error: 'Failed to fetch liquidation parameters',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        // Otherwise fall through to mock data
      }
    }

    // Fallback to mock data (for MVP or when service not initialized)
    const liquidationParams = {
      tokenMint,
      timestamp: new Date().toISOString(),
      parameters: {
        liquidationThreshold: 0.85,
        maxLtv: 0.75,
        liquidationPenalty: 0.05,
        healthFactor: 1.25,
        volatility: 0.12,
        correlation: {
          sol: 0.35,
          usdc: 0.95,
        },
      },
      requestedBy,
    };

    res.json(liquidationParams);
  } catch (error) {
    console.error('Liquidation params error:', error);
    res.status(500).json({ error: 'Failed to fetch liquidation parameters' });
  }
});

export { router as dataRouter };

