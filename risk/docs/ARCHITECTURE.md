# Risk Architecture

## Overview

Risk is a Solana-based RWA Risk Gateway that implements the x402 protocol for pay-per-call API access. The system consists of four main components:

1. **Solana Program** (`programs/risk`) - On-chain payment processing
2. **API Server** (`api/`) - HTTP 402 endpoint implementation
3. **Client SDK** (`client/`) - Wallet integration and API client
4. **Web Frontend** (`frontend/`) - Interactive web interface for customer demonstrations

## Architecture Diagram

```
┌─────────────────────────────────┐
│      Web Frontend               │
│  (React + Wallet Adapter)      │
│  - Wallet Connection            │
│  - Payment Quotes              │
│  - Data Visualization           │
└──────┬──────────────────────────┘
       │
       │ HTTP Request (Demo Mode or x402)
       ▼
┌─────────────────────────────────┐
│      API Server (x402)          │
│  - Auth Middleware              │
│  - Payment Verification         │
│  - Data Endpoints               │
│  - Demo Mode Support            │
└──────┬──────────────────────────┘
       │
       │ On-chain Payment
       ▼
┌─────────────────────────────────┐
│   Solana Program                │
│   (risk)              │
│  - Process Payment              │
│  - Gateway State                │
└─────────────────────────────────┘
       │
       │ Oracle Data
       ▼
┌─────────────────────────────────┐
│   Switchboard Surge             │
│   (Low-latency Oracle)          │
└─────────────────────────────────┘
```

## Components

### 1. Solana Program

**Location**: `programs/risk/`

**Responsibilities**:

-   Initialize payment gateway
-   Process USDC payments
-   Maintain gateway state (fee, authority)
-   Emit payment events

**Key Instructions**:

-   `initialize` - Set up gateway with fee configuration
-   `process_payment` - Transfer USDC and record payment
-   `update_fee` - Update gateway fee (authority only)

### 2. API Server

**Location**: `api/`

**Responsibilities**:

-   Implement HTTP 402 "Payment Required" status
-   Verify wallet signatures
-   Serve RWA risk data endpoints
-   Integrate with Solana program for payment verification

**Key Endpoints**:

-   `GET /api/v1/payment/quote` - Get payment quote
-   `POST /api/v1/payment/verify` - Verify payment transaction
-   `GET /api/v1/data/rwa-risk/:tokenMint` - Get RWA risk metrics
-   `GET /api/v1/data/liquidation-params/:tokenMint` - Get liquidation parameters

### 3. Client SDK

**Location**: `client/`

**Responsibilities**:

-   Wallet integration
-   Signature generation
-   API client wrapper
-   Payment flow management

### 4. Web Frontend

**Location**: `frontend/`

**Responsibilities**:

-   Interactive user interface for customer demonstrations
-   Solana wallet connection (Phantom, Solflare)
-   Payment quote display
-   RWA risk data visualization
-   Liquidation parameters display
-   Mock data fallback for offline demos

**Key Features**:

-   **Demo Mode**: Works standalone with mock data when API server is unavailable
-   **Wallet Integration**: Seamless connection with Solana wallets
-   **Real-time Updates**: Automatic data refresh when token mint changes
-   **Responsive Design**: Mobile-friendly UI with Tailwind CSS

**Technology Stack**:

-   React 18 with TypeScript
-   Vite for fast development and builds
-   Tailwind CSS for styling
-   Solana Wallet Adapter for wallet integration
-   Axios for API calls

## x402 Protocol Flow

1. Client (SDK or Frontend) requests data endpoint
2. Server responds with HTTP 402 + payment details
3. Client signs message with wallet
4. Client includes signature in request headers
5. Server verifies signature
6. Server processes payment on-chain (if needed)
7. Server returns requested data

**Frontend Demo Mode**: The frontend can operate in demo mode by setting the `x-demo-mode: true` header, which bypasses authentication and uses mock data. This enables customer demonstrations without requiring full wallet integration or on-chain payments.

## Security Considerations

-   **Signature Verification**: All requests require valid wallet signatures
-   **Timestamp Validation**: Prevents replay attacks (5-minute window)
-   **Rate Limiting**: Prevents abuse
-   **CORS**: Configurable allowed origins
-   **Helmet**: Security headers

## Future Enhancements

-   Switchboard Surge oracle integration
-   Outcome-based pricing model
-   Multi-endpoint support
-   Analytics and monitoring
-   KYC/Compliance integration (Solana Attestation Service)
-   Enhanced frontend features:
    -   Payment transaction flow visualization
    -   Historical data charts
    -   Multi-token comparison views
    -   Export functionality for risk reports
