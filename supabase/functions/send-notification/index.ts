// =============================================================
// SEND NOTIFICATION — Tems Market
//
// Sends a notification via Meta WhatsApp Cloud API (preferred)
// with Africa's Talking SMS fallback.
//
// Environment variables (set in Supabase Dashboard):
//   META_WHATSAPP_ACCESS_TOKEN
//   META_WHATSAPP_PHONE_NUMBER_ID
//   AFRICA_TALKING_API_KEY
//   AFRICA_TALKING_USERNAME
//
// Usage:
//   POST /send-notification
//   { phone: "+2201234567", message: "Your invite link: ...", type: "invite", userId?: "uuid" }
// =============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import {
  normalizePhone,
  sendViaWhatsApp,
  sendViaSms,
  logNotification,
} from "./helpers.ts";
import { handleNotificationRequest } from "./handler.ts";

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
    const body = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const env = {
      META_WHATSAPP_ACCESS_TOKEN: Deno.env.get("META_WHATSAPP_ACCESS_TOKEN"),
      META_WHATSAPP_PHONE_NUMBER_ID: Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID"),
      AFRICA_TALKING_API_KEY: Deno.env.get("AFRICA_TALKING_API_KEY"),
      AFRICA_TALKING_USERNAME: Deno.env.get("AFRICA_TALKING_USERNAME"),
    };

    const result = await handleNotificationRequest(body, env, {
      normalizePhone,
      sendViaWhatsApp,
      sendViaSms,
      logNotification,
      supabase,
    });

    return new Response(
      JSON.stringify(result.body),
      {
        status: result.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("send-notification error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
