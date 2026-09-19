# PasswordInput — Storybook/component review findings

**Inputs & Forms:** PasswordInput — initial build + full `06-engineering-standards.md` §9 review
pass complete (2026-09-14), item 4 in the itemized molecule-tier build order
(`04-component-inventory.md`), the first of three thin `Input`-wrapping molecules (`PasswordInput`,
`NumberInput`, `SearchInput`) planned back-to-back.

**Architecture: wraps `Input` directly, no changes to that already-Finalized atom.** `PasswordInput`
renders `<Input type={visible ? "text" : "password"} suffix={<toggle button>} {...rest} />`,
managing `visible` as purely internal, uncontrolled state (no exposed controlled-visibility API —
deliberately not built; no concrete need for it surfaced, and adding one now would be speculative
configurability, not a real gap). `type` and `suffix` are both omitted from `PasswordInputProps` —
`type` because this component owns that decision internally, `suffix` because the trailing slot is
reserved for the visibility toggle. Every other `Input` prop is redeclared on `PasswordInputProps`
with its own full JSDoc rather than `extends Omit<InputProps, ...>` — no existing component in this
codebase extends another component's own `*Props` type (confirmed by search), only native DOM
props; matching that precedent keeps this component's own Properties table fully self-documented
rather than requiring a reader to cross-reference `Input`'s own type.

