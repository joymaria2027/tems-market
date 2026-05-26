-- ============================================================
-- SEED — platform_settings defaults
--
-- Idempotent seed: ON CONFLICT DO NOTHING ensures this can
-- run safely even if the target schema migration already
-- populated these rows.
-- ============================================================

INSERT INTO public.platform_settings (key, value, description) VALUES
  ('platform_fee_rate',              '0.01',   'Platform fee: 1% taken from admin margin, vendor margin, and affiliate commission separately.'),
  ('affiliate_commission_rate',      '0.20',   'Default affiliate rate: 20% of vendor_margin.'),
  ('affiliate_commission_fashion',   '0.25',   'Fashion category affiliate rate: 25% of vendor_margin.'),
  ('affiliate_commission_electronics','0.15',  'Electronics category affiliate rate: 15% of vendor_margin.'),
  ('sponsored_7day_price_gmd',       '150',    'Price in GMD for a 7-day sponsored listing.'),
  ('sponsored_30day_price_gmd',      '500',    'Price in GMD for a 30-day sponsored listing.'),
  ('min_payout_gmd',                 '10',     'Minimum wallet balance required to request a payout.'),
  ('gift_card_expiry_months',        '12',     'Number of months a gift card is valid after purchase.'),
  ('credit_min_topup_gmd',           '100',    'Minimum credit top-up per transaction.'),
  ('momo_reconcile_fee_rate',        '0.01',   'MoMo Reconcile fee: 1% of combined platform collection per order.'),
  ('momo_reconcile_sla_hours',       '24',     'Hours before MoMo Reconcile auto-releases commission if manager times out.'),
  ('settlement_time_utc',            '22:00',  'Daily settlement run time in UTC (10 PM UTC = 11 PM Gambia time).'),
  ('settlement_min_gmd',             '10',     'Minimum available balance to trigger daily settlement payout.'),
  ('wave_business_number',           '',       'Wave mobile money business number for payouts. Set via SuperAdmin dashboard.'),
  ('min_top_up_gmd',                 '100',    'Minimum top-up amount in GMD (alias of credit_min_topup_gmd for clarity).')
ON CONFLICT (key) DO NOTHING;
