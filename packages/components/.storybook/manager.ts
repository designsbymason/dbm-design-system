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

// The Settings gear renders as Storybook's bare/ghost icon-button style
// (transparent, no border, 4px radius) while "Create a new story" right
// next to it — same 32x32 footprint — renders as Storybook's filled
// style, driven by the `buttonBg`/`buttonBorder` theme vars `theme.ts`
// already sets from `bg.subtle`/`border.default`. Storybook doesn't
// expose a per-button style override, so this reproduces that filled
// look on the gear by hand: `bg.subtle` fill plus an inset box-shadow in
// `border.default` (confirmed via computed styles that Storybook renders
// `buttonBorder` as an inset shadow, not an actual border edge, on this
// button). `10px` radius is likewise copied from the neighbor's computed
// style rather than `radius.md` (8px) directly — Storybook pads button
// radius above `appBorderRadius` internally, and matching the sibling's
// rendered value exactly was simpler than reverse-engineering its offset.
//
// Below the mobile breakpoint, Storybook swaps the sidebar for a
// bottom-sheet drawer with a *different* React tree for this same row:
// `button[aria-label="Settings"]` is replaced by
// `a[aria-label="About Storybook"]` (still a gear glyph, just a link to
// `/settings/about` instead of a dropdown toggle) sitting next to a
// `button[aria-label="Close menu"]` — confirmed via DOM inspection at the
// mobile viewport, there is no `button[aria-label="Settings"]` in that
// tree at all, not merely a hidden one. Styling it identically here so
// the mobile version reads as the same control.
let gearButtonStyleEl: HTMLStyleElement | undefined;
function applyGearButtonStyle(brand: string | undefined, mode: string | undefined): void {
  const tokens = getSemanticTokens(brand, mode);
  if (!gearButtonStyleEl) {
    gearButtonStyleEl = document.createElement("style");
    gearButtonStyleEl.id = "dbm-gear-button-style";
    document.head.appendChild(gearButtonStyleEl);
  }
  gearButtonStyleEl.textContent = `
    button[aria-label="Settings"],
    a[aria-label="About Storybook"] {
      background: ${tokens.bg.subtle};
      border-radius: 10px;
      box-shadow: ${tokens.border.default} 0px 0px 0px 1px inset;
    }
  `;
}

// Storybook renders `brandImage` inside a flex anchor that fills the full
// sidebar-header width but left-aligns its content by default — centers
// it instead. Targets the anchor by its `title` attribute (set from
// `brandTitle`, a real HTML attribute) rather than an emotion-hashed
// class, since those are regenerated per build and not a stable selector.
// That alone still left the logo off-center (confirmed via computed
// styles): Storybook's own class on the anchor's *wrapping* div sets
// `margin-right: 20px`, with no matching left margin, so the wrapper's
// box itself was never symmetric within the header to begin with —
// `justify-content: center` was correctly centering the image inside a
// lopsided box. `div:has(> a[title="DBM Design System"])` targets that
// wrapper without an emotion-hashed class (`:has()` is the only way to
// select an ancestor by its child in CSS).
//
// Also relocates the Settings gear from the brand row down onto the
// search row, next to "Create a new story" (requested 2026-08-11, after
// the logo made the brand row visually heavy on its own). Storybook's
// theme/manager API has no option for this — it's a fixed part of the
// sidebar chrome — so this is a CSS-only reposition, not a DOM move: the
// gear button stays exactly where React put it in the tree (moving a
// React-owned node with raw DOM calls would fight React's own
// reconciliation on the next re-render), it's just painted elsewhere.
// `[role="search"]` (Storybook's own landmark role on the search row) and
// `button[aria-label="Settings"]` are both real, stable attributes, not
// emotion-hashed classes. The `calc(100% + 16px)` top offset matches the
// `gap: 16px` Storybook already applies between the two rows via their
// shared flex-column parent (confirmed via computed styles), so this
// stays correct even if the brand row's own height changes; the 38px
// reserved on the search row is the gear's 32px plus a 6px gap — matching
// the row's own native gap between the search input and "Create a new
// story" (confirmed via computed styles), so the gear reads as evenly
// spaced from its neighbor instead of sitting closer or further than the
// input-to-"+" gap.
//
// Mobile drawer (requested 2026-08-11): the same relocation, applied to
// `a[aria-label="About Storybook"]` (see `applyGearButtonStyle` above for
// why that's the mobile equivalent of the Settings button) instead of
// `button[aria-label="Settings"]`. Its own "Create a new story" is 36px
// here (not 32px), so the reserved space is 42px (36 + the same 6px
// native gap, confirmed via computed styles at the mobile viewport) —
// `body:has(...)` distinguishes the two cases without an arbitrary
// max-width breakpoint guess, since Storybook renders one selector or the
// other, never both, and `body` is a stable selector root either way.
//
// The drawer's own "Close menu" button is enlarged (36px -> 44px box,
// 14px -> 18px icon, matching proportions) and pinned 8px from the
// drawer's own top-right corner — relative to `.sidebar-header` (already
// `position: relative` above), since that header row is the top of the
// drawer's own content, not the persistent page toolbar above it.
const brandChromeStyleEl = document.createElement("style");
brandChromeStyleEl.id = "dbm-brand-chrome-overrides";
brandChromeStyleEl.textContent = `
  a[title="DBM Design System"] { justify-content: center; }
  .sidebar-header div:has(> a[title="DBM Design System"]) { margin-right: 0; }
  .sidebar-header { position: relative; }

  body:has(button[aria-label="Settings"]) [role="search"] { padding-right: 38px; }
  button[aria-label="Settings"] {
    position: absolute;
    top: calc(100% + 16px);
    right: 0;
  }

  body:has(a[aria-label="About Storybook"]) [role="search"] { padding-right: 42px; }
  a[aria-label="About Storybook"] {
    position: absolute;
    top: calc(100% + 16px);
    right: 0;
  }

  button[aria-label="Close menu"] {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 44px;
    height: 44px;
  }
  button[aria-label="Close menu"] svg {
    width: 18px;
    height: 18px;
  }
`;
document.head.appendChild(brandChromeStyleEl);

addons.setConfig({
  theme: getStorybookTheme(lastBrand, lastMode),
});
applyPanelBg(lastBrand, lastMode);
applyGearButtonStyle(lastBrand, lastMode);

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
    applyGearButtonStyle(lastBrand, lastMode);
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
