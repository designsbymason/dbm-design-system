# 0013 — A compound sub-part's own props get their own Properties table via a hidden, docs-only stories file — not a second sidebar entry, and not folded into the umbrella table

**Status:** Accepted · **Date:** 2026-09-14

## Context

`Select` (`05-component-api-conventions.md` §4's compound-component pattern) is the first
component in this codebase with a real dot-notation sub-part (`Select.Option`) to go through a
full review. Its Docs page's Properties table (`<PropertiesTable of={SelectStories} .../>`)
resolves argTypes from `SelectStories`' own `meta` — which is tied to `component: Select`
(`SelectRoot`), not `Select.Option`. `Select.Option`'s own props (`value`, `disabled`, `textValue`,
`asChild`, `id`/`className`/`style`/`data-testid`) had no home on the Docs page at all — a reader
consulting only the rendered page (not the source) had no way to discover them. `Grid`/`List`, the
only two molecules reviewed before this one, have no compound sub-parts, so this gap had never
come up.

`PropertiesTable`'s underlying mechanism (`useOf`, from `@storybook/addon-docs`) resolves argTypes
from a real, indexed CSF file's `meta` — it cannot target an arbitrary component reference that
isn't backed by one. Getting a live, auto-synced table for `Select.Option` therefore required a
second `meta`/story pair somewhere, which by default would appear as its own top-level entry in
the Storybook sidebar — wrong, since `Select.Option` isn't independently browsable; it only makes
sense inside a `Select`.

## Decision

Give the sub-part its own CSF file (`SelectOption.stories.tsx`, `component: Select.Option`) purely
for argType resolution, and tag its `meta` (inherited by every story in the file) with
`tags: ["!dev"]` — a standard, documented CSF3 tag, not an internal/unstable API (distinct from the
`manager.ts`-level Storybook internals `07-storybook-and-documentation-standards.md` §9 warns
about). This removes every story in the file from the sidebar/dev view while keeping it indexed for
`useOf` resolution from a Docs page via `<Meta of={...} />`/`<PropertiesTable of={...} />`. The
Docs page (`Select.mdx`) then adds a `### Select.Option properties` subsection right after the main
table, with its own `order` array and the same disclaimer-sentence convention (worded for
`Select.Option`'s own underlying `<div>`) as the umbrella table.

The sub-part's story must still render inside a real instance of its own compound-component family
(here, a real `<Select>` wrapping the `<Select.Option>`) — Radix's own context-scoped primitives
throw if rendered outside their required provider, and `@storybook/addon-vitest` renders every
story in the full suite (including `!dev`-tagged ones) as part of its normal sweep, so an
out-of-context render would fail CI, not just look wrong.

## Alternatives considered

**Fold the sub-part's props into the umbrella table as extra rows** — rejected. `PropertiesTable`
resolves one `meta`'s argTypes at a time; there's no supported way to merge a second component's
props into the same table without hand-maintaining a static, non-docgen-sourced list — which this
system's other tables deliberately avoid (drift risk, the same reasoning the Foundations pages'
"read live, never retyped by hand" convention already established).

**A second, visible sidebar entry** (a plain `Select.Option.stories.tsx` with no `!dev` tag) —
rejected. `Select.Option` has no meaning browsed on its own; a visible entry would misrepresent it
as an independently-usable component and clutter the sidebar for something that only exists to
supply the Docs page's own second table.

**`meta.subcomponents`** (Storybook's own first-class field for "auxiliary subcomponents... used by
addons for automatic prop table generation") — considered, since it's the API-native mechanism
named for exactly this. Not used: this project's own `PropertiesTable` is a fully custom block
(built because the stock `<ArgTypes>` doc block has no "Value options" column — see
`07-storybook-and-documentation-standards.md` §4.1), and how `useOf`/`resolveOf` would expose a
specific `subcomponents` entry's own argTypes to a custom block wasn't a documented, verified path
within the time this decision needed to be made — building on top of unverified internal resolution
behavior would repeat exactly the class of Storybook-internals fragility
`07-storybook-and-documentation-standards.md` §9 already warns about elsewhere. Worth revisiting if
a future compound-heavy review (`Tabs`, `Accordion`, `Menu`, `Dialog`, `DataTable`, `Form`) finds
the hidden-file approach doesn't scale — e.g., several sub-parts each needing their own table.

## Consequences

- **Standing pattern for any future compound component's own sub-part documentation**: a
  `{SubComponentName}.stories.tsx` file, `component` pointed at the real sub-part, `tags: ["!dev"]`
  on its `meta`, at least one story rendering the sub-part inside a real, valid instance of its own
  parent component family. The parent's own `.mdx` imports it (`import * as XStories from
  "./X.stories"`) and adds a `### {Sub}.{Part} properties` subsection with its own `order` array,
  positioned directly after the umbrella table.
- Every sub-part's own argTypes still need the same manual-`description` workaround as any other
  component when docgen doesn't reliably surface JSDoc (`07-storybook-and-documentation-standards.md`
  §4 item 3) — confirmed on `Select.Option`'s own `value` prop, where the required-prop asterisk
  needed an explicit `type: { required: true }` in the story's own argTypes to render at all,
  despite `value: string` (no `?`) being genuinely required in `SelectOptionProps`.
- No change to what ships in `@dbm-design-system/components` — the hidden stories file lives beside
  the component source but is Storybook-only tooling, same category as every other `*.stories.tsx`
  file.
- `@storybook/addon-vitest`'s full-sweep render now also exercises every hidden sub-part story —
  confirmed live on `Select.Option`'s own story (package-wide suite count moved from 1496 to 1497
  tests, 100 to 101 files, purely from this one addition) — so a future sub-part story that can't
  safely render outside its own required context will surface as a real, visible CI failure, not a
  silent gap.

## Related

`05-component-api-conventions.md` §4 — the compound-component pattern this documents the Docs-page
side of.
`07-storybook-and-documentation-standards.md` §4/§4.1 — the Docs-page template and
`PropertiesTable`/`useOf` mechanism this extends.
`guidelines/component-reviews/Select.md` — the full incident, including the required-marker fix.
`Select.mdx`/`SelectOption.stories.tsx` — the first real implementation.
