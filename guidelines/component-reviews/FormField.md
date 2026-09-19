# FormField — Storybook/component review findings

**Inputs & Forms:** FormField — initial build + full `06-engineering-standards.md` §9 review pass
complete (2026-09-14), item 3 in the itemized molecule-tier build order
(`04-component-inventory.md`), built immediately after `CheckboxGroup` (item 1) and
`RadioGroup`/`Radio` (item 2 and its prerequisite). This is the component the §9 checklist's own
"Cross-part ARIA/id wiring" checkpoint (added 2026-09-10) was written specifically anticipating —
the first component in this system composing a label, an arbitrary control, and helper/error text
as genuinely separate pieces.

**Architecture: see [ADR-0015](../adr/0015-formfield-render-prop-over-cloneelement-or-shared-context.md)
for the full decision.** `FormField` has to wire ids/`aria-describedby` between a label, an
arbitrary control (`Input`, `Textarea`, `Checkbox`, `RadioGroup`, `CheckboxGroup`, `Select`, and any
future one), and helper/error text — a problem this codebase had no existing pattern for. Presented
three real options (clone the control via `cloneElement`; a shared context every control atom opts
into; compute the props and hand them back via a render-prop `children`), asked which was correct
independent of implementation effort rather than which was easiest — user chose the render-prop.
Zero changes needed to any existing control atom as a result — every one of them already accepts
the exact shape `FormField` hands back (`id`, `aria-labelledby`, `aria-describedby`, `hasError`,
`disabled`, `required`), confirmed by reading `Input`/`Textarea`/`Checkbox`/`Switch`/`RadioGroup`/
`CheckboxGroup`/`Select`'s own prop types before committing to the design, not assumed.

**`error` alone marks the field invalid — no separate `hasError` boolean.** Its mere presence is
what computes `hasError: true` in the handed-back field props and swaps `FieldHelperText` out for
`FieldError`; `helperText` and `error` are deliberately mutually exclusive (matching the common
"one message at a time" convention in comparable form components) rather than stacking both, so a field never shows two lines of
possibly-conflicting guidance at once.

**Molecule composition checkpoints (`06-engineering-standards.md` §9):**
- **Compound-component sub-part completeness** — not applicable; `FormField` isn't a compound
  component (confirmed against `05-component-api-conventions.md` §4's explicit list, which names
  `Form` but not `FormField` — a deliberate signal this component takes flat props plus a
  render-prop `children`, not `FormField.Label`/`FormField.Control` sub-parts).
- **Atom-reuse audit** — composes `FieldLabel`/`FieldHelperText`/`FieldError` directly, no
  reimplementation of any of their markup or styling.
- **Consumed-atom defect handling** — none found in any of the three Field* atoms. One *apparent*
  finding turned out to be an already-known, already-accepted exemption, not a new defect (see
  below) — correctly classified as such rather than reflexively escalated.
- **Radix-primitive prop audit** — not applicable; `FormField` wraps no Radix primitive itself (the
  controls it labels might, but that's each control atom's own concern).
- **Cross-part ARIA/id wiring** — the checkpoint this component exists to satisfy. Verified by hand,
  not assumed: two dedicated interaction stories (`WiringInteraction`, `ClickLabelInteraction`) with
  real `play` functions asserting the actual resolved `aria-describedby`/accessible-name/focus
  behavior in a real browser, not just that ids were passed as props. Both `PASS`.
- **Composed tab order** — not a distinct concern here the way it is for `RadioGroup`/
  `CheckboxGroup` (which manage tab order across *multiple* same-type children); `FormField` composes
  exactly one control, whose own tab behavior is unchanged by being wrapped.

