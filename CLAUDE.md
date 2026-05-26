# CLAUDE.md — Tems Market

Tems Market is a 5-role layered-margin social commerce marketplace for The Gambia.
Roles: Superadmin (owner), Admin (operators), Vendor (resellers), Affiliate (link sharers), Customer (shoppers).
Stack: Vite + React + Supabase + ModemPay + Twilio + Resend (web app).
Full feature spec: `tems-market-PRD.md`. Task breakdown: `tems-market-TASKS.md`. SQL schema: `tems-market-schema.sql`.
ADRs: `docs/decisions/`. Inspiration screenshots: `docs/inspiration/`.

**Communication style:** Caveman. No filler, no pleasantries, no yapping. State the thing, show the code, move on.

---

## Current State

**Phase 0 (Environment):** Complete. [Supabase TypeScript types generated, ModemPay keys configured, webhook secret set]
**Phase 1 (Database + Auth):** In progress.
  * [x] Target schema migration applied (20+ tables, RLS, triggers, functions, enums, seed data)
  * [x] TypeScript types regenerated from local schema
  * [x] `request-otp` Edge Function — phone OTP via Supabase Auth
  * [x] `verify-otp` Edge Function — OTP verification + failsafe user creation
  * [x] `modempay-webhook` Edge Function — payment webhook handler (HMAC verified, commission split)
  * [x] AuthContext — phone OTP flow with `setSession` binding
  * [x] ModemPay keys + webhook secret in `.env`
  * [ ] Phone OTP auth pages (Login/Signup/SelectRole)
  * [ ] Admin approve-vendor Edge Function
  * [ ] Seed data for local dev
**Phase 2 (Core Commerce):** Not started.
**Phase 3 (Transactions):** Not started.
**Phase 4 (Polish + Launch):** Not started.

> Update this section after every session. Format: `Phase N (Name): Complete. [brief summary of what shipped]`

---

## Known Gaps & Design Debt

> Add to this list whenever something is incomplete, stubbed, or deferred. Never delete — mark resolved.

- [ ] **LEGAL FLAG (low risk):** Credits are non-withdrawable, non-transferable store credit — not e-money. Platform pays vendors/affiliates via ModemPay as commercial accounts payable — not regulated. Brief legal confirmation recommended pre-launch but risk is minimal.
- [ ] Open: Can vendors/affiliates receive commissions as credits? (F22.12 is Should Have — decide before Phase 3)
- [ ] Open: Gift card redemption adds to credit wallet (F22.11) — confirm this is the intended flow
- [ ] ModemPay supports one sub_account per Payment Intent. Affiliate + admin commission via separate Payouts API calls. Collapse to single intent when ModemPay ships multi sub-account. **ADR-006.**
- [ ] Twilio WhatsApp Business API approval not started. SMS fallback on all WhatsApp events until approved. Apply on Day 1.
- [ ] Open: Can one account be both Customer and Affiliate? Currently separate roles enforced.
- [ ] Open: Gift card expiry period not confirmed (placeholder: 12 months).
- [ ] Open: Vendor monthly subscription price via RevenueCat not confirmed.
- [ ] Open: Vendor affiliate opt-in toggle not yet added to vendor_listings table — needed before Phase 3.
- [ ] **GITHUB TOKEN EXPOSED:** The `GITHUB_TOKEN=ghp_...` in `.env` was exposed in plaintext before `.env` was gitignored. Rotate/revoke at github.com/settings/tokens.

---

## Security Invariants

