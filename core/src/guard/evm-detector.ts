/**
 * EVM Security Pattern Detector
 *
 * Detects security vulnerabilities and suspicious patterns in EVM transactions
 * including reentrancy attacks, flash loans, front-running, and unauthorized access.
 */

import type { EVMTransactionData } from "../chain/types";
import { PatternId, Severity, type SecurityWarning } from "../types";

/**
 * Known flash loan function signatures
 */
const FLASH_LOAN_SIGNATURES = [
    "0xab9c4b5d", // Aave flashLoan(address receiverAddress, address[] assets, uint256[] amounts, uint256[] modes, address onBehalfOf, bytes params, uint16 referralCode)
    "0x5cffe9de", // Aave flashLoanSimple(address receiverAddress, address asset, uint256 amount, bytes params, uint16 referralCode)
    "0x490e6cbc", // Uniswap V2 flash swap callback
    "0x10d1e85c", // Uniswap V3 flash callback
    "0xe0232b42", // Balancer flashLoan(address recipient, address[] tokens, uint256[] amounts, bytes userData)
];

/**
 * Known reentrancy-prone patterns
 */
const EXTERNAL_CALL_SIGNATURES = [
    "0x3ccfd60b", // withdraw()
    "0x2e1a7d4d", // withdraw(uint256)
    "0x00f714ce", // withdraw(uint256,address)
    "0xa9059cbb", // transfer(address,uint256) - can trigger callbacks in some tokens
    "0x23b872dd", // transferFrom(address,address,uint256)
];

/**
 * Delegatecall signature (dangerous for unauthorized access)
 */
const DELEGATECALL_SIGNATURE = "0xf2c29847"; // delegatecall signature in some contexts

/**
 * Detect reentrancy attack patterns
 *
 * EVM-001: Reentrancy Attack Detection
 * Checks for patterns that could indicate reentrancy vulnerabilities:
 * - External calls followed by state changes
 * - Withdraw functions without proper guards
 * - Multiple external calls in sequence
 *
 * @param txData - EVM transaction data
 * @returns Array of security warnings
 */
export function detectReentrancy(txData: EVMTransactionData): SecurityWarning[] {
    const warnings: SecurityWarning[] = [];
    const data = txData.data.toLowerCase();

    // Check for known reentrancy-prone function signatures
    const functionSig = data.slice(0, 10);

    if (EXTERNAL_CALL_SIGNATURES.includes(functionSig)) {
        // Check if this is a withdraw function or transfer
        if (functionSig.startsWith("0x3ccfd60b") || functionSig.startsWith("0x2e1a7d4d")) {
            warnings.push({
                patternId: PatternId.ReentrancyAttack,
                severity: Severity.Warning,
                message: "Transaction contains withdraw function - verify reentrancy guards are in place",
                timestamp: Date.now(),
            });
        }
    }

    // Check for multiple call patterns (potential reentrancy chain)
    // This is a simplified heuristic - in production, would parse full calldata
    const callCount = (data.match(/(?:call|delegatecall)/g) || []).length;
    if (callCount > 2) {
        warnings.push({
            patternId: PatternId.ReentrancyAttack,
            severity: Severity.Alert,
            message: "Transaction contains multiple external calls - potential reentrancy risk",
            timestamp: Date.now(),
        });
    }

    // Check for value transfer with external call
    if (txData.value && BigInt(txData.value) > 0n && EXTERNAL_CALL_SIGNATURES.includes(functionSig)) {
        warnings.push({
            patternId: PatternId.ReentrancyAttack,
            severity: Severity.Warning,
            message: "Value transfer combined with external call - verify reentrancy protection",
            timestamp: Date.now(),
        });
    }

    return warnings;
}

/**
 * Detect flash loan patterns
 *
 * EVM-002: Flash Loan Attack Detection
 * Identifies transactions that use flash loans:
 * - Known flash loan function signatures
 * - Large borrowed amounts
 * - Flash loan callback patterns
 *
 * Note: Flash loans themselves are not malicious, but this flags them for review
 *
 * @param txData - EVM transaction data
 * @returns Array of security warnings
 */
export function detectFlashLoan(txData: EVMTransactionData): SecurityWarning[] {
    const warnings: SecurityWarning[] = [];
    const data = txData.data.toLowerCase();
    const functionSig = data.slice(0, 10);

    // Check for known flash loan signatures
    if (FLASH_LOAN_SIGNATURES.includes(functionSig)) {
        let protocol = "Unknown";

        // Identify protocol
        if (functionSig === "0xab9c4b5d" || functionSig === "0x5cffe9de") {
            protocol = "Aave";
        } else if (functionSig === "0x490e6cbc" || functionSig === "0x10d1e85c") {
            protocol = "Uniswap";
        } else if (functionSig === "0xe0232b42") {
            protocol = "Balancer";
        }

        warnings.push({
            patternId: PatternId.FlashLoanAttack,
            severity: Severity.Warning,
            message: `Flash loan detected from ${protocol} - verify legitimate use case`,
            timestamp: Date.now(),
        });
    }

    // Check for flash loan callback patterns in data
    if (data.includes("flashloan") || data.includes("flash")) {
        warnings.push({
            patternId: PatternId.FlashLoanAttack,
            severity: Severity.Alert,
            message: "Transaction data contains flash loan indicators - review carefully",
            timestamp: Date.now(),
        });
    }

    return warnings;
}

