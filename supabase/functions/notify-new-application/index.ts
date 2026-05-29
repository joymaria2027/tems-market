// =============================================================
// NOTIFY NEW APPLICATION — Tems Market
//
// Called after a vendor submits an application. Looks up all
// admin and superadmin users and:
//   1. Writes an in-app notification to notifications_log
//   2. Sends an email via Resend to each admin with an email
//
// No auth required — uses service_role internally.
//
// Usage:
//   POST /notify-new-application
//   { businessName: "Fatou's Fashion", category: "fashion_thrift",
//     phone: "+2201234567", description: "..." }
// =============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import { buildEmailHtml } from "./helpers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessName, category, phone, description } = await req.json();

    if (!businessName || !phone) {
      return new Response(
        JSON.stringify({ error: "businessName and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── 1. Look up all admin and superadmin users ─────────
    const { data: admins, error: adminError } = await supabase
      .from("users")
      .select("id, email, phone, full_name, role")
      .in("role", ["admin", "superadmin"])
      .neq("status", "suspended");

    if (adminError) {
      console.error("notify-new-application: failed to look up admins", adminError.message);
      throw adminError;
    }

    if (!admins || admins.length === 0) {
      console.log("notify-new-application: no admins found");
      return new Response(
        JSON.stringify({ notified: 0, message: "No admins found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    let emailSent = 0;
    let inAppLogged = 0;

    for (const admin of admins) {
      // ── 2. Write to notifications_log (in-app notification) ──
      const { error: logError } = await supabase
        .from("notifications_log")
        .insert({
          user_id: admin.id,
          type: "new_vendor_application",
          channel: "email",
          message: `New vendor application: ${businessName} (${category}) — ${phone}`,
          sent_at: new Date().toISOString(),
        });

      if (logError) {
        console.error(`notify-new-application: failed to log for ${admin.id}`, logError.message);
      } else {
        inAppLogged++;
      }

      // ── 3. Send email via Resend ──────────────────────────
      if (RESEND_API_KEY && admin.email) {
        const html = buildEmailHtml({
          businessName,
          category: category || "Not specified",
          phone,
          description: description || "",
        });

        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Tems Market <admin@temsmarket.com>",
              to: [admin.email],
              subject: `New Vendor Application: ${businessName}`,
              html,
            }),
          });

          const resData = await res.json();
          if (!res.ok) {
            console.error(
              `notify-new-application: Resend error for ${admin.email}`,
              `[${res.status}]: ${JSON.stringify(resData)}`,
            );
          } else {
            emailSent++;
            console.log(`notify-new-application: email sent to ${admin.email} (${resData.id})`);
          }
        } catch (emailErr) {
          console.error(`notify-new-application: email fetch error for ${admin.email}`, emailErr);
        }
      }
    }

    return new Response(
      JSON.stringify({
        notified: true,
        adminsFound: admins.length,
        inAppLogged,
        emailSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("notify-new-application error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
