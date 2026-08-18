# DBM Design System — Component API & Coding Conventions

**Status: v1 draft.** This is the contract every component follows, regardless of which build phase or Claude Code session creates it. Consistency here is what keeps a 99-component system feeling like one system instead of 99 one-off decisions.

---

## 1. File structure (one folder per component)

```
packages/components/src/{tier}/{ComponentName}/
├── ComponentName.tsx          # implementation
├── ComponentName.module.css   # scoped styles, tokens only
├── ComponentName.types.ts     # exported prop types/interfaces
├── ComponentName.stories.tsx  # Storybook stories, one per variant/state
├── ComponentName.test.tsx     # unit + interaction tests
└── index.ts                   # barrel: re-exports component + types
```

`{tier}` is `atoms`, `molecules`, or `organisms` per `04-component-inventory.md`. Compound components (see §4) get one folder containing all their parts, not one folder per sub-part.

## 2. Naming conventions

- **Component names:** PascalCase, matching the name in `04-component-inventory.md` exactly (`DataTable`, not `DataGrid` or `Table2`).
- **Props:** camelCase. Booleans read naturally without an `is`/`has` prefix when mirroring a native HTML attribute (`disabled`, `required`, `checked` — matches what an agent or developer already knows from HTML). Custom booleans not mirroring HTML use a clear prefix (`isLoading`, `hasError`).
- **Event handler props:** `onXxx` pattern. Use `onChange` only when wrapping a native form element 1:1; use `onValueChange` for custom/controlled values (e.g., `Select`, `Slider`, `DatePicker`) to avoid ambiguity with the native DOM event.
- **Size prop:** always `size`, always the same scale across every component that has one: `xs | sm | md | lg | xl`, mapped to the spacing/icon-size tokens — never invent a component-specific size scale. **Established exception (Phase 3):** components whose `size` drives typography or icon dimensions directly (`Text`, `Heading`, `Icon`) use the *full* underlying token scale instead of this 5-step one — the font-size scale has 11 steps (`xs` through `6xl`, including `base`) and icon-size has 7 (`xs` through `3xl`), and forcing those into the generic 5-step scale would lose real steps the token layer already defines. This still satisfies "never invent a component-specific size scale" — each of these maps onto one canonical, pre-existing token category, just a wider one than spacing/icon-size's default 5.
- **Visual style prop:** always `variant` for stylistic variants (`primary | secondary | tertiary | ghost | destructive`). Never use `type` for this (reserve `type` for native HTML semantics, e.g. `<Input type="email">`).
- **Status/meaning prop:** always `tone` for feedback-type coloring (`info | success | warning | danger | neutral`), kept separate from `variant` — a `variant="ghost"` `Alert` with `tone="danger"` should be a valid, meaningful combination.

## 3. Standard prop patterns every component follows

