# Frontend Documentation

## Overview

The Risk frontend is a React-based web application that demonstrates the x402 payment protocol and RWA risk data access. It works with both real API data and mock data for customer demonstrations.

## Features

-   **Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
-   **Payment Quotes**: View pricing for different data endpoints
-   **RWA Risk Data**: Display legal compliance, counterparty risk, and oracle integrity metrics
-   **Liquidation Parameters**: View liquidation modeling parameters
-   **Mock API Support**: Automatically falls back to mock data when API server is not running

## Quick Start

### Development

```bash
# From project root
npm run frontend:dev

# Or from frontend directory
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### With API Server

For the best experience, run both the API server and frontend:

```bash
# Terminal 1: API Server
cd api
npm run dev

# Terminal 2: Frontend
npm run frontend:dev
```

### Standalone (Mock Mode)

The frontend works standalone with mock data:

```bash
# Just start the frontend
npm run frontend:dev
```

The frontend will automatically use mock data if the API server is not available.

## Architecture

### Technology Stack

-   **React 18** with TypeScript
-   **Vite** for fast development and builds
-   **Tailwind CSS** for styling
-   **Solana Wallet Adapter** for wallet integration
-   **Axios** for API calls

### Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── WalletButton.tsx      # Wallet connection UI
│   │   ├── PaymentQuote.tsx      # Payment pricing display
│   │   ├── RwaRiskViewer.tsx     # RWA risk metrics viewer
│   │   └── LiquidationParams.tsx # Liquidation parameters viewer
│   ├── contexts/
│   │   └── WalletContext.tsx     # Solana wallet provider
│   ├── lib/
│   │   └── api.ts                 # API client with mock support
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Components

### WalletButton

Connects to Solana wallets (Phantom, Solflare, etc.)

```tsx
<WalletButton />
```

### PaymentQuote

Displays payment pricing for data endpoints

```tsx
<PaymentQuote endpoint="rwa-risk" />
```

### RwaRiskViewer

Displays RWA risk metrics for a token

```tsx
<RwaRiskViewer tokenMint="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" />
```

### LiquidationParams

Displays liquidation modeling parameters

```tsx
<LiquidationParams tokenMint="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" />
```

## API Integration

### Demo Mode

The frontend uses "demo mode" to access the API without full authentication:

-   Sets `x-demo-mode: true` header
-   API server allows access without wallet signature
-   Perfect for customer demonstrations

### Mock Data Fallback

If the API server is unavailable, the frontend automatically uses mock data:

-   No errors shown to users
-   Seamless fallback experience
-   Perfect for offline demos

## Environment Variables

Create a `.env` file in the frontend directory (optional):

```env
VITE_API_URL=http://localhost:3000
```

## Building for Production

```bash
cd frontend
npm run build
```

Output will be in `frontend/dist/`

## Styling

The frontend uses Tailwind CSS with custom Risk colors:

-   `risk-primary`: #14F195 (Solana green)
-   `risk-secondary`: #9945FF (Solana purple)
-   `risk-dark`: #1a1a2e

## Customer Demo Tips

1. **Start API Server**: Run `cd api && npm run dev` for real data
2. **Or Use Mock Mode**: Frontend works standalone with mock data
3. **Connect Wallet**: Show wallet integration (optional for demo)
4. **Enter Token Mint**: Use USDC or any token address
5. **Switch Endpoints**: Show different data types
6. **Explain x402**: Mention pay-per-call model

## Troubleshooting

### Frontend won't start

```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### API not connecting

-   Check if API server is running on port 3000
-   Frontend will automatically use mock data if API is unavailable
-   Check browser console for errors

### Wallet not connecting

-   Ensure wallet extension is installed (Phantom/Solflare)
-   Check browser console for wallet errors
-   Try refreshing the page
