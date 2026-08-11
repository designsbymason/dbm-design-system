import { create } from "storybook/theming/create";
import { primitives, purpleLight, purpleDark, emeraldLight, emeraldDark } from "@dbm-design-system/tokens";

type ThemeVars = ReturnType<typeof create>;

/**
 * Storybook's manager UI (sidebar/toolbar chrome) and the Docs addon's own
 * typography both run outside the preview iframe, so neither has access to
 * our CSS custom properties — each generated theme below mirrors a brand's
 * resolved semantic token values (light/dark) as literal hex/font strings
 * instead. `.storybook/manager.ts` and `.storybook/DbmDocsContainer.tsx`
 * both listen for the Brand AND Mode toolbar globals on the addons channel
 * and switch between these live via `getStorybookTheme`, so the manager
 * chrome and the Docs wrapper now track the same two toggles that theme
 * previewed components (see the `withTheme` decorator in preview.tsx) —
 * this reverses an earlier decision (see git history) that manager/docs
 * chrome would stay fixed to purple regardless of the Brand toggle.
 *
 * Rather than hand-transcribing hex per brand/mode (drift-prone — this
 * file used to do exactly that for purple only, and its dark variant had
 * silently gone stale on `appBorderRadius`/`inputBorderRadius`, off by 2px
 * from the `radius.md`/`radius.sm` tokens its own comments named), every
 * value below is read directly from `@dbm-design-system/tokens`'s built
 * semantic exports (`purpleLight`/`purpleDark`/`emeraldLight`/
 * `emeraldDark` — already-resolved `{ bg, text, border, icon }` hex maps,
 * confirmed via `node -e "require('./dist/index.cjs')"`) and the
 * `primitives.radius` scale. Adding a third brand later means adding one
 * import and one `BRANDS` entry below — nothing else in this file, or in
 * `manager.ts`/`DbmDocsContainer.tsx`, needs to change.
 *
 * One correctness note found while building this: `text["on-brand"]` is
 * white for purple in both modes, but for emerald it's white in light and
 * **`#16151c` (dark text) in dark mode** — emerald.500 is light enough
 * that white text fails contrast, so the token itself already accounts
 * for this. `textInverseColor` below reads `t.text["on-brand"]` per
 * brand/mode rather than assuming white, which the old purple-only file
 * did — assuming white would have made Emerald+Dark's selected sidebar
 * item illegible (light text on a light-green background).
 */

type Brand = "purple" | "emerald";
type Mode = "light" | "dark";

const SEMANTIC_TOKENS: Record<Brand, Record<Mode, typeof purpleLight>> = {
  purple: { light: purpleLight, dark: purpleDark },
  emerald: { light: emeraldLight, dark: emeraldDark },
};

// radius.md / radius.sm, read live rather than hand-typed (see file header).
const RADIUS_MD = Number.parseInt(primitives.radius.md, 10);
const RADIUS_SM = Number.parseInt(primitives.radius.sm, 10);

