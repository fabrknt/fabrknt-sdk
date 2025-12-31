import { useEffect, useState } from "react";
import { api, RwaRiskData } from "../lib/api";
import { useWallet } from "@solana/wallet-adapter-react";

interface RwaRiskViewerProps {
    tokenMint: string;
}

export function RwaRiskViewer({ tokenMint }: RwaRiskViewerProps) {
    const { publicKey } = useWallet();
    const [data, setData] = useState<RwaRiskData | null>(null);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [paymentRequired, setPaymentRequired] = useState(false);

    const fetchData = async () => {
        if (!tokenMint) return;

        setLoading(true);
        setError(null);
        setPaymentRequired(false);
        try {
            const riskData = await api.getRwaRiskData(
                tokenMint,
                publicKey || undefined,
                true // use payment
            );
            setData(riskData);
        } catch (err: any) {
            console.error("Failed to fetch RWA risk data:", err);
            if (err.message === "Payment required") {
                setPaymentRequired(true);
            } else {
                setError(err.message || "Failed to load risk data");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tokenMint) {
            fetchData();
        }
    }, [tokenMint, publicKey]);

    if (!tokenMint) {
        return (
            <div className="text-center py-8 text-gray-400">
                Enter a token mint address to view risk data
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center py-8 text-gray-400">
                Loading risk data...
            </div>
        );
    }

    if (paymentRequired) {
        return (
            <div className="text-center py-8">
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6 max-w-md mx-auto">
                    <div className="text-yellow-400 font-semibold mb-2">
                        Payment Required
                    </div>
                    <div className="text-gray-400 text-sm">
                        Please complete payment to view risk data
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 max-w-md mx-auto">
                    <div className="text-red-400 font-semibold mb-2">Error</div>
                    <div className="text-gray-400 text-sm">{error}</div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-8 text-red-400">
                Failed to load risk data
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-white">
                    Legal & Compliance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-gray-400 text-sm">Status</div>
                        <div className="text-white font-semibold">
                            {data.metrics.legalCompliance.status}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-sm">
                            Jurisdiction
                        </div>
                        <div className="text-white font-semibold">
                            {data.metrics.legalCompliance.jurisdiction}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-sm">Structure</div>
                        <div className="text-white font-semibold">
                            {data.metrics.legalCompliance.structure}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-sm">
                            Last Verified
                        </div>
                        <div className="text-white text-sm">
                            {new Date(
                                data.metrics.legalCompliance.lastVerified
                            ).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-white">
                    Counterparty Risk
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-gray-400 text-sm">
                            Issuer Rating
                        </div>
                        <div className="text-pulsar-primary text-2xl font-bold">
                            {data.metrics.counterpartyRisk.issuerRating}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-sm">
                            Solvency Score
                        </div>
                        <div className="text-white text-2xl font-bold">
                            {(
                                data.metrics.counterpartyRisk.solvencyScore *
                                100
                            ).toFixed(1)}
                            %
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-sm">
                            Default Probability
                        </div>
                        <div className="text-white font-semibold">
                            {(
                                data.metrics.counterpartyRisk
                                    .defaultProbability * 100
                            ).toFixed(2)}
                            %
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-white">
                    Oracle Integrity
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <div className="text-gray-400 text-sm">
                            Consensus Nodes
                        </div>
                        <div className="text-white font-semibold">
                            {data.metrics.oracleIntegrity.consensusNodes}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-sm">
                            Data Reliability
                        </div>
                        <div className="text-white font-semibold">
                            {(
                                data.metrics.oracleIntegrity.dataReliability *
                                100
                            ).toFixed(1)}
                            %
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-sm">Latency</div>
                        <div className="text-pulsar-primary font-semibold">
                            {data.metrics.oracleIntegrity.latency}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
