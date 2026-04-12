import { Check, Shield, Zap, Lock, TrendingUp, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Hero Section */}
      <section className="flex items-center justify-center min-h-screen px-4 sm:px-6">
        <div className="text-center space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {" "}
            Fintech-grade booking platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-foreground via-primary to-rose-600 bg-clip-text text-transparent leading-tight">
            IntelliReserve
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Real-time booking engine with secure escrow payments and dynamic pricing intelligence.
          </p>
          <a
            href="/dashboard/book"
            className="inline-flex items-center gap-2 mt-4 px-8 py-3.5 bg-gradient-to-r from-primary to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all duration-200 text-sm sm:text-base"
          >
            Get Started →
          </a>
          
          {/* Scroll Indicator */}
          <div className="mt-12 sm:mt-16 flex flex-col items-center gap-2 animate-bounce">
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Scroll to explore more</p>
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">IntelliReserve Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">Everything you need to manage bookings, payments, and customer relationships</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Feature 1 */}
          <div className="p-6 sm:p-8 rounded-lg border bg-card hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Real-Time Booking</h3>
            <p className="text-sm text-muted-foreground">Instant availability updates and seamless booking experience for your customers</p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 sm:p-8 rounded-lg border bg-card hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Secure Escrow</h3>
            <p className="text-sm text-muted-foreground">Bank-level security with escrow protection for both buyers and sellers</p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 sm:p-8 rounded-lg border bg-card hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Dynamic Pricing</h3>
            <p className="text-sm text-muted-foreground">AI-powered pricing intelligence that maximizes your revenue</p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 sm:p-8 rounded-lg border bg-card hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Customer Profiles</h3>
            <p className="text-sm text-muted-foreground">Comprehensive customer management and booking history</p>
          </div>

          {/* Feature 5 */}
          <div className="p-6 sm:p-8 rounded-lg border bg-card hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Compliance Ready</h3>
            <p className="text-sm text-muted-foreground">Built with financial regulations and data protection in mind</p>
          </div>

          {/* Feature 6 */}
          <div className="p-6 sm:p-8 rounded-lg border bg-card hover:border-primary/50 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-sm text-muted-foreground">Deep insights into bookings, revenue, and customer behavior</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Subscription Plans</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">Transparent pricing with no hidden fees. Scale as you grow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Starter Plan */}
          <div className="p-6 sm:p-8 rounded-lg border bg-card flex flex-col">
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Starter</h3>
            <p className="text-sm text-muted-foreground mb-6">Perfect for getting started</p>
            <div className="mb-6">
              <span className="text-4xl sm:text-5xl font-bold">R0</span>
              <span className="text-muted-foreground ml-2">/month</span>
            </div>
            <ul className="space-y-3 sm:space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs sm:text-sm">Up to 10 bookings/month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs sm:text-sm">Basic analytics</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs sm:text-sm">Email support</span>
              </li>
            </ul>
            <button className="w-full py-2.5 sm:py-3 border rounded-lg hover:bg-secondary transition-colors text-xs sm:text-sm font-medium">
              Get Started
            </button>
          </div>

          {/* Professional Plan (Featured) */}
          <div className="p-6 sm:p-8 rounded-lg border-2 border-primary bg-card relative flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-rose-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              Most Popular
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Professional</h3>
            <p className="text-sm text-muted-foreground mb-6">For growing businesses</p>
            <div className="mb-6">
              <span className="text-4xl sm:text-5xl font-bold">R299</span>
              <span className="text-muted-foreground ml-2">/month</span>
            </div>
            <ul className="space-y-3 sm:space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs sm:text-sm">Unlimited bookings</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs sm:text-sm">Advanced analytics</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs sm:text-sm">Dynamic pricing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs sm:text-sm">Priority support</span>
              </li>
            </ul>
            <button className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-primary to-rose-600 text-white rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-medium">
              Start Free Trial
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="p-6 sm:p-8 rounded-lg border bg-card flex flex-col">
            <h3 className="text-xl sm:text-2xl font-bold mb-2">Enterprise</h3>
            <p className="text-sm text-muted-foreground mb-6">For large organizations</p>
            <div className="mb-6">
              <span className="text-4xl sm:text-5xl font-bold">Custom</span>
            </div>
            <ul className="space-y-3 sm:space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs sm:text-sm">Custom integration</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs sm:text-sm">Dedicated support</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs sm:text-sm">SLA guarantee</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-xs sm:text-sm">Custom features</span>
              </li>
            </ul>
            <button className="w-full py-2.5 sm:py-3 border rounded-lg hover:bg-secondary transition-colors text-xs sm:text-sm font-medium">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="bg-card border rounded-lg p-8 sm:p-12">
          <p className="text-center text-sm text-muted-foreground font-semibold uppercase tracking-wide mb-8">Trusted by industry leaders</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold mb-2">1M+</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Bookings Processed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold mb-2">50K+</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Active Users</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold mb-2">99.9%</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Uptime SLA</p>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold mb-2">24/7</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Customer Support</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-12 pt-12 border-t">
            {["ISO 27001", "SOC 2 Type II", "GDPR", "PCI DSS", "POPIA", "PSHA"].map((cert) => (
              <div key={cert} className="text-center">
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 mx-auto mb-2">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <p className="text-xs font-semibold">{cert}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to transform your bookings?</h2>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base">Join thousands of businesses using IntelliReserve</p>
          <a
            href="/dashboard/book"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all duration-200 text-sm sm:text-base"
          >
            Get Started Free →
          </a>
        </div>
      </section>
    </div>
  );
}
