import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { configDefaults, defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          css: true,
          // src/test/setup.ts stubs several browser APIs jsdom doesn't
          // implement (matchMedia, ResizeObserver, IntersectionObserver,
          // scrollIntoView, PointerCapture) with no-ops — correct for
          // jsdom, but actively wrong in a real browser (the "storybook"
          // project below), where those APIs already exist and work.
          // Scoped to this project only, not left at the config root, so
          // it can't leak into the browser-mode project via `extends`.
          setupFiles: ["./src/test/setup.ts"],
          // e2e/ holds Playwright visual-regression tests (`pnpm
          // test:visual`), a separate runner/pipeline — exclude them from
          // Vitest's own discovery.
          exclude: [...configDefaults.exclude, "e2e/**"],
        },
      },
      {
        extends: true,
        plugins: [
          // Runs every story (and, critically, every story's `play`
          // function) as a real Vitest test in an actual browser — closes
          // the gap where play-function interactions previously only ran
          // when a human manually opened that story's Interactions tab.
          // Also what the Accessibility addon's automatic scan is gated
          // behind (guidelines/01-vision-and-goals.md §12).
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
