# 0054 — Portaled floating panels sit on the `popover` z-index step, not `dropdown`

**Status:** Accepted · **Date:** 2026-10-10

## Context
The z-index scale has a `dropdown` step (1000) below `sticky`, `fixed`, `overlay` (a scrim, 1300), `modal` (1400) and `popover` (1500). `Select`'s portaled list was put on `dropdown`, since a select list is a dropdown. Opened from inside a `Dialog`, that placed the list under the dialog's scrim: it was drawn dimmed and a real click landed on the scrim, so an option could not be chosen with the mouse (keyboard selection still worked, which hid it from every synthetic check).

## Decision
A floating panel that is portaled to the page and can be opened from inside another overlay (`Select`'s list, and the lists of `Menu`, `Combobox`, `DatePicker` and the like, as they are built) sits on the `popover` step with `Popover` and `HoverCard`. The `dropdown` step is for in-flow layers that must clear their neighbours without leaving the component (the edge fades of `Tabs` and `Toolbar`).

## Alternatives considered
- **Raise `dropdown` above `modal`.** Rejected: the scale is an order between kinds of layer, and a sticky header (1100) should sit above an in-flow fade; moving `dropdown` above the modal would invert that for the components that use it as intended.
- **Give each overlay host its own z-index context and let lists inherit it.** Rejected: portaled content is outside the host's tree, so it would need a context channel through every Radix portal, which is a layer manager the scale was meant to avoid.
- **A new step between `modal` and `popover`.** Rejected: nothing separates a select list from a popover in stacking terms, and an extra step is one more value for every new floating component to choose between.

## Consequences
A new portaled list picks `popover` by default, and a real-pointer check inside a `Dialog` is part of building it (`Dialog.checks.stories.tsx` has the pattern). A `Select` open on a plain page is now above sticky and fixed chrome, which is the right order for a list the person has just opened.

## Related
`03-token-system-spec.md` (stacking), [ADR-0052](./0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md); `component-reviews/Select.md`, `component-reviews/Dialog.md`.
