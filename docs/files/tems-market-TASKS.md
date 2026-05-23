# Tems Market — Implementation Plan & Task Breakdown

> This is Phase 2 (Plan) + Phase 3 (Tasks) of the spec-driven development workflow.
> Read alongside `tems-market-SPEC.md` (how we build) and `tems-market-PRD.md` (what we build).
> Do NOT begin a task until the previous task's verification step passes.
> Do NOT skip the verification step — it is part of the task, not optional.

---

## Phase 2: Implementation Plan

### Dependency Graph

This is the order constraints. Nothing in a later row can be built before everything
it depends on in earlier rows is complete and verified.

```
LAYER 0 — Environment (must exist before any code)
  └── Supabase project created + local dev running
  └── All environment variables in .env.local
  └── Expo app scaffolded with TypeScript + Expo Router
  └── NativeWind configured
  └── ESLint + Prettier + TypeScript strict configured

LAYER 1 — Database (everything reads/writes here)
  └── Migration 001: all tables created
  └── Migration 002: all RLS policies
  └── Migration 003: all indexes
  └── Migration 004: platform_settings seed (commission rates, prices)
  └── Supabase types auto-generated → types/supabase.ts

LAYER 2 — Auth (every screen requires an authenticated user with a role)
  └── Phone OTP login (Supabase Auth + Twilio Edge Function)
  └── Role detection on login → correct navigator mounted
  └── Superadmin password + OTP
  └── Invite deep link handler (admin + vendor)
  └── Session persistence

LAYER 3 — Navigation Shell (role-based tab bars, empty screens)
  └── Superadmin tab navigator (5 tabs, placeholder screens)
  └── Admin tab navigator (5 tabs, placeholder screens)
  └── Vendor tab navigator + onboarding gate (pending screen)
  └── Affiliate tab navigator (5 tabs, placeholder screens)
  └── Customer tab navigator (5 tabs, placeholder screens)

  ↓ CHECKPOINT 1: All 5 roles reach their ready-state screen ↓

LAYER 4 — Core Commerce (products must exist before anything else)
  └── Supabase Storage buckets (products, id-documents)
  └── Groq vision Edge Function
  └── OCR Space + Groq document Edge Function
  └── Superadmin: add product screen (photo → Groq → form → save)
  └── Superadmin: product list + edit
  └── Admin: set admin margin per product (price_layers)
  └── Vendor: onboarding screens (business info, ID upload, payout, pending)
  └── Vendor: admin review + approve/reject + ModemPay sub-account creation
  └── Vendor: browse catalogue + set vendor price (vendor_listings)

  ↓ CHECKPOINT 2: Vendor has a live listing visible to customers ↓

LAYER 5 — Transactions (requires listings to exist)
  [Sequential sub-chain]:
  └── Cart store (Zustand)
  └── Checkout screen (address, payment method selector)
  └── ModemPay Payment Intent creation Edge Function
  └── ModemPay webhook handler Edge Function (order update + commission split)
  └── Affiliate link generation (short_code, deep link, web landing page)
  └── Affiliate share sheet
  └── Order status management (vendor updates → Supabase Realtime → customer)

  [Parallel — can build simultaneously once webhook is working]:
  ├── Gift card purchase flow (ModemPay → code gen → Resend email)
  ├── Gift card redemption at checkout (full + partial + mixed)
  ├── Coupon creation (admin screen) + validation Edge Function
  ├── Coupon redemption at checkout
  ├── Sponsored listing purchase flow
  └── Payout request flow (commission_ledger → ModemPay Payouts API)

  ↓ CHECKPOINT 3: Money moves — full checkout + payout verified in sandbox ↓

LAYER 6 — Polish & Launch (requires all features working)
  └── RevenueCat vendor subscription
  └── PostHog event tracking across all key flows
  └── All Twilio + Resend notification events wired
  └── Error handling + loading states on all async operations
  └── Marketing website (Next.js) with /p/[code] affiliate landing pages
  └── Performance audit
  └── Security audit (RLS, API key exposure, webhook signatures)
  └── EAS build + store submission

  ↓ CHECKPOINT 4: Production builds submitted to App Store + Play Store ↓
```

### Sequential vs Parallel Work

| Task Group | Mode | Reason |
|------------|------|--------|
| Schema migrations | Sequential | Each migration depends on the previous |
| Auth + Navigation | Sequential | Auth must exist before any screen |
| Groq + OCR Edge Functions | Parallel | Independent Edge Functions |
| Vendor onboarding + Superadmin product upload | Parallel | Both use Groq but don't depend on each other |
| Gift cards + Coupons + Sponsored listings | Parallel | All depend on checkout but not on each other |
| Twilio + Resend notifications | Parallel | Independent notification channels |
| PostHog + Sentry | Parallel | Both are observability, no dependency between them |

### Risk Register

| Risk | Mitigation | Task reference |
|------|-----------|----------------|
| ModemPay webhook unreachable in local dev | Use `bunx supabase functions serve` + ngrok to expose local webhook URL during testing | T3.4 |
| Groq vision returns malformed JSON | Wrap parse in try/catch, fallback to empty form; add `JSON.parse` safety via regex strip of markdown fences | T2.3 |
| OCR Space returns garbled text on poor photos | Prompt vendor to retake; admin has "Enter manually" fallback path | T2.7 |
| Deep link not opening app on Android | Test App Links verification file (`/.well-known/assetlinks.json`) on website early | T3.6 |
| Twilio WhatsApp approval delay (1-2 weeks) | Apply for WhatsApp Business API on Day 1; all events have SMS fallback | T1.5 |
| RLS policy gap exposes data | Write integration test for each role attempting cross-role read — runs in CI | T1.8 |
| Gift card code collision | Use `nanoid` with 16-char alphanumeric; probability negligible but add DB unique constraint | T3.9 |
| Affiliate short_code collision | Same — unique constraint on `affiliate_links.short_code` + retry on conflict | T3.6 |

---

## Phase 3: Task Breakdown

> Format:
> - [ ] **Task N.N: Title**
>   - **What:** What to build
>   - **Acceptance:** What must be true when done
>   - **Verify:** Exact command or manual check
>   - **Files:** Which files are created or modified

---

## Milestone 0 — Environment Setup

