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

    // ── Parse request (supports both single-listing and multi-item formats) ──
    const body = await req.json();

    // Accept only `items[]` (multi-item format). Legacy single-item format removed.
    const items: { product_id: string; quantity: number }[] = body.items ?? [];
    const couponCode: string | undefined = body.coupon_code ?? body.couponCode;
    const refCode: string | undefined = body.ref_code ?? body.refCode;
    const deliveryAddress: string | undefined = body.delivery_address ?? body.deliveryAddress;
    const paymentMethod: string | undefined = body.payment_method ?? body.paymentMethod;

    if (items.length === 0) {
      throw new Error("`items[]` is required — provide an array of { product_id, quantity }");
    }

    const orderItems = items;

    // ── Service client (bypasses RLS for writes) ──────────────────
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Fetch product details for all items ──────────────────────
    const productIds = orderItems.map((i) => i.product_id);
    const { data: products, error: prodErr } = await serviceClient
      .from("products")
      .select("id, title, price, stock, product_type, status")
      .in("id", productIds);

    if (prodErr || !products || products.length === 0) {
      throw new Error("Products not found");
    }

    // Check all products are available
    for (const p of products) {
      if (p.status !== "active" && p.status !== "approved") {
        throw new Error(`Product "${p.title}" is not available`);
      }
    }

    // ── Resolve listing_id from vendor_listings (for orders.listing_id FK) ──
    // The orders table has listing_id NOT NULL referencing vendor_listings.
    // For multi-item orders, use the first product's listing.
    const { data: listings, error: listingErr } = await serviceClient
      .from("vendor_listings")
      .select("id")
      .eq("product_id", orderItems[0].product_id)
      .eq("is_active", true)
      .limit(1);

    if (listingErr || !listings || listings.length === 0) {
      throw new Error(`No active vendor listing found for product ${orderItems[0].product_id}`);
    }

    const resolvedListingId = listings[0].id;

    // ── Detect if order contains only tickets ────────────────────
    const allTickets = products.every((p) => p.product_type === "ticket");
    const anyTicket = products.some((p) => p.product_type === "ticket");

    // ── Validate delivery address ────────────────────────────────
    // For ticket-only orders, shipping address is not needed
    if (allTickets) {
      // No delivery address required — use a placeholder
    } else if (!deliveryAddress || deliveryAddress.trim().length === 0) {
      throw new Error("delivery_address is required for physical items");
    }

    const resolvedDeliveryAddress = allTickets
      ? "ticket - no shipping"
      : (deliveryAddress ?? "");

    // Validate payment_method against schema enum
    const validPaymentMethods = ["qmoney", "afrimoney", "wave", "cash", "credits", "gift_card", "mixed"];
    const resolvedPaymentMethod = paymentMethod && validPaymentMethods.includes(paymentMethod)
      ? paymentMethod
      : "cash";

    // ─── Calculate totals ────────────────────────────────────────
    let totalAmount = 0;
    for (const item of orderItems) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${product.title}"`);
      }
      totalAmount += Number(product.price) * item.quantity;
    }

    // ─── Validate coupon (server-side) ───────────────────────────
    let couponId: string | null = null;
    let couponDiscount = 0;

    if (couponCode) {
      const { data: coupon } = await serviceClient
        .from("coupons")
        .select("id, discount_type, discount_value, max_uses, uses_so_far, expires_at, minimum_order_gmd, status")
        .eq("code", couponCode.toUpperCase())
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

    // ─── Resolve affiliate link (only for first item with ref_code) ──
    let affiliateLinkId: string | null = null;

    if (refCode && orderItems.length > 0) {
      // Try matching by first product's listing
      const { data: listings } = await serviceClient
        .from("vendor_listings")
        .select("id")
        .eq("product_id", orderItems[0].product_id)
        .maybeSingle();

      if (listings) {
        const { data: affLink } = await serviceClient
          .from("affiliate_links")
          .select("id")
          .eq("short_code", refCode)
          .eq("listing_id", listings.id)
          .maybeSingle();

        if (affLink) {
          affiliateLinkId = affLink.id;
        }
      }
    }

    // ─── Create order ────────────────────────────────────────────
    const firstProduct = products[0];
    const unitPrice = Number(firstProduct.price);

    const { data: order, error: orderErr } = await serviceClient
      .from("orders")
      .insert({
        customer_id: user.id,
        listing_id: resolvedListingId,
        affiliate_link_id: affiliateLinkId,
        quantity: orderItems.reduce((s, i) => s + i.quantity, 0),
        unit_price: unitPrice,
        total_amount: totalAmount,
        discounted_total: discountedTotal,
        status: "placed",
        payment_method: resolvedPaymentMethod,
        payment_status: "pending",
        coupon_id: couponId,
        coupon_discount: couponDiscount > 0 ? couponDiscount : null,
        delivery_address: resolvedDeliveryAddress,
      })
      .select("id, total_amount, discounted_total, coupon_discount, quantity, unit_price")
      .single();

    if (orderErr) throw new Error(`Failed to create order: ${orderErr.message}`);

    // ─── Insert order_items ──────────────────────────────────────
    for (const item of orderItems) {
      const product = products.find((p) => p.id === item.product_id)!;
      const { error: oiErr } = await serviceClient
        .from("order_items")
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: Number(product.price),
        });

      if (oiErr) {
        console.error(`Failed to insert order_item for ${item.product_id}: ${oiErr.message}`);
      }
    }

    // ─── Return order confirmation ───────────────────────────────
    return new Response(
      JSON.stringify({
        orderId: order.id,
        items: orderItems.map((item) => {
          const product = products.find((p) => p.id === item.product_id)!;
          return {
            product_id: item.product_id,
            title: product.title,
            quantity: item.quantity,
            price: Number(product.price),
            product_type: product.product_type ?? "physical",
          };
        }),
        total_amount: order.total_amount,
        discounted_total: order.discounted_total,
        coupon_discount: order.coupon_discount || 0,
        coupon_code: couponCode || null,
        affiliate_link_id: affiliateLinkId,
        payment_status: "pending",
        is_ticket_order: allTickets,
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
