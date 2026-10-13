# 0072 — `Toast` gets an optional fanned stack that expands on pointer or focus, over replacing the list or adding a toggle button

**Status:** Accepted · **Date:** 2026-10-13

## Context
[ADR-0070](./0070-toast-is-raised-from-code-through-a-provider-and-a-hook-with-a-declarative-toast-beside-it-over-a-module-level-function-or-component-only-use.md) deferred a collapsed, fanned stack: with `limit` toasts showing, the list takes up to three toasts' height at the edge of the screen, which on a phone is a good share of it, and the page behind it is hidden for as long as they stay. A fanned stack shows the newest toast in full with the older ones peeking out behind it, and spreads them out when the person reaches for them.

The list is not wrong, and some apps want it exactly as it is, so the fan has to be a choice and not a replacement. What makes it more than a style is that it changes where each toast is, which the rest of the component is built around: the measured height each toast keeps for its exit collapse, the "Clear all" bar, the region-wide pause, the tab order Radix keeps (newest first), and a swipe on whichever toast is at the front.

## Decision
- **One new provider prop, `stack: "list" | "fan"`, default `"list"`**, and a `Responsive` map is accepted as `placement` is (a fan on a phone, the list from `md`). Nothing changes for an app that doesn't set it.
- **Collapsed**, a fan shows the newest toast at the edge in full and the older ones behind it, each peeking out by one step of `toast.stack.peek` and scaled down by `toast.stack.scale-step` per step of depth, at most three layers (the default `limit`; a larger one draws the rest at the third layer's place). The front toast keeps its own size, so its text and targets are as in the list.
- **Expanded**, it is the list, with the toasts moving to their places. It expands while the pointer is over the region or focus is inside it, which is the condition that already holds the time of every toast, so the two are one idea: *the person is reading the toasts*. It collapses a moment after both have gone (`motion.duration.base`), so crossing the gap between two toasts doesn't flicker it.
- **It is done with transforms on the list layout that exists**, not a second layout. Each toast is still a flex item in the region; in the fan its transform pulls it onto the front toast by the distance between their natural positions, which the provider measures (it already measures each toast's height) and writes as a custom property per toast, along with its depth. Expanding is the transform returning to none. Nothing is removed from the tab order or the accessibility tree, and the DOM order is unchanged.
- **Focus expands it**, so a toast that takes focus is whole and its buttons are reachable; the keyboard model is the list's (F8, then Tab through every toast newest first).
- **"Clear all" is drawn only while expanded**, since a bar beside a fan of toasts is what the fan exists to avoid; it is in the tab order, so reaching for it with the keyboard expands the stack first.
- **Reduced motion keeps the fan and drops the movement:** the states switch at once. Forced colours needs nothing: each toast already has a border, which is what tells overlapping toasts apart when shadows are dropped.
- **Two component tokens are added:** `toast.stack.peek` (a dimension, the same value as `space.3`, named so the stack can be tuned alone) and `toast.stack.scale-step` (a number). The motion, z-index, radius and shadow tokens already there are reused.
- **The pull is the individual `translate` and `scale` properties,** which compose with the `transform` the entrance, the swipe and the exit use. While a toast is leaving the region is `data-settling` and its transitions are off, since the list is still reflowing under the others and a transition would lag the positions they have to follow.
- **The pointer and focus are heard with native listeners on the list,** not React props: the toasts are drawn into it through a portal, so their events bubble through the React tree and never pass through the list's own props.

## Alternatives considered
- **Make the fan the default, or the only mode.** Rejected: it hides older toasts' text by default, which is wrong for an app whose toasts carry an action, and it would change what every existing consumer sees.
- **A toggle button to expand it.** Rejected: one more control to find and press, and it would have to be in the tab order of a region people already pass through; hover and focus are what a reader of the toasts does anyway.
- **Expand on pointer only.** Rejected: a keyboard user would have a stack they can focus but not read, and it would split the "being read" condition that already holds the time.
- **A second layout (a grid with every toast in one cell).** Rejected: the exit collapse, the gap closing and the `order` of "Clear all" are all written for the flex column, and switching layouts mid-state cannot be animated.
- **Hiding the older toasts instead of peeking them** (a "+2 more" count). Rejected: an unreadable count is the same information as a peek with less to see and no way to reach the toasts from the stack.

## Consequences
- A second state per region (collapsed or expanded) and a measurement per toast, both in the provider; the toast itself is unchanged.
- While collapsed, an older toast's buttons are covered. They are reached by expanding, and a toast that is covered still announces itself when it appears, so nothing is lost to a screen reader; the Docs page says a toast's action must still never be the only way ([ADR-0070](./0070-toast-is-raised-from-code-through-a-provider-and-a-hook-with-a-declarative-toast-beside-it-over-a-module-level-function-or-component-only-use.md)).
- A toast that times out while the stack is collapsed makes the ones behind it move forward, which is a movement the person didn't ask for; the timers are held while expanded, so what they are reading doesn't move.
- The measure is the cost: it is read after each change of the list and by a `ResizeObserver`, as the exit collapse is, so a toast whose height changes (a `description` updated) moves the stack with it.
- A stack of toasts at the top of the screen grows the other way, and a right-to-left page needs nothing, since the fan is vertical only.

## Related
`04-component-inventory.md` (Toast row), `05-component-api-conventions.md` §3 and §6, `06-engineering-standards.md` §9 (a measurement waits for the animation; a responsive change never removes the control that has focus; real-browser checks for what jsdom can't), ADR-0010, ADR-0070, ADR-0071; `component-reviews/Toast.md`.