- [ ] **T0.1: Create Supabase project and configure local dev**
  - **What:** Create a new Supabase project (cloud), install Supabase CLI, initialise local dev
  - **Acceptance:** `bunx supabase start` runs and the local Studio is accessible at localhost:54323. Cloud project URL and anon key are confirmed.
  - **Verify:** `curl http://localhost:54321/rest/v1/` returns a 200
  - **Files:** `supabase/config.toml`

- [ ] **T0.2: Scaffold Expo app with TypeScript and Expo Router**
  - **What:** Create Expo app with blank TypeScript template, install Expo Router, configure file-based routing
  - **Acceptance:** `bunx expo start` runs, index screen renders "Welcome to Tems Market" in simulator
  - **Verify:** iOS/Android simulator shows root screen with no red errors
  - **Files:** `app/_layout.tsx`, `app/index.tsx`, `app.json`, `package.json`, `tsconfig.json`

- [ ] **T0.3: Configure NativeWind (Tailwind for React Native)**
  - **What:** Install and configure NativeWind v4, add design tokens (colors from SPEC)
  - **Acceptance:** A test component using `className="bg-teal-700 text-white"` renders with the correct colour in simulator
  - **Verify:** Manual visual check in simulator
  - **Files:** `tailwind.config.ts`, `global.css`, `babel.config.js`, `metro.config.js`

- [ ] **T0.4: Configure TypeScript strict mode + ESLint + Prettier**
  - **What:** Set `"strict": true` in tsconfig, install eslint + prettier + expo lint config, add no-any rule
  - **Acceptance:** `bunx tsc --noEmit` passes on fresh scaffold. `bunx eslint .` passes with no errors.
  - **Verify:** `bunx tsc --noEmit && bunx eslint .`
  - **Files:** `tsconfig.json`, `eslint.config.js`, `prettier.config.js`, `.eslintignore`

- [ ] **T0.5: Configure environment variables**
  - **What:** Create `.env.example` with all variable names (no values), create `.env.local` with real values, add `.env.local` to `.gitignore`, add startup check that required vars exist
  - **Acceptance:** App startup logs a warning if any required env var is missing. `.env.local` is in `.gitignore`.
  - **Verify:** Temporarily delete one env var → app logs warning. `git status` does not show `.env.local`.
  - **Files:** `.env.example`, `.env.local` (not committed), `.gitignore`, `constants/config.ts`

- [ ] **T0.6: Initialise Sentry and PostHog**
  - **What:** Install `@sentry/react-native` and `posthog-react-native`, wrap root layout with both providers, verify events appear in dashboards
  - **Acceptance:** A manually triggered `Sentry.captureMessage('test')` appears in Sentry dashboard. A `posthog.capture('app_started')` event appears in PostHog.
  - **Verify:** Check both dashboards manually after one app start
  - **Files:** `app/_layout.tsx`, `lib/analytics/posthog.ts`, `sentry.config.ts`

---

## Milestone 1 — Database & Auth (Checkpoint 1)

- [ ] **T1.1: Write and run migration 001 — all tables**
  - **What:** Create all tables from PRD Section 4: `users`, `vendor_profiles`, `products`, `price_layers`, `vendor_listings`, `affiliate_links`, `orders`, `featured_listings`, `gift_cards`, `gift_card_redemptions`, `coupons`, `coupon_uses`, `commission_ledger`, `notifications_log`, `platform_settings`
  - **Acceptance:** `bunx supabase db reset` runs with zero errors. All tables visible in local Studio.
  - **Verify:** `bunx supabase db reset` exits 0. Check Studio at localhost:54323.
  - **Files:** `supabase/migrations/001_initial_schema.sql`

- [ ] **T1.2: Write and run migration 002 — RLS policies**
  - **What:** Enable RLS on all tables. Write policies per PRD Section 8 RLS summary. Superadmin reads all. Each role reads/writes only their own data.
  - **Acceptance:** `bunx supabase db reset` runs cleanly. An anon request to `vendor_profiles` returns 0 rows, not an error.
  - **Verify:** `bunx supabase db reset` exits 0
  - **Files:** `supabase/migrations/002_rls_policies.sql`

- [ ] **T1.3: Write and run migration 003 — indexes**
  - **What:** Add all indexes listed in PRD Section 4: phone, role, short_code, status+ends_at, etc.
  - **Acceptance:** `bunx supabase db reset` runs cleanly. `EXPLAIN ANALYZE` on `affiliate_links WHERE short_code = 'abc'` shows index scan.
  - **Verify:** `bunx supabase db reset` exits 0
  - **Files:** `supabase/migrations/003_indexes.sql`

- [ ] **T1.4: Write and run migration 004 — seed platform_settings**
  - **What:** Insert default platform settings: `platform_fee_rate`, `affiliate_commission_rate`, `sponsored_7day_price_gmd`, `sponsored_30day_price_gmd`. Values confirmed from Open Question #1-3.
  - **Acceptance:** `SELECT * FROM platform_settings` in Studio returns the seed rows.
  - **Verify:** Query in local Studio
  - **Files:** `supabase/migrations/004_seed_data.sql`

- [ ] **T1.5: Generate Supabase TypeScript types**
  - **What:** Run `bunx supabase gen types typescript --local > types/supabase.ts`. Set up as a post-migration script.
  - **Acceptance:** `types/supabase.ts` exists and contains typed definitions for all tables.
  - **Verify:** `bunx tsc --noEmit` passes after generation
  - **Files:** `types/supabase.ts`, `package.json` (add gen script)

- [ ] **T1.6: Build Supabase client singleton**
  - **What:** Create `lib/supabase/client.ts` — Supabase client using env vars, configured for React Native with AsyncStorage session persistence. Export as named singleton `supabase`.
  - **Acceptance:** Importing `supabase` and calling `supabase.from('platform_settings').select()` returns data in a test component.
  - **Verify:** Manual test in a temporary screen
  - **Files:** `lib/supabase/client.ts`

- [ ] **T1.7: Build send-otp Edge Function (Twilio)**
  - **What:** Create `supabase/functions/send-otp/index.ts`. Accepts `{ phone }`. Validates phone, calls Twilio Verify API to send 6-digit OTP SMS. Rate limited: max 3 per phone per 10 minutes (track in a temp table or Supabase rate-limit pattern).
  - **Acceptance:** POST to `/functions/v1/send-otp` with a real phone number delivers an SMS within 30 seconds.
  - **Verify:** Manual test with a real phone number on local functions serve + ngrok
  - **Files:** `supabase/functions/send-otp/index.ts`

