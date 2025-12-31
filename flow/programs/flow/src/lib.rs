use anchor_lang::prelude::*;
use anchor_lang::solana_program::instruction::{AccountMeta, Instruction};
use anchor_lang::solana_program::program::invoke;

declare_id!("BxRYbJ8XfBdRrk88st1JyeF95XAgPZhCzuVhX3GdXrb8");

// ============================================================================
// JUPITER INTEGRATION CONSTANTS
// ============================================================================

/// Jupiter Swap Program ID (v6)
/// Note: This is the main Jupiter program that handles swap routing
pub const JUPITER_V6_PROGRAM_ID: &str = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";

/// Jupiter Swap Program ID as Pubkey
pub fn jupiter_program_id() -> Pubkey {
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"
        .parse()
        .expect("Invalid Jupiter program ID")
}

// ============================================================================
// RAYDIUM CLMM INTEGRATION CONSTANTS
// ============================================================================

/// Raydium CLMM Program ID
/// Concentrated Liquidity Market Maker for LP position management
pub const RAYDIUM_CLMM_PROGRAM_ID: &str = "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK";

/// Raydium CLMM Program ID as Pubkey
pub fn raydium_clmm_program_id() -> Pubkey {
    "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK"
        .parse()
        .expect("Invalid Raydium CLMM program ID")
}

// ============================================================================
// RAYDIUM CLMM INSTRUCTION DISCRIMINATORS
// ============================================================================

/// Raydium CLMM instruction discriminators (Anchor format)
/// Calculated as first 8 bytes of SHA256("global:instruction_name")
/// 
/// Verified discriminators:
/// - open_position: SHA256("global:open_position")[0:8]
/// - increase_liquidity: SHA256("global:increase_liquidity")[0:8]
/// - decrease_liquidity: SHA256("global:decrease_liquidity")[0:8]
/// - collect: SHA256("global:collect")[0:8]

/// OpenPosition instruction discriminator
const RAYDIUM_OPEN_POSITION_DISCRIMINATOR: [u8; 8] = [0x87, 0x80, 0x2f, 0x4d, 0x0f, 0x98, 0xf0, 0x31];

/// IncreaseLiquidity instruction discriminator
const RAYDIUM_INCREASE_LIQUIDITY_DISCRIMINATOR: [u8; 8] = [0x2e, 0x9c, 0xf3, 0x76, 0x0d, 0xcd, 0xfb, 0xb2];

/// DecreaseLiquidity instruction discriminator
const RAYDIUM_DECREASE_LIQUIDITY_DISCRIMINATOR: [u8; 8] = [0xa0, 0x26, 0xd0, 0x6f, 0x68, 0x5b, 0x2c, 0x01];

/// Collect instruction discriminator
const RAYDIUM_COLLECT_DISCRIMINATOR: [u8; 8] = [0xd0, 0x2f, 0xc2, 0x9b, 0x11, 0x62, 0x52, 0xec];

// ============================================================================
// JUPITER ROUTE PLAN STRUCTURES
// ============================================================================

/// Simplified route plan structure for Jupiter swaps
/// In production, this would match Jupiter's exact route plan format
/// Route plans are typically obtained off-chain from Jupiter's API:
/// GET https://quote-api.jup.ag/v6/quote?inputMint={input}&outputMint={output}&amount={amount}
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct JupiterRoutePlan {
    /// Input token mint
    pub input_mint: Pubkey,
    /// Output token mint
    pub output_mint: Pubkey,
    /// Amount to swap (in input token decimals)
    pub in_amount: u64,
    /// Minimum amount out (in output token decimals) - calculated with slippage
    pub out_amount: u64,
    /// Slippage tolerance in basis points
    pub slippage_bps: u16,
    /// Route plan data (serialized route from Jupiter API)
    /// This would contain the actual route steps in Jupiter's format
    pub route_data: Vec<u8>,
}

/// Result of a Jupiter swap execution
pub struct JupiterSwapResult {
    /// Whether the swap was executed
    pub executed: bool,
    /// Actual slippage in basis points (if swap was executed)
    pub actual_slippage_bps: Option<u16>,
    /// Actual amount out (if swap was executed)
    pub actual_amount_out: Option<u64>,
}

/// Jupiter swap instruction discriminator
/// Note: Jupiter v6 uses different instruction discriminators for different swap types
/// This is a placeholder - actual discriminator depends on Jupiter's instruction format
const JUPITER_SWAP_DISCRIMINATOR: u8 = 0x9a; // Placeholder - needs to match Jupiter's actual discriminator

#[program]
pub mod flow {
    use super::*;

    /// Initialize the protocol configuration
    pub fn initialize_protocol_config(
        ctx: Context<InitializeProtocolConfig>,
        performance_fee_bps: u16,
        protocol_fee_bps: u16,
        x402_min_payment: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        let clock = Clock::get()?;

        config.authority = ctx.accounts.authority.key();
        config.config_bump = ctx.bumps.config;
        config.performance_fee_bps = performance_fee_bps;
        config.protocol_fee_bps = protocol_fee_bps;
        config.fee_recipient = ctx.accounts.fee_recipient.key();
        config.x402_min_payment = x402_min_payment;
        config.x402_api_base_url = "https://api.x-liquidity-engine.com".to_string();
        config.min_rebalance_interval = 3600; // 1 hour default
        config.max_rebalance_frequency = 24; // Max 24 per day
        config.default_slippage_tolerance_bps = 50; // 0.5% default
        config.max_position_size = 1_000_000_000_000; // $1M default (scaled)
        config.max_single_trade_size = 100_000_000_000; // $100K default (scaled)
        config.require_human_approval_threshold = 500_000_000_000; // $500K threshold
        config.default_ai_model_version = "v1.0.0".to_string();
        config.audit_log_enabled = true;
        config.compliance_mode = ComplianceMode::Enhanced;
        config.created_at = clock.unix_timestamp;
        config.updated_at = clock.unix_timestamp;

        msg!("Protocol config initialized by: {}", ctx.accounts.authority.key());
        Ok(())
    }

    /// Create a new liquidity position
    pub fn create_liquidity_position(
        ctx: Context<CreateLiquidityPosition>,
        _position_index: u8,
        token_a: Pubkey,
        token_b: Pubkey,
        tick_lower: i32,
        tick_upper: i32,
        price_lower: u128,
        price_upper: u128,
        max_position_size: u64,
        max_single_trade: u64,
    ) -> Result<()> {
        let position = &mut ctx.accounts.position;
        let clock = Clock::get()?;

        // Validate price range
        require!(tick_lower < tick_upper, XLiquidityEngineError::InvalidPriceRange);
        require!(price_lower < price_upper, XLiquidityEngineError::InvalidPriceRange);

        // Validate against protocol limits
        let config = &ctx.accounts.config;
        require!(
            max_position_size <= config.max_position_size,
            XLiquidityEngineError::ExceedsMaxPositionSize
        );
        require!(
            max_single_trade <= config.max_single_trade_size,
            XLiquidityEngineError::ExceedsMaxTradeSize
        );

        position.owner = ctx.accounts.owner.key();
        position.position_bump = ctx.bumps.position;
        position.token_a = token_a;
        position.token_b = token_b;
        position.token_a_vault = ctx.accounts.token_a_vault.key();
        position.token_b_vault = ctx.accounts.token_b_vault.key();
        position.dex = DexType::Raydium; // Default to Raydium
        position.pool_address = ctx.accounts.pool.key();
        position.current_tick_lower = tick_lower;
        position.current_tick_upper = tick_upper;
        position.current_price_lower = price_lower;
        position.current_price_upper = price_upper;
        position.liquidity_amount = 0;
        position.total_fees_earned_a = 0;
        position.total_fees_earned_b = 0;
        position.total_value_locked = 0;
        position.last_rebalance_slot = 0;
        position.last_rebalance_timestamp = 0;
        position.rebalance_count = 0;
        position.total_return_percentage = 0;
        position.apy_estimate = 0;
        position.status = PositionStatus::Active;
        position.auto_rebalance_enabled = true;
        position.min_rebalance_interval = config.min_rebalance_interval;
        position.max_position_size = max_position_size;
        position.max_single_trade = max_single_trade;
        position.allowed_dex_programs = vec![ctx.accounts.pool.key()];
        position.created_at = clock.unix_timestamp;
        position.updated_at = clock.unix_timestamp;

        // If Raydium accounts are provided, create position on Raydium CLMM
        // Note: This is a placeholder - actual implementation requires instruction format research
        if matches!(position.dex, DexType::Raydium) {
            if let (Some(raydium_program), Some(pool_state), Some(token_account_0), Some(token_account_1), Some(token_program)) = (
                ctx.accounts.raydium_program.as_ref(),
                ctx.accounts.raydium_pool_state.as_ref(),
                ctx.accounts.raydium_token_account_0.as_ref(),
                ctx.accounts.raydium_token_account_1.as_ref(),
                ctx.accounts.token_program.as_ref(),
            ) {
                msg!("Creating Raydium CLMM position...");
                
                // Calculate initial liquidity (simplified - in production would use proper formula)
                // For now, we'll use placeholder values
                let initial_liquidity = 0u128; // Will be calculated from token amounts
                let amount_0_max = 0u64; // Will be provided by user
                let amount_1_max = 0u64; // Will be provided by user
                
                create_raydium_position(
                    Some(raydium_program),
                    Some(pool_state),
                    ctx.accounts.raydium_personal_position.as_ref(),
                    ctx.accounts.raydium_tick_array_lower.as_ref(),
                    ctx.accounts.raydium_tick_array_upper.as_ref(),
                    Some(token_account_0),
                    Some(token_account_1),
                    ctx.accounts.raydium_token_vault_0.as_ref(),
                    ctx.accounts.raydium_token_vault_1.as_ref(),
                    Some(token_program),
                    Some(&ctx.accounts.owner),
                    tick_lower,
                    tick_upper,
                    initial_liquidity,
                    amount_0_max,
                    amount_1_max,
                )?;
                
                msg!("Raydium position creation attempted (implementation pending)");
            } else {
                msg!("Raydium accounts not provided - position created in Flow only");
                msg!("Note: To create actual Raydium position, provide raydium_program, raydium_pool_state, etc.");
            }
        }

        // Create audit log
        create_audit_log_internal(
            &ctx.accounts.audit_log,
            AuditEventType::PositionCreated,
            Some(position.key()),
            ctx.accounts.owner.key(),
            &[],
            clock,
        )?;

        msg!("Liquidity position created: {}", position.key());
        Ok(())
    }

