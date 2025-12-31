/**
 * Token Vesting Pattern
 *
 * Automated token vesting and distribution for employee compensation,
 * investor unlocks, and community rewards. Supports cliff periods,
 * linear vesting, and multiple vesting schedules.
 *
 * Ideal for team tokens, advisor compensation, and investor allocations.
 */

import type { Transaction, TransactionInstruction } from '../../types';
import { Fabrknt } from '../../core/fabrknt';
import {
  ExecutionPattern,
  PatternConfig,
  PatternResult,
} from '../types';

/**
 * Vesting schedule configuration
 */
export interface VestingSchedule {
  /** Schedule type */
  type: 'linear' | 'milestone';
  /** Total vesting duration in milliseconds */
  duration: number;
  /** Cliff period in milliseconds (no tokens until cliff) */
  cliffDuration?: number;
  /** Start date (timestamp) */
  startDate: number;
  /** Milestone unlock percentages (for milestone vesting) */
  milestones?: {
    /** Percentage to unlock (0-100) */
    percentage: number;
    /** Date of milestone (timestamp) */
    date: number;
  }[];
}

/**
 * Individual vesting grant
 */
export interface VestingGrant {
  /** Unique grant identifier */
  id: string;
  /** Beneficiary wallet address */
  beneficiary: string;
  /** Total token amount */
  totalAmount: number;
  /** Token mint address */
  token: string;
  /** Vesting schedule */
  schedule: VestingSchedule;
  /** Amount already claimed */
  claimedAmount?: number;
  /** Whether grant is active */
  active?: boolean;
  /** Optional memo/note */
  memo?: string;
}

/**
 * Vesting claim record
 */
export interface VestingClaim {
  /** Grant ID */
  grantId: string;
  /** Claim timestamp */
  timestamp: number;
  /** Transaction hash */
  txHash: string;
  /** Amount claimed */
  amount: number;
  /** Token claimed */
  token: string;
  /** Beneficiary wallet */
  beneficiary: string;
  /** Status */
  status: 'success' | 'failed' | 'not_claimable';
  /** Vested amount at time of claim */
  vestedAmount?: number;
  /** Total claimed after this claim */
  totalClaimed?: number;
  /** Error message if failed */
  error?: string;
  /** Gas cost in SOL */
  gasCost?: number;
}

/**
 * Token vesting configuration
 */
export interface TokenVestingConfig extends PatternConfig {
  /** List of vesting grants */
  grants: VestingGrant[];
  /** Vault wallet address holding tokens */
  vaultWallet?: string;
  /** Auto-claim on behalf of beneficiaries (default: false) */
  autoClaim?: boolean;
  /** Generate vesting report (default: true) */
  generateReport?: boolean;
}

/**
 * Token Vesting Pattern
 *
 * Production-ready pattern for token vesting with cliff periods,
 * linear unlocks, and milestone-based distribution.
 *
 * Features:
 * - Cliff periods (no tokens until cliff date)
 * - Linear vesting over time
 * - Milestone-based unlocks
 * - Automatic vested amount calculation
 * - Claim tracking and history
 * - Guard security validation
 * - CSV reporting for compliance
 *
 * @example
 * ```typescript
 * import { TokenVestingPattern, Guard } from '@fabrknt/sdk';
 *
 * const vesting = new TokenVestingPattern({
 *   name: 'Team Token Vesting',
 *   grants: [
 *     {
 *       id: 'team-001',
 *       beneficiary: 'ABC...xyz',
 *       totalAmount: 100000,
 *       token: 'PROJECT_TOKEN',
 *       schedule: {
 *         type: 'linear',
 *         duration: 365 * 24 * 60 * 60 * 1000, // 1 year
 *         cliffDuration: 90 * 24 * 60 * 60 * 1000, // 90 days
 *         startDate: Date.now(),
 *       },
 *     },
 *   ],
 *   guard: new Guard({
 *     maxSlippage: 0.01,
 *     mode: 'block',
 *   }),
 *   vaultWallet: 'vault-address',
 *   autoClaim: true,
 * });
 *
 * const result = await vesting.execute();
 * console.log(`Processed ${result.metadata?.claims.length} claims`);
 * ```
 */
export class TokenVestingPattern extends ExecutionPattern {
  protected config: TokenVestingConfig;
  private claims: VestingClaim[] = [];

  constructor(config: TokenVestingConfig) {
    super(config);
    this.config = {
      autoClaim: false,
      generateReport: true,
      ...config,
    };
  }

