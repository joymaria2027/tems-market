import { describe, it, expect } from "vitest";
import { esc, buildEmailHtml, type EmailData } from "../../supabase/functions/notify-new-application/helpers";

// ─── esc ───────────────────────────────────────────────────

describe("esc (HTML escape)", () => {
  it("should escape & to &amp;", () => {
    expect(esc("Fish & Chips")).toBe("Fish &amp; Chips");
  });

  it("should escape < to &lt;", () => {
    expect(esc("<script>alert('xss')</script>")).toBe("&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;");
  });

  it("should escape > to &gt;", () => {
    expect(esc("a > b")).toBe("a &gt; b");
  });

  it("should escape double quotes to &quot;", () => {
    expect(esc('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("should escape single quotes to &#39;", () => {
    expect(esc("it's")).toBe("it&#39;s");
  });

  it("should handle empty string", () => {
    expect(esc("")).toBe("");
  });

  it("should escape all special characters together", () => {
    expect(esc("<hello & 'world'>")).toBe("&lt;hello &amp; &#39;world&#39;&gt;");
  });

  it("should pass through plain text unchanged", () => {
    expect(esc("Hello World")).toBe("Hello World");
  });
});

// ─── buildEmailHtml ────────────────────────────────────────

describe("buildEmailHtml", () => {
  const data: EmailData = {
    businessName: "Fatou's Fashion",
    category: "fashion_thrift",
    phone: "+2201234567",
    description: "Selling second-hand clothing and accessories",
  };

  it("should include business name in the output", () => {
    const html = buildEmailHtml(data);
    expect(html).toContain("Fatou&#39;s Fashion");
  });

  it("should include category in the output", () => {
    const html = buildEmailHtml(data);
    expect(html).toContain("fashion_thrift");
  });

  it("should include phone in the output", () => {
    const html = buildEmailHtml(data);
    expect(html).toContain("+2201234567");
  });

  it("should include description in the output", () => {
    const html = buildEmailHtml(data);
    expect(html).toContain("Selling second-hand clothing and accessories");
  });

  it("should link to admin/vendors", () => {
    const html = buildEmailHtml(data);
    expect(html).toContain("https://temsmarket.app/admin/vendors");
  });

  it("should have a 'New Vendor Application' heading", () => {
    const html = buildEmailHtml(data);
    expect(html).toContain("New Vendor Application");
  });

  it("should have a 'Review Application' CTA", () => {
    const html = buildEmailHtml(data);
    expect(html).toContain("Review Application");
  });

  it("should handle empty description", () => {
    const html = buildEmailHtml({ ...data, description: "" });
    expect(html).toContain("Not provided");
  });

  it("should escape user input to prevent XSS", () => {
    const malicious = buildEmailHtml({
      ...data,
      businessName: "<script>alert('xss')</script>",
    });
    expect(malicious).not.toContain("<script>");
    expect(malicious).toContain("&lt;script&gt;");
  });

  it("should include the Tems Market branding header", () => {
    const html = buildEmailHtml(data);
    expect(html).toContain("background:#F97316");
  });
});
