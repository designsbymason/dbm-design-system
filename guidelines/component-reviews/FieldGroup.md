# FieldGroup — build and review findings

**Inputs & Forms:** FieldGroup — built 2026-10-04, item 29 in the molecule build order (`04-component-inventory.md`). **Not yet declared Finalized** (the user declares that). Decision: [ADR-0035](../adr/0035-fieldgroup-is-a-native-fieldset-and-hands-disabled-and-size-to-formfield-through-a-context.md).

**What it is:** a native `<fieldset>`/`<legend>` around a set of fields, with `description`, a group-level `error`, `hideLegend`, `variant` (`ghost`/`outlined`/`filled`), `size`, `orientation` (a breakpoint map too) and `gap`, `disabled`. A flat props component (not compound), `ref` to the fieldset. It owns no values.

**Decisions put to the user before building:** the element (native fieldset, chosen) and how `disabled` reaches the fields (a context read by `FormField`, chosen, which authorised the additive `FormField` change).

**Composition checkpoints (06 §9):** compound sub-parts — not applicable (flat props); atom reuse — `FieldHelperText`, `FieldError`, `VisuallyHidden`; consumed-atom defects — none found; Radix audit — not applicable; cross-part ARIA wiring — the description and error ids are joined with a caller's own into the fieldset's `aria-describedby`, tested; composed tab order — the group adds no tab stop of its own (a disabled group removes its fields from it, tested in a real browser); nested provider — tested nested inside itself (a disabled outer group can't be undone, the inner `size` wins, the outer fills what the inner leaves out).

**Defects found by looking and measuring in a real browser, all fixed:**
- **A flex body next to a full-width floated legend collapsed to zero width** at the far edge, until it was given `clear: both` (the first measurement: `fieldset` 618px, body `0px` wide at `left: 658`).
- **The description started beside the legend** (same top, only its text pushed down) until it was cleared too.
- **A margin above a cleared box does nothing** (the clearance absorbs it), so the gap between legend and fields was 4px instead of 16; it is padding now.

**Contrast (measured, not assumed):** the one new pairing is the group error, `text.danger`, on `bg.neutral-subtle` in the filled variant: 4.89:1 light, 5.67:1 dark, AA (the same pairing recorded for `bg.neutral-subtle` in `03`). The legend (`text.primary`) is 13.5:1 / 9.7:1, and a disabled group is exempt.

**Tokens:** one component token, `field-group.field-min-width` (`14rem`, the width a field asks for before the horizontal layout wraps).

**Responsive:** the horizontal layout wraps by the group's own width (flex-basis), so no media query; checked at 375px (no overflow, the three-field row stacks).

**Tests:** 19 unit (a named group, descriptions and the caller's own `aria-describedby`, error, `hideLegend`, disabled, size, orientation, gap, nested groups, ref and pass-through props, the dev warning, StrictMode, jest-axe in two configurations), a Docs-page token guard (`FieldGroup.docs.test.ts`), and five hidden real-browser stories (legend layout in all three variants, horizontal wrap on a narrowing frame, a disabled group refusing typing and Tab, right-to-left, forced colours).

**Self-verification (real runs):** `tsc` and `eslint` clean; unit project 5,458/5,458; Storybook (Chromium) project 1,046/1,046; `pnpm -r build` clean; component bundle sizes within budget (`FieldGroup` 1.62KB JS / 0.96KB CSS gzipped); Foundations token coverage in sync; the snippets typechecked against the real components (a planted bad prop is rejected); Docs page opened in a running Storybook (all template sections, no console errors), Variants in light and States in Emerald dark.