  /**
   * Execute vesting claims for all grants
   */
  async execute(): Promise<PatternResult> {
    this.startTime = Date.now();

    try {
      // Validate configuration
      if (!this.validate()) {
        throw new Error('Invalid token vesting configuration');
      }

      const transactions: Transaction[] = [];
      this.claims = [];

      const now = Date.now();

      // Process each grant
      for (const grant of this.config.grants) {
        if (grant.active === false) {
          continue;
        }

        // Calculate vested amount
        const vestedAmount = this.calculateVestedAmount(grant, now);
        const claimedAmount = grant.claimedAmount || 0;
        const claimableAmount = Math.max(0, vestedAmount - claimedAmount);

        if (claimableAmount <= 0) {
          // Record as not claimable
          this.claims.push({
            grantId: grant.id,
            timestamp: now,
            txHash: '',
            amount: 0,
            token: grant.token,
            beneficiary: grant.beneficiary,
            status: 'not_claimable',
            vestedAmount,
            totalClaimed: claimedAmount,
          });
          continue;
        }

        // Create and execute claim transaction
        try {
          const tx = await this.createClaimTransaction(grant, claimableAmount);

          await this.executeWithRetry(async () => {
            if (this.config.guard) {
              const validation = await this.config.guard.validateTransaction(tx);
              if (!validation.isValid) {
                throw new Error(
                  `Guard validation failed: ${validation.warnings.map(w => w.message).join(', ')}`
                );
              }
            }

            if (!this.config.dryRun) {
              await Fabrknt.execute(tx, { with: this.config.guard });
            }

            return tx;
          });

          transactions.push(tx);

          // Update claimed amount
          grant.claimedAmount = claimedAmount + claimableAmount;

          // Record successful claim
          this.claims.push({
            grantId: grant.id,
            timestamp: now,
            txHash: tx.id,
            amount: claimableAmount,
            token: grant.token,
            beneficiary: grant.beneficiary,
            status: 'success',
            vestedAmount,
            totalClaimed: grant.claimedAmount,
            gasCost: 0.000005,
          });
        } catch (error) {
          // Record failed claim
          this.claims.push({
            grantId: grant.id,
            timestamp: now,
            txHash: '',
            amount: claimableAmount,
            token: grant.token,
            beneficiary: grant.beneficiary,
            status: 'failed',
            vestedAmount,
            totalClaimed: claimedAmount,
            error: (error as Error).message,
          });
        }
      }

      // Generate metrics
      const metrics = this.createMetrics(transactions);

      const totalGasCost = this.claims.reduce(
        (sum, claim) => sum + (claim.gasCost || 0),
        0
      );

      // Return result with claim history
      const result: PatternResult = {
        success: true,
        transactions,
        metrics: {
          ...metrics,
          actualCost: totalGasCost,
          custom: {
            totalGrants: this.config.grants.length,
            activeGrants: this.config.grants.filter(g => g.active !== false).length,
            successfulClaims: this.claims.filter(c => c.status === 'success').length,
            failedClaims: this.claims.filter(c => c.status === 'failed').length,
            notClaimable: this.claims.filter(c => c.status === 'not_claimable').length,
            totalClaimed: this.claims
              .filter(c => c.status === 'success')
              .reduce((sum, c) => sum + c.amount, 0),
          },
        },
      };

      if (this.config.generateReport) {
        result.metadata = {
          claims: this.claims,
          csvReport: this.generateCSVReport(),
          totalGasCost,
          vestingStatus: this.getVestingStatus(),
        };
      }

      return result;
    } catch (error) {
      const metrics = this.createMetrics([]);
      return {
        success: false,
        transactions: [],
        metrics,
        error: error as Error,
      };
    }
  }

  /**
   * Calculate vested amount for a grant at given timestamp
   */
  private calculateVestedAmount(grant: VestingGrant, timestamp: number): number {
    const { schedule, totalAmount } = grant;

    // Check if before start date
    if (timestamp < schedule.startDate) {
      return 0;
    }

    // Check cliff period
    if (schedule.cliffDuration) {
      const cliffEnd = schedule.startDate + schedule.cliffDuration;
      if (timestamp < cliffEnd) {
        return 0;
      }
    }

    const vestingEnd = schedule.startDate + schedule.duration;

    // If vesting period is complete
    if (timestamp >= vestingEnd) {
      return totalAmount;
    }

    switch (schedule.type) {
      case 'linear': {
        // Linear vesting calculation
        const elapsed = timestamp - schedule.startDate;
        const vestingProgress = elapsed / schedule.duration;
        return Math.floor(totalAmount * vestingProgress);
      }

      case 'milestone': {
        if (!schedule.milestones || schedule.milestones.length === 0) {
          return 0;
        }

        // Calculate based on milestones reached
        let vestedPercentage = 0;
        for (const milestone of schedule.milestones) {
          if (timestamp >= milestone.date) {
            vestedPercentage += milestone.percentage;
          }
        }

        return Math.floor(totalAmount * (vestedPercentage / 100));
      }

      default:
        return 0;
    }
  }

