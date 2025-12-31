# Account Structures Design - X-Liquidity Engine

## Overview

This document defines all account structures (PDAs) for the X-Liquidity Engine smart contract. These structures enable:
- Concentrated liquidity position management
- AI-driven rebalancing with audit trails
- x402 payment verification
- Compliance and regulatory transparency

---

## Core Account Structures

### 1. LiquidityPosition

Tracks individual LP positions managed by the protocol.

```rust
#[account]
pub struct LiquidityPosition {
    // Ownership & Identity
    pub owner: Pubkey,                    // LP provider (user)
    pub position_bump: u8,                // PDA bump seed
    
    // Token Pair
    pub token_a: Pubkey,                  // First token mint
    pub token_b: Pubkey,                  // Second token mint
    pub token_a_vault: Pubkey,            // Token A vault (if needed)
    pub token_b_vault: Pubkey,           // Token B vault (if needed)
    
    // DEX Integration
    pub dex: DexType,                     // Raydium, Orca, etc.
    pub pool_address: Pubkey,             // DEX pool address
    pub position_nft: Option<Pubkey>,     // Position NFT (if applicable)
    
    // Price Range (Concentrated Liquidity)
    pub current_tick_lower: i32,          // Lower tick of current range
    pub current_tick_upper: i32,           // Upper tick of current range
    pub current_price_lower: u128,        // Lower price (scaled)
    pub current_price_upper: u128,         // Upper price (scaled)
    
    // Position Metrics
    pub liquidity_amount: u128,            // Current liquidity amount
    pub total_fees_earned_a: u64,         // Total fees earned in token A
    pub total_fees_earned_b: u64,         // Total fees earned in token B
    pub total_value_locked: u64,          // TVL in USD (scaled)
    
    // Rebalancing History
    pub last_rebalance_slot: u64,         // Last rebalance slot
    pub last_rebalance_timestamp: i64,    // Last rebalance Unix timestamp
    pub rebalance_count: u32,             // Total number of rebalances
    
    // Performance Metrics
    pub total_return_percentage: i16,     // Total return % (scaled by 100)
    pub apy_estimate: u16,                // Estimated APY (scaled by 100)
    
    // Status & Configuration
    pub status: PositionStatus,            // Active, Paused, Closed
    pub auto_rebalance_enabled: bool,     // AI auto-rebalancing enabled
    pub min_rebalance_interval: u32,      // Minimum seconds between rebalances
    
    // Policy Controls (Compliance)
    pub max_position_size: u64,           // Maximum position size (USD)
    pub max_single_trade: u64,            // Maximum single trade size (USD)
    pub allowed_dex_programs: Vec<Pubkey>, // Whitelisted DEX programs
    
    // Timestamps
    pub created_at: i64,                   // Position creation timestamp
    pub updated_at: i64,                   // Last update timestamp
}
```

**PDA Seeds:** `["liquidity_position", owner, position_index]`

---

### 2. RebalanceDecision

Stores AI decision metadata for compliance and auditability.

```rust
#[account]
pub struct RebalanceDecision {
    // Position Reference
    pub position: Pubkey,                 // LiquidityPosition account
    pub decision_bump: u8,                // PDA bump seed
    
    // New Price Range
    pub new_tick_lower: i32,              // Proposed lower tick
    pub new_tick_upper: i32,              // Proposed upper tick
    pub new_price_lower: u128,            // Proposed lower price
    pub new_price_upper: u128,            // Proposed upper price
    
    // AI Model Information (Explainability)
    pub ai_model_version: String,        // Model version identifier
    pub ai_model_hash: [u8; 32],         // Model hash for verification
    pub prediction_confidence: u16,       // Confidence score (0-10000, scaled)
    
    // Input Data (For Audit Trail)
    pub market_sentiment_score: i16,      // Sentiment (-10000 to 10000)
    pub volatility_metric: u16,           // Volatility metric (scaled)
    pub whale_activity_score: u16,        // Whale activity indicator
    pub on_chain_indicators: Vec<u64>,    // Additional on-chain metrics
    
    // Decision Rationale
    pub decision_reason: String,          // Human-readable reason
    pub risk_assessment: RiskLevel,        // Risk level assessment
    
    // Execution Details
    pub execution_status: ExecutionStatus, // Pending, Executed, Failed, Rejected
    pub execution_tx_signature: Option<String>, // Transaction signature if executed
    pub execution_slippage: Option<u16>,  // Actual slippage (basis points)
    
    // Compliance & Audit
    pub requires_human_approval: bool,      // Flag for high-risk decisions
    pub human_approver: Option<Pubkey>,    // Approver if human review required
    pub approval_timestamp: Option<i64>,   // Approval timestamp
    
    // Timestamps
    pub created_at: i64,                   // Decision creation timestamp
    pub executed_at: Option<i64>,          // Execution timestamp
}
```

