import { Check, Shield, Zap, Lock, TrendingUp, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      <Navbar />
      
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
            href="/auth/login"
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
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
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
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
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

      {/* About Section */}
      <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">About IntelliReserve</h2>
              <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                IntelliReserve is a next-generation booking platform built from the ground up for service providers and their clients. We combine cutting-edge technology with financial-grade security to create a seamless booking experience.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">Our Mission</h3>
              <p className="text-muted-foreground">
                To democratize access to professional booking infrastructure, enabling businesses of all sizes to compete with enterprise solutions while maintaining complete control over their customer relationships.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold">Why Choose Us?</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm sm:text-base text-muted-foreground">Built by fintech experts with 20+ years of payment processing experience</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm sm:text-base text-muted-foreground">Bank-level security with full PCI DSS compliance</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm sm:text-base text-muted-foreground">24/7 dedicated support from our expert team</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm sm:text-base text-muted-foreground">Continuous innovation with monthly feature updates</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="p-6 sm:p-8 rounded-lg border bg-card/50 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">2026</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Founded</p>
            </div>
            <div className="p-6 sm:p-8 rounded-lg border bg-card/50 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">15</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Team Members</p>
            </div>
            <div className="p-6 sm:p-8 rounded-lg border bg-card/50 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">5</div>
              <p className="text-xs sm:text-sm text-muted-foreground">South african Served</p>
            </div>
            <div className="p-6 sm:p-8 rounded-lg border bg-card/50 backdrop-blur-sm">
              <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">100%</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Customer Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Get in Touch</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">Have questions? Our team is here to help. Reach out and we'll get back to you as soon as possible.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Email */}
          <div className="p-6 sm:p-8 rounded-lg border bg-card hover:border-primary/50 transition-colors text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Email</h3>
            <p className="text-sm text-muted-foreground mb-4">Send us an email and we'll respond within 24 hours</p>
            <a href="mailto:support@intellireserve.com" className="text-primary font-semibold text-sm hover:underline">
              support@intellireserve.com
            </a>
          </div>

          {/* Phone */}
          <div className="p-6 sm:p-8 rounded-lg border bg-card hover:border-primary/50 transition-colors text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Phone</h3>
            <p className="text-sm text-muted-foreground mb-4">Call us during business hours (Mon-Fri, 9AM-5PM SAST)</p>
            <a href="tel:+27123456789" className="text-primary font-semibold text-sm hover:underline">
              +27 (0) 12 345 6789
            </a>
          </div>

          {/* Live Chat */}
          <div className="p-6 sm:p-8 rounded-lg border bg-card hover:border-primary/50 transition-colors text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Live Chat</h3>
            <p className="text-sm text-muted-foreground mb-4">Chat with our team in real-time on our platform</p>
            <button className="text-primary font-semibold text-sm hover:underline">
              Start a conversation
            </button>
          </div>
        </div>

        {/* Contact Form */}
        <div className="mt-12 sm:mt-16 max-w-2xl mx-auto">
          <div className="p-6 sm:p-8 rounded-lg border bg-card">
            <h3 className="text-xl sm:text-2xl font-semibold mb-6">Send us a Message</h3>
            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base"
                />
              </div>
              <input
                type="text"
                placeholder="Subject"
                className="w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base"
              />
              <textarea
                placeholder="Your Message"
                rows={5}
                className="w-full px-4 py-2.5 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm sm:text-base"
              />
              <button
                type="submit"
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-primary to-rose-600 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all text-sm sm:text-base"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to transform your bookings?</h2>
          <p className="text-muted-foreground mb-8 text-sm sm:text-base">Join thousands of businesses using IntelliReserve</p>
          <a
            href="/auth/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all duration-200 text-sm sm:text-base"
          >
            Get Started Free →
          </a>
        </div>
      </section>
    </div>
  );
}
