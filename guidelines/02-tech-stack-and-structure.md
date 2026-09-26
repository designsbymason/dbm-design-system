# DBM Design System — Monorepo Structure & Tech Stack

## 1. Accessibility primitives

Radix UI Primitives (`@radix-ui/react-*`) is the foundational, unstyled dependency for interaction/accessibility logic — see `guidelines/adr/0004` for why (over hand-rolling it) and what that decision constrains going forward.

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
│   │   │   └── component/       # One file per component that needs one — avatar.json, badge.json,
│   │   │                        # icon-button.json, ...
│   │   ├── style-dictionary.config.js
│   │   └── build/                # generated: css vars, JS/TS exports, (later) RN objects
│   │
│   ├── primitives/               # Small framework-agnostic utils, not a Radix wrapper (see note below)
│   │   └── src/
│   │       ├── hooks/            # useResolvedResponsiveValue, useAnnouncement, usePersistentDismiss
│   │       ├── utils/            # cx (classname merging), mergeRefs, responsiveStyle
│   │       └── types/            # shared token types
│   │
│   ├── icons/                    # Phosphor wrapper — curated re-export + typed icon prop
│   │   └── src/
│   │
│   ├── components/                # The actual DBM component library (this is the npm package)
│   │   ├── src/
│   │   │   ├── atoms/            # Built: Avatar, Badge, Button, GridItem, Icon, Input... (48 shipped so far, including Radio — see ADR-0012 for GridItem/ListItem's own tier history and ADR-0014 for Radio's)
│   │   │   ├── molecules/        # Built so far (22): Accordion, Alert, Breadcrumb, ButtonGroup, Card, CheckboxGroup, EmptyState, FormField, Grid, List, NumberInput, Pagination, PasswordInput, Popover, RadioGroup, RangeSlider, SearchInput, Select, Slider, Table, Tabs, ToggleGroup — the rest still open
│   │   │   ├── organisms/        # Not started yet — DataTable, Modal, Navbar, CommandPalette, Form...
│   │   │   ├── templates/        # Not started yet — page-level layout scaffolds (optional, later)
│   │   │   ├── foundations/      # Storybook-only Foundations pages (*.mdx) — not shipped in the package
│   │   │   ├── styles/           # global.css, resets, css var consumption
│   │   │   ├── snippetHelpers.ts # helpers for the "Show code" snippet builders — docs-only, not shipped
│   │   │   └── storySnippets.test.ts  # guard test for every *.snippets.ts (ADR-0020)
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

