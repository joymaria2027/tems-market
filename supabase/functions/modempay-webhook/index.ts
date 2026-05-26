// =============================================================
// MODEMPAY WEBHOOK — Tems Market
//
// Handles incoming ModemPay webhook events.
// Signature verification via HMAC-SHA256 (Web Crypto API).
// Processes charge.succeeded events.
//
// Sequence (from skill-payment-rules.md):
// 1. Verify signature → 401 if invalid
// 2. Idempotency → 200 if already paid
// 3. Update order payment_status = 'paid'
// 4. Decrement gift card balance (if used)
// 5. Increment coupon uses (if used)
// 6. Calculate commission splits
// 7. Insert commission_ledger entries (status = 'pending')
// 8. Send Twilio WhatsApp to vendor, SMS to customer
// 9. Log to notifications_log
// 10. Return 200
// =============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-modem-signature",
};

// ── HMAC-SHA256 signature verification ──────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function verifyModemPaySignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      "verify",
    );
    return await crypto.subtle.verify(
      "HMAC",
      key,
      hexToBytes(signature),
      encoder.encode(body),
    );
  } catch {
    return false;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

function formatGMD(amount: number): string {
  return `GMD ${amount.toFixed(2)}`;
}

function getAffiliateRate(category: string): number {
  switch (category) {
    case "fashion":
      return 0.25;
    case "electronics":
      return 0.15;
    default:
      return 0.20;
  }
}

function safeMargin(gross: number): { margin: number; platformFee: number; payout: number } {
  if (gross <= 0) return { margin: 0, platformFee: 0, payout: 0 };
  const platformFee = gross * 0.01;
  const payout = gross - platformFee;
  return { margin: gross, platformFee, payout };
}

// ── Twilio notification helpers ──────────────────────────────────────────

async function sendTwilioWhatsApp(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  message: string,
): Promise<void> {
  const { data: user } = await supabase
    .from("users")
    .select("phone")
    .eq("id", userId)
    .single();

  if (!user?.phone) {
    console.warn(`modempay-webhook: No phone for user ${userId}`);
    return;
  }

  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_WHATSAPP_FROM =
    Deno.env.get("TWILIO_WHATSAPP_FROM") || "whatsapp:+14155238886";

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn("modempay-webhook: Twilio not configured — skipping WhatsApp");
    return;
  }

  const to = `whatsapp:${user.phone}`;
  const from = TWILIO_WHATSAPP_FROM.startsWith("whatsapp:")
    ? TWILIO_WHATSAPP_FROM
    : `whatsapp:${TWILIO_WHATSAPP_FROM}`;

  const twilioUrl =
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const response = await fetch(twilioUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: message }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twilio WhatsApp error [${response.status}]: ${text}`);
  }
}

async function sendTwilioSMS(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  message: string,
): Promise<void> {
  const { data: user } = await supabase
    .from("users")
    .select("phone")
    .eq("id", userId)
    .single();

  if (!user?.phone) {
    console.warn(`modempay-webhook: No phone for user ${userId}`);
    return;
  }

  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
  const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn("modempay-webhook: Twilio not configured — skipping SMS");
    return;
  }

  const twilioUrl =
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const response = await fetch(twilioUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: user.phone,
      From: TWILIO_PHONE_NUMBER,
      Body: message,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twilio SMS error [${response.status}]: ${text}`);
  }
}