- [ ] **T1.8: Build auth screens — Welcome, Role Select, Phone, OTP, Register**
  - **What:** Build the full auth flow for self-registering users (Customer + Affiliate):
    - `(auth)/welcome.tsx` — logo, "Shop" / "Earn commissions" / "Sign In"
    - `(auth)/role-select.tsx` — two clear paths
    - `(auth)/login.tsx` — phone number input + PhoneInput component
    - `(auth)/otp.tsx` — 6-digit OTP input + OTPInput component, verify via Supabase Auth
    - `(auth)/register.tsx` — full name + password for new accounts
    - On success: write role to `users.role`, navigate to correct role navigator
  - **Acceptance:** A new user can sign up as Customer end-to-end and reach the (customer) tab bar. A new Affiliate can sign up and reach the (affiliate) tab bar.
  - **Verify:** Manual flow in simulator for both paths
  - **Files:** `app/(auth)/welcome.tsx`, `app/(auth)/role-select.tsx`, `app/(auth)/login.tsx`, `app/(auth)/otp.tsx`, `app/(auth)/register.tsx`, `components/auth/PhoneInput.tsx`, `components/auth/OTPInput.tsx`, `lib/supabase/auth.ts`, `store/authStore.ts`

- [ ] **T1.9: Build role-based root navigator**
  - **What:** `app/_layout.tsx` checks auth state on mount. If no session → redirect to `(auth)/welcome`. If session → read `users.role` → mount correct navigator. Handles loading state while auth check runs. Persist session via AsyncStorage.
  - **Acceptance:** Closing and reopening the app with an active session skips auth and lands directly on the correct role dashboard.
  - **Verify:** Login as Customer, kill app, reopen — should skip welcome screen
  - **Files:** `app/_layout.tsx`, `app/index.tsx`, `hooks/useAuth.ts`

- [ ] **T1.10: Build Superadmin login (password + OTP)**
  - **What:** Superadmin email + password login screen (not role-select path). After password auth, Twilio OTP sent as 2FA. Both must succeed to reach superadmin dashboard.
  - **Acceptance:** Superadmin can log in with correct email + password + OTP and reaches the superadmin tab bar. Wrong password shows error. Wrong OTP shows error.
  - **Verify:** Manual test with superadmin credentials
  - **Files:** `app/(auth)/login.tsx` (extend with superadmin path), `supabase/functions/send-otp/index.ts` (extend for 2FA flow)

- [ ] **T1.11: Build invite-user Edge Function**
  - **What:** `supabase/functions/invite-user/index.ts`. Accepts `{ phone, role: 'admin' | 'vendor', invitedBy }`. Creates user record with status = 'pending' and role. Generates a signed invite token (stored in Supabase, expires in 48h). Sends Twilio SMS with deep link: `temsmarket://invite/{token}` or `https://temsmarket.app/invite/{token}`.
  - **Acceptance:** Calling the function with a phone number sends an SMS with a working deep link within 30 seconds.
  - **Verify:** Manual call via Supabase Studio → check SMS on test phone
  - **Files:** `supabase/functions/invite-user/index.ts`

- [ ] **T1.12: Build invite deep link handler**
  - **What:** `app/(auth)/invite/[token].tsx`. When app opens from invite deep link, reads token, validates against DB, shows account setup screen (name + password). On completion, updates user status from 'pending' to 'active'. Admin goes to admin navigator. Vendor goes to vendor onboarding.
  - **Acceptance:** Tapping the invite SMS link on a device without an account opens the app to the setup screen. Completing setup navigates to the correct role's first screen.
  - **Verify:** Manual test: send invite SMS, tap link on simulator, complete setup
  - **Files:** `app/(auth)/invite/[token].tsx`, `app.json` (deep link scheme), `lib/supabase/auth.ts`

- [ ] **T1.13: Build navigation shells for all 5 roles (placeholder screens)**
  - **What:** Create the tab navigators for all 5 roles with placeholder content screens. Each tab renders a screen with just the tab name as text. No real content yet.
    - Superadmin: Dashboard, Products, Users, Orders, Settings
    - Admin: Dashboard, Vendors, Catalogue, Orders, Wallet
    - Vendor: Dashboard, Catalogue, Listings, Orders, Wallet
    - Affiliate: Earnings, Products, My Links, Payouts, Profile
    - Customer: Home, Search, Cart, Orders, Profile
  - **Acceptance:** Every role reaches their tab bar after auth. All tabs are tappable with no crashes.
  - **Verify:** Manual test for each role
  - **Files:** All `_layout.tsx` files under `(superadmin)`, `(admin)`, `(vendor)`, `(affiliate)`, `(customer)`

- [ ] **T1.14: Write RLS integration tests**
  - **What:** Write integration tests that sign in as each role and verify they CANNOT read data belonging to other roles. E.g. customer cannot read `vendor_profiles`, vendor cannot read another vendor's `commission_ledger`.
  - **Acceptance:** All tests pass. Any RLS gap discovered is fixed before Checkpoint 1.
  - **Verify:** `bunx jest __tests__/integration/rls.test.ts`
  - **Files:** `__tests__/integration/rls.test.ts`

### ✅ CHECKPOINT 1
```
Run:  bunx tsc --noEmit && bunx jest
Pass: All 5 roles reach their tab bar screen
Pass: RLS integration tests all green
Pass: Sentry and PostHog both show events
Pass: Invite SMS delivers and deep link opens app
```

---

## Milestone 2 — Core Commerce (Checkpoint 2)

- [ ] **T2.1: Create Supabase Storage buckets**
  - **What:** Create two buckets in Supabase Storage: `product-images` (public) and `id-documents` (private, accessible only by admin/superadmin via RLS). Configure CORS and file size limits (product-images: 5MB max, id-documents: 10MB max).
  - **Acceptance:** A test upload to `product-images` returns a public URL accessible in a browser. A test upload to `id-documents` returns a signed URL (not public).
  - **Verify:** Manual upload test via Supabase Studio
  - **Files:** `supabase/migrations/005_storage_buckets.sql` (or via Studio)

- [ ] **T2.2: Build shared UI components — design system primitives**
  - **What:** Build the base component library: `Button`, `Input`, `Card`, `Badge`, `LoadingSpinner`, `EmptyState`, `Toast`. All use NativeWind classes and the design tokens from SPEC.
  - **Acceptance:** A component story screen (temporary screen) renders all components without errors.
  - **Verify:** Manual visual check in simulator. `bunx jest components/ui/` passes.
  - **Files:** All files under `components/ui/`

