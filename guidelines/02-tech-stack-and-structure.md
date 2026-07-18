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
│   ├── docs/                    # Documentation website (Next.js, built later)
│   └── storybook/               # Hosted Storybook instance
│
├── packages/
│   ├── tokens/                  # Design tokens — single source of truth
│   │   ├── src/
│   │   │   ├── color.json
│   │   │   ├── typography.json
│   │   │   ├── spacing.json
│   │   │   ├── radius.json
│   │   │   ├── shadow.json
│   │   │   ├── motion.json
│   │   │   └── breakpoints.json
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
│   │   └── src/
│   │       ├── atoms/            # Button, Input, Badge, Avatar, Icon, Text, Divider...
│   │       ├── molecules/        # FormField, SearchBar, Card, Tooltip, MenuItem...
│   │       ├── organisms/        # DataTable, Modal, Navbar, CommandPalette, Form...
│   │       ├── templates/        # Page-level layout scaffolds (optional, later)
│   │       └── styles/           # global.css, resets, css var consumption
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
| Accessibility testing | jest-axe / vitest-axe | Automated a11y regression checks per component; both fully OSS |
| Visual regression | Playwright's built-in screenshot/snapshot testing, self-hosted | Fully open-source and free, no SaaS account needed — trade-off is you host/diff the snapshot artifacts yourself (e.g. as CI artifacts) rather than getting Chromatic's hosted review UI |
| Component workshop | Storybook 8 | OSS; also doubles as living documentation and the base for the future public-hosted instance |
| Docs site (later) | Next.js or Astro (both OSS frameworks) | Pairs naturally with MDX for component docs + the manifest data |
| Static hosting (docs site + Storybook) | GitHub Pages, or Cloudflare Pages free tier | Both free for public/OSS projects with no usage-based billing risk; GitHub Pages is the simplest since the repo is already on GitHub |
| Versioning/release | Changesets | OSS; per-package semver, changelog generation, monorepo-aware |
| Linting/formatting | ESLint + Prettier (shared config package) | OSS; consistency enforced at the workspace level |
| CI | GitHub Actions | Free tier is generous for public repos (unlimited minutes on public repos); build, test, a11y check, visual regression, changeset release pipeline |
| Security: dependency scanning | GitHub Dependabot | Free, native to GitHub; automated PRs for vulnerable/outdated dependencies |
| Security: secret scanning | GitHub secret scanning + push protection | Free for public repos; a repo setting, not a dependency — must be enabled at the GitHub repo level |
| Security: static analysis | GitHub CodeQL | Free for public repos; catches common vulnerability patterns (XSS, injection) in CI |
| Security: publish auth | npm provenance / trusted publishing (OIDC) | No long-lived npm tokens stored as CI secrets; used when the Phase 6 publish pipeline is built |
| Manifest generation | react-docgen-typescript (custom build step in `packages/manifest`) | OSS; extracts props/types/JSDoc into the machine-readable JSON contract for agents |

---

## 4. What's deferred (by design, not forgotten)

- **CLI scaffolder / MCP server** — v1.5+, once component API is stable and manifest is proven accurate
- **React Native primitives** — token layer built to support it; actual RN components are a separate future package (`packages/components-native`)
- **Figma component library** — built from the same token source once tokens are finalized, so Figma variables can mirror the CSS vars 1:1
- **Multi-brand/theme packs beyond light/dark** — architecture supports it (swap `data-theme`), but building 10 themes like Astryx isn't a v1 goal unless you want it to be

---

## Open items for next planning pass
- Full token category breakdown (naming convention, scale values) — was the other option on the table
- Component inventory + atomic tiering (which ~30–40 components make up v1 "complete enough")
- CI/release workflow detail
