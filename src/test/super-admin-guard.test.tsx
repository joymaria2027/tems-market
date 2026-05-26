import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the useAuth hook ──────────────────────────────────
const mockUseAuth = vi.fn();
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

// ─── Mock react-router-dom Navigate ─────────────────────────
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Navigate: (props: any) => {
      mockNavigate(props);
      return null;
    },
  };
});

import { render, screen } from "@testing-library/react";
import SuperAdminGuard from "../components/SuperAdminGuard";
import { BrowserRouter } from "react-router-dom";

describe("SuperAdminGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading spinner when auth is loading", () => {
    mockUseAuth.mockReturnValue({ profile: null, loading: true });

    const { container } = render(
      <BrowserRouter>
        <SuperAdminGuard>
          <div data-testid="protected">Protected Content</div>
        </SuperAdminGuard>
      </BrowserRouter>
    );

    expect(screen.queryByTestId("protected")).toBeNull();
    // Should render the Loader2 spinner
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).not.toBeNull();
  });

  it("should redirect when profile is null (not logged in)", () => {
    mockUseAuth.mockReturnValue({ profile: null, loading: false });

    render(
      <BrowserRouter>
        <SuperAdminGuard>
          <div data-testid="protected">Protected Content</div>
        </SuperAdminGuard>
      </BrowserRouter>
    );

    expect(screen.queryByTestId("protected")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/", replace: true })
    );
  });

  it("should redirect when user role is vendor (not superadmin)", () => {
    mockUseAuth.mockReturnValue({
      profile: { id: "user-1", role: "vendor" },
      loading: false,
    });

    render(
      <BrowserRouter>
        <SuperAdminGuard>
          <div data-testid="protected">Protected Content</div>
        </SuperAdminGuard>
      </BrowserRouter>
    );

    expect(screen.queryByTestId("protected")).toBeNull();
    expect(mockNavigate).toHaveBeenCalled();
  });

  it("should redirect when user role is admin (not superadmin)", () => {
    mockUseAuth.mockReturnValue({
      profile: { id: "user-2", role: "admin" },
      loading: false,
    });

    render(
      <BrowserRouter>
        <SuperAdminGuard>
          <div data-testid="protected">Protected Content</div>
        </SuperAdminGuard>
      </BrowserRouter>
    );

    expect(screen.queryByTestId("protected")).toBeNull();
    expect(mockNavigate).toHaveBeenCalled();
  });

  it("should render children when user is superadmin", () => {
    mockUseAuth.mockReturnValue({
      profile: { id: "user-3", role: "superadmin" },
      loading: false,
    });

    render(
      <BrowserRouter>
        <SuperAdminGuard>
          <div data-testid="protected">Protected Content</div>
        </SuperAdminGuard>
      </BrowserRouter>
    );

    expect(screen.getByTestId("protected")).toBeTruthy();
    expect(screen.getByText("Protected Content")).toBeTruthy();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should redirect when user role is customer", () => {
    mockUseAuth.mockReturnValue({
      profile: { id: "user-4", role: "customer" },
      loading: false,
    });

    render(
      <BrowserRouter>
        <SuperAdminGuard>
          <div data-testid="protected">Protected Content</div>
        </SuperAdminGuard>
      </BrowserRouter>
    );

    expect(screen.queryByTestId("protected")).toBeNull();
    expect(mockNavigate).toHaveBeenCalled();
  });
});
