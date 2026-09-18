# 0019 — `Table` owns an overflow-aware scroll container and puts native props on the `<table>` element

**Status:** Accepted · **Date:** 2026-09-18

## Context
`Table` is the first molecule with no Radix primitive underneath it, and the first whose responsive
behavior is a structural concern rather than a styling one: a `<table>` can't shrink below its
content's minimum width, so on a narrow viewport it either overflows the page or must scroll inside
its own frame. `06-engineering-standards.md` §5 makes "responsive is not optional" a hard standard,
so leaving that to every consumer was never a real option — which raised three linked questions the
guidelines didn't answer:

1. Does `Table` render the scroll frame itself, or leave it to the consumer?
2. If it does, which element gets `ref`, `className`, `style`, `id`, `data-testid`, and the `aria-*`
   props — the frame or the `<table>`?
3. A scrollable region must be operable from the keyboard (WCAG 2.1.1), but a permanent tab stop on
   every table that happens to fit is noise. How should the frame handle focus?

## Decision
**`Table` always renders its own scroll frame** — a `<div>` wrapping the `<table>` with
`overflow: auto`, so a wide table scrolls sideways inside its own bounds and never overflows the page.
The same frame is the scroll container `position: sticky` resolves against for `stickyHeader`, and
clips the bordered variant's rounded corners.

**Native props, `ref`, and `className`/`style`/`id`/`data-testid`/`aria-*` apply to the `<table>`**, where
assistive technology and consumers expect them (`aria-labelledby`, `aria-describedby`, an `id` for another
element to reference). Two dedicated props target the frame instead: `containerClassName` (its classes)
and `maxHeight` (its height cap, which `stickyHeader` requires).

**The frame is focusable only while it actually overflows.** It becomes `tabIndex={0}` — and, when there's
a name to give it, `role="region"` named from `aria-label`, then `aria-labelledby`, then the table's own
`<caption>` — only while its content overflows on either axis. When the table fits, the frame has no
`tabindex` and no role. Overflow is read with `useSyncExternalStore` (subscribing to `ResizeObserver` on
the frame and the `<table>`), not with an effect that sets state.

## Alternatives considered
**Render a bare `<table>` and leave overflow to the consumer.** Rejected: it makes responsiveness every
consumer's problem and silently ships an unresponsive default, against the system's own standard. Agents,
the primary audience, would have to know to add a wrapper every time.

**Put `ref`/`className`/`style` on the frame, native attributes on the `<table>`.** Rejected: it splits one
component's identity across two elements by prop, so the "obvious" prop (`className`) doesn't reach the
element people mean when they say "the table" — the exact ambiguity a compound component's API should not
introduce. One rule ("everything goes on the `<table>`, the two `container*`/`maxHeight` props go on the
frame") is simpler to state and to document.

**Make the frame always focusable.** Rejected: a tab stop on every table, including the vast majority that
never scroll, is real keyboard-navigation cost paid to satisfy a rule that only applies to the ones that do.

**Detect overflow in an effect + `ResizeObserver` callback.** Tried first and rejected after it failed in a
real browser: the observer's first callback arrives one async tick after mount, leaving a window where the
frame scrolls but isn't focusable — caught as a genuine `scrollable-region-focusable` violation by the
Storybook accessibility check, which runs the instant a story renders. `useSyncExternalStore` re-reads the
DOM right after the first commit and re-renders synchronously before paint, so the frame is correct on the
first frame; it also satisfies this repo's lint rule against setting state inside effects.

## Consequences
- **Standing pattern for any future component whose content can outgrow its box** (`DataTable`, a
  `CodeBlock`, a `Tree`): own the scroll frame, make it focusable only while it overflows, and name it from the
  component's own accessible name. `DataTable`, which builds on `Table`, inherits this directly.
- `Table` is wrapped in one extra DOM node, which matters for any consumer CSS that targets a `<table>`'s
  parent. `containerClassName` is the supported hook for that frame.
- `stickyHeader` has a hard dependency on a bounded frame height: without `maxHeight` (or a constrained
  `containerClassName`) it does nothing, and `Table` warns once in development rather than failing silently.
- Reading layout (`scrollWidth`/`clientWidth`) happens when `Table` renders, not only inside the observer —
  a deliberate, small cost of being correct on the first frame.

## Related
`05-component-api-conventions.md` §4 (compound components) and
[ADR-0013](0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md) (how each
sub-part's props are documented). `06-engineering-standards.md` §5 (responsiveness). `component-reviews/Table.md`
for the full build and verification record, including the live-browser finding that produced the
`useSyncExternalStore` design.