- **Always `forwardRef`.** Every component forwards its ref to the underlying DOM element — this is required for Radix composition and for consumers who need direct DOM access. **Narrow, explained exception:** a component with no single root DOM node of its own takes no `ref` prop at all, rather than forwarding to an arbitrary/wrong element — e.g. `Tooltip` (trigger is an arbitrary child, content renders in a portal) and `ClientOnly` (renders `children`/`fallback` directly, no wrapper). Each such exception must justify itself in its own component-level JSDoc, matching Radix's own precedent (`Tooltip.Root` itself takes no ref either) — this isn't a license to skip `forwardRef` for convenience.
- **Always extend native props where applicable.** `interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> { variant?: ...; size?: ...; }` — don't redeclare `onClick` or other event handlers that HTML already provides. **Narrow exception (below):** `id`, `className`, `style`, `data-testid`, and whichever `aria-*` props are actually relevant to the component's role DO get explicitly redeclared, purely for documentation visibility.
- **Always accept `className`, `style`, `id`, and `data-testid`.** `className`/`style` are the standard escape hatch (internal styles use CSS Modules, but consumers can extend); `id` is needed whenever another element's `aria-labelledby`/`aria-describedby`/`htmlFor` must point at this component, or a test/router needs a stable anchor; `data-testid` is a plain, behavior-free pass-through for automated testing (Testing Library, Playwright/Cypress). All four already work structurally via `extends ComponentPropsWithoutRef<'element'>` — **except `data-testid`, which isn't part of React's typed HTML attributes at all** and fails to typecheck at a consumer's call site without being explicitly added. Redeclare all four directly in the component's own `*Props` interface, with JSDoc, even though `className`/`style`/`id` are already structurally inherited: **Storybook's default docgen (`react-docgen`, not the TS-checker-based `react-docgen-typescript`) does not reliably surface inherited-only native props in the generated Properties table** — confirmed empirically on `Button`, where `aria-label`/`className`/`data-testid`/`id` were all silently missing from the table until each was given its own local JSDoc'd declaration (see `guidelines/07-storybook-and-documentation-standards.md` §5 for the full finding and the Storybook-side fix when JSDoc alone still isn't enough).
- **Redeclare component-relevant `aria-*` props explicitly**, for the same documentation-visibility reason — not every possible ARIA attribute, just the ones that matter for that component's actual role: `aria-label`/`aria-labelledby` on most interactive atoms (an icon-only control effectively requires one), `aria-pressed` on toggle-style controls, `aria-expanded`/`aria-controls` on disclosure triggers, `aria-haspopup` on menu/dialog triggers, `aria-describedby` on form controls commonly paired with helper/error text. Every component already passes through *any* `aria-*` attribute at runtime via native prop inheritance — this bullet is about making the relevant ones discoverable and documented, not about adding new capability.
- **Controlled/uncontrolled pattern:** any component holding internal state (`Switch`, `Tabs`, `Accordion`, `Select`) accepts both `value`/`onValueChange` (controlled) and `defaultValue` (uncontrolled) — mirroring Radix's own pattern, since we're built on Radix primitives already.
- **Minimize required props.** Every prop should have a sensible default wherever possible — fewer required props means fewer ways for an agent (or a person) to call a component incorrectly. A component should render something reasonable with zero props where that's plausible.
- **`asChild` support** on components where composability matters (`Button`, `Link`, trigger-style components) — follows the same Radix Slot pattern already in use, letting a consumer render the component's behavior onto a different element (e.g., `<Button asChild><Link href="/x">Go</Link></Button>`).
- **`as` vs `asChild` — pick based on where the visual content comes from (established 2026-08-15, via Avatar):** `asChild`/Radix `Slot` fits components whose rendered content genuinely *is* `children` (`Button`'s label, `Link`'s text) — in `asChild` mode, the consumer's child becomes the real element and the component's own generated markup (icon, spinner, etc.) is skipped, which is fine because there wasn't much of it to lose. It does **not** fit a component that generates its own substantial visual content internally from props rather than `children` (`Avatar`'s image/initials/status dot) — `Slot` only merges props onto a single consumer-supplied child, so `asChild` mode there would require the consumer to manually reproduce the component's own rendering. For that case, use the plain polymorphic `as` prop instead (`Stack`/`Container`/`GridItem`'s mechanism) — the component keeps generating all of its own content exactly as usual; only the root element type changes. Radix's own `Avatar` primitive has no `asChild` either, for the same reason — their docs just show wrapping a plain `<button>` around it, which `as` achieves without the extra DOM node.
- **`disabled` on an `as`-polymorphic interactive component:** apply the native `disabled` attribute only when `as` resolves to an element that actually supports it (in practice, `as === "button"`) — passing `disabled` to an arbitrary element type does nothing semantically (an `<a disabled>` is silently ignored by the browser). For every other `as` value, apply `aria-disabled` plus a click-handler guard that blocks the event, mirroring `Button`'s own `asChild`-disabled handling (`05-component-api-conventions.md`'s existing `asChild` precedent) but generalized to the `as` case. The guard should stay focusable rather than being removed from the tab order — matching WAI-ARIA APG guidance for `aria-disabled` (unlike native `disabled`, which does remove focusability) and `Button`'s own tested `asChild`-disabled behavior.

## 4. Compound components

Complex components use the compound-component pattern (matching the Radix primitives underneath, for consistency): `Select.Root`, `Select.Trigger`, `Select.Content`, `Select.Item` rather than one component with 30 flags. Applies to: `Select`, `Tabs`, `Accordion`, `Menu`, `Dialog`, `DataTable` (with `DataTable.Toolbar`, `DataTable.Pagination` as composable sub-parts), `Form`.

## 5. Icon props

Any component with an icon slot accepts a **component reference**, not a string name:
```tsx
import { Wallet } from '@phosphor-icons/react';
<Button leadingIcon={Wallet}>Pay</Button>
```
Not a string enum (`icon="wallet"`) — this keeps tree-shaking intact (unused icons never ship) and gives full type-checking on valid icon references.

