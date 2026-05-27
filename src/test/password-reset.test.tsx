import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

// ─── Mock supabase client ──────────────────────────────────
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signOut: vi.fn(),
      setSession: vi.fn(),
      resetPasswordForEmail: (...args: any[]) => mockResetPasswordForEmail(...args),
      updateUser: (...args: any[]) => mockUpdateUser(...args),
    },
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
    rpc: vi.fn(),
  },
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("resetPasswordEmail — forgot password flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call resetPasswordForEmail with correct email and redirectTo", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    let resetError: Error | null = null;
    await act(async () => {
      const res = await result.current.resetPasswordEmail("admin@test.com");
      resetError = res.error;
    });

    expect(resetError).toBeNull();
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("admin@test.com", {
      redirectTo: expect.stringContaining("/update-password"),
    });
  });

  it("should return error when resetPasswordForEmail fails", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { message: "Email not found" },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    let resetError: Error | null = null;
    await act(async () => {
      const res = await result.current.resetPasswordEmail("nonexistent@test.com");
      resetError = res.error;
    });

    expect(resetError).not.toBeNull();
    expect(resetError!.message).toBe("Email not found");
  });

  it("should handle rate limiting from resetPasswordForEmail", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { message: "rate_limit exceeded" },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    let resetError: Error | null = null;
    await act(async () => {
      const res = await result.current.resetPasswordEmail("admin@test.com");
      resetError = res.error;
    });

    expect(resetError!.message).toContain("rate_limit");
  });
});

describe("updateUserPassword — set new password after recovery link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call updateUser with the new password", async () => {
    mockUpdateUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    let updateError: Error | null = null;
    await act(async () => {
      const res = await result.current.updateUserPassword("NewSecurePass123!");
      updateError = res.error;
    });

    expect(updateError).toBeNull();
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "NewSecurePass123!" });
  });

  it("should reject weak passwords (delegated to Supabase)", async () => {
    mockUpdateUser.mockResolvedValue({
      data: {},
      error: { message: "Password should be at least 6 characters" },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    let updateError: Error | null = null;
    await act(async () => {
      const res = await result.current.updateUserPassword("123");
      updateError = res.error;
    });

    expect(updateError!.message).toContain("6 characters");
  });

  it("should handle session expiry gracefully", async () => {
    mockUpdateUser.mockResolvedValue({
      data: {},
      error: { message: "Auth session missing" },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    let updateError: Error | null = null;
    await act(async () => {
      const res = await result.current.updateUserPassword("NewPass123!");
      updateError = res.error;
    });

    expect(updateError!.message).toContain("Auth session missing");
  });
});
