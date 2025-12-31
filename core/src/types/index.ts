/**
 * Core types for the Fabrknt SDK
 */

export interface FabrkntConfig {
    network?: "mainnet-beta" | "devnet" | "testnet";
    rpcUrl?: string;
    // Privacy configuration for Privacy integration
    privacy?: PrivacyConfig;
}

/**
 * Privacy Configuration
 */
export interface PrivacyConfig {
    enabled?: boolean;
    provider?: "arbor" | "light";
    compressionLevel?: "low" | "medium" | "high";
    requirePrivacy?: boolean;
}

/**
 * Risk Metrics
 */
export interface RiskMetrics {
    asset?: string;
    riskScore: number | null; // 0-1 scale, where 1 is highest risk
    complianceStatus: "compliant" | "non-compliant" | "unknown" | null;
    counterpartyRisk: number | null; // 0-1 scale
    oracleIntegrity: number | null; // 0-1 scale, where 1 is highest integrity
    timestamp?: number;
}

/**
 * Risk Configuration
 */
export interface PulsarConfig {
    enabled?: boolean;
    riskThreshold?: number; // 0-1 scale, transactions above this will be blocked/warned
    enableComplianceCheck?: boolean;
    enableCounterpartyCheck?: boolean;
    enableOracleCheck?: boolean;
    cacheTTL?: number; // Cache time-to-live in milliseconds (default: 60000 = 1 minute)
    fallbackOnError?: boolean; // Allow transactions if Risk API fails
}

/**
 * Guard Configuration (Fabric Guard)
 */
export interface GuardConfig {
    // Slippage protection
    maxSlippage?: number;

    // Emergency stop - halts all operations if anomalies detected
    emergencyStop?: boolean;

    // Security pattern detection
    enablePatternDetection?: boolean;

    // Risk tolerance level
    riskTolerance?: "strict" | "moderate" | "permissive";

    // Operation mode
    mode?: "block" | "warn";

    // Custom validation rules
    customRules?: ValidationRule[];

    // Risk integration for risk assessment
    pulsar?: PulsarConfig;

    // Chain adapter for cross-chain support (optional, defaults to Solana)
    chainAdapter?: import("../chain").ChainAdapter;

    // Transfer Hook validation (Token-2022)
    validateTransferHooks?: boolean;
    maxHookAccounts?: number; // Maximum accounts a Transfer Hook can access (default: 20)
    allowedHookPrograms?: string[]; // Whitelist of known safe Transfer Hook programs
}

/**
 * Security Pattern IDs
 */
export enum PatternId {
    // Solana patterns
    MintKill = "P-101",
    FreezeKill = "P-102",
    SignerMismatch = "P-103",
    DangerousClose = "P-104",
    MaliciousTransferHook = "P-105",
    UnexpectedHookExecution = "P-106",
    HookReentrancy = "P-107",
    ExcessiveHookAccounts = "P-108",

    // EVM patterns
    ReentrancyAttack = "EVM-001",
    FlashLoanAttack = "EVM-002",
    FrontRunning = "EVM-003",
    UnauthorizedAccess = "EVM-004",
}

/**
 * Warning Severity Levels
 */
export enum Severity {
    Critical = "critical",
    Warning = "warning",
    Alert = "alert",
}

/**
 * Security Warning
 */
export interface SecurityWarning {
    patternId: PatternId;
    severity: Severity;
    message: string;
    affectedAccount?: string;
    timestamp: number;
}

/**
 * Validation Rule
 */
export interface ValidationRule {
    id: string;
    name: string;
    enabled: boolean;
    validate: (transaction: Transaction) => boolean | Promise<boolean>;
}

/**
 * Validation Result
 */
export interface ValidationResult {
    isValid: boolean;
    warnings: SecurityWarning[];
    blockedBy?: PatternId[];
}

/**
 * Loom Configuration (Flow Module)
 */
export interface LoomConfig {
    type: string;
    input?: string;
    output?: string;
    amount?: number;
    parallelPriority?: boolean;
}

/**
 * Transaction Instruction
 */
export interface TransactionInstruction {
    programId: string;
    keys: Array<{
        pubkey: string;
        isSigner: boolean;
        isWritable: boolean;
    }>;
    data: string;
}

/**
 * Transaction
 */
export interface Transaction {
    id: string;
    status: "pending" | "executed" | "failed";
    instructions?: TransactionInstruction[];
    signers?: string[];
    // Asset addresses for risk assessment
    assetAddresses?: string[];
    // Privacy metadata
    privacyMetadata?: {
        requiresPrivacy?: boolean;
        compressionEnabled?: boolean;
    };
}
