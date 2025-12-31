# Risk Demo Guide

This guide helps you demonstrate the Risk RWA Risk Gateway to customers, stakeholders, and investors.

## Quick Start

Run the interactive demo script:

```bash
./scripts/demo.sh
```

Or use the individual commands below.

## Demo Scenarios

### 1. Frontend-Only Demo (Mock Data)

Perfect for offline presentations or when API server is not available.

```bash
# Start frontend
npm run frontend:dev

# Open in browser
open http://localhost:5173
```

**Demo Points:**

-   ✅ Works without API server (uses mock data)
-   ✅ Beautiful, modern UI
-   ✅ Wallet integration ready
-   ✅ Real-time data visualization
-   ✅ Multiple data endpoints

**Talking Points:**

1. "This is our RWA Risk Gateway frontend"
2. "It works standalone with mock data for demos"
3. "Enter any token mint address to see risk metrics"
4. "Switch between RWA Risk and Liquidation Parameters"
5. "The UI is responsive and works on mobile"

### 2. Full Stack Demo (API + Frontend)

Shows the complete system with real API integration.

```bash
# Terminal 1: Start API
cd api && npm run dev

# Terminal 2: Start Frontend
npm run frontend:dev

# Terminal 3: Open browser
open http://localhost:5173
```

**Demo Points:**

-   ✅ Real API integration
-   ✅ x402 payment protocol
-   ✅ Demo mode for presentations
-   ✅ End-to-end data flow

**Talking Points:**

1. "This is our complete stack - API and frontend"
2. "The API implements the x402 payment protocol"
3. "Data endpoints return RWA risk metrics"
4. "We support demo mode for presentations"
5. "In production, this would use real Solana payments"

### 3. API Endpoint Demo

Demonstrate the API directly using curl commands.

```bash
# Start API server
cd api && npm run dev

# Test endpoints
curl http://localhost:3000/health
curl "http://localhost:3000/api/v1/payment/quote?endpoint=rwa-risk"
curl -H "x-demo-mode: true" \
  "http://localhost:3000/api/v1/data/rwa-risk/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
```

**Demo Points:**

-   ✅ RESTful API design
-   ✅ x402 protocol structure
-   ✅ Demo mode support
-   ✅ JSON responses

### 4. Wallet Integration Demo

Show Solana wallet connectivity.

**Prerequisites:**

-   Phantom or Solflare wallet installed
-   Wallet set to Devnet

**Steps:**

1. Open frontend: http://localhost:5173
2. Click "Select Wallet" button
3. Choose your wallet
4. Approve connection
5. Wallet address appears in header

**Demo Points:**

-   ✅ Seamless wallet integration
-   ✅ Multiple wallet support
-   ✅ No API keys needed
-   ✅ Wallet-based authentication

## Demo Script

### Opening Statement

"Today I'm showing you Risk, a Solana-based RWA Risk Gateway that implements the x402 payment protocol. This enables pay-per-call access to institutional-grade RWA risk data without traditional API keys."

### Key Features to Highlight

1. **x402 Protocol**

    - "We use the x402 protocol for micropayments"
    - "Each API call is paid for individually"
    - "No subscriptions or API keys needed"

2. **RWA Risk Data**

    - "We provide three types of risk metrics:"
    - "Legal & Compliance status"
    - "Counterparty risk indicators"
    - "Oracle integrity consensus"

3. **Solana Integration**

    - "Built on Solana for low-cost, fast transactions"
    - "USDC payments for predictable pricing"
    - "Wallet-based authentication"

4. **Developer-Friendly**
    - "Simple REST API"
    - "Demo mode for testing"
    - "Comprehensive documentation"

### Sample Token Addresses

Use these for demos:

-   **USDC**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
-   **SOL**: `So11111111111111111111111111111111111111112`
-   **Custom**: Any valid Solana address

### Common Questions & Answers

**Q: How does payment work?**
A: Users sign a message with their wallet, and the payment is processed on-chain via our Solana program. Each API call costs a small amount in USDC.

**Q: What data do you provide?**
A: We provide RWA risk metrics including legal compliance status, counterparty risk indicators, and oracle integrity data. This is specialized B2B data for institutional investors.

**Q: How is this different from traditional APIs?**
A: Traditional APIs require API keys and subscriptions. We use wallet signatures and pay-per-call micropayments, making it perfect for AI agents and autonomous systems.

**Q: Is this production-ready?**
A: We're in MVP stage with mock data. We're working on integrating real data sources and Switchboard Surge oracle for production.

**Q: Who is your target market?**
A: RWA protocols like Kamino, institutional DeFi like Drift, and AI agent builders who need reliable, on-demand risk data.

## Troubleshooting

### Frontend won't load

```bash
# Check if frontend is running
lsof -ti:5173

# Restart frontend
cd frontend && npm run dev
```

### API server not responding

```bash
# Check if API is running
lsof -ti:3000

# Check API logs
tail -f /tmp/pulsar-api.log

# Restart API
cd api && npm run dev
```

### Wallet won't connect

-   Ensure wallet extension is installed
-   Check browser console for errors
-   Make sure wallet is set to Devnet
-   Try refreshing the page

## Presentation Tips

1. **Start with the Problem**

    - "RWA protocols need reliable risk data"
    - "Traditional APIs don't work for AI agents"
    - "We solve this with x402 and Solana"

2. **Show the Solution**

    - Demo the frontend
    - Show API responses
    - Highlight wallet integration

3. **Explain the Value**

    - Pay-per-call model
    - No API keys
    - Low transaction costs
    - Fast finality

4. **Address Next Steps**
    - Real data integration
    - Production deployment
    - B2B partnerships
    - Grant applications

## Demo Checklist

Before your demo:

-   [ ] Frontend builds and runs
-   [ ] API server starts successfully
-   [ ] Mock data displays correctly
-   [ ] Wallet extension installed
-   [ ] Browser ready (Chrome/Firefox)
-   [ ] Token addresses ready
-   [ ] Talking points prepared
-   [ ] Questions prepared

## Recording a Demo

To record your demo:

1. Use screen recording software (OBS, QuickTime, etc.)
2. Start with the problem statement
3. Show the frontend
4. Demonstrate API endpoints
5. Show wallet integration
6. End with next steps

## Next Steps After Demo

1. **Collect Feedback**

    - What features are most valuable?
    - What's missing?
    - Pricing feedback?

2. **Follow Up**

    - Send demo recording
    - Share documentation
    - Schedule technical deep-dive

3. **Iterate**
    - Update based on feedback
    - Add requested features
    - Improve UI/UX
