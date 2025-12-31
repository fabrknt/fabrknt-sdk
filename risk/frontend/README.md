# Pulsar Frontend

Web frontend for the Pulsar RWA Risk Gateway, demonstrating the x402 payment protocol.

## Features

-   **Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
-   **Payment Quotes**: View pricing for different data endpoints
-   **RWA Risk Data**: Display legal compliance, counterparty risk, and oracle integrity metrics
-   **Liquidation Parameters**: View liquidation modeling parameters
-   **Mock API Support**: Works with mock data when API server is not running

## Development

### Prerequisites

-   Node.js 20+
-   npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Environment Variables

Create a `.env` file (optional):

```env
VITE_API_URL=http://localhost:3000
```

## Usage

1. **Connect Wallet**: Click the wallet button to connect your Solana wallet
2. **Enter Token Mint**: Input a token mint address (default: USDC)
3. **Select Endpoint**: Choose between RWA Risk Metrics or Liquidation Parameters
4. **View Data**: The frontend will fetch and display the risk data

## Mock Mode

The frontend automatically falls back to mock data if:

-   The API server is not running
-   The API server returns an error
-   Network requests fail

This allows you to demonstrate the frontend even without a running backend.

## Architecture

-   **React 18** with TypeScript
-   **Vite** for fast development and builds
-   **Tailwind CSS** for styling
-   **Solana Wallet Adapter** for wallet integration
-   **Axios** for API calls

## Components

-   `WalletButton`: Wallet connection UI
-   `PaymentQuote`: Display payment pricing
-   `RwaRiskViewer`: Display RWA risk metrics
-   `LiquidationParams`: Display liquidation parameters
