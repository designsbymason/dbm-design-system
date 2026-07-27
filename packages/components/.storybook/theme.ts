import { create } from "storybook/theming/create";

/**
 * Storybook's manager UI (sidebar/toolbar chrome) and the Docs addon's own
 * typography both run outside the preview iframe, so neither has access to
 * our CSS custom properties — this mirrors the relevant primitive token
 * values as literal hex/font strings instead. One fixed light theme for the
 * tool's own chrome, independent of the brand/mode toolbar toggle that
 * themes the *previewed components* (see the `withTheme` decorator in
 * preview.tsx) — matches how every other branded Storybook instance
 * operates: one consistent tool identity, multi-theme content.
 */
export const dbmStorybookTheme = create({
  base: "light",

  brandTitle: "DBM Design System",
  brandUrl: "https://github.com/designsbymason/dbm-design-system",
  brandTarget: "_self",

  // color.purple.600 — the brand anchor (see 03-token-system-spec.md)
  colorPrimary: "#5548A4",
  colorSecondary: "#5548A4",

  appBg: "#FAFAFB", // color.gray.50
  appContentBg: "#FFFFFF",
  appPreviewBg: "#FFFFFF",
  appBorderColor: "#DEDDE5", // color.gray.200
  appBorderRadius: 10, // radius.md

  fontBase: '"Nunito", system-ui, sans-serif',
  fontCode:
    "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",

  textColor: "#2C2A34", // color.gray.900
  textInverseColor: "#FFFFFF",
  textMutedColor: "#5B586B", // color.gray.700

  barTextColor: "#5B586B",
  barHoverColor: "#5548A4",
  barSelectedColor: "#5548A4",
  barBg: "#FFFFFF",

  buttonBg: "#F0F0F3", // color.gray.100
  buttonBorder: "#DEDDE5",

  booleanBg: "#F0F0F3",
  booleanSelectedBg: "#FFFFFF",

  inputBg: "#FFFFFF",
  inputBorder: "#DEDDE5",
  inputTextColor: "#2C2A34",
  inputBorderRadius: 6, // radius.sm
});