- [ ] **T2.3: Build Groq vision Edge Function**
  - **What:** `supabase/functions/groq-vision/index.ts`. Accepts `{ imageBase64, mimeType }`. Requires auth header. Calls Groq LLaMA vision with the prompt from SPEC Section "Groq Vision Integration". Returns `{ title, description, category, suggested_price_gmd }` as clean JSON. Handles malformed Groq output gracefully (strip markdown fences, fallback to `{}`).
  - **Acceptance:** POST with a base64 product photo returns a valid JSON object with all four fields in < 5 seconds. Malformed response returns `{}` not a 500.
  - **Verify:** `bunx supabase functions serve` + curl test with a real product image
  - **Files:** `supabase/functions/groq-vision/index.ts`

- [ ] **T2.4: Build Superadmin — Add Product screen**
  - **What:** `app/(superadmin)/products/add.tsx`. Flow: camera/gallery picker → image uploaded to Supabase Storage → base64 sent to groq-vision Edge Function → form pre-filled with title/description/category/suggested_price → superadmin sets `base_price` → save creates product record with `inventory_type = 'tems_owned'` and `status = 'draft'`.
    - Include loading state during Groq processing ("Reading your product...")
    - All form fields editable after Groq fills them
    - Validation: base_price > 0 required
  - **Acceptance:** Uploading a shoe photo auto-fills "Nike Air Max" style title, 2-sentence description, category "fashion", suggested price. Saving creates a product record in Supabase with the image URL.
  - **Verify:** Manual test. Check product row in Studio.
  - **Files:** `app/(superadmin)/products/add.tsx`, `lib/groq/vision.ts`, `lib/supabase/products.ts`, `components/product/ProductImages.tsx`

- [ ] **T2.5: Build Superadmin — Product list and edit screens**
  - **What:** `app/(superadmin)/products/index.tsx` — paginated list of all products with status badge, base_price, category. `app/(superadmin)/products/[id].tsx` — edit all product fields + toggle active/inactive + view full price layer stack (base → admin price → vendor prices).
  - **Acceptance:** All products list and paginate. Edit saves correctly. Price layer view shows correct values from `price_layers` and `vendor_listings`.
  - **Verify:** Manual test — add product, view list, edit, check price layer view
  - **Files:** `app/(superadmin)/products/index.tsx`, `app/(superadmin)/products/[id].tsx`

- [ ] **T2.6: Build Admin — Set margin screen (Catalogue tab)**
  - **What:** `app/(admin)/catalogue/index.tsx`. Lists all active products with their base_price. Admin taps a product → sees base_price, enters their admin_price (must be ≥ base_price). On save, creates/updates `price_layers` record. Server-side enforcement: Edge Function validates admin_price >= base_price before writing.
  - **Acceptance:** Admin can set admin_price. Setting a price below base_price shows a clear error ("Price must be at least GMD X") and does not save. Correct data written to `price_layers`.
  - **Verify:** Try to save below-floor price → error. Save valid price → check Studio.
  - **Files:** `app/(admin)/catalogue/index.tsx`, `supabase/functions/set-admin-price/index.ts`, `lib/supabase/products.ts`

- [ ] **T2.7: Build OCR + Groq document Edge Function**
  - **What:** `supabase/functions/ocr-document/index.ts`. Accepts `{ imageBase64, mimeType }`. Requires auth. Calls OCR Space API to extract raw text from the image. Passes raw text to Groq with prompt: "Structure this ID document text into JSON: { full_name, id_number, date_of_birth, document_type }. Return only valid JSON." Returns structured object. On bad OCR (< 20 chars extracted), returns `{ error: 'poor_quality' }` so client can prompt retake.
  - **Acceptance:** POST with a clear ID photo returns a structured JSON object. POST with a blurry/dark photo returns `{ error: 'poor_quality' }`.
  - **Verify:** `bunx supabase functions serve` + curl tests with two photos (clear and blurry)
  - **Files:** `supabase/functions/ocr-document/index.ts`

- [ ] **T2.8: Build Vendor — Onboarding flow screens**
  - **What:** Four-screen flow after invite deep link completes (vendor account created). Gate: vendor with `status = 'pending'` always lands here first.
    - `(vendor)/onboarding/business-info.tsx` — business name, category select
    - `(vendor)/onboarding/id-upload.tsx` — camera/gallery → ocr-document Edge Function → show structured preview → "Does this look right?" → if "Retake", loop. Upload raw image to `id-documents` bucket.
    - `(vendor)/onboarding/payout-setup.tsx` — select Wave or AfriMoney, enter account number
    - `(vendor)/onboarding/pending.tsx` — "Your application is under review" — polling `users.status` every 30s via Supabase Realtime subscription, auto-navigates to vendor dashboard when approved
  - **Acceptance:** Full onboarding flow completes, vendor_profile record created in Supabase with id_document_url and id_structured. Vendor lands on pending screen and stays there until admin approves.
  - **Verify:** Complete flow manually → check vendor_profiles in Studio
  - **Files:** All four onboarding screens, `lib/ocr/space.ts`, `lib/supabase/auth.ts`

- [ ] **T2.9: Build Admin — Vendor verification queue**
  - **What:** `app/(admin)/vendors/queue.tsx` — list of vendors with `status = 'pending'`. `app/(admin)/vendors/[id].tsx` — review screen showing: business name, structured ID fields (from `id_structured`), "View Raw ID Photo" option (signed URL from private bucket), Approve / Reject buttons. Reject requires a reason text input.
  - **Acceptance:** Pending vendors appear in queue. Tapping one shows structured ID data. Approve button is clickable. Reject requires a reason.
  - **Verify:** Complete the vendor onboarding in T2.8 → confirm vendor appears in admin queue
  - **Files:** `app/(admin)/vendors/queue.tsx`, `app/(admin)/vendors/[id].tsx`

