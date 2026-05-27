import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

// ─── Mock supabase client ──────────────────────────────────
const mockSignInWithPassword = vi.fn();
const mockInvoke = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signOut: vi.fn(),
      setSession: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
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

// ─── Wrapper ───────────────────────────────────────────────
function Wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("signInWithEmail — error differentiation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null error on successful sign-in", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "admin-1" }, session: {} },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });

    // Wait for initial mount (getSession resolves) to settle
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    let signInError: Error | null = null;
    await act(async () => {
      const res = await result.current.signInWithEmail("admin@test.com", "correct-password");
      signInError = res.error;
    });

    expect(signInError).toBeNull();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "admin@test.com",
      password: "correct-password",
    });
  });

  it("should show 'connection issue' for timeout errors", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Request timeout" },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    let signInError: Error | null = null;
    await act(async () => {
      const res = await result.current.signInWithEmail("admin@test.com", "pass");
      signInError = res.error;
    });

    expect(signInError!.message).toContain("Connection issue");
  });

  it("should show 'no account found' when email does not exist", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });
    mockInvoke.mockResolvedValue({
      data: { exists: false },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    let signInError: Error | null = null;
    await act(async () => {
      const res = await result.current.signInWithEmail("unknown@test.com", "pass");
      signInError = res.error;
    });

    expect(signInError!.message).toContain("No account found");
    expect(mockInvoke).toHaveBeenCalledWith("check-email-exists", {
      body: { email: "unknown@test.com" },
    });
  });

  it("should show 'incorrect password' when email exists but password is wrong", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });
    mockInvoke.mockResolvedValue({
      data: { exists: true },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    let signInError: Error | null = null;
    await act(async () => {
      const res = await result.current.signInWithEmail("admin@test.com", "wrong-password");
      signInError = res.error;
    });

    expect(signInError!.message).toContain("Incorrect password");
  });

  it("should show generic error when existence check fails", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });
    mockInvoke.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    let signInError: Error | null = null;
    await act(async () => {
      const res = await result.current.signInWithEmail("admin@test.com", "pass");
      signInError = res.error;
    });

    expect(signInError!.message).toContain("Invalid email or password");
  });

  it("should show rate limit error when too many attempts", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "rate_limit exceeded" },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: Wrapper });
    await vi.waitFor(() => expect(result.current.loading).toBe(false));

    let signInError: Error | null = null;
    await act(async () => {
      const res = await result.current.signInWithEmail("admin@test.com", "pass");
      signInError = res.error;
    });

    expect(signInError!.message).toContain("Too many sign-in attempts");
  });
});
