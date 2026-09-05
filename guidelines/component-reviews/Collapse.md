# Collapse — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-05. Core implementation was already
sound (correct tokens, `forwardRef`, controlled/uncontrolled parity via Radix `Collapsible`, zero
hardcoded values) — findings covered documentation completeness, Storybook coverage, and two named
feature-completeness gaps (`asChild`, horizontal orientation) approved unconditionally, including
both judgment calls.

**Fixed:**
- No Playground story existed — added, fully `args`-driven, with every prop given an explicit
  `argTypes` entry so the rendered Properties table has a real description/default for every row.
  `trigger` (a `ReactElement`, not a primitive) uses `argTypes.mapping` against a small curated set
  of options, matching `Tag`'s own `leadingIcon`/`trailingIcon` pattern.
- `children`/`open`/`defaultOpen`/`onOpenChange`/`disabled` had minimal or no JSDoc; `trigger` and
  `id`/`className`/`style`/`data-testid` weren't declared with JSDoc at all (or, for the native
  props, not redeclared on `CollapseProps`) — full JSDoc added to every prop, matching the standard
  wording/gap-closing pattern established on `Tag`/`Avatar`/`Switch`/`Indicators`.
- No dev-mode warning for `disabled` set without a `trigger` (there's nothing else in the component
  for it to disable) — added, following `Tag`'s/`ProgressBar`'s own warn-once-per-mount pattern
  (`hasWarnedDisabledNoTriggerRef`).
