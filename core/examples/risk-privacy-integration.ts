/**
 * Risk and Privacy Integration Examples
 *
 * This example demonstrates how to use Risk (The Quality Gauge) and
 * Privacy (The Hidden Stitch) with Fabrknt's Guard and execution system.
 *
 * Note: Classes are still exported as 'Pulsar' and provider identifiers use 'arbor'
 * for backward compatibility, but represent Risk and Privacy respectively.
 */

import {
    Fabrknt,
    Guard,
    Pulsar,
    FabricCore,
    type Transaction,
    type GuardConfig,
} from "@fabrknt/sdk";

// Example 1: Using Risk for Risk Assessment
async function pulsarRiskAssessment() {
    console.log("=== Example 1: Risk Assessment ===\n");

    // Create Guard with Risk enabled
    const guard = new Guard({
        pulsar: {
            // Risk configuration (class still named Pulsar for backward compatibility)
            enabled: true,
            riskThreshold: 0.7, // Block transactions with risk score > 0.7
            enableComplianceCheck: true,
            enableCounterpartyCheck: true,
            enableOracleCheck: true,
            cacheTTL: 60000, // Cache for 1 minute
            fallbackOnError: true, // Allow transactions if Risk API fails
        },
        mode: "block",
        riskTolerance: "moderate",
    });

    // Create a transaction with asset addresses
    const tx: Transaction = {
        id: "tx-pulsar-001",
        status: "pending",
        assetAddresses: ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"],
        instructions: [],
    };

    // Validate transaction (Risk will check risk metrics)
    const result = await guard.validateTransaction(tx);

    console.log("Transaction Valid:", result.isValid);
    console.log("Warnings:", result.warnings.length);
    result.warnings.forEach((warning) => {
        console.log(`  - [${warning.severity}] ${warning.message}`);
    });

    // Execute with Fabrknt
    if (result.isValid) {
        const executed = await Fabrknt.execute(tx, { with: guard });
        console.log("Execution Status:", executed.status);
    }
}

// Example 2: Using Risk Cache
async function pulsarCacheExample() {
    console.log("\n=== Example 2: Risk Cache ===\n");

    // Query risk metrics (will be cached)
    const metrics1 = await Pulsar.getRiskMetrics(
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
    );
    console.log("First call - Risk Score:", metrics1.riskScore);

    // Query again (will use cache)
    const metrics2 = await Pulsar.getRiskMetrics(
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
    );
    console.log("Second call (cached) - Risk Score:", metrics2.riskScore);

    // Check cache stats
    const stats = Pulsar.getCacheStats();
    console.log("Cache Size:", stats.size);
    console.log("Cached Assets:", stats.entries);

    // Clear cache
    Pulsar.clearCache();
    console.log("Cache cleared");
}

// Example 3: Batch Risk Assessment
async function batchRiskAssessment() {
    console.log("\n=== Example 3: Batch Risk Assessment ===\n");

    const assetAddresses = [
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        "So11111111111111111111111111111111111111112",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    ];

    const riskMetricsMap = await Pulsar.getBatchRiskMetrics(assetAddresses);

    console.log("Batch Risk Assessment Results:");
    for (const [address, metrics] of riskMetricsMap.entries()) {
        console.log(`\nAsset: ${address}`);
        console.log(`  Risk Score: ${metrics.riskScore ?? "N/A"}`);
        console.log(`  Compliance: ${metrics.complianceStatus ?? "N/A"}`);
        console.log(
            `  Counterparty Risk: ${metrics.counterpartyRisk ?? "N/A"}`
        );
        console.log(`  Oracle Integrity: ${metrics.oracleIntegrity ?? "N/A"}`);
    }
}

// Example 4: Private Transaction Execution with Privacy
async function privateTransactionExample() {
    console.log("\n=== Example 4: Private Transaction with Privacy ===\n");

    const guard = new Guard({
        mode: "block",
        riskTolerance: "moderate",
    });

    const tx: Transaction = {
        id: "tx-private-001",
        status: "pending",
        instructions: [],
        privacyMetadata: {
            requiresPrivacy: true,
            compressionEnabled: true,
        },
    };

    // Execute private transaction via Privacy
    const result = await Fabrknt.executePrivate(tx, {
        with: guard,
        privacy: {
            provider: "arbor", // Privacy (provider identifier unchanged for backward compatibility)
            compression: true,
        },
    });

    console.log("Private Transaction Status:", result.status);
    console.log("Privacy Enabled:", result.privacyMetadata?.requiresPrivacy);
    console.log(
        "Compression Enabled:",
        result.privacyMetadata?.compressionEnabled
    );
}