- [ ] **T2.10: Build create-sub-account Edge Function + approval flow**
  - **What:** `supabase/functions/create-sub-account/index.ts`. Called by admin when approving a vendor. Calls ModemPay sub-account creation API with `{ business_name, percentage, settlement_code, account_number }`. Stores returned sub-account ID in `vendor_profiles.modempay_subaccount_id`. Updates `users.status = 'active'`. Sends Twilio WhatsApp to vendor: "Your account is approved!"
    - If rejected: updates status to 'rejected', sends Twilio SMS with reason.
  - **Acceptance:** Approving a vendor in the admin UI calls ModemPay, stores sub-account ID, vendor transitions from pending screen to their dashboard automatically (via Realtime from T2.8). WhatsApp message delivered.
  - **Verify:** Full flow: vendor pending → admin approves → vendor dashboard loads. Check modempay_subaccount_id in Studio.
  - **Files:** `supabase/functions/create-sub-account/index.ts`, `app/(admin)/vendors/[id].tsx` (wire approval/rejection buttons)

- [ ] **T2.11: Build Vendor — Catalogue browse + set price screens**
  - **What:** `app/(vendor)/catalogue/index.tsx` — grid of all products that have an admin_price set (i.e. `price_layers` record exists). Shows product image, title, admin_price as "Your cost". `app/(vendor)/catalogue/[id].tsx` — product detail with price slider/input. Shows: admin_price (floor, read-only), vendor_price input (enforced min = admin_price), live preview "You earn GMD X per sale" (vendor_price - admin_price). Save creates/updates `vendor_listings` record.
    - Server-side enforcement: Edge Function must reject vendor_price < admin_price
  - **Acceptance:** Vendor can set price above admin_price and see margin. Trying to set price below admin_price shows error and does not save. vendor_listings record created on save.
  - **Verify:** Set valid price → check vendor_listings in Studio. Set invalid price → error shown, no record created.
  - **Files:** `app/(vendor)/catalogue/index.tsx`, `app/(vendor)/catalogue/[id].tsx`, `supabase/functions/set-vendor-price/index.ts`, `lib/utils/pricing.ts`, `__tests__/lib/pricing.test.ts`

- [ ] **T2.12: Build Vendor — Submit own product screen**
  - **What:** `app/(vendor)/listings/add.tsx`. Same Groq vision flow as superadmin product add (T2.4), but saves with `inventory_type = 'vendor_submitted'`, `status = 'pending_review'`, `submitted_by_vendor = vendor.id`. Product appears in Admin's approval queue (extend admin catalogue screen to show pending vendor submissions with Approve/Reject).
  - **Acceptance:** Vendor submits product → appears in admin queue → admin approves → product gets `status = 'active'` → admin can then set admin_price on it.
  - **Verify:** Full flow: vendor submits → admin approves → product visible in catalogue
  - **Files:** `app/(vendor)/listings/add.tsx`, `app/(admin)/catalogue/index.tsx` (extend)

- [ ] **T2.13: Build Customer — Home feed with product grid**
  - **What:** `app/(customer)/home.tsx`. Shows: featured/sponsored row (horizontal scroll, `featured_listings` with `status = active`), category filter chips, product grid of all active `vendor_listings`. `ProductCard` component used. Infinite scroll pagination. Pull-to-refresh.
  - **Acceptance:** Home feed renders active listings. Sponsored row shows promoted listings with "Sponsored" badge. Category filter correctly filters products. Pull-to-refresh works.
  - **Verify:** Create a test listing → appears in feed. Test sponsored row with a test featured_listing record.
  - **Files:** `app/(customer)/home.tsx`, `components/product/ProductCard.tsx`, `components/product/SponsoredBadge.tsx`, `hooks/useProducts.ts`

- [ ] **T2.14: Build Product detail screen (shared across Customer + Affiliate)**
  - **What:** `app/(customer)/product/[id].tsx` and `app/(affiliate)/products/[id].tsx`. Shows: image carousel, title, vendor_price (customers), commission preview (affiliates), description, vendor name, "Add to Cart" (customer) / "Get My Link" (affiliate).
  - **Acceptance:** Product detail renders correctly for both roles. Customer sees "Add to Cart". Affiliate sees "Get My Link" and their commission amount.
  - **Verify:** Manual test for both roles
  - **Files:** `app/(customer)/product/[id].tsx`, `app/(affiliate)/products/[id].tsx`, `components/product/PriceDisplay.tsx`, `components/product/ProductImages.tsx`

### ✅ CHECKPOINT 2
```
Run:  bunx tsc --noEmit && bunx jest
Pass: Vendor has a published listing visible in customer home feed
Pass: Superadmin can add product with Groq auto-fill
Pass: Admin can approve vendor (ModemPay sub-account created)
Pass: Vendor price enforcement works server-side (integration test)
```

---

## Milestone 3 — Transactions (Checkpoint 3)

- [ ] **T3.1: Build cart store and cart screen**
  - **What:** Implement `store/cartStore.ts` (from SPEC code example). Build `app/(customer)/cart.tsx` — list CartItems with quantity controls, subtotal, gift card input (hidden until checkout step), coupon input, proceed to checkout button. `CartItem` component.
  - **Acceptance:** Adding products from product detail updates cart badge on tab bar. Quantity adjusts correctly. Cart persists across app restarts (Zustand + AsyncStorage).
  - **Verify:** Add 2 items, kill app, reopen — cart items still present. Quantity +/- works.
  - **Files:** `store/cartStore.ts`, `app/(customer)/cart.tsx`, `components/checkout/CartItem.tsx`

- [ ] **T3.2: Build CouponInput and GiftCardInput components**
  - **What:** `components/checkout/CouponInput.tsx` — text input + "Apply" button. On apply, calls `validate-coupon` Edge Function (T3.3). Shows discount as green line item or error in red. `components/checkout/GiftCardInput.tsx` — same pattern for gift card code validation. Both update `checkoutStore`.
  - **Acceptance:** Valid coupon code applies discount and shows line item. Invalid/expired code shows clear error. Valid gift card reduces total (including to GMD 0).
  - **Verify:** Unit tests for both components. Manual test with test coupon + gift card.
  - **Files:** `components/checkout/CouponInput.tsx`, `components/checkout/GiftCardInput.tsx`, `store/checkoutStore.ts`, `__tests__/components/CouponInput.test.tsx`, `__tests__/components/GiftCardInput.test.tsx`

