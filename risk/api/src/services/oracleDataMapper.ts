import { RwaRiskMetrics, PriceData } from "../types/data";

/**
 * Oracle data mapper - transforms oracle responses to RWA risk format
 * Supports multiple oracle providers (Switchboard, Pyth, custom)
 */
export class OracleDataMapper {
    /**
     * Map oracle response to RWA risk metrics format
     * Handles different oracle response structures
     */
    static mapToRwaRiskMetrics(
        oracleData: any,
        source: "switchboard" | "pyth" | "custom" | "mock"
    ): RwaRiskMetrics | null {
        if (!oracleData) {
            return null;
        }

        try {
            switch (source) {
                case "switchboard":
                    return this.mapSwitchboardToRwaRisk(oracleData);
                case "pyth":
                    return this.mapPythToRwaRisk(oracleData);
                case "custom":
                    return this.mapCustomToRwaRisk(oracleData);
                case "mock":
                    return this.mapMockToRwaRisk(oracleData);
                default:
                    console.warn(`Unknown oracle source: ${source}`);
                    return null;
            }
        } catch (error) {
            console.error(`Error mapping oracle data from ${source}:`, error);
            return null;
        }
    }

    /**
     * Map Switchboard oracle response to RWA risk metrics
     */
    private static mapSwitchboardToRwaRisk(data: any): RwaRiskMetrics {
        // Switchboard feed structure (when available)
        // Expected format: { result: { value: {...}, timestamp: ... } }
        const result = data.result || data;

        return {
            legalCompliance: {
                status:
                    result.legalCompliance?.status ||
                    result.legal_status ||
                    "unknown",
                jurisdiction:
                    result.legalCompliance?.jurisdiction ||
                    result.jurisdiction ||
                    "unknown",
                structure:
                    result.legalCompliance?.structure ||
                    result.structure ||
                    "unknown",
                lastVerified:
                    result.legalCompliance?.lastVerified ||
                    result.last_verified ||
                    new Date(result.timestamp * 1000).toISOString() ||
                    new Date().toISOString(),
            },
            counterpartyRisk: {
                issuerRating:
                    result.counterpartyRisk?.issuerRating ||
                    result.issuer_rating ||
                    result.rating ||
                    "N/A",
                defaultProbability:
                    result.counterpartyRisk?.defaultProbability ||
                    result.default_probability ||
                    result.defaultProb ||
                    0,
                solvencyScore:
                    result.counterpartyRisk?.solvencyScore ||
                    result.solvency_score ||
                    result.solvencyScore ||
                    0,
                lastUpdated:
                    result.counterpartyRisk?.lastUpdated ||
                    result.last_updated ||
                    new Date(result.timestamp * 1000).toISOString() ||
                    new Date().toISOString(),
            },
            oracleIntegrity: {
                consensusNodes:
                    result.oracleIntegrity?.consensusNodes ||
                    result.consensus_nodes ||
                    result.nodes ||
                    0,
                dataReliability:
                    result.oracleIntegrity?.dataReliability ||
                    result.data_reliability ||
                    result.reliability ||
                    0,
                latency:
                    result.oracleIntegrity?.latency ||
                    result.latency ||
                    "<10ms",
                lastUpdate:
                    result.oracleIntegrity?.lastUpdate ||
                    result.last_update ||
                    new Date(result.timestamp * 1000).toISOString() ||
                    new Date().toISOString(),
            },
        };
    }

    /**
     * Map Pyth Network oracle response to RWA risk metrics
     */
    private static mapPythToRwaRisk(data: any): RwaRiskMetrics {
        // Pyth Network structure
        // Expected format: { price: {...}, metadata: {...} }
        const priceData = data.price || data;

        return {
            legalCompliance: {
                status: data.metadata?.legalCompliance?.status || "unknown",
                jurisdiction: data.metadata?.jurisdiction || "unknown",
                structure: data.metadata?.structure || "unknown",
                lastVerified:
                    data.metadata?.lastVerified || new Date().toISOString(),
            },
            counterpartyRisk: {
                issuerRating: data.metadata?.issuerRating || "N/A",
                defaultProbability: data.metadata?.defaultProbability || 0,
                solvencyScore: data.metadata?.solvencyScore || 0,
                lastUpdated:
                    data.metadata?.lastUpdated || new Date().toISOString(),
            },
            oracleIntegrity: {
                consensusNodes: data.num_publishers || 0,
                dataReliability: data.confidence
                    ? 1 - data.confidence / data.price
                    : 0,
                latency: data.publish_time
                    ? `${Date.now() - data.publish_time}ms`
                    : "<10ms",
                lastUpdate: data.publish_time
                    ? new Date(data.publish_time * 1000).toISOString()
                    : new Date().toISOString(),
            },
        };
    }

