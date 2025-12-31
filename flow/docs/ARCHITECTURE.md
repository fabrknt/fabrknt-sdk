# Flow - Architecture Overview

## System Architecture

### Core Components

1. **Solana Program (Smart Contract)**

    - Manages LP positions and rebalancing logic
    - Handles x402 payment verification
    - Implements policy-controlled wallet constraints
    - Records on-chain audit logs

2. **AI Prediction Service** (Phase 2)

    - Analyzes market sentiment and on-chain data
    - Generates rebalancing signals
    - Provides prediction data via x402 API

3. **x402 API Gateway** (Phase 2)

    - Serves premium data feeds to external AI agents
    - Handles micropayment processing via Facilitator
    - Manages API access control

4. **Client SDK**
    - TypeScript/JavaScript library for interacting with the protocol
    - Helper functions for common operations
    - Integration examples

## Smart Contract Architecture

### Account Structures (To Be Implemented)

```rust
// LP Position Account
pub struct LiquidityPosition {
    pub owner: Pubkey,
    pub token_a: Pubkey,
    pub token_b: Pubkey,
    pub current_range: PriceRange,
    pub last_rebalance: i64,
    pub total_fees_earned: u64,
}

// Rebalancing Decision Account
pub struct RebalanceDecision {
    pub position: Pubkey,
    pub new_range: PriceRange,
    pub ai_model_version: String,
    pub prediction_scores: Vec<f64>,
    pub timestamp: i64,
}
```

### Key Functions (To Be Implemented)

1. `initialize_position` - Create new LP position
2. `rebalance_position` - Execute rebalancing based on AI signals
3. `collect_fees` - Withdraw accumulated fees
4. `verify_x402_payment` - Verify x402 payment for API access
5. `record_audit_log` - Store AI decision metadata on-chain

## Integration Points

### Jupiter Integration

-   Use Jupiter SDK for all swap operations
-   Route through optimal DEX paths
-   Minimize slippage

### x402 Integration

-   Payment verification via Facilitator
-   Micropayment processing
-   API access control

### DEX Integration

-   Raydium CLMM (Concentrated Liquidity Market Maker)
-   Orca Whirlpools
-   Direct integration with liquidity pools

## Data Flow

### Rebalancing Flow

1. AI model analyzes market data
2. Generates rebalancing signal
3. Signal sent to Solana program
4. Program executes swap via Jupiter
5. Updates LP position range
6. Records decision metadata on-chain

### x402 API Flow

1. External AI agent requests data
2. Server responds with 402 Payment Required
3. Agent signs payment payload
4. Facilitator verifies and settles payment
5. Server grants API access
6. Data delivered to agent

## Security Considerations

-   Policy-controlled wallets for transaction limits
-   On-chain audit logs for compliance
-   ZKP integration for privacy (Phase 3)
-   Multi-signature support for high-value operations
