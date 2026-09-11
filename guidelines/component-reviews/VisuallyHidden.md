# VisuallyHidden

**Tier:** Atom · **Category:** Utility · **Finalized:** ✅ 2026-09-10

## Review pass (2026-09-10)

Full `06-engineering-standards.md` §9 pass — first review for this component. Findings, in the
order fixed (Playground-missing first, Docs-page-missing last, per the standing reporting
convention):

1. **Playground story added.** `VisuallyHidden.stories.tsx` previously had three fixed-render
   Variant stories (`IconOnlyButtonLabel`/`InlineWithinText`/`SkipLink`) and no `Playground`, no
   `argTypes` at all. Added a full `argTypes` map (`children` as a live `text` control so the
   Playground's own demo text is editable; `focusable` as a real, described `boolean` control;
   `asChild`/`id`/`className`/`style`/`data-testid` correctly `control: false`, matching the
   established "not meaningfully live-editable" convention) and a new `Playground` story whose demo
   explicitly instructs the reader to press Tab into the canvas — since hidden content is, by
   definition, invisible on its own, the Playground's own copy has to say so rather than relying on
   the canvas alone. Live-verified: toggling `focusable` off/on and tabbing into the canvas correctly
   reveals/hides the demo text both ways.

2. **A real, confirmed correctness gap: `asChild`/`id`/`className`/`style`/`data-testid` were never
   redeclared on `VisuallyHiddenProps`**, relying only on the inherited `RadixVisuallyHiddenProps`
   (itself `ComponentPropsWithoutRef<typeof Primitive.span> & { asChild?: boolean }`) — the same
   docgen-drops-inherited-native-props gap already found and fixed on `Button`/`Portal`/`FocusTrap`/
   `ThemeProvider`/others (`05-component-api-conventions.md` §3). Confirmed live: before the fix,
   none of the five appeared in the Docs page's own Properties table. Fixed by explicitly redeclaring
   all five with their own JSDoc, matching this system's established wording for a thin Radix-wrapper
   Utility component.

3. **`asChild`'s Playground control genuinely works but has no visible effect** — the same class of
   finding already established on `ClientOnly`'s `fallback`, `FocusTrap`'s `asChild`, and `Portal`'s
   `asChild`. Per the established precedent, kept the control live (confirmed correctly wired via
   direct DOM inspection — with `asChild`, the wrapper `<span>` disappears and the hidden styling
   merges directly onto the child) rather than disabling it, and added an explanatory `Callout`
   above the Playground's own Canvas pointing to the skip-link Variant below for a dedicated,
   isolated demo of the same behavior.

4. **Each of the three Variant stories correctly dashes `children`/`focusable`'s Controls-panel
   entries** (matching the `07-storybook-and-documentation-standards.md` §5 convention already swept
   across the codebase) — each is a static, named reference to one exact combination, so a live
   control there would either contradict the story's own point or silently do nothing. Live-verified:
   all controls show `-` on all three.

5. **Docs page added** (`VisuallyHidden.mdx`) — the fifth and final Docs page in the Utility
   category, completing full Docs-page coverage across all 47 atoms. No document-wide or
   shared-state architecture conflicts here (unlike `Portal`'s DOM-escape issue or `ThemeProvider`'s
   dual-theming-systems issue) — `VisuallyHidden` has no side effects beyond its own DOM subtree, so
   every Variant Canvas (including two simultaneous portal-free instances) embeds safely. **Related
   components** links to `Link` (a real internal consumer — confirmed via `grep`, not assumed: `Link`
   uses `VisuallyHidden` for its own "(opens in a new tab)" screen-reader cue, and the live
   `RelatedCard` preview correctly renders that exact behavior) and `IconButton` (the alternative,
   simpler `aria-label` approach to the same "label icon-only content" need, cross-referenced so a
   reader picks the right tool for their case). One self-caught mistake before verification: the
   `IconButton` `RelatedCard`'s demo initially used an inline arrow function
   (`icon={() => <span>×</span>}`) for the `icon` prop, which doesn't type-check against
   `IconButtonProps`'s real `icon: PhosphorIcon` type — caught via `tsc`, fixed to use the real
   `XIcon` from `@dbm-design-system/icons` (the same icon `CloseButton` itself already uses).

## Verification

