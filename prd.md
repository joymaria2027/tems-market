# Tems Market — Product Requirements Document

## Quick Reference

| Attribute | Value |
|-----------|-------|
| Version | 1.0.0 |
| Last Updated | May 2026 |
| Complexity | High |
| User Roles | 5 |
| Core Features | 14 |
| Screens (Mobile) | 60+ |
| API Integrations | 8 |
| Development Phases | 4 |
| Platform | Expo React Native (iOS + Android) + Marketing Website |

---

## 1. Executive Summary

### Product Name
Tems Market

### One-Line Description
A layered-margin social commerce marketplace for The Gambia where vendors resell at wholesale-plus, affiliates earn commissions by sharing links, and everything pays out automatically via mobile money.

### Problem Statement
Informal resale in The Gambia runs almost entirely through WhatsApp and cash. There is no structured platform where a business owner can set floor prices, have trusted admins onboard verified vendors, and let affiliates earn from sharing products — all with automatic payment splitting. Tems Market closes this gap by building the first role-stratified, commission-automated marketplace native to the Gambian mobile money ecosystem.

### The Core Mechanic — Layered Price Stack
```
Superadmin sets BASE price (floor, non-negotiable)
    ↓
Admin adds ADMIN MARGIN → Admin Price (visible only to admin+)
    ↓
Vendor adds VENDOR MARGIN → Vendor Price (visible to customers)
    ↓
Customer sees and pays VENDOR PRICE only
    ↓
Affiliate earns COMMISSION % on each sale through their unique link
```
No role can see the margin layers above their own. Customers see only the final price.

### Success Metrics
- Vendor can list a product in under 3 minutes after approval
- Affiliate can generate and share a product link in under 30 seconds
- Customer can complete checkout in under 2 minutes
- ModemPay webhook triggers payout split within 5 seconds of payment confirmation
- Zero critical bugs in payment or payout flows at launch
- App cold-start time under 3 seconds on mid-range Android

---

## 2. User Personas

### Persona 1: Superadmin (The Owner)
- **Description:** The business owner. Single account, hardcoded. Controls the entire platform.
- **Goals:** Set and protect floor prices; monitor all revenue and platform fees; manage admins and the overall catalogue; see the full financial picture at any time.
- **Pain Points:** Currently manages everything manually through WhatsApp and spreadsheets with no audit trail.
- **Tech Comfort:** Medium — comfortable with mobile apps, does not need developer tools.
- **Access:** Email + password + Twilio OTP. No public sign-up path.

### Persona 2: Admin (The Operator)
- **Description:** The owner's trusted operator(s) — starting with one lady who manages day-to-day vendor onboarding and product pricing. More admins can be added.
- **Goals:** Onboard and verify vendors quickly; set the admin margin layer per product; monitor vendor activity and order flow; earn their margin automatically.
- **Pain Points:** Currently verifies vendors informally with no documentation system; has no visibility into which products are moving.
- **Tech Comfort:** Medium-Low — must work on mobile, flows must be simple and guided.
- **Access:** Invited by Superadmin via SMS. Cannot self-register.

### Persona 3: Vendor (The Reseller)
- **Description:** A person or small business that sources products at the admin price (wholesale + admin margin) and resells to customers at their own marked-up price.
- **Goals:** List products quickly, set competitive prices, receive orders, get paid automatically to their mobile wallet.
- **Pain Points:** Currently has no digital storefront; relies on physical presence or personal WhatsApp to sell; manual payment collection is unreliable.
- **Tech Comfort:** Low-Medium — mobile-only, must be guided through onboarding.
- **Access:** Invited by Admin via SMS. Requires ID verification before approval. Cannot self-register.

### Persona 4: Affiliate (The Sharer)
- **Description:** Anyone who wants to earn money by sharing product links — no business required. Students, homemakers, side-hustlers. They do not hold stock or fulfill orders.
- **Goals:** Browse products, get a personal shareable link, post it on WhatsApp/Facebook/TikTok, watch commissions accumulate, cash out to mobile money.
- **Pain Points:** Has no current way to earn from sharing products formally; no tracking, no guaranteed payout.
- **Tech Comfort:** Low — must be able to onboard and share a link without reading instructions.
- **Access:** Self-registers. Open to anyone with a phone number.

### Persona 5: Customer (The Shopper)
- **Description:** End consumer buying physical goods (fashion, electronics, etc.) through the app or via an affiliate's shared link.
- **Goals:** Find products, check prices, pay with mobile money, track delivery.
- **Pain Points:** Currently buys through fragmented WhatsApp vendors with no order tracking or payment protection.
- **Tech Comfort:** Low-Medium — must work on entry-level Android; guest browsing must be possible.
- **Access:** Self-registers or browses as guest. Phone OTP required only at checkout.

---