**PDA Seeds:** `["rebalance_decision", position, decision_index]`

---

### 3. X402Payment

Tracks x402 protocol payments for API access.

```rust
#[account]
pub struct X402Payment {
    // Payment Identity
    pub payment_id: [u8; 32],             // Unique payment identifier
    pub payment_bump: u8,                 // PDA bump seed
    
    // Payer Information
    pub payer: Pubkey,                    // AI agent or user making payment
    pub payer_wallet: Pubkey,             // Payer's wallet address
    
    // Payment Details
    pub amount: u64,                      // Payment amount (lamports/USDC)
    pub currency: PaymentCurrency,         // SOL, USDC, etc.
    pub payment_status: PaymentStatus,    // Pending, Verified, Failed
    
    // x402 Protocol Details
    pub facilitator: Pubkey,              // Facilitator service address
    pub facilitator_signature: Option<[u8; 64]>, // Facilitator verification signature
    pub payment_tx_signature: Option<String>, // On-chain payment tx signature
    
    // API Access Details
    pub api_endpoint: String,              // API endpoint accessed
    pub api_version: String,               // API version
    pub access_granted: bool,              // Whether access was granted
    pub access_expires_at: Option<i64>,    // Access expiration timestamp
    
    // Timestamps
    pub requested_at: i64,                 // Payment request timestamp
    pub verified_at: Option<i64>,          // Verification timestamp
    pub settled_at: Option<i64>,           // Settlement timestamp
}
```

**PDA Seeds:** `["x402_payment", payment_id]`

---

### 4. ProtocolConfig

Global protocol configuration and parameters.

```rust
#[account]
pub struct ProtocolConfig {
    // Authority
    pub authority: Pubkey,                 // Protocol authority
    pub config_bump: u8,                  // PDA bump seed
    
    // Fee Structure
    pub performance_fee_bps: u16,         // Performance fee (basis points, e.g., 500 = 5%)
    pub protocol_fee_bps: u16,             // Protocol fee (basis points)
    pub fee_recipient: Pubkey,             // Fee recipient address
    
    // x402 Configuration
    pub x402_facilitator: Option<Pubkey>, // Default x402 Facilitator
    pub x402_min_payment: u64,            // Minimum payment amount
    pub x402_api_base_url: String,        // API base URL
    
    // Rebalancing Parameters
    pub min_rebalance_interval: u32,       // Global minimum rebalance interval (seconds)
    pub max_rebalance_frequency: u32,     // Max rebalances per day
    pub default_slippage_tolerance_bps: u16, // Default slippage (basis points)
    
    // Risk Management
    pub max_position_size: u64,            // Global max position size (USD)
    pub max_single_trade_size: u64,        // Global max trade size (USD)
    pub require_human_approval_threshold: u64, // Threshold for human approval
    
    // AI Model Configuration
    pub default_ai_model_version: String,  // Default AI model version
    pub ai_model_registry: Vec<Pubkey>,    // Approved AI model accounts
    
    // Compliance
    pub audit_log_enabled: bool,           // Enable audit logging
    pub compliance_mode: ComplianceMode,   // Compliance mode (Basic, Enhanced, Full)
    
    // Timestamps
    pub created_at: i64,                   // Config creation timestamp
    pub updated_at: i64,                   // Last update timestamp
}
```

**PDA Seeds:** `["protocol_config"]`

---

### 5. UserStrategy

User-defined strategy parameters and preferences.

```rust
#[account]
pub struct UserStrategy {
    // Ownership
    pub user: Pubkey,                     // Strategy owner
    pub strategy_bump: u8,                 // PDA bump seed
    
    // Strategy Configuration
    pub strategy_name: String,             // User-defined name
    pub strategy_type: StrategyType,       // Conservative, Balanced, Aggressive
    pub risk_tolerance: RiskTolerance,     // Low, Medium, High
    
    // Rebalancing Preferences
    pub auto_rebalance_enabled: bool,      // Enable auto-rebalancing
    pub rebalance_frequency: RebalanceFrequency, // Daily, Weekly, OnSignal
    pub price_range_width: u16,            // Preferred range width (ticks)
    
    // Risk Limits
    pub max_position_size: Option<u64>,     // User-specific max position size
    pub max_single_trade: Option<u64>,     // User-specific max trade size
    pub max_slippage_bps: Option<u16>,     // Max acceptable slippage
    
    // Token Preferences
    pub preferred_tokens: Vec<Pubkey>,     // Preferred token pairs
    pub blacklisted_tokens: Vec<Pubkey>,   // Blacklisted tokens
    
    // AI Model Selection
    pub preferred_ai_model: Option<String>, // Preferred AI model version
    pub require_human_approval: bool,      // Require approval for all trades
    
    // Timestamps
    pub created_at: i64,                   // Strategy creation timestamp
    pub updated_at: i64,                   // Last update timestamp
}
```