function buildStorybookTheme(brand: Brand, mode: Mode): ThemeVars {
  const t = SEMANTIC_TOKENS[brand][mode];
  return create({
    base: mode,

    brandTitle: "DBM Design System",
    brandUrl: "https://github.com/designsbymason/dbm-design-system",
    brandTarget: "_self",
    // Served from `.storybook/public/logo.svg` via `staticDirs` in
    // main.ts. Fixed brand-purple circle mark (not theme-reactive) — it
    // carries its own background, so it reads fine on both light and dark
    // manager chrome without a mode-specific variant.
    brandImage: "/logo.svg",

    colorPrimary: t.bg.brand,
    // `text.link`, not `bg.brand` (2026-08-09) — Storybook applies this as
    // literal text color in at least two places: the toolbar's active
    // Brand/Mode labels, and the Docs page's right-side TOC active-item
    // text. `bg.brand` (purple.500 dark) was calibrated as a *background*
    // fill paired with `text.on-brand`, not as foreground text on
    // `bg.subtle`/`bg.surface` — measured 3.13:1 / 2.24:1 there, both
    // failing the 4.5:1 AA text floor. `text.link` is already the vetted
    // token for literal purple text (purple.300 dark, chosen specifically
    // because purple.400 failed AA here too — see that token's own
    // description); it measures 7.45:1 / 5.32:1 against the same two
    // backgrounds. Light mode is unaffected: `text.link` and `bg.brand`
    // are byte-identical there (both purple.600), so this is a pure
    // dark-mode contrast fix, not a color change in light mode.
    colorSecondary: t.text.link,

    appBg: t.bg.subtle,
    appContentBg: t.bg.surface,
    appPreviewBg: t.bg.surface,
    appBorderColor: t.border.default,
    appBorderRadius: RADIUS_MD,

    fontBase: '"Nunito", system-ui, sans-serif',
    fontCode:
      "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",

    textColor: t.text.primary,
    textInverseColor: t.text["on-brand"],
    textMutedColor: t.text.secondary,

    barTextColor: t.text.secondary,
    // Standardized on `bg.brand-hover` for both modes — the light theme
    // previously reused `bg.brand` here (identical to the selected-state
    // color, so hovering an unselected item looked the same as selecting
    // it), while dark already used `bg.brand-hover` correctly. This gives
    // light mode a real, distinct hover state instead of leaving that
    // inconsistency in place.
    barHoverColor: t.bg["brand-hover"],
    barSelectedColor: t.bg.brand,
    barBg: t.bg.subtle,

    buttonBg: t.bg.subtle,
    buttonBorder: t.border.default,

    booleanBg: t.bg.subtle,
    booleanSelectedBg: t.bg.surface,

    inputBg: t.bg.surface,
    inputBorder: t.border.default,
    inputTextColor: t.text.primary,
    inputBorderRadius: RADIUS_SM,
  });
}

/** Add a new brand by importing its `<brand>Light`/`<brand>Dark` semantic
 * exports above, adding a `SEMANTIC_TOKENS` entry, and adding it here. */
export const BRANDS: Brand[] = ["purple", "emerald"];
const MODES: Mode[] = ["light", "dark"];

const registry = Object.fromEntries(
  BRANDS.map((brand) => [
    brand,
    Object.fromEntries(MODES.map((mode) => [mode, buildStorybookTheme(brand, mode)])),
  ]),
) as Record<Brand, Record<Mode, ThemeVars>>;

/** Falls back to the first configured brand/mode if given an unrecognized
 * or missing value — callers pass raw toolbar-global strings, which are
 * `unknown` as far as the type system is concerned. */
export function getStorybookTheme(brand?: string, mode?: string): ThemeVars {
  const resolvedBrand = BRANDS.includes(brand as Brand) ? (brand as Brand) : BRANDS[0];
  const resolvedMode = MODES.includes(mode as Mode) ? (mode as Mode) : MODES[0];
  return registry[resolvedBrand][resolvedMode];
}

/** Raw resolved semantic tokens (`{ bg, text, border, icon }` hex maps),
 * same brand/mode resolution as `getStorybookTheme` — for manager-side
 * chrome that Storybook's theme API has no dedicated variable for (e.g.
 * the addon panel background, which shares `appContentBg` with the Docs
 * content wrapper, too coarse to target just the panel). `manager.ts`
 * uses this to hand-inject a scoped style override for `#storybook-panel-root`
 * instead of widening `appContentBg` and affecting the Docs wrapper too. */
export function getSemanticTokens(brand?: string, mode?: string): typeof purpleLight {
  const resolvedBrand = BRANDS.includes(brand as Brand) ? (brand as Brand) : BRANDS[0];
  const resolvedMode = MODES.includes(mode as Mode) ? (mode as Mode) : MODES[0];
  return SEMANTIC_TOKENS[resolvedBrand][resolvedMode];
}