## 3. Technical Specifications

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Mobile App | Expo React Native | Cross-platform iOS + Android from one codebase; OTA updates |
| Website | Next.js | Marketing page + download funnel + big-screen admin support |
| Backend / Database | Supabase | Postgres DB, Row Level Security for role enforcement, Auth, Realtime, Storage, Edge Functions |
| Auth | Supabase Auth + Twilio OTP | Phone number as primary identity; OTP via Twilio SMS |
| Payments | ModemPay | Gambia-native; covers QMoney, AfriMoney, Wave; split payments API; payouts API |
| Subscription Billing | RevenueCat | Vendor monthly subscription via App Store / Play Store; web billing via RevenueCat Web SDK |
| AI — Product Assistant | Groq API | Fast LLM inference; vision for auto-generating product titles/descriptions from photos |
| OCR | OCR Space API | Extracts text from vendor ID photos during verification |
| Notifications | Twilio (SMS + WhatsApp) | OTP, order alerts, payout notifications, invite links |
| Error Monitoring | Sentry | Crash reporting, payment error alerts, session replay |
| Product Analytics | PostHog | Funnel tracking, affiliate link conversion, feature flags, session recording |
| Deployment | EAS (Expo Application Services) | Build + submit to App Store and Play Store |

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Client Layer                        │
│  Expo React Native App (iOS + Android)               │
│  Next.js Marketing Website                           │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS / REST / Realtime WS
┌───────────────────▼─────────────────────────────────┐
│                 Supabase                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Postgres │ │   Auth   │ │ Storage  │ │  RLS   │ │
│  │    DB    │ │ (Phone)  │ │ (Images) │ │ Roles  │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────────────────────────────────────────┐   │
│  │          Edge Functions                       │   │
│  │  - ModemPay webhook handler                  │   │
│  │  - Commission calculation + payout trigger   │   │
│  │  - Affiliate link resolution                 │   │
│  │  - Groq product description generation       │   │
│  │  - OCR Space ID extraction                   │   │
│  └──────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│              Third-Party Services                     │
│  ModemPay │ Twilio │ Groq │ OCR Space │ RevenueCat   │
│  Sentry   │ PostHog                                  │
└─────────────────────────────────────────────────────┘
```

### Third-Party Integrations

| Service | Purpose | API Type | Auth Method |
|---------|---------|----------|-------------|
| ModemPay | Customer checkout, vendor split, affiliate/admin payouts | REST | API Key (server-side only) |
| Supabase | Database, auth, file storage, edge functions, realtime | REST + WS | Anon Key + Service Role Key |
| Twilio SMS | OTP verification, order SMS notifications, invite links | REST | Account SID + Auth Token |
| Twilio WhatsApp | Order and payout notifications via WhatsApp | REST | Same as above |
| Groq API | Vision: product photo → title/description/price suggestion | REST | API Key |
| OCR Space API | Vendor ID document → extracted text for admin review | REST | API Key |
| RevenueCat | Vendor monthly subscription management (App Store + Play Store + Web) | SDK + REST | Public SDK Key + Secret Key |
| Sentry | Error and crash monitoring, payment error alerts | SDK | DSN |
| PostHog | User analytics, affiliate link funnels, feature flags | SDK | Project API Key |

### Environment Variables Required

| Variable | Description | Required | Used In |
|----------|-------------|----------|---------|
| `SUPABASE_URL` | Supabase project URL | Yes | App + Website |
| `SUPABASE_ANON_KEY` | Public anon key for client | Yes | App + Website |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin key | Yes | Edge Functions only |
| `MODEMPAY_SECRET_KEY` | ModemPay server API key | Yes | Edge Functions only — NEVER client |
| `MODEMPAY_WEBHOOK_SECRET` | Validates incoming webhooks | Yes | Edge Functions only |
| `TWILIO_ACCOUNT_SID` | Twilio account identifier | Yes | Edge Functions only |
| `TWILIO_AUTH_TOKEN` | Twilio auth | Yes | Edge Functions only |
| `TWILIO_PHONE_NUMBER` | Sender number for SMS | Yes | Edge Functions only |
| `TWILIO_WHATSAPP_NUMBER` | WhatsApp sender number | Yes | Edge Functions only |
| `GROQ_API_KEY` | Groq LLM inference | Yes | Edge Functions only |
| `OCR_SPACE_API_KEY` | OCR Space document extraction | Yes | Edge Functions only |
| `REVENUECAT_PUBLIC_KEY` | RevenueCat SDK init | Yes | App |
| `REVENUECAT_SECRET_KEY` | Server-side entitlement check | Yes | Edge Functions only |
| `SENTRY_DSN` | Sentry project DSN | Yes | App |
| `POSTHOG_API_KEY` | PostHog analytics | Yes | App |
| `APP_DEEP_LINK_SCHEME` | For affiliate link deep linking | Yes | App |

---

## 4. Data Model

### Entity: users
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key, references auth.users | Supabase Auth user ID |
| role | ENUM | Yes | superadmin, admin, vendor, affiliate, customer | Single role per account |
| full_name | TEXT | Yes | Max 100 chars | Display name |
| phone | TEXT | Yes | Unique, E.164 format | Primary identity |
| email | TEXT | No | Unique, nullable | Optional for admin+ |
| status | ENUM | Yes | active, pending, suspended | pending until approved (vendor only) |
| created_at | TIMESTAMPTZ | Yes | Default now() | |
| updated_at | TIMESTAMPTZ | Yes | Default now() | |

### Entity: vendor_profiles
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | |
| user_id | UUID | Yes | FK → users.id, unique | One profile per vendor |
| business_name | TEXT | Yes | Max 150 chars | |
| business_category | TEXT | Yes | fashion, electronics, other | |
| id_document_url | TEXT | Yes | Supabase Storage URL | Uploaded ID photo |
| id_ocr_extracted | JSONB | No | Null until processed | OCR Space extracted text |
| modempay_subaccount_id | TEXT | No | Set on approval | Vendor's ModemPay sub-account ID |
| payout_wallet_type | ENUM | Yes | wave, afrimoney | Mobile money provider |
| payout_wallet_number | TEXT | Yes | Mobile money number | Validated on setup |
| verified_at | TIMESTAMPTZ | No | Null until approved | Set by admin on approval |
| verified_by | UUID | No | FK → users.id (admin) | Which admin approved |

### Entity: affiliate_profiles
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | |
| user_id | UUID | Yes | FK → users.id, unique | |
| payout_wallet_type | ENUM | Yes | wave, afrimoney | |
| payout_wallet_number | TEXT | Yes | | |
| total_earned | NUMERIC(12,2) | Yes | Default 0 | Lifetime earnings |
| available_balance | NUMERIC(12,2) | Yes | Default 0 | Ready to withdraw |
| pending_balance | NUMERIC(12,2) | Yes | Default 0 | Awaiting order confirmation |

### Entity: products (base catalogue — superadmin controlled)
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | |
| name | TEXT | Yes | Max 200 chars | Product name |
| description | TEXT | No | | AI-generated or manual |
| category | TEXT | Yes | fashion, electronics, other | |
| base_price | NUMERIC(10,2) | Yes | > 0 | Superadmin floor price |
| images | TEXT[] | Yes | Array of Storage URLs | At least 1 required |
| created_by | UUID | Yes | FK → users.id (superadmin) | |
| status | ENUM | Yes | active, archived | |
| created_at | TIMESTAMPTZ | Yes | Default now() | |

### Entity: vendor_submitted_products
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | |
| vendor_id | UUID | Yes | FK → users.id | Submitting vendor |
| name | TEXT | Yes | | |
| description | TEXT | No | AI-generated via Groq | |
| category | TEXT | Yes | | |
| suggested_price | NUMERIC(10,2) | No | Groq suggestion | |
| images | TEXT[] | Yes | | |
| status | ENUM | Yes | pending, approved, rejected | Admin reviews |
| rejection_reason | TEXT | No | | |
| approved_product_id | UUID | No | FK → products.id | Set on approval |
| reviewed_by | UUID | No | FK → users.id (admin) | |
| reviewed_at | TIMESTAMPTZ | No | | |

### Entity: price_layers
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | |
| product_id | UUID | Yes | FK → products.id | |
| admin_id | UUID | Yes | FK → users.id (admin) | Which admin set this layer |
| admin_price | NUMERIC(10,2) | Yes | >= product.base_price | Admin price (base + admin margin) |
| created_at | TIMESTAMPTZ | Yes | | |
| updated_at | TIMESTAMPTZ | Yes | | |

### Entity: vendor_listings
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | |
| product_id | UUID | Yes | FK → products.id | |
| vendor_id | UUID | Yes | FK → users.id (vendor) | |
| vendor_price | NUMERIC(10,2) | Yes | >= price_layers.admin_price | Vendor's selling price |
| commission_rate | NUMERIC(5,2) | Yes | Set by superadmin, default 8% | Affiliate commission % |
| status | ENUM | Yes | active, inactive | Vendor toggles this |
| created_at | TIMESTAMPTZ | Yes | | |
| updated_at | TIMESTAMPTZ | Yes | | |

### Entity: affiliate_links
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | |
| affiliate_id | UUID | Yes | FK → users.id | |
| vendor_listing_id | UUID | Yes | FK → vendor_listings.id | The specific listing |
| short_code | TEXT | Yes | Unique, 8 chars | Used in shared URL |
| clicks | INTEGER | Yes | Default 0 | Total link taps |
| conversions | INTEGER | Yes | Default 0 | Completed orders via this link |
| total_earned | NUMERIC(12,2) | Yes | Default 0 | Commission earned from this link |
| created_at | TIMESTAMPTZ | Yes | | |

### Entity: orders
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | |
| customer_id | UUID | No | FK → users.id, nullable for guest | |
| vendor_listing_id | UUID | Yes | FK → vendor_listings.id | |
| affiliate_link_id | UUID | No | FK → affiliate_links.id, nullable | Set if via affiliate link |
| quantity | INTEGER | Yes | >= 1 | |
| unit_price | NUMERIC(10,2) | Yes | Snapshot of vendor_price at order time | |
| total_amount | NUMERIC(10,2) | Yes | unit_price × quantity | |
| status | ENUM | Yes | placed, confirmed, preparing, ready, delivered, cancelled | |
| payment_method | ENUM | Yes | qmoney, afrimoney, wave, cash_on_delivery | |
| payment_status | ENUM | Yes | pending, paid, failed, refunded | |
| modempay_payment_intent_id | TEXT | No | Set on payment init | |
| delivery_address | TEXT | Yes | | |
| notes | TEXT | No | Customer order notes | |
| created_at | TIMESTAMPTZ | Yes | | |
| updated_at | TIMESTAMPTZ | Yes | | |

### Entity: commission_records
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | |
| order_id | UUID | Yes | FK → orders.id, unique | One record per order |
| affiliate_id | UUID | No | FK → users.id, nullable | Null if no affiliate |
| admin_id | UUID | Yes | FK → users.id (admin) | Which admin's margin |
| vendor_id | UUID | Yes | FK → users.id (vendor) | |
| base_price_snapshot | NUMERIC(10,2) | Yes | Superadmin floor at time of sale | |
| admin_price_snapshot | NUMERIC(10,2) | Yes | Admin price at time of sale | |
| vendor_price_snapshot | NUMERIC(10,2) | Yes | Vendor price at time of sale | |
| platform_fee_amount | NUMERIC(10,2) | Yes | 2-3% of total | Superadmin earnings |
| admin_margin_amount | NUMERIC(10,2) | Yes | admin_price - base_price | |
| vendor_margin_amount | NUMERIC(10,2) | Yes | vendor_price - admin_price - commission | |
| affiliate_commission_amount | NUMERIC(10,2) | Yes | Default 0 if no affiliate | |
| payout_status | ENUM | Yes | pending, vendor_paid, fully_paid | |
| vendor_paid_at | TIMESTAMPTZ | No | | |
| affiliates_paid_at | TIMESTAMPTZ | No | | |

### Entity: payouts
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | |
| recipient_id | UUID | Yes | FK → users.id | |
| recipient_role | ENUM | Yes | affiliate, admin | |
| amount | NUMERIC(10,2) | Yes | >= 10 (ModemPay minimum) | |
| wallet_type | ENUM | Yes | wave, afrimoney | |
| wallet_number | TEXT | Yes | | |
| modempay_payout_id | TEXT | No | Set on payout init | |
| status | ENUM | Yes | pending, processing, completed, failed | |
| requested_at | TIMESTAMPTZ | Yes | | |
| completed_at | TIMESTAMPTZ | No | | |

### Entity: notifications
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | |
| user_id | UUID | Yes | FK → users.id | Recipient |
| type | ENUM | Yes | otp, order_placed, order_status, commission_earned, payout_completed, vendor_approved, vendor_rejected | |
| channel | ENUM | Yes | sms, whatsapp, in_app | |
| message | TEXT | Yes | | |
| sent_at | TIMESTAMPTZ | No | Null if in_app only | |
| read_at | TIMESTAMPTZ | No | | |

### Entity Relationships
```
users (1) ────────< (1) vendor_profiles
users (1) ────────< (1) affiliate_profiles
users (1) ────────< (many) products [created_by superadmin]
products (1) ─────< (1) price_layers [per admin]
products (1) ─────< (many) vendor_listings [per vendor]
vendor_listings (1)< (many) affiliate_links
affiliate_links (1)< (many) orders
vendor_listings (1)< (many) orders
orders (1) ────────< (1) commission_records
users (1) ────────< (many) payouts
users (1) ────────< (many) notifications
vendor_submitted_products (many) >────(1) products [on approval]
```

### Database Indexes
- `users.phone` — OTP auth lookup
- `users.role` — role-based filtering
- `vendor_listings.product_id` — product page lookups
- `vendor_listings.status` — active listings feed
- `affiliate_links.short_code` — link resolution (critical path)
- `orders.customer_id` — order history
- `orders.status` — vendor order queue
- `commission_records.payout_status` — payout batch processing
- `affiliate_links.affiliate_id` — affiliate dashboard
- `payouts.recipient_id` — wallet/payout history

### Row Level Security (RLS) Policy Summary

| Table | Superadmin | Admin | Vendor | Affiliate | Customer |
|-------|-----------|-------|--------|-----------|----------|
| users | All | Own + vendor rows | Own only | Own only | Own only |
| products | All CRUD | Read | Read | Read | Read |
| price_layers | All CRUD | Own CRUD | Read (admin_price only) | Hidden | Hidden |
| vendor_listings | All | All | Own CRUD | Read | Read |
| affiliate_links | All | Read | Read own product links | Own CRUD | None |
| orders | All | All | Own product orders | Orders via own links | Own orders |
| commission_records | All | Own margin rows | Own vendor rows | Own commission rows | None |
| payouts | All | Own | Own | Own | None |

---

## 5. Feature Specifications

### Feature 1: Authentication & Role System

#### Description
Phone-number-based authentication with Twilio OTP. Five distinct roles with invitation-based access for Superadmin, Admin, and Vendor. Self-service registration for Affiliate and Customer.

#### User Stories
- As a customer, I want to sign up with my phone number so I don't need an email
- As a vendor, I want to receive an SMS invite and set up my account from the link
- As a superadmin, I want my login to require OTP so my account is protected

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F1.1 | Phone number entry with country code selector (default +220 Gambia) | Must Have |
| F1.2 | Twilio SMS OTP: 6-digit code, 5-minute expiry | Must Have |
| F1.3 | OTP screen with resend option after 60 seconds | Must Have |
| F1.4 | Role detection: if phone matches invite → invite onboarding; else → role select | Must Have |
| F1.5 | Role select shown only for self-registering users (Customer or Affiliate) | Must Have |
| F1.6 | Superadmin: email + password + OTP only. No public sign-up. | Must Have |
| F1.7 | Admin and Vendor receive invite SMS via Twilio deep link; expires 72 hours | Must Have |
| F1.8 | Session persists via Supabase Auth JWT with auto refresh | Must Have |
| F1.9 | Suspended users see suspension screen on login attempt | Must Have |
| F1.10 | Forgot password: phone OTP → reset password | Should Have |

#### API Endpoints (Supabase Edge Functions)
| Method | Endpoint | Request Body | Response | Auth |
|--------|----------|--------------|----------|------|
| POST | /functions/v1/send-otp | `{ phone }` | `{ success, expires_in }` | None |
| POST | /functions/v1/verify-otp | `{ phone, code }` | `{ session, user, role }` | None |
| POST | /functions/v1/create-invite | `{ phone, role, invited_by }` | `{ invite_id, sms_sent }` | Admin+ |
| POST | /functions/v1/accept-invite | `{ invite_token, full_name, password }` | `{ session, user }` | None |

#### Validation Rules
- Phone: Valid E.164 format; +220 default prefix
- Password: Minimum 8 characters, at least one number
- OTP: Exactly 6 digits; single-use; expires 5 minutes
- Invite token: UUID; expires 72 hours; single-use

#### Error Handling
| Error Condition | Code | User Message | System Action |
|-----------------|------|--------------|---------------|
| Invalid OTP | 401 | "Incorrect code. Try again." | Increment attempt counter |
| OTP expired | 401 | "Code expired. Request a new one." | Invalidate code |
| Phone already registered | 409 | "This number is already registered. Sign in instead." | Redirect to login |
| Invite link expired | 410 | "This invite has expired. Ask to be re-invited." | Show contact info |
| Account suspended | 403 | "Your account has been suspended. Contact support." | Block session |
| Max OTP attempts | 429 | "Too many attempts. Try again in 15 minutes." | Rate limit 15 min |

---

### Feature 2: Superadmin — Platform Control

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F2.1 | Dashboard: total revenue (today / 7d / 30d), platform fees, active vendors, active affiliates, order count | Must Have |
| F2.2 | Add product to base catalogue: name, description, category, base price, image upload | Must Have |
| F2.3 | Groq Vision: product photo → suggested name, description, category (all editable) | Should Have |
| F2.4 | Price layer transparency view: per product, full stack (base → admin → all vendor prices) | Must Have |
| F2.5 | Create Admin: enter phone → Twilio invite SMS sent | Must Have |
| F2.6 | User management: list all users by role, view profile, suspend or reinstate any user | Must Have |
| F2.7 | Transaction log: every order with full split breakdown | Must Have |
| F2.8 | Product archive / unarchive | Should Have |
| F2.9 | Platform fee rate configuration (default 2–3%, adjustable) | Must Have |
| F2.10 | Approve vendor-submitted products (promotes to base catalogue, set base price) | Must Have |

---

### Feature 3: Admin — Vendor Operations

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F3.1 | Admin dashboard: pending verifications, active vendors, orders today, margin earned | Must Have |
| F3.2 | Vendor verification queue: ID photo + OCR-extracted text (OCR Space + Groq structured) + business info | Must Have |
| F3.3 | Approve vendor: one tap → creates ModemPay sub-account → Twilio SMS to vendor | Must Have |
| F3.4 | Reject vendor with reason: Twilio SMS notifies vendor | Must Have |
| F3.5 | Onboard vendor: enter phone → Twilio invite SMS sent | Must Have |
| F3.6 | Set admin margin per product: admin_price >= base_price | Must Have |
| F3.7 | View all vendor listings and pricing | Must Have |
| F3.8 | Suspend or reinstate a vendor | Must Have |
| F3.9 | Admin earnings: balance, pending vs available, payout history | Must Have |
| F3.10 | Order overview across all vendors | Should Have |

#### ModemPay Sub-account Creation (on vendor approval)
```
Admin taps "Approve"
→ Edge Function: modempay.subAccounts.create({
    business_name: vendor.business_name,
    percentage: calculated_vendor_share_percent,
    settlement_code: vendor.payout_wallet_type,
    account_number: vendor.payout_wallet_number
  })
