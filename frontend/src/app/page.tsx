export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <div className="text-center space-y-6 max-w-lg px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Fintech-grade booking platform
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-br from-foreground via-primary to-rose-600 bg-clip-text text-transparent leading-tight">
          IntelliReserve
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Real-time booking engine with secure escrow payments and dynamic pricing intelligence.
        </p>
        <a
          href="/dashboard/book"
          className="inline-flex items-center gap-2 mt-2 px-8 py-3.5 bg-gradient-to-r from-primary to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all duration-200"
        >
          Get Started →
        </a>
      </div>
    </div>
  );
}
