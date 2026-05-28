import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

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
    .replace(/\"/g, "&quot;")
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

interface VendorApprovedData {
  type: "vendor_approved";
  to: string;
  businessName: string;
  inviteLink: string;
  createdBy: string;
}

type EmailPayload =
  | OrderConfirmationData
  | NewSaleAlertData
  | ProductApprovedData
  | ProductRejectedData
  | GiftCardDeliveryData
  | VendorApprovedData;

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

async function authenticateRequest(req: Request): Promise<{ userId: string; role: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Unauthorized");
  }

  // Fetch user's role from public.users
  const serviceClient = getServiceClient();
  const { data: userRecord } = await serviceClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    userId: user.id,
    role: userRecord?.role || "customer",
  };
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
          <p style="margin-top:16px"><strong>Payment Method:</strong> Cash on Delivery</p>
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

function buildVendorApprovedHtml(data: VendorApprovedData): { subject: string; html: string } {
  return {
    subject: `Tems Market - Welcome ${esc(data.businessName)}! Vendor Application Approved`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
        <div style="background:#16a34a;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">Welcome to Tems Market! 🎉</h1>
        </div>
        <div style="padding:24px">
          <p>Congratulations <strong>${esc(data.businessName)}</strong>,</p>
          <p>Your vendor application has been reviewed and <strong>approved</strong> by <strong>${esc(data.createdBy)}</strong>!</p>
          <p>You're now one step away from joining the Tems Market marketplace.</p>
          <p style="margin-top:20px">Click the button below to create your vendor account and set up your shop:</p>
          <div style="text-align:center;margin:24px 0">
            <a href="${esc(data.inviteLink)}"
               style="display:inline-block;background:#F97316;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold">
              Accept Invitation →
            </a>
          </div>
          <p style="color:#666;font-size:13px">This invite link will expire in 7 days. If you have any questions, reply to this email or contact support@temsmarket.com.</p>
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

    // Authenticate the caller + get their role
    const { userId, role } = await authenticateRequest(req);
    const isAdmin = role === "admin" || role === "superadmin";

    const payload: EmailPayload = await req.json();
    let subject: string;
    let html: string;
    let to: string;

    switch (payload.type) {
      case "order_confirmation": {
        // Fetch the order + product info server-side
        const serviceClient = getServiceClient();
        const { data: order, error: orderErr } = await serviceClient
          .from("orders")
          .select(`
            id,
            total_amount,
            discounted_total,
            coupon_discount,
            customer_id,
            quantity,
            unit_price,
            vendor_listings!left(
              vendor_id,
              products!left(title)
            )
          `)
          .eq("id", payload.orderId)
          .single();

        if (orderErr || !order) throw new Error("Order not found");
        // Ensure user can only send confirmation for their own order
        if (order.customer_id !== userId) throw new Error("Unauthorized");

        const shopperEmail = await getEmailByUserId(userId);
        if (!shopperEmail) throw new Error("Shopper email not found");
        to = shopperEmail;

        const productTitle = (order as any).vendor_listings?.products?.title || "Product";
        const unitPrice = Number(order.unit_price);
        const subtotal = unitPrice * order.quantity;
        const discount = Number(order.coupon_discount || 0);
        const total = Number(order.discounted_total);

        const result = buildOrderConfirmationHtml({
          orderId: order.id,
          items: [{
            title: productTitle,
            quantity: order.quantity,
            price_at_purchase: unitPrice,
          }],
          subtotal,
          discount,
          total,
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
        if (!isAdmin) throw new Error("Unauthorized");

        to = payload.to;
        const result = buildGiftCardHtml(payload);
        subject = result.subject;
        html = result.html;
        break;
      }
      case "vendor_approved": {
        if (!isAdmin) throw new Error("Unauthorized");

        to = payload.to;
        const result = buildVendorApprovedHtml(payload);
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
