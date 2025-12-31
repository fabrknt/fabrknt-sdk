/**
 * Basic Guard Usage Example
 *
 * This example demonstrates how to use the Guard module for
 * transaction validation and security pattern detection.
 */

import {
    Guard,
    PatternId,
    Severity,
    type Transaction,
    type ValidationResult,
} from "@fabrknt/sdk";

// Example 1: Basic Guard with Default Configuration
function basicGuard() {
    console.log("=== Example 1: Basic Guard ===\n");

    const guard = new Guard();

    const tx: Transaction = {
        id: "tx-001",
        status: "pending",
    };

    const result = guard.validateTransaction(tx);
    console.log("Validation Result:", result.isValid);
    console.log("Warnings:", result.warnings.length);
}

// Example 2: Guard with Slippage Protection
function slippageProtection() {
    console.log("\n=== Example 2: Slippage Protection ===\n");

    const guard = new Guard({
        maxSlippage: 1.0, // 1% maximum slippage
    });

    // Check if slippage is acceptable
    console.log("0.5% slippage:", guard.isSlippageAcceptable(0.5)); // true
    console.log("1.5% slippage:", guard.isSlippageAcceptable(1.5)); // false
}

// Example 3: Emergency Stop Mechanism
function emergencyStop() {
    console.log("\n=== Example 3: Emergency Stop ===\n");

    const guard = new Guard();

    // Normal operation
    console.log("Normal operation:", guard.validate());

    // Activate emergency stop
    guard.activateEmergencyStop();
    console.log("After emergency stop:", guard.validate());

    // Deactivate
    guard.deactivateEmergencyStop();
    console.log("After deactivation:", guard.validate());
}

// Example 4: Risk Tolerance Levels
function riskTolerance() {
    console.log("\n=== Example 4: Risk Tolerance Levels ===\n");

    // Strict mode - blocks all critical patterns
    const strictGuard = new Guard({
        riskTolerance: "strict",
        mode: "block",
    });

    // Moderate mode - blocks only critical patterns
    const moderateGuard = new Guard({
        riskTolerance: "moderate",
        mode: "block",
    });

    // Permissive mode - blocks only irreversible operations
    const permissiveGuard = new Guard({
        riskTolerance: "permissive",
        mode: "block",
    });

    console.log("Strict config:", strictGuard.getConfig().riskTolerance);
    console.log("Moderate config:", moderateGuard.getConfig().riskTolerance);
    console.log(
        "Permissive config:",
        permissiveGuard.getConfig().riskTolerance
    );
}

// Example 5: Warn Mode vs Block Mode
function warnVsBlock() {
    console.log("\n=== Example 5: Warn vs Block Mode ===\n");

    // Block mode - prevents dangerous transactions
    const blockGuard = new Guard({
        mode: "block",
    });

    // Warn mode - allows transactions but logs warnings
    const warnGuard = new Guard({
        mode: "warn",
    });

    console.log("Block mode config:", blockGuard.getConfig().mode);
    console.log("Warn mode config:", warnGuard.getConfig().mode);
}

// Example 6: Custom Validation Rules
function customRules() {
    console.log("\n=== Example 6: Custom Validation Rules ===\n");

    const guard = new Guard({
        customRules: [
            {
                id: "max-instructions",
                name: "Maximum Instructions Check",
                enabled: true,
                validate: (tx: Transaction) => {
                    // Limit to 10 instructions per transaction
                    return (tx.instructions?.length || 0) <= 10;
                },
            },
        ],
    });

    const validTx: Transaction = {
        id: "tx-002",
        status: "pending",
        instructions: [
            /* up to 10 instructions */
        ],
    };

    const result = guard.validateTransaction(validTx);
    console.log("Custom rule validation:", result.isValid);
}

// Example 7: Monitoring Warning History
function warningHistory() {
    console.log("\n=== Example 7: Warning History ===\n");

    const guard = new Guard();

    // Validate some transactions
    guard.validateTransaction({ id: "tx-003", status: "pending" });
    guard.validateTransaction({ id: "tx-004", status: "pending" });

    // Get warning history
    const warnings = guard.getWarningHistory();
    console.log("Total warnings:", warnings.length);

    // Clear history
    guard.clearWarningHistory();
    console.log("After clear:", guard.getWarningHistory().length);
}

// Example 8: Dynamic Configuration Updates
function dynamicConfig() {
    console.log("\n=== Example 8: Dynamic Configuration ===\n");

    const guard = new Guard({
        maxSlippage: 1.0,
        riskTolerance: "moderate",
    });

    console.log("Initial max slippage:", guard.getConfig().maxSlippage);

    // Update configuration at runtime
    guard.updateConfig({
        maxSlippage: 2.0,
        riskTolerance: "strict",
    });

    console.log("Updated max slippage:", guard.getConfig().maxSlippage);
    console.log("Updated risk tolerance:", guard.getConfig().riskTolerance);
}

// Run all examples
function runExamples() {
    basicGuard();
    slippageProtection();
    emergencyStop();
    riskTolerance();
    warnVsBlock();
    customRules();
    warningHistory();
    dynamicConfig();
}

// Uncomment to run
// runExamples();