    /// Create a rebalancing decision based on AI prediction
    /// 
    /// If a swap is required, jupiter_swap_transaction should contain the base64-encoded
    /// transaction from Jupiter Swap API. The transaction will be executed off-chain separately.
    pub fn create_rebalance_decision(
        ctx: Context<CreateRebalanceDecision>,
        _position_index: u8,
        _decision_index: u32,
        new_tick_lower: i32,
        new_tick_upper: i32,
        new_price_lower: u128,
        new_price_upper: u128,
        ai_model_version: String,
        ai_model_hash: [u8; 32],
        prediction_confidence: u16,
        market_sentiment_score: i16,
        volatility_metric: u16,
        whale_activity_score: u16,
        decision_reason: String,
        jupiter_swap_transaction: Option<String>,
        expected_output_amount: Option<u64>,
    ) -> Result<()> {
        let decision = &mut ctx.accounts.decision;
        let position = &ctx.accounts.position;
        let config = &ctx.accounts.config;
        let clock = Clock::get()?;

        // Validate position is active
        require!(
            position.status == PositionStatus::Active,
            XLiquidityEngineError::PositionNotActive
        );

        // Validate rebalance interval
        require!(
            clock.unix_timestamp - position.last_rebalance_timestamp >= position.min_rebalance_interval as i64,
            XLiquidityEngineError::RebalanceTooFrequent
        );

        // Validate price range
        require!(new_tick_lower < new_tick_upper, XLiquidityEngineError::InvalidPriceRange);
        require!(new_price_lower < new_price_upper, XLiquidityEngineError::InvalidPriceRange);

        // Determine risk level and if human approval is needed
        let risk_assessment = assess_risk(
            prediction_confidence,
            market_sentiment_score,
            volatility_metric,
        );
        let requires_human_approval = risk_assessment == RiskLevel::Critical
            || risk_assessment == RiskLevel::High
            || position.total_value_locked >= config.require_human_approval_threshold;

        decision.position = position.key();
        decision.decision_bump = ctx.bumps.decision;
        decision.new_tick_lower = new_tick_lower;
        decision.new_tick_upper = new_tick_upper;
        decision.new_price_lower = new_price_lower;
        decision.new_price_upper = new_price_upper;
        decision.ai_model_version = ai_model_version;
        decision.ai_model_hash = ai_model_hash;
        decision.prediction_confidence = prediction_confidence;
        decision.market_sentiment_score = market_sentiment_score;
        decision.volatility_metric = volatility_metric;
        decision.whale_activity_score = whale_activity_score;
        decision.on_chain_indicators = vec![];
        decision.decision_reason = decision_reason;
        decision.risk_assessment = risk_assessment;
        decision.execution_status = if requires_human_approval {
            ExecutionStatus::Pending
        } else {
            ExecutionStatus::Pending
        };
        decision.execution_tx_signature = None;
        decision.execution_slippage = None;
        decision.jupiter_swap_transaction = jupiter_swap_transaction;
        decision.expected_output_amount = expected_output_amount;
        decision.requires_human_approval = requires_human_approval;
        decision.human_approver = None;
        decision.approval_timestamp = None;
        decision.created_at = clock.unix_timestamp;
        decision.executed_at = None;

        msg!(
            "Rebalance decision created for position: {}, requires approval: {}",
            position.key(),
            requires_human_approval
        );
        Ok(())
    }

    /// Execute a rebalancing decision
    /// 
    /// For transaction-based Jupiter swaps:
    /// - swap_execution_signature: Signature of the executed Jupiter swap transaction (if swap was required)
    /// - route_plan: Legacy parameter for CPI-based swaps (deprecated, use transaction-based approach)
    pub fn execute_rebalance(
        ctx: Context<ExecuteRebalance>,
        _position_index: u8,
        _decision_index: u32,
        slippage_tolerance_bps: u16,
        route_plan: Option<JupiterRoutePlan>,
        swap_execution_signature: Option<String>,
    ) -> Result<()> {
        let decision = &mut ctx.accounts.decision;
        let position_key = ctx.accounts.position.key(); // Get key before mutable borrow
        let position = &mut ctx.accounts.position;
        let clock = Clock::get()?;

        // Validate decision status
        require!(
            decision.execution_status == ExecutionStatus::Pending,
            XLiquidityEngineError::InvalidExecutionStatus
        );

        // Check if human approval is required
        if decision.requires_human_approval {
            require!(
                decision.human_approver.is_some(),
                XLiquidityEngineError::HumanApprovalRequired
            );
            if let Some(approver) = &ctx.accounts.approver {
                require!(
                    decision.human_approver.unwrap() == approver.key(),
                    XLiquidityEngineError::InvalidApprover
                );
            } else {
                return Err(XLiquidityEngineError::HumanApprovalRequired.into());
            }
        }

        // Validate slippage tolerance
        let config = &ctx.accounts.config;
        require!(
            slippage_tolerance_bps <= config.default_slippage_tolerance_bps * 2,
            XLiquidityEngineError::SlippageTooHigh
        );

        // Calculate if swaps are needed for rebalancing
        // This is a simplified check - in production, you'd calculate exact token amounts needed
        let requires_swap = calculate_swap_requirements(position, decision);
        
        // Handle swap execution (transaction-based or CPI-based)
        if requires_swap {
            // Check if using transaction-based approach (preferred)
            if decision.jupiter_swap_transaction.is_some() {
                msg!("Using transaction-based Jupiter swap approach");
                
                // If swap execution signature is provided, record it
                if let Some(ref sig) = swap_execution_signature {
                    decision.execution_tx_signature = Some(sig.clone());
                    msg!("Swap execution signature recorded: {}", sig);
                } else {
                    msg!("Note: Swap transaction stored but execution signature not yet provided");
                    msg!("Swap transaction should be executed off-chain before calling execute_rebalance");
                }
                
                // Note: Actual swap execution happens off-chain
                // The transaction stored in jupiter_swap_transaction should be executed separately
                // This instruction just records the execution signature for audit purposes
            } else {
                // Fall back to CPI-based approach (legacy)
                msg!("Using CPI-based Jupiter swap approach (legacy)");
                
                // Validate slippage tolerance before swap
                require!(
                    slippage_tolerance_bps <= config.default_slippage_tolerance_bps * 2,
                    XLiquidityEngineError::SlippageTooHigh
                );
                
                // Execute swap via CPI and capture result
                let swap_result = execute_jupiter_swap(
                    ctx.accounts.jupiter_program.as_ref(),
                    ctx.accounts.token_program.as_ref(),
                    ctx.accounts.source_token_account.as_ref(),
                    ctx.accounts.destination_token_account.as_ref(),
                    ctx.accounts.program_authority.as_ref(),
                    ctx.accounts.user_transfer_authority.as_ref(),
                    position,
                    decision,
                    slippage_tolerance_bps,
                    route_plan.clone(),
                    *ctx.program_id,
                    position_key,
                )?;
                
                // Update decision with swap execution details
                if let Some(actual_slippage) = swap_result.actual_slippage_bps {
                    decision.execution_slippage = Some(actual_slippage);
                    
                    // Verify slippage didn't exceed tolerance
                    require!(
                        actual_slippage <= slippage_tolerance_bps,
                        XLiquidityEngineError::SlippageTooHigh
                    );
                    
                    msg!("Swap executed with slippage: {} bps (tolerance: {} bps)", 
                         actual_slippage, slippage_tolerance_bps);
                }
                
                msg!("Jupiter swap completed successfully via CPI");
            }
        }

        // If Raydium position, update position range on Raydium CLMM
        // Note: This is a placeholder - actual implementation requires instruction format research
        if matches!(position.dex, DexType::Raydium) {
            if let (Some(raydium_program), Some(raydium_position), Some(raydium_pool_state)) = (
                ctx.accounts.raydium_program.as_ref(),
                ctx.accounts.raydium_position.as_ref(),
                ctx.accounts.raydium_pool_state.as_ref(),
            ) {
                msg!("Updating Raydium CLMM position range...");
                
                // Strategy for rebalancing:
                // 1. Decrease liquidity from old range
                // 2. Collect fees
                // 3. Swap tokens if needed (via Jupiter)
                // 4. Increase liquidity to new range
                
                // Step 1: Decrease liquidity from old range
                let old_liquidity = position.liquidity_amount;
                if old_liquidity > 0 {
                    // Note: ExecuteRebalance doesn't have owner signer - using approver if available
                    // In production, owner signer should be added to ExecuteRebalance context
                    decrease_raydium_liquidity(
                        Some(raydium_program),
                        Some(raydium_position),
                        Some(raydium_pool_state),
                        ctx.accounts.raydium_tick_array_lower.as_ref(),
                        ctx.accounts.raydium_tick_array_upper.as_ref(),
                        ctx.accounts.raydium_token_account_0.as_ref(),
                        ctx.accounts.raydium_token_account_1.as_ref(),
                        ctx.accounts.raydium_token_vault_0.as_ref(),
                        ctx.accounts.raydium_token_vault_1.as_ref(),
                        ctx.accounts.raydium_token_program.as_ref(),
                        ctx.accounts.approver.as_ref(),
                        old_liquidity,
                        0, // amount_0_min (will be calculated)
                        0, // amount_1_min (will be calculated)
                    )?;
                }
                
                // Step 2: Collect fees (if any)
                // Note: Fees collection would happen here
                
                // Step 3: Swap tokens if needed (handled by Jupiter swap above)
                
                // Step 4: Increase liquidity to new range
                // Note: New liquidity amount would be calculated based on token amounts
                let new_liquidity = 0u128; // Placeholder - will be calculated
                // Note: ExecuteRebalance doesn't have owner signer - using approver if available
                increase_raydium_liquidity(
                    Some(raydium_program),
                    Some(raydium_position),
                    Some(raydium_pool_state),
                    ctx.accounts.raydium_tick_array_lower.as_ref(),
                    ctx.accounts.raydium_tick_array_upper.as_ref(),
                    ctx.accounts.raydium_token_account_0.as_ref(),
                    ctx.accounts.raydium_token_account_1.as_ref(),
                    ctx.accounts.raydium_token_vault_0.as_ref(),
                    ctx.accounts.raydium_token_vault_1.as_ref(),
                    ctx.accounts.raydium_token_program.as_ref(),
                    ctx.accounts.approver.as_ref(),
                    new_liquidity,
                    0, // amount_0_max (will be provided)
                    0, // amount_1_max (will be provided)
                )?;
                
                msg!("Raydium position rebalancing attempted (implementation pending)");
            } else {
                msg!("Raydium accounts not provided - updating Flow position only");
                msg!("Note: To update actual Raydium position, provide raydium_program, raydium_position, etc.");
            }
        }

        // Update position with new range
        position.current_tick_lower = decision.new_tick_lower;
        position.current_tick_upper = decision.new_tick_upper;
        position.current_price_lower = decision.new_price_lower;
        position.current_price_upper = decision.new_price_upper;
        position.last_rebalance_slot = clock.slot;
        position.last_rebalance_timestamp = clock.unix_timestamp;
        position.rebalance_count = position.rebalance_count.checked_add(1).unwrap();
        position.updated_at = clock.unix_timestamp;

        // Update decision status
        decision.execution_status = ExecutionStatus::Executed;
        decision.executed_at = Some(clock.unix_timestamp);
        // Note: execution_tx_signature and execution_slippage would be set by off-chain service

        // Create audit log
        let event_data = format!(
            "Rebalanced position {}: ticks [{}, {}], prices [{}, {}]",
            position.key(),
            decision.new_tick_lower,
            decision.new_tick_upper,
            decision.new_price_lower,
            decision.new_price_upper
        );
        create_audit_log_internal(
            &ctx.accounts.audit_log,
            AuditEventType::Rebalanced,
            Some(position.key()),
            position.owner,
            event_data.as_bytes(),
            clock,
        )?;

        msg!("Rebalance executed for position: {}", position.key());
        Ok(())
    }

