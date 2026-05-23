# Tems Market — Product Requirements Document

## Quick Reference

| Attribute | Value |
|-----------|-------|
| Version | 1.0.0 |
| Last Updated | May 2026 |
| Platform | Expo React Native (iOS + Android) + Marketing Website |
| Complexity | High |
| User Roles | 5 (Superadmin, Admin, Vendor, Affiliate, Customer) |
| Core Features | 12 |
| API Integrations | 8 |
| Development Phases | 4 |

---

## 1. Executive Summary

### Product Name
Tems Market

### One-Line Description
A layered-margin social commerce marketplace for The Gambia where vendors resell at wholesale prices, affiliates earn commissions by sharing links, and all payouts happen automatically through mobile money.

### Problem Statement
Gambian resellers have no structured digital tool to manage their supply chain, pricing layers, and sales team. Everything runs on WhatsApp — no tracking, no automatic payouts, no audit trail. The admin lady has no way to verify vendors at scale or manage margins systematically. Affiliates lose commission because there is no link tracking. Customers have no trusted local marketplace with mobile money checkout.

### Vision
Tems Market gives every person in The Gambia a path to income — vendors source wholesale and resell, affiliates share links from their phone and earn commission, customers buy from a trusted platform. The owner operates the whole system from a superadmin dashboard without being present in the shop.

### Success Metrics
- Vendor can go from invite SMS to first active listing in under 15 minutes
- Affiliate earns first commission within 48 hours of signup
- Customer completes checkout in under 3 minutes
- All payouts are automatic — zero manual transfers by owner
- Platform fee is recorded and visible in real time for every transaction

---

## 2. User Personas

### Persona 1: Superadmin (The Owner — You)
- **Description:** Runs the business, sources products, sets prices, has final authority on everything
- **Goals:** See all revenue and platform fees, control base prices, manage who has access, operate without being physically present
- **Pain Points:** Currently manages everything manually via WhatsApp, no audit trail, no real-time visibility
- **Tech Comfort:** Medium — needs clean dashboards, not raw data

### Persona 2: Admin (The Lady + Others)
- **Description:** Trusted operator who runs day-to-day. Onboards vendors, sets the admin margin, monitors orders
- **Goals:** Verify vendors quickly, set margins efficiently, track her own earnings
- **Pain Points:** No structured tool for vendor verification, margin calculations done manually, no visibility into order status
- **Tech Comfort:** Medium — familiar with WhatsApp and basic mobile apps

### Persona 3: Vendor
- **Description:** Small business owner or individual reseller, sources products at wholesale, sells to public at retail
- **Goals:** Access to approved product catalogue at wholesale prices, set own markup, get paid automatically
- **Pain Points:** No digital storefront, relies on personal WhatsApp, no payout tracking, hard to scale
- **Tech Comfort:** Low-Medium — uses mobile primarily, needs simple UI

### Persona 4: Affiliate
- **Description:** Anyone with a social following or WhatsApp group — students, stay-at-home parents, small influencers
- **Goals:** Earn money by sharing product links without holding stock or running a business
- **Pain Points:** No formal way to earn commission, no tracking, no guaranteed payment
- **Tech Comfort:** Low — must work with one tap: copy link → paste on WhatsApp → done

### Persona 5: Customer
- **Description:** Gambian shoppers, primarily mobile, primarily pay via mobile money
- **Goals:** Browse quality products, pay with QMoney/AfriMoney/Wave, receive order and track it
- **Pain Points:** No trusted local marketplace, WhatsApp ordering has no confirmation or tracking
- **Tech Comfort:** Low-Medium — comfortable with Facebook/WhatsApp, mobile money payments

---

## 3. Technical Specifications

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Mobile App | Expo React Native | Cross-platform iOS + Android, one codebase |
| Website | Next.js (or Expo Web) | Marketing page + download links + admin web portal |
| Backend | Supabase (PostgreSQL + Edge Functions) | Auth, database, storage, realtime, serverless functions for webhooks |
| Auth | Supabase Auth + Twilio OTP | Phone-number-first auth, role-based access |
| Payments | ModemPay API | Gambia-native, covers QMoney, AfriMoney, Wave, bank cards |
| Subscriptions | RevenueCat | Vendor monthly listing fee via App Store / Play Store + web billing |
| AI | Groq API (LLaMA vision) | Product description generation, OCR enhancement |
| OCR | OCR Space API | Vendor ID and document scanning during onboarding |
| Notifications | Twilio (SMS + WhatsApp API) | OTP, order updates, commission alerts, invite flows |
| Analytics | PostHog | Funnel tracking, affiliate link events, feature flags |
| Error Monitoring | Sentry | Crash reporting, payment error alerts, session replay |
| Email | Resend | Gift card delivery, order confirmation emails, promo emails |
| File Storage | Supabase Storage | Product images, vendor ID documents |

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Expo React Native App               │
│         (iOS + Android + Web via Next.js)        │
└──────────────┬──────────────────────────────────┘
               │
        ┌──────▼──────┐
        │   Supabase  │  ← Auth (phone OTP), Database, Storage,
        │   Backend   │    Realtime subscriptions, Edge Functions
        └──────┬──────┘
               │
    ┌──────────┼──────────────────┐
    │          │                  │
    ▼          ▼                  ▼
ModemPay    Twilio             Groq API
(payments   (SMS/WhatsApp      (AI product
& payouts)   notifications)     description
    │                           + OCR enhance)
    ▼                               │
GamSwitch                      OCR Space
/ BANTABA 2.0                  (document scan)
(national payment
 infrastructure)
