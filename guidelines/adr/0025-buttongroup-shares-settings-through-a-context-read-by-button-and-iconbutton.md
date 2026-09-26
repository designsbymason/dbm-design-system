# 0025 — `ButtonGroup` hands its settings to the buttons through an internal context that `Button` and `IconButton` read, over layout-only grouping or `cloneElement`

**Status:** Accepted · **Date:** 2026-09-26

## Context
A group of buttons needs two things a plain container can't give it. **Shared settings:** a group of five wants `variant`, `size` and `disabled` said once, not on every button. **Separators that suit each button:** a fused group has to draw where one button ends and the next begins, and that depends on the variant — a solid fill needs a hairline, a bordered `secondary` needs its borders overlapped into one line, a `tertiary` has neither fill nor border and needs a rule. A container that can't see its buttons' variants can't choose.

The buttons are the consumer's own `Button`s and `IconButton`s, often wrapped (a `Tooltip` or menu trigger with `asChild`), and both are Finalized atoms that read no parent context today.

## Decision
`ButtonGroup` provides a small **React context** (`variant`, `size`, `rounded`, `disabled`), and `Button` and `IconButton` read it:

- **A button's own prop wins** over the group's (`own ?? group ?? default`). **`disabled` is the exception:** the group *or* the button disables it, so a disabled group can't be undone by a button that says `disabled={false}`.
- **Outside a group nothing changes:** the context is `null`, every resolved value is what it was, and the atoms emit no extra output. **Inside one, a button also emits `data-variant`**, which the group's stylesheet reads to draw the right separator for that variant. The corners, the overlap and the stretching are the group's CSS, not the atoms'.
- **The context is not exported from the package.** It lives beside the atoms that read it (`atoms/Button/buttonGroupContext.ts`) because an atom may not import from a molecule; `ButtonGroup` imports it from there.
- **An `IconButton` keeps its size as a minimum** (`min-height`/`min-width` repeat its `height`/`width`, unchanged on their own), so a group can let it stretch to its row without a row of only icon buttons collapsing.

The two atoms changed **additively**, so they stay Finalized under the three-question test; the new behaviour got its own scoped tests in the group's suite.

## Alternatives considered
**Layout-only grouping (no propagation)** — rejected. It touches no atom, but every button keeps repeating its variant, size and disabled, and, worse, the group can't know a button's variant, so it can't draw a separator that suits it: filled buttons, bordered ones and text-only ones would all need the same line, which is right for at most one of them.

**`cloneElement` injection** — rejected, for the reason [ADR-0015](0015-formfield-render-prop-over-cloneelement-or-shared-context.md) already gave for `FormField`: it only reaches the group's *direct* children, so a `Tooltip`- or menu-wrapped button silently gets nothing, and a wrapped child that forwards unknown props onward can put them on the wrong element. Context reaches every button under the group whatever wraps it.

**A `ButtonGroup.Button` sub-part** — rejected: it would make every group re-wrap the atoms, drop `asChild` and `Tooltip` composition, and give agents two button components to choose between.

## Consequences
- A group's settings reach a `Button` or `IconButton` wherever it sits in the tree; the separators and corners work with any variant and mix.
- `Button` and `IconButton` no longer take `variant`, `size` and `rounded` as destructuring defaults (they can't tell an explicit `"primary"` from an absent prop); their Properties tables lose the Default column that docgen read from those defaults, so each states them explicitly (`table.defaultValue`, `07-storybook-and-documentation-standards.md` §4.1).
- **Constrains what follows:** `ToggleGroup` and a future `Toolbar` that group buttons can reuse this context (or extend it) rather than inventing another way for a parent to reach a button; an atom that a molecule needs to configure reads an optional context defined beside it, never the molecule's own module.
- A button that is not a `Button` or `IconButton` (a bare `<a>`, a custom element) is laid out by the group but takes none of its settings, and gets no separator.

## Related
`05-component-api-conventions.md` §3, `component-reviews/ButtonGroup.md`, [ADR-0015](0015-formfield-render-prop-over-cloneelement-or-shared-context.md) (the same choice for `FormField`). Affects `Button`, `IconButton`.
