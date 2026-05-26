# Tems Market — Replit Agent Master Prompt

**Mode:** Plan Mode first, then Build Mode per phase
**Complexity:** High
**Estimated phases:** 4 milestones, 54 tasks, 4 checkpoints

---

## HOW TO USE THIS FILE

1. Copy the **Phase 1 Starting Prompt** into Replit Agent in Plan Mode
2. Review the plan Replit produces — confirm it matches TASKS.md
3. Approve → Replit builds → reach Checkpoint 1
4. Copy the **Phase 2 Prompt** and repeat
5. Use the **Fix Prompt** whenever a task fails its verify step

One rule: never paste the next phase prompt until the current checkpoint passes.

---

## ─────────────────────────────────────────────
## PHASE 1 STARTING PROMPT
## Paste this first. Use Plan Mode.
## ─────────────────────────────────────────────

```
Build the foundation of Tems Market, a 5-role mobile marketplace app for The Gambia.

## Tech Stack
- Mobile: Expo SDK 52, React Native, TypeScript strict mode, Expo Router v4
- Styling: NativeWind v4 (Tailwind for React Native)
- Backend: Supabase (Auth, PostgreSQL, Storage, Edge Functions, Realtime)
- State: Zustand 5
- Forms: React Hook Form + Zod
- Package manager: Bun (npm fallback)
- Error monitoring: Sentry Expo
- Analytics: PostHog React Native

## What to build in this phase

### Step 1: Project scaffold
Create an Expo app with TypeScript strict mode and Expo Router v4.
Configure NativeWind v4 with these design tokens:
- Primary: #1D9E75 (teal)
- Accent: #EF9F27 (amber)
- Background: #F8F9FA
- Text: #1A1A1A

Configure ESLint with no-explicit-any rule and Prettier.
Add startup check that logs a warning if any required env var is missing.

### Step 2: Supabase setup
Run this SQL schema exactly as written — do not modify it:
[PASTE CONTENTS OF tems-market-schema.sql HERE]

After running the SQL, generate TypeScript types:
bunx supabase gen types typescript --local > types/supabase.ts

Create lib/supabase/client.ts as a singleton using env vars SUPABASE_URL and SUPABASE_ANON_KEY with AsyncStorage session persistence.

### Step 3: Auth screens — self-registering users (Customer + Affiliate)
Build these screens in app/(auth)/:
- welcome.tsx — logo, tagline "Shop. Sell. Earn.", two buttons: "Get Started" and "Sign In"
- role-select.tsx — two large cards: "I want to Shop" → customer path, "I want to Earn commissions" → affiliate path
- login.tsx — phone number input (E.164 format, +220 prefix for Gambia default), "Send Code" button
- otp.tsx — 6-digit OTP input, 5-minute expiry, "Resend" option after 60 seconds
- register.tsx — full name input, password (min 8 chars), confirm password

Auth flow:
1. User enters phone → app calls send-otp Supabase Edge Function → Africa's Talking SMS
2. User enters OTP → verify via Supabase Auth (phone OTP)
3. New user → register.tsx → save full_name and role to public.users
4. Existing user → skip register, go directly to role navigator

### Step 4: Superadmin login (separate path)
On welcome.tsx, add a small "Admin Login" text link at the bottom.
Superadmin login: email + password (Supabase email auth), then Meta WhatsApp Cloud API OTP as 2FA.
Both must succeed to reach superadmin dashboard.

### Step 5: Invite deep link handler
app/(auth)/invite/[token].tsx:
- Read token from URL params
- Call Supabase to validate token (invite_tokens table)
- Show "Set up your account" screen: full name + password
- On completion: update user status to 'active', navigate to role-appropriate screen

Configure Universal Links (iOS) and App Links (Android) in app.json:
- Scheme: temsmarket
- Host: temsmarket.app

### Step 6: Role-based root navigator
app/_layout.tsx:
- On mount: check Supabase session
- If no session → redirect to (auth)/welcome
- If session → read public.users.role → mount correct tab navigator
- Show loading spinner while session check runs
- Session persists via AsyncStorage

### Step 7: Navigation shells (placeholder screens)
Create tab navigators for all 5 roles. Each tab shows only the tab name as text — no real content yet.

Superadmin tabs: Dashboard, Products, Users, Orders, Settings
Admin tabs: Dashboard, Vendors, Catalogue, Orders, Wallet
Vendor tabs: Dashboard, Catalogue, Listings, Orders, Wallet
Affiliate tabs: Earnings, Products, My Links, Payouts, Profile
Customer tabs: Home, Search, Cart, Orders, Profile

Vendor with status = 'pending' is gated to an onboarding pending screen, not the tab bar.
Suspended user (status = 'suspended') sees a locked screen on login.

### Step 8: Sentry and PostHog
Install @sentry/react-native and posthog-react-native.
Wrap root layout with both providers.
Fire posthog.capture('app_started', { role }) on every app open.
Sentry captures all unhandled exceptions.

## File structure
Follow this structure exactly:
app/
  _layout.tsx
  index.tsx
  (auth)/
    welcome.tsx
    role-select.tsx
    login.tsx
    otp.tsx
    register.tsx
    invite/[token].tsx
  (superadmin)/_layout.tsx + dashboard.tsx + products/ + users/ + orders/ + settings.tsx
  (admin)/_layout.tsx + dashboard.tsx + vendors/ + catalogue/ + orders/ + wallet.tsx
  (vendor)/_layout.tsx + dashboard.tsx + onboarding/ + catalogue/ + listings/ + orders/ + wallet.tsx
  (affiliate)/_layout.tsx + earnings.tsx + products/ + links/ + payouts.tsx + profile.tsx
  (customer)/_layout.tsx + home.tsx + search.tsx + cart.tsx + orders/ + profile.tsx

lib/supabase/client.ts
lib/supabase/auth.ts
store/authStore.ts (Zustand: { user, role, setUser, signOut })
hooks/useAuth.ts
types/supabase.ts (auto-generated)
types/roles.ts (UserRole enum)
constants/colors.ts (design tokens)
constants/config.ts (MIN_PAYOUT_GMD = 10, etc.)

## Supabase Edge Functions to create

### Notification helper (used by all functions below)
Create lib/whatsapp.ts in the functions shared folder:
```typescript
// Shared helper — call from any Edge Function
// Sends WhatsApp message via Meta Cloud API
// Falls back to Africa's Talking SMS if WhatsApp fails

const GRAPH_URL = 'https://graph.facebook.com/v23.0'

