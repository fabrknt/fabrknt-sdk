/**
 * DAO Treasury Rebalancing Example
 *
 * Demonstrates automated treasury rebalancing using fabrknt's TreasuryRebalancing pattern.
 * This example shows a DAO maintaining 40% SOL, 40% USDC, 20% BTC allocation.
 */

import { TreasuryRebalancing, Guard } from '@fabrknt/sdk';
import type { AssetAllocation, Token } from '@fabrknt/sdk';

// Define tokens
const SOL: Token = {
  mint: 'So11111111111111111111111111111111111111112',
  symbol: 'SOL',
  decimals: 9,
};

const USDC: Token = {
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  symbol: 'USDC',
  decimals: 6,
};

const BTC: Token = {
  mint: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
  symbol: 'BTC',
  decimals: 6,
};

// Target allocation: 40% SOL, 40% USDC, 20% BTC
const targetAllocations: AssetAllocation[] = [
  {
    token: SOL,
    targetPercentage: 40,
    currentAmount: 0, // Will be fetched from wallet
  },
  {
    token: USDC,
    targetPercentage: 40,
    currentAmount: 0,
  },
  {
    token: BTC,
    targetPercentage: 20,
    currentAmount: 0,
  },
];

async function rebalanceTreasury() {
  console.log('⚖️  DAO Treasury Rebalancing...\n');

  // Simulated current holdings (in USD value)
  // In production: Fetch from on-chain wallet balances
  const currentHoldings = [
    { token: SOL, amount: 2000, value: 400000 },   // $400k in SOL (50%)
    { token: USDC, amount: 200000, value: 200000 }, // $200k in USDC (25%)
    { token: BTC, amount: 4, value: 200000 },       // $200k in BTC (25%)
  ];

  const totalValue = currentHoldings.reduce((sum, h) => sum + h.value, 0);

  // Display current allocations
  console.log('📊 Current Portfolio:');
  console.log(`   Total Value: $${totalValue.toLocaleString()}\n`);
  currentHoldings.forEach(holding => {
    const percentage = (holding.value / totalValue * 100).toFixed(1);
    console.log(`   ${holding.token.symbol}: $${holding.value.toLocaleString()} (${percentage}%)`);
  });
  console.log();

  // Calculate target values
  console.log('🎯 Target Allocation:');
  targetAllocations.forEach(allocation => {
    const targetValue = totalValue * allocation.targetPercentage / 100;
    console.log(`   ${allocation.token.symbol}: $${targetValue.toLocaleString()} (${allocation.targetPercentage}%)`);
  });
  console.log();

  // Calculate rebalancing trades
  console.log('🔄 Required Rebalancing:');
  const trades = [];

  for (const allocation of targetAllocations) {
    const current = currentHoldings.find(h => h.token.symbol === allocation.token.symbol);
    const currentValue = current?.value || 0;
    const targetValue = totalValue * allocation.targetPercentage / 100;
    const diff = targetValue - currentValue;

    if (Math.abs(diff) > totalValue * 0.01) { // Only if >1% difference
      const action = diff > 0 ? 'BUY' : 'SELL';
      const amount = Math.abs(diff);
      trades.push({
        token: allocation.token.symbol,
        action,
        amount,
        percentage: (diff / totalValue * 100).toFixed(1),
      });

      console.log(`   ${action} ${allocation.token.symbol}: $${amount.toLocaleString()} (${trades[trades.length - 1].percentage}%)`);
    }
  }

  if (trades.length === 0) {
    console.log('   No rebalancing needed - portfolio is within target range');
    return;
  }

  console.log();

  // Create Guard for security validation
  const guard = new Guard({
    mode: 'block',
    maxSlippage: 0.02,        // 2% max slippage for rebalancing
    riskTolerance: 'moderate',
  });

  // Create rebalancing pattern
  const rebalancer = new TreasuryRebalancing({
    name: 'DAO Treasury Rebalancing',
    allocations: targetAllocations.map((alloc, i) => ({
      ...alloc,
      currentAmount: currentHoldings[i].amount,
    })),
    rebalanceThreshold: 0.05, // Rebalance if >5% drift
    guard,
    enableRealDEX: false,     // Use real DEX routing (Jupiter V6)
    dryRun: process.env.DRY_RUN === 'true',
  });

  try {
    console.log('⚡ Executing rebalancing trades...\n');

    const result = await rebalancer.execute();

    // Display results
    console.log('✅ Rebalancing completed!\n');
    console.log('Execution Summary:');
    console.log('- Transactions executed:', result.transactions.length);
    console.log('- Gas cost:', result.metrics.actualCost, 'SOL');
    console.log('- Duration:', result.metrics.duration, 'ms\n');

    // Display transaction details
    if (result.transactions.length > 0) {
      console.log('Transaction Details:');
      result.transactions.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.id}`);
      });
      console.log();
    }

    // Display updated allocations
    if (result.metadata?.updatedAllocations) {
      console.log('📊 Updated Portfolio:');
      result.metadata.updatedAllocations.forEach((alloc: any) => {
        console.log(`   ${alloc.token.symbol}: ${alloc.currentPercentage}% (Target: ${alloc.targetPercentage}%)`);
      });
      console.log();
    }

    console.log('💡 Next rebalancing check: 1 week');

  } catch (error) {
    console.error('❌ Rebalancing failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  rebalanceTreasury()
    .then(() => {
      console.log('\n✅ Rebalancing process complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Rebalancing process failed:', error);
      process.exit(1);
    });
}

export { rebalanceTreasury };
