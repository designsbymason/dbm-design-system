# Select

**Tier:** Molecule · **Category:** Inputs & Forms · **Finalized:** Not yet — pending user confirmation

## Review pass (2026-09-13)

Full `06-engineering-standards.md` §9 pass — first review for this component, the third
molecule-tier review overall (after `Grid`, `List`), and the first molecule review where the
compound-component and Radix-primitive checkpoints apply for real — `Grid`/`List` have neither a
dot-notation sub-export nor a wrapped Radix compound primitive; `Select` (`Select.Option`, built on
`@radix-ui/react-select`) has both. Findings, in the order fixed (Playground-missing first,
Docs-page-missing last, per the standing reporting convention):

1. **Playground story added, and every other story rewired to genuinely use its own args.**
   `Select.stories.tsx` had 6 stories, only one real `argType` (`size`), and 5 of 6 stories used an
   args-free `render: () => (...)` — the same "story ignores its own args" bug class both `Grid`'s
   and `List`'s reviews already found and fixed. Added a full interactive Playground plus real
   `argTypes` for all 27 props, and rewired every story to genuinely share `{...args}`, disabling
   only each story's own deliberate varying axis (`size` in `AllSizes`, `hasError`/`disabled` in
   `States` — both the multi-instance-gallery exception). Also added two new stories to actually
   demonstrate findings 5/6 below: `SideAndAlign` and `CustomTrigger`.

2. **Real, confirmed accessibility bug: `{...triggerProps}` was spread *after* the computed
   `aria-invalid`.** `Select.tsx`'s trigger render spread `{...triggerProps}` as the last JSX
   attribute, following `aria-invalid={hasError || undefined}`. `aria-invalid` isn't excluded from
   `SelectProps`' own native-attribute passthrough, so a consumer could pass their own
   `aria-invalid` — which silently won over `hasError`'s own computed value. Same recurring
   ordering bug class as `List`'s own finding #2 (Button/Skeleton/ProgressBar/FieldError/List).
   Fixed by reordering so `{...triggerProps}` comes first; applied the identical fix to
   `Select.Option`'s own `{...props}` spread too, even though no live bug was found there yet — the
   same class of risk exists the moment any computed attribute is added to that sub-part later.
   Added a regression test verifying a consumer-supplied `aria-invalid` no longer overrides the
   computed one.

3. **`id`/`style`/`data-testid`/`aria-label`/`aria-labelledby`/`aria-describedby` weren't explicitly
   redeclared in `SelectProps`.** Worked today only via the implicit `extends
   Omit<ComponentPropsWithoutRef<"button">, ...>` inheritance — confirmed this isn't automatically
   covered by checking `Input.types.ts` (the closest atom precedent, identical `interface X extends
   Y` shape), which explicitly redeclares all six regardless. Fixed by redeclaring all six with
   matching JSDoc wording.

4. **Real, more significant compound sub-part gap: `Select.Option` (`SelectOptionProps`) extended
   no native element type at all.** Unlike `SelectRoot`, an option couldn't accept `id`, `style`,
   `data-testid`, or *any* other native/aria passthrough — not even a bare `title` attribute. This
   is exactly what the "compound-component sub-part completeness" checkpoint (added ahead of the
   molecule review phase, never yet exercised — `Grid`/`List` have no sub-parts) exists to catch.
   Fixed by extending `Omit<ComponentPropsWithoutRef<"div">, ...>` and explicitly redeclaring
   `id`/`className`/`style`/`data-testid` with their own JSDoc, matching `SelectRoot`'s own
   convention. Also added: JSDoc on `children` (previously undocumented), and Radix `Item`'s own
   `textValue` prop (needed for correct typeahead search once an option's visible content isn't
   plain searchable text) — wired through and covered by a live keyboard-typeahead test.

