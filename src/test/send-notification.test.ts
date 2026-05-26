import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  normalizePhone,
  sendViaWhatsApp,
  sendViaSms,
  logNotification,
  type SupabaseClientStub,
} from "../../supabase/functions/send-notification/helpers";

// ─── normalizePhone ────────────────────────────────────────

describe("normalizePhone", () => {
  it("should preserve already-formatted E.164 numbers", () => {
    expect(normalizePhone("+2201234567")).toBe("+2201234567");
    expect(normalizePhone("+2209988776")).toBe("+2209988776");
  });

  it("should prepend +220 for local Gambia numbers without prefix", () => {
    expect(normalizePhone("1234567")).toBe("+2201234567");
    expect(normalizePhone("9988776")).toBe("+2209988776");
  });

  it("should strip whitespace and punctuation", () => {
    expect(normalizePhone("+220 123 4567")).toBe("+2201234567");
    expect(normalizePhone("+220-123-4567")).toBe("+2201234567");
    expect(normalizePhone("  +2201234567  ")).toBe("+2201234567");
    expect(normalizePhone("123-456-7")).toBe("+2201234567");
  });

  it("should preserve other country codes", () => {
    expect(normalizePhone("+12025551234")).toBe("+12025551234");
  });

  it("should handle empty or minimalist input", () => {
    expect(normalizePhone("")).toBe("+220");
    expect(normalizePhone("+")).toBe("+");
  });
});

// ─── sendViaWhatsApp ───────────────────────────────────────

