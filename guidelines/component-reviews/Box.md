# Box — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-02 — the first real one; Box had a
Docs page since early on but was explicitly logged as "template-proving pass only, no findings
recorded," never checked against the full checklist. Implementation was already sound (clean
polymorphic `as` pattern via the standard `forwardRef`-plus-cast workaround, no unnecessary
opinions — Chakra's/MUI's own `Box`-equivalents add a style-prop system, which would directly
contradict this project's own "CSS Modules, no CSS-in-JS" decision, so not counted as a feature
gap). Findings were real, concrete gaps, including one genuine bug.

**Fixed:**
- **`style`'s control in the Docs page's embedded Playground was broken** — confirmed live:
  `PlaygroundControls`'s widget-dispatch logic (`.storybook/blocks/PlaygroundControls.tsx`) has no
  branch for object-typed props, so `style` fell through to a plain text `Input` bound via
  `typeof value === "string"` (always `false` for an object) — permanently blank, and typing into
  it would have silently corrupted `style` into a string. The native per-story Controls tab
  (outside the Docs embedding) already renders it correctly via a real object editor. Fixed by
  adding `"style"` (and `"id"`/`"data-testid"`, once those existed — see below) to
  `<PlaygroundControls exclude={[...]}>`, matching how other non-representable props are already
  excluded elsewhere.
- **`id`/`data-testid` weren't declared on `BoxProps` at all** — confirmed via the rendered
  Properties table (only 4 rows before this fix: `as`/`children`/`className`/`style`). Added both
  with JSDoc, adapted for the generic `<E extends ElementType>` signature (redeclaring inside the
  intersected object type ahead of `& Omit<ComponentPropsWithoutRef<E>, "as" | "children">` — no
  conflict, since the redeclared types are identical to what `Omit` would already carry through).
  `Container.types.ts` has this same gap — not touched here, out of scope until Container's own
  review, but worth flagging for whoever picks that up.
- **`Container` `RelatedCard` preview was barely visible** — the exact same full-width,
  near-invisible thin-bar issue already found and fixed in `Bleed.mdx` this session; `Box.mdx` is
  actually where that pattern originated, predating any rigorous review. Fixed the shape (small
  square, matching the `Stack`/`Center` cards' own sizing) and, at explicit direction, switched
  every `RelatedCard` accent in this file (`Stack` ×3, `Container`, `Center`) from
  `bg.brand-subtle` to `bg.canvas`, matching the same swap already made in `AspectRatio.mdx`/
  `Bleed.mdx`.
- **jest-axe only covered `as="main"`, never the default (`as` omitted → `div`)** — the established
  convention (confirmed via `Avatar`'s own finding) is to check a *non-default* `as` in addition to
  the default; here the inverse gap existed (only non-default tested). Added both.
- **`Box.mdx`'s `propOrder` was incomplete** — `["as", "children", "className"]` omitted `style`
  entirely (fell through to an arbitrary trailing position). Updated to
  `["as", "children", "style", "className", "id", "data-testid"]` — `style` positioned right after
  the content props since it's Box's primary styling mechanism, per its own JSDoc.
- **Dead CSS module removed** — `Box.module.css`'s `.root {}` had zero actual declarations (the
  real `box-sizing: border-box` reset lives in `global.css`, applied project-wide, not through this
  module). Deleted the file and its `cx(styles.root, className)` usage in `Box.tsx`, which also
  simplified the component back to a single-expression body. Bundle size dropped as a side effect
  (0.16KB JS / 0.00KB CSS, down from a non-zero CSS contribution). `Box.mdx`'s "Design tokens used"
  wording tightened to match (no module at all now, not "no module beyond X").

Tests: 8 → 10 (added `id`/`data-testid` coverage, split the single a11y test into
default-element-and-non-default, per the finding above).

Self-verified: `tsc --noEmit`, `eslint`, full Vitest suite (846 tests package-wide), a real `tsup`
package build, and `check-component-bundle-size` (0.16KB JS / 0.00KB CSS gzipped — within budget).
Live-verified in a running Storybook instance: Playground, all 3 `as` variant stories, the
interaction-test story (`Interactions` panel: PASS, all 4 steps), the full Docs page section by
section, both brands × both modes, and mobile viewport (375px).

**Follow-up (2026-09-02, same day):** the raw per-story Controls addon panel (the "Controls" tab
visible when browsing a story directly, distinct from the Docs page's embedded
`PlaygroundControls`) still showed `style` with a live object-editor widget, inconsistent with
`className`/`id`/`data-testid` all correctly showing "–". Per the checklist ("use `control: false`
only for props that genuinely can't or shouldn't be live-edited"), and since the custom
`PlaygroundControls` widget-dispatch genuinely can't represent an object value at all (finding #1
above), treating `style` as non-interactive everywhere is the consistent call — matches
`AspectRatio`/`Bleed`/`Skeleton`'s own established `style: { control: false }` precedent, which
Box's own `style` argType had never picked up. Added `control: false` to `Box.stories.tsx`'s
`style` argType. Re-verified live: raw Controls panel now shows "–" for `style`, and the Docs
page's own Properties table is unaffected (its full description still renders — `control: false`
only disables the interactive widget, not the table row).

**Final end-to-end pass, 2026-09-02.** Re-ran the full checklist against the current state (post
all fixes above): `tsc --noEmit`, `eslint`, full Vitest suite (846 tests package-wide), a real
`tsup` package build, and `check-component-bundle-size` (0.16KB JS / 0.00KB CSS gzipped — within
budget). No new findings.

**Finalized 2026-09-02** — per `06-engineering-standards.md` §9's own note, don't make further
changes to Box (code, stories, docs, or its tokens) without asking first.
