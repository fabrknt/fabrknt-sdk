export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <h1 className="text-4xl font-bold">TRACE</h1>
        <p className="text-xl text-center text-muted-foreground">
          Marketing Attribution & On-Chain Activity Monitoring
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-8">
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">Click-to-Wallet Attribution</h3>
            <p className="text-sm text-muted-foreground">
              Track marketing campaigns from click to on-chain conversion with UTM support
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">Bot Detection</h3>
            <p className="text-sm text-muted-foreground">
              Wallet hygiene scoring filters out Sybil attacks and bot traffic for true ROI
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">Service Health Metrics</h3>
            <p className="text-sm text-muted-foreground">
              Monitor DAU/WAU/MAU, transaction volume, and Protocol Activity Score (0-100)
            </p>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Phase 0: Foundation Complete ✓
        </div>
      </div>
    </main>
  );
}
