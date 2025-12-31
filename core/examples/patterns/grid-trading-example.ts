/**
 * Grid Trading Pattern Example
 *
 * This example demonstrates how to set up a grid trading strategy
 * for the SOL-USDC pair with automated buy/sell orders across
 * multiple price levels.
 */

import { GridTradingPattern, Guard } from '../../src';

async function main() {
  // Configure Guard for security validation
  const guard = new Guard({
    mode: 'block',
    maxSlippage: 0.02, // 2% max slippage
    riskTolerance: 'moderate',
  });

  // Create grid trading pattern
  const gridPattern = new GridTradingPattern({
    name: 'SOL-USDC Grid Trading Bot',
    pair: {
      base: {
        mint: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        decimals: 9,
      },
      quote: {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        decimals: 6,
      },
    },
    lowerBound: 90, // Start buying at $90
    upperBound: 110, // Start selling at $110
    gridLevels: 10, // 10 price levels
    amountPerGrid: 1, // 1 SOL per grid level
    currentPrice: {
      token: 'SOL',
      price: 100,
      quoteCurrency: 'USDC',
      timestamp: Date.now(),
    },
    guard,
    dryRun: true, // Start in test mode
  });

  // Get grid levels for preview
  const levels = gridPattern.getGridLevels();
  console.log('\n📊 Grid Trading Setup:');
  console.log('━'.repeat(50));
  console.log(`Price Range: $${gridPattern.config.lowerBound} - $${gridPattern.config.upperBound}`);
  console.log(`Grid Levels: ${gridPattern.config.gridLevels}`);
  console.log(`Amount per Level: ${gridPattern.config.amountPerGrid} SOL`);
  console.log('\n🎯 Grid Levels:');
  levels.forEach((level, index) => {
    console.log(
      `  Level ${index + 1}: $${level.price.toFixed(2)} - ${level.type.toUpperCase()} ${level.amount} SOL`
    );
  });

  // Execute pattern (dry run)
  console.log('\n🚀 Executing Pattern (Dry Run)...\n');
  const result = await gridPattern.execute();

  // Display results
  if (result.success) {
    console.log('✅ Grid Trading Pattern Executed Successfully!');
    console.log('\n📈 Results:');
    console.log('━'.repeat(50));
    console.log(`Transactions Created: ${result.transactions.length}`);
    console.log(`Execution Time: ${result.metrics.executionTime}ms`);
    console.log(`Success Rate: ${(result.metrics.successRate * 100).toFixed(1)}%`);

    console.log('\n💼 Transactions:');
    result.transactions.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.metadata?.action} at $${tx.metadata?.price} - ${tx.metadata?.amount} SOL`);
    });

    // Now run for real
    console.log('\n\n⚠️  To execute on-chain, set dryRun: false\n');
  } else {
    console.error('❌ Pattern Failed:', result.error?.message);
  }
}

// Run example
main().catch(console.error);