- **Zero-Trust Client:** Never trust amounts, prices, or roles from client. All sensitive logic in Edge Functions.
- **Age gate:** DOB validated server-side in Edge Function before user record created. Client check is not enough. Under 18 → reject. Missing or invalid DOB → reject. age_verified = true only when server confirms DOB >= 18 years ago.
- **Webhook signature:** Verify ModemPay `x-modem-signature` on every webhook. Reject if absent or invalid.
- **Price enforcement:** vendor_price >= admin_price enforced in Edge Function, not just client-side.
- **Immutable ledgers:** commission_ledger and credit_transactions are INSERT-only from Edge Functions. No client updates ever.
- **MoMo Reconcile webhook:** Verify MoMo Reconcile webhook signature before updating any commission_ledger status. commission_ledger → 'available' only on verified or timed_out signal from MoMo Reconcile.
- **Credit balance:** credit_wallets.balance_gmd never goes negative (DB CHECK constraint). Edge Function validates balance before any deduction.
- **API keys:** `EXPO_PUBLIC_` only for: SUPABASE_URL, SUPABASE_ANON_KEY, POSTHOG_API_KEY, SENTRY_DSN, REVENUECAT_KEY, APP_ENV. Everything else (Groq, OCR Space, Twilio, Resend, ModemPay secret) → Edge Functions only.
- **RLS:** Every table has RLS. Default deny. Explicit allow per role. Service role only in Edge Functions.

---

## Business Rules

### Credits system
```
Credits = store credit. NOT e-money. NOT transferable. NOT withdrawable.
1 credit = GMD 1.
Movement IN:  top_up (min GMD 100), gift_card_redeem, commission_credit, refund, bonus
Movement OUT: purchase, gift_card_purchase (if buyer pays gift card with credits)
Minimum top-up: GMD 100 (above ModemPay flat fee threshold, low barrier to entry).
Checkout shortfall options: exact / GMD 200 / GMD 500 / GMD 1,000 / custom (min GMD 100).
After top-up webhook: checkout auto-completes — user does not re-tap Pay.
Gift card purchase: accept credits (instant) OR mobile money (ModemPay). Both shown.
credit_wallets.balance_gmd must never go negative (DB CHECK constraint).
All credit mutations via Edge Functions (service role) — never from client.
credit_transactions is INSERT-only — immutable ledger, never update or delete.
Commission payout preference (per user, default: mobile_money):
  'credits'      → on order delivered, commission auto-credited to wallet instantly
  'mobile_money' → commission stays 'available', user manually requests payout
Platform fee (1% of margins) = business revenue, not stored value.
Paying vendors/affiliates via ModemPay = commercial accounts payable, not regulated.
```

### Pricing layers
```
base_price (superadmin floor) → admin_price → vendor_price
Customer only ever sees vendor_price. All layers are role-gated.
```

### Commission calculation
```
affiliate_rate  = 0.25 (fashion) | 0.15 (electronics) | 0.20 (other) — of vendor_margin
platform takes 1% from: vendor_margin + admin_margin + affiliate_commission — separately

Example (vendor_margin GMD 100 fashion, admin_margin GMD 100):
  affiliate earns:        GMD 100 × 0.25 = GMD 25.00   affiliate keeps GMD 24.75
  platform from vendor:   GMD 100 × 0.01 = GMD 1.00
  platform from admin:    GMD 100 × 0.01 = GMD 1.00
  platform from affiliate: GMD 25 × 0.01 = GMD 0.25
  platform_total:                          GMD 2.25

  MoMo Reconcile fee:     GMD 2.25 × 0.01 = GMD 0.0225
  Paid by Tems from platform_total. Nobody else pays it.
  Tems keeps:             GMD 2.2275
```

### Commission status flow
```
pending (order paid) → available (MoMo Reconcile manager verified) → paid (daily settlement)

MoMo Reconcile is the gatekeeper: commission only becomes 'available' after manager sign-off.
24h SLA: manager times out → 'timed_out' → commission auto-releases to 'available'.
48h total: absolute fallback.

Daily settlement (mobile_money preference only):
  11 PM Gambia time (10 PM UTC) — process-daily-settlement Edge Function
  Batches all 'available' mobile_money commissions per user into one payout
  One ModemPay Payouts API call per user per day — not per commission
  Min GMD 10 to trigger; below minimum carries to next day

Credits preference: instant on verification, no daily settlement needed.
```

### MoMo Reconcile integration
```
Every commission_ledger entry → one Job in MoMo Reconcile.
Handler = earning party. Requester = Tems Market platform account.
MoMo Reconcile fee = 1% of commission amount.
Fee paid FROM Tems Market platform earnings (the 1% Tems takes from users).
Users (vendor/affiliate/admin) see only Tems' 1% deduction — not an additional charge.
Net Tems earnings per commission line ≈ GMD 0.01 after MoMo fee.
Primary Tems income = base price markup, not commission lines.
Webhook from MoMo Reconcile → triggers 'available' + settlement_date set.
Proof pack PDF accessible from commission detail (deep link, signed URL from MoMo Reconcile).
```

