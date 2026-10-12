# Toast — review findings

Sixth organism, built 2026-10-12 with the `06-engineering-standards.md` §9 checklist applied as it was written. **Not yet Finalized:** the full review pass (`/review-component Toast`) has not been run, and the declaration is the maintainer's. What follows is what the build itself found and checked.

## Decisions
- Wraps Radix Toast, pinned exactly at 1.2.23 so the layer stack stays one copy: [ADR-0069](../adr/0069-toast-wraps-radix-toast-pinned-at-1-2-23-on-the-shared-layer-stack-over-a-hand-rolled-toast-or-the-newest-release.md).
- Raised from code through a provider and a hook, with the declarative parts beside it, a `limit` and a queue, logical placement and a required `altText`: [ADR-0070](../adr/0070-toast-is-raised-from-code-through-a-provider-and-a-hook-with-a-declarative-toast-beside-it-over-a-module-level-function-or-component-only-use.md).
- Draws with `Alert`'s tone, variant and size colours (the pairings were contrast-checked there), its own dismiss button ([ADR-0008](../adr/0008-closebutton-reserved-for-modal-surfaces.md)) and `Alert.Action`'s approach to the action's colours. One new token, `toast.width`.

## What was found while building it
- **Radix writes `pointer-events` inline on a toast, and turns it off for every layer below an open modal.** A toast already showing when a dialog opened was drawn above the scrim and did nothing when pressed; one raised afterwards worked. The toast's own rule is `pointer-events: auto !important`, with the reason beside it, and a real-browser check presses each with a real mouse.
- **Radix spreads a caller's props after writing `data-state`, `data-swipe-direction` and `tabindex`,** so a same-named prop replaced them (a `data-state` of the caller's would stop an exit from ever ending). They are written again after the spread (`05` §3), with a test.
- **A modal dialog hides the toasts' region from assistive technology** (it hides the rest of the page), so a toast's action can't be reached by a screen reader or the keyboard while a modal is open. The announcement is made separately and is unaffected, `altText` is required for this reason, and the Docs page says so.
- **With focus in a modal dialog, `Escape` closes the newest toast first and the dialog on the next press.** That is Radix's layer order, kept and documented; a real-browser check pins it.
- **jsdom has no animations,** so a closing toast's exit completes at once there; the unit tests settle it explicitly and the real-browser checks wait for the animations to finish before measuring (§9).
- **The announcement text goes into the live region a frame after it is in the page,** which is what makes it a change; the tests wait for it rather than reading it at once.

## Checks run
- 49 unit tests at the first pass (region and landmark, `labels` with an `undefined` value, placement and a responsive map, `toast()` and update by id, limit and queue, `dismissAll`, announcement by tone and `role`, time with fake timers, held by pointer and by focus, the close reasons, the action and its `altText` warning, loading and `toast.promise`, the declarative `Toast`, outside a provider, `StrictMode`, axe for five tones and three variants), plus 12 server-render and hydration cases; 66 unit tests now, with the follow-ups below.
- 23 real-browser checks now (16 at the first pass): the corner and the toast width, top-start in right-to-left, newest nearest the edge, a phone spanning the screen less its gutter, a `container`, a swipe toward the edge closing and one away or short of it not, a swipe in right-to-left, a real pointer holding the time, F8 / Tab / Enter and focus returning (and not stolen after a late finish), above a modal dialog raised before and after it opened, `Escape` order, 24 × 24 targets at every size, forced colours and reduced motion. Broken on purpose once (the z-index step and the swipe direction): four checks failed, then were restored.
- 17 stories and 5 sub-part stories for the Properties tables, a Docs page, a docs test that the tokens table matches the stylesheet, a Playground snippet builder with a guard test, and the snippets typechecked against the real components with a planted bad prop.
- `pnpm lint`, the build, `check-guidelines` and the bundle-size check (5.88KB JS, 2.91KB CSS against 10KB, after the follow-ups; 4.79KB and 2.70KB before).

## Follow-ups built after the first pass (2026-10-12)
The seven gaps named after the build, decided in [ADR-0071](../adr/0071-toast-actions-may-take-a-promise-a-repeated-or-replaced-toast-is-drawn-afresh-and-clear-all-is-a-toast-of-its-own-over-a-plain-button-or-a-timer-nudge.md): an action that takes a promise, a repeated or replaced toast drawn afresh (its time restarts and it is read again), the gap closed when one leaves, "Clear all", merged identical messages, `createToaster()`, and region-wide pausing confirmed and documented.
- **A promise action marked its reason at the press, so a later timeout read as the action** and slipped past the busy hold. The press now takes its mark back when a promise is returned.
- **`Button` writes `aria-busy` and `aria-disabled` itself, after the props it is given,** so busy is set on the element; a unit test and a real-browser check read it back.
- **A plain "Clear all" button among the list's children was skipped by Radix's Tab handling** (it moves only among its own items), so F8 then Tab never reached it. It is a toast of its own to Radix, and a real-browser check tabs to it from F8 and presses Enter.
- **A merge needs to know the id was made up here:** the id is stored on the entry, so every toast looked as if the caller had given one and nothing merged until the entry recorded which it was.
- **Collapsing needs the height before the exit begins:** read at the moment of closing it was too late for the animation's first frame, so it is kept as a custom property while the toast is open.
- **Checks added:** 17 unit tests (a promise action holding, not timing out and closing with `action`, a rejection to `onError`, merging and what does not merge, `formatNumber` and `labels.repeated`, a replaced toast's time and announcement, Clear all, `createToaster()`) and 7 real-browser checks (neighbours gliding rather than jumping, a pointer on one toast holding all, the count, Clear all by keyboard, a promise action holding past the toast's time, a rejection surfacing as an unhandled rejection with the toast kept, and a toaster raising before any provider).

## Open for the review pass
- The full §9 checklist and the feature-completeness pass, including the four themes in a running Storybook and the sizes with realistic content.
- Not verified: a real finger on a touch screen (the swipe is driven by a real mouse through the Chrome DevTools Protocol), a screen reader reading the announcement, and Safari.
- "Clear all" is read out when it appears ("Notification, Clear all"), which is Radix always reading a toast's label.
