import {
    RwaRiskMetrics,
    PriceData,
    TokenInfo,
    TokenDistribution,
} from "../types/data";
import { OracleDataMapper } from "./oracleDataMapper";

/**
 * Data aggregator - combines on-chain and oracle data
 * Applies business logic and returns unified response format
 */
export class DataAggregator {
    /**
     * Aggregate RWA risk data from multiple sources
     */
    static aggregateRwaRiskData(
        tokenInfo: TokenInfo,
        oracleData: any | null,
        oracleSource: "switchboard" | "pyth" | "custom" | "mock" | null,
        accountData?: TokenDistribution
    ): RwaRiskMetrics {
        // Start with default/fallback values
        let metrics: RwaRiskMetrics = {
            legalCompliance: {
                status: "unknown",
                jurisdiction: "unknown",
                structure: "unknown",
                lastVerified: new Date().toISOString(),
            },
            counterpartyRisk: {
                issuerRating: "N/A",
                defaultProbability: 0,
                solvencyScore: 0,
                lastUpdated: new Date().toISOString(),
            },
            oracleIntegrity: {
                consensusNodes: 0,
                dataReliability: 0,
                latency: "unknown",
                lastUpdate: new Date().toISOString(),
            },
        };

        // Map oracle data if available
        if (oracleData && oracleSource) {
            const mappedOracle = OracleDataMapper.mapToRwaRiskMetrics(
                oracleData,
                oracleSource
            );
            if (mappedOracle) {
                metrics = mappedOracle;
            }
        }

        // Enhance with on-chain data
        metrics = this.enhanceWithOnChainData(metrics, tokenInfo, accountData);

        // Apply business logic
        metrics = this.applyBusinessLogic(metrics, tokenInfo, accountData);

        return metrics;
    }

    /**
     * Enhance metrics with on-chain token information
     */
    private static enhanceWithOnChainData(
        metrics: RwaRiskMetrics,
        tokenInfo: TokenInfo,
        accountData?: TokenDistribution
    ): RwaRiskMetrics {
        // Use token name/symbol if available
        if (tokenInfo.name && metrics.legalCompliance.structure === "unknown") {
            // Infer structure from token name (basic heuristic)
            const name = tokenInfo.name.toLowerCase();
            if (name.includes("bond") || name.includes("treasury")) {
                metrics.legalCompliance.structure = "tokenized_bond";
            } else if (name.includes("fund") || name.includes("etf")) {
                metrics.legalCompliance.structure = "tokenized_fund";
            } else if (name.includes("credit") || name.includes("loan")) {
                metrics.legalCompliance.structure = "tokenized_credit";
            }
        }

        // Enhance counterparty risk with distribution data
        if (accountData) {
            // High concentration = higher counterparty risk
            if (accountData.concentration > 0.8) {
                metrics.counterpartyRisk.defaultProbability = Math.min(
                    metrics.counterpartyRisk.defaultProbability + 0.05,
                    1.0
                );
            }

            // Many holders = lower risk (more distributed)
            if (accountData.totalHolders > 1000) {
                metrics.counterpartyRisk.solvencyScore = Math.min(
                    metrics.counterpartyRisk.solvencyScore + 0.05,
                    1.0
                );
            }
        }

        return metrics;
    }

    /**
     * Apply business logic to risk metrics
     */
    private static applyBusinessLogic(
        metrics: RwaRiskMetrics,
        tokenInfo: TokenInfo,
        accountData?: TokenDistribution
    ): RwaRiskMetrics {
        // Normalize values
        metrics.counterpartyRisk.defaultProbability = Math.max(
            0,
            Math.min(1, metrics.counterpartyRisk.defaultProbability)
        );
        metrics.counterpartyRisk.solvencyScore = Math.max(
            0,
            Math.min(1, metrics.counterpartyRisk.solvencyScore)
        );
        metrics.oracleIntegrity.dataReliability = Math.max(
            0,
            Math.min(1, metrics.oracleIntegrity.dataReliability)
        );

        // Calculate derived metrics
        // Oracle integrity affects overall reliability
        if (metrics.oracleIntegrity.consensusNodes < 3) {
            metrics.oracleIntegrity.dataReliability *= 0.8; // Reduce reliability for low node count
        }

        // Ensure timestamps are valid
        if (
            !metrics.legalCompliance.lastVerified ||
            metrics.legalCompliance.lastVerified === "unknown"
        ) {
            metrics.legalCompliance.lastVerified = new Date().toISOString();
        }
        if (
            !metrics.counterpartyRisk.lastUpdated ||
            metrics.counterpartyRisk.lastUpdated === "unknown"
        ) {
            metrics.counterpartyRisk.lastUpdated = new Date().toISOString();
        }
        if (
            !metrics.oracleIntegrity.lastUpdate ||
            metrics.oracleIntegrity.lastUpdate === "unknown"
        ) {
            metrics.oracleIntegrity.lastUpdate = new Date().toISOString();
        }

        return metrics;
    }

    /**
     * Aggregate price data from multiple sources
     */
    static aggregatePriceData(
        oracleData: any | null,
        oracleSource: "switchboard" | "pyth" | "custom" | "mock" | null
    ): PriceData | null {
        if (!oracleData || !oracleSource) {
            return null;
        }

        const priceData = OracleDataMapper.mapToPriceData(
            oracleData,
            oracleSource
        );

        if (!priceData) {
            return null;
        }

        // Validate price data
        if (!OracleDataMapper.validateOracleData(oracleData, oracleSource)) {
            console.warn("Oracle price data validation failed");
            return null;
        }

        return priceData;
    }

    /**
     * Calculate confidence score for aggregated data
     */
    static calculateConfidence(
        oracleData: any | null,
        tokenInfo: TokenInfo,
        accountData?: TokenDistribution
    ): number {
        let confidence = 0.5; // Base confidence

        // Oracle data increases confidence
        if (oracleData) {
            confidence += 0.3;
        }

        // Token metadata increases confidence
        if (tokenInfo.name && tokenInfo.symbol) {
            confidence += 0.1;
        }

        // Account data increases confidence
        if (accountData && accountData.totalHolders > 0) {
            confidence += 0.1;
        }

        return Math.min(1.0, confidence);
    }
}