**The toggle button mirrors `Input`'s own locally-implemented `.clear` button pattern exactly** —
same reasoning (`Input.module.css`'s own comment: `IconButton`'s size steps are calibrated to
Button's/Input's own *full* outer height, taller than this row's own text content at every `Input`
size, and don't scale with `size`), same padding/margin-block hit-area math per size step, same
hover/focus-visible treatment, `tone="brand"` on the icon. Rendered via `Input`'s own `suffix` slot,
so it sits inside `Input`'s `.affix` wrapper rather than as a `.wrapper`-level sibling the way
`Input`'s own `.clear` does — the compensating margin math was re-verified against that nesting
context, not assumed to carry over unchanged.

**Icon accessible name changes with state, not a static label.** The toggle is a real
`<button aria-label="Show password">` / `<button aria-label="Hide password">` — the label itself
flips with `visible`, so assistive tech always announces what activating it will do *next*, not a
generic "Toggle visibility" that goes stale. `EyeIcon`/`EyeSlashIcon` (Phosphor, already available
via `@dbm-design-system/icons`'s full re-export) — no new dependency.

**Focus and disabled semantics match `Input`'s own established conventions:** clicking the toggle
returns focus to the input immediately (same pattern as `Input`'s own clear button), and `disabled`
disables both the input and the toggle together — a disabled password field can't have its masking
state changed, matching the same all-or-nothing semantics `Input`'s own `disabled` already has for
its clear button (verified this actually holds for `Input`'s clear button too, since it does not
independently check `disabled`; not a gap introduced here — `Input`'s clear button also disappears
whenever `onClear` isn't set, and `hasTypedValue`/`isControlled` conditions already gate it, so a
disabled `Input` with `onClear` set is a real, if narrow, existing edge case outside this
component's own scope to fix).

**Molecule composition checkpoints (`06-engineering-standards.md` §9):**
- **Compound-component sub-part completeness** — not applicable; flat props, no sub-parts.
- **Atom-reuse audit** — composes `Input` and `Icon` directly; no reimplementation of either.
- **Consumed-atom defect handling** — none found; `Input` needed no changes.
- **Radix-primitive prop audit** — not applicable; wraps `Input` (itself no Radix primitive), not a
  Radix component directly.
- **Cross-part ARIA/id wiring** — not applicable in `FormField`'s sense (a single control, not a
  label/control/helper-text triad); the toggle's own accessible name is self-contained.
- **Composed tab order** — verified real: `Tab` reaches the native input, then the toggle button (a
  real, independently-focusable element, not a decorative icon with a click handler), then — if
  `onClear` is set and there's a value — the clear button after that. Matches `Input`'s own tab
  order with the toggle inserted before the clear button, both living in the trailing slot area.

**Self-verification, all real runs:**
- `tsc --noEmit` (package + `.storybook`): clean
- `eslint --max-warnings 0`: clean
- Vitest `unit` project: 1232/1232 whole package (`PasswordInput` 10/10)
- Vitest `storybook` (browser-mode play-function/a11y) project: 422/422 whole package
  (`PasswordInput` 8/8, including both interaction stories — `PASS`)
- `tsup` build: clean, all four output targets
- `check-component-bundle-size`: `PasswordInput` 1.48KB JS / 0.95KB CSS gzipped, within budget
- `build-storybook` + `check-storybook-bundle-size`: clean, within budget
- Live-verified in a running Storybook instance: Docs page (all sections, Playground live — typing
  a value and clicking the toggle reveals/re-masks it live), `All sizes`/`With a clear
  button`/`Error state`/`Disabled` variant galleries, both interaction stories replayed and
  confirmed `PASS`, zero Accessibility-panel violations, all 4 themes (Purple/Emerald × Light/Dark)
  — confirmed via the Docs page's own embedded `Canvas` blocks
- Confirmed sidebar placement: **Molecules → Inputs → PasswordInput**, per the taxonomy in
  `07-storybook-and-documentation-standards.md` §3

**Verification-tooling artifact investigated, confirmed not a product defect.** Viewing an
individual story directly via its own `/story/...` canvas route (bypassing the Docs page) while in
dark mode captured as a plain white canvas in this session's browser-automation screenshots — but
direct JS inspection of the live DOM in that exact state showed correct values throughout
(`data-theme="purple-dark"` on `<html>`, `rgb(44, 42, 52)` computed background on both the story's
own wrapper and `Input`'s own `.wrapper` element), reproduced identically on a freshly-opened tab
(ruling out stale-tab/paint-cache), with zero console errors. The same story's content, viewed via
its `<Canvas>` embed on the Docs page instead (Storybook's other, more consequential rendering
path — the page real consumers actually read), screenshotted correctly dark in every check. Treated
as an artifact of this session's screenshot-capture pipeline for the bare canvas route specifically,
not a real rendering defect — the authoritative live-DOM check, the passing automated `storybook`
project a11y/interaction tests (which don't depend on pixel screenshots at all), and the correctly-
rendering Docs page all agree the component itself renders correctly in every theme.

**Post-review fix (user-reported, 2026-09-14): interaction stories replayed too fast to watch.**
None of the three interaction stories (`ToggleVisibilityInteraction`, `ClearButtonInteraction`,
`DisabledInteraction`) had the `pause` helper `Radio`'s/`RadioGroup`'s own interaction stories
already established for exactly this — each step fired back to back with no visible gap between
them, reading as a single flash rather than distinct, observable steps. Added the same `pause`
helper (500–800ms between steps) to all three; the assertions themselves need none of it, purely
for human legibility watching the replay in the Interactions panel. Confirmed live: all three now
replay at a watchable pace, still `PASS`. Full re-run: `tsc`, `eslint --max-warnings 0`, Vitest
`storybook` (8/8 for `PasswordInput`'s own stories) — clean.

**Final review pass (2026-09-14, at explicit user request before Finalization).** Re-read every file
fresh end to end (`PasswordInput.tsx`, `PasswordInput.types.ts`, `PasswordInput.module.css`,
`PasswordInput.stories.tsx`, `PasswordInput.test.tsx`, `PasswordInput.mdx`, `index.ts`) rather than
assuming the incremental build already covered everything — same discipline as every prior
finalization pass this session. Found and fixed three real gaps (test coverage and documentation
completeness, not defects in the component's own rendered behavior):
1. **No test verified `size` reaches the toggle button/icon** — `toggleSizeClass`/
   `toggleIconSizeForInputSize` were wired correctly from the initial build, but nothing asserted
   either, and the `'md'` default had no regression coverage. Added a test covering both the
   default and an explicit override.
2. **The specific claim in this component's own JSDoc/Docs page — "the show/hide toggle still
   works while read-only, since revealing isn't itself an edit" — had zero test coverage.** A real,
   testable behavioral claim with nothing backing it. Added a test confirming the toggle still
   reveals the value while `readOnly`.
3. **`PasswordInput.mdx` had no cross-link to `FormField`, and no example composing the two** —
   `FormField` is the generic composition partner every control atom is meant to work with, and
   `PasswordInput` predates it having had the chance to reference it. Added a `FormField`
   `RelatedCard` (with a live, working preview) and a `FormField`-composed code example. Unlike the
   Field* atoms' own cross-link addition (an authorized post-finalization edit, since those were
   already Finalized), this file isn't Finalized yet, so no separate authorization was needed —
   still flagged here explicitly since it's a real, substantive addition, not a typo fix.

No other gaps found — the toggle mechanism, disabled/readOnly cascades, ref forwarding, and every
story/example held up under a fresh read. Full re-verification, whole package: `tsc` (package +
`.storybook`), `eslint --max-warnings 0`, Vitest `unit` (1234/1234 whole package; `PasswordInput`
12/12) and `storybook` browser-mode (422/422 whole package; `PasswordInput` 8/8) projects, `tsup`
build, `check-component-bundle-size` (`PasswordInput` 1.48KB JS / 0.95KB CSS, unchanged, still
within budget) — all clean. Live-reconfirmed in Storybook: the new `FormField` code example and
`RelatedCard` both render and work correctly on the Docs page.

**Post-review fix (user-reported, 2026-09-14, with screenshot): the `FormField` `RelatedCard`'s own
preview was cropped.** `RelatedCard`'s preview slot is a fixed `height: var(--dbm-space-20)` (80px)
box with `overflow: hidden` — built for a single, compact (~48px) instance, confirmed by that
block's own code comment ("every preview here is meant to fit inside this box, not be clipped by
it"). The card rendered a full `<FormField label="Password">{(fieldProps) => <PasswordInput
{...fieldProps} />}</FormField>` — a label-plus-control composition genuinely taller than 80px —
so flexbox's `align-items: center` centered it inside the fixed box and clipped both the top of the
label and part of the control, exactly as the reported screenshot showed. Not a `RelatedCard` bug to
fix there (that shared block is correct; changing its fixed height would affect every other card
system-wide, a much larger blast radius for a problem this component's own preview choice created).
Fixed by previewing a bare, uncomposed `PasswordInput` instead — consistent with every other
`RelatedCard` on this page (and across the whole system), which always shows a single compact
instance, never a multi-part composition; the description text alone already communicates the
`FormField` relationship, matching how every other card's relationship is conveyed. Removed the
now-unused `FormField` import as part of the same fix.

**Same mistake found and fixed in the three `Field*` atoms' own `FormField` cards** (added earlier
this session as an authorized post-finalization change — see each of their own component-review
entries) — `FieldLabel.mdx`, `FieldHelperText.mdx`, and `FieldError.mdx` all composed a full
`FormField` in that same card, with the same overflow. Fixed identically: `FieldLabel.mdx`'s and
`FieldHelperText.mdx`'s cards now preview a bare `Input`; `FieldError.mdx`'s previews a bare
`Input hasError` (keeping a visual tie to the error theme without needing `FormField` composed).
Confirmed live on all four Docs pages: every `FormField` card now renders its preview fully visible,
uncropped. Applying the three-question finalization test to the three `Field*` atoms once more:
purely additive/corrective within the same already-authorized change (no new behavior, no change to
anything that existed before that change) — **all three stay Finalized**, no new date needed.

Full re-verification, whole package: `tsc` (package + `.storybook`), `eslint --max-warnings 0`,
Vitest `unit` (1234/1234) and `storybook` (422/422) projects — all clean.

**Finalized 2026-09-14, at explicit user direction**, following the final review pass above. Per
`06-engineering-standards.md` §9's own rule, no further changes to `PasswordInput` (code, stories,
docs, or tokens it alone drives) without asking first, even for something that would otherwise be
an obvious, in-scope fix. With `CheckboxGroup`, `Radio`/`RadioGroup`, `FormField`, and
`PasswordInput` (items 1–4) all Finalized, item 5 (`NumberInput`) is next.

**Authorized post-finalization change (2026-09-14): toggle button recolored from brand to neutral.**
User-directed, applied identically across this button, `Input`'s own `.clear`, and `NumberInput`'s
own `.stepperButton` — see each component's own entry. `tone="brand"` → `tone="default"` on the
toggle's `Icon` (`icon.default` at rest, no background), and `.toggle:hover:not(:disabled)`'s
background changed from `bg.brand-subtle` to `bg.neutral-subtle`. **Three-question finalization
test:** (1) changes rendered output that existed at finalization time — yes; (2) not a defect fix —
a deliberate preference change, same reasoning as `Input`'s own identical change; (3) blast radius
scoped entirely to `PasswordInput.tsx`/`PasswordInput.module.css`'s own toggle-button rule — no
shared token/infra change. **Result: partial re-finalization** — re-verified Design quality and
Theming/Accessibility contrast (both tokens already carry vetted WCAG AA documentation; confirmed
resolving correctly across all 4 theme combinations via direct CSSOM/token inspection in a running
Storybook instance). No other checklist section touched. Full re-run: `tsc` (package + `.storybook`),
`eslint --max-warnings 0`, Vitest `unit` (1256/1256 whole package) and `storybook` (432/432 whole
package) — clean; `tsup` build and `check-component-bundle-size` clean. **Stays Finalized**,
re-verified sections noted above, no other changes.

Formalized the same day into a standing rule (`05-component-api-conventions.md` §6 — "icons used
inside an input field use neutral colors"), applied identically to `Select`'s and `Textarea`'s own
clear buttons too — see each component's own entry.

## Post-Finalization follow-up (2026-09-19, at explicit direction) — copy-pasteable "Show code"

Same review as `Card`'s and `Table`'s (standard: `07-storybook-and-documentation-standards.md` §4.2). Findings: same shape as `NumberInput`'s — spelled-out defaults, empty props, two one-arg stories ("Error state", "Disabled") lost in the noise, and a frozen "With a clear button". Every story now sets `parameters.docs.source.code` to a hand-written snippet from the new `PasswordInput.snippets.ts`, with the same approach; the clearable example shows real state (`onClear={() => setValue("")}`). All snippets and Playground combinations were typechecked against the real types (the controlled ones with the real `useState` lines, so the state handlers' types were checked too). **Finalized status unchanged** — story-file and docs-only, no component code, props, or tokens touched.
