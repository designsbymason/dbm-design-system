# 0041 — RatingInput is a native radio group, with two radios per icon at half steps, over a slider role

**Status:** Accepted · **Date:** 2026-10-04

## Context
A rating is a short ladder of choices drawn as icons, with a value of `0` for none and an optional half-step precision. There are two honest ways to build it: a group of radios (the pattern the ARIA practices guide gives for a star rating), or one focusable element with `role="slider"`. The choice decides how much keyboard, pointer, form and screen-reader behaviour is the browser's own and how a half step is expressed.

## Decision
- **One native radio input for each value**, visually hidden and laid over the icon it belongs to, in a `role="radiogroup"` (`aria-invalid`, `aria-required`, `aria-describedby` on the group). A choice is named "3 out of 5", with the value's name added ("3 out of 5, Good") when `valueNames` is given.
- **At `precision={0.5}` each icon has two radios**, one over each half, so a half step is a real choice with its own name, reached by the arrow keys and by pressing the left half of an icon.
- **The value is a number**, `0` for no rating; interactive values sit on a step, and a **`readOnly` rating is not a group of disabled radios but one `role="img"`** with a text alternative, drawing any value exactly (a clipped filled icon over the outline).
- **The radios share a name even when the component has none**: a generated one, with a `form` attribute pointing at nothing so they belong to no form and submit nothing, keeps them one group (one tab stop, arrow keys) without polluting a surrounding `<form>`. An empty `name` is treated as no name.
- **The scale always reads left to right**, like a number, whatever the page's direction.

## Alternatives considered
- **One `role="slider"` element:** handles any precision naturally, but the arrow-key, Home/End, pointer-drag and value-announcement code is hand-written, "no rating" has no natural form, and a hidden input is needed for forms. A rating isn't continuous, so the control's own semantics (a value on a range) say more than it means.
- **Radix `RadioGroup`:** it draws its own indicator and has no way to put two radios over one icon; a native radio is the lighter and more direct fit, and the existing `Radio` atom is a labelled-option control, not an icon.
- **Half steps by one radio per icon with a pointer position:** the keyboard would have no way to reach a half.
- **Disabled radios for `readOnly`:** a screen reader would read five disabled radios and a stray "not checked" for an average of 4.3.

## Consequences
- Tab, arrow keys, `required`, form submission and radio announcements are the browser's own; the hover preview, the clear gesture, the fractional fill and the half-width hit areas are the component's.
- Pressing a chosen radio again fires no change event, so clearing is handled on click (and on Backspace, Delete and Escape for the keyboard).
- A real browser matters here: an empty-string `name` silently ungrouped the radios (separate tab stops), which only showed in Chromium, not in jsdom.
- A `:has(:focus-visible)` ring draws around the icon that holds focus, since the radio itself is invisible.

## Related
`RatingInput` ([RatingInput.md](../component-reviews/RatingInput.md)); [ADR-0040](./0040-pininput-is-one-real-input-drawn-as-cells-over-an-input-per-cell.md), the same "one real control, drawn" reasoning for `PinInput`.