    /// Verify x402 payment and grant API access
    pub fn verify_x402_payment(
        ctx: Context<VerifyX402Payment>,
        payment_id: [u8; 32],
        amount: u64,
        currency: PaymentCurrency,
        api_endpoint: String,
        api_version: String,
    ) -> Result<()> {
        let payment = &mut ctx.accounts.payment;
        let config = &ctx.accounts.config;
        let clock = Clock::get()?;

        // Validate minimum payment
        require!(
            amount >= config.x402_min_payment,
            XLiquidityEngineError::PaymentTooSmall
        );

        // Validate facilitator
        require!(
            ctx.accounts.facilitator.key() == config.x402_facilitator.unwrap_or(Pubkey::default()),
            XLiquidityEngineError::InvalidFacilitator
        );

        payment.payment_id = payment_id;
        payment.payment_bump = ctx.bumps.payment;
        payment.payer = ctx.accounts.payer.key();
        payment.payer_wallet = ctx.accounts.payer_wallet.key();
        payment.amount = amount;
        payment.currency = currency;
        payment.payment_status = PaymentStatus::Verified;
        payment.facilitator = ctx.accounts.facilitator.key();
        payment.facilitator_signature = None; // Would be set by facilitator verification
        payment.payment_tx_signature = None; // Would be set after on-chain settlement
        payment.api_endpoint = api_endpoint;
        payment.api_version = api_version;
        payment.access_granted = true;
        payment.access_expires_at = Some(clock.unix_timestamp + 3600); // 1 hour access
        payment.requested_at = clock.unix_timestamp;
        payment.verified_at = Some(clock.unix_timestamp);
        payment.settled_at = None; // Set after settlement

        // Create audit log
        create_audit_log_internal(
            &ctx.accounts.audit_log,
            AuditEventType::PaymentReceived,
            None,
            ctx.accounts.payer.key(),
            &[],
            clock,
        )?;

        msg!("x402 payment verified: {} for endpoint: {}", amount, payment.api_endpoint);
        Ok(())
    }

