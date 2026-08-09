import { addons } from "storybook/manager-api";
import { SET_GLOBALS, UPDATE_GLOBALS } from "storybook/internal/core-events";
import { getSemanticTokens, getStorybookTheme } from "./theme";

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
// **Fifth bug, found 2026-08-09 from a user report** (this file's own
// account of the fourth bug below turned out to be wrong — it assumed the
// stale echo always self-corrects, but that's not true in this direction):
// on a component's Docs page (an attached story, e.g. Button), toggling
// Dark → Light updated the Docs page content correctly but left the
// sidebar/toolbar/panel stuck in dark mode — Light → Dark worked fine.
// Captured every raw channel event during a real dark→light toggle to
// confirm rather than guess: two correct `UPDATE_GLOBALS` events landed
// first (`{mode: "light"}`, then a full-snapshot one also saying
// `"light"`), but a **stale `SET_GLOBALS` echo carrying `{mode: "dark"}`
// arrived last** — with no further correcting event after it, contrary to
// the fourth bug's note below. `applyTheme` trusted `SET_GLOBALS` and
// `UPDATE_GLOBALS` equally, so this stale echo silently won and the
// manager stayed on the dark theme. (The Docs page content itself doesn't
// have this problem: a component page with an attached story reads mode
// synchronously from the story's own context — see
// `readModeFromAttachedStory` in `DbmDocsContainer.tsx` — never from
// accumulated channel events, so it's structurally immune to this race.)
// Root cause: `SET_GLOBALS` isn't the one-time init-only event its own
// name and Storybook's docs imply — on a Docs page with an attached
// `<Canvas>`, it re-fires on every toggle as part of the Canvas
// re-preparing its story (same mechanism documented as the first bug in
// `useThemeGlobals.ts`), and that re-fire can lag behind and arrive after
// the real, live `UPDATE_GLOBALS` for the same change. Fixed by only
// trusting `SET_GLOBALS` for the very first sync (`hasReceivedInitialSync`
// below) — after that, only `UPDATE_GLOBALS` (confirmed live and timely in
// every capture) is allowed to change `lastBrand`/`lastMode`. Applies to
// both Brand and Mode — same channel, same events.
let lastBrand: string | undefined;
let lastMode: string | undefined;
let hasReceivedInitialSync = false;

// The addon panel (Controls/Actions/Interactions/..., `#storybook-panel-root`
// — confirmed via DOM inspection, a stable Storybook-assigned id regardless
// of dock position) has no dedicated Storybook theme variable of its own:
// its background is driven by `appContentBg`, the same variable the Docs
// content wrapper uses (`DbmDocsContainer` passes the same theme object
// there). Setting `appContentBg` to `bg.subtle` to color the panel would
// also recolor every component's Docs page background, which wasn't asked
// for. Scoped `<style>` injection targeting the panel's own id, kept in
// sync with the same brand/mode tracking `applyTheme` already does below,
// is the only way to color just the panel.
let panelStyleEl: HTMLStyleElement | undefined;
function applyPanelBg(brand: string | undefined, mode: string | undefined): void {
  const hex = getSemanticTokens(brand, mode).bg.subtle;
  if (!panelStyleEl) {
    panelStyleEl = document.createElement("style");
    panelStyleEl.id = "dbm-panel-bg-override";
    document.head.appendChild(panelStyleEl);
  }
  panelStyleEl.textContent = `#storybook-panel-root { background: ${hex} !important; }`;
}

addons.setConfig({
  theme: getStorybookTheme(lastBrand, lastMode),
});
applyPanelBg(lastBrand, lastMode);

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
    applyPanelBg(lastBrand, lastMode);
  };
  // Only the first `SET_GLOBALS` is trusted (the real init-time sync) — see
  // the fifth bug above for why every later one is a potentially-stale
  // re-fire that must not be allowed to clobber a value `UPDATE_GLOBALS`
  // already applied.
  channel.on(SET_GLOBALS, (payload) => {
    if (hasReceivedInitialSync) return;
    hasReceivedInitialSync = true;
    applyTheme(payload?.globals);
  });
  channel.on(UPDATE_GLOBALS, (payload) => {
    hasReceivedInitialSync = true;
    applyTheme(payload?.globals);
  });
});
