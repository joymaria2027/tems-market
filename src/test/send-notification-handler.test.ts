import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleNotificationRequest,
  type EnvVars,
  type HandlerDeps,
} from "../../supabase/functions/send-notification/handler";

// ─── Test factory ──────────────────────────────────────────

function createDeps(overrides?: Partial<HandlerDeps>): HandlerDeps {
  return {
    normalizePhone: (raw: string) => (raw.startsWith("+") ? raw : `+220${raw}`),
    sendViaWhatsApp: vi.fn().mockResolvedValue({ ok: true, messageId: "wamid.test" }),
    sendViaSms: vi.fn().mockResolvedValue({ ok: true, messageId: "ATXid.test" }),
    logNotification: vi.fn().mockResolvedValue(undefined),
    supabase: { from: vi.fn().mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) }) },
    ...overrides,
  };
}

const fullEnv: EnvVars = {
  META_WHATSAPP_ACCESS_TOKEN: "wa-token",
  META_WHATSAPP_PHONE_NUMBER_ID: "wa-phone-id",
  AFRICA_TALKING_API_KEY: "at-key",
  AFRICA_TALKING_USERNAME: "at-user",
};

const validBody = {
  phone: "+2201234567",
  message: "Hello from Tems!",
  type: "invite",
  userId: "user-123",
};

// ─── Validation ────────────────────────────────────────────

describe("handleNotificationRequest — validation", () => {
  it("should return 400 when phone is missing", async () => {
    const deps = createDeps();
    const result = await handleNotificationRequest(
      { phone: "", message: "Hi", type: "invite" },
      fullEnv,
      deps,
    );
    expect(result.status).toBe(400);
    expect(result.body.error).toContain("Phone");
  });

  it("should return 400 when message is missing", async () => {
    const deps = createDeps();
    const result = await handleNotificationRequest(
      { phone: "+2201234567", message: "", type: "invite" },
      fullEnv,
      deps,
    );
    expect(result.status).toBe(400);
    expect(result.body.error).toContain("Message");
  });

  it("should return 400 when type is missing", async () => {
    const deps = createDeps();
    const result = await handleNotificationRequest(
      { phone: "+2201234567", message: "Hi", type: "" },
      fullEnv,
      deps,
    );
    expect(result.status).toBe(400);
    expect(result.body.error).toContain("type");
  });
});

// ─── WhatsApp success path ─────────────────────────────────

describe("handleNotificationRequest — WhatsApp success", () => {
  it("should return 200 with channel: whatsapp on success", async () => {
    const deps = createDeps();
    const result = await handleNotificationRequest(validBody, fullEnv, deps);

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.channel).toBe("whatsapp");
    expect(result.body.metaMessageId).toBe("wamid.test");
  });

  it("should call sendViaWhatsApp with correct params", async () => {
    const deps = createDeps();
    await handleNotificationRequest(validBody, fullEnv, deps);

    expect(deps.sendViaWhatsApp).toHaveBeenCalledWith(
      "+2201234567",
      "Hello from Tems!",
      "wa-token",
      "wa-phone-id",
    );
  });

  it("should not call sendViaSms when WhatsApp succeeds", async () => {
    const deps = createDeps();
    await handleNotificationRequest(validBody, fullEnv, deps);

    expect(deps.sendViaSms).not.toHaveBeenCalled();
  });
});

// ─── WhatsApp fail → SMS fallback ──────────────────────────

describe("handleNotificationRequest — WhatsApp fail, SMS fallback", () => {
  it("should fallback to SMS when WhatsApp fails", async () => {
    const deps = createDeps({
      sendViaWhatsApp: vi.fn().mockResolvedValue({ ok: false, error: "WA timeout" }),
    });

    const result = await handleNotificationRequest(validBody, fullEnv, deps);

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.channel).toBe("sms");
    expect(result.body.atMessageId).toBe("ATXid.test");
  });

  it("should call sendViaSms after WhatsApp failure", async () => {
    const deps = createDeps({
      sendViaWhatsApp: vi.fn().mockResolvedValue({ ok: false, error: "WA timeout" }),
    });

    await handleNotificationRequest(validBody, fullEnv, deps);

    expect(deps.sendViaSms).toHaveBeenCalledWith(
      "+2201234567",
      "Hello from Tems!",
      "at-key",
      "at-user",
    );
  });
});

// ─── Both channels fail ────────────────────────────────────

describe("handleNotificationRequest — both fail", () => {
  it("should return 500 when both channels fail", async () => {
    const deps = createDeps({
      sendViaWhatsApp: vi.fn().mockResolvedValue({ ok: false, error: "WA error" }),
      sendViaSms: vi.fn().mockResolvedValue({ ok: false, error: "SMS error" }),
    });

    const result = await handleNotificationRequest(validBody, fullEnv, deps);

    expect(result.status).toBe(500);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toContain("WA error");
    expect(result.body.error).toContain("SMS error");
  });
});

// ─── No channels configured ───────────────────────────────

describe("handleNotificationRequest — no channels", () => {
  it("should return 500 with config guidance when no channels are configured", async () => {
    const deps = createDeps();
    const emptyEnv: EnvVars = {};

    const result = await handleNotificationRequest(validBody, emptyEnv, deps);

    expect(result.status).toBe(500);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toContain("No notification channel available");
  });

  it("should not call any send functions when no channels configured", async () => {
    const deps = createDeps();
    const emptyEnv: EnvVars = {};

    await handleNotificationRequest(validBody, emptyEnv, deps);

    expect(deps.sendViaWhatsApp).not.toHaveBeenCalled();
    expect(deps.sendViaSms).not.toHaveBeenCalled();
  });
});

// ─── SMS-only (no WhatsApp configured) ─────────────────────

describe("handleNotificationRequest — SMS only", () => {
  it("should use SMS directly when WhatsApp is not configured", async () => {
    const deps = createDeps();
    const smsOnly: EnvVars = {
      AFRICA_TALKING_API_KEY: "at-key",
      AFRICA_TALKING_USERNAME: "at-user",
    };

    const result = await handleNotificationRequest(validBody, smsOnly, deps);

    expect(result.status).toBe(200);
    expect(result.body.channel).toBe("sms");
    expect(deps.sendViaWhatsApp).not.toHaveBeenCalled();
    expect(deps.sendViaSms).toHaveBeenCalled();
  });
});

// ─── Logging ───────────────────────────────────────────────

describe("handleNotificationRequest — logging", () => {
  it("should log notification on success", async () => {
    const deps = createDeps();
    await handleNotificationRequest(validBody, fullEnv, deps);

    expect(deps.logNotification).toHaveBeenCalledWith(
      deps.supabase,
      "user-123",
      "invite",
      "whatsapp",
      "Hello from Tems!",
      "wamid.test",
      undefined,
    );
  });

  it("should log notification even on failure", async () => {
    const deps = createDeps({
      sendViaWhatsApp: vi.fn().mockResolvedValue({ ok: false, error: "fail" }),
      sendViaSms: vi.fn().mockResolvedValue({ ok: false, error: "fail" }),
    });

    await handleNotificationRequest(validBody, fullEnv, deps);

    expect(deps.logNotification).toHaveBeenCalled();
  });

  it("should pass undefined userId when not provided", async () => {
    const deps = createDeps();
    const bodyNoUser = { phone: "+2201234567", message: "Hi", type: "otp" };

    await handleNotificationRequest(bodyNoUser, fullEnv, deps);

    const logCall = (deps.logNotification as any).mock.calls[0];
    expect(logCall[1]).toBeUndefined(); // userId argument
  });
});
