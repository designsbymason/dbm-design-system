# DBM Design System — Vision & Goals

**Project brief · Status: v1 draft**

---

## 1. Executive summary

DBM Design System is a standalone, dependency-light React component library built from first principles for the age of AI-assisted development. It is designed to be equally usable by human engineers and AI coding agents (like Claude Code) to build web and enterprise applications quickly, consistently, and accessibly. It will ship as a versioned npm package, backed by a token-driven multi-brand theming system, a Storybook workshop, and — later — a documentation website and a companion Figma component library derived from the same design tokens.

The system is built and maintained using Claude Code, and its own component APIs, documentation, and metadata are being designed to be legible to AI agents from day one, not retrofitted for it later.

---

## 2. Problem statement

Most design systems were built for a world where a human developer reads documentation, copies a code example, and hand-wires props together. That workflow is changing: AI coding agents are increasingly the ones assembling UI, and they work best against APIs that are consistent, strongly typed, well-documented, and predictable — not against tribal knowledge, inconsistent prop naming, or documentation that assumes a human is scanning a rendered webpage.

At the same time, most existing design systems fall into one of two traps:
- **Heavy, opinionated, single-brand systems** (Material, Carbon, Fluent) that fight you the moment your product needs to look like *your* product, not the system's.
- **Unopinionated copy-paste collections** (shadcn/ui-style) that give freedom but no shared upgrade path, no cross-project consistency, and leave accessibility and correctness as each team's individual problem.

DBM Design System exists to avoid both traps: a real, versioned, installable package — not copy-paste — but built dependency-light and token-driven enough that it can carry multiple brands and themes without becoming someone else's product.

---

## 3. Vision statement

**A modern, premium, fully accessible React design system — built on rigorous design tokens, agent-legible by design, and light enough on dependencies to be trusted as the foundation of any web or enterprise product.**

---

## 4. Goals & objectives

### Primary goals
1. **Agent-usable from day one.** Every component ships with complete TypeScript types and JSDoc sufficient to feed an auto-generated, machine-readable component manifest — giving AI agents a structured, authoritative contract instead of requiring them to infer behavior from scraped docs.
2. **Standalone and dependency-light.** Minimize what consumers are forced to install. Every dependency taken on (currently: Radix UI Primitives, optionally Motion) is a deliberate, justified exception, not a default.
3. **Free/open-source tooling throughout.** No paid SaaS anywhere in the build, test, or hosting pipeline — the system should be buildable and maintainable by anyone without a procurement conversation.
4. **Token-driven, multi-brand, multi-mode.** A rigorous 3-layer token architecture (primitive → semantic → component) that supports multiple brand themes and light/dark modes without touching component code.
5. **Accessible by default, not by retrofit.** WCAG AA as the enforced floor on every component — contrast, keyboard navigation, focus handling, ARIA semantics — verified, not assumed.
6. **Comprehensive and scalable.** A component set complete enough to build real products without leaving gaps that force teams back to one-off custom components; an architecture that scales in component count without architectural rework.
7. **Premium, feature-rich, and unique.** Modern visual language, considered micro-interactions and motion, and API ergonomics that feel deliberate rather than default-generated. Components should be comprehensive enough to match or exceed mature design systems' feature sets for the same role, while staying visually and behaviorally identifiable as DBM's own rather than a generic primitive-library default. Operationalized as a formal review process — see `06-engineering-standards.md` §9.
8. **Cross-platform-ready foundation.** v1 targets web + enterprise on shared primitives; the token layer is structured so a future React Native package can consume the same source of truth without a redesign.

### Success criteria (what "done" looks like for v1)
- Component library installable via npm with zero required runtime dependencies beyond React and Radix primitives.
- Full token set (primitive + semantic) covering color, typography, spacing, radius, shadow, motion, breakpoints — with both v1 brand themes (Purple, Emerald) in light and dark mode, contrast-verified.
- A defined, documented component inventory covering atoms through organisms sufficient to build a real web/enterprise application end to end (forms, navigation, data display, feedback, overlays).
- Storybook instance covering every component, with accessibility and interaction tests passing in CI.
- Auto-generated component manifest accurately reflecting every published component's API.
- Published, versioned npm package with a working semver/changelog release pipeline.

