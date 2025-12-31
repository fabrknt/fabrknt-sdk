use anchor_lang::prelude::*;

declare_id!("84zwY58ivSmpGY8gsenAc2c4XpwBUyh1thF9XXx3LhfD");

#[program]
pub mod risk {
    use super::*;

    /// Initialize the payment gateway
    pub fn initialize(ctx: Context<Initialize>, fee: u64) -> Result<()> {
        let gateway = &mut ctx.accounts.gateway;
        gateway.authority = ctx.accounts.authority.key();
        gateway.fee = fee;
        gateway.bump = ctx.bumps.gateway;
        Ok(())
    }

    /// Process a payment for API access
    pub fn process_payment(
        ctx: Context<ProcessPayment>,
        amount: u64,
        nonce: u64,
    ) -> Result<()> {
        let gateway = &ctx.accounts.gateway;
        
        // Verify payment amount meets minimum fee
        require!(
            amount >= gateway.fee,
            ErrorCode::InsufficientPayment
        );

        // Transfer USDC from user to gateway treasury
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.treasury_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        // Emit payment event
        emit!(PaymentProcessed {
            user: ctx.accounts.user.key(),
            amount,
            nonce,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Update gateway fee (authority only)
    pub fn update_fee(ctx: Context<UpdateFee>, new_fee: u64) -> Result<()> {
        let gateway = &mut ctx.accounts.gateway;
        gateway.fee = new_fee;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Gateway::LEN,
        seeds = [b"gateway"],
        bump
    )]
    pub gateway: Account<'info, Gateway>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ProcessPayment<'info> {
    #[account(
        seeds = [b"gateway"],
        bump = gateway.bump
    )]
    pub gateway: Account<'info, Gateway>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, anchor_spl::token::TokenAccount>,
    
    #[account(mut)]
    pub treasury_token_account: Account<'info, anchor_spl::token::TokenAccount>,
    
    pub token_program: Program<'info, anchor_spl::token::Token>,
}

#[derive(Accounts)]
pub struct UpdateFee<'info> {
    #[account(
        seeds = [b"gateway"],
        bump = gateway.bump,
        has_one = authority @ ErrorCode::Unauthorized
    )]
    pub gateway: Account<'info, Gateway>,
    
    pub authority: Signer<'info>,
}

#[account]
pub struct Gateway {
    pub authority: Pubkey,
    pub fee: u64, // Fee in USDC (with 6 decimals)
    pub bump: u8,
}

impl Gateway {
    pub const LEN: usize = 32 + 8 + 1;
}

#[event]
pub struct PaymentProcessed {
    pub user: Pubkey,
    pub amount: u64,
    pub nonce: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient payment amount")]
    InsufficientPayment,
    #[msg("Unauthorized")]
    Unauthorized,
}

