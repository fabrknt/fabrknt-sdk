# Real Solana Data Integration Plan

This document outlines the step-by-step plan to integrate real Solana data sources into the Risk RWA Risk Gateway, replacing the current mock data implementation.

## Current State

### What We Have

-   ✅ Solana payment program (on-chain USDC transfers)
-   ✅ Express API server with x402 protocol
-   ✅ Wallet authentication middleware
-   ✅ Mock data endpoints
-   ✅ Frontend with demo mode

### What's Missing

-   ❌ Real RWA risk data from oracles
-   ❌ On-chain token metadata fetching
-   ❌ Integration with Switchboard Surge
-   ❌ Real liquidation parameter calculations
-   ❌ Payment transaction verification in data flow

## Integration Options

### Option 1: Switchboard Surge Oracle (Recommended)

**Best for**: Low-latency, reliable RWA risk data

**Pros**:

-   Purpose-built for high-frequency data feeds
-   Low latency (<10ms)
-   Multiple node consensus
-   On-chain verification

**Cons**:

-   Requires Switchboard account setup
-   May have costs for data feeds
-   Learning curve for integration

### Option 2: Direct Solana RPC Calls

**Best for**: On-chain token metadata and account data

**Pros**:

-   No additional dependencies
-   Direct access to blockchain data
-   Free (using public RPC)
-   Full control

**Cons**:

-   Limited to on-chain data only
-   No off-chain RWA risk metrics
-   Requires custom data aggregation

### Option 3: Hybrid Approach (Recommended)

**Best for**: Complete RWA risk data solution

**Components**:

-   Switchboard Surge for off-chain risk metrics
-   Direct RPC for on-chain token data
-   Custom calculations for liquidation parameters

## Step-by-Step Implementation Plan

### Phase 1: Infrastructure Setup (Week 1)

#### Step 1.1: Install Required Dependencies

```bash
cd api
npm install @switchboard-xyz/solana.js @switchboard-xyz/switchboard-v2
npm install --save-dev @types/node
```

**Files to modify**:

-   `api/package.json`

#### Step 1.2: Create Data Service Layer

Create a new service layer to abstract data fetching:

**New file**: `api/src/services/dataService.ts`

**Purpose**: Centralize all data fetching logic (oracle, RPC, calculations)

#### Step 1.3: Environment Configuration

Add new environment variables:

```env
# Switchboard Configuration
SWITCHBOARD_QUEUE_ID=
SWITCHBOARD_ORACLE_ID=
SWITCHBOARD_RPC_URL=https://api.mainnet-beta.solana.com

# Solana RPC Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_RPC_WSS_URL=wss://api.mainnet-beta.solana.com

# Token Metadata
TOKEN_METADATA_PROGRAM_ID=metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
```

**Files to modify**:

-   `api/.env.example`
-   `api/.env.devnet`

### Phase 2: On-Chain Data Integration (Week 1-2)

#### Step 2.1: Token Metadata Service

**New file**: `api/src/services/tokenMetadata.ts`

**Functionality**:

-   Fetch token mint information from on-chain
-   Get token supply, decimals, mint authority
-   Query token metadata program
-   Cache results for performance

**Implementation**:

```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import { getMint, getAccount } from "@solana/spl-token";

export class TokenMetadataService {
    constructor(private connection: Connection) {}

    async getTokenInfo(mintAddress: string) {
        const mintPubkey = new PublicKey(mintAddress);
        const mintInfo = await getMint(this.connection, mintPubkey);
        // Fetch additional metadata from Metaplex
        // Return structured token information
    }
}
```

#### Step 2.2: Account Data Service

**New file**: `api/src/services/accountData.ts`

**Functionality**:

-   Query RWA token accounts
-   Get token holder information
-   Calculate token distribution metrics
-   Monitor account changes

#### Step 2.3: Update Data Routes

**File to modify**: `api/src/routes/data.ts`

**Changes**:

-   Replace mock data with real service calls
-   Add error handling for RPC failures
-   Implement caching strategy
-   Add rate limiting per wallet

### Phase 3: Switchboard Surge Integration (Week 2-3)

#### Step 3.1: Switchboard Client Setup

