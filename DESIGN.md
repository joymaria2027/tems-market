# ShopHub Mobile — Design System

> Generated from codebase analysis. Documents currently used UI patterns, colors, typography, components, and styling conventions for the Expo React Native multi-vendor marketplace.

---

## 1. Color System

**Source:** `artifacts/mobile/constants/colors.ts`

**Status:** Light mode only. Dark mode tokens not defined despite `app.json` having `"userInterfaceStyle": "automatic"`.

**Color strategy:** *Restrained* — tinted neutrals with one accent ≤10%.

### Light palette

| Token | Hex | Usage |
|---|---|---|
| `background` | `#fffafc` | All screen backgrounds |
| `foreground` | `#1a0f1a` | Dark text, dark buttons, active category pills |
| `card` | `#ffffff` | Card & container backgrounds |
| `primary` | `#e11d74` | Accent pink — active buttons, links, badges, icons, active tab indicator |
| `secondary` | `#fce7f1` | Light pink tint — stock chips, info boxes, active coupon badges |
| `muted` | `#f4eef2` | Input backgrounds, search bars, inactive UI |
| `mutedForeground` | `#6b5563` | Secondary text, hints, inactive tab icons |
| `accent` | `#fff1d6` | Warm cream — callout/icon container backgrounds |
| `accentForeground` | `#7a3d00` | Warm brown — accent icon color |
| `border` | `#f0e6ec` | Card borders, dividers, input outlines |
| `success` | `#16a34a` | — |
| `warning` | `#f59e0b` | — |
| `destructive` | `#ef4444` | — |

### Common border-radius

| Token | Value | Usage |
|---|---|---|
| `radius` | `14` | Cards, inputs, buttons, containers |

### Dynamic consumption

All colors are consumed via the `useColors()` hook (`artifacts/mobile/hooks/useColors.ts`), which reads `useColorScheme()` and returns the light palette. Has fallback logic for a future `dark` key.

---

## 2. Typography

**Font:** **Inter** via `@expo-google-fonts/inter`

**Loaded weights:** 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

| Font Family | Usage Areas |
|---|---|
| `Inter_400Regular` | Body text, descriptions, subtitles, empty state text, form notes |
| `Inter_500Medium` | Input fields, meta labels, vendor names, line items |
| `Inter_600SemiBold` | Button text, sort chips, card labels, stock text, menu labels |
| `Inter_700Bold` | All headlines, product names, prices, section titles, CTA buttons, totals |

**No formal type scale.** Font sizes range from 10px to 28px, set per-component:

- 10px — role badge text, internal pill labels, stat labels
- 11px — badge text, eyebrow labels, stock text, vendor text
- 12px — subtitles, item text, labels
- 13px — body text, sort chips, menu labels, empty state text
- 14px — card titles, button text, input text
- 15px — product prices, checkout totals
- 16px — product card names, section titles
- 18px — empty state titles, brand text
- 20px — section headings
- 22px — screen titles
- 24px — hero titles
- 26px — PDP prices
- 28px — error titles

**Line lengths:** Not formally capped. A few empty states use `maxWidth: 260–280` to constrain text width.

**Letter-spacing:** Headlines use `-0.3` to `-0.6` negative tracking. Eyebrow labels use `1.2` uppercase tracking.

---

## 3. Iconography

**Library:** `@expo/vector-icons` — **Feather** icon set

**Total unique icons used:** ~35

| Icon | Screens |
|---|---|
| `home`, `grid`, `shopping-bag`, `user` | Tab bar |
| `search`, `x` | Shop search bar |
| `star` | Product ratings |
| `chevron-left`, `chevron-right`, `arrow-right` | Navigation |
| `minus`, `plus` | Quantity controls |
| `trash-2` | Cart remove |
| `package`, `globe`, `sliders` | Account menu |
| `briefcase`, `share-2`, `credit-card`, `zap` | Vendor / Affiliate |
| `lock`, `info`, `alert-circle`, `alert-triangle`, `check`, `check-circle` | Feedback |
| `copy`, `mail`, `truck`, `shield`, `rotate-ccw` | Misc |
| `layers`, `eye-off` | Price chain |
| `trending-up`, `users` | Vendor perks |
| `tag` | Coupons |

**Size range:** 10px–28px. Most icons are 14–18px in inline contexts, 22–28px in empty states.

**Color:** Inherits `colors.primary` for accent icons, `colors.foreground` for navigation, `colors.mutedForeground` for secondary/decorative.

---

## 4. Spacing & Layout

### No formal spacing scale

All spacing values are ad-hoc per component (4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24px appear throughout).