### Currency
```
Storage: NUMERIC(10,2) PostgreSQL
Display: formatGMD() always — never raw numbers in JSX
```

---

## Engineering Patterns

### Styling
- Tailwind CSS via shadcn/ui design system — CSS variables in `src/index.css`
- Color palette defined as HSL CSS custom properties on `:root` and `.dark`
- Font: Inter (Google Fonts import in `src/index.css`)
- UI components in `src/components/ui/` — standard shadcn pattern
- All design tokens are CSS variables — no ad-hoc values

### No AI Slop Policy
Banned UI patterns:
- Generic gradient hero sections
- Equal-weight 4-stat metric grids (hero-metric anti-pattern)
- Decorative arrows (→) on interactive elements
- Emoji in rendered UI (functional product icons only)
- Default blue Submit buttons on white backgrounds
- Placeholder lorem ipsum in any committed screen

### Commits
```
Add affiliate link short code generation
Fix vendor price validation below admin floor
Update commission ledger to available on delivery
```
Imperative. No emoji. Under 72 chars.

---

## Tools & CLI

```bash
# Dev
bun run dev
bun run build
bunx tsc --noEmit
bun run test

# Supabase (local)
cd supabase && npx supabase start
npx supabase db reset
npx supabase functions serve
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# E2E
bunx playwright test
```

---

## Docs Folder Structure

```
docs/
├── decisions/              # ADRs — one file per architectural decision
│   ├── ADR-001-platform-fee.md
│   ├── ADR-002-affiliate-commission.md
│   └── ... (see ADR Log below)
│
├── inspiration/            # Designer drops reference screenshots here
│   ├── checkout-reference.png
│   ├── feed-reference.png
│   ├── dashboard-reference.png
│   └── README.md           # Designer notes on what each reference illustrates
│
├── screenshots/            # Agent-captured screenshots after each UI milestone
│   └── handoff_<task>.png
│
├── specs/                  # Feature specs before implementation
│   └── <feature-name>.md
│
└── design/                 # Designer's living output (NOT in PRD or CLAUDE.md)
    ├── theme.md            # Finalised tokens: palette, type scale, spacing, icons
    ├── components.md       # Component visual spec (after designer signs off)
    └── DESIGN_BRIEF.md     # The brief given to the designer (open, no constraints)
```

> `docs/inspiration/` is the designer's territory. They populate it. The agent compares against it.
> `docs/design/theme.md` is the single source of truth for design tokens once finalised.
> Nothing in `docs/design/` is committed until the designer has signed off.
> The agent never writes to `docs/design/` — that folder belongs to the human designer.

---

## Agent Workflow

Every feature: `spec-driven-development` → `planning-and-task-breakdown` → `incremental-implementation` → `documentation-and-adrs`

- Specs → `docs/specs/<feature>.md`
- ADRs → `docs/decisions/ADR-NNN-<title>.md`
- After UI work: `adb screencap` → compare against `docs/inspiration/` → no AI slop
- Use `/goal` for autonomous multi-turn work

---

## `/goal` Conditions (Ready to Paste)

**Milestone 1 — Foundation:**
```
/goal bunx tsc --noEmit exits 0 shown in output, bunx jest exits 0 shown in output, all 5 roles reach their tab bar screen described in output, admin invite SMS delivered and deep link opens account setup described in output, Sentry and PostHog show test events confirmed in output. Stop after 35 turns.
```

**Milestone 2 — Core Commerce:**
```
/goal vendor listing appears in customer home feed described in output, Groq auto-fill completes under 5 seconds shown in timing output, admin approving vendor shows ModemPay sub-account ID in Supabase query output, vendor_price below admin_price rejected by Edge Function shown in curl output, AI chat search returns matching listings for test query shown in output. Stop after 45 turns.
```

