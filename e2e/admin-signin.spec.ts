import { test, expect, type Page } from "@playwright/test";

// ─── Constants ─────────────────────────────────────────────

const ADMIN_ID = "00000000-0000-0000-0000-000000000001";

const MOCK_ADMIN_PROFILE = {
  id: ADMIN_ID,
  phone: "+2200000000",
  full_name: "Admin User",
  email: "admin@temsmarket.gm",
  date_of_birth: null,
  age_verified: false,
  role: "admin" as const,
  status: "active" as const,
  commission_payout_preference: "credits" as const,
  invited_by: null,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-06-01T00:00:00.000Z",
};

const MOCK_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MTczNTY4MDAwMCwiZW1haWwiOiJhZG1pbkB0ZW1zbWFya2V0LmdtIn0.signature";

const MOCK_SESSION = {
  access_token: MOCK_ACCESS_TOKEN,
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 7200,
  refresh_token: "mock-refresh-token",
  user: {
    id: ADMIN_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "admin@temsmarket.gm",
    email_confirmed_at: "2025-01-01T00:00:00.000Z",
    phone: "",
    last_sign_in_at: "2025-06-01T00:00:00.000Z",
    app_metadata: { provider: "email" },
    user_metadata: {},
    created_at: "2025-01-01T00:00:00.000Z",
  },
};

const SUPABASE_STORAGE_KEY = "sb-vawcbbnnjhuitqxabygs-auth-token";

// ─── Route interception helpers ────────────────────────────

async function mockAuthToken(page: Page, status: number, body: object) {
  await page.route("**/auth/v1/token*", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
}

async function mockAuthUser(page: Page) {
  await page.route("**/auth/v1/user*", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }
    // Return the mock user so Supabase validates the session from localStorage
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SESSION.user),
    });
  });
}

async function mockProfileFetch(page: Page, profile: object | null) {
  const data = profile ? [profile] : [];
  await page.route("**/rest/v1/users*", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
  });
}

async function mockCheckEmailExists(page: Page, exists: boolean) {
  await page.route("**/functions/v1/check-email-exists", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ exists }) });
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "apikey, authorization, x-client-info, content-type, accept",
  };
}

// ─── Tests ─────────────────────────────────────────────────

test.describe("Admin email sign-in flow", () => {
  test.beforeEach(async ({ page }) => {
    // Catch all Supabase network calls with OPTIONS preflight handling
    await mockAuthUser(page);
  });

  test("renders the admin login page with all expected elements", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Logo / branding
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
    await expect(page.getByText("Tems Market")).toBeVisible();

    // "Admin Portal" badge
    const badge = page.getByText("Admin Portal");
    await expect(badge).toBeVisible();

    // Heading
    await expect(page.getByRole("heading", { name: "Admin Sign In" })).toBeVisible();

    // Subtitle
    await expect(page.getByText("Sign in with your admin email and password")).toBeVisible();

    // Form fields
    const emailInput = page.locator("#admin-email");
    const passwordInput = page.locator("#admin-password");
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(emailInput).toHaveAttribute("autocomplete", "email");
    await expect(passwordInput).toHaveAttribute("autocomplete", "current-password");

    // Forgot password link
    const forgotLink = page.getByText("Forgot password?");
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toHaveAttribute("href", "/forgot-password");

    // Submit button
    const submitBtn = page.getByRole("button", { name: "Sign In" });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();

    // Footer links
    const customerLink = page.getByText("Customer sign in");
    await expect(customerLink).toBeVisible();
    await expect(customerLink).toHaveAttribute("href", "/login");

    const backLink = page.getByText("Back to home");
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/");
  });

  test("shows 'No account found' error for unknown email", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    await mockAuthToken(page, 400, {
      error: "invalid_grant",
      error_description: "Invalid login credentials",
      error_code: "invalid_credentials",
    });
    await mockCheckEmailExists(page, false);

    await page.fill("#admin-email", "unknown@example.com");
    await page.fill("#admin-password", "somepass123");
    await page.click('button[type="submit"]');

    await expect(page.getByText("No account found with this email")).toBeVisible({ timeout: 10000 });
  });

  test("shows 'Incorrect password' error when email exists but password is wrong", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    await mockAuthToken(page, 400, {
      error: "invalid_grant",
      error_description: "Invalid login credentials",
      error_code: "invalid_credentials",
    });
    await mockCheckEmailExists(page, true);

    await page.fill("#admin-email", "admin@temsmarket.gm");
    await page.fill("#admin-password", "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.getByText("Incorrect password")).toBeVisible({ timeout: 10000 });
  });

  test("shows connection error on timeout / network failure", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    await mockAuthToken(page, 400, {
      error: "timeout",
      error_description: "Request timeout",
    });

    await page.fill("#admin-email", "admin@temsmarket.gm");
    await page.fill("#admin-password", "somepass");
    await page.click('button[type="submit"]');

    await expect(page.getByText("Connection issue")).toBeVisible({ timeout: 10000 });
  });

  test("redirects to /admin/dashboard on successful sign-in", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    await mockAuthToken(page, 200, MOCK_SESSION);
    await mockProfileFetch(page, MOCK_ADMIN_PROFILE);

    await page.fill("#admin-email", "admin@temsmarket.gm");
    await page.fill("#admin-password", "correctpassword");
    await page.click('button[type="submit"]');

    // Wait for redirect to the admin dashboard
    await page.waitForURL("**/admin/dashboard", { timeout: 15000 });

    // Verify the dashboard loaded — look for the heading
    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible({ timeout: 10000 });
  });

  test("already-logged-in admin is redirected to /admin/dashboard", async ({ page }) => {
    // Inject an existing Supabase session into localStorage before navigation
    await page.addInitScript(
      ({ key, session }: { key: string; session: object }) => {
        localStorage.setItem(key, JSON.stringify(session));
      },
      { key: SUPABASE_STORAGE_KEY, session: MOCK_SESSION },
    );

    // Mock the profile fetch needed when the AuthContext initializes
    await mockProfileFetch(page, MOCK_ADMIN_PROFILE);

    await page.goto("/admin");

    // Should land on the dashboard, not the login page
    await page.waitForURL("**/admin/dashboard", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible({ timeout: 10000 });
  });

  test("clears error message when user types after an error", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Trigger an error first
    await mockAuthToken(page, 400, {
      error: "invalid_grant",
      error_description: "Invalid login credentials",
      error_code: "invalid_credentials",
    });
    await mockCheckEmailExists(page, false);

    await page.fill("#admin-email", "unknown@example.com");
    await page.fill("#admin-password", "pass");
    await page.click('button[type="submit"]');

    // Error should be visible
    await expect(page.getByText("No account found with this email")).toBeVisible({ timeout: 10000 });

    // Type in the email field — error should clear
    await page.fill("#admin-email", "admin@temsmarket.gm");

    // Error message should disappear as React clears it on input change
    await expect(page.getByText("No account found with this email")).not.toBeVisible({ timeout: 3000 });
  });

  test("forgot password link navigates to /forgot-password", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    await page.getByText("Forgot password?").click();
    await page.waitForURL("**/forgot-password", { timeout: 10000 });

    await expect(page.getByRole("heading", { name: /forgot/i })).toBeVisible({ timeout: 5000 });
  });
});