### Common patterns

| Pattern | Details |
|---|---|
| **Card** | `padding: 12–18`, `borderWidth: 1`, `borderColor: colors.border`, `borderRadius: colors.radius` |
| **2-column grid** | `flexDirection: "row"`, `flexWrap: "wrap"`, each item `width: "50%"`, `padding: 4` |
| **Horizontal scroll** | `paddingHorizontal: 16`, `gap: 8–12` |
| **Bottom bar** | `position: "absolute"`, `bottom: 0`, `paddingBottom: insets.bottom + 76–120` |
| **Empty state** | Centered `flex: 1`, `gap: 10`, icon container 72×72 with `borderRadius: 24` |
| **Section header** | `flexDirection: "row"`, `justifyContent: "space-between"`, `alignItems: "flex-end"` |

### Safe-area handling

Every screen uses `useSafeAreaInsets()` to compute bottom padding for scroll content and absolute-positioned bars. Web gets a flat fallback (e.g., 100px).

---

## 5. Component Library

### Shared components (`artifacts/mobile/components/`)

| Component | Description |
|---|---|
| **AppHeader** | Navigation bar with brand logo ("S" badge + "ShopHub"), optional back button, title, currency trigger, right slot, subtitle |
| **ProductCard** | 2-column grid product. Image with optional badge overlay, vendor, name (2 lines, 36px min-height), rating, price, optional "base" price for role users |
| **SponsoredCard** | Featured carousel (240×300). Full-bleed image, gradient overlay, "Featured" chip, vendor, name, price. Dark background (`#1a0f1a`) |
| **CategoryPill** | Horizontal filter — filled when active, bordered when inactive. Rounded pill shape |
| **SetupBanner** | Orange banner for empty products, red banner for DB errors |
| **CurrencySheet** | Bottom sheet modal with currency list and active checkmark |
| **ErrorBoundary** | Class-component error boundary wrapping root |
| **ErrorFallback** | Full-screen error with "Try Again" button, dev-only error detail modal |
| **KeyboardAwareScrollViewCompat** | Keyboard-avoiding scroll handling |

---

## 6. Navigation

**Framework:** Expo Router (file-based)

### Screen transitions

| Route | Presentation | Animation |
|---|---|---|
| `(tabs)/` | Tabs (native or classic) | — |
| `product/[slug]` | Card / push | `slide_from_right` |
| `checkout` | Modal | `slide_from_bottom` |
| `order-confirmation` | Card / push | `fade` (no gesture back) |
| `orders` | Card / push | `slide_from_right` |
| `login` | Modal | `slide_from_bottom` |
| `become-vendor` | Card / push | `slide_from_right` |
| `affiliate` | Card / push | `slide_from_right` |
| `markups` | Card / push | `slide_from_right` |

### Tab bar

**Dual implementation** (`artifacts/mobile/app/(tabs)/_layout.tsx`):

1. **NativeTabs** (iOS only when `expo-glass-effect` is available) — uses SF Symbols
2. **ClassicTabs** (Android / web fallback) — Feather icons, `Inter_600SemiBold` labels
   - iOS: Transparent background with `BlurView`
   - Web: Solid background, taller bar (84px)
   - Android: Solid background

### Providers stack

```
SafeAreaProvider
  ErrorBoundary
    QueryClientProvider (TanStack React Query)
      GestureHandlerRootView
        KeyboardProvider
          CurrencyProvider
            AuthProvider (Supabase)
              OrdersProvider (AsyncStorage)
                CartProvider (AsyncStorage)
                  StatusBar ("dark")
                  Stack Navigator
```

---

## 7. Styling Patterns

### Style application

All styles are defined via `StyleSheet.create()` per file. Colors are applied dynamically inline:

```tsx
<View style={[styles.card, {
  backgroundColor: colors.card,
  borderColor: colors.border,
  borderRadius: colors.radius,
}]}>
```

### Button interaction patterns

- **Pressable** with `({ pressed }) => [styles.btn, { opacity: pressed ? 0.85–0.9 : 1 }]`
- **ProductCard** uses press transform: `{ transform: [{ scale: pressed ? 0.98 : 1 }] }`
- **No shared Button component** — every button is custom Pressable

### Common visual treatments

| Treatment | How it's done |
|---|---|
| Dividers | `StyleSheet.hairlineWidth` or `borderTopWidth` |
| Role badges | Colored dot + colored text on tinted background (`#color+15` hex alpha) |
| Gradient heros | `LinearGradient` component (home: `#fde7f0`→`#fffafc`, affiliate: `#2a0e1f`→`#a3196c`) |
| Stock indicators | Colored dot (6×6) + text in a secondary-background pill |
| Price chain | `borderWidth: 1` card with labeled rows, "+" prefix amounts, divider, total |
| Tag chips | `borderRadius: 999`, `paddingHorizontal: 10`, `paddingVertical: 5-6` |