**Milestone 3 — Transactions:**
```
/goal QMoney checkout completes in ModemPay sandbox shown in webhook log output, commission_ledger has correct entries for vendor admin and affiliate shown in Supabase query output, affiliate link opens correct product screen described in output, gift card email delivered confirmed in Resend dashboard output, commission transitions from pending to available on delivery shown in query output. Stop after 50 turns.
```

**Milestone 4 — Launch:**
```
/goal eas build --platform all exits 0 shown in output, bunx jest --coverage shows pricing.test 100% and webhooks.test 90%+ in output, no API keys in compiled bundle shown in strings audit output, all PostHog events firing confirmed in output. Stop after 25 turns.
```

**Visual audit (after any UI milestone):**
```
/goal adb screenshots captured for all screens in current milestone saved to docs/screenshots/, no AI slop patterns present, screens compared against docs/inspiration/ and described as passing. Stop after 10 turns.
```

---

## Handover Protocol

Agent MUST do this at end of every session:

1. **Update Current State** — mark completed phases, add new Known Gaps
2. **ADR** — create `docs/decisions/ADR-NNN.md` for every architectural decision this session
3. **Screenshot** — `adb screencap > docs/screenshots/handoff_<task>.png` for any UI work
4. **Handoff summary** — final response must include:
   - What shipped (bullets)
   - New known gaps or blockers
   - Exact next task (T-number from TASKS.md)
   - Open questions needing owner answer before continuing

---

## ADR Log

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-001 | Platform fee: 1% of each earning party's margin (vendor + admin + affiliate separately). Wave model. | ✅ Confirmed |
| ADR-002 | Affiliate commission: 25% fashion / 15% electronics / 20% other — of vendor_margin not sale price. Calculated on margin not sale price. Higher rates on higher-margin categories. | ✅ Confirmed |
| ADR-003 | Commission status: pending → available (MoMo Reconcile manager verified) → paid. MoMo Reconcile is the gatekeeper. 24h SLA auto-releases on timeout. Stronger trust signal than just delivery confirmation. | ✅ Confirmed |
| ADR-004 | No platform fee on order total. Revenue from base price markup + 1% margin tax per party. No double-dipping. | ✅ Confirmed |
| ADR-005 | Affiliate opt-in toggle per vendor listing. Market self-corrects price inflation. Vendor chose affiliate — not forced. | ✅ Confirmed |
| ADR-006 | Two-phase payout: vendor via ModemPay sub_account at payment, others via Payouts API on webhook. Temporary until multi sub-account ships. | ✅ Confirmed |
| ADR-007 | CLAUDE.md is a living document. PRD = what. TASKS.md = build order. Skills = on-demand context. | ✅ Confirmed |
| ADR-008 | Commission calculated on vendor_margin not sale price. Affiliate earns 25% (fashion) / 15% (electronics) / 20% (other) of vendor_margin. MoMo Reconcile fee = 1% of combined platform earnings per order. | ✅ Confirmed |
| ADR-009 | Credits are store credit: top up and spend only. Non-withdrawable, non-transferable. No e-money licence needed. Gift cards handle gifting. Zero regulatory exposure beyond store credit rules. | ✅ Confirmed |
| ADR-010 | No peer-to-peer credit transfer. Simpler product, zero regulatory grey area, no transfer Edge Function complexity. Gift cards are the gifting mechanism. | ✅ Confirmed |
| ADR-011 | Platform fee (1% of margins) and vendor/affiliate payouts are commercial revenue and accounts payable — not stored value. Paying vendors/affiliates via ModemPay is standard commercial payment, not regulated activity. | ✅ Confirmed |
| ADR-012 | MoMo Reconcile is Tems Market's reconciliation backend. Every commission entry is logged as a MoMo Reconcile Job. Manager verification is the trigger for commission 'available' status. Tems Market pays MoMo Reconcile 1% of each commission from its own platform earnings — not deducted from user commissions. | ✅ Confirmed |
| ADR-013 | Phone OTP auth via Supabase Auth + Edge Function wrappers. Supabase Auth handles OTP lifecycle; Edge Functions do phone normalization, session return, failsafe user creation. Client calls `setSession` after verify. [docs/decisions/ADR-013-phone-otp-auth.md](docs/decisions/ADR-013-phone-otp-auth.md) | ✅ Confirmed |