**What `primitives` actually holds (corrected 2026-09-10 — this table above previously described it as a Radix-wrapping headless behavior layer with `hooks/`/`components/` subdirectories; that was aspirational and never matched what got built):** in practice, every component that needs Radix imports `@radix-ui/react-*` directly (`Tooltip.tsx`, `Select.tsx`, `FocusTrap.tsx`, `Switch.tsx`, etc., all as direct dependencies of `packages/components`) — `primitives` never became an intermediary wrapping layer, and has no Radix dependency of its own. What it actually holds today is a small set of framework-agnostic utils genuinely shared across components: `cx` (classname merging), `mergeRefs`, `responsiveStyle`, shared token types, and (since 2026-09-17) a first real shared hook — `useResolvedResponsiveValue` (`hooks/`), and (since 2026-09-20) a second, `useAnnouncement` — the timing half of announcing something to a screen reader (put the text into an already-present live region a moment later, then clear it), extracted when `Pagination` became a second consumer after `EmptyState`'s `announce`; `EmptyState`'s `announce` was moved onto it afterwards (2026-09-20), so both consumers share it. The first hook, extracted from `Divider`'s own local `useResolvedOrientation` once `Popover`'s `side` needed the identical `matchMedia`-based resolution logic for a non-CSS-driven responsive value. Initially left `Divider`'s own file as its own local implementation rather than retroactively migrating it (it was already Finalized, and the standing rule is not to touch a Finalized component's files without asking first, even for a DRY win) — the user authorized the follow-up migration the same day, so `Divider.tsx` now calls the shared hook directly and `useResolvedOrientation.ts` no longer exists (per the three-question finalization test, this stayed a zero-visible-output internal refactor, so `Divider` remained Finalized without a re-review — see `component-reviews/Divider.md`). `FocusTrap` and friends still each implement their own Radix-wrapping logic directly in `packages/components`; `useControllableState` or similar can still land in `primitives` too if a real need comes up. **A third hook, `usePersistentDismiss` (2026-09-23, for `Alert`, see [ADR-0023](adr/0023-one-alert-with-banner-and-sticky-options-and-a-separate-persistence-hook.md)),** remembers a dismissal across visits, and — unlike the two above, which only components use — is meant to be called by a consumer, so `packages/components/src/index.ts` re-exports it (and its types) from `primitives`: one install covers it. **It also re-exports the three helper types thirteen components' public props use — `Breakpoint`, `Responsive`, `SpaceValue`** — for a consumer writing a typed wrapper (type-only, no bundle cost; a test in `src/test/publicExports.test.ts` asserts they are the very types `primitives` defines). Re-export only what a consumer is meant to call or name, never the internals (`cx`, `mergeRefs`, `useAnnouncement`, `useResolvedResponsiveValue`). **Icons are deliberately not re-exported:** `@dbm-design-system/icons` is the whole Phosphor set, whose `Icon` type would collide with this package's own `Icon` component, so a consumer imports icons from that package (a documented second import, not a second copy of everything).

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
| Motion | CSS transitions/keyframes by default; Motion (Framer Motion successor) as an **optional peer dependency** for complex sequences | Keeps the core dependency-light; consumers who don't need rich motion don't pay for it. **Approved, not yet integrated (confirmed 2026-08-31 audit):** no component has needed a Motion-driven sequence yet — every micro-interaction shipped so far (Badge's pop, Checkbox's indicator fade-in, etc.) has stayed within plain CSS transitions/keyframes, so `motion` doesn't appear in any `package.json` yet. This is expected, not a gap — it stays an *optional* peer, added the first time a component genuinely needs it, not pre-installed speculatively. |
| Build (component packages) | tsup (esbuild-based) | Fast, simple ESM+CJS+d.ts output, minimal config |
| Testing (unit/behavior) | Vitest + React Testing Library | Fast, ESM-native, pairs well with Vite/tsup toolchain |
| Accessibility testing | jest-axe | Automated a11y regression checks per component. Settled on jest-axe over vitest-axe during Phase 3 — vitest-axe was a single early (0.1.0, Jan 2025) release with no follow-up, while jest-axe (10.0.0, actively maintained) works fine under Vitest since Vitest's `expect` is Jest-API-compatible |
| Visual regression | Playwright's built-in screenshot/snapshot testing, self-hosted | Fully open-source and free, no SaaS account needed — trade-off is you host/diff the snapshot artifacts yourself (e.g. as CI artifacts) rather than getting Chromatic's hosted review UI. **Screenshot baselines are per-platform** (Playwright suffixes each with the OS): `e2e/visual.spec.ts-snapshots/*-darwin.png` for local macOS runs and `*-linux.png` for CI's Ubuntu runner, both committed. A Linux baseline can't be generated on a Mac — after an intentional visual change, regenerate `-darwin` locally with `pnpm test:visual:update`, then for `-linux` push, let the `browser-tests` job write its actual image, and copy it out of that run's `playwright-report` artifact (`gh run download <id> -n playwright-report`; the one `.png` under `data/`) into the snapshots folder. Playwright's webServer command starts Storybook with `pnpm storybook --ci --quiet` — no `--` before the flags (pnpm 11 forwards it literally and Storybook exits), a failure that only appears in CI because locally the running dev server is reused. |
| Component workshop | Storybook 10 | OSS; also doubles as living documentation and the base for the future public-hosted instance. Originally pinned at 8 during planning; bumped to 10 in Phase 3 when 8 turned out to be two majors behind with React 19 peer-dependency friction — confirmed with the maintainer before deviating |
| Component/story testing | `@storybook/addon-vitest` (Vitest browser mode, `@vitest/browser-playwright` provider, reuses the already-approved Playwright install) | Added 2026-08-16. Runs every story — and critically every story's `play` function — as a real Vitest test in an actual Chromium instance, closing a real gap: play-function interactions previously only ran when a human manually opened that story's Interactions tab, with no CI signal if one broke. Also what the Accessibility addon's automatic scan is gated behind in this Storybook version — see `guidelines/adr/0003` for the root cause and full reasoning. Dev-only, never shipped in `@dbm-design-system/components` — same category as Storybook/Vitest/Playwright themselves, not subject to the runtime dependency budget in `CLAUDE.md`. Two commands: `pnpm test:storybook` (one-shot, what CI runs, works standalone with no dev server since Vite loads stories directly) and `pnpm test:storybook:watch` (must run alongside `pnpm storybook` for the live sidebar indicators/Accessibility panel to have anything to report — confirmed empirically, registering the addon alone isn't sufficient). A second, browser-mode Vitest project (`vitest.config.ts`'s `test.projects`) sits alongside the existing jsdom `unit` project; deliberately does *not* inherit `src/test/setup.ts`, which stubs several browser APIs jsdom lacks (matchMedia, ResizeObserver, etc.) — correct for jsdom, actively wrong in a real browser where those already work. |
| Docs-page Markdown extensions | `remark-gfm` | Added 2026-09-09, during `FocusTrap`'s own review. This Storybook install's MDX compiler (`@storybook/addon-docs`) has no GFM (GitHub-Flavored Markdown) support out of the box — a plain `\| Key \| Behavior \|`-style table in a `ComponentName.mdx` Docs page rendered as raw, unparsed pipe/dash text instead of an actual table, confirmed live before fixing. Wired in via `.storybook/main.ts`'s `addons` array, registering `@storybook/addon-docs` in its object form with `options.mdxPluginOptions.mdxCompileOptions.remarkPlugins: [remarkGfm]` (the addon's own documented extension point — `main.ts`'s top-level `StorybookConfig` type has no generic `options` field of its own to hang this off of). Dev-only Storybook tooling, never shipped in `@dbm-design-system/components` — same category as Storybook itself, not subject to the runtime dependency budget in `CLAUDE.md`. Verified via `pnpm build-storybook` + `pnpm check-storybook-bundle-size` (still within budget) and a live table render, both light/dark. |
| Docs site (later) | Next.js or Astro (both OSS frameworks) | Pairs naturally with MDX for component docs + the manifest data |
| Static hosting (docs site + Storybook) | GitHub Pages, or Cloudflare Pages free tier | Both free for public/OSS projects with no usage-based billing risk; GitHub Pages is the simplest since the repo is already on GitHub |
| Versioning/release | Changesets | OSS; per-package semver, changelog generation, monorepo-aware. **Configured, not yet wired into CI (audited 2026-08-29):** `.changeset/config.json` exists and `pnpm changeset` works locally, but no workflow runs `changeset version`/`changeset publish` — there's no `changesets/action` step or separate release workflow in `.github/workflows/`. Building that pipeline is explicitly Phase 8 scope (`01-vision-and-goals.md` §13), not something already running; don't describe it as a current CI step (see the CI row below, corrected the same day for exactly this). |
| Linting/formatting | ESLint + Prettier (shared config package) | OSS; consistency enforced at the workspace level |
| CI | GitHub Actions | Free tier is generous for public repos (unlimited minutes on public repos); lint (incl. `.storybook` typecheck), build, a Foundations token-coverage check, `pnpm audit`, `build-storybook` + a bundle-size tripwire, test, visual regression. The audit/`build-storybook`/bundle-size steps were added 2026-08-12 — previously aspirational; the Foundations token-coverage check was added 2026-08-16, runs right after `build` (see `06-engineering-standards.md` §4 and `07-storybook-and-documentation-standards.md` §10 for what each actually checks). Two jobs: `ci` (lint/build/checks/`test`) and `browser-tests` (visual regression +, added 2026-08-16, `test:storybook` — the new `@storybook/addon-vitest` project above — sharing one job since both need the same workspace-build-plus-Playwright setup). **`browser-tests` is pinned to `ubuntu-24.04`, not `ubuntu-latest`** (2026-09-20): it installs Chromium's OS packages and compares a screenshot against a baseline rendered on that image, and `ubuntu-latest` moves to 26.04 gradually between 2026-10-19 and 2026-11-19, which could flip a run between images. A second, informational `ubuntu-26.04` leg (`continue-on-error`) shows whether it passes; each leg uploads its own `playwright-report-<os>` artifact. `ci` and CodeQL stay on `ubuntu-latest`. **Every Action is pinned to a major that runs on a supported Node runtime** (Node 24 as of 2026-09-20; the workflow files in `.github/workflows/` are the source of truth for the exact versions, which are deliberately not listed here so they can't go stale). GitHub removes the Node 20 runtime from runners on 2026-09-23, and every pin declared `node20` before the 2026-09-20 bump. §3.2 covers keeping them current. **Corrected 2026-08-29 (routine guidelines-vs-repo audit):** this row previously also listed "changeset release pipeline" as something CI runs — it doesn't yet; see the Versioning/release row above for the actual current state. |
| Security: dependency scanning | GitHub Dependabot (alerts and security updates), plus `pnpm audit` in CI | Free, native to GitHub. **Version updates are off** (`open-pull-requests-limit: 0` in `.github/dependabot.yml`): pull requests are disabled on this repo (sole maintainer, no external PRs), so Dependabot could only push branches nobody sees or CI-tests. Vulnerabilities are handled by hand per §3.1 below; routine updates, including the GitHub Actions pins in `.github/workflows/`, are taken in a periodic manual refresh pass (`pnpm update`, full CI, check the Actions versions). Turning version updates back on means enabling pull requests and raising those limits. |
| Security: secret scanning | GitHub secret scanning + push protection | Free for public repos; a repo setting, not a dependency — must be enabled at the GitHub repo level. **Verified enabled 2026-09-20** (secret scanning and push protection both on, via the repo API), along with Dependabot security updates; no open Dependabot alerts at that date. |
| Security: static analysis | GitHub CodeQL | Free for public repos; catches common vulnerability patterns (XSS, injection) in CI |
| Security: publish auth | npm provenance / trusted publishing (OIDC) | No long-lived npm tokens stored as CI secrets; used when the Phase 8 publish pipeline is built |
| Manifest generation | react-docgen-typescript (custom build step in `packages/manifest`) | OSS; extracts props/types/JSDoc into the machine-readable JSON contract for agents. **Planned tool choice, not yet built (confirmed 2026-08-31 audit) — `packages/manifest` is still Phase 1 scaffolding**: `src/index.ts` is an empty `export {}`, `package.json` is at `0.0.0` with no `react-docgen-typescript` dependency yet. This is expected — Phase 8 (`01-vision-and-goals.md` §13) is when this actually gets built; don't read this row as describing something already running. |

