import { DocsContext } from "@storybook/addon-docs/blocks";
import { useContext, useEffect } from "react";
import { useThemeGlobals } from "./useThemeGlobals";

/**
 * Foundations-only fix for a real theming gap on pure-MDX docs pages
 * (added 2026-07-27): `preview.tsx`'s `withTheme` decorator — which sets
 * `document.documentElement.dataset.theme` from the Brand/Mode toolbar
 * globals — only runs when an actual story renders. Every component's
 * `ComponentName.mdx` embeds at least one `<Canvas>`, so it runs there as
 * a side effect and the whole page benefits (the same `document.documentElement`
 * is shared page-wide). A Foundations page with zero `<Canvas>`/`<Story>`
 * blocks never triggers it at all — confirmed empirically: every
 * `var(--dbm-bg-*)`/`text-*`/`border-*`/`icon-*` reference on such a page
 * resolved to nothing, since the semantic CSS is scoped under
 * `:root[data-theme="..."]` and that attribute was simply never set.
 *
 * Fixed by listening to the same globals-change signal the decorator
 * ultimately reacts to, via the shared `useThemeGlobals` hook (extracted
 * 2026-08-07 — see that file for the two real bugs found while building
 * this: `GLOBALS_UPDATED` not firing without an active story, and a plain
 * `useState`/`useRef`-from-a-hardcoded-default getting clobbered by a
 * globals-triggered remount). Render `<ThemeSync />` once, anywhere, on
 * every Foundations page. Not part of the published package.
 */
export function ThemeSync() {
  const context = useContext(DocsContext);
  const { brand, mode } = useThemeGlobals(context);

  useEffect(() => {
    document.documentElement.dataset.theme = `${brand}-${mode}`;
  }, [brand, mode]);

  return null;
}
