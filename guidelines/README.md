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
| `07-storybook-and-documentation-standards.md` | 🔄 In progress (19 of 47 components have a Docs page as of 2026-08-31; 18 of those — Button, Avatar, Badge, Skeleton, Tag, ProgressBar, ProgressCircle, Spinner, Checkbox, IconButton, CloseButton, FieldError, FieldHelperText, FieldLabel, Input, Textarea, Switch, Affix — are Finalized, leaving only Box. Every atom-tier Inputs & Forms component now has a Docs page; Affix is the first Layout-tier component to get one. This count will drift again as more land — check that file's own §6 tracking line for the current number rather than trusting this cell to stay current) | Storybook infrastructure (docs/viewport/interaction-test addons), sidebar taxonomy, the per-component Docs-page template, the tracked processing order for the post-Phase-4.75 Storybook refinement pass, version-upgrade fragility (§9), and CI/build reliability (§10) |
| `adr/` | 🆕 New (2026-08-31, empty — existing decisions get extracted into it during the guidelines retrofit pass, file by file, not written in bulk up front) | Individual immutable Architecture Decision Records — the *why* behind a real fork-in-the-road decision. The numbered docs above point here (`See ADR-0012`) instead of narrating a decision's reasoning inline. See `adr/README.md` for the template, naming convention, and the bar for what qualifies. |

## Reading order for new context (human or agent)

1. `01-vision-and-goals.md` — what we're building and why
2. `02-tech-stack-and-structure.md` — what it's built with and how the repo is organized
3. `03-token-system-spec.md` — the design token foundation everything else builds on
4. `04-component-inventory.md` — what components exist/are planned, and where each fits
5. `05-component-api-conventions.md` — how any given component must be written
6. `06-engineering-standards.md` — the code-quality and process discipline behind all of the above
7. `07-storybook-and-documentation-standards.md` — how a component's Storybook docs/showcase must meet the same bar as its code

`adr/` isn't part of this linear reading order — it's a lookup folder, consulted when a "why was this built this way" question comes up, not read start to finish.

## Conventions for this folder
- Numbered prefixes control reading order, not chronology — renumber if a doc's role changes.
- Each doc should be able to stand alone (a reader — human or agent — shouldn't need to hold the whole conversation history that produced it).
- **The numbered docs (`01`–`07`) are a current-state reference, not a changelog.** When a decision they document changes, update the doc in place rather than leaving stale guidance. **`adr/` is the one exception — an ADR is never rewritten in place.** A changed decision gets a *new* ADR that supersedes the old one; see `adr/README.md`.
- Source-of-truth *data* (actual token JSON, component manifests) lives in `packages/`, not here — this folder is for decisions and rationale, not build artifacts.
- **This folder is public and permanent.** The repo is public, and git history doesn't forget — once something is committed and pushed here, treat it as visible forever, even if later removed. Never add secrets, credentials, personal identifying information, client/business-sensitive details, or anything not meant for permanent public visibility. If in doubt, leave it out or ask first rather than committing it.