export async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  // Try Meta WhatsApp Cloud API first (within 24h window = free, else utility rate)
  try {
    const res = await fetch(
      `${GRAPH_URL}/${Deno.env.get('META_WHATSAPP_PHONE_NUMBER_ID')}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,           // E.164 format e.g. +2207123456
          type: 'text',
          text: { body }
        })
      }
    )
    if (res.ok) return true
  } catch (_) {}

  // Fallback: Africa's Talking SMS
  return sendSMS(to, body)
}

export async function sendOTPWhatsApp(to: string, code: string): Promise<boolean> {
  // Authentication template — pre-approved by Meta
  // Template name: 'tems_market_otp' (create this in Meta Business Manager)
  try {
    const res = await fetch(
      `${GRAPH_URL}/${Deno.env.get('META_WHATSAPP_PHONE_NUMBER_ID')}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('META_WHATSAPP_ACCESS_TOKEN')}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: 'tems_market_otp',
            language: { code: 'en' },
            components: [{
              type: 'body',
              parameters: [{ type: 'text', text: code }]
            }, {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [{ type: 'text', text: code }]
            }]
          }
        })
      }
    )
    if (res.ok) return true
  } catch (_) {}

  // Fallback to Africa's Talking SMS
  return sendSMS(to, `Your Tems Market code is ${code}. Expires in 5 minutes. Do not share this code.`)
}

async function sendSMS(to: string, body: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': Deno.env.get('AFRICA_TALKING_API_KEY')!,
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        username: Deno.env.get('AFRICA_TALKING_USERNAME')!,
        to,
        message: body,
      })
    })
    return res.ok
  } catch (_) {
    return false
  }
}
```

### supabase/functions/send-otp/index.ts
- Accepts { phone: string }
- Requires no auth (public endpoint)
- Rate limit: max 3 OTP requests per phone per 10 minutes (track in Supabase)
- Generates cryptographically random 6-digit code
- Stores hashed code in Supabase with 5-minute expiry
- Calls sendOTPWhatsApp(phone, code) — WhatsApp first, Africa's Talking SMS fallback
- Returns { success: true } or { error: string }

### supabase/functions/verify-otp/index.ts
- Accepts { phone: string, code: string }
- Fetches stored OTP hash for this phone
- Validates not expired, not already used
- If valid: marks used, returns Supabase auth session
- Returns { success: true, session } or { error: 'invalid' | 'expired' }

### supabase/functions/invite-user/index.ts
- Accepts { phone: string, role: 'admin' | 'vendor', invitedBy: string }
- Requires superadmin or admin auth
- Creates user record in public.users with status = 'pending'
- Creates invite_tokens record (expires 48h)
- Calls sendWhatsApp(phone, message):
  Admin: "You've been added as a Tems Market Admin. Tap to set up your account: https://temsmarket.app/invite/{token}"
  Vendor: "You've been invited to sell on Tems Market. Tap to register: https://temsmarket.app/invite/{token}"
- Returns { success: true, userId: string }

## Environment variables needed
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
META_WHATSAPP_ACCESS_TOKEN
META_WHATSAPP_PHONE_NUMBER_ID
META_WHATSAPP_BUSINESS_ACCOUNT_ID
META_WHATSAPP_WEBHOOK_VERIFY_TOKEN
AFRICA_TAKING_API_KEY
AFRICA_TALKING_USERNAME
POSTHOG_API_KEY
SENTRY_DSN
OCR_SPACE_API_KEY
GROQ_API_KEY
MODEMPAY_SECRET_KEY
MODEMPAY_PUBLIC_KEY
MODEMPAY_WEBHOOK_SECRET
MOMO_RECONCILE_API_URL
MOMO_RECONCILE_API_KEY
MOMO_RECONCILE_WEBHOOK_SECRET
RESEND_API_KEY
REVENUECAT_API_KEY_IOS
REVENUECAT_API_KEY_ANDROID
# Phase 3 only — add when Wave Business API integration begins:
# WAVE_BUSINESS_API_KEY

## Checkpoint 1 — stop here and verify before proceeding
- [ ] bunx tsc --noEmit passes with zero errors
- [ ] bunx expo start runs without red errors in simulator
- [ ] Customer can sign up (phone → OTP → name → customer dashboard)
- [ ] Affiliate can sign up (phone → OTP → name → affiliate dashboard)
- [ ] Superadmin can log in with email + password + OTP → superadmin dashboard
- [ ] Admin invite sends SMS with deep link
- [ ] Vendor invite sends SMS with deep link; vendor reaches onboarding pending screen
- [ ] Each of the 5 roles reaches their tab bar (placeholder content is fine)
- [ ] Suspended user sees locked screen
- [ ] Sentry dashboard shows a test event
- [ ] PostHog dashboard shows app_started event
```

---

## ─────────────────────────────────────────────
## PHASE 2 PROMPT
## Paste after Checkpoint 1 passes. Plan Mode.
## ─────────────────────────────────────────────

