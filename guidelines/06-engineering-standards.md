# DBM Design System — Engineering Standards & Agent Process Rules

**Status: v1 draft.** This doc covers the engineering discipline that sits underneath `05-component-api-conventions.md` — not what a component's API looks like, but how the code inside it is written, and how Claude Code should operate across sessions. Read alongside `CLAUDE.md`.

---

## 1. Clean code

- **Self-explanatory names over comments.** A well-named variable/function beats a comment explaining a poorly-named one. Comments explain *why*, not *what* — if a comment is restating what the code obviously does, delete the comment.
- **No dead code.** No commented-out code blocks, no unused imports/variables/props, no `console.log` left in committed code (a `console.warn` for an intentional dev-mode prop-misuse warning is fine — see §3).
- **Single responsibility.** A component or function does one thing. If a component's implementation file is getting hard to scan, that's a signal to extract a hook or sub-component, not a reason to add more inline complexity.
- **DRY, but not prematurely.** Shared logic (a hook, a utility) belongs in `packages/primitives/src/hooks/` once it's used in 2+ places — don't abstract on the first use "just in case."
- **Formatting is automatic, not debated.** Prettier + ESLint (per `02-tech-stack-and-structure.md`) are the formatting authority — don't hand-format against them, don't argue with the linter, fix the lint error or fix the rule (and flag the rule change to me).

## 2. Scalability & architecture

- **Composition over configuration.** Prefer a component that composes well (compound components, `asChild`, slots) over one with 20 boolean flags trying to cover every case. If a component needs a growing list of mutually-exclusive props, that's a sign it should be a compound component instead.
- **No circular dependencies between packages.** `tokens` → `primitives` → `icons`/`components` is the dependency direction; nothing downstream gets imported by something upstream.
- **Avoid prop drilling past 2-3 levels.** Use React Context for genuinely cross-cutting state (theme, form context), not as a default for anything inconvenient to pass down.
- **New tokens/components go through the guidelines, not around them.** Adding a component not in `04-component-inventory.md`, or a color/spacing value with no token backing it, means the inventory or token spec is out of date — update the doc as part of the change, don't just quietly add the thing.

## 3. Stability & error handling

- **Fail loud in development, fail safe in production.** Invalid prop combinations should produce a clear `console.warn` in development (stripped in production builds) rather than silently doing the wrong thing — this is standard practice in Radix/React itself and helps both human and agent consumers debug faster.
- **No silent catch blocks.** A `try/catch` that swallows an error without logging or re-throwing is a bug waiting to be invisible. If an error is genuinely expected and safe to ignore, comment why.
- **Semver discipline.** A prop rename, removal, or behavior change to a shipped component is a breaking change — major version bump and a Changesets entry describing the migration, never a silent patch.
- **TypeScript strict mode, no `any`.** Already stated in `05-component-api-conventions.md` — worth restating here as a stability concern, not just a style one: `any` is where runtime bugs hide that the type system would otherwise have caught.

## 4. Performance

