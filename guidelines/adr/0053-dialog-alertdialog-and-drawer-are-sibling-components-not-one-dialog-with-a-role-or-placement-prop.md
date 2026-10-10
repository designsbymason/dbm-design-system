# 0053 — `Dialog`, `AlertDialog` and `Drawer` are sibling components, not one `Dialog` with a `role` or `placement` prop

**Status:** Accepted · **Date:** 2026-10-10

## Context
Three overlays share most of a modal's mechanics (scrim, scroll lock, focus loop, title and description, close) and differ in contract: `AlertDialog` is `role="alertdialog"`, must be answered, and cannot be dismissed by a press outside; `Drawer` is a side panel with its own placement and motion; `Dialog` is the general case. The inventory lists all three. A single `Dialog` taking `role="alertdialog"` or `placement="end"` would be fewer files and one name to remember.

## Decision
Three components, each its own organism with its own file set, API and Docs page. `Dialog` takes no `role` and no `placement`: its `role="dialog"` is set by the component and a consumer's own `role` cannot replace it. What the three share (a title, description, header, body and footer with the same look and spacing) is built once, as an internal piece, when the second of them is built, not in advance.

## Alternatives considered
- **One `Dialog` with `role` and `placement` props.** Rejected: `AlertDialog` differs in behaviour a prop cannot express cleanly (no outside dismissal, a required answer, Radix's own `AlertDialog` primitive with its own focus rule), and an agent calling `<Dialog role="alertdialog" closeOnOutsideClick>` would get a combination that contradicts itself. Three named components is also what an agent searching the inventory expects.
- **Subclass-style wrappers that spread `Dialog`'s props.** Rejected: each would carry the whole prop surface of the base, most of which does not apply (`size`, `fullScreen` on a Drawer).

## Consequences
- `Dialog` stays free of alert and side-panel concerns; `AlertDialog` and `ConfirmDialog` can be added without changing it, and so can `Drawer`.
- The shared surface (header, body, footer) is extracted at the second use; until then `Dialog` owns its own.

## Related
`04-component-inventory.md` (Overlay & Disclosure, organism build order), ADR-0052, ADR-0008.