**New file**: `api/src/services/switchboardService.ts`

**Functionality**:

-   Connect to Switchboard Surge oracle
-   Subscribe to data feeds
-   Verify oracle signatures
-   Handle feed updates

**Implementation**:

```typescript
import { SwitchboardProgram } from "@switchboard-xyz/solana.js";

export class SwitchboardService {
    private program: SwitchboardProgram;

    async initialize() {
        // Initialize Switchboard program connection
        // Set up queue and oracle subscriptions
    }

    async getRwaRiskData(tokenMint: string) {
        // Query Switchboard feed for RWA risk metrics
        // Verify oracle consensus
        // Return structured risk data
    }
}
```

#### Step 3.2: Oracle Data Mapping

**New file**: `api/src/services/oracleDataMapper.ts`

**Functionality**:

-   Map Switchboard feed data to RWA risk format
-   Transform oracle responses
-   Validate data integrity
-   Handle missing data gracefully

#### Step 3.3: Data Aggregation

**New file**: `api/src/services/dataAggregator.ts`

**Functionality**:

-   Combine on-chain and oracle data
-   Calculate derived metrics
-   Apply business logic
-   Return unified response format

### Phase 4: Liquidation Parameters Calculation (Week 3)

#### Step 4.1: Liquidation Calculator

**New file**: `api/src/services/liquidationCalculator.ts`

**Functionality**:

-   Calculate liquidation threshold from token volatility
-   Compute max LTV based on risk metrics
-   Determine liquidation penalty
-   Calculate health factor

**Data Sources**:

-   Token price from oracle
-   Historical volatility
-   Correlation with SOL/USDC
-   On-chain collateral ratios

#### Step 4.2: Risk Model Integration

**New file**: `api/src/services/riskModel.ts`

**Functionality**:

-   Implement risk scoring algorithms
-   Calculate counterparty risk
-   Assess legal compliance status
-   Generate risk ratings

### Phase 5: Payment Verification Integration (Week 3-4)

#### Step 5.1: Payment State Management

**New file**: `api/src/services/paymentService.ts`

**Functionality**:

-   Verify payment transactions on-chain
-   Check payment events from program
-   Track payment nonces
-   Prevent replay attacks

**Integration with data routes**:

-   Require valid payment before data access
-   Link payment to specific data request
-   Store payment verification in cache

#### Step 5.2: Update Authentication Flow

**File to modify**: `api/src/middleware/auth.ts`

**Changes**:

-   Add payment verification step
-   Check payment nonce uniqueness
-   Verify payment amount matches quote
-   Link wallet to payment transaction

### Phase 6: Frontend Integration (Week 4)

#### Step 6.1: Update Frontend API Client

**File to modify**: `frontend/src/lib/api.ts`

**Changes**:

-   Remove demo mode fallback (or make it optional)
-   Add real payment flow
-   Handle payment transaction signing
-   Update error handling for real API

#### Step 6.2: Payment Flow Implementation

**New file**: `frontend/src/lib/payment.ts`

**Functionality**:

-   Generate payment transaction
-   Sign with wallet
-   Submit to Solana network
-   Verify payment before data request

#### Step 6.3: Update Components

**Files to modify**:

-   `frontend/src/components/PaymentQuote.tsx`
-   `frontend/src/components/RwaRiskViewer.tsx`
-   `frontend/src/components/LiquidationParams.tsx`

**Changes**:

-   Add payment button/flow
-   Show payment status
-   Handle payment errors
-   Display real data from API

### Phase 7: Testing & Optimization (Week 4-5)

#### Step 7.1: Unit Tests

**New files**:

-   `api/tests/services/tokenMetadata.test.ts`
-   `api/tests/services/switchboardService.test.ts`
-   `api/tests/services/liquidationCalculator.test.ts`

#### Step 7.2: Integration Tests

**New files**:

-   `api/tests/integration/dataIntegration.test.ts`
-   `api/tests/integration/paymentFlow.test.ts`

#### Step 7.3: Performance Optimization

**Optimizations**:

-   Implement Redis caching
-   Add request batching
-   Optimize RPC calls
-   Add connection pooling

#### Step 7.4: Error Handling

**Improvements**:

