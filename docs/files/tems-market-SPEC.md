# Spec: Tems Market

> This document is the authoritative source of truth for how Tems Market is built.
> The PRD (`tems-market-PRD.md`) defines *what* to build. This spec defines *how* to build it.
> Every architectural decision, code pattern, and task lives here.
> Update this file before changing any pattern in the codebase.

---

## Assumptions (Confirm Before Building)

```
ASSUMPTIONS BAKED INTO THIS SPEC:
1. Expo Router (file-based routing) is used — not React Navigation manually configured
2. TypeScript strict mode is on throughout — no `any` types in production code
3. Supabase is the sole backend — no custom Express/Node server
4. All third-party API calls (Groq, OCR Space, Meta WhatsApp Cloud API, Resend, ModemPay payouts) go
   through Supabase Edge Functions — never called directly from the client app
5. State management is Zustand (lightweight, works well with Expo)
6. Bun is the package manager (faster installs; falls back to npm if Replit doesn't support Bun)
7. The website is Next.js 14+ (App Router), separate from the Expo app
8. Deep links use Expo's Universal Links (iOS) and App Links (Android) — not Expo Go custom schemes
9. Images are stored in Supabase Storage, served via its public CDN URL
10. Commission rates and sponsored listing prices are configurable in a platform_settings
    table — not hardcoded
→ Correct any of these before proceeding to Phase 1.
```

---

## Objective

**What we're building:**
Tems Market is a 5-role layered-margin social commerce mobile app for The Gambia. It is:
- An **Amazon/Jumia-style marketplace** where Tems Market stocks its own products (tems_owned)
  AND vendors upload their own products (vendor_submitted, admin-vetted before going live)
- A **wholesale resale engine** with a three-layer price stack:
  base price (superadmin floor) → admin price → vendor price (what customers see)
- A **Share-to-Earn affiliate system** where anyone earns commission by sharing product links
  on WhatsApp, Facebook, TikTok, or Instagram
- A **promo and gifting system** with gift cards (purchasable, emailable, redeemable) and
  coupon/promo codes
- A **featured listing marketplace** where vendors pay for sponsored placement in the feed

**Who are the users:**
Superadmin (owner), Admin (trusted operators), Vendor (resellers), Affiliate (link sharers),
Customer (shoppers). All Gambian-market-first. Mobile-first. WhatsApp-native communication.

**What success looks like:**
- All 5 roles can onboard and reach their "ready state" screen without calling anyone
- A vendor goes from invite SMS → first live listing in under 15 minutes
- An affiliate shares a link on WhatsApp and sees a commission update in the app in real time
- A customer pays via QMoney, AfriMoney, or Wave and receives a WhatsApp confirmation
- The superadmin sees all platform revenue and fees without opening any spreadsheet
- Zero manual money transfers — all payouts automated via ModemPay

---

## Tech Stack (Pinned Versions)

| Layer | Technology | Version |
|-------|-----------|---------|
| Mobile App | Expo | SDK 52+ |
| Framework | React Native | 0.76+ |
| Language | TypeScript | 5.x strict |
| Routing | Expo Router | v4 |
| State | Zustand | 5.x |
| Backend | Supabase | JS v2 |
| Styling | NativeWind (Tailwind for RN) | v4 |
| Forms | React Hook Form + Zod | Latest |
| Payments | ModemPay API | v1 |
| Auth | Supabase Auth + Meta WhatsApp Cloud API | — |
| AI | Groq SDK | Latest |
| OCR | OCR Space REST API | v1 |
| Notifications | Meta WhatsApp Cloud API REST API | — |
| Email | Resend SDK | Latest |
| Analytics | PostHog React Native | Latest |
| Error Monitor | Sentry Expo | Latest |
| Subscriptions | RevenueCat | Latest |
| Package Manager | Bun (npm fallback) | Latest |
| Website | Next.js | 15 App Router |
| Website Styling | Tailwind CSS | v4 |

---

## Commands

### Mobile App

```bash
# Bootstrap (run once)
npx create-expo-app@latest tems-market --template expo-template-blank-typescript
cd tems-market
bunx expo install nativewind zustand @supabase/supabase-js react-hook-form zod \
  @sentry/react-native posthog-react-native react-native-purchases \
  expo-linking expo-image-picker expo-camera expo-clipboard \
  expo-notifications expo-secure-store

# Development
bunx expo start                    # Start dev server
bunx expo start --ios              # iOS simulator
bunx expo start --android          # Android emulator
bunx expo run:ios                  # Native build iOS
bunx expo run:android              # Native build Android

# Type checking
bunx tsc --noEmit                  # Type check without compiling

# Linting
bunx eslint . --fix                # Lint + auto-fix
bunx prettier --write .            # Format

# Testing
bunx jest                          # Run all unit tests
bunx jest --coverage               # With coverage report
bunx jest --watch                  # Watch mode
bunx jest src/lib/__tests__/       # Single directory

# E2E Testing (Maestro)
maestro test e2e/auth.yaml         # Run auth flow e2e
maestro test e2e/checkout.yaml     # Run checkout e2e

# Supabase
bunx supabase start                # Start local Supabase
bunx supabase db reset             # Reset + re-run all migrations
bunx supabase db push              # Push migrations to remote
bunx supabase functions serve      # Serve edge functions locally
bunx supabase gen types typescript --local > types/supabase.ts  # Regenerate types

# Build for stores
eas build --platform ios           # EAS build iOS
eas build --platform android       # EAS build Android
eas submit --platform ios          # Submit to App Store
eas submit --platform android      # Submit to Play Store
```

### Website (Next.js)

```bash
cd website
bun dev                            # Development server
bun build                          # Production build
bun start                          # Start production server
bun lint                           # Lint
```

---

## Project Structure

