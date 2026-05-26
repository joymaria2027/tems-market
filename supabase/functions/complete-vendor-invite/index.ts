// =============================================================
// COMPLETE VENDOR INVITE — Tems Market
//
// Validates invite token, creates auth user + vendor profile.
// Called from VendorInvite.tsx after vendor sets password.
// =============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

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
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ error: "Invite token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Use service role for elevated operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── 1. Validate the invite token ─────────────────────
    const { data: app, error: appErr } = await supabase
      .from("vendor_applications")
      .select("*")
      .eq("invite_token", token)
      .maybeSingle();

    if (appErr) throw appErr;

    if (!app) {
      return new Response(
        JSON.stringify({ error: "Invalid invite link" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (app.status === "completed") {
      return new Response(
        JSON.stringify({ error: "This invite has already been used. Please sign in instead." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (app.status !== "approved") {
      return new Response(
        JSON.stringify({ error: "Invalid invite link" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (app.invite_expires_at && new Date(app.invite_expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This invite has expired. Contact your admin for a new one." }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 2. Create auth user ──────────────────────────────
    const phone = app.phone.startsWith("+") ? app.phone : `+${app.phone}`;
    const extraData = app.extra_data || {};
    const fullName = extraData.fullName || app.business_name;
    const email = extraData.email || null;

    const { data: authUser, error: createErr } = await supabase.auth.admin.createUser({
      phone,
      email: email || undefined,
      password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        role: "vendor",
        phone: app.phone,
        full_name: fullName,
      },
    });

    if (createErr) {
      console.error("complete-vendor-invite: createUser failed", createErr.message);

      // Handle duplicate phone gracefully
      if (createErr.message.includes("already registered") || createErr.message.includes("duplicate")) {
        return new Response(
          JSON.stringify({
            error: "A user with this phone number already exists. Please sign in instead.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      throw createErr;
    }

    // ── 3. Update public.users role + status (the trigger
    //    already creates it, but we overwrite to ensure vendor/active) ──
    const { error: userUpdateErr } = await supabase
      .from("users")
      .update({
        role: "vendor",
        status: "active",
        full_name: fullName,
        phone: app.phone,
        email: email,
      })
      .eq("id", authUser.user.id);

    if (userUpdateErr) {
      console.error("complete-vendor-invite: user update failed", userUpdateErr.message);
      // Non-fatal — proceed
    }

    // ── 4. Create vendor_profiles record ──────────────────
    const { error: vpErr } = await supabase
      .from("vendor_profiles")
      .upsert({
        user_id: authUser.user.id,
        business_name: app.business_name,
        category: app.category,
      }, { onConflict: "user_id" });

    if (vpErr) {
      console.error("complete-vendor-invite: vendor profile creation failed", vpErr.message);
      // Non-fatal — proceed
    }

    // ── 5. Mark application as completed ──────────────────
    const { error: updateAppErr } = await supabase
      .from("vendor_applications")
      .update({ status: "completed" })
      .eq("id", app.id);

    if (updateAppErr) {
      console.error("complete-vendor-invite: app status update failed", updateAppErr.message);
    }

    console.log(`✅ Vendor invite completed: ${app.business_name} (${phone})`);

    return new Response(
      JSON.stringify({
        success: true,
        userId: authUser.user.id,
        businessName: app.business_name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("complete-vendor-invite error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