- [ ] **T3.3: Build validate-coupon and validate-gift-card Edge Functions**
  - **What:** `supabase/functions/validate-coupon/index.ts` — accepts `{ code, order_total, user_id }`. Checks: code exists, active, within dates, under max_uses, under per-user limit, order_total >= minimum. Returns `{ valid, discount_amount, error_reason }`. `supabase/functions/validate-gift-card/index.ts` — accepts `{ code }`. Returns `{ valid, remaining_balance, error_reason }`.
  - **Acceptance:** Both Edge Functions return correct responses for valid and all invalid scenarios. Invalid scenarios: expired, max uses reached, below minimum, wrong format.
  - **Verify:** `bunx jest __tests__/lib/coupons.test.ts` and `__tests__/lib/gift-cards.test.ts`
  - **Files:** `supabase/functions/validate-coupon/index.ts`, `supabase/functions/validate-gift-card/index.ts`, `__tests__/lib/coupons.test.ts`, `__tests__/lib/gift-cards.test.ts`

- [ ] **T3.4: Build checkout screen and ModemPay Payment Intent Edge Function**
  - **What:** `app/(customer)/checkout/index.tsx` — confirm delivery address, select payment method (QMoney/AfriMoney/Wave/COD). `supabase/functions/create-payment/index.ts` — creates order record in `orders` table with status = 'placed', then calls ModemPay Payment Intent API with `{ amount: discounted_total, sub_account: vendor.modempay_subaccount_id, metadata: { order_id } }`. Returns `{ payment_url, payment_id }`.
    - COD path: creates order with `payment_method = 'cash'`, `payment_status = 'pending_cod'` — no ModemPay call.
    - Mixed path (gift card + mobile money): ModemPay amount = discounted_total after gift card.
    - Idempotency: check if order already has a payment_id before creating a new one.
  - **Acceptance:** Checkout screen collects all required info. ModemPay returns payment URL/intent in sandbox. Order record created in Supabase before payment is confirmed.
  - **Verify:** Complete checkout to payment screen in ModemPay sandbox. Check order in Studio with `payment_status = 'pending'`.
  - **Files:** `app/(customer)/checkout/index.tsx`, `app/(customer)/checkout/payment.tsx`, `supabase/functions/create-payment/index.ts`, `lib/modempay/client.ts`

- [ ] **T3.5: Build ModemPay webhook handler Edge Function**
  - **What:** `supabase/functions/modempay-webhook/index.ts`. This is the most critical Edge Function.
    - Step 1: Verify ModemPay webhook signature. Reject with 401 if invalid. Log attempt regardless.
    - Step 2: Idempotency check — if `order_id` already has `payment_status = 'paid'`, return 200 immediately (already processed).
    - Step 3: Update `orders.payment_status = 'paid'`.
    - Step 4: Update gift card remaining_balance (if gift card used). Create gift_card_redemptions record.
    - Step 5: Update coupon uses_so_far + create coupon_uses record (if coupon used).
    - Step 6: Calculate commission splits:
      - affiliate_commission = vendor_margin × affiliate_commission_rate (if affiliate link used)
      - admin_margin = admin_price - base_price
      - platform_fee = total_amount × platform_fee_rate
    - Step 7: Create commission_ledger entries for: vendor (net), affiliate (if applicable), admin, platform.
    - Step 8: Send Twilio WhatsApp to vendor: "New order!"
    - Step 9: Send Twilio SMS confirmation to customer.
    - Return 200.
  - **Acceptance:** Full webhook test in ModemPay sandbox triggers all 9 steps correctly. commission_ledger has correct entries. gift_card and coupon records updated. Both notifications sent.
  - **Verify:** `bunx jest __tests__/lib/webhooks.test.ts`. Manual sandbox test with ngrok.
  - **Files:** `supabase/functions/modempay-webhook/index.ts`, `lib/modempay/webhooks.ts`, `__tests__/lib/webhooks.test.ts`

- [ ] **T3.6: Build affiliate link generation and share flow**
  - **What:** `hooks/useAffiliateLink.ts` — given a `listing_id`, checks if affiliate already has a link for it (SELECT from `affiliate_links`). If not, generates a `short_code` using `nanoid(10)` (alphanumeric, URL-safe), creates record. Returns the shareable URL `https://temsmarket.app/p/{short_code}`.
    - `app/(affiliate)/products/[id].tsx` — "Get My Link" button calls this hook. Shows link in a modal with share options.
    - `components/affiliate/ShareSheet.tsx` — uses `expo-sharing` and `expo-clipboard`. Buttons: WhatsApp (deep link `whatsapp://send?text=...`), Facebook, TikTok, Instagram, Copy. Fires PostHog `affiliate_link_shared` event with channel.
    - PostHog `affiliate_link_generated` event fires on first generation.
  - **Acceptance:** Affiliate generates a unique link. Link is different from another affiliate's link for the same product. Sharing to WhatsApp opens WhatsApp with the link pre-filled. Copying to clipboard works. PostHog events appear in dashboard.
  - **Verify:** Generate links as two different affiliates for same product → different codes. Check affiliate_links in Studio.
  - **Files:** `hooks/useAffiliateLink.ts`, `components/affiliate/ShareSheet.tsx`, `lib/utils/short-code.ts`, `__tests__/lib/short-code.test.ts`

- [ ] **T3.7: Build affiliate link deep link handler**
  - **What:** `app/p/[code].tsx` — when app opens from `temsmarket.app/p/{code}` deep link, looks up `affiliate_links` by short_code, stores `affiliate_link_id` in `checkoutStore`, navigates to the vendor listing product detail screen. Fires PostHog `affiliate_link_clicked` event.
    - Universal Links / App Links configured in `app.json`.
    - `website/app/p/[code]/page.tsx` — web fallback: shows product info + "Download Tems Market" button (App Store + Play Store links). Also fires PostHog event via web snippet.
  - **Acceptance:** Tapping the affiliate link on a device with the app opens the correct product screen. `affiliate_link_id` is set in `checkoutStore`. Tapping on a device without the app opens the website product page with download buttons.
  - **Verify:** Test on a simulator (app installed) and a browser (no app)
  - **Files:** `app/p/[code].tsx`, `website/app/p/[code]/page.tsx`, `app.json` (Universal Links config), `store/checkoutStore.ts`

- [ ] **T3.8: Build order status screens and Supabase Realtime**
  - **What:** `app/(customer)/orders/[id].tsx` — order tracking screen. Subscribes to `orders` table via Supabase Realtime on `id = order.id`. Shows status timeline: Placed → Confirmed → Preparing → Ready → Delivered. Auto-updates when vendor changes status.
    - `app/(vendor)/orders/index.tsx` + `[id].tsx` — vendor sees incoming orders. Can tap to update status. Each status update fires a Twilio WhatsApp to the customer.
    - `supabase/functions/update-order-status/index.ts` — validates role is vendor for this order, updates status, triggers Twilio WhatsApp.
  - **Acceptance:** Vendor updates order to "Preparing" → customer tracking screen updates within 3 seconds without refresh. Customer receives WhatsApp notification.
  - **Verify:** Open customer order screen, update status as vendor in another simulator window — see update propagate.
  - **Files:** `app/(customer)/orders/[id].tsx`, `app/(vendor)/orders/index.tsx`, `app/(vendor)/orders/[id].tsx`, `supabase/functions/update-order-status/index.ts`, `hooks/useOrder.ts`

