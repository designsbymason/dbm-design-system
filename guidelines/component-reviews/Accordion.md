# Accordion — Storybook/component review findings

**Overlay & Disclosure:** Accordion — built 2026-09-17, item 9 in the itemized molecule-tier build
order (`04-component-inventory.md`). Adds `@radix-ui/react-accordion` (^1.2.20) as a new dependency.
**Not yet Finalized** — per the standing rule that only the user declares a component's review pass
done, this file records what was built/checked/found, not a self-declared Finalized status.

**The second component in this system exposing real Radix-mirroring compound sub-parts**, after
`Popover`. Composes `Accordion.Item`, `Accordion.Trigger`, `Accordion.Content` inside `Accordion`
itself. Each sub-part's own props get a `### Accordion.{Part} properties` subsection on the Docs
page via a hidden, docs-only stories file per `guidelines/adr/0013` — `AccordionItem.stories.tsx`,
`AccordionTrigger.stories.tsx`, `AccordionContent.stories.tsx`.

## Design decisions made during the build

- **Wraps `@radix-ui/react-accordion` fully (`Root`/`Item`/`Header`/`Trigger`/`Content`) rather than
  literally reusing the `Collapse` atom's own React component for `Accordion.Content`**, correcting
  what both `04-component-inventory.md`'s own Accordion row and `Collapse`'s own component-level
  JSDoc previously assumed. `Accordion.Trigger`/`Accordion.Content` read from the same Radix `Item`
  context to track open state — swapping in `Collapse` for the content half only would either
  duplicate that wiring for no benefit or require re-deriving Radix's own open-state/id-linking/
  keyboard-navigation logic by hand, against [ADR-0004](adr/0004-radix-ui-primitives-for-accessibility-logic.md)'s
  standing rule to lean on Radix rather than hand-roll interaction logic. Recorded as a real
  fork-in-the-road decision: [ADR-0018](adr/0018-accordion-wraps-radix-accordion-content-directly-not-the-collapse-atom.md).
  The animation *technique* is still the same one `Collapse` uses (a measured-height CSS custom
  property driving a `slideDown`/`slideUp` keyframe pair) — just against Radix Accordion's own copy
  of that mechanism (`--radix-accordion-content-height`) instead of Radix Collapsible's.
  **Flagged, not yet fixed:** `Collapse.tsx`'s own component-level JSDoc still states "the building
  block `Accordion` composes for each of its items," which this decision makes inaccurate. `Collapse`
  is Finalized, so per `06-engineering-standards.md` §9's finalization rule this needs explicit
  authorization before editing, even though the fix is doc-only with zero behavioral change (which
  would keep it Finalized once landed, per that same section's three-question test) — surfaced here
  and to the user rather than touched silently.
- **`Accordion.Header` is folded into the exported `Accordion.Trigger`, not a fourth sub-part.**
  Radix's own `Header` is a semantic-only heading wrapper with no visible styling of its own — asking
  a consumer to compose it separately around every `Trigger` would be pure boilerplate with no real
  configurability gained. `Accordion.Trigger` renders `<AccordionPrimitive.Header asChild>` wrapping a
  dynamically-chosen heading tag (`h1`-`h6`, matching `Heading`'s own `elementForLevel` pattern)
  internally instead.
- **`headingLevel` lives on the `Accordion` root, not per-item** — every item in one accordion sits at
  the same depth in the page's own heading outline, so a per-`Accordion.Item`/`Accordion.Trigger`
  override would be a real prop nobody has a reason to actually vary. Propagated via a plain internal
  React Context (`AccordionHeadingLevelContext`), read inside `Accordion.Trigger`. Defaults to `3`,
  matching `Heading`'s own `level` default reasoning (a component this deep in a typical page's
  structure is rarely the `h1`/`h2`).
- **A built-in rotating disclosure-indicator icon (`CaretDownIcon`, rotated 180° via `[data-state=
  "open"]`), not a bare label-only trigger** — comparable production accordion components uniformly
  ship this, and it's the single clearest visual affordance that a trigger is a disclosure control
  rather than a plain heading. Customizable via `icon` (a different Phosphor icon reference) and
  `hideIcon`, matching the icon-prop conventions already established (`05-component-api-conventions.md`
  §5) — same one-icon-slot naming (`icon`, not `leadingIcon`/`trailingIcon`) as `IconButton`/`ListItem`,
  since there's only one icon slot here too.
- **No `overflow: hidden` on the root group**, despite rounding its outer corners. Rounding only the
  first/last item's own trigger corners (`.item:first-child .trigger`/`.item:last-child .trigger`)
  gets the same visually-rounded-group result without it — chosen specifically so the standard
  positive `outline-offset` focus-ring convention (`05-component-api-conventions.md` §6) never gets
  clipped on either end item the way a hidden-overflow wrapper would cut it off. Verified live: a
  keyboard-focused first/last trigger's own ring renders uncropped in both directions.
- **`type="single"` defaults to `collapsible: true`, not Radix's own unset/`false` default.** Radix
  requires `type` with no default at all; this system defaults it to `"single"` and additionally
  defaults `collapsible` to `true` within that mode — with `collapsible: false` and nothing open to
  start, a reader has no way to tell one section is meant to always stay open until they've already
  closed every other one and hit the floor, so `true` is the safer, more discoverable default (flagged
  as a Do/Don't on the Docs page's own Usage guidelines rather than left as a silent trap).
- **No built-in horizontal visual layout for `orientation="horizontal"`** — the prop is forwarded to
  Radix for correct keyboard-arrow-direction/`data-orientation` semantics (parity with `RadioGroup`'s
  own `orientation` convention), but this component's own CSS stays a vertical stack either way,
  documented explicitly on the Docs page rather than silently under-delivering on the prop's name. A
  genuinely side-by-side accordion is a rare enough real-world need that building full horizontal
  layout CSS speculatively would be exactly the kind of un-requested scope `06-engineering-standards.md`
  §9's guardrail warns against; revisit if a real need for it comes up.
- **Discriminated `AccordionSingleProps | AccordionMultipleProps` union, mirroring Radix's own props
  shape** — `value`/`defaultValue`/`onValueChange` are a plain `string` under `type="single"`, a
  `string[]` under `type="multiple"`, and `collapsible` only exists on the `"single"` arm. Implemented
  with zero `any`/casts: two full object literals (one per arm) are each independently assignable to
  `ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>`, assigned to one variable typed as that
  union, which TypeScript accepts without needing to merge the two shapes into one loosely-typed
  object first.

## Baseline correctness

- `forwardRef` on every part (root `<div>`, `Item`, `Trigger`, `Content`); `className`/`style`/`id`/
  `data-testid` accepted and documented on all four.
- `{...props}` spread before each part's own computed attributes throughout (`Accordion.Item`,
  `Accordion.Trigger`, `Accordion.Content` all follow the standing ordering rule from the first
  build, not retrofitted).