describe("sendViaWhatsApp", () => {
  const mockFetch = vi.fn();
  const accessToken = "test-token";
  const phoneNumberId = "123456";

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = mockFetch;
  });

  it("should return messageId on successful send", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [{ id: "wamid.test.123" }] }),
    });

    const result = await sendViaWhatsApp("+2201234567", "Hello!", accessToken, phoneNumberId);

    expect(result.ok).toBe(true);
    expect(result.messageId).toBe("wamid.test.123");
    expect(result.error).toBeUndefined();
  });

  it("should strip + prefix from phone when sending to Meta API", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [{ id: "wamid.abc" }] }),
    });

    await sendViaWhatsApp("+2201234567", "Test", accessToken, phoneNumberId);

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.to).toBe("2201234567");
  });

  it("should include preview_url: true in text payload", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [{ id: "wamid.abc" }] }),
    });

    await sendViaWhatsApp("+2201234567", "Check this: https://tems.link/abc", accessToken, phoneNumberId);

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.text.preview_url).toBe(true);
    expect(callBody.text.body).toBe("Check this: https://tems.link/abc");
  });

  it("should return error on API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: "Invalid token" } }),
    });

    const result = await sendViaWhatsApp("+2201234567", "Hello", accessToken, phoneNumberId);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("WhatsApp API error");
    expect(result.error).toContain("401");
    expect(result.error).toContain("Invalid token");
  });

  it("should handle non-JSON error response gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: {} }),
    });

    const result = await sendViaWhatsApp("+2201234567", "Hello", accessToken, phoneNumberId);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("WhatsApp API error");
  });

  it("should send to correct Graph API URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [{ id: "wamid.abc" }] }),
    });

    await sendViaWhatsApp("+2201234567", "Hello", accessToken, phoneNumberId);

    expect(mockFetch.mock.calls[0][0]).toBe(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`
    );
  });

  it("should set Bearer token in Authorization header", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [{ id: "wamid.abc" }] }),
    });

    await sendViaWhatsApp("+2201234567", "Hello", accessToken, phoneNumberId);

    expect(mockFetch.mock.calls[0][1].headers["Authorization"]).toBe(`Bearer ${accessToken}`);
  });

  it("should return undefined messageId when response has no messages array", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await sendViaWhatsApp("+2201234567", "Hello", accessToken, phoneNumberId);

    expect(result.ok).toBe(true);
    expect(result.messageId).toBeUndefined();
  });
});

// ─── sendViaSms ────────────────────────────────────────────

describe("sendViaSms", () => {
  const mockFetch = vi.fn();
  const apiKey = "at-key-123";
  const username = "tems-market";

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = mockFetch;
  });

  it("should return messageId on successful send", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        SMSMessageData: {
          Recipients: [{ messageId: "ATXid_abc123", status: "Success" }],
        },
      }),
    });

    const result = await sendViaSms("+2201234567", "Hello!", apiKey, username);

    expect(result.ok).toBe(true);
    expect(result.messageId).toBe("ATXid_abc123");
    expect(result.error).toBeUndefined();
  });

  it("should strip + prefix from phone when sending to Africa's Talking", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        SMSMessageData: {
          Recipients: [{ messageId: "ATXid_abc", status: "Success" }],
        },
      }),
    });

    await sendViaSms("+2201234567", "Test", apiKey, username);

    const body = mockFetch.mock.calls[0][1].body.toString();
    expect(body).toContain("to=2201234567");
  });

  it("should construct form-urlencoded body correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        SMSMessageData: {
          Recipients: [{ messageId: "ATXid_abc", status: "Success" }],
        },
      }),
    });

    await sendViaSms("+2201234567", "Your code is 123456", apiKey, username);

    const body = mockFetch.mock.calls[0][1].body.toString();
    expect(body).toContain("username=tems-market");
    expect(body).toContain("to=2201234567");
    expect(body).toContain("message=Your+code+is+123456");
  });

  it("should return error on rejected recipient", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        SMSMessageData: {
          Recipients: [{
            messageId: null,
            status: "Rejected",
            failureReason: "Invalid phone number",
          }],
        },
      }),
    });

    const result = await sendViaSms("+220999", "Hello", apiKey, username);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Invalid phone number");
  });

  it("should return error on API failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ message: "Forbidden" }),
    });

    const result = await sendViaSms("+2201234567", "Hello", apiKey, username);

    expect(result.ok).toBe(false);
    expect(result.error).toContain("SMS API error");
    expect(result.error).toContain("403");
  });

  it("should send to correct Africa's Talking URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        SMSMessageData: {
          Recipients: [{ messageId: "ATXid_abc", status: "Success" }],
        },
      }),
    });

    await sendViaSms("+2201234567", "Hello", apiKey, username);

    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://api.africastalking.com/version1/messaging"
    );
  });

  it("should set apiKey header correctly", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        SMSMessageData: {
          Recipients: [{ messageId: "ATXid_abc", status: "Success" }],
        },
      }),
    });

    await sendViaSms("+2201234567", "Hello", apiKey, username);

    expect(mockFetch.mock.calls[0][1].headers["apiKey"]).toBe(apiKey);
  });

  it("should return fallback error when rejected with no failure reason", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        SMSMessageData: {
          Recipients: [{ status: "Rejected" }],
        },
      }),
    });

    const result = await sendViaSms("+2201234567", "Hello", apiKey, username);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("SMS rejected");
  });
});

// ─── logNotification ───────────────────────────────────────

describe("logNotification", () => {
  let mockSupabase: SupabaseClientStub;
  let mockInsert: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-26T12:00:00Z"));

    mockInsert = vi.fn();
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should insert a log record with required fields", async () => {
    mockInsert.mockResolvedValueOnce({ error: null });

    await logNotification(mockSupabase, "user-1", "invite", "whatsapp", "Your invite link: https://tems.market/invite/abc");

    expect(mockSupabase.from).toHaveBeenCalledWith("notifications_log");
    expect(mockInsert).toHaveBeenCalledWith({
      type: "invite",
      channel: "whatsapp",
      message: "Your invite link: https://tems.market/invite/abc",
      sent_at: "2026-05-26T12:00:00.000Z",
      user_id: "user-1",
    });
  });

  it("should include meta_message_id when provided", async () => {
    mockInsert.mockResolvedValueOnce({ error: null });

    await logNotification(mockSupabase, "user-1", "invite", "whatsapp", "Hello", "wamid.abc123");

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ meta_message_id: "wamid.abc123" })
    );
  });

  it("should include at_message_id when provided", async () => {
    mockInsert.mockResolvedValueOnce({ error: null });

    await logNotification(mockSupabase, "user-1", "invite", "sms", "Hello", undefined, "ATXid.def456");

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ at_message_id: "ATXid.def456" })
    );
  });

  it("should omit user_id when undefined", async () => {
    mockInsert.mockResolvedValueOnce({ error: null });

    await logNotification(mockSupabase, undefined, "otp", "whatsapp", "Your code is 123456");

    const record = mockInsert.mock.calls[0][0];
    expect(record.user_id).toBeUndefined();
  });

  it("should truncate message to 500 characters", async () => {
    mockInsert.mockResolvedValueOnce({ error: null });
    const longMsg = "x".repeat(1000);

    await logNotification(mockSupabase, "user-1", "order_update", "whatsapp", longMsg);

    const record = mockInsert.mock.calls[0][0];
    expect(record.message.length).toBe(500);
  });

  it("should not throw on Supabase insert error", async () => {
    mockInsert.mockResolvedValueOnce({ error: new Error("DB error") });

    await expect(
      logNotification(mockSupabase, "user-1", "invite", "sms", "Hello")
    ).resolves.toBeUndefined();
  });
});
