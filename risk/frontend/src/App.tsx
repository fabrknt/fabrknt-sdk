import { useState } from "react";
import { WalletButton } from "./components/WalletButton";
import { PaymentQuote } from "./components/PaymentQuote";
import { RwaRiskViewer } from "./components/RwaRiskViewer";
import { LiquidationParams } from "./components/LiquidationParams";

function App() {
    const [tokenMint, setTokenMint] = useState(
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    );
    const [endpoint, setEndpoint] = useState("rwa-risk");
    const [refreshKey, setRefreshKey] = useState(0);

    const handlePaymentComplete = () => {
        // Trigger refresh of data components
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="border-b border-gray-800 bg-gray-950">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-pulsar-primary to-pulsar-secondary bg-clip-text text-transparent">
                            Pulsar
                        </h1>
                        <p className="text-sm text-gray-400">
                            RWA Risk Gateway
                        </p>
                    </div>
                    <WalletButton />
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold">
                            Access RWA Risk Data
                        </h2>
                        <p className="text-gray-400">
                            Pay-per-call access to institutional-grade RWA risk
                            metrics
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Token Mint Address
                                </label>
                                <input
                                    type="text"
                                    value={tokenMint}
                                    onChange={(e) =>
                                        setTokenMint(e.target.value)
                                    }
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pulsar-primary"
                                    placeholder="Enter token mint address"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Data Endpoint
                                </label>
                                <select
                                    value={endpoint}
                                    onChange={(e) =>
                                        setEndpoint(e.target.value)
                                    }
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pulsar-primary"
                                >
                                    <option value="rwa-risk">
                                        RWA Risk Metrics
                                    </option>
                                    <option value="liquidation-params">
                                        Liquidation Parameters
                                    </option>
                                </select>
                            </div>

                            <PaymentQuote
                                endpoint={endpoint}
                                onPaymentComplete={handlePaymentComplete}
                            />
                        </div>

                        <div key={refreshKey}>
                            {endpoint === "rwa-risk" ? (
                                <RwaRiskViewer tokenMint={tokenMint} />
                            ) : (
                                <LiquidationParams tokenMint={tokenMint} />
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;
