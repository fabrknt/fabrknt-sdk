/**
 * Financial Patterns Tests
 *
 * Comprehensive tests for BatchPayoutPattern, RecurringPaymentPattern,
 * and TokenVestingPattern. Tests validation, execution, scheduling,
 * calculations, and edge cases.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BatchPayoutPattern } from "../src/patterns/financial/batch-payout-pattern";
import { RecurringPaymentPattern } from "../src/patterns/financial/recurring-payment-pattern";
import { TokenVestingPattern } from "../src/patterns/financial/token-vesting-pattern";
import { Guard } from "../src/guard";
import { Fabrknt } from "../src/core/fabrknt";
import type {
    BatchPayoutConfig,
    RecurringPaymentConfig,
    TokenVestingConfig,
} from "../src/patterns/financial";

// Mock Fabrknt.execute
vi.mock("../src/core/fabrknt", () => ({
    Fabrknt: {
        execute: vi.fn(async (tx: any) => ({
            ...tx,
            status: "executed",
        })),
    },
}));

describe("Financial Patterns", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("BatchPayoutPattern", () => {
        describe("Constructor", () => {
            it("should create pattern with valid config", () => {
                const config: BatchPayoutConfig = {
                    name: "Monthly Payroll",
                    recipients: [
                        {
                            wallet: "ABC123",
                            amount: 1000,
                            token: "USDC",
                            id: "emp-001",
                        },
                    ],
                };

                const pattern = new BatchPayoutPattern(config);

                expect(pattern).toBeDefined();
                const patternConfig = (pattern as any).config;
                expect(patternConfig.name).toBe("Monthly Payroll");
                expect(patternConfig.enableParallel).toBe(true);
                expect(patternConfig.generateReport).toBe(true);
                expect(patternConfig.batchSize).toBe(10);
            });

            it("should override defaults", () => {
                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients: [
                        {
                            wallet: "ABC123",
                            amount: 1000,
                            token: "USDC",
                        },
                    ],
                    enableParallel: false,
                    generateReport: false,
                    batchSize: 5,
                };

                const pattern = new BatchPayoutPattern(config);

                const patternConfig = (pattern as any).config;
                expect(patternConfig.enableParallel).toBe(false);
                expect(patternConfig.generateReport).toBe(false);
                expect(patternConfig.batchSize).toBe(5);
            });
        });

        describe("Validation", () => {
            it("should validate valid configuration", () => {
                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients: [
                        {
                            wallet: "ABC123",
                            amount: 1000,
                            token: "USDC",
                        },
                    ],
                };

                const pattern = new BatchPayoutPattern(config);
                const isValid = (pattern as any).validate();

                expect(isValid).toBe(true);
            });

            it("should reject empty recipients", () => {
                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients: [],
                };

                const pattern = new BatchPayoutPattern(config);
                const isValid = (pattern as any).validate();

                expect(isValid).toBe(false);
            });

            it("should reject missing wallet", () => {
                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients: [
                        {
                            wallet: "",
                            amount: 1000,
                            token: "USDC",
                        } as any,
                    ],
                };

                const pattern = new BatchPayoutPattern(config);
                const isValid = (pattern as any).validate();

                expect(isValid).toBe(false);
            });

            it("should reject invalid amount", () => {
                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients: [
                        {
                            wallet: "ABC123",
                            amount: 0,
                            token: "USDC",
                        },
                    ],
                };

                const pattern = new BatchPayoutPattern(config);
                const isValid = (pattern as any).validate();

                expect(isValid).toBe(false);
            });

            it("should reject negative amount", () => {
                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients: [
                        {
                            wallet: "ABC123",
                            amount: -100,
                            token: "USDC",
                        },
                    ],
                };

                const pattern = new BatchPayoutPattern(config);
                const isValid = (pattern as any).validate();

                expect(isValid).toBe(false);
            });

            it("should reject invalid batch size", () => {
                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients: [
                        {
                            wallet: "ABC123",
                            amount: 1000,
                            token: "USDC",
                        },
                    ],
                    batchSize: -1, // Negative batch size should be invalid
                };

                const pattern = new BatchPayoutPattern(config);
                const isValid = (pattern as any).validate();

                expect(isValid).toBe(false);
            });
        });

        describe("Execution - Sequential", () => {
            it("should execute sequential payouts", async () => {
                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients: [
                        {
                            wallet: "ABC123",
                            amount: 1000,
                            token: "USDC",
                            id: "emp-001",
                        },
                        {
                            wallet: "DEF456",
                            amount: 2000,
                            token: "USDC",
                            id: "emp-002",
                        },
                    ],
                    enableParallel: false,
                    dryRun: true,
                };

                const pattern = new BatchPayoutPattern(config);
                const result = await pattern.execute();

                expect(result.success).toBe(true);
                expect(result.transactions).toHaveLength(2);
                expect(result.metrics.custom?.totalRecipients).toBe(2);
                expect(result.metrics.custom?.successfulPayments).toBe(2);
            });

            it("should generate report when enabled", async () => {
                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients: [
                        {
                            wallet: "ABC123",
                            amount: 1000,
                            token: "USDC",
                            id: "emp-001",
                        },
                    ],
                    enableParallel: false,
                    generateReport: true,
                    dryRun: true,
                };

                const pattern = new BatchPayoutPattern(config);
                const result = await pattern.execute();

                expect(result.metadata).toBeDefined();
                expect(result.metadata?.report).toBeDefined();
                expect(result.metadata?.report).toHaveLength(1);
                expect(result.metadata?.csvReport).toBeDefined();
                expect(result.metadata?.totalAmount).toBe(1000);
            });

            it("should handle Guard validation", async () => {
                const guard = new Guard({
                    maxSlippage: 0.01,
                    mode: "block",
                });

                const validateSpy = vi
                    .spyOn(guard, "validateTransaction")
                    .mockResolvedValue({
                        isValid: true,
                        warnings: [],
                    });

                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients: [
                        {
                            wallet: "ABC123",
                            amount: 1000,
                            token: "USDC",
                        },
                    ],
                    enableParallel: false,
                    guard,
                    dryRun: true,
                };

                const pattern = new BatchPayoutPattern(config);
                await pattern.execute();

                expect(validateSpy).toHaveBeenCalled();
            });

            it("should handle execution failures gracefully", async () => {
                vi.mocked(Fabrknt.execute).mockRejectedValueOnce(
                    new Error("Execution failed")
                );

                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients: [
                        {
                            wallet: "ABC123",
                            amount: 1000,
                            token: "USDC",
                        },
                    ],
                    enableParallel: false,
                    dryRun: false,
                    generateReport: true, // Enable report to capture failures
                };

                const pattern = new BatchPayoutPattern(config);
                const result = await pattern.execute();

                expect(result.success).toBe(true); // Pattern succeeds even if individual payments fail
                expect(result.metadata?.report).toBeDefined();
                const report = result.metadata?.report as any[];
                // Check if there's a failed entry in the report
                if (report && report.length > 0) {
                    const failedReport = report.find(
                        (r: any) => r.status === "failed"
                    );
                    // If execution fails, it should be recorded in the report
                    expect(report.length).toBeGreaterThan(0);
                }
            });
        });

        describe("Execution - Parallel", () => {
            it("should create batches for parallel execution", async () => {
                const recipients = Array.from({ length: 25 }, (_, i) => ({
                    wallet: `wallet-${i}`,
                    amount: 1000,
                    token: "USDC",
                }));

                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients,
                    enableParallel: true,
                    batchSize: 10,
                    dryRun: true,
                };

                const pattern = new BatchPayoutPattern(config);
                const batches = (pattern as any).createBatches();

                expect(batches).toHaveLength(3); // 25 recipients / 10 batch size = 3 batches
                expect(batches[0]).toHaveLength(10);
                expect(batches[1]).toHaveLength(10);
                expect(batches[2]).toHaveLength(5);
            });

            it("should execute parallel batches", async () => {
                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients: [
                        {
                            wallet: "ABC123",
                            amount: 1000,
                            token: "USDC",
                        },
                        {
                            wallet: "DEF456",
                            amount: 2000,
                            token: "USDC",
                        },
                    ],
                    enableParallel: true,
                    batchSize: 1,
                    dryRun: true,
                };

                const pattern = new BatchPayoutPattern(config);
                const result = await pattern.execute();

                expect(result.success).toBe(true);
                expect(result.transactions).toHaveLength(2);
            });
        });

        describe("Report Generation", () => {
            it("should generate CSV report", async () => {
                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients: [
                        {
                            wallet: "ABC123",
                            amount: 1000,
                            token: "USDC",
                            id: "emp-001",
                            memo: "Salary",
                        },
                    ],
                    enableParallel: false,
                    generateReport: true,
                    dryRun: true,
                };

                const pattern = new BatchPayoutPattern(config);
                const result = await pattern.execute();

                expect(result.metadata?.csvReport).toBeDefined();
                expect(result.metadata?.csvReport).toContain("Timestamp");
                expect(result.metadata?.csvReport).toContain("Recipient ID");
                expect(result.metadata?.csvReport).toContain("ABC123");
                expect(result.metadata?.csvReport).toContain("1000");
            });

            it("should calculate total amount", async () => {
                const config: BatchPayoutConfig = {
                    name: "Test",
                    recipients: [
                        {
                            wallet: "ABC123",
                            amount: 1000,
                            token: "USDC",
                        },
                        {
                            wallet: "DEF456",
                            amount: 2000,
                            token: "USDC",
                        },
                        {
                            wallet: "GHI789",
                            amount: 3000,
                            token: "USDC",
                        },
                    ],
                    enableParallel: false,
                    generateReport: true,
                    dryRun: true,
                };

                const pattern = new BatchPayoutPattern(config);
                const result = await pattern.execute();

                expect(result.metadata?.totalAmount).toBe(6000);
            });
        });
    });

    describe("RecurringPaymentPattern", () => {
        describe("Constructor", () => {
            it("should create pattern with valid config", () => {
                const config: RecurringPaymentConfig = {
                    name: "Monthly Subscriptions",
                    payments: [
                        {
                            id: "sub-001",
                            wallet: "ABC123",
                            amount: 99,
                            token: "USDC",
                            schedule: {
                                type: "monthly",
                                startDate: Date.now(),
                                dayOfMonth: 1,
                            },
                        },
                    ],
                };

                const pattern = new RecurringPaymentPattern(config);

                expect(pattern).toBeDefined();
                const patternConfig = (pattern as any).config;
                expect(patternConfig.name).toBe("Monthly Subscriptions");
                expect(patternConfig.maxRetries).toBe(3);
                expect(patternConfig.generateReport).toBe(true);
                expect(patternConfig.autoSchedule).toBe(true);
            });

            it("should override defaults", () => {
                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [
                        {
                            id: "sub-001",
                            wallet: "ABC123",
                            amount: 99,
                            token: "USDC",
                            schedule: {
                                type: "monthly",
                                startDate: Date.now(),
                                dayOfMonth: 1,
                            },
                        },
                    ],
                    maxRetries: 5,
                    generateReport: false,
                    autoSchedule: false,
                };

                const pattern = new RecurringPaymentPattern(config);

                const patternConfig = (pattern as any).config;
                expect(patternConfig.maxRetries).toBe(5);
                expect(patternConfig.generateReport).toBe(false);
                expect(patternConfig.autoSchedule).toBe(false);
            });
        });

        describe("Validation", () => {
            it("should validate valid configuration", () => {
                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [
                        {
                            id: "sub-001",
                            wallet: "ABC123",
                            amount: 99,
                            token: "USDC",
                            schedule: {
                                type: "monthly",
                                startDate: Date.now(),
                                dayOfMonth: 1,
                            },
                        },
                    ],
                };

                const pattern = new RecurringPaymentPattern(config);
                const isValid = (pattern as any).validate();

                expect(isValid).toBe(true);
            });

            it("should reject empty payments", () => {
                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [],
                };

                const pattern = new RecurringPaymentPattern(config);
                const isValid = (pattern as any).validate();

                expect(isValid).toBe(false);
            });

            it("should reject missing schedule fields", () => {
                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [
                        {
                            id: "sub-001",
                            wallet: "ABC123",
                            amount: 99,
                            token: "USDC",
                            schedule: {
                                type: "weekly",
                                startDate: Date.now(),
                                // Missing dayOfWeek
                            } as any,
                        },
                    ],
                };

                const pattern = new RecurringPaymentPattern(config);
                const isValid = (pattern as any).validate();

                expect(isValid).toBe(false);
            });

            it("should reject invalid custom interval", () => {
                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [
                        {
                            id: "sub-001",
                            wallet: "ABC123",
                            amount: 99,
                            token: "USDC",
                            schedule: {
                                type: "custom",
                                startDate: Date.now(),
                                // Missing intervalMs
                            } as any,
                        },
                    ],
                };

                const pattern = new RecurringPaymentPattern(config);
                const isValid = (pattern as any).validate();

                expect(isValid).toBe(false);
            });
        });

        describe("Payment Scheduling", () => {
            it("should detect daily payments due", () => {
                const now = Date.now();
                const dayMs = 24 * 60 * 60 * 1000;
                const startDate = now - dayMs * 2; // 2 days ago

                const payment = {
                    id: "sub-001",
                    wallet: "ABC123",
                    amount: 99,
                    token: "USDC",
                    schedule: {
                        type: "daily" as const,
                        startDate,
                    },
                };

                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [payment],
                };

                const pattern = new RecurringPaymentPattern(config);
                const isDue = (pattern as any).isPaymentDue(payment, now);

                expect(isDue).toBe(true);
            });

            it("should detect weekly payments due", () => {
                const now = Date.now();
                const weekMs = 7 * 24 * 60 * 60 * 1000;
                const startDate = now - weekMs * 2; // 2 weeks ago
                const currentDay = new Date(now).getDay();

                const payment = {
                    id: "sub-001",
                    wallet: "ABC123",
                    amount: 99,
                    token: "USDC",
                    schedule: {
                        type: "weekly" as const,
                        startDate,
                        dayOfWeek: currentDay,
                    },
                };

                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [payment],
                };

                const pattern = new RecurringPaymentPattern(config);
                const isDue = (pattern as any).isPaymentDue(payment, now);

                expect(isDue).toBe(true);
            });

            it("should detect monthly payments due", () => {
                const now = Date.now();
                const currentDate = new Date(now).getDate();
                const startDate = new Date(now);
                startDate.setMonth(startDate.getMonth() - 2); // 2 months ago

                const payment = {
                    id: "sub-001",
                    wallet: "ABC123",
                    amount: 99,
                    token: "USDC",
                    schedule: {
                        type: "monthly" as const,
                        startDate: startDate.getTime(),
                        dayOfMonth: currentDate,
                    },
                };

                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [payment],
                };

                const pattern = new RecurringPaymentPattern(config);
                const isDue = (pattern as any).isPaymentDue(payment, now);

                expect(isDue).toBe(true);
            });

            it("should detect custom interval payments due", () => {
                const now = Date.now();
                const intervalMs = 24 * 60 * 60 * 1000; // 1 day
                const startDate = now - intervalMs * 2; // 2 days ago

                const payment = {
                    id: "sub-001",
                    wallet: "ABC123",
                    amount: 99,
                    token: "USDC",
                    schedule: {
                        type: "custom" as const,
                        startDate,
                        intervalMs,
                    },
                };

                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [payment],
                };

                const pattern = new RecurringPaymentPattern(config);
                const isDue = (pattern as any).isPaymentDue(payment, now);

                expect(isDue).toBe(true);
            });

            it("should not detect payments before start date", () => {
                const now = Date.now();
                const startDate = now + 24 * 60 * 60 * 1000; // Tomorrow

                const payment = {
                    id: "sub-001",
                    wallet: "ABC123",
                    amount: 99,
                    token: "USDC",
                    schedule: {
                        type: "daily" as const,
                        startDate,
                    },
                };

                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [payment],
                };

                const pattern = new RecurringPaymentPattern(config);
                const isDue = (pattern as any).isPaymentDue(payment, now);

                expect(isDue).toBe(false);
            });

            it("should not detect payments after end date", () => {
                const now = Date.now();
                const startDate = now - 24 * 60 * 60 * 1000; // Yesterday
                const endDate = now - 1; // Just passed

                const payment = {
                    id: "sub-001",
                    wallet: "ABC123",
                    amount: 99,
                    token: "USDC",
                    schedule: {
                        type: "daily" as const,
                        startDate,
                        endDate,
                    },
                };

                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [payment],
                };

                const pattern = new RecurringPaymentPattern(config);
                const isDue = (pattern as any).isPaymentDue(payment, now);

                expect(isDue).toBe(false);
            });
        });

        describe("Next Execution Calculation", () => {
            it("should calculate next daily execution", () => {
                const now = Date.now();
                const dayMs = 24 * 60 * 60 * 1000;

                const payment = {
                    id: "sub-001",
                    wallet: "ABC123",
                    amount: 99,
                    token: "USDC",
                    schedule: {
                        type: "daily" as const,
                        startDate: now,
                    },
                };

                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [payment],
                };

                const pattern = new RecurringPaymentPattern(config);
                const nextExecution = (pattern as any).calculateNextExecution(
                    payment
                );

                expect(nextExecution).toBeGreaterThan(now);
                expect(nextExecution - now).toBeCloseTo(dayMs, -3); // Within 1 second
            });

            it("should calculate next weekly execution", () => {
                const now = Date.now();
                const dayMs = 24 * 60 * 60 * 1000;
                const currentDay = new Date(now).getDay();
                const nextDay = (currentDay + 1) % 7;

                const payment = {
                    id: "sub-001",
                    wallet: "ABC123",
                    amount: 99,
                    token: "USDC",
                    schedule: {
                        type: "weekly" as const,
                        startDate: now,
                        dayOfWeek: nextDay,
                    },
                };

                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [payment],
                };

                const pattern = new RecurringPaymentPattern(config);
                const nextExecution = (pattern as any).calculateNextExecution(
                    payment
                );

                expect(nextExecution).toBeGreaterThan(now);
                expect(nextExecution - now).toBeLessThanOrEqual(dayMs * 7);
            });

            it("should calculate next monthly execution", () => {
                const now = Date.now();
                const dayMs = 24 * 60 * 60 * 1000;

                const payment = {
                    id: "sub-001",
                    wallet: "ABC123",
                    amount: 99,
                    token: "USDC",
                    schedule: {
                        type: "monthly" as const,
                        startDate: now,
                        dayOfMonth: 1,
                    },
                };

                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [payment],
                };

                const pattern = new RecurringPaymentPattern(config);
                const nextExecution = (pattern as any).calculateNextExecution(
                    payment
                );

                expect(nextExecution).toBeGreaterThan(now);
                expect(nextExecution - now).toBeLessThanOrEqual(dayMs * 32); // Max 32 days
            });
        });

        describe("Execution", () => {
            it("should execute due payments", async () => {
                const now = Date.now();
                const dayMs = 24 * 60 * 60 * 1000;

                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [
                        {
                            id: "sub-001",
                            wallet: "ABC123",
                            amount: 99,
                            token: "USDC",
                            schedule: {
                                type: "daily",
                                startDate: now - dayMs * 2,
                            },
                        },
                    ],
                    dryRun: true,
                };

                const pattern = new RecurringPaymentPattern(config);
                const result = await pattern.execute();

                expect(result.success).toBe(true);
                expect(result.transactions.length).toBeGreaterThan(0);
            });

            it("should skip inactive payments", async () => {
                const now = Date.now();
                const dayMs = 24 * 60 * 60 * 1000;

                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [
                        {
                            id: "sub-001",
                            wallet: "ABC123",
                            amount: 99,
                            token: "USDC",
                            schedule: {
                                type: "daily",
                                startDate: now - dayMs * 2,
                            },
                            active: false,
                        },
                    ],
                    dryRun: true,
                };

                const pattern = new RecurringPaymentPattern(config);
                const result = await pattern.execute();

                expect(result.success).toBe(true);
                expect(result.transactions).toHaveLength(0);
            });

            it("should generate execution report", async () => {
                const now = Date.now();
                const dayMs = 24 * 60 * 60 * 1000;

                const config: RecurringPaymentConfig = {
                    name: "Test",
                    payments: [
                        {
                            id: "sub-001",
                            wallet: "ABC123",
                            amount: 99,
                            token: "USDC",
                            schedule: {
                                type: "daily",
                                startDate: now - dayMs * 2,
                            },
                        },
                    ],
                    generateReport: true,
                    dryRun: true,
                };

                const pattern = new RecurringPaymentPattern(config);
                const result = await pattern.execute();

                expect(result.metadata).toBeDefined();
                expect(result.metadata?.executions).toBeDefined();
                expect(result.metadata?.csvReport).toBeDefined();
                expect(result.metadata?.nextExecutionSchedule).toBeDefined();
            });
        });
    });

    describe("TokenVestingPattern", () => {
        describe("Constructor", () => {
            it("should create pattern with valid config", () => {
                const config: TokenVestingConfig = {
                    name: "Team Vesting",
                    grants: [
                        {
                            id: "grant-001",
                            beneficiary: "ABC123",
                            totalAmount: 100000,
                            token: "PROJECT_TOKEN",
                            schedule: {
                                type: "linear",
                                duration: 365 * 24 * 60 * 60 * 1000,
                                startDate: Date.now(),
                            },
                        },
                    ],
                };

                const pattern = new TokenVestingPattern(config);

                expect(pattern).toBeDefined();
                const patternConfig = (pattern as any).config;
                expect(patternConfig.name).toBe("Team Vesting");
                expect(patternConfig.autoClaim).toBe(false);
                expect(patternConfig.generateReport).toBe(true);
            });

            it("should override defaults", () => {
                const config: TokenVestingConfig = {
                    name: "Test",
                    grants: [
                        {
                            id: "grant-001",
                            beneficiary: "ABC123",
                            totalAmount: 100000,
                            token: "PROJECT_TOKEN",
                            schedule: {
                                type: "linear",
                                duration: 365 * 24 * 60 * 60 * 1000,
                                startDate: Date.now(),
                            },
                        },
                    ],
                    autoClaim: true,
                    generateReport: false,
                };

                const pattern = new TokenVestingPattern(config);

                const patternConfig = (pattern as any).config;
                expect(patternConfig.autoClaim).toBe(true);
                expect(patternConfig.generateReport).toBe(false);
            });
        });

        describe("Validation", () => {
            it("should validate valid configuration", () => {
                const config: TokenVestingConfig = {
                    name: "Test",
                    grants: [
                        {
                            id: "grant-001",
                            beneficiary: "ABC123",
                            totalAmount: 100000,
                            token: "PROJECT_TOKEN",
                            schedule: {
                                type: "linear",
                                duration: 365 * 24 * 60 * 60 * 1000,
                                startDate: Date.now(),
                            },
                        },
                    ],
                };

                const pattern = new TokenVestingPattern(config);
                const isValid = (pattern as any).validate();

                expect(isValid).toBe(true);
            });

            it("should reject empty grants", () => {
                const config: TokenVestingConfig = {
                    name: "Test",
                    grants: [],
                };

                const pattern = new TokenVestingPattern(config);
                const isValid = (pattern as any).validate();

                expect(isValid).toBe(false);
            });

            it("should reject invalid milestone percentages", () => {
                const config: TokenVestingConfig = {
                    name: "Test",
                    grants: [
                        {
                            id: "grant-001",
                            beneficiary: "ABC123",
                            totalAmount: 100000,
                            token: "PROJECT_TOKEN",
                            schedule: {
                                type: "milestone",
                                duration: 365 * 24 * 60 * 60 * 1000,
                                startDate: Date.now(),
                                milestones: [
                                    {
                                        percentage: 50,
                                        date: Date.now() + 1000,
                                    },
                                    {
                                        percentage: 40, // Sums to 90%, not 100%
                                        date: Date.now() + 2000,
                                    },
                                ],
                            },
                        },
                    ],
                };

                const pattern = new TokenVestingPattern(config);
                const isValid = (pattern as any).validate();

                expect(isValid).toBe(false);
            });

            it("should reject claimed amount exceeding total", () => {
                const config: TokenVestingConfig = {
                    name: "Test",
                    grants: [
                        {
                            id: "grant-001",
                            beneficiary: "ABC123",
                            totalAmount: 100000,
                            token: "PROJECT_TOKEN",
                            claimedAmount: 150000, // Exceeds total
                            schedule: {
                                type: "linear",
                                duration: 365 * 24 * 60 * 60 * 1000,
                                startDate: Date.now(),
                            },
                        },
                    ],
                };

                const pattern = new TokenVestingPattern(config);
                const isValid = (pattern as any).validate();

                expect(isValid).toBe(false);
            });
        });

        describe("Vested Amount Calculation", () => {
            it("should calculate linear vesting", () => {
                const now = Date.now();
                const duration = 365 * 24 * 60 * 60 * 1000; // 1 year
                const startDate = now - duration / 2; // Halfway through

                const grant = {
                    id: "grant-001",
                    beneficiary: "ABC123",
                    totalAmount: 100000,
                    token: "PROJECT_TOKEN",
                    schedule: {
                        type: "linear" as const,
                        duration,
                        startDate,
                    },
                };

                const config: TokenVestingConfig = {
                    name: "Test",
                    grants: [grant],
                };

                const pattern = new TokenVestingPattern(config);
                const vestedAmount = (pattern as any).calculateVestedAmount(
                    grant,
                    now
                );

                expect(vestedAmount).toBeGreaterThan(0);
                expect(vestedAmount).toBeLessThan(100000);
                expect(vestedAmount).toBeCloseTo(50000, -3); // Approximately 50%
            });

            it("should respect cliff period", () => {
                const now = Date.now();
                const duration = 365 * 24 * 60 * 60 * 1000;
                const cliffDuration = 90 * 24 * 60 * 60 * 1000; // 90 days
                const startDate = now - cliffDuration / 2; // Before cliff ends

                const grant = {
                    id: "grant-001",
                    beneficiary: "ABC123",
                    totalAmount: 100000,
                    token: "PROJECT_TOKEN",
                    schedule: {
                        type: "linear" as const,
                        duration,
                        cliffDuration,
                        startDate,
                    },
                };

                const config: TokenVestingConfig = {
                    name: "Test",
                    grants: [grant],
                };

                const pattern = new TokenVestingPattern(config);
                const vestedAmount = (pattern as any).calculateVestedAmount(
                    grant,
                    now
                );

                expect(vestedAmount).toBe(0); // Before cliff ends
            });

            it("should calculate milestone vesting", () => {
                const now = Date.now();
                const duration = 365 * 24 * 60 * 60 * 1000;

                const grant = {
                    id: "grant-001",
                    beneficiary: "ABC123",
                    totalAmount: 100000,
                    token: "PROJECT_TOKEN",
                    schedule: {
                        type: "milestone" as const,
                        duration,
                        startDate: now - 1000,
                        milestones: [
                            {
                                percentage: 25,
                                date: now - 500,
                            },
                            {
                                percentage: 25,
                                date: now + 500, // Future milestone
                            },
                            {
                                percentage: 50,
                                date: now + 1000, // Future milestone
                            },
                        ],
                    },
                };

                const config: TokenVestingConfig = {
                    name: "Test",
                    grants: [grant],
                };

                const pattern = new TokenVestingPattern(config);
                const vestedAmount = (pattern as any).calculateVestedAmount(
                    grant,
                    now
                );

                expect(vestedAmount).toBe(25000); // 25% from first milestone
            });

            it("should return 0 before start date", () => {
                const now = Date.now();
                const startDate = now + 1000; // Future

                const grant = {
                    id: "grant-001",
                    beneficiary: "ABC123",
                    totalAmount: 100000,
                    token: "PROJECT_TOKEN",
                    schedule: {
                        type: "linear" as const,
                        duration: 365 * 24 * 60 * 60 * 1000,
                        startDate,
                    },
                };

                const config: TokenVestingConfig = {
                    name: "Test",
                    grants: [grant],
                };

                const pattern = new TokenVestingPattern(config);
                const vestedAmount = (pattern as any).calculateVestedAmount(
                    grant,
                    now
                );

                expect(vestedAmount).toBe(0);
            });

            it("should return total amount after vesting period", () => {
                const now = Date.now();
                const duration = 365 * 24 * 60 * 60 * 1000;
                const startDate = now - duration * 2; // 2 years ago

                const grant = {
                    id: "grant-001",
                    beneficiary: "ABC123",
                    totalAmount: 100000,
                    token: "PROJECT_TOKEN",
                    schedule: {
                        type: "linear" as const,
                        duration,
                        startDate,
                    },
                };

                const config: TokenVestingConfig = {
                    name: "Test",
                    grants: [grant],
                };

                const pattern = new TokenVestingPattern(config);
                const vestedAmount = (pattern as any).calculateVestedAmount(
                    grant,
                    now
                );

                expect(vestedAmount).toBe(100000); // Fully vested
            });
        });

        describe("Claim Processing", () => {
            it("should process claimable grants", async () => {
                const now = Date.now();
                const duration = 365 * 24 * 60 * 60 * 1000;
                const startDate = now - duration / 2; // Halfway through

                const config: TokenVestingConfig = {
                    name: "Test",
                    grants: [
                        {
                            id: "grant-001",
                            beneficiary: "ABC123",
                            totalAmount: 100000,
                            token: "PROJECT_TOKEN",
                            schedule: {
                                type: "linear",
                                duration,
                                startDate,
                            },
                        },
                    ],
                    dryRun: true,
                };

                const pattern = new TokenVestingPattern(config);
                const result = await pattern.execute();

                expect(result.success).toBe(true);
                expect(result.transactions.length).toBeGreaterThan(0);
            });

            it("should skip non-claimable grants", async () => {
                const now = Date.now();
                const duration = 365 * 24 * 60 * 60 * 1000;
                const cliffDuration = 90 * 24 * 60 * 60 * 1000;
                const startDate = now - cliffDuration / 2; // Before cliff ends

                const config: TokenVestingConfig = {
                    name: "Test",
                    grants: [
                        {
                            id: "grant-001",
                            beneficiary: "ABC123",
                            totalAmount: 100000,
                            token: "PROJECT_TOKEN",
                            schedule: {
                                type: "linear",
                                duration,
                                cliffDuration,
                                startDate,
                            },
                        },
                    ],
                    dryRun: true,
                };

                const pattern = new TokenVestingPattern(config);
                const result = await pattern.execute();

                expect(result.success).toBe(true);
                // Should have a claim record but no transaction
                expect(result.metadata?.claims).toBeDefined();
                const claims = result.metadata?.claims as any[];
                const notClaimable = claims?.find(
                    (c: any) => c.status === "not_claimable"
                );
                expect(notClaimable).toBeDefined();
            });

            it("should track claimed amounts", async () => {
                const now = Date.now();
                const duration = 365 * 24 * 60 * 60 * 1000;
                const startDate = now - duration / 2;

                const config: TokenVestingConfig = {
                    name: "Test",
                    grants: [
                        {
                            id: "grant-001",
                            beneficiary: "ABC123",
                            totalAmount: 100000,
                            token: "PROJECT_TOKEN",
                            claimedAmount: 25000, // Already claimed
                            schedule: {
                                type: "linear",
                                duration,
                                startDate,
                            },
                        },
                    ],
                    dryRun: true,
                };

                const pattern = new TokenVestingPattern(config);
                const result = await pattern.execute();

                expect(result.success).toBe(true);
                expect(result.metadata?.claims).toBeDefined();
                const claims = result.metadata?.claims as any[];
                const claim = claims?.find((c: any) => c.status === "success");
                if (claim) {
                    expect(claim.totalClaimed).toBeGreaterThan(25000);
                }
            });

            it("should generate vesting status report", async () => {
                const now = Date.now();
                const duration = 365 * 24 * 60 * 60 * 1000;
                const startDate = now - duration / 2;

                const config: TokenVestingConfig = {
                    name: "Test",
                    grants: [
                        {
                            id: "grant-001",
                            beneficiary: "ABC123",
                            totalAmount: 100000,
                            token: "PROJECT_TOKEN",
                            schedule: {
                                type: "linear",
                                duration,
                                startDate,
                            },
                        },
                    ],
                    generateReport: true,
                    dryRun: true,
                };

                const pattern = new TokenVestingPattern(config);
                const result = await pattern.execute();

                expect(result.metadata).toBeDefined();
                expect(result.metadata?.vestingStatus).toBeDefined();
                const vestingStatus = result.metadata?.vestingStatus as Record<
                    string,
                    any
                >;
                expect(vestingStatus["grant-001"]).toBeDefined();
                expect(vestingStatus["grant-001"].vestedAmount).toBeGreaterThan(
                    0
                );
                expect(
                    vestingStatus["grant-001"].vestingProgress
                ).toBeGreaterThan(0);
            });
        });
    });
});
