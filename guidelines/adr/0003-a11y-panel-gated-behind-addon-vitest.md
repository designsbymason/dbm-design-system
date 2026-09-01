# 0003 — Storybook's Accessibility addon panel requires `@storybook/addon-vitest`, not just `@storybook/addon-a11y`

**Status:** Accepted · **Date:** 2026-08-16

## Context
`@storybook/addon-a11y`'s panel sat permanently on "Preparing accessibility scan" across every story in this project's Storybook, found during Skeleton's finalization review. Root-caused rather than just observed: `window.__STORYBOOK_ADDONS_CHANNEL__` confirmed the story-render lifecycle fired correctly, but none of the addon's own protocol events (`storybook/a11y/request`/`running`/`result`/`error`) ever fired — reproduced identically on Skeleton and the already-finalized Badge, so it wasn't component-specific. The actual cause: in this Storybook version, the panel's automatic scan is gated behind Storybook's **Component Tests** integration (`@storybook/addon-vitest`), which had never been installed.

## Decision
Add `@storybook/addon-vitest` (Vitest browser mode, `@vitest/browser-playwright` provider, reusing the already-approved Playwright install) as a dev dependency, wired as a second Vitest project alongside the existing jsdom `unit` project.

## Alternatives considered
None with real standing — this isn't a preference between competing tools, it's the one mechanism Storybook's own architecture requires for the a11y panel to function in this version. The only other option was leaving the panel permanently non-functional, which isn't acceptable given `CLAUDE.md`'s accessibility floor.

## Consequences
- The panel now shows real scan results — confirmed both ways, live: "No accessibility violations found" on a clean story, a real "Color contrast — Serious" violation on one that has one.
- **Requires a live process to report to** — registering the addon alone isn't sufficient. `pnpm test:storybook:watch` must run alongside `pnpm storybook` for the panel/live sidebar indicators to have anything to report.
- `pnpm test:storybook` (one-shot) is what CI actually runs, and is now a required CI step (`browser-tests` job).
- Runs every story's `play` function as a real Vitest test in an actual Chromium instance — a second, incidental benefit: play-function interactions previously only ran when a human manually opened a story's Interactions tab, with no CI signal if one broke.
- Adding it immediately surfaced 5 pre-existing findings across already-shipped components (3 already-accepted disabled-state contrast exemptions, plus 2 real bugs) — the tool working correctly, not a wiring bug. All 5 are since resolved (Button's and Textarea's own review passes fixed their findings; Center's incidental hydration bug was fixed in passing). No longer tracked anywhere as open.

## Related
`02-tech-stack-and-structure.md`'s "Component/story testing" row — full setup detail, two commands, the deliberate non-inheritance of `src/test/setup.ts` in the browser-mode project.
