# ClientOnly

**Tier:** Atom · **Category:** Utility · **Finalized:** ✅ 2026-09-07

## Review pass (2026-09-07)

Full `06-engineering-standards.md` §9 pass — first review for this component. Findings, in the
order fixed (Playground-missing first, Docs-page-missing last, per the standing reporting
convention):

1. **Playground story added.** `ClientOnly.stories.tsx` previously had only `Default` and
   `WithFallback`, neither args-driven. Now has a full interactive `Playground` with `children`/
   `fallback` wired through `args`/`argTypes` as live text controls (matching `Blockquote`'s own
   precedent for text-content props).

2. **A real, confirmed defect found and fixed: the component's own JSDoc overstated when the
   `fallback` phase is actually observable.** The prior doc comment said `fallback` renders "during
   server rendering and the very first client render" — implying any client render. Verified
   empirically (not assumed) that this is false for a plain client-only render:
   - `render()` (RTL, uses React's `createRoot`) shows `children` synchronously from the very first
     commit — `fallback` never appears at all.
   - A real `hydrateRoot` call against actual server-rendered HTML *does* show `fallback` first,
     swapping to `children` on a later, separate update — confirmed with a real `renderToStaticMarkup`
     → `hydrateRoot` → `waitFor` test, without `act()` (which flushes synchronously and would hide
     the very frame being verified).

   This has real, concrete consequences beyond the doc comment itself:
   - The pre-existing `WithFallback` story could never actually show its own fallback content in
     Storybook (a plain client-only preview) — anyone opening it to see the fallback treatment would
     only ever see `children`. Not a bug in the component itself, but a materially misleading demo.
   - The pre-existing unit test named "renders children after mounting on the client" used
     `findByText` (async, retry-until-found) with no synchronous check beforehand — it would have
     passed identically whether or not a real mount transition existed, so it verified nothing about
     the component's actual two-phase behavior.

   Fixed: `ClientOnly.tsx`'s and `ClientOnly.types.ts`'s doc comments now state the real, verified
   behavior precisely (fallback only during real SSR-hydration; children immediately in a plain
   client-only render). `ClientOnly.test.tsx` now has a dedicated `hydrateRoot`-based test proving
   the real two-phase swap, plus a renamed, accurate version of the old client-render test
   (`"renders children immediately in a plain client-only render, never showing fallback"`) that now
   makes a real synchronous assertion instead of an async one that couldn't fail either way. 5/5
   tests passing (up from 4).

3. **`fallback`'s Storybook control kept live rather than disabled, with an explicit `Callout`
   explaining why editing it never changes the canvas.** This is deliberately *not* the "control
   does nothing because of an implementation bug" failure mode `07-storybook-and-documentation-
   standards.md` §5 warns about (the Avatar `as`/`colorful` incident) — the arg is genuinely wired
   to the real prop; it's an inherent property of previewing a hydration-only effect inside a
   client-only tool, not a wiring defect. Documented in the story file's own `argTypes.fallback.
   description`, and explained at length in the Docs page's Playground section and Code examples.

4. **`fallback`'s Properties-table Default column fixed.** Docgen didn't surface the real
   destructuring default (`fallback = null`) automatically; added an explicit
   `table: { defaultValue: { summary: "null" } }` to its `argTypes` entry, the same fix pattern
   already established on `Tooltip`. Confirmed live — was rendering "—", now renders `null`.

5. **Feature-completeness:** compared against comparable production implementations of this same
   "hydration-safe mount guard" pattern — `children` + `fallback` is the complete, expected surface
   for this narrow single-purpose utility; no concrete gap found (a public hook export was
   considered and deliberately not added, since nothing in this system's own usage calls for it yet
   — adding one speculatively would be exactly the scope creep `06-engineering-standards.md` §9's
   guardrail warns against).

6. **Explicit escape hatches confirmed absent, correctly.** Unlike almost every other component in
   this system, `ClientOnly` takes no `className`/`style`/`id`/`data-testid` and extends no native
   element's props at all — verified this is correct, not an oversight: it renders no DOM element of
   its own (`children`/`fallback` render directly via a bare fragment), so there's nothing to attach
   any of those to. This is also the existing, already-correctly-documented justification for taking
   no `ref` — `ClientOnly` is one of the two components `05-component-api-conventions.md` §3 already
   cites by name for that exception. No `.module.css` either, matching the same established pattern
   already used by `Portal`/`FocusTrap` for "no visual chrome of its own."

7. **Docs page added** (`ClientOnly.mdx`) — the first Docs page in the Utility category, full
   10-section template, first in the sidebar group. The Properties-section "accepts any other native
   attribute" disclaimer sentence (§4 item 3) is adapted rather than used verbatim, since it doesn't
   apply here: the page instead states plainly that `ClientOnly` accepts no other props at all, and
   why. Live-verified: TOC renders all 10 section headings, Properties table renders both props with
   the corrected `null` default, the Playground's `children` control genuinely drives the canvas
   (typed a new string, canvas updated), the `fallback` control edits without visibly changing
   anything (as documented), both story canvases render real content, both `RelatedCard`s (`Skeleton`,
   `Image`) render live previews with correct links, zero console errors, addon-a11y reports zero
   violations on `Default`, both brand themes and both color modes confirmed (Purple/Emerald ×
   Light/Dark) with no visual breakage in the shared docs chrome, Callouts, code blocks, or
   RelatedCard swatches — `ClientOnly` itself has no tokens of its own to vary by theme.

## Verification

`tsc --noEmit` (main package build via `tsup`'s `.d.ts` generation, and `.storybook`), `eslint`
(whole package, zero warnings), full `vitest` unit suite (1051/1051 passing across the whole
package, 5/5 for `ClientOnly` itself, up from 4), `tsup` build, and the `@storybook/addon-vitest`
Storybook test project (`pnpm test:storybook`, 366/366 across all 50 component story files,
including `ClientOnly`'s own) all run and passing. Live-verified in a running Storybook instance:
the Docs page's Playground/Properties/Variants/Usage/Best practices/Accessibility/Code
examples/Design tokens/Related components sections all render correctly (screenshots taken at each
section); the `Default` story's Accessibility panel reports "No accessibility violations found";
the real `hydrateRoot`-based swap (fallback → children) was reproduced directly in a throwaway test
before writing the permanent regression test, confirming the finding wasn't assumed.

No prior `component-reviews/` entry existed for this component (first pass).

## Finalized

**2026-09-07** — confirmed by the user after the full review pass above: baseline correctness
(including the corrected JSDoc and the real `hydrateRoot`-based regression test), feature-
completeness (compared against comparable "hydration guard" implementations, no gap to close;
a public `useHasMounted` export was considered and deliberately not added), accessibility (zero
`jest-axe`/addon-a11y violations), theming (confirmed brand-agnostic — the component itself has no
tokens, and the shared Docs chrome/Callouts/RelatedCards were spot-checked across both brands and
both modes with no breakage), and functional verification (`tsc`, `eslint`, full 1051-test suite,
`tsup` build, and the `addon-vitest` Storybook test project all clean) were all verified end to end
before sign-off. No further changes without asking first, per `06-engineering-standards.md` §9's
finalization rule.

## Post-finalization fix (2026-09-12, authorized)

`ClientOnly.stories.tsx`'s `Playground` story passed `<Text tone="secondary">` for the fallback
render — `Text` has no `tone` prop (the real prop is `color`, with `TextColor` including
`"secondary"`); a genuine `tsc --noEmit` type error, invisible to this package's own `lint` script
until the tooling gap below was also closed. Surfaced during Grid's own final review pass (an
unrelated component's pre-existing error, flagged not fixed there), authorized here. Fixed by
changing `tone` to `color`. Re-verified: `tsc --noEmit` clean for this file, full `vitest` storybook
project (375/375) still passing, live-checked in Storybook with no console errors. Per the
finalization re-check test (§9): a defect fix (an invalid prop that never should have compiled as
intended) — **stays finalized**, no re-review needed.