  /**
   * Get vesting status for all grants
   */
  private getVestingStatus(): Record<string, {
    vestedAmount: number;
    claimedAmount: number;
    claimableAmount: number;
    vestingProgress: number;
    fullyVested: boolean;
  }> {
    const status: Record<string, any> = {};
    const now = Date.now();

    for (const grant of this.config.grants) {
      const vestedAmount = this.calculateVestedAmount(grant, now);
      const claimedAmount = grant.claimedAmount || 0;
      const claimableAmount = Math.max(0, vestedAmount - claimedAmount);

      const vestingEnd = grant.schedule.startDate + grant.schedule.duration;
      const vestingProgress = Math.min(
        1,
        Math.max(0, (now - grant.schedule.startDate) / grant.schedule.duration)
      );

      status[grant.id] = {
        vestedAmount,
        claimedAmount,
        claimableAmount,
        vestingProgress: Math.round(vestingProgress * 100) / 100,
        fullyVested: now >= vestingEnd,
      };
    }

    return status;
  }

  /**
   * Create claim transaction
   */
  private async createClaimTransaction(
    grant: VestingGrant,
    amount: number
  ): Promise<Transaction> {
    const instructions: TransactionInstruction[] = [
      {
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { pubkey: this.config.vaultWallet || 'vault-wallet', isSigner: true, isWritable: true },
          { pubkey: grant.beneficiary, isSigner: false, isWritable: true },
        ],
        data: JSON.stringify({
          type: 'transfer',
          amount,
          token: grant.token,
          grantId: grant.id,
        }),
      },
    ];

    return {
      id: `vesting-claim-${grant.id}-${Date.now()}`,
      status: 'pending',
      instructions,
      assetAddresses: [grant.token],
    };
  }

  /**
   * Generate CSV report
   */
  private generateCSVReport(): string {
    const headers = [
      'Timestamp',
      'Grant ID',
      'Beneficiary',
      'Amount Claimed',
      'Token',
      'Status',
      'Vested Amount',
      'Total Claimed',
      'Transaction Hash',
      'Gas Cost (SOL)',
      'Error',
    ].join(',');

    const rows = this.claims.map(claim =>
      [
        new Date(claim.timestamp).toISOString(),
        claim.grantId,
        claim.beneficiary,
        claim.amount,
        claim.token,
        claim.status,
        claim.vestedAmount || '',
        claim.totalClaimed || '',
        claim.txHash,
        claim.gasCost || '',
        claim.error || '',
      ].join(',')
    );

    return [headers, ...rows].join('\n');
  }

  /**
   * Validate configuration
   */
  protected validate(): boolean {
    // Check grants exist
    if (!this.config.grants || this.config.grants.length === 0) {
      console.error('No grants specified');
      return false;
    }

    // Validate each grant
    for (const grant of this.config.grants) {
      if (!grant.id || !grant.beneficiary || !grant.totalAmount || !grant.token) {
        console.error('Invalid grant:', grant);
        return false;
      }

      if (grant.totalAmount <= 0) {
        console.error('Invalid total amount:', grant.totalAmount);
        return false;
      }

      // Validate schedule
      if (!grant.schedule || !grant.schedule.type || !grant.schedule.startDate) {
        console.error('Invalid vesting schedule:', grant.schedule);
        return false;
      }

      if (grant.schedule.duration <= 0) {
        console.error('Invalid vesting duration:', grant.schedule.duration);
        return false;
      }

      // Validate milestone vesting
      if (grant.schedule.type === 'milestone') {
        if (!grant.schedule.milestones || grant.schedule.milestones.length === 0) {
          console.error('Milestone vesting requires milestones');
          return false;
        }

        // Validate milestones sum to 100%
        const totalPercentage = grant.schedule.milestones.reduce(
          (sum, m) => sum + m.percentage,
          0
        );

        if (Math.abs(totalPercentage - 100) > 0.01) {
          console.error('Milestone percentages must sum to 100%:', totalPercentage);
          return false;
        }
      }

      // Validate claimed amount
      if (grant.claimedAmount && grant.claimedAmount < 0) {
        console.error('Invalid claimed amount:', grant.claimedAmount);
        return false;
      }

      if (grant.claimedAmount && grant.claimedAmount > grant.totalAmount) {
        console.error('Claimed amount exceeds total amount:', grant.claimedAmount);
        return false;
      }
    }

    return true;
  }
}
