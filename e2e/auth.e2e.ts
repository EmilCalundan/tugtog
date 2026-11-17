import { test, expect } from "@playwright/test";
import { mockSupabase } from "./supabase-mock";

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
});

test("maling password: Tagalog na mensahe", async ({ page }) => {
  await page.goto("/ako");
  await page.getByLabel("Email").fill("emil@example.com");
  await page.getByLabel("Password").fill("maling-password");
  await page.getByRole("button", { name: "Mag-login", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText("Mali ang email o password.");
});

test("pag-sign up: sinasabihang tingnan ang email", async ({ page }) => {
  await page.goto("/ako");
  await page.getByRole("button", { name: /Wala pang account/ }).click();
  await page.getByLabel("Email").fill("bago@example.com");
  await page.getByLabel("Password").fill("bagong-password");
  await page.getByRole("button", { name: "Gumawa ng account" }).click();
  await expect(page.getByRole("status")).toContainText("Tingnan ang email mo");
  await expect(page.getByRole("button", { name: "Ipadala ulit" })).toBeVisible();
});

test("nakalimutan ang password: nagpapadala ng link", async ({ page }) => {
  await page.goto("/ako");
  await page.getByRole("button", { name: /Nakalimutan/ }).click();
  await page.getByLabel("Email").fill("emil@example.com");
  await page.getByRole("button", { name: "Ipadala ang link" }).click();
  await expect(page.getByRole("status")).toContainText("bagong password");
});
