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

/** Set the first time `mergeAndApply` (below) processes a real channel
 * event in this module's current lifetime — see the fourth bug's comment
 * on `useThemeGlobals` for why the initial-state logic needs to know the
 * difference between "no live update has landed yet, so `lastKnownGlobals`
 * might be nothing but the hardcoded default" and "a live update already
 * landed, so `lastKnownGlobals` is actively correct and should never be
 * second-guessed against a URL read that can lag behind it." Reset to
 * `false` on every true module reload along with everything else here. */
let hasReceivedLiveUpdate = false;

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

/**
 * Reads the Brand/Mode toolbar globals from the channel's own event
 * history — used only as a fallback for bootstrapping state right after a
 * true module reload, when `lastKnownGlobals` can't yet be trusted (see
 * the third and fourth bugs documented on `useThemeGlobals` below).
 *
 * **Replaced the original URL-parsing version of this function (2026-08-09,
 * fifth bug):** that version read `?...&globals=brand:emerald;mode:dark`
 * straight out of `window.location.search`, on the theory (borne out at
 * the time) that Storybook's own URL sync was a reliable mirror of the
 * live state. A user report proved that wrong: toggling Mode on a
 * component's Docs page (which resets this whole module on every toggle —
 * see the first bug below) to Dark then back to Light left every
 * Foundations page showing Dark after navigating there, even though the
 * component page itself was correctly Light. Captured the preview
 * iframe's own `location.href` after the exact same toggle and found it
 * permanently stuck at `globals=mode%3Adark` — not lagging by a render
 * (the fourth bug's assumption), genuinely never updated at all, even
 * after several seconds. Reverting to a global's *default* value (`light`
 * is Mode's declared default) apparently doesn't reliably trigger
 * Storybook's own URL rewrite on a Docs page in this version, so the URL
 * fallback was reading permanently-wrong data, not stale-for-a-moment
 * data.
 *
 * Fixed by reading `channel.last(UPDATE_GLOBALS)` instead — the channel
 * (`storybook/channels`) buffers the most recent payload of every event
 * type it's seen, independent of Storybook's separate (and here, buggy)
 * URL-sync mechanism, and unlike `lastKnownGlobals` it isn't wiped by this
 * module's own reload since the `Channel` instance itself is owned and
 * kept alive by Storybook's outer preview runtime, not by this module.
 * Confirmed live: `channel.last('updateGlobals')` correctly returned
 * `{mode: "light"}` in the exact broken state where the URL and
 * `channel.last('setGlobals')` both still said `"dark"` — `SET_GLOBALS`
 * itself re-fires with stale data on every Docs-page toggle for the same
 * reason `manager.ts` needed its own fix for a stale-`SET_GLOBALS`-echo
 * bug (see that file), so it's checked only as a second-choice fallback
 * here, never first.
 */
