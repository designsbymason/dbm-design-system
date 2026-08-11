import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  // `.mdx` docs pages live alongside their component's stories (see
  // guidelines/07-storybook-and-documentation-standards.md §4) — matched
  // separately since they don't follow the `*.stories.*` naming pattern.
  stories: ["../src/**/*.stories.@(ts|tsx)", "../src/**/*.mdx"],
  // `@storybook/addon-viewport` and interaction/play-function testing are
  // both core-bundled in Storybook 10 (`storybook/viewport`,
  // `storybook/test`) — no separate addon packages needed for either.
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  // Served at the root path, so `./public/logo.svg` becomes `/logo.svg` —
  // referenced as `brandImage` in theme.ts for the sidebar logo.
  staticDirs: ["./public"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // esbuild's local-css loader (see tsup.config.ts) is a build-time-only concern;
  // Vite already has native CSS Modules support, so no extra config is needed here.
};

export default config;