→ Returns sub_account_id → stored in vendor_profiles.modempay_subaccount_id
→ Twilio SMS sent to vendor
```

---

### Feature 4: Vendor — Listing & Order Management

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F4.1 | Vendor dashboard: active listings, wallet balance, orders today, recent order status | Must Have |
| F4.2 | Catalogue browse: see all products with admin price (their minimum). Cannot see base price. | Must Have |
| F4.3 | Set vendor price: constrained to >= admin_price. Live margin preview per unit. | Must Have |
| F4.4 | Publish listing: saves vendor_listing with vendor_price, status = active | Must Have |
| F4.5 | Toggle listing active/inactive | Must Have |
| F4.6 | Submit own product: photo → Groq auto-fills form → submitted to admin review | Should Have |
| F4.7 | Order queue: new and active orders with customer name, items, quantity, address, total | Must Have |
| F4.8 | Update order status: Preparing → Ready → Delivered (each triggers Twilio SMS to customer) | Must Have |
| F4.9 | Wallet: available balance, pending balance, transaction history | Must Have |
| F4.10 | Request payout: amount (min 10 GMD), confirm wallet → ModemPay Payouts API | Must Have |

---

### Feature 5: Affiliate — Share-to-Earn Engine

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F5.1 | Affiliate dashboard: total earned, available balance, pending balance, links, conversions | Must Have |
| F5.2 | Browse all active vendor listings. Each card shows vendor price + "Your commission: GMD X" | Must Have |
| F5.3 | Product detail screen: large "Get My Link" button | Must Have |
| F5.4 | "Get My Link" generates unique short URL (temsmarket.gm/p/{short_code}) — idempotent per affiliate+listing pair | Must Have |
| F5.5 | Share sheet opens immediately: WhatsApp, Facebook, TikTok, Instagram Stories, Copy Link | Must Have |
| F5.6 | Link click tracking: every tap increments affiliate_links.clicks via Edge Function | Must Have |
| F5.7 | Order via affiliate link: conversions + 1, commission queued to pending_balance | Must Have |
| F5.8 | On delivery confirmed: pending_balance → available_balance | Must Have |
| F5.9 | My Links screen: per-link stats — clicks, conversions, GMD earned | Should Have |
| F5.10 | Payout request: min 10 GMD available; enter wallet → ModemPay Payouts API | Must Have |
| F5.11 | Deep link fallback: app not installed → website product page + download banner | Must Have |

#### Affiliate Link Resolution Flow
```
Affiliate shares temsmarket.gm/p/{short_code}
Customer taps link:
  ├── App installed → deep link opens Product Detail (affiliate_id in context)
  └── App not installed → /p/{short_code} website page + "Download" banner
