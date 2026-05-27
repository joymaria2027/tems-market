/**
 * Kutt — open-source URL shortener with click analytics.
 *
 * The Kutt API key lives in an Edge Function (never client).
 * This client calls `supabase.functions.invoke("create-short-url")`
 * which proxies to the Kutt API server-side.
 *
 * Usage:
 *   const { shortUrl, id } = await createShortUrl("https://...");
 *   const clicks = await getShortUrlClicks(id);
 */

import { supabase } from "@/integrations/supabase/client";

export interface ShortUrlResponse {
  shortUrl: string;
  id: string;
  target: string;
}

export interface ClickStats {
  total: number;
}

/**
 * Create a shortened URL via the Kutt API (proxied through Edge Function).
 * @param target - The full URL to shorten
 * @param alias - Optional custom alias (slug)
 * @param description - Optional description for the link
 */
export async function createShortUrl(
  target: string,
  alias?: string,
  description?: string,
): Promise<ShortUrlResponse> {
  const { data, error } = await supabase.functions.invoke("create-short-url", {
    body: { target, alias, description },
  });

  if (error) throw new Error(error.message || "Failed to create short URL");

  return {
    shortUrl: data.shortUrl,
    id: data.id,
    target: data.target,
  };
}

/**
 * Fetch click statistics for a shortened URL (proxied through Edge Function).
 */
export async function getShortUrlClicks(linkId: string): Promise<ClickStats> {
  const { data, error } = await supabase.functions.invoke("create-short-url", {
    body: { action: "clicks", linkId },
  });

  if (error) throw new Error(error.message || "Failed to fetch click stats");

  return { total: data.clicks ?? data.total ?? 0 };
}

/**
 * Generate a short affiliate link for an affiliate code.
 */
export function affiliateShortUrl(code: string): string {
  return `${window.location.origin}/shop?ref=${code}`;
}
