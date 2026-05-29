import { test, expect, type Page } from "@playwright/test";

// ─── Constants ─────────────────────────────────────────────

const VENDOR_ID = "00000000-0000-0000-0000-000000000002";
const INVITE_TOKEN = "test-invite-token-abc123";

const MOCK_VENDOR_PROFILE = {
  id: VENDOR_ID,
  phone: "+2203000000",
  full_name: "Vendor Test",
  email: "vendor@example.com",
  date_of_birth: "1990-01-01",
  age_verified: true,
  role: "vendor" as const,
  status: "active" as const,
  commission_payout_preference: "credits" as const,
  invited_by: "00000000-0000-0000-0000-000000000001",
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-06-01T00:00:00.000Z",
};

const MOCK_APPLICATION = {
  id: "app-001",
  business_name: "Test Business",
  business_category: "fashion",
  phone: "+2203000000",
  email: "vendor@example.com",
  status: "approved",
  invite_token: INVITE_TOKEN,
  invite_expires_at: "2099-12-31T23:59:59.000Z",
  extra_data: {
    email: "vendor@example.com",
    business_name: "Test Business",
    full_name: "Vendor Test",
    phone: "+2203000000",
  },
};

const MOCK_SESSION = {
  access_token: "mock-vendor-access-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 7200,
  refresh_token: "mock-refresh-token",
  user: {
    id: VENDOR_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "vendor@example.com",
    email_confirmed_at: "2025-01-01T00:00:00.000Z",
    phone: "+2203000000",
    last_sign_in_at: "2025-06-01T00:00:00.000Z",
    app_metadata: { provider: "phone" },
    user_metadata: { role: "vendor" },
    created_at: "2025-01-01T00:00:00.000Z",
  },
};

const SUPABASE_STORAGE_KEY = "sb-vawcbbnnjhuitqxabygs-auth-token";

// ─── Route interception helpers ────────────────────────────

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "apikey, authorization, x-client-info, content-type, accept",
  };
}

async function mockVendorApplicationFetch(page: Page, application: object) {
  const data = [application];
  await page.route("**/rest/v1/vendor_applications*", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
  });
}

async function mockInviteCompletion(page: Page, status: number, body: object) {
  await page.route("**/functions/v1/complete-vendor-invite", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
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

async function mockAuthUser(page: Page) {
  await page.route("**/auth/v1/user*", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders() });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SESSION.user),
    });
  });
}

// ─── Tests ─────────────────────────────────────────────────

test.describe("Vendor invite flow", () => {
  test("renders the vendor invite page with application details", async ({ page }) => {
    await mockVendorApplicationFetch(page, MOCK_APPLICATION);

    await page.goto(`/vendor-invite/${INVITE_TOKEN}`);
    await page.waitForLoadState("networkidle");

    // Should show the business name
    await expect(page.getByText("Test Business")).toBeVisible();
    // Should show the invite heading
    await expect(page.getByRole("heading", { name: /complete.*account|set.*up|invitation/i })).toBeVisible();
    // Should have email field pre-filled from application
    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveValue("vendor@example.com");
    // Should have password fields
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#confirmPassword")).toBeVisible();
  });

  test("shows validation errors for empty required fields", async ({ page }) => {
    await mockVendorApplicationFetch(page, MOCK_APPLICATION);

    await page.goto(`/vendor-invite/${INVITE_TOKEN}`);
    await page.waitForLoadState("networkidle");

    // Clear the pre-filled email
    await page.locator("#email").fill("");
    // Submit without filling required fields
    await page.click('button[type="submit"]');

    // Should show validation error for email
    await expect(page.getByText(/email|required/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("shows error when passwords do not match", async ({ page }) => {
    await mockVendorApplicationFetch(page, MOCK_APPLICATION);

    await page.goto(`/vendor-invite/${INVITE_TOKEN}`);
    await page.waitForLoadState("networkidle");

    await page.locator("#password").fill("StrongPass1!");
    await page.locator("#confirmPassword").fill("DifferentPass1!");
    await page.click('button[type="submit"]');

    // Should show password mismatch error
    await expect(page.getByText(/match|not.*same|don.*t.*match/i)).toBeVisible({ timeout: 5000 });
  });

  test("successfully completes invite and redirects to vendor dashboard", async ({ page }) => {
    await mockVendorApplicationFetch(page, MOCK_APPLICATION);
    await mockInviteCompletion(page, 200, { user: MOCK_SESSION.user, session: MOCK_SESSION });
    await mockProfileFetch(page, MOCK_VENDOR_PROFILE);
    await mockAuthUser(page);

    await page.goto(`/vendor-invite/${INVITE_TOKEN}`);
    await page.waitForLoadState("networkidle");

    // Fill in the form
    await page.locator("#password").fill("StrongPass1!");
    await page.locator("#confirmPassword").fill("StrongPass1!");

    // Click submit
    await page.click('button[type="submit"]');

    // Should redirect to vendor dashboard
    await page.waitForURL("**/vendor/dashboard", { timeout: 15000 });
    await expect(page.getByRole("heading", { name: /vendor.*dashboard|dashboard/i })).toBeVisible({ timeout: 10000 });
  });

  test("shows not found page for invalid invite token", async ({ page }) => {
    // Return empty array for unknown token
    await mockVendorApplicationFetch(page, {});

    await page.goto("/vendor-invite/invalid-token");
    await page.waitForLoadState("networkidle");

    // Should show an error or "not found" message
    await expect(page.getByText(/expired|invalid|not found|no longer/i).first()).toBeVisible({ timeout: 5000 });
  });

  test("email field has autocomplete attribute", async ({ page }) => {
    await mockVendorApplicationFetch(page, MOCK_APPLICATION);

    await page.goto(`/vendor-invite/${INVITE_TOKEN}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#email")).toHaveAttribute("autocomplete", "email");
    await expect(page.locator("#password")).toHaveAttribute("autocomplete", "new-password");
    await expect(page.locator("#confirmPassword")).toHaveAttribute("autocomplete", "new-password");
  });
});
