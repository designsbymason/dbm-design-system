import remarkGfm from "remark-gfm";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  // `.mdx` docs pages live alongside their component's stories (see
  // guidelines/07-storybook-and-documentation-standards.md §4) — matched
  // separately since they don't follow the `*.stories.*` naming pattern.
  stories: ["../src/**/*.stories.@(ts|tsx)", "../src/**/*.mdx"],
  // `@storybook/addon-viewport` and interaction/play-function testing are
  // both core-bundled in Storybook 10 (`storybook/viewport`,
  // `storybook/test`) — no separate addon packages needed for either.
  // `@storybook/addon-vitest` (added 2026-08-16) wires the sidebar's
  // per-story test-status indicators to the real "storybook" Vitest
  // project (vitest.config.ts) — it's also what the Accessibility addon's
  // automatic scan is gated behind; see guidelines/01-vision-and-goals.md
  // §12 for the full diagnosis of why the a11y panel didn't work without it.
  // The live panel/sidebar indicators need `pnpm test:storybook:watch`
  // running alongside `pnpm storybook` — confirmed empirically (registering
  // the addon here alone isn't enough; it has nothing to report until a
  // live Vitest process is actually watching). `pnpm test:storybook` (no
  // watch) is the one that matters for CI — it works standalone with no
  // running dev server, since Vite loads stories directly.
  // `@storybook/addon-docs` registered with an explicit `options` object
  // (rather than the plain string form) so its MDX compiler picks up
  // `remark-gfm` — without it, GFM tables in a `.mdx` Docs page silently
  // render as raw, unparsed `| pipe | text |` instead of an actual table
  // (found 2026-09-09, via FocusTrap's own review; confirmed there's no
  // other way to reach the MDX compiler's remark plugins — `main.ts` has no
  // top-level `options` field of its own, this addon's own per-addon
  // `options.mdxPluginOptions.mdxCompileOptions` is the documented
  // extension point). Dev-only Storybook tooling, not shipped in
  // `@dbm-design-system/components` — same category as Storybook itself,
  // not subject to the runtime dependency budget in `CLAUDE.md`.
  addons: [
    "@storybook/addon-a11y",
    {
      name: "@storybook/addon-docs",
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    "@storybook/addon-vitest",
  ],
  // Served at the root path, so `./public/logo.svg` becomes `/logo.svg` —
  // referenced as `brandImage` in theme.ts for the sidebar logo.
  staticDirs: ["./public"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // esbuild's local-css loader (see tsup.config.ts) is a build-time-only concern;
  // Vite already has native CSS Modules support, so no extra config is needed here.
  // No paid SaaS / anonymous-usage-phone-home in the build pipeline, per
  // CLAUDE.md's free/OSS-only + security posture — Storybook otherwise
  // sends anonymous telemetry on most CLI commands by default.
  core: {
    disableTelemetry: true,
  },
};

export default config;