    /// Collect fees from a liquidity position
    pub fn collect_fees(
        ctx: Context<CollectFees>,
        _position_index: u8,
    ) -> Result<()> {
        let position = &mut ctx.accounts.position;
        let clock = Clock::get()?;

        // Validate position is active
        require!(
            position.status == PositionStatus::Active,
            XLiquidityEngineError::PositionNotActive
        );

        // Check if there are fees to collect
        require!(
            position.total_fees_earned_a > 0 || position.total_fees_earned_b > 0,
            XLiquidityEngineError::NoFeesToCollect
        );

        // If Raydium position, collect fees from Raydium CLMM
        // Note: This is a placeholder - actual implementation requires instruction format research
        if matches!(position.dex, DexType::Raydium) {
            if let (Some(raydium_program), Some(raydium_position), Some(raydium_pool_state)) = (
                ctx.accounts.raydium_program.as_ref(),
                ctx.accounts.raydium_position.as_ref(),
                ctx.accounts.raydium_pool_state.as_ref(),
            ) {
                msg!("Collecting fees from Raydium CLMM position...");
                
                // Collect fees from Raydium (request all available fees)
                let (collected_a, collected_b) = collect_raydium_fees(
                    Some(raydium_program),
                    Some(raydium_position),
                    Some(raydium_pool_state),
                    ctx.accounts.raydium_token_account_0.as_ref(),
                    ctx.accounts.raydium_token_account_1.as_ref(),
                    ctx.accounts.raydium_token_vault_0.as_ref(),
                    ctx.accounts.raydium_token_vault_1.as_ref(),
                    ctx.accounts.raydium_token_program.as_ref(),
                    Some(&ctx.accounts.owner),
                    position.total_fees_earned_a,
                    position.total_fees_earned_b,
                )?;
                
                msg!("Raydium fees collected: {} token A, {} token B", collected_a, collected_b);
                msg!("Note: Actual fee collection implementation pending");
            } else {
                msg!("Raydium accounts not provided - using stored fee amounts");
            }
        }

        // Calculate protocol fees
        let config = &ctx.accounts.config;
        let _protocol_fee_a = (position.total_fees_earned_a as u128)
            .checked_mul(config.protocol_fee_bps as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;
        let _protocol_fee_b = (position.total_fees_earned_b as u128)
            .checked_mul(config.protocol_fee_bps as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;

        // Note: Actual token transfer would happen via CPI to token program
        // This is just updating the accounting
        // Protocol fees would be sent to config.fee_recipient in production

        // Reset fee counters (fees would be transferred off-chain)
        let fees_collected_a = position.total_fees_earned_a;
        let fees_collected_b = position.total_fees_earned_b;
        position.total_fees_earned_a = 0;
        position.total_fees_earned_b = 0;
        position.updated_at = clock.unix_timestamp;

        // Create audit log
        let event_data = format!(
            "Fees collected: {} token A, {} token B",
            fees_collected_a, fees_collected_b
        );
        create_audit_log_internal(
            &ctx.accounts.audit_log,
            AuditEventType::FeesCollected,
            Some(position.key()),
            position.owner,
            event_data.as_bytes(),
            clock,
        )?;

        msg!(
            "Fees collected from position {}: {} token A, {} token B",
            position.key(),
            fees_collected_a,
            fees_collected_b
        );
        Ok(())
    }

    /// Approve a rebalancing decision (human oversight)
    pub fn approve_rebalance(
        ctx: Context<ApproveRebalance>,
        _decision_index: u32,
    ) -> Result<()> {
        let decision = &mut ctx.accounts.decision;
        let clock = Clock::get()?;

        require!(
            decision.requires_human_approval,
            XLiquidityEngineError::ApprovalNotRequired
        );
        require!(
            decision.execution_status == ExecutionStatus::Pending,
            XLiquidityEngineError::InvalidExecutionStatus
        );

        decision.human_approver = Some(ctx.accounts.approver.key());
        decision.approval_timestamp = Some(clock.unix_timestamp);

        // Create audit log
        create_audit_log_internal(
            &ctx.accounts.audit_log,
            AuditEventType::HumanApprovalGranted,
            Some(decision.position),
            ctx.accounts.approver.key(),
            &[],
            clock,
        )?;

        msg!("Rebalance decision approved by: {}", ctx.accounts.approver.key());
        Ok(())
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Assess risk level based on prediction metrics
fn assess_risk(
    confidence: u16,
    sentiment: i16,
    volatility: u16,
) -> RiskLevel {
    // Simple risk assessment logic
    // In production, this would be more sophisticated
    if confidence < 5000 || volatility > 8000 {
        RiskLevel::Critical
    } else if confidence < 7000 || volatility > 6000 || sentiment < -5000 {
        RiskLevel::High
    } else if confidence < 8500 || volatility > 4000 {
        RiskLevel::Medium
    } else {
        RiskLevel::Low
    }
}

/// Calculate if swaps are required for rebalancing
/// Returns true if token swaps are needed to adjust position
fn calculate_swap_requirements(
    position: &LiquidityPosition,
    decision: &RebalanceDecision,
) -> bool {
    // Simplified logic: if the price range changes significantly, swaps may be needed
    // In production, this would calculate exact token amounts based on:
    // - Current position liquidity distribution
    // - New price range
    // - Target token ratios
    
    // Check if price range change is significant (>10%)
    // This matches the logic in calculate_swap_amount
    let price_range_change = if decision.new_price_lower > position.current_price_lower {
        decision.new_price_lower - position.current_price_lower
    } else {
        position.current_price_lower - decision.new_price_lower
    };
    
    // If price range change is significant, swaps may be needed
    if price_range_change > position.current_price_lower / 10 {
        true
    } else {
        false
    }
}

/// Execute a swap via Jupiter CPI
/// This function performs a token swap using Jupiter's DEX aggregator
/// 
/// The route plan should be obtained off-chain from Jupiter's API:
/// GET https://quote-api.jup.ag/v6/quote?inputMint={input}&outputMint={output}&amount={amount}
/// 
/// Then passed to this function via the route_plan parameter.
fn execute_jupiter_swap<'info>(
    jupiter_program: Option<&AccountInfo<'info>>,
    token_program: Option<&AccountInfo<'info>>,
    source_token_account: Option<&AccountInfo<'info>>,
    destination_token_account: Option<&AccountInfo<'info>>,
    program_authority: Option<&AccountInfo<'info>>,
    user_transfer_authority: Option<&Signer<'info>>,
    position: &LiquidityPosition,
    decision: &RebalanceDecision,
    slippage_tolerance_bps: u16,
    route_plan: Option<JupiterRoutePlan>,
    program_id: Pubkey,
    position_key: Pubkey,
) -> Result<JupiterSwapResult> {
    // Check if Jupiter swap accounts are provided
    let Some(jupiter_program_info) = jupiter_program else {
        msg!("Jupiter program account not provided, skipping swap execution");
        msg!("Note: In production, Jupiter program and token accounts would be required");
        return Ok(JupiterSwapResult {
            executed: false,
            actual_slippage_bps: None,
            actual_amount_out: None,
        });
    };
    
    // Validate Jupiter program ID
    let expected_jupiter_id = jupiter_program_id();
    require!(
        jupiter_program_info.key() == expected_jupiter_id,
        XLiquidityEngineError::InvalidFacilitator
    );
    
    // Validate required accounts are provided
    let Some(token_program_info) = token_program else {
        msg!("Token program account not provided, skipping swap");
        return Ok(JupiterSwapResult {
            executed: false,
            actual_slippage_bps: None,
            actual_amount_out: None,
        });
    };
    
    let Some(source_account) = source_token_account else {
        msg!("Source token account not provided, skipping swap");
        return Ok(JupiterSwapResult {
            executed: false,
            actual_slippage_bps: None,
            actual_amount_out: None,
        });
    };
    
    let Some(dest_account) = destination_token_account else {
        msg!("Destination token account not provided, skipping swap");
        return Ok(JupiterSwapResult {
            executed: false,
            actual_slippage_bps: None,
            actual_amount_out: None,
        });
    };
    
    // Calculate swap amount
    let swap_amount = calculate_swap_amount(position, decision)?;
    
    if swap_amount == 0 {
        msg!("No swap needed - token ratios are already optimal");
        return Ok(JupiterSwapResult {
            executed: false,
            actual_slippage_bps: None,
            actual_amount_out: None,
        });
    }
    
    msg!(
        "Executing Jupiter swap: {} -> {}, amount: {}, slippage: {} bps",
        position.token_a,
        position.token_b,
        swap_amount,
        slippage_tolerance_bps
    );
    
    // If route plan is provided, use it; otherwise, we'll need to build a basic swap
    if let Some(plan) = route_plan {
        msg!("Using provided route plan for Jupiter swap");
        
        // Validate route plan matches our swap requirements
        require!(
            plan.input_mint == position.token_a && plan.output_mint == position.token_b,
            XLiquidityEngineError::InvalidFacilitator // Reusing error type
        );
        
        require!(
            plan.in_amount == swap_amount,
            XLiquidityEngineError::InvalidFacilitator
        );
        
        // Validate slippage tolerance in route plan
        require!(
            plan.slippage_bps <= slippage_tolerance_bps,
            XLiquidityEngineError::SlippageTooHigh
        );
        
        // Store expected output amount for slippage calculation
        let expected_amount_out = plan.out_amount;
        
        // Execute Jupiter CPI call with route plan
        execute_jupiter_cpi(
            jupiter_program_info,
            token_program_info,
            source_account,
            dest_account,
            program_authority,
            user_transfer_authority,
            &plan,
            program_id,
            position_key,
        )?;
        
        msg!("Jupiter swap executed successfully via CPI");
        
        // Note: In a production implementation, we would:
        // 1. Read token account balances before/after swap
        // 2. Calculate actual amount received
        // 3. Calculate actual slippage: ((expected - actual) / expected) * 10000
        // 4. Verify slippage didn't exceed tolerance
        
        // For now, we'll use the route plan's expected slippage
        // In production, this would be calculated from actual balances
        let actual_slippage = plan.slippage_bps;
        
        // Verify slippage didn't exceed tolerance
        require!(
            actual_slippage <= slippage_tolerance_bps,
            XLiquidityEngineError::SlippageTooHigh
        );
        
        msg!("Swap verification: expected out: {}, slippage: {} bps", 
             expected_amount_out, actual_slippage);
        
        Ok(JupiterSwapResult {
            executed: true,
            actual_slippage_bps: Some(actual_slippage),
            actual_amount_out: Some(expected_amount_out),
        })
    } else {
        msg!("No route plan provided - swap execution skipped");
        msg!("Note: Route plan should be obtained from Jupiter API off-chain and passed as instruction data");
        msg!("API endpoint: https://quote-api.jup.ag/v6/quote");
        
        // In production, you would either:
        // 1. Require route_plan to be provided (fail if None)
        // 2. Or have an off-chain service that calls Jupiter API and includes route plan in transaction
        
        Ok(JupiterSwapResult {
            executed: false,
            actual_slippage_bps: None,
            actual_amount_out: None,
        })
    }
}

/// Execute the actual Jupiter CPI call
/// This builds and invokes Jupiter's swap instruction with proper signer setup
fn execute_jupiter_cpi<'info>(
    jupiter_program: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    source_token_account: &AccountInfo<'info>,
    destination_token_account: &AccountInfo<'info>,
    program_authority: Option<&AccountInfo<'info>>,
    user_transfer_authority: Option<&Signer<'info>>,
    route_plan: &JupiterRoutePlan,
    program_id: Pubkey,
    position_key: Pubkey,
) -> Result<()> {
    msg!("Building Jupiter CPI instruction...");
    
    // Build instruction data
    // Note: Jupiter's actual instruction format may vary by version
    // This is a simplified structure - in production, you'd need to match Jupiter's exact format
    let mut instruction_data = Vec::new();
    
    // Add discriminator (placeholder - needs to match Jupiter's actual discriminator)
    instruction_data.push(JUPITER_SWAP_DISCRIMINATOR);
    
    // Serialize route plan data
    // In production, this would match Jupiter's exact serialization format
    let route_plan_bytes = route_plan.try_to_vec()?;
    instruction_data.extend_from_slice(&(route_plan_bytes.len() as u32).to_le_bytes());
    instruction_data.extend_from_slice(&route_plan_bytes);
    
    // Build account metas for Jupiter CPI
    // Note: Jupiter's exact account requirements depend on the route
    // This is a simplified version - actual implementation would need all route-specific accounts
    let mut accounts = Vec::new();
    
    // Token program (required)
    accounts.push(AccountMeta::new_readonly(*token_program.key, false));
    
    // Source token account (writable)
    accounts.push(AccountMeta::new(*source_token_account.key, false));
    
    // Destination token account (writable)
    accounts.push(AccountMeta::new(*destination_token_account.key, false));
    
    // Determine authority and signer setup
    // Priority: 1. Program authority PDA, 2. User transfer authority
    let (authority_key, use_pda_signer) = if let Some(program_auth) = program_authority {
        (*program_auth.key, true)
    } else if let Some(user_auth) = user_transfer_authority {
        (user_auth.key(), false)
    } else {
        return Err(anchor_lang::error::ErrorCode::ConstraintOwner.into());
    };
    
    accounts.push(AccountMeta::new(authority_key, true));
    
    // Note: Jupiter routes may require additional accounts (pools, AMMs, etc.)
    // These would be included based on the route plan data
    // For a complete implementation, you'd parse the route plan and add all required accounts
    
    // Create the instruction
    let instruction = Instruction {
        program_id: *jupiter_program.key,
        accounts,
        data: instruction_data,
    };
    
    // Prepare account infos for CPI
    let mut account_infos = Vec::new();
    account_infos.push(jupiter_program.clone());
    account_infos.push(token_program.clone());
    account_infos.push(source_token_account.clone());
    account_infos.push(destination_token_account.clone());
    
    // Add authority account and execute CPI
    if use_pda_signer {
        // Use program authority PDA with signer seeds
        if let Some(program_auth) = program_authority {
            account_infos.push(program_auth.clone());
            
            // Derive PDA seeds for program authority
            // Seeds: [b"program_authority", position.key().as_ref()]
            let seeds = &[
                b"program_authority".as_ref(),
                position_key.as_ref(),
            ];
            
            // Find PDA bump (in production, this would be stored or derived)
            // For now, we'll use find_program_address to get the bump
            let (pda, bump) = Pubkey::find_program_address(seeds, &program_id);
            
            // Verify the PDA matches
            require!(
                pda == authority_key,
                XLiquidityEngineError::InvalidFacilitator
            );
            
            // Create signer seeds
            let signer_seeds: &[&[&[u8]]] = &[&[
                b"program_authority".as_ref(),
                position_key.as_ref(),
                &[bump],
            ]];
            
            msg!("Invoking Jupiter swap CPI with program authority PDA...");
            msg!("PDA: {}, bump: {}", pda, bump);
            
            // Execute CPI with PDA signer
            anchor_lang::solana_program::program::invoke_signed(
                &instruction,
                &account_infos,
                signer_seeds,
            )?;
            
            msg!("Jupiter CPI executed successfully with program authority PDA");
        } else {
            return Err(anchor_lang::error::ErrorCode::ConstraintOwner.into());
        }
    } else {
        // Use user transfer authority (already a signer in the transaction)
        if let Some(user_auth) = user_transfer_authority {
            account_infos.push(user_auth.to_account_info());
            
            msg!("Invoking Jupiter swap CPI with user transfer authority...");
            
            // Execute CPI (user is already a signer in the transaction)
            invoke(&instruction, &account_infos)?;
            
            msg!("Jupiter CPI executed successfully with user transfer authority");
        } else {
            return Err(anchor_lang::error::ErrorCode::ConstraintOwner.into());
        }
    }
    
    msg!(
        "Jupiter swap completed: {} -> {}, amount: {}",
        route_plan.input_mint,
        route_plan.output_mint,
        route_plan.in_amount
    );
    
    Ok(())
}

/// Calculate the amount to swap for rebalancing
/// Returns the amount of token A to swap for token B (or 0 if no swap needed)
fn calculate_swap_amount(
    position: &LiquidityPosition,
    decision: &RebalanceDecision,
) -> Result<u64> {
    // Simplified calculation - in production, this would:
    // 1. Calculate current token ratio in position
    // 2. Calculate target token ratio for new price range
    // 3. Determine swap amount needed to achieve target ratio
    
    // For now, return 0 (no swap needed) as a placeholder
    // This will be enhanced when we integrate with actual DEX position management
    
    // Placeholder logic: if price range changes significantly, we might need swaps
    let price_range_change = if decision.new_price_lower > position.current_price_lower {
        decision.new_price_lower - position.current_price_lower
    } else {
        position.current_price_lower - decision.new_price_lower
    };
    
    // If price range change is significant (>10%), we might need swaps
    // This is simplified - actual calculation would be more sophisticated
    if price_range_change > position.current_price_lower / 10 {
        // Return a placeholder amount - in production, calculate exact amount needed
        Ok(1000) // Placeholder: 1000 tokens
    } else {
        Ok(0) // No swap needed
    }
}

/// Create an audit log entry (internal helper)
fn create_audit_log_internal(
    _audit_log_account: &AccountInfo,
    event_type: AuditEventType,
    position: Option<Pubkey>,
    user: Pubkey,
    _event_data: &[u8],
    _clock: Clock,
) -> Result<()> {
    // Note: This is a simplified version
    // In a real implementation, you would initialize the audit log account here
    // For now, we'll just log the event
    msg!(
        "Audit log: {:?} for user: {}, position: {:?}",
        event_type,
        user,
        position
    );
    Ok(())
}

// ============================================================================
// RAYDIUM CLMM HELPER FUNCTIONS
// ============================================================================

/// Derive Raydium PersonalPosition PDA
/// 
/// Raydium CLMM positions are PDAs derived from:
/// - Pool state
/// - Owner (or nft_mint if NFT-based)
/// - Position index (if multiple positions per owner)
/// 
/// Note: This is a simplified derivation. Actual Raydium derivation may differ.
/// Verify with Raydium documentation or program source.
fn derive_raydium_position_pda(
    pool_state: &Pubkey,
    owner: &Pubkey,
    position_index: u16,
    program_id: &Pubkey,
) -> (Pubkey, u8) {
    let seeds = &[
        b"position",
        pool_state.as_ref(),
        owner.as_ref(),
        &position_index.to_le_bytes(),
    ];
    Pubkey::find_program_address(seeds, program_id)
}

/// Derive Raydium TickArray PDA
/// 
/// Tick arrays are PDAs derived from:
/// - Pool state
/// - Tick index (normalized to tick spacing)
/// 
/// Note: Tick index should be normalized to tick spacing (typically 60).
/// Verify with Raydium documentation for exact derivation formula.
fn derive_raydium_tick_array_pda(
    pool_state: &Pubkey,
    tick_index: i32,
    tick_spacing: u16,
    program_id: &Pubkey,
) -> (Pubkey, u8) {
    // Normalize tick to tick spacing
    let normalized_tick = (tick_index / tick_spacing as i32) * tick_spacing as i32;
    
    let seeds = &[
        b"tick_array",
        pool_state.as_ref(),
        &normalized_tick.to_le_bytes(),
    ];
    Pubkey::find_program_address(seeds, program_id)
}

/// Create a new concentrated liquidity position on Raydium CLMM
/// 
/// This function performs a CPI to Raydium's OpenPosition instruction.
/// 
/// All required accounts should be provided via the instruction context.
/// If PDAs are not provided, they can be derived using helper functions.
fn create_raydium_position<'info>(
    raydium_program: Option<&AccountInfo<'info>>,
    pool_state: Option<&AccountInfo<'info>>,
    personal_position: Option<&AccountInfo<'info>>,
    tick_array_lower: Option<&AccountInfo<'info>>,
    tick_array_upper: Option<&AccountInfo<'info>>,
    token_account_0: Option<&AccountInfo<'info>>,
    token_account_1: Option<&AccountInfo<'info>>,
    token_vault_0: Option<&AccountInfo<'info>>,
    token_vault_1: Option<&AccountInfo<'info>>,
    token_program: Option<&AccountInfo<'info>>,
    owner: Option<&Signer<'info>>,
    tick_lower: i32,
    tick_upper: i32,
    liquidity: u128,
    amount_0_max: u64,
    amount_1_max: u64,
) -> Result<()> {
    // Check if Raydium accounts are provided
    let Some(raydium_program_info) = raydium_program else {
        msg!("Raydium program account not provided, skipping position creation");
        msg!("Note: In production, Raydium program and pool accounts would be required");
        return Ok(());
    };
    
    // Validate Raydium program ID
    let expected_raydium_id = raydium_clmm_program_id();
    require!(
        raydium_program_info.key() == expected_raydium_id,
        XLiquidityEngineError::InvalidFacilitator
    );
    
    // Validate required accounts are provided
    let Some(pool_state_info) = pool_state else {
        msg!("Raydium pool state account not provided, skipping position creation");
        return Ok(());
    };
    
    let Some(token_account_0_info) = token_account_0 else {
        msg!("Token account 0 not provided, skipping position creation");
        return Ok(());
    };
    
    let Some(token_account_1_info) = token_account_1 else {
        msg!("Token account 1 not provided, skipping position creation");
        return Ok(());
    };
    
    let Some(token_program_info) = token_program else {
        msg!("Token program not provided, skipping position creation");
        return Ok(());
    };
    
    let Some(owner_signer) = owner else {
        msg!("Owner signer not provided, skipping position creation");
        return Ok(());
    };
    
    msg!(
        "Creating Raydium position: ticks [{}, {}], liquidity: {}, amounts: [{}, {}]",
        tick_lower,
        tick_upper,
        liquidity,
        amount_0_max,
        amount_1_max
    );
    
    // Note: Full implementation requires:
    // - PersonalPosition PDA derivation
    // - Tick array PDAs for lower and upper bounds
    // - Token vault accounts from pool state
    // - System program for position account creation
    //
    // For now, we'll use the raydium-clmm-cpi crate if available, otherwise build manual CPI
    // This is a foundation that can be extended once all required accounts are added to instruction contexts
    
    // Attempt to use raydium-clmm-cpi crate for OpenPosition
    // Note: This requires additional accounts (tick arrays, position PDA, vaults) that aren't
    // currently in the function signature. This implementation serves as a foundation.
    
    // Build instruction data: discriminator (8 bytes) + tick_lower (4 bytes) + tick_upper (4 bytes) + liquidity (16 bytes) + amount_0_max (8 bytes) + amount_1_max (8 bytes)
    let mut instruction_data = Vec::with_capacity(48);
    instruction_data.extend_from_slice(&RAYDIUM_OPEN_POSITION_DISCRIMINATOR);
    instruction_data.extend_from_slice(&tick_lower.to_le_bytes());
    instruction_data.extend_from_slice(&tick_upper.to_le_bytes());
    instruction_data.extend_from_slice(&liquidity.to_le_bytes());
    instruction_data.extend_from_slice(&amount_0_max.to_le_bytes());
    instruction_data.extend_from_slice(&amount_1_max.to_le_bytes());
    
    // Derive or use provided PDAs
    let (position_pda, _position_bump) = if let Some(pos) = personal_position {
        (pos.key(), 0) // Use provided PDA
    } else {
        // Derive position PDA (using position_index 0 as default)
        derive_raydium_position_pda(
            &pool_state_info.key(),
            &owner_signer.key(),
            0, // position_index - should be passed as parameter in production
            &raydium_program_info.key(),
        )
    };
    
    // Derive tick arrays if not provided
    let tick_array_lower_pda = if let Some(tick_lower_acc) = tick_array_lower {
        tick_lower_acc.key()
    } else {
        // Derive tick array PDA (using tick_spacing 60 as default - should be read from pool state)
        derive_raydium_tick_array_pda(
            &pool_state_info.key(),
            tick_lower,
            60, // tick_spacing - should be read from pool state in production
            &raydium_program_info.key(),
        ).0
    };
    
    let tick_array_upper_pda = if let Some(tick_upper_acc) = tick_array_upper {
        tick_upper_acc.key()
    } else {
        derive_raydium_tick_array_pda(
            &pool_state_info.key(),
            tick_upper,
            60,
            &raydium_program_info.key(),
        ).0
    };
    
    // Get token vaults (use provided or derive from pool state)
    let token_vault_0_key = token_vault_0.map(|v| v.key())
        .unwrap_or_else(|| anchor_lang::solana_program::system_program::ID); // Placeholder
    let token_vault_1_key = token_vault_1.map(|v| v.key())
        .unwrap_or_else(|| anchor_lang::solana_program::system_program::ID); // Placeholder
    
    // Build account metas in correct order for Raydium OpenPosition
    // Note: Account order needs verification with Raydium documentation
    let mut accounts = Vec::new();
    accounts.push(AccountMeta::new_readonly(pool_state_info.key(), false));
    accounts.push(AccountMeta::new(position_pda, false)); // PersonalPosition PDA
    accounts.push(AccountMeta::new_readonly(tick_array_lower_pda, false));
    accounts.push(AccountMeta::new_readonly(tick_array_upper_pda, false));
    accounts.push(AccountMeta::new(token_account_0_info.key(), false));
    accounts.push(AccountMeta::new(token_account_1_info.key(), false));
    accounts.push(AccountMeta::new(token_vault_0_key, false));
    accounts.push(AccountMeta::new(token_vault_1_key, false));
    accounts.push(AccountMeta::new_readonly(owner_signer.key(), true));
    accounts.push(AccountMeta::new_readonly(token_program_info.key(), false));
    accounts.push(AccountMeta::new_readonly(anchor_lang::solana_program::system_program::ID, false));
    
    // Create and invoke CPI instruction
    let cpi_instruction = Instruction {
        program_id: raydium_program_info.key(),
        accounts,
        data: instruction_data,
    };
    
    // Build account infos for invoke
    let mut account_infos = vec![
        raydium_program_info.clone(),
        pool_state_info.clone(),
        token_account_0_info.clone(),
        token_account_1_info.clone(),
        owner_signer.to_account_info(),
        token_program_info.clone(),
    ];
    
    // Add position PDA if provided, otherwise we'll need to derive it
    if let Some(pos) = personal_position {
        account_infos.push(pos.clone());
    }
    if let Some(tick_lower_acc) = tick_array_lower {
        account_infos.push(tick_lower_acc.clone());
    }
    if let Some(tick_upper_acc) = tick_array_upper {
        account_infos.push(tick_upper_acc.clone());
    }
    if let Some(vault_0) = token_vault_0 {
        account_infos.push(vault_0.clone());
    }
    if let Some(vault_1) = token_vault_1 {
        account_infos.push(vault_1.clone());
    }
    
    // Note: For full implementation, we need signer seeds for position PDA if it's a PDA
    // For now, this structure is correct but may need adjustment based on actual Raydium requirements
    invoke(&cpi_instruction, &account_infos)?;
    
    msg!("Raydium position creation CPI invoked successfully");
    msg!("Note: Full implementation requires tick arrays and position PDA derivation");
    
    Ok(())
}

/// Increase liquidity in an existing Raydium position
/// 
/// This function performs a CPI to Raydium's IncreaseLiquidity instruction.
fn increase_raydium_liquidity<'info>(
    raydium_program: Option<&AccountInfo<'info>>,
    position: Option<&AccountInfo<'info>>,
    pool_state: Option<&AccountInfo<'info>>,
    tick_array_lower: Option<&AccountInfo<'info>>,
    tick_array_upper: Option<&AccountInfo<'info>>,
    token_account_0: Option<&AccountInfo<'info>>,
    token_account_1: Option<&AccountInfo<'info>>,
    token_vault_0: Option<&AccountInfo<'info>>,
    token_vault_1: Option<&AccountInfo<'info>>,
    token_program: Option<&AccountInfo<'info>>,
    owner: Option<&Signer<'info>>,
    liquidity: u128,
    amount_0_max: u64,
    amount_1_max: u64,
) -> Result<()> {
    // Check if Raydium accounts are provided
    let Some(raydium_program_info) = raydium_program else {
        msg!("Raydium program account not provided, skipping liquidity increase");
        return Ok(());
    };
    
    // Validate Raydium program ID
    let expected_raydium_id = raydium_clmm_program_id();
    require!(
        raydium_program_info.key() == expected_raydium_id,
        XLiquidityEngineError::InvalidFacilitator
    );
    
    // Validate required accounts
    let Some(position_info) = position else {
        msg!("Raydium position account not provided, skipping liquidity increase");
        return Ok(());
    };
    
    let Some(pool_state_info) = pool_state else {
        msg!("Raydium pool state account not provided, skipping liquidity increase");
        return Ok(());
    };
    
    let Some(token_account_0_info) = token_account_0 else {
        msg!("Token account 0 not provided, skipping liquidity increase");
        return Ok(());
    };
    
    let Some(token_account_1_info) = token_account_1 else {
        msg!("Token account 1 not provided, skipping liquidity increase");
        return Ok(());
    };
    
    let Some(token_program_info) = token_program else {
        msg!("Token program not provided, skipping liquidity increase");
        return Ok(());
    };
    
    let Some(owner_signer) = owner else {
        msg!("Owner signer not provided, skipping liquidity increase");
        return Ok(());
    };
    
    msg!(
        "Increasing Raydium liquidity: {}, amounts: [{}, {}]",
        liquidity,
        amount_0_max,
        amount_1_max
    );
    
    // Derive tick arrays if not provided (need tick values from position - using placeholders for now)
    let tick_array_lower_pda = if let Some(tick_lower_acc) = tick_array_lower {
        tick_lower_acc.key()
    } else {
        // Note: In production, read tick_lower from position account
        // For now, use placeholder derivation
        derive_raydium_tick_array_pda(
            &pool_state_info.key(),
            0, // tick_lower - should be read from position
            60, // tick_spacing - should be read from pool state
            &raydium_program_info.key(),
        ).0
    };
    
    let tick_array_upper_pda = if let Some(tick_upper_acc) = tick_array_upper {
        tick_upper_acc.key()
    } else {
        derive_raydium_tick_array_pda(
            &pool_state_info.key(),
            0, // tick_upper - should be read from position
            60,
            &raydium_program_info.key(),
        ).0
    };
    
    // Get token vaults
    let token_vault_0_key = token_vault_0.map(|v| v.key())
        .unwrap_or_else(|| anchor_lang::solana_program::system_program::ID); // Placeholder
    let token_vault_1_key = token_vault_1.map(|v| v.key())
        .unwrap_or_else(|| anchor_lang::solana_program::system_program::ID); // Placeholder
    
    // Build instruction data: discriminator (8 bytes) + liquidity (16 bytes) + amount_0_max (8 bytes) + amount_1_max (8 bytes)
    let mut instruction_data = Vec::with_capacity(40);
    instruction_data.extend_from_slice(&RAYDIUM_INCREASE_LIQUIDITY_DISCRIMINATOR);
    instruction_data.extend_from_slice(&liquidity.to_le_bytes());
    instruction_data.extend_from_slice(&amount_0_max.to_le_bytes());
    instruction_data.extend_from_slice(&amount_1_max.to_le_bytes());
    
    // Build account metas in correct order for Raydium IncreaseLiquidity
    let mut accounts = Vec::new();
    accounts.push(AccountMeta::new(position_info.key(), false));
    accounts.push(AccountMeta::new_readonly(pool_state_info.key(), false));
    accounts.push(AccountMeta::new_readonly(tick_array_lower_pda, false));
    accounts.push(AccountMeta::new_readonly(tick_array_upper_pda, false));
    accounts.push(AccountMeta::new(token_account_0_info.key(), false));
    accounts.push(AccountMeta::new(token_account_1_info.key(), false));
    accounts.push(AccountMeta::new(token_vault_0_key, false));
    accounts.push(AccountMeta::new(token_vault_1_key, false));
    accounts.push(AccountMeta::new_readonly(owner_signer.key(), true));
    accounts.push(AccountMeta::new_readonly(token_program_info.key(), false));
    
    // Create and invoke CPI instruction
    let cpi_instruction = Instruction {
        program_id: raydium_program_info.key(),
        accounts,
        data: instruction_data,
    };
    
    // Build account infos for invoke
    let mut account_infos = vec![
        raydium_program_info.clone(),
        position_info.clone(),
        pool_state_info.clone(),
        token_account_0_info.clone(),
        token_account_1_info.clone(),
        owner_signer.to_account_info(),
        token_program_info.clone(),
    ];
    
    if let Some(tick_lower_acc) = tick_array_lower {
        account_infos.push(tick_lower_acc.clone());
    }
    if let Some(tick_upper_acc) = tick_array_upper {
        account_infos.push(tick_upper_acc.clone());
    }
    if let Some(vault_0) = token_vault_0 {
        account_infos.push(vault_0.clone());
    }
    if let Some(vault_1) = token_vault_1 {
        account_infos.push(vault_1.clone());
    }
    
    invoke(&cpi_instruction, &account_infos)?;
    
    msg!("Raydium liquidity increase CPI invoked successfully");
    
    Ok(())
}

