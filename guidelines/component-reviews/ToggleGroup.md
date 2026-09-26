# ToggleGroup

**Tier:** molecule · **Category:** Inputs & Forms · **Status:** built 2026-09-26; **awaiting the final review pass and the user's sign-off** (only the user declares a component Finalized).

## What was built

A compound component (`ToggleGroup` + `ToggleGroup.Item`), item 19 in the itemized molecule build order (`04-component-inventory.md`): a segmented control over Radix `ToggleGroup`. One new dependency, `@radix-ui/react-toggle-group` (the Radix interaction layer already approved in `02-tech-stack-and-structure.md`). No new token and no component token.

Group props: `type` (`single` default, or `multiple`), `value` / `defaultValue` / `onValueChange` (a string for single, an array for multiple), `deselectable` (single only), `variant` (`subtle`, `outlined` default, `solid`), `size` (`xs`–`xl`, default `md`), `rounded`, `attached` (default `true`), `orientation` (or a breakpoint map through `useResolvedResponsiveValue`), `fullWidth`, `disabled`, `loop`, `dir`, `aria-label` / `-labelledby` / `-describedby`, `id`, `className`, `style`, `data-testid`. Item props: `value`, `children`, `icon`, `disabled`, `asChild`, `aria-label` / `-labelledby`, `id`, `className`, `style`, `data-testid`.

## Decisions taken while building

Both were chosen by the user before the build.

- **The items have their own segmented-control look**, not `Button`s in a context ([ADR-0025](../adr/0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md) covers the ButtonGroup case only): variants are named as `Tabs` and `Tag` name theirs (`subtle`, `outlined`, `solid`), sizes match `Button`'s heights through the `icon-button.size.*` tokens, and the layout (fused or spaced, row or column, breakpoint map) matches `ButtonGroup`. No Finalized atom was touched.
- **A single group keeps one item chosen once it has one; `deselectable` opts back in** (default `false`). Radix's single group lets the chosen item be clicked off, so the component always controls the value internally and ignores the empty string unless `deselectable`.
- **Roles are Radix's, and are not overridable:** single is `role="radiogroup"` of `radio` items (`aria-checked`), multiple is `role="toolbar"` of toggle buttons (`aria-pressed`). `role` and `data-orientation` are applied after the consumer's rest props (the props-ordering bug class from earlier reviews).
- **`dir` is a prop, passed to Radix and defaulted to `ltr`,** not read from the page.
- **Attached looks:** inner corners squared with logical properties, bordered variants overlap by `border-width.1` so neighbours share one line, the chosen item sits above its neighbours (`z-index.base`) so its brand border isn't hidden, and the focus ring is drawn inside the item (`outline-offset` of minus `border-width.2`), in `icon.on-brand` on a chosen solid item, so a neighbour never hides it and it reads on the fill (the remedy `05` §6 names, and the one the ButtonGroup review left open).
- **A spaced row wraps; an attached one never does.** Nothing moves or resizes when the choice changes in any variant.

## Verification (2026-09-26)

- **Unit** (`ToggleGroup.test.tsx`, 52): roles and names, the no-name warnings (group once, each unnamed icon-only item), ref and attributes, `role` and `data-orientation` not overridable, single (default, click, one stays chosen, `deselectable`, controlled, parent state), multiple, keyboard (one tab stop, arrows, loop, Home/End, Space/Enter, disabled skipped, vertical, right-to-left), disabled, layout classes and the breakpoint map, items (icon, icon-only, attributes, ref, `Tooltip` with `asChild`), `StrictMode`, and jest-axe across every look, orientation, right-to-left, multiple and icon-only.
- **Real browser** (`storybook` project, 8 hidden `!dev` stories): corner radii in a row, a column, right-to-left, a pill, a spaced group and a group of one; per-variant fill and border colours resolved from tokens, shared one-line borders, the chosen item's `z-index`, and that choosing moves nothing; the focus ring inside an attached item (and in the on-brand colour on a chosen solid one), outside a spaced one; 24 × 24px targets at every size, both orientations, labelled and icon-only; equal shares with `fullWidth`, a column's uniform width, one height for a mixed row, the spaced gap, wrapping when spaced and not when attached; a breakpoint map stacking on a phone-width viewport; the keyboard order in left-to-right and right-to-left. **Broken on purpose, each seen to fail:** no overlap, ring offset outside, no chosen `z-index` (the last one was not caught until a `z-index` assertion was added).
- **Playground snippet** guarded in `src/storySnippets.test.ts` (real-snippet check, defaults omitted, starting choice per type, `deselectable` only for single, invalid values ignored, item count clamped); every static snippet is picked up by the same file's automatic check and typechecked against the real components with real icons.
- **Whole pipeline:** `pnpm lint`, `pnpm build`, all 3,065 unit tests, all 760 real-browser tests, the Playwright visual suite (8/8), the static Storybook build and its size check, the component size check, token coverage, and `pnpm audit`.
- **Live:** the Docs page renders with no errors, 22 Properties rows with the right defaults and value options, and the `ToggleGroup.Item` table.

**Not yet verified:** the Docs page and the group visually (the browser pane was not displayed while building, so no screenshots were taken), dark mode and Emerald, the hover states, a 320px viewport, and a real screen reader. These belong to the final review pass.
