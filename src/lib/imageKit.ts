/**
 * ImageKit — URL-based image transformation for product photos.
 *
 * To enable:
 * 1. Create an ImageKit account at https://imagekit.io
 * 2. Connect Supabase Storage as an "Web Server" origin
 * 3. Set VITE_IMAGEKIT_URL_ENDPOINT in .env to your ImageKit endpoint
 *    e.g. VITE_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
 *
 * When VITE_IMAGEKIT_URL_ENDPOINT is not set, images pass through unchanged.
 */

const IK_ENDPOINT = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT as string | undefined;

export interface ImageKitOptions {
  /** Width in pixels */
  w?: number;
  /** Height in pixels */
  h?: number;
  /** Quality (1-100, default 75) */
  q?: number;
  /** Focus: auto (smart crop) | face | center */
  fo?: "auto" | "face" | "center";
  /** Output format: auto (WebP/AVIF) | png | webp | jpeg */
  f?: "auto" | "png" | "webp" | "jpeg";
  /** Border radius in px or "max" for circle */
  r?: number | "max";
  /** Blur amount */
  bl?: number;
  /** Sharpening */
  s?: "sh" | "lo";
}

/**
 * Transform an image URL through ImageKit with the given options.
 * Falls back to the original URL if ImageKit is not configured.
 *
 * @param src - Original image URL (Supabase Storage or external)
 * @param opts - Transformation options
 * @returns ImageKit CDN URL or original if not configured
 */
export function imageKit(
  src: string,
  opts: ImageKitOptions = {},
): string {
  if (!IK_ENDPOINT) return src;
  if (!src || src === "/placeholder.svg") return src;

  const params: string[] = [];

  if (opts.w) params.push(`w-${opts.w}`);
  if (opts.h) params.push(`h-${opts.h}`);
  if (opts.q) params.push(`q-${opts.q}`);
  if (opts.fo) params.push(`fo-${opts.fo}`);
  if (opts.f) params.push(`f-${opts.f}`);
  if (opts.r !== undefined) params.push(`r-${opts.r}`);
  if (opts.bl) params.push(`bl-${opts.bl}`);
  if (opts.s) params.push(`s-${opts.s}`);

  // Default: auto-format + quality 75
  if (!opts.f) params.push("f-auto");
  if (!opts.q) params.push("q-75");

  const tr = params.length > 0 ? `tr:${params.join(",")}/` : "";
  const encoded = encodeURIComponent(src);

  return `${IK_ENDPOINT}/${tr}${encoded}`;
}

/**
 * Pre-configured sizes for common use cases.
 */
export const imageSizes = {
  /** Product card thumbnail (400×400, smart crop) */
  thumb: { w: 400, h: 400, fo: "auto" as const },
  /** Product detail main image (800×800, smart crop) */
  detail: { w: 800, h: 800, fo: "auto" as const },
  /** Product detail thumbnail strip (100×100, smart crop) */
  thumbStrip: { w: 100, h: 100, fo: "auto" as const },
  /** Admin list thumbnail (80×80) */
  adminThumb: { w: 80, h: 80, fo: "center" as const },
  /** Hero/banner image (1400×600) */
  hero: { w: 1400, h: 600, fo: "auto" as const },
};