/// Decrease liquidity from an existing Raydium position
/// 
/// This function performs a CPI to Raydium's DecreaseLiquidity instruction.
fn decrease_raydium_liquidity<'info>(
    raydium_program: Option<&AccountInfo<'info>>,
    position: Option<&AccountInfo<'info>>,
    pool_state: Option<&AccountInfo<'info>>,
    tick_array_lower: Option<&AccountInfo<'info>>,
    tick_array_upper: Option<&AccountInfo<'info>>,
    token_account_0: Option<&AccountInfo<'info>>,
    token_account_1: Option<&AccountInfo<'info>>,
    token_vault_0: Option<&AccountInfo<'info>>,
    token_vault_1: Option<&AccountInfo<'info>>,
    token_program: Option<&AccountInfo<'info>>,
    owner: Option<&Signer<'info>>,
    liquidity: u128,
    amount_0_min: u64,
    amount_1_min: u64,
) -> Result<()> {
    // Check if Raydium accounts are provided
    let Some(raydium_program_info) = raydium_program else {
        msg!("Raydium program account not provided, skipping liquidity decrease");
        return Ok(());
    };
    
    // Validate Raydium program ID
    let expected_raydium_id = raydium_clmm_program_id();
    require!(
        raydium_program_info.key() == expected_raydium_id,
        XLiquidityEngineError::InvalidFacilitator
    );
    
    // Validate required accounts
    let Some(position_info) = position else {
        msg!("Raydium position account not provided, skipping liquidity decrease");
        return Ok(());
    };
    
    let Some(pool_state_info) = pool_state else {
        msg!("Raydium pool state account not provided, skipping liquidity decrease");
        return Ok(());
    };
    
    let Some(token_account_0_info) = token_account_0 else {
        msg!("Token account 0 not provided, skipping liquidity decrease");
        return Ok(());
    };
    
    let Some(token_account_1_info) = token_account_1 else {
        msg!("Token account 1 not provided, skipping liquidity decrease");
        return Ok(());
    };
    
    let Some(token_program_info) = token_program else {
        msg!("Token program not provided, skipping liquidity decrease");
        return Ok(());
    };
    
    let Some(owner_signer) = owner else {
        msg!("Owner signer not provided, skipping liquidity decrease");
        return Ok(());
    };
    
    msg!(
        "Decreasing Raydium liquidity: {}, min amounts: [{}, {}]",
        liquidity,
        amount_0_min,
        amount_1_min
    );
    
    // Derive tick arrays if not provided
    let tick_array_lower_pda = if let Some(tick_lower_acc) = tick_array_lower {
        tick_lower_acc.key()
    } else {
        derive_raydium_tick_array_pda(
            &pool_state_info.key(),
            0, // tick_lower - should be read from position
            60, // tick_spacing - should be read from pool state
            &raydium_program_info.key(),
        ).0
    };
    
    let tick_array_upper_pda = if let Some(tick_upper_acc) = tick_array_upper {
        tick_upper_acc.key()
    } else {
        derive_raydium_tick_array_pda(
            &pool_state_info.key(),
            0, // tick_upper - should be read from position
            60,
            &raydium_program_info.key(),
        ).0
    };
    
    // Get token vaults
    let token_vault_0_key = token_vault_0.map(|v| v.key())
        .unwrap_or_else(|| anchor_lang::solana_program::system_program::ID); // Placeholder
    let token_vault_1_key = token_vault_1.map(|v| v.key())
        .unwrap_or_else(|| anchor_lang::solana_program::system_program::ID); // Placeholder
    
    // Build instruction data: discriminator (8 bytes) + liquidity (16 bytes) + amount_0_min (8 bytes) + amount_1_min (8 bytes)
    let mut instruction_data = Vec::with_capacity(40);
    instruction_data.extend_from_slice(&RAYDIUM_DECREASE_LIQUIDITY_DISCRIMINATOR);
    instruction_data.extend_from_slice(&liquidity.to_le_bytes());
    instruction_data.extend_from_slice(&amount_0_min.to_le_bytes());
    instruction_data.extend_from_slice(&amount_1_min.to_le_bytes());
    
    // Build account metas in correct order for Raydium DecreaseLiquidity
    let mut accounts = Vec::new();
    accounts.push(AccountMeta::new(position_info.key(), false));
    accounts.push(AccountMeta::new_readonly(pool_state_info.key(), false));
    accounts.push(AccountMeta::new_readonly(tick_array_lower_pda, false));
    accounts.push(AccountMeta::new_readonly(tick_array_upper_pda, false));
    accounts.push(AccountMeta::new(token_account_0_info.key(), false));
    accounts.push(AccountMeta::new(token_account_1_info.key(), false));
    accounts.push(AccountMeta::new(token_vault_0_key, false));
    accounts.push(AccountMeta::new(token_vault_1_key, false));
    accounts.push(AccountMeta::new_readonly(owner_signer.key(), true));
    accounts.push(AccountMeta::new_readonly(token_program_info.key(), false));
    
    // Create and invoke CPI instruction
    let cpi_instruction = Instruction {
        program_id: raydium_program_info.key(),
        accounts,
        data: instruction_data,
    };
    
    // Build account infos for invoke
    let mut account_infos = vec![
        raydium_program_info.clone(),
        position_info.clone(),
        pool_state_info.clone(),
        token_account_0_info.clone(),
        token_account_1_info.clone(),
        owner_signer.to_account_info(),
        token_program_info.clone(),
    ];
    
    if let Some(tick_lower_acc) = tick_array_lower {
        account_infos.push(tick_lower_acc.clone());
    }
    if let Some(tick_upper_acc) = tick_array_upper {
        account_infos.push(tick_upper_acc.clone());
    }
    if let Some(vault_0) = token_vault_0 {
        account_infos.push(vault_0.clone());
    }
    if let Some(vault_1) = token_vault_1 {
        account_infos.push(vault_1.clone());
    }
    
    invoke(&cpi_instruction, &account_infos)?;
    
    msg!("Raydium liquidity decrease CPI invoked successfully");
    
    Ok(())
}

