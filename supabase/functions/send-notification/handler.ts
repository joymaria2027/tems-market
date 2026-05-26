// =============================================================
// HANDLER — send-notification Edge Function
//
// Pure request handler extracted from serve() for testability.
// No Deno-specific imports — works in both Deno and Node (Vitest).
// =============================================================

import type { NotificationResult, SupabaseClientStub } from "./helpers.ts";

// ─── Types ─────────────────────────────────────────────────

export interface NotificationRequest {
  phone: string;
  message: string;
  type: string;
  userId?: string;
}

export interface EnvVars {
  META_WHATSAPP_ACCESS_TOKEN?: string;
  META_WHATSAPP_PHONE_NUMBER_ID?: string;
  AFRICA_TALKING_API_KEY?: string;
  AFRICA_TALKING_USERNAME?: string;
}

export interface HandlerDeps {
  normalizePhone: (raw: string) => string;
  sendViaWhatsApp: (phone: string, message: string, token: string, phoneId: string) => Promise<NotificationResult>;
  sendViaSms: (phone: string, message: string, apiKey: string, username: string) => Promise<NotificationResult>;
  logNotification: (
    supabase: SupabaseClientStub,
    userId: string | undefined,
    type: string,
    channel: "whatsapp" | "sms",
    message: string,
    metaMessageId?: string,
    atMessageId?: string,
  ) => Promise<void>;
  supabase: SupabaseClientStub;
}

export interface HandlerResponse {
  status: number;
  body: Record<string, any>;
}

// ─── Handler ───────────────────────────────────────────────

export async function handleNotificationRequest(
  reqBody: NotificationRequest,
  env: EnvVars,
  deps: HandlerDeps,
): Promise<HandlerResponse> {
  const { phone, message, type, userId } = reqBody;

  // ── Validate request ────────────────────────────────
  if (!phone || typeof phone !== "string") {
    return { status: 400, body: { error: "Phone number is required" } };
  }

  if (!message || typeof message !== "string") {
    return { status: 400, body: { error: "Message is required" } };
  }

  if (!type || typeof type !== "string") {
    return { status: 400, body: { error: "Notification type is required" } };
  }

  const normalizedPhone = deps.normalizePhone(phone);

  // ── Check channel availability ──────────────────────
  const hasWhatsApp = !!env.META_WHATSAPP_ACCESS_TOKEN && !!env.META_WHATSAPP_PHONE_NUMBER_ID;
  const hasSms = !!env.AFRICA_TALKING_API_KEY && !!env.AFRICA_TALKING_USERNAME;

  let channel: "whatsapp" | "sms" = "sms";
  let metaMessageId: string | undefined;
  let atMessageId: string | undefined;
  let deliverySuccess = false;
  let deliveryError: string | undefined;

  // ── Try WhatsApp first ──────────────────────────────
  if (hasWhatsApp) {
    const result = await deps.sendViaWhatsApp(
      normalizedPhone,
      message,
      env.META_WHATSAPP_ACCESS_TOKEN!,
      env.META_WHATSAPP_PHONE_NUMBER_ID!,
    );

    if (result.ok) {
      channel = "whatsapp";
      metaMessageId = result.messageId;
      deliverySuccess = true;
    } else {
      deliveryError = result.error;
    }
  }

  // ── Fallback to SMS if WhatsApp didn't succeed ──────
  if (!deliverySuccess && hasSms) {
    const result = await deps.sendViaSms(
      normalizedPhone,
      message,
      env.AFRICA_TALKING_API_KEY!,
      env.AFRICA_TALKING_USERNAME!,
    );

    if (result.ok) {
      channel = "sms";
      atMessageId = result.messageId;
      deliverySuccess = true;
    } else {
      deliveryError = `${deliveryError ? deliveryError + "; " : ""}SMS failed: ${result.error}`;
    }
  }

  // ── Log to notifications_log ────────────────────────
  await deps.logNotification(
    deps.supabase,
    userId,
    type,
    channel,
    message,
    metaMessageId,
    atMessageId,
  );

  if (!deliverySuccess) {
    return {
      status: 500,
      body: {
        success: false,
        error: deliveryError || "No notification channel available. Configure META_WHATSAPP_ACCESS_TOKEN or AFRICA_TALKING_API_KEY.",
      },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      channel,
      metaMessageId,
      atMessageId,
    },
  };
}
