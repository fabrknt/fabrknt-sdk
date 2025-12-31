/**
 * Treasury Rebalancing Example
 *
 * This example shows how to automatically rebalance a DAO treasury
 * to maintain target asset allocations.
 */

import { TreasuryRebalancing, Guard } from '../../src';

async function main() {
  // Configure Guard
  const guard = new Guard({
    mode: 'block',
    maxSlippage: 0.02, // 2% max slippage
    riskTolerance: 'moderate',
  });

  // Create treasury rebalancing pattern
  const rebalancePattern = new TreasuryRebalancing({
    name: 'DAO Treasury Quarterly Rebalance',
    totalValue: 1000000, // $1M treasury
    allocations: [
      {
        token: {
          mint: 'So11111111111111111111111111111111111111112',
          symbol: 'SOL',
          decimals: 9,
        },
        targetPercent: 40, // Target: 40%
        currentValue: 350000, // Current: $350k (35%)
      },
      {
        token: {
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          symbol: 'USDC',
          decimals: 6,
        },
        targetPercent: 40, // Target: 40%
        currentValue: 450000, // Current: $450k (45%)
      },
      {
        token: {
          mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
          symbol: 'mSOL',
          decimals: 9,
        },
        targetPercent: 20, // Target: 20%
        currentValue: 200000, // Current: $200k (20%)
      },
    ],
    threshold: 5, // Rebalance if any asset deviates >5%
    minTradeSize: 100, // $100 minimum trade
    maxSlippage: 0.02,
    baseCurrency: {
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      symbol: 'USDC',
      decimals: 6,
    },
    guard,
    dryRun: true,
  });

  // Display current allocation
  console.log('\n🏦 Treasury Overview:');
  console.log('━'.repeat(50));
  console.log(`Total Value: $${rebalancePattern.config.totalValue.toLocaleString()}`);
  console.log(`Rebalance Threshold: ${rebalancePattern.config.threshold}%`);

  console.log('\n📊 Current vs Target Allocations:');
  rebalancePattern.config.allocations.forEach(allocation => {
    const currentPercent = (allocation.currentValue / rebalancePattern.config.totalValue) * 100;
    const deviation = Math.abs(currentPercent - allocation.targetPercent);
    const status = deviation > rebalancePattern.config.threshold ? '⚠️' : '✅';

    console.log(`\n  ${status} ${allocation.token.symbol}:`);
    console.log(`     Current: ${currentPercent.toFixed(1)}% ($${allocation.currentValue.toLocaleString()})`);
    console.log(`     Target:  ${allocation.targetPercent}%`);
    console.log(`     Deviation: ${deviation.toFixed(1)}%`);
  });

  // Check if rebalancing is needed
  const needsRebalancing = rebalancePattern.needsRebalancing();
  console.log(`\n${needsRebalancing ? '🔄' : '✅'} Rebalancing ${needsRebalancing ? 'REQUIRED' : 'NOT REQUIRED'}\n`);

  if (needsRebalancing) {
    // Execute rebalancing
    console.log('🚀 Executing Rebalancing (Dry Run)...\n');
    const result = await rebalancePattern.execute();

    if (result.success) {
      console.log('✅ Treasury Rebalanced Successfully!');
      console.log('\n📈 Results:');
      console.log('━'.repeat(50));
      console.log(`Actions Executed: ${result.metadata?.actionsExecuted}`);
      console.log(`Execution Time: ${result.metrics.executionTime}ms`);
      console.log(`Transactions: ${result.transactions.length}`);

      // Display rebalancing actions
      console.log('\n💱 Rebalancing Trades:');
      result.transactions.forEach((tx, index) => {
        const action = tx.metadata?.action;
        console.log(
          `  ${index + 1}. ${action.from} → ${action.to}: $${action.amount.toLocaleString()}`
        );
        console.log(`     Reason: ${tx.metadata?.reason}`);
      });

      // Display new allocations
      if (result.metadata?.allocations) {
        console.log('\n📊 New Allocations:');
        const allocations = result.metadata.allocations as Array<{
          token: string;
          target: number;
          current: number;
          deviation: number;
        }>;

        allocations.forEach(alloc => {
          console.log(`  ${alloc.token}:`);
          console.log(`     Target:  ${alloc.target}%`);
          console.log(`     Current: ${alloc.current.toFixed(1)}%`);
          console.log(`     Deviation: ${alloc.deviation.toFixed(2)}%`);
        });
      }

      console.log('\n\n📝 Next Steps:');
      console.log('  1. Review proposed trades');
      console.log('  2. Set dryRun: false to execute on-chain');
      console.log('  3. Schedule regular rebalancing checks');
    } else {
      console.error('❌ Rebalancing Failed:', result.error?.message);
    }
  } else {
    console.log('✨ Treasury is within target allocations. No action needed.');
  }

  // Example of updating values dynamically
  console.log('\n\n🔄 Dynamic Updates:');
  console.log('━'.repeat(50));
  console.log('// Update current values (e.g., from price oracle)');
  console.log('rebalancePattern.updateCurrentValues([');
  console.log('  { token: "SOL", value: 380000 },');
  console.log('  { token: "USDC", value: 420000 },');
  console.log('  { token: "mSOL", value: 200000 },');
  console.log(']);');
}

// Run example
main().catch(console.error);
