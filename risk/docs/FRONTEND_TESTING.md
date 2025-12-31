# Frontend Testing Guide - Real Solana Data

This guide explains how to test the web frontend with real Solana data from the API server.

## Prerequisites

### 1. Install Dependencies

```bash
# Install all dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Start Required Services

You need both the API server and the frontend running:

**Terminal 1: API Server**
```bash
# Start API server with real Solana data
cd api
npm run dev
```

The API server should be running on `http://localhost:3000`

**Terminal 2: Frontend**
```bash
# Start frontend development server
cd frontend
npm run dev
```

The frontend should be running on `http://localhost:5173`

### 3. Configure Environment

#### API Server Configuration

Create or update `api/.env`:

```env
# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
# Or for local testing:
# SOLANA_RPC_URL=http://localhost:8899

PAYMENT_PROGRAM_ID=84zwY58ivSmpGY8gsenAc2c4XpwBUyh1thF9XXx3LhfD
TREASURY_WALLET=<your-treasury-wallet>

# API Configuration
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Optional: Enable fallback to mock data on RPC errors
FALLBACK_TO_MOCK=true
```

#### Frontend Configuration

Create `frontend/.env` (optional):

```env
# API URL (defaults to http://localhost:3000)
VITE_API_URL=http://localhost:3000

# Solana Network (defaults to devnet)
VITE_SOLANA_NETWORK=devnet

# Custom RPC URL (optional)
# VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

# Payment Program ID (optional)
# VITE_PAYMENT_PROGRAM_ID=84zwY58ivSmpGY8gsenAc2c4XpwBUyh1thF9XXx3LhfD
```

## Testing Scenarios

### Scenario 1: Demo Mode (No Payment Required)

This is the easiest way to test the frontend with real data without making payments.

**Steps:**
1. Open `http://localhost:5173` in your browser
2. Enter a token mint address (e.g., `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` for USDC)
3. Select an endpoint (RWA Risk Metrics or Liquidation Parameters)
4. The frontend will automatically use demo mode and fetch real data from the API

**What happens:**
- Frontend sends `x-demo-mode: true` header
- API returns real Solana data (on-chain token metadata, distribution, etc.)
- No payment required
- No wallet connection required

**Expected Results:**
- Real token name and symbol from Metaplex
- Real token supply and decimals
- Token distribution data (if available)
- Risk metrics (from oracle or calculated)
- Liquidation parameters (calculated from real data)

### Scenario 2: Real Payment Flow (On-Chain Payment)

Test the complete payment flow with real Solana transactions.

**Prerequisites:**
- Solana wallet installed (Phantom or Solflare)
- Wallet connected to Devnet
- USDC tokens in wallet (on Devnet)

**Steps:**

1. **Start Services:**
   ```bash
   # Terminal 1: API Server
   cd api && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

2. **Open Frontend:**
   - Navigate to `http://localhost:5173`

3. **Connect Wallet:**
   - Click "Select Wallet" button
   - Choose Phantom or Solflare
   - Approve connection
   - Ensure wallet is on Devnet

4. **Get Payment Quote:**
   - Enter token mint address
   - Select endpoint (RWA Risk or Liquidation Params)
   - Payment quote will appear showing price

5. **Make Payment:**
   - Click "Pay [amount] USDC" button
   - Approve transaction in wallet
   - Wait for confirmation

6. **View Data:**
   - After payment verification, data will automatically load
   - Real Solana data will be displayed

**What happens:**
- Frontend creates payment transaction
- Transaction is signed and submitted to Solana
- API verifies payment on-chain
- Payment state is stored
- Data request includes payment headers
- API returns real Solana data

### Scenario 3: Wallet Signature Authentication (Legacy)

Test with wallet signature authentication (no on-chain payment).

**Steps:**
1. Connect wallet
2. The frontend can use wallet signature auth (if implemented)
3. API accepts `x-wallet-signature` header

**Note:** Currently, the frontend primarily uses demo mode or on-chain payments.

## Testing with Different Networks

### Local Network (Test Validator)

For testing with a local Solana test validator:

**1. Start Local Validator:**
```bash
./scripts/start-validator.sh
```

**2. Deploy Program:**
```bash
npm run deploy:local
```

**3. Update API Configuration:**
```env
SOLANA_RPC_URL=http://localhost:8899
```

**4. Update Frontend Configuration:**
```env
VITE_SOLANA_RPC_URL=http://localhost:8899
VITE_SOLANA_NETWORK=devnet
```

**5. Start Services:**
```bash
# Terminal 1: API
cd api && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

### Devnet

For testing on Solana Devnet:

**1. Configure for Devnet:**
```env
# API .env
SOLANA_RPC_URL=https://api.devnet.solana.com

# Frontend .env
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

**2. Deploy Program to Devnet:**
```bash
npm run deploy:devnet
```

**3. Get Devnet USDC:**
- Use Devnet faucet or swap SOL for Devnet USDC
- Ensure wallet has USDC for payments

## Test Token Mint Addresses

### Devnet Test Tokens

