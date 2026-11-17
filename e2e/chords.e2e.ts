import { test, expect } from "@playwright/test";
import { mockSupabase } from "./supabase-mock";

// Hindi naka-login: ang "Subukan" page, na nasa browser lang ang kanta

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await page.addInitScript(() => {
    localStorage.setItem("tugtog-from", "G");
    localStorage.setItem("tugtog-chords", "[Verse]\nG             D/F#\nSa liwanag Mo, ako'y lalakad");
  });
});

test("itinataas ang key at nagbabago ang chords, pero hindi ang lyrics", async ({ page }) => {
  await page.goto("/subukan");
  const sheet = page.locator("article");
  await expect(sheet).toContainText("D/F#");

  await page.getByRole("button", { name: "Itaas ang key" }).click();
  await page.getByRole("button", { name: "Itaas ang key" }).click();

  await expect(page.getByRole("group", { name: "Key" })).toContainText("A");
  await expect(sheet).toContainText("E/G#");
  await expect(sheet).toContainText("Sa liwanag Mo, ako'y lalakad");
  await expect(page.getByRole("button", { name: "Ibalik sa G" })).toBeVisible();
});

test("nagmumungkahi ng capo para sa mahirap na key", async ({ page }) => {
  await page.goto("/subukan");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Itaas ang key" }).click(); // G → Bb
  await expect(page.getByRole("button", { name: "Capo 1 · A" })).toBeVisible();
});

test("ipinapakita ang hugis ng chord sa Gitara tab", async ({ page }) => {
  await page.goto("/subukan");
  await page.getByRole("button", { name: "Gitara", exact: true }).click();
  await expect(page.getByRole("img", { name: /^G:/ })).toBeVisible();
  await page.getByRole("button", { name: /D\/F#/ }).click();
  await expect(page.getByRole("img", { name: /^D\/F#:/ })).toBeVisible();
});