---

## 5. Who this is for

- **AI coding agents** (Claude Code, and other agentic tooling) assembling UI on behalf of a developer — the primary novel audience this system is designed around.
- **Product/engineering teams** building web applications who want a real, installable, upgrade-path-having design system rather than a component pile.
- **Enterprise/internal-tooling teams** who need data-dense components (tables, forms, filters) alongside consumer-facing polish.
- **(Future) Designers**, once the companion Figma library exists, working from the same token source as engineering.

---

## 6. Scope

### In scope for v1
- React component library (web + enterprise, shared primitives)
- Full design token system: primitive + semantic layers, 2 brand themes × light/dark
- Phosphor Icons integration
- Storybook workshop (local; public hosting is a stretch goal for v1, not a hard requirement)
- Component-level accessibility and unit testing
- Auto-generated JSON component manifest (agent-readable API contract)
- npm publishing pipeline (Changesets-based)

### Explicitly deferred (not forgotten — sequenced later)
- **CLI scaffolder / MCP server** for agent tooling — deferred until the component API is stable; building agent tooling against a shifting API means rebuilding it repeatedly
- **React Native / mobile components** — token layer is built to support this later; actual mobile primitives are a separate future package
- **Documentation website** — built once the core library and Storybook are stable
- **Public-hosted Storybook** — same dependency
- **Figma component library** — built from the same token source once tokens are fully finalized, so Figma variables mirror the CSS custom properties 1:1
- **Component-layer tokens** — added incrementally as specific components need overrides, not pre-populated speculatively
- **3rd+ brand theme** — architecture supports it; not built until a concrete need exists

### Out of scope (not currently planned)
- Non-React framework support (Vue, Svelte, Angular components)
- A visual theme-builder tool (may be reconsidered post-v1)

---

## 7. Competitive landscape

**Astryx (Meta)** — released in Beta in June 2026 — is the closest existing system to what DBM is attempting: React-based, dependency-light by design, AI-agent-oriented (ships a CLI, MCP server, and JSON manifest for structured agent access), with 90–150+ components drawn from eight years of internal use across 13,000+ Meta products.

