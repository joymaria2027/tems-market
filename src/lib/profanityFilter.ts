// ─── Profanity Filter Client ────────────────────────────────────────
// Wraps the purgo-filter Edge Function for client-side checks.
// Use checkProfanity() to block submissions, sanitizeText() to
// auto-clean content before storage.

import { supabase } from "@/integrations/supabase/client";

export type ProfanityCheckResult =
  | { ok: true; clean: boolean }
  | { ok: false; error: string };

/**
 * Check whether `text` contains profanity.
 * Returns `{ ok: true, clean: boolean }` on success.
 * Returns `{ ok: false, error: string }` if the filter service is down.
 *
 * Usage:
 *   const { ok, clean, error } = await checkProfanity(title);
 *   if (ok && !clean) { /* warn user *\/ }
 */
export async function checkProfanity(text: string): Promise<ProfanityCheckResult> {
  if (!text.trim()) return { ok: true, clean: true };

  try {
    const { data, error } = await supabase.functions.invoke("purgo-filter", {
      body: { text, mode: "containsprofanity" },
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, clean: data === "false" };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Filter unavailable" };
  }
}

/**
 * Sanitize text by replacing profanity with a fill character.
 * Falls back to the original text if the service is unavailable.
 */
export async function sanitizeText(
  text: string,
  options?: { fill_text?: string; fill_char?: string; add?: string },
): Promise<string> {
  if (!text.trim()) return text;

  try {
    const { data, error } = await supabase.functions.invoke("purgo-filter", {
      body: { text, mode: "plain", ...options },
    });

    if (error) return text;
    return (data as string) || text;
  } catch {
    return text;
  }
}

/**
 * Check multiple text fields in parallel and return the first
 * problematic field (or null if all are clean).
 */
export async function checkFields(
  fields: Record<string, string>,
): Promise<{ field: string; clean: boolean } | null> {
  const entries = Object.entries(fields).filter(([, v]) => v.trim().length > 0);
  if (entries.length === 0) return null;

  const results = await Promise.all(
    entries.map(async ([key, value]) => {
      const res = await checkProfanity(value);
      return { field: key, clean: res.ok ? res.clean : true, error: res.ok ? null : res.error };
    }),
  );

  return results.find((r) => !r.clean) ?? null;
}
