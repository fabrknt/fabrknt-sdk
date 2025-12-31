/**
 * Type definitions for RWA risk data structures
 */

export interface TokenInfo {
  mint: string;
  decimals: number;
  supply: string;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  name?: string;
  symbol?: string;
  uri?: string;
}

export interface LegalCompliance {
  status: 'compliant' | 'non-compliant' | 'pending' | 'unknown';
  jurisdiction: string;
  structure: string;
  lastVerified: string;
}

export interface CounterpartyRisk {
  issuerRating: string;
  defaultProbability: number;
  solvencyScore: number;
  lastUpdated: string;
}

export interface OracleIntegrity {
  consensusNodes: number;
  dataReliability: number;
  latency: string;
  lastUpdate: string;
}

export interface RwaRiskMetrics {
  legalCompliance: LegalCompliance;
  counterpartyRisk: CounterpartyRisk;
  oracleIntegrity: OracleIntegrity;
}

export interface RwaRiskData {
  tokenMint: string;
  timestamp: string;
  metrics: RwaRiskMetrics;
  requestedBy: string;
}

export interface LiquidationParameters {
  liquidationThreshold: number;
  maxLtv: number;
  liquidationPenalty: number;
  healthFactor: number;
  volatility: number;
  correlation: {
    sol: number;
    usdc: number;
  };
}

export interface LiquidationParamsData {
  tokenMint: string;
  timestamp: string;
  parameters: LiquidationParameters;
  requestedBy: string;
}

export interface PriceData {
  price: number;
  timestamp: string;
  source: string;
  confidence: number;
}

export interface TokenMetadata {
  name?: string;
  symbol?: string;
  uri?: string;
  image?: string;
  description?: string;
}

export interface TokenHolder {
  address: string;
  balance: string;
  decimals: number;
}

export interface TokenDistribution {
  totalHolders: number;
  totalSupply: string;
  topHolders: TokenHolder[];
  averageBalance: string;
  concentration: number; // Gini coefficient or similar
}

