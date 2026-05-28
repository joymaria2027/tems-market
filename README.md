# Tems Market

A 5-role layered-margin social commerce marketplace for The Gambia.

**Roles:** Superadmin, Admin, Vendor, Affiliate, Customer

**Stack:** Vite + React + Supabase + ModemPay + Twilio + Resend

## Features

- **Multi-role system** — 5 distinct user roles with granular permissions
- **Phone OTP auth** — Passwordless login via Supabase Auth
- **Layered pricing** — base_price → admin_price → vendor_price, role-gated
- **Commission engine** — Affiliate (25/15/20% of vendor margin) + platform (1% of each margin)
- **Mobile Money** — ModemPay integration with Wave screenshot fallback
- **Credit wallet** — Store credit system (non-withdrawable, GMD-pegged)
- **Vendor management** — Invite links, applications, sub-account creation
- **Gift cards** — Digital gift cards with email delivery

## Getting Started

```bash
npm install
cp .env.example .env  # Add your Supabase and ModemPay keys
npm run dev
```

## Project Structure

- `src/` — React frontend (Vite)
- `supabase/functions/` — Edge Functions (OTP, webhooks, notifications)
- `supabase/migrations/` — Database schema migrations
- `keys` — Local credentials (gitignored)