    /**
     * Map custom oracle response to RWA risk metrics
     */
    private static mapCustomToRwaRisk(data: any): RwaRiskMetrics {
        // Generic mapping for custom oracle formats
        return {
            legalCompliance: {
                status:
                    data.legalCompliance?.status ||
                    data.legal_status ||
                    "unknown",
                jurisdiction:
                    data.legalCompliance?.jurisdiction ||
                    data.jurisdiction ||
                    "unknown",
                structure:
                    data.legalCompliance?.structure ||
                    data.structure ||
                    "unknown",
                lastVerified:
                    data.legalCompliance?.lastVerified ||
                    data.last_verified ||
                    new Date().toISOString(),
            },
            counterpartyRisk: {
                issuerRating:
                    data.counterpartyRisk?.issuerRating ||
                    data.issuer_rating ||
                    data.rating ||
                    "N/A",
                defaultProbability:
                    data.counterpartyRisk?.defaultProbability ||
                    data.default_probability ||
                    0,
                solvencyScore:
                    data.counterpartyRisk?.solvencyScore ||
                    data.solvency_score ||
                    0,
                lastUpdated:
                    data.counterpartyRisk?.lastUpdated ||
                    data.last_updated ||
                    new Date().toISOString(),
            },
            oracleIntegrity: {
                consensusNodes:
                    data.oracleIntegrity?.consensusNodes ||
                    data.consensus_nodes ||
                    0,
                dataReliability:
                    data.oracleIntegrity?.dataReliability ||
                    data.data_reliability ||
                    0,
                latency: data.oracleIntegrity?.latency || "<10ms",
                lastUpdate:
                    data.oracleIntegrity?.lastUpdate ||
                    data.last_update ||
                    new Date().toISOString(),
            },
        };
    }

    /**
     * Map mock data to RWA risk metrics (for testing)
     */
    private static mapMockToRwaRisk(data: any): RwaRiskMetrics {
        return {
            legalCompliance: {
                status: data.legalCompliance?.status || "compliant",
                jurisdiction: data.legalCompliance?.jurisdiction || "US",
                structure: data.legalCompliance?.structure || "tokenized_fund",
                lastVerified:
                    data.legalCompliance?.lastVerified ||
                    new Date().toISOString(),
            },
            counterpartyRisk: {
                issuerRating: data.counterpartyRisk?.issuerRating || "A",
                defaultProbability:
                    data.counterpartyRisk?.defaultProbability || 0.02,
                solvencyScore: data.counterpartyRisk?.solvencyScore || 0.95,
                lastUpdated:
                    data.counterpartyRisk?.lastUpdated ||
                    new Date().toISOString(),
            },
            oracleIntegrity: {
                consensusNodes: data.oracleIntegrity?.consensusNodes || 5,
                dataReliability: data.oracleIntegrity?.dataReliability || 0.99,
                latency: data.oracleIntegrity?.latency || "<10ms",
                lastUpdate:
                    data.oracleIntegrity?.lastUpdate ||
                    new Date().toISOString(),
            },
        };
    }

    /**
     * Map oracle response to price data format
     */
    static mapToPriceData(
        oracleData: any,
        source: "switchboard" | "pyth" | "custom" | "mock"
    ): PriceData | null {
        if (!oracleData) {
            return null;
        }

        try {
            switch (source) {
                case "switchboard":
                    return this.mapSwitchboardToPrice(oracleData);
                case "pyth":
                    return this.mapPythToPrice(oracleData);
                case "custom":
                    return this.mapCustomToPrice(oracleData);
                case "mock":
                    return this.mapMockToPrice(oracleData);
                default:
                    return null;
            }
        } catch (error) {
            console.error(`Error mapping price data from ${source}:`, error);
            return null;
        }
    }

    private static mapSwitchboardToPrice(data: any): PriceData {
        const result = data.result || data;
        return {
            price: result.price || result.value || 0,
            timestamp: result.timestamp
                ? new Date(result.timestamp * 1000).toISOString()
                : new Date().toISOString(),
            source: "switchboard",
            confidence: result.confidence || 1.0,
        };
    }

    private static mapPythToPrice(data: any): PriceData {
        const priceData = data.price || data;
        return {
            price: priceData.price || priceData.value || 0,
            timestamp: priceData.publish_time
                ? new Date(priceData.publish_time * 1000).toISOString()
                : new Date().toISOString(),
            source: "pyth",
            confidence: priceData.confidence
                ? 1 - priceData.confidence / priceData.price
                : 1.0,
        };
    }

    private static mapCustomToPrice(data: any): PriceData {
        return {
            price: data.price || data.value || 0,
            timestamp: data.timestamp
                ? new Date(data.timestamp * 1000).toISOString()
                : new Date().toISOString(),
            source: "custom",
            confidence: data.confidence || 1.0,
        };
    }

    private static mapMockToPrice(data: any): PriceData {
        return {
            price: data.price || 1.0,
            timestamp: new Date().toISOString(),
            source: "mock",
            confidence: 1.0,
        };
    }

    /**
     * Validate oracle data integrity
     */
    static validateOracleData(data: any, source: string): boolean {
        if (!data) {
            return false;
        }

        // Basic validation - check for required fields
        const hasTimestamp =
            data.timestamp || data.publish_time || data.last_update;
        const hasValue =
            data.price !== undefined ||
            data.value !== undefined ||
            data.result !== undefined;

        return hasTimestamp && hasValue;
    }
}