```

### Third-Party Integrations

| Service | Purpose | Auth Method | Docs |
|---------|---------|-------------|------|
| ModemPay | Payments, split payouts, payment links | API Key | docs.modempay.com |
| Supabase | Database, auth, storage, edge functions | Project API Key | supabase.com/docs |
| Twilio | OTP SMS, WhatsApp notifications, invite SMS | Account SID + Auth Token | twilio.com/docs |
| Groq API | LLM vision for product image → description, OCR text cleanup | API Key | console.groq.com/docs |
| OCR Space | Vendor document / ID text extraction | API Key | ocr.space/ocrapi |
| PostHog | Analytics, funnel tracking, feature flags | API Key | posthog.com/docs |
| Sentry | Error tracking, crash reporting | DSN | docs.sentry.io |
| RevenueCat | Vendor subscription billing (App Store / Play Store / Web) | API Key | docs.revenuecat.com |
| Resend | Email delivery — gift cards, order confirmations, promos | API Key | resend.com/docs |

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| SUPABASE_URL | Supabase project URL | Yes |
| SUPABASE_ANON_KEY | Supabase public anon key | Yes |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role (Edge Functions only) | Yes |
| MODEMPAY_SECRET_KEY | ModemPay API secret key | Yes |
| MODEMPAY_PUBLIC_KEY | ModemPay public key | Yes |
| MODEMPAY_WEBHOOK_SECRET | ModemPay webhook verification secret | Yes |
| MOMO_RECONCILE_API_URL | MoMo Reconcile API base URL | Yes |
| MOMO_RECONCILE_API_KEY | MoMo Reconcile platform API key (Tems Market's account) | Yes |
| MOMO_RECONCILE_WEBHOOK_SECRET | MoMo Reconcile webhook verification secret | Yes |
| TWILIO_ACCOUNT_SID | Twilio account SID | Yes |
| TWILIO_AUTH_TOKEN | Twilio auth token | Yes |
| TWILIO_PHONE_NUMBER | Twilio sending phone number | Yes |
| TWILIO_WHATSAPP_NUMBER | Twilio WhatsApp sender number | Yes |
| GROQ_API_KEY | Groq API key | Yes |
| OCR_SPACE_API_KEY | OCR Space API key | Yes |
| POSTHOG_API_KEY | PostHog project API key | Yes |
| SENTRY_DSN | Sentry DSN for crash reporting | Yes |
| REVENUECAT_API_KEY_IOS | RevenueCat iOS key | Yes |
| REVENUECAT_API_KEY_ANDROID | RevenueCat Android key | Yes |
| REVENUECAT_WEB_BILLING_KEY | RevenueCat web billing key | Yes |
| RESEND_API_KEY | Resend email API key | Yes |

---

## 4. Data Model

### Entity: users
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | Supabase auth user ID |
| phone | TEXT | Yes | Unique | Phone number used for login |
| full_name | TEXT | Yes | — | Display name |
| role | ENUM | Yes | superadmin, admin, vendor, affiliate, customer | User role |
| status | ENUM | Yes | active, pending, suspended | Account status |
| created_at | TIMESTAMPTZ | Yes | Default now() | — |
| invited_by | UUID | No | FK → users.id | Who invited this user (admin/superadmin) |

### Entity: vendor_profiles
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | — |
| user_id | UUID | Yes | FK → users.id, Unique | One profile per vendor |
| business_name | TEXT | Yes | — | Vendor's trading name |
| category | TEXT | Yes | — | fashion, electronics, etc. |
| id_document_url | TEXT | No | — | Supabase Storage URL of uploaded ID |
| id_ocr_text | TEXT | No | — | OCR Space extracted text |
| id_structured | JSONB | No | — | Groq-structured ID data |
| settlement_code | TEXT | Yes | wave, afrimoney | Mobile money provider for payouts |
| account_number | TEXT | Yes | — | Mobile money number |
| modempay_subaccount_id | TEXT | No | — | ModemPay sub-account ID (created on approval) |
| approved_at | TIMESTAMPTZ | No | — | When admin approved |
| approved_by | UUID | No | FK → users.id | Which admin approved |

### Entity: products
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | — |
| title | TEXT | Yes | — | Product name |
| description | TEXT | No | — | Auto-generated by Groq or manually entered |
| category | TEXT | Yes | — | fashion, electronics, etc. |
| images | TEXT[] | Yes | — | Array of Supabase Storage URLs |
| base_price | NUMERIC | Yes | > 0 | Floor price set by superadmin (GMD) |
| inventory_type | ENUM | Yes | tems_owned, vendor_submitted | Tems Market own stock vs vendor uploaded |
| status | ENUM | Yes | draft, pending_review, active, inactive | pending_review = awaiting admin approval for vendor submissions |
| created_by | UUID | Yes | FK → users.id | Superadmin who created it |
| created_at | TIMESTAMPTZ | Yes | Default now() | — |
| submitted_by_vendor | UUID | No | FK → users.id | If vendor submitted for approval |

### Entity: price_layers
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | — |
| product_id | UUID | Yes | FK → products.id | — |
| admin_id | UUID | Yes | FK → users.id | Admin who set this layer |
| admin_price | NUMERIC | Yes | >= base_price | Admin's selling price to vendors |
| admin_margin | NUMERIC | Yes | Computed | admin_price - base_price |
| created_at | TIMESTAMPTZ | Yes | Default now() | — |
| updated_at | TIMESTAMPTZ | Yes | — | — |

### Entity: vendor_listings
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | — |
| product_id | UUID | Yes | FK → products.id | — |
| vendor_id | UUID | Yes | FK → users.id | — |
| vendor_price | NUMERIC | Yes | >= admin_price | Vendor's customer-facing price |
| vendor_margin | NUMERIC | Yes | Computed | vendor_price - admin_price |
| is_active | BOOLEAN | Yes | Default true | Vendor can toggle on/off |
| created_at | TIMESTAMPTZ | Yes | Default now() | — |
| updated_at | TIMESTAMPTZ | Yes | — | — |

### Entity: affiliate_links
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | — |
| affiliate_id | UUID | Yes | FK → users.id | — |
| listing_id | UUID | Yes | FK → vendor_listings.id | Which vendor listing to promote |
| short_code | TEXT | Yes | Unique | URL-safe unique code for the link |
| clicks | INTEGER | Yes | Default 0 | Total link clicks |
| conversions | INTEGER | Yes | Default 0 | Total completed orders from link |
| created_at | TIMESTAMPTZ | Yes | Default now() | — |

### Entity: orders
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | — |
| customer_id | UUID | Yes | FK → users.id | — |
| listing_id | UUID | Yes | FK → vendor_listings.id | — |
| affiliate_link_id | UUID | No | FK → affiliate_links.id | If order came from affiliate link |
| quantity | INTEGER | Yes | >= 1 | — |
| unit_price | NUMERIC | Yes | — | Vendor price at time of order |
| total_amount | NUMERIC | Yes | — | quantity × unit_price |
| status | ENUM | Yes | placed, confirmed, preparing, ready, delivered, cancelled | — |
| payment_method | TEXT | Yes | qmoney, afrimoney, wave, cash, gift_card, mixed | mixed = partial gift card + mobile money |
| gift_card_id | UUID | No | FK → gift_cards.id | If gift card used on this order |
| gift_card_amount | NUMERIC | No | — | GMD amount paid by gift card |
| coupon_id | UUID | No | FK → coupons.id | If coupon applied |
| coupon_discount | NUMERIC | No | — | GMD amount discounted by coupon |
| payment_status | ENUM | Yes | pending, paid, failed, refunded | — |
| modempay_payment_id | TEXT | No | — | ModemPay Payment Intent ID |
| delivery_address | TEXT | Yes | — | Customer's area/neighbourhood |
| created_at | TIMESTAMPTZ | Yes | Default now() | — |
| updated_at | TIMESTAMPTZ | Yes | — | — |

### Entity: featured_listings
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | — |
| listing_id | UUID | Yes | FK → vendor_listings.id | The listing being promoted |
| vendor_id | UUID | Yes | FK → users.id | Vendor paying for placement |
| plan | ENUM | Yes | 7_days, 30_days | Promotion duration |
| amount_paid | NUMERIC | Yes | — | GMD paid for the feature slot |
| modempay_payment_id | TEXT | No | — | Payment reference |
| starts_at | TIMESTAMPTZ | Yes | — | Promotion start |
| ends_at | TIMESTAMPTZ | Yes | — | Promotion end (auto-calculated from plan) |
| status | ENUM | Yes | pending_payment, active, expired | — |
| position | INTEGER | No | — | Display position in sponsored row (1 = first) |
| created_at | TIMESTAMPTZ | Yes | Default now() | — |

### Entity: gift_cards
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | — |
| code | TEXT | Yes | Unique, 16-char alphanumeric | The gift card code |
| value_gmd | NUMERIC | Yes | > 0 | Face value in GMD |
| remaining_balance | NUMERIC | Yes | Default = value_gmd | Decreases on use |
| purchased_by | UUID | No | FK → users.id | Buyer (null if issued by admin as promo) |
| recipient_email | TEXT | No | — | Email address gift card was sent to |
| recipient_name | TEXT | No | — | Personalisation for email |
| modempay_payment_id | TEXT | No | — | Payment when purchased |
| status | ENUM | Yes | active, partially_used, fully_used, expired | — |
| expires_at | TIMESTAMPTZ | Yes | — | Expiry date |
| created_at | TIMESTAMPTZ | Yes | Default now() | — |

### Entity: gift_card_redemptions
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | — |
| gift_card_id | UUID | Yes | FK → gift_cards.id | — |
| order_id | UUID | Yes | FK → orders.id | Order where it was used |
| amount_used | NUMERIC | Yes | — | GMD deducted from gift card |
| redeemed_at | TIMESTAMPTZ | Yes | Default now() | — |

### Entity: coupons
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | — |
| code | TEXT | Yes | Unique, case-insensitive | Promo code (e.g. TEMS20) |
| discount_type | ENUM | Yes | percentage, fixed_gmd | How discount is calculated |
| discount_value | NUMERIC | Yes | > 0 | % or GMD amount |
| minimum_order_gmd | NUMERIC | No | — | Minimum cart total to apply |
| max_uses | INTEGER | No | — | Total uses allowed (null = unlimited) |
| uses_so_far | INTEGER | Yes | Default 0 | Current use count |
| max_uses_per_user | INTEGER | No | Default 1 | Per-customer limit |
| valid_from | TIMESTAMPTZ | Yes | — | — |
| expires_at | TIMESTAMPTZ | Yes | — | — |
| status | ENUM | Yes | active, paused, expired | — |
| created_by | UUID | Yes | FK → users.id | Superadmin or admin who created it |
| created_at | TIMESTAMPTZ | Yes | Default now() | — |

### Entity: coupon_uses
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | — |
| coupon_id | UUID | Yes | FK → coupons.id | — |
| order_id | UUID | Yes | FK → orders.id | — |
| user_id | UUID | Yes | FK → users.id | Customer who used it |
| discount_applied | NUMERIC | Yes | — | GMD amount saved |
| used_at | TIMESTAMPTZ | Yes | Default now() | — |

### Entity: commission_ledger
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | — |
| order_id | UUID | Yes | FK → orders.id | — |
| recipient_id | UUID | Yes | FK → users.id | Admin, vendor, or affiliate |
| recipient_role | ENUM | Yes | admin, vendor, affiliate, platform | — |
| amount | NUMERIC | Yes | > 0 | GMD amount owed |
| status | ENUM | Yes | pending, paid, failed | — |
| modempay_payout_id | TEXT | No | — | ModemPay payout reference |
| paid_at | TIMESTAMPTZ | No | — | — |
| created_at | TIMESTAMPTZ | Yes | Default now() | — |

### Entity: notifications_log
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| id | UUID | Yes | Primary key | — |
| user_id | UUID | Yes | FK → users.id | Recipient |
| type | TEXT | Yes | — | otp, order_update, commission, invite, approval |
| channel | TEXT | Yes | sms, whatsapp | — |
| message | TEXT | Yes | — | Full message sent |
| twilio_sid | TEXT | No | — | Twilio message SID |
| sent_at | TIMESTAMPTZ | Yes | Default now() | — |

### Entity Relationships

```
users (1) ──────< (1) vendor_profiles
users (1) ──────< (many) vendor_listings      [vendors]
users (1) ──────< (many) affiliate_links       [affiliates]
users (1) ──────< (many) orders                [customers]
users (1) ──────< (many) commission_ledger     [all roles]
users (1) ──────< (many) featured_listings     [vendors]
products (1) ───< (1) price_layers             [admin sets once]
products (1) ───< (many) vendor_listings
vendor_listings (1) ──< (many) affiliate_links
vendor_listings (1) ──< (many) orders
vendor_listings (1) ──< (many) featured_listings
affiliate_links (1) ──< (many) orders
orders (1) ─────< (many) commission_ledger
orders (1) ─────< (many) gift_card_redemptions
orders (1) ─────< (many) coupon_uses
gift_cards (1) ─< (many) gift_card_redemptions
coupons (1) ────< (many) coupon_uses
```

### Database Indexes
- `users.phone` — login lookup
- `users.role` — role-based filtering
- `vendor_listings.vendor_id` — vendor's own listings
- `vendor_listings.product_id` — product catalogue joins
- `affiliate_links.short_code` — link resolution (hot path)
- `affiliate_links.affiliate_id` — affiliate dashboard
- `orders.customer_id` — customer order history
- `orders.status` — admin order management
- `commission_ledger.recipient_id + status` — payout queue
- `commission_ledger.order_id` — order → split audit trail
- `gift_cards.code` — redemption lookup (hot path)
- `gift_cards.status` — active card filtering
- `coupons.code` — coupon validation at checkout (hot path)
- `featured_listings.status + ends_at` — active sponsored feed query

---

## 5. Feature Specifications

### Feature 1: Authentication & Role-Based Access

#### Description
Phone-number-first auth using Supabase Auth + Twilio OTP. Each user has exactly one role. Role determines which screens are shown and which API calls are permitted. Superadmin and Admin are invite-only; Vendor is invite-only; Affiliate and Customer can self-register.

#### User Stories
- As any user, I want to log in with my phone number so I don't need to remember an email/password
- As a superadmin, I want my login to be protected by 2FA so that my account can't be compromised
- As an invited admin/vendor, I want tapping the invite SMS link to take me directly to account setup

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F1.1 | Phone number OTP login via Twilio (6-digit code, 5-minute expiry) | Must Have |
| F1.2 | Role-based navigation — each role sees only their screens | Must Have |
| F1.3 | Invite flow: superadmin creates admin → Twilio sends SMS with deep link | Must Have |
| F1.4 | Invite flow: admin creates vendor → Twilio sends SMS with deep link | Must Have |
| F1.5 | Self-registration for Affiliate and Customer with role select screen | Must Have |
| F1.6 | Superadmin login uses additional password (not OTP-only) | Must Have |
| F1.7 | Suspended users see a locked screen explaining their status | Must Have |
| F1.8 | Pending vendors see a waiting screen until admin approves | Must Have |
| F1.9 | Session persists across app restarts (Supabase session token) | Must Have |
| F1.10 | Date of birth field required at registration for all self-registering users (Customer + Affiliate). If DOB indicates under 18: registration blocked with message "You must be 18 or older to use Tems Market." Account not created. | Must Have |
| F1.11 | "I confirm I am 18 years or older" checkbox required before submitting registration. Cannot proceed without checking it. | Must Have |
| F1.12 | DOB and age_verified stored on users record. age_verified = true when DOB >= 18 years ago at time of signup. | Must Have |
| F1.13 | Affiliate onboarding includes a lightweight ID upload step (camera/gallery → OCR Space extracts text → stored for admin audit). Admin does not need to manually review each affiliate ID but can pull them for spot-checks. This verifies affiliates are real adults before they can earn commissions. | Must Have |
| F1.14 | Credit top-up acts as a secondary enforcement layer: QMoney/AfriMoney/Wave accounts in The Gambia require National ID to register. Successful top-up implies adult mobile money account. No additional check needed at top-up time. | Note only — not a built feature |

#### Twilio Notification Templates

| Trigger | Channel | Message |
|---------|---------|---------|
| OTP login | SMS | "Your Tems Market code is {code}. Expires in 5 minutes." |
| Admin invite | SMS | "You've been added as a Tems Market Admin. Tap to set up: {link}" |
| Vendor invite | SMS | "You've been invited to sell on Tems Market. Tap to register: {link}" |
| Vendor approved | WhatsApp | "✅ Your Tems Market vendor account is approved! Open the app to start listing." |
| Vendor rejected | SMS | "Your Tems Market application was not approved. Reason: {reason}. Contact your admin." |

#### API Endpoints (Supabase Edge Functions)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/request-otp | None | Send Twilio OTP to phone number |
| POST | /auth/verify-otp | None | Verify OTP, return Supabase session |
| POST | /auth/invite-admin | Superadmin | Create admin user, send invite SMS |
| POST | /auth/invite-vendor | Admin | Create pending vendor, send invite SMS |
| POST | /auth/complete-invite | Invite token | Finish account setup after invite link tap |

---

### Feature 2: Layered Pricing Engine

#### Description
The core commercial mechanic. Products have three price layers: base (superadmin floor), admin price (base + admin margin), vendor price (admin price + vendor margin). Each role sees only their relevant layer. Customers see only vendor price. The system enforces that no layer can be set below its floor.

#### User Stories
- As superadmin, I want to set the base floor price so no one undercuts my cost
- As admin, I want to set the admin price so I earn my margin on every sale
- As a vendor, I want to see the admin price and freely set my price above it
- As a customer, I only want to see the final price — no internal pricing visible

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F2.1 | Superadmin sets base_price per product. Cannot be set to zero. | Must Have |
| F2.2 | Admin sets admin_price per product. System enforces admin_price >= base_price | Must Have |
| F2.3 | Vendor sets vendor_price per listing. System enforces vendor_price >= admin_price | Must Have |
| F2.4 | Vendor sees live margin preview: "You earn GMD X per sale" while adjusting price | Must Have |
| F2.5 | Superadmin price layer view shows full stack: base → admin → vendor → customer price | Must Have |
| F2.6 | If admin changes admin_price, vendors with vendor_price below new admin_price are auto-flagged and their listing paused until they update | Must Have |
| F2.7 | Price history is logged (immutable audit) — who set what price when | Should Have |

---

### Feature 3: Vendor Onboarding & Verification

#### Description
Admin sends invite SMS. Vendor taps link, opens app, fills business info, uploads ID document (OCR Space extracts text, Groq structures it), sets payout wallet, submits. Admin reviews structured ID data and approves or rejects. On approval, ModemPay sub-account is created automatically via Supabase Edge Function.

#### User Stories
- As an admin, I want to send a vendor invite in two taps
- As a vendor, I want the ID upload to auto-fill my details so I don't have to type everything
- As an admin, I want to see structured ID data (not a raw photo) so verification is fast
- As a vendor, I want to know immediately when I'm approved or rejected

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F3.1 | Admin enters vendor phone → Twilio SMS invite with deep link sent | Must Have |
| F3.2 | Vendor opens deep link → app opens to invite-specific onboarding | Must Have |
| F3.3 | Vendor uploads photo of ID document via camera or gallery | Must Have |
| F3.4 | OCR Space API extracts text from ID image | Must Have |
| F3.5 | Groq API cleans and structures OCR text into name, ID number, DOB fields | Must Have |
| F3.6 | Structured data + raw image stored in Supabase Storage | Must Have |
| F3.7 | Vendor selects payout wallet (Wave or AfriMoney) and enters account number | Must Have |
| F3.8 | On admin approval: Supabase Edge Function calls ModemPay API to create sub-account for vendor | Must Have |
| F3.9 | On approval: vendor receives WhatsApp notification | Must Have |
| F3.10 | On rejection: vendor receives SMS with reason | Must Have |
| F3.11 | Admin sees structured ID data on review screen (not just raw photo) | Must Have |

#### ModemPay Sub-Account Creation (on vendor approval)
```js
// Triggered by Supabase Edge Function on vendor approval
const subAccount = await modempay.subAccounts.create({
  business_name: vendor.business_name,
  percentage: vendor_percentage, // Calculated from price layers
  settlement_code: vendor.settlement_code, // "wave" or "afrimoney"
  account_number: vendor.account_number,
});
// Store subAccount.id in vendor_profiles.modempay_subaccount_id
```

---

### Feature 4: Product Catalogue Management

#### Description
Superadmin adds products to the base catalogue with photos and floor prices. Groq vision auto-generates title, description, and suggested price from the photo. Admin then sets their margin on each product. Vendors browse the admin-priced catalogue and set their selling price. Vendors can also submit their own products for admin approval.

#### User Stories
- As superadmin, I want to upload a product photo and have AI fill in the details for me
- As admin, I want to set my margin on each product once and have it apply to all vendors
- As a vendor, I want to see exactly what I'll earn per sale before I decide my price
- As a vendor, I want to submit my own products for the admin to approve and add to the catalogue

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F4.1 | Superadmin can add product: upload 1-5 photos, Groq auto-fills title/description, set base price, set category | Must Have |
| F4.2 | Superadmin can edit any product field and toggle active/inactive | Must Have |
| F4.3 | Admin sets admin_price on each product (creates/updates price_layers record) | Must Have |
| F4.4 | Vendor browses admin-priced catalogue and sets vendor_price per product (creates vendor_listings) | Must Have |
| F4.5 | Vendor can toggle their listing active/inactive without removing it | Must Have |
| F4.6 | Vendor can submit own products → goes to admin approval queue | Should Have |
| F4.7 | Product images stored in Supabase Storage, served via CDN | Must Have |
| F4.8 | Category filtering in catalogue: fashion, electronics, other | Must Have |
| F4.9 | Search by product name within catalogue | Must Have |

#### Groq Vision Integration (Product Upload)
```
Input: product photo (base64)
Prompt: "You are helping a Gambian marketplace list a product.
Look at this product image and return JSON with:
{ title, description (2 sentences), category (fashion/electronics/other), suggested_price_gmd }
Be concise. description must be suitable for a mobile product listing."
Output: structured JSON → pre-filled form fields
```

---

### Feature 5: Share-to-Earn Affiliate System

#### Description
The killer feature. Every vendor listing has a unique shareable affiliate link per affiliate user. Affiliates browse vendor products, see their commission per product, tap "Get My Link", and get a deep link they can share anywhere. When a customer opens that link, the affiliate_link_id is stored in the order. After payment clears, affiliate commission is auto-queued in commission_ledger.

#### User Stories
- As an affiliate, I want to see how much I'd earn before choosing which product to share
- As an affiliate, I want my link to open the product in the app (or the website if app not installed)
- As an affiliate, I want to see in real time when someone buys through my link
- As an affiliate, I want to request payout to my mobile money with one tap

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F5.1 | Affiliate browses all active vendor listings | Must Have |
| F5.2 | Each product card shows "Your commission: GMD X" calculated from a % of vendor_margin | Must Have |
| F5.3 | Tap "Get My Link" → system creates affiliate_links record with unique short_code if not exists, returns shareable URL | Must Have |
| F5.4 | Share sheet opens with: WhatsApp, Facebook, TikTok, Instagram, Copy to clipboard | Must Have |
| F5.5 | Affiliate link URL format: temsmarket.app/p/{short_code} | Must Have |
| F5.6 | When customer taps link: app opens product detail with affiliate_link_id in memory. If app not installed: website shows product + download prompt | Must Have |
| F5.7 | At order placement, affiliate_link_id stored on order if present | Must Have |
| F5.8 | On payment confirmation webhook: commission_ledger entry created for affiliate | Must Have |
| F5.9 | Affiliate dashboard: earnings today / this week / total, pending vs available | Must Have |
| F5.10 | Per-link analytics: clicks, conversions, GMD earned (PostHog events) | Must Have |
| F5.11 | Payout request: min 10 GMD, enter Wave/AfriMoney number, triggers ModemPay payout | Must Have |
| F5.12 | Affiliate receives WhatsApp notification when commission is paid out | Should Have |

#### Commission Calculation
```
-- Rate by category
affiliate_rate = 0.25 (fashion) | 0.15 (electronics) | 0.20 (other)