Customer checks out → pays
  → order.affiliate_link_id = affiliate_links.id
  → Payment confirmed → commission → affiliate pending_balance
  → Delivery confirmed → pending → available
```

---

### Feature 6: Customer — Shopping Flow

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F6.1 | Guest browsing: full product catalogue visible without login | Must Have |
| F6.2 | Home feed: search bar, category filter tabs, product grid | Must Have |
| F6.3 | Product detail: image carousel, name, price, vendor name, description, Add to Cart | Must Have |
| F6.4 | Cart: item list, quantity adjust, remove item, subtotal, Checkout | Must Have |
| F6.5 | Checkout: confirm delivery address, select payment method | Must Have |
| F6.6 | Payment methods: QMoney, AfriMoney, Wave (ModemPay), Cash on Delivery | Must Have |
| F6.7 | Mobile money checkout: enter number → ModemPay Payment Intent → customer approves → webhook confirms | Must Have |
| F6.8 | Order placed confirmation screen with order ID | Must Have |
| F6.9 | Twilio SMS: "Your order #XXXX has been placed on Tems Market." | Must Have |
| F6.10 | Order tracking: status timeline (Placed → Confirmed → Preparing → Ready → Delivered) | Must Have |
| F6.11 | Twilio SMS on each status change | Should Have |
| F6.12 | Order history | Must Have |
| F6.13 | Login required at checkout if browsing as guest | Must Have |

---

### Feature 7: ModemPay Payment Flow

#### Phase 1 — Payment Intent (at checkout)
```
Customer selects mobile money payment
→ Edge Function: modempay.paymentIntents.create({
    amount: order.total_amount,
    currency: "GMD",
    sub_account: vendor.modempay_subaccount_id,
    metadata: { order_id, affiliate_link_id }
  })
