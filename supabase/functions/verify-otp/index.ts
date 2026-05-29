// =============================================================
// VERIFY OTP — Tems Market
//
// Verifies a phone OTP via Supabase Auth and returns the session.
// On success, the handle_new_auth_user trigger creates/finds the
// public.users record automatically.
//
// The client then calls updateProfile to set name, DOB, role, etc.
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
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: "Phone and code are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const rawPhone = phone.replace(/[^\d+]/g, "");
    // Ensure E.164 format (+ prefix required by Supabase Auth)
    const e164Phone = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;

    // Use anon key client — VerifyOtp is a public endpoint
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data, error } = await supabase.auth.verifyOtp({
      phone: e164Phone,
      token: code,
      type: "sms",
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data?.session) {
      return new Response(JSON.stringify({ error: "No session returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure public.users record exists (trigger should handle this)
    try {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const { data: existingUser } = await serviceClient
        .from("users")
        .select("id")
        .eq("id", data.session.user.id)
        .single();

      if (!existingUser) {
        // Trigger missed — create manually, preserving any role from auth metadata
        const userMeta = data.session.user.user_metadata || {};
        const role = userMeta.role || "customer";
        const fullName = userMeta.full_name || "";
        await serviceClient.from("users").insert({
          id: data.session.user.id,
          phone: e164Phone,
          full_name: fullName,
          role: role,
          status: role === "vendor" || role === "admin" || role === "superadmin" ? "pending" : "active",
        });
      }

      // Log to notifications_log
      await serviceClient.from("notifications_log").insert({
        user_id: data.session.user.id,
        type: "otp",
        channel: "sms",
        message: existingUser
          ? "OTP verified — user logged in"
          : "OTP verified — new user created",
      }).catch((logErr) => {
        console.warn("verify-otp: notification log insert failed", logErr);
      });
    } catch (userErr) {
      // Non-fatal: user record created, logging is secondary
      console.warn("verify-otp: user management warning:", userErr);
    }

    return new Response(JSON.stringify({ session: data.session }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("verify-otp error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
