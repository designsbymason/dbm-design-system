# Guidelines

Internal reference documents for the DBM Design System. This is where architecture decisions, specs, and standing context live — for Claude Code, other contributors, and future-you.

`CLAUDE.md` at the repo root is the short auto-read entry point; these documents are the detail behind it.

## Contents

| File | Status | Covers |
|---|---|---|
| `01-vision-and-goals.md` | ✅ Done | Original project goals, target use cases (web/enterprise agentic UI generation), what "agentic" and "premium" mean for this system, competitive context (Astryx) |
| `02-tech-stack-and-structure.md` | ✅ Done | Monorepo layout, full tech stack with rationale per tool, free/OSS constraint, Radix + Motion dependency decisions |
| `03-token-system-spec.md` | ✅ Done | 3-layer token architecture (primitive → semantic → component), color/typography/spacing/radius/shadow/motion/breakpoint scales, multi-brand + light/dark theming approach, contrast verification methodology and results |
| `04-component-inventory.md` | ✅ Done | Full component list, atomic-design tiering (atoms/molecules/organisms/templates), v1 scope vs. deferred |
| `05-component-api-conventions.md` | ✅ Done | Prop naming patterns, file structure, compound component pattern, CSS/token conventions, per-component definition of done |
| `06-engineering-standards.md` | ✅ Done | Clean code, scalability, stability/error handling, performance, responsiveness, browser/SSR targets, i18n stance, agent process rules |
| `07-storybook-and-documentation-standards.md` | 🔄 In progress (24 of 47 components have a Docs page as of 2026-09-03; all 24 are Finalized — check §6's own status table for the current, authoritative count rather than trusting this cell to stay current) | Storybook infrastructure (docs/viewport/interaction-test addons), sidebar taxonomy, the per-component Docs-page template, version-upgrade fragility (§9), and CI/build reliability (§10). §6 is now a compact status table only — per-component findings live in `component-reviews/` (below), moved out 2026-08-31 so this doc doesn't grow unbounded as molecules/organisms are added. |
| `adr/` | 🆕 New (2026-08-31, empty — existing decisions get extracted into it during the guidelines retrofit pass, file by file, not written in bulk up front) | Individual immutable Architecture Decision Records — the *why* behind a real fork-in-the-road decision. The numbered docs above point here (`See ADR-0012`) instead of narrating a decision's reasoning inline. See `adr/README.md` for the template, naming convention, and the bar for what qualifies. |
| `component-reviews/` | 🆕 New (2026-08-31, 24 files as of 2026-09-03 — one per component with a completed `06-engineering-standards.md` §9 review pass, migrated out of `07`'s own §6) | Per-component review findings — what was checked, found, and fixed, and Finalized status/date. A living document per component, not immutable like `adr/`. See `component-reviews/README.md` for the conventions. |

## Reading order for new context (human or agent)

1. `01-vision-and-goals.md` — what we're building and why
2. `02-tech-stack-and-structure.md` — what it's built with and how the repo is organized
3. `03-token-system-spec.md` — the design token foundation everything else builds on
4. `04-component-inventory.md` — what components exist/are planned, and where each fits
5. `05-component-api-conventions.md` — how any given component must be written
6. `06-engineering-standards.md` — the code-quality and process discipline behind all of the above
7. `07-storybook-and-documentation-standards.md` — how a component's Storybook docs/showcase must meet the same bar as its code

`adr/` and `component-reviews/` aren't part of this linear reading order — both are lookup folders (the "why" behind a decision, and a specific component's own findings), consulted on demand rather than read start to finish.

## Conventions for this folder
- Numbered prefixes control reading order, not chronology — renumber if a doc's role changes.
- Each doc should be able to stand alone (a reader — human or agent — shouldn't need to hold the whole conversation history that produced it).
- **The numbered docs (`01`–`07`) are a current-state reference, not a changelog.** When a decision they document changes, update the doc in place rather than leaving stale guidance. Two exceptions, different from each other: **`adr/`** — an ADR is never rewritten in place; a changed decision gets a *new* ADR that supersedes the old one (see `adr/README.md`). **`component-reviews/`** — a living document per component (see that folder's own README) that's expected to keep growing as a component's review continues; it's exempt from "current-state only" because per-component history is exactly what it's *for*, scoped tightly enough to stay bounded.
- Source-of-truth *data* (actual token JSON, component manifests) lives in `packages/`, not here — this folder is for decisions and rationale, not build artifacts.
- **This folder is public and permanent.** The repo is public, and git history doesn't forget — once something is committed and pushed here, treat it as visible forever, even if later removed. Never add secrets, credentials, personal identifying information, client/business-sensitive details, or anything not meant for permanent public visibility. If in doubt, leave it out or ask first rather than committing it.
