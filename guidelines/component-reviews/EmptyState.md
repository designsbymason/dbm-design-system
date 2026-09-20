# EmptyState — Storybook/component review findings

**Data Display:** EmptyState — built 2026-09-19, item 12 in the itemized molecule-tier build order
(`04-component-inventory.md`). Adds **one new component token** (`empty-state.content-max-width`) and no new dependency.
**Not Finalized** — the full `06-engineering-standards.md` §9 pass below is complete, but only the user declares a
component Finalized.

A compound component of native elements and three existing atoms: `EmptyState` (root) with `EmptyState.Icon`,
`EmptyState.Title`, `EmptyState.Description`, and `EmptyState.Actions`. Each sub-part's own props get a
`### EmptyState.{Part} properties` subsection on the Docs page via a hidden, docs-only stories file per
[ADR-0013](../adr/0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md).

## Decisions made during the build

The inventory only said "Icon + message + optional CTA". Unlike `Card`, none of these were put to the user first — they
are mine, made where the request left the API open, and listed here so they can be reversed cheaply.

- **Compound, not one props-driven component** (`<EmptyState icon title description action />`). Consistent with `Card` and
  `Table`, the two molecules built just before it; it keeps the heading level, rich description content, and any number of
  actions in the consumer's hands without a growing list of props (`06-engineering-standards.md` §2). The cost is verbosity —
  five lines instead of one — which the Docs page's snippets absorb. If a one-line shorthand is wanted, it can be added on
  top without breaking anything.
- **Sub-parts: `Icon`, `Title`, `Description`, `Actions`.** Anything else placed among them (an illustration `<img>`) is laid
  out in the same column, so there is no separate "media" part.
- **Root props: `variant`, `tone`, `size`, `align`.** Each traces to a named gap, not "make it fancier":
  - `size` — one component has to serve a table cell and a whole page; without it, consumers would re-pad it by hand.
  - `tone` — "nothing here yet", "you're all caught up", and "something went wrong" share one layout and differ only in
    feeling; the shared `tone` scale (`05-component-api-conventions.md` §2) is the established way to say that. It tints the
    icon badge only — a coloured border or fill would read as an alert, which is a different (future) component.
  - `variant` — `ghost` (default, no surface), `outlined`, `dashed`, `filled`. **`ghost` is the default** — the opposite of
    `Card`'s `outlined` — because an empty state is more often *inside* a container that already has a boundary (a `Card`, a
    `Table.Empty` cell) than a surface of its own; doubling the border is the more common failure. `dashed` is the familiar
    "put something here" placeholder; there is no `elevated`, which would make an empty state look like content.
  - `align` — `center` (default) or `start`. A centred empty state looks adrift in a layout that is start-aligned
    throughout. Implemented with logical values, so it mirrors under right-to-left text with no extra work.
- **`size` reaches the atoms through a small internal React context, not custom properties alone.** `Card` needed no context
  because its sections are plain `div`s styled from custom properties. Here the title, description, and icon are `Heading`,
  `Text`, and `Icon`, whose sizes are *props*, not something a stylesheet can override reliably (the atoms' own CSS Module rules
  and mine have equal specificity, so the winner would depend on stylesheet order). The context holds one value (`size`),
  defaults to `md` for a part used outside a root, and is per-root, so a nested empty state reads its own size (tested).
  Everything else — padding, gap, badge diameter, tone colours, alignment — still flows through custom properties.
- **Title is a real `Heading`, `level` defaults to 3.** An empty state sits inside a section, so one below the section's
  heading is the least-wrong guess; the Docs say to set it to fit the outline. `Heading`'s `as` (decoupling structure from
  looks) is deliberately not exposed — `level` is the only lever, and the `color` attribute an `<h3>` inherits from HTML is
  omitted from the props type since it would clash with `Heading`'s semantic `color`.
- **`role` is a documented prop, unset by default.** A static empty state adds no role; one that appears because of a search
  or filter should be `role="status"`. The Docs say that announcing an *inserted, already-filled* live region is inconsistent
  across screen readers, and recommend a stable `role="status"` wrapper where it matters, rather than promising more than
  the platform delivers.
- **Description is capped at a readable line length via a new component token,** `empty-state.content-max-width` (`28rem`).
  It has no home on the spacing scale (which tops out at `8rem`) and is a content-measure constraint rather than a gap, so
  it went to the component layer per `03-token-system-spec.md`'s order of preference, exactly as `tooltip.max-width` and
  `popover.max-width` did. Recorded in `03-token-system-spec.md`.