**PDA Seeds:** `["user_strategy", user, strategy_index]`

---

### 6. AuditLog

Immutable audit log for compliance and regulatory requirements.

```rust
#[account]
pub struct AuditLog {
    // Log Identity
    pub log_id: [u8; 32],                 // Unique log identifier
    pub log_bump: u8,                      // PDA bump seed
    
    // Event Information
    pub event_type: AuditEventType,        // PositionCreated, Rebalanced, PaymentReceived, etc.
    pub position: Option<Pubkey>,          // Related position (if applicable)
    pub user: Pubkey,                      // User who triggered the event
    
    // Event Data
    pub event_data: Vec<u8>,               // Serialized event data
    pub event_hash: [u8; 32],              // Hash of event data
    
    // AI Decision Context (if applicable)
    pub ai_model_version: Option<String>,   // AI model used
    pub decision_rationale: Option<String>, // Decision explanation
    pub prediction_scores: Option<Vec<u16>>, // Prediction scores
    
    // Compliance Metadata
    pub compliance_flags: Vec<ComplianceFlag>, // Compliance flags raised
    pub regulatory_jurisdiction: Option<String>, // Jurisdiction (e.g., "US", "JP")
    
    // Timestamps
    pub created_at: i64,                   // Log creation timestamp
    pub slot: u64,                         // Solana slot number
}
```

**PDA Seeds:** `["audit_log", log_id]`

---

## Enums and Types

### DexType
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum DexType {
    Raydium,
    Orca,
    Meteora,
    Unknown,
}
```

### PositionStatus
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum PositionStatus {
    Active,
    Paused,
    Closed,
    Liquidated,
}
```

### ExecutionStatus
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum ExecutionStatus {
    Pending,
    Executed,
    Failed,
    Rejected,
    Cancelled,
}
```

### PaymentStatus
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum PaymentStatus {
    Pending,
    Verified,
    Settled,
    Failed,
    Refunded,
}
```

### PaymentCurrency
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum PaymentCurrency {
    SOL,
    USDC,
    USDT,
}
```

### RiskLevel
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}
```

### StrategyType
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum StrategyType {
    Conservative,
    Balanced,
    Aggressive,
    Custom,
}
```

### RebalanceFrequency
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum RebalanceFrequency {
    OnSignal,      // Rebalance when AI signals
    Daily,
    Weekly,
    Monthly,
    Manual,        // Manual only
}
```

### ComplianceMode
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum ComplianceMode {
    Basic,         // Minimal logging
    Enhanced,      // Standard compliance
    Full,          // Full audit trail with ZKP
}
```

### AuditEventType
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum AuditEventType {
    PositionCreated,
    PositionClosed,
    Rebalanced,
    FeesCollected,
    PaymentReceived,
    PolicyViolation,
    HumanApprovalRequired,
    HumanApprovalGranted,
}
```

---

## Account Size Considerations

- **LiquidityPosition**: ~400 bytes (estimated)
- **RebalanceDecision**: ~500 bytes (estimated)
- **X402Payment**: ~300 bytes (estimated)
- **ProtocolConfig**: ~200 bytes (estimated)
- **UserStrategy**: ~300 bytes (estimated)
- **AuditLog**: Variable (consider ZK compression for Phase 3)

---

## Security Considerations

1. **PDA Derivation**: All accounts use PDAs with proper seeds to prevent collisions
2. **Access Control**: Owner/authority checks on all state-modifying instructions
3. **Reentrancy Protection**: Use Anchor's built-in protection mechanisms
4. **Integer Overflow**: Use checked arithmetic (Anchor handles this)
5. **Account Validation**: Validate all account types and ownership in instruction handlers

---

## Next Steps

1. Implement these structures in `lib.rs`
2. Create instruction handlers for each account type
3. Add validation and security checks
4. Write comprehensive tests
5. Consider gas optimization for frequently accessed accounts

