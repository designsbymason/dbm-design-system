# 0070 — `Toast` is raised from code through a provider and a hook, with a declarative `Toast` beside it, over a module-level function or component-only use

**Status:** Accepted, the order of the list superseded by [0073](./0073-toast-list-puts-the-newest-on-top-and-clear-all-at-the-bottom-at-every-edge-over-the-newest-against-the-edge.md) · **Date:** 2026-10-12

## Context
Most components in this system are drawn where they are written. A toast is not: it is raised from an event, an effect or a settled request, shown in a region at the edge of the screen, queued, and gone by itself. `05-component-api-conventions.md` had no pattern for a component with an app-wide, imperative surface, so this is the first, and it constrains later ones. Four things had to be decided together: where the queue lives, how it is called, what it shows at once, and how long it stays.

## Decision
- **One `Toast.Provider` near the root, and `useToast()` returning `{ toast, update, dismiss, dismissAll }`.** `toast(options | string)` returns an id and `toast.promise(promise, { loading, success, error })` returns the promise itself, so it can still be awaited and its rejection handled. The store behind the provider is a plain object, one per provider, read with `useSyncExternalStore`: no module-level state, so two providers or two server renders never share toasts, and nothing touches `window` while rendering.
- **`Toast` with `Toast.Title`, `Toast.Description` and `Toast.Action` is the same thing declared as parts**, with the `open` / `defaultOpen` / `onOpenChange` trio (it has its own timer and dismiss button, so ADR-0010's plain `open` does not apply). `toast()` renders these same parts from data, so they cannot drift.
- **The same id again replaces the toast in place** (a repeated message stays one toast), and `update()` merges into it. A toast closed before it was ever drawn is dropped, not left to take a slot.
- **`limit` (3) toasts show at once; the rest wait and each starts its own time when it appears.** The newest stacks nearest the edge the list is against. There is no collapsed, fanned stack.
- **`placement` is six logical positions** (`top`/`bottom`, each with `start`, centre or `end`), a `Responsive` map is accepted, and below `sm` a toast spans the screen less its gutter whatever its horizontal placement. `dir` is a prop, defaulted to `"ltr"` and not read from the page, since it sets the physical direction a swipe closes (`05` §3).
- **Time is 5000ms by default, `null` is until dismissed, and it is paused while the pointer is over the toasts, focus is inside them, or the window is in the background.** A toast is never the only way to do something: `action.altText` is required and is read out in place of the button, and the Docs page says so. A toast takes focus never, and when the toasts are gone it returns it only if it is still in the region, to where it was before it entered.
- **The region is drawn into the page's body (or a `container`), on the toast step of the z-index scale**, above dialogs and popovers and below tooltips.
- **The tone→icon map is `Toast`'s own for now**, a second copy of `Alert`'s; it is extracted to `internal/` when a third component needs it, as [ADR-0056](./0056-alertdialog-draws-with-dialogs-sections-and-stylesheet-and-defers-extracting-them-to-the-third-consumer.md) did for the overlay sections.

## Alternatives considered
- **A module-level `toast()` function, callable anywhere, over an implicit global store.** Rejected for v1: it is global state that two apps on a page or two server renders would share, and a component that reaches for an implicit singleton is the one that cannot be tested in isolation. A `createToaster()` that returns a store a provider is given can be added later without changing anything here, for the callers outside React that need it.
- **Declarative only (`<Toast open>` in your own state).** Rejected: raising a toast from a request's `.then` would mean a state variable per message, and a queue would have to be rebuilt by every app.
- **A toast per call with no provider, portaled on demand.** Rejected: no shared queue or limit, and no single place to give the region its landmark, its hotkey and its direction.
- **A fanned, collapsing stack.** Deferred: it is a presentation layer over the same queue and can be added without changing the API.

## Consequences
- Every toast raised from code is read by a screen reader through a live region that is already in the page, with the tone choosing whether it interrupts (`alert` for `danger` and `warning`, `status` otherwise, overridable per toast).
- A later component with an imperative, app-wide surface (a command palette's results, a global progress bar) starts from this shape: a per-provider store, a hook, and a declarative twin drawn by the same parts.
- Replacing a toast with the same duration does not restart its time; changing `duration` does, which is how `toast.promise` moves from a persistent loading toast to a timed result.

## Related
`04-component-inventory.md` (Toast row), `05-component-api-conventions.md` §3 and §10, `06-engineering-standards.md` §9, ADR-0008, ADR-0010, ADR-0021, ADR-0023 (`Toast` stays a separate organism), ADR-0062, [ADR-0069](./0069-toast-wraps-radix-toast-pinned-at-1-2-23-on-the-shared-layer-stack-over-a-hand-rolled-toast-or-the-newest-release.md); `component-reviews/Toast.md` once the review pass is done.
