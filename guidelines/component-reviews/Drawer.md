# Drawer — review findings

Fourth organism, built 2026-10-11 with the `06-engineering-standards.md` §9 checklist applied as it was written. **Not Finalized:** the dedicated review pass has not been run and the sign-off is the maintainer's.

## Decisions
- A sibling of `Dialog` and `AlertDialog` ([ADR-0053](../adr/0053-dialog-alertdialog-and-drawer-are-sibling-components-not-one-dialog-with-a-role-or-placement-prop.md)) on the same Radix Dialog ([ADR-0052](../adr/0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md)).
- Draws its header, body, footer, corner button and divided lines from the shared overlay sections, with its own panel ([ADR-0060](../adr/0060-the-overlay-sections-are-extracted-to-internal-overlay-with-the-panel-staying-each-components-own.md)). That extraction was a separate refactor commit of `Dialog` and `AlertDialog` first.
- `side`, a responsive map, its own size tokens, no swipe yet: [ADR-0061](../adr/0061-drawer-is-attached-to-a-logical-side-that-can-change-with-the-screen-with-its-own-size-tokens-and-no-swipe-yet.md).

## What was found while building it
- **A real press after the entrance began landed where the button used to be.** The `Select`-in-a-drawer check passed for a dialog, whose entrance moves 8px, and failed here, where the panel slides its whole width. It now waits for the panel's animations to finish before pressing (the same rule `Dialog`'s measuring checks follow).
- **Every side class sets every property its geometry reads,** including the zeros, so a larger breakpoint's side replaces a smaller one's whole; a class that set only what differed left the base's margin in place.
- **The scrim is a flex box, so the panel is pinned by automatic margins, not by `inset`.** A non-modal drawer has no scrim and is fixed to the viewport with the same margins and explicit sizes doing the pinning.

## Checks run
- 59 unit tests, adapted from `Dialog`'s and extended for the side classes and a responsive map (role, name and description with no warning, controlled use, the close reasons, `busy`, `keepMounted`, nested overlays, `StrictMode`, a role that can't be replaced, axe), 20 server-render and hydration tests (ten variants, including `keepMounted` open and closed), and a Docs-token test that reads this stylesheet and the shared one.
- 19 real-browser checks: each side flush to its edge at its size, rounding and border on the inner side only, right-to-left putting `start` on the right and sliding from it, a phone leaving a 3rem sliver that a real press closes, a responsive side as a bottom sheet on a phone and a side panel from `md`, the entrance moving from the edge, a real press on the scrim and focus returning, the page locked and Tab looping, a real mouse choosing a `Select` option inside it, a confirmation stacking and answering first, the lines following the scroll, the close button following a safe-area inset, the forced-colours and reduced-motion rules, `busy`, and `keepMounted` through a real close and reopen. The side-geometry check fails with the end side's margin removed.
- 9 sub-part stories for the Properties tables (ADR-0013), `pnpm lint`, the build, `check-guidelines` and the bundle-size check.

## Open
- The dedicated §9 review pass, and the maintainer's sign-off.
- Touch and iOS behaviour (scroll lock, `keepMounted`'s move), and the safe-area insets on a real device: a desktop reports none, so they are asserted from the stylesheet and a stood-in inset, not seen.
- The Docs page and the four themes have not been looked at live in a running Storybook (the Browser pane was not displayed).
- Swipe-to-dismiss is deferred, not decided against (ADR-0061).
