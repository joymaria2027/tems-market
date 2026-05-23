# Spec: Branding & GMD Currency Formatting

## Objective
The goal is to establish the correct visual identity for Tems Market by migrating all generic "ShopHub" branding elements and implementing the unified, standard Gambian currency formatting (`formatGMD()`) across all pages, components, hooks, local storage preferences, and email/notification templates.

### User Stories & Requirements
1. **Branding Realignment:** As a platform owner, I want every customer-facing and backend screen to show "Tems Market" instead of "ShopHub" so the platform feels professional, cohesive, and correct.
2. **Unified Currency Display:** As a Gambian shopper or affiliate, I want all price tags to show as `GMD X,XXX.XX` (or whole numbers where applicable) rather than a simple prefix `D` (which is often ambiguous) or raw unformatted numbers.
3. **Consistency:** All local storage preferences, email notifications, metadata, and HTML title headers must reflect "Tems Market".

---

## Tech Stack
- **Framework:** React 18 (Vite-powered Single Page Application)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v3, Shadcn UI
- **Formatting Tools:** Intl.NumberFormat (for currency formatting)

---

## Commands
- Build: `npm run build` or `bun run build`
- Dev Server: `npm run dev` or `bun run dev`
- Lint: `npm run lint` or `bun run lint`
- Test: `npm run test` or `bun run test`

---

## Project Structure
- `src/lib/utils/currency.ts` → Contains the core `formatGMD` function and related currency formatting tools.
- `src/components/` → Pre-existing layout headers, footers, product cards.
- `src/pages/` → Checkout, BecomeVendor, OrderConfirmation, Login, Signup.
- `supabase/functions/` → Email notification templates containing "ShopHub".

---

## Code Style
The `formatGMD` utility should be clean, robust, and handle numbers, strings, and edge cases gracefully:

```typescript
/**
 * Formats a numeric value into Gambian Dalasi currency string (GMD X,XXX.XX).
 * Handles null, undefined, strings, and large numbers gracefully.
 */
export function formatGMD(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return "GMD 0.00";
  }
  const numericAmount = Number(amount);
  
  // Format to two decimal places with thousands separators
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
  
  return `GMD ${formatted}`;
}
```

---

## Testing Strategy
- **Unit Testing:** Write unit tests for `formatGMD` in `src/test/currency.test.ts` to verify inputs (numbers, string numbers, null, undefined, negative numbers, very large numbers).
- **Compilation Check:** Run `bun run build` to verify no TypeScript or linting errors exist after replacing variables and functions.

---

## Boundaries
- **Always:** Use `formatGMD()` for rendering any pricing amounts in the JSX layout.
- **Ask first:** Renaming persistent state values or database columns if they contain ShopHub (none exist currently).
- **Never:** Use raw numbers or manual concatenation (`"GMD " + price`) in code. Always import `formatGMD` or modify the standard currency hook `useCurrency` to leverage `formatGMD`.

---

## Success Criteria
- [ ] No occurrences of the word "ShopHub" remain in client-side code, index.html metadata, or Edge Function templates.
- [ ] The browser document tab shows "Tems Market" as the title.
- [ ] All price displays across the store, product detail pages, checkout page, and cart show correct GMD currency structure `GMD X,XXX.XX` (e.g., `GMD 1,200.00`).
- [ ] Unit tests for `formatGMD` cover normal, zero, negative, large, and invalid inputs and pass successfully.
- [ ] Local storage cached exchange rates and currency preferences use "temsmarket_" instead of "shophub_".

---

## Open Questions
- Do we support dynamic local switching of currencies (USD/EUR) in Tems Market?
  - *Answer:* The PRD and Design Brief indicate "All prices in GMD — displayed as GMD 1,200 or similar." While `useCurrency` supports multiple rates, the default standard must format as GMD first. We will retain the optional currency converter but enforce the default and formatting logic to show GMD by default, using `formatGMD`.
