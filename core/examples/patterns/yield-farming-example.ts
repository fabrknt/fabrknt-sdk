/**
 * Yield Farming Pattern Example
 *
 * This example demonstrates automated yield optimization across
 * multiple DeFi protocols with different allocation strategies.
 */

import { YieldFarmingPattern, Guard } from '../../src';

async function main() {
  // Configure Guard
  const guard = new Guard({
    mode: 'block',
    maxSlippage: 0.01, // 1% max slippage
    riskTolerance: 'moderate',
  });

  // Define available protocols
  const protocols = [
    {
      name: 'Solend',
      programId: 'So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo',
      apy: 8.5,
      token: {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        decimals: 6,
      },
      minDeposit: 100,
    },
    {
      name: 'Marinade',
      programId: 'MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD',
      apy: 6.8,
      token: {
        mint: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        decimals: 9,
      },
      minDeposit: 1,
    },
    {
      name: 'Orca',
      programId: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
      apy: 12.3,
      token: {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        decimals: 6,
      },
      minDeposit: 100,
    },
    {
      name: 'Raydium',
      programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
      apy: 10.2,
      token: {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        decimals: 6,
      },
      minDeposit: 50,
    },
  ];

  // Demonstrate different strategies
  const strategies: Array<'highest-apy' | 'diversified' | 'conservative'> = [
    'highest-apy',
    'diversified',
    'conservative',
  ];

  console.log('\n🌾 Yield Farming Strategy Comparison:');
  console.log('━'.repeat(70));

  for (const strategy of strategies) {
    // Create yield farming pattern
    const yieldPattern = new YieldFarmingPattern({
      name: `Treasury Yield - ${strategy}`,
      farmAmount: 500000, // $500k to farm
      farmToken: {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        decimals: 6,
      },
      protocols,
      strategy,
      autoCompound: true,
      compoundFrequency: 7 * 24 * 60 * 60 * 1000, // Weekly
      guard,
      dryRun: true,
    });

    console.log(`\n📊 Strategy: ${strategy.toUpperCase().replace('-', ' ')}`);
    console.log('─'.repeat(70));

    // Execute pattern
    const result = await yieldPattern.execute();

    if (result.success) {
      // Get allocation summary
      const summary = yieldPattern.getAllocationSummary();

      console.log(`   Protocols Used: ${summary.length}`);
      console.log(`   Weighted APY: ${result.metadata?.estimatedAPY.toFixed(2)}%`);

      console.log('\n   Allocations:');
      summary.forEach(alloc => {
        console.log(
          `     • ${alloc.protocol}: $${alloc.amount.toLocaleString()} (${alloc.percentage.toFixed(1)}%) @ ${alloc.apy}% APY`
        );
      });

      // Calculate projected returns
      const annualReturn = (500000 * (result.metadata?.estimatedAPY as number)) / 100;
      console.log(`\n   Projected Annual Return: $${annualReturn.toLocaleString()}`);
    }
  }

  // Detailed example with one strategy
  console.log('\n\n🚀 Executing Diversified Strategy (Detailed):');
  console.log('━'.repeat(70));

  const yieldPattern = new YieldFarmingPattern({
    name: 'DAO Treasury Yield Optimization',
    farmAmount: 500000,
    farmToken: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      decimals: 6,
    },
    protocols,
    strategy: 'diversified',
    autoCompound: true,
    compoundFrequency: 7 * 24 * 60 * 60 * 1000, // Weekly
    guard,
    dryRun: true,
  });

  const result = await yieldPattern.execute();

  if (result.success) {
    console.log('✅ Yield Farming Executed Successfully!');
    console.log('\n📈 Execution Results:');
    console.log('━'.repeat(70));
    console.log(`Total Deposited: $${yieldPattern.config.farmAmount.toLocaleString()}`);
    console.log(`Weighted APY: ${result.metadata?.estimatedAPY.toFixed(2)}%`);
    console.log(`Transactions: ${result.transactions.length}`);
    console.log(`Execution Time: ${result.metrics.executionTime}ms`);
    console.log(`Auto-Compound: ${yieldPattern.config.autoCompound ? 'Enabled' : 'Disabled'}`);
    console.log(
      `Compound Frequency: Every ${yieldPattern.config.compoundFrequency! / (24 * 60 * 60 * 1000)} days`
    );

    console.log('\n💼 Deposit Transactions:');
    result.transactions.forEach((tx, index) => {
      console.log(`  ${index + 1}. ${tx.metadata?.protocol}`);
      console.log(`     Amount: $${tx.metadata?.amount.toLocaleString()}`);
      console.log(`     APY: ${tx.metadata?.apy}%`);
    });

    // Calculate detailed projections
    const weightedAPY = result.metadata?.estimatedAPY as number;
    const dailyReturn = (500000 * weightedAPY) / 100 / 365;
    const monthlyReturn = dailyReturn * 30;
    const annualReturn = (500000 * weightedAPY) / 100;

    console.log('\n📊 Return Projections:');
    console.log('━'.repeat(70));
    console.log(`  Daily:   $${dailyReturn.toFixed(2)}`);
    console.log(`  Monthly: $${monthlyReturn.toLocaleString()}`);
    console.log(`  Annual:  $${annualReturn.toLocaleString()}`);

    if (yieldPattern.config.autoCompound) {
      // Calculate compound interest
      const compoundsPerYear = (365 * 24 * 60 * 60 * 1000) / yieldPattern.config.compoundFrequency!;
      const compoundReturn =
        500000 * Math.pow(1 + weightedAPY / 100 / compoundsPerYear, compoundsPerYear) - 500000;

      console.log(`\n  With Auto-Compounding (${compoundsPerYear.toFixed(0)}x/year):`);
      console.log(`  Annual Return: $${compoundReturn.toLocaleString()}`);
      console.log(`  APY: ${((compoundReturn / 500000) * 100).toFixed(2)}%`);
    }

    console.log('\n\n📝 Next Steps:');
    console.log('  1. Review allocation strategy');
    console.log('  2. Monitor APY changes across protocols');
    console.log('  3. Set dryRun: false to execute deposits');
    console.log('  4. Enable auto-compounding for optimal returns');
  } else {
    console.error('❌ Yield Farming Failed:', result.error?.message);
  }
}

// Run example
main().catch(console.error);