**Real ARIA finding investigated, correctly classified as already-known, not new — the "Disabled"
row's `FieldHelperText` failed the Storybook a11y addon's color-contrast check.** Traced to the
already-established, already-accepted `text.disabled` exemption (`FieldHelperText.stories.tsx`'s own
`Disabled` story, `FieldLabel.stories.tsx`'s own, `FieldError.stories.tsx`'s own, and
`Text.stories.tsx`'s own `AllColors` story all carry the identical `a11y: { test: "todo" }`
annotation with the identical "2.32:1... WCAG 2.1 excludes inactive/disabled UI components from
1.4.3" reasoning, dated 2026-08-16) — not a new defect introduced by this build. It surfaced here
for the first time because this is the first story to exercise `FieldHelperText`'s disabled state
via `aria-describedby` rather than as part of a native `disabled` control's own `<label for>`
relationship (which axe already recognizes and exempts on its own — confirmed by cross-checking why
`Checkbox`'s/`RadioGroup`'s own "Disabled" stories, whose label text sits inside a `<label>`
directly wrapping the disabled control, never tripped this same check). Applied the identical,
already-established `a11y: { test: "todo" }` annotation to `FormField`'s own `States` story, scoped
to that one story (matching `Text.stories.tsx`'s own precedent of annotating the whole
multi-row gallery, not splitting the known-exempt row into its own story) — not a new precedent, the
same one applied consistently.

**Self-verification, all real runs:**
- `tsc --noEmit` (package + `.storybook`): clean
- `eslint --max-warnings 0`: clean
- Vitest `unit` project: 1221/1221 whole package (`FormField` 15/15)
- Vitest `storybook` (browser-mode play-function/a11y) project: 414/414 whole package (`FormField`
  6/6, including both interaction stories — `PASS`)
- `tsup` build: clean, all four output targets
- `check-component-bundle-size`: `FormField` 1.17KB JS / 0.57KB CSS gzipped, within budget
- `build-storybook` + `check-storybook-bundle-size`: clean, within budget
- Live-verified in a running Storybook instance: Docs page (all sections, Playground live —
  typing into the `error` control live-swaps helper text for the error message and red border),
  `Wrapping different control types` (all five composed control types — `Input`, `Textarea`,
  `Checkbox`, `RadioGroup`, `CheckboxGroup`, `Select` — zero Accessibility-panel violations across
  all of them), `States` (all 4 rows correctly distinct; the known/accepted `text.disabled` finding
  visible in the live panel as expected, per `test: "todo"`'s own intended behavior — surfaced for
  human awareness, not hidden, while not failing the automated suite), `Controlled, with live
  validation` (typing an invalid email live-shows the error), both interaction stories replayed and
  confirmed `PASS`, all 4 themes (Purple/Emerald × Light/Dark)
- Confirmed sidebar placement: **Molecules → Inputs → FormField**, per the taxonomy in
  `07-storybook-and-documentation-standards.md` §3

**Post-review fix (user-reported, 2026-09-14): `error`'s raw Controls-panel row showed an inert
"Set string" placeholder instead of a live text control.** Exactly the gap `07-storybook-and-
documentation-standards.md` §5 already warns about — `error` had `control: "text"` in `argTypes`
but no explicit value in `meta.args`, so Storybook's native Controls addon (the "Controls" tab on
an individual story page — a separate mechanism from the Docs page's own custom
`PlaygroundControls`, which happens to fall back to an empty string on its own and so never showed
this) rendered the inert placeholder button an `undefined` arg always produces, regardless of its
declared control type. Fixed by adding `error: ""` to `meta.args`, matching every other
controllable prop's own explicit-default treatment. Confirmed live: the raw Controls panel now
shows a real "Edit string..." text box, typing into it live-swaps the canvas from `helperText` to
the error message exactly as the Docs page's own Playground already did, and `children` correctly
shows `-` (a render-prop function genuinely has no live control, per the same guideline). Full
re-run: `tsc`, `eslint --max-warnings 0`, Vitest `unit` (15/15 for `FormField`) and `storybook`
(6/6) — all clean.

