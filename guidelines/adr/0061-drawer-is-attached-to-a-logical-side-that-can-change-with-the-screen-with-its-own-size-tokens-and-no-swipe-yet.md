# 0061 — `Drawer` is attached to a logical `side` that can change with the screen, with its own size tokens, and swipe-to-dismiss waits

**Status:** Accepted · **Date:** 2026-10-11

## Context
`Drawer` is the third overlay on Radix Dialog ([ADR-0052](./0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md), [ADR-0053](./0053-dialog-alertdialog-and-drawer-are-sibling-components-not-one-dialog-with-a-role-or-placement-prop.md)); its sections are the shared ones from [ADR-0060](./0060-the-overlay-sections-are-extracted-to-internal-overlay-with-the-panel-staying-each-components-own.md). What is its own is the question of where the panel attaches and how big it is. `Dialog` already uses `placement` (a vertical position of a centred window) and `fullScreen`, and `Popover` uses `side` (which side of its anchor). The main consumers (`Navbar`, `Sidebar`) need a menu that is a bottom sheet on a phone and a side panel on a desktop.

## Decision
- **The edge is `side`: `"start" | "end" | "top" | "bottom"`, default `"end"`.** `start` and `end` are logical, resolved in CSS with `:dir()` (the same stance as `06` §7), so a menu opens from the side a reader expects and no JavaScript reads the page's direction. `top` and `bottom` span the width.
- **`side` is a mobile-first `Responsive` map**, as `Dialog`'s `fullScreen` is: one class per breakpoint and side, each setting every custom property the geometry reads, so a larger breakpoint replaces a smaller one entirely.
- **`size` is `xs`–`xl` and is the extent along the axis it opens on**: the width of a `start` or `end` panel, and the most height a `top` or `bottom` one takes (its height is its content's, up to that). On a smaller viewport a sliver of the page (`space.12`) stays showing, so there is always something to press to close it.
- **New tokens `drawer.size.*`** (20, 24, 32, 42 and 56rem), the same values as `dialog.max-width.*`: they name the extent of an edge-attached panel, not a centred window's measure, so reusing the dialog's names would mislead and a rename of those tokens would be churn.
- **A non-modal mode is included** (`modal={false}`, as `Dialog`): a docked inspector with no scrim, scroll lock or trap, positioned by fixing it to its edge.
- **Swipe-to-dismiss is not in v1.** It is additive, and every swipe has a button alternative already (the close button, Escape, the scrim).
- **A full-screen or full-width drawer is a `Dialog`** (`fullScreen`), so `Drawer` has no `fullScreen` or `placement`.

## Alternatives considered
- **`placement` or `position` for the edge.** Rejected: `placement` already means a vertical position on `Dialog`, and an agent that has read one would write it by analogy; `side` is `Popover`'s word for a side.
- **Physical `left`/`right`.** Rejected: a navigation drawer would open from the wrong side in right-to-left text, and the logical form costs nothing.
- **A single `side` with the responsive behaviour left to the caller** (a hook that picks it). Rejected: the machinery exists, and it puts a layout decision in JavaScript that is a stylesheet's.
- **Reuse `dialog.max-width.*`.** Rejected, as above.
- **Hand-rolled swipe now.** Deferred: it needs a pointer drag with a threshold, velocity and scroll chaining, a `touch-action` decision, and a keyboard-equivalent story; none of it changes the API.

## Consequences
- The stylesheet is large (seven breakpoints times four sides, plus right-to-left twins); it is generated once and read, not hand-edited.
- A responsive `side` that changes while the drawer is open moves the same element, so focus is not disturbed.
- `Sidebar` and `Navbar` compose this for their phone layout; a swipe can be added later without a break.
- Safe-area insets are asked for on the edges the panel touches; a desktop reports none, so only the stylesheet's request and the close button's response can be asserted there, as for `Dialog`.

## Related
ADR-0013, ADR-0052, ADR-0053, ADR-0054, ADR-0060; `03-token-system-spec.md` (component tokens); `04-component-inventory.md`; `component-reviews/Drawer.md`.