---

## 3.1 Dependency vulnerability remediation pattern

When `pnpm audit` or a GitHub Dependabot alert flags a vulnerable package, check whether it's a **direct** dependency (bump it normally in the relevant `package.json`) or a **transitive** one pulled in by a tool we don't control the version of — this project's dependencies are almost entirely dev/build tooling (ESLint, Storybook, Vite, Vitest, Changesets), so it's usually the latter. For transitive vulnerabilities, force the resolution via `pnpm-workspace.yaml`'s top-level `overrides` field rather than waiting on the upstream consumer to bump it, following the pattern established fixing CVE-2026-14257/CVE-2026-69152 (`brace-expansion`) and a five-package sweep (`undici`, `brace-expansion`, `js-yaml` ×2, `nanoid`, `postcss`) on 2026-08-08 — both in git history if you need the full incident write-ups. Three real gotchas found empirically while doing this, not theoretical:

- **Cap the upper bound, don't just set a floor.** `undici: ">=7.29.0"` (the literal patched-version floor from the advisory) let pnpm resolve to `undici@8.10.0` — the latest version satisfying that open-ended constraint — which broke every test run: `jsdom` does an internal deep `require()` into `undici`'s own file layout (not its public API) at a path that only exists in the 7.x line `jsdom` actually declares support for. The fix was `">=7.29.0 <8.0.0"`. Always check what major the actual consumer's own `package.json` declares support for (`pnpm view <consumer>@<version> dependencies`) before writing an override, and cap to match unless you've separately verified the next major is compatible.
- **A version bump can break a consumer relying on undocumented internals or a changed export shape** — not just via the major-version case above. Fixing `brace-expansion` (a callable-default export in 1.x, a named `{ expand }` export from 2.x on) for a consumer still on `minimatch@3.1.5` (the last-ever 3.x release, hard-coded to the old shape) required pairing the override with a `patchedDependencies` entry (a 2-line pnpm patch shimming the old call site to accept either export shape) — a bare override alone crashed every lint run with `"expand is not a function"`. If a plain override breaks something, check whether the failure is really a compatibility-shape mismatch before assuming the override itself is wrong.
- **The same package can exist at multiple coexisting majors in the tree**, each wanted by a different consumer — `js-yaml` appeared as both 3.x (via `read-yaml-file`) and 4.x (via `@changesets/parse`), both themselves only reached through `@changesets/cli`. A single blanket `js-yaml: ">=X"` key can't patch both independently without either colliding or accidentally forcing one consumer onto the wrong major. Use pnpm's parent-scoped override syntax instead — `read-yaml-file>js-yaml: ">=3.15.1 <4.0.0"` and `"@changesets/parse>js-yaml": ">=4.3.1"` — so each major gets patched in place.

