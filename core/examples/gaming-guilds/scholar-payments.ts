/**
 * Gaming Guild Scholar Payments Example
 *
 * Demonstrates automated scholar payments for gaming guilds using Fabrknt's
 * BatchPayoutPattern. This example shows weekly USDC payments to scholars
 * based on their performance and revenue share agreements.
 */

import { BatchPayoutPattern, Guard } from "@fabrknt/sdk";
import type { PayoutRecipient } from "@fabrknt/sdk";

/**
 * Scholar performance data
 * In production: Load from database or game API
 */
interface ScholarPerformance {
    scholarId: string;
    wallet: string;
    game: string;
    revenueEarned: number; // Total revenue earned this period
    sharePercentage: number; // Scholar's share (e.g., 0.5 for 50%)
    performanceScore: number; // 0-100 performance rating
    minimumPayout: number; // Minimum payout threshold
}

/**
 * Calculate scholar payment based on revenue share
 */
function calculateScholarPayment(performance: ScholarPerformance): number {
    const basePayment = performance.revenueEarned * performance.sharePercentage;

    // Apply performance multiplier (0.8x to 1.2x)
    const performanceMultiplier =
        0.8 + (performance.performanceScore / 100) * 0.4;
    const adjustedPayment = basePayment * performanceMultiplier;

    // Ensure minimum payout
    return Math.max(adjustedPayment, performance.minimumPayout);
}

// Example scholar performance data
const scholarPerformance: ScholarPerformance[] = [
    {
        scholarId: "scholar-001",
        wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        game: "Axie Infinity",
        revenueEarned: 1000,
        sharePercentage: 0.5, // 50% share
        performanceScore: 95,
        minimumPayout: 200,
    },
    {
        scholarId: "scholar-002",
        wallet: "9zYpKmPRJYCbZqvZXgUjA3YzFwCJcPqTvJdKxLkWmNbP",
        game: "Thetan Arena",
        revenueEarned: 600,
        sharePercentage: 0.4, // 40% share
        performanceScore: 85,
        minimumPayout: 150,
    },
    {
        scholarId: "scholar-003",
        wallet: "FkDm3qJWzPcNkH8AvTdLx2sKbVrM9zYpWtGhJsXuCvEn",
        game: "Axie Infinity",
        revenueEarned: 800,
        sharePercentage: 0.5,
        performanceScore: 75,
        minimumPayout: 200,
    },
    {
        scholarId: "scholar-004",
        wallet: "HnBxRkPqTcVmJwYzKsLuDgFqEaNpXtMbWvCsGhJrUiOp",
        game: "Star Atlas",
        revenueEarned: 1200,
        sharePercentage: 0.45, // 45% share
        performanceScore: 90,
        minimumPayout: 250,
    },
    {
        scholarId: "scholar-005",
        wallet: "JpDyXmQsWvNcKzLhTgFuErBpAtMxYwVsGiHjRkOuCnBm",
        game: "Thetan Arena",
        revenueEarned: 400,
        sharePercentage: 0.4,
        performanceScore: 60,
        minimumPayout: 150,
    },
];

/**
 * Convert scholar performance to payout recipients
 */
function preparePayoutRecipients(
    performance: ScholarPerformance[]
): PayoutRecipient[] {
    return performance.map((scholar) => {
        const amount = calculateScholarPayment(scholar);

        return {
            id: scholar.scholarId,
            wallet: scholar.wallet,
            amount: Math.round(amount * 100) / 100, // Round to 2 decimals
            token: "USDC",
            memo: `${scholar.game} - ${
                scholar.sharePercentage * 100
            }% share (Score: ${scholar.performanceScore})`,
        };
    });
}

async function runScholarPayments() {
    console.log("🎮 Starting gaming guild scholar payments...\n");

    // Prepare payout recipients
    const recipients = preparePayoutRecipients(scholarPerformance);

    // Display payment summary
    console.log("📊 Payment Summary:");
    console.log("=".repeat(60));
    recipients.forEach((recipient) => {
        const scholar = scholarPerformance.find(
            (s) => s.scholarId === recipient.id
        );
        console.log(
            `${recipient.id}: ${recipient.amount} USDC (${scholar?.game})`
        );
    });
    console.log("=".repeat(60));
    console.log(
        `Total: ${recipients
            .reduce((sum, r) => sum + r.amount, 0)
            .toFixed(2)} USDC\n`
    );

    // Create Guard for security validation
    const guard = new Guard({
        mode: "block", // Block suspicious transactions
        maxSlippage: 0.01, // 1% max slippage
        riskTolerance: "low", // Low risk tolerance for guild payments
    });

    // Create batch payout pattern
    const guildPayout = new BatchPayoutPattern({
        name: "Weekly Scholar Payments - Week 52",
        recipients,
        guard,
        enableParallel: true, // Use Loom for gas optimization
        generateReport: true, // Generate CSV report for accounting
        batchSize: 10, // Process 10 payments in parallel
        dryRun: process.env.DRY_RUN === "true",
    });

    // Execute payments
    const result = await guildPayout.execute();

    if (result.success) {
        console.log("✅ Scholar payments completed successfully!\n");
        console.log(`Processed: ${result.transactions.length} payments`);
        console.log(`Gas cost: ${result.metrics.actualCost} SOL`);
        console.log(`Execution time: ${result.metrics.executionTime}ms\n`);

        // Display transaction details
        console.log("📝 Transaction Details:");
        result.transactions.forEach((tx, index) => {
            console.log(`${index + 1}. ${tx.signature} - ${tx.status}`);
        });

        // Save CSV report
        if (result.metadata?.csvReport) {
            const fs = require("fs");
            const reportPath = "scholar-payments-report.csv";
            fs.writeFileSync(reportPath, result.metadata.csvReport);
            console.log(`\n📊 Report saved to ${reportPath}`);
        }
    } else {
        console.error("❌ Scholar payments failed:", result.error);

        // Handle failed payments
        if (result.metadata?.failedPayments) {
            console.log("\n⚠️ Failed Payments:");
            result.metadata.failedPayments.forEach((payment) => {
                console.log(`- ${payment.id}: ${payment.wallet}`);
            });
        }
    }
}

// Run if executed directly
if (require.main === module) {
    runScholarPayments().catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    });
}

export { runScholarPayments, calculateScholarPayment, preparePayoutRecipients };
