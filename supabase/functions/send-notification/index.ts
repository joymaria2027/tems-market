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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  phone: string;
  message: string;
  type: string;
  userId?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Validate request ────────────────────────────────
    const { phone, message, type, userId }: NotificationRequest = await req.json();

    if (!phone || typeof phone !== "string") {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!type || typeof type !== "string") {
      return new Response(
        JSON.stringify({ error: "Notification type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const normalizedPhone = normalizePhone(phone);

    // ── Environment variables ────────────────────────────
    const metaAccessToken = Deno.env.get("META_WHATSAPP_ACCESS_TOKEN");
    const metaPhoneNumberId = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID");
    const africaTalkingApiKey = Deno.env.get("AFRICA_TALKING_API_KEY");
    const africaTalkingUsername = Deno.env.get("AFRICA_TALKING_USERNAME");

    const hasWhatsApp = !!metaAccessToken && !!metaPhoneNumberId;
    const hasSms = !!africaTalkingApiKey && !!africaTalkingUsername;

    // Service role client for logging
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let channel: "whatsapp" | "sms" = "sms";
    let metaMessageId: string | undefined;
    let atMessageId: string | undefined;
    let deliverySuccess = false;
    let deliveryError: string | undefined;

    // ── Try WhatsApp first ───────────────────────────────
    if (hasWhatsApp) {
      console.log(`send-notification: sending via WhatsApp to ${normalizedPhone}`);
      const result = await sendViaWhatsApp(normalizedPhone, message, metaAccessToken!, metaPhoneNumberId!);

      if (result.ok) {
        channel = "whatsapp";
        metaMessageId = result.messageId;
        deliverySuccess = true;
      } else {
        console.warn(`send-notification: WhatsApp failed, will try SMS fallback: ${result.error}`);
        deliveryError = result.error;
      }
    } else {
      console.log("send-notification: WhatsApp not configured, using SMS fallback");
    }

    // ── Fallback to SMS if WhatsApp didn't succeed ───────
    if (!deliverySuccess && hasSms) {
      console.log(`send-notification: sending via SMS to ${normalizedPhone}`);
      const result = await sendViaSms(normalizedPhone, message, africaTalkingApiKey!, africaTalkingUsername!);

      if (result.ok) {
        channel = "sms";
        atMessageId = result.messageId;
        deliverySuccess = true;
      } else {
        console.error(`send-notification: SMS also failed: ${result.error}`);
        deliveryError = `${deliveryError ? deliveryError + "; " : ""}SMS failed: ${result.error}`;
      }
    }

    // ── Log to notifications_log ─────────────────────────
    // logNotification handles undefined userId gracefully (omits user_id from record)
    await logNotification(supabase, userId, type, channel, message, metaMessageId, atMessageId);

    if (!deliverySuccess) {
      return new Response(
        JSON.stringify({
          success: false,
          error: deliveryError || "No notification channel available. Configure META_WHATSAPP_ACCESS_TOKEN or AFRICA_TALKING_API_KEY.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`✅ Notification sent via ${channel} to ${normalizedPhone}`);

    return new Response(
      JSON.stringify({
        success: true,
        channel,
        metaMessageId,
        atMessageId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
