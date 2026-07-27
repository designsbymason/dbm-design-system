import { DocsContext } from "@storybook/addon-docs/blocks";
import { useContext, useEffect, useRef } from "react";
import { SET_GLOBALS, UPDATE_GLOBALS } from "storybook/internal/core-events";

type ThemeGlobals = { brand: string; mode: string };

/** Reads the last-applied theme back off the DOM, if any, instead of
 * always restarting from a hardcoded default — see the component-level
 * comment for why this matters. */
function readCurrentThemeAttribute(): ThemeGlobals {
  const existing = document.documentElement.dataset.theme;
  if (existing) {
    const [brand, mode] = existing.split("-");
    if (brand && mode) return { brand, mode };
  }
  return { brand: "purple", mode: "light" };
}

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
 * Fixed by listening directly to the addons channel exposed on
 * `DocsContext`, for the same underlying globals-change signal the
 * decorator ultimately reacts to — two real bugs found and fixed along
 * the way, in order:
 *
 * 1. **`GLOBALS_UPDATED` alone is not enough** — confirmed empirically by
 *    capturing raw channel events while toggling the toolbar: that
 *    confirmation event only round-trips back once the preview's
 *    story-rendering machinery has an active story to apply the change
 *    to, which a story-less Foundations page never has. `UPDATE_GLOBALS`
 *    (the command the manager UI sends on every toolbar interaction)
 *    fires reliably regardless, but only carries the *changed* keys, not
 *    the full globals object — handled by merging each event onto a
 *    running snapshot rather than replacing it outright.
 * 2. **The running snapshot can't be plain `useState`/`useRef`-from-a-
 *    hardcoded-default** — a globals change re-renders the whole Docs
 *    container (so its embedded previews pick up the new globals too),
 *    which remounts this component, which reset the snapshot straight
 *    back to the hardcoded default and silently clobbered the very
 *    change that had just been applied. Confirmed by logging mount/event
 *    order directly: mount → event received → **immediate remount** →
 *    theme visibly reverts. Fixed by bootstrapping the snapshot by
 *    reading `document.documentElement.dataset.theme` back off the DOM
 *    on each mount instead of a fixed default — the attribute itself
 *    survives the remount even though this component's own state
 *    doesn't, so a fresh mount picks up exactly where the last one left
 *    off.
 *
 * `SET_GLOBALS` fires once, with the full current globals, when the
 * preview initializes (covers "user already switched theme on another
 * page before navigating here" for the very first mount, before any DOM
 * attribute exists to read back). Render `<ThemeSync />` once, anywhere,
 * on every Foundations page. Not part of the published package.
 */
export function ThemeSync() {
  const context = useContext(DocsContext);
  const currentGlobals = useRef<ThemeGlobals>(readCurrentThemeAttribute());

  useEffect(() => {
    const applyCurrentTheme = () => {
      const { brand, mode } = currentGlobals.current;
      document.documentElement.dataset.theme = `${brand}-${mode}`;
    };

    applyCurrentTheme();

    const mergeAndApply = (payload: { globals?: Record<string, unknown> }) => {
      const nextGlobals = payload?.globals;
      if (!nextGlobals) return;
      currentGlobals.current = {
        brand: (nextGlobals.brand as string | undefined) ?? currentGlobals.current.brand,
        mode: (nextGlobals.mode as string | undefined) ?? currentGlobals.current.mode,
      };
      applyCurrentTheme();
    };

    context.channel.on(SET_GLOBALS, mergeAndApply);
    context.channel.on(UPDATE_GLOBALS, mergeAndApply);
    return () => {
      context.channel.off(SET_GLOBALS, mergeAndApply);
      context.channel.off(UPDATE_GLOBALS, mergeAndApply);
    };
  }, [context]);

  return null;
}
