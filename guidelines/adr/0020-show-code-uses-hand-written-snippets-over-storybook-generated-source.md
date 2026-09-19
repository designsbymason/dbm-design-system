# 0020 — "Show code" shows hand-written snippets, not Storybook's own or generated source

**Status:** Accepted · **Date:** 2026-09-19

## Context
Every `<Canvas>` on a component's Docs page has a "Show code" button, and what it shows is meant to be
something a developer (or an agent) can copy and paste — the system's whole premise is that an example
is the fastest route to correct usage. Left to Storybook's defaults, it isn't. Storybook picks one of
two sources depending on the story:

- A story with its own `render` and no `args` shows **the story object's own source text**, permanently
  — `{ name: "All variants", argTypes: …, render: () => … }`, with the demo-only helpers, constants and
  comments it is built from.
- A story that spreads `args` shows that source for about a second, then swaps in a snippet **generated
  from the rendered tree**, which spells out every default and empty placeholder, prints every function
  as `() => {}`, freezes any state the story owns, drops render-prop children, and prints an icon
  component as `{ $$typeof: Symbol(react.forward_ref), render: () => {} }`.

The first form was found on `Card` and `Table`, the second on the input molecules audited next, and
both then recurred on every other component with story demos (all 14 molecules and 47 of the 48 atoms —
`ThemeProvider` has no demos). The generated form even hid the component it was demonstrating:
`Backdrop`'s click-to-open stories rendered the `Backdrop` only after a click, so their generated code
contained no `Backdrop`.

## Decision
**Every visible story on a Docs page sets `parameters.docs.source` to hand-written code — never to its
own source, and never to Storybook's generated snippet.**

- Gallery stories point `parameters.docs.source.code` at a plain string in a `ComponentName.snippets.ts`
  file next to the stories: the smallest real usage of what the story shows, JSX only, using only exports
  of the package (icons named, with a comment saying where they come from), with any state or handler the
  reader must supply named in a comment.
- Each Playground (and each story that only changes args) builds its snippet from the live controls with
  `parameters.docs.source: { type: "dynamic", transform }`, writing only the props that differ from their
  defaults, so it updates as the controls change.
- **`src/storySnippets.test.ts` enforces it.** It picks up every `*.snippets.ts` automatically and fails a
  snippet that isn't valid TSX, uses a component the package doesn't export, or carries demo scaffolding
  or an internal reference; it also exercises each builder across a spread of control values. Prop names
  are not checked by the test — a snippet is typechecked against the real components once, when it is
  written or changed.

The working rules that follow from this (state in comments, icon controls with a `mapping`, safe quoting
of free text, values a component derives from another prop) live in
`07-storybook-and-documentation-standards.md` §4.2.

## Alternatives considered
- **Leave Storybook's defaults for stories that have their own `render`** (the story object's own
  source). Rejected: it isn't pasteable — it is `{ name, argTypes, render: () => … }` plus the helpers,
  constants and comments the demo is built from, none of which exist in the published package.
- **Rely on the generated snippet for stories that spread `args`.** Rejected: what is lost is not just
  noise. State, handlers, icons and render-prop children are gone from the rendered tree it is generated
  from, so what is printed is wrong for exactly the cases that matter most — a controlled story shows a
  frozen `value` and a no-op handler, and a story that mounts something only after a click shows none of it.
- **Hand-written snippets (chosen).** Costs a second file per component and a guard test to keep it
  honest, but it is the only option in which what a reader copies is what was written to be copied.

## Consequences
- Every component carries a `ComponentName.snippets.ts`, and adding a story means adding its snippet;
  `05-component-api-conventions.md` §1 and §8 and `06-engineering-standards.md` §9 list it.
- A snippet can drift from a story's real demo. The guard test catches invalid or scaffolded code, not a
  wrong prop, so a changed component's snippets are re-typechecked, and where a demo and its snippet
  would diverge the demo is changed (a story that faked a card out of a styled `div` was rewritten to
  use the real `Card`).
- A check of "Show code" has to be a settled read (about 3 seconds after opening it), because the
  swap from story source to generated source happens after the first render.
- Builders share `src/snippetHelpers.ts` for writing a control's free text safely. Nothing in the
  snippet files or helpers ships in `@dbm-design-system/components`.

## Related
`07-storybook-and-documentation-standards.md` §4.2 (the working rules) and §5 (the per-component
checklist item); `05-component-api-conventions.md` §1 and §8; `06-engineering-standards.md` §9.
Applied to every component, 2026-09-19 — see each `component-reviews/*.md` file's post-Finalization
entry for that component's own findings.