-- Gross earnings per party
vendor_margin_gross        = vendor_price - admin_price
admin_margin_gross         = admin_price - base_price
affiliate_commission_gross = vendor_margin_gross × affiliate_rate  -- only if affiliate link on order

-- Platform takes 1% from every earning party
platform_from_vendor       = vendor_margin_gross × 0.01
platform_from_admin        = admin_margin_gross × 0.01
platform_from_affiliate    = affiliate_commission_gross × 0.01

-- Net payouts
vendor_payout    = vendor_margin_gross - platform_from_vendor
admin_payout     = admin_margin_gross  - platform_from_admin
affiliate_payout = affiliate_commission_gross - platform_from_affiliate
platform_total   = platform_from_vendor + platform_from_admin + platform_from_affiliate

-- MoMo Reconcile fee: 1% of platform_total (per order, not per-commission)
momo_reconcile_fee = platform_total × 0.01
tems_net           = platform_total - momo_reconcile_fee

-- Commission status flow (MoMo Reconcile gated)
-- On order PAID:              all entries → status = 'pending'
-- On MoMo Reconcile verified: all entries → status = 'available'
-- On daily settlement (11 PM): mobile_money entries → status = 'paid' (batched per user)
-- On credits preference:       entry → status = 'paid' immediately on verification
```
> Affiliate rates: 25% fashion / 15% electronics / 20% other — all of vendor_margin.
> On GMD 100 fashion margin: affiliate earns GMD 25 gross, keeps GMD 24.75 after 1% platform fee.
> Platform earns GMD 2.25 on a typical fashion order (GMD 100 vendor + GMD 100 admin + GMD 25 affiliate).
> MoMo Reconcile earns GMD 0.0225 per order (1% of GMD 2.25) — paid by Tems from its earnings.
> Nobody except Tems pays MoMo Reconcile. Customer, vendor, admin, affiliate see no extra deduction.

---

### Feature 6: Checkout & Payment (ModemPay)

#### Description
Customer selects mobile money method, enters number, confirms. ModemPay Payment Intent created with vendor sub-account attached. ModemPay automatically routes vendor's cut. Webhook fires → Supabase Edge Function handles affiliate and admin commission queue. Cash on delivery option also available for customers who prefer it.

#### User Stories
- As a customer, I want to pay with my QMoney, AfriMoney, or Wave wallet in under 3 taps
- As a vendor, I want my cut to arrive in my wallet automatically when an order is paid
- As an affiliate, I want my commission to appear in my balance the moment the order is confirmed

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F6.1 | Cart: add/remove items, adjust quantity, see subtotal | Must Have |
| F6.2 | Checkout: confirm delivery address, select payment method | Must Have |
| F6.3 | Mobile money options: QMoney, AfriMoney, Wave | Must Have |
| F6.4 | Cash on Delivery option — order placed, payment_status = "pending_cod" | Must Have |
| F6.5 | On mobile money select: ModemPay Payment Intent created with vendor sub-account | Must Have |
| F6.6 | Customer confirms payment on their mobile money app (standard mobile money flow) | Must Have |
| F6.7 | ModemPay webhook → Supabase Edge Function: update order payment_status to "paid" | Must Have |
| F6.8 | Same webhook: create commission_ledger entries for affiliate (if any) and admin | Must Have |
| F6.9 | Twilio SMS confirmation sent to customer on payment success | Must Have |
| F6.10 | Vendor receives WhatsApp notification of new order on payment success | Must Have |
| F6.11 | Failed payment: customer sees friendly error, order status = "payment_failed" | Must Have |
| F6.12 | Refund flow: superadmin/admin can trigger refund via ModemPay refund API | Should Have |

#### ModemPay Payment Flow
```js
// Phase 1: Auto-split to vendor (at payment time)
const paymentIntent = await modempay.paymentIntents.create({
  amount: order.total_amount,
  sub_account: vendor.modempay_subaccount_id, // vendor's % auto-routed
  metadata: { order_id: order.id }
});

