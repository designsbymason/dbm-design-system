# DBM Design System

## What this is
An agentic, standalone React component library — built for AI coding agents (and humans) to compose web and enterprise applications. Published to npm under the `@dbm-design-system/*` scope (MIT licensed). Also home to a documentation site and hosted Storybook (built after the core library stabilizes). A Figma component library is planned as a future, separate deliverable derived from the same tokens.

**Before making any structural or architectural change, check `guidelines/` — don't assume or re-derive decisions that are already made there.**

## Core principles
- **No/limited dependencies.** Every dependency must be justified. Currently approved: Radix UI Primitives (accessibility/interaction layer) and Motion (optional peer dependency, for richer micro-interactions only).
- **Free/open-source tooling only** — no paid SaaS in build, test, or hosting pipelines. See `guidelines/02-tech-stack-and-structure.md` for the full approved stack.
- **Tokens are the single source of truth.** Never hardcode a color, spacing value, font size, radius, shadow, or duration in component code — reference a semantic token. If a needed token doesn't exist yet, add it to the token layer first, don't inline a value.
- **Semantic over primitive.** Components reference semantic tokens (`color.bg.brand`, `space.4`) never primitives (`color.purple.600`) directly. This is what makes multi-theme/multi-brand switching work without touching component code.
- **Accessibility is not optional.** WCAG AA minimum on every component (contrast, keyboard nav, focus states, ARIA). Run contrast checks on any new color pairing rather than assuming — see the methodology in `guidelines/03-token-system-spec.md`.
- **Atomic design tiering**: atoms → molecules → organisms → templates. Check `guidelines/04-component-inventory.md` for where a new component belongs before creating it.
- **Every component needs full TypeScript types + JSDoc** — this is what feeds the auto-generated agent-readable component manifest. Undocumented props are treated as incomplete work, not optional polish.
- **Never commit and push without explicit confirmation.** You may stage and commit locally as a checkpoint, but never run `git push` (including force-push) without showing me exactly what's being pushed and getting an explicit go-ahead first. This applies to every phase, not just initial setup.
- **Security is not optional.** See "Security practices" below — applies to every phase, not just repo setup.
- **Responsive is not optional**, same standing as accessibility — every component works across the full breakpoint scale, not desktop-first with mobile bolted on later.
- **Self-verify before reporting a task done.** Actually run lint/build/test and report real results — never report completion based on code "looking right."
- **Never edit `guidelines/*.md` unilaterally.** These are the source of truth I control. If something needs to change, propose the specific change and why.
- **Full engineering discipline** (clean code, scalability, performance, error handling, browser/SSR targets, i18n stance) is in `guidelines/06-engineering-standards.md` — read it alongside this file, not as an optional extra.

## Security practices
- **Never commit secrets.** No API keys, tokens, `.env` files, or credentials in the repo, ever — including in commit history, code comments, test fixtures, or Storybook examples. Use `.env.example` with placeholder values to document what's needed.
- **`.gitignore` must cover:** `.env`, `.env.*` (except `.env.example`), `node_modules`, build outputs (`dist`, `.turbo`, `build`), OS/editor cruft (`.DS_Store`, `.vscode/*` except shared settings), and any local credential/config files.
- **Dependency security:** GitHub Dependabot (free, native) enabled for automated dependency update PRs and vulnerability alerts. Run `pnpm audit` as part of CI where practical.
- **Secret scanning:** GitHub secret scanning + push protection (free for public repos) should be enabled at the repo level — flag this to me if it isn't, since it's a repo setting, not something committed in code.
- **Static analysis:** GitHub CodeQL (free for public repos) as a CI job once there's real code to scan — catches common vulnerability patterns (XSS, injection) before merge.
- **Component-level security:** no `dangerouslySetInnerHTML` without explicit sanitization (relevant for anything rendering user-provided content — `CodeBlock`, `Combobox`, rich text areas); no `eval` or dynamic `Function` construction; sanitize any component that accepts and renders external URLs or HTML.
- **Publish security:** when the npm publish pipeline is built (Phase 6), use npm provenance/trusted publishing (OIDC-based, no long-lived tokens stored as secrets) rather than a classic npm token, and require 2FA on the npm account doing the publishing.
- **`guidelines/` is public and permanent.** Never add secrets, credentials, personal identifying information, or client/business-sensitive details to any file in `guidelines/` — the repo is public and git history is effectively permanent, so anything committed there should be treated as visible forever. If a task would involve writing something sensitive into a guideline doc, stop and ask rather than proceeding.

## Repo structure
```
apps/
  docs/            Documentation website (Next.js/Astro — built later)
  storybook/        Hosted Storybook instance
packages/
  tokens/           Source of truth for all design tokens (primitive + semantic layers)
  primitives/        Headless behavior layer (wraps Radix, shared hooks)
  icons/             Phosphor Icons wrapper
  components/        The actual DBM component library (published npm package)
  manifest/          Build tool: generates the JSON component manifest from TS + JSDoc
  eslint-config/      Shared lint rules
  tsconfig/           Shared TypeScript configs
guidelines/          Internal reference docs — architecture decisions, specs, inventories
```

## Stack quick reference
TypeScript (strict) · React 18+ · Turborepo · pnpm workspaces · Radix UI Primitives · CSS Modules + CSS Custom Properties · Style Dictionary (token build) · tsup · Vitest + React Testing Library · jest-axe · Storybook 10 · Changesets · GitHub Actions

Full rationale for each choice: `guidelines/02-tech-stack-and-structure.md`.

## Where to look before you build something
| Task | Check first |
|---|---|
| Adding/changing a design token | `guidelines/03-token-system-spec.md` |
| Building a new component | `guidelines/04-component-inventory.md` (tier + scope) |
| Unsure about a dependency or tool choice | `guidelines/02-tech-stack-and-structure.md` |
| Overall project goals/scope | `guidelines/01-vision-and-goals.md` |

## Component index (planned: auto-synced)
Once `packages/manifest` exists and generates the JSON component manifest (see `01-vision-and-goals.md`, Phase 5), its build step should also write an up-to-date component index into this file — name, category, tier, and a one-line summary per shipped component, regenerated on every release rather than maintained by hand. This mirrors Astryx's `npx astryx init`, which installs its component index directly into a project's `AGENTS.md`/`CLAUDE.md` so agents discover what's available instead of guessing or hallucinating a component that doesn't exist.

Until that tooling exists, treat `guidelines/04-component-inventory.md` as the authoritative (manually maintained) list.

<!-- AUTO-GENERATED-COMPONENT-INDEX:START -->
<!-- This block will be replaced by the manifest build step once packages/manifest ships. Do not hand-edit between these markers. -->
<!-- AUTO-GENERATED-COMPONENT-INDEX:END -->

If a task requires a decision that isn't covered in `guidelines/`, flag it rather than guessing — these documents are meant to be the standing source of truth, and gaps should get filled in explicitly, not improvised silently.
