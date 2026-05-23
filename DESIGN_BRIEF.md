# Tems Market — Design Brief

**Status:** Open. No constraints applied. Designer has full creative authority.

---

## What the App Is

Tems Market is a social commerce marketplace for The Gambia. Five types of users:

- **Customers** — browse products, buy via mobile money (QMoney, AfriMoney, Wave)
- **Affiliates** — share product links on WhatsApp/Facebook/TikTok, earn commission
- **Vendors** — list products, set their price, receive payouts to mobile wallet
- **Admins** — verify vendors, manage the product catalogue
- **Superadmin** — the owner, sees everything, controls the platform

Physical goods: fashion, electronics, and general goods. Gambian market. Mobile-first.
Payments are real Gambian mobile money. Commission is real income for affiliates.

---

## The Screens That Need Design

Each role has its own tab bar. No single role sees another's screens.

### Customer
Home feed · Product detail · Cart · Checkout (4 steps) · Order tracking · Profile

### Affiliate
Earnings dashboard · Product browse with commission preview · Share sheet · Payout request

### Vendor
Dashboard · Catalogue browse + price setter · My listings · Order management · Wallet

### Admin
Dashboard (action cards) · Vendor verification queue · Catalogue margin setter · Orders

### Superadmin
Platform overview · Product management + AI upload · User management · Full transactions · Settings

### Shared flows
Welcome / role select · Phone OTP · Invite onboarding · Pending approval screen

---

## What We Know About the Users

- Almost entirely mobile (Android dominant in Gambia)
- Not all tech-savvy — the checkout must work for someone who has never used an app before
- WhatsApp and Facebook are their daily digital experience — familiarity with that visual language helps
- Affiliates are motivated by earnings — their commission balance should feel exciting to look at
- Vendors need to trust the numbers — margins and wallet balance must feel accurate and trustworthy
- Customers need to trust the products — quality signals matter, this is real money

---

## Functional Requirements (Non-Negotiable)

These are product decisions, not design constraints:

- Phone number is the login (OTP via SMS) — no email/password for most users
- All prices in GMD — displayed as "GMD 1,200" or similar
- Mobile money payment is the primary checkout method (tapping a logo tile to select)
- Affiliate share flow must get a link into WhatsApp in 2 taps max
- Order tracking is a visual timeline (5 statuses: placed → confirmed → preparing → ready → delivered)
- AI chat search: customer types what they want, results appear as product cards in the chat

---

## What We Are Deliberately Not Deciding

Everything aesthetic is open:

- **Color palette** — no direction. Could be bold, could be minimal, could be warm, could be cool.
- **Typography** — any typeface or combination. Custom font, Google Font, system font — all valid.
- **Icon set** — Ionicons, SF Symbols, Lucide, Phosphor, custom illustrations, emoji-style — open.
- **Border radius** — sharp, rounded, pill-shaped — no preference.
- **Dark mode** — optional. If it strengthens the design, do it. If not, skip it.
- **Motion and animation** — restrained or expressive, both valid.
- **Visual personality** — fintech-serious, market-playful, editorial, bold, warm — all open.

---

## Reference Points (Not Rules)

These are starting points for conversation, not directions:

- GoMart's AI chat interface is worth studying for the conversational search UX
- Zemart's checkout flow for the single-decision-per-step concept
- Wave's visual language as a reference for what mobile money UX looks like in West Africa
- African marketplace apps (Jumia, Takealot) for what to avoid — generic, dated, heavy

---

## What Gets Delivered

When the designer is ready to hand off, the output goes into:

- `docs/design/theme.md` — the complete token set (palette, type scale, spacing, radius, icons)
- `docs/design/components.md` — visual spec for each component (how Button, Card, Badge, etc. look)
- `docs/inspiration/` — any reference screenshots used during the process

The developer translates `theme.md` into `constants/theme.ts`. Components are built to match `components.md`. Nothing is built before the designer signs off on those two files.

---

## Questions Worth Exploring Together

- What does "trust" look like visually in this context? (customers spending real money)
- What makes an affiliate's earnings screen feel motivating?
- How do we make a checkout feel safe for someone paying via mobile money for the first time?
- What's the visual difference between the vendor dashboard (business tool) and the customer feed (shopping experience)?
- Does the platform have a brand personality beyond utility?
