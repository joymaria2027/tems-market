# Hormozi Landing Page Audit + Remediation Plan

Audit of Tems Market's two landing-surface pages — **Index.tsx** (customer-facing homepage) and **BecomeVendor.tsx** (vendor acquisition page) — against the Alex Hormozi landing page checklist. This plan identifies every gap and proposes surgical fixes.

---

## Audit Results

### Index.tsx (Customer Homepage)

| # | Checklist Item | Status | Finding |
|---|----------------|--------|---------|
| 1 | **Headline — stops visitor, promises outcome** | ❌ FAIL | "Discover unique finds from independent vendors" is vague. No clear outcome or promise. It describes what Tems Market *is*, not what the visitor *gets*. |
| 2 | **Sub-headline — adds context** | ⚠️ WEAK | "Shop handpicked products from trusted sellers…" repeats the headline instead of clarifying it. |
| 3 | **Hero image — adds proof** | ❌ FAIL | Unsplash stock photos (fashion, generic store). No proof of outcome, no screenshot of actual products or marketplace. |
| 4 | **CTA — what + how, nothing else** | ❌ MISSING | There is **no CTA** on the homepage. The slideshow links to `/shop` but has no visible button telling the visitor what to do or what they get. |
| 5 | **Form / opt-in fields** | N/A | Homepage is a browse page, not a lead capture page. However, there's no email capture, no "get notified" — missed opportunity. |
| 6 | **Lead magnet description** | N/A | No lead magnet exists. |
| 7 | **Below-fold bullets (top 3 objections)** | ❌ MISSING | None. Page jumps straight to sponsored products and product grid. No objection handling. |
| 8 | **Social proof** | ❌ MISSING | Zero testimonials, reviews, or trust signals on the homepage. |
| 9 | **Visual design — blank/focused** | ⚠️ MIXED | The intro section is clean, but then the page bloats with a full product grid, category tabs, and sponsored rows that dilute focus. |
| 10 | **Mobile optimized** | ✅ PASS | Responsive grid (2→3→4 cols), mobile nav hamburger. |
| 11 | **Fast loading / compressed images** | ❌ FAIL | Hero images are uncompressed Unsplash URLs (`w=1600&q=80`). Slideshow loads 3 full-size images eagerly. No `loading="lazy"`, no WebP, no srcSet. |
| 12 | **Legal (privacy, terms)** | ❌ FAIL | Footer has "Privacy Policy" as a dead `<span>`, not a link. No Terms of Service link. No actual privacy or terms pages exist. |

**Homepage Score: 2/12 checks passing.**

---

### BecomeVendor.tsx (Vendor Landing Page)

| # | Checklist Item | Status | Finding |
|---|----------------|--------|---------|
| 1 | **Headline — stops visitor, promises outcome** | ⚠️ WEAK | "Sell on Tems Market" names the action but doesn't promise an outcome. Should promise *what the vendor gets* (e.g., revenue, customers, growth). |
| 2 | **Sub-headline — adds context** | ⚠️ WEAK | "Reach thousands of customers…" is better but still generic. Doesn't clarify the *how* or *why Tems is different*. |
| 3 | **Hero image — adds proof** | ❌ FAIL | No hero image at all. Just a gradient background. No vendor dashboard screenshot, no product photos, no outcome visualization. |
| 4 | **CTA — what + how** | ⚠️ PARTIAL | "Get Started" / "Start Selling" is action-oriented but doesn't say what they get. "Create your vendor account and start selling in minutes" would be better. Also: two CTAs in hero (primary + "Browse Marketplace") — the second dilutes. |
| 5 | **Form fields** | ✅ PASS | Form is on a separate page (`ApplyAsVendor.tsx`). Smart separation. |
| 6 | **Lead magnet description** | N/A | Not a lead-capture page. |
| 7 | **Below-fold bullets (top 3 objections)** | ❌ FAIL | 6 benefit cards instead of 3. Not framed as objection-handling. Should be the **3 biggest objections** (trust, cost, difficulty) in order. |
| 8 | **Social proof** | ⚠️ WEAK | Has 2 testimonials, but they appear to be fabricated/placeholder ("Fatou J.", "Amadou B."). Fake social proof is worse than none. Also placed too late on the page. |
| 9 | **Visual design — blank/focused** | ❌ FAIL | Page is **too long**: Hero → 4-stat grid → 6 benefit cards → 4-step how-it-works → testimonials → bottom CTA. Hormozi rule: more length = lower conversion. |
| 10 | **Mobile optimized** | ✅ PASS | Responsive grids, stacked on mobile. |
| 11 | **Fast loading** | ✅ PASS | No heavy images on this page. |
| 12 | **Legal** | ❌ FAIL | Same dead footer links. No privacy policy or terms page. |

