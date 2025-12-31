/**
 * Gaming Guild Revenue Distribution Example
 *
 * Demonstrates automated revenue distribution for gaming guilds using
 * Fabrknt's BatchPayoutPattern. This example shows how to distribute
 * earnings from NFT gaming across multiple stakeholders (scholars, managers, treasury).
 */

import { BatchPayoutPattern, Guard } from "@fabrknt/sdk";
import type { PayoutRecipient } from "@fabrknt/sdk";

/**
 * Revenue distribution configuration
 */
interface RevenueDistribution {
    totalRevenue: number; // Total revenue earned this period
    scholarShare: number; // Percentage for scholars (e.g., 0.5 for 50%)
    managerShare: number; // Percentage for managers (e.g., 0.2 for 20%)
    treasuryShare: number; // Percentage for guild treasury (e.g., 0.3 for 30%)
    scholars: ScholarAllocation[];
    managers: ManagerAllocation[];
    treasuryWallet: string;
}

interface ScholarAllocation {
    scholarId: string;
    wallet: string;
    sharePercentage: number; // Individual scholar's share of scholar pool
    game: string;
}

interface ManagerAllocation {
    managerId: string;
    wallet: string;
    sharePercentage: number; // Individual manager's share of manager pool
    role: string;
}

/**
 * Example revenue distribution configuration
 */
const revenueConfig: RevenueDistribution = {
    totalRevenue: 10000, // $10,000 total revenue
    scholarShare: 0.5, // 50% to scholars
    managerShare: 0.2, // 20% to managers
    treasuryShare: 0.3, // 30% to treasury
    scholars: [
        {
            scholarId: "scholar-001",
            wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
            sharePercentage: 0.25, // 25% of scholar pool
            game: "Axie Infinity",
        },
        {
            scholarId: "scholar-002",
            wallet: "9zYpKmPRJYCbZqvZXgUjA3YzFwCJcPqTvJdKxLkWmNbP",
            sharePercentage: 0.2, // 20% of scholar pool
            game: "Thetan Arena",
        },
        {
            scholarId: "scholar-003",
            wallet: "FkDm3qJWzPcNkH8AvTdLx2sKbVrM9zYpWtGhJsXuCvEn",
            sharePercentage: 0.25, // 25% of scholar pool
            game: "Axie Infinity",
        },
        {
            scholarId: "scholar-004",
            wallet: "HnBxRkPqTcVmJwYzKsLuDgFqEaNpXtMbWvCsGhJrUiOp",
            sharePercentage: 0.3, // 30% of scholar pool
            game: "Star Atlas",
        },
    ],
    managers: [
        {
            managerId: "manager-001",
            wallet: "JpDyXmQsWvNcKzLhTgFuErBpAtMxYwVsGiHjRkOuCnBm",
            sharePercentage: 0.6, // 60% of manager pool
            role: "Guild Master",
        },
        {
            managerId: "manager-002",
            wallet: "KqEzYnRtXwOdLaMjUhGvFsCqBuNyZxWtHkJsRlPvDoEn",
            sharePercentage: 0.4, // 40% of manager pool
            role: "Operations Manager",
        },
    ],
    treasuryWallet: "LrFaZoSuYxPeLbNkViHwGtDrCvOzAyXuIlKtSmQwEpFo",
};

/**
 * Prepare payout recipients for revenue distribution
 */
function prepareRevenueDistribution(
    config: RevenueDistribution
): PayoutRecipient[] {
    const recipients: PayoutRecipient[] = [];

    // Calculate pool amounts
    const scholarPool = config.totalRevenue * config.scholarShare;
    const managerPool = config.totalRevenue * config.managerShare;
    const treasuryAmount = config.totalRevenue * config.treasuryShare;

    // Add scholar payments
    config.scholars.forEach((scholar) => {
        const amount = scholarPool * scholar.sharePercentage;
        recipients.push({
            id: scholar.scholarId,
            wallet: scholar.wallet,
            amount: Math.round(amount * 100) / 100,
            token: "USDC",
            memo: `Scholar payment - ${scholar.game} (${
                scholar.sharePercentage * 100
            }% of scholar pool)`,
        });
    });

    // Add manager payments
    config.managers.forEach((manager) => {
        const amount = managerPool * manager.sharePercentage;
        recipients.push({
            id: manager.managerId,
            wallet: manager.wallet,
            amount: Math.round(amount * 100) / 100,
            token: "USDC",
            memo: `Manager payment - ${manager.role} (${
                manager.sharePercentage * 100
            }% of manager pool)`,
        });
    });

    // Add treasury payment
    recipients.push({
        id: "treasury",
        wallet: config.treasuryWallet,
        amount: Math.round(treasuryAmount * 100) / 100,
        token: "USDC",
        memo: `Guild treasury allocation (${
            config.treasuryShare * 100
        }% of total revenue)`,
    });

    return recipients;
}

async function runRevenueDistribution() {
    console.log("💰 Starting gaming guild revenue distribution...\n");

    // Display distribution breakdown
    console.log("📊 Revenue Distribution Breakdown:");
    console.log("=".repeat(60));
    console.log(`Total Revenue: $${revenueConfig.totalRevenue.toFixed(2)}`);
    console.log(
        `Scholars (${revenueConfig.scholarShare * 100}%): $${(
            revenueConfig.totalRevenue * revenueConfig.scholarShare
        ).toFixed(2)}`
    );
    console.log(
        `Managers (${revenueConfig.managerShare * 100}%): $${(
            revenueConfig.totalRevenue * revenueConfig.managerShare
        ).toFixed(2)}`
    );
    console.log(
        `Treasury (${revenueConfig.treasuryShare * 100}%): $${(
            revenueConfig.totalRevenue * revenueConfig.treasuryShare
        ).toFixed(2)}`
    );
    console.log("=".repeat(60));
    console.log();

    // Prepare payout recipients
    const recipients = prepareRevenueDistribution(revenueConfig);

    // Display individual allocations
    console.log("📋 Individual Allocations:");
    recipients.forEach((recipient) => {
        console.log(
            `${recipient.id}: ${recipient.amount} USDC - ${recipient.memo}`
        );
    });
    console.log();

    // Create Guard for security validation
    const guard = new Guard({
        mode: "block",
        maxSlippage: 0.01,
        riskTolerance: "low",
    });

    // Create batch payout pattern
    const distribution = new BatchPayoutPattern({
        name: "Monthly Revenue Distribution - December 2024",
        recipients,
        guard,
        enableParallel: true,
        generateReport: true,
        dryRun: process.env.DRY_RUN === "true",
    });

    // Execute distribution
    const result = await distribution.execute();

    if (result.success) {
        console.log("✅ Revenue distribution completed successfully!\n");
        console.log(`Processed: ${result.transactions.length} payments`);
        console.log(`Gas cost: ${result.metrics.actualCost} SOL`);
        console.log(`Execution time: ${result.metrics.executionTime}ms\n`);

        // Save CSV report
        if (result.metadata?.csvReport) {
            const fs = require("fs");
            const reportPath = "revenue-distribution-report.csv";
            fs.writeFileSync(reportPath, result.metadata.csvReport);
            console.log(`📊 Report saved to ${reportPath}`);
        }
    } else {
        console.error("❌ Revenue distribution failed:", result.error);
    }
}

// Run if executed directly
if (require.main === module) {
    runRevenueDistribution().catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    });
}

export { runRevenueDistribution, prepareRevenueDistribution };
