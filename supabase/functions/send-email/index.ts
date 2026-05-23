import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// HTML-escape user-supplied strings to prevent injection
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatGMD(amount: number | string): string {
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) {
    return "GMD 0.00";
  }
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
  return `GMD ${formatted}`;
}

interface OrderConfirmationData {
  type: "order_confirmation";
  orderId: string;
}

interface NewSaleAlertData {
  type: "new_sale_alert";
  vendorId: string;
  vendorName: string;
  productTitle: string;
  quantity: number;
  price: number;
  orderId: string;
}

interface ProductApprovedData {
  type: "product_approved";
  vendorId: string;
  vendorName: string;
  productTitle: string;
}

interface ProductRejectedData {
  type: "product_rejected";
  vendorId: string;
  vendorName: string;
  productTitle: string;
  rejectionNote: string;
}

interface GiftCardDeliveryData {
  type: "gift_card";
  to: string;
  code: string;
  value: number;
}

type EmailPayload =
  | OrderConfirmationData
  | NewSaleAlertData
  | ProductApprovedData
  | ProductRejectedData
  | GiftCardDeliveryData;

function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getEmailByUserId(userId: string): Promise<string | null> {
  const supabase = getServiceClient();
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

async function authenticateRequest(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    throw new Error("Unauthorized");
  }

  return data.claims.sub as string;
}

function buildOrderConfirmationHtml(data: {
  orderId: string;
  items: { title: string; quantity: number; price_at_purchase: number }[];
  subtotal: number;
  discount: number;
  total: number;
}): { subject: string; html: string } {
  const orderNum = esc(data.orderId.slice(0, 8).toUpperCase());
  const itemRows = data.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.title)}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatGMD(i.price_at_purchase * i.quantity)}</td></tr>`
    )
    .join("");

  const discountRow =
    data.discount > 0
      ? `<tr><td colspan="2" style="padding:4px 0;color:#16a34a">Discount</td><td style="padding:4px 0;text-align:right;color:#16a34a">-${formatGMD(data.discount)}</td></tr>`
      : "";

  return {
    subject: `Tems Market - Order Confirmation #${orderNum}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <div style="background:#F97316;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">Order Confirmed! 🎉</h1>
        </div>
        <div style="padding:24px">
          <p>Thank you for your order! Here's your summary:</p>
          <p style="background:#f5f5f5;padding:12px;border-radius:8px;font-family:monospace;font-size:18px;text-align:center">Order #${orderNum}</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <thead><tr style="border-bottom:2px solid #ddd"><th style="text-align:left;padding:8px 0">Item</th><th style="text-align:center;padding:8px 0">Qty</th><th style="text-align:right;padding:8px 0">Price</th></tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
          <table style="width:100%;margin-top:8px">
            <tr><td colspan="2" style="padding:4px 0">Subtotal</td><td style="padding:4px 0;text-align:right">${formatGMD(data.subtotal)}</td></tr>
            ${discountRow}
            <tr style="font-weight:bold;font-size:18px"><td colspan="2" style="padding:8px 0;border-top:2px solid #ddd">Total</td><td style="padding:8px 0;border-top:2px solid #ddd;text-align:right">${formatGMD(data.total)}</td></tr>
          </table>
          <p style="margin-top:16px"><strong>Payment Method:</strong> Bank Transfer</p>
          <div style="background:#fff7ed;padding:16px;border-radius:8px;border:1px solid #fed7aa;margin-top:8px">
            <p style="margin:0 0 4px;font-weight:bold">Bank Details</p>
            <p style="margin:2px 0">Bank: Trust Bank Gambia</p>
            <p style="margin:2px 0">Account Name: Tems Market</p>
            <p style="margin:2px 0">Account Number: 1234567890</p>
          </div>
          <p style="margin-top:24px;color:#666;font-size:13px">If you have any questions, please contact us at support@temsmarket.com</p>
        </div>
      </div>`,
  };
}

function buildNewSaleAlertHtml(data: NewSaleAlertData): { subject: string; html: string } {
  const orderNum = esc(data.orderId.slice(0, 8).toUpperCase());
  return {
    subject: `Tems Market - New Sale! "${esc(data.productTitle)}"`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <div style="background:#F97316;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">New Sale! 💰</h1>
        </div>
        <div style="padding:24px">
          <p>Hi ${esc(data.vendorName)},</p>
          <p>Great news! Someone just ordered your product:</p>
          <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
            <p style="margin:4px 0"><strong>Product:</strong> ${esc(data.productTitle)}</p>
            <p style="margin:4px 0"><strong>Quantity:</strong> ${data.quantity}</p>
            <p style="margin:4px 0"><strong>Price:</strong> ${formatGMD(data.price)}</p>
            <p style="margin:4px 0"><strong>Order:</strong> #${orderNum}</p>
          </div>
          <p>Log in to your vendor dashboard to manage this order.</p>
        </div>
      </div>`,
  };
}

function buildProductApprovedHtml(data: ProductApprovedData): { subject: string; html: string } {
  return {
    subject: `Tems Market - "${esc(data.productTitle)}" has been approved!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <div style="background:#16a34a;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">Product Approved ✅</h1>
        </div>
        <div style="padding:24px">
          <p>Hi ${esc(data.vendorName)},</p>
          <p>Your product <strong>"${esc(data.productTitle)}"</strong> has been reviewed and approved! It is now live on the Tems Market marketplace.</p>
          <p style="margin-top:16px;color:#666;font-size:13px">Keep uploading great products!</p>
        </div>
      </div>`,
  };
}