// Phase 2: Webhook fires → Edge Function distributes remainder
// Affiliate commission → modempay.payouts.mobileMoney()
// Admin margin → modempay.payouts.mobileMoney()
// Platform fee stays in main account
```

---

### Feature 7: Order Management

#### Description
Full order lifecycle management. Customers see status. Vendors update status. Admins see all orders. Superadmin sees everything with financial breakdown.

#### User Stories
- As a customer, I want to track my order status in real time
- As a vendor, I want to see new orders immediately and update their status
- As an admin, I want to see all orders across all vendors

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F7.1 | Order status flow: placed → confirmed → preparing → ready → delivered | Must Have |
| F7.2 | Vendor can update status on each order | Must Have |
| F7.3 | Twilio WhatsApp notification to customer on each status change | Must Have |
| F7.4 | Customer sees real-time order tracking screen (Supabase Realtime) | Must Have |
| F7.5 | Admin sees all orders with filters: status, vendor, date range | Must Have |
| F7.6 | Superadmin sees all orders with financial breakdown per order | Must Have |
| F7.7 | Order cancellation: customer can cancel before "preparing" status | Should Have |

---

### Feature 8: Wallet & Payouts

#### Description
Every vendor and affiliate has a balance that accumulates from commission_ledger entries. They can request payout at any time above the 10 GMD minimum. Payout triggers a ModemPay mobile money transfer. Superadmin and Admin also have balances (platform fee and admin margin respectively).

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F8.1 | Wallet screen: total balance, pending (uncleared), available (cleared) | Must Have |
| F8.2 | Transaction history: per-order commission earned, date, amount | Must Have |
| F8.3 | Request payout button: enter mobile money number, confirm amount | Must Have |
| F8.4 | Minimum payout: 10 GMD (per ModemPay requirement) | Must Have |
| F8.5 | Payout triggers ModemPay mobile money payout API call | Must Have |
| F8.6 | Payout status tracked in commission_ledger: pending → paid / failed | Must Have |
| F8.7 | WhatsApp notification on payout success or failure | Must Have |
| F8.8 | Superadmin sees platform-wide financial summary: total revenue, platform fees earned, total paid out | Must Have |

---

### Feature 9: AI Product Listing Assistant (Groq)

#### Description
When superadmin or vendor uploads a product photo, Groq vision model analyzes the image and auto-fills title, description, category, and suggested price. The user can edit any field before saving. This dramatically reduces the friction of listing products.

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F9.1 | Upload photo → Groq vision API called via Supabase Edge Function (API key never in client) | Must Have |
| F9.2 | Response pre-fills: title, description, category, suggested price | Must Have |
| F9.3 | All pre-filled fields are editable before save | Must Have |
| F9.4 | Loading state shown while Groq processes (typically < 2s on LLaMA 3) | Must Have |
| F9.5 | If Groq fails: graceful fallback to manual form entry with error message | Must Have |

---

### Feature 10: Vendor Document Verification (OCR Space + Groq)

#### Description
During vendor onboarding, vendor photographs their ID or business document. OCR Space extracts raw text. Groq cleans and structures it into readable fields. Admin sees structured data on the review screen — not just a photo — making verification faster and consistent.

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F10.1 | Camera/gallery photo upload of ID document | Must Have |
| F10.2 | OCR Space API call via Supabase Edge Function extracts raw text | Must Have |
| F10.3 | Groq API structures raw OCR text into: name, ID number, DOB, document type | Must Have |
| F10.4 | Both raw image URL and structured JSON stored in vendor_profiles | Must Have |
| F10.5 | Admin review screen shows structured fields prominently + option to view raw image | Must Have |
| F10.6 | If OCR fails (bad photo quality): vendor prompted to retake photo | Must Have |

---

### Feature 11: Notifications System (Twilio)

#### Description
Twilio powers all SMS and WhatsApp notifications throughout the app. Every critical event has a defined notification. All sent notifications are logged in notifications_log for audit.

#### Notification Event Map

| Event | Recipient | Channel | Message |
|-------|-----------|---------|---------|
| OTP login | User | SMS | "Your Tems Market code is {code}." |
| Admin invited | New admin | SMS | "You've been added as Admin on Tems Market: {link}" |
| Vendor invited | New vendor | SMS | "You've been invited to sell on Tems Market: {link}" |
| Vendor approved | Vendor | WhatsApp | "✅ Your vendor account is approved! Open Tems Market to start listing." |
| Vendor rejected | Vendor | SMS | "Your application was not approved. Reason: {reason}" |
| Order placed | Vendor | WhatsApp | "🛒 New order! {customer_name} ordered {product} × {qty}. Open app to confirm." |
| Order confirmed | Customer | WhatsApp | "✅ Your Tems Market order is confirmed and being prepared." |
| Order ready | Customer | WhatsApp | "📦 Your order is ready for delivery!" |
| Order delivered | Customer | WhatsApp | "🎉 Your order has been delivered. Thank you for shopping Tems Market!" |
| Payment success | Customer | SMS | "Payment of GMD {amount} confirmed for your Tems Market order #{id}." |
| Commission earned | Affiliate | WhatsApp | "💰 You earned GMD {amount} commission on a sale. Balance: GMD {balance}." |
| Payout success | Any | WhatsApp | "💸 GMD {amount} has been sent to your {wallet} account." |
| Payout failed | Any | SMS | "Payout of GMD {amount} failed. Please check your wallet number and try again." |

---

### Feature 12: Sponsored / Featured Listings

#### Description
Vendors pay to have their listings appear in a dedicated "Sponsored" row at the top of the customer home feed and category pages. They choose a plan (7-day or 30-day), pay via ModemPay, and the listing goes live in the sponsored slot after payment confirms. Superadmin can see all active sponsored listings and their revenue contribution.

#### User Stories
- As a vendor, I want to pay to promote my product so more customers see it first
- As a customer, I see a clearly labelled "Sponsored" row at the top of the feed (honest, not hidden ads)
- As superadmin, I want sponsored listing fees as an additional revenue stream beyond commissions

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F12.1 | Vendor taps "Promote This Listing" on any of their active listings | Must Have |
| F12.2 | Plan selection screen: 7-day (GMD X) or 30-day (GMD Y) — prices set by superadmin in settings | Must Have |
| F12.3 | Payment via ModemPay → on webhook success, featured_listings record created with status = active | Must Have |
| F12.4 | Sponsored listings appear in a horizontal "Featured" row at the top of home feed and category pages | Must Have |
| F12.5 | Sponsored row is clearly labelled "Sponsored" to customers | Must Have |
| F12.6 | Listing automatically expires when ends_at is reached (cron job or Supabase scheduled function) | Must Have |
| F12.7 | Vendor sees "Active promotion — X days left" badge on their promoted listing | Must Have |
| F12.8 | Superadmin sees all featured listings, revenue earned from sponsorships, and can manually expire any | Must Have |
| F12.9 | If vendor has no active listings, "Promote" button is disabled with explanation | Must Have |

---

### Feature 13: Gift Cards

#### Description
Any user can purchase a gift card in a GMD denomination. On purchase, a unique 16-character code is generated and emailed to a recipient of the buyer's choice (or to themselves). The recipient redeems the code at checkout — it reduces the order total by the card's remaining balance. A gift card can cover the entire order amount (customer pays GMD 0 on checkout). Gift cards can also be issued by admin as promotional giveaways without payment.

#### User Stories
- As a customer, I want to buy a gift card and email it to a friend for their birthday
- As a recipient, I want to tap a link in my email to apply the gift card to my order automatically
- As a customer at checkout, I want to enter a gift card code and see my total drop immediately
- As superadmin, I want to issue free promotional gift cards to specific users or email addresses

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F13.1 | Gift card purchase screen: enter denomination (custom GMD amount or preset tiers), recipient email, recipient name, personal message | Must Have |
| F13.2 | Pay via ModemPay → on webhook success, gift card record created with unique 16-char code | Must Have |
| F13.3 | Resend email sent to recipient_email with: card value, code, personal message, "Shop Now" button linking to app/website | Must Have |
| F13.4 | Gift card email uses branded HTML template (Tems Market design) | Must Have |
| F13.5 | At checkout, customer can enter gift card code — system validates: active, not expired, has balance | Must Have |
| F13.6 | Gift card reduces order total. If gift card value >= order total, customer pays GMD 0 (full cover) | Must Have |
| F13.7 | Partial use: remaining_balance decremented. Card stays active until fully_used or expired | Must Have |
| F13.8 | Mixed payment: if gift card partially covers order, remainder paid via mobile money | Must Have |
| F13.9 | Gift card code can be applied at checkout via: manual entry OR QR code scan | Should Have |
| F13.10 | Superadmin can issue gift card without payment (promo issuance) — enters recipient email, value, expiry | Must Have |
| F13.11 | Buyer can see their purchased gift cards and their status in profile | Must Have |
| F13.12 | Gift card code in email has "Copy Code" button and a deep link that auto-applies code at checkout | Should Have |

#### Gift Card Email Template (Resend)
```
Subject: "🎁 You've received a Tems Market Gift Card!"
Body:
  - Tems Market logo
  - "{sender_name} sent you a gift card!"
  - "{personal_message}"
  - Gift card value: GMD {value}
  - Code: {code} [Copy Code button]
  - Expiry: {expires_at}
  - [Shop Now on Tems Market] button → temsmarket.app/redeem/{code}
