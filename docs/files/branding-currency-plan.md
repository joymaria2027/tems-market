# Implementation Plan: Branding & GMD Currency Formatting

## Overview
This plan decomposes the Branding & GMD Currency Formatting spec into small, sequential, verifiable tasks to ensure Tems Market is cleanly branded and has a robust, standard Gambian currency formatting utility (`formatGMD()`) that is used consistently across the codebase.

## Architectural Decisions
1. **Utility Location:** Build a pure formatting helper `formatGMD(amount)` in `src/lib/utils/currency.ts` so it is highly reusable, importable across both hooks and pages, and completely unit-tested.
2. **Hook Integration:** Refactor the existing `useCurrency.ts` hook to delegate formatting to `formatGMD()` for the GMD case, preserving its existing multi-currency conversion cache and rate logic for other currencies if required, but defaulting the platform's visual presentation to Gambian Dalasi (`GMD`).
3. **Surgical Search-and-Replace:** Leverage our grep findings to surgically replace "ShopHub" and default currency "D" prefix across the layout files, login/signup flows, email function templates, and metadata with no adjacent code breakage.

---

## Task List

### Phase 1: Currency Formatting Foundation
- [ ] **Task 1.1: Build `formatGMD` Utility Function**
  - **Description:** Implement the `formatGMD` function inside `src/lib/utils/currency.ts` with comprehensive edge case handling (null, undefined, string numbers, NaNs).
  - **Acceptance criteria:**
    - Function parses numbers or numeric strings properly.
    - Output matches exact format: `GMD X,XXX.XX` (e.g., `formatGMD(1250.5)` -> `"GMD 1,250.50"`).
    - Null/undefined/invalid yields `"GMD 0.00"`.
  - **Verification:** Run unit tests for this function.
  - **Files:** `src/lib/utils/currency.ts`
  - **Estimated scope:** XS (1 file)

- [ ] **Task 1.2: Add Unit Tests for `formatGMD`**
  - **Description:** Create a unit test suite to thoroughly cover the helper's edge cases and ensure 100% correct behaviour.
  - **Acceptance criteria:**
    - Test cases cover: valid integer, float, numeric string, null, undefined, invalid string, negative value, and extremely large numbers.
  - **Verification:** Run tests and ensure all pass: `npm run test` or `vitest run` on the new test file.
  - **Files:** `src/test/currency.test.ts`
  - **Estimated scope:** S (1 file)

- [ ] **Task 1.3: Update `useCurrency.ts` to Leverage `formatGMD`**
  - **Description:** Edit `useCurrency.ts` so that when formatting GMD, it returns the result of `formatGMD()`. Change local storage keys from "shophub_" to "temsmarket_".
  - **Acceptance criteria:**
    - `useCurrency` `formatPrice` method formats GMD amounts using `formatGMD`.
    - Local storage keys renamed from `shophub_` to `temsmarket_`.
  - **Verification:** Run build compilation to ensure imports and types match: `npm run build` or `bun run build`.
  - **Files:** `src/hooks/useCurrency.ts`
  - **Estimated scope:** S (1 file)

### Checkpoint: Currency Foundation
- [ ] Unit tests pass: `npm run test`
- [ ] Application builds without errors: `npm run build`

---

### Phase 2: Branding Re-alignment & Clean-up
- [ ] **Task 2.1: Replace HTML Metadata & Browser Title**
  - **Description:** Update `index.html` tab title, descriptions, open-graph metadata to "Tems Market".
  - **Acceptance criteria:**
    - Document `<title>` tag contains "Tems Market".
    - Description meta tags show "Tems Market".
  - **Verification:** Check DOM for correct tag contents.
  - **Files:** `index.html`
  - **Estimated scope:** XS (1 file)

- [ ] **Task 2.2: Replace Frontend "ShopHub" References**
  - **Description:** Update page layouts (Header, Footer, Checkout, OrderConfirmation, Login, Signup, SelectRole, BecomeVendor) to display "Tems Market" and use the updated keys.
  - **Acceptance criteria:**
    - Every visual text instance of "ShopHub" replaced with "Tems Market".
    - Hook local storage key `shophub_ref_code` in `useReferralTracker.ts` renamed to `temsmarket_ref_code`.
  - **Verification:** Perform a grep search for "ShopHub" in the `src/` directory — should return 0 matches.
  - **Files:**
    - `src/components/layout/Header.tsx`
    - `src/components/layout/Footer.tsx`
    - `src/pages/Login.tsx`
    - `src/pages/Signup.tsx`
    - `src/pages/SelectRole.tsx`
    - `src/pages/BecomeVendor.tsx`
    - `src/pages/Checkout.tsx`
    - `src/pages/OrderConfirmation.tsx`
    - `src/hooks/useReferralTracker.ts`
  - **Estimated scope:** M (9 files)

- [ ] **Task 2.3: Replace Edge Function Email Template References**
  - **Description:** Replace references to "ShopHub" in Supabase Edge Function email notification templates.
  - **Acceptance criteria:**
    - Subject lines, greeting footers, support emails in `supabase/functions/send-email/index.ts` replaced with "Tems Market" and `support@temsmarket.com`.
  - **Verification:** Grep search for "ShopHub" in `supabase/` directory — should return 0 matches.
  - **Files:** `supabase/functions/send-email/index.ts`
  - **Estimated scope:** S (1 file)

### Checkpoint: Branding & GMD Complete
- [ ] All "ShopHub" matches are completely eliminated from the codebase.
- [ ] Code compiles perfectly with `npm run build`.
- [ ] The app operates cleanly on a dev server.

---

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking page styling with dynamic string length | Low | Tems Market has similar character counts as ShopHub. Layouts will handle length variations naturally. |
| Hardcoded "D" currency symbol in existing DB queries or code files | Medium | Replace all instances in frontend code, and verify that no database queries fail. |
