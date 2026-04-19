'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-rose-600 rounded-lg flex items-center justify-center shadow-md shadow-primary/30">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="hidden sm:inline font-bold text-lg sm:text-xl bg-gradient-to-r from-rose-600 to-primary bg-clip-text text-transparent">
              IntelliReserve
            </span>
            <span className="sm:hidden font-bold text-sm bg-gradient-to-r from-rose-600 to-primary bg-clip-text text-transparent">
              IR
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="/#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="/#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-foreground rounded-lg hover:bg-secondary transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-primary to-rose-600 rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
