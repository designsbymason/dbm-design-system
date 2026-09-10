# Highlight

**Tier:** Atom · **Category:** Typography · **Finalized:** ✅ 2026-09-07

## Review pass (2026-09-07)

Full `06-engineering-standards.md` §9 pass — first review for this component. Findings, in the
order fixed (Playground-missing first, Docs-page-missing last, per the standing reporting
convention):

1. **Playground story added.** `Highlight.stories.tsx` previously had only three static stories
   (`Default`, `All tones`, `Search-match emphasis`); now has a full interactive `Playground` with
   every prop wired through `args`/`argTypes`. Fixed a real, confirmed bug along the way: the old
   `Default` story's `tone` radio control showed **no option selected at all**, even though the
   canvas correctly rendered `tone="warning"` — the story's top-level `args` never set `tone`
   explicitly, the "arg left undefined → inert control" failure mode documented in
   `07-storybook-and-documentation-standards.md` §5. `Default` now disables the `tone`/`children`/
   `query` controls instead (matching `Code`'s own precedent), since it's a fixed illustrative
   example, not the interactive surface.

2. **`children` prop had no JSDoc at all** — fixed, now documented in `Highlight.types.ts`.

3. **`tone` prop's JSDoc was just `@default 'warning'`, no descriptive sentence** — fixed. Confirmed
   live before the fix: the rendered Properties/Controls table showed an empty Description for both
   `children` and `tone`.

4. **`className`/`style`/`id`/`data-testid` now explicitly redeclared** in `Highlight.types.ts` with
   their own JSDoc (previously only worked structurally via the native
   `ComponentPropsWithoutRef<"mark">` extension, invisible to the Properties table per the
   confirmed Button/Code/Blockquote docgen gap). `<mark>` has no non-global HTML-specific attributes
   beyond these, so no further native-prop audit gap existed.

5. **`argTypes` added** to the stories file for every prop, with real descriptions and appropriate
   controls. **A second real bug found and fixed here:** `tone`'s value options rendered as an em
   dash ("—") in the Properties table even after the JSDoc fix — confirmed by comparing directly
   against `Blockquote`'s already-correct `variant` table row, which showed real option pills.
   Root cause: an enum prop's value options are **not** auto-inferred from its TypeScript union type
   by this project's docgen — `argTypes.tone` needed an explicit `options: ["warning", "success",
   "info", "danger"]` array, the same way `Blockquote.stories.tsx`'s own `variant` argType already
   does. Fixed; re-verified live, all four options now render.

6. **Unit tests extended**: added coverage for `style`/`id`/`data-testid` passthrough (previously
   untested even though now explicitly redeclared) and a dedicated jest-axe check against the new
   multi-`<mark>` `query` output (the original a11y test only ever exercised the single-`<mark>`
   path). 19/19 passing (up from 6).

7. **Feature-completeness — real gap, discussed and closed at explicit direction (not silently
   added):** some comparable libraries' own `Highlight` component finds and wraps a `query`
   substring (or array of substrings) inside `children` itself, case-insensitive by default — DBM's
   `Highlight` previously
   required the caller to pre-split and pre-wrap the match themselves, an intentional, JSDoc'd scope
   boundary ("this is the styled span, not a text-matching utility"). Flagged as a named, concrete
   comparable-library gap per the guardrail in `06-engineering-standards.md` §9; the user chose to
   close it rather than keep the narrower scope. Implemented as a new `query`/`caseSensitive` prop
   pair on the existing component (not a separate component) — see `Highlight.tsx`:
   - `query?: string | string[]` — when provided alongside a plain-string `children`, the string is
     split around every match (regex-special characters escaped) and each match is wrapped in the
     same tone-styled `<mark>` the manual mode already renders; non-matching text renders as plain
     text nodes, no wrapper element.
   - `caseSensitive?: boolean` (default `false`) — matches the common case-insensitive default.
   - A `query` with zero matches renders no `<mark>` at all (only real matches get highlighted, not
     a fallback wrap) — a deliberate behavior, not an edge case oversight, documented in the prop's
     own JSDoc and the Docs page's Best practices section.
   - **`query` combined with non-string `children` is an invalid combination that fails loud in
     development**, per `06-engineering-standards.md` §3 — a `console.warn` (guarded with the
     project's standard `hasWarnedRef`-once pattern, matching `AspectRatio`/`Checkbox`/`Collapse`'s
     own established shape) fires once, and the component falls back to highlighting the whole of
     `children` as one `<mark>` rather than silently doing nothing.
   - **Ref-forwarding, a new sub-case of the existing "no single root DOM node" exception
     (`05-component-api-conventions.md` §3, previously only an unconditional Tooltip/ClientOnly-style
     always-absent ref):** since `query` can produce zero, one, or many `<mark>` elements, `ref` is
     attached only when there's exactly one match — not left unconditionally undefined, and not
     pointed at an arbitrary one of several. Documented in the component's own JSDoc and in `05`'s
     own convention entry (this is the first component to need the *conditional* variant of that
     exception, so the standing doc was updated to cover it generically for any future component in
     the same shape, not just Highlight).
   - `id`/`data-testid` have the same "only meaningful with exactly one match" caveat as `ref` — both
     still typecheck and pass through when `query` matches more than once, but would be duplicated
     across every generated `<mark>`; documented as a "don't pair the two" caveat rather than
     type-blocked, consistent with how this system generally documents rather than statically
     forbids caller-side misuse it can't fully prevent.

8. **Longest-match-first ordering fixed, found during the final re-verification pass (2026-09-07,
   same day).** `splitOnQuery`'s regex alternation tried `query` array entries in the order given,
   not by length — a shorter entry listed before a longer one that contains it (e.g.
   `query={["design", "designer"]}`) matched the shorter substring first and fragmented the longer
   word (`"designer"` → `"design"` + stray `"er"` left unhighlighted) instead of matching it whole.
   Fixed by sorting a copy of the query list by descending length before building the alternation,
   so the longest applicable match always wins. Regression test added
   (`"prefers the longest match when one query is a prefix of another"`); the fix doesn't change
   behavior for any query set with no such prefix relationship (every existing test/story still
   passes unchanged).

9. **Docs page added** (`Highlight.mdx`), full 10-section template, first in the sidebar group.
   Live-verified: TOC renders all 10 section headings, Properties table renders all 8 props in the
   declared order with non-empty descriptions and correct value-option pills (including the `tone`
   fix from finding 5), all 6 story canvases render real content (including the two new
   auto-matching demos), both `RelatedCard`s (`Text`, `Badge` — `Badge` linked via its own
   `--playground` story since it has no `--default` story and already has its own Docs page,
   matching the established "link to a real existing story" pattern from `Blockquote.mdx`/
   `Code.mdx`) render live previews with correct links, zero console errors, both brand themes ×
   both modes confirmed (tone tokens are brand-agnostic per `03-token-system-spec.md`, so appearance
   is identical Purple vs. Emerald — confirmed via `dataset.theme` rather than assumed).

## Verification

`tsc --noEmit` (main + `.storybook`), `eslint . --max-warnings 0` (whole package), full `vitest`
unit suite (999/999 passing across the whole package, 20/20 for `Highlight` itself), `tsup` build,
`check-foundations-token-coverage` (no new tokens — Highlight reuses Badge's already-verified
tone-subtle pairings, still in sync), and `check-component-bundle-size` (0.81KB JS / 0.16KB CSS
gzipped — comfortably within budget) all run and passing. Live-verified in Storybook: the
`Default`-story radio-control bug (finding 1) and the `tone` value-options bug (finding 5) were
both reproduced live before fixing and re-verified live after; the Playground's `tone` and `query`
controls were exercised live (toggling `tone` visibly recolors the canvas, editing `query` visibly
re-highlights a different match); both new `query`-mode stories (`Auto-matching`, `Multiple
queries`) render correctly, including at mobile viewport width; all four tones spot-checked live
across both brand themes × both modes (Purple/Light and Emerald/Dark), confirmed brand-agnostic as
expected; Docs page verified end to end per the checklist in
`07-storybook-and-documentation-standards.md` §4.1, zero console errors. A dedicated final
re-verification pass (2026-09-07, same day as the original review) re-read every file fresh and
found the longest-match-first ordering gap (finding 8) — fixed, tested, and re-verified live before
this file was updated.

## Finalized

**2026-09-07** — confirmed by the user after the full checklist was verified end to end, including
a dedicated final re-verification pass that found and fixed one more real bug (finding 8,
longest-match-first ordering) before sign-off: baseline correctness, feature-completeness (the
`query` auto-matching gap named and closed at explicit direction), accessibility
(jest-axe zero violations, including the new multi-mark output), responsiveness (mobile viewport
spot-checked), design quality, theming (both brand themes × both modes, confirmed brand-agnostic as
expected), Storybook documentation (Docs page, Properties table, Design Tokens table all
consistent, zero console errors), and functional verification (`tsc`, `eslint`, full 999-test
suite, `tsup` build, bundle-size and foundations-token-coverage checks all clean). No further
changes without asking first, per `06-engineering-standards.md` §9's finalization rule.

## Post-review fix: `tone`/`caseSensitive` missing from 4 stories' inert-control overrides (2026-09-09)

Part of a cross-component sweep (originating from `Portal`'s own review, see
`guidelines/component-reviews/Portal.md`) for stories whose fixed `render` ignores `args` but whose
Controls panel still shows live-looking toggles doing nothing (`07-storybook-and-documentation-
standards.md` §5's own convention). `AllTones` dashed `children`/`query`/`tone` but missed
`caseSensitive`; `SearchMatch`/`AutoMatching`/`MultipleQueries` dashed only `children`/`query`,
missing both `tone` and `caseSensitive` — all four props are live at the meta level and all four
were equally ignored by each story's own zero-arg `render`. Fixed by adding the missing keys to
each story's `argTypes`. `Default` was checked and correctly left alone — it has no custom `render`
(uses the default args-spread render), so `tone`/`caseSensitive` genuinely stay live there. Pure
Storybook-metadata fix, no runtime code touched. Full suite re-run clean.
