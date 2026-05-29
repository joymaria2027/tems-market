// =============================================================
// SYNC AUTH USERS — Tems Market
//
// Periodic cleanup function: finds auth users (auth.users) that
// don't have a corresponding public.users record and creates
// the missing records.
//
// This handles the edge case where the handle_new_auth_user
// trigger on auth.users didn't fire (e.g., during migration
// gaps or trigger failures).
//
// Schedule: every hour via pg_cron
//   SELECT cron.schedule('sync-auth-users', '0 * * * *', $$
//     SELECT net.http_post(
//       url := 'https://vawcbbnnjhuitqxabygs.supabase.co/functions/v1/sync-auth-users',
//       headers := jsonb_build_object(
//         'Content-Type', 'application/json',
//         'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
//       )
//     ) as request_id;
//   $$);
//
// No auth required on this function because it has zero
// user-controlled parameters and is fully idempotent.
// All operations use SUPABASE_SERVICE_ROLE_KEY from env.
// =============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const VALID_ROLES = new Set(["superadmin", "admin", "vendor", "affiliate", "customer"]);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── 1. Fetch all auth users ────────────────────────────
    let created = 0;
    let skipped = 0;
    let errors: string[] = [];
    let page = 0;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({
        page: page + 1,
        perPage: pageSize,
      });

      if (listError) {
        console.error("sync-auth-users: listUsers failed", listError.message);
        throw listError;
      }

      if (!authUsers?.users || authUsers.users.length === 0) {
        hasMore = false;
        break;
      }

      // ── 2. For each auth user, check if public.users exists ──
      for (const authUser of authUsers.users) {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("id", authUser.id)
          .maybeSingle();

        if (existingUser) {
          skipped++;
          continue;
        }

        // ── 3. Create missing public.users record ──────────
        const meta = authUser.user_metadata || {};
        const rawRole = (meta.role || "customer") as string;
        const role = VALID_ROLES.has(rawRole) ? rawRole : "customer";
        const fullName = meta.full_name || "";
        const phone = authUser.phone
          ? (authUser.phone.startsWith("+") ? authUser.phone : `+${authUser.phone}`)
          : "";
        const email = authUser.email || null;

        const status = (role === "customer" || role === "affiliate")
          ? "active"
          : "pending";

        const { error: insertErr } = await supabase.from("users").insert({
          id: authUser.id,
          phone,
          full_name: fullName,
          email,
          role,
          status,
        });

        if (insertErr) {
          console.error(
            `sync-auth-users: insert failed for ${authUser.id}`,
            insertErr.message,
          );
          errors.push(`${authUser.id}: ${insertErr.message}`);
        } else {
          console.log(
            `sync-auth-users: created public.users for ${authUser.id} (${role})`,
          );
          created++;
        }
      }

      hasMore = authUsers.users.length === pageSize;
      page++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        created,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
        summary: `Created ${created}, skipped ${skipped}${errors.length > 0 ? `, ${errors.length} errors` : ""}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("sync-auth-users error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
