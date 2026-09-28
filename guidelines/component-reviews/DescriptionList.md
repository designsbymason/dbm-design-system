# DescriptionList

Molecule, Data Display. Build session: 2026-09-27. Not yet Finalized — awaiting the user's review/declaration; a full `06-engineering-standards.md` §9 pass has not been completed (this entry records the initial build, including one real defect found and fixed during the build itself).

## What it is

A compact key/value display block: real `<dl>` semantics. `DescriptionList` is the `<dl>`; `DescriptionList.Item` wraps one `DescriptionList.Term` (`<dt>`)/`DescriptionList.Details` (`<dd>`) pair in its own `<div>` (an HTML5-valid grouping). `variant` (`bordered`/`ghost`, mirroring `Table`'s exact vocabulary), `size` (the shared 5-step scale), `orientation` (`horizontal`/`vertical` — horizontal wraps the details below the term via plain CSS `flex-wrap` once the item's own container narrows too far, with no breakpoint configuration needed), and `columns` (`Responsive<number>`, a CSS Grid of items with `DescriptionList.Item`'s own `span` as an escape hatch for a wide value).

## Design decisions made without a prior spec (inventory only said "Key/value display block")

- **No `tone` prop.** Unlike `Table`/`Card`, this is a plain content-display block, not a feedback-type component — tone was judged not to genuinely apply (`06-engineering-standards.md` §9's "never forced onto a component where they don't apply").
- **No `striped`/`hoverable`.** `Table` already covers the many-row, eye-tracked case; a `DescriptionList` is typically a handful of fields. Considered and deliberately deferred, not built.
- **No title/actions slot.** A consumer composes a heading via `Card.Header` (or any heading) above the list instead — keeps this component focused, matches "composition over configuration."
- **The automatic between-item divider (bordered/ghost) only draws when `columns` is left at its default of `1`.** A wrapping multi-column grid can't correctly show both row and column boundaries with a single divider line without a real `<table>` (which a `<dl>` correctly isn't) or knowing which items fall in the visual last row (not statically knowable once column count changes per breakpoint). Documented in `DescriptionListProps.columns`'s own JSDoc and the MDX Usage guidelines' Don't list.
- **`orientation` is not responsive (a plain value, not `Responsive<T>`).** The horizontal case degrades via CSS `flex-wrap` — genuinely container-width-driven, arguably better than a viewport-breakpoint map here. `columns` stays `Responsive<number>` since collapsing an actual grid-column count needs real breakpoints, which `flex-wrap` can't do.
- **`DescriptionList.Details`'s `numeric` sets `tabular-nums` only, no alignment change** — unlike `Table.Cell`'s `numeric` (which end-aligns), a standalone details value isn't part of a dense multi-row numeric column, so end-aligning it would look adrift from its term. Documented explicitly as a deliberate difference in the prop's own JSDoc.

## Real defect found and fixed during the build (not by a separate review pass)

**A spanning item broke `columns`' responsive collapse (found live, real browser, desktop→mobile viewport check).** `DescriptionList.Item`'s `span` was applied as a literal `grid-column: span N` inline style. When `columns` resolved to `1` at a narrow viewport (e.g. `columns={{ base: 1, md: 3 }}` on mobile) but an item still requested `span={3}`, CSS Grid implicitly widened the grid to fit the span request — regenerating 3 columns via auto-sized implicit tracks even though the explicit grid was 1 column, breaking the whole point of the responsive collapse. Confirmed via `getComputedStyle(dl).gridTemplateColumns` showing three uneven auto-sized tracks (`0px 81px 109px`) at a 320px viewport, instead of one full-width track.

**Fix:** `columns` (the raw `Responsive<number>`, not resolved) is now threaded through `DescriptionListContext`; `DescriptionList.Item` resolves it to the real, currently-active column count via `useResolvedResponsiveValue` (the same `matchMedia`-based hook `Popover`'s `side` and others already use for values that can't be expressed as pure CSS cascade) and clamps `Math.min(span, resolvedColumns)` before writing `grid-column`. Verified live at both a 320px and a ~1100px real iframe width, in both directions (3 columns at desktop, correctly collapsing to 1 with no implicit-track regression at mobile).

## Verification performed this session

- Unit tests (16, `DescriptionList.test.tsx`): rendering, real `<dl>`/`<dt>`/`<dd>`/wrapping-`<div>` structure, every prop default, variant/size/orientation class application, the columns→dividers interaction, `--dl-cols-*` custom properties (plain number and responsive map), `span`→`grid-column` (including the clamp fix), the non-positive-`span` dev warning (fires once, ignored value), `numeric`, aria-label/labelledby/describedby, ref forwarding (root + all three sub-parts), className/style/id/data-testid passthrough (root + sub-parts), jest-axe (bordered, ghost, vertical, multi-column) — all pass.
- `pnpm --filter @dbm-design-system/components exec tsc --noEmit` — clean.
- `eslint --max-warnings 0` on the new files — clean.
- `storySnippets.test.ts` (guards every `*.snippets.ts`) — passes with the new file included.
- Full package unit-test project (`vitest run --project unit`, 90 files / 4603 tests) — all pass, no regressions.
- Docs page (`DescriptionList.mdx`) visually verified live in a running Storybook instance: Playground (live controls, all working), Properties table (every Default populated correctly on first pass — no docgen-drop shape hit), all 5 variant/gallery stories, Usage guidelines Do/Don't grid, Accessibility callout, Design tokens table, Related components (3 live mini-previews) — checked in Purple/Light, Purple/Dark, and Emerald/Dark.
- One MDX authoring bug caught and fixed the same way `07-storybook-and-documentation-standards.md` already documents: backslash-escaped quotes inside a `<TokenRow usage="...">` attribute (`size=\"xs\"`) broke the whole MDX parse — switched to single quotes (`size='xs'`) per the established convention.
- Multi-column responsive collapse verified live at a real 320px and ~1100px iframe width (not just reasoned about) — this is what caught the span-clamping defect above.

## Not yet done (this is a build session, not a full review pass)

- The full `06-engineering-standards.md` §9 checklist has not been run end to end (jest-axe covers automated a11y, but manual keyboard-nav verification, an RTL/`dir` pass, a forced-colors check, and the real-browser `@storybook/addon-vitest` Chromium project run were not completed this session — the ordinary unit-test project and manual browser-pane checks were used instead).
- No `DescriptionList.docs.test.ts` CSS-vs-mdx token drift guard yet (the `CodeBlock`/`Stat` pattern) — the token table was written and cross-checked by hand against the stylesheet's actual `--dbm-*` usages, not yet enforced by a test.
- `04-component-inventory.md`'s molecule build-order list and `07-storybook-and-documentation-standards.md` §6's status table have not yet been updated to reflect this build (pending — see this session's own follow-up).
- Other Finalized components' Docs pages (`Table.mdx`, `Card.mdx`, `EmptyState.mdx`) do not yet cross-link back to `DescriptionList` via `RelatedCard` — not touched, since editing an already-Finalized component's files needs the user's go-ahead first.
- Not marked Finalized — that is the user's call to make, not something this session asserts.
