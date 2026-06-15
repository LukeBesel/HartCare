import { test, expect } from "@playwright/test";

test("app renders home and dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toContainText("HartCare");

  await page.goto("/dashboard");
  await expect(page.locator("body")).toBeVisible();
});
