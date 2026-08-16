# DBM Design System — Monorepo Structure & Tech Stack

## Guiding decisions locked in so far
- Styling: CSS Custom Properties + plain/scoped CSS (no CSS-in-JS runtime), tokens generated from a single source of truth
- Agentic scope for v1: strong TypeScript + JSDoc, auto-generated JSON component manifest; CLI/MCP server deferred to v1.5+
- Platform scope for v1: Web + Enterprise, built on shared primitives (mobile/React Native deferred, but token layer built to support it later)
- Icons: Phosphor Icons
- Accessibility/interaction primitives: Radix UI Primitives (confirmed)
- Motion: Motion (Framer Motion) as an optional peer dependency (confirmed)
- Package manager for consumers: npm (published package), built with Claude Code
- Docs site + hosted Storybook: planned, built after core library stabilizes
- **Constraint: every tool/service must be free or open-source** — no paid SaaS in the build, test, or hosting pipeline

---

## 1. Accessibility primitives — confirmed

Building keyboard navigation, focus trapping, roving tabindex, and ARIA wiring from scratch for every interactive component (menus, comboboxes, dialogs, tabs, sliders) is a *very* large, easy-to-get-subtly-wrong undertaking — this is the single riskiest place to go fully dependency-free.

**Confirmed:** **Radix UI Primitives** (`@radix-ui/react-*`, MIT-licensed, fully open-source and free) as a foundational, unstyled dependency for interaction/accessibility logic, with DBM's own styled components built on top. Radix ships zero styling, is tree-shakeable per-component, and is the de facto industry standard other systems (shadcn/ui, many enterprise DS) build on.

