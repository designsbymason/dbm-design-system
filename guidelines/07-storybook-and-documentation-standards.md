# DBM Design System — Storybook & Documentation Standards

**Status: v1 draft.** Companion to `05-component-api-conventions.md` (the API contract) and `06-engineering-standards.md` §9 (the atom review rubric) — this doc covers a third, Storybook-specific dimension: how a component's *documentation and interactive showcase* meet the same "premium, comprehensive, agent-legible" bar the component code itself must meet. Established 2026-07-26, at the start of the post-Phase-4.75 Storybook refinement pass, so the plan and processing order survive a context reset.

---

## 1. Why this pass exists

Phase 4.5 and 4.75 verified every atom's code (props, tokens, a11y, responsiveness, stability) and shipped a Storybook story file per component. But a spot-check of `Button.stories.tsx` — one of the most mature stories in the library — surfaced real gaps common to *every* component, not just a few:

- No documentation/autodocs infrastructure exists at all — only `@storybook/addon-a11y` is installed. No `@storybook/addon-docs`, no `tags: ["autodocs"]`, no MDX. There is currently no "Docs" page for any component.
- Controls are inconsistently interactive. Enum props (`variant`, `size`) often have proper `select` controls, but component-reference props (`icon`) have no `argTypes` entry at all (Storybook renders a useless control for these unless explicitly disabled with `control: false`). Showcase stories like `AllVariants`/`AllSizes` use `render: () => (...)` with hardcoded values — they don't respond to the Controls panel at all.
- No Playground story exists anywhere — nowhere can a user drive every prop of a component live, in one place.
- The Storybook sidebar taxonomy has quietly diverged from `04-component-inventory.md`'s 9 functional categories — an inherited-from-Phase-3 "Atoms/Core" catch-all mixes components that the inventory actually splits across Inputs and Data Display.

None of this is a per-component bug; it's a systemic gap in what "done" meant for Storybook when Phases 3/4.5/4.75 shipped. This pass closes it, one component at a time, applying a consistent standard.

## 2. Storybook infrastructure additions (one-time, done before any component work)

Approved 2026-07-26:

- **`@storybook/addon-docs`** — enables the "Docs" tab / autodocs page per component. Required for §4 below.
- **`@storybook/addon-viewport`** — replaces the ad-hoc one-off "NarrowViewport" stories several components have with a proper, systematic responsive-testing toolbar control.
- **Interaction/play-function testing** — Storybook's `play` function support (via whatever the current Storybook 10 package/import path is for `expect`/`userEvent`/`within` — verify the exact package name at install time, since Storybook 8+ consolidated a lot of this into the core `storybook` package's subpath exports rather than separate npm packages) — in scope for this pass, not deferred. Every interactive component gets at least one `play`-function story scripting its core interaction (click, keyboard nav, focus) so behavior is verified visually in Storybook, not only in Vitest.

All are first-party Storybook packages (same tool already approved in `02-tech-stack-and-structure.md`), registered in `.storybook/main.ts`'s `addons` array alongside the existing `@storybook/addon-a11y`.

## 3. Sidebar taxonomy (corrected to match the inventory, with one rename)

`04-component-inventory.md`'s 9 functional categories are the source of truth. Storybook titles use shortened labels for a few (matching what's already in use where sensible), with one deliberate rename:

| Inventory category | Storybook title prefix | Note |
|---|---|---|
| 1. Layout | `Atoms/Layout` | unchanged |
| 2. Typography | `Atoms/Typography` | unchanged |
| 3. Inputs & Forms | **`Atoms/Inputs`** | **renamed** — shortened per direct request; the old "Atoms/Forms" group (FieldLabel/FieldError/FieldHelperText) merges in here too, alongside the old "Atoms/Core" input-y components |
| 4. Data Display | `Atoms/Data Display` | old "Atoms/Core" splits: Avatar/Badge/Skeleton/Tag move here |
| 5. Navigation | `Atoms/Navigation` | unchanged |
| 6. Feedback | `Atoms/Feedback` | unchanged |
| 7. Overlay & Disclosure | `Atoms/Overlay` | shortened |
| 8. Media | `Atoms/Media` | unchanged |
| 9. Utility | `Atoms/Utility` | unchanged |

No more "Atoms/Core" — every component's title prefix now matches exactly one inventory category.

## 4. The Docs page template

