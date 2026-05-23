# Tems Market — Project State Scan
**Scanned:** 2026-05-22  
**Dev server:** `http://localhost:8080` (Vite running via `bun run dev`)

---

## Stack

| Layer | What's there |
|---|---|
| Framework | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS v3 + shadcn/ui (Radix) |
| Backend | Supabase (auth, DB, Edge Functions) |
| Data fetching | TanStack Query v5 |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Package manager | Bun (bun.lockb present; `node_modules` was absent, installed this session) |

---

## What's Been Built (UI Shell)

### Routes (App.tsx)
All routes registered. Full routing tree exists for customer, vendor, admin, and affiliate:

| Route | File | Status |
|---|---|---|
| `/` | `Index.tsx` | ✅ Works — mock data product grid |
| `/shop` | `Shop.tsx` | ✅ Works — mock data |
| `/product/:slug` | `ProductDetail.tsx` | ✅ Works — mock data |
| `/cart` | `Cart.tsx` | ✅ Exists |
| `/checkout` | `Checkout.tsx` | ⚠️ Wrong — bank transfer, not ModemPay |
| `/orders/confirmation` | `OrderConfirmation.tsx` | ✅ Exists |
| `/orders` | `Orders.tsx` | ✅ Exists |
| `/account` | `Account.tsx` | ⚠️ Stub (356 bytes) |
| `/become-a-vendor` | `BecomeVendor.tsx` | ⚠️ Stub (545 bytes) |
| `/login` | `Login.tsx` | ❌ Wrong auth type (email/pw) |
| `/signup` | `Signup.tsx` | ❌ Wrong auth type (email/pw) |
| `/select-role` | `SelectRole.tsx` | ❌ Only 2 roles: shopper/vendor |
| `/vendor/dashboard` | `VendorDashboard.tsx` | ✅ Real Supabase queries |
| `/vendor/products` | `VendorProducts.tsx` | ❌ Empty stub |
| `/vendor/upload` | `VendorUpload.tsx` | ✅ Fairly complete |
| `/admin` | `AdminDashboard.tsx` | ⚠️ Link grid only, no metrics |
| `/admin/products` | `AdminProducts.tsx` | ✅ Real Supabase queries |
| `/admin/vendors` | `AdminVendors.tsx` | ✅ Real Supabase queries |
| `/admin/orders` | `AdminOrders.tsx` | ✅ Real Supabase queries |
| `/admin/affiliates` | `AdminAffiliates.tsx` | ✅ Exists |
| `/admin/gift-cards` | `AdminGiftCards.tsx` | ✅ Exists |
| `/admin/coupons` | `AdminCoupons.tsx` | ✅ Exists |
| `/admin/users` | `AdminPlaceholder.tsx` | ❌ Placeholder |
| `/affiliate` | `Affiliate.tsx` | ⚠️ Wrong table names |

### Components
- `CartSidebar.tsx` — slide-out cart ✅
- `ProductCard.tsx`, `ShopProductCard.tsx` — dual card variants ✅
- `SponsoredRow.tsx`, `SponsoredPicksRow.tsx` — horizontal scroll row ✅
- `CategoryTabs.tsx`, `ShopCategoryTabs.tsx` ✅
- `VendorVerificationBanner.tsx` ✅
- `AdminGuard.tsx` — role gate ✅
- `NavLink.tsx`, `CurrencySelector.tsx` ✅

### Edge Functions (supabase/functions/)
| Function | Purpose |
|---|---|
| `create-order` | Server-side order creation with price validation |
| `send-email` | Order confirmation + new sale vendor alerts |

---

## Database Schema (from migrations)

**Migrations exist** (11 files, March–April 2026). The schema that was actually created:

| Table | Notes |
|---|---|
| `profiles` | `role: shopper\|vendor\|admin`, NOT the 5 PRD roles |
| `categories` | Seeded with 7 categories |
| `products` | `vendor_id`, `price`, `slug`, `status`, `sponsored`, `images[]` |
| `orders` | `shopper_id`, `stripe_payment_id` (!) |
| `order_items` | Standard join table |
| `gift_cards` | Basic — single-use only, no `recipient_name`, no `modempay_payment_id` |
| `coupons` | Basic coupon structure |
| Missing tables | `vendor_profiles`, `price_layers`, `vendor_listings`, `affiliate_links`, `commission_ledger`, `credit_wallets`, `credit_transactions`, `featured_listings`, `notifications_log`, `coupon_uses` |

---

## Critical PRD Mismatches

> [!CAUTION]
> These are fundamental architecture divergences, not style issues. Building on them as-is will require rework.

### 1. Auth: Email/Password instead of Phone OTP
- **Current:** Supabase email + Google OAuth
- **PRD requires (F1.1):** Supabase Auth + Twilio OTP — phone-number-first, no email/password
- **Impact:** Login.tsx, Signup.tsx, and AuthContext all need rebuilding

### 2. Branding: "ShopHub" everywhere
- **Status:** ✅ Fully Resolved! All instances of "ShopHub" are replaced with "Tems Market" across all layout files, login/signup forms, Edge Functions, local storage keys, and metadata.

