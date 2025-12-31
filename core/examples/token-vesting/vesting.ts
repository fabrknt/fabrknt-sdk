/**
 * Token Vesting Example
 *
 * Demonstrates token vesting using fabrknt's TokenVestingPattern.
 * This example shows team token vesting with 1-year duration and 3-month cliff.
 */

import { TokenVestingPattern, Guard } from '@fabrknt/sdk';
import type { VestingGrant } from '@fabrknt/sdk';

// Token vesting grants
// In production: Load from database
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const vestingGrants: VestingGrant[] = [
  // Team members - Linear vesting with 3-month cliff
  {
    id: 'team-001',
    beneficiary: 'TEAM1...xyz',
    totalAmount: 100000,
    token: 'PROJECT_TOKEN',
    schedule: {
      type: 'linear',
      duration: YEAR_MS,           // 1 year vesting
      cliffDuration: 3 * MONTH_MS, // 3 month cliff
      startDate: new Date('2024-01-01').getTime(),
    },
    claimedAmount: 0,
    active: true,
    memo: 'Co-founder - Engineering',
  },
  {
    id: 'team-002',
    beneficiary: 'TEAM2...xyz',
    totalAmount: 100000,
    token: 'PROJECT_TOKEN',
    schedule: {
      type: 'linear',
      duration: YEAR_MS,
      cliffDuration: 3 * MONTH_MS,
      startDate: new Date('2024-01-01').getTime(),
    },
    claimedAmount: 0,
    active: true,
    memo: 'Co-founder - Product',
  },
  {
    id: 'team-003',
    beneficiary: 'TEAM3...xyz',
    totalAmount: 50000,
    token: 'PROJECT_TOKEN',
    schedule: {
      type: 'linear',
      duration: YEAR_MS,
      cliffDuration: 3 * MONTH_MS,
      startDate: new Date('2024-02-01').getTime(),
    },
    claimedAmount: 10000, // Already claimed 10k
    active: true,
    memo: 'Early Employee - Engineering',
  },

  // Advisors - Linear vesting with 1-month cliff
  {
    id: 'advisor-001',
    beneficiary: 'ADVISOR1...xyz',
    totalAmount: 25000,
    token: 'PROJECT_TOKEN',
    schedule: {
      type: 'linear',
      duration: 2 * YEAR_MS,       // 2 year vesting
      cliffDuration: MONTH_MS,     // 1 month cliff
      startDate: new Date('2024-01-15').getTime(),
    },
    claimedAmount: 0,
    active: true,
    memo: 'Advisor - Technical',
  },

  // Investors - Milestone-based vesting
  {
    id: 'investor-001',
    beneficiary: 'INVESTOR1...xyz',
    totalAmount: 500000,
    token: 'PROJECT_TOKEN',
    schedule: {
      type: 'milestone',
      duration: 2 * YEAR_MS,
      startDate: new Date('2024-01-01').getTime(),
      milestones: [
        {
          percentage: 25, // 25% at token launch
          date: new Date('2024-06-01').getTime(),
        },
        {
          percentage: 25, // 25% at 1 year
          date: new Date('2025-01-01').getTime(),
        },
        {
          percentage: 25, // 25% at 18 months
          date: new Date('2025-07-01').getTime(),
        },
        {
          percentage: 25, // 25% at 2 years
          date: new Date('2026-01-01').getTime(),
        },
      ],
    },
    claimedAmount: 0,
    active: true,
    memo: 'Seed Investor',
  },

  // Inactive grant (employee left)
  {
    id: 'team-004',
    beneficiary: 'TEAM4...xyz',
    totalAmount: 30000,
    token: 'PROJECT_TOKEN',
    schedule: {
      type: 'linear',
      duration: YEAR_MS,
      cliffDuration: 3 * MONTH_MS,
      startDate: new Date('2024-01-01').getTime(),
    },
    claimedAmount: 5000,
    active: false, // Terminated
    memo: 'Former Employee (Terminated)',
  },
];

