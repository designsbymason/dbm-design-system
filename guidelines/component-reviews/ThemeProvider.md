# ThemeProvider

**Tier:** Atom · **Category:** Utility · **Finalized:** ✅ 2026-09-10

## Review pass (2026-09-10)

Full `06-engineering-standards.md` §9 pass — first review for this component. Findings, in the
order fixed (Playground-missing first, Docs-page-missing last, per the standing reporting
convention):

1. **No Playground story existed.** `ThemeProvider.stories.tsx` previously had five plain
   `args`-driven stories (`PurpleLight`/`PurpleDark`/`EmeraldLight`/`EmeraldDark`/`SystemMode`, none
   with a custom `render`) plus a fully-bespoke `LiveThemeToggle`, but no dedicated `Playground` and
   no `argTypes` at all in `meta` — every prop rendered with an auto-inferred control, no
   descriptions, no default-value summaries. Added a full `argTypes` map (`brand`/`mode` as real,
   described `select` controls; `children`/`id`/`className`/`style`/`data-testid` correctly
   `control: false`) and `meta.args` given explicit `brand: "purple", mode: "system"` defaults
   (matching the real component defaults) so the new `Playground` — `export const Playground: Story
   = {};`, no custom render needed since the five existing stories already worked entirely through
   plain `args` — opens with real, live, interactive controls instead of inert placeholders.

2. **A real, confirmed correctness bug: `id`/`className`/`style`/`data-testid` were never
   redeclared on `ThemeProviderProps`**, relying only on the inherited
   `ComponentPropsWithoutRef<"div">` — the same docgen-drops-inherited-native-props gap already
   found and fixed on `Button`/`Portal`/`FocusTrap`/others (`05-component-api-conventions.md` §3).
   Confirmed live: before the fix, none of the four appeared in the Docs page's own Properties
   table. Fixed by explicitly redeclaring all four with their own JSDoc, matching this system's
   established wording for a `display: contents` wrapper component.

