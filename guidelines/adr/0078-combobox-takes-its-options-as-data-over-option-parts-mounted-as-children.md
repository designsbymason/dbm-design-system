# 0078 — `Combobox` takes its options as an `options` array, over `Combobox.Option` parts mounted as children

**Status:** Accepted · **Date:** 2026-10-16

## Context
`Select` and `Menu` are compound: the options are child parts. A combobox needs more of its list than they do. It
filters the options against the typed text, counts what is left to announce it, keeps `aria-activedescendant` in step
with a highlight that moves through exactly the visible options, shows an empty state when none are left, accepts a
new list on every keystroke when the caller fetches, and must draw only the rows in view when the list is long.
Each of those needs the list as data. Parts that register themselves as they mount (the way
[ADR-0068](./0068-toolbar-moves-what-doesnt-fit-into-a-menu-reading-its-parts-as-they-register-over-a-data-driven-item-list.md)
reads `Toolbar`'s) can't be counted before they exist or skipped when they are windowed out.

## Decision
`Combobox` takes `options: ComboboxOption[]` (`value`, `label`, optional `textValue`, `description`, `icon`,
`disabled`, `group`) and draws the rows itself, with an optional `renderOption` for content beyond that. It is a
single component with no sub-parts. This is a recorded departure from the compound pattern of
`05-component-api-conventions.md` §4, which that section doesn't extend to a component whose list is its data.

## Alternatives considered
- **Compound `Combobox.Option` / `Group` / `Empty` parts.** Rejected for the reasons above: filtering, counting,
  windowing and async all work on data, so the parts would be turned back into data by a registry that windowing
  breaks.
- **Both a data prop and parts.** Rejected: two ways to give the same list, and the parts path would carry every
  limit above.

## Consequences
- A consumer builds the array (a `.map` over their records) instead of writing JSX per option.
- An agent can read the whole API from one props type.
- `MultiSelect` and `CommandPalette` can reuse the same option type and list.
- Rich rows go through `renderOption`; a row that needs behaviour of its own cannot, which is the cost of not
  mounting arbitrary children inside a windowed list.

## Related
`05-component-api-conventions.md` §4; [ADR-0068](./0068-toolbar-moves-what-doesnt-fit-into-a-menu-reading-its-parts-as-they-register-over-a-data-driven-item-list.md).
