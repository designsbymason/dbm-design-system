import { useEffect, useState } from "react";
import type { DocsContextProps } from "@storybook/addon-docs/blocks";
import { SET_GLOBALS, UPDATE_GLOBALS } from "storybook/internal/core-events";

export type ThemeGlobals = { brand: string; mode: string };

/**
 * Module-level cache — see the listener-lifetime note below for why this
 * only stays accurate while a channel listener is actively attached to it,
 * which is the whole reason that listener now lives independently of any
 * one component's mount state instead of inside a `useEffect`.
 */
let lastKnownGlobals: ThemeGlobals = { brand: "purple", mode: "light" };

/** Every currently-mounted `useThemeGlobals` caller that wants to be told
 * when `lastKnownGlobals` changes. Kept separate from the channel
 * subscription itself (see below) — components come and go, but the
 * listener updating the cache must not. */
const subscribers = new Set<(globals: ThemeGlobals) => void>();

/** Tracks which `channel` instance the module-level listener below is
 * currently attached to, so a repeat call from a second consumer mounted
 * on the same page (`ThemeSync` and `DbmDocsContainer`'s fallback path are
 * both mounted together on a Foundations page, sharing one `DocsContext`)
 * doesn't double-subscribe — and so a genuinely new `channel` instance
 * (a real module reload, see the component-page caveat below) does get a
 * fresh subscription. */
let listeningOnChannel: DocsContextProps["channel"] | null = null;

function ensureChannelListener(channel: DocsContextProps["channel"]): void {
  if (listeningOnChannel === channel) return;
  listeningOnChannel = channel;
  const mergeAndApply = (payload: { globals?: Record<string, unknown> }) => {
    const nextGlobals = payload?.globals;
    if (!nextGlobals) return;
    lastKnownGlobals = {
      brand: (nextGlobals.brand as string | undefined) ?? lastKnownGlobals.brand,
      mode: (nextGlobals.mode as string | undefined) ?? lastKnownGlobals.mode,
    };
    subscribers.forEach((notify) => notify(lastKnownGlobals));
  };
  channel.on(SET_GLOBALS, mergeAndApply);
  channel.on(UPDATE_GLOBALS, mergeAndApply);
}

/**
 * Shared channel-listening logic (extracted 2026-08-07 from `ThemeSync`,
 * which still consumes it) for anything outside the preview iframe that
 * needs the live Brand/Mode toolbar globals: `SET_GLOBALS` fires once,
 * with the full globals object, when the preview initializes;
 * `UPDATE_GLOBALS` fires on every toolbar interaction but only carries the
 * *changed* keys, so each event is merged onto the previous value rather
 * than replacing it outright.
 *
 * **Second real bug found 2026-08-08, from a user bug report** (after the
 * first one below, about module reloads on component pages): navigating
 * *away* from a Foundations page and back — Foundations → a component
 * story → toggle Mode there → back to Foundations — left the Foundations
 * page showing the *old* mode from before the trip, not the one just set
 * on the story page. Root cause: the channel subscription used to live
 * inside this hook's own `useEffect`, so it unsubscribed the instant
 * `ThemeSync` unmounted (navigating away) and only resubscribed on
 * remount (navigating back) — any globals change that happened *while
 * unmounted* was never seen, so `lastKnownGlobals` went stale, and the
 * next mount's `useState(lastKnownGlobals)` bootstrap read that stale
 * value. Confirmed via a real cross-page toggle sequence with the actual
 * toolbar, not just synthetic events. Fixed by splitting the channel
 * listener out of any single component's lifecycle entirely
 * (`ensureChannelListener` above) — it attaches once and keeps updating
 * `lastKnownGlobals` for as long as the module itself is alive, whether or
 * not anything is currently rendering from it — and having each hook
 * instance separately subscribe/unsubscribe to *notifications* of that
 * cache changing (`subscribers`), which is safe to tear down per-mount
 * since missing a notification just means a re-render is skipped, not
 * that data is lost.
 *
 * **First bug, found earlier the same day, while wiring up a second
 * consumer (`DbmDocsContainer`):** the module-level cache does NOT
 * reliably survive on a docs page with an attached story (an embedded
 * `<Canvas>`) — logging a random id assigned at module-evaluation time
 * showed the whole `useThemeGlobals.ts` module gets **freshly
 * re-evaluated**, not just the calling React component remounting, every
 * time the `<Canvas>` re-prepares its story in response to a globals
 * change. The JS realm this module runs in is torn down and rebuilt
 * there, wiping every module-level variable along with it — no amount of
 * restructuring the listener lifetime fixes that case, since the whole
 * module restarts from its top-level `let` initializers. `DbmDocsContainer`
 * therefore does NOT rely on this hook when a story is attached; it reads
 * globals synchronously from the story's own context instead (see
 * `readModeFromAttachedStory` in that file) and only falls back to this
 * hook on story-less (Foundations) pages, which never trigger that reload
 * churn — this hook's cache genuinely persists there, which is exactly
 * what the second bug above depended on to even be reachable.
 *
 * Unlike `ThemeSync` (a side-effect-only DOM mutation that never itself
 * needs a re-render), this hook returns the value so callers that need it
 * in their own render — e.g. picking a Storybook theme object — can react
 * to it live.
 */
export function useThemeGlobals(context: DocsContextProps): ThemeGlobals {
  const [globals, setGlobals] = useState<ThemeGlobals>(lastKnownGlobals);

  useEffect(() => {
    ensureChannelListener(context.channel);
    subscribers.add(setGlobals);
    return () => {
      subscribers.delete(setGlobals);
      // Deliberately no `channel.off` here — see `ensureChannelListener`;
      // the cache-updating listener must outlive this one component
      // instance's mount lifecycle, not tear down with it.
    };
  }, [context]);

  return globals;
}
