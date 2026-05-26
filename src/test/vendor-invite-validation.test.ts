import { describe, it, expect } from "vitest";
import { validatePasswordForm } from "../lib/validatePasswordForm";

describe("validatePasswordForm", () => {
  it("should reject empty password", () => {
    const result = validatePasswordForm("", "");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least 6 characters");
  });

  it("should reject password shorter than 6 characters", () => {
    const result = validatePasswordForm("abc", "abc");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least 6 characters");
  });

  it("should reject exactly 5 characters", () => {
    const result = validatePasswordForm("12345", "12345");
    expect(result.valid).toBe(false);
  });

  it("should reject mismatched passwords", () => {
    const result = validatePasswordForm("password123", "password456");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("do not match");
  });

  it("should accept valid matching passwords ≥ 6 chars", () => {
    const result = validatePasswordForm("secure123", "secure123");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should accept exactly 6 characters", () => {
    const result = validatePasswordForm("123456", "123456");
    expect(result.valid).toBe(true);
  });

  it("should check length before match", () => {
    // Short + mismatch: error should be about length, not match
    const result = validatePasswordForm("abc", "xyz");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("at least 6 characters");
  });
});
