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
- 49 unit tests (region and landmark, `labels` with an `undefined` value, placement and a responsive map, `toast()` and update by id, limit and queue, `dismissAll`, announcement by tone and `role`, time with fake timers, held by pointer and by focus, the close reasons, the action and its `altText` warning, loading and `toast.promise`, the declarative `Toast`, outside a provider, `StrictMode`, axe for five tones and three variants), plus 12 server-render and hydration cases.
- 16 real-browser checks: the corner and the toast width, top-start in right-to-left, newest nearest the edge, a phone spanning the screen less its gutter, a `container`, a swipe toward the edge closing and one away or short of it not, a swipe in right-to-left, a real pointer holding the time, F8 / Tab / Enter and focus returning (and not stolen after a late finish), above a modal dialog raised before and after it opened, `Escape` order, 24 × 24 targets at every size, forced colours and reduced motion. Broken on purpose once (the z-index step and the swipe direction): four checks failed, then were restored.
- 13 stories and 5 sub-part stories for the Properties tables, a Docs page, a docs test that the tokens table matches the stylesheet, a Playground snippet builder with a guard test, and the snippets typechecked against the real components with a planted bad prop.
- `pnpm lint`, the build, `check-guidelines` and the bundle-size check (4.79KB JS, 2.70KB CSS against 10KB).

## Open for the review pass
- The full §9 checklist and the feature-completeness pass, including the four themes in a running Storybook and the sizes with realistic content.
- Not verified: a real finger on a touch screen (the swipe is driven by a real mouse through the Chrome DevTools Protocol), a screen reader reading the announcement, and Safari.
- Replacing a toast with the same `duration` does not restart its time (a changed `duration` does).
- Toasts that leave do not animate the others closing the gap: they move at once.