**Prop name depends on how many icon slots the component has (established 2026-08-17, via Tag):** a component with exactly **one** icon slot (`IconButton`, `ListItem`) keeps the plain `icon` name — there's no position to disambiguate, so `leadingIcon` alone would read oddly for the common single-icon case. A component with **two** icon slots — one before the label, one after (`Button`, `Tag`) — uses the symmetric `leadingIcon`/`trailingIcon` pair instead of the previous asymmetric `icon`/`trailingIcon`, since an unprefixed `icon` sitting next to `trailingIcon` reads as if it might be the "main" or only icon rather than specifically the leading one. Applies retroactively to any component gaining a second icon slot later, not just new components.

## 6. CSS conventions

- CSS Modules only, class names in camelCase.
- **Every value traces to a token.** `var(--dbm-color-bg-brand)`, `var(--dbm-space-4)` — never a raw hex, px, or arbitrary value in component CSS. If a needed value has no token, add the token first (per `CLAUDE.md` principles), don't inline it "just this once."
- CSS custom property prefix is `--dbm-*` throughout, matching the token spec.
- **Radix `Portal` content needs its own `font-family` — don't assume it inherits (found 2026-08-16, via `Select`):** anything rendered through `<RadixPrimitive.Portal>` mounts at `document.body`, outside the component's own tree — CSS inheritance still applies down the *DOM* tree, but there's nothing upstream of `document.body` in a real consuming app guaranteed to set `font-family: var(--dbm-font-family-primary)`. `Select`'s trigger (`.trigger`, non-portaled) declared its own `font-family` and looked fine; its dropdown (`.content`, portaled) didn't, and silently fell back to the browser default font in any app that doesn't happen to set one globally on `body`/`html`. Every Radix-`Portal`-based component's own top-level portaled class (`Select.module.css`'s `.content`, and the equivalent in `Tooltip`/any future `Dialog`/`Menu`/`Popover`) needs an explicit `font-family` declaration of its own — don't rely on inheriting it from the trigger's tree. Not yet audited across already-shipped portal components other than `Select`; worth a quick check next time one of them is touched.
- **Focus-ring border-radius (established 2026-08-15, via Avatar):** every interactive element's `:focus-visible` outline needs an explicit `border-radius` on the element the outline is drawn on — modern browsers round `outline` to follow it, but only if it's actually set; an interactive element with no declared `border-radius` gets a sharp-cornered outline regardless of how rounded its own visible content looks. Use `var(--dbm-radius-full)` when the element itself is fully round (a circular avatar, a round icon-button); use `var(--dbm-radius-sm)` for everything else, **regardless of that component's own corner radius** — a deliberately standardized, smaller "focus-ring radius" so every square-ish focus ring reads consistently across components, not tied to each one's individual `--dbm-radius-md`/`-lg` visual choice. If the outline lives on an element with no background/border of its own (e.g. an unclipped wrapper, see Avatar's `.root`), this `border-radius` is purely cosmetic for the outline and doesn't affect anything else. Not yet retrofitted onto already-shipped components: Button's own `:focus-visible` outline already follows a radius (`.root`'s own `--dbm-radius-md`, its visible corner treatment, which outline-rounding picks up automatically) rather than this newly-established standardized `sm` — a minor inconsistency with this convention, flagged here as a candidate for a future Button pass, not fixed silently as a side effect of this entry.

## 7. Documentation requirement (definition of "typed")

Every exported component gets a component-level JSDoc block with a usage example; every prop gets an inline JSDoc description. This is what the manifest generator (`packages/manifest`) reads to build the agent-facing component index — undocumented props are invisible to that tooling, not just "less polished."

## 8. Definition of done (per component)

A component isn't complete until all of these are true:
- [ ] Implementation follows the file structure, naming, and prop patterns above
- [ ] Full TypeScript types, no `any`
- [ ] JSDoc on the component and every prop
- [ ] Storybook story covering every variant/size/state combination, including error and disabled states
- [ ] Unit test (React Testing Library) covering rendering and interaction
- [ ] Accessibility test passes (jest-axe/vitest-axe) with zero violations
- [ ] Keyboard navigation verified (tab order, focus visible, escape/enter/arrow behavior where applicable)
- [ ] Any new color pairing introduced is contrast-checked (methodology in `03-token-system-spec.md`), not assumed
- [ ] Exported from the package's public `index.ts`
- [ ] No hardcoded values — everything traces to a token

## 9. Commit & release convention

Conventional Commits format (`feat(button): add loading state`) — this is what allows Changesets to generate accurate changelogs. Every PR/change that affects the public API includes a changeset describing the change from the consumer's point of view.

## Related documents
- `04-component-inventory.md` — what to build, in what order
- `03-token-system-spec.md` — the tokens every value here must trace to
- `02-tech-stack-and-structure.md` — Radix/Motion/testing tooling referenced above