```
Checkpoint 1 complete. Build the core commerce features of Tems Market.

## What to build in this phase

### Step 1: Supabase Storage buckets
Create two buckets:
- product-images: public, 5MB max per file, accepts image/jpeg image/png image/webp
- id-documents: private (no public access), 10MB max, accepts image/jpeg image/png application/pdf

### Step 2: Shared UI component library
Build these components in components/ui/:
- Button.tsx — variants: primary (teal fill), secondary (teal outline), danger (red). Sizes: sm, md, lg. Shows LoadingSpinner when loading prop is true.
- Input.tsx — label, placeholder, error message below, secure text entry option
- Card.tsx — white background, rounded-xl, border border-gray-100, shadow-sm
- Badge.tsx — variants: success (green), warning (amber), error (red), info (blue), sponsored (amber with star icon)
- LoadingSpinner.tsx — teal ActivityIndicator, centered
- EmptyState.tsx — icon + title + subtitle + optional CTA button
- Toast.tsx — top-of-screen toast for transient errors and successes

### Step 3: Groq vision Edge Function
supabase/functions/groq-vision/index.ts:
- Accepts { imageBase64: string, mimeType: string }
- Requires authentication header
- Calls Groq API (model: meta-llama/llama-4-scout-17b-16e-instruct)
- System prompt: "You are helping a Gambian marketplace list a product. Return ONLY valid JSON, no markdown."
- User prompt with the image and: "Return JSON: { title: string, description: string (2 sentences), category: 'fashion'|'electronics'|'other', suggested_price_gmd: number }"
- Strip any markdown fences from response before JSON.parse
- If parse fails: return {} with status 200 (graceful fallback)
- Env vars needed: GROQ_API_KEY

### Step 4: Superadmin — Add Product screen
app/(superadmin)/products/add.tsx:
Flow: tap "Add Product" → image picker (camera or gallery, expo-image-picker) → upload image to Supabase Storage product-images bucket → convert to base64 → call groq-vision Edge Function → form pre-fills title, description, category, suggested_price
Form fields (all editable after Groq fills them): title (required), description, category (picker: fashion/electronics/other), base_price (required, GMD, numeric keyboard)
Show loading state "Reading your product..." while Groq processes
On save: insert into products table with inventory_type='tems_owned', status='draft', created_by=current user id
On success: navigate back to product list and show success toast

### Step 5: Superadmin — Product list and edit
app/(superadmin)/products/index.tsx — flat list of products, shows image thumbnail, title, base_price, status badge, tap to edit
app/(superadmin)/products/[id].tsx — edit all fields, toggle active/inactive, show price layer section:
  - Base price (editable here)
  - Admin price (from price_layers, read-only, shows "Not set yet" if no admin_price)
  - All vendor listings for this product with their vendor_price (read-only list)

### Step 6: Admin — Set margin screen
app/(admin)/catalogue/index.tsx:
List of all products with status='active', show title, image, base_price
Tap product → detail with: base_price (read-only, labelled "Your cost floor"), admin_price input
Validation: admin_price must be greater than or equal to base_price (show error "Must be at least GMD {base_price}" if not, do not allow save)
Server-side enforcement: create Edge Function supabase/functions/set-admin-price/index.ts that:
  - Requires admin or superadmin auth
  - Validates admin_price >= product.base_price (fetch product to check)
  - Upserts price_layers record
  - Sets admin_margin = admin_price - base_price
  - Returns { success: true }

### Step 7: OCR + Groq document Edge Function
supabase/functions/ocr-document/index.ts:
- Accepts { imageBase64: string, mimeType: string }
- Requires auth
- Calls OCR Space API (OCRSPACEURLENDPOINT with base64 method)
- Env var: OCR_SPACE_API_KEY
- If OCR text length < 30 chars: return { error: 'poor_quality', parsedText: null }
- Otherwise: call Groq to structure the text
- Groq prompt: "Extract from this ID document text and return ONLY valid JSON: { full_name: string, id_number: string, date_of_birth: string, document_type: string }. If a field is not found, use null."
- Return { parsedText: string, structured: { full_name, id_number, date_of_birth, document_type } }

### Step 8: Vendor onboarding flow
Build these screens in app/(vendor)/onboarding/:

business-info.tsx:
- Business name input (required)
- Category picker: fashion, electronics, other
- "Continue" button

id-upload.tsx:
- "Take a photo of your ID or business document"
- Two buttons: "Use Camera" (expo-camera) and "Choose from Gallery" (expo-image-picker)
- After photo selected: upload to id-documents bucket
- Call ocr-document Edge Function
- If poor_quality error: show "Photo unclear. Please retake." + retake button
- If success: show extracted fields with "Does this look right?" + "Yes, Continue" + "Retake" buttons
- On confirm: save id_document_url and id_structured to vendor_profiles

payout-setup.tsx:
- "How would you like to receive payments?"
- Two large option cards: Wave (logo + "Wave mobile money") and AfriMoney (logo + "AfriMoney")
- After selecting: enter mobile money number input
- "Submit Application" button
- On submit: update vendor_profiles with settlement_code and account_number, update users.status to 'pending' if not already
- Navigate to pending screen

pending.tsx:
- Show: "Your application is under review"
- Subtitle: "We'll notify you by WhatsApp when approved. This usually takes less than 24 hours."
- Subscribe to users table via Supabase Realtime on id = current user id
- When users.status changes to 'active': auto-navigate to vendor tab bar (replace pending screen)

### Step 9: Admin — Vendor verification queue
app/(admin)/vendors/queue.tsx:
- List of users with role='vendor' and status='pending'
- Shows: business name (from vendor_profiles), submission date, "Review" button
- Empty state: "No pending applications"

app/(admin)/vendors/[id].tsx:
- Show vendor info: business name, category
- Show structured ID data in a clean card: Full name, ID number, Date of birth, Document type
- "View ID Photo" button → open signed URL in a full-screen image viewer
- "Approve" button (green, primary) and "Reject" button (red, outlined)
- Reject: show modal with text input "Reason for rejection" + confirm

### Step 10: Approval Edge Function + ModemPay sub-account creation
supabase/functions/approve-vendor/index.ts:
- Requires admin or superadmin auth
- Accepts { vendorUserId: string, approve: boolean, rejectionReason?: string }
- If approve = true:
  1. Fetch vendor_profiles for vendorUserId (get settlement_code, account_number, business_name)
  2. Call ModemPay sub-account creation API
  3. Store modempay_subaccount_id in vendor_profiles
  4. Update users.status = 'active' and approved_at = now(), approved_by = current user id
  5. Send Meta WhatsApp to vendor phone: "✅ Your Tems Market vendor account is approved! Open the app to start listing products."
- If approve = false:
  1. Update users.status = 'rejected'
  2. Send Africa's Talking SMS to vendor phone: "Your Tems Market application was not approved. Reason: {reason}. Contact support if you have questions."

Wire the approve/reject buttons in app/(admin)/vendors/[id].tsx to call this Edge Function.

### Step 11: Vendor — Browse catalogue and set price
app/(vendor)/catalogue/index.tsx:
- List products that have a price_layers record (admin has set their margin)
- Show: product image, title, "Your cost: GMD {admin_price}"
- Tap product → set price screen

app/(vendor)/catalogue/[id].tsx:
- Show: product image, title, description
- Read-only: "Admin price (your cost): GMD {admin_price}"
- Input: "Your selling price" — numeric input, starts at admin_price
- Live preview: "You earn GMD {vendor_price - admin_price} per sale" updates as they type
- Validation: vendor_price must be >= admin_price, show inline error if not
- "Publish Listing" button
- Edge Function supabase/functions/set-vendor-price/index.ts:
  - Requires vendor auth
  - Accepts { productId: string, vendorPrice: number }
  - Validates vendor_price >= admin_price (fetch price_layers to check)
  - Upserts vendor_listings record: product_id, vendor_id, vendor_price, vendor_margin = vendor_price - admin_price, is_active = true
  - Returns { success: true, listingId: string }

### Step 12: Customer home feed
app/(customer)/home.tsx:
- Sponsored row at top: horizontal FlatList of active featured_listings, shows product image + title + price + "Sponsored" badge. Show nothing if no active sponsored listings.
- Category filter chips below: All, Fashion, Electronics, Other
- Product grid: 2-column grid of active vendor_listings joined with products
- ProductCard component (components/product/ProductCard.tsx): image, title, vendor_price, "Add to Cart" on tap goes to product detail
- Pull-to-refresh
- Infinite scroll: load 20 at a time, load more when scrolled to bottom

### Step 13: Product detail screen
app/(customer)/product/[id].tsx and app/(affiliate)/products/[id].tsx:
Both share a base ProductDetail component. Role determines which CTA shows:
- Customer: "Add to Cart" button (teal, full width)
- Affiliate: "Get My Link" button (amber, full width) + "Your commission: GMD {commission}" label above it

Commission calculation for affiliate view: (vendor_price - admin_price) × affiliate_commission_rate (from platform_settings)

Product images: horizontal scroll with dot indicator (expo-image for performance)

### Step 14: Vendor tier comparison on product detail
Extend app/(customer)/product/[id].tsx and app/(affiliate)/products/[id].tsx:

When multiple vendor_listings exist for the same product_id, show a "Also available from" section below the main product info:
- Query: SELECT * FROM vendor_listings WHERE product_id = $id AND is_active = true ORDER BY vendor_price ASC
- If count > 1: render a horizontal scrollable row of vendor option cards
- Each card: vendor name, vendor_price, badge (Lowest Price on cheapest, New Vendor if created within 30 days)
- Default selected vendor = lowest price listing
- Tapping a different vendor card: updates the displayed price, listing_id in state, and "Add to Cart" / "Get My Link" action
- If count = 1: section is hidden entirely (no empty state)
- Fire PostHog: vendor_tier_switched when customer selects a non-default vendor

### Step 15: Action dashboard for superadmin and admin
Replace the placeholder dashboard screens with actionable card dashboards:

app/(superadmin)/dashboard.tsx:
Query and render these event cards in order of urgency:
1. Pending vendor verifications: SELECT COUNT(*) FROM users WHERE role='vendor' AND status='pending' → card: "X vendors awaiting approval" [Review] button → navigates to admin vendor queue
2. Sponsored listings expiring today: SELECT * FROM featured_listings WHERE ends_at::date = CURRENT_DATE AND status='active' → card: "X sponsored listings expire today"
3. Unactioned customer requests: SELECT COUNT(*) FROM customer_requests WHERE status='open' → card: "X product requests from customers" [View Requests]
4. Orders stalled > 6h: SELECT orders where status NOT IN ('delivered','cancelled') AND updated_at < NOW() - INTERVAL '6 hours'
5. Stats row below cards: platform earnings today (sum commission_ledger where recipient_role='platform' and created_at::date = today), active vendors, orders today

app/(admin)/dashboard.tsx: same pattern but scoped to admin's vendors only.

Empty state when no pending cards: green checkmark + "All clear — platform running smoothly"

### Step 16: Pre-order request flow
app/(customer)/home.tsx: add "Can't find what you need?" text link at bottom of home feed and after empty search results.

app/(customer)/request.tsx (new screen):
- Description textarea (required, max 300 chars): "Describe what you're looking for"
- Category picker: fashion, electronics, other
- Budget input (optional): "Approximate budget in GMD"
- "Submit Request" button → inserts customer_requests record
- Success: Toast "Request sent! We'll notify you when it's available."

app/(superadmin)/promos/ (extend) and app/(admin)/vendors/ (extend):
Add "Requests" tab showing customer_requests ordered by created_at DESC.
Each row: description, category, budget, days since submitted, status badge.
Admin taps request → detail screen with "Mark Fulfilled" button (enter product_id) and "Add Note" option.
On fulfil: update status = 'fulfilled', set fulfilled_by = product_id, send Meta WhatsApp to customer: "Good news! What you requested is now available on Tems Market. Check it out!"
Fire PostHog: request_fulfilled { requestId, productId }

## Checkpoint 2 — stop here and verify
- [ ] bunx tsc --noEmit passes
- [ ] Superadmin adds a product with Groq auto-fill in < 5 seconds (test with real product photo)
- [ ] Admin sets admin_price; setting below base_price shows error and does not save
- [ ] Vendor completes onboarding including ID upload and OCR processing
- [ ] Admin sees vendor in queue with structured ID fields
- [ ] Admin approves vendor → ModemPay sub-account created → vendor WhatsApp sent → vendor pending screen auto-navigates to dashboard
- [ ] Vendor sets vendor_price on a product; setting below admin_price shows error and does not save
- [ ] Vendor listing appears in customer home feed
- [ ] Sponsored row hides gracefully when no active sponsored listings
- [ ] Customer sees correct price; affiliate sees correct commission amount on same product
- [ ] Vendor tier comparison shows when 2+ vendors list same product; hides when only 1
- [ ] Tapping different vendor updates price and listing_id correctly
- [ ] Action dashboard shows correct pending counts with working deep-link buttons
- [ ] Customer can submit a pre-order request; admin sees it in requests tab
- [ ] Admin fulfils request → customer receives WhatsApp notification
```

