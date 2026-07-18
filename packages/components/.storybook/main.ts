import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // esbuild's local-css loader (see tsup.config.ts) is a build-time-only concern;
  // Vite already has native CSS Modules support, so no extra config is needed here.
};

export default config;
