import { useEffect, useState } from "react";
import type { DocsContextProps } from "@storybook/addon-docs/blocks";
import { SET_GLOBALS, UPDATE_GLOBALS } from "storybook/internal/core-events";

export type ThemeGlobals = { brand: string; mode: string };

/**
 * Module-level fallback default, not a reliable cache — see the caveat in
 * this hook's own doc comment below. Kept as the `useState` seed so a
 * fresh mount that hasn't received a `SET_GLOBALS`/`UPDATE_GLOBALS` event
 * yet has *some* value to render with, rather than `undefined`.
 */
let lastKnownGlobals: ThemeGlobals = { brand: "purple", mode: "light" };

/**
 * Shared channel-listening logic (extracted 2026-08-07 from `ThemeSync`,
 * which still consumes it) for anything outside the preview iframe that
 * needs the live Brand/Mode toolbar globals: `SET_GLOBALS` fires once,
 * with the full globals object, when the preview initializes;
 * `UPDATE_GLOBALS` fires on every toolbar interaction but only carries the
 * *changed* keys, so each event is merged onto the previous value rather
 * than replacing it outright.
 *
 * **Caveat found 2026-08-08, while wiring up a second consumer
 * (`DbmDocsContainer`):** the module-level cache above does NOT reliably
 * survive on a docs page with an attached story (an embedded `<Canvas>`) —
 * logging a random id assigned at module-evaluation time showed the whole
 * `useThemeGlobals.ts` module gets **freshly re-evaluated**, not just the
 * calling React component remounting, every time the `<Canvas>` re-prepares
 * its story in response to a globals change. The JS realm this module runs
 * in is torn down and rebuilt there, wiping `lastKnownGlobals` back to its
 * hardcoded default along with it. This never affected `ThemeSync` because
 * Foundations pages (its only use site) have no attached story and never
 * trigger that reload churn — the cache genuinely persists for that case.
 * `DbmDocsContainer` therefore does NOT rely on this hook when a story is
 * attached; it reads globals synchronously from the story's own context
 * instead (see `readModeFromAttachedStory` in that file) and only falls
 * back to this hook on story-less (Foundations) pages, where it's both
 * necessary — nothing else would trigger a re-render there — and reliable.
 *
 * Unlike `ThemeSync` (a side-effect-only DOM mutation that never itself
 * needs a re-render), this hook returns the value so callers that need it
 * in their own render — e.g. picking a Storybook theme object — can react
 * to it live.
 */
export function useThemeGlobals(context: DocsContextProps): ThemeGlobals {
  const [globals, setGlobals] = useState<ThemeGlobals>(lastKnownGlobals);

  useEffect(() => {
    const mergeAndApply = (payload: { globals?: Record<string, unknown> }) => {
      const nextGlobals = payload?.globals;
      if (!nextGlobals) return;
      lastKnownGlobals = {
        brand: (nextGlobals.brand as string | undefined) ?? lastKnownGlobals.brand,
        mode: (nextGlobals.mode as string | undefined) ?? lastKnownGlobals.mode,
      };
      setGlobals(lastKnownGlobals);
    };

    context.channel.on(SET_GLOBALS, mergeAndApply);
    context.channel.on(UPDATE_GLOBALS, mergeAndApply);
    return () => {
      context.channel.off(SET_GLOBALS, mergeAndApply);
      context.channel.off(UPDATE_GLOBALS, mergeAndApply);
    };
  }, [context]);

  return globals;
}