→ Returns payment_intent_id → stored in orders
→ Customer approves on their mobile money app
→ ModemPay fires webhook: payment.completed
```

#### Phase 2 — Commission Distribution (on webhook)
```
ModemPay webhook → Edge Function:
1. Verify webhook signature (MODEMPAY_WEBHOOK_SECRET)
2. Load order + commission_records
3. Calculate: platform_fee, admin_margin, affiliate_commission
4. Fire modempay.payouts to affiliate wallet (if applicable)
5. Fire modempay.payouts to admin wallet
6. Update commission_records.payout_status = 'fully_paid'
7. Update affiliate pending_balance
8. Twilio WhatsApp to affiliate: "You earned GMD X!"
9. Twilio SMS to vendor: "Order confirmed. GMD X coming to your wallet."
```

#### Error Handling
| Error Condition | Code | User Message | System Action |
|-----------------|------|--------------|---------------|
| Payment failed | 402 | "Payment was not completed. Please try again." | Order stays in placed status |
| Webhook signature mismatch | 401 | None (server-side) | Log to Sentry, reject webhook |
| Payout API failure | 500 | None (async) | Log to Sentry, retry queue |
| Vendor sub-account not created | 400 | None (prevented by UI) | Block checkout, alert Sentry |

---

### Feature 8: Vendor ID Verification (OCR Space + Groq)

#### Flow
```
Vendor uploads ID photo
→ Edge Function:
  1. Upload to Supabase Storage
  2. OCR Space API → raw extracted text
  3. Groq: "Extract full_name, date_of_birth, id_number, document_type. Return JSON only."
  4. Store structured JSON in vendor_profiles.id_ocr_extracted