```

---

### Feature 14: Coupons / Promo Codes

#### Description
Superadmin and admins create discount codes that customers enter at checkout. Coupons can be a fixed GMD amount off or a percentage off. They can have minimum order requirements, expiry dates, usage limits (global and per-user). Coupons are a marketing tool — shared via WhatsApp broadcasts, social media, or email campaigns.

#### User Stories
- As superadmin, I want to create a promo code "TEMS20" for 20% off to run a sales campaign
- As a customer, I want to enter a code at checkout and see the discount apply before I pay
- As admin, I want to see how many times a coupon has been used

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F14.1 | Superadmin/Admin can create coupon: code, type (% or GMD), value, min order, max uses, per-user limit, validity dates | Must Have |
| F14.2 | Coupon code is case-insensitive at entry | Must Have |
| F14.3 | At checkout, customer enters coupon code → validated in real time before payment | Must Have |
| F14.4 | Validation checks: code exists, status = active, within validity dates, under max_uses, under per-user limit, cart meets minimum | Must Have |
| F14.5 | Discount shown as line item on checkout screen: "Coupon TEMS20: -GMD X" | Must Have |
| F14.6 | Coupon and gift card can be used together on same order | Must Have |
| F14.7 | Coupon use logged in coupon_uses table on order completion | Must Have |
| F14.8 | Superadmin/Admin sees coupon list with: uses_so_far, GMD discounted total, status toggle | Must Have |
| F14.9 | Superadmin can pause or expire a coupon instantly | Must Have |
| F14.10 | Expired coupons are auto-detected (not a cron — validated at checkout time against expires_at) | Must Have |

---

### Feature 15: Email System (Resend)

#### Description
Resend handles all transactional emails from Tems Market. All emails use a consistent branded HTML template. Emails are sent via Supabase Edge Functions (Resend API key never in client). All sent emails are logged in a simple email_log table for debugging.

#### Email Event Map

| Event | Recipient | Subject |
|-------|-----------|---------|
| Gift card purchased | Recipient email | "🎁 You've received a Tems Market Gift Card!" |
| Order confirmation | Customer email (if provided) | "✅ Order #{id} confirmed on Tems Market" |
| Vendor approved | Vendor email (if provided) | "Your Tems Market vendor account is approved!" |
| Promo gift card issued | Recipient email | "🎁 A gift card from Tems Market just for you" |
| Promotional blast | Subscriber email list | [Campaign subject] |

> Note: Email is secondary to Twilio WhatsApp/SMS. Phone notifications fire first. Email is used specifically for gift cards (which require email delivery) and order confirmations for users who provide an email address.

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F15.1 | Resend API called via Supabase Edge Function — never from client | Must Have |
| F15.2 | All emails use shared branded HTML template (Tems Market logo, colours, footer) | Must Have |
| F15.3 | Gift card email sends on ModemPay webhook confirmation of gift card purchase | Must Have |
| F15.4 | Email address is optional on customer profile — prompted but not required | Must Have |
| F15.5 | Superadmin can send a promotional email blast to all users who have an email on file | Should Have |
| F15.6 | All emails logged: recipient, type, subject, Resend message ID, sent_at | Should Have |

---

### Feature 17: AI Chat Search — Groq-Powered Product Discovery (GoMart lesson)

#### Description
A conversational search interface on the customer home screen. Instead of typing a keyword into a search bar and scrolling through results, the customer describes what they want in plain natural language. Groq reads the query, searches active vendor listings, and returns the 3 most relevant matches with prices. Uses the Groq API already in the stack — same integration, new prompt and UI surface.

#### User Stories
- As a customer, I want to type "something nice for a wedding under GMD 800 in blue" and get relevant results immediately
- As a customer who doesn't know the product name, I want to describe it and find it
- As a customer, I want the chat to feel like asking a friend who knows the whole catalogue

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F17.1 | Chat icon on customer home screen opens a bottom sheet chat interface | Must Have |
| F17.2 | Customer types free-text query in any language (English, Wolof, Mandinka) | Must Have |
| F17.3 | Query sent to Groq via Edge Function with all active listing titles, categories, and prices as context | Must Have |
| F17.4 | Groq returns top 3 matching listing IDs with a one-line reason for each | Must Have |
| F17.5 | Results render as ProductCards inside the chat thread — tappable directly to product detail | Must Have |
| F17.6 | If no good match: Groq returns "I couldn't find that — try browsing fashion or electronics" | Must Have |
| F17.7 | Chat history persists within the session (cleared on app close) | Should Have |
| F17.8 | PostHog tracks: ai_search_query (query text), ai_search_converted (if result tapped → purchase) | Must Have |

#### Groq Prompt Pattern
```
System: "You are a shopping assistant for Tems Market, a Gambian marketplace.
Here are the active products: {listing_titles_prices_categories as JSON}.
Return ONLY valid JSON: { matches: [{ listing_id, reason }], count: 0-3 }
If no match: { matches: [], message: 'friendly not-found message' }"

User: "{customer_query}"
```

---

### Feature 18: Vendor Tier Comparison — Same Product, Multiple Vendors (Zeova lesson)

#### Description
When multiple vendors list the same base product, the product detail page shows all vendor options side by side. Customer sees price, vendor name, and a distinguishing badge (Lowest Price, Fast Dispatch). This creates natural price competition between vendors without admin intervention and gives customers agency. It also serves as the behavioral check on vendor price inflation — overpriced listings lose customers to better-priced ones on the same screen.

#### User Stories
- As a customer, I want to see all vendors selling this product and pick the best deal
- As a vendor, I want to compete on price or service to win more orders
- As an affiliate, I want my link to go to the best-value vendor listing for highest conversion

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F18.1 | Product detail screen shows "Available from X vendors" section when multiple vendor_listings exist for same product_id | Must Have |
| F18.2 | Each vendor option shows: vendor name, vendor_price, and up to one badge | Must Have |
| F18.3 | Badges: "Lowest Price" (cheapest listing), "Fast Dispatch" (vendor with best delivery track record — future), "New Vendor" (vendor_profile created within last 30 days) | Should Have |
| F18.4 | Default vendor shown is the lowest price active listing | Must Have |
| F18.5 | Customer taps a different vendor option → price and "Add to Cart" update to that vendor's listing | Must Have |
| F18.6 | Affiliate links always point to a specific vendor listing — affiliate chooses which vendor to promote | Must Have |
| F18.7 | If only one vendor lists the product, vendor comparison section is hidden (no empty state shown) | Must Have |

---

### Feature 19: Pre-Order Requests — In-App Customer Demand Capture (Zeova lesson)

#### Description
When a customer can't find what they want (AI search returns no match, or a product is inactive), they can submit a request directly in the app. Admin sees all requests in a "Customer Requests" tab — real demand data that informs what to source next. Turns customer intent into inventory intelligence. Replaces the current pattern of sending a WhatsApp message to ask if something is available.

#### User Stories
- As a customer, I want to request a product that isn't listed yet
- As a superadmin, I want to see what customers are actually asking for before I source new stock
- As an admin, I want to see requests so I can reach out to vendors who might carry it

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F19.1 | "Can't find what you need?" CTA appears on empty search results and after AI chat no-match response | Must Have |
| F19.2 | Tap opens a simple form: product description (text), category (picker), approximate budget (optional) | Must Have |
| F19.3 | Request saved to customer_requests table with customer_id, description, category, budget, status = 'open' | Must Have |
| F19.4 | Superadmin and Admin see a "Requests" tab showing all open requests, sorted by volume (most requested first) | Must Have |
| F19.5 | Admin can mark a request as 'fulfilled' once a matching product is listed — customer receives Twilio WhatsApp: "Good news! What you requested is now available on Tems Market." | Must Have |
| F19.6 | PostHog tracks: product_requested (category, budget_range) — reveals demand gaps | Must Have |

---

### Feature 20: Action Dashboard — Control Panel not Report (AgroPulse lesson)

#### Description
The superadmin and admin dashboards are redesigned as action surfaces, not stat reports. Every critical pending event surfaces as a dismissable card with a one-tap resolution. The superadmin opens the app, resolves everything from one screen, closes the app. No deep navigation required for routine management.

#### User Stories
- As superadmin, I want to see everything that needs my attention the moment I open the app
- As admin, I want to handle vendor approvals without navigating into multiple sub-menus
- As superadmin, I want to know my platform earnings today without digging through transactions

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F20.1 | Dashboard shows actionable event cards before stats | Must Have |
| F20.2 | Event card types: Pending vendor verifications [Review], Sponsored listings expiring today [View], Orders not updated in 6h [Nudge vendor], Affiliate top performer today [View], Low-stock signals from pre-order requests [Source] | Must Have |
| F20.3 | Each card has a primary action button that deep-links to the relevant screen | Must Have |
| F20.4 | Stats section below cards: platform earnings today, active vendors, orders today, top-selling product | Must Have |
| F20.5 | Cards are dismissable (swipe away) for non-urgent items | Should Have |
| F20.6 | Dashboard refreshes on pull-to-refresh and on app foreground | Must Have |
| F20.7 | Empty state (no pending actions): "All clear — platform running smoothly 🟢" | Must Have |

---

### Feature 21: Zero-Friction Checkout Flow (Zemart lesson)

#### Description
The checkout flow is redesigned as a sequence of single visual decisions — no text instructions, no form walls. Each step presents exactly one choice. Payment success is a full-screen moment, not a confirmation text. The flow should work for a customer who has never used a digital payment system before.

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F21.1 | Checkout is exactly 4 steps, each on its own screen: Cart review → Address confirm → Payment method → Processing | Must Have |
| F21.2 | Step 1 (Cart): large product images, quantity controls, subtotal. One button: "Checkout" | Must Have |
| F21.3 | Step 2 (Address): single address input, pre-filled from profile. One button: "Confirm Address" | Must Have |
| F21.4 | Step 3 (Payment): 4 large visual tiles — QMoney logo, AfriMoney logo, Wave logo, "Pay Cash". Tap one to select. One button: "Pay GMD X" | Must Have |
| F21.5 | Step 4 (Processing): animated spinner with "{provider} logo — Waiting for confirmation..." — no buttons, handles async gracefully | Must Have |
| F21.6 | Success screen: full-screen branded background colour (designer defines), large animated checkmark (Lottie), order number, two buttons: "Track Order" and "Continue Shopping" | Must Have |
| F21.7 | Failed payment: red full-screen with clear message "Payment didn't go through" + "Try Again" + "Pay Cash Instead" options | Must Have |
| F21.8 | Zero instructional text on any checkout screen — icons and labels only | Must Have |
| F21.9 | Back button on every step returns to previous step with state preserved (cart not cleared) | Must Have |

---

### Feature 22: Credits System — Tems Market Wallet

#### Description
Credits are the primary payment currency on Tems Market. Every user gets a credit wallet automatically on signup. To buy products, customers must have credits in their wallet. Credits are purchased via mobile money or card (ModemPay). They can be spent on orders, transferred to any other Tems Market user by phone number, or withdrawn back to mobile money. This creates a closed-loop economy: money enters the platform via top-up and circulates internally before leaving via withdrawal. The platform holds float on all credits at all times.

Checkout becomes instant — no mobile money OTP at the point of purchase. The friction is moved to the top-up step, which happens occasionally rather than on every order.

#### User Stories
- As a customer, I want to top up my Tems wallet with mobile money and then buy instantly at checkout
- As a customer, I want to transfer credits to a friend so they can shop on Tems Market
- As a parent, I want to top up my child's account so they can buy their school supplies
- As a customer, I want to withdraw my unused credits back to my mobile money wallet
- As a customer at checkout with insufficient credits, I want to top up inline without leaving the checkout flow
- As an affiliate, I want to receive my commission as credits and use them to shop or transfer

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F22.1 | Credit wallet created automatically for every user on signup (trigger on users INSERT) | Must Have |
| F22.2 | Wallet screen shows: current balance (large, prominent), recent transactions, Top Up button, Payout Preference setting | Must Have |
| F22.3 | Top-up flow: enter amount (min GMD 100) → choose method (QMoney/AfriMoney/Wave/Card) → pay via ModemPay → webhook fires → balance updates instantly | Must Have |
| F22.4 | Checkout requires credits. If balance ≥ order total: one-tap "Pay GMD X from Wallet". If balance < order total: show shortfall with flexible top-up options (see below) | Must Have |
| F22.5 | Checkout shortfall top-up options: [Exact shortfall] (shown if shortfall >= 100) / [GMD 200] / [GMD 500] / [GMD 1,000] / [Custom amount min GMD 100]. After top-up, checkout completes automatically. | Must Have |
| F22.6 | Credits cannot be transferred to another user. Gift cards are the gifting mechanism. | Must Have |
| F22.7 | Credits cannot be withdrawn to mobile money. Top up and spend only. | Must Have |
| F22.8 | Commission payout preference: set in profile. 'mobile_money' (default) pays via ModemPay Payouts API. 'credits' adds commission instantly to credit wallet when status becomes 'available'. Applies to vendors, affiliates, and admins. | Must Have |
| F22.9 | Payout preference toggle visible on: vendor wallet screen, affiliate payouts screen, admin wallet screen. Changing it applies to all future payouts immediately. | Must Have |
| F22.10 | Every credit movement creates an immutable credit_transactions record (INSERT-only via service role) | Must Have |
| F22.11 | Credit balance shown persistently in header bar for Customer and Affiliate roles | Must Have |
| F22.12 | Refunds from cancelled orders credited to customer's wallet instantly | Must Have |
| F22.13 | Superadmin can issue bonus credits to any user with a note | Must Have |
| F22.14 | Gift cards, when redeemed, add to the recipient's credit wallet balance (not a checkout discount — upstream of checkout) | Must Have |
| F22.15 | Gift card purchase screen accepts credits as payment method. If buyer has sufficient credits: instant deduction from wallet (no ModemPay flow). If insufficient credits: top up first, then pay. Also accepts mobile money directly. | Must Have |

#### Credits Are One-Directional Store Credit
```
Credits move in two directions only:
  IN:  ModemPay top-up → credit wallet (min GMD 100)
  IN:  Gift card redemption → credit wallet
  IN:  Commission credit (if payout preference = 'credits')
  IN:  Refund → credit wallet
  OUT: credit wallet → order purchase
  OUT: credit wallet → gift card purchase (if buyer pays with credits)

