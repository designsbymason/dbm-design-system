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
- **Respect `prefers-reduced-motion` on any continuously-repeating animation** (loading spinners, skeleton pulses, anything with `animation-iteration-count: infinite`) — established in Phase 3 for `Button`/`IconButton`'s spinner and `Skeleton`'s pulse. For a spinner-type animation that communicates "in progress," slow it down substantially (e.g. 4x duration) rather than stopping it outright — a fully static spinner reads as frozen/broken, not as "respecting the preference." For a placeholder-type animation (skeleton pulse) with no semantic meaning in the motion itself, `animation: none` is fine. One-shot transitions (hover, focus, state changes) aren't in scope for this — only continuous/looping animation.
- **Bundle size is tracked, not assumed.** Once CI exists (Phase 1+), bundle size per component should be a tracked metric (per the success metrics in `01-vision-and-goals.md`), not something checked only when it becomes a problem.

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
- **Stay inside the current phase's scope.** If you notice something that belongs in a later phase, note it for me rather than building ahead — each phase's prompt defines what "done" means for that session.
- **Self-verify before reporting done.** Actually run lint/build/test (and where applicable, the accessibility test suite) and report real results — don't report a task complete based on the code "looking right." This is the single most important process rule: a claimed-done task that doesn't actually pass its own checks is worse than an honestly-incomplete one.
- **Fix blockers properly, not around them.** When you hit a bug, a type error, a failing test, or an environment quirk, find and fix the actual root cause using best practices, industry-standard patterns, and this system's own conventions — not a suppression (`@ts-ignore`, `eslint-disable`, `any`), a hardcoded value in place of a missing token, or a temporary stand-in meant to be revisited later. If the properly-scoped fix genuinely belongs in a later phase (not just "harder than the shortcut"), say so explicitly and flag it — don't paper over it silently.
- **Flag gaps instead of improvising.** If a task requires a decision not covered by any guideline doc, stop and ask rather than guessing — consistent with the closing line of `CLAUDE.md`.

## Related documents
- `05-component-api-conventions.md` — the API-level contract this doc's engineering discipline supports
- `03-token-system-spec.md` — breakpoints, motion tokens referenced in §4–5
- `CLAUDE.md` — the short entry point; this doc is the detail behind its "Core principles"
