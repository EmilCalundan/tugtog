import { test, expect } from "@playwright/test";
import { login, mockSupabase, ME, SONG } from "./supabase-mock";

const LEADER = "bbbbbbbb-0000-4000-8000-00000000000b";
const CODE = "0f3c2a9e-1111-4222-8333-944455556666";

test("sumali sa banda gamit ang invite link", async ({ page }) => {
  await login(page);
  const calls = await mockSupabase(page, {
    rpc: { team_by_code: [{ id: "t1", name: "Worship Team", member_count: 4 }], join_team: "t1" },
  });

  await page.goto(`/sali/${CODE}`);
  await expect(page.getByRole("heading", { name: "Worship Team" })).toBeVisible();
  await page.getByText("Bass", { exact: true }).click();
  await page.getByRole("button", { name: "Sumali sa Worship Team" }).click();

  await expect(page).toHaveURL(/\/banda\/t1$/);
  const join = calls.find((c) => c.path.startsWith("/rest/v1/rpc/join_team"));
  expect(join?.body).toMatchObject({ p_code: CODE, p_instrument: "bass", p_display_name: "Emil" });
});

test("hindi naka-login sa invite link: hinihinging mag-login muna", async ({ page }) => {
  await mockSupabase(page);
  await page.goto(`/sali/${CODE}`);
  await expect(page.getByRole("heading", { name: "Mag-login para sumali" })).toBeVisible();
});

test("setlist ng banda: read-only sa miyembro, at bumubukas ang kanta sa part niya", async ({ page }) => {
  await login(page);
  await mockSupabase(page, {
    setlists: [{ id: "sl1", title: "Linggo", share_id: "x", owner_id: LEADER, team_id: "t1", teams: { name: "Worship Team" } }],
    setlist_items: [{ id: "i1", position: 0, song_key: "Bb", songs: { ...SONG, owner_id: LEADER } }],
    team_members: [{ instrument: "bass" }],
  });

  await page.goto("/setlist/sl1");
  await expect(page.getByText("bubukas sa Bass")).toBeVisible();
  await expect(page.getByRole("button", { name: "Burahin ang setlist" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Itaas" })).toHaveCount(0);

  await page.getByRole("link", { name: "Sa Liwanag Mo" }).click();
  await expect(page).toHaveURL(/\/kanta\/s1\?key=Bb&tab=bass$/);
});

test("kanta ng kabanda: walang Edit at + Setlist", async ({ page }) => {
  await login(page);
  await mockSupabase(page, { songs: [{ ...SONG, owner_id: LEADER }] });
  await page.goto("/kanta/s1?key=Bb&tab=bass");
  await expect(page.getByRole("group", { name: "Key" })).toContainText("Bb");
  await expect(page.getByRole("link", { name: "I-edit ang kanta" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "+ Setlist" })).toHaveCount(0);
});

test("leader: nakikita ang invite link at ang mga miyembro", async ({ page }) => {
  await login(page);
  await mockSupabase(page, {
    teams: [
      {
        id: "t1",
        name: "Worship Team",
        owner_id: ME.id,
        invite_code: CODE,
        team_members: [
          { user_id: ME.id, display_name: "Emil", instrument: "gitara", role: "leader" },
          { user_id: LEADER, display_name: "Bea", instrument: "bass", role: "member" },
        ],
        setlists: [],
      },
    ],
  });
  await page.goto("/banda/t1");
  await expect(page.getByText(`/sali/${CODE}`)).toBeVisible();
  await expect(page.getByRole("button", { name: "Tanggalin" })).toHaveCount(1);
});