function readGlobalsFromChannelHistory(channel: DocsContextProps["channel"]): Partial<ThemeGlobals> {
  const fromUpdate = channel.last(UPDATE_GLOBALS)?.[0]?.globals as Record<string, unknown> | undefined;
  const fromSet = channel.last(SET_GLOBALS)?.[0]?.globals as Record<string, unknown> | undefined;
  const source = fromUpdate ?? fromSet;
  if (!source) return {};
  const parsed: Partial<ThemeGlobals> = {};
  if (typeof source.brand === "string") parsed.brand = source.brand;
  if (typeof source.mode === "string") parsed.mode = source.mode;
  return parsed;
}

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
    hasReceivedLiveUpdate = true;
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
 * **Fourth bug, found 2026-08-08, from a user bug report** (a regression
 * introduced by the third bug's own fix, below): toggling Brand back to
 * Purple — but only Purple, since it's the *default* — right after
 * toggling to Emerald could leave a Foundations page showing Emerald
 * forever, while the manager chrome (a completely separate listener in
 * `manager.ts`) correctly reverted. Diagnosed with temporary instance-id
 * logging on every render/mount/effect: **this Foundations page's
 * `useThemeGlobals` consumers remount far more often than the "Foundations
 * pages never trigger reload churn" assumption above suggests** — not a
 * full module reload (module-level state survives), but React-level
 * remounts of the calling components happen on nearly every globals
 * change. Each such remount re-ran the third bug's fix — reading
 * `parseGlobalsFromLocation()` and merging it onto `lastKnownGlobals` —
 * even though `lastKnownGlobals` had *already* been correctly updated to
 * `{brand: "purple"}` by `mergeAndApply` moments earlier, in the same
 * event. The URL update that removes `brand` from the query string (since
 * purple is the default) lags slightly behind the in-memory state update,
 * so a remount landing in that gap read a **stale** URL still showing
 * `brand:emerald` — and the third bug's merge order (`{...lastKnownGlobals,
 * ...fromUrl}`, URL wins) let that stale read clobber the value that was
 * already correct. Confirmed via console logging of every `mergeAndApply`
 * call and every hook instance's init/render, not guessed: the log showed
 * `lastKnownGlobals` correctly reaching `{brand: "purple"}`, immediately
 * followed by a fresh instance initializing from a URL read that still
 * said `emerald`. Fixed with `hasReceivedLiveUpdate` above — once any real
 * channel event has landed in this module's lifetime, `lastKnownGlobals`
 * is trusted directly and the URL is never consulted again, since the
 * channel listener (synchronous, same-tick) is provably more current than
 * a URL read that can lag by one render. The URL fallback still runs, as
 * originally intended, for the one case it actually protects against: a
 * fresh mount before any channel event has landed at all in this
 * lifetime (e.g. immediately after the module reload the third bug
 * describes).
 *
 * **Third bug, found 2026-08-08 while adding Brand support** (after the
 * two below): `lastKnownGlobals` only stays correct while something keeps
 * updating it — but the module-reload from the first bug doesn't just
 * *risk* going stale, it unconditionally resets `lastKnownGlobals` back to
 * this file's hardcoded default (`{brand: "purple", mode: "light"}`) the
 * instant it happens, and nothing corrects that reset value until the
 * *next* toolbar interaction fires a fresh channel event. Reproduced by
 * toggling Mode while on a component's **Docs** page specifically (not
 * Playground/story — a Docs page embeds one `<Canvas>` per story shown
 * inline, so it hits the reload far more often), then navigating straight
 * to a Foundations page with no further toolbar interaction in between:
 * the Foundations page's fallback bootstraps from the reset default,
 * silently reverting to purple-light regardless of what's actually
 * selected. Fixed (initially) by parsing `location.search` for the
 * bootstrap value instead of trusting `lastKnownGlobals` alone — refined
 * by the fourth bug above to only do so before the first live update
 * lands, rather than on every mount unconditionally.
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
 * hook on story-less (Foundations) pages.
 *
 * **Second bug:** navigating *away* from a Foundations page and back —
 * Foundations → a component story → toggle Mode there → back to
 * Foundations — left the Foundations page showing the *old* mode from
 * before the trip. Root cause: the channel subscription used to live
 * inside this hook's own `useEffect`, so it unsubscribed the instant
 * `ThemeSync` unmounted and only resubscribed on remount — any globals
 * change that happened *while unmounted* was never seen. Fixed by
 * splitting the channel listener out of any single component's lifecycle
 * entirely (`ensureChannelListener` above) — it attaches once and keeps
 * updating `lastKnownGlobals` for as long as the module itself is alive,
 * whether or not anything is currently rendering from it — and having each
 * hook instance separately subscribe/unsubscribe to *notifications* of
 * that cache changing (`subscribers`), which is safe to tear down
 * per-mount since missing a notification just means a re-render is
 * skipped, not that data is lost. This is also what makes the fourth bug's
 * fix safe: a remounting instance re-subscribing to notifications doesn't
 * lose anything, since it reads the always-current `lastKnownGlobals`
 * directly at mount time instead of waiting for the next notification.
 *
 * Unlike `ThemeSync` (a side-effect-only DOM mutation that never itself
 * needs a re-render), this hook returns the value so callers that need it
 * in their own render — e.g. picking a Storybook theme object — can react
 * to it live.
 */
export function useThemeGlobals(context: DocsContextProps): ThemeGlobals {
  const [globals, setGlobals] = useState<ThemeGlobals>(() => {
    if (hasReceivedLiveUpdate) return lastKnownGlobals;
    const fromChannel = readGlobalsFromChannelHistory(context.channel);
    const resolved = { ...lastKnownGlobals, ...fromChannel };
    lastKnownGlobals = resolved;
    return resolved;
  });

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
