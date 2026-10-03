# HoverCard

Molecule, Overlay & Disclosure category. Item 25 of the itemized molecule build order in
`04-component-inventory.md` — a rich preview that opens when the pointer rests on a link or keyboard
focus lands on it, wrapping Radix HoverCard (`@radix-ui/react-hover-card` ^1.1.23, new dependency).
Built 2026-10-03. **Not yet Finalized** — only the user declares that; this file records what was
built, checked and found.

## What it is

A compound component, `HoverCard` + `HoverCard.Trigger` + `HoverCard.Content`, in `Popover`'s
shape. The root takes `open` / `defaultOpen` / `onOpenChange` and `openDelay` (300) / `closeDelay`
(300) — `openDelay` is shorter than Radix's own 700, at explicit direction (2026-10-03, after the first
push), since 700ms read as sluggish. `HoverCard.Trigger` is a link (Radix renders an `<a>`); `asChild` swaps
in the `Link` atom. `HoverCard.Content` takes `side` (default `top`, changed from `bottom` at the same direction; a breakpoint map too, resolved in JS by
`useResolvedResponsiveValue`, as `Popover` does), `align`, `sideOffset`, `alignOffset`,
`avoidCollisions`, `collisionPadding`, `collisionBoundary`, `hideWhenDetached`, `hideArrow`,
`container` and the four dismissal callbacks. It has the same elevated-surface chrome, arrow and
fade as `Popover`, and one new component token, `hover-card.max-width` (20rem, in
`component/hover-card.json`).

Deliberately **not** exposed, matching `Popover`'s own scope: `forceMount`, `sticky`,
`arrowPadding`, `updatePositionStrategy` (traced through the whole `PopperContentProps` chain, per
the Radix-primitive prop audit, not just the first layer). No `showCloseButton`, `modal`, or
`aria-label`/`aria-labelledby`: a hover card has no dialog role and is never clicked.

## Design decisions made during the build

- **The card is supplementary, and the docs say so everywhere.** Read from Radix's own source, not
  assumed: it never opens for a touch pointer (`excludeTouch`), it has no role and no accessible
  name, nothing associates it with the trigger, and an effect sets `tabindex="-1"` on every
  tabbable element inside it, so its content cannot be reached by keyboard. So it is for sighted
  pointer and keyboard users only; anything in it must also be on the page the link opens. Where
  something has to be reachable, the answer is `Popover`; for a plain hint, `Tooltip`. The Docs
  page's Do/Don't and Accessibility sections state this, and a unit test pins the `tabindex="-1"`
  behaviour so a Radix change that alters it is noticed.
- **The built-in trigger is Radix's `<a>`, with a dev warning if it can't be focused.** An `<a>`
  with no `href` isn't in the tab order, so a keyboard user could never open the card. Rather than
  invent a different element, `HoverCard.Trigger` warns once in development when it renders a plain
  `<a>` with neither `href` nor `tabIndex` (it can't judge `asChild`, whose child may already be
  focusable). `href`, `target` and `rel` are redeclared for the Properties table.
- **The built-in trigger is underlined (dotted), not bare.** Found by looking at it, not by a
  check: the first stylesheet gave the trigger `color: inherit; text-decoration: none`, and in a
  sentence (the `PlainTrigger` story) it was indistinguishable from the surrounding text until it
  took focus — no cue at all, failing WCAG 1.4.1. It now keeps a dotted underline, and a
  real-browser story asserts the underline is there and the colour is inherited.
- **`sideOffset` stays 8.** The pointer has to cross the gap onto the card within `closeDelay`;
  Radix has no bridge across it. The prop's own JSDoc says to keep it small.
- **The root's Properties table comes from a hidden `HoverCardRoot.stories.tsx`** (ADR-0013's
  pattern, as `Trigger` and `Content` have). The Playground's meta has to carry `Content`'s props
  too (one render drives both), so a table built from it listed `side`, `align`… as root props and
  omitted `open`. Seen live. **`Popover`'s Docs page has the same shape of problem** (its root table
  lists the content props and no `open`) — noticed, deliberately not touched: it is Finalized.

## Findings

