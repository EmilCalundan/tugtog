import { defineConfig, devices } from "@playwright/test";

// End-to-end tests: binubuksan ang app sa totoong browser.
// Pekeng Supabase ang gamit (tingnan ang e2e/supabase-mock.ts), kaya hindi nagagalaw ang totoong database.
const PORT = 5174;

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts", // hiwalay sa Vitest (*.test.ts)
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Pixel 7"], // phone muna, gaya ng gamit sa music stand
    trace: "on-first-retry",
  },
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // Mas mataas ang priority ng mga ito kaysa sa .env.local, kaya hindi ginagamit ang totoong Supabase
    env: {
      VITE_SUPABASE_URL: "http://supabase.test",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-key",
    },
  },
});
