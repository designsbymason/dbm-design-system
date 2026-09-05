# Spinner — Storybook/component review findings

*(Migrated from `07-storybook-and-documentation-standards.md` §6 during the guidelines retrofit pass, 2026-08-31 — this file's own content is unchanged from what was there, just relocated. See `07`'s own status table for this component's current Docs-page/Finalized status.)*

Spinner — ✅ done (2026-08-23 — `06-engineering-standards.md` §9 review, worked one finding at a time: Playground story added (was missing entirely — only `Default`/`AllSizes`/`AllTones`/`Labeled` existed, none with a full interactive prop set); `AllSizes`/`AllTones` stories' `render` functions fixed to accept and spread `args` (the same dead-Controls-panel bug already found and fixed on `ProgressBar`/`ProgressCircle`/`Tag`/`Badge`); `id`/`className`/`style`/`data-testid` redeclared on `SpinnerProps` for documentation visibility (already worked via native `<span>` inheritance). While writing this component's own Docs page (`Spinner.mdx`), a real bug was found and fixed, at explicit direction: `Spinner.tsx` spread `{...props}` *after* its own computed `role`/`aria-label`/`aria-hidden`/`className`, the opposite order from every other reviewed component — meaning a same-named consumer prop could silently override the computed accessibility state. Reordered to match the established JSX-attribute-ordering fix (`05-component-api-conventions.md` §3), with a new regression test proving the override is ignored. Two more issues surfaced and fixed while writing the Docs page itself: combining several tokens into one `TokenRow` (e.g. the `on-*` tone family) would have produced an invalid CSS custom-property reference, since `TokenRow` derives its swatch color directly from the token string — split into one row per token instead; and MDX's already-documented backslash-quote-escaping limitation (`07-storybook-and-documentation-standards.md` §4.1) was hit firsthand and fixed by rephrasing rather than escaping. Docs page includes the full Design tokens table for all 14 `IconTone` members (the `on-*`/semantic tones noted as available but intentionally not exposed in the Playground's `tone` select, matching `Icon`'s own precedent), and Related Components reciprocally linking `ProgressBar`, `ProgressCircle`, and `Skeleton`. Full self-verification, whole package: `tsc`, `eslint`, `tsup` build, and both Vitest projects (`unit`: 691/691, `storybook`: 270/270) all clean. **Finalized 2026-08-23** — per that section's own note, don't make further changes to Spinner (code, stories, docs, or its tokens) without asking first.

**Authorized post-finalization change, 2026-09-05.** Added `"white"` as a new `IconTone` member
(same change as `Icon`'s own review file — see there for the full token/naming reasoning), at
explicit direction, found reviewing `Backdrop`'s own `WithContent` story. Wired into `toneClass`
(`Spinner.tsx`) and `.toneWhite` (`Spinner.module.css`); given its own `TokenRow` in `Spinner.mdx`'s
Design tokens section, worded identically to its `on-*` siblings ("not exposed in the Playground's
tone select") — matching this component's own established precedent of keeping the Playground/
`AllTones` gallery scoped to general-purpose tones only (`default`/`secondary`/`brand`/`disabled`),
since `white`, like the `on-*` family, is for specific contextual composition, not general browsing.
Per the three-question test (`06-engineering-standards.md` §9): purely additive — **stays
finalized**. Re-verified live: `Backdrop`'s `WithContent` story now uses `tone="white"` directly
(replacing an earlier manual `style` override) and renders a clearly visible white spinner in both
light and dark mode. `tsc`, `eslint`, full Vitest suite (1281/1281 package-wide), and a real `tsup`
build all clean.
