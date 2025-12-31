import { RwaRiskMetrics, TokenInfo, TokenDistribution } from "../types/data";

/**
 * Risk rating levels
 */
export enum RiskRating {
    AAA = "AAA", // Lowest risk
    AA = "AA",
    A = "A",
    BBB = "BBB",
    BB = "BB",
    B = "B",
    CCC = "CCC",
    CC = "CC",
    C = "C",
    D = "D", // Highest risk / Default
}

/**
 * Risk score ranges for ratings
 */
const RISK_SCORE_RANGES: Record<RiskRating, { min: number; max: number }> = {
    [RiskRating.AAA]: { min: 95, max: 100 },
    [RiskRating.AA]: { min: 90, max: 95 },
    [RiskRating.A]: { min: 85, max: 90 },
    [RiskRating.BBB]: { min: 75, max: 85 },
    [RiskRating.BB]: { min: 65, max: 75 },
    [RiskRating.B]: { min: 55, max: 65 },
    [RiskRating.CCC]: { min: 45, max: 55 },
    [RiskRating.CC]: { min: 35, max: 45 },
    [RiskRating.C]: { min: 25, max: 35 },
    [RiskRating.D]: { min: 0, max: 25 },
};

/**
 * Service for calculating risk scores and ratings
 * Implements risk scoring algorithms based on multiple factors
 */
export class RiskModel {
    /**
     * Calculate overall risk score (0-100)
     * Higher score = lower risk
     */
    calculateRiskScore(
        riskMetrics: RwaRiskMetrics,
        tokenInfo: TokenInfo,
        accountData?: TokenDistribution
    ): number {
        // Weighted components
        const legalComplianceScore = this.calculateLegalComplianceScore(
            riskMetrics.legalCompliance
        );
        const counterpartyRiskScore = this.calculateCounterpartyRiskScore(
            riskMetrics.counterpartyRisk
        );
        const oracleIntegrityScore = this.calculateOracleIntegrityScore(
            riskMetrics.oracleIntegrity
        );
        const distributionScore = accountData
            ? this.calculateDistributionScore(accountData)
            : 50; // Default if no distribution data

        // Weighted average
        const weights = {
            legalCompliance: 0.25,
            counterpartyRisk: 0.40,
            oracleIntegrity: 0.20,
            distribution: 0.15,
        };

        const totalScore =
            legalComplianceScore * weights.legalCompliance +
            counterpartyRiskScore * weights.counterpartyRisk +
            oracleIntegrityScore * weights.oracleIntegrity +
            distributionScore * weights.distribution;

        return Math.min(100, Math.max(0, totalScore));
    }

    /**
     * Get risk rating from score
     */
    getRiskRating(score: number): RiskRating {
        for (const [rating, range] of Object.entries(RISK_SCORE_RANGES)) {
            if (score >= range.min && score < range.max) {
                return rating as RiskRating;
            }
        }
        // Handle edge cases
        if (score >= 100) return RiskRating.AAA;
        if (score < 0) return RiskRating.D;
        return RiskRating.D;
    }

    /**
     * Calculate legal compliance score (0-100)
     */
    private calculateLegalComplianceScore(
        legalCompliance: RwaRiskMetrics["legalCompliance"]
    ): number {
        let score = 50; // Base score

        // Status scoring
        switch (legalCompliance.status) {
            case "compliant":
                score = 100;
                break;
            case "pending":
                score = 60;
                break;
            case "non-compliant":
                score = 0;
                break;
            case "unknown":
            default:
                score = 30;
                break;
        }

        // Jurisdiction bonus/penalty
        const knownJurisdictions = ["US", "UK", "EU", "SG", "CH"];
        if (knownJurisdictions.includes(legalCompliance.jurisdiction)) {
            score += 5; // Bonus for known jurisdictions
        } else if (legalCompliance.jurisdiction === "unknown") {
            score -= 10; // Penalty for unknown jurisdiction
        }

        // Structure validation
        const validStructures = [
            "tokenized_fund",
            "tokenized_bond",
            "tokenized_credit",
            "tokenized_asset",
        ];
        if (validStructures.includes(legalCompliance.structure)) {
            score += 5;
        } else if (legalCompliance.structure === "unknown") {
            score -= 5;
        }

        return Math.min(100, Math.max(0, score));
    }

