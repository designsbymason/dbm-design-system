# 0040 — PinInput is one real input drawn as cells, over an input per cell

**Status:** Accepted · **Date:** 2026-10-04

## Context
A code-entry field (a one-time code, a PIN) is drawn as a row of boxes, one per character. There are two ways to build it: a row of separate one-character inputs with focus hopping between them, or a single input whose text is drawn into boxes. The choice decides whether autofill, paste, screen readers and form submission work without a pile of workarounds, and it constrains how the component's keyboard and selection behaviour is written.

## Decision
- **One native `<input>` lies invisibly over the drawn cells** (opacity 0, at least 16px so iOS doesn't zoom) and owns the text, the selection, autofill and paste. The cells are `aria-hidden` and drawn from the value and the input's selection.
- **The value is a plain string**, kept to the accepted `type` (`numeric`, `alphanumeric`, `text`) and `length` by cleaning every change (a pasted `123-456` becomes `123456`). `maxLength` is not set on the input, because the browser would cut a paste before it could be cleaned.
- **A caret between characters is turned into that character selected**, so typing overwrites the cell you are on; the arrow keys, Home and End move cell by cell (the browser would only collapse the selection), and a press on the field is resolved to the nearest cell from its rectangles.
- `autocomplete="one-time-code"` by default, `inputmode` numeric for numeric codes, `name` submits one string, `required` and a minimum length of `length` are native constraints. Masking switches the input to `type="password"`. The code is always left to right.

## Alternatives considered
- **An input per cell:** the familiar approach, but a code that arrives by text message or autofill lands in one box, paste needs splitting by hand, a screen reader meets N unlabelled fields and N tab stops, and Backspace and arrow keys need focus-hopping code that is right in one browser and off in another. Every one of those is native behaviour with a single field.
- **A single visible input styled with letter-spacing and a background:** the cells can't be bordered or focused individually, and the alignment depends on font metrics.
- **Taking the pointer from the input and putting it on the cells:** keeps the click mapping trivial, but loses the browser's own long-press menu (paste) on a phone. The input keeps the pointer and the click is mapped to a cell instead.

## Consequences
- Autofill, paste, form submission, validation and screen readers are the browser's own, with one tab stop and one accessible name.
- The component owns a small piece of selection logic (overwrite, arrow keys, the first empty cell on a Tab) that has to be tested in a real browser as well as jsdom: browsers select all of an input's text on a Tab, after the focus event, so the field puts the selection right a frame later unless a pointer press is on its way to choosing the cell.
- The drawn cells and the real input can disagree if the cells' markup ever stops being derived from the value and selection; they are derived, never stored.
- A mix of one real input and drawn parts is the pattern for any future "segmented" text field (`TimePicker` is the other shape: separate spinbuttons, because each segment there means something different).

## Related
`PinInput` ([PinInput.md](../component-reviews/PinInput.md)); [ADR-0029](./0029-timepicker-is-a-segmented-field-with-a-popover-and-an-hhmm-string-value.md) for the contrasting segmented field; `05-component-api-conventions.md` §3 (text inserted all at once).