Credits cannot be transferred, withdrawn, or cashed out.
```

#### Checkout with Credits — Decision Tree
```
Customer at checkout:
  → Fetch credit_wallets.balance_gmd

  IF balance >= discounted_total:
    → "Pay GMD X from Tems Wallet" (one button, instant, no OTP)
    → Edge Function deducts balance, creates order (payment_method = 'credits')
    → credit_transactions INSERT (type: 'purchase', amount: −total)

  IF balance < discounted_total:
    shortfall = discounted_total − balance

    Show top-up options:
      [Top up GMD {shortfall}]    ← exact (shown if shortfall >= 100)
      [Top up GMD 200]            ← always shown
      [Top up GMD 500]            ← always shown
      [Top up GMD 1,000]          ← always shown
      [Custom amount ↓]           ← free input, min GMD 100

    After top-up webhook confirms → checkout fires automatically
    User does not tap "Pay" again — completes for them
```

#### Gift Card Purchase — Payment Options
```
Buyer on gift card screen — two options shown side by side:

  OPTION A: Pay from Tems Wallet
    Shown only if balance >= gift_card_amount
    → Instant: credit_transactions INSERT (type: 'gift_card_purchase', amount: −value)
    → gift_cards record created → Resend email fires immediately
    No mobile money OTP required

  OPTION B: Pay with Mobile Money
    → ModemPay Payment Intent → customer pays via QMoney/AfriMoney/Wave
    → Webhook → gift_cards record created → Resend email fires
    Available regardless of wallet balance

  Both options are always visible. Buyer chooses. No forced path.
```

#### Commission Payout Preference Flow
```
Default for all users: 'mobile_money'

Change preference in wallet screen → UPDATE users.commission_payout_preference

On order delivered (commission status → 'available'):

  IF payout_preference = 'credits':
    → Immediately: credit_wallets.balance += commission amount
    → credit_transactions INSERT (type: 'commission_credit')
    → commission_ledger status → 'paid' (automatic, no manual request)
    → WhatsApp: "GMD X commission added to your Tems wallet"

  IF payout_preference = 'mobile_money':
    → commission_ledger status stays 'available'
    → User manually requests payout → ModemPay Payouts API → 'paid'