-   Graceful degradation (fallback to cached data)
-   Retry logic for RPC calls
-   Circuit breaker for oracle failures
-   Comprehensive error messages

## Detailed Implementation Steps

### Step 1: Create Data Service Layer

**File**: `api/src/services/dataService.ts`

```typescript
import { Connection } from "@solana/web3.js";
import { TokenMetadataService } from "./tokenMetadata";
import { SwitchboardService } from "./switchboardService";
import { LiquidationCalculator } from "./liquidationCalculator";

export class DataService {
    private tokenMetadata: TokenMetadataService;
    private switchboard: SwitchboardService;
    private liquidationCalc: LiquidationCalculator;

    constructor(connection: Connection) {
        this.tokenMetadata = new TokenMetadataService(connection);
        this.switchboard = new SwitchboardService(connection);
        this.liquidationCalc = new LiquidationCalculator(connection);
    }

    async getRwaRiskData(tokenMint: string) {
        // 1. Get token metadata
        const tokenInfo = await this.tokenMetadata.getTokenInfo(tokenMint);

        // 2. Get oracle data
        const oracleData = await this.switchboard.getRwaRiskData(tokenMint);

        // 3. Combine and return
        return {
            tokenMint,
            timestamp: new Date().toISOString(),
            metrics: {
                legalCompliance:
                    oracleData.legalCompliance ||
                    this.getDefaultLegalCompliance(),
                counterpartyRisk:
                    oracleData.counterpartyRisk ||
                    this.getDefaultCounterpartyRisk(),
                oracleIntegrity:
                    oracleData.oracleIntegrity ||
                    this.getDefaultOracleIntegrity(),
            },
        };
    }

    async getLiquidationParams(tokenMint: string) {
        // 1. Get token data
        const tokenInfo = await this.tokenMetadata.getTokenInfo(tokenMint);

        // 2. Get price and volatility from oracle
        const priceData = await this.switchboard.getPriceData(tokenMint);

        // 3. Calculate liquidation parameters
        return await this.liquidationCalc.calculate(tokenMint, priceData);
    }
}
```

### Step 2: Switchboard Integration

**File**: `api/src/services/switchboardService.ts`

```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import { SwitchboardProgram } from "@switchboard-xyz/solana.js";

export class SwitchboardService {
    private program: SwitchboardProgram;
    private queueId: PublicKey;

    constructor(connection: Connection) {
        this.program = SwitchboardProgram.load(
            connection,
            process.env.SWITCHBOARD_QUEUE_ID!
        );
        this.queueId = new PublicKey(process.env.SWITCHBOARD_QUEUE_ID!);
    }

    async getRwaRiskData(tokenMint: string) {
        // Query Switchboard feed for token
        const feed = await this.program.getFeed({
            name: `rwa-risk-${tokenMint}`,
        });

        if (!feed) {
            throw new Error(`No feed found for token ${tokenMint}`);
        }

        // Get latest result
        const result = await feed.getLatestResult();

        // Parse and return structured data
        return this.parseRiskData(result);
    }

    private parseRiskData(result: any) {
        // Parse Switchboard result into RWA risk format
        return {
            legalCompliance: {
                status: result.legalCompliance?.status || "unknown",
                jurisdiction: result.legalCompliance?.jurisdiction || "unknown",
                structure: result.legalCompliance?.structure || "unknown",
                lastVerified:
                    result.legalCompliance?.lastVerified ||
                    new Date().toISOString(),
            },
            counterpartyRisk: {
                issuerRating: result.counterpartyRisk?.rating || "N/A",
                defaultProbability: result.counterpartyRisk?.defaultProb || 0,
                solvencyScore: result.counterpartyRisk?.solvencyScore || 0,
                lastUpdated:
                    result.counterpartyRisk?.lastUpdated ||
                    new Date().toISOString(),
            },
            oracleIntegrity: {
                consensusNodes: result.oracleIntegrity?.nodes || 0,
                dataReliability: result.oracleIntegrity?.reliability || 0,
                latency: result.oracleIntegrity?.latency || "unknown",
                lastUpdate: result.timestamp || new Date().toISOString(),
            },
        };
    }
}
```

### Step 3: Update Data Routes

