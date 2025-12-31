// Test setup file
// Set NODE_ENV to test to prevent server from starting
process.env.NODE_ENV = 'test';
process.env.SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
process.env.PAYMENT_PROGRAM_ID = process.env.PAYMENT_PROGRAM_ID || '84zwY58ivSmpGY8gsenAc2c4XpwBUyh1thF9XXx3LhfD';
process.env.TREASURY_WALLET = process.env.TREASURY_WALLET || 'AmSYugrtHAEZi3TDj3HP7qbjY1hw6uv1df1oFDMxKeb1';

