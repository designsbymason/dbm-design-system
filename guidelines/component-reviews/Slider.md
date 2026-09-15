# Slider — Storybook/component review findings

**Inputs & Forms:** Slider — initial build + full `06-engineering-standards.md` §9 review checklist
worked through (2026-09-15), item 7 in the itemized molecule-tier build order
(`04-component-inventory.md`). **Not yet Finalized** — per the standing rule that only the user
declares a component's review pass done, this file records what was built/checked/found, not a
self-declared Finalized status.

**New dependency: `@radix-ui/react-slider` (^1.4.7).** The first molecule in this system wrapping a
genuinely compound Radix primitive with no prior atom precedent (`Switch`/`Checkbox` wrap a single
Radix element; `Select` is the only other compound-primitive wrap so far) — added following the
same incremental "add the Radix package the component actually needs" pattern already established
(e.g. `@radix-ui/react-checkbox`/`-switch`/`-tooltip`/`-collapsible`, `01-vision-and-goals.md` Phase
4.75).

**Design choices made without an explicit ask (flagging the reasoning, not a fork-in-the-road
architecture decision on the scale of `NumberInput`'s/`Radio`'s own ADRs):**

- **`value`/`defaultValue`/`onValueChange`/`onValueCommit` are all plain numbers, not the array the
  underlying Radix primitive uses internally.** Radix's own `Slider.Root` always works in terms of
  `number[]` (to support multiple thumbs), but this component is explicitly the *single*-value case
  per `04-component-inventory.md`'s own row ("Single value" — `RangeSlider`, the dual-handle case,
  is a separate future component, item 17). Converting to/from a one-element array internally keeps
  the public API honest about what this component actually is, the same reasoning `NumberInput`
  applied converting `Input`'s string domain to a real `number`.
- **`onValueCommit` exposed as a first-class, separate prop from `onValueChange`** — a genuine Radix
  feature (fires once, on release/a completed keyboard step, vs. `onValueChange`'s continuous firing
  while dragging) worth surfacing directly rather than only informally documenting, since it's the
  obvious answer to "how do I avoid firing an expensive operation on every pixel of drag movement."
  Confirmed by reading the installed package's own source (`onStepKeyDown`'s `commit` flag) that
  keyboard-driven steps call it too, not just pointer release — verified via a dedicated test rather
  than assumed.
- **`orientation`/`inverted` exposed as plain passthrough booleans/enums to the Radix primitive** —
  low marginal implementation cost (Radix handles all the internal positioning math), named
  feature-completeness value (a vertical slider is a common, expected variant — e.g. a volume or
  brightness control in a vertical toolbar).
- **`showValue` renders the current value as inline text next to the control** — a named
  feature-completeness gap (seeing the current numeric value without a separate on-screen element)
  rather than an unrequested addition. Deliberately simple (plain `Text`, no floating tooltip-bubble
  positioning) to avoid the added complexity/positioning-edge-cases a hover/drag-following bubble
  would introduce for what's meant to be a straightforward molecule.
- **`required` was NOT added, despite `Switch`'s own precedent of exposing it.** Verified directly
  against the installed `@radix-ui/react-slider@1.4.7` type definitions before assuming parity with
  `Switch` — `Slider`'s own `SliderProps` interface has no `required` field at all (unlike
  `Switch`'s genuine Radix-provided one). Including it anyway would have been a real, confirmed type
  error at the `<SliderPrimitive.Root {...props}>` spread, not just a documentation nicety — caught
  by `tsc`, not asserted from memory of a sibling component's own shape.
