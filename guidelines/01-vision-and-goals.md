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

- **AA vs. AAA compliance target — decided (2026-07-18), current pairings verified 2026-08-16:** AA stays the enforced floor everywhere (WCAG's own conformance guidance explicitly recommends against requiring AAA as a blanket policy — "not possible to satisfy all Level AAA Success Criteria for some content"). AAA (7:1 text contrast) is the target, not a hard requirement, specifically for error/critical-alert text (form validation errors, destructive-action confirmations) — the highest-stakes case where users acting on misread text has the worst consequences. This matches common practice in accessibility-mature systems (GOV.UK Design System, IBM Carbon). Real numbers for every current `text.danger`/`text.on-danger` consumer (`FieldError`, `Tag`/`Badge`/`Button` destructive variants, etc.), replacing the previous unverified "several... already land at or above 7:1": `text.danger` on `bg.surface` (standalone error text) hits AAA in light mode — **7.39:1**, both brands (`danger` is brand-shared) — but not dark mode, **5.67:1**, still comfortably clear of the 4.5:1 AA floor. `text.on-danger` on `bg.danger` (solid destructive fills) is AA-only in both modes — light **5.10:1**, dark **5.22:1** — short of 7:1 in every theme, not "several." No token change from this — AAA was never a hard requirement here, only a target — but the claim is now a measured fact instead of an assumption. Still genuinely blocked, not closeable yet: verifying error-text pairings *as Alert/Form will actually use them* — neither component exists yet (organism/molecule tier, not built) — so that specific check stays open until they're built, per the original note.
- **Public Storybook/docs hosting timeline:** deferred, but worth revisiting once the component set stabilizes so momentum isn't lost.
- **Storybook's docgen vs. the planned manifest generator (open, flagged 2026-08-12):** Storybook defaults to `react-docgen` (regex/Babel-based prop extraction), not the TS-checker-based `react-docgen-typescript` this doc's tech stack (`02-tech-stack-and-structure.md`) names for `packages/manifest`'s own Phase 8 build step. `05-component-api-conventions.md` §3 already documents `react-docgen` unreliably dropping inherited native props from Storybook's own Properties table (worked around per-component by hand-redeclaring them). Whether `packages/manifest` ends up consuming Storybook's docgen output directly or does its own independent `react-docgen-typescript` extraction hasn't been decided — worth deciding before Phase 8 starts, not discovering the same gap again mid-phase.
- **The Accessibility addon panel didn't work anywhere in this project's Storybook — fixed 2026-08-16, found during Skeleton's finalization review, resolved same day.** `@storybook/addon-a11y`'s panel sat permanently on "Preparing accessibility scan." Root-caused, not just observed — confirmed via `window.__STORYBOOK_ADDONS_CHANNEL__` that the story-render lifecycle fired correctly but none of the addon's own protocol events (`storybook/a11y/request`/`running`/`result`/`error`) ever fired, reproduced identically on Skeleton and the already-finalized Badge. The cause: the panel's automatic scan is gated behind Storybook's **Component Tests** integration (`@storybook/addon-vitest`), never installed. Fixed by adding it — see `02-tech-stack-and-structure.md`'s new "Component/story testing" row for the full setup. Confirmed working both ways, live: the panel now shows real scan results ("No accessibility violations found" on a clean story; a real "Color contrast — Serious" violation on one that has one) once `pnpm test:storybook:watch` is running alongside `pnpm storybook` — registering the addon alone isn't sufficient, it needs a live process to report to.
- **Adding `@storybook/addon-vitest` immediately surfaced 5 real, pre-existing findings across unrelated, already-shipped components (found 2026-08-16, CI-wired same day) — the tool working correctly, not a wiring bug.** `pnpm test:storybook` (249 tests across 50 story files): 244 pass, 5 fail on first run. **None on Avatar, Badge, or Skeleton** — the three finalized components came back completely clean, confirming those review passes actually held.
  - **3 are the already-documented, already-decided disabled-state contrast exemption** (`03-token-system-spec.md`'s Phase 17 — WCAG 2.1 explicitly excludes inactive/disabled UI components from 1.4.3/1.4.11, computed and accepted there already): `FieldHelperText`'s "Disabled" story, `FieldLabel`'s "Disabled" story, `Text`'s "All colors" story (`color="disabled"`). Axe-core has no way to know these are exempt on its own (`text.disabled` renders on plain `<p>`/`<label>` elements with no native `disabled` attribute to key off).
  - **2 are genuinely new, real findings, unrelated to any known exemption:** `Button`'s "Loading state" story — despite `children: "Saving"` being set, the rendered button has no accessible name at all during loading (empty `aria-label`, children apparently suppressed while `isLoading`, only the `aria-hidden` spinner left). `Textarea`'s "With character count" story — the demo textarea has no associated label at all.
  - **Resolution (2026-08-16, at explicit direction):** rather than fix any of these 4 components now (out of scope — no open review pass for any of them), each of the 5 stories got a scoped `parameters: { a11y: { test: "todo" } }` annotation with a comment explaining the finding and pointing back here — verified empirically that `"todo"` changes the actual Vitest pass/fail result (not just a cosmetic label), confirmed by watching a failing story flip to passing when annotated. `test:storybook` is now a **required CI step** (`browser-tests` job, `.github/workflows/ci.yml`) — the global `preview.tsx` default (`a11y: { test: "error" }`) still applies to everything else, so a real new regression on any other component fails the build immediately; only these 5 pre-existing, already-triaged findings are exempted, each removable as its own component's future review pass lands.
  - Incidentally found while running every story in a real browser for the first time, unrelated to a11y: `Center.stories.tsx`'s "Inline" story nests a `<div>` (Center's default element) inside a `<p>`, invalid HTML producing a React hydration console error. Flagged as a background task rather than fixed here — Center hasn't had its own review pass either.

---

## 13. Roadmap phases (high-level)

Renumbered 2026-07-18 to match the phases actually run (the original version bundled vision/tech-stack/tokens/inventory/scaffolding into one "Phase 1," but in execution the token pipeline and the atom layer each turned out to be their own full session/phase). Vision, tech stack, token spec, and component inventory (`01`-`04`, this doc included) predate Phase 1 as planning input, not a phase of their own.

- **Phase 1 — Repo scaffold & tooling (done):** monorepo structure, Turborepo/pnpm, shared configs, CI, security setup
- **Phase 2 — Design token pipeline (done):** Style Dictionary build producing CSS custom properties + typed TS constants from the primitive/semantic token JSON
- **Phase 3 — Foundational atom layer (done):** utility primitives, layout primitives, typography, core atoms (23 components); Storybook 10 setup; Vitest/RTL/jest-axe test infra
- **Phase 4 — OKLCH color re-derivation (done):** re-derived the primitive color scales in OKLCH for perceptual evenness; re-verified every contrast pairing checked in `03-token-system-spec.md`'s running log against the new values
- **Phase 4.5 — Atom component review & enhancement pass (done):** systematic, one-at-a-time pass over all 23 Phase 3 atoms against the two-track rubric in `06-engineering-standards.md` §9 — an objective checklist re-verification (props, tokens, a11y, responsiveness, stability) plus a design-quality pass (feature-completeness, micro-interactions, premium/unique visual execution). Run before Phase 5 so molecules aren't built on top of atom-level gaps that would then need fixing in every downstream consumer.
- **Phase 4.75 — Comprehensive atom completion (done, 2026-07-26):** built every atom-tier component already tracked in `04-component-inventory.md` but not yet shipped after Phase 4.5 (21 components: Textarea, Checkbox, Switch, FieldLabel, FieldError, FieldHelperText, Tag, Spinner, ProgressBar, Tooltip, Collapse, Image, AspectRatio, Center, Code, Blockquote, ProgressCircle, ClientOnly, Kbd, BackToTop, Bleed), plus 5 new atoms added to the inventory for this pass (CloseButton, Backdrop, Affix, Highlight, Indicators — see `04-component-inventory.md`'s rough-count table, updated 99→104). Takes the atom tier from 23 to 47 components (corrected 2026-08-12 — every prior mention of "49" here and in `04-component-inventory.md`/`07-storybook-and-documentation-standards.md` was simply a miscount against the inventory's own table, which lists exactly 47 atom-tier rows; not a sign 2 components went missing), full definition-of-done per component. Along the way: added the `font-family.mono` primitive token (Code/Kbd) and the `bg.overlay` semantic token (Backdrop) — see `03-token-system-spec.md`; added `@radix-ui/react-checkbox`/`-switch`/`-tooltip`/`-collapsible` as dependencies (Checkbox/Switch/Tooltip/Collapse each wrap one); added `ResizeObserver`/`IntersectionObserver` stubs to the shared Vitest setup, since jsdom implements neither and several Radix primitives (and `Affix`'s stuck-detection) need them. Run before Phase 5 for the same reason as Phase 4.5: molecules compose these atoms directly.
- **Phase 4.9 — Storybook & documentation refinement pass (in progress, started 2026-07-26; behind where "in progress" implies, audited 2026-08-12, updated 2026-08-15):** systematic, one-at-a-time pass over all 47 atoms verifying feature-completeness/props/tokens plus a full Storybook overhaul per component — a hand-authored comprehensive Docs page, a fully-interactive Playground story, `play`-function interaction tests, and a corrected sidebar taxonomy. Plan, Docs-page template, and the full processing order are tracked in `07-storybook-and-documentation-standards.md` so the pass survives a context reset. **Real progress as of 2026-08-16: 5 of 47 atoms have a Docs page (Box, Button, Avatar, Badge, Skeleton)** — even Phase A's own remaining template-proving items (Input, Icon, Text) haven't been started yet, let alone any category after it (Avatar's and Skeleton's own Docs pages were both completed out of the planned queue order — see below). The intent was to run this before Phase 5 so the documentation standard was proven on the full atom tier first; in practice, work shifted onto Storybook infrastructure/CI hardening (see the new entry below) and then onto Phase 5 before this pass got past its first two components — flagging the sequencing gap here rather than leaving the doc read as if steady per-atom progress has been happening.
- **Avatar deep-dive review (done, 2026-08-12–2026-08-16, out of sequence, now finalized):** at explicit direction, Avatar was pulled ahead of both the rest of Phase A and its own Data Display queue position for a review that went considerably beyond the standard per-atom Docs-page pass Phase 4.9 otherwise calls for. Net result: `name`/`colorful` (deterministic per-identity color, 5 AA-verified families plus their own hover step — see `03-token-system-spec.md` Phases 11–12), responsive `size` (the first component-tier prop to use `Responsive<T>` outside the original layout-primitive set), polymorphic `as` (interactive-trigger support, established as the pattern for this case over Radix `Slot`-style `asChild` — see `05-component-api-conventions.md`), `disabled`/hover/focus states for that interactive mode, and the component-token layer's first-ever population (`component/avatar.json` — see `03-token-system-spec.md`). Also produced two durable, cross-component outputs from the first pass: the focus-ring border-radius convention (`05-component-api-conventions.md` §6) and two real Storybook/MDX bugs fixed at the shared-tooling level (Properties table Name-column wrapping, MDX's lack of backslash-quote-escaping support — `07-storybook-and-documentation-standards.md` §4.1). A live decision was made *not* to adopt `@radix-ui/react-avatar` to replace the hand-rolled image-load state machine — the existing state machine is simple and already tested, and none of the features above have a Radix equivalent to build on top of regardless.
  A second pass (2026-08-16) made `as` a real interactive Storybook control and, in doing so, caught two truthiness bugs the raw prop check had (`isInteractive`/`canUseImgRole` used `as`'s own truthiness instead of the resolved element, breaking on an explicit `as="span"`); added a decorative `border.brand-subtle` ring plus family-matched `colorful` borders (`03-token-system-spec.md` Phases 13–14) and the matching state-family `border.{warning,success,info}` tokens (Phase 15); and a full story-controls audit surfaced a whole failure class this project hadn't checked for before — a `render` that doesn't accept `args` makes every Storybook control a silent no-op — now a standing checklist item (`06-engineering-standards.md` §9) with its own CI-enforced Foundations-token-coverage check (`07-storybook-and-documentation-standards.md` §10). **Avatar is now finalized** — further changes need explicit confirmation first (`06-engineering-standards.md` §9).
- **Badge deep-dive review (done, 2026-08-16, out of sequence, now finalized):** at explicit direction, Badge was pulled ahead of the rest of its Data Display queue position for the same kind of review pass Avatar got — a 10-item findings list worked one at a time, each verified live rather than assumed. Net result: a 5-step `size` scale backed by its own component-layer tokens (`component/badge.json`, second population of that layer after Avatar's), sized against real Chrome-measured widest-glyph widths so a single character renders as a true circle at every step; an `anchor`/`position`/`overlap` overlay-positioning mode (the "notification dot on a bell icon" pattern, closing a feature gap against MUI/Ant Design's own Badge — the anchor's own corner-offset transform and the count-change pop animation's `scale()` compose via one shared `--badge-position-transform` custom property rather than clobbering each other); a `brand` tone plus new `tone="danger"`/`variant="solid"` defaults; a one-shot scale-pop micro-interaction on count change; a `hideZero` prop matching MUI's `showZero={false}` semantics; and contrast-verified `bg.*-indicator` tokens for `dot` mode (`03-token-system-spec.md` Phase 16), which also fixed the identical latent contrast bug on Avatar's own status dot. Same-session Docs page (`Badge.mdx`), full test/Storybook coverage, and a real CSS bug found and fixed along the way (`none` isn't a composable `transform` function — invalidated the pop animation's whole transform list on every non-anchored badge until fixed).
- **Phase 4.9b — Storybook infrastructure & CI hardening (done, 2026-08-11–2026-08-12, unplanned/inserted):** not part of the original phase numbering — grouped here because it happened in the same working window as Phase 4.9 and is Storybook-tooling-scoped rather than component-scoped. Covers: fixing the mobile-drawer Settings popover (was silently navigating away instead of opening a menu) and Close-button position; updating the sidebar brand logo and its padding; `pnpm audit` + a real `build-storybook` + a bundle-size tripwire added to CI (previously nothing ever built or size-checked the static Storybook output); Storybook telemetry disabled; `.storybook/**` brought under TypeScript for the first time (`.storybook/tsconfig.json`, wired into `lint`), which surfaced and fixed several real, previously-invisible type bugs; Storybook bumped 10.5.2 → 10.5.7 as the first real exercise of the version-upgrade re-verification checklist. Full detail: `07-storybook-and-documentation-standards.md` §§9–10.
- **Phase 5 — Molecules (started 2026-08-09 — earlier than planned):** `Grid`, `GridItem`, `Select` are built. This got ahead of the original sequencing (Phase 5 was meant to start only once Phase 4.9 proved the documentation standard on the full atom tier) — noting the actual order here rather than silently leaving the doc read as strictly sequential. Remaining: FormField, Card, SearchBar, Popover, MenuItem, and the rest of the 🟢 v1 molecule tier per `04-component-inventory.md`.
- **Phase 6 — Organisms:** DataTable, Modal, Navbar, CommandPalette, Form, and the rest of the 🟢 v1 organism tier
- **Phase 7 — Comprehensive pass:** remaining 🟡 v1.5 components + templates
- **Phase 8 — Manifest & publish:** full `packages/manifest` JSON component manifest generation; npm publishing pipeline (Changesets-based)
- **Phase 9 — Surface expansion:** documentation website, public Storybook hosting
- **Phase 10 — Agent tooling:** CLI scaffolder, MCP server, and an auto-synced component index written into `CLAUDE.md`/`AGENTS.md` on every release (mirroring Astryx's `npx astryx init` pattern) — once API is proven stable
- **Phase 11 — Platform expansion:** Figma component library; React Native package

---

## 14. Related documents
- `02-tech-stack-and-structure.md` — full technical stack and monorepo layout
- `03-token-system-spec.md` — complete token architecture and values
- `04-component-inventory.md` — component list and atomic-design tiering