```
tems-market/
│
├── app/                            # Expo Router — all screens live here
│   ├── _layout.tsx                 # Root layout: Sentry, PostHog, auth check
│   ├── index.tsx                   # Entry: redirects based on role
│   │
│   ├── (auth)/                     # Public auth screens (no role required)
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx             # Splash → Welcome screen
│   │   ├── role-select.tsx         # "Shop" vs "Earn commissions"
│   │   ├── login.tsx               # Phone number entry
│   │   ├── otp.tsx                 # OTP verification
│   │   ├── register.tsx            # Name + password (new accounts)
│   │   └── invite/
│   │       ├── [token].tsx         # Deep link handler for admin invites
│   │       └── vendor/[token].tsx  # Vendor invite link → password setup screen
│   ├── apply/
│   │   └── vendor.tsx              # Public vendor application form (no auth required)
│   │
│   ├── (superadmin)/               # Superadmin-only screens
│   │   ├── _layout.tsx             # Tab bar: Dashboard, Products, Users, Orders, Settings
│   │   ├── dashboard.tsx
│   │   ├── products/
│   │   │   ├── index.tsx           # Product list
│   │   │   ├── add.tsx             # Add product (Groq vision upload)
│   │   │   └── [id].tsx            # Edit product + price layer view
│   │   ├── users/
│   │   │   ├── index.tsx           # All users by role
│   │   │   └── create-admin.tsx
│   │   ├── orders/
│   │   │   └── index.tsx
│   │   ├── promos/
│   │   │   ├── gift-cards.tsx      # Issue promo gift cards
│   │   │   ├── coupons.tsx         # Create/manage coupons
│   │   │   └── featured.tsx        # All sponsored listings
│   │   └── settings.tsx            # Platform settings (commission rates, prices)
│   │
│   ├── (admin)/                    # Admin-only screens
│   │   ├── _layout.tsx             # Tab bar: Dashboard, Vendors, Catalogue, Orders, Wallet
│   │   ├── dashboard.tsx
│   │   ├── vendors/
│   │   │   ├── index.tsx           # Active vendors list
│   │   │   ├── queue.tsx           # Pending verification queue
│   │   │   ├── [id].tsx            # Vendor review (approve/reject)
│   │   │   └── invite.tsx          # Invite new vendor
│   │   ├── catalogue/
│   │   │   └── index.tsx           # Set admin margin per product
│   │   ├── orders/
│   │   │   └── index.tsx
│   │   └── wallet.tsx
│   │
│   ├── (vendor)/                   # Vendor-only screens
│   │   ├── _layout.tsx             # Tab bar: Dashboard, Catalogue, Listings, Orders, Wallet
│   │   ├── dashboard.tsx
│   │   ├── onboarding/             # Post-invite setup (after password set)
│   │   │   ├── payout-setup.tsx    # Prompted on dashboard — required for payouts
│   │   │   └── id-upload.tsx       # Optional post-signup verification
│   │   ├── catalogue/
│   │   │   ├── index.tsx           # Browse + set vendor price
│   │   │   └── [id].tsx            # Set price + margin preview
│   │   ├── listings/
│   │   │   ├── index.tsx           # My active listings
│   │   │   ├── add.tsx             # Submit own product (Groq upload)
│   │   │   └── promote/
│   │   │       └── [id].tsx        # Sponsored listing purchase
│   │   ├── orders/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx            # Order detail + status update
│   │   └── wallet.tsx
│   │
│   ├── (affiliate)/                # Affiliate-only screens
│   │   ├── _layout.tsx             # Tab bar: Earnings, Products, My Links, Payouts, Profile
│   │   ├── earnings.tsx
│   │   ├── products/
│   │   │   ├── index.tsx           # Browse all listings with commission %
│   │   │   └── [id].tsx            # Product detail + Get My Link
│   │   ├── links/
│   │   │   ├── index.tsx           # All my links + per-link analytics
│   │   │   └── share/[id].tsx      # Share sheet screen
│   │   ├── payouts.tsx
│   │   └── profile.tsx
│   │
│   ├── (customer)/                 # Customer screens
│   │   ├── _layout.tsx             # Tab bar: Home, Search, Cart, Orders, Profile
│   │   ├── home.tsx                # Product feed + sponsored row + categories
│   │   ├── search.tsx
│   │   ├── product/
│   │   │   └── [id].tsx            # Product detail
│   │   ├── cart.tsx
│   │   ├── checkout/
│   │   │   ├── index.tsx           # Checkout: address + payment method
│   │   │   ├── payment.tsx         # ModemPay payment flow
│   │   │   ├── gift-card.tsx       # Buy a gift card
│   │   │   └── success.tsx
│   │   ├── orders/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx            # Order tracking (Supabase Realtime)
│   │   └── profile.tsx
│   │
│   └── p/
│       └── [code].tsx              # Affiliate link landing (deep link + web fallback)
│
├── components/                     # Shared UI components (role-agnostic)
│   ├── ui/                         # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   └── Toast.tsx
│   ├── product/
│   │   ├── ProductCard.tsx         # Used in feed and catalogue
│   │   ├── ProductImages.tsx       # Image carousel
│   │   ├── PriceDisplay.tsx        # Shows correct price per role
│   │   └── SponsoredBadge.tsx
│   ├── auth/
│   │   ├── OTPInput.tsx
│   │   └── PhoneInput.tsx
│   ├── checkout/
│   │   ├── CartItem.tsx
│   │   ├── PaymentMethodSelector.tsx
│   │   ├── GiftCardInput.tsx
│   │   └── CouponInput.tsx
│   ├── wallet/
│   │   ├── BalanceCard.tsx
│   │   ├── TransactionRow.tsx
│   │   └── PayoutSheet.tsx
│   └── affiliate/
│       ├── CommissionBadge.tsx
│       └── ShareSheet.tsx
│
├── lib/                            # Business logic + integrations (no UI)
│   ├── supabase/
│   │   ├── client.ts               # Supabase client singleton
│   │   ├── auth.ts                 # Auth helpers (signIn, signOut, getUser)
│   │   ├── products.ts             # Product queries
│   │   ├── orders.ts               # Order queries + mutations
│   │   ├── commissions.ts          # Commission ledger queries
│   │   ├── gift-cards.ts           # Gift card validation + redemption
│   │   ├── coupons.ts              # Coupon validation
│   │   └── realtime.ts             # Supabase Realtime subscriptions
│   ├── modempay/
│   │   ├── client.ts               # ModemPay API wrapper
│   │   └── webhooks.ts             # Webhook signature verification
│   ├── groq/
│   │   └── vision.ts               # Product image → description
│   ├── ocr/
│   │   └── space.ts                # OCR Space document extraction
│   ├── analytics/
│   │   └── posthog.ts              # PostHog event helpers
│   └── utils/
│       ├── currency.ts             # GMD formatting helpers
│       ├── short-code.ts           # Affiliate link short code generation
│       ├── pricing.ts              # Margin calculation helpers
│       └── validation.ts           # Shared Zod schemas
│
├── hooks/                          # Custom React hooks
│   ├── useAuth.ts                  # Current user + role
│   ├── useCart.ts                  # Cart state (Zustand)
│   ├── useProducts.ts              # Product list with filters
│   ├── useOrder.ts                 # Single order + realtime status
│   ├── useWallet.ts                # Balance + ledger for any role
│   └── useAffiliateLink.ts         # Generate/retrieve affiliate link
│
├── store/                          # Zustand stores
│   ├── authStore.ts                # User session + role
│   ├── cartStore.ts                # Cart items + totals
│   └── checkoutStore.ts            # Checkout state (gift card, coupon, method)
│
├── types/                          # TypeScript types
│   ├── supabase.ts                 # Auto-generated from `supabase gen types`
│   ├── roles.ts                    # UserRole enum + role guards
│   ├── pricing.ts                  # PriceLayer, VendorListing, etc.
│   ├── orders.ts                   # Order, OrderStatus, PaymentMethod
│   ├── promos.ts                   # GiftCard, Coupon, FeaturedListing
│   └── analytics.ts                # PostHog event names + properties
│
├── constants/
│   ├── theme.ts                    # Design tokens — BLANK until designer fills in
│   │                               # palette, typography, spacing, icons: designer's call
│   ├── routes.ts                   # Typed route constants
│   └── config.ts                   # App-wide config (min payout, etc.)
│
├── docs/
│   ├── decisions/                  # ADRs — one per architectural decision
│   │   └── ADR-001-platform-fee.md
│   ├── inspiration/                # Designer populates — reference screenshots only
│   │   └── README.md               # Designer notes on what each reference illustrates
│   ├── screenshots/                # Agent-captured screens after each UI milestone
│   │   └── handoff_<task>.png
│   ├── specs/                      # Feature specs before implementation
│   └── design/                     # Designer's territory — agent never writes here
│       ├── DESIGN_BRIEF.md         # Open brief given to designer (no constraints)
│       ├── theme.md                # Finalised tokens after designer signs off
│       └── components.md           # Component visual spec
│
├── supabase/
│   ├── config.toml                 # Supabase local config
│   ├── migrations/                 # SQL migration files (numbered)
│   │   ├── 001_initial_schema.sql  # All tables from PRD
│   │   ├── 002_rls_policies.sql    # All RLS policies
│   │   ├── 003_indexes.sql         # All indexes
│   │   └── 004_seed_data.sql       # Platform settings defaults
│   └── functions/                  # Edge functions (Deno)
│       ├── send-otp/               # Meta WhatsApp Cloud API OTP trigger
│       ├── invite-user/            # Admin/vendor invite SMS
│       ├── modempay-webhook/       # Payment webhook handler
│       ├── groq-vision/            # Product image → description
│       ├── ocr-document/           # OCR Space + Groq structure
│       ├── create-sub-account/     # ModemPay sub-account on vendor approval
│       ├── payout-commission/      # ModemPay payout for affiliate/admin
│       ├── send-gift-card-email/   # Resend gift card email
│       ├── validate-coupon/        # Coupon validation at checkout
│       └── expire-featured/        # Scheduled: expire old sponsored listings
│
├── assets/
│   ├── images/
│   │   ├── logo.png
│   │   ├── logo-dark.png
│   │   └── onboarding/
│   └── fonts/
│
├── __tests__/                      # Unit tests (mirrors lib/ structure)
│   ├── lib/
│   │   ├── pricing.test.ts
│   │   ├── gift-cards.test.ts
│   │   ├── coupons.test.ts
│   │   ├── short-code.test.ts
│   │   └── webhooks.test.ts
│   └── components/
│       ├── ProductCard.test.tsx
│       ├── GiftCardInput.test.tsx
│       └── CouponInput.test.tsx
│
├── e2e/                            # Maestro end-to-end flows
│   ├── auth-customer.yaml          # Customer register → home feed
│   ├── auth-affiliate.yaml         # Affiliate register → dashboard
│   ├── vendor-onboarding.yaml      # Vendor invite → pending screen
│   ├── affiliate-share.yaml        # Affiliate generates + shares link
│   ├── checkout-mobile-money.yaml  # Customer checkout QMoney flow
│   ├── checkout-gift-card.yaml     # Gift card purchase + redemption
│   └── order-status.yaml           # Vendor updates status → customer sees it
│
├── website/                        # Next.js 15 marketing site
│   ├── app/
│   │   ├── page.tsx                # Landing page
│   │   ├── p/[code]/page.tsx       # Affiliate link landing page
│   │   └── layout.tsx
│   ├── components/
│   └── public/
│
├── .env.local                      # All env vars (never committed)
├── .env.example                    # Template with all var names (committed)
├── app.json                        # Expo app config
├── eas.json                        # EAS Build config
├── tailwind.config.ts              # NativeWind config
├── tsconfig.json                   # TypeScript strict config
├── eslint.config.js
├── prettier.config.js
└── package.json
```

---

## Code Style

### Golden Rule
> One real example beats a paragraph of rules. All conventions are derived from these patterns.

### 1. Component Pattern

Every component is typed, named export, and accepts typed props. No default exports on components.

```tsx
// components/product/ProductCard.tsx
import { Pressable, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { formatGMD } from '@/lib/utils/currency'
import type { VendorListing } from '@/types/pricing'

interface ProductCardProps {
  listing: VendorListing
  onPress: (listingId: string) => void
  showCommission?: boolean   // Affiliate view only
  isSponsored?: boolean
}

export function ProductCard({
  listing,
  onPress,
  showCommission = false,
  isSponsored = false,
}: ProductCardProps) {
  return (
    <Pressable
      className="bg-surface rounded-[theme.radius.card] p-3 border border-border"
      onPress={() => onPress(listing.id)}
    >
      {isSponsored && (
        // Designer defines the sponsored badge colour — use theme token
        <View className="absolute top-2 right-2 bg-accent-subtle px-2 py-0.5 rounded-full">
          <Text className="text-accent text-xs font-medium">Sponsored</Text>
        </View>
      )}
      <Image
        source={listing.product.images[0]}
        className="w-full h-40 rounded-[theme.radius.image]"
        contentFit="cover"
      />
      <Text className="mt-2 font-medium text-text-primary" numberOfLines={2}>
        {listing.product.title}
      </Text>
      {/* Price colour = theme.colors.price — defined by designer */}
      <Text className="text-price font-semibold mt-1">
        {formatGMD(listing.vendor_price)}
      </Text>
      {showCommission && (
        <Text className="text-xs text-commission mt-0.5">
          You earn {formatGMD(listing.affiliate_commission_amount)}
        </Text>
      )}
    </Pressable>
  )
}
```

> Note: className values like `text-price`, `text-accent`, `bg-surface` are custom NativeWind tokens
> defined in `constants/theme.ts` by the designer. The component structure is fixed; the visual
> language is not. Swap the theme file to change the entire app's look without touching components.

### 2. Supabase Query Pattern

All queries live in `lib/supabase/`. Never write raw Supabase queries inside components.

