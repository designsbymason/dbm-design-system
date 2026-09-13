# 0014 — `Radio` self-wraps a private Radix group standalone, over a native `<input>` or a narrower atom bar

**Status:** Accepted · **Date:** 2026-09-14

## Context

[ADR-0012](0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md) set the
bar for atom-tier in a "container + item" pair: the item must render/function correctly with no
required ancestor. Building `Radio` (atom) ahead of `RadioGroup` (molecule) hit a case that ADR
didn't anticipate: Radix ships no standalone single-radio primitive. `@radix-ui/react-radio-group`
is Root + Item + Indicator only, and `Item` requires a `Root` ancestor to function at all (confirmed
by reading the installed package's own compiled source, not assumed) — unlike `Checkbox`/`Switch`,
each of which wraps its own standalone Radix Root directly. A `Radio` built as a thin thin wrapper
around `Item` alone would not clear ADR-0012's own bar when used with no `RadioGroup` ancestor.

## Decision

`Radio` always renders Radix's real `RadioGroupPrimitive.Item`/`Indicator`. A small internal
`RadioGroupContext` (a plain boolean, default `false`, not exported from the package barrel) signals
whether a real ambient Radix `Root` is already present:

- **Grouped** (`RadioGroupContext` is `true`, provided by `RadioGroup`, the molecule): `Radio`
  renders only `Item`/`Indicator`, participating in the shared group's own `value`/`onValueChange`.
  Its own `value` prop identifies it among siblings.
- **Standalone** (no ancestor `RadioGroup`): `Radio` silently wraps `Item`/`Indicator` in its own
  private, single-item `RadioGroupPrimitive.Root`, translating a boolean `checked`/`defaultChecked`/
  `onCheckedChange` API (mirroring `Checkbox`) into that Root's own `value`/`defaultValue`/
  `onValueChange`. Real Radix keyboard/ARIA/focus behavior works standalone as a result — a lone
  `role="radio"` inside its own `role="radiogroup"` wrapper of one.

`RadioGroup` (not yet built) will provide `RadioGroupContext` as `true` around every `Radio` it
renders, using the same real Radix `Root` its own context signal points at.

## Alternatives considered

**Native `<input type="radio">`, no Radix dependency at all.** `Radio` implements its own local
checked state directly, with no Radix wrapper; `RadioGroup` separately wraps Radix's real
`Root`/`Item`/`Indicator` for its own internals, visually matched to `Radio` via shared CSS. Rejected
— breaks from this project's established "every component needing Radix imports it directly"
pattern for this one atom, and creates two independent implementations of the same visual control
(native-input-based standalone, Radix-based grouped) that have to be kept in visual/behavioral sync
by hand rather than by construction.

**A narrower atom bar, documented as an exception.** `Radio` stays presentational/structural
standalone — renders without crashing, but full interactive keyboard/ARIA radio behavior requires a
real `RadioGroup` ancestor. Rejected — this doesn't actually clear ADR-0012's own "renders/functions
correctly standalone" bar, it just says so isn't required this once; every other atom in the
inventory (including `GridItem`/`ListItem`, the pair ADR-0012 was written for) genuinely functions
standalone, keyboard included.

## Consequences

- `Radio`'s prop surface is dual-mode by construction: `checked`/`defaultChecked`/
  `onCheckedChange`/`name`/`required`/`form` are standalone-only (a dev-mode console warning fires
  once if any of these are passed while grouped, since the ambient group owns them instead); `value`
  is required in practice once grouped (a separate dev-mode warning fires if it's omitted there).
- **Standing pattern for any future atom whose only real Radix primitive is a compound one with no
  standalone building block of its own** (not yet hit again, but worth naming as the precedent): the
  self-wrapping dual-mode approach — real behavior via the real primitive either way, chosen over
  either forking the implementation (native vs. Radix) or narrowing what "renders correctly
  standalone" means.
- `RadioGroup`'s own build is constrained by this: it must provide `RadioGroupContext` (imported
  from `Radio`'s own folder — the ADR-0012 cross-tier-import precedent, direction inverted only
  because `Radio` was built first) as `true` around its own real Radix `Root`, not construct its own
  separate rendering path for the items it composes.
- A standalone `Radio`'s own private `Root` wrapper means `aria-required` (when `required` is set)
  lands on that wrapping `role="radiogroup"` div, not the `role="radio"` button itself — real Radix
  behavior, not a `Radio`-specific quirk, but worth knowing before writing a test against it (caught
  once already, see [Radio.md](../component-reviews/Radio.md)).

## Related

`guidelines/component-reviews/Radio.md` — the review pass this decision was made during, including
the real Radix API shape (verified from source) that the standalone/grouped prop split is built on.
[ADR-0012](0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md) — the
atom-tier bar this decision exists to satisfy.
`04-component-inventory.md` — `Radio`'s own inventory row.
