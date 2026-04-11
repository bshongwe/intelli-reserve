# IntelliReserve Frontend

A production-ready Next.js 15 dashboard and booking UI with TypeScript, Tailwind CSS v4, and shadcn/ui.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm build
npm start
```

## Features

- ✅ **Next.js 15** (App Router) with Turbo support
- ✅ **TypeScript** for type safety
- ✅ **Tailwind CSS v4** with dark mode
- ✅ **shadcn/ui** components (Button, Card, Calendar, Input, Label, Toast)
- ✅ **TanStack Query** for server state management
- ✅ **Role-based views** (Customer booking + Host dashboard)
- ✅ **Real-time booking form** with availability calendar
- ✅ **Responsive sidebar** navigation
- ✅ **Ready for authentication** (NextAuth.js compatible)

## Project Structure

- `/src/app/` – Next.js App Router pages and layouts
- `/src/components/` – Reusable UI components and layouts
- `/src/lib/` – Utilities (cn helper, etc.)

## Integration with BFF

The booking form calls `/api/bff/bookings` which should proxy to your **Backend-for-Frontend** service running on `http://localhost:4000`.