    /**
     * Calculate counterparty risk score (0-100)
     */
    private calculateCounterpartyRiskScore(
        counterpartyRisk: RwaRiskMetrics["counterpartyRisk"]
    ): number {
        let score = 50; // Base score

        // Issuer rating scoring
        const ratingScores: Record<string, number> = {
            AAA: 100,
            "AA+": 95,
            AA: 90,
            "AA-": 85,
            "A+": 85,
            A: 80,
            "A-": 75,
            "BBB+": 75,
            BBB: 70,
            "BBB-": 65,
            "BB+": 65,
            BB: 60,
            "BB-": 55,
            "B+": 55,
            B: 50,
            "B-": 45,
            "CCC+": 45,
            CCC: 40,
            "CCC-": 35,
            CC: 30,
            C: 20,
            D: 0,
        };

        const rating = counterpartyRisk.issuerRating.toUpperCase();
        if (ratingScores[rating]) {
            score = ratingScores[rating];
        } else if (rating === "N/A" || rating === "UNKNOWN") {
            score = 30; // Penalty for unknown rating
        }

        // Adjust based on default probability
        // Lower default probability = higher score
        const defaultProb = counterpartyRisk.defaultProbability;
        score -= defaultProb * 50; // Scale default prob to score impact

        // Adjust based on solvency score
        // Higher solvency = higher score
        const solvencyScore = counterpartyRisk.solvencyScore;
        score += (solvencyScore - 0.5) * 40; // Scale solvency to score impact

        return Math.min(100, Math.max(0, score));
    }

    /**
     * Calculate oracle integrity score (0-100)
     */
    private calculateOracleIntegrityScore(
        oracleIntegrity: RwaRiskMetrics["oracleIntegrity"]
    ): number {
        let score = 50; // Base score

        // Consensus nodes scoring
        // More nodes = higher score (up to a point)
        const nodes = oracleIntegrity.consensusNodes;
        if (nodes >= 10) {
            score += 30; // Excellent
        } else if (nodes >= 5) {
            score += 20; // Good
        } else if (nodes >= 3) {
            score += 10; // Acceptable
        } else if (nodes > 0) {
            score += 5; // Minimal
        } else {
            score -= 20; // No consensus = penalty
        }

        // Data reliability scoring
        const reliability = oracleIntegrity.dataReliability;
        score += reliability * 30; // Scale reliability to score impact

        // Latency scoring
        const latency = oracleIntegrity.latency;
        if (latency === "<10ms" || latency.includes("ms")) {
            const latencyMs = parseInt(latency.replace(/[^0-9]/g, "")) || 0;
            if (latencyMs < 10) {
                score += 10; // Excellent latency
            } else if (latencyMs < 100) {
                score += 5; // Good latency
            } else {
                score -= 5; // Poor latency
            }
        } else if (latency === "unknown") {
            score -= 10; // Penalty for unknown latency
        }

        return Math.min(100, Math.max(0, score));
    }

    /**
     * Calculate distribution score (0-100)
     * Higher score = better distribution (lower concentration)
     */
    private calculateDistributionScore(
        accountData: TokenDistribution
    ): number {
        let score = 50; // Base score

        // Concentration scoring
        // Lower concentration = higher score
        const concentration = accountData.concentration;
        score += (1 - concentration) * 40; // Invert concentration

        // Number of holders scoring
        // More holders = higher score (up to a point)
        const holders = accountData.totalHolders;
        if (holders >= 10000) {
            score += 20; // Excellent distribution
        } else if (holders >= 1000) {
            score += 15; // Good distribution
        } else if (holders >= 100) {
            score += 10; // Acceptable distribution
        } else if (holders >= 10) {
            score += 5; // Minimal distribution
        } else {
            score -= 10; // Very concentrated = penalty
        }

        return Math.min(100, Math.max(0, score));
    }