```

#### Gift Cards — Complete Flow
```
PURCHASE:
  Buyer enters: GMD amount, recipient email, optional name + message
  Payment: from credit wallet OR via ModemPay (buyer's choice)
  → gift_cards record: unique 16-char code, value, expiry (12 months default)
  → Resend branded email to recipient

REDEEM:
  Recipient opens app → Profile → "Redeem Gift Card" → enters code
  → Validates: exists, active, not expired
  → credit_wallets.balance += gift card value
  → gift_cards.status → 'fully_used'
  → credit_transactions INSERT (type: 'gift_card_redeem')
  → Success: "GMD X added to your Tems wallet!"

SPEND:
  Recipient uses credits normally at checkout
  Gift card code never appears at checkout — it became credits upstream

NON-USER RECIPIENT:
  Receives email → taps link → website shows download prompt
  Downloads app → signs up with same email
  System detects unredeemed gift card matching email → auto-prompts redemption
  Credits land instantly → they are now an active customer with balance ready to spend
```

#### Credit Balance Display
- Header bar on Customer and Affiliate screens: "Wallet: GMD 1,200"
- Checkout screen: balance shown before the pay button
- After any top-up or purchase: animated balance update

---

### Feature 23: MoMo Reconcile Integration — Reconciliation Backend

#### Description
Every commission entry created in Tems Market is simultaneously logged as a Job in MoMo Reconcile — an independent trust ledger platform. A MoMo Reconcile manager independently verifies each commission payment against the ModemPay transaction reference within 24 hours. Only after verification does the commission status move from `pending` to `available`. This gives vendors, affiliates, and admins a cryptographically verified, manager-signed proof pack (PDF) for every commission they earn.

Tems Market pays MoMo Reconcile 1% of each commission amount as a B2B SaaS fee — absorbed by Tems Market's platform earnings, not passed to the earning user.

#### What MoMo Reconcile Provides
- **Tamper-proof audit trail:** Every commission has an immutable activity_log in MoMo Reconcile — who paid what, when, verified by whom
- **Manager-verified trust tier:** Each commission gets a trust tier (110 = machine + manager, 120 = manager only) after human sign-off
- **Proof pack PDF:** Downloadable signed receipt for the earning party — shareable, printable, SHA-256 verified
- **Dispute resolution:** If a vendor disputes their commission, MoMo Reconcile is the neutral evidence layer
- **Trust badge:** "Verified by MoMo Reconcile" on vendor/affiliate wallet screen

#### Commission Status Flow (updated with MoMo Reconcile + Daily Settlement)
```
Order paid (ModemPay webhook fires)
      ↓
commission_ledger entries created — status: 'pending'
momo_reconcile_status: 'syncing'
      ↓
sync-to-momo-reconcile Edge Function:
  Creates Job in MoMo Reconcile for each commission entry
  Attaches ModemPay tx_reference as payment proof
  momo_reconcile_status → 'pending'
      ↓
MoMo Reconcile manager verifies within 24h SLA
      ↓
MoMo Reconcile fires webhook to Tems Market:
  momo_reconcile_status → 'verified'
  momo_reconcile_trust_tier set (110 or 120)
  momo_reconcile_verified_at set
  commission_ledger status → 'available'
  settlement_date = today's date
  WhatsApp to earning party: "GMD X commission verified — will be paid tonight at 11 PM"
      ↓
11:00 PM Gambia time — process-daily-settlement scheduled Edge Function:
  Fetches all commission_ledger entries:
    status = 'available' AND settlement_date <= today AND settlement_batch_id IS NULL
    AND payout_method = 'mobile_money'
  Groups by recipient_id
  For each recipient: sum all available amounts
    IF total >= GMD 10 (minimum):
      Creates settlement_batches record
      Calls ModemPay Payouts API ONCE for the full day's total
      Updates all matching commission_ledger entries: status → 'paid', settlement_batch_id set
      WhatsApp: "Your Tems Market earnings of GMD {total} for today have been sent to your {wallet}"
    IF total < GMD 10:
      Carry forward to next day (settlement_date stays, batch not created yet)
      ↓
Credits payout preference: DOES NOT use daily settlement
  → Commission credited to wallet instantly when momo_reconcile_status → 'verified'
  → No end-of-day batch needed for credits
      ↓
48h timeout (manager didn't respond):
  momo_reconcile_status → 'timed_out'
  commission_ledger status → 'available' (fallback)
  trust_tier = 130 (handler-only)
  Joins next day's settlement batch normally
```

#### Functional Requirements
| ID | Requirement | Priority |
|----|-------------|----------|
| F23.1 | On ModemPay webhook: after commission_ledger entries created, call sync-to-momo-reconcile Edge Function | Must Have |
| F23.2 | sync-to-momo-reconcile creates one MoMo Reconcile Job per commission_ledger entry. Handler = earning party. Requester = Tems Market platform account. Amount = commission. TX reference = ModemPay payment_id | Must Have |
| F23.3 | MoMo Reconcile job_id stored in commission_ledger.momo_reconcile_job_id | Must Have |
| F23.4 | MoMo Reconcile webhook received → verify signature → update commission_ledger momo_reconcile_status and trigger 'available' | Must Have |
| F23.5 | 24h SLA timeout: scheduled Edge Function checks pending momo_reconcile jobs, auto-releases commission with timed_out status if manager hasn't acted | Must Have |
| F23.6 | Vendor/affiliate/admin wallet screen shows trust tier badge per commission entry (110/120/130) | Must Have |
| F23.7 | "View Proof Pack" button on commission detail → opens MoMo Reconcile proof pack PDF (deep link, signed URL) | Must Have |
| F23.8 | MoMo Reconcile fee = 1% of combined platform earnings per order (platform_total × 0.01). Deducted from Tems Market platform wallet, not from user commissions. Recorded per order not per commission entry. | Must Have |
| F23.9 | Disputed commission in MoMo Reconcile: momo_reconcile_status → 'disputed', commission frozen, user notified | Must Have |
| F23.10 | Superadmin dashboard shows: total MoMo Reconcile fees paid this month, average verification time, SLA breach count | Should Have |

#### B2B Fee Calculation
```
Fashion order (GMD 1,200 shoe, GMD 100 vendor margin, GMD 100 admin margin):

  Admin margin:          GMD 100  → platform takes 1% = GMD 1.00  → admin keeps GMD 99
  Vendor margin:         GMD 100  → platform takes 1% = GMD 1.00  → vendor keeps GMD 99
  Affiliate commission:  GMD 25   → platform takes 1% = GMD 0.25  → affiliate keeps GMD 24.75
    (25% of GMD 100, fashion rate)
  ─────────────────────────────────────────────────────────────────
  platform_total:        GMD 2.25

  MoMo Reconcile fee:    GMD 2.25 × 1% = GMD 0.0225
  Paid by Tems from platform_total. Nobody else pays.
  Tems keeps:            GMD 2.2275 per order (commission lines)
  Plus base markup:      GMD 1,000 (untouched — primary income)

Electronics order (same margins, 15% affiliate rate):
  Affiliate commission:  GMD 15   → platform GMD 0.15 → affiliate keeps GMD 14.85
  platform_total:        GMD 2.15
  MoMo fee:              GMD 0.0215

No affiliate — organic sale:
  platform_total:        GMD 2.00
  MoMo fee:              GMD 0.02
  Tems keeps:            GMD 1.98

Monthly at 500 orders/day (mixed categories):
  Avg platform_total:    ~GMD 2.20/order
  MoMo Reconcile earns:  GMD 0.022 × 500 = GMD 11/day = GMD 330/month
  Tems keeps:            GMD 1,089/day from commission lines
  At 5,000 orders/day:   MoMo earns GMD 3,300/month from Tems alone
```

---

### Feature 16: Analytics & Monitoring

#### Description
PostHog tracks all meaningful user actions for product decisions. Sentry catches all crashes and errors. Both are initialized on app start and fire passively — no user action required.

#### PostHog Events to Track

| Event | Properties |
|-------|------------|
| `affiliate_link_generated` | affiliate_id, listing_id, product_id |
| `affiliate_link_shared` | affiliate_id, channel (whatsapp/facebook/tiktok/copy) |
| `affiliate_link_clicked` | short_code, affiliate_id |
| `product_viewed` | product_id, source (organic/affiliate_link) |
| `add_to_cart` | product_id, listing_id, vendor_id |
| `checkout_started` | order_total, payment_method |
| `checkout_completed` | order_id, amount, payment_method |
| `checkout_failed` | reason, payment_method |
| `payout_requested` | role, amount, wallet_provider |
| `vendor_onboarding_started` | — |
| `vendor_onboarding_completed` | — |
| `vendor_approved` | vendor_id |

#### Sentry Configuration
- Capture all unhandled exceptions
- Capture ModemPay webhook errors specifically (tag: `payment_webhook`)
- Performance monitoring on checkout flow
- Session replay enabled for checkout and payout screens only (privacy-sensitive screens excluded)
- Alert on: any payment webhook failure, any payout API failure

---

## 6. UI/UX Specifications

### Design System

**Design language is intentionally open — finalised with a designer before launch.**

The designer has full creative authority over:
- Color palette and brand identity
- Typography — typeface, weight scale, size scale
- Icon set (Ionicons, SF Symbols, Lucide, custom, or mixed)
- Border radius, shadow, spacing scale
- Component visual style (cards, buttons, inputs, badges)
- Motion and animation language

All design decisions live in `docs/design/theme.md` (designer's file) and `constants/theme.ts` (developer implementation). Neither file is pre-populated — both are blank until the designer fills them in.

**What is decided (functional, not visual):**
- The component names that must exist: Button, Input, Card, Badge, LoadingSpinner, EmptyState, Toast, BottomSheet, ProductCard, ShareSheet, BalanceCard, PayoutSheet
- The screen information architecture (what tabs exist, what each screen contains — see Navigation Structure below)
- The data each screen must display (defined in Feature Specifications)

**What is not decided (designer's call):**
- How any of the above looks, feels, or moves
- Whether the app is light-mode only, dark-mode, or both
- Whether the visual language is minimal, expressive, editorial, or something else entirely

> When building before the designer has signed off: use `constants/theme.ts` with clearly named placeholder values. Never pick a color, font, or icon independently. Flag in Known Gaps that design tokens are pending.


### Navigation Structure

#### Superadmin App
```
Tab Bar:
├── Dashboard (platform stats, revenue, fees)
├── Products (base catalogue, add product)
├── Users (all users by role, create admin)
├── Orders (all orders, financial breakdown)
└── Settings (price layer config, commission rates)
```

#### Admin App
```
Tab Bar:
├── Dashboard (vendor queue, orders today, earnings)
├── Vendors (onboard vendor, pending approvals, active vendors)
├── Catalogue (set admin margin per product)
├── Orders (all vendor orders, statuses)
└── Wallet (admin margin balance, payout)
```

#### Vendor App
```
Tab Bar:
├── Dashboard (sales today, wallet balance, recent orders)
├── Catalogue (browse, set my price, publish)
├── My Listings (active listings, toggle on/off)
├── Orders (incoming orders, update status)
└── Wallet (balance, payout request)
```

#### Affiliate App
```
Tab Bar:
├── Earnings (balance, today/week/total, pending)
├── Products (browse all listings, commission preview)
├── My Links (all generated links, per-link performance)
├── Payouts (payout request, history)
└── Profile (name, phone, notification settings)
```

#### Customer App
```
Tab Bar:
├── Home (product feed, search, categories)
├── Search (full search with filters)
├── Cart (items, checkout)
├── Orders (order tracking, history)
└── Profile (account settings, delivery address)
```

### Website (Marketing + Desktop Portal)
- Landing page: hero section, how it works (3 steps), role cards (Vendor / Affiliate / Customer)
- App Store + Play Store download buttons (primary CTA)
- RevenueCat web billing paywall for vendor subscriptions (for those who prefer to subscribe on desktop)
- Superadmin/Admin can access a web dashboard view of their panels on larger screens
- Affiliate link landing pages: `/p/{short_code}` → product card + download app CTA

---

## 7. User Flows (Detailed)

### Flow 1: Superadmin — Add Product
```
Dashboard → Products tab → "Add Product" button
→ Camera/Gallery opens → Photo selected
→ Groq API called (loading state ~2s)
→ Form pre-filled: title, description, category, suggested_price
→ Superadmin reviews/edits all fields → sets base_price
→ "Publish to Catalogue" → product saved, status = draft
→ Admin notified to set margin (in-app badge on Admin's Catalogue tab)
```

### Flow 2: Admin — Verify Vendor
```
Admin Dashboard → Vendors tab → Pending Queue
→ Tap vendor → Review screen
→ Sees: business name, structured ID fields (from OCR+Groq), raw ID photo option
→ Approve → ModemPay sub-account created (Edge Function) → Vendor WhatsApp notification sent
   OR
→ Reject → Enter reason → SMS sent to vendor
```

### Flow 3: Vendor — Set Price & Go Live
```
Vendor Dashboard → Catalogue tab
→ Browse products (sees admin price as floor)
→ Tap product → "Set My Price" screen
→ Price slider/input (enforced min = admin_price)
→ Live preview: "You earn GMD X per sale"
→ "Publish Listing" → vendor_listings record created, is_active = true
→ Product now visible to customers and affiliates
```

### Flow 4: Affiliate — Share Link & Earn
```
Affiliate Dashboard → Products tab
→ Browse listings → sees "Your commission: GMD X" on each card
→ Tap product → Product Detail
→ "Get My Link" button
→ affiliate_links record created/retrieved → short URL generated
→ Native share sheet: WhatsApp / Facebook / TikTok / Copy
→ Affiliate shares link
→ Customer taps link → app opens (or website shows product + download prompt)
→ Customer buys → payment confirmed → commission_ledger entry created
→ Affiliate sees earnings update in real time (Supabase Realtime)
→ WhatsApp: "You earned GMD X"
```

### Flow 5: Customer — Browse & Checkout
```
Home Feed → Search or browse categories
→ Product Detail → Add to Cart
→ Cart → Checkout
→ Confirm address → Select payment: QMoney / AfriMoney / Wave / COD
→ [Mobile money path]:
   Enter wallet number → ModemPay intent created
   → Customer gets prompt on mobile money app
   → Customer approves payment
   → Webhook fires → order confirmed
   → Twilio SMS: "Payment confirmed"
   → Vendor WhatsApp: "New order"
→ Order Tracking screen — Supabase Realtime updates
```

### Flow 6: Affiliate/Vendor — Request Payout
```
Wallet screen → "Request Payout" button
→ Enter mobile money number (pre-filled if saved)
→ Confirm amount (must be >= 10 GMD)
→ "Confirm" → Edge Function calls ModemPay payouts API
→ Loading state → Success / Failure
→ WhatsApp notification on result
→ commission_ledger entry updated: status = paid / failed
```

---

## 8. Non-Functional Requirements

### Performance
- App cold start: < 3 seconds
- Product feed load: < 2 seconds
- Groq product description generation: < 3 seconds
- ModemPay payment intent creation: < 2 seconds
- Affiliate link generation: < 1 second (database write)
- Supabase Realtime order status updates: < 500ms latency

### Security
- [ ] All API keys stored in environment variables — never in client code
- [ ] Groq, OCR Space, Twilio calls via Supabase Edge Functions only (server-side)
- [ ] ModemPay webhook signature verification on every webhook
- [ ] Supabase Row Level Security (RLS) enabled on all tables
- [ ] Each role can only read/write their own data (RLS policies enforce this)
- [ ] Phone OTP rate-limited: max 3 attempts per 10 minutes per number
- [ ] Vendor ID document images stored in private Supabase Storage bucket (admin/superadmin access only)
- [ ] Input sanitization on all text fields
- [ ] HTTPS enforced everywhere

### Supabase RLS Policy Summary
| Table | Policy |
|-------|--------|
| users | Users read own record. Superadmin reads all. |
| vendor_profiles | Vendor reads own. Admin/Superadmin reads all. |
| products | All authenticated users read active products. Superadmin writes. |
| price_layers | Admin/Superadmin read/write. Vendors read. |
| vendor_listings | Vendor writes own. All authenticated users read active. |
| affiliate_links | Affiliate writes/reads own. Superadmin reads all. |
| orders | Customer writes own. Vendor reads orders for their listings. Admin/Superadmin read all. |
| commission_ledger | Each recipient reads own. Superadmin reads all. |

---

## 9. Scope Boundaries

### In Scope (MVP)
- 5-role auth system (Superadmin, Admin, Vendor, Affiliate, Customer)
- **Hybrid inventory model: Tems Market own products + vendor-uploaded products (admin-vetted before going live)**
- Layered pricing engine (base → admin → vendor)
- Vendor onboarding with OCR + Groq document verification
- Product catalogue with Groq AI description generation
- Affiliate share-to-earn with unique trackable links
- ModemPay checkout (QMoney, AfriMoney, Wave, COD, gift card, mixed payment)
- Automatic vendor payment split (ModemPay sub-accounts)
- Two-phase payout: affiliate + admin commission via ModemPay Payouts API
- **Sponsored / Featured Listings — vendors pay to appear first in the feed**
- **Gift Cards — purchasable, emailable via Resend, redeemable at checkout (full or partial cover)**
- **Coupons / Promo Codes — fixed or % discount, superadmin/admin creates and controls**
- **Email System via Resend — gift card delivery, order confirmations**
- Twilio SMS + WhatsApp notifications for all key events
- Order management with real-time status updates (Supabase Realtime)
- Wallet and payout request for vendors and affiliates
- PostHog analytics + Sentry error monitoring
- RevenueCat vendor subscription billing
- Marketing website with download links and `/p/{short_code}` affiliate landing pages

### Out of Scope (Future Phases)
- In-app customer reviews and ratings — adds complexity without early value
- In-app chat between buyer and vendor — WhatsApp handles this for now
- Delivery tracking with GPS — manual status updates for MVP
- Multi-language support (Wolof, Mandinka) — English-first for MVP
- Bulk product upload (CSV) — manual upload sufficient for MVP scale
- Loyalty/rewards points for customers — gift cards serve this purpose for MVP; full loyalty programme is phase 2
- Multiple sub-accounts per ModemPay payment intent — waiting on ModemPay to ship this; will simplify payout architecture when available

### Explicit Non-Goals
- This is NOT a general marketplace open to any seller — vendor access is gated by admin verification
- This is NOT a delivery company — fulfilment is the vendor's responsibility
- This is NOT a chat app — vendor/customer communication stays on WhatsApp

---

## 10. Acceptance Criteria

### Auth
- [ ] Customer can sign up with phone, receive OTP, complete profile, reach home feed
- [ ] Affiliate selects "Earn commissions" path and reaches affiliate dashboard
- [ ] Admin receives invite SMS, taps link, sets up account, reaches admin dashboard
- [ ] Vendor receives invite SMS, completes onboarding incl. ID upload, enters pending state
- [ ] Vendor sees "approved" notification and unlocks vendor dashboard after admin approves
- [ ] Suspended user sees locked screen on login

### Pricing Engine
- [ ] Vendor cannot set price below admin price (form enforces, API validates)
- [ ] Admin cannot set admin price below base price
- [ ] Superadmin price layer view shows all three prices per product
- [ ] Vendor margin preview updates in real time as price slider moves

### Payments
- [ ] Customer can complete QMoney checkout end-to-end in sandbox
- [ ] Gift card code reduces checkout total — full cover results in GMD 0 due
- [ ] Mixed payment (gift card + mobile money) completes successfully
- [ ] Coupon code applies correct discount at checkout
- [ ] Coupon rejects gracefully if: expired, max uses reached, minimum order not met
- [ ] ModemPay webhook correctly updates order to "paid"
- [ ] Vendor's commission appears in their wallet after order paid
- [ ] Affiliate's commission appears in their earnings after order paid
- [ ] COD order is placed and vendor notified without payment processing

### Affiliate
- [ ] Affiliate link is unique per affiliate per listing
- [ ] Tapping affiliate link on a device with app opens correct product screen
- [ ] Tapping affiliate link on device without app opens website product page with download CTA
- [ ] Affiliate_link_id is stored on the order when customer buys through link
- [ ] Affiliate can share via WhatsApp, Facebook, TikTok, and copy-to-clipboard

### Gift Cards
- [ ] Customer purchases gift card → Resend email arrives at recipient address with correct code and value
- [ ] Gift card code entered at checkout reduces total correctly
- [ ] Partial use: remaining_balance updates after order, card stays active
- [ ] Fully used card is rejected at next checkout with clear message
- [ ] Superadmin can issue a promo gift card without payment
- [ ] "Shop Now" link in gift card email opens correct screen in app / website fallback

### Sponsored Listings
- [ ] Vendor selects plan, pays via ModemPay, listing appears in "Sponsored" row on home feed
- [ ] Sponsored listing expires automatically when ends_at is reached
- [ ] Vendor sees "X days left" badge on active promotions
- [ ] Sponsored row is visible to customers and clearly labelled

### Notifications
- [ ] All Twilio SMS events listed in Feature 11 trigger correctly
- [ ] All Twilio WhatsApp events listed in Feature 11 trigger correctly
- [ ] Resend gift card email sends and renders correctly on Gmail and mobile email apps

### Monitoring
- [ ] Sentry captures a test exception and shows in dashboard
- [ ] PostHog receives `checkout_completed` event after test purchase
- [ ] PostHog receives `affiliate_link_shared` event after share action

---

## 11. Development Phases

### Phase 1: Foundation — Auth, Roles, Database (Checkpoint 1)
**Goal:** App boots, all 5 roles can log in or be onboarded, navigation structure in place
- [ ] Supabase project setup, schema migration, RLS policies
- [ ] Expo app scaffolding with role-based navigation
- [ ] Phone OTP auth via Supabase + Twilio
- [ ] Invite flows (admin invite, vendor invite via deep link)
- [ ] All environment variables configured
- [ ] Sentry and PostHog initialized

### Phase 2: Core Commerce — Catalogue, Pricing, Listings (Checkpoint 2)
**Goal:** Products can be added, priced in layers, and listed by vendors
- [ ] Product model + Supabase Storage for images
- [ ] Groq vision integration for product description generation
- [ ] Superadmin product management screens
- [ ] Price layers — admin margin setting
- [ ] Vendor catalogue browse + set price + publish listing
- [ ] OCR Space + Groq for vendor document verification
- [ ] ModemPay sub-account creation on vendor approval

### Phase 3: Transactions — Checkout, Payouts, Affiliate Links, Promos (Checkpoint 3)
**Goal:** Money moves — customers pay, vendors get paid, affiliates earn, promos work
- [ ] Cart and checkout screens
- [ ] ModemPay Payment Intent with sub-account split
- [ ] ModemPay webhook → Supabase Edge Function (order update + commission ledger)
- [ ] Gift card purchase flow (ModemPay → code generation → Resend email)
- [ ] Gift card redemption at checkout (full and partial cover, mixed payment)
- [ ] Coupon creation (superadmin/admin) and redemption at checkout
- [ ] Sponsored listing purchase flow (ModemPay → featured_listings record → feed placement)
- [ ] Affiliate link generation (short_code, deep links, web landing pages)
- [ ] Affiliate share sheet
- [ ] Commission ledger and wallet screens for all roles
- [ ] ModemPay Payouts API for affiliate and admin commission distribution
- [ ] Order status management (vendor updates, Realtime to customer)
- [ ] All Twilio notification events wired
- [ ] All Resend email events wired

### Phase 4: Polish & Launch (Checkpoint 4)
**Goal:** Production-ready, monitored, submitted to stores
- [ ] RevenueCat vendor subscription billing (in-app and web)
- [ ] PostHog event tracking verified across all key flows
- [ ] Error handling and loading states on all async operations
- [ ] Marketing website with download links and `/p/{short_code}` pages
- [ ] App Store and Google Play submission assets (screenshots, descriptions)
- [ ] Final security review (RLS audit, API key audit, webhook signature check)
- [ ] Performance audit (cold start, image loading, checkout latency)

---

## 12. Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| ModemPay webhook reliability in production | High | Medium | Log every webhook, implement idempotency check on order_id before processing |
| OCR Space poor quality on low-res ID photos | Medium | High | Prompt vendor to retake photo, have admin option to manually enter ID data as fallback |
| Affiliate links not opening app (deep link issues) | High | Medium | Test Universal Links (iOS) and App Links (Android) thoroughly; website fallback always works |
| ModemPay single sub-account per intent limits automatic multi-split | Medium | Confirmed | Two-phase payout architecture handles this; monitor ModemPay changelog for multi sub-account release |
| Twilio WhatsApp Business approval delay | Medium | Medium | Start WhatsApp Business API application early; SMS works as fallback for all WhatsApp events |
| Vendors setting prices below admin floor due to UI bug | High | Low | Server-side validation in Supabase Edge Function as second layer beyond client validation |
| Groq API rate limits on product upload | Low | Low | Free tier is generous; implement queue with retry for bulk uploads |

---

## 13. Appendix

### API Documentation Links
- ModemPay Split Payments: https://docs.modempay.com/documentation/split-payments/initialize-payment
- ModemPay Sub-Accounts: https://docs.modempay.com/documentation/split-payments/sub-accounts
- ModemPay Payouts: https://docs.modempay.com/documentation/payouts/mobile-money
- Supabase Expo Quickstart: https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
- Groq Vision API: https://console.groq.com/docs/vision
- OCR Space API: https://ocr.space/ocrapi
- Twilio WhatsApp API: https://www.twilio.com/docs/whatsapp
- RevenueCat Expo: https://www.revenuecat.com/docs/getting-started/installation/expo
- RevenueCat Web Billing: https://www.revenuecat.com/docs/web/web-billing/overview
- PostHog React Native: https://posthog.com/docs/libraries/react-native
- BANTABA 2.0 (payment infrastructure context): https://www.iidia.org/the-gambia-launches-bantaba-2-0

### Reference Apps
- **Jumia Africa** — general marketplace UX reference for product feed and checkout
- **ClickBank** — affiliate link tracking and commission dashboard reference
- **Wave Gambia** — mobile money UX reference for payment confirmation flow

### Glossary
| Term | Definition |
|------|------------|
| Base price | The floor price set by superadmin. No one can sell below this. |
| Admin price | Base price + admin margin. The price at which vendors access products. |
| Vendor price | Admin price + vendor margin. The price customers pay. |
| Affiliate commission | A % of vendor_margin paid to the affiliate who referred the sale. |
| Platform fee | A % of the total order amount kept by Tems Market (superadmin). |
| Sub-account | A ModemPay entity created per vendor that auto-receives their % on each payment. |
| Short code | The unique URL identifier for each affiliate's product link (e.g. `/p/xyz123`). |
| Gift card | A purchasable code with a GMD value that can be emailed to anyone and redeemed at checkout. |
| Coupon | An admin-created discount code applied at checkout for a % or fixed GMD reduction. |
| Sponsored listing | A vendor listing that has been paid to appear in the "Sponsored" row at the top of the feed. |
| Tems-owned product | A product sourced and priced by the superadmin directly (Tems Market's own inventory). |
| Vendor-submitted product | A product uploaded by a vendor, pending admin vetting before going live. |
| inventory_type | Field distinguishing tems_owned vs vendor_submitted products. |

---

## Replit Agent Instructions

**Mode:** Start in Plan Mode

**Phase 1 Prompt:**
"Review this PRD for Tems Market (a 5-role marketplace app built with Expo React Native and Supabase). Create a development plan for Phase 1: Foundation — Auth, Roles, Database. Include: Supabase schema migrations for all tables in Section 4, RLS policies from Section 8, Expo project structure, phone OTP auth with Twilio, role-based navigation, and invite deep link flows. Do not start building yet — outline your approach and flag any ambiguities."

**Build Prompt (after plan approval):**
"Proceed with Phase 1 implementation. Create a checkpoint when all auth flows are working and the correct dashboard renders for each of the 5 roles."

**Subsequent Phases:**
Repeat plan → build → checkpoint cycle for each phase.
