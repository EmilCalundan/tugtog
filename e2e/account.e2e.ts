import { test, expect } from "@playwright/test";
import { login, mockSupabase } from "./supabase-mock";

test("pagbura ng account: kailangang i-type ang BURAHIN", async ({ page }) => {
  await login(page);
  const calls = await mockSupabase(page);
  await page.goto("/ako");

  await page.getByRole("button", { name: "Burahin ang account ko" }).click();
  const confirm = page.getByRole("button", { name: "Burahin nang tuluyan" });
  await expect(confirm).toBeDisabled();
  await page.getByLabel("I-type ang BURAHIN para ituloy").fill("burahin");
  await expect(confirm).toBeDisabled();
  await page.getByLabel("I-type ang BURAHIN para ituloy").fill("BURAHIN");
  await confirm.click();

  await expect(page).toHaveURL(/\/$/);
  expect(calls.some((c) => c.path.startsWith("/rest/v1/rpc/delete_my_account"))).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem("sb-supabase-auth-token"))).toBeNull();
});
