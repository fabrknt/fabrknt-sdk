import { describe, it, expect } from "vitest";
import {
    detectReentrancy,
    detectFlashLoan,
    detectFrontRunning,
    detectUnauthorizedAccess,
    detectAllEVMPatterns,
} from "../src/guard/evm-detector";
import type { EVMTransactionData } from "../src/chain/types";
import { PatternId, Severity } from "../src/types";

describe("Guard EVM Detector - Reentrancy Detection", () => {
    describe("detectReentrancy", () => {
        it("should detect withdraw function signatures", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x3ccfd60b00000000000000000000000000000000000000000000000000000000", // withdraw()
                value: "0",
            };

            const warnings = detectReentrancy(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const reentrancyWarning = warnings.find(
                (w) => w.patternId === PatternId.ReentrancyAttack
            );
            expect(reentrancyWarning).toBeDefined();
            expect(reentrancyWarning?.severity).toBe(Severity.Warning);
            expect(reentrancyWarning?.message).toContain("withdraw");
        });

        it("should detect withdraw with amount function signature", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x2e1a7d4d00000000000000000000000000000000000000000000000000000000", // withdraw(uint256)
                value: "0",
            };

            const warnings = detectReentrancy(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const reentrancyWarning = warnings.find(
                (w) => w.patternId === PatternId.ReentrancyAttack
            );
            expect(reentrancyWarning).toBeDefined();
        });

        it("should detect multiple call patterns", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x12345678callcallcall00000000000000000000000000000000000000000000000000000000", // Multiple "call" patterns
                value: "0",
            };

            const warnings = detectReentrancy(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const reentrancyWarning = warnings.find(
                (w) => w.patternId === PatternId.ReentrancyAttack
            );
            expect(reentrancyWarning).toBeDefined();
            expect(reentrancyWarning?.severity).toBe(Severity.Alert);
            expect(reentrancyWarning?.message).toContain("multiple external calls");
        });

        it("should detect value transfer with external call", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0xa9059cbb00000000000000000000000000000000000000000000000000000000", // transfer
                value: "1000000000000000000", // 1 ETH
            };

            const warnings = detectReentrancy(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const reentrancyWarning = warnings.find(
                (w) => w.patternId === PatternId.ReentrancyAttack
            );
            expect(reentrancyWarning).toBeDefined();
            expect(reentrancyWarning?.message).toContain("Value transfer");
        });

        it("should not detect reentrancy in safe transactions", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x1234567800000000000000000000000000000000000000000000000000000000", // Unknown function
                value: "0",
            };

            const warnings = detectReentrancy(txData);

            // Should not have reentrancy warnings for unknown functions
            const reentrancyWarnings = warnings.filter(
                (w) => w.patternId === PatternId.ReentrancyAttack
            );
            expect(reentrancyWarnings.length).toBe(0);
        });
    });
});

describe("Guard EVM Detector - Flash Loan Detection", () => {
    describe("detectFlashLoan", () => {
        it("should detect Aave flashLoan signature", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0xab9c4b5d00000000000000000000000000000000000000000000000000000000", // Aave flashLoan
                value: "0",
            };

            const warnings = detectFlashLoan(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const flashLoanWarning = warnings.find(
                (w) => w.patternId === PatternId.FlashLoanAttack
            );
            expect(flashLoanWarning).toBeDefined();
            expect(flashLoanWarning?.severity).toBe(Severity.Warning);
            expect(flashLoanWarning?.message).toContain("Aave");
        });

        it("should detect Aave flashLoanSimple signature", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x5cffe9de00000000000000000000000000000000000000000000000000000000", // Aave flashLoanSimple
                value: "0",
            };

            const warnings = detectFlashLoan(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const flashLoanWarning = warnings.find(
                (w) => w.patternId === PatternId.FlashLoanAttack
            );
            expect(flashLoanWarning).toBeDefined();
            expect(flashLoanWarning?.message).toContain("Aave");
        });

        it("should detect Uniswap V2 flash swap callback", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x490e6cbc00000000000000000000000000000000000000000000000000000000", // Uniswap V2 flash
                value: "0",
            };

            const warnings = detectFlashLoan(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const flashLoanWarning = warnings.find(
                (w) => w.patternId === PatternId.FlashLoanAttack
            );
            expect(flashLoanWarning).toBeDefined();
            expect(flashLoanWarning?.message).toContain("Uniswap");
        });

        it("should detect Uniswap V3 flash callback", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x10d1e85c00000000000000000000000000000000000000000000000000000000", // Uniswap V3 flash
                value: "0",
            };

            const warnings = detectFlashLoan(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const flashLoanWarning = warnings.find(
                (w) => w.patternId === PatternId.FlashLoanAttack
            );
            expect(flashLoanWarning).toBeDefined();
            expect(flashLoanWarning?.message).toContain("Uniswap");
        });

        it("should detect Balancer flashLoan signature", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0xe0232b4200000000000000000000000000000000000000000000000000000000", // Balancer flashLoan
                value: "0",
            };

            const warnings = detectFlashLoan(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const flashLoanWarning = warnings.find(
                (w) => w.patternId === PatternId.FlashLoanAttack
            );
            expect(flashLoanWarning).toBeDefined();
            expect(flashLoanWarning?.message).toContain("Balancer");
        });

        it("should detect flash loan indicators in data", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x12345678flashloan00000000000000000000000000000000000000000000000000",
                value: "0",
            };

            const warnings = detectFlashLoan(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const flashLoanWarning = warnings.find(
                (w) => w.patternId === PatternId.FlashLoanAttack
            );
            expect(flashLoanWarning).toBeDefined();
            expect(flashLoanWarning?.severity).toBe(Severity.Alert);
        });

        it("should not detect flash loan in normal transactions", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x1234567800000000000000000000000000000000000000000000000000000000",
                value: "0",
            };

            const warnings = detectFlashLoan(txData);

            const flashLoanWarnings = warnings.filter(
                (w) => w.patternId === PatternId.FlashLoanAttack
            );
            expect(flashLoanWarnings.length).toBe(0);
        });
    });
});

