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

## Feature-completeness round (2026-10-04, at the user's request)

A review of the first build named seven gaps, all built the same day:
1. **`legendSize`** — `size` had done two jobs (the legend's size and the fields' default). The legend now follows `size` unless `legendSize` sets it apart.
2. **`columns` and `FieldGroup.Item`** — fields of different widths. A grid of equal columns (a breakpoint map too, over `orientation`) and an `Item` with a `span`, clamped to the current column count and warned on a span that isn't a positive whole number (the `DescriptionList.Item` lessons). `Item` is a plain wrapper in any other layout. As a compound sub-part it got the sub-part checkpoint: its own `forwardRef`, JSDoc, pass-through props, and a hidden docs-only stories file for its Properties table (ADR-0013).
3. **Description vs error** — the error now replaces the description, as `FormField`'s helper text and error do; the group is described by whichever is showing.
4. **`required`** — a visual asterisk on the legend only (a group role supports no `aria-required`), never drawn when the legend is hidden.
5. **`gap` as a breakpoint map**, and 6. **`columnGap`** for side-by-side fields (defaults to `gap`), resolved with the shared responsive hook.
7. **The group's `size` reaches the control** through a new optional `size` in the props `FormField` hands back, only inside a group that sets one — [ADR-0036](../adr/0036-a-field-hands-its-size-to-its-control-only-inside-a-fieldgroup-that-sets-one.md). The one decision here I was least sure of; it reopens nothing in `FormField` (additive, absent elsewhere).

**Verification (real runs):** the five new unit groups and `FormField`'s two (handed size), 5,474/5,474 unit and 1,053/1,053 Chromium tests, `tsc` and `eslint` clean, build clean, bundle size within budget (`FieldGroup` 2.01KB JS / 1.04KB CSS gzipped). Three new hidden browser checks measure the grid (spans 3, 2 and 1 of 3 columns, a 40px column gap and a 12px row gap, to the pixel), the phone collapse (a `{ base: 1, md: 3 }` map and a span of 3 stay one column wide at a phone width) and the error replacing the description; the grid checks were broken on purpose once and both failed. The Docs page was opened live: the new Item table, three new variant stories, every new "Show code" panel (compared against its demo, and the new snippets typechecked against the real components), and the Playground's three new controls (`legendSize`, `columns`, `columnGap`, each with an "off"/"default" choice that is not a real value, set on the Playground story alone) driving its snippet.