- **Track thickness reuses `ProgressBar`'s own already-established height scale verbatim** (via its
  exact `space.*`/`calc()` values) rather than inventing a new component-layer token file — both are
  "thin bar whose thickness scales by size" components, and no new pixel value was actually needed
  (`03-token-system-spec.md`'s own "prefer an existing scale" ordering). Thumb diameter reuses the
  shared `icon-size.*` scale directly for the same reason — a real, measured coincidence (12/16/20/
  24/32px already reads as a natural thumb-diameter progression).
- **Shadows use the fixed `--dbm-shadow-light-*`/`--dbm-shadow-dark-*` primitive pair** (not a
  reactive semantic token, since none exists for elevation) via the same `[data-theme$="-dark"]`
  attribute-selector override already established on `Select`'s own dropdown `.content` — confirmed
  by reading that component's CSS first rather than guessing a token name, after an initial
  (incorrect) draft referenced a non-existent `--dbm-shadow-sm`/`--dbm-shadow-md` that would have
  silently resolved to nothing.

**Baseline correctness:** Full TypeScript strict mode, no `any`. JSDoc complete on the component and
every prop. `forwardRef` to the primitive's own root `<span>` element. `className`/`style` apply to
the root; `id`/`autoFocus`/`data-testid`/the accessible-name and `aria-invalid` attributes are
deliberately routed to the Thumb instead — the actual `role="slider"` element assistive tech
inspects, not the plain positioning wrapper around it (confirmed by reading the installed package's
real rendered DOM directly, not assumed from its type definitions: the thumb's own `role="slider"`
sits inside an *additional* Radix-internal positioning `<span>`, one level deeper than Root, so
naive `slider.parentElement`-style assumptions about the DOM shape were wrong and had to be
corrected — see Functional verification below). No hardcoded values — every visual choice traces to
an existing token (see above). No console noise, no silent catches. SSR-safe — no module-scope or
render-time `window`/`document` access.

**Consumed-atom defect handling (`06-engineering-standards.md` §9 checkpoint):** none found — `Text`
(used for `showValue`'s label) needed no changes; this review did catch and fix its own incorrect
assumption about `Text`'s color prop being named `tone` (it's `color`), caught by `tsc` before ever
reaching a live check, not a real atom defect.

**Accessibility:** Renders `role="slider"` (WAI-ARIA slider pattern) with live
`aria-valuenow`/`aria-valuemin`/`aria-valuemax`, plus optional `aria-valuetext` for a
human-readable alternative to the raw number. `aria-invalid` set automatically while `hasError`. A
dev-mode console warning fires once with no `aria-label`/`aria-labelledby`, matching `Switch`'s own
established pattern. `Tab` focuses the thumb; arrow keys/Page Up/Page Down/Home/End move it, all via
Radix's own keyboard handling — verified directly rather than assumed (see tests). A `disabled`
slider is unreachable by `Tab` and ignores keyboard input entirely (verified). jest-axe clean across
default/error/disabled/`showValue` states.

**Responsiveness/Theming:** No component-specific breakpoint logic. Live-verified in a running
Storybook instance across all 4 theme combinations via direct CSSOM/token inspection (not just
reasoned about from the code) — confirmed `bg.brand` (range fill), `bg.track` (track), `bg.surface`
(thumb), and both shadow tokens all resolve correctly in Purple/Emerald × Light/Dark, plus the
`hasError` danger-colored range/thumb ring in the default theme. One real methodology pitfall hit
and corrected during this check: reading `getComputedStyle` immediately after changing `data-theme`
via script returned a stale value in this environment until a reflow was forced (`el.offsetHeight`)
first — not a rendering bug, but worth noting since it briefly looked like one before being
diagnosed and re-verified correctly.

**Storybook documentation:** `Slider.mdx` Docs page (first in its sidebar group), full template —
Intro, Playground, Properties table (`propOrder` sequenced content→visual→behavioral→escape-hatch),
a Variants gallery (All sizes, Vertical, With the live value shown, Custom min/max/step, Error
state, Disabled, Controlled-with-onValueCommit), Usage guidelines, Best practices, Accessibility,
Code examples (including a genuine native-prop example per the standing requirement), Design tokens
used, Related components (cross-linking `NumberInput`, `FieldLabel`, `FieldHelperText`, `FieldError`,
`FormField`). Two `play`-function interaction stories (keyboard stepping + Home/End, disabled blocks
input) with generous leading/inter-step pauses from the start, matching the pacing convention
established after `SearchInput`'s own user-reported fix — not something this component had to
retrofit. Every prop's Controls-panel control is genuinely interactive or has a stated
`control: false` reason. Visually verified live in a running Storybook instance (not just `tsc`),
including the Playground rendering correctly and the sidebar taxonomy
(`Molecules/Inputs/Slider`) matching `07-storybook-and-documentation-standards.md` §3.

**Functional verification:** `Slider.test.tsx` (20 tests) covers rendering at `min` by default,
`defaultValue`, custom `min`/`max`/`step`, arrow-key increment/decrement calling `onValueChange`,
Home/End jumping to the extremes, `onValueCommit` firing on a completed keyboard step (distinct from
`onValueChange`), fully controlled usage, `disabled` blocking keyboard input, `aria-invalid` via
`hasError`, `showValue`'s live text, size classes, vertical orientation, `aria-valuetext`
passthrough, the hidden native input rendering only inside a real `<form>` (not merely when `name`
is set — a real, verified Radix behavior, not assumed), ref forwarding, the no-accessible-name dev
warning, and jest-axe across 4 states. Three tests initially failed on first run from an incorrect
assumption about the rendered DOM shape (see Baseline correctness above) — fixed by inspecting the
actual DOM directly rather than guessing a second time, not by loosening the assertions. Full
package self-verification: `tsc` (package + `.storybook`), `eslint --max-warnings 0`, Vitest `unit`
(1305/1305 whole package) and `storybook` (454/454 whole package, including this component's own 10
story tests) all clean; `tsup` build and `check-component-bundle-size` clean (1.72KB JS / 1.04KB CSS
gzipped, well within budget); `check-foundations-token-coverage` clean.

**Feature completeness:** Named gap comparisons made explicit above (`onValueCommit`,
`orientation`/`inverted`, `showValue`) rather than an unscoped "make it fancier" pass — each traces
to a concrete, stated rationale, per the §9 scope-creep guardrail. `required` was deliberately *not*
added after verifying it isn't a real capability of the underlying primitive, rather than copying
`Switch`'s own prop list on the assumption that every Radix form-control wrapper shares the same
surface.

**Post-build fixes (2026-09-15, user-reported, before the final review pass):**

1. **The thumb was hard to see** — a plain white circle distinguished from the page only by a soft
   shadow. Fixed by adding a `border.brand` (danger when `hasError`) border around it — a real,
   visible ring that also reads as a deliberate, on-brand handle rather than a generic dot. The
   previous `hasError` treatment (a box-shadow ring) was simplified to a plain border-color swap now
   that a real border already exists, avoiding a doubled-up ring look.
2. **The vertical orientation demo appeared to render only the thumb, no track.** Direct DOM/rect
   inspection showed the track was actually rendering correctly, at the right size and position — the
   real issue was contrast, not layout: `bg.track` (what `.track` used) is documented as a
   deliberate, sub-3:1 exception for a *passive* progress indicator's own empty portion
   (`03-token-system-spec.md`), not a token built for an interactive control's own draggable hit
   area. A thin, low-contrast vertical line is far harder to spot than the same low contrast on a
   wide horizontal bar, which is why this read as "missing" specifically in the vertical story.
   Fixed by switching `.track` to `bg.track-strong` — the token spec's own already-established
   choice for exactly this "boundary must read as real" case (`Switch`'s own always-interactive
   track, `Indicators`' inactive-dot fill). Re-verified via direct computed-style inspection in both
   orientations, not just visually.

Re-verified after both fixes: `tsc` (package + `.storybook`), `eslint --max-warnings 0`, Vitest
`unit` (20/20 this component) and `storybook` (10/10 this component) clean.

**Feature-completeness questions raised and resolved (2026-09-15, user-asked):** presented four
open questions back to the user rather than deciding unilaterally, since one of them was a real
fork affecting the documented build-order plan, not just this component's own surface:

1. **Min/max end labels — add.** New `showMinMaxLabels` prop.
2. **Hover/drag value tooltip — add, reusing the `Tooltip` atom.** New `showValueTooltip` prop.
3. **Step tick marks — add now** (the other option offered was deferring). New `showTicks` +
   `tickInterval` props.
4. **Two-thumb range mode — keep separate.** Confirmed: stays the future `RangeSlider` component
   already planned in `04-component-inventory.md` (item 17, "extends Slider"), not folded into
   `Slider` itself via a variant prop. No change made to this component or the inventory as a
   result — this only rules out an alternative, it doesn't require any action now.

**Implementation notes for the three added features:**

- **`showValueTooltip`** wraps the `Thumb` in the already-Finalized `Tooltip` atom
  (`delayDuration={0}`, since the standalone 400ms default is tuned for discoverability hints, not
  a value readout that should track a drag immediately) — relies on `Tooltip`'s own native
  hover/focus triggers rather than custom drag-tracking state; the thumb visually tracks the
  pointer throughout a drag, so hover stays naturally engaged for its whole duration. Content
  prefers `aria-valuetext` when set, falling back to the raw number.
- **`showMinMaxLabels`** renders `min`/`max` as `Text` — a plain row below the track for horizontal;
  absolutely-positioned overlays for vertical (see the real bug this required fixing, below).
- **`showTicks`/`tickInterval`** render small `aria-hidden` dots inside `Track`, computed inclusive
  of both `min` and `max` (the last real tick always lands exactly at `max`, even when the range
  doesn't divide evenly by `tickInterval`, rather than being silently dropped). A plain `bg.surface`
  fill was used for every tick regardless of fill-position, deliberately simpler than per-tick
  recoloring based on whether the filled range covers it — reads adequately against both the track
  and the range without that added complexity.

**A real, found-and-fixed layout bug: vertical + `showMinMaxLabels` initially rendered a 0-height
slider.** The first implementation nested `Slider.Root` (which sizes itself via `height: 100%`,
resolved against whatever explicit height the caller passes via `style`) inside a new wrapper span
intended to "shrink-wrap" around it with no height of its own. That's not how CSS percentage
heights work: a percentage height only resolves against an ancestor with a genuine, explicit
height — an auto-sized wrapper doesn't retroactively gain one just because its only child wants to
be "100%" of it, so Root's own height collapsed to 0. Found live, not caught by `tsc`/`eslint`/unit
tests (jsdom doesn't lay out real percentage-height chains meaningfully) — only visible by actually
rendering the vertical + min/max-labels story and looking at it, which is exactly why the review
checklist requires live Storybook verification, not just a clean typecheck. Fixed by moving the
explicit `style` (the real height) to the wrapper instead, in that one specific composition only —
every other case (no wrapper, i.e. `showMinMaxLabels` unset) is unaffected and keeps receiving
`style` directly on Root, unchanged. Re-verified via direct `getBoundingClientRect()` inspection
after the fix, both in the standalone story and embedded in the full Docs page (0 zero-height
vertical roots found across all 65 `Slider` instances rendered on that page).

Full re-verification after all of the above: `tsc` (package + `.storybook`), `eslint
--max-warnings 0`, Vitest `unit` (1316/1316 whole package, up from 1305) and `storybook` (459/459
whole package, up from 454) all clean; `tsup` build and `check-component-bundle-size` clean
(2.34KB JS / 1.38KB CSS gzipped, up from 1.72KB/1.04KB, still well within budget);
`check-foundations-token-coverage` clean. `Slider.test.tsx` now 31 tests (was 20); `Slider.stories.tsx`
now 15 stories (was 10), including new Canvases for each feature plus a combined
"Every decoration combined" story and a "Vertical, with min/max labels" story exercising the fixed
layout directly.

**Status: built, self-reviewed against the full `06-engineering-standards.md` §9 checklist, all
findings above already actioned — awaiting the user's own confirmation to mark Finalized.**