describe("Guard EVM Detector - Front-Running Detection", () => {
    describe("detectFrontRunning", () => {
        it("should detect unusually high priority fee relative to network average", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x",
                value: "0",
                maxPriorityFeePerGas: "31000000000", // 31 gwei (> 3x of 10 gwei)
            };

            const networkAvgPriorityFee = 10000000000n; // 10 gwei

            const warnings = detectFrontRunning(txData, networkAvgPriorityFee);

            expect(warnings.length).toBeGreaterThan(0);
            const frontRunningWarning = warnings.find(
                (w) => w.patternId === PatternId.FrontRunning
            );
            expect(frontRunningWarning).toBeDefined();
            expect(frontRunningWarning?.severity).toBe(Severity.Alert);
            expect(frontRunningWarning?.message).toContain("3x");
        });

        it("should detect very high absolute priority fee", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x",
                value: "0",
                maxPriorityFeePerGas: "200000000000", // 200 gwei - very high
            };

            const warnings = detectFrontRunning(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const frontRunningWarning = warnings.find(
                (w) => w.patternId === PatternId.FrontRunning
            );
            expect(frontRunningWarning).toBeDefined();
            expect(frontRunningWarning?.severity).toBe(Severity.Warning);
        });

        it("should detect extremely high legacy gas price", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x",
                value: "0",
                gasPrice: "600000000000", // 600 gwei - extremely high
            };

            const warnings = detectFrontRunning(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const frontRunningWarning = warnings.find(
                (w) => w.patternId === PatternId.FrontRunning
            );
            expect(frontRunningWarning).toBeDefined();
            expect(frontRunningWarning?.severity).toBe(Severity.Alert);
            expect(frontRunningWarning?.message).toContain("600 gwei");
        });

        it("should not detect front-running for normal gas prices", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x",
                value: "0",
                maxPriorityFeePerGas: "2000000000", // 2 gwei - normal
            };

            const networkAvgPriorityFee = 1000000000n; // 1 gwei

            const warnings = detectFrontRunning(txData, networkAvgPriorityFee);

            const frontRunningWarnings = warnings.filter(
                (w) => w.patternId === PatternId.FrontRunning
            );
            expect(frontRunningWarnings.length).toBe(0);
        });

        it("should handle transactions without gas price info", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x",
                value: "0",
            };

            const warnings = detectFrontRunning(txData);

            expect(warnings).toHaveLength(0);
        });
    });
});

