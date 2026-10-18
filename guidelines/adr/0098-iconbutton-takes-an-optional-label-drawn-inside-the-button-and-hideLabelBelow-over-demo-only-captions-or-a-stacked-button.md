# 0098 — `IconButton` takes an optional `label` drawn inside the button, with `hideLabelBelow`, over demo-only captions or a stacked `Button`

**Status:** Accepted · **Date:** 2026-10-18

## Context
A header's Account and Cart buttons want a word under the icon on a wide window and the plain icon on a phone. Drawn as a caption beside the button (the `Navbar` demo's own markup), the caption was not part of the control: hover, press and the focus ring covered only the icon square, and a click on the word did nothing. A real fix has the caption inside the interactive element. Two homes were weighed: a stacked layout on `Button`, whose label is `children` and whose box is padding-based, and an optional caption on `IconButton`, whose base state is already the icon-only square this case needs on a phone.

## Decision
- **`IconButton` takes `label?: string` and `hideLabelBelow?: "sm" | … | "3xl"`**, after `size` in the prop order. The caption is a one-line `<span aria-hidden="true">` inside the button under the icon. Without `label` the output, classes, sizes and tokens are exactly as before.
- **The box.** A captioned button is as tall as the icon over the caption needs and as wide as the caption needs, never narrower or shorter than the plain square of its `size` (the fixed `height` and `width` give way to `auto`, the existing `min-*` stay). Padding and gap use `space.*`, the caption `font-size.xs` (`xs`–`md`) or `font-size.sm` (`lg`, `xl`), `font-weight.medium`, `line-height.tight`. **No new tokens.**
- **`hideLabelBelow`** hides the caption below a width, a breakpoint step, and the plain square applies again. It is CSS only (a media query per step, as `Navbar`'s), so a server render is right at first paint. Left out, the caption shows at every width.
- **The caption is a `text.*` colour** (never `icon.*`: it is text, so the 4.5:1 floor applies), following the variant, the tone and the pressed state as the icon does: `text.on-brand` on `bg.brand` and on the solid pressed fill, `text.brand` on a transparent or subtle fill, `text.on-neutral` / `text.secondary` for the neutral tone, `text.on-danger` / `text.danger` for `destructive`. All were computed in the four themes; the one pairing under 4.5:1, `text.danger` on `bg.danger-subtle-hover` in light mode (4.44:1), is avoided: **a captioned `destructive` toggle keeps its pressed fill under the pointer.**
- **Pressed:** the caption goes bold and the box does not change size: a hidden, zero-high copy of the text in bold (`::after`, `content: attr(data-label) / ""`) holds the bold form's width.
- **`aria-label` stays required**, since the button is icon-only below `hideLabelBelow`, and a development warning fires when it doesn't contain the caption (WCAG 2.5.3, label in name).
- **Combinations that warn in development and take the stated effect:** `asChild` (no caption: Radix `Slot` takes one child), `rounded`, own or a `ButtonGroup`'s (no effect while the caption shows: a pill or circle has no shape for it), and a `tooltip` with an always-visible caption (repeats it; fine with `hideLabelBelow`, where it serves the icon-only state). `isLoading` keeps the caption and swaps the icon for the spinner.
- **Docs rule.** `IconButton` is icon-first with an optional caption, `Button` is text-first with an icon. A captioned button is for a control that stands on its own, not beside `Button`s, in a `ButtonGroup`, a `Toolbar` or a table row, which line up on the square.
- The `Navbar` demo uses it (and drops its caption CSS).

## Alternatives considered
- **A stacked layout on `Button`** (`iconPlacement="top"`). Rejected for this need: the label is `children`, so hiding it below a width leaves a tall padded box and not the square, and it would need its own width option; `trailingIcon` has no place in a column. It stays the likelier home for an always-labelled item and is left to `TabBar`'s planning.
- **Keep the demo-only caption.** Rejected: it left the hover, press and click gaps, and every app wanting it would copy the CSS.
- **A `label` on `Navbar.Action` only.** Rejected for now: it covers one use with the same work, and leaves the same gap for any other bar.
- **Rich content for `label`.** Rejected: the label-in-name check needs text.

## Consequences
- One more mode on a finalized atom, additive (`06-engineering-standards.md` §9, question 1), so `IconButton` stays Finalized; it has its own tests, checks and a review entry.
- The fixed-height row rules (`DataTable`, `Toolbar`) assume the square; a captioned button breaks them, which the Docs say.
- `TabBar` will not use it: its items are links with their own parts.

## Related
`05-component-api-conventions.md` §3 and §5, ADR-0025, ADR-0097; `component-reviews/IconButton.md`.
