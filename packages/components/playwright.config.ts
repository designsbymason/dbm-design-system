import { defineConfig, devices } from "@playwright/test";

/**
 * Self-hosted visual regression against Storybook stories, per
 * `guidelines/02-tech-stack-and-structure.md`'s tech-stack choice —
 * Playwright's own screenshot/snapshot comparison, no third-party hosted
 * review service. Baseline `*-snapshots/` images are committed; only the
 * ephemeral run output (`playwright-report/`, `test-results/`) is
 * gitignored.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:6006",
    trace: "on-first-retry",
  },
  // Locally, this attaches to the Storybook dev server you already have
  // running (`reuseExistingServer`); in CI it starts a fresh one. No `--`
  // before the flags: pnpm 11 appends extra arguments to the script itself, so
  // a literal `--` reaches `storybook dev` as an unexpected positional
  // argument and it exits ("too many arguments for 'dev'") before Playwright
  // ever gets a server. That only ever bites in CI, since locally the existing
  // server is reused and this command never runs.
  webServer: {
    command: "pnpm storybook --ci --quiet",
    url: "http://localhost:6006",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
