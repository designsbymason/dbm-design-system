# Dialog — review findings

First organism. Built and put through the `06-engineering-standards.md` §9 checklist on 2026-10-10. **Not declared Finalized**: that is the maintainer's call, and the open items below are what is left for it.

## Decisions
- Wraps Radix Dialog, composes `Backdrop` as its scrim, and pins the Radix packages to one release train: [ADR-0052](../adr/0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md).
- A sibling of `AlertDialog` and `Drawer`, with no `role` or `placement` prop: [ADR-0053](../adr/0053-dialog-alertdialog-and-drawer-are-sibling-components-not-one-dialog-with-a-role-or-placement-prop.md).
- The component is called `Dialog`; "modal" is a search term and a behaviour (`modal`), not an export.

## What was found, and what was done about it
- **A second copy of `react-dismissable-layer`.** The newest Radix Dialog pulled a newer layer package than `Popover`, `Select`, `HoverCard` and `Tooltip` use, and a popover opened from inside the dialog could not be clicked (`pointer-events: none`, silently). Found by the spike before any component code existed. Pinned to the matching release; the refresh pass in `02` §3.2 now checks it.
- **`Backdrop` ignores Radix's `data-state` on purpose.** Without being told `open`, the scrim vanished with no fade. `Dialog` holds the open state and feeds it to both.
- **A consumer's `data-state` replaced the dialog's own** (found by the `{...props}`-ordering probe on the content). Now computed after the spread, with `role` and `aria-modal`.
- **Radix reports a missing description and a title that is only an `aria-label`.** The dialog registers its `Title` and `Description` and only wires what exists, rendering a visually hidden title for an `aria-label`-only dialog, so a correct dialog logs nothing.
- **A non-modal dialog nested inside the overlay disappears**, since Radix renders no overlay in that mode. It renders directly.
- **Measuring the panel mid-entrance** read 502px for a 512px panel (the entrance scales from 0.98). Every real-browser measurement waits for the animations to settle.
- **Two of the browser checks passed against broken CSS** on first try (a forced-colours rule matched `none` as well as `active`). Tightened, and both were broken on purpose to see them fail.

## Checks run
- 35 unit tests (open/close, controlled and wired-to-state, Escape, scrim, close button and `labels` with an undefined entry, focus in/loop/return, non-modal, naming and Radix's silence, prop ordering, refs on every part, nested dialogs, `StrictMode`, `container`, jest-axe).
- 11 real-browser checks (`Dialog.checks.stories.tsx`): scrim and centring at `md`, scroll lock and inertness, a press in a popover opened from the dialog, the exit fade, long content with header and footer in view, a phone full screen and gutter, the 24px close target and its corner, right-to-left, the Tab loop, and the forced-colours and reduced-motion rules.
- `pnpm lint`, `pnpm build`, the bundle-size check (Dialog 4.4KB JS, 2.7KB CSS gzipped; budget 10KB), `check-guidelines`, and a typecheck of every snippet against the real components.
- The Docs page was opened in a running Storybook: all ten template sections, nine Properties tables with no empty description, links, Playground, long-content story and dark mode.

## Not verified, for the maintainer to decide on
- **Mouse selection of an option in a `Select` opened from the dialog.** A synthetic pointer sequence left the list open (keyboard selection worked), so this needs a real-pointer check.
- **Touch and iOS scroll-lock behaviour**, which neither jsdom nor desktop Chromium shows.
- **Docs-page stale references** in finalized components (below), which need your go-ahead since they are Finalized.
- Whether `Dialog.Header`/`Body`/`Footer` should share a surface with `Card`'s sections; `Card` has no context, but nothing was tried outside a `Card`. Revisit when `Drawer` is built (ADR-0053).

## Left for later, deliberately
- `blur` and `opacity` of the scrim are not exposed (`Backdrop` has them); add on a concrete need.
- `Dialog.Title`/`Description` take no `id`, since the dialog wires its ARIA to the generated ones (an exception to `05` §3, stated there).
