# Icon — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-03. Findings included one confirmed,
real accessibility-correctness bug (not just documentation completeness), plus a genuine
feature-completeness gap against Phosphor's own underlying icon API that the DBM wrapper had never
exposed.

**Fixed:**
- **Confirmed instance of the `{...props}`-ordering bug class (`05-component-api-conventions.md`
  §3):** `{...props}` was spread *after* Icon's own computed `role`/`aria-label`/`aria-hidden` in
  the JSX. `role` is blocked by IconProps' own `Omit`, but `aria-hidden`/`aria-label` are not —
  TypeScript's own aria-* exemption lets a consumer pass either at runtime regardless of the
  `Omit`, so a same-named consumer value could silently win, e.g. exposing a decorative icon to the
  accessibility tree, or overriding a real `label`'s accessible name. This is a genuine correctness
  bug, not just style — fixed by moving `{...props}` before the three computed attributes, and
  added `"aria-label"` to `IconProps`' own `Omit` list (a raw passthrough `aria-label` was never a
  documented mechanism — `label` already is one). Regression test added, matching the same pattern
  already established on `Divider`/`IconButton`.
- **Real feature-completeness gap against Phosphor's own `IconProps`:** Phosphor's underlying icon
  components support a native `mirrored` prop (renders `transform: scale(-1, 1)`) for flipping a
  directional icon under RTL — entirely inaccessible through the DBM wrapper before this pass,
  since `IconProps` only ever extended `ComponentPropsWithoutRef<"svg">` (a native DOM type), not
  Phosphor's own `IconProps` (where `mirrored` actually lives). Added `mirrored?: boolean` with
  JSDoc referencing `guidelines/adr/0009`, a dedicated gallery story, and a Docs-page variant.
- **`children` wasn't `Omit`ted from the inherited svg props** — confirmed via Phosphor's own
  `IconBase` runtime source that consumer-passed `children` actually render *inside* the `<svg>`
  alongside the icon's own path content (not silently dropped), with no legitimate use case through
  this wrapper since `icon` is the sole content mechanism. Added `"children"` to the `Omit` list,
  matching `Divider`'s own established precedent for the identical reasoning.
- **`id`/`className`/`style`/`data-testid` weren't explicitly redeclared with JSDoc** on
  `IconProps` — the same established gap as `Box`/`Center`/`Container`/`Stack`.
- **No Playground story existed** — added, with every prop live. Fixing this surfaced a real
  Storybook `mapping`-control bug of its own: the meta-level `args.icon` was initially set to the
  *resolved* `WalletIcon` component reference rather than its mapping string key, which left the
  Controls-panel select showing an unselected "Choose option..." placeholder on first load despite
  the canvas rendering correctly — confirmed live, then fixed by switching to the string-key-plus-
  cast pattern `Button.stories.tsx` already established for this exact `mapping` control shape.
- **`AllSizes`/`AllWeights`/`AllTones` all used `render: () => (...)` ignoring their own args** —
  the confirmed "render ignoring args" bug class (originally found on `Avatar`). Fixed with explicit
  `argTypes` disabling every meta-level control on these (and the other non-Playground) stories,
  matching the same established precedent as `Stack`'s own review.
- **`AllTones` only demonstrated 4 of the 14 `IconTone` values** (`default`/`secondary`/`brand`/
  `disabled`) — missing `danger`/`warning`/`success`/`info` entirely, and all six `on-*` tones
  (meant to sit on a matching solid-fill background, not the page background). Expanded to all 14,
  with the `on-*` row shown against its own real matching `bg.*` swatch so the contrast pairing
  actually reads, rather than floating unstyled on white.
- Docs page (`Icon.mdx`) built to the full template — visually verified section by section in a
  running Storybook instance (Playground live-control check including the icon-mapping fix,
  Properties table confirming `children` no longer appears, both Do/Don't Callouts, Accessibility
  Callout, all 14 tones in both light and dark mode, the Mirrored story's visible flip, and all
  three RelatedCards — Button, IconButton, Tag), across both brands and both light/dark modes, plus
  a mobile-viewport check.

