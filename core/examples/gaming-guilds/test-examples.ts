/**
 * Test script for gaming guilds examples
 *
 * This script tests the calculation logic and verifies the examples work correctly
 * without requiring actual blockchain connections.
 */

import {
    calculateScholarPayment,
    preparePayoutRecipients,
} from "./scholar-payments";
import { prepareRevenueDistribution } from "./revenue-distribution";

// Test scholar payment calculations
console.log("🧪 Testing Scholar Payment Calculations\n");
console.log("=".repeat(60));

const testScholar = {
    scholarId: "test-001",
    wallet: "test-wallet",
    game: "Test Game",
    revenueEarned: 1000,
    sharePercentage: 0.5,
    performanceScore: 90,
    minimumPayout: 200,
};

const payment = calculateScholarPayment(testScholar);
console.log(`Revenue: $${testScholar.revenueEarned}`);
console.log(`Share: ${testScholar.sharePercentage * 100}%`);
console.log(`Performance Score: ${testScholar.performanceScore}`);
console.log(
    `Base Payment: $${testScholar.revenueEarned * testScholar.sharePercentage}`
);
console.log(
    `Performance Multiplier: ${
        0.8 + (testScholar.performanceScore / 100) * 0.4
    }`
);
console.log(`Calculated Payment: $${payment.toFixed(2)}`);
console.log(`Expected: $${(1000 * 0.5 * (0.8 + (90 / 100) * 0.4)).toFixed(2)}`);

const expectedPayment =
    testScholar.revenueEarned *
    testScholar.sharePercentage *
    (0.8 + (testScholar.performanceScore / 100) * 0.4);
if (Math.abs(payment - expectedPayment) < 0.01) {
    console.log("✅ Scholar payment calculation is correct!\n");
} else {
    console.log(
        `❌ Calculation mismatch! Expected ${expectedPayment}, got ${payment}\n`
    );
    process.exit(1);
}

// Test minimum payout threshold
console.log("🧪 Testing Minimum Payout Threshold\n");
console.log("=".repeat(60));

const lowPerformanceScholar = {
    scholarId: "test-002",
    wallet: "test-wallet-2",
    game: "Test Game",
    revenueEarned: 100,
    sharePercentage: 0.5,
    performanceScore: 50, // Low performance
    minimumPayout: 200,
};

const lowPayment = calculateScholarPayment(lowPerformanceScholar);
console.log(`Revenue: $${lowPerformanceScholar.revenueEarned}`);
console.log(`Calculated Payment: $${lowPayment.toFixed(2)}`);
console.log(`Minimum Payout: $${lowPerformanceScholar.minimumPayout}`);

if (lowPayment >= lowPerformanceScholar.minimumPayout) {
    console.log("✅ Minimum payout threshold is enforced!\n");
} else {
    console.log(
        `❌ Minimum payout not enforced! Got ${lowPayment}, expected at least ${lowPerformanceScholar.minimumPayout}\n`
    );
    process.exit(1);
}

// Test revenue distribution calculations
console.log("🧪 Testing Revenue Distribution Calculations\n");
console.log("=".repeat(60));

const testRevenueConfig = {
    totalRevenue: 10000,
    scholarShare: 0.5,
    managerShare: 0.2,
    treasuryShare: 0.3,
    scholars: [
        {
            scholarId: "scholar-001",
            wallet: "wallet-1",
            sharePercentage: 0.5, // 50% of scholar pool
            game: "Game 1",
        },
        {
            scholarId: "scholar-002",
            wallet: "wallet-2",
            sharePercentage: 0.5, // 50% of scholar pool (total = 100%)
            game: "Game 2",
        },
    ],
    managers: [
        {
            managerId: "manager-001",
            wallet: "manager-wallet-1",
            sharePercentage: 0.6,
            role: "Guild Master",
        },
        {
            managerId: "manager-002",
            wallet: "manager-wallet-2",
            sharePercentage: 0.4,
            role: "Operations",
        },
    ],
    treasuryWallet: "treasury-wallet",
};

const recipients = prepareRevenueDistribution(testRevenueConfig);

// Verify totals
const scholarPool =
    testRevenueConfig.totalRevenue * testRevenueConfig.scholarShare;
const managerPool =
    testRevenueConfig.totalRevenue * testRevenueConfig.managerShare;
const treasuryAmount =
    testRevenueConfig.totalRevenue * testRevenueConfig.treasuryShare;

let totalDistributed = 0;
recipients.forEach((r) => {
    totalDistributed += r.amount;
    console.log(`${r.id}: $${r.amount.toFixed(2)} - ${r.memo}`);
});

console.log(`\nTotal Distributed: $${totalDistributed.toFixed(2)}`);
console.log(`Expected Total: $${testRevenueConfig.totalRevenue.toFixed(2)}`);

if (Math.abs(totalDistributed - testRevenueConfig.totalRevenue) < 0.01) {
    console.log("✅ Revenue distribution totals are correct!\n");
} else {
    console.log(
        `❌ Total mismatch! Expected ${testRevenueConfig.totalRevenue}, got ${totalDistributed}\n`
    );
    process.exit(1);
}

// Verify individual allocations
const scholar1Amount =
    recipients.find((r) => r.id === "scholar-001")?.amount || 0;
const expectedScholar1 = scholarPool * 0.5; // 50% of scholar pool (test data has 2 scholars at 50% each)
if (Math.abs(scholar1Amount - expectedScholar1) < 0.01) {
    console.log(
        `✅ Scholar 1 allocation correct: $${scholar1Amount.toFixed(2)}\n`
    );
} else {
    console.log(
        `❌ Scholar 1 allocation incorrect! Expected ${expectedScholar1}, got ${scholar1Amount}\n`
    );
    process.exit(1);
}

const manager1Amount =
    recipients.find((r) => r.id === "manager-001")?.amount || 0;
const expectedManager1 = managerPool * 0.6;
if (Math.abs(manager1Amount - expectedManager1) < 0.01) {
    console.log(
        `✅ Manager 1 allocation correct: $${manager1Amount.toFixed(2)}\n`
    );
} else {
    console.log(
        `❌ Manager 1 allocation incorrect! Expected ${expectedManager1}, got ${manager1Amount}\n`
    );
    process.exit(1);
}

const treasuryAmountReceived =
    recipients.find((r) => r.id === "treasury")?.amount || 0;
if (Math.abs(treasuryAmountReceived - treasuryAmount) < 0.01) {
    console.log(
        `✅ Treasury allocation correct: $${treasuryAmountReceived.toFixed(
            2
        )}\n`
    );
} else {
    console.log(
        `❌ Treasury allocation incorrect! Expected ${treasuryAmount}, got ${treasuryAmountReceived}\n`
    );
    process.exit(1);
}

console.log("=".repeat(60));
console.log("✅ All tests passed!\n");
console.log("The gaming guilds examples are working correctly.");
console.log("You can now run the full examples with:");
console.log("  npx tsx scholar-payments.ts");
console.log("  npx tsx revenue-distribution.ts");
