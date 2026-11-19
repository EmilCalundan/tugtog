import { test, expect } from "@playwright/test";
import { login, mockSupabase, SONG } from "./supabase-mock";

test("gumawa ng kanta: nase-save ang tempo, time at style", async ({ page }) => {
  await login(page);
  const calls = await mockSupabase(page, { saved: { ...SONG, id: "bagong-kanta" } });

  await page.goto("/kanta/bago");
  await page.getByLabel("Title").fill("Bagong Kanta");
  await page.getByLabel("Tempo (BPM)").fill("63");
  await page.getByLabel("Time").selectOption("6/8");
  await page.getByLabel("Chords and lyrics").fill("[Verse]\n| G  Em | C  D |");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL(/\/kanta\/bagong-kanta$/);
  const insert = calls.find((c) => c.method === "POST" && c.path.startsWith("/rest/v1/songs"));
  expect(insert?.body).toMatchObject({ title: "Bagong Kanta", bpm: 63, time_signature: "6/8", style: "ballad" });
});

test("sariling strum pattern: preset, nase-save, at lumalabas sa Guitar tab", async ({ page }) => {
  await login(page);
  const calls = await mockSupabase(page, { saved: { ...SONG, id: "bagong-kanta", strum: "D-D-DUDU" }, songs: [{ ...SONG, strum: "D-D-DUDU" }] });

  await page.goto("/kanta/bago");
  await page.getByLabel("Title").fill("Mahal na Mahal Kita");
  await page.getByRole("button", { name: "Folk" }).click();
  await expect(page.getByRole("img", { name: "Strum: down, rest, down, rest, down, up, down, up" })).toBeVisible();
  await page.getByRole("button", { name: "Save" }).click();

  const insert = calls.find((c) => c.method === "POST" && c.path.startsWith("/rest/v1/songs"));
  expect(insert?.body).toMatchObject({ strum: "D-D-DUDU" });

  await page.goto("/kanta/s1?tab=gitara");
  const card = page.getByRole("region", { name: "Strum pattern" });
  await expect(card).toContainText("Song pattern");
});

test("maling strum pattern: hindi nase-save", async ({ page }) => {
  await login(page);
  const calls = await mockSupabase(page);
  await page.goto("/kanta/bago");
  await page.getByLabel("Title").fill("Mali");
  await page.getByLabel("Strum pattern").fill("D-DU");
  await expect(page.getByText("4/8 letters")).toBeVisible();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(/needs 8 letters/)).toBeVisible();
  expect(calls.some((c) => c.method === "POST")).toBe(false);
});

test("bawal ang tempo na lampas sa 200", async ({ page }) => {
  await login(page);
  const calls = await mockSupabase(page);
  await page.goto("/kanta/bago");
  await page.getByLabel("Title").fill("Mabilis");
  await page.getByLabel("Tempo (BPM)").fill("300");
  await page.getByRole("button", { name: "Save" }).click();
  // Ang browser mismo ang pumipigil (max=200), kaya walang naipadala
  expect(calls.some((c) => c.method === "POST")).toBe(false);
});

test("tinutugtog ng player ang kanta bar bawat bar, at sumusunod ang leeg ng gitara", async ({ page }) => {
  await login(page);
  await mockSupabase(page, { songs: [SONG] });
  await page.goto("/kanta/s1?tab=gitara");

  await page.getByRole("button", { name: /Play the song on/ }).click();
  const status = page.getByRole("region", { name: "Play the song" });
  await expect(status).toContainText("Bar 1 of 4");
  // Sa 160 BPM, 1.5 segundo ang bawat bar. Dalawang chord ang unang bar (G, D/F#).
  await expect(status).toContainText("D/F#", { timeout: 3000 });
  await expect(page.getByRole("img", { name: /^D\/F#:/ })).toBeVisible();
  await expect(status).toContainText("Bar 2 of 4", { timeout: 3000 });
});

test("ulitin ang isang bahagi", async ({ page }) => {
  await login(page);
  await mockSupabase(page, { songs: [SONG] });
  await page.goto("/kanta/s1?tab=gitara");

  await page.getByLabel(/^Start from/).selectOption({ label: "Chorus · bar 3" });
  await page.getByRole("checkbox", { name: "Loop" }).check();
  await page.getByRole("button", { name: /Play the song on/ }).click();
  const status = page.getByRole("region", { name: "Play the song" });
  await expect(status).toContainText("Chorus · Bar 3 of 4");
  await expect(status).toContainText("Bar 4 of 4", { timeout: 3000 });
  await expect(status).toContainText("Bar 3 of 4", { timeout: 3000 }); // bumalik sa simula ng Chorus
});