- **Memoize deliberately, not reflexively.** `React.memo`/`useMemo`/`useCallback` where profiling or obvious cost justifies it (expensive computation, large lists, components that re-render frequently with stable props) — not wrapped around every component by default, which adds overhead without benefit.
- **Virtualize long lists.** `DataTable` and any component that can realistically render hundreds+ of rows needs virtualization (windowing) as part of its definition of done, not an afterthought bolted on when someone complains.
- **Tree-shaking stays intact.** No barrel-file re-exports that force bundlers to pull in the whole library for one component (already covered by the icon-prop convention in `05-component-api-conventions.md` — same principle applies more broadly).
- **CSS performance:** avoid deeply nested selectors and expensive properties (`box-shadow` animations, layout-triggering properties) in transitions — animate `transform`/`opacity` where possible, consistent with the motion tokens in `03-token-system-spec.md`.
- **Respect `prefers-reduced-motion` on any continuously-repeating animation** (loading spinners, skeleton pulses, anything with `animation-iteration-count: infinite`) — established in Phase 3 for `Button`/`IconButton`'s spinner and `Skeleton`'s pulse, extended in Phase 4.5 to `Skeleton`'s `wave` animation variant. For a spinner-type animation that communicates "in progress," slow it down substantially (e.g. 4x duration) rather than stopping it outright — a fully static spinner reads as frozen/broken, not as "respecting the preference." For a placeholder-type animation (skeleton pulse/wave) with no semantic meaning in the motion itself, `animation: none` is fine. One-shot transitions (hover, focus, state changes) aren't in scope for this — only continuous/looping animation.
- **Bundle size is tracked, not assumed.** Half-done as of 2026-08-12: CI now has a real bundle-size tripwire (`packages/components/scripts/check-storybook-bundle-size.mjs`, wired into `ci.yml`), but it currently only covers the **Storybook static build** (`storybook-static/`'s total size and its largest Vite-bundled chunk) — see `07-storybook-and-documentation-standards.md` §10. **Per-component bundle size of the published `@dbm-design-system/components` package itself is still not tracked anywhere** — the success metric in `01-vision-and-goals.md` §11 ("bundle size per component") remains open. Worth closing before Phase 8 publish, using the same "cheap custom script over a new dependency" approach the Storybook one established.

## 5. Responsiveness is not optional

Mirroring the accessibility principle in `CLAUDE.md`: **there is no "responsive mode."** Every component must work correctly across the breakpoint scale in `03-token-system-spec.md`, using the fluid typography and spacing tokens as designed — not a fixed-desktop layout with mobile bolted on later. Test each component's Storybook story at multiple viewport widths as part of its definition of done.

## 6. Browser & rendering environment targets

Not yet stated anywhere else, and needed before writing CSS that assumes modern browser features:
- **Target: last 2 versions of evergreen browsers** (Chrome, Firefox, Safari, Edge). No IE11, no legacy Safari polyfills. This is what makes `clamp()`, CSS custom properties, and CSS Grid usable without fallbacks.
- **SSR/RSC safety:** no unguarded access to `window`/`document`/`localStorage` at module scope or during initial render — guard with `typeof window !== 'undefined'` or an effect, since components should degrade gracefully in a server-rendered environment even though full RSC support is a "later" goal per the roadmap.

## 7. Internationalization & RTL — recommendation, not yet fully decided

This was flagged as an open question early in planning and never fully resolved. Recommendation to proceed with, flag if you want to revisit:
- **Adopt CSS logical properties from day one** (`margin-inline-start` instead of `margin-left`, etc.) — low cost now, keeps the RTL door open later without a rewrite.
- **Don't build a translation/string-externalization system for v1** — components shouldn't hardcode user-facing English strings where avoidable (prefer children/props over baked-in text), but a full i18n library integration is out of scope until there's a concrete need, consistent with how mobile/RN was deferred.

## 8. Agent process rules (how Claude Code should operate across sessions)

- **Never push without confirmation.** Already a standing rule in `CLAUDE.md` — restated here because it's a process rule, not a code-quality one.
- **Never edit `guidelines/*.md` unilaterally.** These docs are the source of truth I control. If a build phase reveals that a guideline needs to change (a token's missing, a convention doesn't work in practice), propose the specific change and why — don't just edit the doc and move on.
- **Keep `guidelines/*.md` current as the project evolves — don't wait to be asked.** When a phase settles something that should be on record (a tool-version decision, a convention established in practice, a fix applied to something a doc still describes as pending), propose the specific update before reporting that phase done, not only when asked separately in a later session. Mentioning a decision in a chat response is not the same as recording it — chat scrolls away, `guidelines/*.md` persists. This still respects the "never edit unilaterally" rule above: propose exact wording and location, get a go-ahead, then edit.
- **Periodically audit `guidelines/*.md` and `CLAUDE.md` against the actual current repo state**, not only when logging a new decision — docs can drift silently even when every individual phase gets logged correctly (a doc can describe where something *should* live while the code quietly ended up somewhere else, or a status note can go stale once the thing it describes ships). Propose fixes the same way as any other guideline change: specific wording and location, get a go-ahead, then edit.
- **Stay inside the current phase's scope.** If you notice something that belongs in a later phase, note it for me rather than building ahead — each phase's prompt defines what "done" means for that session.
- **Self-verify before reporting done.** Actually run lint/build/test (and where applicable, the accessibility test suite) and report real results — don't report a task complete based on the code "looking right." This is the single most important process rule: a claimed-done task that doesn't actually pass its own checks is worse than an honestly-incomplete one.
- **Fix blockers properly, not around them.** When you hit a bug, a type error, a failing test, or an environment quirk, find and fix the actual root cause using best practices, industry-standard patterns, and this system's own conventions — not a suppression (`@ts-ignore`, `eslint-disable`, `any`), a hardcoded value in place of a missing token, or a temporary stand-in meant to be revisited later. If the properly-scoped fix genuinely belongs in a later phase (not just "harder than the shortcut"), say so explicitly and flag it — don't paper over it silently.
- **Flag gaps instead of improvising.** If a task requires a decision not covered by any guideline doc, stop and ask rather than guessing — consistent with the closing line of `CLAUDE.md`.

## 9. Component review & enhancement passes

Beyond the initial "definition of done" (`05-component-api-conventions.md` §8, checked once when a component first ships), every component — at any tier: atom, molecule, organism, or template — periodically gets a full review pass. The first one ran as Phase 4.5, covering all 23 Phase 3 atoms one at a time, before Phase 5 (Molecules) began, since molecules compose those atoms directly and any atom-level gap gets inherited by everything built on top of it. The checklist below applies identically at every tier from here forward — molecules/organisms get their own review passes once their initial build settles, using this same list, not a scaled-down one.

**Full review checklist (established 2026-08-12, at explicit direction — every item here matters, this is not an abbreviated summary).** Sections marked *(judgment)* are where the scope-creep guardrail below applies; everything else is checklist-driven re-verification, not exploratory redesign.

**Baseline correctness**
- [ ] Full "definition of done" (`05-component-api-conventions.md` §8) re-verified top to bottom — don't assume it still holds.
- [ ] TypeScript strict mode, no `any` anywhere.
- [ ] JSDoc complete on the component and every prop — this is what feeds the future manifest generator; an undocumented prop is incomplete work, not polish (`CLAUDE.md`).
- [ ] Standard prop patterns still followed (`05-component-api-conventions.md` §3): `forwardRef` (or a justified, JSDoc'd exception), `className`/`style`/`id`/`data-testid` accepted, a controlled/uncontrolled pair for any component holding internal state, `asChild` support where composability matters, component-relevant `aria-*` props explicitly redeclared for documentation visibility.
- [ ] Zero hardcoded values — every color, spacing, font-size, radius, shadow, and duration traces to a design-system token; if a needed value has no token yet, add the token first, don't inline it.
- [ ] Stability: no console noise in production, no silent `catch` blocks, invalid prop combinations fail loud with a dev-mode `console.warn`.
- [ ] SSR/RSC safety — no unguarded `window`/`document`/`localStorage` access at module scope or during initial render.
- [ ] The component is DBM's own original implementation, not copied or imported wholesale from another design system's source — Radix as the behavior/accessibility foundation is the approved pattern (`02-tech-stack-and-structure.md`); the styling, API shape, and visual identity are ours.

**Feature completeness** *(judgment)*
- [ ] Feature-completeness pass against the same role's component in MUI, Chakra UI, Ant Design, and Radix — name any concrete gap before adding anything ("X is missing feature Y that [comparable component] has"), not a vague "make it more complete."
- [ ] Required and recommended props all present and sensibly defaulted — a missing commonly-expected prop (a loading state, an `asChild` escape hatch, a controlled/uncontrolled pair) is a gap, not a nice-to-have.
- [ ] Sizes, variants, states, and types covered where they genuinely make sense for the component's role, using the shared `size`/`variant`/`tone` scales (`05-component-api-conventions.md` §2) — never a one-off component-specific scale, and never forced onto a component where they don't apply.
- [ ] Overall feature-rich, complete, and comprehensive relative to what a developer or agent would reasonably expect from a production design system's version of this component — not a minimal/bare-bones implementation.

**Accessibility — verified, not assumed**
- [ ] All necessary ARIA attributes present and correct for the component's actual role (`aria-label`/`aria-labelledby`, `aria-pressed`, `aria-expanded`/`aria-controls`, `aria-haspopup`, `aria-describedby`, etc., as applicable).
- [ ] Keyboard navigation verified by hand: tab order, visible focus indicator, Escape/Enter/Arrow-key behavior where applicable.
- [ ] Automated accessibility test (jest-axe) passes with zero violations — **for a polymorphic (`as`-driven) component, run this against a non-default `as` value too, not just the default element.** Confirmed real finding, Avatar (2026-08-15): a `role="img"` that was correct on the default `span` became an "aria-allowed-role" violation once `as="button"` existed, since ARIA doesn't permit overriding a native interactive element's own role — invisible in the default-element test alone, since that one genuinely had no violation.
- [ ] Any new or changed color pairing introduced by the review is contrast-checked against the methodology in `03-token-system-spec.md` — not assumed from "looks fine."

**Responsiveness**
- [ ] Correct behavior across the full breakpoint scale (`03-token-system-spec.md`) — verified live in Storybook at multiple viewport widths via the viewport toolbar addon, not just reasoned about abstractly. No fixed-desktop layout with mobile bolted on.

**Design quality** *(judgment)*
- [ ] Visual execution is modern, clean, premium, and identifiably DBM's own rather than a generic Radix-default or copied look — entirely within the existing token set (color, typography, spacing, radius, shadow, motion). If a new treatment needs a token that doesn't exist yet, add the token first.
- [ ] Micro-interactions and animation, where they clarify a state change (hover/focus/active transitions, loading/success feedback) — consistent with the existing motion tokens and "motion with restraint" (`01-vision-and-goals.md` §8, principle 5). Not every component needs one — a `Divider` doesn't. Any continuously-repeating animation (spinners, pulses) added or changed must respect `prefers-reduced-motion` per §4 above.
- [ ] Performance: memoize only where profiling or obvious cost justifies it, not reflexively; tree-shaking stays intact; CSS animates `transform`/`opacity` rather than layout-triggering properties where possible.
- [ ] Scalability: composition over configuration — a component accumulating a growing list of mutually-exclusive boolean flags is a sign it should be a compound component instead (§2 above).

**Guardrail against scope creep (this is where it happens):** every Feature-completeness/Design-quality enhancement gets proposed with a specific, named rationale before it's built — "X is missing feature Y that [comparable component] has" or "the hover state is instant while every other interactive atom eases" — not a blanket "make it fancier" pass. `01-vision-and-goals.md` §4 goal 7 makes comprehensiveness and premium execution an explicit project requirement, so proposing against that goal is in-scope — but every individual addition should still trace to a concrete, stated gap, not be improvised in the moment.

**Theming**
- [ ] Confirmed working in both light and dark mode, and across every shipped brand theme (currently Purple and Emerald) — verified live in a running Storybook instance via the Brand/Mode toolbar toggles, not inferred from the code. A clean typecheck/build is not sufficient evidence: this project has repeatedly found real theming bugs invisible to `tsc`/`eslint`/`vitest` that only a live browser check caught (e.g. `07-storybook-and-documentation-standards.md` §7.1).

**Storybook documentation**
- [ ] Docs page (`ComponentName.mdx`) exists, first in the component's sidebar group, following the full section template in `07-storybook-and-documentation-standards.md` §4 in full (Intro, Playground, Properties, Variants/states gallery, Usage guidelines, Best practices, Accessibility, Code examples, Design tokens used, Related components) — not an abbreviated version.
- [ ] Properties table's prop order reads sensibly (content prop → core visual props → behavioral/state props → advanced/escape-hatch props last), via `PropertiesTable`'s `order` prop — don't assume docgen's default order already does (`07-storybook-and-documentation-standards.md` §4 item 3).
- [ ] Playground story exists, positioned directly after the Docs page, with every prop live and interactive — nothing hardcoded via a bare `render`.
- [ ] Every prop's Storybook control is genuinely interactive wherever it makes sense — a real `select`/`boolean`/`text`/etc. control, not an inert "Set string"/"Set boolean"/"Set object" placeholder — both in the Playground and in every individual variant story's own Controls panel, not just the Playground. Use `control: false` (renders as "–") only for props that genuinely can't or shouldn't be live-edited in Storybook.
- [ ] Prop order in every Controls panel (the Playground's and every individual variant story's) reads sensibly — same sequence principle as the Properties table above.
- [ ] Sidebar `title` matches the taxonomy in `07-storybook-and-documentation-standards.md` §3.
- [ ] Docs page visually verified in a running Storybook instance — `tsc --noEmit` passing only proves the MDX compiles, it does not prove the page renders correctly (`07-storybook-and-documentation-standards.md` §4.1).

**Functional verification**
- [ ] Component functions correctly end to end — exercised live, not just read.
- [ ] Unit test (React Testing Library) covers rendering and interaction, and passes.
- [ ] Self-verify before reporting the review done: actually run lint, typecheck, build, and the full test suite, and report real results — don't report a review complete based on the code "looking right" (`CLAUDE.md`).

**Reporting a review's findings (established 2026-08-12, at explicit direction):** present results as a single prioritized, ordered list of exactly what needs to change — added, updated, or removed — not a section-by-section narrative that also explains what already passed. Skip commentary on checklist items that already pass; only what needs action belongs in the list. Two fixed positions within that ordering: if a Playground story is missing, it's always the first item on the list; if a Docs page is missing, it's always the last.

## Related documents
- `05-component-api-conventions.md` — the API-level contract this doc's engineering discipline supports
- `03-token-system-spec.md` — breakpoints, motion tokens referenced in §4–5, and the contrast-check methodology §9 references
- `07-storybook-and-documentation-standards.md` — the Docs-page template and per-component Storybook checklist §9's documentation section points to
- `CLAUDE.md` — the short entry point; this doc is the detail behind its "Core principles"