// Example 5: Cost Estimation with ZK Compression
function costEstimationExample() {
    console.log("\n=== Example 5: ZK Compression Cost Estimation ===\n");

    const transactionCounts = [100, 1000, 10000, 100000];

    console.log("Cost Comparison: Native vs ZK Compression\n");
    console.log(
        "Transactions | Native Cost (SOL) | Compressed (SOL) | Savings (%)"
    );
    console.log(
        "-------------|-------------------|------------------|------------"
    );

    for (const count of transactionCounts) {
        const estimate = FabricCore.estimateCompressionSavings(count);
        console.log(
            `${count.toString().padStart(12)} | ${estimate.nativeCost
                .toFixed(6)
                .padStart(17)} | ${estimate.compressedCost
                .toFixed(6)
                .padStart(16)} | ${estimate.savingsPercent.toFixed(2)}%`
        );
    }
}

// Example 6: Optimized Transaction with Privacy
async function optimizedPrivateTransaction() {
    console.log("\n=== Example 6: Optimized Private Transaction ===\n");

    const tx: Transaction = {
        id: "tx-optimized-001",
        status: "pending",
        instructions: [],
    };

    // Optimize with privacy enabled via Privacy
    const optimized = FabricCore.optimize(tx, {
        enablePrivacy: true,
        compressionLevel: "high",
        privacyProvider: "arbor", // Privacy
    });

    console.log("Original Transaction:", tx.id);
    console.log("Optimized Transaction:", optimized.id);
    console.log("Privacy Enabled:", optimized.privacyMetadata?.requiresPrivacy);
    console.log(
        "Compression Enabled:",
        optimized.privacyMetadata?.compressionEnabled
    );

    // Compress with Privacy
    const compressed = await FabricCore.compressWithArbor(optimized, {
        enabled: true,
        compressionLevel: "high",
        provider: "arbor", // Privacy
    });

    console.log("Compressed Transaction:", compressed.id);
}

// Example 7: Combined Risk + Privacy Workflow
async function combinedWorkflow() {
    console.log("\n=== Example 7: Combined Risk + Privacy Workflow ===\n");

    // Step 1: Create Guard with Risk assessment
    const guard = new Guard({
        pulsar: {
            // Risk configuration
            enabled: true,
            riskThreshold: 0.6,
            enableComplianceCheck: true,
        },
        mode: "block",
        riskTolerance: "strict",
    });

    // Step 2: Create transaction with assets
    const tx: Transaction = {
        id: "tx-combined-001",
        status: "pending",
        assetAddresses: ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"],
        instructions: [],
    };

    // Step 3: Optimize with privacy via Privacy
    const optimized = FabricCore.optimize(tx, {
        enablePrivacy: true,
        compressionLevel: "high",
    });

    // Step 4: Validate with Guard (includes Risk check)
    const validation = await guard.validateTransaction(optimized);
    console.log("Validation Result:", validation.isValid);

    if (validation.isValid) {
        // Step 5: Execute as private transaction via Privacy
        const result = await Fabrknt.executePrivate(optimized, {
            with: guard,
            privacy: {
                provider: "arbor", // Privacy
                compression: true,
            },
        });

        console.log("Execution Status:", result.status);
        console.log(
            "Privacy Enabled:",
            result.privacyMetadata?.requiresPrivacy
        );
    } else {
        console.log("Transaction blocked:", validation.blockedBy);
    }
}

// Run all examples
async function runExamples() {
    try {
        await pulsarRiskAssessment();
        await pulsarCacheExample();
        await batchRiskAssessment();
        await privateTransactionExample();
        costEstimationExample();
        await optimizedPrivateTransaction();
        await combinedWorkflow();
    } catch (error) {
        console.error("Error running examples:", error);
    }
}

// Uncomment to run
// runExamples();
