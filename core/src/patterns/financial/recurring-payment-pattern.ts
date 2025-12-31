/**
 * Recurring Payment Pattern
 *
 * Automated recurring payment processing for subscriptions, salaries,
 * and scheduled transfers. Uses Guard for security and includes
 * automatic retry logic with failure handling.
 *
 * Ideal for subscription billing, regular payroll, and scheduled payments.
 */

import type { Transaction, TransactionInstruction } from '../../types';
import { Fabrknt } from '../../core/fabrknt';
import {
  ExecutionPattern,
  PatternConfig,
  PatternResult,
} from '../types';

/**
 * Payment schedule configuration
 */
export interface PaymentSchedule {
  /** Schedule type */
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  /** Interval in milliseconds (for custom schedules) */
  intervalMs?: number;
  /** Start date (timestamp) */
  startDate: number;
  /** End date (timestamp), optional for indefinite schedules */
  endDate?: number;
  /** Day of month for monthly schedules (1-31) */
  dayOfMonth?: number;
  /** Day of week for weekly schedules (0-6, 0=Sunday) */
  dayOfWeek?: number;
}

/**
 * Individual recurring payment
 */
export interface RecurringPayment {
  /** Unique payment identifier */
  id: string;
  /** Recipient wallet address */
  wallet: string;
  /** Amount to send */
  amount: number;
  /** Token to send */
  token: string;
  /** Payment schedule */
  schedule: PaymentSchedule;
  /** Optional memo/note */
  memo?: string;
  /** Whether payment is active */
  active?: boolean;
}

/**
 * Payment execution record
 */
export interface PaymentExecution {
  /** Payment ID */
  paymentId: string;
  /** Execution timestamp */
  timestamp: number;
  /** Transaction hash */
  txHash: string;
  /** Amount sent */
  amount: number;
  /** Token sent */
  token: string;
  /** Recipient wallet */
  recipient: string;
  /** Status */
  status: 'success' | 'failed' | 'skipped';
  /** Error message if failed */
  error?: string;
  /** Gas cost in SOL */
  gasCost?: number;
  /** Next scheduled execution */
  nextExecution?: number;
}

/**
 * Recurring payment configuration
 */
export interface RecurringPaymentConfig extends PatternConfig {
  /** List of recurring payments */
  payments: RecurringPayment[];
  /** Maximum retry attempts for failed payments (default: 3) */
  maxRetries?: number;
  /** Generate execution report (default: true) */
  generateReport?: boolean;
  /** Sender wallet address */
  senderWallet?: string;
  /** Automatically calculate next execution times (default: true) */
  autoSchedule?: boolean;
}

/**
 * Recurring Payment Pattern
 *
 * Production-ready pattern for automated recurring payments with schedule
 * management, retry logic, and failure handling.
 *
 * Features:
 * - Flexible scheduling (daily, weekly, monthly, custom intervals)
 * - Guard security validation
 * - Automatic retry logic for failed payments
 * - Next execution calculation
 * - Execution history and reporting
 * - Individual payment enable/disable
 *
 * @example
 * ```typescript
 * import { RecurringPaymentPattern, Guard } from '@fabrknt/sdk';
 *
 * const subscriptions = new RecurringPaymentPattern({
 *   name: 'Monthly Subscriptions',
 *   payments: [
 *     {
 *       id: 'sub-001',
 *       wallet: 'ABC...xyz',
 *       amount: 99,
 *       token: 'USDC',
 *       schedule: {
 *         type: 'monthly',
 *         startDate: Date.now(),
 *         dayOfMonth: 1,
 *       },
 *     },
 *   ],
 *   guard: new Guard({
 *     maxSlippage: 0.01,
 *     mode: 'block',
 *   }),
 *   autoSchedule: true,
 * });
 *
 * const result = await subscriptions.execute();
 * console.log(`Processed ${result.metadata?.executions.length} payments`);
 * ```
 */
export class RecurringPaymentPattern extends ExecutionPattern {
  protected config: RecurringPaymentConfig;
  private executions: PaymentExecution[] = [];

