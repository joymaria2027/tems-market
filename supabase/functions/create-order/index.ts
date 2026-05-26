import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Authenticate ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse request ─────────────────────────────────────────────
    const { listing_id, quantity, coupon_code, ref_code, delivery_address, payment_method } = await req.json() as {
      listing_id: string;
      quantity: number;
      coupon_code?: string;
      ref_code?: string;
      delivery_address: string;
      payment_method?: string;
    };

    if (!listing_id || !quantity || quantity < 1 || !Number.isInteger(quantity)) {
      throw new Error("listing_id and positive integer quantity are required");
    }

    if (!delivery_address || delivery_address.trim().length === 0) {
      throw new Error("delivery_address is required");
    }

    // Validate payment_method against schema enum
    const validPaymentMethods = ["qmoney", "afrimoney", "wave", "cash", "credits", "gift_card", "mixed"];
    const resolvedPaymentMethod = payment_method && validPaymentMethods.includes(payment_method)
      ? payment_method
      : "cash";

    // ── Service client (bypasses RLS for writes) ──────────────────
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Fetch listing + product server-side ───────────────────────
    const { data: listing, error: listingErr } = await serviceClient
      .from("vendor_listings")
      .select("id, vendor_id, vendor_price, is_active, product_id")
      .eq("id", listing_id)
      .single();

    if (listingErr || !listing) throw new Error("Listing not found");
    if (!listing.is_active) throw new Error("Listing is not active");

    const { data: product, error: prodErr } = await serviceClient
      .from("products")
      .select("id, title, status, submitted_by_vendor")
      .eq("id", listing.product_id)
      .single();

    if (prodErr || !product) throw new Error("Product not found");
    if (product.status !== "active") throw new Error("Product is not available");

    // ── Calculate server-side totals ──────────────────────────────
    const unitPrice = Number(listing.vendor_price);
    const totalAmount = unitPrice * quantity;

    // ── Validate coupon (server-side) ─────────────────────────────
    let couponId: string | null = null;
    let couponDiscount = 0;

    if (coupon_code) {
      const { data: coupon } = await serviceClient
        .from("coupons")
        .select("id, discount_type, discount_value, max_uses, uses_so_far, expires_at, minimum_order_gmd, status")
        .eq("code", coupon_code.toUpperCase())
        .maybeSingle();

      if (coupon && coupon.status === "active") {
        const now = new Date();
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > now;
        const withinLimit = !coupon.max_uses || coupon.uses_so_far < coupon.max_uses;
        const meetsMinimum = !coupon.minimum_order_gmd || totalAmount >= Number(coupon.minimum_order_gmd);

        if (notExpired && withinLimit && meetsMinimum) {
          couponId = coupon.id;
          if (coupon.discount_type === "percentage") {
            couponDiscount = (totalAmount * Number(coupon.discount_value)) / 100;
          } else {
            couponDiscount = Math.min(Number(coupon.discount_value), totalAmount);
          }
        }
      }
    }

    const discountedTotal = Math.max(totalAmount - couponDiscount, 0);

    // ── Resolve affiliate link ────────────────────────────────────
    let affiliateLinkId: string | null = null;

    if (ref_code) {
      const { data: affLink } = await serviceClient
        .from("affiliate_links")
        .select("id")
        .eq("short_code", ref_code)
        .eq("listing_id", listing_id)
        .maybeSingle();

      if (affLink) {
        affiliateLinkId = affLink.id;
      }
    }

    // ── Create order ──────────────────────────────────────────────
    const { data: order, error: orderErr } = await serviceClient
      .from("orders")
      .insert({
        customer_id: user.id,
        listing_id,
        affiliate_link_id: affiliateLinkId,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        discounted_total: discountedTotal,
        status: "placed",
        payment_method: resolvedPaymentMethod,
        payment_status: "pending",
        coupon_id: couponId,
        coupon_discount: couponDiscount > 0 ? couponDiscount : null,
        delivery_address,
      })
      .select("id, total_amount, discounted_total, coupon_discount, quantity, unit_price")
      .single();

    if (orderErr) throw new Error(`Failed to create order: ${orderErr.message}`);

    return new Response(
      JSON.stringify({
        orderId: order.id,
        listing_id,
        quantity: order.quantity,
        unit_price: order.unit_price,
        total_amount: order.total_amount,
        discounted_total: order.discounted_total,
        coupon_discount: order.coupon_discount || 0,
        coupon_code: coupon_code || null,
        affiliate_link_id: affiliateLinkId,
        payment_status: "pending",
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-order error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
