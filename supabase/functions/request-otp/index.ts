// =============================================================
// REQUEST OTP — Tems Market
//
// Sends a 6-digit OTP via Supabase Auth (phone) and optionally
// sends a Twilio SMS as fallback. The OTP is managed by Supabase
// Auth's internal GoTrue service.
//
// In local dev: OTP is logged to the Supabase console.
// In production: OTP is sent via the configured SMS provider.
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
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string") {
      return new Response(JSON.stringify({ error: "Phone number is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawPhone = phone.replace(/[^\d+]/g, "");
    // Ensure E.164 format (+ prefix required by Supabase Auth)
    const e164Phone = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;

    // Use anon key client — SignInWithOtp is a public endpoint
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const { error } = await supabase.auth.signInWithOtp({
      phone: e164Phone,
    });

    if (error) {
      console.error("request-otp: Supabase Auth OTP failed", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the event
    console.log(`📱 OTP requested for ${e164Phone}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("request-otp error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
