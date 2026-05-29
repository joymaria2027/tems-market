// =============================================================
// COMPLETE VENDOR INVITE — Tems Market
//
// Validates invite token, creates auth user + vendor profile.
// Called from VendorInvite.tsx after vendor sets password.
// =============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import {
  validateToken,
  validatePassword,
  validateApplicationStatus,
  buildUserMetadata,
} from "./helpers.ts";

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
    const { token, password, email } = await req.json();

    // ── Validate inputs ──────────────────────────────────
    const tokenCheck = validateToken(token);
    if (!tokenCheck.valid) {
      return new Response(
        JSON.stringify({ error: tokenCheck.error }),
        { status: tokenCheck.status!, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return new Response(
        JSON.stringify({ error: passwordCheck.error }),
        { status: passwordCheck.status!, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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

    const appCheck = validateApplicationStatus(app);
    if (!appCheck.valid) {
      return new Response(
        JSON.stringify({ error: appCheck.error }),
        { status: appCheck.status!, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 2. Create auth user ──────────────────────────────
    const { phone, email: userEmail, fullName, metadata } = buildUserMetadata(app!, email || null);

    const { data: authUser, error: createErr } = await supabase.auth.admin.createUser({
      phone,
      email: userEmail || undefined,
      password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        ...metadata,
        email: userEmail,
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

    // ── 3. Ensure public.users record exists with vendor role ──
    //    The handle_new_auth_user trigger should create it, but we
    //    have a fallback if the trigger didn't fire.
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", authUser.user.id)
      .maybeSingle();

    if (!existingUser) {
      // Trigger missed — create manually
      const { error: insertErr } = await supabase.from("users").insert({
        id: authUser.user.id,
        phone: app!.phone,
        full_name: fullName,
        email: userEmail,
        role: "vendor",
        status: "active",
      });
      if (insertErr) {
        console.error("complete-vendor-invite: user insert failed", insertErr.message);
      }
    } else {
      // Trigger worked — update to ensure vendor/active
      const { error: userUpdateErr } = await supabase
        .from("users")
        .update({
          role: "vendor",
          status: "active",
          full_name: fullName,
          phone: app!.phone,
          email: userEmail,
        })
        .eq("id", authUser.user.id);

      if (userUpdateErr) {
        console.error("complete-vendor-invite: user update failed", userUpdateErr.message);
      }
    }

    // ── 4. Create vendor_profiles record ──────────────────
    const { error: vpErr } = await supabase
      .from("vendor_profiles")
      .upsert({
        user_id: authUser.user.id,
        business_name: app!.business_name,
        category: app!.category,
      }, { onConflict: "user_id" });

    if (vpErr) {
      console.error("complete-vendor-invite: vendor profile creation failed", vpErr.message);
      // Non-fatal — proceed
    }

    // ── 5. Mark application as completed ──────────────────
    const { error: updateAppErr } = await supabase
      .from("vendor_applications")
      .update({ status: "completed" })
      .eq("id", app!.id);

    if (updateAppErr) {
      console.error("complete-vendor-invite: app status update failed", updateAppErr.message);
    }

    console.log(`✅ Vendor invite completed: ${app!.business_name} (${phone})`);

    return new Response(
      JSON.stringify({
        success: true,
        userId: authUser.user.id,
        businessName: app!.business_name,
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