- **The icon badge keeps the system's subtle-tint language** (`bg.<tone>-subtle` + `icon.<tone>`; neutral is
  `bg.neutral-subtle` + `icon.default`). The icon is coloured from `icon.*` via `currentColor`, never `text.*`
  (`05-component-api-conventions.md` §6). On the `filled` variant the neutral badge would vanish into its own fill, so it sits
  on `bg.surface` there instead.
- **Static, so no `asChild`/`as`, no interactive states, no motion.** Nothing animates; there is no
  `prefers-reduced-motion` concern.

## Baseline correctness

- `forwardRef` on all 5 parts (root `div`; badge `div`; title heading; description `p`; actions `div`); a ref test covers each.
  `className`/`style`/`id`/`data-testid` accepted and documented on all 5, tested on each.
- `{...rest}` is spread first on every part; the only computed attributes (`className`, and on the icon the atom's own
  `role`/`aria-*`) come after it.
- Sub-part completeness: every sub-part has full JSDoc, its native props audited (`label` on the icon; `level` on the title;
  the clashing `color` omitted), and its own Properties table on the Docs page. Every prop in `EmptyState.types.ts` carries JSDoc
  (checked mechanically), and there is no `any`, `@ts-ignore`, or `eslint-disable`.
- **Atom-reuse audit:** the icon is `Icon`, the title `Heading`, the description `Text`. The one hand-rolled piece is the actions
  row — five declarations of flex layout — rather than `Stack`, because its justification follows the *root's* `align` through
  a custom property, which `Stack`'s prop-driven `justify` can't read without threading `align` through context too. The same
  call `Card.Footer` made. No defect was found in any consumed atom, so nothing there was reopened.
- Zero hardcoded values: the only literal in `EmptyState.module.css` is the `640px` in an `@media` condition (the value of
  `breakpoint.sm`, which custom properties cannot be used in — the same documented limitation `Card`, `Stack`, and `Grid` carry).
- No dev-mode warnings: there is no invalid prop combination to warn about — every combination the types allow is meaningful
  (`role` and `tone` are free, no prop depends on another).

## Accessibility

- A plain container by default: no role, not focusable, no tab stop. Verified live: on the search example the first Tab lands on
  the action button (2px solid focus ring) and the empty state's own root has no `tabindex`.
- The title is a real heading; `level` is settable. The icon is `aria-hidden` unless given a `label`, which makes it an
  `img` with that name. The parts read in DOM order and nothing is reordered visually, so reading and tab order always match the
  screen.
- `aria-labelledby` pointing at the title's `id` names a `role="region"` empty state (tested); `role="status"` and `aria-label`/
  `aria-describedby` pass through (tested).
- **Contrast, measured from the built token values in all four themes** (non-text 3:1 for the icon; AA 4.5:1 for text):
  icon on its tinted badge — neutral 4.51 / 5.86, brand 7.03 / 8.29 (Purple light / dark) and **3.99** / 9.47 (Emerald light /
  dark), info 4.51 / 10.51, success 6.22 / 10.68, warning 4.59 / 10.44, danger 4.86 / 10.32 (light / dark; identical across
  brands). The lowest is Emerald light's brand icon at 3.99:1, which clears the 3:1 floor for graphics; the icon is also
  decorative by default. Text: `text.primary` on `bg.surface` 14.11 / 13.53, on the `filled` fill 13.53 / 9.66; `text.secondary`
  on `bg.surface` 6.88 / 10.47, on the `filled` fill 6.59 / 7.47 (light / dark). Everything clears AA.
- jest-axe clean on every variant, every tone, the default composition, `role="status"`, a labelled `region`, and inside a heading
  outline; axe also runs on every story in real Chromium.
- RTL: verified live under `dir="rtl"` — with `align="start"` the badge, title, description, and action all sit flush with the
  right edge (25px in, the same as the left edge in LTR).

## Responsiveness and theming

- **A real defect, found live at 375px:** at `xl` the 64px padding each side left the description a 165px-wide sliver on a phone
  (`lg` was similar at 48px). Fixed mobile-first: `lg` and `xl` start at `space.8`/`space.10` and step up to `space.12`/`space.16`
  at the `sm` breakpoint. Re-measured: at 375px the paddings are 16/24/32/32/40px and `xl`'s text column is 213px; at 768px they
  are 16/24/32/48/64px as designed. `xs`–`md` are unchanged.
