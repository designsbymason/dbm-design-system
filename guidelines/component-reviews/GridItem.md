# GridItem

**Tier:** Atom · **Category:** Layout · **Finalized:** Pending confirmation

## Review pass (2026-09-07)

Full `06-engineering-standards.md` §9 pass — first review for this component (moved from
`molecules/` to `atoms/` 2026-09-07 per [ADR-0012](../adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md);
this is that atom-tier review). Findings, in the order fixed (Playground-missing first, Docs-page-missing
last, per the standing reporting convention):

1. **Playground story added.** `GridItem.stories.tsx` had no `argTypes` at all and no dedicated
   interactive Playground — every one of the 6 existing stories used a bare `render: () => (...)`
   that ignored `args` entirely, and every Controls-panel row showed `–` (no control whatsoever,
   confirmed live), not even an inert placeholder. Added a full interactive `Playground` (rendered
   inside a real `Grid`, with three fixed filler cells so the highlighted cell's placement is
   actually visible) plus `argTypes` for every prop, and gave every existing static story
   `control: false` on the props it intentionally hardcodes.

2. **Real, confirmed API gap: `id`/`className`/`style`/`data-testid` weren't explicitly redeclared
   in `GridItemProps`** — the same category of gap already found and fixed on `Text`/`ListItem`.
   Note: the sibling molecule `Grid` has this same gap in its own `GridProps` today, but `Grid`
   itself has never been through a `06-engineering-standards.md` §9 review pass (it landed 2026-08-09,
   before the review-pass discipline existed, and has no Docs page yet) — so `Grid`'s own gap isn't
   a precedent to match here; it's simply still queued for its own future review. Fixed by
   redeclaring all four with the exact JSDoc wording `Box`/`Stack`/`Heading`/`Text` already use.

3. **Stability gap: no dev-mode warning for an invalid `colSpan`/`rowSpan`.** A zero or negative
   span is invalid per the CSS Grid spec — the browser silently ignores the *entire* placement
   declaration rather than clamping it, which reads as "colSpan did nothing" with no error anywhere.
   Confirmed empirically (a throwaway test rendering `colSpan={0}`) before fixing. Added a
   dev-mode `console.warn`, covering both a plain value and a responsive map with any non-positive
   entry.

4. **Feature-completeness — a concrete, named gap against comparable production grid-cell
   components (`order`), closed at explicit user direction (not silently added):** `order` (CSS `order`, visual reordering
   independent of DOM/source order) was missing. Closed after confirming `Stack` (DBM's own flex
   primitive) has no equivalent prop either — flagged as an asymmetry risk before building, user
   chose to add it anyway. Implementation mirrors `colSpan`/`rowSpan`/`colStart`/`rowStart`'s own
   responsive-map mechanism exactly (same `responsiveStyle` helper, same six-breakpoint CSS
   cascade), falling back to `0` (CSS `order`'s own initial value) rather than `auto` (which only
   makes sense for `grid-column`/`grid-row`).