- **Radix's trigger calls `preventDefault()` on `touchstart` — worked around, 2026-10-03.** Checked
  live, since a link that couldn't be tapped would be a real defect: React attaches `onTouchStart`
  as a passive listener, so the call is ignored (`defaultPrevented` stays `false`) and a tap still
  follows the link. The cost was a console error from Chrome — "Unable to preventDefault inside
  passive event listener invocation" — on each touch in development. First recorded as unfixable;
  then fixed at explicit direction: Radix composes its handler after the caller's and runs it only
  while `event.defaultPrevented` is false, so `HoverCard.Trigger` runs the caller's `onTouchStart`
  and then marks the synthetic event handled (a plain property assignment, never a
  `preventDefault()` call), which skips Radix's no-op. Nothing is lost — the call did nothing and a
  card never opens on touch. A unit test spies on `Event.prototype.preventDefault` (fails with the
  line removed), and in a real browser a dispatched `touchstart` makes zero `preventDefault` calls.
  The workaround leans on Radix's `composeEventHandlers` skipping a handler once the event reads as
  default-prevented; a Radix change to that would bring the console error back, and the test would
  not catch it (it would still see no `preventDefault` call from us), so recheck it on a Radix bump.
- **`data-state` on the trigger and content is set before Radix spreads the caller's props**, so a
  caller's own `data-state` would replace it (the bug class in `05` §3). Not guarded: it is a
  styling hook only, and this component's own CSS reads it from the content, where a caller has no
  reason to set it. Recomputing it would need the open state, which only Radix's context holds.
- **A standalone `HoverCard.Trigger` or `.Content` throws outside a `HoverCard`** (Radix's scoped
  context), which a story that only wanted to measure a style had to learn.
- **The arrow was first duplicated from `Popover`, then extracted (2026-10-03).** A second user is
  the point at which `06` §1 says to share it, and extracting it meant editing the Finalized
  `Popover`, so it waited for the user's go-ahead, which came the same day. Both now render
  `OverlayArrow` (`src/internal/OverlayArrow/`, not exported from the package), a `forwardRef`
  `<svg>` child for Radix's `Arrow asChild`, with the one stylesheet. `Popover`'s own change is
  recorded in `Popover.md`.

## Verified

- Unit: 58 tests — the open and close paths (mouse hover, keyboard focus and blur, Escape, the
  pointer crossing onto the card and a custom delay), both default delays with fake timers, a touch
  pointer not opening it, a pointer that leaves before `openDelay` elapsing, controlled and
  uncontrolled state, unmount clearing the timers, `StrictMode`, a responsive `side` with a live
  `matchMedia` change, the arrow, `container`, ref forwarding and pass-through on both parts,
  `asChild` with `Link` (no blocked click), the focus warning in all its cases, and axe closed and
  open (open scans the whole body, since the card is portaled; the page-level `region` rule is off
  because it is meaningless for a bare component).
- **Four of them were broken on purpose to see them fail:** the default `openDelay` changed from
  its default to 500 (the delay test failed), and the `min(…, available-width)` cap removed from the
  stylesheet (the phone-width story failed). The underline story was checked the same way.
- Real browser (Chromium, the `storybook` project): hover opens and leaving closes, Tab opens and
  Escape closes with focus kept on the link, the card stays inside a phone's width and never past
  the 20rem cap, and the built-in trigger is underlined in its inherited colour. Hidden `!dev`
  stories, so none animates on the Docs page.
- Live in Storybook: the Docs page (every template heading, three Properties tables with every
  Default filled and no empty description, the Playground controls, every "Show code" settled and
  pasteable), a real mouse hover and a real Tab, all four themes (computed surface, text, border,
  shadow and font resolve in each; `text.primary` on `bg.surface` is the pairing already measured
  there, so no new contrast pairing), and the plain trigger on the Docs page itself (where
  Storybook's own stylesheet could have restyled it; it didn't).
- Snippets typechecked against the real components, with a planted bad prop to prove the check bites.
- Whole package: `eslint`, both typechecks, `pnpm build`, the per-component bundle-size check
  (HoverCard 0.77KB JS / 0.53KB CSS gzipped), the Foundations token-coverage check, 4,767 unit tests,
  892 Storybook-project tests, the 8 visual-regression tests, and `pnpm audit` (only the already-
  accepted `braces` advisory).

## Not checked, or open

- **A real touch device.** The touch behaviour is asserted with a synthetic touch pointer and a
  dispatched `touchstart`; a physical tap on a phone was not tried.
- **Screen readers.** Nothing in the card is announced by design; this was reasoned from Radix's
  source, not heard through VoiceOver or NVDA.
- **The 1.4.13 "hoverable" test on a very large `sideOffset`.** The default 8px gap is crossed
  within `closeDelay` in the unit test; a large offset has no bridge, as noted on the prop.