- No page-level horizontal overflow at 375px on any story; the actions wrap, and long words break rather than overflow. The
  `Table.Empty` composition holds at phone width.
- All four themes covered by tokens alone — verified live in Purple and Emerald, light and dark (variants and tones),
  including the `filled` variant's badge switching to the surface colour so it stays visible.

## Storybook and documentation

Docs page follows the §4 template (ten sections, hidden Intro heading; the TOC lists exactly the template's sections — checked
in the DOM, after removing a stray `h2` a demo leaked into it). Ten visible stories — Playground, All variants, All tones, All
sizes, Alignment, Every part is optional, With an illustration, Search with no results, Inside a card, Inside a table — plus four
hidden sub-part stories. Three have `play` functions: **All sizes** (each step's icon badge is larger than the last, and
round), **Alignment** (centred content sits on the centre line; start-aligned content begins at the start edge), and **Search
with no results** (the status region carries the message, the icon stays out of the accessibility tree, and the title is a
level-3 heading). Every fixed-render story suppresses the controls it doesn't consume via a shared `noControls` map. Props read
variant → tone → size → align → role → aria-* → id → className → style → data-testid, matching Controls, Playground, and the
Properties table. The Playground has a Storybook-only `actions` control (a demo `EmptyState.Actions` row), kept out of the
Properties table the same way `Card`'s `media` is.

**"Show code"** — every visible story sets `parameters.docs.source.code` to a hand-written snippet from
`EmptyState.snippets.ts`, and the Playground builds its snippet from the live controls (only what differs from the defaults,
plus the demo's two actions when that control is on). Snippets name icons by name with a comment saying where they come from.
Checked three ways: the guard test `storySnippets.test.ts` (picks the file up automatically; the Playground builder is exercised
across a spread of args); a throwaway typecheck of every snippet and 240 Playground combinations against the real components
(clean, and a planted bad prop was caught); and a settled read of all ten panels on the live Docs page, none showing generated
artefacts. The Playground's canvas and snippet were both confirmed to follow its controls live.

## Functional verification

- 63 unit tests (React Testing Library + jest-axe): structure and DOM order, every variant, size, tone, and alignment (with the
  atoms' own size classes asserted at each step), nesting isolation, the icon's decorative/labelled modes, every heading level,
  accessibility wiring, native-attribute passthrough, refs on all 5 parts, and jest-axe scenarios. Class-name assertions were
  confirmed to be non-vacuous (the CSS-module classes resolve to real strings in the test environment).
- Full package: `eslint --max-warnings 0` and both `tsc --noEmit` passes clean; `tsup` build; `storybook build`; and all three CI
  checks (`check-component-bundle-size` — `EmptyState` at 2.88KB JS / 1.45KB CSS gzipped, which includes the three atoms it
  composes, within budget; `check-foundations-token-coverage`; `check-storybook-bundle-size`). Final counts are in the status entry
  below.

## Gaps named, not built

Left out deliberately; each can be added without breaking the current API:

- **A responsive `size`** (`{ base: "sm", md: "lg" }`, as `Stack` and `Card`'s `orientation` take). The two large sizes already
  step their padding down on a phone, which covers the common case; a full map is only worth it if a real case wants a
  different *type* size per breakpoint.
- **An icon without the badge** (a bare, larger, muted glyph). An illustration child already covers "no badge"; a `bare` option
  is only worth adding if that turns out not to be enough.
- **A one-line props shorthand** (`icon`/`title`/`description` on the root). See the first decision above.
- **`Table` and `Card` docs linking back to `EmptyState`.** Both are Finalized, so their Docs pages weren't touched; `EmptyState`'s own
  page links to both.

## Status

Built 2026-09-19 and fully reviewed against `06-engineering-standards.md` §9; **not Finalized** — that is the user's call. Final
verification, run after the last code change (the responsive padding fix): `eslint --max-warnings 0` plus both `tsc --noEmit`
passes clean; the jsdom `unit` project 64 files / 2225 tests (63 of them `EmptyState`'s own, plus the snippet guard cases for
it); the real-browser `storybook` project 86 files / 544 tests, including axe on every story and all three `play` tests; `tsup`
build; `storybook build`; and every size, coverage, and audit check (`pnpm audit`: no known vulnerabilities). Per
`06-engineering-standards.md` §9, once Finalized, don't change `EmptyState` (code, stories, docs, or the token only it uses)
without asking first.
