import { create } from "storybook/theming/create";

/**
 * Storybook's manager UI (sidebar/toolbar chrome) and the Docs addon's own
 * typography both run outside the preview iframe, so neither has access to
 * our CSS custom properties — each of these two themes mirrors the relevant
 * *purple* semantic token values (light/dark) as literal hex/font strings
 * instead. Two themes, not one: `.storybook/manager.ts` and
 * `.storybook/DbmDocsContainer.tsx` both listen for the Mode toolbar global
 * on the addons channel and switch between these live, so the manager
 * chrome and the Docs wrapper now track the same toggle that themes
 * previewed components (see the `withTheme` decorator in preview.tsx),
 * rather than staying fixed light regardless of Mode.
 *
 * Hex values are taken from the already AA-contrast-verified step
 * selections in `packages/tokens/src/semantic/purple-{light,dark}.json`
 * (not re-derived here) — purple specifically, since the manager/docs
 * chrome is the tool's own identity and isn't expected to re-theme with the
 * Brand toggle the way previewed components do.
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
  appBorderRadius: 8, // radius.md

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
  inputBorderRadius: 4, // radius.sm
});

export const dbmStorybookThemeDark = create({
  base: "dark",

  brandTitle: "DBM Design System",
  brandUrl: "https://github.com/designsbymason/dbm-design-system",
  brandTarget: "_self",

  // bg.brand (purple.500 in dark mode — a different step than light's
  // purple.600 anchor, per purple-dark.json)
  colorPrimary: "#746BC6",
  colorSecondary: "#746BC6",

  appBg: "#16151C", // bg.canvas (gray.950)
  appContentBg: "#2C2A34", // bg.surface (gray.900)
  appPreviewBg: "#2C2A34",
  appBorderColor: "#43404F", // border.default (gray.800)
  appBorderRadius: 10, // radius.md

  fontBase: '"Nunito", system-ui, sans-serif',
  fontCode:
    "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",

  textColor: "#FAFAFB", // text.primary (gray.50)
  textInverseColor: "#FFFFFF", // text.on-brand (neutral.white in dark mode)
  textMutedColor: "#C6C4D1", // text.secondary (gray.300)

  barTextColor: "#C6C4D1",
  barHoverColor: "#5548A4", // bg.brand-hover (purple.600 in dark mode)
  barSelectedColor: "#746BC6",
  barBg: "#2C2A34", // bg.surface

  buttonBg: "#43404F", // bg.subtle (gray.800)
  buttonBorder: "#43404F",

  booleanBg: "#43404F",
  booleanSelectedBg: "#2C2A34",

  inputBg: "#2C2A34", // bg.surface
  inputBorder: "#43404F", // border.default
  inputTextColor: "#FAFAFB",
  inputBorderRadius: 6, // radius.sm
});
