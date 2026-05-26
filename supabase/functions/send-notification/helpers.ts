// =============================================================
// HELPERS — send-notification Edge Function
//
// Pure helper functions extracted for testability.
// No Deno-specific imports — works in both Deno and Node (Vitest).
// =============================================================

// ─── Types ─────────────────────────────────────────────────

export interface NotificationResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export interface SupabaseClientStub {
  from: (table: string) => any;
}

// ─── Phone normalisation ───────────────────────────────────

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  return `+220${digits}`;
}

// ─── Meta WhatsApp Cloud API ────────────────────────────────

export async function sendViaWhatsApp(
  phone: string,
  message: string,
  accessToken: string,
  phoneNumberId: string,
): Promise<NotificationResult> {
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone.replace(/^\+/, ""),
    type: "text",
    text: { preview_url: true, body: message },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    return { ok: false, error: `WhatsApp API error [${res.status}]: ${data.error?.message || JSON.stringify(data)}` };
  }

  const wamid: string | undefined = data.messages?.[0]?.id;
  return { ok: true, messageId: wamid };
}

// ─── Africa's Talking SMS ──────────────────────────────────

export async function sendViaSms(
  phone: string,
  message: string,
  apiKey: string,
  username: string,
): Promise<NotificationResult> {
  const url = "https://api.africastalking.com/version1/messaging";

  const to = phone.replace(/^\+/, "");
  const encoded = new URLSearchParams({
    username,
    to,
    message,
    from: "",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "apiKey": apiKey,
    },
    body: encoded.toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    return { ok: false, error: `SMS API error [${res.status}]: ${JSON.stringify(data)}` };
  }

  const smsMessageData = data?.SMSMessageData;
  const messageId: string | undefined = smsMessageData?.Recipients?.[0]?.messageId;

  if (smsMessageData?.Recipients?.[0]?.status === "Rejected") {
    const errMsg = smsMessageData.Recipients[0]?.failureReason || "SMS rejected";
    return { ok: false, error: errMsg };
  }

  return { ok: true, messageId };
}

// ─── Notification logging ──────────────────────────────────

export async function logNotification(
  supabase: SupabaseClientStub,
  userId: string | undefined,
  type: string,
  channel: "whatsapp" | "sms",
  message: string,
  metaMessageId?: string,
  atMessageId?: string,
): Promise<void> {
  const record: Record<string, any> = {
    type,
    channel,
    message: message.slice(0, 500),
    sent_at: new Date().toISOString(),
  };

  if (userId) record.user_id = userId;
  if (metaMessageId) record.meta_message_id = metaMessageId;
  if (atMessageId) record.at_message_id = atMessageId;

  const { error } = await supabase
    .from("notifications_log")
    .insert(record);

  if (error) {
    console.error("send-notification: failed to log notification", error.message);
  }
}
