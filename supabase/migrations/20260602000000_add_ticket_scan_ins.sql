-- ============================================================
-- Migration: Add ticket_scan_ins table for tracking ticket admissions
-- ============================================================

-- Table: ticket_scan_ins — tracks when ticket products are scanned/admitted
CREATE TABLE IF NOT EXISTS public.ticket_scan_ins (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  scanned_by         UUID NOT NULL REFERENCES auth.users(id),
  ticket_identifier  TEXT,             -- optional: order #, QR code hash, ticket number
  quantity           INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  note               TEXT,
  scanned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.ticket_scan_ins IS 'Tracks when ticket products are scanned/admitted at events';
COMMENT ON COLUMN public.ticket_scan_ins.product_id IS 'The ticket product being admitted';
COMMENT ON COLUMN public.ticket_scan_ins.scanned_by IS 'Vendor/admin who scanned the ticket';
COMMENT ON COLUMN public.ticket_scan_ins.ticket_identifier IS 'Optional: order reference, QR code, ticket number';
COMMENT ON COLUMN public.ticket_scan_ins.quantity IS 'Number of tickets admitted in this scan (default 1)';
COMMENT ON COLUMN public.ticket_scan_ins.note IS 'Optional note about the scan-in';

-- Index for vendor dashboard queries (scan-ins by product)
CREATE INDEX IF NOT EXISTS idx_ticket_scan_ins_product   ON public.ticket_scan_ins(product_id);
CREATE INDEX IF NOT EXISTS idx_ticket_scan_ins_scanned   ON public.ticket_scan_ins(scanned_at DESC);

-- Enable RLS
ALTER TABLE public.ticket_scan_ins ENABLE ROW LEVEL SECURITY;

-- Vendors can read scan-ins for their own products
CREATE POLICY "ticket_scan_ins: vendor read own products" ON public.ticket_scan_ins
  FOR SELECT USING (
    product_id IN (
      SELECT vl.product_id FROM public.vendor_listings vl WHERE vl.vendor_id = auth.uid()
    )
  );

-- Vendors can insert scan-ins for their own products
CREATE POLICY "ticket_scan_ins: vendor insert own products" ON public.ticket_scan_ins
  FOR INSERT WITH CHECK (
    scanned_by = auth.uid()
    AND product_id IN (
      SELECT vl.product_id FROM public.vendor_listings vl WHERE vl.vendor_id = auth.uid()
    )
  );

-- Admin/superadmin can read all scan-ins
CREATE POLICY "ticket_scan_ins: admin read all" ON public.ticket_scan_ins
  FOR SELECT USING (is_admin_or_above());