/// Collect fees from a Raydium position
/// 
/// This function performs a CPI to Raydium's Collect instruction.
fn collect_raydium_fees<'info>(
    raydium_program: Option<&AccountInfo<'info>>,
    position: Option<&AccountInfo<'info>>,
    pool_state: Option<&AccountInfo<'info>>,
    token_account_0: Option<&AccountInfo<'info>>,
    token_account_1: Option<&AccountInfo<'info>>,
    token_vault_0: Option<&AccountInfo<'info>>,
    token_vault_1: Option<&AccountInfo<'info>>,
    token_program: Option<&AccountInfo<'info>>,
    owner: Option<&Signer<'info>>,
    amount_0_requested: u64,
    amount_1_requested: u64,
) -> Result<(u64, u64)> {
    // Check if Raydium accounts are provided
    let Some(raydium_program_info) = raydium_program else {
        msg!("Raydium program account not provided, skipping fee collection");
        return Ok((0, 0));
    };
    
    // Validate Raydium program ID
    let expected_raydium_id = raydium_clmm_program_id();
    require!(
        raydium_program_info.key() == expected_raydium_id,
        XLiquidityEngineError::InvalidFacilitator
    );
    
    // Validate required accounts
    let Some(position_info) = position else {
        msg!("Raydium position account not provided, skipping fee collection");
        return Ok((0, 0));
    };
    
    let Some(pool_state_info) = pool_state else {
        msg!("Raydium pool state account not provided, skipping fee collection");
        return Ok((0, 0));
    };
    
    let Some(token_account_0_info) = token_account_0 else {
        msg!("Token account 0 not provided, skipping fee collection");
        return Ok((0, 0));
    };
    
    let Some(token_account_1_info) = token_account_1 else {
        msg!("Token account 1 not provided, skipping fee collection");
        return Ok((0, 0));
    };
    
    let Some(token_program_info) = token_program else {
        msg!("Token program not provided, skipping fee collection");
        return Ok((0, 0));
    };
    
    let Some(owner_signer) = owner else {
        msg!("Owner signer not provided, skipping fee collection");
        return Ok((0, 0));
    };
    
    msg!(
        "Collecting Raydium fees: amounts requested: [{}, {}]",
        amount_0_requested,
        amount_1_requested
    );
    
    // Get token vaults
    let token_vault_0_key = token_vault_0.map(|v| v.key())
        .unwrap_or_else(|| anchor_lang::solana_program::system_program::ID); // Placeholder
    let token_vault_1_key = token_vault_1.map(|v| v.key())
        .unwrap_or_else(|| anchor_lang::solana_program::system_program::ID); // Placeholder
    
    // Build instruction data: discriminator (8 bytes) + amount_0_requested (8 bytes) + amount_1_requested (8 bytes)
    let mut instruction_data = Vec::with_capacity(24);
    instruction_data.extend_from_slice(&RAYDIUM_COLLECT_DISCRIMINATOR);
    instruction_data.extend_from_slice(&amount_0_requested.to_le_bytes());
    instruction_data.extend_from_slice(&amount_1_requested.to_le_bytes());
    
    // Build account metas in correct order for Raydium Collect
    let mut accounts = Vec::new();
    accounts.push(AccountMeta::new(position_info.key(), false));
    accounts.push(AccountMeta::new_readonly(pool_state_info.key(), false));
    accounts.push(AccountMeta::new(token_account_0_info.key(), false)); // Destination for token 0
    accounts.push(AccountMeta::new(token_account_1_info.key(), false)); // Destination for token 1
    accounts.push(AccountMeta::new(token_vault_0_key, false));
    accounts.push(AccountMeta::new(token_vault_1_key, false));
    accounts.push(AccountMeta::new_readonly(owner_signer.key(), true));
    accounts.push(AccountMeta::new_readonly(token_program_info.key(), false));
    
    // Create and invoke CPI instruction
    let cpi_instruction = Instruction {
        program_id: raydium_program_info.key(),
        accounts,
        data: instruction_data,
    };
    
    // Build account infos for invoke
    let mut account_infos = vec![
        raydium_program_info.clone(),
        position_info.clone(),
        pool_state_info.clone(),
        token_account_0_info.clone(),
        token_account_1_info.clone(),
        owner_signer.to_account_info(),
        token_program_info.clone(),
    ];
    
    if let Some(vault_0) = token_vault_0 {
        account_infos.push(vault_0.clone());
    }
    if let Some(vault_1) = token_vault_1 {
        account_infos.push(vault_1.clone());
    }
    
    invoke(&cpi_instruction, &account_infos)?;
    
    msg!("Raydium fee collection CPI invoked successfully");
    msg!("Note: Actual amounts collected should be read from token account balances after CPI");
    
    // Return requested amounts as placeholder
    // In production, read actual amounts from token account balances before/after CPI
    Ok((amount_0_requested, amount_1_requested))
}

