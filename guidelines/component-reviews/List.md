# List

**Tier:** Molecule · **Category:** Typography · **Finalized:** Not yet — pending user confirmation

## Review pass (2026-09-13)

Full `06-engineering-standards.md` §9 pass — first review for this component, the second
molecule-tier review overall (after `Grid`). Findings, in the order fixed (Playground-missing
first, Docs-page-missing last, per the standing reporting convention):

1. **Playground story added.** `List.stories.tsx` had 7 stories but no `argTypes` and no dedicated
   Playground — every story used a bare `render: () => (...)` that ignored `args` entirely, so
   nothing was live-controllable (the same gap Grid's own review found and fixed). Added a full
   interactive Playground plus `argTypes` for all 10 props, matching Grid's established template.

2. **Real, confirmed accessibility bug: `{...props}` was spread *after* the computed `role`.**
   `List.tsx`'s render spread `{...props}` as the very last JSX attribute, following
   `role={isMarkerless ? "list" : undefined}`. A consumer passing their own `role` (a valid native
   prop, not blocked by `ListProps`' type) silently won over `List`'s own Safari/VoiceOver
   `role="list"` accessibility fix — the same recurring ordering bug class
   `06-engineering-standards.md` §9 already documents (Button/Skeleton/ProgressBar/FieldError), and
   exactly what `ListItem.tsx` itself already gets right one file over, with a comment explaining
   why. Fixed by reordering so `{...props}` comes first. Added a regression test verifying a
   consumer-supplied `role` no longer overrides the computed one.

3. **Real, confirmed API gap: `id`/`className`/`style`/`data-testid` weren't explicitly redeclared
   in `ListProps`.** The same gap `GridItem`'s and `Grid`'s own reviews already caught for their
   respective components — worked today only via the implicit `Omit<ComponentPropsWithoutRef<E>,
   ...>` intersection, invisible to the Properties table. Fixed by redeclaring all four with the
   same JSDoc wording `Grid`/`GridItem` already use.

4. **Native-prop audit gap: `start`/`reversed`/`type` (the `<ol>`-specific attributes) weren't
   audited or redeclared with their own JSDoc.** They already worked via the same implicit
   intersection (covered by one existing test), but were undiscoverable without reading source —
   the native-prop-audit gap the checklist requires (established via `Input`). Fixed by redeclaring
   all three, each JSDoc'd as applying only when `as="ol"`.

   **Real, non-obvious bug found while building this, not assumed correct from the type fix
   alone:** live-verifying the new `type` control in the Playground showed `type="A"` reaching the
   DOM correctly as a real attribute, but the rendered list still counted with plain digits, not
   letters. Root cause: CSS `list-style-type` always takes precedence over the native `<ol type>`
   HTML attribute when both are present, and `List`'s own `marker`-driven `markerDecimal` CSS class
   (applied by default on any `ol`, since `marker` resolves to `"decimal"` unless overridden) sets
   exactly that — permanently and unconditionally shadowing whatever `type` value a consumer
   passed. `type` was genuinely, completely inert as originally typed. Fixed by translating `type`
   into its own CSS `list-style-type` equivalent (`decimal`/`lower-alpha`/`upper-alpha`/
   `lower-roman`/`upper-roman`) and applying it as an inline style — consistent with how `marker`
   is already CSS-class-driven rather than left to native-attribute fallback — gated to only apply
   when `marker` resolves to `"decimal"` (so it's correctly inert alongside an explicit
   `marker="disc"`/`"none"` override, matching real intent). Added test coverage for all 5
   `ListOrderedType` values, the `as="ul"` inert case, and the `marker="disc"` inert case.

5. **Storybook composition-coverage gap, addressed without duplicating existing coverage.**
   `List.stories.tsx` had no story demonstrating `List` composed with `ListItem`'s own headline
   features (`icon`, `trailing`, `interactive`/`selected`/`disabled`) — though `ListItem.stories.tsx`
   already covers each of these thoroughly in isolation. Rather than duplicate that per-feature
   breakdown on `List`'s own page, added one realistic composed story
   (`WithListItemFeatures` — a 3-item nav list combining icon markers, trailing content, and
   interactive/selected/disabled state together) confirming the *composed* case genuinely works,
   with `List.mdx`'s own "Related components" section linking to `ListItem`'s Docs page for the
   full per-feature treatment.

6. **No nested-list story.** Nesting already worked mechanically with zero code changes needed (a
   `<ul>`/`<ol>` inside a `<li>`'s own children is standard, unguarded HTML, and `ListItem` renders
   `children` as-is) — just undemonstrated. Added `NestedLists`.

7. **`jest-axe` coverage gap.** Only one accessibility test existed, against the default `ul`/
   `disc` case — missing `as="ol"`, `marker="none"` (the actual `role="list"` fix scenario, the one
   case most likely to regress silently), and an `interactive` `ListItem` scenario, the same
   "polymorphic/prop-dependent ARIA needs its own axe pass" precedent established via `Avatar`.
   Added all three; zero violations in every case.

8. **Dev-mode warning added for `start`/`reversed`/`type` passed without `as="ol"`.** Browsers
   silently ignore these on a `ul`, easy to misuse unnoticed — matches the "fail loud in
   development" principle (`06-engineering-standards.md` §3) and `ListItem`'s own precedent
   (warns on `selected`/`disabled` without `interactive`). Deliberately checks `reversed === true`,
   not `"reversed" in props` — a caller explicitly passing `reversed={false}` (e.g. a Storybook
   control's own default arg) is a no-op matching the attribute's own natural default, not real
   usage worth warning about; using `in` here would have produced a false-positive on the
   Playground's own default state.

9. **Docs page added** (`List.mdx`), full 10-section template. Live-verified: Playground and all 9
   variant stories render correctly, including the `type` fix (`E`/`D`/`C` reversed-uppercase
   counting) and the composed/nested-list stories; Properties table renders all 11 props in the
   declared order with real descriptions and correct value-option pills; all `RelatedCard`s
   (`ListItem`, `Stack`, `Grid`) render live previews with correct `/?path=/docs/...` `href`s,
   confirmed via the live DOM. Both brand themes × both modes spot-checked live (Purple/Light,
   Purple/Dark) — correct contrast, no console errors.

## Verification

`tsc --noEmit` (main tsconfig, clean for every `List`-owned file), `eslint . --max-warnings 0`
(whole package, clean), `typecheck:storybook` (clean), `pnpm lint` as a whole (clean — this is the
first molecule reviewed since `lint` was fixed to cover the full `src` tree, per `Grid.md`'s own
post-review-closure entry), full `vitest` unit suite (1084/1084 passing package-wide, 27/27 for
`List` itself, up from 13), the `storybook` Vitest project (378/378 passing package-wide), `tsup`
build (clean), `check-component-bundle-size` (`List`: 0.68KB JS / 0.30KB CSS gzipped, comfortably
within budget). Live-verified in Storybook: every prop's control genuinely drives its own story's
canvas (not just the Playground); the `type`-prop bug found and fixed above re-verified via the
`OrderedListSpecificProps` story showing real `E`/`D`/`C` letters, not digits; 0 accessibility
violations across `NestedLists` and `WithListItemFeatures`; both brand themes × both modes
confirmed live on the Docs page.

**Checked and passing, no action needed:** TypeScript strict/no `any`, zero hardcoded values (fully
token-driven `List.module.css`), SSR/RSC safety, original DBM implementation, responsiveness
(`ResponsiveSpacing` story verified at multiple viewport widths). The three molecule-only
composition checkpoints that require a compound sub-part, a consumed atom's own defect, or a
wrapped Radix primitive don't apply here in the way they did for `Grid` either: `List` has no
compound sub-exports of its own (`ListItem` is a separate top-level atom, not a `.Item`-style
sub-part); no defect was found in the consumed atom `ListItem` while auditing the composition (its
own `{...props}` ordering, ARIA, and capture-phase disabled-guard logic all read correctly); `List`
wraps no Radix primitive. The atom-reuse checkpoint was considered specifically (whether `List`'s
own flex/gap CSS should compose `Stack` internally instead of its own near-identical `.root` rule)
and concluded not a real gap — `List` needs native `<ul>`/`<ol>` markup and marker semantics
`Stack` has no notion of, and the actual duplicated surface is a handful of CSS lines, not enough
to justify the added indirection.

## Status

Review pass complete, all findings actioned. **Not yet Finalized** — per
`06-engineering-standards.md` §9, only the user declares a component's review pass done.