```bash
# USDC (Devnet)
EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# USDT (Devnet)
Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB

# SOL (Wrapped)
So11111111111111111111111111111111111111112
```

### Mainnet Tokens (for reference)

```bash
# USDC (Mainnet)
EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

# USDT (Mainnet)
Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
```

## Verifying Real Data

### Check Browser Console

Open browser DevTools (F12) and check the Console tab:

**Real Data Indicators:**
- No "API not available, using mock data" warnings
- API requests show real token metadata
- Response includes real on-chain data

**Example Console Output:**
```
✅ API request successful
✅ Token metadata fetched from Metaplex
✅ Account distribution calculated
✅ Risk metrics aggregated
```

### Check Network Tab

In browser DevTools → Network tab:

1. **Filter by "api"**
2. **Check Request Headers:**
   - Demo mode: `x-demo-mode: true`
   - Payment: `x-payment-signature: ...`
3. **Check Response:**
   - Real token name/symbol
   - Real supply and decimals
   - Calculated risk metrics
   - Liquidation parameters

### Check API Server Logs

In the API server terminal, you should see:

```
✅ Token metadata fetched: USDC
✅ Account distribution: 1234 holders
✅ Oracle data: mock (or real if configured)
✅ Risk metrics calculated
✅ Liquidation parameters calculated
```

## Testing Payment Flow

### Step-by-Step Payment Test

1. **Connect Wallet:**
   ```
   ✅ Wallet connected: 7xKXtg2C...
   ```

2. **Request Quote:**
   ```
   GET /api/v1/payment/quote?endpoint=rwa-risk
   Response: { price: { amount: "0.05", currency: "USDC" } }
   ```

3. **Create Payment:**
   ```
   ✅ Creating payment transaction...
   ✅ Transaction signed
   ✅ Transaction submitted: 5j7s8K3h...
   ```

4. **Verify Payment:**
   ```
   POST /api/v1/payment/verify
   Response: { verified: true, user: "7xKXtg2C..." }
   ```

5. **Request Data:**
   ```
   GET /api/v1/data/rwa-risk/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
   Headers: x-payment-signature: 5j7s8K3h...
   Response: { tokenMint: "...", metrics: {...} }
   ```

## Troubleshooting

### InvalidAccountData / No signers Error

**Problem:** 
- `Transaction failed simulation. InvalidAccountData` in wallet
- `No signers` error on frontend

**Solution:** This is fixed by:
1. **Checking and creating token accounts:** The payment service now checks if the user's and treasury's token accounts exist, and creates them if they don't.
2. **Proper transaction signing:** The transaction is properly prepared with all required fields before signing.

**What was fixed:**
- Token account existence check before transfer
- Automatic creation of associated token accounts (ATA) if missing
- Proper transaction fee payer setup
- Signature verification before sending

**If you still see this error:**
1. **Ensure wallet has SOL for fees:**
   - Creating token accounts requires SOL for transaction fees
   - Transferring tokens also requires SOL for fees

2. **Check wallet is on correct network:**
   - Devnet for devnet testing
   - Mainnet for production

3. **Restart the dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Restart
   npm run dev
   ```

### Transaction recentBlockhash required Error

**Problem:** `Transaction recentBlockhash required` when clicking Pay button

**Solution:** This is fixed by fetching the latest blockhash before creating the transaction. If you still see this error:

1. **Ensure the payment service fetches blockhash:**
   - The `createPaymentTransaction` method should call `connection.getLatestBlockhash()`
   - The transaction should have `recentBlockhash` and `feePayer` set

2. **Check the transaction is properly configured:**
   ```typescript
   const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
   transaction.recentBlockhash = blockhash;
   transaction.feePayer = wallet;
   ```

3. **Restart the dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Restart
   npm run dev
   ```

### Buffer is not defined Error

**Problem:** `Uncaught ReferenceError: Buffer is not defined`

**Solution:** This is fixed by the `vite-plugin-node-polyfills` plugin. If you still see this error:

1. **Ensure the plugin is installed:**
   ```bash
   cd frontend
   npm install --save-dev vite-plugin-node-polyfills
   ```

2. **Check `vite.config.ts` includes the plugin:**
   ```typescript
   import { nodePolyfills } from "vite-plugin-node-polyfills";
   
   export default defineConfig({
     plugins: [
       react(),
       nodePolyfills({
         globals: {
           Buffer: true,
           global: true,
           process: true,
         },
       }),
     ],
   });
   ```