```typescript
// lib/supabase/products.ts
import { supabase } from './client'
import type { Database } from '@/types/supabase'

type ProductRow = Database['public']['Tables']['products']['Row']

export async function getActiveListings(params: {
  category?: string
  page?: number
  limit?: number
}): Promise<{ data: VendorListing[]; error: string | null }> {
  const { category, page = 0, limit = 20 } = params

  let query = supabase
    .from('vendor_listings')
    .select(`
      id,
      vendor_price,
      vendor_margin,
      is_active,
      product:products(id, title, images, category),
      vendor:users(id, full_name)
    `)
    .eq('is_active', true)
    .range(page * limit, (page + 1) * limit - 1)

  if (category) {
    query = query.eq('product.category', category)
  }

  const { data, error } = await query

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: data as VendorListing[], error: null }
}
```

### 3. Edge Function Pattern

All Supabase Edge Functions follow this structure (Deno runtime):

```typescript
// supabase/functions/groq-vision/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Groq from 'https://esm.sh/groq-sdk'

const groq = new Groq({ apiKey: Deno.env.get('GROQ_API_KEY')! })

serve(async (req: Request) => {
  // 1. Auth check — must be authenticated
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // 2. Parse input
  const { imageBase64, mimeType } = await req.json()

  // 3. Call Groq
  try {
    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${imageBase64}` }
          },
          {
            type: 'text',
            text: `You are helping a Gambian marketplace list a product.
Look at this image and return ONLY valid JSON (no markdown, no preamble):
{
  "title": "concise product name",
  "description": "2-sentence product description suitable for mobile listing",
  "category": "fashion" | "electronics" | "other",
  "suggested_price_gmd": number
}`
          }
        ]
      }],
      max_tokens: 300,
    })

    const text = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(text)

    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Vision processing failed', detail: String(err) }),
      { status: 500 }
    )
  }
})
```

### 4. Zustand Store Pattern

```typescript
// store/cartStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface CartItem {
  listingId: string
  vendorId: string
  title: string
  price: number           // vendor_price at time of add
  imageUrl: string
  quantity: number
}