// ── Main handler ─────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── 1. Verify webhook signature (HMAC-SHA256) ─────────────────────────
  const MODEMPAY_WEBHOOK_SECRET = Deno.env.get("MODEMPAY_WEBHOOK_SECRET");
  if (!MODEMPAY_WEBHOOK_SECRET) {
    console.error("modempay-webhook: MODEMPAY_WEBHOOK_SECRET not configured");
    return new Response(
      JSON.stringify({ error: "Webhook secret not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-modem-signature");

  if (!signature) {
    console.error("modempay-webhook: Missing x-modem-signature header");
    return new Response(JSON.stringify({ error: "Missing signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const isValid = await verifyModemPaySignature(rawBody, signature, MODEMPAY_WEBHOOK_SECRET);
  if (!isValid) {
    console.error("modempay-webhook: Invalid signature");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── 2. Parse event ──────────────────────────────────────────────────
  let parsed: { event: string; payload: Record<string, unknown> };
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    console.error("modempay-webhook: Invalid JSON body");
    return new Response(JSON.stringify({ received: true, warning: "Invalid JSON" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { event: eventType, payload } = parsed;
  console.log(`modempay-webhook: event=${eventType} id=${payload.id}`);

  // Only handle charge.succeeded
  if (eventType !== "charge.succeeded") {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const metadata = payload.metadata as Record<string, unknown> | undefined;
  const orderId = metadata?.order_id as string | undefined;

  if (!orderId) {
    console.error("modempay-webhook: No order_id in payload metadata");
    return new Response(JSON.stringify({ received: true, warning: "No order_id" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const modempayPaymentId = payload.id as string;

  // ── 3. Create Supabase admin client ─────────────────────────────────
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // ── 4. Idempotency check ─────────────────────────────────────────
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, payment_status")
      .eq("id", orderId)
      .single();

    if (!existingOrder) {
      console.error(`modempay-webhook: Order ${orderId} not found`);
      return new Response(JSON.stringify({ received: true, warning: "Order not found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existingOrder.payment_status === "paid") {
      console.log(`modempay-webhook: Order ${orderId} already paid — ack`);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 5. Update order + fetch full row in one query ────────────────
    const { data: order, error: updateErr } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        modempay_payment_id: modempayPaymentId,
      })
      .eq("id", orderId)
      .select(`
        id,
        customer_id,
        listing_id,
        affiliate_link_id,
        quantity,
        unit_price,
        total_amount,
        discounted_total,
        gift_card_id,
        gift_card_amount,
        coupon_id,
        coupon_discount,
        delivery_address
      `)
      .single();

    if (updateErr || !order) {
      throw new Error(`Failed to update order: ${updateErr?.message || "no data returned"}`);
    }

    // ── 6. Handle gift card (if used) ────────────────────────────────
    if (order.gift_card_id && order.gift_card_amount && order.gift_card_amount > 0) {
      const { data: giftCard } = await supabase
        .from("gift_cards")
        .select("id, remaining_balance, value_gmd, status")
        .eq("id", order.gift_card_id)
        .single();

      if (giftCard) {
        const newBalance = Math.max(
          Number(giftCard.remaining_balance) - Number(order.gift_card_amount),
          0,
        );
        const newStatus =
          newBalance <= 0
            ? "fully_used"
            : newBalance < Number(giftCard.value_gmd)
              ? "partially_used"
              : giftCard.status;

        await supabase
          .from("gift_cards")
          .update({ remaining_balance: newBalance, status: newStatus })
          .eq("id", order.gift_card_id);

        await supabase.from("gift_card_redemptions").insert({
          gift_card_id: order.gift_card_id,
          order_id: orderId,
          amount_used: order.gift_card_amount,
        });
      }
    }

    // ── 7. Handle coupon (if used) ──────────────────────────────────
    if (order.coupon_id && order.coupon_discount && order.coupon_discount > 0) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("uses_so_far")
        .eq("id", order.coupon_id)
        .single();

      if (coupon) {
        await supabase
          .from("coupons")
          .update({ uses_so_far: Number(coupon.uses_so_far) + 1 })
          .eq("id", order.coupon_id);
      }

      await supabase.from("coupon_uses").insert({
        coupon_id: order.coupon_id,
        order_id: orderId,
        user_id: order.customer_id,
        discount_applied: order.coupon_discount,
      });
    }

    // ── 8. Fetch relations for commission calculation ────────────────
    const { data: listing } = await supabase
      .from("vendor_listings")
      .select("id, vendor_id, product_id, vendor_price, vendor_margin, is_active")
      .eq("id", order.listing_id)
      .single();

    if (!listing) throw new Error(`Listing ${order.listing_id} not found`);

    const { data: product } = await supabase
      .from("products")
      .select("id, title, category, base_price, created_by")
      .eq("id", listing.product_id)
      .single();

    if (!product) throw new Error(`Product ${listing.product_id} not found`);

    const { data: priceLayer } = await supabase
      .from("price_layers")
      .select("id, admin_id, admin_price, admin_margin")
      .eq("product_id", listing.product_id)
      .single();

    if (!priceLayer) throw new Error(`Price layer for product ${listing.product_id} not found`);

    const { data: superadmin } = await supabase
      .from("users")
      .select("id")
      .eq("role", "superadmin")
      .limit(1)
      .single();

    if (!superadmin) throw new Error("No superadmin found for platform commission");

    // ── 9. Calculate all payouts (with margin safety guards) ────────
    const vendorPrice = Number(order.unit_price);
    const adminPrice = Number(priceLayer.admin_price);
    const basePrice = Number(product.base_price);

    const vendorMarginGross = Math.max((vendorPrice - adminPrice) * order.quantity, 0);
    const adminMarginGross = Math.max((adminPrice - basePrice) * order.quantity, 0);

    const vendor = safeMargin(vendorMarginGross);
    const admin = safeMargin(adminMarginGross);

    // Affiliate commission
    let affiliatePayout = 0;
    let affiliatePlatformFee = 0;
    let affiliateId: string | null = null;
    if (order.affiliate_link_id) {
      const { data: affiliateLink } = await supabase
        .from("affiliate_links")
        .select("affiliate_id")
        .eq("id", order.affiliate_link_id)
        .single();

      if (affiliateLink) {
        affiliateId = affiliateLink.affiliate_id;
        const affiliateCommissionGross = vendorMarginGross * getAffiliateRate(product.category);
        const affiliate = safeMargin(affiliateCommissionGross);
        affiliatePayout = affiliate.payout;
        affiliatePlatformFee = affiliate.platformFee;
      }
    }

    const platformTotal = vendor.platformFee + admin.platformFee + affiliatePlatformFee;

    // ── 10. Insert commission_ledger entries — ALL status = 'pending' ─
    const ledgerEntries: Array<Record<string, unknown>> = [];

    if (vendor.payout > 0) {
      ledgerEntries.push({
        order_id: orderId,
        recipient_id: listing.vendor_id,
        recipient_role: "vendor",
        amount: Number(vendor.payout.toFixed(2)),
        momo_reconcile_fee: Number(vendor.platformFee.toFixed(2)),
        momo_reconcile_status: "syncing",
        status: "pending",
      });
    }

    if (admin.payout > 0) {
      ledgerEntries.push({
        order_id: orderId,
        recipient_id: priceLayer.admin_id,
        recipient_role: "admin",
        amount: Number(admin.payout.toFixed(2)),
        momo_reconcile_fee: Number(admin.platformFee.toFixed(2)),
        momo_reconcile_status: "syncing",
        status: "pending",
      });
    }

    // Platform keeps its earnings (no MoMo Reconcile needed for own income)
    if (platformTotal > 0) {
      ledgerEntries.push({
        order_id: orderId,
        recipient_id: superadmin.id,
        recipient_role: "platform",
        amount: Number(platformTotal.toFixed(2)),
        status: "pending",
      });
    }

    if (affiliateId && affiliatePayout > 0) {
      ledgerEntries.push({
        order_id: orderId,
        recipient_id: affiliateId,
        recipient_role: "affiliate",
        amount: Number(affiliatePayout.toFixed(2)),
        momo_reconcile_fee: Number(affiliatePlatformFee.toFixed(2)),
        momo_reconcile_status: "syncing",
        status: "pending",
      });
    }

    if (ledgerEntries.length > 0) {
      const { error: ledgerErr } = await supabase
        .from("commission_ledger")
        .insert(ledgerEntries);

      if (ledgerErr) {
        // Non-fatal — payment already processed
        console.error(
          `modempay-webhook: commission_ledger insert failed: ${ledgerErr.message}`,
        );
      }
    }

    // ── 11. Send notifications ────────────────────────────────────────
    const notificationPromises: Promise<void>[] = [];

    notificationPromises.push(
      sendTwilioWhatsApp(
        supabase,
        listing.vendor_id,
        `🛒 New order! Someone ordered ${product.title} ×${order.quantity}. Check your Tems Market app.`,
      ).catch((e) => console.error("modempay-webhook: vendor WhatsApp failed", e)),
    );

    notificationPromises.push(
      sendTwilioSMS(
        supabase,
        order.customer_id,
        `✅ Payment of ${formatGMD(Number(order.discounted_total))} confirmed for your Tems Market order. Thank you!`,
      ).catch((e) => console.error("modempay-webhook: customer SMS failed", e)),
    );

    await Promise.allSettled(notificationPromises);

    // Log notifications
    await supabase.from("notifications_log").insert([
      {
        user_id: listing.vendor_id,
        type: "new_order",
        channel: "whatsapp",
        message: `New order for ${product.title} ×${order.quantity}`,
      },
      {
        user_id: order.customer_id,
        type: "payment_confirmed",
        channel: "sms",
        message: `Payment of ${formatGMD(Number(order.discounted_total))} confirmed`,
      },
    ]).catch(() => {});

    console.log(`modempay-webhook: Done processing order ${orderId}`);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("modempay-webhook error:", message);
    // Always 200 — prevent ModemPay retry loops
    return new Response(JSON.stringify({ received: true, error: message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