**BecomeVendor Score: 3/12 checks passing.**

---

## User Review Required

> [!IMPORTANT]
> **Placeholder Testimonials:** The BecomeVendor page has what appear to be fabricated testimonials ("Fatou J.", "Amadou B."). Per Hormozi's framework, fake social proof hurts more than helps. Options:
> 1. **Remove them entirely** until you have real vendor quotes
> 2. **Replace with real data** (actual vendor count, GMD transacted, etc.)
> 3. **Keep but mark as examples** — not recommended
>
> Which approach do you prefer?

> [!WARNING]
> **Homepage identity:** The current Index.tsx is a product-browse page, not a conversion landing page. Hormozi's rules apply best to **single-action** pages. Options:
> 1. **Apply Hormozi principles to the existing browse page** — sharpen hero, add CTA, trim below-fold noise
> 2. **Create a separate dedicated landing page** (e.g., `/welcome`) for first-time visitors that funnels to signup, and keep Index as the logged-in browse experience
>
> Which direction do you want?

---

## Open Questions

1. **Do you have real vendor testimonials or customer data** (actual vendor count, order volume) that can replace the placeholder stats ("500+ Active Customers", "50+ Vendors")?
2. **What is the primary conversion goal** for the homepage? Sign up? Browse → purchase? Something else?
3. **Do you want a privacy policy and terms of service page generated**, or will you provide copy?

---

## Proposed Changes

### Component 1 — Headlines & Copy (Index.tsx + BecomeVendor.tsx)

#### [MODIFY] [Index.tsx](file:///home/aixrichlian/Downloads/lovable-project-151b6c0c/src/pages/Index.tsx)
- **Headline**: Replace "Discover unique finds from independent vendors" with an outcome-driven headline (e.g., "Shop the best of The Gambia — delivered to your door")
- **Sub-headline**: Replace generic description with a clarifying statement that adds context to the headline
- **Add CTA section**: Below hero, add a clear single-action CTA button with what + how (e.g., "Browse 1,000+ products → Start shopping now")
- **Add 3 objection-handling bullets**: Below CTA — address trust, speed, and local support
- **Trim product grid below fold**: Keep sponsored row but consider removing full product grid from homepage (or lazy-load it)

#### [MODIFY] [BecomeVendor.tsx](file:///home/aixrichlian/Downloads/lovable-project-151b6c0c/src/pages/BecomeVendor.tsx)
- **Headline**: Replace "Sell on Tems Market" with outcome promise (e.g., "Turn your products into income — sell to thousands across The Gambia")
- **Sub-headline**: Clarify the how/why ("List in minutes. Set your own prices. Get paid on every sale.")
- **Reduce 6 benefits to 3 bullets**: Reframe as objection-handling, ordered by frequency
- **Remove or condense "How It Works"**: Fold into 1 line or remove entirely
- **Remove placeholder testimonials** (pending user decision)
- **Remove duplicate CTA section** at bottom — one CTA, one action
- **Remove "Browse Marketplace" secondary CTA** from hero — it dilutes the primary action

---

### Component 2 — Hero Image / Proof (Slideshow + BecomeVendor)

