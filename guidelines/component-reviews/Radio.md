# Radio — Storybook/component review findings

**Inputs:** Radio — initial build + full `06-engineering-standards.md` §9 review pass complete
(2026-09-14), built from scratch as the first item in the itemized molecule-tier build order
(`04-component-inventory.md`), split out of the former combined `RadioGroup / Radio` inventory row
per [ADR-0012](../adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md).

**Architecture decision (asked, not guessed) — Radix has no standalone single-radio primitive.**
Unlike `Checkbox`/`Switch`, which each wrap their own standalone Radix Root, Radix only ships
`@radix-ui/react-radio-group` (Root + Item + Indicator), and `Item` requires a `Root` ancestor to
function at all (confirmed by reading the installed package's own compiled source, not assumed).
Presented three options to the user before writing any code: (A) a self-wrapping dual-mode atom —
`Radio` always renders Radix's real `Item`/`Indicator`, silently wrapping its own private
single-item `Root` when no ambient group context is present, exposing a boolean
`checked`/`onCheckedChange` API standalone and participating in a real shared group's own
`value`/`onValueChange` when composed inside one; (B) a native-`<input>`-based atom with no Radix
dependency at all, `RadioGroup` implementing its own separate Radix-wrapping internals; (C) accept
a narrower atom bar for this one pair, documented as an exception. **Chose (A)** — most faithful to
[ADR-0012](../adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md)'s own
"renders/functions correctly standalone" bar. Full record, including the rejected alternatives'
reasoning and what this constrains for `RadioGroup`'s own build:
[ADR-0014](../adr/0014-radio-self-wrapping-dual-mode-over-native-input-or-a-narrower-atom-bar.md).

**Cross-tier coordination signal.** A small `RadioGroupContext` (plain boolean, default `false`)
lives in `Radio`'s own folder (`RadioGroupContext.ts`) and is not exported from the package barrel
— internal coordination only. `RadioGroup` (molecule, not yet built) will provide `true` around
every `Radio` it renders. Mirrors the cross-tier context pattern already established between `List`
(owns `ListMarkerContext`) and `ListItem` (reads it) per the same ADR — here the ownership
direction is inverted only because `Radio` was built first; the ADR's own reasoning ("no lint rule
enforces tier-import direction") applies the same either way. Tests exercise the grouped code path
via a self-contained harness (Radix's own `RadioGroupPrimitive.Root` + this context set to `true`)
since `RadioGroup` doesn't exist yet — noted in the test file for revisiting once it does.

**Real Radix API shape verified from source, not memory** — read the installed package's own
`.d.mts` directly before writing prop-forwarding code: `Root` owns `name`/`form`/`required`/
`value`/`defaultValue`/`onValueChange`; `Item` owns `value` (required) + its own `disabled`, and
explicitly excludes `name`. This resolved exactly which props belong on the self-wrapped `Root`
(`name`, `form`, `required`) vs. the `Item` (`value`, `disabled`) — got wrong on the first pass
otherwise (see the two test fixes below, both caught by actually running the tests rather than
assumed correct).

**Radio-specific semantic distinction from `Checkbox`, documented explicitly:** clicking an
already-checked `Radio` never unchecks it — real radio-button semantics (the only way to change a
selection is choosing a different option), unlike `Checkbox`'s toggle behavior. Covered by its own
test and interaction story (`ClickInteraction`), and called out in the component's own JSDoc,
`RadioProps.checked`'s doc, and the Docs page's Usage guidelines.

**Two test-writing mistakes caught by actually running the tests, not assumed correct:**
1. `aria-required` when `required` is set lands on the wrapping `role="radiogroup"` div (the
   standalone self-wrapped `Root`), not on the `role="radio"` button — confirmed by reading Radix's
   own compiled source (`RadioGroup`'s own `Primitive2.div` render call sets
   `"aria-required": required` directly). Test fixed to query `getByRole("radiogroup")`.
2. A single simulated `ArrowDown` press didn't reliably reproduce Radix's real
   auto-select-on-arrow-focus behavior in jsdom (a genuine browser-only event-ordering dependency
   in Radix's own implementation, traced to `document.addEventListener` firing after React's
   synthetic bubble handling completes for the same event) — the test was rewritten to assert what
   the roving-tabindex mechanism guarantees regardless of that timing quirk: focus moves via arrow
   keys, and Space (WAI-ARIA-guaranteed) selects the focused item. Not a Radio bug — Radix's own
   internal behavior, worth flagging here in case a future `RadioGroup` test hits the same jsdom
   quirk.

**Dev-mode warnings, mirroring `Checkbox`'s own "fail loud" precedent (`06-engineering-standards.md`
§3):** (1) no accessible name (no `children`/`aria-label`/`aria-labelledby`); (2) standalone-only
props (`checked`/`defaultChecked`/`onCheckedChange`/`name`/`required`/`form`) passed while grouped
— these have no effect there, the ambient group owns all of them; (3) no `value` passed while
grouped — every `Radio` in a group needs a distinct one to be told apart from its siblings.

**Visual design:** circular (`radius.full`), sized from the same `icon-size.*` scale `Checkbox`
uses so the two read as a matched pair at any shared size — unlike `Checkbox`'s checkmark icon,
checked state renders a plain CSS-drawn dot (40% of the box, `icon.on-brand`) rather than an
`Icon`-rendered glyph, since a filled dot has no icon-swap use case the way Checkbox's
check/indeterminate glyphs do. Full brand fill on checked (not just a ring), matching Checkbox's
own filled treatment for family consistency. Focus-ring `border-radius` already inherits `full`
from the circular root, so no separate override was needed (unlike Button's square case,
`05-component-api-conventions.md` §6).

**Self-verification, whole package, all real runs (not "looking right"):**
- `tsc --noEmit` (package + `.storybook`): clean
- `eslint --max-warnings 0`: clean
- Vitest `unit` project: 1534/1534 passed (37 for `Radio` itself, standalone + grouped-harness)
- Vitest `storybook` (browser-mode play-function/a11y) project: 392/392 passed
- `tsup` build: clean, all four output targets
- `pnpm audit`: no known vulnerabilities (new `@radix-ui/react-radio-group` dependency included)
- `check-component-bundle-size`: Radio 1.07KB JS / 0.61KB CSS gzipped, within budget, in line with
  peer atoms (`Link`, `ProgressBar`)
- `build-storybook` + `check-storybook-bundle-size`: clean, within budget
- Live-verified in a running Storybook instance: Docs page (all 10 sections, TOC, Playground live,
  Properties table), `All sizes`/`States`/`Without a label`/`Inside a RadioGroup (preview)` variant
  galleries, zero Accessibility-panel violations (checked directly on the grouped-mode story), all
  4 themes (Purple/Emerald × Light/Dark) — checked-state fill and dot color read correctly in every
  combination, mutual exclusivity confirmed live by clicking between grouped options
- Confirmed sidebar placement: **Atoms → Inputs → Radio**, per the taxonomy in
  `07-storybook-and-documentation-standards.md` §3

**Not yet Finalized** — awaiting explicit confirmation per `06-engineering-standards.md` §9's
reporting convention. `RadioGroup` (the molecule that will actually compose `Radio` for real,
instead of the test/story harness above) is next in the build order.