---

## ─────────────────────────────────────────────
## PHASE 3 PROMPT
## Paste after Checkpoint 2 passes. Plan Mode.
## ─────────────────────────────────────────────

```
Checkpoint 2 complete. Build the full transaction engine for Tems Market.

## What to build in this phase

### Step 1: Cart store and cart screen
Build store/cartStore.ts using Zustand with AsyncStorage persistence.
Cart items have: listingId, vendorId, title, price (vendor_price at add-to-cart time), imageUrl, quantity.
Cart store exposes: items, addItem (increments if already in cart), removeItem, updateQuantity, clearCart, total(), discountedTotal() (applies coupon + gift card reductions, min 0).
Also store: giftCardCode, giftCardBalance, couponCode, couponDiscount.

app/(customer)/cart.tsx:
- List of CartItem components: image, title, price × quantity, +/- quantity buttons, remove button
- Show subtotal
- Coupon code input: text field + "Apply" button (calls validate-coupon Edge Function)
- Gift card code input: text field + "Apply" button (calls validate-gift-card Edge Function)
- Show discounts as green line items: "Coupon {code}: -GMD X", "Gift card: -GMD Y"
- Show total after discounts
- "Checkout" button (disabled if cart empty)
- Cart badge on tab bar updates when items added

### Step 2: Coupon and gift card validation Edge Functions
supabase/functions/validate-coupon/index.ts:
- Accepts { code: string, orderTotal: number, userId: string }
- Requires auth
- Checks in order: code exists → status = 'active' → NOW() between valid_from and expires_at → uses_so_far < max_uses (if set) → user's uses < max_uses_per_user → order_total >= minimum_order_gmd
- If all pass: return { valid: true, discountAmount: number, couponId: string }
- If any fail: return { valid: false, error: 'expired' | 'max_uses_reached' | 'below_minimum' | 'already_used' | 'not_found' }
- Calculate discount: percentage type → orderTotal × (discount_value / 100), fixed_gmd type → min(discount_value, orderTotal)

supabase/functions/validate-gift-card/index.ts:
- Accepts { code: string }
- Requires auth
- Checks: code exists → status in ('active', 'partially_used') → NOW() < expires_at → remaining_balance > 0
- If valid: return { valid: true, remainingBalance: number, giftCardId: string }
- If invalid: return { valid: false, error: 'not_found' | 'expired' | 'fully_used' }

Wire these to the cart screen Apply buttons. Show inline error messages in red below the input. Show success in green with the discount amount.

### Step 3: Checkout screen + ModemPay payment
app/(customer)/checkout/index.tsx:
- Pre-fill delivery address from user profile (editable text input)
- Payment method selector: 4 large cards — QMoney, AfriMoney, Wave, Cash on Delivery
- Show order summary: items, subtotal, coupon discount, gift card discount, total due
- If discountedTotal = 0 (fully covered by gift card): show "No payment required" and skip payment method selector
- "Place Order" button

app/(customer)/checkout/payment.tsx:
- For mobile money: show ModemPay payment instructions (follow ModemPay's SDK or redirect flow)
- For COD: just show "Order placed!" confirmation

supabase/functions/create-payment/index.ts:
- Requires customer auth
- Accepts { listingId, quantity, deliveryAddress, paymentMethod, affiliateLinkId?, giftCardId?, giftCardAmount?, couponId?, couponDiscount? }
- Step 1: Calculate amounts (verify server-side — do NOT trust client totals)
  - Fetch vendor_listing to get vendor_price
  - total_amount = vendor_price × quantity
  - discounted_total = total_amount - couponDiscount (if valid) - giftCardAmount (if valid)
  - discounted_total cannot be < 0
- Step 2: Insert order record with payment_status = 'pending'
- Step 3a: If payment_method = 'cash' → update payment_status = 'pending_cod', return { success: true, orderId }
- Step 3b: If payment_method in ('qmoney', 'afrimoney', 'wave'):
  - Fetch vendor modempay_subaccount_id from vendor_profiles
  - Call ModemPay Payment Intent API with: amount = discounted_total, sub_account = vendor.modempay_subaccount_id, metadata = { order_id: orderId }
  - Update order with modempay_payment_id
  - Return { success: true, orderId, paymentUrl: modempay.payment_url }
- Step 3c: If discounted_total = 0 (full gift card cover) → treat as paid immediately, skip ModemPay
- Idempotency: if order already exists with same listingId + customerId within last 60 seconds, return existing order

### Step 4: ModemPay webhook handler
supabase/functions/modempay-webhook/index.ts:
This is the most critical function. Follow this sequence exactly:

1. Extract ModemPay signature header and verify against MODEMPAY_WEBHOOK_SECRET. Return 401 if invalid.
2. Parse event body. Extract order_id from metadata.
3. Idempotency: fetch order by id. If payment_status is already 'paid', return 200 immediately (already processed).
4. If event type is payment.success:
   a. Update orders.payment_status = 'paid'
   b. If order has gift_card_id: decrement gift_cards.remaining_balance by gift_card_amount. Update status to 'partially_used' or 'fully_used'. Insert gift_card_redemptions record.
   c. If order has coupon_id: increment coupons.uses_so_far. Insert coupon_uses record.
   d. Fetch order with listing → vendor_listing → price_layers → product (for category)
   e. Calculate commission rate by category:
      - affiliate_rate = 0.25 if product.category = 'fashion'
                       = 0.15 if product.category = 'electronics'
                       = 0.20 (default for all other categories)
   f. Calculate all payouts (universal 1% platform rule):
      - vendor_margin_gross      = vendor_price - admin_price
      - admin_margin_gross       = admin_price - base_price
      - affiliate_commission_gross = IF order.affiliate_link_id: vendor_margin_gross × affiliate_rate ELSE 0
      - platform_from_vendor     = vendor_margin_gross × 0.01
      - platform_from_admin      = admin_margin_gross × 0.01
      - platform_from_affiliate  = affiliate_commission_gross × 0.01
      - vendor_payout    = vendor_margin_gross - platform_from_vendor
      - admin_payout     = admin_margin_gross - platform_from_admin
      - affiliate_payout = affiliate_commission_gross - platform_from_affiliate
      - platform_total   = platform_from_vendor + platform_from_admin + platform_from_affiliate
   g. Insert commission_ledger records — ALL with status = 'pending' (not available yet):
      - { recipient_id: vendor_id, recipient_role: 'vendor', amount: vendor_payout, status: 'pending' }
      - { recipient_id: admin_id, recipient_role: 'admin', amount: admin_payout, status: 'pending' }
      - { recipient_id: superadmin_id, recipient_role: 'platform', amount: platform_total, status: 'pending' }
      - IF affiliate: { recipient_id: affiliate_id, recipient_role: 'affiliate', amount: affiliate_payout, status: 'pending' }
      -- IMPORTANT: status stays 'pending' until vendor marks order as 'delivered'
      -- On order status = 'delivered': update all ledger entries for this order to status = 'available'
      -- This mirrors how Amazon, ClickBank, and all major platforms hold commissions until fulfilment
   h. Send Meta WhatsApp to vendor: "🛒 New order! {customer_name} ordered {product_title} ×{quantity}. Check your app."
   i. Send Africa's Talking SMS to customer: "✅ Payment of GMD {amount} confirmed for Tems Market order #{short_order_id}."
5. Return 200.

Also create supabase/functions/release-commissions/index.ts:
- Called by update-order-status Edge Function when new status = 'delivered'
- UPDATE commission_ledger SET status = 'available' WHERE order_id = $orderId AND status = 'pending'
- Send Meta WhatsApp to each earning party:
  - Vendor: "💰 Your earnings of GMD {amount} are now available to withdraw."
  - Admin: "💰 Your earnings of GMD {amount} are now available to withdraw."
  - Affiliate (if any): "💰 Your commission of GMD {amount} is now available to withdraw."

Wrap entire handler in try/catch. Log all errors to console (Sentry picks them up). Never let an unhandled error return non-200 to ModemPay (could cause webhook retry loops).

### Step 5: Affiliate link generation and share sheet
hooks/useAffiliateLink.ts:
- Given listingId and current affiliateId
- Check affiliate_links table for existing record (affiliate_id + listing_id)
- If exists: return existing short_code
- If not: generate short_code with nanoid(10) (url-safe alphabet), insert affiliate_links record
- Return shareable URL: https://temsmarket.app/p/{short_code}

app/(affiliate)/products/[id].tsx:
- Product detail for affiliates (same layout as customer but CTA = "Get My Link")
- Show "Your commission: GMD {amount}" before the button
- Tap "Get My Link" → call useAffiliateLink hook → open ShareSheet
- Fire PostHog event: affiliate_link_generated with { affiliateId, listingId, productId }

components/affiliate/ShareSheet.tsx:
- Bottom sheet with sharing options
- WhatsApp: use Linking.openURL('whatsapp://send?text=' + encodeURIComponent(shareText + ' ' + url))
- Facebook: Linking.openURL('https://www.facebook.com/sharer/sharer.php?u=' + url)
- Copy to clipboard: expo-clipboard Clipboard.setStringAsync(url) + show "Copied!" toast
- Share natively: expo-sharing shareAsync(url)
- For each tap, fire PostHog event: affiliate_link_shared with { channel: 'whatsapp'|'facebook'|'copy'|'native', affiliateId, listingId }

app/p/[code].tsx (deep link handler):
- Read code from URL params
- Look up affiliate_links by short_code (via service role Edge Function to bypass RLS)
- Store affiliate_link_id in checkoutStore
- Navigate to app/(customer)/product/[listingId]
- Fire PostHog: affiliate_link_clicked with { shortCode, affiliateId }

### Step 6: Order tracking with Supabase Realtime
app/(customer)/orders/[id].tsx:
- Subscribe to orders table: .channel('order-{id}').on('postgres_changes', { event: 'UPDATE', filter: 'id=eq.{id}' })
- Show status timeline as vertical stepper: Placed → Confirmed → Preparing → Ready → Delivered
- Active step highlighted in teal, completed in teal with checkmark, future in gray

app/(vendor)/orders/index.tsx:
- List of orders for vendor's listings, sorted by created_at DESC
- Status chips for filtering: All, New, Preparing, Ready

app/(vendor)/orders/[id].tsx:
- Order detail: customer delivery address, product, quantity, total
- "Update Status" button: shows next status only (Confirmed → Preparing → Ready → Delivered)
- supabase/functions/update-order-status/index.ts:
  - Requires vendor auth
  - Validates this order belongs to vendor's listing
  - Updates order status
  - Sends Meta WhatsApp to customer based on new status

### Step 7: Wallet and payout screens
hooks/useWallet.ts:
- Queries commission_ledger for current user (recipient_id = auth.uid())
- Returns: pendingBalance (sum where status='pending'), totalPaidOut (sum where status='paid'), entries (array)

app/(vendor)/wallet.tsx, app/(affiliate)/payouts.tsx, app/(admin)/wallet.tsx:
All use the same BalanceCard and TransactionRow components.
- BalanceCard: large display of available balance, "Request Payout" CTA
- TransactionRow: order reference, amount, date, status badge
- Payout bottom sheet: mobile money number input (pre-filled from vendor_profile if vendor), amount = full pending balance, "Confirm Payout" button

supabase/functions/payout-commission/index.ts:
- Requires auth
- Accepts { walletProvider: 'wave' | 'afrimoney', accountNumber: string }
- Fetch sum of pending commission_ledger entries for this user
- If sum < 10: return { error: 'minimum_not_met', minimum: 10 }
- Call ModemPay Payouts API with amount and wallet details
- On success: update all pending commission_ledger entries to status='paid', set modempay_payout_id and paid_at
- Send Meta WhatsApp: "💸 GMD {amount} has been sent to your {provider} account {number}."
- Return { success: true, amount }

### Step 8: Gift card purchase flow
app/(customer)/checkout/gift-card.tsx:
- Denomination selector: preset buttons GMD 100, 200, 500, 1000 + "Custom amount" text input
- Recipient email input (required)
- Recipient name input (optional)
- Personal message textarea (optional, max 200 chars)
- "Preview" section shows how the email will look
- "Pay GMD {amount}" button → creates ModemPay payment intent for denomination amount
- On webhook success (new event type 'gift_card_purchase'): generate gift card code and send email

supabase/functions/send-gift-card-email/index.ts:
- Accepts { recipientEmail, recipientName, senderName, personalMessage, code, valueGmd, expiresAt }
- Calls Resend API with branded HTML email template
- Email content: Tems Market logo, "You received a gift card!", value display, code in large monospace font, personal message, expiry date, "Shop on Tems Market" button linking to https://temsmarket.app/redeem/{code}
- Log to notifications_log
- Env var: RESEND_API_KEY

### Step 9: Coupon management screens
app/(superadmin)/promos/coupons.tsx and extend admin screens:
- Create coupon form: code (auto-uppercase), type (percentage/fixed), value, minimum order, max uses, per-user limit, valid from (date picker), expires at (date picker)
- Coupon list with: code, type+value, uses_so_far/max_uses, status badge, "Pause" toggle, "Expire Now" button
- Insert to coupons table on save

### Step 10: Sponsored listing purchase
app/(vendor)/listings/promote/[id].tsx:
- Show current listing details
- Plan cards: "7 Days — GMD {sponsored_7day_price}" and "30 Days — GMD {sponsored_30day_price}" (prices from platform_settings)
- "Promote Now" → ModemPay payment intent for plan price
- On webhook payment success: insert featured_listings record with status='active', starts_at=now(), ends_at=now()+plan_days
- Vendor listings screen shows "🔥 Promoted — X days left" badge on active featured listings

supabase/functions/expire-featured/index.ts:
- Scheduled Edge Function (cron: every hour, configure in supabase/config.toml)
- UPDATE featured_listings SET status = 'expired' WHERE ends_at < NOW() AND status = 'active'

### Step 11: Wave screenshot top-up flow
supabase/functions/verify-wave-screenshot/index.ts:
- Requires customer auth
- Accepts { screenshotBase64, mimeType, claimedAmountGmd }
- Step 1: Upload screenshot to Supabase Storage private bucket (path: screenshots/{user_id}/{timestamp})
- Step 2: Call OCR Space API to extract raw text
  - If OCR returns < 30 chars: return { error: 'poor_quality', message: 'Screenshot unclear — please retake' }
- Step 3: Call Groq to structure OCR text:
  Prompt: "Extract from this Wave payment screenshot: { amount_gmd, tx_id, sender, recipient_number, timestamp_iso }. Return ONLY valid JSON."
- Step 4: Validate all three fraud checks:
  a. recipient_number matches platform_settings.wave_business_number → else { error: 'wrong_recipient' }
  b. amount_gmd >= platform_settings.credit_min_topup_gmd → else { error: 'below_minimum' }
  c. timestamp within platform_settings.screenshot_max_age_hours → else { error: 'screenshot_too_old' }
  d. wave_tx_id not in credit_transactions (UNIQUE constraint check) → else { error: 'already_used' }
- Step 5: On all validations pass:
  INSERT credit_transactions: type='top_up_screenshot', amount_gmd=0 (pending), screenshot_status='pending', wave_tx_id, wave_amount_extracted, screenshot_url
  Create MoMo Reconcile job with screenshot_url as proof, amount, user details
  Return { success: true, message: 'Screenshot received. Credits will be added after verification (~2h).' }

supabase/functions/momo-reconcile-webhook/index.ts (extend existing):
- Add handler for screenshot verification events:
  IF event.type === 'screenshot_verified':
    UPDATE credit_transactions: screenshot_status → 'verified', verified_at = now()
    UPDATE credit_wallets: balance += wave_amount_extracted
    INSERT credit_transactions: type='top_up_screenshot', amount_gmd=+wave_amount_extracted, balance_after=new_balance
    Send WhatsApp: "GMD {amount} credits added to your Tems wallet ✅"
  IF event.type === 'screenshot_rejected':
    UPDATE credit_transactions: screenshot_status → 'rejected', rejection_reason = reason
    Send WhatsApp: "We couldn't verify your payment. {reason}. Please contact support."

Top-up screen UI — app/(customer)/checkout/ (new screen: topup.tsx):
Two clear paths, Wave featured:

  [⭐ Pay with Wave — No platform fee]
    Send to: +220 XXX XXXX
    [Copy number]  [Show QR code]
    Amount: [input, min GMD 100]
    [I've sent — Upload my screenshot]

  [Pay instantly — 1.5% fee]
    [QMoney] [AfriMoney] [Wave via app] [Card]
    → ModemPay flow

Note: Checkout shortfall inline top-up ALWAYS uses ModemPay instant path.
      Wave screenshot only available from wallet top-up screen (not at checkout).

### Step 12: AI chat search — Groq-powered product discovery
supabase/functions/ai-product-search/index.ts:
- Requires auth
- Accepts { query: string }
- Fetch all active vendor_listings with product title, category, vendor_price (max 200 listings for context)
- Format as compact JSON array for Groq context
- Call Groq with:
  System: "You are a shopping assistant for Tems Market, a Gambian marketplace. Return ONLY valid JSON."
  User prompt: "Customer is looking for: '{query}'. Here are available products: {listings_json}. Return: { matches: [{ listing_id, reason }], count: 0-3, no_match_message?: string }"
- If matches: return listing_ids + reasons
- If no match: return { matches: [], no_match_message: "I couldn't find that — try browsing our fashion or electronics sections" }
- Fire PostHog ai_search_query, ai_search_no_results as appropriate

app/(customer)/home.tsx — add AI chat:
- Floating chat icon (bottom-right, teal, message bubble icon) on the home feed
- Tap opens a bottom sheet with a chat interface
- Input field at bottom: "Describe what you're looking for..."
- Send button → calls ai-product-search Edge Function → loading indicator while processing
- Results render as ProductCard components inside the chat thread, tappable to product detail
- "Can't find what you need? Request it →" link below no-match message → navigates to request screen
- Fire PostHog: ai_search_converted when user taps a result ProductCard

### Step 12: Zero-friction checkout redesign (Zemart lesson)
Replace existing checkout with a 4-step single-decision flow. Each step is its own screen with ONE primary action:

app/(customer)/checkout/step1-review.tsx (replaces cart.tsx checkout entry):
- Large product image cards with item name, quantity +/- controls, price per item
- Coupon + gift card inputs (collapsible, tap to expand)
- Subtotal and discounted total
- Single large "Checkout" button

app/(customer)/checkout/step2-address.tsx:
- Single TextInput pre-filled with saved address
- No other inputs on this screen
- "Confirm Address" button

app/(customer)/checkout/step3-payment.tsx:
- 4 large visual payment tiles arranged in a 2×2 grid:
  [QMoney logo tile] [AfriMoney logo tile]
  [Wave logo tile]   [Pay Cash tile]
- Selected tile gets a teal border + checkmark
- "Pay GMD {discountedTotal}" button — disabled until a tile is selected
- If discounted_total = 0 (full gift card cover): show "Free — covered by gift card 🎁" + "Confirm Order" button

app/(customer)/checkout/step4-processing.tsx:
- Shows selected payment provider logo, large animated spinner (Lottie)
- Text: "Waiting for {provider} confirmation..."
- No buttons — user completes payment on their mobile money app
- Supabase Realtime subscription on order.payment_status — when = 'paid': auto-navigate to success
- Timeout after 3 minutes: show "Taking too long?" with "Try again" and "Pay cash instead" options

app/(customer)/checkout/success.tsx:
- Full-screen teal background
- Large Lottie checkmark animation (plays once on mount)
- Order number in large text
- Two buttons: "Track My Order" (primary) and "Keep Shopping" (secondary, white outline)
- No other text — the animation says everything

app/(customer)/checkout/failed.tsx:
- Full-screen warm red background  
- X animation (Lottie)
- "Payment didn't go through" — one line
- Two buttons: "Try Again" and "Pay Cash Instead"

## Checkpoint 3 — stop here and verify
- [ ] bunx tsc --noEmit passes
- [ ] bunx jest --coverage — pricing.test 100%, gift-cards.test 100%, webhooks.test 90%+
- [ ] Full customer checkout (QMoney) in ModemPay sandbox: order created → webhook fires → payment_status = 'paid' → commission_ledger has entries → vendor WhatsApp sent → customer SMS sent
- [ ] Affiliate generates link for a product. Another affiliate generates link for same product — different short_code
- [ ] Customer taps affiliate link → correct product screen opens with affiliate_link_id in store → order placed → affiliate commission appears in earnings
- [ ] Vendor updates order status → customer tracking screen updates within 3 seconds (Realtime)
- [ ] Gift card purchased → Resend email delivered → code reduces checkout total → GMD 0 total possible
- [ ] Expired coupon rejected at checkout with clear error
- [ ] Valid coupon applies discount as line item
- [ ] Vendor pays for sponsored listing → appears in sponsored row → expires after ends_at
- [ ] Affiliate requests payout → ModemPay payout API called → WhatsApp confirmation → commission_ledger updated to 'paid'
- [ ] AI chat search returns matching ProductCards for "blue dress under GMD 800"
- [ ] AI chat no-match shows friendly message + "Request it" link
- [ ] Checkout completes in 4 screens with no instructional text — visual decisions only
- [ ] Success screen shows full-screen animation, not a text confirmation
- [ ] Failed payment shows "Try Again" and "Pay Cash Instead" options
```

