# Combobox — review findings

Eighth organism, built 2026-10-16 with the `06-engineering-standards.md` §9 checklist applied as it was written. **Not yet
Finalized:** the full review pass (`/review-component Combobox`) has not been run, and only the maintainer declares a
component Finalized. What follows is what was decided and found while building it, and what is known to be open.

## Decisions
- The list floats from a Radix Popover with an anchor and no trigger, and works inside a `Dialog` and a `Popover`: [ADR-0077](../adr/0077-combobox-floats-its-list-with-a-radix-popover-anchor-and-no-trigger-over-popover-popper-and-a-dismissable-layer-or-a-bare-portal.md).
- Options are an `options` array, not child parts: [ADR-0078](../adr/0078-combobox-takes-its-options-as-data-over-option-parts-mounted-as-children.md).
- Must-pick by default; the chosen value and the typed text are kept apart; a hidden validated input submits for forms: [ADR-0079](../adr/0079-combobox-must-pick-by-default-keeps-the-chosen-value-apart-from-the-typed-text-and-submits-through-a-hidden-validated-input.md).
- Long lists are windowed by a hand-rolled hook in `primitives` with fixed row heights from tokens: [ADR-0080](../adr/0080-long-option-lists-are-drawn-a-window-at-a-time-by-a-hand-rolled-hook-with-fixed-row-heights-from-tokens-over-a-virtualization-dependency-or-measured-rows.md).
- The field is `Input`, so size, border, focus ring and error state are its own. The caret and clear buttons are drawn here (not `Input`'s `onClear`) so their names are translatable through `labels` and they stay out of the tab order. New component tokens: `combobox.list-max-height`, `combobox.option-height.*`, `combobox.option-height-described.*`.
- No new dependency: `@radix-ui/react-popover` was already installed. Bundle size 6.36KB JS and 2.19KB CSS, under the 10KB budget.

## What was found while building it
- **A trigger-less `Popover.Anchor` works.** ADR-0017's bug is the trigger's implicit anchor racing a real one; with no trigger the panel sat at the anchor's left edge, 4px under it and as wide as it, and a real mouse chose an option inside an open `Dialog` without closing it. Both are real-browser checks now.
- **A box can't shrink below its padding.** The first windowed list put its spacers on the scrolling box, so the box was as tall as the whole list (71,496px) and nothing scrolled, while every check that didn't scroll passed. The spacers are on an inner box. The same failure made unrelated checks hang once a stuck list was left in the page.
- **`aria-controls` has to point at the list for as long as it is in the page.** The combobox-popup exemption for a scrolling list reads it, and the list stays mounted while it fades out, so an `aria-controls` removed on close failed the scrollable-region rule for a moment after every choice.
- **Radix marks Escape as handled before the field's own key handler runs**, so restoring the last choice's text from `onKeyDown` never ran. It is done from the layer's `onEscapeKeyDown`.
- **The floating layer measures the room on the screen after the list first renders**, so scrolling a long list to the chosen option on open found a box as tall as its content and did nothing. The box is also capped by its own max height, and the scroll runs again when the measured height settles.
- **A read-only input is barred from constraint validation**, which is the whole point of the hidden input, so it is not `readOnly`. A text input also blocks implicit submission: a form with a lone combobox and no submit button doesn't submit on Enter.
- **`Highlight`'s side padding reads as a gap inside a word** ("Un ited States"). The matched stretch overrides it to none.
- **A disabled option's description stayed in the secondary text colour**, so it read as available beside a dimmed label. It follows the disabled colour.
- **Cheap to get wrong in jsdom:** Enter during an input method's composition, a controlled value that the owner refuses, a late-arriving option for a controlled value (the label appears by itself, since the field shows the label of whatever the value names unless text has been typed).

## Verified
- Unit tests (jsdom): structure and naming, pointer and keyboard choosing, filtering, announcements, controlled and uncontrolled value, text and open state, states, forms and validity, axe, StrictMode, server render and hydration in eight variants, and the windowing hook.
- Real-browser checks (Chromium): placement and width, a real mouse choosing inside a `Dialog` and a `Popover`, Escape closing the list before the dialog, text inserted all at once, the keyboard end to end with one tab stop, a list of 2,000 options (rows drawn, scroll height, wrap to the last option in view, the chosen option far down in view), a phone width, field height against `Input` at every size, 24px buttons, right to left, forced colours, form refusal and focus, page scroll, controlled open state.
- Light and dark in the Purple brand, and dark in the Emerald brand, looked at directly; Emerald light was not.

## Open (known, not yet decided)
- The full §9 review pass, including the feature-completeness pass, has not been run.
- Real-browser runs inside a `Dialog` or `Popover` print a "ResizeObserver loop" warning from the browser; a `Select` inside a `Dialog` prints it too, so it is not specific to this component, and no check fails on it.
- Group headings in a list over 100 rows are plain rows, so a screen reader doesn't read the group name ([ADR-0080](../adr/0080-long-option-lists-are-drawn-a-window-at-a-time-by-a-hand-rolled-hook-with-fixed-row-heights-from-tokens-over-a-virtualization-dependency-or-measured-rows.md)).
- An option with no icon doesn't reserve the icon's width, so labels don't line up in a list where only some options have one.
- Escape with the list closed passes through, so there is no "press again to clear"; the clear button does that.
- No type-ahead by first letter and no multi-select: `MultiSelect` builds on this later.
- Contrast: no new colour pairing was introduced (the list uses `Select`'s surface, highlight and selected colours, and `Highlight`'s own tone), but the pairings have not been re-measured here.