---

## 8. Platform Differences

| Concern | iOS | Android | Web |
|---|---|---|---|
| Tab bar | `BlurView` background | Solid | Solid, 84px height |
| Font (error details) | `Menlo` | `monospace` | `monospace` |
| Haptics | `expo-haptics` on add-to-cart | Same | Skipped |
| Clipboard | — | — | `navigator.clipboard` |
| Safe area top | `insets.top` | `insets.top` | `Math.max(insets.top, 67)` |
| Keyboard | `padding` behavior | Default | — |

---

## 9. Image Handling

**Library:** `expo-image`

- Product images: `contentFit="cover"`, `transition={250–300}`
- Aspect ratios: 1:1 (square) on product grids and PDP hero
- SponsoredCard: full-bleed `StyleSheet.absoluteFillObject`
- Cart rows: 84×100 thumbnails
- Markup list: 52×52 thumbnails, `borderRadius: 12`
- Order history: 48×48 thumbnails, `borderRadius: 10`

---

## 10. Animations & Motion

- **Image transitions:** `expo-image` built-in fade transitions (250–300ms)
- **Press feedback:** Opacity changes (immediate), scale transforms
- **Screen transitions:** Expo Router built-in (`slide_from_right`, `slide_from_bottom`, `fade`)
- **Tab bar:** No animation (static tint change)
- **No Reanimated animations used** despite `react-native-reanimated` being installed

---

## 11. UI-Relevant Dependencies

| Package | Version | Purpose |
|---|---|---|
| `expo` | ~54.0.27 | Core framework |
| `expo-router` | ~6.0.17 | File-based navigation |
| `expo-blur` | ~15.0.8 | iOS tab bar blur |
| `expo-linear-gradient` | ~15.0.8 | Gradient heros & overlays |
| `expo-haptics` | ~15.0.8 | Touch feedback |
| `expo-image` | ~3.0.11 | Optimized image loading |
| `expo-symbols` | ~1.0.8 | SF Symbols for NativeTabs |
| `expo-glass-effect` | ~0.1.4 | NativeTabs detection |
| `@expo/vector-icons` | ^15.0.3 | Feather icons |
| `@expo-google-fonts/inter` | ^0.4.0 | Inter font family |
| `react-native-reanimated` | ~4.1.1 | Installed, not actively used |
| `react-native-gesture-handler` | ~2.28.0 | Gesture wrapper |
| `react-native-safe-area-context` | ~5.6.0 | Safe insets |
| `react-native-screens` | ~4.16.0 | Native screen containers |
| `@tanstack/react-query` | catalog: | Data fetching for Supabase |
| `@supabase/supabase-js` | ^2.105.1 | Backend data & auth |
| `@react-native-async-storage/async-storage` | 2.2.0 | Cart, currency, orders persistence |

---

## 12. State Design Patterns

| State | Pattern Used |
|---|---|
| Loading | `ActivityIndicator` centered in content area with `colors.primary` |
| Empty | Centered view with icon, title, description, and CTA button |
| Error | `ErrorBoundary` wrapper + per-screen error handling from TanStack Query |
| 404 (product) | Inline check with fallback UI + "Go back" button |
| 404 (route) | `+not-found.tsx` screen with link to home |
| Edge case (cart empty on checkout) | Redirect to empty cart view |
| Edge case (order not found) | Fallback with "Back home" button |

---

## 13. Accessibility & UX Copy

- **Roles:** Five exclusive marketplace roles with distinct color badges
- **Copy tone:** Direct, local-market vernacular ("The Gambia's local marketplace", "Greater Banjul")
- **UX copy:** Clear empty states, step-by-step instructions (affiliate "How it works", order confirmation "What happens next")
- **Error messages:** Helpful guidance ("Enter a number 0 or greater", "That code isn't valid")
- **No formal i18n setup** — all copy is hardcoded in English

---

## 14. White Space / Gaps

Tokens and conventions **not yet defined**:

- ❌ No dark mode colors
- ❌ No formal type scale / hierarchy
- ❌ No spacing scale (4/8/12/16/24 tokens)
- ❌ No shared Button component
- ❌ No shared input component (all inline)
- ❌ No elevation/shadow tokens
- ❌ No animation duration tokens
- ❌ No breakpoint system
- ❌ No DESIGN.md existed prior to this file