5. **Accessibility test coverage gap:** the automated check only ever exercised the default `<div>`
   wrapping a real `<button>` — per the established convention (a real violation was found this way
   on `Avatar`, 2026-08-15, once `as` changed its underlying element), a polymorphic component's
   check must also run against a non-default `as`. Verified empirically first: `as="li"` rendered
   *standalone* (no `<ul>`/`<ol>` ancestor) genuinely triggers axe's own "listitem" violation — an
   inherent property of an `<li>` outside list context, not a defect `GridItem` introduces or could
   suppress; wrapped in a real `<ul>` (matching the `AsListItem` story's own usage), zero violations.
   Added a permanent test confirming the correct-usage case is clean.

6. **Unit tests extended**: added coverage for `order` (single value and responsive map), the
   invalid-span warning (zero, negative, and a responsive map with one non-positive entry, plus
   confirming no warning for a valid span), `id`/`style` merging, and the `as="li"`-inside-a-real-`<ul>`
   accessibility test above. 22/22 passing (up from 12).

7. **Docs page added** (`GridItem.mdx`), full 10-section template. Since the sibling molecule
   `Grid` has no Docs page yet, its own `RelatedCard` links directly to its existing Storybook story
   instead (`/?path=/story/molecules-layout-grid--default-columns`) — the same pattern already used
   by `ListItem.mdx` (linking to `List` before `List` had a Docs page) and `Stack.mdx`. Live-verified:
   TOC renders all 10 section headings, Properties table renders all 11 props in the declared order,
   all 8 story canvases render real content (including the new `Order` story), both `RelatedCard`s
   (`Grid`, `Box`) render live previews with correct, working links (confirmed the `Grid` link lands
   on `Grid`'s own existing story without modifying `Grid` itself), zero console errors in a fresh
   browser tab, both brand themes × both modes confirmed live (GridItem itself uses zero color
   tokens — pure grid-placement math — so the check is really confirming the demo `cellStyle`'s own
   tokens render correctly, which they do), mobile viewport spot-checked (`ResponsiveSpan` correctly
   shows full-width at mobile).

8. **User-reported correction: several Controls-panel numbers still showed "Set number" placeholders
   after the fix above, and a real layout collision bug surfaced while investigating it.** The
   initial Playground fix gave `colSpan`/`rowSpan`/`colStart`/`rowStart`/`order` each a real numeric
   default (`1`/`1`/`1`/`1`/`0`) so no control would show as unset — correct for `colSpan`/`rowSpan`/
   `order` (their own CSS-initial values, safe regardless of how many sibling items share them), but
   **wrong for `colStart`/`rowStart`**: explicitly setting `grid-column-start`/`grid-row-start` to
   `1` on *every* item in a multi-item gallery story (`Order`, `ResponsiveSpan`, `AsListItem`, all of
   which spread shared `args` across more than one `GridItem`) pinned every one of them to the same
   explicit line, overlapping each other — confirmed live (the `Order` story's three items visually
   collapsed into what looked like a single cell; inspecting computed styles showed all three sharing
   `grid-column-start: 1`). Separately, `Order`/`ResponsiveSpan`/`AsListItem` were also found to use
   `render: () => (...)` with no `args` parameter at all — a full instance of the "story ignores its
   own args" bug class (already fixed elsewhere in finding 1), silently making every control in those
   three stories a no-op regardless of the placeholder-value issue.
   Fixed by giving `colStart`/`rowStart` the same `text` control + real `""` starting-arg + parsing
   helper (`parseNumberArg`) that `Heading.stories.tsx`/`Text.stories.tsx` already established for a
   prop with no safe non-blank default — `""` reads as "no explicit start" (auto-placement) once
   parsed, so spreading it across any number of sibling items no longer forces them onto the same
   line. `Order`/`ResponsiveSpan`/`AsListItem` were also rewritten to accept and properly spread
   `args` (matching the multi-instance-gallery pattern: only the one genuinely-varying prop per story
   is suppressed, everything else — including `colSpan`/`rowSpan`, confirmed safe — stays live and
   shared). Re-verified live: the `Order` story's three cells render correctly side by side again,
   and toggling the (now-shared) `colSpan` control resizes all three at once; every prior "Set
   number" control now shows a real value or a genuinely-empty live text field, never a placeholder.

9. **User-reported: "order" appeared not to work in the Playground.** Confirmed the prop itself was
   already wired correctly (changing `order` from its `0` default to any positive value did move
   the highlighted cell to last) — the real issue was the demo's own design: the Playground's three
   filler cells all shared the same implicit `order` (unset → `0`), so *every* positive value on the
   highlighted cell produced the identical result (last position). Trying different positive numbers
   in sequence looked exactly like nothing was happening, even though the prop worked. Fixed by
   giving the three fillers distinct, spaced-out `order` values (`10`/`20`/`30` — not `1`/`2`/`3`,
   to avoid tie-breaking ambiguity) so the highlighted cell's own value now lands in one of four
   clearly distinguishable positions across its range. Re-verified live: `order=15` lands between
   the first and second filler, `order=25` between the second and third — confirmed visually, not
   just inferred.

10. **User-reported follow-up: "still not changing for me when I type a number in order field."**
    This turned out to be a real, separate bug — not in `GridItem` at all, but in the *shared*
    `PlaygroundControls.tsx` block every component's Docs page uses: every widget's displayed value
    was driven directly off `usePlaygroundArgs`'s own args, which only update after a full
    round-trip through Storybook's event channel — the Canvas itself updated instantly and
    correctly, but the input the user was actually looking at kept showing its *previous* value for
    that whole round-trip window (confirmed live: `order` and `colSpan` both lagged by roughly a
    second). Fixed at the shared-block level (an optimistic local echo, synced from the external
    value only when it changes for some other reason) — see
    `07-storybook-and-documentation-standards.md`'s own entry on `PlaygroundControls` for the full
    write-up, since this fix applies to every component's Docs page, not just `GridItem`'s. Confirmed
    no regression on `Heading`'s own select/`resolveDisplayValue` cascade while verifying.

11. **User pushback on finding 9's own fix: "why order 10, 20, 30 — how would users know those to
    test order properly?"** Fair, and correct — spacing the fillers out to avoid tie-breaking
    ambiguity solved a real problem but created a worse one: a reader trying the small, obvious
    numbers they'd naturally reach for first (1, 2, 3) would see the *exact same* "still first"
    result across that entire range, since none of them cross the `10` threshold — the identical
    complaint that prompted finding 9, just moved to a different number range instead of fixed.
    Verified the actual tie-break math empirically before re-fixing (a throwaway 4-item CSS grid,
    reading back `getBoundingClientRect` order for `order` values 0 through 4 against fillers at
    1/2/3): `order=1` ties with the first filler and — because CSS resolves same-`order` ties by DOM
    position — the highlighted cell (earlier in the DOM) stays in front either way, so `0` and `1`
    look identical; every value after that (`2`, `3`, `4`) lands in a new, visually distinct position
    as it overtakes one more filler in turn. Reverted to fillers at `1`/`2`/`3`: one skipped step
    (`0`→`1`) is a far smaller, more forgivable cost than requiring a double-digit guess, and it's
    exactly the small-number range a reader explores by default. Re-verified live, all five values in
    sequence (`0` through `4`) — confirmed each screenshot matches the predicted position, not just
    the computed one.

12. **User follow-up: start the Playground's own `order` demo at `1` instead of `0`.** `order`'s real
    default is genuinely `0` (CSS's own initial value), but starting the *demo* there means the very
    first increment a reader tries (`0`→`1`) is exactly the dead step finding 11 identified — visible
    only if they happen to start below it. Starting the demo's own arg at `1` instead means the
    natural, default exploration direction (increasing: `1`→`2`→`3`→`4`) shows a visible change on
    every single step; the dead step still exists (it's inherent to this filler arrangement, not
    something to hide), but now only appears if a reader explicitly goes back down to `0`. Same
    "sensible non-blank demo value, not the literal default" carve-out already used for `Heading`'s
    own `align`/`wrap` Playground defaults. Re-verified live: canvas unchanged on load (`order=1`
    still renders identically to the old `order=0` default, as expected), and moving to `order=2`
    immediately shows a change from the very first interaction.

13. **User request: every interactive field should show a default value — `colStart`/`rowStart`
    still looked empty.** Unlike `colSpan`/`rowSpan`/`order`, `colStart`/`rowStart` have no *safe*
    real numeric default to show (finding 11/12's own subject: an explicit line number spread across
    more than one grid item pins them all to the same line — the original collision bug). Rather than
    give them a real value (unsafe) or leave them looking broken (the actual complaint), added
    `placeholder` support to the shared `PlaygroundControls.tsx` block — cosmetic-only guidance text
    (the native HTML `placeholder` attribute) shown when a `text`/`number` control's value is
    genuinely empty, never sent through `onChange`, never becomes a real arg. `colStart`/`rowStart`
    now show a light "auto" placeholder — communicating what leaving them unset actually means —
    without setting any real value that could collide once spread across `Order`/`ResponsiveSpan`/
    `AsListItem`'s multi-item layouts. Re-verified live: the placeholder disappears the instant a
    real value is typed (`colStart=2` correctly moved the highlighted cell), and `rowStart`'s own
    placeholder was unaffected by that edit.

## Verification

`tsc --noEmit` (main + `.storybook`), `eslint . --max-warnings 0` (whole package), full `vitest`
unit suite (1050/1050 passing across the whole package, 22/22 for `GridItem` itself), `tsup` build,
`check-foundations-token-coverage` (no new tokens — `order` is structural grid-placement math, same
category as the existing `colSpan`/`rowSpan`/`colStart`/`rowStart`), and `check-component-bundle-size`
(0.59KB JS / 0.42KB CSS gzipped — comfortably within budget) all run and passing. Live-verified in
Storybook: the Playground's `colSpan` control confirmed to actually resize the highlighted cell; the
new `Order` story confirmed to visually reorder three cells independent of their DOM order; the
`AsListItem` story confirmed unaffected; both brand themes × both modes and mobile viewport
spot-checked; the `Grid`/`Box` `RelatedCard` links confirmed to navigate correctly without touching
either unreviewed sibling.

## Finalized

Not yet — this review pass (baseline correctness, a real confirmed API-consistency gap on
`id`/`className`/`style`/`data-testid`, a real stability gap on invalid span values, a
feature-completeness addition of `order` at explicit user direction, a systemic missing-Playground/
no-controls-at-all defect, accessibility test coverage, responsiveness, design quality, theming,
Storybook documentation, and functional verification) is complete and passing, but per
`06-engineering-standards.md` §9's finalization rule, "Finalized" is only ever declared by explicit
user confirmation, not asserted by the agent that ran the review.
