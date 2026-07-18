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
7. **Premium execution.** Modern visual language, considered micro-interactions and motion, and API ergonomics that feel deliberate rather than default-generated.
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
3. **Guidance over restriction.** Components should be composable and unopinionated about content, similar in spirit to Astryx's "guidance over enforcement" philosophy — the system provides capability and strong defaults, not walls.
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

---

## 11. Success metrics (post-launch)

- npm weekly downloads / installs (adoption signal)
- Number of AI-agent-driven builds successfully using the manifest without human API corrections
- Lighthouse/axe accessibility score across Storybook-documented components
- Bundle size per component (tracked in CI, regression-alerted)
- Time-to-first-component for a new consumer (developer or agent) integrating the package

---

## 12. Risks & open questions

- **Scope risk:** "web, mobile, and enterprise, complete and comprehensive" is a large surface area for a from-zero build — v1 scope has been deliberately narrowed to web + enterprise to manage this; mobile is a defined future phase, not an abandoned goal.
- **OKLCH re-derivation pending:** current token color scales were generated with HSL math for planning speed; should be re-derived in OKLCH for perceptual evenness before final lock (`03-token-system-spec.md`).
- **AA vs. AAA compliance target:** currently targeting AA as the floor; not yet decided whether specific high-stakes components (forms, alerts) should be held to AAA.
- **Third brand theme:** architecture supports it, no concrete second/third brand requirement exists yet — revisit when one does.
- **Public Storybook/docs hosting timeline:** deferred, but worth revisiting once the component set stabilizes so momentum isn't lost.
- **Tokens package publish packaging:** `packages/tokens` currently ships raw TypeScript from `build/ts/` via `main`/`module`/`types`, unlike the tsup-compiled JS+d.ts the other four packages use. Open until `packages/components` first consumes it (Phase 3+) or npm publish (Phase 6) forces a decision.
- **Motion easing TS format:** TS constants currently export motion easing as CSS `cubic-bezier()` strings (matching the CSS output), but the Motion library typically wants raw `[x1,y1,x2,y2]` arrays for its `easing` prop. Open until Motion integration actually happens.

---

## 13. Roadmap phases (high-level)

- **Phase 1 — Foundation (current):** vision, tech stack, token system, component inventory, repo scaffolding
- **Phase 2 — Core build:** primitives layer, atoms, molecules, initial organisms; Storybook coverage; testing pipeline
- **Phase 3 — Completion:** remaining organisms/templates, full manifest generation, npm publish pipeline
- **Phase 4 — Surface expansion:** documentation website, public Storybook hosting
- **Phase 5 — Agent tooling:** CLI scaffolder, MCP server, and an auto-synced component index written into `CLAUDE.md`/`AGENTS.md` on every release (mirroring Astryx's `npx astryx init` pattern) — once API is proven stable
- **Phase 6 — Platform expansion:** Figma component library; React Native package

---

## 14. Related documents
- `02-tech-stack-and-structure.md` — full technical stack and monorepo layout
- `03-token-system-spec.md` — complete token architecture and values
- `04-component-inventory.md` — component list and atomic-design tiering (next to be written)