  constructor(config: RecurringPaymentConfig) {
    super(config);
    this.config = {
      maxRetries: 3,
      generateReport: true,
      autoSchedule: true,
      ...config,
    };
  }

  /**
   * Execute recurring payments that are due
   */
  async execute(): Promise<PatternResult> {
    this.startTime = Date.now();

    try {
      // Validate configuration
      if (!this.validate()) {
        throw new Error('Invalid recurring payment configuration');
      }

      const transactions: Transaction[] = [];
      this.executions = [];

      const now = Date.now();

      // Filter payments that are due for execution
      const duePayments = this.config.payments.filter(payment => {
        if (payment.active === false) {
          return false;
        }

        // Check if payment is due based on schedule
        return this.isPaymentDue(payment, now);
      });

      // Execute each due payment
      for (const payment of duePayments) {
        try {
          const tx = await this.createPaymentTransaction(payment);

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

          // Calculate next execution time
          const nextExecution = this.config.autoSchedule
            ? this.calculateNextExecution(payment)
            : undefined;

          // Record successful execution
          this.executions.push({
            paymentId: payment.id,
            timestamp: now,
            txHash: tx.id,
            amount: payment.amount,
            token: payment.token,
            recipient: payment.wallet,
            status: 'success',
            gasCost: 0.000005,
            nextExecution,
          });
        } catch (error) {
          // Record failed execution
          this.executions.push({
            paymentId: payment.id,
            timestamp: now,
            txHash: '',
            amount: payment.amount,
            token: payment.token,
            recipient: payment.wallet,
            status: 'failed',
            error: (error as Error).message,
          });
        }
      }

      // Record skipped payments (not due yet)
      const skippedPayments = this.config.payments.filter(
        payment => !duePayments.includes(payment) && payment.active !== false
      );

      for (const payment of skippedPayments) {
        const nextExecution = this.calculateNextExecution(payment);
        this.executions.push({
          paymentId: payment.id,
          timestamp: now,
          txHash: '',
          amount: payment.amount,
          token: payment.token,
          recipient: payment.wallet,
          status: 'skipped',
          nextExecution,
        });
      }

      // Generate metrics
      const metrics = this.createMetrics(transactions);

      const totalGasCost = this.executions.reduce(
        (sum, exec) => sum + (exec.gasCost || 0),
        0
      );

      // Return result with execution history
      const result: PatternResult = {
        success: true,
        transactions,
        metrics: {
          ...metrics,
          actualCost: totalGasCost,
          custom: {
            totalPayments: this.config.payments.length,
            duePayments: duePayments.length,
            successfulExecutions: this.executions.filter(e => e.status === 'success').length,
            failedExecutions: this.executions.filter(e => e.status === 'failed').length,
            skippedPayments: skippedPayments.length,
          },
        },
      };

      if (this.config.generateReport) {
        result.metadata = {
          executions: this.executions,
          csvReport: this.generateCSVReport(),
          totalGasCost,
          nextExecutionSchedule: this.getNextExecutionSchedule(),
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
   * Check if payment is due for execution
   */
  private isPaymentDue(payment: RecurringPayment, now: number): boolean {
    const { schedule } = payment;

    // Check if before start date
    if (now < schedule.startDate) {
      return false;
    }

    // Check if after end date
    if (schedule.endDate && now > schedule.endDate) {
      return false;
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;

    switch (schedule.type) {
      case 'daily':
        // Due if at least one day has passed since start
        return (now - schedule.startDate) >= dayMs;

      case 'weekly':
        if (schedule.dayOfWeek === undefined) return false;
        const currentDay = new Date(now).getDay();
        return currentDay === schedule.dayOfWeek && (now - schedule.startDate) >= weekMs;

      case 'monthly':
        if (schedule.dayOfMonth === undefined) return false;
        const currentDate = new Date(now).getDate();
        const monthsPassed = this.getMonthsDifference(schedule.startDate, now);
        return currentDate === schedule.dayOfMonth && monthsPassed >= 1;

      case 'custom':
        if (!schedule.intervalMs) return false;
        return (now - schedule.startDate) >= schedule.intervalMs;

      default:
        return false;
    }
  }

  /**
   * Calculate next execution time for a payment
   */
  private calculateNextExecution(payment: RecurringPayment): number {
    const { schedule } = payment;
    const now = Date.now();

    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;

    switch (schedule.type) {
      case 'daily':
        return now + dayMs;

      case 'weekly':
        if (schedule.dayOfWeek === undefined) return now + weekMs;
        const currentDay = new Date(now).getDay();
        const daysUntilNext = (schedule.dayOfWeek - currentDay + 7) % 7 || 7;
        return now + (daysUntilNext * dayMs);

      case 'monthly':
        if (schedule.dayOfMonth === undefined) return now + (30 * dayMs);
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(schedule.dayOfMonth);
        return nextMonth.getTime();

      case 'custom':
        return now + (schedule.intervalMs || dayMs);

      default:
        return now + dayMs;
    }
  }

  /**
   * Get next execution schedule for all payments
   */
  private getNextExecutionSchedule(): Record<string, number> {
    const schedule: Record<string, number> = {};

    for (const payment of this.config.payments) {
      if (payment.active !== false) {
        schedule[payment.id] = this.calculateNextExecution(payment);
      }
    }

    return schedule;
  }

  /**
   * Get months difference between two timestamps
   */
  private getMonthsDifference(start: number, end: number): number {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthsDiff = endDate.getMonth() - startDate.getMonth();

    return yearsDiff * 12 + monthsDiff;
  }

  /**
   * Create payment transaction
   */
  private async createPaymentTransaction(
    payment: RecurringPayment
  ): Promise<Transaction> {
    const instructions: TransactionInstruction[] = [
      {
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        keys: [
          { pubkey: this.config.senderWallet || 'sender-wallet', isSigner: true, isWritable: true },
          { pubkey: payment.wallet, isSigner: false, isWritable: true },
        ],
        data: JSON.stringify({
          type: 'transfer',
          amount: payment.amount,
          token: payment.token,
          paymentId: payment.id,
        }),
      },
    ];

    return {
      id: `recurring-${payment.id}-${Date.now()}`,
      status: 'pending',
      instructions,
      assetAddresses: [payment.token],
    };
  }

  /**
   * Generate CSV report
   */
  private generateCSVReport(): string {
    const headers = [
      'Timestamp',
      'Payment ID',
      'Recipient',
      'Amount',
      'Token',
      'Status',
      'Transaction Hash',
      'Gas Cost (SOL)',
      'Next Execution',
      'Error',
    ].join(',');

    const rows = this.executions.map(exec =>
      [
        new Date(exec.timestamp).toISOString(),
        exec.paymentId,
        exec.recipient,
        exec.amount,
        exec.token,
        exec.status,
        exec.txHash,
        exec.gasCost || '',
        exec.nextExecution ? new Date(exec.nextExecution).toISOString() : '',
        exec.error || '',
      ].join(',')
    );

    return [headers, ...rows].join('\n');
  }

  /**
   * Validate configuration
   */
  protected validate(): boolean {
    // Check payments exist
    if (!this.config.payments || this.config.payments.length === 0) {
      console.error('No payments specified');
      return false;
    }

    // Validate each payment
    for (const payment of this.config.payments) {
      if (!payment.id || !payment.wallet || !payment.amount || !payment.token) {
        console.error('Invalid payment:', payment);
        return false;
      }

      if (payment.amount <= 0) {
        console.error('Invalid amount:', payment.amount);
        return false;
      }

      // Validate schedule
      if (!payment.schedule || !payment.schedule.type || !payment.schedule.startDate) {
        console.error('Invalid schedule:', payment.schedule);
        return false;
      }

      // Validate schedule-specific fields
      const { schedule } = payment;
      if (schedule.type === 'weekly' && schedule.dayOfWeek === undefined) {
        console.error('Weekly schedule requires dayOfWeek');
        return false;
      }

      if (schedule.type === 'monthly' && schedule.dayOfMonth === undefined) {
        console.error('Monthly schedule requires dayOfMonth');
        return false;
      }

      if (schedule.type === 'custom' && !schedule.intervalMs) {
        console.error('Custom schedule requires intervalMs');
        return false;
      }
    }

    return true;
  }
}