- [ ] **T3.9: Build gift card purchase flow**
  - **What:** `app/(customer)/checkout/gift-card.tsx` — form: denomination (preset tiers: GMD 100, 200, 500, 1000 + custom), recipient email, recipient name, personal message (optional). On submit: creates payment via ModemPay for the denomination. On webhook success: generate 16-char alphanumeric code via `nanoid`, insert `gift_cards` record, call `send-gift-card-email` Edge Function.
    - `supabase/functions/send-gift-card-email/index.ts` — calls Resend with the gift card HTML email template (branded, with code, value, message, "Shop Now" button → `https://temsmarket.app/redeem/{code}`).
    - `website/app/redeem/[code]/page.tsx` — web page that shows the gift card details + app download link.
  - **Acceptance:** Full flow: pay → Resend email delivered to recipient with correct code. Code is exactly 16 characters, uppercase alphanumeric. gift_cards record in DB with correct status.
  - **Verify:** Purchase test gift card → check email delivery via Resend dashboard → check gift_cards in Studio.
  - **Files:** `app/(customer)/checkout/gift-card.tsx`, `supabase/functions/send-gift-card-email/index.ts`, `website/app/redeem/[code]/page.tsx`, `lib/supabase/gift-cards.ts`, `__tests__/lib/gift-cards.test.ts`

- [ ] **T3.10: Build wallet and payout screens for all earning roles**
  - **What:** `app/(vendor)/wallet.tsx`, `app/(affiliate)/payouts.tsx`, `app/(admin)/wallet.tsx`. All use `hooks/useWallet.ts` which queries `commission_ledger` by `recipient_id` and aggregates pending vs available balance.
    - `components/wallet/BalanceCard.tsx` — shows available balance prominently.
    - `components/wallet/PayoutSheet.tsx` — bottom sheet: enter mobile money number (pre-filled from profile), confirm amount (must be ≥ 10 GMD), "Request Payout" button.
    - `supabase/functions/payout-commission/index.ts` — validates balance ≥ 10 GMD, calls ModemPay Payouts API, updates commission_ledger status to 'paid', sends WhatsApp confirmation.
  - **Acceptance:** Wallet shows correct balance (sum of 'pending' commission_ledger entries). Payout request below 10 GMD is blocked with clear error. Successful payout → balance decreases → WhatsApp sent.
  - **Verify:** Create test commission_ledger entries in Studio → check balance display. Test payout in ModemPay sandbox.
  - **Files:** `app/(vendor)/wallet.tsx`, `app/(affiliate)/payouts.tsx`, `app/(admin)/wallet.tsx`, `hooks/useWallet.ts`, `supabase/functions/payout-commission/index.ts`, `components/wallet/BalanceCard.tsx`, `components/wallet/PayoutSheet.tsx`

- [ ] **T3.11: Build coupon creation screens (Admin + Superadmin)**
  - **What:** `app/(superadmin)/promos/coupons.tsx` and corresponding admin screen. Form: code, type (% or fixed), value, minimum order, max uses, per-user limit, valid from, expires at. On save: inserts `coupons` record. List view shows all coupons with uses_so_far, status toggle, "Pause" / "Expire Now" buttons.
  - **Acceptance:** Superadmin creates coupon "TEMS20" for 20% off. Customer applies it at checkout → 20% discount shown. Coupon uses_so_far increments after order completes (triggered by webhook in T3.5).
  - **Verify:** Create coupon → apply at checkout in sandbox → check uses_so_far in Studio.
  - **Files:** `app/(superadmin)/promos/coupons.tsx`, `app/(admin)/catalogue/index.tsx` (extend with coupon link)

- [ ] **T3.12: Build sponsored listing purchase flow**
  - **What:** `app/(vendor)/listings/promote/[id].tsx` — plan selector (7-day / 30-day with prices from `platform_settings`). Pay via ModemPay. On webhook success: create `featured_listings` record with `status = 'active'`, `starts_at = now()`, `ends_at = now() + plan_days`.
    - `supabase/functions/expire-featured/index.ts` — Supabase scheduled Edge Function (cron: every hour) that sets `featured_listings.status = 'expired'` where `ends_at < now() AND status = 'active'`.
    - Vendor sees "Active promotion — X days left" badge on their listing in the Listings tab.
  - **Acceptance:** Vendor pays for 7-day promotion → listing appears in sponsored row of customer home feed immediately. After `ends_at` passes (simulate by setting `ends_at` to now() - 1 minute and running cron), listing disappears from sponsored row.
  - **Verify:** Create featured listing → check customer home feed. Manually expire → check feed again.
  - **Files:** `app/(vendor)/listings/promote/[id].tsx`, `supabase/functions/expire-featured/index.ts`

### ✅ CHECKPOINT 3
```
Run:  bunx tsc --noEmit && bunx jest --coverage
Pass: All coverage thresholds met (pricing 100%, gift-cards 100%, webhooks 90%+)
Pass: Full checkout end-to-end in ModemPay sandbox (QMoney path)
Pass: Gift card purchase → Resend email delivered → code redeems at checkout
Pass: Affiliate link → customer buys → commission appears in affiliate balance
Pass: E2E: bunx maestro test e2e/checkout-mobile-money.yaml passes
Pass: E2E: bunx maestro test e2e/affiliate-share.yaml passes
```

---

## Milestone 4 — Polish & Launch (Checkpoint 4)

- [ ] **T4.1: Wire all Twilio notification events**
  - **What:** Audit all events listed in PRD Feature 11 (Notification Event Map). Confirm every event has a corresponding Twilio call in the correct Edge Function. Add any missing ones.
  - **Acceptance:** Every row in the PRD notification table is implemented and tested with a real Twilio test number.
  - **Verify:** Manual trigger each event, check Twilio logs
  - **Files:** Various Edge Functions (audit + patch)

