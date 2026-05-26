# Hormozi Landing Page Remediation — Tasks

## Component 6 — SEO Meta
- [ ] Update `index.html` title and meta descriptions (remove internal jargon)

## Component 4 — Legal Compliance
- [ ] Create `PrivacyPolicy.tsx` page
- [ ] Create `TermsOfService.tsx` page
- [ ] Add `/privacy` and `/terms` routes
- [ ] Fix `Footer.tsx` — convert dead `<span>` to `<Link>` components

## Component 1+5 — Headlines, Copy, and CTA
- [ ] **Index.tsx** — Rewrite headline + sub-headline for outcome-driven copy
- [ ] **Index.tsx** — Add CTA section below hero
- [ ] **Index.tsx** — Add 3 objection-handling bullets
- [ ] **BecomeVendor.tsx** — Rewrite headline + sub-headline
- [ ] **BecomeVendor.tsx** — Reduce 6 benefits → 3 objection bullets
- [ ] **BecomeVendor.tsx** — Remove "How It Works" section (or condense to 1 line)
- [ ] **BecomeVendor.tsx** — Remove placeholder testimonials
- [ ] **BecomeVendor.tsx** — Consolidate CTAs (remove secondary, remove bottom duplicate)

## Component 2 — Hero Image / Proof
- [ ] **Index.tsx slideshow** — Replace stock photos with proof-of-outcome images
- [ ] **BecomeVendor.tsx** — Add hero image showing vendor dashboard/outcome

## Component 3 — Performance
- [ ] Slideshow — lazy load non-initial slides, compress image URLs
- [ ] ProductCard / ShopProductCard — ensure `loading="lazy"` on images

## Verification
- [ ] `bunx tsc --noEmit` passes
- [ ] `bunx vite build` succeeds
- [ ] Re-audit both pages against 12-point checklist