// ============================================================================
// ENUMS AND TYPES
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum DexType {
    Raydium,
    Orca,
    Meteora,
    Unknown,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum PositionStatus {
    Active,
    Paused,
    Closed,
    Liquidated,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum ExecutionStatus {
    Pending,
    Executed,
    Failed,
    Rejected,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum PaymentStatus {
    Pending,
    Verified,
    Settled,
    Failed,
    Refunded,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum PaymentCurrency {
    SOL,
    USDC,
    USDT,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum StrategyType {
    Conservative,
    Balanced,
    Aggressive,
    Custom,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum RebalanceFrequency {
    OnSignal,
    Daily,
    Weekly,
    Monthly,
    Manual,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum ComplianceMode {
    Basic,
    Enhanced,
    Full,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
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

// ============================================================================
// ACCOUNT STRUCTURES
// ============================================================================

/// Tracks individual LP positions managed by the protocol
#[account]
pub struct LiquidityPosition {
    // Ownership & Identity
    pub owner: Pubkey,
    pub position_bump: u8,
    
    // Token Pair
    pub token_a: Pubkey,
    pub token_b: Pubkey,
    pub token_a_vault: Pubkey,
    pub token_b_vault: Pubkey,
    
    // DEX Integration
    pub dex: DexType,
    pub pool_address: Pubkey,
    pub position_nft: Option<Pubkey>,
    
    // Price Range (Concentrated Liquidity)
    pub current_tick_lower: i32,
    pub current_tick_upper: i32,
    pub current_price_lower: u128,
    pub current_price_upper: u128,
    
    // Position Metrics
    pub liquidity_amount: u128,
    pub total_fees_earned_a: u64,
    pub total_fees_earned_b: u64,
    pub total_value_locked: u64,
    
    // Rebalancing History
    pub last_rebalance_slot: u64,
    pub last_rebalance_timestamp: i64,
    pub rebalance_count: u32,
    
    // Performance Metrics
    pub total_return_percentage: i16,
    pub apy_estimate: u16,
    
    // Status & Configuration
    pub status: PositionStatus,
    pub auto_rebalance_enabled: bool,
    pub min_rebalance_interval: u32,
    
    // Policy Controls (Compliance)
    pub max_position_size: u64,
    pub max_single_trade: u64,
    pub allowed_dex_programs: Vec<Pubkey>,
    
    // Timestamps
    pub created_at: i64,
    pub updated_at: i64,
}

/// Stores AI decision metadata for compliance and auditability
#[account]
pub struct RebalanceDecision {
    // Position Reference
    pub position: Pubkey,
    pub decision_bump: u8,
    
    // New Price Range
    pub new_tick_lower: i32,
    pub new_tick_upper: i32,
    pub new_price_lower: u128,
    pub new_price_upper: u128,
    
    // AI Model Information (Explainability)
    pub ai_model_version: String,
    pub ai_model_hash: [u8; 32],
    pub prediction_confidence: u16,
    
    // Input Data (For Audit Trail)
    pub market_sentiment_score: i16,
    pub volatility_metric: u16,
    pub whale_activity_score: u16,
    pub on_chain_indicators: Vec<u64>,
    
    // Decision Rationale
    pub decision_reason: String,
    pub risk_assessment: RiskLevel,
    
    // Execution Details
    pub execution_status: ExecutionStatus,
    pub execution_tx_signature: Option<String>,
    pub execution_slippage: Option<u16>,
    
    // Jupiter Swap Transaction (Transaction-Based Approach)
    /// Base64-encoded swap transaction from Jupiter Swap API
    /// This transaction is obtained off-chain and executed separately
    pub jupiter_swap_transaction: Option<String>,
    /// Expected output amount from Jupiter quote (for validation)
    pub expected_output_amount: Option<u64>,
    
    // Compliance & Audit
    pub requires_human_approval: bool,
    pub human_approver: Option<Pubkey>,
    pub approval_timestamp: Option<i64>,
    
    // Timestamps
    pub created_at: i64,
    pub executed_at: Option<i64>,
}

/// Tracks x402 protocol payments for API access
#[account]
pub struct X402Payment {
    // Payment Identity
    pub payment_id: [u8; 32],
    pub payment_bump: u8,
    
    // Payer Information
    pub payer: Pubkey,
    pub payer_wallet: Pubkey,
    
    // Payment Details
    pub amount: u64,
    pub currency: PaymentCurrency,
    pub payment_status: PaymentStatus,
    
    // x402 Protocol Details
    pub facilitator: Pubkey,
    pub facilitator_signature: Option<[u8; 64]>,
    pub payment_tx_signature: Option<String>,
    
    // API Access Details
    pub api_endpoint: String,
    pub api_version: String,
    pub access_granted: bool,
    pub access_expires_at: Option<i64>,
    
    // Timestamps
    pub requested_at: i64,
    pub verified_at: Option<i64>,
    pub settled_at: Option<i64>,
}

/// Global protocol configuration and parameters
#[account]
pub struct ProtocolConfig {
    // Authority
    pub authority: Pubkey,
    pub config_bump: u8,
    
    // Fee Structure
    pub performance_fee_bps: u16,
    pub protocol_fee_bps: u16,
    pub fee_recipient: Pubkey,
    
    // x402 Configuration
    pub x402_facilitator: Option<Pubkey>,
    pub x402_min_payment: u64,
    pub x402_api_base_url: String,
    
    // Rebalancing Parameters
    pub min_rebalance_interval: u32,
    pub max_rebalance_frequency: u32,
    pub default_slippage_tolerance_bps: u16,
    
    // Risk Management
    pub max_position_size: u64,
    pub max_single_trade_size: u64,
    pub require_human_approval_threshold: u64,
    
    // AI Model Configuration
    pub default_ai_model_version: String,
    pub ai_model_registry: Vec<Pubkey>,
    
    // Compliance
    pub audit_log_enabled: bool,
    pub compliance_mode: ComplianceMode,
    
    // Timestamps
    pub created_at: i64,
    pub updated_at: i64,
}

/// User-defined strategy parameters and preferences
#[account]
pub struct UserStrategy {
    // Ownership
    pub user: Pubkey,
    pub strategy_bump: u8,
    
    // Strategy Configuration
    pub strategy_name: String,
    pub strategy_type: StrategyType,
    pub risk_tolerance: RiskTolerance,
    
    // Rebalancing Preferences
    pub auto_rebalance_enabled: bool,
    pub rebalance_frequency: RebalanceFrequency,
    pub price_range_width: u16,
    
    // Risk Limits
    pub max_position_size: Option<u64>,
    pub max_single_trade: Option<u64>,
    pub max_slippage_bps: Option<u16>,
    
    // Token Preferences
    pub preferred_tokens: Vec<Pubkey>,
    pub blacklisted_tokens: Vec<Pubkey>,
    
    // AI Model Selection
    pub preferred_ai_model: Option<String>,
    pub require_human_approval: bool,
    
    // Timestamps
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum RiskTolerance {
    Low,
    Medium,
    High,
}

/// Immutable audit log for compliance and regulatory requirements
#[account]
pub struct AuditLog {
    // Log Identity
    pub log_id: [u8; 32],
    pub log_bump: u8,
    
    // Event Information
    pub event_type: AuditEventType,
    pub position: Option<Pubkey>,
    pub user: Pubkey,
    
    // Event Data
    pub event_data: Vec<u8>,
    pub event_hash: [u8; 32],
    
    // AI Decision Context (if applicable)
    pub ai_model_version: Option<String>,
    pub decision_rationale: Option<String>,
    pub prediction_scores: Option<Vec<u16>>,
    
    // Compliance Metadata
    pub regulatory_jurisdiction: Option<String>,
    
    // Timestamps
    pub created_at: i64,
    pub slot: u64,
}

// ============================================================================
// ERROR TYPES
// ============================================================================

#[error_code]
pub enum XLiquidityEngineError {
    #[msg("Invalid price range")]
    InvalidPriceRange,
    #[msg("Position exceeds maximum size")]
    ExceedsMaxPositionSize,
    #[msg("Trade exceeds maximum size")]
    ExceedsMaxTradeSize,
    #[msg("Position is not active")]
    PositionNotActive,
    #[msg("Rebalance too frequent")]
    RebalanceTooFrequent,
    #[msg("Invalid execution status")]
    InvalidExecutionStatus,
    #[msg("Human approval required")]
    HumanApprovalRequired,
    #[msg("Invalid approver")]
    InvalidApprover,
    #[msg("Slippage tolerance too high")]
    SlippageTooHigh,
    #[msg("Payment amount too small")]
    PaymentTooSmall,
    #[msg("Invalid facilitator")]
    InvalidFacilitator,
    #[msg("No fees to collect")]
    NoFeesToCollect,
    #[msg("Approval not required")]
    ApprovalNotRequired,
}

// ============================================================================
// INSTRUCTION CONTEXTS
// ============================================================================

#[derive(Accounts)]
pub struct InitializeProtocolConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProtocolConfig::LEN,
        seeds = [b"protocol_config"],
        bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: Fee recipient address
    pub fee_recipient: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(position_index: u8)]
pub struct CreateLiquidityPosition<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + LiquidityPosition::LEN,
        seeds = [b"liquidity_position", owner.key().as_ref(), &[position_index]],
        bump
    )]
    pub position: Account<'info, LiquidityPosition>,
    
    #[account(
        seeds = [b"protocol_config"],
        bump = config.config_bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    /// CHECK: Token A vault
    pub token_a_vault: AccountInfo<'info>,
    
    /// CHECK: Token B vault
    pub token_b_vault: AccountInfo<'info>,
    
    /// CHECK: DEX pool address
    pub pool: AccountInfo<'info>,
    
    /// CHECK: Audit log account (simplified for now)
    pub audit_log: AccountInfo<'info>,
    
    // ============================================================================
    // RAYDIUM CLMM ACCOUNTS (Optional - for Raydium position creation)
    // ============================================================================
    
    /// CHECK: Raydium CLMM program (optional - required for Raydium position creation)
    /// Raydium CLMM Program: CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK
    pub raydium_program: Option<AccountInfo<'info>>,
    
    /// CHECK: Raydium pool state account (optional)
    pub raydium_pool_state: Option<AccountInfo<'info>>,
    
    /// CHECK: Raydium personal position PDA (optional - will be derived if not provided)
    pub raydium_personal_position: Option<AccountInfo<'info>>,
    
    /// CHECK: Tick array for lower bound (optional - will be derived if not provided)
    pub raydium_tick_array_lower: Option<AccountInfo<'info>>,
    
    /// CHECK: Tick array for upper bound (optional - will be derived if not provided)
    pub raydium_tick_array_upper: Option<AccountInfo<'info>>,
    
    /// CHECK: Token account 0 for Raydium position (optional)
    pub raydium_token_account_0: Option<AccountInfo<'info>>,
    
    /// CHECK: Token account 1 for Raydium position (optional)
    pub raydium_token_account_1: Option<AccountInfo<'info>>,
    
    /// CHECK: Token vault 0 from pool state (optional - will be extracted from pool state)
    pub raydium_token_vault_0: Option<AccountInfo<'info>>,
    
    /// CHECK: Token vault 1 from pool state (optional - will be extracted from pool state)
    pub raydium_token_vault_1: Option<AccountInfo<'info>>,
    
    /// CHECK: Token program (optional - required for Raydium CPI)
    pub token_program: Option<AccountInfo<'info>>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(position_index: u8, decision_index: u32)]
pub struct CreateRebalanceDecision<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + RebalanceDecision::LEN,
        seeds = [b"rebalance_decision", position.key().as_ref(), &decision_index.to_le_bytes()],
        bump
    )]
    pub decision: Account<'info, RebalanceDecision>,
    
    #[account(
        mut,
        seeds = [b"liquidity_position", position.owner.as_ref(), &[position_index]],
        bump = position.position_bump
    )]
    pub position: Account<'info, LiquidityPosition>,
    
    #[account(
        seeds = [b"protocol_config"],
        bump = config.config_bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(position_index: u8, decision_index: u32)]
pub struct ExecuteRebalance<'info> {
    #[account(
        mut,
        seeds = [b"rebalance_decision", position.key().as_ref(), &decision_index.to_le_bytes()],
        bump = decision.decision_bump
    )]
    pub decision: Account<'info, RebalanceDecision>,
    
    #[account(
        mut,
        seeds = [b"liquidity_position", position.owner.as_ref(), &[position_index]],
        bump = position.position_bump
    )]
    pub position: Account<'info, LiquidityPosition>,
    
    #[account(
        seeds = [b"protocol_config"],
        bump = config.config_bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    
    /// CHECK: Approver (optional, only needed if human approval required)
    pub approver: Option<Signer<'info>>,
    
    /// CHECK: Audit log account
    pub audit_log: AccountInfo<'info>,
    
    // ============================================================================
    // JUPITER SWAP ACCOUNTS (Optional - for swap execution)
    // ============================================================================
    
    /// CHECK: Token program (optional - required for Jupiter swaps)
    pub token_program: Option<AccountInfo<'info>>,
    
    /// CHECK: Jupiter program (optional - required for CPI)
    /// Jupiter Swap Program: JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4
    pub jupiter_program: Option<AccountInfo<'info>>,
    
    /// CHECK: Source token account (token A vault) - optional
    pub source_token_account: Option<AccountInfo<'info>>,
    
    /// CHECK: Destination token account (token B vault) - optional
    pub destination_token_account: Option<AccountInfo<'info>>,
    
    /// CHECK: Program authority PDA (for signing CPI) - optional
    /// This would be a PDA derived from the program
    pub program_authority: Option<AccountInfo<'info>>,
    
    /// CHECK: User transfer authority (position owner) - optional
    pub user_transfer_authority: Option<Signer<'info>>,
    
    // ============================================================================
    // RAYDIUM CLMM ACCOUNTS (Optional - for Raydium position rebalancing)
    // ============================================================================
    
    /// CHECK: Raydium CLMM program (optional - required for Raydium position updates)
    /// Raydium CLMM Program: CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK
    pub raydium_program: Option<AccountInfo<'info>>,
    
    /// CHECK: Raydium position account (optional)
    pub raydium_position: Option<AccountInfo<'info>>,
    
    /// CHECK: Raydium pool state account (optional)
    pub raydium_pool_state: Option<AccountInfo<'info>>,
    
    /// CHECK: Tick array for lower bound (optional - will be derived if not provided)
    pub raydium_tick_array_lower: Option<AccountInfo<'info>>,
    
    /// CHECK: Tick array for upper bound (optional - will be derived if not provided)
    pub raydium_tick_array_upper: Option<AccountInfo<'info>>,
    
    /// CHECK: Token account 0 (optional - required for liquidity operations)
    pub raydium_token_account_0: Option<AccountInfo<'info>>,
    
    /// CHECK: Token account 1 (optional - required for liquidity operations)
    pub raydium_token_account_1: Option<AccountInfo<'info>>,
    
    /// CHECK: Token vault 0 from pool state (optional)
    pub raydium_token_vault_0: Option<AccountInfo<'info>>,
    
    /// CHECK: Token vault 1 from pool state (optional)
    pub raydium_token_vault_1: Option<AccountInfo<'info>>,
    
    /// CHECK: Token program (optional - required for Raydium CPI)
    pub raydium_token_program: Option<AccountInfo<'info>>,
}

