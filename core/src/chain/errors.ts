/**
 * EVM Chain Adapter Error Classes
 *
 * Provides specific error types for EVM chain adapter operations,
 * enabling better error handling and debugging.
 */

/**
 * Base error class for EVM adapter errors
 */
export class EVMAdapterError extends Error {
    /** Error code for programmatic handling */
    public readonly code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = "EVMAdapterError";
        this.code = code;

        // Maintain proper stack trace for where error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Network-related errors (RPC failures, connection issues)
 */
export class NetworkError extends EVMAdapterError {
    /** Network name where error occurred */
    public readonly network: string;
    /** Chain identifier */
    public readonly chain?: string;

    constructor(message: string, network: string, chain?: string) {
        super(message, "NETWORK_ERROR");
        this.name = "NetworkError";
        this.network = network;
        this.chain = chain;
    }
}

/**
 * Transaction validation errors
 */
export class ValidationError extends EVMAdapterError {
    /** List of validation errors */
    public readonly errors: string[];

    constructor(message: string, errors: string[]) {
        super(message, "VALIDATION_ERROR");
        this.name = "ValidationError";
        this.errors = errors;
    }
}

/**
 * Transaction execution errors
 */
export class TransactionError extends EVMAdapterError {
    /** Transaction hash if available */
    public readonly txHash?: string;
    /** Revert reason if available */
    public readonly revertReason?: string;

    constructor(message: string, txHash?: string, revertReason?: string) {
        super(message, "TRANSACTION_ERROR");
        this.name = "TransactionError";
        this.txHash = txHash;
        this.revertReason = revertReason;
    }
}

/**
 * Gas estimation errors
 */
export class GasEstimationError extends EVMAdapterError {
    /** Original error from gas estimation */
    public readonly originalError?: unknown;

    constructor(message: string, originalError?: unknown) {
        super(message, "GAS_ESTIMATION_ERROR");
        this.name = "GasEstimationError";
        this.originalError = originalError;
    }
}

/**
 * Configuration errors (invalid network, missing RPC, etc.)
 */
export class ConfigurationError extends EVMAdapterError {
    /** Configuration field that caused the error */
    public readonly field?: string;

    constructor(message: string, field?: string) {
        super(message, "CONFIGURATION_ERROR");
        this.name = "ConfigurationError";
        this.field = field;
    }
}