`tsc --noEmit` (main package build via `tsup`'s `.d.ts` generation, and `.storybook`), `eslint`
(whole package, zero warnings), full `vitest` unit suite (1065/1065 passing across the whole
package — unchanged, `VisuallyHidden.test.tsx` itself wasn't modified this pass, its existing 7 tests
already covered the component's real behavior thoroughly), `tsup` build, and the
`@storybook/addon-vitest` Storybook test project (`pnpm test:storybook`, 372/372 across all 50
component story files, up from 371 with the new `Playground`) all run and passing. `pnpm
build-storybook`, `pnpm check-component-bundle-size` (`VisuallyHidden` at 0.23KB JS / 0.13KB CSS,
well within budget), and `pnpm check-foundations-token-coverage` all clean.

Live-verified in a running Storybook instance: the Properties table shows all 7 props (including the
newly-redeclared `asChild`/`id`/`className`/`style`/`data-testid`) with correct descriptions/
defaults; the Playground's `children`/`focusable` controls genuinely drive the canvas — confirmed by
pressing Tab into the canvas and watching the demo text reveal/hide, not just visual inspection;
both `RelatedCard`s render live, correctly-scoped previews with correct, verified hrefs (the `Link`
preview even reproduces the exact "(opens in a new tab)" `VisuallyHidden` usage being documented);
zero console errors on a genuinely fresh tab; mobile viewport (375px) confirmed zero horizontal
overflow; both brand themes × both color modes confirmed with no breakage to the shared Docs chrome.
The live Accessibility panel couldn't be independently re-checked this session — the same standing
environmental limitation already documented in `Portal.md`/`Tooltip.md`/`ThemeProvider.md`
(`ADR-0003`'s `pnpm test:storybook:watch` requires a persistent process this session can't sustain)
— covered instead by the existing `jest-axe` unit test (`"has no accessibility violations"`).

No prior `component-reviews/` entry existed for this component (first pass). This is the last
not-yet-reviewed atom — every atom in the inventory now has a completed review pass.

## Post-review fix: Related Components' Link demo rendered icon on its own line (2026-09-10, same day, user-reported)

User report, with a screenshot: in the `Link` `RelatedCard`'s live preview, the external-link icon
appeared on a separate row below the "External link" label instead of inline beside it, unlike the
real `Link` component.

Root-caused via direct DOM inspection, not assumed: the rendered `<a>` contained `<p>External
link</p>` followed by the icon `<svg>` — MDX had auto-wrapped the Link's own text children in a
stray `<p>` tag (a known MDX quirk: multi-line JSX children, indented on their own line inside a
component tag, get parsed as block-level markdown content rather than inline text). Since a `<p>`
is a block element, the browser's own CSS blockification algorithm forced the containing `<a>` out
of normal inline flow to accommodate it, pushing the icon (the `<a>`'s next sibling-in-content) onto
its own line below the now-block-level paragraph. Not a `Link`/`RelatedCard` bug — confirmed
`Link.module.css` sets no `display` property that could cause this on its own.

**Fix:** collapsed the `<Link>` JSX onto a single line in the MDX
(`<Link href="https://example.com" external>External link</Link>`) so MDX parses the children as
plain inline text instead of a block-level paragraph. Live-verified: the rendered `<a>` no longer
contains a `<p>`, and the label/icon now render on one line, matching the real component's own
appearance. Full suite re-run clean: `tsc`, `eslint`, `addon-vitest` 372/372.

## Post-review fix: Icon-only button label demo used a hand-rolled `<button>` instead of the real `IconButton` component (2026-09-10, same day, user-reported)

User request: make the `IconOnlyButtonLabel` story use the design system's own `IconButton` component rather than a hand-styled raw `<button>`.

A literal swap turned out to be impossible without first resolving a real conflict, found while
implementing this: `IconButton` never renders `children` at all outside `asChild` mode (only its
own `icon` prop or a loading spinner), so a `<VisuallyHidden>` child would be silently dropped —
and `asChild` mode always logs a dev-mode console warning that `icon` goes unused, which would
have broken this project's own "zero console warnings" verification bar for every load of the
story. Neither mode lets `VisuallyHidden` nest directly inside `IconButton` cleanly.

**Fix:** rendered `VisuallyHidden` as a sibling of a normal-mode `IconButton`, with a stable `id`
on the `VisuallyHidden` span and `aria-labelledby` on `IconButton` pointing at it — `aria-labelledby`
wins over `aria-label` in the accname computation, so the hidden text genuinely is the accessible
name a screen reader announces, not just decoration. `IconButton`'s own required `aria-label` prop
stays set to the same string as a harmless fallback (in case the referenced element is ever
removed), with a comment explaining why both are present. Live-verified in a running Storybook
instance (both the standalone story and the Docs page's embedded Canvas): the rendered `<button>`
carries `aria-labelledby="icon-only-button-label-demo"` and `aria-label="Close dialog"`, the
referenced `<span>` is correctly clipped and holds "Close dialog", and no `IconButton` dev warning
fires on either page.

Also caught and fixed a related, pre-existing documentation bug while investigating this:
`VisuallyHidden.tsx`'s own top-of-file JSDoc `@example` showed
`<IconButton icon={Trash}><VisuallyHidden>Delete item</VisuallyHidden></IconButton>` — exactly the
broken pattern above, which would render nothing at all. Replaced it with a plain native-button
example matching the Docs page's own first Code example.

Full suite re-run clean: `tsc --noEmit` (pre-existing, unrelated failures on `ClientOnly.stories.tsx`
and `ThemeProvider.test.tsx` confirmed via `git stash` to already exist on `main`, untouched by this
fix), `eslint` (zero warnings) plus `tsc --noEmit -p .storybook/tsconfig.json`, full `vitest` unit
suite (1065/1065, unchanged), `tsup` build, `@storybook/addon-vitest` (372/372, unchanged),
`check-component-bundle-size` (`VisuallyHidden` unchanged at 0.23KB JS / 0.13KB CSS), and
`check-foundations-token-coverage` (in sync).

## Final review (2026-09-10)

A full top-to-bottom re-pass of the checklist before finalizing, after every post-review fix above
was in place. No new component-level findings — everything checked out:

- **Baseline correctness**: `VisuallyHidden.tsx` re-read fresh. Checked specifically for the
  props-spread-ordering bug class already found on `ThemeProvider`/`IconButton`/others (a computed
  attribute silently overridden by a same-named consumer prop via spread order): `className` is the
  only computed value here, and it's destructured out of `props` before `{...props}` is spread, so
  `props` cannot itself carry a colliding `className` key at the type level — confirmed no instance of
  that bug class exists in this component.
- **Types/docgen**: `VisuallyHiddenProps` re-checked against the Properties table — `asChild`/`id`/
  `className`/`style`/`data-testid` all still correctly redeclared with their own JSDoc (the fix from
  the original review pass).
- **Playground defaults**: `meta.args` (`children: "Screen-reader-only text", focusable: false`)
  matches the real `@default false` documented for `focusable` and the Properties table's own
  `Default` column — no mismatch.
- **Controls wiring**: `Playground`'s `children`/`focusable` controls genuinely drive the canvas
  (re-confirmed by tabbing into the canvas and watching the demo text reveal/hide, not just visual
  inspection); all three Variant stories correctly show `-` for `children`/`focusable`.
- **Icon-only button label demo**: re-verified live — the real `IconButton` renders with
  `aria-labelledby` pointing at the sibling `VisuallyHidden` span, `aria-label` present as the
  required-prop fallback, the referenced span correctly clipped and holding "Close dialog", and no
  `IconButton` dev-mode warning fires on either the standalone story or the embedded Docs-page Canvas.
- **Accessibility**: zero violations via `jest-axe` (`VisuallyHidden.test.tsx`, 8/8 passing — corrected
  count; the original review pass's write-up said 7, an undercount, the file has always had 8). The
  live Accessibility panel couldn't be independently re-checked this session — the same standing
  environmental limitation already documented in `Portal.md`/`Tooltip.md`/`ThemeProvider.md`
  (`ADR-0003`'s `pnpm test:storybook:watch` requires a persistent process this session can't sustain)
  — covered instead by the `jest-axe` suite.
- **Responsiveness**: mobile viewport (375px) checked live on the Docs page — zero horizontal
  overflow, confirmed via direct DOM measurement (`scrollWidth === clientWidth`), not just visual
  inspection.
- **Console**: zero errors on genuinely fresh tabs, across all four standalone stories
  (`Playground`/`IconOnlyButtonLabel`/`InlineWithinText`/`SkipLink`) and the Docs page itself.
- **Full suite**: `tsc --noEmit` (pre-existing, unrelated failures on `ClientOnly.stories.tsx` and
  `ThemeProvider.test.tsx` confirmed via `git stash` to already exist on `main`, untouched by this
  review), `eslint` (zero warnings) plus `tsc --noEmit -p .storybook/tsconfig.json`, `tsup` build,
  1065/1065 unit tests, `addon-vitest` 372/372, `build-storybook`, `check-component-bundle-size`
  (unchanged, 0.23KB JS / 0.13KB CSS), `check-foundations-token-coverage`, and
  `check-storybook-bundle-size` (11884KB / 20000KB budget) — all re-run clean.

**One out-of-scope finding surfaced, not fixed here:** loading the Docs page's Playground triggered
the real `Switch` component's own dev-mode console warning ("no accessible name") — traced to the
*shared* `PlaygroundControls.tsx` block's `ControlField` function, which renders a `Switch` for every
boolean prop's live control with only `id` (paired with an external `FieldLabel htmlFor`) and no
`aria-label`/`aria-labelledby` of its own. Confirmed via search this is systemic — the same shared
block is used by every component with a boolean Playground control (at least 25 `.stories.tsx` files,
including `FocusTrap`/`Portal`/`Tooltip`/`IconButton`/`Avatar`), not something introduced by or
specific to `VisuallyHidden`. Flagged as a separate follow-up task rather than folded into this
review, since fixing it means touching shared Docs-page infrastructure used across the whole
component library, not this one atom.

**Follow-up fix (2026-09-10, same day, user-directed): the flagged `PlaygroundControls` Switch
warning above was fixed directly in this session rather than left as a standalone task.** Confirmed
the accessible name was never actually missing — `FieldLabel`'s `htmlFor` targeting `Switch`'s `id`
is a real, spec-valid native `<label for>` association (`<button>` is a labelable element) — `Switch`'s
own dev-mode check simply can't see an externally-associated label, only its own
`children`/`aria-label`/`aria-labelledby` props. Fixed by making the association explicit:
`ControlField` (`.storybook/blocks/PlaygroundControls.tsx`) now gives the `FieldLabel` a stable `id`
and passes `aria-labelledby` to the `Switch` pointing at it. Verified live across multiple components
(`VisuallyHidden`, `FocusTrap`) — the warning no longer appears on a fresh tab, and no longer appears
anywhere in the full `addon-vitest` Storybook test-project run either. Full write-up:
`07-storybook-and-documentation-standards.md` §4.1.

## Finalized

**2026-09-10** — confirmed by the user after a full top-to-bottom final review pass covering every
checklist section: baseline correctness (the props-spread-ordering bug class checked and confirmed
not present), feature-completeness (`children`/`focusable`/`asChild` cover this component's whole
surface, with `asChild`'s live-but-invisible Playground control documented rather than disabled, per
established precedent), accessibility (zero `jest-axe` violations, 8/8 tests passing — a corrected
count from the original review pass's undercount of 7; `Playground`'s own live a11y panel blocked only
by the standing, documented `ADR-0003` environmental limitation, not a real gap), responsiveness
(mobile viewport spot-checked, zero horizontal overflow), and functional verification (`tsc`,
`eslint`, full 1065-test suite, `tsup` build, `addon-vitest` 372/372, `build-storybook`, bundle-size,
foundations-token-coverage, and storybook-bundle-size checks all clean).

This review surfaced and fixed real, independent issues beyond the initial pass — a Properties-table
docgen gap (`asChild`/`id`/`className`/`style`/`data-testid` never redeclared), a Docs-page
`RelatedCard` layout bug traced to an MDX auto-`<p>`-wrapping quirk, a hand-rolled icon-only-button
demo replaced with the real `IconButton` component (surfacing and fixing a related, pre-existing
incorrect JSDoc `@example` on `VisuallyHidden.tsx` itself in the process), and — beyond this
component's own scope — a systemic false-positive accessibility warning in the shared
`PlaygroundControls.tsx` Docs-page infrastructure, found while finalizing this component and fixed
across all ~25+ other components it affects. Each fix was verified live in a running Storybook
instance, including two live user reports (the `RelatedCard` layout bug, the `IconButton` component
swap) that shaped the fix directly. No further changes without asking first, per
`06-engineering-standards.md` §9's finalization rule.
