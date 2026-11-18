import { test, expect } from "@playwright/test";
import { mockSupabase } from "./supabase-mock";

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
});

test("ipinapaliwanag ang chord na tina-type", async ({ page }) => {
  await page.goto("/matuto");
  await page.getByLabel("Type a chord").fill("F#m7");
  await page.getByRole("button", { name: "Explain" }).click();
  await expect(page.getByText("F# Minor 7")).toBeVisible();
  await expect(page.getByText("F# – A – C# – E")).toBeVisible();
});

test("aralin sa gitara: nagpapalit ng chord", async ({ page }) => {
  await page.goto("/matuto/gitara");
  await expect(page.getByRole("heading", { name: "Your first 8 chords" })).toBeVisible();
  await page.getByRole("radio", { name: "3. C" }).click();
  await expect(page.getByRole("img", { name: /^C:/ })).toBeVisible();
});

test("hindi kilalang aralin: bumabalik sa Basics", async ({ page }) => {
  await page.goto("/matuto/kazoo");
  await expect(page).toHaveURL(/\/matuto$/);
});
