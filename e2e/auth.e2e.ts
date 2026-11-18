import { test, expect } from "@playwright/test";
import { mockSupabase } from "./supabase-mock";

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
});

test("maling password: malinaw na mensahe", async ({ page }) => {
  await page.goto("/ako");
  await page.getByLabel("Email").fill("emil@example.com");
  await page.getByLabel("Password").fill("maling-password");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Wrong email or password.");
});

test("pag-sign up: sinasabihang tingnan ang email", async ({ page }) => {
  await page.goto("/ako");
  await page.getByRole("button", { name: /No account yet/ }).click();
  await page.getByLabel("Email").fill("bago@example.com");
  await page.getByLabel("Password").fill("bagong-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  await expect(page.getByRole("button", { name: "Send again" })).toBeVisible();
});

test("nakalimutan ang password: nagpapadala ng link", async ({ page }) => {
  await page.goto("/ako");
  await page.getByRole("button", { name: /Forgot password/ }).click();
  await page.getByLabel("Email").fill("emil@example.com");
  await page.getByRole("button", { name: "Send the link" }).click();
  await expect(page.getByRole("status")).toContainText("new password");
});