**Final review pass (2026-09-14, at explicit user request before Finalization).** Re-read every file
fresh end to end (`FormField.tsx`, `FormField.types.ts`, `FormField.module.css`,
`FormField.stories.tsx`, `FormField.test.tsx`, `FormField.mdx`, `index.ts`, plus the three
cross-linked atoms' own `.mdx` files) rather than assuming the incremental build already covered
everything — same discipline as every prior finalization pass this session. Found and fixed two
real test-coverage gaps (no defects in the component's own rendered behavior):
1. **No test verified `size` actually reaches `FieldLabel`** — the prop was wired correctly in
   `FormField.tsx` from the start, but nothing asserted it, and the default (`'md'`) had no
   regression coverage either. Added a test covering both the default and an explicit override,
   confirmed live in the Playground (`size="xl"` visibly scales the label).
2. **The `id`-override test only checked the control's own derived id**, not that
   `aria-labelledby`/`aria-describedby` derive from the same base consistently — a real gap, since
   all four ids (`{base}-control`/`-label`/`-helper`/`-error`) come from the same `baseId` logic and
   only one was actually exercised. Strengthened the existing test to assert all three ids
   (`FieldLabel`'s own `id`, `FieldHelperText`'s own `id`, and the control's `aria-labelledby`/
   `aria-describedby`) resolve to the expected `{base}-*` values together.

Investigated one apparent inconsistency that turned out to be pre-existing, not introduced by this
build: `FieldLabel`'s own `RelatedCard` links to its `--playground` story rather than its `--docs`
page in this component's own `.mdx`, unlike `FieldHelperText`'s/`FieldError`'s own cards (which do
link `--docs`). Confirmed this exact same `--playground` link is already used identically in
`RadioGroup.mdx`, `CheckboxGroup.mdx`, `FieldError.mdx`, and `FieldHelperText.mdx` — a pre-existing,
consistent (if seemingly odd) convention across the whole system, not a `FormField`-specific defect
to fix here.

No other gaps found — the render-prop wiring, the mutual-exclusivity of `helperText`/`error`, the
disabled/required cascades, and every story/example held up under a fresh read. Full
re-verification, whole package: `tsc` (package + `.storybook`), `eslint --max-warnings 0`, Vitest
`unit` (1222/1222 whole package; `FormField` 16/16) and `storybook` browser-mode (414/414 whole
package; `FormField` 6/6) projects, `tsup` build, `check-component-bundle-size` (`FormField` 1.17KB
JS / 0.57KB CSS, unchanged, still within budget) — all clean.

**Finalized 2026-09-14, at explicit user direction**, following the final review pass above. Per
`06-engineering-standards.md` §9's own rule, no further changes to `FormField` (code, stories, docs,
or tokens it alone drives) without asking first, even for something that would otherwise be an
obvious, in-scope fix. With `CheckboxGroup`, `Radio`/`RadioGroup`, and `FormField` (items 1–3) all
Finalized, item 4 (`PasswordInput`) is next.

## Post-Finalization follow-up (2026-09-19, at explicit direction) — copy-pasteable "Show code"

Same review as `Card`'s and `Table`'s (standard: `07-storybook-and-documentation-standards.md` §4.2). Findings: the generated snippets for the Playground, "States" and "Controlled, with live validation" were `<FormField label="…" />` with **no control inside** — `FormField`'s child is a render function, which the generator drops — so none of them showed the one thing the component is for; "Wrapping different control types" showed the story object with `demoContainerStyle`. Every story now sets `parameters.docs.source.code` to a hand-written snippet from the new `FormField.snippets.ts`, each with its `fieldProps` render-prop child, and the Playground's builder always includes a real `Input` so its snippet is always usable. All snippets and Playground combinations were typechecked against the real types (the controlled ones with the real `useState` lines, so the state handlers' types were checked too). **Finalized status unchanged** — story-file and docs-only, no component code, props, or tokens touched.
