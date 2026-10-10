# 0056 — `AlertDialog` draws with `Dialog`'s sections and stylesheet, and extraction waits for the third consumer

**Status:** Accepted · **Date:** 2026-10-10

## Context
[ADR-0053](./0053-dialog-alertdialog-and-drawer-are-sibling-components-not-one-dialog-with-a-role-or-placement-prop.md) made `Dialog`, `AlertDialog` and `Drawer` siblings and said their shared surface (header, body, footer) would be extracted "at the second use". `AlertDialog` is the second use. Two things made extraction now a poor trade:
- The sections' rules in `Dialog`'s stylesheet are written against the panel's own modifier classes (`.divided > .slot > .header`, `.withCloseButton > …`). Splitting them into a shared module means cross-module selectors or restating the panel's classes, in a Finalized component, before a third consumer shows what is really common.
- Radix gives `AlertDialog` its own scope: its Title, Description, Action and Cancel are not Dialog's, so only the plain sections (header, body, footer) can be shared, which is the part that is cheap to import.

## Decision
`AlertDialog` imports `Dialog`'s stylesheet and uses `Dialog.Body` and `Dialog.Footer` directly (the header is its own, since it draws an icon beside the title), as `RangeSlider` draws with `Slider`'s stylesheet. Its own module holds only what an alert adds (the tone disc, the stacked footer). Nothing in `Dialog` changes. The sections are extracted to `internal/` when `Drawer`, the third consumer, is built, and the rule for sharing a stylesheet across components is stated in `05` §1.

## Alternatives considered
- **Extract the sections to `internal/` now, as ADR-0053 said.** Rejected for the reasons above: it touches a Finalized component's CSS ahead of knowing the shape.
- **Duplicate the section styles in `AlertDialog`'s own module.** Rejected: two copies of the same spacing rules drift, and the panel's entrance, forced-colours and reduced-motion rules would need duplicating too.
- **One internal panel parametrised by the Radix primitive set.** Rejected for now: the two panels differ in more than the primitive (no close button, no outside dismissal, a cancel-first focus), so the parameter list would be most of both components.

## Consequences
- `Dialog`'s class names are a contract: renaming one needs a check that `AlertDialog` still looks the same, and each component's Docs-token test reads both stylesheets.
- `AlertDialog`'s isolated bundle includes Dialog's sections (the bundle-size check says so honestly).
- `Drawer` is the trigger to extract, and ADR-0053's sentence is superseded by this one.

## Related
ADR-0052, ADR-0053; `05-component-api-conventions.md` §1; `component-reviews/AlertDialog.md`.
