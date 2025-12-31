/**
 * Arbitrage Pattern Example
 *
 * This example demonstrates how to detect and execute arbitrage
 * opportunities across multiple DEXs on Solana.
 */

import { ArbitragePattern, Guard } from '../../src';

async function main() {
  // Configure Guard with tight slippage for arbitrage
  const guard = new Guard({
    mode: 'block',
    maxSlippage: 0.01, // 1% max slippage
    riskTolerance: 'low', // Conservative for arbitrage
  });

  // Create arbitrage pattern
  const arbPattern = new ArbitragePattern({
    name: 'Multi-DEX Arbitrage Bot',
    pairs: [
      {
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
    ],
    dexes: [
      {
        name: 'Orca',
        programId: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
        feeTier: 0.003,
      },
      {
        name: 'Raydium',
        programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
        feeTier: 0.0025,
      },
      {
        name: 'Jupiter',
        programId: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',
        feeTier: 0.002,
      },
    ],
    minProfitPercent: 0.5, // 0.5% minimum profit after fees
    maxTradeSize: 10000, // $10k max per trade
    scanInterval: 5000, // Scan every 5 seconds
    guard,
    dryRun: true,
  });

  console.log('\n🔍 Arbitrage Bot Configuration:');
  console.log('━'.repeat(50));
  console.log(`Trading Pairs: ${arbPattern.config.pairs.length}`);
  console.log(`DEXs Monitored: ${arbPattern.config.dexes.map(d => d.name).join(', ')}`);
  console.log(`Minimum Profit: ${arbPattern.config.minProfitPercent}%`);
  console.log(`Max Trade Size: $${arbPattern.config.maxTradeSize.toLocaleString()}`);
  console.log(`Scan Interval: ${arbPattern.config.scanInterval}ms`);

  // Execute arbitrage scan
  console.log('\n🚀 Scanning for Arbitrage Opportunities...\n');
  const result = await arbPattern.execute();

  if (result.success) {
    console.log('✅ Arbitrage Scan Completed!');
    console.log('\n📊 Results:');
    console.log('━'.repeat(50));
    console.log(`Opportunities Found: ${result.metadata?.opportunitiesFound || 0}`);
    console.log(`Profitable Trades: ${result.metadata?.profitableTrades || 0}`);
    console.log(`Execution Time: ${result.metrics.executionTime}ms`);

    if (result.metadata?.opportunities) {
      const opportunities = result.metadata.opportunities as Array<{
        pair: string;
        buyDex: string;
        sellDex: string;
        profitPercent: number;
        profitAmount: number;
      }>;

      console.log('\n💎 Arbitrage Opportunities:');
      opportunities.forEach((opp, index) => {
        console.log(`\n  ${index + 1}. ${opp.pair}`);
        console.log(`     Buy on: ${opp.buyDex}`);
        console.log(`     Sell on: ${opp.sellDex}`);
        console.log(`     Profit: ${opp.profitPercent.toFixed(2)}% ($${opp.profitAmount.toFixed(2)})`);
      });

      if (result.transactions.length > 0) {
        console.log('\n💼 Transactions Prepared:');
        result.transactions.forEach((tx, index) => {
          console.log(
            `  ${index + 1}. ${tx.metadata?.action} on ${tx.metadata?.dex} - Profit: $${tx.metadata?.expectedProfit}`
          );
        });
      }
    } else {
      console.log('\n💤 No arbitrage opportunities found at this time.');
      console.log('   The bot will continue scanning at the configured interval.');
    }

    console.log('\n\n📝 Next Steps:');
    console.log('  1. Monitor opportunities over time');
    console.log('  2. Adjust minProfitPercent based on market conditions');
    console.log('  3. Set dryRun: false to execute profitable trades');
    console.log('  4. Consider MEV protection for live trading');
  } else {
    console.error('❌ Arbitrage Scan Failed:', result.error?.message);
  }
}

// Run example
main().catch(console.error);