**Found and fixed after the initial pass** (in response to a direct question about the Docs page's
"Show code" panel showing a broken `icon={{ $$typeof: Symbol(react.forward_ref), render: () => {}
}}` dump on the Default variant):
- **A second, distinct `mapping`-control bug — this one in the shared Storybook tooling itself**,
  not Icon's own code: `.storybook/blocks/PlaygroundControls.tsx`'s `ControlField` displayed a
  `mapping`-backed select (e.g. `icon`) by naively `String()`-ing its current value. That value
  turns out to already be the *resolved*, post-mapping value (confirmed empirically via a temporary
  `console.log`) — not the raw option key `usePlaygroundArgs.ts`'s own comment had assumed — so
  stringifying a real component reference produced something matching no option, leaving the
  Docs-page Playground's own embedded icon dropdown blank even though the canvas rendered correctly
  the whole time. Fixed with a proper reverse-lookup through `argType.mapping` when present;
  confirmed no regression on `Button`'s (`leadingIcon`/`trailingIcon`, default "None") and
  `IconButton`'s (`icon`) own Docs-page Playgrounds, both already-shipped consumers of the same
  `mapping` control shape. Both `usePlaygroundArgs.ts`'s stale comment and this bug are now
  corrected — this is shared infrastructure every future `mapping`-control Docs page benefits from,
  not an Icon-specific fix.
- **The "Show code" dump itself** — a separate, Storybook-built-in behavior: a story with an
  implicit/`{...args}`-driven render reconstructs its displayed source from the actual *resolved*
  args at runtime (`element-to-jsx-string`-style dynamic mode) rather than the file's literal source
  text, and for a non-primitive resolved value (a real icon component) that reconstruction is the
  object's own runtime shape, not anything a reader could usefully copy. Confirmed via the `AllSizes`/
  `AllWeights`/`AllTones`/`Mirrored` gallery stories, which never hit this because they were already
  literal, args-free renders. **Audited every story in the file, not just the one reported** —
  found two, not one: `Default` (already fixed) and `Labeled` (`args: { icon: HeartIcon, label:
  "Favorite" }` with no custom `render`, an identical case initially missed on the first pass). Both
  fixed by converting to a literal-render shape (each already had every control disabled via
  `argTypes: disableAllAxes`, so nothing interactive was lost) — Storybook then shows the real,
  clean, copyable source text instead. `Playground` itself is unaffected by this fix and
  unavoidably keeps the same dynamic-mode "Show code" limitation, since driving every prop live via
  `{...args}` is the entire point of a Playground story — accepted as inherent to any future Docs
  page whose Playground's own *default* args include a non-primitive value, not something to design
  around.

Considered and declined (named, not silently skipped): Ant Design's `Icon` also has a `spin`
boolean for a rotating loading icon — not added, since the system already has a dedicated
`Spinner` atom (with its own `prefers-reduced-motion` handling) for that exact role, and adding a
parallel mechanism on `Icon` would duplicate it. A generic `rotate`/directional-flip degree prop
(Ant's `Icon` has this too) — not added; no existing component in the codebase hand-rolls this kind
of rotation today, so there's no concrete, named gap driving it, just a hypothetical future need.

Tests: 12 → 17 (added: the props-ordering regression test, `mirrored` on/off coverage, `id`/
`data-testid` passthrough).

Self-verified: `tsc --noEmit` (both the package and `.storybook`), `eslint --max-warnings 0`, full
Vitest suite (890 tests package-wide), a real `tsup` package build, and
`check-component-bundle-size` (0.56KB JS / 0.24KB CSS gzipped — within budget).

**Finalized 2026-09-03** — per `06-engineering-standards.md` §9's own note, don't make further
changes to Icon (code, stories, docs, or its tokens) without asking first.