describe("Guard EVM Detector - Unauthorized Access Detection", () => {
    describe("detectUnauthorizedAccess", () => {
        it("should detect delegatecall usage", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x12345678delegatecall00000000000000000000000000000000000000000000000000",
                value: "0",
            };

            const warnings = detectUnauthorizedAccess(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const unauthorizedWarning = warnings.find(
                (w) => w.patternId === PatternId.UnauthorizedAccess
            );
            expect(unauthorizedWarning).toBeDefined();
            expect(unauthorizedWarning?.severity).toBe(Severity.Critical);
            expect(unauthorizedWarning?.message).toContain("Delegatecall");
        });

        it("should detect transferOwnership function", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0xf2fde38b00000000000000000000000000000000000000000000000000000000", // transferOwnership(address)
                value: "0",
            };

            const warnings = detectUnauthorizedAccess(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const unauthorizedWarning = warnings.find(
                (w) => w.patternId === PatternId.UnauthorizedAccess
            );
            expect(unauthorizedWarning).toBeDefined();
            expect(unauthorizedWarning?.severity).toBe(Severity.Critical);
            expect(unauthorizedWarning?.message).toContain("Ownership change");
        });

        it("should detect renounceOwnership function", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x715018a600000000000000000000000000000000000000000000000000000000", // renounceOwnership()
                value: "0",
            };

            const warnings = detectUnauthorizedAccess(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const unauthorizedWarning = warnings.find(
                (w) => w.patternId === PatternId.UnauthorizedAccess
            );
            expect(unauthorizedWarning).toBeDefined();
            expect(unauthorizedWarning?.severity).toBe(Severity.Critical);
        });

        it("should detect contract upgrade functions", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x3659cfe600000000000000000000000000000000000000000000000000000000", // upgradeTo(address)
                value: "0",
            };

            const warnings = detectUnauthorizedAccess(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const unauthorizedWarning = warnings.find(
                (w) => w.patternId === PatternId.UnauthorizedAccess
            );
            expect(unauthorizedWarning).toBeDefined();
            expect(unauthorizedWarning?.severity).toBe(Severity.Critical);
            expect(unauthorizedWarning?.message).toContain("upgrade");
        });

        it("should detect access control modification functions", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x2f2ff15d00000000000000000000000000000000000000000000000000000000", // grantRole(bytes32,address)
                value: "0",
            };

            const warnings = detectUnauthorizedAccess(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const unauthorizedWarning = warnings.find(
                (w) => w.patternId === PatternId.UnauthorizedAccess
            );
            expect(unauthorizedWarning).toBeDefined();
            expect(unauthorizedWarning?.severity).toBe(Severity.Warning);
            expect(unauthorizedWarning?.message).toContain("Access control");
        });

        it("should detect revokeRole function", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0xd547741f00000000000000000000000000000000000000000000000000000000", // revokeRole(bytes32,address)
                value: "0",
            };

            const warnings = detectUnauthorizedAccess(txData);

            expect(warnings.length).toBeGreaterThan(0);
            const unauthorizedWarning = warnings.find(
                (w) => w.patternId === PatternId.UnauthorizedAccess
            );
            expect(unauthorizedWarning).toBeDefined();
        });

        it("should not detect unauthorized access in normal transactions", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x1234567800000000000000000000000000000000000000000000000000000000",
                value: "0",
            };

            const warnings = detectUnauthorizedAccess(txData);

            const unauthorizedWarnings = warnings.filter(
                (w) => w.patternId === PatternId.UnauthorizedAccess
            );
            expect(unauthorizedWarnings.length).toBe(0);
        });
    });
});

describe("Guard EVM Detector - All Patterns", () => {
    describe("detectAllEVMPatterns", () => {
        it("should detect all EVM patterns in a single call", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0xab9c4b5d00000000000000000000000000000000000000000000000000000000", // Flash loan
                value: "0",
                maxPriorityFeePerGas: "200000000000", // High priority fee
            };

            const warnings = detectAllEVMPatterns(txData);

            expect(warnings.length).toBeGreaterThan(0);

            const flashLoanWarning = warnings.find(
                (w) => w.patternId === PatternId.FlashLoanAttack
            );
            expect(flashLoanWarning).toBeDefined();

            const frontRunningWarning = warnings.find(
                (w) => w.patternId === PatternId.FrontRunning
            );
            expect(frontRunningWarning).toBeDefined();
        });

        it("should handle empty transaction data", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x",
                value: "0",
            };

            const warnings = detectAllEVMPatterns(txData);

            // Should still run all detectors, may or may not find issues
            expect(Array.isArray(warnings)).toBe(true);
        });

        it("should handle transactions with network average priority fee", () => {
            const txData: EVMTransactionData = {
                to: "0x1234567890123456789012345678901234567890",
                data: "0x",
                value: "0",
                maxPriorityFeePerGas: "31000000000", // 31 gwei (> 3x of 10 gwei)
            };

            const networkAvgPriorityFee = 10000000000n; // 10 gwei

            const warnings = detectAllEVMPatterns(txData, networkAvgPriorityFee);

            const frontRunningWarning = warnings.find(
                (w) => w.patternId === PatternId.FrontRunning
            );
            expect(frontRunningWarning).toBeDefined();
        });
    });
});

