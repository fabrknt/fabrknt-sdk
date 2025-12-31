/**
 * Subscription Billing Example
 *
 * Demonstrates automated subscription billing using fabrknt's RecurringPaymentPattern.
 * This example shows monthly SaaS billing for customers on different tiers.
 */

import { RecurringPaymentPattern, Guard } from '@fabrknt/sdk';
import type { RecurringPayment } from '@fabrknt/sdk';

// Subscription tiers
const SUBSCRIPTION_TIERS = {
  BASIC: 29,
  PRO: 99,
  ENTERPRISE: 299,
};

// Customer subscriptions
// In production: Load from database
const subscriptions: RecurringPayment[] = [
  {
    id: 'sub-001',
    wallet: 'ABC1...xyz',
    amount: SUBSCRIPTION_TIERS.BASIC,
    token: 'USDC',
    schedule: {
      type: 'monthly',
      startDate: new Date('2024-01-01').getTime(),
      dayOfMonth: 1, // Bill on 1st of each month
    },
    memo: 'Basic Plan - Customer A',
    active: true,
  },
  {
    id: 'sub-002',
    wallet: 'ABC2...xyz',
    amount: SUBSCRIPTION_TIERS.PRO,
    token: 'USDC',
    schedule: {
      type: 'monthly',
      startDate: new Date('2024-01-15').getTime(),
      dayOfMonth: 15, // Bill on 15th of each month
    },
    memo: 'Pro Plan - Customer B',
    active: true,
  },
  {
    id: 'sub-003',
    wallet: 'ABC3...xyz',
    amount: SUBSCRIPTION_TIERS.ENTERPRISE,
    token: 'USDC',
    schedule: {
      type: 'monthly',
      startDate: new Date('2024-02-01').getTime(),
      dayOfMonth: 1,
    },
    memo: 'Enterprise Plan - Customer C',
    active: true,
  },
  {
    id: 'sub-004',
    wallet: 'ABC4...xyz',
    amount: SUBSCRIPTION_TIERS.PRO,
    token: 'USDC',
    schedule: {
      type: 'monthly',
      startDate: new Date('2024-01-01').getTime(),
      dayOfMonth: 1,
    },
    memo: 'Pro Plan - Customer D',
    active: true,
  },
  {
    id: 'sub-005',
    wallet: 'ABC5...xyz',
    amount: SUBSCRIPTION_TIERS.BASIC,
    token: 'USDC',
    schedule: {
      type: 'weekly',
      startDate: new Date('2024-01-01').getTime(),
      dayOfWeek: 1, // Bill every Monday
    },
    memo: 'Basic Plan (Weekly) - Customer E',
    active: true,
  },
];

async function processSubscriptionBilling() {
  console.log('💳 Starting subscription billing...\n');

  // Create Guard for security validation
  const guard = new Guard({
    mode: 'block',
    maxSlippage: 0.01,
    riskTolerance: 'low',
  });

  // Create recurring payment pattern
  const billing = new RecurringPaymentPattern({
    name: 'Monthly Subscription Billing',
    payments: subscriptions,
    guard,
    maxRetries: 3,           // Retry failed payments up to 3 times
    generateReport: true,     // Generate CSV for accounting
    autoSchedule: true,       // Calculate next billing dates
    senderWallet: process.env.COMPANY_WALLET || 'company-billing-wallet',
    dryRun: process.env.DRY_RUN === 'true',
  });

  try {
    // Execute billing
    console.log('📋 Processing subscriptions for', subscriptions.length, 'customers...\n');

    const result = await billing.execute();

    // Display results
    console.log('✅ Billing cycle completed!\n');
    console.log('Summary:');
    console.log('- Total subscriptions:', result.metrics.custom?.totalPayments);
    console.log('- Due this cycle:', result.metrics.custom?.duePayments);
    console.log('- Successful charges:', result.metrics.custom?.successfulExecutions);
    console.log('- Failed charges:', result.metrics.custom?.failedExecutions);
    console.log('- Skipped (not due):', result.metrics.custom?.skippedPayments);
    console.log('- Gas cost:', result.metrics.actualCost, 'SOL');
    console.log('- Duration:', result.metrics.duration, 'ms\n');

    // Display transaction details
    if (result.metadata?.executions) {
      const successful = result.metadata.executions.filter(e => e.status === 'success');
      const failed = result.metadata.executions.filter(e => e.status === 'failed');
      const skipped = result.metadata.executions.filter(e => e.status === 'skipped');

      if (successful.length > 0) {
        console.log('✅ Successful Charges:');
        successful.forEach(exec => {
          const nextBilling = exec.nextExecution
            ? new Date(exec.nextExecution).toLocaleDateString()
            : 'N/A';
          console.log(`  - ${exec.paymentId}: $${exec.amount} (Next: ${nextBilling})`);
        });
        console.log();
      }

      if (failed.length > 0) {
        console.log('❌ Failed Charges:');
        failed.forEach(exec => {
          console.log(`  - ${exec.paymentId}: $${exec.amount} - ${exec.error}`);
        });
        console.log('\n⚠️  Action Required: Send payment failure notification to customers\n');
      }

      if (skipped.length > 0) {
        console.log('⏭️  Skipped (Not Due):');
        skipped.forEach(exec => {
          const nextBilling = exec.nextExecution
            ? new Date(exec.nextExecution).toLocaleDateString()
            : 'N/A';
          console.log(`  - ${exec.paymentId}: Next billing ${nextBilling}`);
        });
        console.log();
      }
    }

    // Display next execution schedule
    if (result.metadata?.nextExecutionSchedule) {
      console.log('📅 Next Billing Schedule:');
      Object.entries(result.metadata.nextExecutionSchedule).forEach(([id, timestamp]) => {
        const date = new Date(timestamp as number).toLocaleDateString();
        const subscription = subscriptions.find(s => s.id === id);
        console.log(`  - ${id} (${subscription?.memo}): ${date}`);
      });
      console.log();
    }

    // Save CSV report
    if (result.metadata?.csvReport) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `billing-report-${timestamp}.csv`;

      console.log('📊 CSV Report generated:');
      console.log(`   File: ${filename}`);
      console.log(`   Gas cost: ${result.metadata.totalGasCost} SOL\n`);

      // Preview
      const lines = result.metadata.csvReport.split('\n');
      console.log('   Preview:');
      lines.slice(0, 3).forEach(line => console.log(`   ${line}`));
      if (lines.length > 3) {
        console.log(`   ... ${lines.length - 3} more rows`);
      }
    }

    // Calculate revenue
    const totalRevenue = result.metadata?.executions
      ?.filter(e => e.status === 'success')
      .reduce((sum, e) => sum + e.amount, 0) || 0;

    console.log(`\n💰 Total Revenue: $${totalRevenue.toLocaleString()}`);

  } catch (error) {
    console.error('❌ Billing failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  processSubscriptionBilling()
    .then(() => {
      console.log('\n✅ Billing process complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Billing process failed:', error);
      process.exit(1);
    });
}

export { processSubscriptionBilling };
