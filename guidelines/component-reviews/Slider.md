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

**Status: built, self-reviewed against the full `06-engineering-standards.md` §9 checklist, all
findings above already actioned — awaiting the user's own confirmation to mark Finalized.**