async function processVestingClaims() {
  console.log('🎁 Processing token vesting claims...\n');

  // Create Guard for security validation
  const guard = new Guard({
    mode: 'block',
    maxSlippage: 0.01,
    riskTolerance: 'low',
  });

  // Create token vesting pattern
  const vesting = new TokenVestingPattern({
    name: 'Project Token Vesting',
    grants: vestingGrants,
    guard,
    vaultWallet: process.env.VAULT_WALLET || 'token-vault-wallet',
    autoClaim: true,          // Automatically process claims
    generateReport: true,      // Generate CSV for compliance
    dryRun: process.env.DRY_RUN === 'true',
  });

  try {
    // Execute vesting claims
    console.log('📋 Processing vesting for', vestingGrants.length, 'grants...\n');

    const result = await vesting.execute();

    // Display results
    console.log('✅ Vesting claims processed!\n');
    console.log('Summary:');
    console.log('- Total grants:', result.metrics.custom?.totalGrants);
    console.log('- Active grants:', result.metrics.custom?.activeGrants);
    console.log('- Successful claims:', result.metrics.custom?.successfulClaims);
    console.log('- Failed claims:', result.metrics.custom?.failedClaims);
    console.log('- Not claimable:', result.metrics.custom?.notClaimable);
    console.log('- Total claimed:', result.metrics.custom?.totalClaimed, 'tokens');
    console.log('- Gas cost:', result.metrics.actualCost, 'SOL');
    console.log('- Duration:', result.metrics.duration, 'ms\n');

    // Display claim details
    if (result.metadata?.claims) {
      const successful = result.metadata.claims.filter(c => c.status === 'success');
      const failed = result.metadata.claims.filter(c => c.status === 'failed');
      const notClaimable = result.metadata.claims.filter(c => c.status === 'not_claimable');

      if (successful.length > 0) {
        console.log('✅ Successful Claims:');
        successful.forEach(claim => {
          const grant = vestingGrants.find(g => g.id === claim.grantId);
          console.log(`  - ${claim.grantId} (${grant?.memo}):`);
          console.log(`    Claimed: ${claim.amount.toLocaleString()} tokens`);
          console.log(`    Total claimed: ${claim.totalClaimed?.toLocaleString()} / ${grant?.totalAmount.toLocaleString()}`);
          console.log(`    Tx: ${claim.txHash}`);
        });
        console.log();
      }

      if (notClaimable.length > 0) {
        console.log('⏳ Not Yet Claimable:');
        notClaimable.forEach(claim => {
          const grant = vestingGrants.find(g => g.id === claim.grantId);
          const vestedPct = grant ? (claim.vestedAmount! / grant.totalAmount * 100).toFixed(1) : '0';
          console.log(`  - ${claim.grantId} (${grant?.memo}):`);
          console.log(`    Vested: ${claim.vestedAmount?.toLocaleString()} (${vestedPct}%)`);
          console.log(`    Already claimed: ${claim.totalClaimed?.toLocaleString()}`);
          console.log(`    Claimable: 0`);
        });
        console.log();
      }

      if (failed.length > 0) {
        console.log('❌ Failed Claims:');
        failed.forEach(claim => {
          const grant = vestingGrants.find(g => g.id === claim.grantId);
          console.log(`  - ${claim.grantId} (${grant?.memo}): ${claim.error}`);
        });
        console.log();
      }
    }

    // Display vesting status
    if (result.metadata?.vestingStatus) {
      console.log('📊 Vesting Status:');
      Object.entries(result.metadata.vestingStatus).forEach(([id, status]) => {
        const grant = vestingGrants.find(g => g.id === id);
        const s = status as any;
        console.log(`  - ${id} (${grant?.memo}):`);
        console.log(`    Progress: ${(s.vestingProgress * 100).toFixed(1)}%`);
        console.log(`    Vested: ${s.vestedAmount.toLocaleString()} / ${grant?.totalAmount.toLocaleString()}`);
        console.log(`    Claimed: ${s.claimedAmount.toLocaleString()}`);
        console.log(`    Claimable: ${s.claimableAmount.toLocaleString()}`);
        console.log(`    Fully vested: ${s.fullyVested ? 'Yes' : 'No'}`);
      });
      console.log();
    }

    // Save CSV report
    if (result.metadata?.csvReport) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `vesting-report-${timestamp}.csv`;

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

  } catch (error) {
    console.error('❌ Vesting processing failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  processVestingClaims()
    .then(() => {
      console.log('\n✅ Vesting process complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Vesting process failed:', error);
      process.exit(1);
    });
}

export { processVestingClaims };
