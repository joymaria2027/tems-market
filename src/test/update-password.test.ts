import { describe, it, expect } from "vitest";
import {
  validatePasswordChange,
  validateAuthHeader,
} from "../../supabase/functions/update-password/helpers";

// ─── validatePasswordChange ────────────────────────────────

describe("validatePasswordChange", () => {
  it("should reject missing currentPassword", () => {
    const result = validatePasswordChange(undefined, "newpass123");
    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toContain("required");
  });

  it("should reject missing newPassword", () => {
    const result = validatePasswordChange("oldpass", undefined);
    expect(result.valid).toBe(false);
    expect(result.status).toBe(400);
  });

  it("should reject empty string currentPassword", () => {
    const result = validatePasswordChange("", "newpass123");
    expect(result.valid).toBe(false);
  });

  it("should reject empty string newPassword", () => {
    const result = validatePasswordChange("oldpass", "");
    expect(result.valid).toBe(false);
  });

  it("should reject newPassword shorter than 8 characters", () => {
    const result = validatePasswordChange("oldpass", "abc1234");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("8 characters");
  });

  it("should accept newPassword with exactly 8 characters", () => {
    const result = validatePasswordChange("oldpass", "12345678");
    expect(result.valid).toBe(true);
  });

  it("should accept valid inputs", () => {
    const result = validatePasswordChange("current-pass", "new-secure-password");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should reject non-string newPassword", () => {
    const result = validatePasswordChange("oldpass", 12345678);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("8 characters");
  });
});

// ─── validateAuthHeader ────────────────────────────────────

describe("validateAuthHeader", () => {
  it("should reject null header", () => {
    const result = validateAuthHeader(null);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.status).toBe(401);
      expect(result.error).toContain("authorization");
    }
  });

  it("should reject empty string", () => {
    const result = validateAuthHeader("");
    expect(result.valid).toBe(false);
  });

  it("should reject header without Bearer prefix", () => {
    const result = validateAuthHeader("Basic abc123");
    expect(result.valid).toBe(false);
  });

  it("should extract token from valid Bearer header", () => {
    const result = validateAuthHeader("Bearer my-jwt-token-123");
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.token).toBe("my-jwt-token-123");
    }
  });

  it("should handle Bearer with long JWT token", () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    const result = validateAuthHeader(`Bearer ${jwt}`);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.token).toBe(jwt);
    }
  });
});