5. **Radix-primitive prop audit: `side`/`align` (dropdown positioning) weren't exposed**, hardcoded
   to `position="popper"` only. `Tooltip` (already Finalized, the closest Radix-popover precedent in
   this codebase) explicitly exposes exactly these two as real, documented props on an identical
   `SelectSide`/`SelectAlign` type shape — establishing they're "commonly relevant" here too, not
   scope creep. Added both, wired to `SelectPrimitive.Content`, demonstrated in the new
   `SideAndAlign` story and verified live (a `side="right"` selection genuinely opened the dropdown
   to the trigger's right, not below it).

6. **`asChild` support added, with a real architectural conflict resolved deliberately, not
   guessed.** `Select`'s own `children` prop is already `<Select.Option>`s for the dropdown — Radix
   `Slot` needs exactly one child to merge the trigger's behavior onto, and the trigger's own
   built-in content (`Select.Value` + the caret `Icon`) is hardcoded internally, neither of which
   `Button`'s own `asChild` precedent (where `children` *is* the button's own visible content, no
   competing use) directly resolves. Asked for a decision rather than guessing an API shape that
   might need a breaking change later: added a dedicated `trigger?: ReactElement` prop (matching
   `Tooltip`'s own single-`ReactElement` trigger shape, just under its own name here since
   `children` was already spoken for) — when `asChild` is set, `trigger` becomes the `Slot`'s single
   child, fully replacing the built-in value/caret display, mirroring `Button`'s own "asChild
   replaces the icon/label content" precedent exactly. Three dev-mode warnings added, matching
   `Button`'s own validation style: `trigger` without `asChild`, `asChild` without `trigger`, and
   `placeholder` alongside `asChild` (inert — no `Select.Value` renders in that mode). Confirmed
   live: a real `<a>`/`<button>` passed as `trigger` renders as the actual DOM element (not wrapped
   in an extra node), still opens the real dropdown, and still receives `Select`'s own
   size/error/className chrome via Radix `Slot`'s built-in prop-merging.

7. **Docs page added** (`Select.mdx`), full 10-section template. Live-verified: Playground and all
   8 variant stories render correctly, including the `side`/`align` placement fix and the custom
   `asChild` trigger; Properties table renders all 27 props in the declared order with real
   descriptions and correct value-option pills; both `RelatedCard`s (`Input`, `FieldLabel`) render
   live previews with correct `/?path=/docs/...` `href`s. **Caught and fixed while drafting, not
   after:** an early draft referenced `FormField` (as the typical container for `Select` +
   `aria-describedby` wiring) both in `Select.mdx`'s own prose and in `Select.types.ts`'s own
   `aria-describedby` JSDoc — `FormField` doesn't exist yet (still an unbuilt molecule per
   `04-component-inventory.md`). Fixed by rewriting both to match `Input.types.ts`'s own real,
   already-shipped `aria-describedby` wording, and swapping the second `RelatedCard` to the
   already-built `FieldLabel` instead. Both brand themes × both modes spot-checked live
   (Purple/Light, Emerald/Dark) — correct contrast, dropdown and options both themed correctly, no
   console errors.

## Verification

`pnpm lint` (eslint + full `tsc --noEmit` + `typecheck:storybook`, clean), full `vitest` unit suite
(1095/1095 passing package-wide, 24/24 for `Select` itself, up from 13), the `storybook` Vitest
project (381/381 passing package-wide, up from 378), `tsup` build (clean), `check-component-
bundle-size` (`Select`: 1.56KB JS / 0.92KB CSS gzipped, within budget). Live-verified in Storybook:
every prop's control genuinely drives its own story's canvas; the `aria-invalid` override fix
re-verified via a real consumer-supplied `aria-invalid={false}` no longer winning over `hasError`;
`side="right"` genuinely repositioned the dropdown; the custom `asChild` trigger opens the real
dropdown and receives Select's own chrome; 0 accessibility violations closed, open, and with a
custom `asChild` trigger; both brand themes × both modes confirmed live.

**Checked and passing, no action needed:** TypeScript strict/no `any`, zero hardcoded values (the
one non-token `box-shadow` variant selector is an already-established, deliberate pattern — shadows
aren't reactive semantic tokens, matches precedent elsewhere in this codebase), SSR-safe (`useId`),
original DBM implementation, solid existing baseline test coverage before this review (13 tests,
including open/closed axe checks), atom-reuse of `Icon` with no defect found in it, controlled/
uncontrolled pairs already correct for both `value`/`defaultValue` and `open`/`defaultOpen`,
composed tab order not applicable in the way `GridItem`'s stepper example was (Radix's own
roving-focus/typeahead mechanism inside the open dropdown is a standard, already-accessible pattern,
not a DBM-composed tab-order decision to verify by hand), cross-part ARIA/id wiring not applicable
(`Select` doesn't compose a label/helper-text triad itself — that's a future `FormField`'s job).
Grouped options (`Select.Group`/`Select.Label`) remain a deliberate, already-JSDoc'd deferral
("leaves room for grouped options later without a breaking API change") — re-affirmed during this
review, not a fresh finding, and now also noted in the Docs page's own "Best practices" section for
visibility.

## Status

Review pass complete, all findings actioned. **Not yet Finalized** — per
`06-engineering-standards.md` §9, only the user declares a component's review pass done.
