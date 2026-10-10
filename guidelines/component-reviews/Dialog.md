# Dialog — review findings

First organism. Built and put through the `06-engineering-standards.md` §9 checklist on 2026-10-10, with a second pass of additions and a final review pass the same day. **Finalized 2026-10-10**, with the items under "Not verified" below accepted as open: they need a device or a server render, and none changes the component.

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

## Open at Finalization
- **Touch and iOS behaviour** (scroll lock, the `keepMounted` element move), which neither jsdom nor desktop Chromium shows, and **the safe-area insets on a real device**: a desktop browser reports none, so the checks prove the stylesheet asks for them and that the close button follows them.
- **A literal server render** of a `keepMounted` or `defaultOpen` dialog. The panel is portaled and Radix renders no portal on the server, so no mismatch is expected, but it was not run.
- Whether `Dialog.Header`/`Body`/`Footer` should share a surface with `Card`'s sections; revisit when `Drawer` is built ([ADR-0053](../adr/0053-dialog-alertdialog-and-drawer-are-sibling-components-not-one-dialog-with-a-role-or-placement-prop.md)).
- Fixed along the way: a `Select` list opened from a dialog was drawn under the scrim ([ADR-0054](../adr/0054-portaled-floating-panels-sit-on-the-popover-z-index-step-not-dropdown.md)); `SelectChosenWithARealPointer` drives a real mouse through the Chrome DevTools Protocol and fails on the old stylesheet.

## Left for later, deliberately
- `Dialog.Title`/`Description` take no `id`, since the dialog wires its ARIA to the generated ones (an exception to `05` §3, stated there).

## Reported after the first build: a body with no header
The body's spacing was keyed to `:first-child`, but a dialog named by an `aria-label` or a `VisuallyHidden` title has that title as a hidden sibling before the body, so the rules never matched: the text sat 8px from the top edge and ran under the close button. The spacing now reads the neighbouring section (`.header + .body`, `.body:has(+ .footer)`) instead of position, and a header-less body keeps its text clear of the close button with an end padding of the button's inset, width and a little air. Two real-browser checks cover it, and both fail against the old stylesheet.

## Second pass: eight additions, at explicit direction
Placement, a busy state, keeping the content mounted, a reason on close, an initial-focus ref, scrim options, `divided="auto"` and safe-area insets in full screen. Built against the feature-gap list from the first review.
- **A reason on close.** `onOpenChange(open, { reason })` with `"trigger" | "escape" | "outside" | "close-button" | "close"`. Radix doesn't say what caused a change, so the part pressed notes the reason just before Radix calls back; a part that is prevented (a consumer's own handler, `busy`) notes nothing.
- **`busy`.** One boolean that blocks Escape, the scrim, the close button and `Dialog.Close`, disables the close button, and sets `aria-busy`. It leaves `closeOnEscape` and the others alone, so it is reversible.
- **`keepMounted`.** Not Radix's `forceMount`, which keeps the lock and the page's `aria-hidden` on while closed: [ADR-0055](../adr/0055-dialog-keeps-its-content-mounted-by-moving-one-rendered-element-in-and-out-of-the-panel-over-radixs-forcemount.md).
- **`divided="auto"`.** The first version used `useScrollEdges`, which compares a container's first and last *item* with its box; a body is one tall item, so both edges always read as overflowing and every line was always drawn. Found by the browser check, replaced by a scroll-position reading in `Dialog.Body`. The line is reserved (transparent), so nothing moves when it appears.
- **`placement="top"`**, with an offset of the gutter on a phone and `space.16` from `sm`. Ignored while full screen.
- **`initialFocus`** (a ref), **`scrimOpacity`** and **`scrimBlur`** (handed to `Backdrop`).
- **Safe-area insets** in full screen, as padding from `env(safe-area-inset-*)` with a zero fallback. A desktop browser reports none, so the check proves the stylesheet asks for them and that nothing is added there; it could not run on a device.
- Checks added: 10 real-browser checks (`divided="auto"` following the scroll and drawing nothing when content fits, `keepMounted` through a real close and reopen, a busy dialog ignoring Escape and a real press on the scrim, top placement on desktop and phone, scrim opacity and blur, initial focus, safe-area) and 12 unit tests.
- Still not verified: touch and iOS behaviour, and the safe-area insets on a real device.

## Final review pass
Seven findings from the review, fixed:
1. **The close button ignored the safe-area insets.** Full screen pads the panel, but the button is positioned from the padding box, so it still sat under a notch. Its insets now add `--dialog-safe-block-start` and `--dialog-safe-inline-end`. A browser check moves those properties and asserts the button follows, and fails on the old stylesheet.
2. **`Dialog.Title` and `Dialog.Description` re-registered on every `busy` or `divided` change**, because their effect depended on a context object rebuilt with them. They depend on the stable register function now. The re-registration was batched by React, so no unnamed frame was observable; this is a correctness cleanup with a regression test that watches for a hidden title being added.
3. **A busy close button was natively `disabled`**, taking it out of the tab order with focus possibly on it. It is `aria-disabled` and dimmed, with the click stopped, as `Dialog.Close` is. Tests cover focus staying on it, in jsdom and with a real mouse.
4. **Dead Controls:** `scrimOpacity` and `scrimBlur` show only while `modal` is on, `placement` only while not `fullScreen`, and the non-modal story turns the scrim controls off.
5. **jest-axe** now also runs busy, top-placed and auto-divided, and a kept-mounted dialog reopened with another nested in it.
6. **Cover for the new props:** a top-placed non-modal dialog and `keepMounted` on a non-modal one in the browser, and the snippet builder across `divided`, `placement`, `busy`, `keepMounted` and the scrim args.
7. **The Playground's `divided` cast** is gone: the control's option is typed `"off" | "on" | "auto"` and mapped in one place.

The entrance scale is now `motion.scale.98` (new primitive, with `96`). `Popover`, `HoverCard` and `Tooltip` still hold `scale(0.96)` literals and are due to move to `motion.scale.96`.
