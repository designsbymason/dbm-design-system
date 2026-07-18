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

- **Always `forwardRef`.** Every component forwards its ref to the underlying DOM element, no exceptions — this is required for Radix composition and for consumers who need direct DOM access.
- **Always extend native props where applicable.** `interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> { variant?: ...; size?: ...; }` — never redeclare `onClick`, `id`, `aria-*`, etc. that HTML already provides.
- **Always accept `className` and `style`.** The escape hatch every component needs; internal styles use CSS Modules, but consumers can extend.
- **Controlled/uncontrolled pattern:** any component holding internal state (`Switch`, `Tabs`, `Accordion`, `Select`) accepts both `value`/`onValueChange` (controlled) and `defaultValue` (uncontrolled) — mirroring Radix's own pattern, since we're built on Radix primitives already.
- **Minimize required props.** Every prop should have a sensible default wherever possible — fewer required props means fewer ways for an agent (or a person) to call a component incorrectly. A component should render something reasonable with zero props where that's plausible.
- **`asChild` support** on components where composability matters (`Button`, `Link`, trigger-style components) — follows the same Radix Slot pattern already in use, letting a consumer render the component's behavior onto a different element (e.g., `<Button asChild><Link href="/x">Go</Link></Button>`).

## 4. Compound components

Complex components use the compound-component pattern (matching the Radix primitives underneath, for consistency): `Select.Root`, `Select.Trigger`, `Select.Content`, `Select.Item` rather than one component with 30 flags. Applies to: `Select`, `Tabs`, `Accordion`, `Menu`, `Dialog`, `DataTable` (with `DataTable.Toolbar`, `DataTable.Pagination` as composable sub-parts), `Form`.

## 5. Icon props

Any component with an icon slot (leading/trailing icon on `Button`, `Input`, `Alert`, etc.) accepts a **component reference**, not a string name:
```tsx
import { Wallet } from '@phosphor-icons/react';
<Button icon={Wallet}>Pay</Button>
```
Not a string enum (`icon="wallet"`) — this keeps tree-shaking intact (unused icons never ship) and gives full type-checking on valid icon references.

## 6. CSS conventions

- CSS Modules only, class names in camelCase.
- **Every value traces to a token.** `var(--dbm-color-bg-brand)`, `var(--dbm-space-4)` — never a raw hex, px, or arbitrary value in component CSS. If a needed value has no token, add the token first (per `CLAUDE.md` principles), don't inline it "just this once."
- CSS custom property prefix is `--dbm-*` throughout, matching the token spec.

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