3. **A real, previously-latent (if low-severity) bug found reading the implementation, not
   guessed: `{...props}` spread onto the wrapper `<div>` *after* the component's own computed
   `data-theme` attribute**, so a stray consumer-supplied `data-theme` prop — allowed through by
   TypeScript's own special-cased JSX handling of `data-*` attributes, even though it isn't part of
   `ThemeProviderProps` — would silently win via plain object-spread ordering, the same class of
   "never let a same-named consumer prop override the computed value" bug this system's own review
   checklist already watches for (found previously on `IconButton`'s `aria-busy`). Confirmed this
   never affected the *real* theming mechanism itself (driven entirely by
   `document.documentElement`'s own `data-theme`, set independently in a layout effect) — only the
   wrapper element's own, otherwise-redundant attribute — but still a real, confusing inconsistency.
   Fixed by spreading `props` first. Added a permanent regression test
   (`"never lets a same-named consumer prop override the computed data-theme attribute"`,
   `ThemeProvider.test.tsx`, 14/14 passing, up from 13).

4. **A genuinely novel architectural finding, confirmed live before deciding how to handle it, not
   assumed: `ThemeProvider` sets `document.documentElement.dataset.theme` — the exact same mechanism
   this Storybook install's own global toolbar decorator (`preview.tsx`'s `withTheme`) uses to apply
   the Brand/Mode toolbar selection.** Confirmed two distinct, real consequences: (a) toggling the
   toolbar's own Mode selector *while a `ThemeProvider` story is already mounted* silently overrides
   that story's own explicit `mode` prop — the Controls panel kept showing `mode: "light"` while the
   canvas visibly went dark, a genuine display/reality mismatch (root-caused: the decorator's
   synchronous, render-time assignment always runs on every re-render, but `ThemeProvider`'s own
   `useIsomorphicLayoutEffect` only re-fires when its own `theme` dependency changes — a toolbar-only
   change doesn't touch that dependency, so the decorator's freshly-written value is left standing
   until something else changes the story's own args); (b) more significantly, since a Docs page
   composes every embedded `<Canvas>` into one shared document (the same architecture already
   root-caused during `Portal`'s own review), a `<ThemeProvider>` Canvas embedded there doesn't just
   affect its own box — it overrides `document.documentElement` for the *entire* Docs page (every
   other Callout, the Properties table, code blocks) for as long as it stays mounted, silently
   overriding the toolbar's own selection for the whole page, confirmed live by toggling the
   Playground's own `mode` control and watching the Properties table section (well outside the
   Playground's own Canvas) flip to dark along with it. Unlike `Portal`'s own DOM-escape issue (a
   pure Storybook-architecture artifact with no real-app equivalent), this is **not a bug to route
   around** — it's an accurate demonstration of `ThemeProvider`'s actual, real-world behavior (one
   provider, document-wide, no exceptions). Handled accordingly, not by disabling anything:
   - The `Playground` **stays embedded** (real, working, and it's the whole point of a Playground)
     with a prominent `Callout` directly above it, written *before* a reader would touch the
     controls, explaining plainly that this is real, intended, document-wide behavior — not a
     Storybook glitch — and pointing to the toolbar's own selector to restore their preferred
     reading theme afterward.
   - The **Variants section embeds nothing** — mounting more than one `ThemeProvider` at once (the
     five brand/mode demos, plus `LiveThemeToggle`) would have them silently fight over the same
     `document.documentElement` among themselves, independent of the toolbar issue (last-mounted
     wins, the same pattern already established for `Portal`'s `Default`/`AsChild`) — replaced with
     a single explanatory `Callout` linking out to each standalone story page, where each renders
     correctly with nothing else competing for the document. `LiveThemeToggle` is included in that
     same link list rather than embedded, for the identical reason.

5. **Each of the five brand/mode variant stories, plus `LiveThemeToggle`, correctly dash `brand`/
   `mode`'s Controls-panel entries** (`disableAllAxes`, matching the established
   `07-storybook-and-documentation-standards.md` §5 convention) — each is a static, named reference
   to one exact combination (or, for `LiveThemeToggle`, a fully bespoke demo that ignores `args`
   entirely), so a live control there would either contradict the story's own point or silently do
   nothing. Live-verified: all controls show `-` on every one of the six.

6. **Docs page added** (`ThemeProvider.mdx`) — the fourth Docs page in the Utility category (after
   `ClientOnly`, `FocusTrap`, `Portal`), full 10-section template. A real, self-caught bug during
   first render: the Playground's own explanatory `Callout` was authored with `tone="warning"`,
   which doesn't exist on this system's `Callout` block (`CalloutTone` is only
   `"success" | "danger" | "info"`) — crashed the whole Docs page (`Cannot read properties of
   undefined (reading 'bg')`) on first load, caught immediately via the required live-verification
   pass (not shipped), fixed to `tone="info"`. **Related components** links to `Foundations/Color`
   (the token reference this component switches between) rather than another atom, since no sibling
   component has an obviously closer relationship — confirmed this is a legitimate target for
   `RelatedCard`'s own `href` (full `/?path=/docs/...` form, matching every other component's own
   `RelatedCard` usage).

## Verification

`tsc --noEmit` (main package build via `tsup`'s `.d.ts` generation, and `.storybook`), `eslint`
(whole package, zero warnings), full `vitest` unit suite (1065/1065 passing across the whole
package, 14/14 for `ThemeProvider` itself, up from 13), `tsup` build, and the `@storybook/addon-vitest`
Storybook test project (`pnpm test:storybook`, 371/371 across all 50 component story files,
including `ThemeProvider`'s own new stories) all run and passing. `pnpm build-storybook`, `pnpm
check-component-bundle-size` (`ThemeProvider` at 0.80KB JS / 0.17KB CSS, well within budget), and
`pnpm check-foundations-token-coverage` all clean.

Live-verified in a running Storybook instance: the Properties table shows all 7 props (including the
newly-redeclared `id`/`className`/`style`/`data-testid`) with correct descriptions/defaults; the
Playground's `brand`/`mode` controls genuinely drive the canvas (confirmed via `document.documentElement`'s
own `data-theme` attribute, not just visual inspection) and — deliberately, per finding 4 — the whole
surrounding Docs page too; every Variants-section link navigates to a standalone story that renders
its own exact brand/mode combination correctly, with `data-theme`/`--dbm-bg-brand` confirmed via
direct computed-style inspection on `Emerald Dark`; `LiveThemeToggle`'s `useTheme()` readout updates
live and the transition genuinely eases the surface's colors on toggle; zero console errors on a
fresh load (after the `tone="warning"` fix); both brand themes × both color modes confirmed via the
toolbar on the Docs page itself (dark mode, Emerald brand, both correct) before any `ThemeProvider`
Canvas had been interacted with. The live Accessibility panel couldn't be independently re-verified
this session — the same standing environmental limitation already documented in `Portal.md`/
`Tooltip.md` (`ADR-0003`'s `pnpm test:storybook:watch` requires a persistent process this
non-interactive session can't sustain; confirmed again here, the watcher still exits after one run
under `nohup`/`disown`) — covered instead by the `jest-axe` unit test (`"has no accessibility
violations"`, part of the 14/14 passing).

No prior `component-reviews/` entry existed for this component (first pass).

## Post-review fix: demo surfaces used neutral tokens, invisible to a brand change (2026-09-10, same day, user-reported)

User report: the `Demo`/`ResolvedThemeReadout` boxes used across every story
(`--dbm-bg-surface`/`--dbm-border-default`/`--dbm-text-primary`) are neutral/surface tokens — they
correctly flip with color *mode* (light/dark) but are deliberately gray in both brands, so toggling
*brand* (purple vs. emerald) produced no visible change at all in the one demo surface meant to
prove the theme was actually applying — a real gap for a component whose whole job is demonstrating
brand + mode together.

**Fix:** swapped every demo surface (`Demo`, `ResolvedThemeReadout`) from neutral to real brand
tokens — `background: --dbm-bg-brand-subtle`, `border: --dbm-border-brand`,
`color: --dbm-text-brand` — so `Purple Light` vs. `Emerald Light` (and every other story) now
visibly differ, not just light vs. dark. `LiveThemeToggle`'s own two toggle buttons (previously
unstyled native `<button>`s) got the same treatment, plus a genuine `:hover` state via
`--dbm-bg-brand-subtle-hover` (a new small `ToggleButton` wrapper, `onMouseEnter`/`onMouseLeave`
swapping the background) — the only interactive elements in any of these stories, so the only place
a real hover state makes sense.

Live-verified: `Purple Light` and `Emerald Light` now render visibly distinct box colors (purple vs.
green background/border/text) side by side. The hover state's own correctness was verified via a
scratch Vitest/RTL test (`fireEvent.mouseEnter`/`mouseLeave` correctly swapping the background) since
this environment's browser automation doesn't reliably synthesize a real `mouseenter` transition
across the Storybook preview's iframe boundary — not a component bug, confirmed by the passing test
using the exact same event-handler code. Full suite re-run clean: `eslint`, `tsc`, 1065/1065 unit
tests (unchanged — story-only change), `tsup` build, `addon-vitest` 371/371.

**Same-day follow-up, user-directed:** `LiveThemeToggle`'s two toggle buttons — hand-rolled above,
approximating the primary-button look with custom inline styles/hover state — replaced with the
real `Button` component (`variant="primary"`), matching the established precedent of importing a
sibling atom into another component's own story file for demo UI (`Tooltip.stories.tsx`'s own
`Button`/`IconButton` triggers). Removes the custom `ToggleButton`/`toggleButtonStyle`/
`toggleButtonHoverStyle` code entirely — real button styling (including its own hover/focus/active
states) now comes from `Button` itself, staying in sync automatically if that component's own
styling ever changes, rather than a second, hand-maintained approximation. Live-verified: both
buttons render with real primary-button styling, click still toggles brand/mode correctly, colors
update correctly in both brands. Full suite re-run clean: `eslint`, `tsc`, 1065/1065 unit tests,
`tsup` build, `addon-vitest` 371/371, `check-component-bundle-size` (`ThemeProvider` unchanged at
0.80KB/0.17KB — a story-only change never affects the shipped package).

## Post-review fix: the embedded Playground produced a genuinely broken split-theme page, not just an accurate-but-surprising one (2026-09-10, same day, user-reported)

User report: toggling the embedded Playground's `mode` control on the Docs page left the page
**hard to read** — not a clean whole-page light/dark flip as the previous write-up (above) claimed,
but a jarring split state (screenshot confirmed this directly).

**This correction matters, not just the fix:** the review pass above characterized the embedded
Playground's document-wide side effect as "accurate, real behavior... not a bug to route around."
That was wrong, or at least incomplete. Root-caused properly this time, not re-asserted: this Docs
page's own surrounding chrome (background, headings' `color`) is themed through **two independent
mechanisms** that normally stay in sync but don't have to. (1) `--dbm-*` custom properties — what
`Callout`, code blocks, and any embedded `Canvas` actually use — resolve from
`document.documentElement`'s own `data-theme`. (2) `.sbdocs-wrapper`'s own background and Storybook's
default heading `color` (docs.css's own `h1`/`h2`/`h3` rules never set `color` — that property comes
from Storybook's *own* base docs typography, sourced from `DbmDocsContainer`'s `getStorybookTheme
(brand, mode)`, which reads the **toolbar's globals directly**, never `document.documentElement`).
The `withTheme` decorator (`preview.tsx`) is the only thing that normally keeps these two in
agreement — it runs on every story render and sets `document.documentElement` to match the toolbar.
`ThemeProvider`'s own effect, mounted inside the embedded Playground, overwrote that independently,
on every control interaction, with no corresponding update to the toolbar globals mechanism (2)
reads. Result, confirmed via direct `getComputedStyle` inspection, not assumed: paragraph text
(reactive tokens) flipped to a dark-mode-appropriate light color while the H2 heading (Storybook's
own frozen-to-toolbar color) stayed at its light-mode dark color — and the surrounding chrome
background stayed light too — producing washed-out, low-contrast text next to (not blended with)
`ThemeProvider`'s own correctly-dark demo boxes. **This is a real Docs-page architecture bug, not an
accurate preview of the component** — a real app has no second, independently-themed chrome layer
running in parallel, so this split simply can't happen there.

**Fix — the Playground is no longer embedded on this page at all**, following the same
Callout-and-link pattern already used for the Variants section (which needed no change — it already
linked out, for the closely related "multiple simultaneous instances fight over
`document.documentElement`" reason). The Playground's own Callout now explains the *real* mechanism
(the two-theming-systems conflict above) and links to
`/story/atoms-utility-themeprovider--playground`, where none of this applies — the standalone story
view has no parallel `DocsContainer`-driven chrome layer to fall out of sync with. This makes
`ThemeProvider` a deliberate, one-off, documented exception to the standing "every component embeds
a working Playground" rule — called out explicitly in the page's own intro, so a future reader
doesn't mistake the absence for an oversight.

**A second, self-inflicted bug found and fixed in the process of removing the embedded Canvas:**
with zero `<Canvas>`/`<Story>` blocks left anywhere on the page, the `withTheme` decorator — which
only runs when an actual story renders — stopped running for this Docs page at all, leaving
`document.documentElement`'s `data-theme` at whatever stale value was last set by wherever the reader
navigated from (confirmed live: the page's own "Atom" tier badge rendered as unstyled plain text,
`--dbm-bg-brand` and friends resolving to nothing, `data-theme` genuinely absent from the element).
This is the exact same class of gap already root-caused and fixed for Foundations pages (which have
never had an attached story to trigger the decorator) — `ThemeSync` (`.storybook/blocks/foundations/
ThemeSync.tsx`), a tiny component that subscribes to the toolbar's own globals-change channel and
applies `document.documentElement.dataset.theme` directly, independent of any story rendering.
Reused directly rather than reinvented — `ThemeProvider.mdx` now renders `<ThemeSync />` once, right
after `<Meta of={ThemeProviderStories}/>`, the identical placement every Foundations page already
uses.

Live-verified end to end: the Docs page's own "Atom" badge, Callout, and every other token-styled
element render correctly on load; toggling the toolbar's **Mode**/**Brand** selectors now flips the
*entire* page consistently (chrome and components together, confirmed both ways); navigating
`ThemeProvider`'s own standalone stories (toggling brand/mode there) and back to *any* Docs page
(this component's own, and a different component's) correctly reflects the toolbar's real, current
value with no leftover leakage, addressing the second half of the user's own request directly. Zero
console errors on a genuinely fresh tab (the `Canvas`-undefined errors seen mid-edit were confirmed
stale — a fresh tab load showed none). Full suite re-run clean: `eslint`, `tsc`, 1065/1065 unit tests
(unchanged — a Storybook/MDX-only fix), `tsup` build, `addon-vitest` 371/371, `build-storybook`,
`check-component-bundle-size` (unchanged at 0.80KB/0.17KB), `check-foundations-token-coverage`.

## Post-review polish: shorter Docs-page messaging (2026-09-10, same day, user-directed)

User-directed simplification, not a bug fix: the Intro/Playground/Variants Callouts explaining *why*
nothing is embedded were judged too long for a page whose reader mostly just wants the link. Trimmed
to a one-line title-only Callout in the Intro (removed the body sentence entirely — the title alone
already says "not embedded here"), and a short one-sentence lead-in before the link in both
Playground ("`ThemeProvider` controls the whole document's theme, so its Playground lives on a
dedicated story page instead of being embedded here.") and Variants ("Each brand/mode combination is
its own standalone story:"). The full *why* (the two-independent-theming-systems root cause) stays
recorded here and in `07-storybook-and-documentation-standards.md` §4.1 — this is a reader-facing
trim, not a loss of the underlying documentation. Live-verified: all three sections render correctly,
`tsc`/`eslint`/`test:storybook` clean.

**Considered and accepted, no fix needed (user confirmed "all good," 2026-09-10):** a live user
report asked whether the demo box's background was incorrectly rendering as the canvas's own
background in dark mode. Verified directly via computed token values, not visual impression alone —
`bg.surface` (`#2c2a34`) and `bg.brand-subtle` (`#24222a`) in `purple-dark` are two genuinely
different, correctly-applied values; the canvas never actually becomes `bg.brand-subtle`. The
*appearance* of blending is real, though: an 8-unit-per-channel delta reads as visually distinct in
light mode (`#ffffff` vs `#f9f9ff`, next to a visible border) but is much harder to perceive in dark
mode, where human contrast sensitivity is lower for small luminance deltas at low lightness. Not a
functional bug — confirmed no token is misapplied — a minor, accepted contrast tradeoff in the demo
stories' own presentation, not in the component or the real token pairing itself.

## Final review (2026-09-10)

A full top-to-bottom re-pass of the checklist before finalizing, after every post-review fix above
was in place. No new findings — everything checked out:

- **Baseline correctness**: `ThemeProvider.tsx` re-read fresh — the `{...props}`-first ordering fix
  and the nesting/restore logic both unchanged and correct since their own fixes.
- **Playground defaults**: `meta.args` (`brand: "purple", mode: "system"`) matches the real
  `@default 'purple'`/`@default 'system'` documented on both props and the Properties table's own
  `Default` column — no mismatch (specifically checked for the exact class of bug `FocusTrap`'s own
  final review caught; none found here).
- **Controls wiring**: `Playground`'s controls genuinely drive its own canvas (confirmed via
  `document.documentElement`'s own `data-theme`, not just visual inspection); all five `Variant`
  stories plus `LiveThemeToggle` correctly show `-` for `brand`/`mode` — re-spot-checked
  `PurpleDark`/`EmeraldLight`/`SystemMode` live in a fresh tab, all render their own correct
  combination.
- **Accessibility**: zero violations via `jest-axe` (`ThemeProvider.test.tsx`, 14/14 passing). The
  live Accessibility panel couldn't be independently re-checked this session — the same standing
  environmental limitation already documented in `Portal.md`/`Tooltip.md` (`ADR-0003`'s
  `pnpm test:storybook:watch` requires a persistent process this session can't sustain) — covered
  instead by the `jest-axe` suite.
- **Responsiveness**: mobile viewport (375px) checked live on the Docs page, including the
  now-shortened Playground/Variants sections specifically — zero horizontal overflow on the page
  itself (the Properties table's own internal `overflow-x` scroll container behaves as designed,
  confirmed via direct DOM measurement, not just visually).
- **Theming**: `ThemeSync` confirmed still correctly syncing the Docs page's own chrome to the
  toolbar on a fresh load (the "Atom" badge and every other token-styled element render correctly,
  not unstyled) — this is the component whose own review found and fixed that exact class of gap, so
  it's the one most worth re-confirming on a final pass.
- **Console**: zero errors on a genuinely fresh tab.
- **Full suite**: `tsc`, `eslint`, `tsup` build, 1065/1065 unit tests, `addon-vitest` 371/371,
  `build-storybook`, `check-component-bundle-size` (unchanged, 0.80KB/0.17KB),
  `check-foundations-token-coverage` — all re-run clean.

## Finalized

**2026-09-10** — confirmed by the user after a full top-to-bottom final review pass covering every
checklist section: baseline correctness (the `{...props}`-first ordering fix and the nesting/restore
logic both re-verified), feature-completeness (`brand`/`mode`/`useTheme()` cover the standard
surface against comparable production theming libraries, the SSR first-paint tradeoff documented
rather than "fixed" since a fully flash-free experience needs a blocking pre-hydration script outside
this component's own control), accessibility (zero `jest-axe` violations, 14/14 tests passing;
`Playground`'s own live a11y panel blocked only by the standing, documented `ADR-0003` environmental
limitation, not a real gap), responsiveness (mobile viewport spot-checked, including the shortened
Playground/Variants sections), theming (`ThemeSync` reconfirmed correctly syncing the Docs page's own
chrome to the toolbar), and functional verification (`tsc`, `eslint`, full 1065-test suite, `tsup`
build, `addon-vitest`, `build-storybook`, bundle-size and foundations-token-coverage checks all
clean).

This review surfaced and fixed real, independent issues beyond the initial pass — a Properties-table
docgen gap (`id`/`className`/`style`/`data-testid` never redeclared), a props-spread-ordering
correctness bug, hand-rolled demo styling replaced with real design-system tokens and the real
`Button` component, and — the most significant — a genuinely broken split-theme Docs page from the
embedded Playground, root-caused to two independent theming systems falling out of sync, fixed by
not embedding any live demo on the Docs page at all (a deliberate, documented, one-off exception to
the standard template) plus reusing `ThemeSync` to fix a second bug that removing the last `Canvas`
exposed. Each fix was verified live in a running Storybook instance, including a live user report
that caught the split-theme bug directly and a follow-up user report that was investigated and
confirmed *not* a bug (a dark-mode contrast tradeoff, verified via actual token values). No further
changes without asking first, per `06-engineering-standards.md` §9's finalization rule.

## Post-finalization fix (2026-09-12, authorized)

`ThemeProvider.test.tsx` carried a stale `@ts-expect-error` on the "never lets a same-named consumer
prop override the computed `data-theme` attribute" test, flagged as an unused-directive `tsc` error
during Grid's own final review pass (an unrelated component's pre-existing error, flagged not fixed
there). Root cause: TypeScript's JSX handling permits any `data-*` attribute on any component
regardless of its declared prop type, so `<ThemeProvider data-theme="...">` was never actually going
to error — the directive was mistaken from the start, not a later regression. Fixed by removing the
directive and correcting the comment to explain the real JSX behavior instead of claiming a type
error is expected. Re-verified: `tsc --noEmit` clean, the test itself still passes (full `vitest`
unit suite 1070/1070), confirming this was a comment/directive correction with zero change to actual
test behavior. Per the finalization re-check test (§9): a defect fix (an incorrect type-level
assumption) — **stays finalized**, no re-review needed.
