import {
    LiquidationParameters,
    PriceData,
    RwaRiskMetrics,
    TokenInfo,
    TokenDistribution,
} from "../types/data";

/**
 * Service for calculating liquidation parameters
 * Uses volatility, risk metrics, and correlation data
 */
export class LiquidationCalculator {
    // Base parameters (can be configured via environment)
    private readonly BASE_LIQUIDATION_THRESHOLD = 0.85;
    private readonly BASE_MAX_LTV = 0.75;
    private readonly BASE_LIQUIDATION_PENALTY = 0.05;
    private readonly BASE_HEALTH_FACTOR = 1.25;
    private readonly BASE_VOLATILITY = 0.12;

    /**
     * Calculate liquidation parameters for a token
     */
    calculateLiquidationParams(
        tokenInfo: TokenInfo,
        priceData: PriceData | null,
        riskMetrics: RwaRiskMetrics,
        accountData?: TokenDistribution,
        historicalVolatility?: number
    ): LiquidationParameters {
        // 1. Calculate volatility
        const volatility = this.calculateVolatility(
            priceData,
            historicalVolatility,
            riskMetrics
        );

        // 2. Calculate max LTV based on risk
        const maxLtv = this.calculateMaxLtv(
            riskMetrics,
            volatility,
            accountData
        );

        // 3. Calculate liquidation threshold
        const liquidationThreshold = this.calculateLiquidationThreshold(
            maxLtv,
            volatility,
            riskMetrics
        );

        // 4. Calculate liquidation penalty
        const liquidationPenalty = this.calculateLiquidationPenalty(
            volatility,
            riskMetrics
        );

        // 5. Calculate health factor
        const healthFactor = this.calculateHealthFactor(
            maxLtv,
            liquidationThreshold
        );

        // 6. Calculate correlations
        const correlation = this.calculateCorrelations(
            tokenInfo,
            riskMetrics,
            volatility
        );

        return {
            liquidationThreshold,
            maxLtv,
            liquidationPenalty,
            healthFactor,
            volatility,
            correlation,
        };
    }

    /**
     * Calculate token volatility
     * Uses historical volatility if available, otherwise estimates from risk metrics
     */
    private calculateVolatility(
        priceData: PriceData | null,
        historicalVolatility: number | undefined,
        riskMetrics: RwaRiskMetrics
    ): number {
        // Use historical volatility if provided
        if (historicalVolatility !== undefined && historicalVolatility > 0) {
            return Math.min(1.0, Math.max(0.0, historicalVolatility));
        }

        // Estimate from price confidence
        let volatility = this.BASE_VOLATILITY;

        if (priceData) {
            // Lower confidence = higher volatility
            if (priceData.confidence < 0.8) {
                volatility += 0.05;
            } else if (priceData.confidence < 0.9) {
                volatility += 0.02;
            }
        }

        // Adjust based on counterparty risk
        if (riskMetrics.counterpartyRisk.defaultProbability > 0.1) {
            volatility += riskMetrics.counterpartyRisk.defaultProbability * 0.1;
        }

        // Adjust based on oracle reliability
        if (riskMetrics.oracleIntegrity.dataReliability < 0.8) {
            volatility += 0.03;
        }

        // Adjust based on solvency score (lower score = higher volatility)
        const solvencyAdjustment =
            (1 - riskMetrics.counterpartyRisk.solvencyScore) * 0.05;
        volatility += solvencyAdjustment;

        return Math.min(1.0, Math.max(0.0, volatility));
    }

    /**
     * Calculate maximum Loan-to-Value ratio
     * Based on risk metrics, volatility, and token distribution
     */
    private calculateMaxLtv(
        riskMetrics: RwaRiskMetrics,
        volatility: number,
        accountData?: TokenDistribution
    ): number {
        let maxLtv = this.BASE_MAX_LTV;

        // Adjust based on legal compliance
        if (riskMetrics.legalCompliance.status === "compliant") {
            // Compliant tokens can have higher LTV
            maxLtv += 0.05;
        } else if (riskMetrics.legalCompliance.status === "non-compliant") {
            // Non-compliant tokens have lower LTV
            maxLtv -= 0.15;
        } else if (riskMetrics.legalCompliance.status === "unknown") {
            // Unknown status reduces LTV
            maxLtv -= 0.05;
        }

        // Adjust based on counterparty risk
        const defaultProb = riskMetrics.counterpartyRisk.defaultProbability;
        if (defaultProb > 0.1) {
            maxLtv -= defaultProb * 0.3; // High default probability reduces LTV
        }

        // Adjust based on solvency score
        const solvencyScore = riskMetrics.counterpartyRisk.solvencyScore;
        maxLtv += (solvencyScore - 0.5) * 0.2; // Higher solvency = higher LTV

        // Adjust based on volatility
        if (volatility > 0.2) {
            maxLtv -= (volatility - 0.2) * 0.5; // High volatility reduces LTV
        } else if (volatility < 0.1) {
            maxLtv += (0.1 - volatility) * 0.3; // Low volatility increases LTV
        }

        // Adjust based on token distribution
        if (accountData) {
            // High concentration = lower LTV
            if (accountData.concentration > 0.8) {
                maxLtv -= 0.1;
            } else if (accountData.concentration > 0.6) {
                maxLtv -= 0.05;
            }

            // More holders = higher LTV (more distributed)
            if (accountData.totalHolders > 1000) {
                maxLtv += 0.05;
            } else if (accountData.totalHolders < 100) {
                maxLtv -= 0.05;
            }
        }

        // Adjust based on oracle integrity
        if (riskMetrics.oracleIntegrity.dataReliability < 0.8) {
            maxLtv -= 0.05; // Low reliability reduces LTV
        }

        // Ensure LTV is within reasonable bounds
        return Math.min(0.90, Math.max(0.30, maxLtv));
    }