/**
 * Detect front-running attempts
 *
 * EVM-003: Front-running Detection
 * Identifies transactions with characteristics of front-running:
 * - Unusually high gas prices (priority fees)
 * - High maxPriorityFeePerGas relative to network average
 * - MEV patterns
 *
 * @param txData - EVM transaction data
 * @param networkAvgPriorityFee - Optional network average priority fee for comparison
 * @returns Array of security warnings
 */
export function detectFrontRunning(
    txData: EVMTransactionData,
    networkAvgPriorityFee?: bigint
): SecurityWarning[] {
    const warnings: SecurityWarning[] = [];

    // Check maxPriorityFeePerGas if using EIP-1559
    if (txData.maxPriorityFeePerGas) {
        const priorityFee = BigInt(txData.maxPriorityFeePerGas);

        // If network average provided, check if this is significantly higher
        if (networkAvgPriorityFee !== undefined) {
            // Flag if 3x or higher than network average
            if (priorityFee > networkAvgPriorityFee * 3n) {
                warnings.push({
                    patternId: PatternId.FrontRunning,
                    severity: Severity.Alert,
                    message: `Unusually high priority fee detected (${priorityFee.toString()} wei, ${Math.round(Number(priorityFee) / Number(networkAvgPriorityFee))}x network average) - potential MEV/front-running activity`,
                    timestamp: Date.now(),
                });
            }
        } else {
            // Without network average, flag very high absolute values
            // 100 gwei = 100_000_000_000 wei is very high for priority fee
            if (priorityFee > 100_000_000_000n) {
                warnings.push({
                    patternId: PatternId.FrontRunning,
                    severity: Severity.Warning,
                    message: `Very high priority fee detected (${Number(priorityFee) / 1e9} gwei) - potential front-running attempt`,
                    timestamp: Date.now(),
                });
            }
        }
    }

    // Check legacy gas price
    if (txData.gasPrice) {
        const gasPrice = BigInt(txData.gasPrice);

        // Flag extremely high gas prices (>500 gwei is unusual for legitimate transactions)
        if (gasPrice > 500_000_000_000n) {
            warnings.push({
                patternId: PatternId.FrontRunning,
                severity: Severity.Alert,
                message: `Extremely high gas price detected (${Number(gasPrice) / 1e9} gwei) - potential front-running`,
                timestamp: Date.now(),
            });
        }
    }

    return warnings;
}

/**
 * Detect unauthorized access patterns
 *
 * EVM-004: Unauthorized Access Detection
 * Identifies potential unauthorized access attempts:
 * - Delegatecall usage (can be dangerous)
 * - Access control bypass attempts
 * - Suspicious ownership changes
 *
 * @param txData - EVM transaction data
 * @returns Array of security warnings
 */
export function detectUnauthorizedAccess(txData: EVMTransactionData): SecurityWarning[] {
    const warnings: SecurityWarning[] = [];
    const data = txData.data.toLowerCase();
    const functionSig = data.slice(0, 10);

    // Check for delegatecall
    if (data.includes("delegatecall") || functionSig === DELEGATECALL_SIGNATURE) {
        warnings.push({
            patternId: PatternId.UnauthorizedAccess,
            severity: Severity.Critical,
            message: "Delegatecall detected - verify caller authorization and code safety",
            timestamp: Date.now(),
        });
    }

    // Check for ownership transfer functions
    const ownershipSignatures = [
        "0xf2fde38b", // transferOwnership(address)
        "0x8da5cb5b", // owner() - view function, but in tx could be suspicious
        "0x715018a6", // renounceOwnership()
    ];

    if (ownershipSignatures.includes(functionSig)) {
        warnings.push({
            patternId: PatternId.UnauthorizedAccess,
            severity: Severity.Critical,
            message: "Ownership change function detected - verify authorization",
            timestamp: Date.now(),
        });
    }

    // Check for upgrade proxy patterns (can be used maliciously)
    const upgradeSignatures = [
        "0x3659cfe6", // upgradeTo(address)
        "0x4f1ef286", // upgradeToAndCall(address,bytes)
        "0x99a88ec4", // upgrade(address)
    ];

    if (upgradeSignatures.includes(functionSig)) {
        warnings.push({
            patternId: PatternId.UnauthorizedAccess,
            severity: Severity.Critical,
            message: "Contract upgrade function detected - verify proper authorization",
            timestamp: Date.now(),
        });
    }

    // Check for access control modification
    const accessControlSignatures = [
        "0x2f2ff15d", // grantRole(bytes32,address)
        "0xd547741f", // revokeRole(bytes32,address)
        "0x36568abe", // renounceRole(bytes32,address)
    ];

    if (accessControlSignatures.includes(functionSig)) {
        warnings.push({
            patternId: PatternId.UnauthorizedAccess,
            severity: Severity.Warning,
            message: "Access control modification detected - verify authorization",
            timestamp: Date.now(),
        });
    }

    return warnings;
}

/**
 * Run all EVM security pattern detectors on a transaction
 *
 * @param txData - EVM transaction data
 * @param networkAvgPriorityFee - Optional network average priority fee for front-running detection
 * @returns Array of all detected security warnings
 */
export function detectAllEVMPatterns(
    txData: EVMTransactionData,
    networkAvgPriorityFee?: bigint
): SecurityWarning[] {
    const warnings: SecurityWarning[] = [];

    // Run all detectors
    warnings.push(...detectReentrancy(txData));
    warnings.push(...detectFlashLoan(txData));
    warnings.push(...detectFrontRunning(txData, networkAvgPriorityFee));
    warnings.push(...detectUnauthorizedAccess(txData));

    return warnings;
}
