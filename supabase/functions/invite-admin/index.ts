// =============================================================
// INVITE ADMIN — Tems Market
//
// Creates an admin user in Supabase Auth and sends them
// a WhatsApp/SMS invite notification with login instructions.
//
// Called from SuperAdminDashboard after superadmin fills
// the invite form (name, email, phone).
//
// Environment variables (for send-notification):
//   META_WHATSAPP_ACCESS_TOKEN
//   META_WHATSAPP_PHONE_NUMBER_ID
//   AFRICA_TALKING_API_KEY
//   AFRICA_TALKING_USERNAME
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
    // ── Validate auth: only superadmin can invite admins ───
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: callerErr } = await supabaseAnon.auth.getUser(token);

    if (callerErr || !caller) {
      return new Response(
        JSON.stringify({ error: "Unable to verify caller identity" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify caller is superadmin
    const { data: callerProfile } = await supabaseAnon
      .from("users")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (callerProfile?.role !== "superadmin") {
      return new Response(
        JSON.stringify({ error: "Only superadmin can invite admins" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Parse request body ─────────────────────────────────
    const { email, full_name, fullName, phone } = await req.json();
    const name = full_name || fullName;

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!name || typeof name !== "string") {
      return new Response(
        JSON.stringify({ error: "Full name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!phone || typeof phone !== "string") {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Use service role for elevated operations ────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Generate a temporary password ──────────────────────
    const tempPassword = generateTempPassword();

    // ── Create the auth user ──────────────────────────────
    const { data: authUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      phone,
      password: tempPassword,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        role: "admin",
        phone,
        full_name: name,
      },
    });

    if (createErr) {
      console.error("invite-admin: createUser failed", createErr.message);

      if (createErr.message.includes("already registered") || createErr.message.includes("duplicate")) {
        return new Response(
          JSON.stringify({
            error: "A user with this email or phone number already exists.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      throw createErr;
    }

    // ── Update public.users record (trigger sets status='pending' for admin) ──
    const { error: userUpdateErr } = await supabase
      .from("users")
      .update({
        role: "admin",
        status: "pending",
        full_name: name,
        phone,
        email,
      })
      .eq("id", authUser.user.id);

    if (userUpdateErr) {
      console.error("invite-admin: user update failed", userUpdateErr.message);
      // Non-fatal — proceed
    }

    // ── Send invite notification ──────────────────────────
    const origin = Deno.env.get("PUBLIC_APP_URL") || "https://temsmarket.gm";
    const signInLink = `${origin}/login`;
    const inviteMessage =
      `Welcome to Tems Market! Your admin account has been created.\n\n` +
      `Sign in at: ${signInLink}\n` +
      `Email: ${email}\n` +
      `Temporary password: ${tempPassword}\n\n` +
      `Please change your password on first login.\n\n` +
      `- Tems Market Team`;

    let notificationSent = false;
    let notificationError: string | undefined;

    try {
      const notifResult = await sendNotification(
        phone,
        inviteMessage,
        "invite",
        authUser.user.id,
      );
      notificationSent = notifResult.success;
      notificationError = notifResult.error;
    } catch (notifErr) {
      const msg = notifErr instanceof Error ? notifErr.message : "Unknown notification error";
      console.error("invite-admin: notification failed", msg);
      notificationError = msg;
    }

    console.log(`✅ Admin invited: ${name} (${email}) — notification sent: ${notificationSent}`);

    return new Response(
      JSON.stringify({
        success: true,
        admin_id: authUser.user.id,
        full_name: name,
        email,
        phone,
        notificationSent,
        notificationError,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("invite-admin error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

// ─── Generate a secure temporary password ──────────────────────

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Ensure at least one uppercase, one lowercase, one number
  password = "A" + password.slice(1, -1) + "7";
  return password;
}

// ─── Send notification via send-notification Edge Function ─────

async function sendNotification(
  phone: string,
  message: string,
  type: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/send-notification`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        phone,
        message,
        type,
        userId,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok || data?.error) {
    return { success: false, error: data?.error || `HTTP ${response.status}` };
  }

  return { success: data?.success ?? true };
}
