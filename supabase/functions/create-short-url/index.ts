/**
 * create-short-url Edge Function
 *
 * Proxies to the Kutt URL shortener API server-side.
 * Keeps the Kutt API key secure — never exposed to client.
 *
 * Environment variables:
 *   KUTT_BASE_URL - e.g. https://kutt.to (your Kutt instance)
 *   KUTT_API_KEY  - Your Kutt API key from Settings → API Key
 *
 * If KUTT_BASE_URL or KUTT_API_KEY is not set, returns the original URL
 * unchanged (degraded mode for local dev).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });

  // ── Auth — verify JWT via Supabase client ────────────────────
  const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify the user is authenticated
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authHeader}` } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Parse request body ───────────────────────────────────────
  const { target, alias, description, action, linkId } = await req.json();

  // ── Kutt configuration ───────────────────────────────────────
  const kuttBaseUrl = Deno.env.get("KUTT_BASE_URL");
  const kuttApiKey = Deno.env.get("KUTT_API_KEY");

  // Degraded mode: no Kutt configured, return the original URL
  if (!kuttBaseUrl || !kuttApiKey) {
    if (action === "clicks") {
      return new Response(JSON.stringify({ clicks: 0, note: "Kutt not configured" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        shortUrl: target,
        id: "local",
        target,
        note: "Kutt not configured — returning original URL",
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    if (action === "clicks" && linkId) {
      // ── Fetch click stats ─────────────────────────────────────
      const resp = await fetch(`${kuttBaseUrl}/api/v2/links/${linkId}/stats`, {
        headers: { "X-API-Key": kuttApiKey },
      });

      if (!resp.ok) {
        const errBody = await resp.text();
        throw new Error(`Kutt API returned ${resp.status}: ${errBody}`);
      }

      const stats = await resp.json();
      return new Response(JSON.stringify({ clicks: stats.total ?? stats.clicks ?? 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── Create short URL ────────────────────────────────────────
    if (!target) {
      return new Response(JSON.stringify({ error: "target URL is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body: Record<string, unknown> = { target };
    if (alias) body.customurl = alias;
    if (description) body.description = description;

    const resp = await fetch(`${kuttBaseUrl}/api/v2/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": kuttApiKey,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      throw new Error(`Kutt API returned ${resp.status}: ${errBody}`);
    }

    const result = await resp.json();

    return new Response(
      JSON.stringify({
        shortUrl: result.link || result.shortUrl,
        id: result.id,
        target: result.target || target,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Kutt API error:", err);
    // Degraded fallback: return the original URL
    return new Response(
      JSON.stringify({
        shortUrl: target,
        id: "fallback",
        target,
        error: (err as Error).message,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
});
