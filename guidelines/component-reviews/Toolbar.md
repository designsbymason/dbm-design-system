# Toolbar

Molecule, Inputs & Forms category. Item 27 of the itemized molecule build order in
`04-component-inventory.md` (nominally ⚪, promoted ahead of its tier because `Table Toolbar` builds on it).
A bar of actions that is one tab stop with arrow-key movement between its items, wrapping Radix
Toolbar (`@radix-ui/react-toolbar` ^1.1.19, new dependency). Built 2026-10-03. **Not yet declared
Finalized** — the user declares that. The decision is [ADR-0032](../adr/0032-toolbar-puts-radix-toolbar-roving-focus-behind-wrapper-parts-and-reuses-buttongroups-context.md).

## What it is

A compound component, `Toolbar` plus `Toolbar.Button`, `.IconButton`, `.Item`, `.Group`, `.Separator`
and `.Spacer`. The root is a named `role="toolbar"`: `variant` (how the bar is drawn: `ghost`
default, `outlined`, `filled`), `itemVariant` (every item's default look, `ghost` default), `size`,
`rounded`, `disabled`, `orientation` (a breakpoint map too), `dir`, `loop`, `fullWidth`, `wrap`.
`Toolbar.Button` and `Toolbar.IconButton` are the atoms in the arrow-key order and take every prop of
theirs (a toggle is an icon button with `pressed`); `Toolbar.Item` puts any other single element in the
order; `Toolbar.Group` is a named cluster; `Toolbar.Separator` runs across the bar's direction;
`Toolbar.Spacer` is the `Spacer` atom. Settings reach the items through `ButtonGroup`'s context
(ADR-0025), merged with an enclosing group's. No new token: the stylesheet uses `bg.surface`,
`bg.neutral-subtle`, `border.default`, `border.neutral`, `border-width.1`, `radius.lg`/`full` and
`space.1`–`3`. Adds 2.41KB JS / 1.48KB CSS gzipped (budget 10KB).

## Decisions made during the build

- **Wrapper parts, not automatic membership** (ADR-0032): a plain `Button` in a bar is just another tab stop,
  and the docs, a Do/Don't and a test say so.
- **`itemVariant`, not `variant`, for the buttons' look**: `variant` is the shared name for how a component
  itself is drawn (`ghost`/`outlined`/`filled`, as on `Card` and `EmptyState`), so the buttons' default needed
  another name. Open for the user: `ButtonGroup`'s `variant` means the buttons' look, so the two molecules now
  use the word differently.
- **`Divider` atom not reused for the separator.** The atom is a 100%-wide or 100%-high flex box with a
  label slot and its own responsive orientation, and sets its own `role` and `aria-orientation` after its spread
  props; the toolbar needs a fixed hairline whose orientation Radix already derives from the bar's. Radix's
  `Separator` with a few lines of CSS does that, and keeps the announced orientation correct by construction.
- **Bar width is its items' width unless `fullWidth`** (the same as `ButtonGroup`). The first version filled
  its container, which stretched a two-icon bar across the page in the stories; a `Toolbar.Spacer` needs the
  bar to have room to spare, so `fullWidth` is what the Spacer story and docs set.
- **The separator is `border.neutral`, not `border.default`.** In dark mode `border.default` against `bg.surface`
  is 1.40:1 and the first screenshot showed the rule almost gone; `border.neutral` reads clearly in both. It is
  decoration either way (WCAG 1.4.11 doesn't bind a divider). The outlined bar's own border stays
  `border.default`, as `Card`'s outlined variant has it.
- **Disabled items leave the arrow-key order** (Radix's behaviour, kept). WAI-ARIA allows disabled items to stay
  focusable; this is recorded in ADR-0032 and is a call for the user if they would rather override it.

## Review checklist (06 §9), run on 2026-10-03

- **Baseline**: strict types, no `any`; JSDoc on the component, every prop and every part; `forwardRef` on every part
  (`Toolbar.Item` forwards to the element it wraps); `className`/`style`/`id`/`data-testid` on the root; `{...props}` spread before
  the computed `role`, `aria-orientation`, `data-orientation` on the root and the group's `role` (a test passes the
  same-named props and reads the result); no hardcoded value; dev warning once for a missing name, on the bar and
  on a group; SSR-safe (the only browser access is `useResolvedResponsiveValue`'s guarded `matchMedia`); survives
  `StrictMode` (a test); no `labels` object, so no `mergeDefined`.
- **Composition checkpoints**: sub-part completeness (each part has JSDoc, a ref and a native-props story or prose);
  atom reuse (`Button`, `IconButton`, `Spacer`; `Divider` considered, see above); Radix prop audit against
  `ToolbarProps`' whole chain (`orientation`, `dir`, `loop` exposed; `asChild` on the root not, since the bar is its own
  element); consumed atoms: no defect found, `Button` and `IconButton` unchanged; **nested providers tested both
  ways** (a bar inside a disabled `ButtonGroup`, a `ButtonGroup` inside a disabled bar keep the outer settings);
  cross-part wiring (group and bar names are separate, nothing to id-wire); **composed tab order tested** (one tab
  stop in, one out, focus returning to the last-used item, a plain `Button` skipped).
- **Accessibility**: jest-axe clean for the full bar, vertical, outlined, filled, disabled and link-item forms, and the
  browser project's a11y scan on every story; arrow keys, `Home`/`End`, `loop={false}`, vertical (up/down only),
  `dir="rtl"` (left goes forwards) all tested; **a disabled or loading item that held the tab stop** leaves the bar
  reachable (found by writing the test, then mutated to confirm it bites); target size measured at all five sizes in a real
  browser (≥ 24 × 24px); a pressed toggle is announced with `aria-pressed` and drawn with a filled icon, not colour alone.
- **Responsiveness / RTL / forced colours**: a phone-width story asserts the column and the resolved
  `aria-orientation`; a real-browser story checks the first item sits at the right in `dir="rtl"` and the arrow
  pointing left goes forwards. Forced colours: the separator is a background colour, which forced colours recolours,
  and an outlined bar's border is a real border, so no extra rule was needed (not separately emulated).
- **Design quality, looked at**: all sizes, groups and separators, the spacer, vertical, in light/purple and
  dark/emerald. Findings fixed above (full-width stretch, faint dark separator).
- **Storybook**: Docs page in the 10-section template; Playground first, every prop live; three Properties tables
  (root, `Toolbar.Item`, `Toolbar.Group`, the last two on hidden docs-only stories per ADR-0013) with every
  description and default present, checked in the running page; a hand-written snippet under every story's "Show code",
  typechecked against the real components with a planted bad prop to prove the check bites; a docs test holds the
  token table to the stylesheet in both directions; hidden real-browser stories for keyboard focus ring, RTL, layout
  (spacer pushes to the far end, the rule has size), target size, vertical, phone and pressed state.
- **Verification run**: `pnpm lint` (eslint, both typechecks), `pnpm test` 5,197 tests, `pnpm test:storybook` 987 tests,
  `pnpm -r build`, `check-component-bundle-size`, `check-foundations-token-coverage`, `pnpm audit` (the one accepted,
  documented advisory only). Mutation checks: breaking the vertical flex direction and the separator width failed three
  browser stories; dropping `disabled` from the roving item failed two unit tests.

## Found along the way (not component defects)

- **Adding a dependency while Storybook is running leaves its pre-bundle cache serving two copies of React** to the new
  package ("Invalid hook call … reading 'useMemo'" from `Toolbar`), though the Vitest browser run passes. A plain restart did
  not clear it; deleting `packages/components/node_modules/.cache/storybook` and restarting did. Worth knowing for the next
  new Radix package.
- `react-hooks/refs` rejects a "warn once" helper hook that reads a ref during render; the established inline form
  (as in `ButtonGroup`) passes, so the warning is written inline in each of the two places.
- Radix's `Separator` leaves `aria-orientation` off a horizontal one (the ARIA default), so a test asserts
  `data-orientation` for that case.

## Gaps named, not built

- **`Toolbar.ToggleGroup`**: a `ToggleGroup` in a toolbar is a second roving-focus group; Radix has a special part for
  it. Toggles are covered by `pressed` icon buttons for now.
- **Overflow menu** (items that don't fit collapse into a "…" menu): `wrap` and an `orientation` map cover narrow screens;
  an overflow menu needs the `Menu` organism.
