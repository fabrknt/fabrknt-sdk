/**
 * Crypto Payroll Example
 *
 * Demonstrates batch salary payments using fabrknt's BatchPayoutPattern.
 * This example shows a monthly USDC payroll for a 10-person team.
 */

import { BatchPayoutPattern, Guard } from '@fabrknt/sdk';
import type { PayoutRecipient } from '@fabrknt/sdk';

// Employee payroll data
// In production: Load from secure database
const employees: PayoutRecipient[] = [
  {
    id: 'emp-001',
    wallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    amount: 5000,
    token: 'USDC',
    memo: 'Engineering - Senior Developer',
  },
  {
    id: 'emp-002',
    wallet: '9zYpKmPRJYCbZqvZXgUjA3YzFwCJcPqTvJdKxLkWmNbP',
    amount: 4500,
    token: 'USDC',
    memo: 'Engineering - Developer',
  },
  {
    id: 'emp-003',
    wallet: 'FkDm3qJWzPcNkH8AvTdLx2sKbVrM9zYpWtGhJsXuCvEn',
    amount: 4000,
    token: 'USDC',
    memo: 'Product - Product Manager',
  },
  {
    id: 'emp-004',
    wallet: 'HnBxRkPqTcVmJwYzKsLuDgFqEaNpXtMbWvCsGhJrUiOp',
    amount: 3500,
    token: 'USDC',
    memo: 'Design - Senior Designer',
  },
  {
    id: 'emp-005',
    wallet: 'JpDyXmQsWvNcKzLhTgFuErBpAtMxYwVsGiHjRkOuCnBm',
    amount: 3000,
    token: 'USDC',
    memo: 'Marketing - Marketing Lead',
  },
  {
    id: 'emp-006',
    wallet: 'KqEzYnRtXwOdLaMjUhGvFsCqBuNyZxWtHkJsRlPvDoEn',
    amount: 2500,
    token: 'USDC',
    memo: 'Operations - Operations Manager',
  },
  {
    id: 'emp-007',
    wallet: 'LrFaZoSuYxPeLbNkViHwGtDrCvOzAyXuIlKtSmQwEpFo',
    amount: 2500,
    token: 'USDC',
    memo: 'Sales - Account Executive',
  },
  {
    id: 'emp-008',
    wallet: 'MsGbApTvZyQfMcOlWjIxHuEsDwPaByYvJmLuTnRxFqGp',
    amount: 2000,
    token: 'USDC',
    memo: 'Engineering - Junior Developer',
  },
  {
    id: 'emp-009',
    wallet: 'NtHcBqUwAzRgNdPmXkJyIvFtExQbCzZwKnMvUoSyGrHq',
    amount: 2000,
    token: 'USDC',
    memo: 'Customer Success - Support Lead',
  },
  {
    id: 'emp-010',
    wallet: 'PuIdCrVxBaShOeQnYlKzJwGuFyRcDaAxLoNwVpTzHsIr',
    amount: 1500,
    token: 'USDC',
    memo: 'Intern - Engineering Intern',
  },
];

async function runPayroll() {
  console.log('🚀 Starting monthly payroll...\n');

  // Create Guard for security validation
  const guard = new Guard({
    mode: 'block',          // Block suspicious transactions
    maxSlippage: 0.01,      // 1% max slippage
    riskTolerance: 'low',   // Low risk tolerance for payroll
  });

  // Create batch payout pattern
  const payroll = new BatchPayoutPattern({
    name: 'Monthly Payroll - December 2024',
    recipients: employees,
    guard,
    enableParallel: true,   // Parallel execution for gas savings
    generateReport: true,    // Generate CSV for accounting
    batchSize: 5,           // Process 5 payments at a time
    senderWallet: process.env.COMPANY_WALLET || 'company-treasury-wallet',
    dryRun: process.env.DRY_RUN === 'true', // Set to false for actual execution
  });

  try {
    // Execute payroll
    console.log('📋 Processing payments for', employees.length, 'employees...\n');

    const result = await payroll.execute();

    // Display results
    console.log('✅ Payroll completed!\n');
    console.log('Summary:');
    console.log('- Total recipients:', result.metrics.custom?.totalRecipients);
    console.log('- Successful payments:', result.metrics.custom?.successfulPayments);
    console.log('- Failed payments:', result.metrics.custom?.failedPayments);
    console.log('- Transactions:', result.transactions.length);
    console.log('- Gas cost:', result.metrics.actualCost, 'SOL');
    console.log('- Duration:', result.metrics.duration, 'ms\n');

    // Display individual transaction hashes
    if (result.transactions.length > 0) {
      console.log('Transaction Hashes:');
      result.transactions.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.id}`);
      });
      console.log();
    }

    // Save CSV report
    if (result.metadata?.csvReport) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `payroll-report-${timestamp}.csv`;

      // In production: Save to S3 or database
      console.log('📊 CSV Report generated:');
      console.log(`   File: ${filename}`);
      console.log(`   Total amount: $${result.metadata.totalAmount?.toLocaleString()}`);
      console.log(`   Gas cost: ${result.metadata.totalGasCost} SOL\n`);

      // Preview first few lines
      const lines = result.metadata.csvReport.split('\n');
      console.log('   Preview:');
      lines.slice(0, 3).forEach(line => console.log(`   ${line}`));
      if (lines.length > 3) {
        console.log(`   ... ${lines.length - 3} more rows`);
      }
    }

    // Handle failures
    if (result.metadata?.report) {
      const failed = result.metadata.report.filter(r => r.status === 'failed');
      if (failed.length > 0) {
        console.log('\n⚠️  Failed Payments:');
        failed.forEach(f => {
          console.log(`  - ${f.recipientId} (${f.recipient}): ${f.error}`);
        });
        console.log('\nAction required: Review failed payments and retry manually.');
      }
    }

  } catch (error) {
    console.error('❌ Payroll failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runPayroll()
    .then(() => {
      console.log('\n✅ Payroll process complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Payroll process failed:', error);
      process.exit(1);
    });
}

export { runPayroll };