#### [MODIFY] [slideshow.tsx](file:///home/aixrichlian/Downloads/lovable-project-151b6c0c/src/components/ui/slideshow.tsx)
- Replace generic Unsplash stock photos with proof-of-outcome images (actual marketplace screenshots, product photos, or vendor success visuals)
- Compress hero images: switch from `q=80` to `q=60`, add `w=800` for mobile via `srcSet`
- Add `loading="lazy"` for non-initial slides

#### [MODIFY] [BecomeVendor.tsx](file:///home/aixrichlian/Downloads/lovable-project-151b6c0c/src/pages/BecomeVendor.tsx)
- Add hero image: vendor dashboard screenshot or mock showing actual product listings and sales numbers
- Image should visually prove the outcome ("this is what your store looks like")

---

### Component 3 — Performance & Image Loading

#### [MODIFY] [ProductCard.tsx](file:///home/aixrichlian/Downloads/lovable-project-151b6c0c/src/components/ProductCard.tsx)
- Audit and ensure `loading="lazy"` on all product card images
- Add `srcSet` for responsive image sizing

#### [MODIFY] [ShopProductCard.tsx](file:///home/aixrichlian/Downloads/lovable-project-151b6c0c/src/components/ShopProductCard.tsx)
- Same lazy loading and `srcSet` treatment

#### [MODIFY] [Index.tsx](file:///home/aixrichlian/Downloads/lovable-project-151b6c0c/src/pages/Index.tsx)
- Reduce hero slide images from 3 to 1 (or preload only the first, lazy-load the rest)

---

### Component 4 — Legal Compliance

#### [NEW] [PrivacyPolicy.tsx](file:///home/aixrichlian/Downloads/lovable-project-151b6c0c/src/pages/PrivacyPolicy.tsx)
- Scaffold a privacy policy page with placeholder sections (data collection, usage, cookies, contact)
- Route: `/privacy`

#### [NEW] [TermsOfService.tsx](file:///home/aixrichlian/Downloads/lovable-project-151b6c0c/src/pages/TermsOfService.tsx)
- Scaffold a terms of service page
- Route: `/terms`

#### [MODIFY] [Footer.tsx](file:///home/aixrichlian/Downloads/lovable-project-151b6c0c/src/components/layout/Footer.tsx)
- Convert dead `<span>` elements ("Privacy Policy", "Contact Us") to actual `<Link>` components pointing to the new routes

#### [MODIFY] Router config
- Add routes for `/privacy` and `/terms`

---

### Component 5 — CTA Optimization

#### [MODIFY] [Index.tsx](file:///home/aixrichlian/Downloads/lovable-project-151b6c0c/src/pages/Index.tsx)
- Add a prominent CTA section directly below the hero slideshow (before products)
- CTA text: states what they get + how they get it
- Single button, no secondary action

#### [MODIFY] [BecomeVendor.tsx](file:///home/aixrichlian/Downloads/lovable-project-151b6c0c/src/pages/BecomeVendor.tsx)
- Consolidate to single CTA in hero
- Remove "Browse Marketplace" secondary button
- CTA text: "Create your free vendor account" (what) + inline "Takes 3 minutes" (how)

---

### Component 6 — SEO Meta (index.html)

#### [MODIFY] [index.html](file:///home/aixrichlian/Downloads/lovable-project-151b6c0c/index.html)
- Replace "Layered-Margin Social Commerce" (internal jargon) with customer-facing description
- Update `og:description` to match the new headline copy

---

## Verification Plan

### Automated Tests
- `bunx tsc --noEmit` — no TypeScript errors after changes
- `bunx vite build` — production build succeeds, no missing routes
- Lighthouse mobile audit on homepage — target LCP < 2.5s after image compression

### Manual Verification
- Visual comparison of before/after on mobile viewport (375px)
- Click every footer link — confirm privacy and terms pages load
- Confirm single CTA per page section — no competing actions
- Review hero image proof: does the image show outcome or product?

### Hormozi Checklist Re-audit
- Re-run the 12-point checklist on both pages after changes
- Target: 10/12 passing (the 2 N/A items excluded)
