// =============================================================
// sendInviteNotification — extracted from AdminVendors.tsx
//
// Calls the send-notification Edge Function to deliver
// a vendor invite link via WhatsApp/SMS.
// =============================================================

import type { SupabaseClient } from "@supabase/supabase-js";

export interface InviteNotificationResult {
  success: boolean;
  error?: string;
}

/**
 * Sends a vendor invite notification via the send-notification Edge Function.
 *
 * @param supabaseClient — an authenticated Supabase client
 * @param phone — vendor's phone number
 * @param link — the invite link URL
 */
export async function sendInviteNotification(
  supabaseClient: SupabaseClient,
  phone: string,
  link: string,
): Promise<InviteNotificationResult> {
  try {
    const res = await supabaseClient.functions.invoke("send-notification", {
      body: {
        phone,
        type: "invite",
        message: `You've been invited to sell on Tems Market! Set up your vendor account here: ${link}`,
      },
    });

    if (res.error) {
      throw new Error(res.error.message || "Notification failed");
    }

    return { success: true };
  } catch (err: any) {
    const errMsg = err?.message || "Failed to send notification";
    console.error("send-notification error:", errMsg);
    return { success: false, error: errMsg };
  }
}
