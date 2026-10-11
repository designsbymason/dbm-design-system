# 0060 — The overlay sections are extracted to `internal/overlay`, with the panel staying each component's own

**Status:** Accepted · **Date:** 2026-10-11

## Context
[ADR-0056](./0056-alertdialog-draws-with-dialogs-sections-and-stylesheet-and-defers-extracting-them-to-the-third-consumer.md) let `AlertDialog` draw with `Dialog`'s sections and stylesheet and said they would be extracted when `Drawer`, the third consumer, was built. `Drawer` is that consumer. Importing `Dialog`'s stylesheet and parts a third time would leave `Drawer` depending on a sibling's panel (its sizes, its centring, its full-screen classes) for rules that are not about the panel at all, and would make `Dialog` the owner of rules two other components must not break.

## Decision
- **The sections move to `src/internal/overlay/`**: one stylesheet (`OverlaySections.module.css`) holding the header, title, description, scrolling body, footer (its alignment and its stacking below `sm`), the corner close button, the `divided` lines, the default trigger's reset and the forced-colours rules for those lines; and the code that goes with them: the context a panel provides, the hook that counts titles and descriptions and watches the body's scroll edges, the `keepMounted` host, and the section components.
- **The panel stays each component's own**: its size, place, corners, entrance and exit, and its full-screen or placement classes. `Dialog` and `AlertDialog` still share `Dialog`'s panel stylesheet (`AlertDialog` is a smaller, alert-shaped `Dialog` panel, the case ADR-0056 reasoned about); `Drawer` has its own.
- **A panel hands the sections what they read through custom properties** named for the overlay, not a component: `--overlay-pad`, `--overlay-close-clearance` and the four `--overlay-safe-*` insets. The panel also applies the shared `divided`, `dividedAuto` and `withCloseButton` classes.
- **Each public part stays a thin wrapper** (`Dialog.Header`, `Drawer.Body`, …) around the shared one, so its own JSDoc and prop types document it and a sub-part's Properties table (ADR-0013) still resolves.
- **No change to what `Dialog` and `AlertDialog` draw or do.** Their existing unit and real-browser checks are the regression net.

## Alternatives considered
- **`Drawer` imports `Dialog`'s stylesheet and parts, as `AlertDialog` did.** Rejected: ADR-0056 named this moment, and a third importer is when the arrangement stops being a convenience.
- **One shared panel component parametrised by placement.** Rejected, as in ADR-0053 and ADR-0056: the panels differ in more than a class, and a single panel with `side`, `placement` and `fullScreen` options would be the one-component-with-roles shape already turned down.
- **Leave the sections in `Dialog` and export them from there.** Rejected: it keeps `Dialog` as the owner and makes an organism's folder a library for its siblings.

## Consequences
- ADR-0056's decision (importing `Dialog`'s sections) is superseded; its reasoning about the panel stands.
- A rule in the sections is now changed once for all three overlays, and a class or custom-property rename there is a change to every one of them (a partial re-finalization check for each).
- `AlertDialog` and `ConfirmDialog` bundles got smaller (`AlertDialog` 7.0KB to 5.4KB, `ConfirmDialog` 10.7KB to 9.2KB), since they no longer pull `Dialog`'s whole module; `ConfirmDialog` is back under the default budget and its override is gone.
- Each component's Docs-token test reads its own stylesheet and this one.

## Related
ADR-0013, ADR-0053, ADR-0056; `05-component-api-conventions.md` §1; `02-tech-stack-and-structure.md` (`internal/`); `component-reviews/Dialog.md`, `component-reviews/AlertDialog.md`.