Admin sees: [document photo] + [structured fields] + [raw text toggle]
Admin: Approve or Reject with reason
```

#### Error Handling
- OCR Space failure or low confidence → admin sees raw photo only, fills manually — never blocking
- Groq failure → admin sees OCR raw text only — never blocking
- Both fail → admin reviews photo manually, no automation

---

### Feature 9: Groq AI — Product Assistant

| ID | Requirement | Priority |
|----|-------------|----------|
| F9.1 | Photo uploaded → Edge Function → Groq Vision | Should Have |
| F9.2 | Groq returns: suggested_name, suggested_description (2–3 sentences), suggested_category | Should Have |
| F9.3 | Pre-filled form fields from Groq — all editable | Must Have |
| F9.4 | Groq failure = blank fields, user fills manually. Never blocking. | Must Have |

---

### Feature 10: Notifications System (Twilio)

| Trigger | Channel | Recipient | Message Template |
|---------|---------|-----------|-----------------|
| OTP requested | SMS | Any user | "Your Tems Market code is {code}. Expires in 5 minutes." |
| Admin invited | SMS | New admin | "You've been added as Admin on Tems Market. Set up: {link}" |
| Vendor invited | SMS | New vendor | "You've been invited to sell on Tems Market: {link}" |
| Vendor approved | SMS + WhatsApp | Vendor | "Your vendor account is approved! Start listing now." |
| Vendor rejected | SMS | Vendor | "Your application wasn't approved. Reason: {reason}." |
| Order placed | SMS | Customer | "Order #{order_id} placed on Tems Market." |
| Order confirmed | WhatsApp | Customer | "Your order #{order_id} is confirmed and being prepared." |
| Order ready | WhatsApp | Customer | "Your order #{order_id} is ready for delivery!" |
| Order delivered | SMS | Customer | "Your order #{order_id} has been delivered. Thank you!" |
| Commission earned | WhatsApp | Affiliate | "You earned GMD {amount}! Balance: GMD {balance}" |
| Payout completed | SMS + WhatsApp | Affiliate/Vendor/Admin | "GMD {amount} sent to your {wallet_type} wallet." |

---

### Feature 11: RevenueCat — Vendor Subscription

| ID | Requirement | Priority |
|----|-------------|----------|
| F11.1 | Vendor sees paywall on first login after approval | Must Have |
| F11.2 | RevenueCat paywall shows monthly subscription price | Must Have |
| F11.3 | Successful subscription → entitlement "vendor_active" → listings can go live | Must Have |
| F11.4 | Lapsed subscription → all vendor listings set inactive → re-subscribe prompt | Must Have |
| F11.5 | Superadmin can grant free entitlement override per vendor | Should Have |
| F11.6 | RevenueCat Web Billing on marketing website for web subscriptions | Should Have |

---

### Feature 12: Analytics & Monitoring

#### PostHog Events
| Event | Properties | Purpose |
|-------|-----------|---------|
| `affiliate_link_generated` | affiliate_id, listing_id | Link creation rate |
| `affiliate_link_clicked` | short_code, source | Traffic source |
| `checkout_started` | order_id, amount, has_affiliate | Funnel start |
| `checkout_completed` | order_id, payment_method | Conversion |
| `checkout_abandoned` | step | Drop-off |
| `vendor_onboarded` | vendor_id, category | Growth |
| `payout_requested` | role, amount, wallet_type | Payout behaviour |
| `product_viewed` | listing_id, source | Popularity |

#### Sentry Critical Alerts
- Any exception in ModemPay webhook Edge Function
- Any exception in Payouts Edge Function
- App crash in checkout flow
- App crash in affiliate link generation

---

### Feature 13: Marketing Website

#### Pages
| Page | Purpose |
|------|---------|
| `/` | Landing: hero, how it works (3 roles), download buttons |
| `/for-vendors` | Vendor pitch: how to sell, pricing, FAQ, subscribe via RevenueCat Web |
| `/for-affiliates` | Affiliate pitch: how to earn, commission rates, sign up CTA |
| `/p/{short_code}` | Affiliate product fallback: image, price, description + app download banner |
| `/download` | App Store badge + Play Store badge + QR code |
| `/contact` | Simple contact form |

#### Rules
- `/p/{short_code}` resolves short_code via Supabase query — shows product info
- "Buy Now" on fallback: app installed → deep link; not installed → `/download`
- Website has NO shopping cart or checkout — all commerce is in the app
- RevenueCat Web SDK on `/for-vendors` for web subscription flow

---

### Feature 14: Web Dashboard (Admin + Superadmin Big Screen)

| ID | Requirement | Priority |
|----|-------------|----------|
| F14.1 | Superadmin can access all platform stats from web browser | Should Have |
| F14.2 | Admin can manage vendor verification queue from web | Should Have |
| F14.3 | Same Supabase tables — no data duplication | Must Have |
| F14.4 | Web dashboard is big-screen only — not mobile-optimised | Must Have |
| F14.5 | No customer shopping or affiliate functions on web | Must Have |

---

## 6. Screen Structure & Navigation

> **Design-neutral.** This section defines structure and navigation only.  
> No colours, typography, fonts, icon styles, spacing values, or design tokens are specified anywhere in this document. Those are decisions for the designer.

### Navigation Architecture by Role

#### Customer / Guest
```
Tab Bar
├── Home (feed + search)
├── Categories
├── Cart (badge count)
├── Orders
└── Profile / Sign In
```

#### Affiliate
```
Tab Bar
├── Earnings Dashboard
├── Browse Products
├── My Links
├── Payouts
└── Profile
```

#### Vendor
```
Tab Bar
├── Dashboard
├── Catalogue (browse + price-set)
├── My Listings
├── Orders
└── Wallet / Profile
```

#### Admin
```
Tab Bar
├── Dashboard
├── Vendor Queue (pending badge)
├── Catalogue / Pricing
├── Orders
└── Earnings / Profile
```

#### Superadmin
```
Tab Bar
├── Platform Overview
├── Products
├── Users
├── Transactions
└── Settings
```

### Screen Inventory

#### Shared / Auth Screens
- Splash screen
- Welcome screen (Sign Up / Sign In / Browse as Guest)
- Role select screen
- Phone entry screen
- OTP entry screen
- Set password screen
- Invite landing screen (for admin and vendor deep links)
- Account pending screen (vendor awaiting approval)
- Account suspended screen

#### Superadmin Screens
- Platform dashboard
- Product list
- Add product screen
- Product detail / edit
- Price layer view (full stack per product)
- User list (filterable by role)
- User detail
- Create admin screen
- Transaction log
- Transaction detail
- Settings (platform fee rate)

#### Admin Screens
- Admin dashboard
- Vendor queue (pending verifications)
- Vendor verification detail (document photo + OCR data side by side)
- Active vendor list
- Vendor detail
- Onboard vendor screen
- Product catalogue (browse base catalogue)
- Set admin price screen (per product)
- Order overview
- Order detail
- Admin earnings screen
- Payout request screen

#### Vendor Screens
- Vendor dashboard
- Vendor onboarding flow (business info → ID upload → payout setup → pending)
- Subscription paywall (RevenueCat)
- Catalogue browser
- Set vendor price screen (constrained input + margin preview)
- My listings
- Add/submit product screen (photo → Groq → form → submit)
- Order queue
- Order detail + status update
- Wallet screen
- Payout request screen
- Profile

#### Affiliate Screens
- Affiliate dashboard (earnings home)
- How it works screen (3 steps, skippable)
- Browse products
- Product detail (with "Get My Link" CTA)
- Share sheet
- My links list
- Link performance detail
- Payout request screen
- Profile

#### Customer Screens
- Home feed
- Category browse
- Search results
- Product detail
- Cart
- Checkout (address + payment method)
- Mobile money payment screen
- Order confirmed screen
- Order tracking screen
- Order history
- Profile / settings

### Key Interaction Patterns (structure only)
- **Vendor price input:** Constrained numeric field. Real-time margin amount display below the field. Cannot submit below admin_price.
- **Affiliate "Get My Link":** Single tap. Link generated and share sheet opens immediately — zero perceived delay.
- **Admin verification:** Split view or tabbed: [document photo] / [OCR-extracted structured fields] / [raw text toggle].
- **ModemPay checkout:** Phone number input → confirmation screen → waiting for customer's mobile money approval → success or failure screen.
- **Order status:** Vertical timeline showing all states; current state visually distinct.

---

## 7. Detailed User Flows

### Flow 1: New Vendor Onboarding (End-to-End)
```
Admin: "Onboard Vendor" → enter phone → Twilio invite SMS sent
Vendor: taps SMS link → Splash → Vendor Welcome (2 explainer slides)
→ Business Info (name, category, phone OTP confirm)
→ ID Upload (camera or gallery)
  → OCR Space extracts text
  → Groq structures: {full_name, date_of_birth, id_number, document_type}
  → Stored in Supabase
→ Payout wallet setup (Wave or AfriMoney number)
→ Create password
→ Account Pending screen

Admin: badge appears on Vendor Queue tab
→ Opens verification detail screen
→ Reviews: photo + OCR structured fields
→ Approves
  → Edge Function: ModemPay sub-account created
  → Twilio SMS to vendor: "You're approved"
  → Vendor app unlocks → RevenueCat paywall appears
  → Vendor subscribes → Vendor Dashboard READY STATE
```

### Flow 2: Affiliate Share-to-Earn (End-to-End)
```
Affiliate: Browse Products → taps product → Product Detail
→ Sees: price, "Your commission: GMD X", photos
→ Taps "Get My Link"
  → Edge Function: check existing affiliate_link for this affiliate + listing
    ├── Exists: return short_code
    └── New: create affiliate_links row, generate short_code
