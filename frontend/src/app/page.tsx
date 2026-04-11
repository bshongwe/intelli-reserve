export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome to IntelliReserve</h1>
        <p className="text-lg text-muted-foreground">
          Real-time booking engine with secure escrow payments
        </p>
        <a 
          href="/dashboard/book" 
          className="inline-block mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          Get Started
        </a>
      </div>
    </div>
  );
}
