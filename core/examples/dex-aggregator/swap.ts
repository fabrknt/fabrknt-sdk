/**
 * DEX Aggregator Example
 *
 * Demonstrates optimal swap routing using fabrknt's SwapPattern and Jupiter integration.
 * This example shows a SOL -> USDC swap finding the best rate across multiple DEXs.
 */

import { SwapPattern, Guard, COMMON_TOKENS } from '@fabrknt/sdk';
import type { Token, SwapRoute } from '@fabrknt/sdk';

async function executeSwap() {
  console.log('🔄 DEX Aggregator Swap...\n');

  // Swap parameters
  const inputToken: Token = COMMON_TOKENS.SOL;
  const outputToken: Token = COMMON_TOKENS.USDC;
  const inputAmount = 100; // 100 SOL

  console.log(`Swapping ${inputAmount} ${inputToken.symbol} → ${outputToken.symbol}\n`);

  // Simulated price quotes from different DEXs
  // In production: Fetch real quotes via Jupiter API
  const quotes = [
    {
      dex: 'Orca',
      outputAmount: 9850,
      priceImpact: 0.015,
      fee: 0.003,
    },
    {
      dex: 'Raydium',
      outputAmount: 9875,
      priceImpact: 0.012,
      fee: 0.0025,
    },
    {
      dex: 'Jupiter',
      outputAmount: 9920, // Best rate (aggregated route)
      priceImpact: 0.008,
      fee: 0.002,
    },
  ];

  console.log('📊 Price Comparison:');
  quotes.forEach(quote => {
    const rate = quote.outputAmount / inputAmount;
    console.log(`   ${quote.dex}:`);
    console.log(`     Output: ${quote.outputAmount.toLocaleString()} USDC`);
    console.log(`     Rate: ${rate.toFixed(2)} USDC per SOL`);
    console.log(`     Price Impact: ${(quote.priceImpact * 100).toFixed(2)}%`);
    console.log(`     Fee: ${(quote.fee * 100).toFixed(2)}%`);
  });

  // Find best quote
  const bestQuote = quotes.reduce((best, current) =>
    current.outputAmount > best.outputAmount ? current : best
  );

  const savings = bestQuote.outputAmount - Math.min(...quotes.map(q => q.outputAmount));

  console.log(`\n✨ Best Route: ${bestQuote.dex}`);
  console.log(`   Savings: ${savings.toLocaleString()} USDC (${(savings / bestQuote.outputAmount * 100).toFixed(2)}%)\n`);

  // Create Guard for security validation
  const guard = new Guard({
    mode: 'block',
    maxSlippage: 0.01,        // 1% max slippage
    riskTolerance: 'moderate',
  });

  // Create swap pattern
  const swap = new SwapPattern({
    name: 'SOL → USDC Swap',
    inputToken,
    outputToken,
    inputAmount,
    minOutputAmount: bestQuote.outputAmount * 0.99, // 1% slippage tolerance
    guard,
    enableRealDEX: false,     // Set to true for real Jupiter V6 integration
    dryRun: process.env.DRY_RUN === 'true',
  });

  try {
    console.log('⚡ Executing swap...\n');

    const result = await swap.execute();

    // Display results
    console.log('✅ Swap completed!\n');
    console.log('Execution Summary:');
    console.log('- Input:', inputAmount, inputToken.symbol);
    console.log('- Output:', result.metadata?.actualOutput || bestQuote.outputAmount, outputToken.symbol);
    console.log('- Route:', result.metadata?.route || bestQuote.dex);
    console.log('- Price Impact:', (bestQuote.priceImpact * 100).toFixed(2) + '%');
    console.log('- Gas cost:', result.metrics.actualCost, 'SOL');
    console.log('- Duration:', result.metrics.duration, 'ms\n');

    // Display transaction hash
    if (result.transactions.length > 0) {
      console.log('Transaction:');
      console.log(`  Hash: ${result.transactions[0].id}`);
      console.log();
    }

    // Calculate effective rate
    const effectiveRate = (result.metadata?.actualOutput || bestQuote.outputAmount) / inputAmount;
    console.log(`📊 Effective Rate: ${effectiveRate.toFixed(2)} USDC per SOL`);

    // Compare to market rate (simulated)
    const marketRate = 99; // $99 per SOL
    const execution = ((effectiveRate / marketRate - 1) * 100).toFixed(3);
    console.log(`   Execution Quality: ${execution}% ${parseFloat(execution) >= 0 ? '✅' : '⚠️'}`);

  } catch (error) {
    console.error('❌ Swap failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  executeSwap()
    .then(() => {
      console.log('\n✅ Swap process complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Swap process failed:', error);
      process.exit(1);
    });
}

export { executeSwap };
