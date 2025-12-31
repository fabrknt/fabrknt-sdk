export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <h1 className="text-4xl font-bold">FABRIC</h1>
        <p className="text-xl text-center text-muted-foreground">
          M&A Terminal for Web3 Projects
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-8">
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">Verified Listings</h3>
            <p className="text-sm text-muted-foreground">
              Project listings with verified PULSE vitality and TRACE growth signals
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">Fabrknt Score</h3>
            <p className="text-sm text-muted-foreground">
              Composite metric combining Growth (40%) + Vitality (30%) + Revenue (30%)
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">Atomic Escrow</h3>
            <p className="text-sm text-muted-foreground">
              Smart contract-based escrow for secure, atomic project asset transfers
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