**Motion (Framer Motion's successor, MIT-licensed) is confirmed** as an optional peer dependency for richer micro-interactions, layered on top of CSS transitions/keyframes for the simpler cases.

---

## 2. Monorepo layout

```
dbm-design-system/
├── apps/
│   ├── docs/                    # Documentation website (Next.js, built later) — currently an empty stub
│   └── storybook/               # Hosted *public* Storybook instance (Phase 9) — currently an empty stub;
│                                 # not where Storybook actually lives today, see note below
│
├── packages/
│   ├── tokens/                  # Design tokens — single source of truth
│   │   ├── src/
│   │   │   ├── primitive/       # Raw values, no meaning — color.json, typography.json, spacing.json,
│   │   │   │                    # radius.json, shadow.json, breakpoint.json, motion.json, other.json
│   │   │   ├── semantic/        # One file per theme (brand × mode) — purple-light.json, purple-dark.json,
│   │   │   │                    # emerald-light.json, emerald-dark.json
│   │   │   └── component/       # One file per component that needs one — avatar.json, badge.json
│   │   ├── style-dictionary.config.js
│   │   └── build/                # generated: css vars, JS/TS exports, (later) RN objects
│   │
│   ├── primitives/               # Headless behavior layer (wraps Radix, adds shared hooks)
│   │   └── src/
│   │       ├── hooks/            # useControllableState, useId, useFocusTrap, etc.
│   │       └── components/       # unstyled composition wrappers
│   │
│   ├── icons/                    # Phosphor wrapper — curated re-export + typed icon prop
│   │   └── src/
│   │
│   ├── components/                # The actual DBM component library (this is the npm package)
│   │   ├── src/
│   │   │   ├── atoms/            # Built: Avatar, Badge, Button, Icon, Input... (47 shipped so far)
│   │   │   ├── molecules/        # Built so far: Grid, GridItem, Select — FormField, Card, etc. still open
│   │   │   ├── organisms/        # Not started yet — DataTable, Modal, Navbar, CommandPalette, Form...
│   │   │   ├── templates/        # Not started yet — page-level layout scaffolds (optional, later)
│   │   │   ├── foundations/      # Storybook-only Foundations pages (*.mdx) — not shipped in the package
│   │   │   └── styles/           # global.css, resets, css var consumption
│   │   └── .storybook/           # The real, active Storybook config/build lives HERE, not in
│   │                              # apps/storybook/ above — see note below
│   │
│   ├── manifest/                  # Build tool: generates JSON component manifest from TS + JSDoc
│   │   └── src/
│   │
│   ├── eslint-config/              # Shared lint rules
│   └── tsconfig/                   # Shared TS configs
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

**Why this split:** `tokens`, `primitives`, `icons`, and `components` are separately versioned/publishable packages. This lets consumers (or you, later, for React Native) depend on `tokens` and `primitives` independently without pulling in the full styled component set — and keeps the manifest generator decoupled from the components themselves.

**Where Storybook actually lives (clarified 2026-08-16):** `apps/storybook/` was the originally-planned home for a *public-hosted* Storybook instance (Phase 9, still not built — the directory is currently just a stub `README.md`). The Storybook that's actually built and run today (`pnpm --filter @dbm-design-system/components run storybook`, the Docs pages, the `.storybook/blocks/*` MDX building blocks, everything covered in `07-storybook-and-documentation-standards.md`) lives entirely under `packages/components/.storybook/` instead — it ships alongside the component source it documents, not as a separate app. `apps/storybook/` may end up hosting a deployed build of that same instance later; it isn't a second, independent Storybook setup.

---

## 3. Tech stack

| Layer | Tool | Why |
|---|---|---|
| Language | TypeScript (strict mode) | Types double as the source for the agent manifest; non-negotiable for a serious component API |
| Monorepo orchestration | Turborepo | Fast incremental builds/caching across packages; simpler than Nx for a library-focused monorepo |
| Package manager | pnpm | Efficient workspace linking, strict dependency isolation (avoids phantom deps — important for a "limited deps" goal) |
| Framework target | React 18+ | Your stated target; keep an eye on RSC/Server Component compatibility for components that don't need interactivity |
| Accessibility/interaction primitives | Radix UI Primitives | See section 1 — foundational, unstyled, industry-standard |
| Styling | CSS Modules + CSS Custom Properties | Scoped classnames at build time, zero runtime cost, tokens flow in as CSS vars |
| Token pipeline | Style Dictionary | Single JSON source → CSS vars (web), TS constants (typed token access), future RN output |
| Icons | Phosphor Icons (`@phosphor-icons/react`), wrapped | Wrap in a typed `Icon` component so swapping/theming icon weight & size is centralized |
| Motion | CSS transitions/keyframes by default; Motion (Framer Motion successor) as an **optional peer dependency** for complex sequences | Keeps the core dependency-light; consumers who don't need rich motion don't pay for it |
| Build (component packages) | tsup (esbuild-based) | Fast, simple ESM+CJS+d.ts output, minimal config |
| Testing (unit/behavior) | Vitest + React Testing Library | Fast, ESM-native, pairs well with Vite/tsup toolchain |
| Accessibility testing | jest-axe | Automated a11y regression checks per component. Settled on jest-axe over vitest-axe during Phase 3 — vitest-axe was a single early (0.1.0, Jan 2025) release with no follow-up, while jest-axe (10.0.0, actively maintained) works fine under Vitest since Vitest's `expect` is Jest-API-compatible |
| Visual regression | Playwright's built-in screenshot/snapshot testing, self-hosted | Fully open-source and free, no SaaS account needed — trade-off is you host/diff the snapshot artifacts yourself (e.g. as CI artifacts) rather than getting Chromatic's hosted review UI |
| Component workshop | Storybook 10 | OSS; also doubles as living documentation and the base for the future public-hosted instance. Originally pinned at 8 during planning; bumped to 10 in Phase 3 when 8 turned out to be two majors behind with React 19 peer-dependency friction — confirmed with the maintainer before deviating |
| Component/story testing | `@storybook/addon-vitest` (Vitest browser mode, `@vitest/browser-playwright` provider, reuses the already-approved Playwright install) | Added 2026-08-16. Runs every story — and critically every story's `play` function — as a real Vitest test in an actual Chromium instance, closing a real gap: play-function interactions previously only ran when a human manually opened that story's Interactions tab, with no CI signal if one broke. Also what the Accessibility addon's automatic scan is gated behind in this Storybook version (root-caused via the real event channel, see `01-vision-and-goals.md` §12). Dev-only, never shipped in `@dbm-design-system/components` — same category as Storybook/Vitest/Playwright themselves, not subject to the runtime dependency budget in `CLAUDE.md`. Two commands: `pnpm test:storybook` (one-shot, what CI runs, works standalone with no dev server since Vite loads stories directly) and `pnpm test:storybook:watch` (must run alongside `pnpm storybook` for the live sidebar indicators/Accessibility panel to have anything to report — confirmed empirically, registering the addon alone isn't sufficient). A second, browser-mode Vitest project (`vitest.config.ts`'s `test.projects`) sits alongside the existing jsdom `unit` project; deliberately does *not* inherit `src/test/setup.ts`, which stubs several browser APIs jsdom lacks (matchMedia, ResizeObserver, etc.) — correct for jsdom, actively wrong in a real browser where those already work. |
| Docs site (later) | Next.js or Astro (both OSS frameworks) | Pairs naturally with MDX for component docs + the manifest data |
| Static hosting (docs site + Storybook) | GitHub Pages, or Cloudflare Pages free tier | Both free for public/OSS projects with no usage-based billing risk; GitHub Pages is the simplest since the repo is already on GitHub |
| Versioning/release | Changesets | OSS; per-package semver, changelog generation, monorepo-aware |
| Linting/formatting | ESLint + Prettier (shared config package) | OSS; consistency enforced at the workspace level |
| CI | GitHub Actions | Free tier is generous for public repos (unlimited minutes on public repos); lint (incl. `.storybook` typecheck), build, a Foundations token-coverage check, `pnpm audit`, `build-storybook` + a bundle-size tripwire, test, visual regression, changeset release pipeline. The audit/`build-storybook`/bundle-size steps were added 2026-08-12 — previously aspirational; the Foundations token-coverage check was added 2026-08-16, runs right after `build` (see `06-engineering-standards.md` §4 and `07-storybook-and-documentation-standards.md` §10 for what each actually checks). Two jobs: `ci` (lint/build/checks/`test`) and `browser-tests` (visual regression +, added 2026-08-16, `test:storybook` — the new `@storybook/addon-vitest` project above — sharing one job since both need the same workspace-build-plus-Playwright setup) |
| Security: dependency scanning | GitHub Dependabot | Free, native to GitHub; automated PRs for vulnerable/outdated dependencies |
| Security: secret scanning | GitHub secret scanning + push protection | Free for public repos; a repo setting, not a dependency — must be enabled at the GitHub repo level |
| Security: static analysis | GitHub CodeQL | Free for public repos; catches common vulnerability patterns (XSS, injection) in CI |
| Security: publish auth | npm provenance / trusted publishing (OIDC) | No long-lived npm tokens stored as CI secrets; used when the Phase 8 publish pipeline is built |
| Manifest generation | react-docgen-typescript (custom build step in `packages/manifest`) | OSS; extracts props/types/JSDoc into the machine-readable JSON contract for agents |

---

## 3.1 Dependency vulnerability remediation pattern

When `pnpm audit` or a GitHub Dependabot alert flags a vulnerable package, check whether it's a **direct** dependency (bump it normally in the relevant `package.json`) or a **transitive** one pulled in by a tool we don't control the version of — this project's dependencies are almost entirely dev/build tooling (ESLint, Storybook, Vite, Vitest, Changesets), so it's usually the latter. For transitive vulnerabilities, force the resolution via `pnpm-workspace.yaml`'s top-level `overrides` field rather than waiting on the upstream consumer to bump it, following the pattern established fixing CVE-2026-14257/CVE-2026-69152 (`brace-expansion`) and a five-package sweep (`undici`, `brace-expansion`, `js-yaml` ×2, `nanoid`, `postcss`) on 2026-08-08 — both in git history if you need the full incident write-ups. Three real gotchas found empirically while doing this, not theoretical:

- **Cap the upper bound, don't just set a floor.** `undici: ">=7.29.0"` (the literal patched-version floor from the advisory) let pnpm resolve to `undici@8.10.0` — the latest version satisfying that open-ended constraint — which broke every test run: `jsdom` does an internal deep `require()` into `undici`'s own file layout (not its public API) at a path that only exists in the 7.x line `jsdom` actually declares support for. The fix was `">=7.29.0 <8.0.0"`. Always check what major the actual consumer's own `package.json` declares support for (`pnpm view <consumer>@<version> dependencies`) before writing an override, and cap to match unless you've separately verified the next major is compatible.
- **A version bump can break a consumer relying on undocumented internals or a changed export shape** — not just via the major-version case above. Fixing `brace-expansion` (a callable-default export in 1.x, a named `{ expand }` export from 2.x on) for a consumer still on `minimatch@3.1.5` (the last-ever 3.x release, hard-coded to the old shape) required pairing the override with a `patchedDependencies` entry (a 2-line pnpm patch shimming the old call site to accept either export shape) — a bare override alone crashed every lint run with `"expand is not a function"`. If a plain override breaks something, check whether the failure is really a compatibility-shape mismatch before assuming the override itself is wrong.
- **The same package can exist at multiple coexisting majors in the tree**, each wanted by a different consumer — `js-yaml` appeared as both 3.x (via `read-yaml-file`) and 4.x (via `@changesets/parse`), both themselves only reached through `@changesets/cli`. A single blanket `js-yaml: ">=X"` key can't patch both independently without either colliding or accidentally forcing one consumer onto the wrong major. Use pnpm's parent-scoped override syntax instead — `read-yaml-file>js-yaml: ">=3.15.1 <4.0.0"` and `"@changesets/parse>js-yaml": ">=4.3.1"` — so each major gets patched in place.

**Always verify after any override change**, not just `pnpm install` succeeding: `pnpm audit` (should report zero known vulnerabilities), then the full pipeline — `tsc --noEmit`, `eslint`, the full Vitest suite, and a real `pnpm -r build` across the workspace — since a broken transitive resolution (like the `undici`/`jsdom` case above) surfaces as a runtime failure in tooling, not a type or lint error.

---

## 4. What's deferred (by design, not forgotten)

- **CLI scaffolder / MCP server** — v1.5+, once component API is stable and manifest is proven accurate
- **React Native primitives** — token layer built to support it; actual RN components are a separate future package (`packages/components-native`)
- **Figma component library** — built from the same token source once tokens are finalized, so Figma variables can mirror the CSS vars 1:1
- **Multi-brand/theme packs beyond light/dark** — architecture supports it (swap `data-theme`), but building 10 themes like Astryx isn't a v1 goal unless you want it to be

---

All three items originally tracked here as "next planning pass" work are done: the full token category breakdown lives in `03-token-system-spec.md`, component inventory + atomic tiering in `04-component-inventory.md`, and the CI/release workflow was built in Phase 1 (`.github/workflows/ci.yml`, Changesets config). Removed 2026-07-18 rather than left as stale planning notes — see `01-vision-and-goals.md` §12 for what's actually still open.
