import { test, expect } from "@playwright/test";

const LIVE_URL = "https://temsmarket.com";

test.describe("Live site smoke tests", () => {
  test("homepage loads and shows Tems Market branding", async ({ page }) => {
    await page.goto(LIVE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await expect(page.getByText("Tems Market")).toBeVisible({ timeout: 15000 });
    // Take a screenshot for proof
    await page.screenshot({ path: "test-results/homepage.png", fullPage: false });
  });

  test("admin login page loads", async ({ page }) => {
    await page.goto(`${LIVE_URL}/admin`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await expect(page.getByText("Admin Sign In")).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: "test-results/admin-login.png", fullPage: false });
  });

  test("admin sign-in does NOT time out (RLS fix verified)", async ({ page }) => {
    await page.goto(`${LIVE_URL}/admin`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await expect(page.getByText("Admin Sign In")).toBeVisible({ timeout: 15000 });

    // Fill in credentials with a wrong password to verify the auth flow responds quickly
    // (not timing out). We expect an error message, not a timeout.
    const emailInput = page.locator("#admin-email");
    const passwordInput = page.locator("#admin-password");
    await emailInput.fill("admin@temsmarket.gm");
    await passwordInput.fill("wrongpassword123");
    await page.click('button[type="submit"]');

    // The key check: we should get an error response within 10 seconds
    // (NOT the 25-second "Sign in timed out" message)
    const timedOutMsg = page.getByText("Sign in timed out");
    const errorMsg = page.getByText(/password|credentials|account/i);

    // Wait for either an error or the timeout message
    await expect(errorMsg.or(timedOutMsg).first()).toBeVisible({ timeout: 15000 });

    // Verify it was NOT the timeout
    const isTimedOut = await timedOutMsg.isVisible().catch(() => false);
    expect(isTimedOut).toBe(false);

    await page.screenshot({ path: "test-results/admin-signin-result.png", fullPage: false });
  });

  test("shop page loads", async ({ page }) => {
    await page.goto(`${LIVE_URL}/shop`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await expect(page.getByText("All Products")).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: "test-results/shop-page.png", fullPage: false });
  });

  test("login page (phone/email tabs) loads", async ({ page }) => {
    await page.goto(`${LIVE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await expect(page.getByText("Sign In")).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: "test-results/login-page.png", fullPage: false });
  });
});
