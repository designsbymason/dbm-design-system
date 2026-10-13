# 0073 — A toast list puts the newest on top and "Clear all" at the bottom at every edge, over the newest against the edge

**Status:** Accepted · **Date:** 2026-10-13 · **Amended 2026-10-13** — what moves when "Clear all" comes and goes; the decision itself is unchanged

## Context
[ADR-0070](./0070-toast-is-raised-from-code-through-a-provider-and-a-hook-with-a-declarative-toast-beside-it-over-a-module-level-function-or-component-only-use.md) put the newest toast nearest the edge the list is against: at the bottom of a list against the bottom edge, and at the top of one against the top edge, with "Clear all" past the newest. That is two different reading orders depending on a placement, and in a bottom placement the newest is at the end of the list, where the eye arrives last and where "Clear all" had been put as well.

## Decision
- **In the list, the newest toast is at the top and the oldest at the bottom, at every placement,** with "Clear all" (when drawn) below the oldest, at the very bottom. It is the same reading order whichever edge the list is against.
- **The list runs `column-reverse` over the toasts' mount order,** and "Clear all" has the lowest `order`, so it is first in that run and so last on screen. Nothing about the DOM or the tab order changes.
- **Where the list grows from does not change:** a list against the top edge grows downward, so a toast that leaves lets the ones below it move up (the exit collapses its room, so they glide); against the bottom edge it grows upward, so a toast that arrives is added above the others without moving them, and one that leaves lets the ones above it move down to the edge. *(Amended 2026-10-13: "without moving them" left out that "Clear all" comes in below the oldest with the second toast and goes with the second-to-last, which moves the toasts above it by its room. It opens and closes that room over a motion duration, so they glide instead of jumping.)*
- **A fanned stack keeps its newest toast in front, at the edge** ([ADR-0072](./0072-toast-gets-an-optional-fanned-stack-that-expands-on-pointer-or-focus-over-replacing-the-list-or-a-toggle-button.md)): a fan is a stack of layers, not a list, and its older toasts peek out from behind the front one. Against the bottom edge it therefore runs the other way from the list; "Clear all" is still at the bottom of it.
- **"Clear all" is a ghost button:** no border and no shadow, on the page's own surface so its label stays readable over what is behind it, with less padding than a `Button` of that size and the label at the small button's own size. Its target stays at least 24 by 24.

## Alternatives considered
- **Keep the newest nearest the edge.** Rejected for the reading-order reason above.
- **Newest on top in the fan too.** Rejected: it would put the front of a bottom fan away from the edge, and the stack would hang in the air above the screen's edge.
- **A transparent bar behind "Clear all".** Rejected: a label with no surface is unreadable over page content; the surface is the page's own, with no border or shadow, so it reads as a ghost button.

## Consequences
- ADR-0070's "the newest stacks nearest the edge the list is against" no longer holds for the list.
- A toast that leaves a bottom list moves the ones above it down, not up. A top list moves the ones below it up.

## Related
`04-component-inventory.md` (Toast row), ADR-0070, ADR-0071, ADR-0072; `component-reviews/Toast.md`.