    /**
     * Calculate liquidation threshold
     * Should be higher than max LTV to provide buffer
     */
    private calculateLiquidationThreshold(
        maxLtv: number,
        volatility: number,
        riskMetrics: RwaRiskMetrics
    ): number {
        // Base threshold is above max LTV
        let threshold = maxLtv + 0.1;

        // Adjust based on volatility
        if (volatility > 0.2) {
            threshold += 0.05; // Higher volatility needs larger buffer
        }

        // Adjust based on risk
        const defaultProb = riskMetrics.counterpartyRisk.defaultProbability;
        if (defaultProb > 0.1) {
            threshold += defaultProb * 0.1;
        }

        // Ensure threshold is reasonable
        return Math.min(0.95, Math.max(maxLtv + 0.05, threshold));
    }

    /**
     * Calculate liquidation penalty
     * Higher for riskier assets
     */
    private calculateLiquidationPenalty(
        volatility: number,
        riskMetrics: RwaRiskMetrics
    ): number {
        let penalty = this.BASE_LIQUIDATION_PENALTY;

        // Adjust based on volatility
        if (volatility > 0.2) {
            penalty += 0.02; // Higher volatility = higher penalty
        }

        // Adjust based on counterparty risk
        const defaultProb = riskMetrics.counterpartyRisk.defaultProbability;
        if (defaultProb > 0.1) {
            penalty += defaultProb * 0.05;
        }

        // Adjust based on legal compliance
        if (riskMetrics.legalCompliance.status === "non-compliant") {
            penalty += 0.03;
        }

        // Ensure penalty is reasonable
        return Math.min(0.15, Math.max(0.02, penalty));
    }

    /**
     * Calculate health factor
     * Ratio of collateral value to liquidation threshold
     */
    private calculateHealthFactor(
        maxLtv: number,
        liquidationThreshold: number
    ): number {
        // Health factor = liquidationThreshold / maxLtv
        // Higher is better (more buffer before liquidation)
        const healthFactor = liquidationThreshold / maxLtv;

        // Ensure reasonable bounds
        return Math.min(2.0, Math.max(1.0, healthFactor));
    }

    /**
     * Calculate correlations with SOL and USDC
     * Based on token characteristics and risk metrics
     */
    private calculateCorrelations(
        tokenInfo: TokenInfo,
        riskMetrics: RwaRiskMetrics,
        volatility: number
    ): { sol: number; usdc: number } {
        // Base correlations
        let solCorrelation = 0.35; // RWA tokens typically have low correlation with SOL
        let usdcCorrelation = 0.95; // RWA tokens typically track stablecoins

        // Adjust based on token structure
        if (tokenInfo.name) {
            const name = tokenInfo.name.toLowerCase();
            if (name.includes("sol") || name.includes("solana")) {
                solCorrelation = 0.7; // Higher correlation if SOL-related
            }
            if (name.includes("usdc") || name.includes("usd")) {
                usdcCorrelation = 0.98; // Very high correlation with USD
            }
        }

        // Adjust based on volatility
        // Higher volatility might indicate less correlation with stable assets
        if (volatility > 0.2) {
            usdcCorrelation -= 0.1;
        }

        // Adjust based on legal compliance
        // Non-compliant tokens might have different correlations
        if (riskMetrics.legalCompliance.status === "non-compliant") {
            solCorrelation += 0.1;
            usdcCorrelation -= 0.1;
        }

        // Ensure correlations are within bounds
        return {
            sol: Math.min(1.0, Math.max(-1.0, solCorrelation)),
            usdc: Math.min(1.0, Math.max(0.0, usdcCorrelation)),
        };
    }

    /**
     * Estimate historical volatility from price data
     * This is a simplified calculation - in production, use actual historical data
     */
    estimateHistoricalVolatility(
        priceHistory: PriceData[]
    ): number | undefined {
        if (priceHistory.length < 2) {
            return undefined;
        }

        // Calculate returns
        const returns: number[] = [];
        for (let i = 1; i < priceHistory.length; i++) {
            const prevPrice = priceHistory[i - 1].price;
            const currPrice = priceHistory[i].price;
            if (prevPrice > 0) {
                returns.push((currPrice - prevPrice) / prevPrice);
            }
        }

        if (returns.length === 0) {
            return undefined;
        }

        // Calculate standard deviation of returns
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance =
            returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
            returns.length;
        const stdDev = Math.sqrt(variance);

        // Annualize (assuming daily data)
        return stdDev * Math.sqrt(365);
    }
}

