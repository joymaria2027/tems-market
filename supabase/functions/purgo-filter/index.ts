// =============================================================
// PURGO-FILTER — Tems Market Profanity Filter
//
// Proxies text through PurgoMalum's free profanity-check API.
// Two modes:
//   mode="containsprofanity" → returns "true" or "false"
//   mode="plain"             → returns sanitized text
//
// Auth: verifies caller via Supabase Auth (any authenticated user).
// =============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const PURGOMALUM_BASE = "https://www.purgomalum.com/service";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Authenticate via Supabase Auth ─────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    console.error("purgo-filter: auth failed", authErr?.message);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Parse request ──────────────────────────────────────────
  let body: {
    text?: string;
    mode?: "containsprofanity" | "plain";
    fill_text?: string;
    fill_char?: string;
    add?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { text, mode = "containsprofanity", fill_text, fill_char, add } = body;
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return new Response(JSON.stringify({ error: "text is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Build PurgoMalum URL ──────────────────────────────────
  const params = new URLSearchParams({ text: text.slice(0, 10000) });
  if (add) params.set("add", add);
  if (fill_text) params.set("fill_text", fill_text);
  if (fill_char) params.set("fill_char", fill_char);

  const url = `${PURGOMALUM_BASE}/${mode}?${params}`;

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const result = await resp.text();

    return new Response(result, {
      status: 200,
      headers: {
        "Content-Type": resp.headers.get("Content-Type") || "text/plain",
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("purgo-filter: upstream request failed", err);
    return new Response(
      JSON.stringify({ error: "Filter service unavailable" }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