DBM's points of differentiation from Astryx:
- **Styling approach:** Astryx is built on StyleX (Meta's compile-time CSS-in-JS, requiring a bundler plugin); DBM uses CSS Custom Properties + CSS Modules for a true zero-build-step-requirement on the consumer side.
- **Multi-brand theming as a first-class goal from v1**, rather than Astryx's broader 10-theme internal-tooling flavor.
- **Explicit free/OSS-only tooling constraint** across the entire build/test/hosting pipeline.
- **Deliberately sequenced agent tooling** — DBM ships strong types/JSDoc/manifest first and defers CLI/MCP server until the API is proven stable, rather than shipping full agent tooling at initial launch.
- **Planned Figma library derived from the same token source**, tightening the design-to-code loop.

Astryx is worth continued reference (not imitation) as a live proof-of-concept that agent-oriented, dependency-conscious design systems are viable at scale.

---

## 8. Design principles

1. **Tokens are law.** No hardcoded values in component code — ever. If a value is needed and no token exists, the token gets created first.
2. **Semantic over primitive, always.** Components never reference raw color/spacing values directly — only semantic tokens. This is what makes theming free.
3. **Guidance over restriction.** Components should be composable and unopinionated about content — the system provides capability and strong defaults, not walls, so a consumer (human or agent) can reach for the right building block without fighting the API to get an unusual-but-valid layout.
4. **Accessible is not a variant.** There is no "accessible mode" — every component is accessible by default, verified, not assumed.
5. **Motion with restraint.** Micro-interactions should clarify state changes and feel premium, not decorate for their own sake. CSS transitions handle the simple cases; Motion is reserved for genuinely complex sequences.
6. **Documented as-built, not after-the-fact.** JSDoc and prop documentation are part of the definition of "done" for a component, not a follow-up task.
7. **Agent-legible is a design constraint, not a feature flag.** Prop names, types, and component composition patterns should be predictable and consistent enough that an agent can infer correct usage from the API shape alone.

---

## 9. Guiding constraints

- **Dependency budget:** every dependency must be justified against the "no/limited dependencies" goal. Current approved exceptions: Radix UI Primitives (accessibility/interaction logic), Motion (optional peer dependency).
- **Free/open-source only:** no paid SaaS anywhere in the build, test, or hosting pipeline.
- **Accessibility floor:** WCAG AA, verified via automated testing (axe) and manual contrast checks — not assumed from "looks fine."
- **Performance:** tree-shakeable exports, minimal bundle footprint per component, no unnecessary runtime CSS-in-JS cost.
- **Framework target:** React 18+, built with an eye toward React Server Component compatibility where a component doesn't require interactivity.

---

## 10. Key decisions log

A running record of foundational decisions, cross-referenced to the detailed docs that contain the full rationale.

| Decision | Chosen | Detail |
|---|---|---|
| Monorepo tooling | Turborepo + pnpm workspaces | `02-tech-stack-and-structure.md` |
| Styling architecture | CSS Custom Properties + CSS Modules (no CSS-in-JS runtime) | `02-tech-stack-and-structure.md` |
| Accessibility primitives | Radix UI Primitives | `02-tech-stack-and-structure.md` |
| Motion library | Motion (optional peer dependency) | `02-tech-stack-and-structure.md` |
| Icons | Phosphor Icons | Original project notes |
| Token architecture | 3-layer: primitive → semantic → component | `03-token-system-spec.md` |
| v1 brand themes | Purple (`#5548A4`) + Emerald (`#2E8A7D`), each × light/dark | `03-token-system-spec.md` |
| Typography | Nunito (primary/UI), Lora (secondary/editorial), fluid clamp()-based scaling | `03-token-system-spec.md` |
| Spacing base unit | 4px | `03-token-system-spec.md` |
| Corner radius style | Soft/rounded (6–24px range) | `03-token-system-spec.md` |
| Elevation style | Soft layered shadows, distinct light/dark values | `03-token-system-spec.md` |
| Neutral gray undertone | Cool, subtly purple-tinted | `03-token-system-spec.md` |
| v1 platform scope | Web + Enterprise, shared primitives | This document |
| Agent tooling scope for v1 | Types + JSDoc + manifest only; CLI/MCP deferred | This document |
| npm scope | `@dbm-design-system/*` (e.g. `@dbm-design-system/components`, `.../tokens`, `.../icons`, `.../primitives`) | This document — verify final availability with `npm org ls` before first publish |
| License | MIT | This document |
| Repo visibility & governance | Public GitHub repo; MIT license; sole maintainer — no external pull requests merged; write access controlled via the Collaborators list (empty), not by visibility | This document |
| Color-scale generation tooling | `culori` (MIT), devDependency scoped to `packages/tokens` only — used solely by the one-off OKLCH scale generation script, never shipped in any published package. Distinct from the "dependency budget" above, which governs runtime dependencies of `@dbm-design-system/components` | `03-token-system-spec.md` |

---

## 11. Success metrics (post-launch)

- npm weekly downloads / installs (adoption signal)
- Number of AI-agent-driven builds successfully using the manifest without human API corrections
- Lighthouse/axe accessibility score across Storybook-documented components
- Bundle size per component (tracked in CI, regression-alerted)
- Time-to-first-component for a new consumer (developer or agent) integrating the package

---

## 12. Risks & open questions

- **AA vs. AAA compliance target:** AA is the enforced floor everywhere; AAA is a target, not a requirement, for error/critical-alert text only. See `guidelines/adr/0002`. Still genuinely open: verifying error-text pairings *as `Alert`/`Form` will actually use them* — neither component exists yet.
- **Public Storybook/docs hosting timeline:** deferred, but worth revisiting once the component set stabilizes so momentum isn't lost.
- **Storybook's docgen vs. the planned manifest generator (open, flagged 2026-08-12):** Storybook defaults to `react-docgen` (regex/Babel-based prop extraction), not the TS-checker-based `react-docgen-typescript` this doc's tech stack (`02-tech-stack-and-structure.md`) names for `packages/manifest`'s own Phase 8 build step. `05-component-api-conventions.md` §3 already documents `react-docgen` unreliably dropping inherited native props from Storybook's own Properties table (worked around per-component by hand-redeclaring them). Whether `packages/manifest` ends up consuming Storybook's docgen output directly or does its own independent `react-docgen-typescript` extraction hasn't been decided — worth deciding before Phase 8 starts, not discovering the same gap again mid-phase.
- **Storybook's Accessibility addon panel requires `@storybook/addon-vitest`, not just `@storybook/addon-a11y`:** see `guidelines/adr/0003` for why and what it depends on operationally (`pnpm test:storybook:watch` must run alongside `pnpm storybook`).

---

## 13. Roadmap phases (high-level)

Renumbered 2026-07-18 to match the phases actually run (the original version bundled vision/tech-stack/tokens/inventory/scaffolding into one "Phase 1," but in execution the token pipeline and the atom layer each turned out to be their own full session/phase). Vision, tech stack, token spec, and component inventory (`01`-`04`, this doc included) predate Phase 1 as planning input, not a phase of their own.

- **Phase 1 — Repo scaffold & tooling (done):** monorepo structure, Turborepo/pnpm, shared configs, CI, security setup
- **Phase 2 — Design token pipeline (done):** Style Dictionary build producing CSS custom properties + typed TS constants from the primitive/semantic token JSON
- **Phase 3 — Foundational atom layer (done):** utility primitives, layout primitives, typography, core atoms (23 components); Storybook 10 setup; Vitest/RTL/jest-axe test infra
- **Phase 4 — OKLCH color re-derivation (done):** re-derived the primitive color scales in OKLCH for perceptual evenness; re-verified every contrast pairing checked in `03-token-system-spec.md`'s running log against the new values
- **Phase 4.5 — Atom component review & enhancement pass (done):** systematic, one-at-a-time pass over all 23 Phase 3 atoms against the two-track rubric in `06-engineering-standards.md` §9 — an objective checklist re-verification (props, tokens, a11y, responsiveness, stability) plus a design-quality pass (feature-completeness, micro-interactions, premium/unique visual execution). Run before Phase 5 so molecules aren't built on top of atom-level gaps that would then need fixing in every downstream consumer.
- **Phase 4.75 — Comprehensive atom completion (done, 2026-07-26):** built every atom-tier component already tracked in `04-component-inventory.md` but not yet shipped after Phase 4.5 (21 components: Textarea, Checkbox, Switch, FieldLabel, FieldError, FieldHelperText, Tag, Spinner, ProgressBar, Tooltip, Collapse, Image, AspectRatio, Center, Code, Blockquote, ProgressCircle, ClientOnly, Kbd, BackToTop, Bleed), plus 5 new atoms added to the inventory for this pass (CloseButton, Backdrop, Affix, Highlight, Indicators — see `04-component-inventory.md`'s rough-count table, updated 99→104). Takes the atom tier from 23 to 47 components (corrected 2026-08-12 — every prior mention of "49" here and in `04-component-inventory.md`/`07-storybook-and-documentation-standards.md` was simply a miscount against the inventory's own table, which lists exactly 47 atom-tier rows; not a sign 2 components went missing), full definition-of-done per component. Along the way: added the `font-family.mono` primitive token (Code/Kbd) and the `bg.overlay` semantic token (Backdrop) — see `03-token-system-spec.md`; added `@radix-ui/react-checkbox`/`-switch`/`-tooltip`/`-collapsible` as dependencies (Checkbox/Switch/Tooltip/Collapse each wrap one); added `ResizeObserver`/`IntersectionObserver` stubs to the shared Vitest setup, since jsdom implements neither and several Radix primitives (and `Affix`'s stuck-detection) need them. Run before Phase 5 for the same reason as Phase 4.5: molecules compose these atoms directly.
- **Phase 4.9 — Storybook & documentation refinement pass (in progress, started 2026-07-26; behind where "in progress" implies, audited 2026-08-12, updated 2026-08-23):** systematic, one-at-a-time pass over all 47 atoms verifying feature-completeness/props/tokens plus a full Storybook overhaul per component — a hand-authored comprehensive Docs page, a fully-interactive Playground story, `play`-function interaction tests, and a corrected sidebar taxonomy. Plan, Docs-page template, and the full processing order are tracked in `07-storybook-and-documentation-standards.md` so the pass survives a context reset. **Real progress as of 2026-08-23: 9 of 47 atoms have a Docs page (Box, Button, Avatar, Badge, Skeleton, Tag, ProgressBar, ProgressCircle, Spinner)** — even Phase A's own remaining template-proving items (Input, Icon, Text) haven't been started yet, let alone any category after it (Avatar's, Skeleton's, Tag's, ProgressBar's, ProgressCircle's, and Spinner's own Docs pages were all completed out of the planned queue order — see each component's own entry in `07-storybook-and-documentation-standards.md` for what that work covered). The intent was to run this before Phase 5 so the documentation standard was proven on the full atom tier first; in practice, work shifted onto Storybook infrastructure/CI hardening (see the new entry below) and then onto Phase 5 before this pass got past its first two components — flagging the sequencing gap here rather than leaving the doc read as if steady per-atom progress has been happening. **Updated 2026-08-27: 12 of 47 (Checkbox, IconButton, and CloseButton landed since).** **Updated 2026-08-29: 15 of 47 (FieldError, FieldHelperText, and FieldLabel landed since — completing the FieldLabel/FieldHelperText/FieldError trio; 14 of the 15 are also Finalized). This is the last time this count gets restated here** — see `07-storybook-and-documentation-standards.md`'s own tracked count for the current, authoritative status going forward, per that file's own note on this same line.
- **Phase 4.9b — Storybook infrastructure & CI hardening (done, 2026-08-11–2026-08-12, unplanned/inserted):** not part of the original phase numbering — grouped here because it happened in the same working window as Phase 4.9 and is Storybook-tooling-scoped rather than component-scoped. Covers: fixing the mobile-drawer Settings popover (was silently navigating away instead of opening a menu) and Close-button position; updating the sidebar brand logo and its padding; `pnpm audit` + a real `build-storybook` + a bundle-size tripwire added to CI (previously nothing ever built or size-checked the static Storybook output); Storybook telemetry disabled; `.storybook/**` brought under TypeScript for the first time (`.storybook/tsconfig.json`, wired into `lint`), which surfaced and fixed several real, previously-invisible type bugs; Storybook bumped 10.5.2 → 10.5.7 as the first real exercise of the version-upgrade re-verification checklist. Full detail: `07-storybook-and-documentation-standards.md` §§9–10.
- **Phase 5 — Molecules (started 2026-08-09 — earlier than planned):** `Grid`, `GridItem`, `Select` are built. This got ahead of the original sequencing (Phase 5 was meant to start only once Phase 4.9 proved the documentation standard on the full atom tier) — noting the actual order here rather than silently leaving the doc read as strictly sequential. Remaining: FormField, Card, SearchBar, Popover, MenuItem, and the rest of the 🟢 v1 molecule tier per `04-component-inventory.md`.
- **Phase 6 — Organisms:** DataTable, Modal, Navbar, CommandPalette, Form, and the rest of the 🟢 v1 organism tier
- **Phase 7 — Comprehensive pass:** remaining 🟡 v1.5 components + templates
- **Phase 8 — Manifest & publish:** full `packages/manifest` JSON component manifest generation; npm publishing pipeline (Changesets-based). See §13.1 for the full required/recommended agent-consumption deliverable list.
- **Phase 9 — Surface expansion:** documentation website, public Storybook hosting
- **Phase 10 — Agent tooling:** CLI scaffolder, MCP server, and an auto-synced component index written into `CLAUDE.md`/`AGENTS.md` on every release — a consuming agent gets an always-current inventory of what's actually shipped instead of guessing or hallucinating a component that doesn't exist. Deferred until the API is proven stable, so agent tooling isn't built against a shifting target. See §13.1 for the full required/recommended agent-consumption deliverable list.
- **Phase 11 — Platform expansion:** Figma component library; React Native package

### 13.1 Agent-consumption deliverables (required vs. recommended)

Reviewed 2026-08-31, following a best-practices/industry-standard pass. Distinct from
`guidelines/` and `CLAUDE.md` themselves, which are internal-only and never published
(confirmed: `packages/components/package.json`'s `"files"` field is `["dist"]` only) —
this list is what a *consuming* agent (one building an app with this package, not
contributing to it) needs, shipped as part of the published package or its docs site.

**Required — already this project's own stated mission (goal #1), not yet built:**

| Artifact | Why | Target phase |
|---|---|---|
| JSON component manifest | The single most load-bearing artifact for programmatic agent use — a structured, typed index of every component's props/variants/constraints, queryable directly instead of parsed from prose. Already primary goal #1 (§4). | Phase 8 (`packages/manifest`, currently empty scaffolding) |
| Per-package `CHANGELOG.md` | Lets an agent doing an upgrade know what broke without diffing source across versions. | Phase 8 (Changesets is configured but not yet wired into CI) |

Already in place, not a gap: comprehensive `.d.ts` declarations (shipped via `tsup`) and
complete JSDoc on every export (`05-component-api-conventions.md` §7) — both keep feeding
the manifest above as more components ship; no new artifact needed, just keep the
discipline going.

**Recommended — real external precedent, not currently planned:**

| Artifact | Precedent | What it adds |
|---|---|---|
| Consumer-facing agent usage guide, shipped in `"files"` (e.g. `AGENTS.md`/`USAGE.md` at the package root) | The `AGENTS.md` convention is spreading across coding-agent tooling as the standard place for agent-facing instructions, distinct from a human-oriented `README.md`. | A condensed, public rewrite of the consumption rules currently internal to `05`/`06` — import patterns, "reference semantic tokens, never hardcode," `as`/`asChild` composability — for someone building *with* the library, not the internal guidelines themselves. |
| `llms.txt` / `llms-full.txt` | Emerging convention (llmstxt.org) for a curated, LLM-optimized index of a docs site. | Most natural once the docs site/hosted Storybook (Phase 9) exists. |
| Structured example/registry format | Machine-readable, queryable example catalog (a pattern several component-distribution tools use). | Bigger lift; sits on top of the manifest, so defer until that ships. |
| MCP server | A structured query interface in front of the manifest, for an agent that wants to ask questions rather than fetch a static file. | Already named in Phase 10; the manifest is its prerequisite either way. |

**Sequencing note:** the manifest is the one item worth prioritizing — everything else
here is more valuable *with* a real manifest behind it than without one.

---

## 14. Related documents
- `02-tech-stack-and-structure.md` — full technical stack and monorepo layout
- `03-token-system-spec.md` — complete token architecture and values
- `04-component-inventory.md` — component list and atomic-design tiering