3. **Restart the dev server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Restart
   npm run dev
   ```

### Frontend Shows Mock Data

**Problem:** Frontend is using mock data instead of real data.

**Solutions:**
1. **Check API server is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check API server logs:**
   - Look for errors in API terminal
   - Check if DataService is initialized

3. **Check browser console:**
   - Look for API errors
   - Check network requests

4. **Verify environment variables:**
   ```bash
   cd api && cat .env
   ```

### Payment Fails

**Problem:** Payment transaction fails.

**Solutions:**
1. **Check wallet has USDC:**
   - Verify balance in wallet
   - Get Devnet USDC if needed

2. **Check network:**
   - Ensure wallet is on Devnet (for devnet testing)
   - Or localnet (for local testing)

3. **Check transaction in Solana Explorer:**
   - Copy transaction signature
   - View in Solana Explorer

4. **Check API logs:**
   - Look for payment verification errors

### Data Not Loading

**Problem:** Data doesn't load after payment.

**Solutions:**
1. **Check payment verification:**
   - Verify payment was confirmed on-chain
   - Check API logs for verification status

2. **Check payment state:**
   - Open browser console
   - Check if payment state is stored

3. **Refresh page:**
   - Payment state is in-memory
   - May need to make payment again after refresh

4. **Check API response:**
   - Look for 402 Payment Required errors
   - Check if payment headers are included

### RPC Errors

**Problem:** API shows RPC errors.

**Solutions:**
1. **Check RPC URL:**
   ```env
   SOLANA_RPC_URL=https://api.devnet.solana.com
   ```

2. **Use fallback:**
   ```env
   FALLBACK_TO_MOCK=true
   ```

3. **Check RPC rate limits:**
   - Use a dedicated RPC endpoint if needed
   - Consider using Helius, QuickNode, or Alchemy

## Testing Checklist

### Basic Functionality
- [ ] Frontend loads at `http://localhost:5173`
- [ ] Wallet connection works
- [ ] Payment quote displays correctly
- [ ] Demo mode works (no wallet needed)
- [ ] Data displays in demo mode

### Real Data Integration
- [ ] Token metadata fetched from Metaplex
- [ ] Token supply and decimals correct
- [ ] Account distribution calculated
- [ ] Risk metrics displayed
- [ ] Liquidation parameters displayed

### Payment Flow
- [ ] Payment transaction created
- [ ] Transaction signed in wallet
- [ ] Transaction submitted to Solana
- [ ] Payment verified on-chain
- [ ] Data loads after payment

### Error Handling
- [ ] Payment errors displayed
- [ ] Network errors handled
- [ ] RPC errors handled gracefully
- [ ] Fallback to mock data works

## Quick Test Commands

```bash
# Start everything for testing
# Terminal 1: API Server
cd api && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Check API health
curl http://localhost:3000/health

# Terminal 3: Test API endpoint
curl -H "x-demo-mode: true" \
  http://localhost:3000/api/v1/data/rwa-risk/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

## Expected Behavior

### With Real Data (API Running)

1. **Token Info:**
   - Real name: "USD Coin" (for USDC)
   - Real symbol: "USDC"
   - Real supply: Actual on-chain supply
   - Real decimals: 6 (for USDC)

2. **Risk Metrics:**
   - Legal compliance: From oracle or inferred
   - Counterparty risk: Calculated from data
   - Oracle integrity: From oracle or mock

3. **Liquidation Parameters:**
   - Calculated from real volatility
   - Based on real token distribution
   - Adjusted for risk metrics

### With Mock Data (API Not Running)

1. **Fallback:**
   - Frontend shows mock data
   - Console shows "API not available" warning
   - Data still displays for demo purposes

## Next Steps

After testing the frontend:

1. **Deploy to Production:**
   - Build frontend: `cd frontend && npm run build`
   - Deploy to hosting (Vercel, Netlify, etc.)

2. **Configure Production API:**
   - Update API URL in production
   - Configure CORS for production domain
   - Set up production RPC endpoint

3. **Test Payment Flow:**
   - Test with real USDC on mainnet (small amounts)
   - Verify payment verification works
   - Test error handling

## Testing with Real Solana Data - Step by Step

### Complete Setup for Real Data Testing

**1. Start Solana Validator (for local testing):**
```bash
# Start local validator
./scripts/start-validator.sh

# Or use devnet (skip this step)
```

**2. Start API Server:**
```bash
cd api
npm run dev
```

**3. Start Frontend:**
```bash
cd frontend
npm run dev
```

**4. Open Browser:**
- Navigate to `http://localhost:5173`
- Open browser DevTools (F12) → Console tab

**5. Test with Real Data:**

**Option A: Demo Mode (Easiest)**
- Enter token mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` (USDC)
- Select endpoint: "RWA Risk Metrics"
- Data should load automatically (uses demo mode)
- Check console for "API request successful"

**Option B: Real Payment Flow**
- Connect wallet (Phantom/Solflare)
- Ensure wallet is on Devnet
- Enter token mint address
- Click "Pay" button
- Approve transaction
- Data loads after payment verification

### Verifying Real Data

**Check API Server Terminal:**
```
✅ Token metadata fetched: USDC
✅ Account distribution: 1234 holders
✅ Risk metrics calculated
```

**Check Browser Console:**
- No "using mock data" warnings
- API requests show 200 status
- Response includes real token data

**Check Network Tab:**
- Request to `/api/v1/data/rwa-risk/...`
- Response includes real `name`, `symbol`, `supply`
- Metrics show calculated values

## Additional Resources

- [Frontend README](frontend/README.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Quick Start Guide](docs/QUICKSTART.md)