- Zero hardcoded values — every color/spacing/radius/typography/motion value in `Accordion.module.css`
  traces to an existing token; no new component-layer token needed (unlike `Popover`'s
  `popover.max-width`) — every value Accordion's own design called for already had a home on an
  existing scale.
- SSR/RSC safety: no module-scope or initial-render `window`/`document` access anywhere in the
  implementation.
- No console noise, no silent `catch` blocks.
- Compound-sub-part completeness, atom-reuse audit (`Icon` reused for the disclosure indicator, same
  as `Select`'s caret), and the Radix-primitive prop audit (traced the full `AccordionPrimitive.Root`/
  `Item`/`Trigger`/`Content` prop surface, not just the first layer, per the lesson `Popover`'s own
  review flagged) were all run as part of this same first pass rather than deferred to a later round.

## Accessibility

- Keyboard/ARIA state verified live and via jest-axe (18 unit tests, zero violations closed/open/
  `type="multiple"`/disabled): `aria-expanded`/`aria-controls` sync automatically, roving `Up`/`Down`
  arrow-key focus between triggers (`Left`/`Right` under `orientation="horizontal"`), `Home`/`End`,
  disabled items skipped by both `Tab` and arrow navigation.
- Real heading semantics via `headingLevel` (default `3`) — verified a focused/opened trigger resolves
  to `role="heading"` at the expected level via Testing Library's own `getByRole("heading", {level}
  )` query, not just visually.

## Theming

Verified live across all 4 themes (Purple/Emerald × light/dark) via the Storybook toolbar — border,
divider, trigger hover/focus, disabled text/icon color, and the content text tone all read correctly
in every combination. No brand-specific token is used anywhere except `border.focus` (already
brand-aware by design).

## Responsiveness

Verified live at mobile width (375px) via the standalone Playground story — trigger label wraps
correctly, no horizontal overflow, disclosure icon stays aligned.

## Storybook documentation

Docs page (`Accordion.mdx`) follows the full `07-storybook-and-documentation-standards.md` §4
template (10 sections plus the visually-hidden Intro heading). Playground drives every `type="single"`
prop live (`defaultValue`, `collapsible`, `disabled`, `orientation`, `headingLevel`); `type`,
`onValueChange`, `dir`, `id`, `className`, `style`, `data-testid` are documented in the Properties
table with `control: false` (the same "no single control shape" treatment `Popover`'s own `side` got
for its responsive-map form) rather than wired into the Playground, since `type` genuinely needs a
different value shape than what the Playground demonstrates — a dedicated `Multiple` story
demonstrates `type="multiple"` instead. Six additional stories cover disabled items, a custom
disclosure icon, a fully custom `asChild` trigger row, a controlled open item, and a `play`-function
interaction test (click to open, `ArrowDown`/`ArrowUp` roving focus, click to close) — all passing
under `@storybook/addon-vitest`'s full browser-mode sweep (67 story files, 483 tests, including the
three hidden sub-part stories).

**Follow-up (2026-09-17, same day), a shared-infrastructure fix found via this component's own
`defaultValue` control.** The `""` option (meaning "nothing open by default") rendered as a
genuinely blank, invisible-text row in the embedded Docs-page Playground's own dropdown — confirmed
directly in the DOM, not just suspected — since `PlaygroundControls.tsx` built every option's label
straight from its own stringified value with no way to override it. Fixed at the shared-block level
(`.storybook/blocks/PlaygroundControls.tsx`, full incident and fix in
`07-storybook-and-documentation-standards.md` §4.1) by adding support for Storybook's own
`argType.control.labels` convention; `Accordion.stories.tsx`'s `defaultValue` argType set
`labels: { "": "None" }`. Verified live: the control displayed "None", the real `defaultValue` arg
stayed `""` (confirmed via the Canvas's own "Show code" panel), and the fix was fully backward
compatible — spot-checked `Select`'s own `size` control and `Icon`'s `mapping`-backed `icon` control,
both unaffected.

**Follow-up (2026-09-17, same day, at explicit direction) — three refinements.**
1. **`labels`' own display text lowercased**, `"None"` → `"none"`, matching this system's other
   option labels (`shipping`/`returns`/`warranty`), none of which are capitalized.
2. **The same blank-pill bug also affected the Docs page's own Properties table** —
   `PropertiesTable.tsx`'s `ValueOptions` had the identical gap as `PlaygroundControls.tsx`
   (building each pill's text straight from `String(option)`, with no override), so the `""` option
   rendered as an invisible pill there too, not just in the Playground's own control. Fixed the same
   way: `PropertiesTable.tsx`'s `ArgTypeLike` now also reads `argType.control.labels`, falling back
   to `String(option)` when unset — same backward-compatible pattern, spot-checked against `Select`'s
   own `defaultValue` table row (unaffected). Both fixes now documented together in
   `07-storybook-and-documentation-standards.md` §4.1.
3. **`Accordion.Trigger`'s hover background moved from `bg.neutral-subtle` to
   `bg.brand-subtle-hover`** (`Accordion.module.css`'s `.trigger:hover:not(:disabled)`, and the
   Design tokens table's own row) — a deliberate brand-tinted hover instead of a neutral one.
   Contrast unaffected in either direction: `text.primary` (the trigger label) against
   `brand-subtle-hover` is comfortably high-contrast in all 4 themes (the token's own light value is
   a pale brand tint, `purple.100`/`emerald.100`; its dark value, `gray.800`, is shared and unchanged
   from before), confirmed live across all 4 brand/mode combinations.

Re-verified after all three: `tsc --noEmit` (both tsconfigs), `eslint --max-warnings 0`, the full
Vitest `unit` project (1376 tests), `storybook build`, and both bundle-size tripwires — all clean.

**Follow-up (2026-09-17, same day, at explicit direction) — trigger hover token revised again**,
`bg.brand-subtle-hover` → `bg.brand-subtle` (`Accordion.module.css`'s `.trigger:hover:not(:disabled)`
and the Design tokens table's own row, both updated). Verified live across all 4 brand/mode
combinations, including a direct `getComputedStyle` check against the built primitive values (not
just eyeballed): Emerald/Light resolves to `rgb(247, 251, 250)`, an exact match for `emerald.50`;
Purple/Dark resolves to `rgb(36, 34, 42)`, an exact match for `gray.950` — confirming `bg.brand-subtle`
is applying correctly even where the effect reads as a subtle darkening rather than a visible
lightening (dark mode's own value, `gray.950`, is shared across brands and slightly darker than the
group's own `bg.surface`/`gray.900`, unlike the light-mode pale-tint case). Re-verified: `tsc
--noEmit`, `eslint --max-warnings 0`, the full Vitest `unit` project (1376 tests) — all clean.

## Functional verification

- 18 unit tests (React Testing Library + jest-axe), all passing: render, click-to-open/close, single-
  vs-multiple exclusivity, `collapsible={false}`, controlled `value`/`onValueChange`, `defaultValue`,
  per-item and accordion-wide `disabled`, roving arrow-key focus, `headingLevel` (custom and default),
  `asChild` trigger, `hideIcon`, ref forwarding, and three separate jest-axe zero-violations checks
  (closed/open, `type="multiple"` with several open, accordion-wide disabled).
- `tsc --noEmit` (both the main and `.storybook` tsconfigs), `eslint --max-warnings 0`, the full
  Vitest `unit` project (1376 tests) and `storybook` project (483 tests), `tsup` build, and a real
  `storybook build` all pass clean. Per-component bundle size: 1.23KB JS / 0.80KB CSS gzipped — well
  within the established budget. Storybook static build and its largest chunk both within budget.
- Visually verified live in a running Storybook instance: Playground interactivity (single-open
  exclusivity, `type="multiple"` independence), every variant gallery story, all four Properties
  tables (root + three sub-parts), Design tokens table swatches, Related Components cards, and all
  four brand/mode theme combinations.
