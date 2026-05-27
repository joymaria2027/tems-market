import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import QRCode from "npm:qrcode@1.5.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Authenticate ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse request ─────────────────────────────────────────────
    const body = await req.json();
    const {
      orderId,
      productId,
      productTitle,
      eventDate,
      venue,
      ticketIdentifier,
      format: outputFormat = "svg",
    } = body;

    if (!orderId || !productId) {
      throw new Error("orderId and productId are required");
    }

    // ── Build QR payload ──────────────────────────────────────────
    // The QR code encodes a URL that venue scanners can use to verify the ticket
    const shortOrderId = orderId.slice(0, 8).toUpperCase();
    const identifier = ticketIdentifier || `${shortOrderId}-${productId.slice(0, 6)}`;

    const qrPayload = JSON.stringify({
      t: "tems-ticket",
      o: orderId,
      p: productId,
      i: identifier,
    });

    // ── Generate QR code ──────────────────────────────────────────
    if (outputFormat === "svg") {
      const svgString = await QRCode.toString(qrPayload, {
        type: "svg",
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });

      // Wrap in a branded card if event info is provided
      let output = svgString;

      if (productTitle) {
        const titleEsc = productTitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const venueEsc = venue ? venue.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
        const dateEsc = eventDate
          ? new Date(eventDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "";

        output = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520">
  <rect width="400" height="520" rx="16" fill="#ffffff"/>
  <rect x="0" y="0" width="400" height="520" rx="16" fill="none" stroke="#e2e8f0" stroke-width="1"/>

  <!-- Header -->
  <text x="200" y="38" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#0f172a">TEMS MARKET</text>
  <text x="200" y="56" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#64748b">Event Ticket</text>

  <!-- Divider -->
  <line x1="32" y1="68" x2="368" y2="68" stroke="#e2e8f0" stroke-width="1"/>

  <!-- Event info -->
  ${titleEsc ? `<text x="200" y="92" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#0f172a">${titleEsc}</text>` : ""}
  ${dateEsc ? `<text x="200" y="112" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#64748b">📅 ${dateEsc}</text>` : ""}
  ${venueEsc ? `<text x="200" y="130" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="#64748b">📍 ${venueEsc}</text>` : ""}

  <!-- Divider -->
  <line x1="32" y1="144" x2="368" y2="144" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4"/>

  <!-- QR Code -->
  ${svgString.replace('<svg xmlns="http://www.w3.org/2000/svg"', '<svg x="60" y="156"').replace('viewBox="0 0 ', 'viewBox="0 0 ')}

  <!-- Order ref -->
  <text x="200" y="478" text-anchor="middle" font-family="monospace" font-size="11" fill="#64748b">Order: #${shortOrderId}</text>
  <text x="200" y="496" text-anchor="middle" font-family="monospace" font-size="11" fill="#64748b">ID: ${identifier}</text>
</svg>`;
      }

      return new Response(output, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // PNG output (data URL for embedding)
    const dataUrl = await QRCode.toDataURL(qrPayload, {
      margin: 2,
      width: 300,
      color: { dark: "#000000", light: "#ffffff" },
    });

    return new Response(
      JSON.stringify({
        qrDataUrl: dataUrl,
        identifier,
        orderId: orderId.slice(0, 8).toUpperCase(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("generate-ticket-qr error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
