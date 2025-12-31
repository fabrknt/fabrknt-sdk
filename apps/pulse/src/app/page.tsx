export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <h1 className="text-4xl font-bold">PULSE</h1>
        <p className="text-xl text-center text-muted-foreground">
          Team Vitality Tracking & Proof of Contribution
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-8">
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">Multi-Platform Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Connect GitHub, Discord, and Notion to track contributions across all your tools
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">Qualitative Scoring</h3>
            <p className="text-sm text-muted-foreground">
              Omotenashi logic rewards quality over quantity for meaningful engagement
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">SBT Rewards</h3>
            <p className="text-sm text-muted-foreground">
              Earn Soulbound Tokens as proof of your contributions and build your on-chain resume
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