→ Share sheet opens with pre-filled message + link
→ Affiliate shares on WhatsApp group

Customer: taps link
  ├── App installed → deep link → Product Detail (affiliate_id in context)
  └── App not installed → /p/{short_code} website + download banner
→ Customer: cart → checkout → pays via mobile money
→ ModemPay webhook fires
→ Edge Function: conversions + 1, commission → pending_balance
→ Twilio WhatsApp to affiliate: "You earned GMD X!"
Vendor: marks order Delivered
→ Affiliate: pending_balance → available_balance
→ Affiliate: requests payout → ModemPay Payouts API → wallet received
```

### Flow 3: Customer Mobile Money Checkout
```
Customer: cart → Checkout
→ Confirm delivery address
→ Select: QMoney / AfriMoney / Wave / Cash on Delivery
  ├── Mobile money:
  │   → Enter mobile money number
  │   → Edge Function: ModemPay Payment Intent (with vendor sub-account)
  │   → Customer approves on their mobile money app
  │   → Webhook fires → order confirmed → Phase 2 payouts triggered
  │   → Twilio SMS to customer + vendor
  └── Cash on Delivery:
      → Order placed → vendor fulfils → marks Delivered → no digital payment
```

### Flow 4: Commission Payout (Affiliate)
```
Affiliate: Payouts tab → sees available_balance
→ Enter payout amount (must be >= 10 GMD)
→ Confirm wallet number (Wave or AfriMoney)
→ Confirm screen: "Send GMD X to {wallet_type} {number}?"
→ Tap Confirm
→ Edge Function: ModemPay Payouts API
→ payout record created: status = processing
→ ModemPay processes → webhook fires
→ payout status = completed
→ affiliate_profiles.available_balance reduced
→ Twilio SMS: "GMD X sent to your wallet."
```

---

## 8. Non-Functional Requirements

### Performance
- App cold-start: under 3 seconds on mid-range Android (2021+)
- Product feed load: under 2 seconds on 4G
- Affiliate link generation: under 1 second (perceived instant)
- ModemPay webhook → payout trigger: under 5 seconds
- Supabase API response: under 500ms for standard queries

### Security
- [ ] ModemPay, Twilio, Groq, OCR Space API keys in Supabase Edge Function env only — never in app bundle
- [ ] Webhook signature verification on every incoming ModemPay webhook
- [ ] Supabase RLS enforced on every table
- [ ] Phone OTP rate-limited: max 5 attempts → 15-minute lockout
- [ ] Input sanitization on all text fields
- [ ] HTTPS only for website and all API calls
- [ ] Affiliate short_code does not expose internal UUIDs
- [ ] Vendor payout wallet number encrypted at rest
- [ ] Sentry configured to scrub PII (phone numbers, wallet numbers) from error payloads
- [ ] RevenueCat webhook signature verified server-side

### Accessibility
- All interactive elements have accessible labels for screen readers
- Touch targets minimum 44×44 points
- Status updates delivered via multiple channels (in-app + SMS) — not relying on push notifications alone

### Platform Support
- iOS: 15.0+
- Android: API level 26+ (Android 8.0)
- Website: Chrome, Safari, Firefox — latest 2 versions each

---

## 9. Scope Boundaries

### In Scope — MVP
- All 5 user roles with full onboarding flows
- Layered price stack (base → admin → vendor)
- Product base catalogue management
- Admin price layer management
- Vendor listing with price-setting
- Vendor ID verification via OCR Space + Groq
- Affiliate share-to-earn with unique trackable links
- Customer shopping: browse, cart, checkout, order tracking
- ModemPay: mobile money checkout + vendor auto-split + payouts
- Twilio: OTP, invite SMS, order and commission notifications
- RevenueCat: vendor monthly subscription (app + web)
- Groq Vision: product photo → auto-generated description
- Sentry: error monitoring
- PostHog: analytics and affiliate funnel tracking
- Marketing website: landing + download + affiliate product fallback
- Web dashboard (read/manage) for admin and superadmin

### Out of Scope — Future Versions
- In-app customer–vendor chat (WhatsApp handles this at launch)
- Customer product reviews and ratings
- Delivery logistics or route tracking
- International shipping
- Digital or downloadable products
- Multi-product affiliate links (link to full store)
- Vendor analytics dashboard
- Automatic listing deactivation on stock-out
- Multiple sub-accounts per ModemPay Payment Intent (awaiting ModemPay roadmap)

### Explicit Non-Goals
- This is not an international marketplace
- The website is not a shopping site — all purchasing happens in the app
- Customers do not interact with admins
- Affiliates do not hold or ship inventory

---

## 10. Acceptance Criteria

### Feature 1: Authentication
- [ ] Customer signs up with Gambian phone number and receives OTP within 30 seconds
- [ ] OTP expires after 5 minutes and cannot be reused
- [ ] Vendor invite link opens app directly to invite onboarding
- [ ] Suspended user cannot access any screen beyond the suspension notice

### Feature 2: Layered Pricing
- [ ] Vendor cannot set a price below admin price — input is blocked/constrained
- [ ] Customer sees only vendor price on product detail — no admin or base price visible
- [ ] Superadmin price layer view shows all four prices accurately
- [ ] Changing admin price does not retroactively change existing vendor listings

### Feature 3: Share-to-Earn
- [ ] Affiliate generates a unique link in under 1 second
- [ ] Same affiliate generating a link for same product twice returns the same link
- [ ] Two different affiliates sharing the same product get different links
- [ ] Order via affiliate link correctly records affiliate_link_id
- [ ] Commission queued to pending_balance immediately after payment confirmed
- [ ] Commission moves to available_balance only after order marked Delivered

### Feature 4: Payment Flow
- [ ] ModemPay Payment Intent created with correct amount and vendor sub-account
- [ ] Webhook signature verification rejects tampered payloads
- [ ] Phase 2 payouts fire within 5 seconds of payment webhook
- [ ] Cash on delivery orders do not trigger any ModemPay payment calls
- [ ] Failed payment shows error and does not create a confirmed order

### Feature 5: Vendor Verification
- [ ] OCR Space returns extracted text for a clear ID photo in under 10 seconds
- [ ] Groq structures OCR text into full_name, date_of_birth, id_number, document_type
- [ ] Admin can approve or reject from a single screen
- [ ] ModemPay sub-account created automatically on approval
- [ ] Twilio SMS sent to vendor within 30 seconds of decision

### Feature 6: RevenueCat
- [ ] Vendor sees paywall immediately after first login post-approval
- [ ] Subscription unlocks vendor listing creation immediately
- [ ] Lapsed subscription sets all vendor listings to inactive
- [ ] Web subscription grants same entitlement as in-app subscription

### Overall Application
- [ ] All screens render without error on iPhone 13 and Samsung Galaxy A32
- [ ] No customer can access admin or vendor screens
- [ ] ModemPay API keys are not present in the app bundle
- [ ] Sentry receives at least one test event before production launch
- [ ] PostHog captures checkout_completed events accurately in staging
- [ ] Full end-to-end flow tested: vendor onboarded → lists product → affiliate shares → customer buys → all payouts fire

---

## 11. Development Phases

### Phase 1: Foundation (Checkpoint 1)
**Goal:** Auth, roles, database schema, navigation shell
- [ ] Expo project bootstrapped, EAS configured
- [ ] Supabase project: all tables + RLS policies
- [ ] All 5 role auth flows (signup, OTP, invite, login)
- [ ] Tab navigation shell per role (screens are placeholder)
- [ ] Twilio OTP integrated
- [ ] Sentry configured and receiving test events
- [ ] PostHog capturing screen views

### Phase 2: Core Marketplace (Checkpoint 2)
**Goal:** Superadmin, admin workflows, vendor onboarding, product catalogue
- [ ] Superadmin: add products, set base price, view price layers, manage users
- [ ] Admin: vendor queue, OCR + Groq verification, approve/reject, set admin price
- [ ] Vendor: full onboarding (invite → ID upload → OCR/Groq → pending → approved)
- [ ] Vendor: browse catalogue, set price, publish listing
- [ ] RevenueCat: vendor subscription paywall
- [ ] ModemPay: sub-account creation on approval
- [ ] Groq Vision: photo → auto-fill form

### Phase 3: Commerce & Affiliate Engine (Checkpoint 3)
**Goal:** Customer shopping, checkout, affiliate links, commission tracking
- [ ] Customer: home feed, product detail, cart, checkout
- [ ] ModemPay: full checkout (Payment Intent → webhook → Phase 2 payouts)
- [ ] Cash on delivery flow
- [ ] Affiliate: browse, generate link, share sheet, link tracking
- [ ] Commission calculation and pending_balance logic
- [ ] Vendor: order queue, status updates
- [ ] All Twilio notification triggers wired
- [ ] Affiliate deep link resolution (app installed + not installed)

### Phase 4: Polish & Launch (Checkpoint 4)
**Goal:** Website, web dashboard, edge cases, production readiness
- [ ] Marketing website deployed (landing, download, /p/{short_code})
- [ ] Web dashboard for superadmin and admin
- [ ] RevenueCat Web Billing on website
- [ ] All error states handled gracefully (payment failure, OCR failure, Groq timeout)
- [ ] Loading states on all async operations
- [ ] Payout request flows (affiliate + vendor + admin)
- [ ] PostHog events verified in staging
- [ ] Full end-to-end test in staging
- [ ] App Store and Play Store submission via EAS

---

## 12. Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| ModemPay multi-sub-account feature delayed | Medium | Medium | Two-phase Payouts API workaround already designed and in scope |
| OCR Space fails on low-quality ID photos | Medium | High | Admin can review raw photo and input manually; OCR is assist, not gate |
| Groq API latency or downtime | Low | Low | Failure = blank form fields; user fills manually; never blocking |
| RevenueCat Play Store billing issues in Gambia | Medium | Low | Direct ModemPay vendor subscription as fallback if app store billing fails |
| Vendor fraud (fake ID submission) | High | Medium | Human admin review is mandatory; OCR is an aid; no listing until human approves |
| Affiliate click fraud (self-clicking) | Medium | Medium | Payout gated on confirmed orders, not clicks; PostHog detects anomalous patterns |
| App Store rejection on payment flows | Medium | Low | RevenueCat handles compliance; ModemPay is for physical goods, not in-app digital content |

---

## 13. Appendix

### API Documentation Links
- ModemPay Split Payments: https://docs.modempay.com/documentation/split-payments/initialize-payment
- ModemPay Sub-accounts: https://docs.modempay.com/documentation/split-payments/sub-accounts
- Supabase Docs: https://supabase.com/docs
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Twilio SMS: https://www.twilio.com/docs/sms
- Twilio WhatsApp: https://www.twilio.com/docs/whatsapp
- Groq API: https://console.groq.com/docs
- OCR Space API: https://ocr.space/ocrapi
- RevenueCat Expo: https://www.revenuecat.com/docs/getting-started/installation/expo
- RevenueCat Web: https://www.revenuecat.com/docs/web/web-billing/overview
- Sentry Expo: https://docs.sentry.io/platforms/react-native/guides/expo
- PostHog React Native: https://posthog.com/docs/libraries/react-native
- EAS Build: https://docs.expo.dev/eas

### Glossary
| Term | Definition |
|------|------------|
| Base Price | The superadmin's floor price. No one can sell below this. |
| Admin Price | Base price + admin margin. Minimum price a vendor can set. |
| Vendor Price | Admin price + vendor margin. What the customer sees and pays. |
| Platform Fee | Superadmin's earnings: 2–3% of each completed order total. |
| Commission Rate | % of vendor_price an affiliate earns on a sale through their link. |
| Short Code | The 8-character unique identifier in affiliate share links. |
| Pending Balance | Commission earned but held until order is marked Delivered. |
| Available Balance | Commission ready to withdraw via mobile money payout. |
| Sub-account | A ModemPay entity for a vendor's auto-payout destination. |
| Phase 1 Payout | Vendor share auto-routed by ModemPay sub-account at payment time. |
| Phase 2 Payout | Affiliate + admin margin distributed via Payouts API after webhook. |
| Share-to-Earn | Share a product link; earn commission on every sale through it. |
| RLS | Row Level Security — Supabase's database-level access control by user role. |
| Deep Link | URL that opens a specific screen inside the app. |
| BANTABA 2.0 | Gambia's national real-time interoperable payment system (Dec 2025). Tems Market benefits passively via ModemPay. |

---

## Replit Agent Instructions

**Mode:** Start in Plan Mode

**Phase 1 Prompt:**
"Review this PRD and create a development plan for Phase 1: Auth, Roles, Database Schema, and Navigation Shell. Do not start building yet — outline your approach, confirm the Supabase schema you will create, and list any questions before proceeding."

**Build Prompt (after plan approval):**
"Proceed with Phase 1 implementation using Expo React Native with EAS, Supabase for backend and auth, and Twilio for OTP. Create a checkpoint when Phase 1 is complete."

**Subsequent Phases:**
Repeat plan → build → checkpoint for Phases 2, 3, and 4.

**Critical notes for Replit Agent:**
- All ModemPay, Twilio, Groq, and OCR Space API calls must happen in Supabase Edge Functions only — never in the app client
- RLS policies are mandatory on every table before any data is read or written
- RevenueCat initialised with public key only in client; secret key server-side only
- Sentry and PostHog initialised in app root on first render
- No design tokens, colour values, or typography decisions are included in this PRD — implement with unstyled/placeholder styling only; a designer will apply the design system separately
