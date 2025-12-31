/**
 * Swap Pattern Example
 *
 * This example demonstrates multi-route swap optimization with
 * intelligent order splitting to minimize price impact.
 */

import { SwapPattern, Guard } from '../../src';

async function main() {
  // Configure Guard with tight slippage
  const guard = new Guard({
    mode: 'block',
    maxSlippage: 0.01, // 1% max slippage
    riskTolerance: 'moderate',
  });

  // Define available swap routes
  const routes = [
    {
      dex: 'Orca',
      programId: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
      price: 100.5, // Slightly higher price
      liquidity: 500000, // High liquidity
      priceImpact: 0.15, // Low price impact
      fee: 0.003, // 0.3% fee
    },
    {
      dex: 'Raydium',
      programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
      price: 100.2,
      liquidity: 300000, // Medium liquidity
      priceImpact: 0.25, // Medium price impact
      fee: 0.0025, // 0.25% fee
    },
    {
      dex: 'Jupiter',
      programId: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
      price: 99.8, // Lower price
      liquidity: 200000, // Lower liquidity
      priceImpact: 0.35, // Higher price impact
      fee: 0.002, // 0.2% fee
    },
  ];

  // Create swap pattern
  const swapPattern = new SwapPattern({
    name: 'Optimized SOL to USDC Swap',
    fromToken: {
      mint: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      decimals: 9,
    },
    toToken: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      decimals: 6,
    },
    amount: 100, // Swap 100 SOL
    currentPrice: {
      token: 'SOL',
      price: 100,
      quoteCurrency: 'USDC',
      timestamp: Date.now(),
    },
    routes,
    maxPriceImpact: 0.5, // Max 0.5% price impact
    enableSplitOrders: true, // Enable intelligent splitting
    minRouteAllocation: 10, // Minimum 10% per route
    guard,
    dryRun: true,
  });

  console.log('\n💱 Swap Configuration:');
  console.log('━'.repeat(70));
  console.log(`Swap: ${swapPattern.config.amount} ${swapPattern.config.fromToken.symbol}`);
  console.log(`To: ${swapPattern.config.toToken.symbol}`);
  console.log(`Current Price: $${swapPattern.config.currentPrice.price}`);
  console.log(`Max Price Impact: ${swapPattern.config.maxPriceImpact}%`);
  console.log(`Split Orders: ${swapPattern.config.enableSplitOrders ? 'Enabled' : 'Disabled'}`);

  console.log('\n📊 Available Routes:');
  routes.forEach((route, index) => {
    const netPrice = route.price * (1 - route.fee - route.priceImpact / 100);
    console.log(`\n  ${index + 1}. ${route.dex}`);
    console.log(`     Price: $${route.price.toFixed(2)}`);
    console.log(`     Fee: ${(route.fee * 100).toFixed(2)}%`);
    console.log(`     Price Impact: ${route.priceImpact.toFixed(2)}%`);
    console.log(`     Liquidity: $${route.liquidity.toLocaleString()}`);
    console.log(`     Net Price: $${netPrice.toFixed(2)}`);
  });

  // Execute swap
  console.log('\n🚀 Executing Optimized Swap (Dry Run)...\n');
  const result = await swapPattern.execute();

  if (result.success) {
    console.log('✅ Swap Executed Successfully!');

    // Get execution summary
    const summary = swapPattern.getSummary();

    console.log('\n📈 Execution Summary:');
    console.log('━'.repeat(70));
    console.log(`Routes Used: ${summary.routes.length}`);
    console.log(`Total Price Impact: ${summary.totalPriceImpact.toFixed(3)}%`);
    console.log(`Average Execution Price: $${summary.averagePrice.toFixed(2)}`);
    console.log(`Execution Time: ${result.metrics.executionTime}ms`);

    console.log('\n💼 Route Allocations:');
    summary.routes.forEach(route => {
      console.log(`  • ${route.dex}:`);
      console.log(`     Amount: ${route.amount.toFixed(2)} SOL (${route.percentage.toFixed(1)}%)`);
      console.log(`     Price Impact: ${route.priceImpact.toFixed(3)}%`);
    });

    // Calculate expected output
    const expectedOutput = swapPattern.config.amount * summary.averagePrice;
    const withoutSplitting = swapPattern.config.amount * routes[0].price;
    const saved = withoutSplitting - expectedOutput;

    console.log('\n💰 Financial Impact:');
    console.log('━'.repeat(70));
    console.log(`Expected Output: ${expectedOutput.toFixed(2)} USDC`);
    console.log(`Best Single Route: ${withoutSplitting.toFixed(2)} USDC`);
    console.log(`${saved > 0 ? 'Loss Avoided' : 'Savings'}: $${Math.abs(saved).toFixed(2)}`);
    console.log(
      `Price Impact Reduction: ${(routes[0].priceImpact - summary.totalPriceImpact).toFixed(3)}%`
    );

    console.log('\n📊 Transaction Details:');
    result.transactions.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.metadata?.route}`);
      console.log(`     Amount: ${tx.metadata?.amount} SOL`);
      console.log(`     Expected Price: $${tx.metadata?.expectedPrice}`);
      console.log(`     Price Impact: ${tx.metadata?.priceImpact}%`);
      console.log(`     Fee: ${(tx.metadata?.fee * 100).toFixed(2)}%`);
    });

    console.log('\n\n📝 Optimization Benefits:');
    console.log('  ✓ Reduced price impact through order splitting');
    console.log('  ✓ Liquidity aggregation across multiple DEXs');
    console.log('  ✓ Automatic route selection based on execution quality');
    console.log('  ✓ Guard validation for security');

    console.log('\n💡 Next Steps:');
    console.log('  1. Review route allocations');
    console.log('  2. Adjust maxPriceImpact if needed');
    console.log('  3. Set dryRun: false to execute on-chain');
  } else {
    console.error('❌ Swap Failed:', result.error?.message);
  }

  // Example: Disable order splitting
  console.log('\n\n📌 Comparison: Single Route vs Multi-Route');
  console.log('━'.repeat(70));

  const singleRoutePattern = new SwapPattern({
    ...swapPattern.config,
    enableSplitOrders: false,
    dryRun: true,
  });

  const singleResult = await singleRoutePattern.execute();
  const singleSummary = singleRoutePattern.getSummary();

  console.log('\nSingle Route:');
  console.log(`  DEX: ${singleSummary.routes[0].dex}`);
  console.log(`  Price Impact: ${singleSummary.totalPriceImpact.toFixed(3)}%`);
  console.log(`  Average Price: $${singleSummary.averagePrice.toFixed(2)}`);

  console.log('\nMulti-Route (Split Orders):');
  const multiSummary = swapPattern.getSummary();
  console.log(`  DEXs: ${multiSummary.routes.map(r => r.dex).join(', ')}`);
  console.log(`  Price Impact: ${multiSummary.totalPriceImpact.toFixed(3)}%`);
  console.log(`  Average Price: $${multiSummary.averagePrice.toFixed(2)}`);

  const improvement = singleSummary.totalPriceImpact - multiSummary.totalPriceImpact;
  console.log(`\n✨ Improvement: ${improvement.toFixed(3)}% less price impact with multi-route`);
}

// Run example
main().catch(console.error);