**Always verify after any override change**, not just `pnpm install` succeeding: `pnpm audit` (should report zero known vulnerabilities), then the full pipeline — `tsc --noEmit`, `eslint`, the full Vitest suite, and a real `pnpm -r build` across the workspace — since a broken transitive resolution (like the `undici`/`jsdom` case above) surfaces as a runtime failure in tooling, not a type or lint error.

## 3.2 Manual dependency-refresh pass

Dependabot version updates are off ([ADR-0022](adr/0022-dependency-updates-are-a-manual-refresh-pass-not-dependabot-version-prs.md)), so nothing prompts a routine update: it is a deliberate pass, not a reaction. Vulnerabilities are separate — §3.1, handled whenever `pnpm audit` or an alert flags one.

**Cadence:** every few weeks, and before a release. There is no automated reminder.

**The pass:**
1. Review `pnpm outdated -r`, then update.
2. Run locally what CI runs — `pnpm audit`, `pnpm lint`, `pnpm build`, `pnpm test`, and `pnpm --filter @dbm-design-system/components test:storybook` for the real-browser project — then push and read the CI result.
3. **GitHub Actions pins** in `.github/workflows/`: for each `uses:`, check for a newer major and read the `runs.using` runtime in that version's `action.yml`. Every pin should declare a runtime GitHub still supports (`node24` as of 2026-09; a Node 20 removal was what forced the bump on 2026-09-20). Read its release notes against the inputs the workflows actually pass it, not against everything it accepts.
4. After a Storybook bump, re-verify per `07-storybook-and-documentation-standards.md` §9. After a Playwright bump, confirm it supports the Ubuntu image `browser-tests` runs on (support arrives per Playwright version; Ubuntu 26.04 needed 1.61 or later) and that the visual baseline still matches.