---

## ─────────────────────────────────────────────
## PHASE 4 PROMPT
## Paste after Checkpoint 3 passes. Build Mode.
## ─────────────────────────────────────────────

```
Checkpoint 3 complete. Final polish and launch preparation.

### Step 1: All Meta WhatsApp Cloud API notifications audit
Verify every event in this list fires correctly. Add any missing Meta WhatsApp Cloud API calls:
- OTP login (SMS) ✓ (from Phase 1)
- Admin invite (SMS) ✓
- Vendor invite (SMS) ✓
- Vendor approved (WhatsApp)
- Vendor rejected (SMS)
- New order to vendor (WhatsApp)
- Order confirmed to customer (WhatsApp)
- Order preparing to customer (WhatsApp)
- Order ready to customer (WhatsApp)
- Order delivered to customer (WhatsApp)
- Payment confirmed to customer (SMS)
- Commission earned to affiliate (WhatsApp)
- Payout success (WhatsApp)
- Payout failed (SMS)

For any event with no WhatsApp implementation yet, add a Meta WhatsApp call in the relevant Edge Function. Use Meta WhatsApp Cloud API's sandbox for testing if WhatsApp Business API not yet approved.

### Step 2: RevenueCat vendor subscription
Install react-native-purchases.
Configure with REVENUECAT_API_KEY_IOS and REVENUECAT_API_KEY_ANDROID env vars.
Create "Vendor Monthly" entitlement in RevenueCat dashboard.
Add a subscription gate screen in app/(vendor)/onboarding/subscription.tsx that appears after account setup but before catalogue access.
On vendor tab bar load: check Purchases.getCustomerInfo() for active entitlement. If lapsed, show renewal screen instead of catalogue.

### Step 3: Marketing website (Next.js 15)
Create website/ directory with Next.js 15 app router + Tailwind v4.
Pages:
- app/page.tsx — landing page with: hero section ("Shop. Sell. Earn. — The Gambia's marketplace"), 3-role cards (Customer/Vendor/Affiliate), how it works steps, App Store + Play Store download buttons (use apple.com and play.google.com badge images), footer
- app/p/[code]/page.tsx — affiliate link landing: fetch listing details from Supabase public API, show product image + title + price, "Download Tems Market" with store buttons, fire PostHog event affiliate_link_clicked
- app/redeem/[code]/page.tsx — gift card landing: show gift card value + "Download Tems Market to use this gift card"

### Step 4: PostHog events audit
Verify these events fire with correct properties. Add any missing:
- app_started { role }
- affiliate_link_generated { affiliateId, listingId, productId }
- affiliate_link_shared { channel, affiliateId, listingId }
- affiliate_link_clicked { shortCode, affiliateId }
- product_viewed { productId, source: 'organic'|'affiliate_link'|'ai_search' }
- add_to_cart { productId, listingId, vendorId }
- checkout_started { orderTotal, paymentMethod }
- checkout_completed { orderId, amount, paymentMethod }
- checkout_failed { reason, paymentMethod }
- payout_requested { role, amount, walletProvider }
- vendor_onboarding_started
- vendor_onboarding_completed
- vendor_approved { vendorId }
- ai_search_query { query, resultsCount }
- ai_search_converted { query, listingId }
- ai_search_no_results { query }
- product_requested { category, budgetRange }
- vendor_tier_switched { productId, fromListingId, toListingId }
- request_fulfilled { requestId, productId }

### Step 5: Error handling and loading states
Audit every screen that makes an async call. Add where missing:
- LoadingSpinner shown during every async operation
- Empty state with retry button on every list screen when fetch fails
- Toast on every error (use the Toast component)
- Graceful offline handling on checkout (detect network error, show "Check your connection" not a crash)
Test: airplane mode during checkout → should show graceful error, not crash.

### Step 6: Security audit checklist
Verify each item:
- [ ] API keys absent from client bundle: build an APK/IPA and search compiled output for "sk_" or "key_" strings
- [ ] ModemPay webhook signature verified in modempay-webhook function (test with wrong signature → 401)
- [ ] set-vendor-price Edge Function rejects vendor_price < admin_price (test directly via curl bypassing app UI)
- [ ] set-admin-price Edge Function rejects admin_price < base_price
- [ ] id-documents Supabase Storage bucket has no public access (test: try to access a document URL without auth → 403)
- [ ] invite_tokens expire after 48h (test with a manually expired token)

Fix any failures before proceeding.

### Step 7: Performance
Enable Sentry Performance Monitoring.
Measure and fix if over target:
- Cold start (splash → first screen rendered): target < 3s on Android
- Product feed load: target < 2s
- Checkout intent creation: target < 2s

Common fixes: add React.memo to ProductCard, virtualise long lists with FlashList instead of FlatList, preload images with expo-image priority prop.

### Step 8: EAS Build
Configure eas.json for production profile.
Set bundle identifier: com.temsmarket.app (iOS), com.temsmarket.app (Android).
Run: eas build --platform all --profile production
Fix any build errors.

## Checkpoint 4 — LAUNCH READY
- [ ] bunx tsc --noEmit passes
- [ ] bunx jest --coverage — all thresholds met
- [ ] All 14 Meta WhatsApp Cloud API events verified
- [ ] RevenueCat subscription flow works in App Store sandbox
- [ ] Next.js website builds: bun build in website/
- [ ] All PostHog events verified in dashboard
- [ ] Security audit — all 6 items checked
- [ ] Cold start < 3s on physical mid-range Android
- [ ] eas build --platform all exits 0
```