function buildProductRejectedHtml(data: ProductRejectedData): { subject: string; html: string } {
  return {
    subject: `Tems Market - "${esc(data.productTitle)}" was not approved`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <div style="background:#dc2626;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">Product Not Approved</h1>
        </div>
        <div style="padding:24px">
          <p>Hi ${esc(data.vendorName)},</p>
          <p>Unfortunately, your product <strong>"${esc(data.productTitle)}"</strong> was not approved.</p>
          <div style="background:#fef2f2;padding:16px;border-radius:8px;border:1px solid #fecaca;margin:16px 0">
            <p style="margin:0 0 4px;font-weight:bold">Reason:</p>
            <p style="margin:0">${esc(data.rejectionNote || "No reason provided.")}</p>
          </div>
          <p>Please review the feedback, make the necessary changes, and resubmit your product.</p>
        </div>
      </div>`,
  };
}

function buildGiftCardHtml(data: GiftCardDeliveryData): { subject: string; html: string } {
  return {
    subject: `You've received a Tems Market Gift Card! 🎁`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <div style="background:#F97316;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">You Got a Gift Card! 🎁</h1>
        </div>
        <div style="padding:24px;text-align:center">
          <p>Someone special sent you a Tems Market gift card!</p>
          <div style="background:#fff7ed;padding:24px;border-radius:12px;border:2px dashed #F97316;margin:24px 0">
            <p style="margin:0 0 8px;font-size:14px;color:#666">Your Gift Card Code</p>
            <p style="margin:0;font-size:28px;font-family:monospace;font-weight:bold;color:#F97316;letter-spacing:2px">${esc(data.code)}</p>
            <p style="margin:12px 0 0;font-size:20px;font-weight:bold">Value: ${formatGMD(data.value)}</p>
          </div>
          <p>Use this code at checkout on Tems Market to redeem your gift card.</p>
        </div>
      </div>`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Authenticate the caller
    const userId = await authenticateRequest(req);

    const payload: EmailPayload = await req.json();
    let subject: string;
    let html: string;
    let to: string;

    switch (payload.type) {
      case "order_confirmation": {
        // Fetch the order and items server-side to build the email from verified data
        const serviceClient = getServiceClient();
        const { data: order, error: orderErr } = await serviceClient
          .from("orders")
          .select("id, total, discount_applied, shopper_id")
          .eq("id", payload.orderId)
          .single();
        if (orderErr || !order) throw new Error("Order not found");
        // Ensure user can only send confirmation for their own order
        if (order.shopper_id !== userId) throw new Error("Unauthorized");

        const { data: orderItems } = await serviceClient
          .from("order_items")
          .select("quantity, price_at_purchase, products(title)")
          .eq("order_id", order.id);

        const items = (orderItems || []).map((oi: any) => ({
          title: oi.products?.title || "Product",
          quantity: oi.quantity,
          price_at_purchase: oi.price_at_purchase,
        }));

        const subtotal = items.reduce((s: number, i: any) => s + i.price_at_purchase * i.quantity, 0);

        const shopperEmail = await getEmailByUserId(userId);
        if (!shopperEmail) throw new Error("Shopper email not found");
        to = shopperEmail;

        const result = buildOrderConfirmationHtml({
          orderId: order.id,
          items,
          subtotal,
          discount: order.discount_applied || 0,
          total: order.total,
        });
        subject = result.subject;
        html = result.html;
        break;
      }
      case "new_sale_alert": {
        const email = await getEmailByUserId(payload.vendorId);
        if (!email) throw new Error("Vendor email not found");
        to = email;
        const result = buildNewSaleAlertHtml(payload);
        subject = result.subject;
        html = result.html;
        break;
      }
      case "product_approved": {
        // Only admins can send approval emails
        const serviceClient = getServiceClient();
        const { data: isAdmin } = await serviceClient.rpc("has_role", { _user_id: userId, _role: "admin" });
        if (!isAdmin) throw new Error("Unauthorized");

        const email = await getEmailByUserId(payload.vendorId);
        if (!email) throw new Error("Vendor email not found");
        to = email;
        const result = buildProductApprovedHtml(payload);
        subject = result.subject;
        html = result.html;
        break;
      }
      case "product_rejected": {
        // Only admins can send rejection emails
        const serviceClient = getServiceClient();
        const { data: isAdmin } = await serviceClient.rpc("has_role", { _user_id: userId, _role: "admin" });
        if (!isAdmin) throw new Error("Unauthorized");

        const email = await getEmailByUserId(payload.vendorId);
        if (!email) throw new Error("Vendor email not found");
        to = email;
        const result = buildProductRejectedHtml(payload);
        subject = result.subject;
        html = result.html;
        break;
      }
      case "gift_card": {
        // Only admins can send gift card emails
        const serviceClient = getServiceClient();
        const { data: isAdmin } = await serviceClient.rpc("has_role", { _user_id: userId, _role: "admin" });
        if (!isAdmin) throw new Error("Unauthorized");

        to = payload.to;
        const result = buildGiftCardHtml(payload);
        subject = result.subject;
        html = result.html;
        break;
      }
      default:
        throw new Error(`Unknown email type`);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Tems Market <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(`Resend API error [${res.status}]: ${JSON.stringify(resData)}`);
    }

    return new Response(JSON.stringify({ success: true, id: resData.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("send-email error:", message);
    const status = message === "Unauthorized" ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