### 3. Role System: 3 roles instead of 5
- **Current schema:** `app_role ENUM ('shopper', 'vendor', 'admin')`
- **PRD requires:** `superadmin | admin | vendor | affiliate | customer`
- **Impact:** DB migration needed, AuthContext, SelectRole, AdminGuard all need updating

### 4. Checkout: Bank Transfer instead of ModemPay
- Shows "Trust Bank Gambia / Tems Market / Account 1234567890"
- PRD requires ModemPay with QMoney, AfriMoney, Wave tiles
- `orders` table has `stripe_payment_id` — should be `modempay_payment_id`

### 5. Affiliate: Wrong table name
- `Affiliate.tsx` queries `affiliates` and `affiliate_referrals`
- PRD schema uses `affiliate_links` (no `affiliates` table exists in PRD)
- The current schema also doesn't have `affiliate_links` migrated yet

### 6. Currency display: "D" prefix instead of GMD
- **Status:** ✅ Fully Resolved! Created robust, tested `formatGMD()` utility, replaced all manual "D" prefixes with GMD, and updated local storage hooks.

### 7. Signup missing DOB + age gate
- No date-of-birth field
- No "I confirm I am 18+" checkbox
- PRD F1.10, F1.11, F1.12 are Must Have security invariants

### 8. No layered pricing
- Current schema: single `price` on `products` table
- PRD requires: `base_price` (superadmin) → `admin_price` (price_layers) → `vendor_price` (vendor_listings)
- `price_layers` and `vendor_listings` tables don't exist

### 9. No commission system
- `commission_ledger` table doesn't exist
- No commission calculation logic anywhere
- No credit wallet system

### 10. Missing Edge Functions
The following Edge Functions are required by PRD but don't exist:
- `request-otp` / `verify-otp` (Twilio)
- `invite-admin` / `invite-vendor` (Twilio SMS)
- `modempay-webhook` (payment confirmation, commission split)
- `process-daily-settlement` (11 PM batch payout)
- `groq-product-ai` (image → description)
- `ocr-vendor-id` (OCR Space + Groq)
- `create-modempay-subaccount` (on vendor approval)

---

## What's Actually Working

- ✅ Dev server runs, no TS errors crashing the build
- ✅ Supabase client connected (project: `vawcbbnnjhuitqxabygs.supabase.co`)
- ✅ RLS on all tables
- ✅ Admin guard pattern exists (role check before admin pages)
- ✅ Cart state (CartContext, CartSidebar)
- ✅ TanStack Query wired up everywhere
- ✅ `create-order` Edge Function with server-side price validation
- ✅ `send-email` Edge Function (order confirmation + vendor alerts)
- ✅ VendorUpload with AI-assisted form (some Groq-like structure visible)
- ✅ AdminVendors with approval/rejection UI
- ✅ Responsive layout with nav

---

## What Needs To Be Done (Priority Order)

### 🔴 Phase 1 — Fix Foundation (must do before anything else)
1. **[COMPLETED] Rename** all "ShopHub" → "Tems Market" across all files
2. **DB migration:** Extend `app_role` enum to 5 roles, add `vendor_profiles`, `price_layers`, `vendor_listings`, `affiliate_links`, `commission_ledger`, `credit_wallets`, `credit_transactions`, `featured_listings`, `notifications_log` tables
3. **Rebuild auth:** Phone OTP via Twilio Edge Functions; DOB + age gate on signup
4. **Fix SelectRole:** 5 roles (customer, affiliate, vendor; admin + superadmin are invite-only)
5. **[COMPLETED] GMD formatting:** Create `formatGMD()` utility, replace all "D" prefix occurrences

### 🟡 Phase 2 — Core Commerce
6. **Layered pricing engine:** price_layers + vendor_listings tables + pricing UI per role
7. **Vendor onboarding:** OCR Space + Groq ID scan flow, ModemPay sub-account creation on approval
8. **Product catalogue:** Superadmin sets base_price, admin sets admin_price, vendor sets vendor_price

### 🟠 Phase 3 — Transactions
9. **ModemPay checkout:** Replace bank transfer with QMoney/AfriMoney/Wave payment tiles
10. **ModemPay webhook Edge Function:** Commission split on payment confirmation
11. **Affiliate link system:** Generate short codes, track clicks, calculate commissions
12. **Daily settlement:** Cron-based batch payout Edge Function (11 PM GMT)

### 🟢 Phase 4 — Features
13. **Credit wallet system:** Top-up, spend, balance, transaction history
14. **Gift cards:** Full flow with Resend email delivery
15. **Sponsored listings:** Vendor-pays-for-placement with featured row
16. **MoMo Reconcile integration:** Webhook → commission status → available
17. **Twilio WhatsApp notifications:** All event templates

---

## Open Questions for Owner

- [ ] Are the existing DB migrations being used in production, or is this a fresh Supabase project? (Affects migration strategy)
- [ ] Is the current email-based auth used by any real users? (Affects whether we need a migration path)
- [ ] ModemPay API credentials: are they available to start building the checkout?
- [ ] Twilio credentials: ready for OTP integration?
- [ ] Has the designer defined the color palette / typography yet? (`docs/design/theme.md` doesn't exist)
