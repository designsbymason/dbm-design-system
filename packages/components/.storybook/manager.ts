import { addons } from "storybook/manager-api";
import { SET_GLOBALS, UPDATE_GLOBALS } from "storybook/internal/core-events";
import { getStorybookTheme } from "./theme";

// Manager UI chrome (sidebar/toolbar/addon panels) runs outside the preview
// iframe, so it can't read the Brand/Mode toolbar globals via a decorator
// the way previewed components do (see `withTheme` in preview.tsx) — it has
// to listen on the addons channel instead. `SET_GLOBALS` fires once on
// preview init with the full globals object; `UPDATE_GLOBALS` fires on
// every toolbar interaction but only carries the *changed* keys (confirmed
// via `storybook/internal/core-events`) — so `lastBrand`/`lastMode` track
// the running values across events rather than assuming a payload carries
// both. Verified live (no reload needed) with a throwaway high-contrast
// theme before wiring up the real palettes — `addons.setConfig()` is safely
// re-callable after boot; it emits `SET_CONFIG` on the channel, which the
// manager's own store already listens for and re-derives `state.theme`
// from (confirmed by reading `manager-api`'s compiled source, not just its
// `.d.ts`).
//
// On a docs page with an attached story (a component's `ComponentName.mdx`,
// which embeds a `<Canvas>`), a fast double-toggle can produce a *transient*
// flash back to the previous theme: logging every raw event during a rapid
// dark→light toggle showed the correct `UPDATE_GLOBALS {mode: light}`
// arrive and apply correctly, immediately followed by a **stale**
// `SET_GLOBALS` echo still carrying `{mode: dark}` (an async round-trip
// lagging behind, from the Canvas re-preparing its story) — which briefly
// re-applies dark — before a final, correcting `UPDATE_GLOBALS` (this one
// carrying the full globals snapshot) arrives a moment later and settles on
// the right theme. Confirmed this always self-corrects within roughly a
// couple hundred milliseconds without any special handling; not worth a
// debounce given the last event in this codebase's toolbar interaction
// pattern always ends up applying the true current value. The same
// reasoning applies to Brand, added later — same channel, same events.
let lastBrand: string | undefined;
let lastMode: string | undefined;

addons.setConfig({
  theme: getStorybookTheme(lastBrand, lastMode),
});

addons.ready().then((channel) => {
  const applyTheme = (globals?: Record<string, unknown>) => {
    if (!globals) return;
    let changed = false;
    if (typeof globals.brand === "string" && globals.brand !== lastBrand) {
      lastBrand = globals.brand;
      changed = true;
    }
    if (typeof globals.mode === "string" && globals.mode !== lastMode) {
      lastMode = globals.mode;
      changed = true;
    }
    if (!changed) return;
    addons.setConfig({ theme: getStorybookTheme(lastBrand, lastMode) });
  };
  channel.on(SET_GLOBALS, (payload) => applyTheme(payload?.globals));
  channel.on(UPDATE_GLOBALS, (payload) => applyTheme(payload?.globals));
});