---

## ─────────────────────────────────────────────
## FIX PROMPT (use when any task fails)
## ─────────────────────────────────────────────

```
Task T{X.Y} failed at the verify step.

Error / what went wrong:
{paste the exact error message or description}

Steps already tried:
{list what was attempted}

Do not move to the next task.
Diagnose this specific failure, fix it, and re-run the verify step exactly as written in TASKS.md.
Only mark this task complete when the verify step passes with no errors.
```

---

## ─────────────────────────────────────────────
## OPEN QUESTIONS (resolve before Phase 3)
## ─────────────────────────────────────────────

Before pasting the Phase 3 prompt, confirm these values so they can be hardcoded into the seed data and Edge Functions:

| # | Question | Where used |
|---|----------|-----------|
| 1 | ~~What is the platform_fee_rate?~~ **RESOLVED: 1% flat (0.01). Fixed. Not configurable in UI. Wave model.** | platform_settings seed ✅ |
| 2 | ~~What is the affiliate_commission_rate?~~ **RESOLVED: 25% fashion, 15% electronics, 20% all other. Calculated on vendor_margin not sale price.** | webhook ✅ |
| 3 | Sponsored listing prices: 7-day GMD ?, 30-day GMD ? | platform_settings seed, promote screen |
| 4 | Vendor monthly subscription price (GMD or USD for App Store)? | RevenueCat configuration |
| 5 | Gift card expiry: how many months from purchase? | gift card creation logic |
| 6 | Can one account be both Customer and Affiliate? (current spec: separate roles) | role-select screen, navigation logic |
| 7 | Has Meta WhatsApp Business API application been started? | Phase 1 notification testing |