**File**: `api/src/routes/data.ts`

```typescript
import { DataService } from "../services/dataService";
import { Connection } from "@solana/web3.js";

const connection = new Connection(
    process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    "confirmed"
);

const dataService = new DataService(connection);

router.get("/rwa-risk/:tokenMint", async (req: Request, res: Response) => {
    try {
        const { tokenMint } = req.params;
        const authReq = req as AuthenticatedRequest;

        // Check for demo mode
        const isDemoMode =
            !authReq.wallet && req.headers["x-demo-mode"] === "true";

        if (isDemoMode) {
            // Return mock data for demo
            return res.json(getMockRwaRiskData(tokenMint));
        }

        // Verify payment (if not demo mode)
        // TODO: Add payment verification

        // Get real data
        const riskData = await dataService.getRwaRiskData(tokenMint);
        riskData.requestedBy = authReq.wallet?.toBase58() || "unknown";

        res.json(riskData);
    } catch (error) {
        console.error("RWA risk data error:", error);

        // Fallback to cached or mock data on error
        if (process.env.FALLBACK_TO_MOCK === "true") {
            return res.json(getMockRwaRiskData(req.params.tokenMint));
        }

        res.status(500).json({ error: "Failed to fetch RWA risk data" });
    }
});
```

## Dependencies to Add

### Required Packages

```json
{
    "dependencies": {
        "@switchboard-xyz/solana.js": "^0.1.0",
        "@switchboard-xyz/switchboard-v2": "^0.1.0",
        "redis": "^4.6.0",
        "node-cache": "^5.1.2"
    },
    "devDependencies": {
        "@types/redis": "^4.0.11"
    }
}
```

## Environment Variables

Add to `api/.env.example`:

```env
# Switchboard Configuration
SWITCHBOARD_QUEUE_ID=
SWITCHBOARD_ORACLE_ID=
SWITCHBOARD_RPC_URL=https://api.mainnet-beta.solana.com

# Solana RPC
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_RPC_WSS_URL=wss://api.mainnet-beta.solana.com

# Caching
REDIS_URL=redis://localhost:6379
CACHE_TTL=300

# Fallback
FALLBACK_TO_MOCK=false
```

## Testing Strategy

### Unit Tests

-   Test each service independently
-   Mock external dependencies (RPC, Switchboard)
-   Test error handling and edge cases

### Integration Tests

-   Test full data flow
-   Test with real RPC (devnet)
-   Test payment verification flow

### Performance Tests

-   Measure API response times
-   Test caching effectiveness
-   Load testing with multiple requests

## Migration Path

### Phase 1: Parallel Running

-   Keep mock data as fallback
-   Add real data alongside mock
-   Feature flag to switch between

### Phase 2: Gradual Rollout

-   Enable real data for specific tokens
-   Monitor error rates
-   Gradually expand coverage

### Phase 3: Full Migration

-   Remove mock data fallback
-   Enable real data for all tokens
-   Remove demo mode (or keep for testing)

## Success Criteria

-   [ ] Real data returned for all token mints
-   [ ] API response time < 500ms
-   [ ] 99% uptime for data endpoints
-   [ ] Payment verification working
-   [ ] Frontend displays real data
-   [ ] Error handling graceful
-   [ ] Tests passing (>80% coverage)

## Timeline Estimate

-   **Week 1**: Infrastructure setup, token metadata service
-   **Week 2**: Switchboard integration, oracle data mapping
-   **Week 3**: Liquidation calculator, payment verification
-   **Week 4**: Frontend integration, testing
-   **Week 5**: Optimization, bug fixes, documentation

**Total**: ~5 weeks for full integration

## Next Steps

1. Review and approve this plan
2. Set up Switchboard account and feeds
3. Create feature branch: `feature/real-data-integration`
4. Start with Phase 1 (infrastructure setup)
5. Implement incrementally with tests
6. Deploy to devnet for testing
7. Gradual rollout to production

## Resources

-   [Switchboard Documentation](https://docs.switchboard.xyz/)
-   [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
-   [Metaplex Token Metadata](https://docs.metaplex.com/programs/token-metadata/)
-   [Anchor Framework](https://www.anchor-lang.com/docs)
