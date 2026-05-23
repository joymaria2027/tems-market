import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    // Authenticate
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await anonClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { items, couponCode, refCode } = await req.json() as {
      items: { product_id: string; quantity: number }[];
      couponCode?: string;
      refCode?: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Items are required");
    }

    // Validate quantities
    for (const item of items) {
      if (!item.product_id || typeof item.quantity !== "number" || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        throw new Error("Invalid item data");
      }
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch real product prices server-side
    const productIds = items.map((i) => i.product_id);
    const { data: products, error: prodErr } = await serviceClient
      .from("products")
      .select("id, title, price, stock, status, vendor_id, profiles(name)")
      .in("id", productIds)
      .eq("status", "approved");

    if (prodErr) throw new Error("Failed to fetch products");
    if (!products || products.length !== items.length) {
      throw new Error("One or more products not found or not approved");
    }

    // Calculate server-side subtotal
    let subtotal = 0;
    const orderItemsData: { product_id: string; quantity: number; price_at_purchase: number }[] = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) throw new Error(`Product ${item.product_id} not found`);
      if (item.quantity > product.stock) {
        throw new Error(`Insufficient stock for "${product.title}"`);
      }
      const lineTotal = Number(product.price) * item.quantity;
      subtotal += lineTotal;
      orderItemsData.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: Number(product.price),
      });
    }

    // Validate coupon server-side
    let discount = 0;
    let couponRecord: any = null;
    if (couponCode) {
      const { data: coupon } = await serviceClient
        .from("coupons")
        .select("*")
        .eq("code", couponCode)
        .maybeSingle();

      if (coupon) {
        const now = new Date();
        const notExpired = !coupon.expiry_date || new Date(coupon.expiry_date) > now;
        const withinLimit = !coupon.usage_limit || coupon.times_used < coupon.usage_limit;

        if (notExpired && withinLimit) {
          couponRecord = coupon;
          if (coupon.discount_type === "percentage") {
            discount = (subtotal * Number(coupon.discount_value)) / 100;
          } else {
            discount = Math.min(Number(coupon.discount_value), subtotal);
          }
        }
      }
    }

    const total = Math.max(subtotal - discount, 0);

    // Create order
    const { data: order, error: orderErr } = await serviceClient
      .from("orders")
      .insert({
        shopper_id: userId,
        total,
        discount_applied: discount,
        status: "awaiting_payment",
      })
      .select("id")
      .single();

    if (orderErr) throw new Error("Failed to create order");

    // Create order items
    const itemsWithOrder = orderItemsData.map((oi) => ({
      ...oi,
      order_id: order.id,
    }));
    const { error: itemsErr } = await serviceClient.from("order_items").insert(itemsWithOrder);
    if (itemsErr) throw new Error("Failed to create order items");

    // Increment coupon usage
    if (couponRecord) {
      await serviceClient
        .from("coupons")
        .update({ times_used: couponRecord.times_used + 1 })
        .eq("id", couponRecord.id);
    }

    // Handle affiliate referral
    if (refCode) {
      try {
        const { data: affiliate } = await serviceClient
          .from("affiliates")
          .select("id, commission_rate")
          .eq("code", refCode)
          .maybeSingle();

        if (affiliate && affiliate.id) {
          const commission = (total * Number(affiliate.commission_rate)) / 100;
          await serviceClient.from("affiliate_referrals").insert({
            affiliate_id: affiliate.id,
            order_id: order.id,
            commission_amount: commission,
          });
        }
      } catch {
        // Non-critical
      }
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        items: orderItemsData.map((oi) => {
          const p = products.find((pr) => pr.id === oi.product_id);
          return { title: p?.title || "", quantity: oi.quantity, price: oi.price_at_purchase };
        }),
        subtotal,
        discount,
        total,
        couponCode: couponRecord?.code,
        paymentMethod: "bank_transfer",
      }),
      {
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
