import { describe, it, expect } from "vitest";
import {
  validateToken,
  validatePassword,
  validateApplicationStatus,
  buildUserMetadata,
  type VendorApplication,
} from "../../supabase/functions/complete-vendor-invite/helpers";

// ─── validateToken ─────────────────────────────────────────

describe("validateToken", () => {
  it("should reject empty string", () => {
    expect(validateToken("")).toEqual({
      valid: false,
      error: "Invite token is required",
      status: 400,
    });
  });

  it("should reject null", () => {
    expect(validateToken(null)).toEqual({
      valid: false,
      error: "Invite token is required",
      status: 400,
    });
  });

  it("should reject undefined", () => {
    expect(validateToken(undefined)).toEqual({
      valid: false,
      error: "Invite token is required",
      status: 400,
    });
  });

  it("should reject non-string types", () => {
    expect(validateToken(12345)).toEqual({
      valid: false,
      error: "Invite token is required",
      status: 400,
    });
  });

  it("should accept a valid token string", () => {
    expect(validateToken("abc-123-invite-token")).toEqual({ valid: true });
  });
});

// ─── validatePassword ──────────────────────────────────────

describe("validatePassword", () => {
  it("should reject empty string", () => {
    const result = validatePassword("");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("6 characters");
  });

  it("should reject passwords shorter than 6 characters", () => {
    const result = validatePassword("abc");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("6 characters");
  });

  it("should reject exactly 5 characters", () => {
    const result = validatePassword("12345");
    expect(result.valid).toBe(false);
  });

  it("should accept exactly 6 characters", () => {
    expect(validatePassword("123456").valid).toBe(true);
  });

  it("should accept long passwords", () => {
    expect(validatePassword("a-very-long-secure-password").valid).toBe(true);
  });

  it("should reject null", () => {
    expect(validatePassword(null).valid).toBe(false);
  });

  it("should reject non-string types", () => {
    expect(validatePassword(123456).valid).toBe(false);
  });
});

// ─── validateApplicationStatus ─────────────────────────────

describe("validateApplicationStatus", () => {
  const baseApp: VendorApplication = {
    id: "app-1",
    business_name: "Test Shop",
    category: "fashion",
    phone: "+2201234567",
    status: "approved",
    extra_data: null,
    invite_token: "token-abc",
    invite_expires_at: null,
  };

  it("should reject null application", () => {
    const result = validateApplicationStatus(null);
    expect(result.valid).toBe(false);
    expect(result.status).toBe(404);
  });

  it("should reject completed application", () => {
    const result = validateApplicationStatus({ ...baseApp, status: "completed" });
    expect(result.valid).toBe(false);
    expect(result.status).toBe(409);
    expect(result.error).toContain("already been used");
  });

  it("should reject non-approved statuses", () => {
    expect(validateApplicationStatus({ ...baseApp, status: "pending" }).valid).toBe(false);
    expect(validateApplicationStatus({ ...baseApp, status: "rejected" }).valid).toBe(false);
  });

  it("should reject expired invite", () => {
    const expiredApp = {
      ...baseApp,
      invite_expires_at: "2020-01-01T00:00:00Z",
    };
    const result = validateApplicationStatus(expiredApp);
    expect(result.valid).toBe(false);
    expect(result.status).toBe(410);
    expect(result.error).toContain("expired");
  });

  it("should accept valid approved application without expiry", () => {
    expect(validateApplicationStatus(baseApp).valid).toBe(true);
  });

  it("should accept approved application with future expiry", () => {
    const futureApp = {
      ...baseApp,
      invite_expires_at: "2099-12-31T23:59:59Z",
    };
    expect(validateApplicationStatus(futureApp).valid).toBe(true);
  });
});

// ─── buildUserMetadata ─────────────────────────────────────

describe("buildUserMetadata", () => {
  const baseApp: VendorApplication = {
    id: "app-1",
    business_name: "Gambia Goods",
    category: "general",
    phone: "2201234567",
    status: "approved",
    extra_data: null,
    invite_token: "tok-1",
    invite_expires_at: null,
  };

  it("should prepend + to phone if missing", () => {
    const result = buildUserMetadata(baseApp);
    expect(result.phone).toBe("+2201234567");
  });

  it("should preserve + prefix if already present", () => {
    const app = { ...baseApp, phone: "+2201234567" };
    expect(buildUserMetadata(app).phone).toBe("+2201234567");
  });

  it("should use fullName from extra_data when available", () => {
    const app = {
      ...baseApp,
      extra_data: { fullName: "Awa Jallow" },
    };
    const result = buildUserMetadata(app);
    expect(result.fullName).toBe("Awa Jallow");
    expect(result.metadata.full_name).toBe("Awa Jallow");
  });

  it("should fall back to business_name when no fullName in extra_data", () => {
    const result = buildUserMetadata(baseApp);
    expect(result.fullName).toBe("Gambia Goods");
  });

  it("should extract email from extra_data", () => {
    const app = {
      ...baseApp,
      extra_data: { email: "awa@example.com" },
    };
    expect(buildUserMetadata(app).email).toBe("awa@example.com");
  });

  it("should return null email when not in extra_data", () => {
    expect(buildUserMetadata(baseApp).email).toBeNull();
  });

  it("should prefer providedEmail over extra_data email", () => {
    const app = {
      ...baseApp,
      extra_data: { email: "old@example.com" },
    };
    const result = buildUserMetadata(app, "new@example.com");
    expect(result.email).toBe("new@example.com");
  });

  it("should ignore empty providedEmail and use extra_data", () => {
    const app = {
      ...baseApp,
      extra_data: { email: "saved@example.com" },
    };
    expect(buildUserMetadata(app, "").email).toBe("saved@example.com");
    expect(buildUserMetadata(app, "  ").email).toBe("saved@example.com");
  });

  it("should use providedEmail even when extra_data has no email", () => {
    const result = buildUserMetadata(baseApp, "vendor@example.com");
    expect(result.email).toBe("vendor@example.com");
  });

  it("should handle null extra_data", () => {
    const result = buildUserMetadata(baseApp);
    expect(result.fullName).toBe("Gambia Goods");
    expect(result.email).toBeNull();
  });

  it("should always set metadata.role to vendor", () => {
    expect(buildUserMetadata(baseApp).metadata.role).toBe("vendor");
  });

  it("should use raw phone in metadata (not normalized)", () => {
    const result = buildUserMetadata(baseApp);
    expect(result.metadata.phone).toBe("2201234567");
  });
});