interface CartStore {
  items: CartItem[]
  giftCardCode: string | null
  giftCardBalance: number
  couponCode: string | null
  couponDiscount: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (listingId: string) => void
  updateQuantity: (listingId: string, quantity: number) => void
  applyGiftCard: (code: string, balance: number) => void
  applyCoupon: (code: string, discount: number) => void
  clearCart: () => void
  total: () => number
  discountedTotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      giftCardCode: null,
      giftCardBalance: 0,
      couponCode: null,
      couponDiscount: 0,
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.listingId === item.listingId)
        if (existing) {
          return {
            items: state.items.map(i =>
              i.listingId === item.listingId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          }
        }
        return { items: [...state.items, { ...item, quantity: 1 }] }
      }),
      removeItem: (listingId) => set((state) => ({
        items: state.items.filter(i => i.listingId !== listingId)
      })),
      updateQuantity: (listingId, quantity) => set((state) => ({
        items: quantity <= 0
          ? state.items.filter(i => i.listingId !== listingId)
          : state.items.map(i => i.listingId === listingId ? { ...i, quantity } : i)
      })),
      applyGiftCard: (code, balance) => set({ giftCardCode: code, giftCardBalance: balance }),
      applyCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),
      clearCart: () => set({ items: [], giftCardCode: null, giftCardBalance: 0, couponCode: null, couponDiscount: 0 }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      discountedTotal: () => {
        const raw = get().total()
        const afterCoupon = Math.max(0, raw - get().couponDiscount)
        return Math.max(0, afterCoupon - get().giftCardBalance)
      },
    }),
    {
      name: 'tems-cart',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

### 5. Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `ProductCard`, `ShareSheet` |
| Hooks | camelCase, `use` prefix | `useWallet`, `useAuth` |
| Stores | camelCase, `use` prefix | `useCartStore` |
| Lib functions | camelCase | `formatGMD`, `getActiveListings` |
| Types/Interfaces | PascalCase | `VendorListing`, `OrderStatus` |
| Enums | PascalCase | `UserRole.VENDOR` |
| Constants | SCREAMING_SNAKE | `MIN_PAYOUT_GMD`, `PLATFORM_FEE_RATE` |
| Supabase tables | snake_case | `vendor_listings`, `gift_cards` |
| Edge functions | kebab-case | `groq-vision`, `modempay-webhook` |
| Files | kebab-case (lib, utils) or PascalCase (components) | |
| Expo Router files | kebab-case | `role-select.tsx`, `gift-card.tsx` |

### 6. Zod Validation

Every user-submitted form is validated with Zod before touching Supabase.

```typescript
// lib/utils/validation.ts
import { z } from 'zod'

export const phoneSchema = z
  .string()
  .min(7, 'Phone number too short')
  .max(15, 'Phone number too long')
  .regex(/^\+?[0-9]+$/, 'Invalid phone number format')

export const vendorPriceSchema = (adminPrice: number) =>
  z.number()
    .min(adminPrice, `Price must be at least ${formatGMD(adminPrice)}`)
    .max(adminPrice * 10, 'Price seems unusually high — please double-check')

export const couponCodeSchema = z
  .string()
  .min(3, 'Invalid code')
  .max(20, 'Invalid code')
  .transform(val => val.toUpperCase().trim())

export const giftCardSchema = z
  .string()
  .length(16, 'Gift card code must be 16 characters')
  .regex(/^[A-Z0-9]+$/, 'Invalid gift card code')
  .transform(val => val.toUpperCase().trim())
```

### 7. Error Handling

All async operations return `{ data, error }` — never throw from lib functions.
Components handle errors from this shape and show appropriate UI.

```typescript
// Pattern for all lib functions
async function someOperation(): Promise<{ data: Result | null; error: string | null }> {
  try {
    const result = await doSomething()
    return { data: result, error: null }
  } catch (err) {
    console.error('[someOperation]', err)
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
```

### 8. Currency Formatting

All monetary values are stored as integers (GMD dalasis × 100 = bututs) OR as NUMERIC in Postgres.
Display always via the helper — never format raw numbers in JSX.

```typescript
// lib/utils/currency.ts
export function formatGMD(amount: number): string {
  return `GMD ${amount.toLocaleString('en-GM', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function toBututs(dalasis: number): number {
  return Math.round(dalasis * 100)
}

export function fromBututs(bututs: number): number {
  return bututs / 100
}
```

---

## Testing Strategy

### Frameworks
| Level | Framework | Location |
|-------|-----------|----------|
| Unit | Jest + React Native Testing Library | `__tests__/` |
| Integration | Supabase local dev + test DB | `__tests__/integration/` |
| E2E | Maestro | `e2e/` |

### Coverage Requirements
| Area | Minimum Coverage | Rationale |
|------|-----------------|-----------|
| Pricing logic (`lib/utils/pricing.ts`) | 100% | Money calculations must be exact |
| Gift card validation (`lib/supabase/gift-cards.ts`) | 100% | Financial correctness |
| Coupon validation (`lib/supabase/coupons.ts`) | 100% | Financial correctness |
| Webhook handler (`supabase/functions/modempay-webhook`) | 90%+ | Payment integrity |
| Auth helpers (`lib/supabase/auth.ts`) | 85%+ | Security |
| UI components | 60%+ | Smoke tests sufficient |
| Edge functions | 80%+ | Server-side critical paths |

### What to Test at Each Level

**Unit tests — pure logic, no network:**
```typescript
// __tests__/lib/pricing.test.ts
import { calculateCommission, validateVendorPrice } from '@/lib/utils/pricing'

describe('calculateCommission', () => {
  it('returns 10% of vendor margin', () => {
    // vendor_price=1000, admin_price=800 → margin=200 → commission=20
    expect(calculateCommission({ vendorPrice: 1000, adminPrice: 800, rate: 0.1 }))
      .toBe(20)
  })

  it('returns 0 if no margin', () => {
    expect(calculateCommission({ vendorPrice: 800, adminPrice: 800, rate: 0.1 }))
      .toBe(0)
  })
})

describe('validateVendorPrice', () => {
  it('rejects price below admin price', () => {
    const result = validateVendorPrice({ vendorPrice: 750, adminPrice: 800 })
    expect(result.valid).toBe(false)
  })

  it('accepts price equal to admin price', () => {
    const result = validateVendorPrice({ vendorPrice: 800, adminPrice: 800 })
    expect(result.valid).toBe(true)
  })
})
```

**Integration tests — with Supabase local:**
```typescript
// __tests__/integration/gift-cards.test.ts
// Uses supabase local (bunx supabase start) with test fixtures
// Tests actual DB writes + reads + RLS policy enforcement
```

**E2E tests — Maestro flow files:**
```yaml
# e2e/checkout-gift-card.yaml
appId: com.temsmarket.app
---
- launchApp
- tapOn: "Gift Cards"
- tapOn: "Buy a Gift Card"
- inputText:
    id: "recipient-email"
    text: "friend@example.com"
- inputText:
    id: "amount"
    text: "200"
- tapOn: "Pay GMD 200"
# ... continues through ModemPay mock
- assertVisible: "Gift card sent!"
```

### Test Doubles
- Supabase: use local instance (`bunx supabase start`) — never mock Supabase directly
- ModemPay: mock API responses in unit tests, use sandbox environment in integration/E2E
- Meta WhatsApp Cloud API: mock in unit tests; use Meta WhatsApp Cloud API test credentials in integration
- Groq: mock responses in unit tests (avoid API calls in CI)

---

## Boundaries

### ✅ Always Do
- Run `bunx tsc --noEmit` before committing any TypeScript changes
- Run `bunx jest` before marking any task complete
- Regenerate Supabase types after any schema change: `bunx supabase gen types typescript --local > types/supabase.ts`
- Validate all monetary calculations server-side (in Edge Functions) — never trust client-computed prices
- Verify ModemPay webhook signature before processing any webhook
- Check RLS policies when adding any new table — default to deny, explicitly allow
- Use `formatGMD()` for every price displayed to any user — never raw numbers in UI
- Store all API keys in environment variables — verify they exist at app start
- Log every ModemPay webhook attempt (success or failure) with order_id for audit

### ⚠️ Ask First (stop and confirm before doing)
- Any change to the database schema or existing migrations
- Adding a new third-party dependency (package or API)
- Changing commission rate logic or price layer enforcement rules
- Modifying ModemPay webhook handling logic
- Changing user role permissions or RLS policies
- Any change that affects how payouts are calculated or triggered
- Adding a new Edge Function (confirm naming and placement)
- Changing the affiliate link short_code format (would break existing links)

### 🚫 Never Do
- Call Groq, OCR Space, Meta WhatsApp Cloud API, Resend, or ModemPay payouts directly from the client app
- Hardcode any API key, secret, or credential in source code
- Skip server-side validation because "the client already validated it"
- Process a ModemPay webhook without verifying the signature
- Allow a vendor_price to be set below admin_price even if the UI prevents it — the Edge Function must also enforce this
- Commit `.env.local` or any file containing real credentials
- Delete or modify a migration file that has already been pushed to remote Supabase
- Remove a failing test — fix the test or the code, never delete the test
- Use `any` type in TypeScript (ESLint rule enforces this)
- Expose internal pricing layers to roles that shouldn't see them (customers must never see base_price or admin_price)

---

## Success Criteria

These are the conditions that define "the app is done and ready to ship." Each is specific and testable.

### Phase 1 — Foundation
- [ ] `bunx expo start` runs without errors on a fresh clone with `.env.local` populated
- [ ] All 5 roles can reach their respective "ready state" screen in the simulator
- [ ] Superadmin login (password + OTP) works end-to-end
- [ ] Admin invite SMS fires via Meta WhatsApp Cloud API; admin taps link and completes account setup
- [ ] Vendor invite SMS fires; vendor taps link and reaches onboarding flow
- [ ] Affiliate self-registers via role-select screen and reaches affiliate dashboard
- [ ] Customer self-registers and reaches home feed (empty state)
- [ ] Suspended user sees locked screen
- [ ] Pending vendor sees waiting screen
- [ ] `bunx supabase db reset` + all migrations run cleanly with zero errors
- [ ] RLS policies prevent cross-role data access (verified by integration test)
- [ ] Sentry receives a test event
- [ ] PostHog receives a test event

### Phase 2 — Core Commerce
- [ ] Superadmin uploads a product photo → Groq returns populated title, description, category in < 3s
- [ ] Product is saved to Supabase with images in Supabase Storage
- [ ] Admin can set admin_price per product (must be ≥ base_price — enforced server-side)
- [ ] Vendor browses catalogue, sees admin_price as their floor, sets vendor_price
- [ ] System rejects vendor_price below admin_price at the Edge Function level (not just client)
- [ ] Vendor margin preview updates in real time as price changes
- [ ] Vendor uploads ID photo → OCR Space extracts text → Groq structures it → admin sees structured fields
- [ ] Admin approves vendor → ModemPay sub-account created → vendor receives WhatsApp
- [ ] Admin rejects vendor → vendor receives SMS with reason
- [ ] Vendor listing is visible to customers after being published (is_active = true)

### Phase 3 — Transactions
- [ ] Customer completes QMoney checkout in ModemPay sandbox end-to-end
- [ ] ModemPay webhook fires → order.payment_status = 'paid' → commission_ledger entries created
- [ ] Vendor sees new order in their orders tab within 5 seconds of payment (Supabase Realtime)
- [ ] Vendor receives WhatsApp notification on new order
- [ ] Affiliate generates a unique link for a product; link is different from another affiliate's link for same product
- [ ] Customer taps affiliate link → correct product opens in app with affiliate_link_id tracked
- [ ] Order placed via affiliate link has affiliate_link_id on the order record
- [ ] Affiliate commission appears in their balance after order payment confirmed
- [ ] Affiliate requests payout → ModemPay payout API called → WhatsApp confirmation sent
- [ ] Gift card purchased → unique 16-char code generated → Resend email delivered to recipient
- [ ] Gift card code applied at checkout → order total reduced correctly
- [ ] Gift card covers full order → customer pays GMD 0 (discountedTotal = 0)
- [ ] Partial gift card use → remaining_balance decremented, card status stays active
- [ ] Coupon TEMS20 (20% off) created by admin → customer applies at checkout → discount shown as line item
- [ ] Expired coupon rejected at checkout with clear error message
- [ ] Vendor pays for 7-day sponsored listing → listing appears in "Sponsored" row on home feed
- [ ] Sponsored listing disappears from feed after ends_at passes
- [ ] Customer updates order status: placed → confirmed → preparing → ready → delivered — each step fires WhatsApp to customer

### Phase 4 — Launch
- [ ] RevenueCat vendor subscription paywall appears and processes via App Store sandbox
- [ ] App Store build completes via EAS with no errors
- [ ] Play Store build completes via EAS with no errors
- [ ] Affiliate link `/p/{code}` on website shows product card + "Download Tems Market" button
- [ ] All PostHog events listed in PRD Section 12 fire correctly and appear in PostHog dashboard
- [ ] Sentry session replay works on checkout screen
- [ ] Cold start (splash → home feed) completes in < 3 seconds on mid-range Android (Sentry performance)
- [ ] All API keys verified to be absent from compiled JS bundle (EAS build audit)
- [ ] Final RLS audit: no query returns data the requesting role shouldn't see

---

## Open Questions

These must be answered before or during implementation. Do not guess — ask.

| # | Question | Blocking | Owner |
|---|----------|----------|-------|
| 1 | What is the platform_fee_rate (%)? PRD says 2–3% — exact number needed for commission_ledger and Edge Function logic | Phase 3 | Superadmin (you) |
| 2 | What is the affiliate_commission_rate (%)? E.g. 10% of vendor_margin | Phase 3 | Superadmin (you) |
| 3 | What are the sponsored listing prices? (7-day GMD X, 30-day GMD Y) | Phase 3 | Superadmin (you) |
| 4 | What are the vendor subscription tiers via RevenueCat? (monthly price, what it unlocks) | Phase 4 | Superadmin (you) |
| 5 | Can a customer be an affiliate simultaneously (one account, two roles)? Current spec: separate roles. Confirm direction. | Phase 1 | Superadmin (you) |
| 6 | Meta WhatsApp Cloud API WhatsApp Business: has the WhatsApp Business API application been started? Approval can take 1–2 weeks | Phase 1 | Superadmin (you) |
| 7 | What gift card expiry period? (e.g. 12 months from purchase) | Phase 3 | Superadmin (you) |
| 8 | ModemPay: does their sandbox support the full Payment Intent + sub-account + webhook flow? Needs confirmation from their team before Phase 3 | Phase 3 | You |
| 9 | For vendor-submitted products: can a vendor submit a product that is NOT in the Tems-owned catalogue? (i.e. a completely new product that admin vets and adds) — or can vendors only set prices on existing catalogue items? | Phase 2 | Superadmin (you) |

---

## Living Document Rules

1. **This spec is committed to the repo** alongside the code at `/docs/SPEC.md`
2. **Update before changing patterns** — if a convention changes, update this file first
3. **PR descriptions reference this spec** — "implements Phase 2, Task 4 (see SPEC.md)"
4. **Open Questions are resolved by updating this doc** — not by Slack messages or memory
5. **When scope changes** — update both `tems-market-PRD.md` (the *what*) and this file (the *how*)

---

---

# Phase 2 — Technical Plan

## Component Dependency Map

Everything in the app has a build order. This map shows what must exist before each major
piece can be built. Read top-to-bottom — nothing lower can start until things above it are done.

```
LAYER 0 — Infrastructure (nothing depends on this existing first)
├── Supabase project (schema, RLS, indexes, seed)
├── Expo project scaffold (TypeScript, NativeWind, ESLint, Prettier)
├── Environment variables (.env.local populated)
└── Sentry + PostHog initialized in root layout

LAYER 1 — Auth (everything needs a user identity)
├── Supabase client singleton
├── Auth store (Zustand — session, user, role)
├── Phone OTP flow (login screen → OTP screen → register screen)
├── Superadmin hardcoded login (password + OTP)
├── Role-based navigation (5 separate tab layouts)
├── Invite deep link handler (/invite/[token])
├── Admin invite Edge Function + SMS
└── Vendor invite Edge Function + SMS

LAYER 2 — Product Catalogue (needs auth + Supabase)
├── Supabase Storage bucket (product-images, vendor-docs)
├── Groq vision Edge Function (groq-vision)
├── Product types (auto-generated from Supabase + manual types)
├── Superadmin: add product (upload → Groq → form → save)
├── Superadmin: product list + edit + toggle active
├── Admin: set admin_price per product (price_layers table)
├── Vendor: browse catalogue + set vendor_price (vendor_listings)
└── Vendor: submit own product → admin approval queue

LAYER 3 — Vendor Onboarding (needs auth + Supabase Storage)
├── OCR Space Edge Function (ocr-document)
├── Groq structure Edge Function (called inside ocr-document)
├── Vendor onboarding screens (business-info → id-upload → payout-setup → pending)
├── Admin: vendor queue + review screen (approve/reject)
└── create-sub-account Edge Function (fires on admin approval)
    → ModemPay sub-account created → vendor_profiles updated

LAYER 4 — Commerce (needs catalogue + vendor onboarding complete)
├── Cart store (Zustand + AsyncStorage persistence)
├── Cart screen
├── Checkout screen (address + payment method selector)
├── Gift card validation Edge Function (validate-gift-card)
├── Coupon validation Edge Function (validate-coupon)
├── Gift card input + coupon input UI at checkout
├── ModemPay Payment Intent creation (client → Edge Function → ModemPay)
├── ModemPay webhook Edge Function (modempay-webhook)
│   ├── Verifies signature
│   ├── Updates order.payment_status
│   ├── Creates commission_ledger entries (vendor, affiliate, admin, platform)
│   └── Triggers Meta WhatsApp Cloud API WhatsApp notification to vendor
├── Order success screen
└── COD order flow (no payment API needed)

LAYER 5 — Affiliate System (needs commerce layer)
├── Affiliate link generation (short-code util + affiliate_links table)
├── Universal Links / App Links setup (apple-app-site-association, assetlinks.json)
├── /p/[code] screen in Expo (deep link handler → product screen with affiliate_id)
├── /p/[code] page in Next.js website (product card + download CTA)
├── Affiliate share sheet (ShareSheet component)
├── Affiliate dashboard (earnings, links, per-link analytics)
└── Affiliate payout request → payout-commission Edge Function

LAYER 6 — Promos (needs commerce layer)
├── Gift card purchase flow (ModemPay → code generation → Resend email)
├── send-gift-card-email Edge Function (Resend HTML template)
├── Coupon creation screens (superadmin + admin)
├── Sponsored listing purchase flow (ModemPay → featured_listings record)
└── expire-featured scheduled function (Supabase pg_cron)

LAYER 7 — Wallets + Payouts (needs commission_ledger populated)
├── Wallet screen (all roles: balance, transaction history)
├── Payout request sheet (PayoutSheet component)
└── payout-commission Edge Function (ModemPay payouts API)

LAYER 8 — Notifications (wired throughout all layers above)
├── Meta WhatsApp Cloud API SMS: OTP, invites, vendor rejection, payment confirmation
├── Meta WhatsApp Cloud API WhatsApp: vendor approval, new order, order status, commission, payout
└── Resend Email: gift card delivery, order confirmation (if email on profile)

LAYER 9 — Order Management + Realtime (needs orders exist)
├── Vendor: orders list + order detail + status update
├── Customer: order tracking (Supabase Realtime subscription)
└── Superadmin/Admin: full order overview

LAYER 10 — Launch (all layers complete)
├── RevenueCat vendor subscription paywall
├── PostHog event audit
├── Marketing website (Next.js) — landing page + download buttons
├── EAS build configuration
└── App Store + Play Store submission
```

## Parallel vs Sequential Work

| What can be built in parallel | What must be sequential |
|-------------------------------|------------------------|
| Supabase schema + Expo scaffold | Auth must come before any feature screen |
| Groq Edge Function + OCR Edge Function | Vendor onboarding requires OCR done |
| Cart UI + Checkout UI | ModemPay integration requires checkout UI exists |
| Gift card email template + Coupon creation screens | Both require checkout to exist first |
| Marketing website + Expo affiliate link screen | Affiliate system requires commerce layer |
| All Meta WhatsApp Cloud API notification wiring | Can wire to each layer as built |

## Risks and Architecture Decisions

| Decision | Chosen Approach | Rationale |
|----------|----------------|-----------|
| Deep links | Expo Universal Links (not Expo Go schemes) | Production-grade; works when app is installed |
| Affiliate link resolution | `short_code` indexed in DB, looked up on link open | Sub-100ms lookup; survives app updates |
| ModemPay webhook idempotency | Check `order_id` exists in commission_ledger before creating entries | Prevents double-payout if webhook fires twice |
| Gift card code generation | Crypto-random 16-char alphanumeric, generated in Edge Function | Cannot be guessed; server-only generation |
| Price enforcement | Client validates + Edge Function validates (double layer) | Client UX, server correctness |
| Image serving | Supabase Storage public bucket → CDN URL | No signed URLs needed for product images; vendor IDs in private bucket |
| Vendor ID documents | Private Supabase Storage bucket, admin access only | GDPR-adjacent sensitivity |
| Commission calculation | Edge Function on webhook — never on client | Money must be calculated server-side |
| Coupon + gift card at checkout | Both validated server-side before Payment Intent created | Prevents gaming discounts |

## Verification Checkpoints

After each layer is complete, run this before starting the next:

**After Layer 1 (Auth):**
```bash
bunx jest __tests__/lib/auth.test.ts
bunx tsc --noEmit
maestro test e2e/auth-customer.yaml
maestro test e2e/auth-affiliate.yaml
# Manually: invite admin SMS → tap link → complete setup → correct dashboard renders
```

**After Layer 2+3 (Catalogue + Vendor Onboarding):**
```bash
bunx jest __tests__/lib/pricing.test.ts
bunx tsc --noEmit
# Manually: upload product → Groq fills form → publish → visible in vendor catalogue
# Manually: vendor onboarding → ID upload → admin approves → ModemPay sub-account created
```

**After Layer 4+5 (Commerce + Affiliates):**
```bash
bunx jest __tests__/lib/pricing.test.ts
bunx jest __tests__/lib/gift-cards.test.ts
bunx jest __tests__/lib/coupons.test.ts
bunx jest __tests__/lib/webhooks.test.ts
maestro test e2e/checkout-mobile-money.yaml
maestro test e2e/affiliate-share.yaml
# Manually: full checkout → webhook fires → commission ledger entries created
```

**After Layer 6+7 (Promos + Wallets):**
```bash
maestro test e2e/checkout-gift-card.yaml
# Manually: purchase gift card → email received → apply at checkout → GMD 0 total
# Manually: request payout → ModemPay payout fires → WhatsApp confirmation
```

**Final (before EAS build):**
```bash
bunx tsc --noEmit          # Zero type errors
bunx jest --coverage       # All coverage thresholds met
bunx eslint . --max-warnings 0  # Zero lint warnings
eas build --platform ios --profile preview   # Build succeeds
```

---

---

# Phase 3 — Task List

> Every task is completable in one focused session.
> Every task touches ≤ 5 files.
> Complete tasks in order within each phase — dependencies are strict.

---

## Phase 1 Tasks: Foundation — Auth, Roles, Navigation

---

- [ ] **Task P1-01: Supabase project setup + schema migration**
  - Acceptance: `bunx supabase db reset` runs cleanly; all tables from PRD Section 4 exist
    with correct columns, types, and foreign keys
  - Verify: `bunx supabase db reset && bunx supabase db diff` shows no pending changes
  - Files:
    - `supabase/migrations/001_initial_schema.sql`
    - `supabase/config.toml`

---

- [ ] **Task P1-02: RLS policies**
  - Acceptance: Each role can only read/write their own data; cross-role queries return empty
    (not errors); superadmin reads all tables
  - Verify: `bunx jest __tests__/integration/rls.test.ts` — write tests that sign in as each
    role and assert they cannot read other roles' data
  - Files:
    - `supabase/migrations/002_rls_policies.sql`
    - `__tests__/integration/rls.test.ts`

---

- [ ] **Task P1-03: Database indexes + platform_settings seed**
  - Acceptance: All indexes from PRD data model exist; `platform_settings` table has default
    rows for commission_rate, affiliate_rate, sponsored_7day_price, sponsored_30day_price
  - Verify: `bunx supabase db reset` runs clean; query explains on `affiliate_links.short_code`
    show index scan
  - Files:
    - `supabase/migrations/003_indexes.sql`
    - `supabase/migrations/004_seed_data.sql`

---

- [ ] **Task P1-04: Expo project scaffold**
  - Acceptance: `bunx expo start` runs; TypeScript strict mode on (`tsconfig.json`);
    NativeWind configured; ESLint + Prettier configured; path alias `@/` works
  - Verify: `bunx tsc --noEmit` passes; `bunx eslint .` passes; `@/lib/utils/currency`
    import resolves correctly
  - Files:
    - `tsconfig.json`
    - `tailwind.config.ts`
    - `eslint.config.js`
    - `prettier.config.js`
    - `app.json`

---

- [ ] **Task P1-05: Supabase client + auth store**
  - Acceptance: Supabase client singleton exported from `lib/supabase/client.ts`;
    Zustand auth store holds `{ user, role, session }`; session persists across restarts
    via SecureStore
  - Verify: `bunx jest __tests__/lib/auth.test.ts` — mock Supabase, assert store updates
    correctly on sign-in / sign-out
  - Files:
    - `lib/supabase/client.ts`
    - `store/authStore.ts`
    - `__tests__/lib/auth.test.ts`

---

- [ ] **Task P1-06: Root layout + auth redirect**
  - Acceptance: `app/_layout.tsx` wraps app with Sentry + PostHog; on mount checks auth
    state and redirects to correct role dashboard or `(auth)/welcome`; no flash of wrong screen
  - Verify: Manually test in simulator — unauthenticated user → welcome screen;
    each role → correct tab bar after login
  - Files:
    - `app/_layout.tsx`
    - `app/index.tsx`
    - `hooks/useAuth.ts`

---

- [ ] **Task P1-07: Sentry + PostHog initialization**
  - Acceptance: Both SDKs init in `app/_layout.tsx`; Sentry captures a manually thrown
    test error; PostHog receives an `app_opened` event; both visible in respective dashboards
  - Verify: Add `Sentry.captureException(new Error('test'))` → remove after confirming receipt
  - Files:
    - `app/_layout.tsx`
    - `lib/analytics/posthog.ts`
    - `constants/config.ts` (DSN + API keys read from env)

---

- [ ] **Task P1-08: Welcome + role-select screens**
  - Acceptance: Splash → Welcome screen ("Shop Gambia's best" / "Browse as Guest" / "Sign Up"
    / "Sign In"); Sign Up → Role Select ("Shop" vs "Earn commissions"); correct auth path follows
  - Verify: Visual review in simulator; "Browse as Guest" leads to customer home (guest mode);
    role selection routes to correct registration path
  - Files:
    - `app/(auth)/welcome.tsx`
    - `app/(auth)/role-select.tsx`

---

- [ ] **Task P1-09: Phone number + OTP screens**
  - Acceptance: User enters phone → `send-otp` Edge Function fires → Meta WhatsApp Cloud API SMS received;
    OTP entered → Supabase session created; wrong OTP shows error; expired OTP shows error;
    max 3 attempts enforced
  - Verify: `maestro test e2e/auth-customer.yaml` passes through OTP step;
    check Meta WhatsApp Cloud API console for delivered SMS
  - Files:
    - `app/(auth)/login.tsx`
    - `app/(auth)/otp.tsx`
    - `supabase/functions/send-otp/index.ts`
    - `components/auth/OTPInput.tsx`
    - `components/auth/PhoneInput.tsx`

---

- [ ] **Task P1-10: Registration screen (name + password)**
  - Acceptance: New user after OTP → name + password form with Zod validation;
    profile created in `users` table with correct role; redirected to role dashboard
  - Verify: Manually complete full registration as Affiliate and as Customer;
    check `users` table in Supabase Studio for correct role field
  - Files:
    - `app/(auth)/register.tsx`
    - `lib/utils/validation.ts` (phoneSchema, passwordSchema)

---

- [ ] **Task P1-11: Superadmin login (password + OTP 2FA)**
  - Acceptance: Superadmin enters email + password → OTP sent to phone → OTP verified →
    superadmin dashboard renders; no "Sign Up" link visible on login screen for this path
  - Verify: Manually log in as superadmin; confirm no way to reach this via normal role-select
  - Files:
    - `app/(auth)/login.tsx` (update to handle superadmin path)
    - `store/authStore.ts` (update role detection logic)

---

- [ ] **Task P1-12: Role-based tab navigation (all 5 layouts)**
  - Acceptance: Each role has its own `_layout.tsx` with correct tab bar icons and labels;
    navigating to a role route you don't have access to redirects back to correct dashboard
  - Verify: Log in as each role; confirm correct tabs; manually try to navigate to
    `/(superadmin)/dashboard` as a customer — should redirect
  - Files:
    - `app/(superadmin)/_layout.tsx`
    - `app/(admin)/_layout.tsx`
    - `app/(vendor)/_layout.tsx`
    - `app/(affiliate)/_layout.tsx`
    - `app/(customer)/_layout.tsx`

---

- [ ] **Task P1-13: Pending vendor screen + suspended user screen**
  - Acceptance: Vendor with status=pending sees waiting screen with message and no nav tabs;
    any user with status=suspended sees locked screen with reason; both screens block all navigation
  - Verify: Manually set a test vendor to pending; set a test user to suspended; log in as each
  - Files:
    - `app/(vendor)/onboarding/pending.tsx`
    - `app/(auth)/suspended.tsx`
    - `app/index.tsx` (update redirect logic)

---

- [ ] **Task P1-14: Admin invite Edge Function + SMS**
  - Acceptance: Superadmin submits phone number → Edge Function creates user with role=admin
    and status=pending → Meta WhatsApp Cloud API SMS fires with deep link to `/invite/[token]`;
    invite token expires after 24 hours
  - Verify: Check Meta WhatsApp Cloud API console for SMS; tap link in real device → app opens to invite screen
  - Files:
    - `supabase/functions/invite-user/index.ts`
    - `app/(superadmin)/users/create-admin.tsx`

---

- [ ] **Task P1-15: Vendor invite Edge Function + SMS**
  - Acceptance: Admin submits vendor phone → Edge Function creates user with role=vendor,
    status=pending → Meta WhatsApp Cloud API SMS fires → vendor taps link → app opens to vendor onboarding
    (NOT the generic welcome screen)
  - Verify: Full invite flow on real device; `users` table shows vendor record with status=pending
  - Files:
    - `supabase/functions/invite-user/index.ts` (extend for vendor role)
    - `app/(auth)/invite/[token].tsx`
    - `app/(admin)/vendors/invite.tsx`

---

## Phase 2 Tasks: Core Commerce — Catalogue, Pricing, Listings

---

- [ ] **Task P2-01: Supabase Storage buckets**
  - Acceptance: `product-images` bucket is public (CDN URLs work without auth);
    `vendor-documents` bucket is private (requires service role to read);
    upload policies allow authenticated users to write to `product-images`
  - Verify: Upload a test image via Supabase Studio; confirm public CDN URL loads in browser;
    confirm `vendor-documents` URL returns 403 without service role
  - Files:
    - `supabase/migrations/005_storage_buckets.sql`

---

- [ ] **Task P2-02: Product types + query helpers**
  - Acceptance: Supabase types regenerated; `ProductRow`, `VendorListing`, `PriceLayer`
    TypeScript types defined; `getActiveListings()`, `getProductById()` functions written
  - Verify: `bunx tsc --noEmit` passes; `bunx jest __tests__/lib/products.test.ts`
  - Files:
    - `types/supabase.ts` (regenerated)
    - `types/pricing.ts`
    - `lib/supabase/products.ts`
    - `__tests__/lib/products.test.ts`

---

- [ ] **Task P2-03: Pricing utility functions + tests**
  - Acceptance: `calculateCommission()`, `calculateAdminMargin()`, `validateVendorPrice()`,
    `formatGMD()` implemented with 100% test coverage
  - Verify: `bunx jest __tests__/lib/pricing.test.ts --coverage` shows 100% on pricing.ts
  - Files:
    - `lib/utils/pricing.ts`
    - `lib/utils/currency.ts`
    - `__tests__/lib/pricing.test.ts`

---

- [ ] **Task P2-04: Groq vision Edge Function**
  - Acceptance: POST with `{ imageBase64, mimeType }` → returns
    `{ title, description, category, suggested_price_gmd }` as JSON;
    auth required; graceful error if Groq fails; response in < 4 seconds
  - Verify: `bunx supabase functions serve groq-vision` then curl with a test JPEG base64;
    confirm JSON response; confirm 401 without auth header
  - Files:
    - `supabase/functions/groq-vision/index.ts`

---

- [ ] **Task P2-05: Product image upload component**
  - Acceptance: User taps camera/gallery → image picked → compressed to < 1MB →
    uploaded to Supabase Storage → CDN URL returned; supports 1–5 images;
    loading state shown during upload
  - Verify: Upload 5 images in simulator; confirm all URLs resolve; confirm compression
  - Files:
    - `components/product/ProductImages.tsx`
    - `lib/supabase/storage.ts`

---

- [ ] **Task P2-06: Superadmin — add product screen (Groq integrated)**
  - Acceptance: Upload photo → calls `groq-vision` Edge Function → form pre-filled;
    all fields editable; base_price required (server validates > 0);
    product saved with status=draft; can publish (status=active)
  - Verify: Full flow in simulator; check `products` table for correct record
  - Files:
    - `app/(superadmin)/products/add.tsx`
    - `lib/supabase/products.ts` (createProduct mutation)

---

- [ ] **Task P2-07: Superadmin — product list + edit screens**
  - Acceptance: All products listed with category, base_price, status badge;
    can toggle active/inactive; can edit any field; price layer view shows
    base → admin → vendor prices per product
  - Verify: Toggle a product inactive; confirm it disappears from customer feed
  - Files:
    - `app/(superadmin)/products/index.tsx`
    - `app/(superadmin)/products/[id].tsx`

---

- [ ] **Task P2-08: Admin — set margin per product**
  - Acceptance: Admin sees all active products with base_price (read-only) and input
    for admin_price; system enforces admin_price ≥ base_price (client + server);
    price_layers record created/updated on save
  - Verify: Try submitting admin_price below base_price → error shown;
    check `price_layers` table after valid submit
  - Files:
    - `app/(admin)/catalogue/index.tsx`
    - `lib/supabase/products.ts` (setPriceLayer mutation)

---

- [ ] **Task P2-09: Vendor — browse catalogue + set price**
  - Acceptance: Vendor sees products with admin_price as their floor (base_price NOT shown);
    price input enforces vendor_price ≥ admin_price (client + Edge Function server validation);
    live margin preview: "You earn GMD X per sale" updates as price changes;
    `vendor_listings` record created on publish
  - Verify: `bunx jest __tests__/lib/pricing.test.ts`; try submitting below floor → Edge
    Function returns 400; check `vendor_listings` table
  - Files:
    - `app/(vendor)/catalogue/index.tsx`
    - `app/(vendor)/catalogue/[id].tsx`
    - `supabase/functions/set-vendor-price/index.ts` (server-side validation)

---

- [ ] **Task P2-10: Vendor — listing management**
  - Acceptance: "My Listings" shows all vendor's published listings with active/inactive toggle;
    toggle fires instant Supabase update; inactive listings disappear from customer feed within 1s
  - Verify: Toggle listing inactive → confirm not in `getActiveListings()` result
  - Files:
    - `app/(vendor)/listings/index.tsx`
    - `lib/supabase/products.ts` (toggleListingActive mutation)

---

- [ ] **Task P2-11: Vendor — submit own product**
  - Acceptance: Vendor uploads photo → Groq fills title/description;
    submitted product has `inventory_type=vendor_submitted`, `status=pending_review`;
    appears in admin approval queue; not visible to customers until approved
  - Verify: Submit product as vendor; check `products` table for correct status;
    confirm NOT in customer feed
  - Files:
    - `app/(vendor)/listings/add.tsx`
    - `lib/supabase/products.ts` (submitVendorProduct mutation)

---

- [ ] **Task P2-12: OCR Space + Groq document Edge Function**
  - Acceptance: POST with `{ imageBase64 }` → OCR Space extracts text →
    Groq structures into `{ name, id_number, dob, document_type }` JSON;
    raw image saved to `vendor-documents` private bucket;
    structured JSON + image URL saved to `vendor_profiles`
  - Verify: `bunx supabase functions serve ocr-document` → curl with ID photo base64;
    confirm structured JSON response; confirm file in Supabase Storage private bucket
  - Files:
    - `supabase/functions/ocr-document/index.ts`

---

- [ ] **Task P2-13: Vendor onboarding screens (business-info → id-upload → payout-setup)**
  - Acceptance: Three-screen flow after invite link; business-info saves to `vendor_profiles`;
    id-upload calls `ocr-document` Edge Function with loading state and retry prompt on failure;
    payout-setup saves `settlement_code` + `account_number`; final screen = pending.tsx
  - Verify: Complete full onboarding flow in simulator; check `vendor_profiles` record
  - Files:
    - `app/(vendor)/onboarding/business-info.tsx`
    - `app/(vendor)/onboarding/id-upload.tsx`
    - `app/(vendor)/onboarding/payout-setup.tsx`

---

- [ ] **Task P2-14: Admin — vendor review screen (approve/reject)**
  - Acceptance: Admin sees queue of pending vendors; taps vendor → sees structured ID fields
    (from OCR+Groq) prominently + option to view raw ID image; Approve button →
    `create-sub-account` Edge Function fires → vendor notified via WhatsApp;
    Reject button → reason input → SMS sent to vendor
  - Verify: Approve a test vendor; confirm `vendor_profiles.modempay_subaccount_id` populated;
    confirm WhatsApp delivered in Meta WhatsApp Cloud API console
  - Files:
    - `app/(admin)/vendors/queue.tsx`
    - `app/(admin)/vendors/[id].tsx`
    - `supabase/functions/create-sub-account/index.ts`

---

## Phase 3 Tasks: Transactions — Checkout, Affiliates, Promos, Payouts

---

- [ ] **Task P3-01: Cart store + cart screen**
  - Acceptance: `useCartStore` persists items across app restarts via AsyncStorage;
    add/remove/update quantity; cart badge shows item count in tab bar;
    cart screen shows items, quantities, subtotal; empty state handled
  - Verify: Add 3 products → kill app → reopen → items still in cart
  - Files:
    - `store/cartStore.ts`
    - `app/(customer)/cart.tsx`
    - `components/checkout/CartItem.tsx`

---

- [ ] **Task P3-02: Coupon validation Edge Function + tests**
  - Acceptance: POST `{ code, cart_total, user_id }` → validates: exists, active,
    within dates, under max_uses, under per-user limit, meets minimum order;
    returns `{ valid, discount_amount, discount_type, message }`;
    100% test coverage on all validation branches
  - Verify: `bunx jest __tests__/lib/coupons.test.ts --coverage`
  - Files:
    - `supabase/functions/validate-coupon/index.ts`
    - `lib/supabase/coupons.ts`
    - `__tests__/lib/coupons.test.ts`

---

- [ ] **Task P3-03: Gift card validation utility + tests**
  - Acceptance: `validateGiftCard(code)` checks: exists, status=active, not expired,
    remaining_balance > 0; returns `{ valid, balance, cardId, message }`;
    100% test coverage including edge cases (partial balance, fully used, expired)
  - Verify: `bunx jest __tests__/lib/gift-cards.test.ts --coverage`
  - Files:
    - `lib/supabase/gift-cards.ts`
    - `__tests__/lib/gift-cards.test.ts`

---

- [ ] **Task P3-04: Checkout screen — address + payment method**
  - Acceptance: Delivery address (pre-filled from profile, editable); payment method
    selector: QMoney / AfriMoney / Wave / Cash on Delivery / Gift Card;
    gift card and coupon inputs with real-time validation against Edge Functions;
    order total updates live as discounts applied; "Place Order" disabled until address filled
  - Verify: Apply coupon + gift card together → combined discount shown correctly;
    `useCartStore.discountedTotal()` matches displayed total
  - Files:
    - `app/(customer)/checkout/index.tsx`
    - `store/checkoutStore.ts`
    - `components/checkout/PaymentMethodSelector.tsx`
    - `components/checkout/GiftCardInput.tsx`
    - `components/checkout/CouponInput.tsx`

---

- [ ] **Task P3-05: ModemPay Payment Intent + checkout payment screen**
  - Acceptance: On "Place Order" → order record created with status=placed, payment_status=pending
    → Edge Function creates ModemPay Payment Intent with vendor sub-account attached →
    payment screen shows instructions for customer to approve on their mobile money app;
    COD path skips payment and goes direct to success screen
  - Verify: Complete sandbox checkout end-to-end; check `orders` table + `modempay_payment_id`
  - Files:
    - `app/(customer)/checkout/payment.tsx`
    - `app/(customer)/checkout/success.tsx`
    - `supabase/functions/create-payment-intent/index.ts`

---

- [ ] **Task P3-06: ModemPay webhook Edge Function + commission split**
  - Acceptance: Webhook signature verified (reject unsigned requests with 401);
    idempotency check: if `commission_ledger` already has entries for `order_id`, return 200
    without re-processing; on success: order updated, commission_ledger entries created for
    vendor + affiliate (if any) + admin + platform; Meta WhatsApp Cloud API WhatsApp fires to vendor
  - Verify: `bunx jest __tests__/lib/webhooks.test.ts` — test signature verification,
    idempotency, correct commission splits; manually trigger webhook in ModemPay sandbox
  - Files:
    - `supabase/functions/modempay-webhook/index.ts`
    - `lib/modempay/webhooks.ts`
    - `__tests__/lib/webhooks.test.ts`

---

- [ ] **Task P3-07: Affiliate link generation + short-code utility**
  - Acceptance: `generateShortCode()` returns cryptographically random 8-char alphanumeric;
    `getOrCreateAffiliateLink(affiliateId, listingId)` returns existing link or creates new one;
    short_code is unique (DB unique constraint enforced + retry on collision);
    link URL format: `temsmarket.com/p/{short_code}`
  - Verify: `bunx jest __tests__/lib/short-code.test.ts`; create 100 codes — all unique
  - Files:
    - `lib/utils/short-code.ts`
    - `lib/supabase/affiliate-links.ts` (getOrCreateAffiliateLink)
    - `__tests__/lib/short-code.test.ts`

---

- [ ] **Task P3-08: Universal Links + App Links setup**
  - Acceptance: `apple-app-site-association` file served from website at `/.well-known/`;
    `assetlinks.json` served from website at `/.well-known/`;
    tapping `temsmarket.com/p/{code}` on iOS (with app installed) opens app directly;
    tapping on Android (with app installed) opens app directly;
    tapping without app installed → website product page
  - Verify: Test on physical device with app installed; test without app installed
  - Files:
    - `website/app/.well-known/apple-app-site-association/route.ts`
    - `website/app/.well-known/assetlinks.json/route.ts`
    - `app.json` (add `associatedDomains`, `intentFilters`)

---

- [ ] **Task P3-09: /p/[code] screen in Expo + website landing page**
  - Acceptance: App receives deep link → `app/p/[code].tsx` looks up `short_code` →
    gets `listing_id` → navigates to product detail with `affiliateLinkId` in route params;
    website `website/app/p/[code]/page.tsx` shows product card + "Download Tems Market" button
    when app not installed
  - Verify: Tap link on device with app → correct product opens; tap on device without app →
    website shows correct product + download CTA
  - Files:
    - `app/p/[code].tsx`
    - `website/app/p/[code]/page.tsx`
    - `lib/supabase/affiliate-links.ts` (resolveShortCode)

---

- [ ] **Task P3-10: Affiliate share sheet + product detail (affiliate view)**
  - Acceptance: Affiliate browses listings; each card shows "Your commission: GMD X";
    product detail shows "Get My Link" button; tapping generates/retrieves link and opens
    native share sheet with WhatsApp, Facebook, TikTok, Instagram, Copy options;
    `affiliate_link_shared` PostHog event fires with channel property
  - Verify: Generate link → share via Copy → paste in browser → correct product opens
  - Files:
    - `app/(affiliate)/products/[id].tsx`
    - `app/(affiliate)/links/share/[id].tsx`
    - `components/affiliate/ShareSheet.tsx`
    - `components/affiliate/CommissionBadge.tsx`

---

- [ ] **Task P3-11: Affiliate dashboard + link performance screen**
  - Acceptance: Earnings screen shows today / this week / total; pending vs available balance;
    "My Links" screen shows all generated links with per-link: clicks, conversions, GMD earned;
    Supabase Realtime subscription updates balance when new commission_ledger entry created
  - Verify: Place test order via affiliate link → commission appears in affiliate dashboard
    within 5 seconds (Realtime)
  - Files:
    - `app/(affiliate)/earnings.tsx`
    - `app/(affiliate)/links/index.tsx`
    - `hooks/useWallet.ts`
    - `lib/supabase/realtime.ts`

---

- [ ] **Task P3-12: Payout request + payout-commission Edge Function**
  - Acceptance: "Request Payout" sheet shows available balance; input for mobile money number
    (pre-filled if saved); confirm → Edge Function calls ModemPay Payouts API;
    `commission_ledger` entries updated to status=paid; WhatsApp notification on success/failure;
    minimum 10 GMD enforced; graceful error on ModemPay failure (status set to failed, not lost)
  - Verify: Request payout in sandbox; check ModemPay dashboard for payout record;
    check WhatsApp notification delivered
  - Files:
    - `supabase/functions/payout-commission/index.ts`
    - `components/wallet/PayoutSheet.tsx`
    - `app/(affiliate)/payouts.tsx`
    - `app/(vendor)/wallet.tsx`

---

- [ ] **Task P3-13: Wallet screens (all roles)**
  - Acceptance: Each role sees their wallet: balance card, transaction history list,
    payout request button (disabled if < 10 GMD); superadmin sees platform-wide
    total revenue, fees earned, total paid out
  - Verify: Make 3 test orders → commission entries created → each role's wallet shows
    correct balance
  - Files:
    - `app/(vendor)/wallet.tsx`
    - `app/(affiliate)/payouts.tsx`
    - `app/(admin)/wallet.tsx`
    - `app/(superadmin)/orders/index.tsx` (add financial summary)
    - `components/wallet/BalanceCard.tsx`
    - `components/wallet/TransactionRow.tsx`

---

- [ ] **Task P3-14: Gift card purchase flow**
  - Acceptance: Customer taps "Buy Gift Card" → enters denomination, recipient email,
    recipient name, personal message → pays via ModemPay → webhook fires →
    Edge Function generates 16-char code → saves to `gift_cards` table →
    `send-gift-card-email` Edge Function fires → Resend delivers branded email
  - Verify: Complete purchase in sandbox; check email delivered; verify code in `gift_cards` table
  - Files:
    - `app/(customer)/checkout/gift-card.tsx`
    - `supabase/functions/send-gift-card-email/index.ts`
    - `lib/supabase/gift-cards.ts` (createGiftCard, generateCode)

---

- [ ] **Task P3-15: Gift card redemption at checkout**
  - Acceptance: Customer enters gift card code at checkout → validated in real time
    (Edge Function: active, not expired, has balance); total reduced; full cover = GMD 0 due;
    partial cover = remainder shown; mixed with coupon works; on order complete →
    `gift_card_redemptions` record created → `remaining_balance` decremented atomically in
    Supabase transaction
  - Verify: `bunx jest __tests__/lib/gift-cards.test.ts --coverage`; full cover E2E test:
    `maestro test e2e/checkout-gift-card.yaml`
  - Files:
    - `lib/supabase/gift-cards.ts` (redeemGiftCard — atomic transaction)
    - `store/checkoutStore.ts` (applyGiftCard)
    - `app/(customer)/checkout/index.tsx` (wire input)
    - `__tests__/lib/gift-cards.test.ts` (add redemption tests)

---

- [ ] **Task P3-16: Coupon creation screens (superadmin + admin)**
  - Acceptance: Superadmin and admin can create coupons: code, type (% or GMD), value,
    minimum order, max uses, per-user limit, validity dates; coupon list shows uses_so_far,
    GMD discounted total, status; instant pause/expire toggle
  - Verify: Create "TEST50" for 50% off, min order GMD 500; apply at checkout with
    GMD 600 cart → discount shown; apply with GMD 400 cart → error shown
  - Files:
    - `app/(superadmin)/promos/coupons.tsx`
    - `app/(admin)/catalogue/index.tsx` (add coupon management tab)
    - `lib/supabase/coupons.ts` (createCoupon, listCoupons, toggleCoupon)

---

- [ ] **Task P3-17: Sponsored listing purchase flow + feed placement**
  - Acceptance: Vendor taps "Promote" on active listing → plan selector (7-day / 30-day,
    prices from `platform_settings`) → pays via ModemPay → `featured_listings` record created
    with status=active, ends_at set → listing appears in "Sponsored" row on customer home feed;
    row is clearly labelled "Sponsored"; vendor sees "X days left" badge on listing
  - Verify: Purchase in sandbox; confirm listing in sponsored row; check `featured_listings` table
  - Files:
    - `app/(vendor)/listings/promote/[id].tsx`
    - `lib/supabase/featured-listings.ts`
    - `app/(customer)/home.tsx` (add sponsored row, labelled)
    - `components/product/SponsoredBadge.tsx`

---

- [ ] **Task P3-18: Sponsored listing expiry scheduled function**
  - Acceptance: Supabase pg_cron job runs every hour; sets `featured_listings.status=expired`
    for rows where `ends_at < now()` and `status=active`; expired listings no longer appear
    in sponsored row query
  - Verify: Manually set `ends_at` to past timestamp; confirm listing removed from feed after
    next cron run (or trigger manually)
  - Files:
    - `supabase/migrations/006_cron_expire_featured.sql`
    - `lib/supabase/featured-listings.ts` (getActiveFeaturedListings query excludes expired)

---

- [ ] **Task P3-19: Order status management (vendor) + Realtime tracking (customer)**
  - Acceptance: Vendor orders screen shows incoming orders with status; vendor taps order →
    updates status (placed → confirmed → preparing → ready → delivered); each status change
    fires Meta WhatsApp Cloud API WhatsApp to customer; customer order tracking screen updates in real time
    via Supabase Realtime (no manual refresh needed)
  - Verify: `maestro test e2e/order-status.yaml`; update status on simulator →
    confirm WhatsApp to customer; confirm customer screen updates without refresh
  - Files:
    - `app/(vendor)/orders/index.tsx`
    - `app/(vendor)/orders/[id].tsx`
    - `app/(customer)/orders/[id].tsx`
    - `lib/supabase/realtime.ts` (subscribeToOrder)
    - `hooks/useOrder.ts`

---

- [ ] **Task P3-20: All Meta WhatsApp Cloud API notification events wired**
  - Acceptance: Every event in PRD Feature 11 Notification Event Map fires correctly;
    all sent notifications logged in `notifications_log` table with meta_whatsapp_sid
  - Verify: Go through notification event map one by one; trigger each event in simulator;
    check Meta WhatsApp Cloud API console + `notifications_log` table
  - Files:
    - `supabase/functions/send-otp/index.ts` (already done, verify logging)
    - `supabase/functions/invite-user/index.ts` (already done, verify logging)
    - `supabase/functions/modempay-webhook/index.ts` (add all order/payment notifications)
    - `supabase/functions/payout-commission/index.ts` (add payout notifications)
    - `lib/supabase/notifications.ts` (shared Meta WhatsApp Cloud API send + log helper)

---

## Phase 4 Tasks: Polish, Subscriptions + Launch

---

- [ ] **Task P4-01: RevenueCat vendor subscription**
  - Acceptance: RevenueCat configured for iOS + Android + Web; vendor subscription product
    created in App Store Connect + Play Console; paywall shown in vendor dashboard if not subscribed;
    entitlement unlocks full vendor features; web billing works via RevenueCat web paywall
  - Verify: Subscribe in App Store sandbox; confirm entitlement granted; cancel → confirm revoked
  - Files:
    - `lib/revenuecat/client.ts`
    - `app/(vendor)/dashboard.tsx` (add subscription gate)
    - `constants/config.ts` (RevenueCat API keys)

---

- [ ] **Task P4-02: PostHog event audit**
  - Acceptance: Every event in PRD Section 12 PostHog Events table fires with correct properties;
    verified in PostHog Live Events view; no duplicate or missing events
  - Verify: Run through all major flows in simulator; check PostHog Live Events for each
  - Files:
    - `lib/analytics/posthog.ts` (audit + add any missing events)
    - Any screen file missing `posthog.capture()` calls

---

- [ ] **Task P4-03: Error handling + loading states audit**
  - Acceptance: Every async operation (API call, Edge Function, payment) has:
    loading state shown to user; graceful error message on failure (not crash);
    retry option where appropriate; Sentry captures the error with context
  - Verify: Kill network during checkout → friendly error shown; Sentry receives event
  - Files: All screen files and lib functions (audit pass — not a full rewrite)

---

- [ ] **Task P4-04: Marketing website — landing page**
  - Acceptance: Next.js site at `temsmarket.com`; hero section with tagline;
    "How it works" section (3 steps for each role: vendor, affiliate, customer);
    App Store button + Play Store button as primary CTAs;
    `/p/[code]` affiliate link landing pages functional (from P3-09)
  - Verify: Deploy to Vercel/Netlify; test on mobile browser; App Store link opens store
  - Files:
    - `website/app/page.tsx`
    - `website/app/layout.tsx`
    - `website/components/` (Hero, HowItWorks, DownloadButtons, RoleCard)

---

- [ ] **Task P4-05: Security audit**
  - Acceptance: Zero API keys in compiled JS bundle (verify with `strings` on built binary);
    all RLS policies tested (integration tests from P1-02 pass);
    all Edge Functions reject unauthenticated requests;
    ModemPay webhook requires signature verification (tested in P3-06);
    vendor document images inaccessible without service role;
    `bunx eslint . --max-warnings 0` passes
  - Verify: `bunx jest --coverage` all thresholds met; manual RLS check via Supabase Studio
  - Files: No new files — audit pass on existing code

---

- [ ] **Task P4-06: Performance audit**
  - Acceptance: Cold start (splash → home feed) < 3 seconds on mid-range Android (measured
    via Sentry performance); product feed load < 2 seconds; images lazy-loaded with
    placeholder; Groq product description < 4 seconds (measured in simulator)
  - Verify: Sentry Performance dashboard after 10 cold-start sessions
  - Files:
    - `app/(customer)/home.tsx` (add image lazy loading if needed)
    - `lib/supabase/products.ts` (add pagination if feed is slow)

---

- [ ] **Task P4-07: EAS build + store submission**
  - Acceptance: `eas build --platform ios` succeeds; `eas build --platform android` succeeds;
    App Store Connect shows build uploaded; Play Console shows build uploaded;
    app metadata (screenshots, description, age rating) complete in both stores
  - Verify: TestFlight build installable on physical iPhone; internal testing track installable
    on Android
  - Files:
    - `eas.json`
    - `app.json` (version, bundle ID, permissions list)

---

## Task Summary Table

| Phase | Tasks | Checkpoint Goal |
|-------|-------|----------------|
| P1 Foundation | P1-01 → P1-15 (15 tasks) | All 5 roles onboard + reach correct dashboard |
| P2 Commerce | P2-01 → P2-14 (14 tasks) | Products listed, priced in layers, vendor verified |
| P3 Transactions | P3-01 → P3-20 (20 tasks) | Money moves, affiliates earn, promos work |
| P4 Launch | P4-01 → P4-07 (7 tasks) | Production build submitted to both stores |
| **Total** | **56 tasks** | **Tems Market ships** |

---

> When ready to implement: work through tasks in order within each phase.
> Mark `[ ]` as `[x]` as each task is completed.
> Do not start Phase 2 tasks until all Phase 1 tasks are `[x]`.
> Update this spec if any task reveals a new pattern or architectural decision.