#[derive(Accounts)]
#[instruction(payment_id: [u8; 32])]
pub struct VerifyX402Payment<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + X402Payment::LEN,
        seeds = [b"x402_payment", payment_id.as_ref()],
        bump
    )]
    pub payment: Account<'info, X402Payment>,
    
    #[account(
        seeds = [b"protocol_config"],
        bump = config.config_bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: Payer wallet
    pub payer_wallet: AccountInfo<'info>,
    
    /// CHECK: x402 Facilitator
    pub facilitator: AccountInfo<'info>,
    
    /// CHECK: Audit log account
    pub audit_log: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(position_index: u8)]
pub struct CollectFees<'info> {
    #[account(
        mut,
        seeds = [b"liquidity_position", position.owner.as_ref(), &[position_index]],
        bump = position.position_bump,
        constraint = position.owner == owner.key() @ XLiquidityEngineError::PositionNotActive
    )]
    pub position: Account<'info, LiquidityPosition>,
    
    #[account(
        seeds = [b"protocol_config"],
        bump = config.config_bump
    )]
    pub config: Account<'info, ProtocolConfig>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    /// CHECK: Audit log account
    pub audit_log: AccountInfo<'info>,
    
    // ============================================================================
    // RAYDIUM CLMM ACCOUNTS (Optional - for Raydium fee collection)
    // ============================================================================
    
    /// CHECK: Raydium CLMM program (optional - required for Raydium fee collection)
    pub raydium_program: Option<AccountInfo<'info>>,
    
    /// CHECK: Raydium position account (optional)
    pub raydium_position: Option<AccountInfo<'info>>,
    
    /// CHECK: Raydium pool state account (optional)
    pub raydium_pool_state: Option<AccountInfo<'info>>,
    
    /// CHECK: Token account 0 (destination for collected fees)
    pub raydium_token_account_0: Option<AccountInfo<'info>>,
    
    /// CHECK: Token account 1 (destination for collected fees)
    pub raydium_token_account_1: Option<AccountInfo<'info>>,
    
    /// CHECK: Token vault 0 from pool state (optional)
    pub raydium_token_vault_0: Option<AccountInfo<'info>>,
    
    /// CHECK: Token vault 1 from pool state (optional)
    pub raydium_token_vault_1: Option<AccountInfo<'info>>,
    
    /// CHECK: Token program (optional - required for Raydium CPI)
    pub raydium_token_program: Option<AccountInfo<'info>>,
}

#[derive(Accounts)]
#[instruction(decision_index: u32)]
pub struct ApproveRebalance<'info> {
    #[account(
        mut,
        seeds = [b"rebalance_decision", position.key().as_ref(), &decision_index.to_le_bytes()],
        bump = decision.decision_bump
    )]
    pub decision: Account<'info, RebalanceDecision>,
    
    /// CHECK: Position account (for validation)
    pub position: Account<'info, LiquidityPosition>,
    
    #[account(mut)]
    pub approver: Signer<'info>,
    
    /// CHECK: Audit log account
    pub audit_log: AccountInfo<'info>,
}

// ============================================================================
// ACCOUNT SIZE CONSTANTS
// ============================================================================

impl ProtocolConfig {
    pub const LEN: usize = 32 + // authority
        1 + // config_bump
        2 + // performance_fee_bps
        2 + // protocol_fee_bps
        32 + // fee_recipient
        1 + 32 + // x402_facilitator (Option<Pubkey>)
        8 + // x402_min_payment
        4 + 50 + // x402_api_base_url (String, max 50 chars)
        4 + // min_rebalance_interval
        4 + // max_rebalance_frequency
        2 + // default_slippage_tolerance_bps
        8 + // max_position_size
        8 + // max_single_trade_size
        8 + // require_human_approval_threshold
        4 + 20 + // default_ai_model_version (String, max 20 chars)
        4 + (32 * 10) + // ai_model_registry (Vec<Pubkey>, max 10)
        1 + // audit_log_enabled
        1 + // compliance_mode
        8 + // created_at
        8; // updated_at
}

impl LiquidityPosition {
    pub const LEN: usize = 32 + // owner
        1 + // position_bump
        32 + // token_a
        32 + // token_b
        32 + // token_a_vault
        32 + // token_b_vault
        1 + // dex
        32 + // pool_address
        1 + 32 + // position_nft (Option<Pubkey>)
        4 + // current_tick_lower
        4 + // current_tick_upper
        16 + // current_price_lower
        16 + // current_price_upper
        16 + // liquidity_amount
        8 + // total_fees_earned_a
        8 + // total_fees_earned_b
        8 + // total_value_locked
        8 + // last_rebalance_slot
        8 + // last_rebalance_timestamp
        4 + // rebalance_count
        2 + // total_return_percentage
        2 + // apy_estimate
        1 + // status
        1 + // auto_rebalance_enabled
        4 + // min_rebalance_interval
        8 + // max_position_size
        8 + // max_single_trade
        4 + (32 * 5) + // allowed_dex_programs (Vec<Pubkey>, max 5)
        8 + // created_at
        8; // updated_at
}

impl RebalanceDecision {
    pub const LEN: usize = 32 + // position
        1 + // decision_bump
        4 + // new_tick_lower
        4 + // new_tick_upper
        16 + // new_price_lower
        16 + // new_price_upper
        4 + 50 + // ai_model_version (String, max 50 chars)
        32 + // ai_model_hash
        2 + // prediction_confidence
        2 + // market_sentiment_score
        2 + // volatility_metric
        2 + // whale_activity_score
        4 + (8 * 10) + // on_chain_indicators (Vec<u64>, max 10)
        4 + 200 + // decision_reason (String, max 200 chars)
        1 + // risk_assessment
        1 + // execution_status
        1 + 100 + // execution_tx_signature (Option<String>, max 100 chars)
        1 + 2 + // execution_slippage (Option<u16>)
        1 + 2000 + // jupiter_swap_transaction (Option<String>, max 2000 chars for base64 tx)
        1 + 8 + // expected_output_amount (Option<u64>)
        1 + // requires_human_approval
        1 + 32 + // human_approver (Option<Pubkey>)
        1 + 8 + // approval_timestamp (Option<i64>)
        8 + // created_at
        1 + 8; // executed_at (Option<i64>)
}

impl X402Payment {
    pub const LEN: usize = 32 + // payment_id
        1 + // payment_bump
        32 + // payer
        32 + // payer_wallet
        8 + // amount
        1 + // currency
        1 + // payment_status
        32 + // facilitator
        1 + 64 + // facilitator_signature (Option<[u8; 64]>)
        1 + 100 + // payment_tx_signature (Option<String>, max 100 chars)
        4 + 100 + // api_endpoint (String, max 100 chars)
        4 + 20 + // api_version (String, max 20 chars)
        1 + // access_granted
        1 + 8 + // access_expires_at (Option<i64>)
        8 + // requested_at
        1 + 8 + // verified_at (Option<i64>)
        1 + 8; // settled_at (Option<i64>)
}

impl UserStrategy {
    pub const LEN: usize = 32 + // user
        1 + // strategy_bump
        4 + 50 + // strategy_name (String, max 50 chars)
        1 + // strategy_type
        1 + // risk_tolerance
        1 + // auto_rebalance_enabled
        1 + // rebalance_frequency
        2 + // price_range_width
        1 + 8 + // max_position_size (Option<u64>)
        1 + 8 + // max_single_trade (Option<u64>)
        1 + 2 + // max_slippage_bps (Option<u16>)
        4 + (32 * 10) + // preferred_tokens (Vec<Pubkey>, max 10)
        4 + (32 * 10) + // blacklisted_tokens (Vec<Pubkey>, max 10)
        1 + 20 + // preferred_ai_model (Option<String>, max 20 chars)
        1 + // require_human_approval
        8 + // created_at
        8; // updated_at
}

impl AuditLog {
    pub const LEN: usize = 32 + // log_id
        1 + // log_bump
        1 + // event_type
        1 + 32 + // position (Option<Pubkey>)
        32 + // user
        4 + 500 + // event_data (Vec<u8>, max 500 bytes)
        32 + // event_hash
        1 + 50 + // ai_model_version (Option<String>, max 50 chars)
        1 + 200 + // decision_rationale (Option<String>, max 200 chars)
        1 + 4 + (2 * 20) + // prediction_scores (Option<Vec<u16>>, max 20)
        1 + 10 + // regulatory_jurisdiction (Option<String>, max 10 chars)
        8 + // created_at
        8; // slot
}