**Testing a workflow change.** CI triggers only on pushes to `main` and on pull requests, and pull requests are disabled, so there is no branch a workflow can be tried on: the only real test is a push to `main`.
- Keep such changes small, one concern per commit, and validate the YAML locally first.
- For anything uncertain, add an informational leg (`continue-on-error: true`) instead of changing the required one.
- A `continue-on-error` job shows green even when a step failed, so read its per-step results.
- `actions/upload-artifact` v4 and later rejects two uploads of the same artifact name in one run, so matrix legs need distinct names.

**Scheduled maintenance:**
- After GitHub finishes moving `ubuntu-latest` to Ubuntu 26.04 (its stated window is 2026-10-19 to 2026-11-19): drop the `ubuntu-24.04` pin and the informational `ubuntu-26.04` leg on `browser-tests`, returning it to `ubuntu-latest`, provided the 26.04 leg has stayed green (every step passed on its first run, 2026-09-20). Keep the pin instead if it has flaked, and check whether GitHub has announced when the 24.04 image goes away — the announcement gave no date. Then update the CI row above.
- Phase 8: the release flow versus disabled pull requests — `01-vision-and-goals.md` §13.

---

## 4. What's deferred

See `01-vision-and-goals.md` §6 ("Explicitly deferred") — the authoritative, complete list. Not duplicated here to avoid the two copies drifting out of sync with each other.