One hand-authored `ComponentName.mdx` file per component (via `@storybook/addon-docs`), set as the **first entry** in that component's Storybook group (before Playground and every other story). Auto-generated docs (`tags: ["autodocs"]` alone) can't produce the prose sections below, so every component gets a real MDX file that embeds live `<Canvas>`/`<Controls>` blocks from the Playground story where useful, interleaved with hand-written content. Sections, in order:

1. **Intro** (added 2026-07-27, revised same day; renamed from "Overview" 2026-08-08 — "Overview" collided in meaning with the `Foundations/Overview` *page*, and "Intro" reads more accurately as "the top of this page" for both component and Foundations docs once §7 adopted the same pattern) — title + tier badge via `<ComponentHeader>`, then the one-paragraph description, with **Import as a nested `### Import` subsection right underneath it** (not its own top-level section — folded in since it's a single code block, not substantial enough to earn its own tab). The section needs a heading for the TOC (§4.1) to produce an "Intro" entry at all, but an actual visible `## Intro` label reads as redundant directly under the big `<ComponentHeader>` title — resolved by keeping a real `## Intro` heading in the DOM but visually hiding it via `<VisuallyHidden asChild><h2>Intro</h2></VisuallyHidden>` (the same real, tested atom used for icon-only labels elsewhere), placed *before* `<ComponentHeader>` so the TOC's "Intro" entry scrolls all the way to the top of the page, title included. tocbot (the TOC's underlying library) reads heading text directly from the DOM regardless of visibility, so this costs nothing functionally.
2. **Interactive Playground** — the Playground story's live canvas, then **below it** a single-card, controls-only panel laid out in **2 columns** of label+control pairs (not a full Description/Default table, and not beside the canvas — see §4.1's `.dbm-playground-controls` layout). **Exclude any prop whose control isn't actually editable** (i.e. anything with `control: false`, explicit or inferred — `onClick` and other function props, `asChild`, `id`, `className`, `data-testid`, etc.) via `<Controls exclude={[...]}>` — these still show up in the Properties table below with a full description, but a row reading just "–" in the Playground is dead space with nothing for the reader to actually do, per the whole point of a *Playground* being interactive. `exclude` needs to be listed explicitly (Storybook's `PropDescriptor` type is `string[] | RegExp`, no predicate-function support) and kept in sync by hand with whichever props end up with `control: false` — there's no automatic way to detect this from the story file's own unresolved `argTypes` object, since some props (bare function args like `onClick`) only get `control: false` via Storybook's own implicit inference, not anything explicitly written in the story.
3. **Properties table** — prop name, **value options**, description, default, required/optional — via the custom `<PropertiesTable>` block (§4.1), not the stock `<ArgTypes>` doc block, which has no "value options" column. Sourced from the component's TypeScript types + JSDoc (the same JSDoc that feeds the future manifest generator — this is a second, immediate payoff for keeping it complete). **Every prop needs a real, non-empty description — no exceptions, including "obvious" native props** (`children`, `onClick`, `disabled`, `style`, etc.) — confirmed on `Button`/`Box`: several purely-native props docgen extracts with an empty `description` rather than dropping the row, which reads as broken/incomplete now that the table makes blanks visible via an em dash. Fix via an explicit `description` in the story file's `argTypes` (§4.1's `<PropertiesTable>` entry has more on why this is the reliable mechanism), not by hoping JSDoc alone gets picked up. **Row order must read sensibly** — content prop first, then core visual props (`variant`/`size`), then behavioral/state props, then advanced/escape-hatch props (`asChild`, `className`, `id`, `data-testid`) last — passed explicitly via `<PropertiesTable>`'s `order` prop, not left to whatever order docgen happens to produce (confirmed unpredictable — see §4.1). Check this deliberately for every component, don't assume the default order is already sensible.
4. **Variants / states gallery** — a static visual reference of every variant × size × state combination (distinct from the interactive Playground — an at-a-glance comparison). **Every story in this section gets its own `###` subheading** (the story's display name) directly above its `<Canvas>` — bare, unlabeled Canvas blocks in sequence give the reader no way to tell what they're looking at without reading source, and unlabeled subheadings also mean the TOC can't show them either.
5. **Usage guidelines** — Do's and Don'ts, concrete not generic ("Do use `destructive` for irreversible actions" not "use variants appropriately").
6. **Best practices** — the judgment-level guidance a senior designer/engineer would give a newcomer using this component.
7. **Accessibility** — keyboard interaction table, ARIA attributes the component sets and why, screen reader behavior notes, any contrast pairings worth calling out.
8. **Code examples** — copyable snippets for the common real-world usage patterns, beyond what the props table alone conveys.
9. **Design tokens used** — which semantic tokens this component consumes (a DBM-specific addition beyond generic DS docs — doubles as a visible, honest confirmation of "no hardcoded values" for anyone auditing the component).
10. **Related components** — cross-links (e.g. `Input` ↔ `Textarea`, `FieldLabel`, future `FormField`).

**Editorial bar (confirmed on `Box`, 2026-07-26):** the Docs page is a reference source a complete newcomer to DBM — human or agent — should be able to read and fully understand, not just a props reference for people who already know the system. Concretely: **define any technical/jargon term the first time it's used**, not just deployed as if the reader already knows it (caught in practice: "polymorphic" appeared in `Box.mdx`'s opening sentence with no definition, even though the whole rest of the paragraph explained the *mechanism* — fixed by defining the term inline on first use). When a concept is foundational to the whole system rather than one component (e.g. the polymorphic-`as` pattern, used by `Box`, `Stack`, `Text`, `Heading`, `Center`, and others), define it thoroughly once in whichever component is most foundational to it — `Box` for polymorphism — and have every other component's docs cross-link to that explanation via Related Components instead of re-explaining it each time.

**Never reference an internal `guidelines/*.md` path in visible page content** (component Docs pages or Foundations pages alike) — those documents are internal-only working notes for building this library, not something a consumer of the published package or hosted Storybook should see cited as a source. Caught on the Foundations Color page (2026-07-27): its Contrast verification section cited `guidelines/03-token-system-spec.md` by path directly in reader-facing prose — removed, since the underlying claim ("checked against real WCAG ratios") stands on its own without pointing at an internal doc the reader can't access. This is distinct from source-code comments (`.storybook/**/*.ts(x)`, `.css`) citing a guideline for a future maintainer's benefit — those are fine, since they aren't rendered to a Storybook visitor.

### 4.1 Visual presentation layer (confirmed on `Box`/`Button`, 2026-07-26)

Beyond content and structure, the Docs page has a dedicated visual-polish layer — a custom Storybook theme, global CSS, and a small set of reusable MDX-only components — so every component's Docs page reads as a premium, cohesive reference rather than Storybook's default unstyled autodocs output. None of this ships in the published `@dbm-design-system/components` package; it lives entirely under `packages/components/.storybook/` and is wired in via `preview.tsx`'s `docs` parameter.

**Shared infrastructure (one-time, applies to every component automatically):**
- **`.storybook/theme.ts`** — two `create()`-based Storybook themes (light/dark, mirroring the same semantic step selections as the design system's own `--dbm-*` tokens), applied reactively: `.storybook/manager.ts` listens for the Mode toolbar global via the addons channel and re-calls `addons.setConfig({ theme })` on change; `.storybook/DbmDocsContainer.tsx` (wired via `parameters.docs.container`) does the same for the Docs addon's own wrapper/typography. Manager chrome and the Docs wrapper now track the same Brand/Mode toggle that themes previewed components, rather than staying fixed light.
- **`.storybook/docs.css`** — global typography/table/Canvas styling scoped to Storybook's real, DOM-confirmed class names (`.sbdocs-content`, `.sbdocs-preview`, `.docblock-argstable*`) — do not guess class names; verify them in the rendered DOM first, since Storybook styles most elements via hashed CSS-in-JS classes with no stable selector.
- **`parameters.docs.toc: { headingSelector: "h2" }`** (in `preview.tsx`) — enables the built-in sticky table of contents automatically for every Docs page; no per-component setup needed. **Restricted to `h2` only** (the library default is `h2, h3`) so the TOC reflects just the template's fixed section list (§4's 10 items — note "Import" isn't one of them; it's nested under Intro as an `h3` and deliberately has no TOC entry of its own) — identical across every component — rather than also indexing each component's own `h3` variant subheadings (item 4), which differ per component and would turn the TOC into a per-component variant list instead of a consistent, reusable page nav. This is what makes "the same tab labels on every Docs page" actually true, rather than aspirational — verify it by comparing two different components' rendered TOCs side by side, not just one.
- **`minHeight` in the shared `withTheme` decorator is conditional on `context.viewMode === "docs"`** (undefined there, `100vh` in standalone story view) — without this, every Canvas block embedded in a Docs page gets a huge empty-space bug below the actual component.
- **`.sbdocs-content h2`'s `margin-block` needs `!important` on the top value** (found 2026-07-27, auditing section-spacing consistency): Storybook's own MDX stylesheet has a `:first-of-type` rule (`margin-top: 0`) that's genuinely *more specific* than `.sbdocs-content h2` (not a tie, unlike the code-pill case below), so it silently won margin-top for whichever `##` section happened to be first in a page's DOM — collapsing that one section's gap to ~16px instead of the intended 40px used everywhere else. Invisible on every `ComponentName.mdx`, since the actual first h2 there is the visually-hidden "Intro" heading (§4 item 1) absorbing the zeroed margin harmlessly — and, since 2026-08-08, every Foundations page has the equivalent hidden heading too (§7.2), so this is no longer a Foundations-specific gap either. Confirmed via computed `margin-top` (`0px` vs `40px`) across multiple Foundations pages before fixing, and re-measured all 10 Foundations pages plus Button/Box afterward (every section gap exactly 40px) rather than assumed from one instance.

**Per-component MDX building blocks (import from `.storybook/blocks`, use in every `ComponentName.mdx`):**
- **`<ComponentHeader title="X" tier="Atom|Molecule|Organism|Template" />`** — replaces the plain `<Title />` doc block. Renders the component name plus a tier badge (using DBM's own `Badge` atom) so a reader immediately knows where the component sits in the atomic hierarchy. Use in place of `<Title />` at the top of every Docs page.
- **`<Callout tone="success|danger|info" title="...">...markdown children...</Callout>`** — styled callout box (icon + tinted background) replacing plain markdown for: the Do/Don't pair under Usage guidelines (`success/danger`, laid out as a 2-column grid — see Box/Button for the exact grid wrapper), and the Accessibility section (`info`, wrapping the whole section body, with a specific descriptive title rather than the generic word "Accessibility" — e.g. Box's "No built-in semantics — as is what makes this accessible").
- **`<TokenRow token="bg.brand" usage="..." />`** — replaces the old plain markdown token table. One row per token. Color-category tokens (`bg.*`/`text.*`/`border.*`/`icon.*`) render a live swatch resolved from the actual CSS custom property, so it reflects the current theme; non-color tokens (`space.*`, `radius.*`, `font-*`, `motion.*`, `opacity.*`) render with no swatch since a colored square wouldn't mean anything for them. Split any compound "token A / token B" table row from the old format into one `<TokenRow>` per distinct token — each color token should get its own swatch. Non-color token *ranges* (e.g. `space.1`–`space.6` for a per-size scale) may stay combined in one row, since there's no swatch to lose by doing so.
- **`<RelatedCard name="..." description="..." href="...">...live mini-preview...</RelatedCard>`** — replaces the old plain markdown related-components link list. Each card is a small live rendering of the related component (real components, not screenshots) plus its name/description, laid out in a `repeat(3, 1fr)` grid (see Box/Button for the exact grid wrapper). The mini-preview should be small and representative (a few colored squares for a layout primitive, one real instance for an interactive atom) — not a full demo.
- **`<PropertiesTable of={ComponentStories} order={[...]} />`** (added 2026-07-27) — replaces `<ArgTypes of={ComponentStories} />` for the "Properties" section. A fully custom table (`.storybook/blocks/PropertiesTable.tsx`), not a themed version of Storybook's own — **the stock `<ArgTypes>`/`<Controls>` doc blocks have no supported way to add a custom column**, confirmed by reading their actual prop types (`ArgTypesProps`/`ControlsProps` only accept `of`/`include`/`exclude`/`sort`); adding "Value options" required resolving the raw argTypes data ourselves via the officially-exported `useOf(of, ["meta"])` hook and rendering our own `<table>`. Columns: Name, **Value options** (the literal set of values a prop accepts — enum members as `<code>` pills, `true`/`false` for booleans, an em dash for freeform/function props — computed from `argType.options` and `argType.type.name`, not shown anywhere in the stock table), Description, Default. The `order` prop is a plain string array forcing display order explicitly (see the row-order requirement in §4 item 3) — every prop should be listed, in the sequence the checklist calls for. Alternating row background (both here and the Controls table) is the primitive `--dbm-color-purple-200`, not a gray. **Revised 2026-07-27:** originally used the semantic `bg.brand-subtle` (purple-100), which is technically on-brand but reads as plain gray at that lightness once spread across a whole stripe — purple-200 is the first step that's actually recognizable as a light primary tint on screen. This is a deliberate, documented exception to "semantic tokens only" (`CLAUDE.md`) — there's no semantic step between `bg.brand-subtle` and the much stronger `bg.brand-hover`, and this is presentational Storybook docs chrome, not shipped component code.

**Playground layout (added 2026-07-27, revised twice same day):** wrap the Canvas and Controls as two siblings — `<div className="dbm-playground-canvas"><Canvas .../></div>` then `<div className="dbm-playground-controls"><Controls exclude={[...]} .../></div>` — directly in the MDX flow, no outer flex wrapper (see Box/Button for the exact markup, including the blank lines MDX needs around nested JSX to keep parsing `<Canvas>`/`<Controls>` as components rather than literal text; and see §4 item 2 for what `exclude` should contain and why). Controls render **below** the Canvas, not beside it — a side-by-side split was tried first and reverted, since a 2-column control grid needs the full content width to stay readable.

`docs.css` handles the rest: `.dbm-playground-controls` hides the Controls block's header row plus its Description/Default columns via `nth-child` (leaving only Name, reading as a label, and the live Control widget — real, still-interactive Storybook controls, not a re-implementation), then lays the remaining Name/Control rows out via **CSS multi-column** (`column-count: 2` on the table body, `break-inside: avoid` + `display: flex` on each row) inside **one single card** (`border`/`radius`/`background` on the `<table>` element itself) — collapsing to 1 column under a `40rem` viewport. Two real bugs found and fixed here, in order:
1. **Do not implement the 2-column reflow as `display: contents` on the table's thead/tbody/tr with `display: grid` on the table itself** — tried first, and it silently breaks every control widget: a `<td>` left at its default `display: table-cell` still runs the CSS table sizing algorithm for its own content even once its ancestors are flattened via `display: contents`, which collapses `width: 100%` inputs/textareas to a near-zero intrinsic width and wraps their content one character per line. Multi-column (above) sidesteps this entirely since the table keeps its native `display: table` layout.
2. **Once `<tr>` is forced to `display: flex`** (needed to keep each row's Name/Control pair side by side inside the multi-column flow), **every `<td>`'s own default border renders in full** instead of merging into a single-pixel shared line the way `border-collapse` merges them under real table-row layout — the practical symptom is every row looking like its own separate bordered card instead of one unified table. Fixed by stripping `border` on both `tr`/`td` entirely and drawing exactly one border, on the `<table>` element, plus a `border-block-end` on each `tr` for the row-divider look.

Both are exactly the kind of bug that only shows up as a screenshot, not as a lint/type error — visual verification (next paragraph) is what caught both. **Verify at a real desktop width, not just the default test-harness viewport** — the automated browser preview tools default to a narrow (~800px) pane; resize explicitly (e.g. 1400×900) before judging this section.

**Verification requirement:** after writing/retrofitting any `ComponentName.mdx`, visually verify it in a running Storybook instance (via the browser preview tools, not just `tsc`/lint) — confirm the TOC appears, every Callout renders with the correct tone/icon, every RelatedCard's live preview actually renders (not a broken import), and the Properties/token tables are styled — before considering that component's Docs page done. `tsc --noEmit` passing only proves the MDX compiles; it does not prove the page renders correctly.

## 5. Per-component checklist

Applied to every component, in this order:

**Component correctness**
- [ ] Re-verify full definition-of-done (`05-component-api-conventions.md` §8) — don't assume it still holds
- [ ] Feature-completeness pass against comparable components in MUI/Chakra/Ant/Radix for the same role — name any concrete gap before adding anything (existing guardrail, `06-engineering-standards.md` §9)
- [ ] Required/recommended props present and sensibly defaulted
- [ ] Zero hardcoded values — grep-verify every CSS value traces to a token
- [ ] JSDoc complete on the component and every prop

**Storybook**
- [ ] `title` corrected to the taxonomy in §3
- [ ] Docs page per the §4 template, first in the group, using the shared visual-presentation blocks from §4.1 (`ComponentHeader`, `Callout`, `TokenRow`, `RelatedCard`, `PropertiesTable`) rather than plain `<Title />`/`<ArgTypes>`/markdown — verified visually in a running Storybook instance, not just typechecked
- [ ] `PropertiesTable`'s `order` prop lists every prop in a sequence that actually reads sensibly (content prop → core visual props → behavioral/state props → advanced/escape-hatch props last) — don't assume docgen's default order is already sensible, it usually isn't (see §4 item 4). Every `Canvas` in the Variants section has its own `###` subheading directly above it, matching the story's display name.
- [ ] Playground story, second in the group — every prop wired through `args`/`argTypes`, nothing hardcoded via a bare `render`
- [ ] Every controllable prop has an explicit value in the Playground's top-level `args`, matching its real component default — an arg left `undefined` renders as an inert "Set boolean"/"Set string"/"Set object" placeholder button instead of a live, interactive control (confirmed empirically on `Button` — `isLoading`/`loadingText`/`fullWidth` all showed as placeholders until given explicit defaults)
- [ ] Every enum-like prop gets an explicit `select`/`radio` control; non-controllable props (icon references, refs, and any inherited native prop Storybook's docgen can't cleanly infer — e.g. `Button`'s native `type` fell back to a broken "Set object" control) get `control: false` explicitly — check the full rendered Properties table for stray placeholders, not just the props you deliberately typed
- [ ] Every explicitly-redeclared native prop (`className`, `style`, `id`, `data-testid`, the relevant `aria-*` props — see `05-component-api-conventions.md` §3) actually appears in the rendered Properties table with its description, not just in the source. **Confirmed real bug on `Button`, 2026-07-27:** Storybook's default docgen (`react-docgen`, babel/AST-based — `@storybook/react-vite`'s default, not the TS-checker-based `react-docgen-typescript`) silently dropped `aria-label`/`aria-labelledby`/`className`/`id`/`data-testid` from the extracted table even though each had its own local JSDoc'd declaration in the `*Props` interface — while a sibling redeclared prop (`type`) showed up fine, for reasons that didn't reduce to one clean rule under inspection. JSDoc on the type alone is not sufficient evidence of a working Properties table entry — visually check the rendered table (per the §4.1 verification requirement) for every prop you expect to see. When docgen drops one, the reliable fix is the same pattern already used for `icon`/`trailingIcon`/`type`: add an explicit `argTypes` entry in the story file with its own `description` (and `control: false` for props like `id`/`data-testid`/`className` that aren't meaningfully live-editable).
- [ ] Every row in the rendered Properties table has a non-empty Description — a different failure mode than the previous bullet (the row exists, but docgen extracted no JSDoc text for it). Confirmed on `Button`/`Box`: plain native props (`children`, `disabled`, `onClick`, `style`) commonly come through with an empty description even though the row itself renders fine. Fix the same way — an explicit `description` in the story file's `argTypes`.
- [ ] Docs page has the visually-hidden `<VisuallyHidden asChild><h2>Intro</h2></VisuallyHidden>` before `<ComponentHeader>` (see §4 item 1), `### Import` nested under it (not its own `##` section), and every other template section's `##` heading text matches §4's list verbatim — the TOC (§4.1) is generated from these headings, so a typo'd or reworded section title silently breaks "the same tabs on every page." `<Controls exclude={[...]}>` in the Playground lists every prop with a non-editable control (see §4 item 2) — check the rendered Playground for stray "–" rows, which mean something was missed.
- [ ] At least one `play`-function interaction story for interactive components
- [ ] Remaining showcase stories (`AllVariants`, etc.) audited — kept where they add value as static references, converted to args-driven where feasible, removed if redundant with the Playground/Docs gallery
- [ ] Visual correctness spot-check across all 4 themes (both brands × light/dark)
- [ ] Dead/redundant stories cleaned up, consistent naming

## 6. Processing order

Foundational components first (prove the template before mass-applying it), then category by category:

**Phase A — template-proving:**
1. Box
2. Button
3. Input
4. Icon
5. Text

**Layout** (remaining): Stack, Grid, GridItem, Container, Divider, Spacer, AspectRatio, Center, Bleed, Affix

**Typography** (remaining): Heading, Link, Code, Blockquote, List, ListItem, Kbd, Highlight

**Inputs** (remaining): IconButton, CloseButton, Textarea, Checkbox, Switch, FieldLabel, FieldError, FieldHelperText

**Data Display**: Badge, Tag, Avatar, Skeleton

**Navigation**: BackToTop

**Feedback**: ProgressBar, ProgressCircle, Spinner

**Overlay**: Tooltip, Collapse, Backdrop

**Media** (remaining): Image, Indicators

**Utility**: ThemeProvider, Portal, VisuallyHidden, FocusTrap, ClientOnly

49 components total. Mark each done here (or reference the tracked task list) as the pass proceeds, so a context reset doesn't lose progress.

## 7. Foundations pages (added 2026-07-27)

A second top-level Storybook sidebar group, **`Foundations`**, sorted to appear *before* `Atoms` (see the `groupPriority` array in `preview.tsx`'s `storySort` — top-level group order isn't alphabetical by default, so this needs to be forced explicitly). Ten standalone reference pages — no components, no stories, pure documentation — covering every token category shipped in `packages/tokens`, organized the way mature design systems (Material, Carbon, Polaris, Atlassian) converge on: one page per token category, Color and Typography given the most detail since they're the highest-leverage/most-consulted categories.

**Page list, in reading order** (`packages/components/src/foundations/*.mdx`, each a standalone `<Meta title="Foundations/X" />` page — no `of=` prop, since there's no component/story behind them): Overview, Color, Typography, Spacing, Radius, Shadows, Motion, IconSizes, Miscellaneous (border width + opacity + z-index, grouped — each alone would be a near-empty page), Breakpoints. The explicit `foundationsOrder` array in `storySort` keeps this exact sequence, since alphabetical would scatter `Overview` into the middle.

**Data source — read live, never retyped by hand:** every value on every Foundations page comes directly from `@dbm-design-system/tokens`'s built JS export (`import { primitives } from "@dbm-design-system/tokens"`) rather than being copied from the JSON source or hardcoded in the MDX. This means the pages can never drift from the real token values — if a token changes, these pages reflect it automatically on the next build. Semantic (per-theme) tokens use the same `var(--dbm-{token})` CSS-custom-property mechanism `TokenRow` already established for component docs (§4.1), so they're live-reactive to the Brand/Mode toolbar exactly like every other themed swatch in this project.

**Shared blocks** (`.storybook/blocks/foundations/*.tsx`, separate from the component-docs blocks in `.storybook/blocks/` directly, imported via `.storybook/blocks/foundations`): `ColorScaleGrid`/`ColorSwatch` (primitive color scales), `SemanticSwatchGrid` (theme-reactive semantic color tokens), `SpacingScale` (bar-chart visualization), `RadiusScale` (rounded-box visualization), `ShadowScale` (elevation cards on a light/dark-matched background), `MotionScale` (replayable animated demo, isolating the duration axis and easing axis separately rather than a combinatorial grid of both), `TypeSpecimen` (font-size scale at real rendered size), `IconSizeScale` (the real `Icon` atom at each size step), `TokenReferenceTable` (generic Name/Value/Usage table, reusing `.dbm-proptable` styling for the small non-visual scales).

### 7.1 `<ThemeSync />` — a real bug, not a nice-to-have

**Every Foundations page must render `<ThemeSync />`** (from `.storybook/blocks/foundations`) once, anywhere in the file. Without it, every semantic-token swatch, every `RelatedCard` border, anything referencing `var(--dbm-bg-*)`/`text-*`/`border-*`/`icon-*` on that page silently resolves to nothing.

**Root cause:** `preview.tsx`'s `withTheme` decorator — the thing that sets `document.documentElement.dataset.theme` from the Brand/Mode toolbar globals, which is what makes the theme-scoped semantic CSS (`:root[data-theme="..."] { ... }`) resolve at all — only runs when Storybook renders an actual **story**. Every component's `ComponentName.mdx` embeds at least one `<Canvas>`, so the decorator fires there as a side effect and the attribute ends up set for the whole page (it's a shared `document.documentElement` mutation, not scoped to the Canvas). A Foundations page has zero `<Canvas>`/`<Story>` blocks — pure prose and custom React components — so the decorator never runs, and `data-theme` is simply never set. Confirmed by checking `getComputedStyle(document.documentElement).getPropertyValue('--dbm-border-default')` on a Foundations page before this fix: empty string.

**Fix (`.storybook/blocks/foundations/ThemeSync.tsx`) — two real, separately-diagnosed bugs, not a first-try success:**
1. Listening for `GLOBALS_UPDATED` (the natural-sounding choice) doesn't work — that confirmation event only round-trips back through the channel once the preview's story-rendering machinery has an active story to apply the globals change to, which a story-less page never has. `UPDATE_GLOBALS` (the *command* the manager UI sends on every toolbar interaction, imported from `storybook/internal/core-events`) fires reliably regardless of any story — but only carries the *changed* keys (e.g. `{ mode: "dark" }`, not the full globals object), so it has to be merged onto a running snapshot rather than treated as a full replacement.
2. That running snapshot can't live in a plain `useState`/`useRef`-from-a-hardcoded-default — a globals change re-renders the whole Docs container (so embedded previews elsewhere on the page pick up the new globals too), which **remounts** `ThemeSync`, which reset the snapshot straight back to its hardcoded default and silently clobbered the change that had just been applied one render earlier. Diagnosed by logging mount/event order directly (`console.log` in the effect, temporarily) and seeing mount → event received → **immediate remount** → theme visibly reverts. Fixed by bootstrapping the snapshot by reading `document.documentElement.dataset.theme` back off the DOM on mount instead of a fixed default — the attribute itself survives the remount even though this component's own React state doesn't.

Both bugs were invisible to `tsc`/`eslint`/`vitest` — the only way either surfaced was live browser verification (capturing real channel events via `window.__STORYBOOK_ADDONS_CHANNEL__` and checking the resolved custom property value), reinforcing the standing rule in §4.1: visually verify in a running Storybook instance, don't infer correctness from a clean typecheck.

### 7.2 `<VisuallyHidden asChild><h2>Intro</h2></VisuallyHidden>` (added 2026-08-08)

**Every Foundations page must render this heading too**, immediately after `<ThemeSync />` and before the page's real `# Title`, mirroring the component-docs pattern in §4 item 1: it gives the TOC (§4.1) an "Intro" entry that scrolls to the very top of the page, and — same mechanism as §4.1's `.sbdocs-content h2` note above — makes the page's real first visible section (e.g. "Primitive scales" on the Color page) benefit from the same `:first-of-type`-collision workaround that component pages already got for free from their own hidden heading. Import: `import { VisuallyHidden } from "../atoms/VisuallyHidden";` (relative to `src/foundations/`).

## 8. Token usage in Storybook-only code (audited 2026-08-08)

Everything under `.storybook/` and every `*.stories.tsx`/Foundations `*.mdx` file is Storybook tooling, not shipped component code — but per `CLAUDE.md`'s token-first rule, it should still reference `var(--dbm-*)` tokens wherever a token exists, rather than hardcoding. A full audit (2026-08-08) found and fixed ~140 hardcoded values across `.storybook/blocks/`, Foundations docs pages, and component story demo wrappers — border widths and sizes that matched an existing token exactly, plus a few real bugs (`theme.ts`'s `appBorderRadius`/`inputBorderRadius` were mislabeled, off by 2px from the tokens their own comments named).

Three standing exceptions, not oversights:
- **`.storybook/theme.ts`** — Storybook's `theming/create()` API takes a literal JS object read by the manager UI, which runs outside our CSS entirely; every hex/px value there is traced to its source token in an inline comment instead.
- **CSS media-query breakpoints** (`docs.css`) — `var()` cannot appear inside an `@media` condition; these stay literal, cross-referenced to the matching `breakpoint.*` token in a comment.
- **Story-file demo-wrapper container sizing** (`width`/`maxWidth`/`height` on a story's outer wrapper `<div>`, e.g. `maxWidth: "24rem"` around an Input demo) — the `space.*` scale tops out at `space.32` (8rem) and is calibrated for gaps/padding/margins, not arbitrary layout container widths; forcing these onto the nearest token would visibly cramp story layouts. Left as literals — a deliberate scope boundary, not a gap to close later.

## 9. Manager-chrome customizations are version-fragile — re-verify after any Storybook upgrade

`.storybook/manager.ts`'s sidebar/mobile-drawer customizations (brand logo layout, Settings-gear repositioning, the mobile popover, Close-button position, theme-sync via the addons channel) rely on Storybook internals that are not a stable public contract, not the official theming API:
- `SET_GLOBALS`/`UPDATE_GLOBALS` imported from `storybook/internal/core-events` — the `/internal/` path is explicitly unstable.
- CSS overrides keyed to `aria-label`/DOM structure discovered by inspecting rendered output (`.sidebar-header`, `button[aria-label="Settings"]`, `a[aria-label="About Storybook"]`, etc.), not documented Storybook API.
- The mobile popover's capture-phase click interception, which depends on how Storybook currently wires its own click handling.

**After merging any Storybook version bump (Dependabot PR or manual), manually re-verify in the browser, both desktop and mobile viewports, both light/dark:** the brand logo layout, the Settings gear popover (desktop) and its mobile-popover equivalent, the mobile drawer's Close-button position, and Brand/Mode theme-sync across the sidebar/toolbar/panel/Foundations pages. A clean `pnpm install`/build passing is not sufficient evidence these still work — they can silently stop matching without any error.

## Related documents
- `03-token-system-spec.md` — the token architecture/values the Foundations pages (§7) present visually; that doc is the source of truth for *why* a value is what it is (contrast checks, anchor colors, build-pipeline decisions), the Foundations pages are the live, browsable *what*
- `04-component-inventory.md` — the category taxonomy this doc's Storybook titles must match
- `05-component-api-conventions.md` — the component-level API contract this pass re-verifies
- `06-engineering-standards.md` §9 — the atom review rubric this pass builds on
