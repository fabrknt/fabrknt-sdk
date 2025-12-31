import { describe, it, expect } from "vitest";
import {
    EVMAdapterError,
    NetworkError,
    ValidationError,
    TransactionError,
    GasEstimationError,
    ConfigurationError,
} from "../src/chain/errors";

describe("Chain Errors", () => {
    describe("EVMAdapterError", () => {
        it("should create error with message and code", () => {
            const error = new EVMAdapterError("Test error", "TEST_CODE");

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(EVMAdapterError);
            expect(error.message).toBe("Test error");
            expect(error.code).toBe("TEST_CODE");
            expect(error.name).toBe("EVMAdapterError");
        });

        it("should maintain stack trace", () => {
            const error = new EVMAdapterError("Test error", "TEST_CODE");

            expect(error.stack).toBeDefined();
            expect(error.stack).toContain("EVMAdapterError");
        });
    });

    describe("NetworkError", () => {
        it("should create network error with network and chain", () => {
            const error = new NetworkError(
                "Network failed",
                "mainnet",
                "ethereum"
            );

            expect(error).toBeInstanceOf(EVMAdapterError);
            expect(error).toBeInstanceOf(NetworkError);
            expect(error.message).toBe("Network failed");
            expect(error.code).toBe("NETWORK_ERROR");
            expect(error.network).toBe("mainnet");
            expect(error.chain).toBe("ethereum");
            expect(error.name).toBe("NetworkError");
        });

        it("should create network error without chain", () => {
            const error = new NetworkError("Network failed", "mainnet");

            expect(error.network).toBe("mainnet");
            expect(error.chain).toBeUndefined();
        });
    });

    describe("ValidationError", () => {
        it("should create validation error with errors array", () => {
            const errors = ["Error 1", "Error 2"];
            const error = new ValidationError("Validation failed", errors);

            expect(error).toBeInstanceOf(EVMAdapterError);
            expect(error).toBeInstanceOf(ValidationError);
            expect(error.message).toBe("Validation failed");
            expect(error.code).toBe("VALIDATION_ERROR");
            expect(error.errors).toEqual(errors);
            expect(error.name).toBe("ValidationError");
        });

        it("should handle empty errors array", () => {
            const error = new ValidationError("Validation failed", []);

            expect(error.errors).toEqual([]);
        });
    });

    describe("TransactionError", () => {
        it("should create transaction error with txHash and revertReason", () => {
            const error = new TransactionError(
                "Transaction failed",
                "0x123",
                "Reverted: Insufficient balance"
            );

            expect(error).toBeInstanceOf(EVMAdapterError);
            expect(error).toBeInstanceOf(TransactionError);
            expect(error.message).toBe("Transaction failed");
            expect(error.code).toBe("TRANSACTION_ERROR");
            expect(error.txHash).toBe("0x123");
            expect(error.revertReason).toBe("Reverted: Insufficient balance");
            expect(error.name).toBe("TransactionError");
        });

        it("should create transaction error without optional fields", () => {
            const error = new TransactionError("Transaction failed");

            expect(error.txHash).toBeUndefined();
            expect(error.revertReason).toBeUndefined();
        });
    });

    describe("GasEstimationError", () => {
        it("should create gas estimation error with original error", () => {
            const originalError = new Error("Gas estimation failed");
            const error = new GasEstimationError(
                "Failed to estimate",
                originalError
            );

            expect(error).toBeInstanceOf(EVMAdapterError);
            expect(error).toBeInstanceOf(GasEstimationError);
            expect(error.message).toBe("Failed to estimate");
            expect(error.code).toBe("GAS_ESTIMATION_ERROR");
            expect(error.originalError).toBe(originalError);
            expect(error.name).toBe("GasEstimationError");
        });

        it("should create gas estimation error without original error", () => {
            const error = new GasEstimationError("Failed to estimate");

            expect(error.originalError).toBeUndefined();
        });
    });

    describe("ConfigurationError", () => {
        it("should create configuration error with field", () => {
            const error = new ConfigurationError(
                "Invalid configuration",
                "rpcUrl"
            );

            expect(error).toBeInstanceOf(EVMAdapterError);
            expect(error).toBeInstanceOf(ConfigurationError);
            expect(error.message).toBe("Invalid configuration");
            expect(error.code).toBe("CONFIGURATION_ERROR");
            expect(error.field).toBe("rpcUrl");
            expect(error.name).toBe("ConfigurationError");
        });

        it("should create configuration error without field", () => {
            const error = new ConfigurationError("Invalid configuration");

            expect(error.field).toBeUndefined();
        });
    });

    describe("Error Inheritance", () => {
        it("should allow catching base error type", () => {
            const networkError = new NetworkError("Network failed", "mainnet");
            const validationError = new ValidationError(
                "Validation failed",
                []
            );

            try {
                throw networkError;
            } catch (error) {
                expect(error).toBeInstanceOf(EVMAdapterError);
                expect(error).toBeInstanceOf(NetworkError);
            }

            try {
                throw validationError;
            } catch (error) {
                expect(error).toBeInstanceOf(EVMAdapterError);
                expect(error).toBeInstanceOf(ValidationError);
            }
        });

        it("should allow catching all error types as EVMAdapterError", () => {
            const errors = [
                new NetworkError("Network failed", "mainnet"),
                new ValidationError("Validation failed", []),
                new TransactionError("Transaction failed"),
                new GasEstimationError("Gas estimation failed"),
                new ConfigurationError("Configuration failed"),
            ];

            errors.forEach((error) => {
                expect(error).toBeInstanceOf(EVMAdapterError);
                expect(error.code).toBeDefined();
                expect(error.message).toBeDefined();
            });
        });
    });
});
