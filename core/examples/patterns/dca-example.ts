/**
 * Dollar Cost Averaging (DCA) Example
 *
 * This example shows how to set up an automated DCA strategy
 * to accumulate SOL over time with weekly purchases.
 */

import { DCAStrategy, Guard } from '../../src';

async function main() {
  // Configure Guard
  const guard = new Guard({
    mode: 'block',
    maxSlippage: 0.03, // 3% max slippage (higher for DCA)
    riskTolerance: 'moderate',
  });

  // Create DCA strategy
  const dcaStrategy = new DCAStrategy({
    name: 'Weekly SOL Accumulation',
    buyToken: {
      mint: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      decimals: 9,
    },
    payToken: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      decimals: 6,
    },
    amountPerInterval: 100, // $100 per purchase
    intervalDuration: 7 * 24 * 60 * 60 * 1000, // Weekly
    totalIntervals: 52, // 1 year
    autoExecute: false, // Manual execution for this example
    currentPrice: {
      token: 'SOL',
      price: 100,
      quoteCurrency: 'USDC',
      timestamp: Date.now(),
    },
    guard,
    dryRun: true,
  });

  // Display strategy details
  console.log('\n💰 DCA Strategy Setup:');
  console.log('━'.repeat(50));
  console.log(`Strategy: ${dcaStrategy.config.name}`);
  console.log(`Buy: ${dcaStrategy.config.buyToken.symbol}`);
  console.log(`Pay with: ${dcaStrategy.config.payToken.symbol}`);
  console.log(`Amount per interval: $${dcaStrategy.config.amountPerInterval}`);
  console.log(
    `Interval: Every ${dcaStrategy.config.intervalDuration / (24 * 60 * 60 * 1000)} days`
  );
  console.log(`Total intervals: ${dcaStrategy.config.totalIntervals}`);
  console.log(
    `Total investment: $${dcaStrategy.config.amountPerInterval * dcaStrategy.config.totalIntervals}`
  );

  // Execute first purchase
  console.log('\n🚀 Executing First Purchase (Dry Run)...\n');
  const result = await dcaStrategy.execute();

  if (result.success) {
    console.log('✅ DCA Purchase Executed Successfully!');
    console.log('\n📊 Results:');
    console.log('━'.repeat(50));
    console.log(`Execution Time: ${result.metrics.executionTime}ms`);
    console.log(`Current Interval: ${result.metadata?.currentInterval} / ${dcaStrategy.config.totalIntervals}`);
    console.log(`SOL Purchased: ${result.metadata?.amountPurchased} SOL`);
    console.log(`Average Price: $${result.metadata?.averagePrice.toFixed(2)}`);
    console.log(`Total Spent: $${result.metadata?.totalSpent.toFixed(2)}`);

    console.log('\n📅 Next Steps:');
    console.log('  1. Set autoExecute: true to enable automatic purchases');
    console.log('  2. Set dryRun: false to execute on-chain');
    console.log('  3. Use pause(), resume(), stop() to control execution');

    // Example of controlling execution
    console.log('\n\n🎮 Controlling DCA Execution:');
    console.log('━'.repeat(50));
    console.log('// Start automated execution');
    console.log('await dcaStrategy.execute();  // Starts auto-scheduling');
    console.log('');
    console.log('// Pause temporarily');
    console.log('dcaStrategy.pause();');
    console.log('');
    console.log('// Resume');
    console.log('dcaStrategy.resume();');
    console.log('');
    console.log('// Stop completely');
    console.log('dcaStrategy.stop();');
  } else {
    console.error('❌ DCA Purchase Failed:', result.error?.message);
  }
}

// Run example
main().catch(console.error);