    /**
     * Assess legal compliance status
     * Returns detailed assessment
     */
    assessLegalCompliance(
        legalCompliance: RwaRiskMetrics["legalCompliance"]
    ): {
        status: "pass" | "warning" | "fail";
        issues: string[];
        recommendations: string[];
    } {
        const issues: string[] = [];
        const recommendations: string[] = [];

        // Check status
        if (legalCompliance.status === "non-compliant") {
            issues.push("Token is marked as non-compliant");
            recommendations.push("Review legal structure and compliance requirements");
        } else if (legalCompliance.status === "unknown") {
            issues.push("Legal compliance status is unknown");
            recommendations.push("Verify legal compliance status with issuer");
        } else if (legalCompliance.status === "pending") {
            issues.push("Legal compliance is pending verification");
            recommendations.push("Wait for compliance verification to complete");
        }

        // Check jurisdiction
        if (legalCompliance.jurisdiction === "unknown") {
            issues.push("Jurisdiction is unknown");
            recommendations.push("Verify token jurisdiction");
        }

        // Check structure
        if (legalCompliance.structure === "unknown") {
            issues.push("Token structure is unknown");
            recommendations.push("Verify token structure type");
        }

        // Determine overall status
        let status: "pass" | "warning" | "fail" = "pass";
        if (legalCompliance.status === "non-compliant") {
            status = "fail";
        } else if (issues.length > 0) {
            status = "warning";
        }

        return { status, issues, recommendations };
    }

    /**
     * Calculate counterparty risk assessment
     */
    assessCounterpartyRisk(
        counterpartyRisk: RwaRiskMetrics["counterpartyRisk"]
    ): {
        level: "low" | "medium" | "high" | "critical";
        factors: string[];
    } {
        const factors: string[] = [];
        let riskLevel: "low" | "medium" | "high" | "critical" = "medium";

        // Default probability assessment
        const defaultProb = counterpartyRisk.defaultProbability;
        if (defaultProb > 0.2) {
            riskLevel = "critical";
            factors.push(`High default probability: ${(defaultProb * 100).toFixed(1)}%`);
        } else if (defaultProb > 0.1) {
            riskLevel = "high";
            factors.push(`Elevated default probability: ${(defaultProb * 100).toFixed(1)}%`);
        } else if (defaultProb < 0.05) {
            riskLevel = "low";
            factors.push(`Low default probability: ${(defaultProb * 100).toFixed(1)}%`);
        }

        // Solvency score assessment
        const solvencyScore = counterpartyRisk.solvencyScore;
        if (solvencyScore < 0.5) {
            if (riskLevel !== "critical") riskLevel = "high";
            factors.push(`Low solvency score: ${(solvencyScore * 100).toFixed(1)}%`);
        } else if (solvencyScore > 0.8) {
            if (riskLevel === "medium") riskLevel = "low";
            factors.push(`Strong solvency score: ${(solvencyScore * 100).toFixed(1)}%`);
        }

        // Rating assessment
        if (counterpartyRisk.issuerRating === "N/A" || counterpartyRisk.issuerRating === "unknown") {
            if (riskLevel !== "critical") riskLevel = "high";
            factors.push("Issuer rating not available");
        } else {
            const rating = counterpartyRisk.issuerRating.toUpperCase();
            if (rating.startsWith("C") || rating === "D") {
                riskLevel = "critical";
                factors.push(`Poor issuer rating: ${rating}`);
            } else if (rating.startsWith("B")) {
                if (riskLevel === "low") riskLevel = "medium";
                factors.push(`Moderate issuer rating: ${rating}`);
            } else if (rating.startsWith("A")) {
                if (riskLevel === "medium") riskLevel = "low";
                factors.push(`Strong issuer rating: ${rating}`);
            }
        }

        return { level: riskLevel, factors };
    }
}

