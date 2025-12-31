/**
 * Liquidity Pattern Example
 *
 * This example demonstrates automated liquidity provision with
 * position management and impermanent loss monitoring.
 */

import { LiquidityPattern, Guard } from '../../src';

async function main() {
  // Configure Guard
  const guard = new Guard({
    mode: 'block',
    maxSlippage: 0.01, // 1% max slippage
    riskTolerance: 'moderate',
  });

  // Define liquidity pool
  const pool = {
    name: 'Orca SOL-USDC',
    programId: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
    tokenA: {
      mint: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      decimals: 9,
    },
    tokenB: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      decimals: 6,
    },
    apy: 12.5, // 12.5% APY from fees
    feeTier: 0.003, // 0.3% fee
    totalLiquidity: 5000000, // $5M total liquidity
    priceRatio: 100, // 1 SOL = 100 USDC
  };

  // Current prices
  const prices = {
    tokenA: {
      token: 'SOL',
      price: 100,
      quoteCurrency: 'USDC',
      timestamp: Date.now(),
    },
    tokenB: {
      token: 'USDC',
      price: 1,
      quoteCurrency: 'USD',
      timestamp: Date.now(),
    },
  };

  console.log('\n💧 Liquidity Pool Information:');
  console.log('━'.repeat(70));
  console.log(`Pool: ${pool.name}`);
  console.log(`Pair: ${pool.tokenA.symbol}-${pool.tokenB.symbol}`);
  console.log(`APY: ${pool.apy}%`);
  console.log(`Fee Tier: ${(pool.feeTier * 100).toFixed(2)}%`);
  console.log(`Total Liquidity: $${pool.totalLiquidity.toLocaleString()}`);
  console.log(`Current Ratio: 1 ${pool.tokenA.symbol} = ${pool.priceRatio} ${pool.tokenB.symbol}`);

  // Example 1: Add liquidity
  console.log('\n\n🔵 Example 1: Adding Liquidity');
  console.log('━'.repeat(70));

  const addPattern = new LiquidityPattern({
    name: 'Add SOL-USDC Liquidity',
    action: 'add',
    pool,
    amountA: 10, // 10 SOL
    amountB: 1000, // 1000 USDC
    prices,
    monitorImpermanentLoss: true,
    rebalanceThreshold: 5, // Auto-rebalance at 5% IL
    guard,
    dryRun: true,
  });

  console.log('\n📊 Position Details:');
  console.log(`  Depositing: ${addPattern.config.amountA} SOL + ${addPattern.config.amountB} USDC`);
  console.log(
    `  Initial Value: $${addPattern.config.amountA! * prices.tokenA.price + addPattern.config.amountB!}`
  );

  const addResult = await addPattern.execute();

  if (addResult.success) {
    console.log('\n✅ Liquidity Added Successfully!');

    const position = addPattern.getPositionSummary();
    if (position) {
      console.log('\n💼 Position Summary:');
      console.log(`  Token A: ${position.amountA} ${pool.tokenA.symbol}`);
      console.log(`  Token B: ${position.amountB} ${pool.tokenB.symbol}`);
      console.log(`  Initial Value: $${position.initialValue.toLocaleString()}`);
      console.log(`  Current Value: $${position.currentValue.toLocaleString()}`);
      console.log(`  Impermanent Loss: ${position.impermanentLoss.toFixed(2)}%`);
    }

    // Calculate projected earnings
    const annualFees = (position!.initialValue * pool.apy) / 100;
    const dailyFees = annualFees / 365;

    console.log('\n💰 Projected Earnings:');
    console.log(`  Daily Fees: $${dailyFees.toFixed(2)}`);
    console.log(`  Monthly Fees: $${(dailyFees * 30).toFixed(2)}`);
    console.log(`  Annual Fees: $${annualFees.toFixed(2)}`);
  }

  // Example 2: Monitor impermanent loss
  console.log('\n\n📊 Example 2: Monitoring Impermanent Loss');
  console.log('━'.repeat(70));

  // Simulate price changes
  const priceScenarios = [
    { solPrice: 100, description: 'No change' },
    { solPrice: 110, description: '+10% SOL price' },
    { solPrice: 90, description: '-10% SOL price' },
    { solPrice: 120, description: '+20% SOL price' },
    { solPrice: 80, description: '-20% SOL price' },
  ];

  console.log('\nImpermanent Loss at Different Price Points:');
  priceScenarios.forEach(scenario => {
    const newPrices = {
      tokenA: { ...prices.tokenA, price: scenario.solPrice },
      tokenB: prices.tokenB,
    };

    addPattern.updatePosition(newPrices);
    const position = addPattern.getPositionSummary();

    console.log(`\n  ${scenario.description}:`);
    console.log(`     SOL Price: $${scenario.solPrice}`);
    console.log(`     Position Value: $${position!.currentValue.toFixed(2)}`);
    console.log(`     Impermanent Loss: ${position!.impermanentLoss.toFixed(2)}%`);
    console.log(
      `     Needs Rebalancing: ${addPattern.needsRebalancing() ? 'Yes ⚠️' : 'No ✓'}`
    );
  });

  // Example 3: Remove liquidity
  console.log('\n\n🔴 Example 3: Removing Liquidity');
  console.log('━'.repeat(70));

  const removePattern = new LiquidityPattern({
    name: 'Remove SOL-USDC Liquidity',
    action: 'remove',
    pool,
    removePercentage: 50, // Remove 50%
    prices,
    guard,
    dryRun: true,
  });

  console.log(`\nRemoving: ${removePattern.config.removePercentage}% of position`);

  const removeResult = await removePattern.execute();

  if (removeResult.success) {
    console.log('\n✅ Liquidity Removed Successfully!');
    console.log('\n📦 Withdrawal:');
    console.log(`  ~${(addPattern.config.amountA! * 0.5).toFixed(2)} SOL`);
    console.log(`  ~${(addPattern.config.amountB! * 0.5).toFixed(2)} USDC`);
  }

  // Example 4: Rebalance position
  console.log('\n\n🔄 Example 4: Rebalancing Position');
  console.log('━'.repeat(70));

  // Simulate significant price change requiring rebalance
  const newPrices = {
    tokenA: { ...prices.tokenA, price: 120 }, // SOL up 20%
    tokenB: prices.tokenB,
  };

  addPattern.updatePosition(newPrices);

  console.log('\nPrice Change Detected:');
  console.log(`  Old Price: $${prices.tokenA.price}`);
  console.log(`  New Price: $${newPrices.tokenA.price}`);
  console.log(`  Change: +${((newPrices.tokenA.price / prices.tokenA.price - 1) * 100).toFixed(1)}%`);

  const position = addPattern.getPositionSummary();
  console.log(`\nCurrent Impermanent Loss: ${position!.impermanentLoss.toFixed(2)}%`);

  if (addPattern.needsRebalancing()) {
    console.log('\n⚠️  Rebalancing threshold exceeded!');

    const rebalancePattern = new LiquidityPattern({
      name: 'Rebalance SOL-USDC Position',
      action: 'rebalance',
      pool,
      prices: newPrices,
      guard,
      dryRun: true,
    });

    const rebalanceResult = await rebalancePattern.execute();

    if (rebalanceResult.success) {
      console.log('\n✅ Position Rebalanced!');
      console.log(`\nSteps:`);
      console.log(`  1. Removed existing liquidity`);
      console.log(`  2. Swapped tokens to match new ratio`);
      console.log(`  3. Re-added liquidity at optimal amounts`);
      console.log(`\nTransactions: ${rebalanceResult.transactions.length}`);
    }
  } else {
    console.log('\n✓ Position is within acceptable range, no rebalancing needed');
  }

  // Summary
  console.log('\n\n📚 Liquidity Pattern Summary:');
  console.log('━'.repeat(70));
  console.log('✓ Add Liquidity: Deposit tokens into pool');
  console.log('✓ Remove Liquidity: Withdraw tokens from pool');
  console.log('✓ Monitor IL: Track impermanent loss in real-time');
  console.log('✓ Auto-Rebalance: Automatically rebalance at threshold');
  console.log('✓ Fee Earnings: Earn trading fees based on APY');

  console.log('\n💡 Best Practices:');
  console.log('  • Monitor impermanent loss regularly');
  console.log('  • Set appropriate rebalance thresholds');
  console.log('  • Consider IL vs fee earnings tradeoff');
  console.log('  • Use stable pairs for lower IL risk');
  console.log('  • Diversify across multiple pools');

  console.log('\n📝 Next Steps:');
  console.log('  1. Review position and IL tolerance');
  console.log('  2. Set up monitoring/alerts');
  console.log('  3. Configure auto-rebalancing if desired');
  console.log('  4. Set dryRun: false to execute on-chain');
}

// Run example
main().catch(console.error);