- [ ] **T4.2: Build RevenueCat vendor subscription**
  - **What:** Install `react-native-purchases`. Configure with iOS and Android API keys. Create a "Vendor Monthly" subscription product in App Store Connect + Google Play Console. Add RevenueCat paywall to vendor onboarding (after account setup, before catalogue access). Check entitlement on vendor app load — if subscription lapsed, show renewal screen.
  - **Acceptance:** Vendor can subscribe via App Store sandbox. Entitlement is granted. Lapsed subscription blocks catalogue access.
  - **Verify:** Use App Store sandbox test account to subscribe
  - **Files:** `app/(vendor)/onboarding/subscription.tsx`, `lib/supabase/auth.ts` (entitlement check), `app/(vendor)/_layout.tsx`

- [ ] **T4.3: Build marketing website — landing page**
  - **What:** `website/app/page.tsx` — Next.js landing page. Sections: hero ("Shop. Sell. Earn."), how it works (3 roles: Vendor, Affiliate, Customer with 3-step each), App Store + Play Store download buttons, footer. Responsive for mobile and desktop. Tailwind v4.
  - **Acceptance:** Website renders at localhost:3000. Download buttons link to correct store URLs. Page passes Lighthouse accessibility audit (score > 90).
  - **Verify:** `bun dev` in website/ → manual check. `bunx lighthouse http://localhost:3000`
  - **Files:** `website/app/page.tsx`, `website/app/layout.tsx`, `website/components/`

- [ ] **T4.4: Wire PostHog events across all key flows**
  - **What:** Audit all PostHog events listed in PRD Section 12. Add any missing `posthog.capture()` calls. Verify each event has the correct properties. Add `$set` calls for user properties (role, vendor_id, etc.) on login.
  - **Acceptance:** Every event in the PRD analytics table appears in PostHog dashboard after one full user journey per role.
  - **Verify:** Walk through all 5 role journeys → check PostHog Live Events view
  - **Files:** Various screen files (audit + patch)

- [ ] **T4.5: Error handling and loading states on all async operations**
  - **What:** Audit every screen that makes an async call (Supabase query, Edge Function call, ModemPay). Ensure: loading spinner shown during call, error state shown on failure (not a crash), retry option where appropriate. Use `Toast` component for transient errors.
  - **Acceptance:** Kill network during checkout → graceful error shown, not a crash. Kill network during product load → empty state with retry button.
  - **Verify:** Airplane mode test on all critical screens
  - **Files:** All async screen files (audit + patch)

- [ ] **T4.6: Performance audit**
  - **What:** Use Sentry performance monitoring. Measure: cold start time (splash → first screen), product feed load time, checkout completion time. Fix any measurement above the targets in SPEC Success Criteria.
  - **Acceptance:** Cold start < 3s on mid-range Android. Product feed < 2s. Checkout intent creation < 2s.
  - **Verify:** Sentry performance dashboard + manual timing on a physical mid-range device
  - **Files:** Any files identified as bottlenecks

- [ ] **T4.7: Security audit**
  - **What:** Go through the security checklist in SPEC Non-Functional Requirements:
    - Confirm no API keys in compiled JS bundle (use `strings` on the built APK/IPA)
    - Confirm all webhook signatures are verified
    - Confirm RLS integration tests still pass
    - Confirm server-side price validation cannot be bypassed
    - Confirm vendor_price < admin_price is blocked at Edge Function level (attempt bypass test)
    - Confirm ID document images require signed URL (cannot be accessed with public URL)
  - **Acceptance:** All checklist items pass. No API key found in binary. Bypass attempt rejected by Edge Function.
  - **Verify:** `bunx jest __tests__/integration/` (full integration test suite)
  - **Files:** Security fixes as found

- [ ] **T4.8: EAS Build configuration and store submission**
  - **What:** Configure `eas.json` for production builds. Set up App Store Connect + Google Play Console projects. Generate signing certificates via EAS. Build production iOS and Android. Prepare store listing assets (screenshots × 5, descriptions, keywords).
  - **Acceptance:** `eas build --platform all` completes with no errors. Binaries downloadable from EAS.
  - **Verify:** `eas build --platform ios` and `eas build --platform android` both exit 0
  - **Files:** `eas.json`, `app.json` (bundle ID, version, etc.)

### ✅ CHECKPOINT 4 — LAUNCH
```
Run:  bunx tsc --noEmit && bunx jest --coverage
Run:  eas build --platform all
Pass: All PostHog events firing correctly
Pass: All Twilio events firing correctly
Pass: Cold start < 3s (Sentry performance)
Pass: No API keys in compiled binary
Pass: App Store + Play Store builds submitted
Pass: E2E: all Maestro flows pass on physical device
```

---

## Quick Reference: Task Count by Milestone

| Milestone | Tasks | Blocking Checkpoint |
|-----------|-------|-------------------|
| M0 — Environment | T0.1 – T0.6 (6 tasks) | None |
| M1 — Database & Auth | T1.1 – T1.14 (14 tasks) | Checkpoint 1 |
| M2 — Core Commerce | T2.1 – T2.14 (14 tasks) | Checkpoint 2 |
| M3 — Transactions | T3.1 – T3.12 (12 tasks) | Checkpoint 3 |
| M4 — Polish & Launch | T4.1 – T4.8 (8 tasks) | Checkpoint 4 |
| **Total** | **54 tasks** | |

---

## Replit Agent Prompt (Phase by Phase)

### Starting Prompt (paste this first)
```
Read these three documents before writing a single line of code:
1. tems-market-PRD.md — what we're building (features, data model, flows)
2. tems-market-SPEC.md — how we build it (stack, structure, code style, boundaries)
3. tems-market-TASKS.md — implementation order (this file)

We are starting at Milestone 0. Complete T0.1 through T0.6 in order.
Do not start a task until the previous task's Verify step passes.
After completing all M0 tasks, stop and report status.
Do not proceed to Milestone 1 without confirmation.
```

### Milestone Transition Prompt
```
Milestone [N] complete. All tasks verified.
Proceed to Milestone [N+1].
Start with task T[N+1].1 and work through sequentially.
Stop at the Checkpoint and report before proceeding to Milestone [N+2].
```

### Fix-and-Continue Prompt (when a task fails)
```
Task T[X.Y] failed at the Verify step: [describe what failed]
Do not move to the next task.
Diagnose the failure, fix it, and re-run the Verify step.
Only report success when Verify passes completely.
```
