import type { Page, Request } from "@playwright/test";

// Pekeng Supabase para sa end-to-end tests.
// Sinasagot ang bawat request mula sa `data`, at itinatala ang mga ito para masuri sa test.

export const ME = { id: "aaaaaaaa-0000-4000-8000-00000000000a", email: "emil@example.com" };

export type MockData = {
  songs?: object[];
  setlists?: object[];
  setlist_items?: object[];
  teams?: object[];
  team_members?: object[];
  rpc?: Record<string, unknown>;
  // Para sa insert/update: ang ibabalik pagkatapos mag-save
  saved?: object;
};

export type Recorded = { method: string; path: string; body: unknown };

// Naka-login na ang user bago pa mag-load ang app
export async function login(page: Page, user = ME) {
  await page.addInitScript((u) => {
    const session = {
      access_token: "test-token",
      refresh_token: "test-refresh",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: "bearer",
      user: { id: u.id, email: u.email, aud: "authenticated", role: "authenticated" },
    };
    localStorage.setItem("sb-supabase-auth-token", JSON.stringify(session));
  }, user);
}

function bodyOf(request: Request): unknown {
  try {
    return request.postDataJSON();
  } catch {
    return request.postData();
  }
}

export async function mockSupabase(page: Page, data: MockData = {}): Promise<Recorded[]> {
  const calls: Recorded[] = [];

  await page.route("http://supabase.test/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    calls.push({ method: request.method(), path: path + url.search, body: bodyOf(request) });
    const single = (request.headers()["accept"] ?? "").includes("vnd.pgrst.object");
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

    // Auth
    if (path.startsWith("/auth/v1/token")) return json({ code: "invalid_credentials", error_code: "invalid_credentials", msg: "Invalid login credentials" }, 400);
    if (path.startsWith("/auth/v1/signup")) return json({ id: "new-user", email: "bago@example.com", identities: [{ id: "x" }] });
    if (path.startsWith("/auth/v1/user")) return json({ id: ME.id, email: ME.email, aud: "authenticated", role: "authenticated" });
    if (path.startsWith("/auth/v1/")) return json({});

    // Mga function (rpc)
    if (path.startsWith("/rest/v1/rpc/")) {
      const name = path.split("/").pop()!;
      return json(data.rpc?.[name] ?? null);
    }

    // Mga table
    const table = path.split("/").pop() as keyof MockData;
    if (request.method() === "POST" || request.method() === "PATCH") return json(single ? data.saved ?? {} : [data.saved ?? {}]);
    if (request.method() === "DELETE") return route.fulfill({ status: 204, body: "" });
    const rows = (data[table] as object[] | undefined) ?? [];
    return json(single ? rows[0] ?? null : rows);
  });

  return calls;
}

// Isang orihinal na kanta para sa mga test
export const SONG = {
  id: "s1",
  owner_id: ME.id,
  title: "Sa Liwanag Mo",
  artist: "",
  original_key: "G",
  content: "[Verse]\n| G   D/F# | Em   C |\nSa liwanag Mo\n[Chorus]\nC   D\nIkaw ang awit",
  bpm: 160,
  time_signature: "4/4",
  style: "ballad",
};
