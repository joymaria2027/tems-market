// =============================================================
// Helpers — notify-new-application Edge Function
// =============================================================

export interface EmailData {
  businessName: string;
  category: string;
  phone: string;
  description: string;
}

/**
 * HTML-escape user-supplied strings to prevent XSS in email HTML.
 */
export function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build a branded HTML email template for new vendor application notifications.
 */
export function buildEmailHtml(data: EmailData): string {
  const adminUrl = "https://temsmarket.app/admin/vendors";
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
      <div style="background:#F97316;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">New Vendor Application! 🏪</h1>
      </div>
      <div style="padding:24px">
        <p>A new vendor has submitted an application for review.</p>
        <div style="background:#fff7ed;padding:16px;border-radius:8px;border:1px solid #fed7aa;margin:16px 0">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:6px 0;font-weight:bold;color:#666;width:100px">Business</td>
              <td style="padding:6px 0">${esc(data.businessName)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-weight:bold;color:#666">Category</td>
              <td style="padding:6px 0">${esc(data.category)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-weight:bold;color:#666">Phone</td>
              <td style="padding:6px 0">${esc(data.phone)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-weight:bold;color:#666">Description</td>
              <td style="padding:6px 0">${esc(data.description || "Not provided")}</td>
            </tr>
          </table>
        </div>
        <a href="${adminUrl}" style="display:inline-block;background:#F97316;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;margin-top:8px">
          Review Application →
        </a>
        <p style="margin-top:24px;color:#666;font-size:13px">
          This is an automated notification from Tems Market. You can manage all vendor applications in the admin dashboard.
        </p>
      </div>
    </div>`;
}
