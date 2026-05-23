# Skill: Commission Rules

Invoke this when calculating commissions, building wallet screens, or handling payout requests.

## Rates (non-negotiable, do not infer from elsewhere)
| Party | Rate | Base |
|-------|------|------|
| Affiliate — fashion | 25% | of vendor_margin |
| Affiliate — electronics | 15% | of vendor_margin |
| Affiliate — other | 20% | of vendor_margin |
| Platform from vendor | 1% | of vendor_margin |
| Platform from admin | 1% | of admin_margin |
| Platform from affiliate | 1% | of affiliate_commission_gross |
| MoMo Reconcile | 1% | of platform_total (combined, per order) |

## Calculation (run in webhook, not client)
```typescript
const vendor_margin_gross  = vendor_price - admin_price
const admin_margin_gross   = admin_price - base_price

const affiliate_rate =
  product.category === 'fashion'     ? 0.25 :
  product.category === 'electronics' ? 0.15 : 0.20

const affiliate_commission_gross = order.affiliate_link_id
  ? vendor_margin_gross * affiliate_rate
  : 0

const platform_from_vendor    = vendor_margin_gross * 0.01
const platform_from_admin     = admin_margin_gross * 0.01
const platform_from_affiliate = affiliate_commission_gross * 0.01

const vendor_payout    = vendor_margin_gross - platform_from_vendor
const admin_payout     = admin_margin_gross  - platform_from_admin
const affiliate_payout = affiliate_commission_gross - platform_from_affiliate
const platform_total   = platform_from_vendor + platform_from_admin + platform_from_affiliate

// MoMo Reconcile: 1% of combined platform total per order
const momo_reconcile_fee = platform_total * 0.01
const tems_net           = platform_total - momo_reconcile_fee
```

## Confirmed examples

**Fashion order (GMD 100 vendor margin, GMD 100 admin margin):**
```
Affiliate earns: GMD 100 × 25% = GMD 25.00  → keeps GMD 24.75
Platform from vendor:              GMD 1.00
Platform from admin:               GMD 1.00
Platform from affiliate:           GMD 0.25
platform_total:                    GMD 2.25
MoMo Reconcile fee (1%):          GMD 0.0225
Tems keeps:                        GMD 2.2275
```

**Electronics order (GMD 100 vendor margin, GMD 100 admin margin):**
```
Affiliate earns: GMD 100 × 15% = GMD 15.00  → keeps GMD 14.85
Platform from vendor:              GMD 1.00
Platform from admin:               GMD 1.00
Platform from affiliate:           GMD 0.15
platform_total:                    GMD 2.15
MoMo Reconcile fee (1%):          GMD 0.0215
Tems keeps:                        GMD 2.1285
```

**No affiliate (organic sale):**
```
Platform from vendor:              GMD 1.00
Platform from admin:               GMD 1.00
platform_total:                    GMD 2.00
MoMo Reconcile fee (1%):          GMD 0.02
Tems keeps:                        GMD 1.98
```

## Status flow
```
pending   → available → paid
  ↑            ↑          ↑
paid by    MoMo Reconcile  daily settlement
customer   manager verifies  11 PM Gambia
```
- Insert all entries as 'pending' in webhook
- Transition to 'available' on MoMo Reconcile webhook (verified or timed_out after 24h)
- Credits preference: status → 'paid' immediately on verification (no daily settlement)
- Mobile money: batched at 11 PM, one ModemPay payout per user per day

## Wallet display
- pending_balance:   sum where status = 'pending'   → "Awaiting verification"
- available_balance: sum where status = 'available' → "Ready — pays tonight at 11 PM"
- Minimum payout:   GMD 10 (ModemPay minimum)
- Below minimum: carries forward to next day's batch
