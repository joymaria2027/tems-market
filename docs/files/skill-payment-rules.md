# Skill: ModemPay Payment Rules

Invoke this when writing any code that touches payments, payouts, or the webhook.

## Payment Intent (checkout)
```typescript
// One sub_account per intent — routes vendor's cut automatically
const intent = await modempay.paymentIntents.create({
  amount: order.discounted_total,           // after gift card + coupon
  sub_account: vendor.modempay_subaccount_id,
  metadata: { order_id: order.id }          // needed to identify order in webhook
})
```

## Webhook handler — exact sequence, do not reorder
1. Verify signature header against MODEMPAY_WEBHOOK_SECRET → 401 if invalid
2. Idempotency check: if order.payment_status already = 'paid' → return 200 immediately
3. Update order payment_status = 'paid'
4. Decrement gift card balance (if used) → update gift card status
5. Increment coupon uses_so_far (if used) → insert coupon_uses record
6. Calculate splits (see CLAUDE.md commission rules)
7. Insert commission_ledger records — ALL status = 'pending'
8. Send Twilio WhatsApp to vendor (new order)
9. Send Twilio SMS to customer (payment confirmed)
10. Return 200

## Payout (commission withdrawal)
```typescript
// Minimum: 10 GMD (ModemPay requirement)
// Only pays out commission_ledger entries with status = 'available'
// After payout: update all entries to status = 'paid', set paid_at = now()
```

## Sub-account creation (on vendor approval)
```typescript
await modempay.subAccounts.create({
  business_name: vendor.business_name,
  percentage: vendor_percentage,          // their share %
  settlement_code: 'wave' | 'afrimoney',
  account_number: vendor.account_number
})
// Store returned id in vendor_profiles.modempay_subaccount_id
```

## Current limitation
ModemPay supports one sub_account per Payment Intent.
Vendor split is handled by sub_account at payment time.
Affiliate + admin + platform commissions are distributed via Payouts API in release-commissions function.
When ModemPay ships multi sub-account: collapse to single payment intent call.