- **`asChild` support.** *(Judgment call, approved.)* Unlike `Affix` — which had to hand-roll its own
  `Slot`-based wrapper since its root isn't already a Radix primitive — `CollapsiblePrimitive.Root`
  already extends `PrimitivePropsWithRef<"div">`, which natively includes `asChild` (confirmed by
  reading `@radix-ui/react-primitive`'s own compiled types). Two real bugs surfaced while wiring it
  up, both caught by the test suite before being reported fixed:
  - **`React.Children.only` crash.** The original `{trigger && <Trigger/>}{content}` JSX produced a
    real children *array* (`[false, content]`) whenever `trigger` was absent — `&&` on a falsy value
    still leaves a literal `false` in the array, and Radix `Slot`'s internal `Children.only` check
    throws on anything but a genuine single element, even though `false` renders as nothing. Fixed by
    restructuring into one ternary expression (`{trigger ? (<>...</>) : content}`) so the children
    value is a real single element whenever `asChild` might apply.
  - **Incomplete flattening.** `asChild` on Root alone only merged Root's own wrapper onto its single
    child (`CollapsiblePrimitive.Content`), leaving Content's own `<div>` still wrapping the real
    user element underneath — confirmed live via a temporary debug test showing the rendered output
    was `<div (root+content props)><section>…</section></div>`, not the bare `<section>` a consumer
    asking for "no wrapper" would expect. Fixed by chaining `asChild` through *both* Root and
    Content — each layer's own `Slot` merges its props onto its single child in turn, a well-
    established Radix composition pattern, confirmed empirically (the final `<section>` correctly
    carries every layer's classes/`data-state`) rather than assumed from the pattern's reputation
    alone.
  - `trigger` and `asChild` are mutually exclusive (the root element would need two children where
    Radix `Slot` requires exactly one) — `trigger` wins, `asChild` is silently ignored, with a
    dev-mode warning (`hasWarnedAsChildWithTriggerRef`), rather than crashing or picking an
    unpredictable behavior.
- **Horizontal orientation.** *(Judgment call, approved.)* Added `orientation?: "horizontal" |
  "vertical"` (default `"vertical"`) — matching the naming precedent already established by
  `Indicators`' own `orientation` prop (not `Affix`'s `axis`, which is specifically about sticky-
  positioning direction, not content-flow orientation). Radix's `Collapsible.Content` already
  exposes `--radix-collapsible-content-width` alongside the existing `--radix-collapsible-content-
  height` (confirmed via `grep` on the compiled bundle), so no extra JS/`ResizeObserver` work was
  needed — a mirrored `slideRight`/`slideLeft` keyframe pair animates `width` the same way
  `slideDown`/`slideUp` already animated `height`. `.horizontal` additionally sets `display: inline-
  block` (`.vertical` needs no equivalent override) — a block-level element still visually respects
  an animated `width`, but keeps stretching back to the parent's full width regardless of the
  animation unless sized to content instead, which would read as a broken/no-op collapse.
- Docs page (`Collapse.mdx`) built to the full template — visually verified section by section in a
  running Storybook instance (Playground, the Properties table's full prop list, all 5 gallery
  stories, both Do/Don't Callouts, the Accessibility Callout, the Design tokens section, both
  RelatedCards — Button, Text), TOC confirmed showing all 10 sections in order.
- New `AsChild` story against a genuine `<ul>`/`<li>` list (the concrete motivating use case, not a
  generic `<div>` standing in for one) and a new `Horizontal` story (a sidebar-shaped panel growing
  sideways from its trigger). Both, plus a new `play`-function `ToggleInteraction` story (click +
  keyboard Enter activation, `aria-expanded` assertions), verified live — Interactions panel showed
  8/8 steps passing, Accessibility panel showed 0 violations / 10 passes.

**Two Storybook `Controls`-panel dead-panel gaps, caught before they shipped:** `open` (control:
`false`, paired with a live `defaultOpen` — the same controlled/uncontrolled pattern already
established on `Switch`) and `asChild` (control: `false`, dedicated story instead) — toggling either
in the generic Playground demo shape wouldn't cleanly demonstrate what the prop actually does,
matching `Affix`'s own precedent for exactly this class of prop.

**Live-verified beyond the automated suite:** Playground toggle (open/close, height transition);
Horizontal orientation (sidebar-shaped panel growing sideways, not stacked below); AsChild against a
real `<ul>`/`<li>` list, with the rendered DOM inspected directly (`container.querySelector` in
tests, and live via `iframe.contentDocument` in the browser) confirming the middle `<li>` itself
carries every layer's classes and `data-state` with no wrapper `<div>` in between; dark mode
(Playground); mobile viewport (375px, Playground). Also read Radix `Collapsible`'s own compiled
source directly (rather than assuming) to confirm two Accessibility-section claims: `trigger` gets
`aria-controls` only while `open` is `true` (omitted while closed, not pointing at a hidden element),
and the content region gets the native `hidden` attribute while closed (not just visual hiding) on
top of eventually leaving the DOM via `Presence`.

Tests: 10 → 21 (added: `id`/`data-testid`, both orientations, `asChild`'s no-wrapper rendering,
`asChild` falling back safely when combined with `trigger`, and both dev-mode warnings — present and
absent). Stories: 3 → 7 (added: Playground, Horizontal, AsChild, ToggleInteraction; existing 3
rewritten from bare `render: () => (...)` to `args`-driven).

Self-verified: `tsc --noEmit`, `eslint --max-warnings 0` (both clean, package + `.storybook`), full
Vitest suite — 25/25 for `Collapse` specifically (21 unit + 4 Storybook-project story tests, the 5th
gallery-only story contributing no additional assertions beyond the play-function one), 1294/1294
package-wide — a real `tsup` build, and `check-component-bundle-size` (0.71KB JS / 0.25KB CSS
gzipped, well under budget).

Review pass complete — all findings actioned. Per `06-engineering-standards.md` §9, "Finalized" is a
status the user declares explicitly, not one a review pass asserts on its own; awaiting that
confirmation before this entry (and `07-storybook-and-documentation-standards.md` §6's status table)
records a Finalized date.

**Follow-up (2026-09-05, same day), at user report — real bug in the horizontal+trigger combination,
not a Storybook artifact.** In the Playground, with `orientation="horizontal"` and the default
`trigger`, clicking the trigger showed the content briefly beside it before it snapped down onto its
own line partway through the same expand animation, reading as the layout flipping from horizontal
to vertical mid-toggle. Root-caused rather than assumed: `Button` renders `display: inline-flex` and
`.horizontal` content is `display: inline-block` — both inline-level, so Root's default block flow
lays them out side by side only until their combined width exceeds the available line width, then
wraps the overflow the same way text would. Content's own animated width grows from `0` up to its
full measured width, so it fits beside the trigger while narrow and wraps below it the instant it no
longer does — confirmed by inspecting `getComputedStyle`/class names directly in a running Storybook
instance, not just from the visual symptom. The dedicated `Horizontal` story happened not to trigger
this (its own render has no width-constraining wrapper), which is why it wasn't caught during the
original pass — a real gap in that story's coverage, not evidence the bug was Storybook-specific.

**Fix:** `Collapse.tsx` now computes `rootLayoutHorizontal = orientation === "horizontal" &&
!!trigger` and applies a new `.rootRow` class (`display: flex; align-items: flex-start; gap:
var(--dbm-space-3)`) to Root only in that combination — flex row items don't wrap by default, so the
content region now overflows the container's own width where necessary instead of ever dropping to a
new line, the correct trade-off for a sidebar-style reveal. Scoped deliberately narrow: vertical
orientation is unaffected (Content there is a plain block box, never at wrapping risk in the first
place), and horizontal orientation without a `trigger` is unaffected too (Root has only one child in
that case, nothing to wrap against). Also correctly leaves the `asChild`-flattened case alone — when
`asChild` is in effect, `trigger` is absent by the same mutual-exclusivity rule already documented,
so `rootLayoutHorizontal` is `false` there and Root's own class never lands on the single flattened
element alongside Content's own `.horizontal` class.

Added 3 regression tests (row layout applied for horizontal+trigger; not applied for vertical+
trigger; not applied for horizontal without a trigger) — 21 → 24 unit tests. Re-verified live: the
Playground's horizontal toggle now holds its side-by-side layout through the full animation; vertical
orientation, the dedicated `Horizontal` story, and the `AsChild`/`ToggleInteraction` stories all
re-checked for regressions and unaffected. `tsc --noEmit`, `eslint --max-warnings 0`, and the full
Vitest suite (1297/1297 package-wide) all clean.

**Follow-up (2026-09-05, same day), at user report — Storybook story-setup gap, not a component
bug.** In vertical orientation, `Playground` and `ToggleInteraction` showed no gap between the
trigger and the revealed content, while `Default`/`OpenByDefault` clearly had one. Diagnosed by
reading the story source directly: `Collapse` itself applies zero padding of its own around
`children` — a deliberate, unopinionated design (the same as `Backdrop`'s own `children`), so
spacing is entirely the consumer's responsibility. `Default`/`OpenByDefault` already wrap
`args.children` in `<Text style={{ paddingBlockStart: "var(--dbm-space-3)" }}>` to demonstrate
realistic composition; `Playground`/`ToggleInteraction` rendered the raw string directly with no
such wrapper, which is accurate to the bare default but reads as a broken demo next to the other two
stories. Not a component defect — confirmed no prop, type, CSS, or test-assertion change was needed.
Aligned both stories to the same `Text`-wrapped treatment for consistency. Re-verified live: both
now show the same gap as `Default`; the `ToggleInteraction` play function's `getByText` assertions
still resolve correctly against the wrapped text (8/8 steps, PASS). `tsc`, `eslint`, and the full
Vitest suite (1297/1297, no count change — story-file-only edit) all re-confirmed clean.

**Follow-up (2026-09-05, same day), at explicit direction — content-region background added across
the Storybook stories.** Every vertical-orientation story whose revealed content is plain text
(`Playground`, `Default`, `OpenByDefault`, `WithoutTrigger`, `ToggleInteraction`) now wraps it in a
`bg.neutral-subtle` panel (`padding: space.4`, `border-radius: radius.md`, plus the existing
`margin-block-start: space.3` gap from the trigger) via a shared `contentBoxStyle` constant — the
same panel treatment `Horizontal`'s own sidebar-style box already used, applied consistently instead
of each story restyling `Text` differently. Storybook-only (no `Collapse.tsx`/`.module.css` change);
`AsChild` deliberately left untouched, since wrapping its `<li>` content in a background box would
reintroduce the extra element that story exists specifically to demonstrate `Collapse` doesn't need.
Verified live in both Purple/Emerald × Light/Dark — `bg.neutral-subtle` correctly resolves in every
combination — and confirmed the `ToggleInteraction` play function's text assertions still resolve
against the now-styled `Text`. `tsc`, `eslint`, and the full Vitest suite (1297/1297) all clean.

**Follow-up (2026-09-05, same day), at user report — vertical-story content box had a visible gap
`Horizontal`'s own box doesn't.** `contentBoxStyle` (added in the previous follow-up) included
`marginBlockStart: var(--dbm-space-3)`, pushing the gray background box 12px below the trigger even
though the underlying Radix content region itself sits flush against the trigger with zero gap
(confirmed via `getBoundingClientRect` — the content region's own top exactly equals the trigger's
bottom). `Horizontal`'s own box has no such margin, so it sits exactly flush against the content
region it's the sole child of, which itself top-aligns with the trigger via `rootRow`'s `align-items:
flex-start` — reading as clean alignment where the vertical stories instead showed a floating gap.
Removed `marginBlockStart` from `contentBoxStyle`; box now sits flush against the trigger in every
vertical story, matching `Horizontal`'s own flush positioning. Storybook-only, no component/CSS
Module change. Re-verified live (`getBoundingClientRect` gap: `0`), `tsc`/`eslint`/full Vitest suite
(1297/1297) all clean.

**Follow-up (2026-09-05, same day), at user report — the fix above overcorrected; `Horizontal` isn't
flush against its trigger either.** Removing the margin entirely made the vertical box touch the
trigger with zero gap, but `Horizontal`'s own box isn't flush against *its* trigger — the two sit
`space.3` apart via `rootRow`'s flex `gap`, which is what actually reads as clean, deliberate
spacing (both elements top-aligned, evenly spaced), not zero distance. "Match `Horizontal`'s layout"
meant matching that gap's *size*, not eliminating it. Restored `marginBlockStart: var(--dbm-space-3)`
on `contentBoxStyle` — the same token `rootRow` already uses — so both orientations now have an
equal, intentional `space.3` gap between trigger and content box. Re-verified live via
`getBoundingClientRect`: vertical gap is `12px`, exactly matching `Horizontal`'s own flex `gap`.
`tsc`, `eslint`, and the full Vitest suite (1297/1297) all clean.

**Follow-up (2026-09-05, same day), at user report (with screenshot) — the restored margin leaked
into live-Controls horizontal mode on every story except the dedicated `Horizontal` one.**
`contentBoxStyle`'s `marginBlockStart` was unconditional, but `Playground`/`Default`/`OpenByDefault`/
`WithoutTrigger`/`ToggleInteraction` all still expose a live `orientation` Controls select (only
`Horizontal` disables it) — switching any of them to horizontal via Controls correctly laid the
trigger and content side by side via `rootRow`, but the box's own unconditional top margin still
pushed it down *within* that flex item, reproducing visible "white space above the content" exactly
like the screenshot showed, even though the two elements were now side by side rather than stacked.
Root-caused rather than patched blindly: confirmed live by reproducing it directly (switching
`Default`'s own `orientation` control to "horizontal") before fixing anything. Converted
`contentBoxStyle` from a static object to a `getContentBoxStyle(orientation)` function — the margin
now applies only for `orientation === "vertical"`, `undefined` for horizontal, where `rootRow`'s own
flex `gap` already provides the equivalent spacing at the correct layout level. Updated all 5 call
sites to pass `args.orientation ?? "vertical"`. Re-verified live via `getBoundingClientRect`:
switching `Default` to horizontal now shows `topDiff: 0` (box top exactly matches trigger top) and a
clean `12px` horizontal gap, matching the dedicated `Horizontal` story exactly; switching back to
vertical still shows the correct `12px` vertical gap. `tsc`, `eslint`, and the full Vitest suite
(1297/1297, including the `ToggleInteraction` play function) all clean.

**Follow-up (2026-09-05, same day), at user request — `bg.neutral-subtle` background added to
`AsChild`, surfacing two real, previously-hidden issues (one component-level, one an inherent
`asChild` limitation worth a story-level workaround).** Applied the same boxed treatment as the
other stories via `Collapse`'s own `style` prop (not a wrapping `<div>` — `style` flows through the
same chained-Slot flattening `asChild` already relies on, landing directly on the `<li>`, so the box
appears with zero extra DOM elements); `marginBlock` (both sides, not the trigger-relative
`marginBlockStart` used elsewhere) gives breathing room from the always-visible siblings above and
below, since this story has no trigger to space from.

- **Real component bug, found while verifying:** the styled `<li>` lost its bullet marker entirely
  (its two always-visible siblings kept theirs). Root-caused to `Collapse.module.css`'s `.root {
  display: block; }` — harmless on the default `<div>` (already block-level) but, once merged via
  `asChild` onto an arbitrary host element, silently overrides that host's *own* default display,
  here clobbering the `<li>`'s native `display: list-item`. **Fixed at the component level**: removed
  the `display: block` declaration from `.root` entirely (an empty ruleset kept only so the class
  name stays exported for `cx()`) — a plain `<div>` needs no explicit rule to stay block-level, and
  `.rootRow` (the horizontal+trigger row layout) already applies its own `display: flex`
  independently, so nothing else depends on `.root`'s own value. Re-verified live: `display:
  list-item` now correctly computes on the styled `<li>`.
- **Inherent `asChild` limitation, not fixable in the component:** even with the marker's `display`
  restored, it still didn't render — confirmed via `elementFromPoint` probing (the marker's own hit
  area resolved to the parent `<ul>`, not the `<li>`, unlike its siblings). Root cause: `.content`'s
  `overflow: hidden` (essential to the real clip-during-animation behavior — not removable) suppresses
  an `outside`-positioned `::marker` on the same element, a known cross-browser quirk. Since
  `overflow: hidden` can't be dropped without breaking the actual collapse animation, worked around it
  at the story level instead: set `list-style-position: inside` on the whole `<ul>` (applied list-wide
  so all three markers stay visually consistent), rendering the marker as ordinary inline content —
  unaffected by the host element's own `overflow` — rather than relying on the clipped outside area.

Re-verified live (2x-zoomed screenshot plus direct `getComputedStyle`/`elementFromPoint` checks): all
three list items now show a visible bullet, the collapsible item's box renders with `padding: 16px`,
`margin: 12px 0px` (equal space above and below), `border-radius: 8px`, and the `bg.neutral-subtle`
fill. `tsc`, `eslint`, and the full Vitest suite (1297/1297) all clean.

**Follow-up (2026-09-05, same day), at user request — two small Storybook-only polish items.**

- **`ToggleInteraction`'s open/close happened too fast to watch.** The play function's assertions
  ran back to back with no pause, so a human watching the replay in the Interactions panel saw a
  single flash rather than two distinct, observable state changes (the real CSS animation is only
  `motion.duration.base`, 200ms, too quick on its own either way). Added two plain `setTimeout`-based
  pauses (600ms before the first click, 1200ms after confirming open and before the keyboard-close) —
  cosmetic pacing only, not test logic; every existing assertion is unchanged and still passes.
  Re-verified live: forced a fresh play run via the story's "Reload" toolbar button and screenshotted
  mid-run — the content stayed visibly open for the pause window before closing, confirming the
  pacing actually holds (the Interactions panel's own manual step-replay button hung indefinitely
  when tested the same way — investigated and ruled out as an unrelated, pre-existing Storybook UI
  quirk, not caused by this change, since the natural on-mount play run completed correctly and
  quickly every time).
- **`Collapse.mdx`'s Playground Controls panel showed `trigger` and `defaultOpen` as live controls
  with nothing meaningful to interact with.** `trigger`'s only other option ("None") leaves nothing
  clickable, since `open`/`onOpenChange` (the only way to drive it externally) aren't live controls
  in this panel either; `defaultOpen` is only read on mount, so changing it has no visible effect
  until the story remounts — not a real-time toggle, confirmed by the user's own prior observation
  that it only took effect after a manual reload. Added both to `PlaygroundControls`' `exclude` list
  in `Collapse.mdx` — **Docs-page embedded panel only**, not the component: no prop, type, or story
  `argTypes` change, so `trigger` stays genuinely live on the standalone `Playground` story itself
  (a separate control surface from this embedded panel), and both props stay fully documented, with
  complete descriptions, in the Properties table below. Re-verified live: the embedded Playground
  panel now shows only `children`/`orientation`/`disabled`; the Properties table still lists both
  `trigger` and `defaultOpen` in full.

Neither follow-up changed `Collapse.tsx`/`Collapse.types.ts`/`Collapse.module.css`. `tsc`, `eslint`,
and the full Vitest suite (1297/1297, no count change) all clean.

**Final pre-finalization pass, 2026-09-05.** Re-ran the full `06-engineering-standards.md` §9
checklist against the current state (all prior fixes/follow-ups above included), rather than
assuming they still hold:

- **Found and fixed one real gap**: the Docs page's Code examples section had no snippet
  demonstrating a genuine *native* `<div>` attribute in use, even though the Properties section's
  own disclaimer sentence cites `aria-label`/`title` as examples — the same gap class the `Input`
  review originally established this checklist item for. Added a closing example
  (`<Collapse aria-label="Additional details" title="Details" open={isOpen}>`), live-verified
  rendering correctly on the Docs page.
- **Live-verified**: keyboard Tab focus (visible focus ring) and toggle activation (confirmed via a
  real `.click()` and cross-checked against the automated Playwright-based tests, both the unit test
  and the `ToggleInteraction` play function's own keyboard assertion — see the noted tooling artifact
  below); Purple/Emerald × Light/Dark (`Playground`, both render correctly, including the
  `bg.neutral-subtle` content box in dark mode); mobile viewport (375px) on `Playground` (clean
  wrap, no overflow) and `Horizontal` (row layout holds, panel stays within the viewport, top-aligned
  with the trigger, confirmed via `getBoundingClientRect`); the Docs page end to end (all 10
  sections present, no rendering artifacts, both `RelatedCard` previews link and render live, the
  Properties table's 12 rows all have real non-empty descriptions in the established prop order,
  ordered content → trigger → controlled/uncontrolled pair → orientation → disabled → asChild →
  escape-hatch props).
- **One live-testing artifact worth recording, not a component bug**: the Browser pane's synthetic
  `Return` keypress didn't reliably reach the nested Storybook iframe's trigger button (focus was
  confirmed correctly on the button throughout), while a programmatic `.click()` and both automated
  Playwright-based tests toggle state correctly and reliably. Also, the Interactions panel's own
  manual step-replay button hung indefinitely when tested directly, while the natural on-mount play
  run (and a forced reload via the story's own "Reload" toolbar button) both completed correctly and
  quickly every time. Noting both here, matching the precedent already set on `Backdrop`'s own final
  pass, so a future session doesn't misread either as a real regression.
- **Accessibility addon panel**: not independently checkable in this session (stuck at "Preparing
  accessibility scan" — requires `test:storybook:watch` running alongside `storybook dev`, per
  `guidelines/adr/0003`, a standing environmental requirement, not a `Collapse`-specific gap).
  Relied on the automated jest-axe test instead (zero violations, part of the suite below).
- **Feature-completeness gap (named against MUI's/Chakra's own `Collapse`: `collapsedSize`/
  `startingHeight`, a partial non-zero collapsed state) — discussed, deliberately not added.**
  Investigated the real implementation cost before deciding: Radix `Collapsible.Content` hard-codes
  "closed = children not rendered, native `hidden` set," with no override available (confirmed by
  reading its source — `children: isOpen && children`), so supporting a partial collapsed size would
  mean dropping `Content` for the content region entirely and hand-rolling a `ResizeObserver`-based
  height/width measurement in its place, plus `aria-hidden` handling for the still-visible sliver —
  a real architecture change, not a new prop. The actual motivating use case (a "read more" truncated
  preview that expands to full text) doesn't need it: composing `Text`'s own `truncate` prop for the
  always-visible preview with `Collapse` revealing only the remaining content — a normal full open/
  close, no partial state involved — achieves the identical user-facing result with zero changes to
  `Collapse` itself. Documented this composition pattern instead: a new "Do" bullet in Usage
  guidelines and a full `ReadMore` code example in Code examples, both live-verified rendering
  correctly on the Docs page. `collapsedSize` itself stays out of scope.
- **Full re-verification**: `tsc --noEmit`, `eslint --max-warnings 0`, the full Vitest suite (28/28
  for `Collapse` specifically, 1297/1297 package-wide), a real `tsup` build, `pnpm audit`
  (zero known vulnerabilities), and `check-component-bundle-size` (0.73KB JS / 0.27KB CSS gzipped —
  well under budget). No other findings.

Review pass complete — all findings actioned. Per `06-engineering-standards.md` §9, "Finalized" is a
status the user declares explicitly, not one a review pass asserts on its own.

**Follow-up (2026-09-05, same day), discussed at the user's own request — `collapsedSize` (a partial,
non-zero collapsed state, matching MUI's/Chakra's own `Collapse`) considered and deliberately left
out.** See the feature-completeness bullet above for the full reasoning (a real architecture change,
not a new prop — Radix `Collapsible.Content` hard-codes "closed = unmounted" with no override) and
the composition pattern documented in its place (`Text`'s `truncate` + `Collapse` for a "read more"
disclosure, achieving the same user-facing result with zero changes to `Collapse` itself).

**Finalized 2026-09-05** — per `06-engineering-standards.md` §9's own note, don't make further
changes to Collapse (code, stories, docs, or its tokens) without asking first.

## Related components

`Button` (the most common `trigger` element), `Text` (a common `children` pairing), `Affix` (the
precedent this review's `asChild` support and Playground-control-suppression pattern followed),
`Indicators` (the precedent this review's `orientation` naming followed) — a future `Accordion`
(the molecule this atom is the building block for) is not yet built.
