// =============================================================
// CHECK EMAIL EXISTS — Tems Market
//
// Lightweight Edge Function that checks whether an auth user
// with the given email exists. Used by the Login page to show
// differentiated error messages: "No account found" vs
// "Incorrect password".
//
// This uses the service_role key and the admin.listUsers() API,
// so it can only distinguish existence, not read passwords.
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
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Use admin client (service_role) to list users and check existence
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("check-email-exists: listUsers failed", error.message);
      // If we can't check, return exists=true so the caller shows a generic error
      return new Response(
        JSON.stringify({ exists: true, error: "Unable to verify" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const exists =
      data?.users?.some((u) => u.email?.toLowerCase() === normalizedEmail) ??
      false;

    return new Response(JSON.stringify({ exists }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("check-email-exists error:", message);
    // Fail open: return exists=true so login shows a generic error
    return new Response(
      JSON.stringify({ exists: true, error: message }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
