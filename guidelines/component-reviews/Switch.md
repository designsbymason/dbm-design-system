# Switch — Storybook/component review findings

*(Migrated from `07-storybook-and-documentation-standards.md` §6 during the guidelines retrofit pass, 2026-08-31 — this file's own content is unchanged from what was there, just relocated. See `07`'s own status table for this component's current Docs-page/Finalized status.)*

Switch — ✅ done (2026-08-30 — comprehensive `06-engineering-standards.md` §9 review, worked one finding at a time across 10 findings, three of them judgment calls confirmed at explicit direction before building): (1) `bg.track-strong` token added (see its row in `03-token-system-spec.md`'s Contrast verification section) — the unchecked track was reusing `bg.neutral-subtle`, the same "existing token reused for an unverified new purpose" bug already fixed twice (`bg.skeleton`, `bg.track`); unlike `bg.track`'s own accepted sub-3:1 exception (a passive indicator), Switch is an always-visible interactive control, so this got a real, WCAG-1.4.11-compliant value instead — `gray.500` light (3.25:1), `gray.400` dark (4.34:1). The dark value was requested as `gray.900` initially; checked before building rather than assumed, found to measure only 1.4:1 against `bg.surface` dark (reproducing the same near-invisible defect the fix was meant to close), flagged, and corrected to `gray.400` at the user's direction once shown the numbers. (2) Unchecked-state hover added (`bg.neutral`, reusing an already-verified token rather than adding a new one — Checkbox's own sibling darkens its border on hover when off; Switch previously had no unchecked hover at all). (3) `hasError` added at explicit direction (a comparable `isInvalid`-style prop / this repo's own `Checkbox.hasError` precedent) — implemented as a `box-shadow` ring (`border.danger`) rather than a real border, deliberately: composes independently of `:focus-visible`'s own `outline` (both can render at once), doesn't affect the track's box model/thumb-travel math, and isn't overridden by the `[data-state="checked"]` background rules the way a border-color-based approach would need explicit override handling for. Sets `aria-invalid`. (4) `loading` added at explicit direction (a comparable production `Switch` precedent) — renders the existing `Spinner` atom (`tone="secondary"`, sized via the same `iconSizeForSwitchSize` map already used for `checkedIcon`/`uncheckedIcon`) in place of the thumb icon, blocks interaction via the same native `disabled` attribute `disabled` uses (`disabled || loading`, `||` not `??` so an explicit `disabled={false}` can't win over `loading`, mirroring `Button`'s own `isLoading` precedent), and sets `aria-busy`. (5) `required`/`name`/`value`/`form` added — confirmed via the installed `@radix-ui/react-switch` types that Radix's `Switch.Root` supports `required` (not a native `<button>` attribute, so it didn't even typecheck before) and renders a hidden bubble `<input>` for real form participation, the same mechanism already exposed on `Checkbox`. (6) `className`/`style`/`id`/`data-testid`/`aria-label`/`aria-labelledby`/`disabled` redeclared on `SwitchProps` with full JSDoc — `style` wasn't even destructured before (fell through to the button untested/undocumented), `data-testid` wasn't part of native HTML types so it was invisible to the type entirely. (7) Dev-mode "no accessible name" warning added, matching every other reviewed toggle/interactive atom. (8) `{...props}` spread reordered to come first, ahead of Switch's own computed attributes — not currently exploitable (every attribute Switch computes was already destructured out of `props`), but brought in line with the standing defensive convention so newly-added computed attributes (`aria-invalid`, `aria-busy`) stay protected by construction, the same pattern `Checkbox`/`Button`/`Skeleton`/`ProgressBar`/`ProgressCircle`/`Spinner` already follow. (9) `AllSizes`/`States` stories' dead Controls panels fixed (bare `render: () => (...)` ignoring `args`), a `Playground` story added, `WithThumbIcons`/`IconOnly` retained and wired to `args`, and four `play`-function interaction stories added (`ToggleInteraction`, `DisabledInteraction`, `SpaceKeyInteraction`, `LoadingInteraction`) — Switch had none before. Axe coverage extended to `disabled`/`hasError`/`loading`, previously untested. (10) `Switch.mdx` Docs page added from scratch, full 10-section template mirroring `Checkbox.mdx`.

  **Found in passing, flagged, then fixed at explicit direction (Checkbox is finalized):** `Checkbox.mdx`'s own `RelatedCard` linking to `Switch` pointed at a stale `/?path=/story/atoms-inputs-switch--default` route — Switch's story was always named `Default` until this review renamed it to `Playground`, the same "stale `--default` link" class already fixed elsewhere (Input's review fixed five of these). Flagged rather than fixed silently, per the finalized-component rule; fixed the same session once authorized, repointed at `/?path=/docs/atoms-inputs-switch--docs` now that Switch has a real Docs page (matching `Textarea.mdx`'s own newer `--docs`-linking convention rather than the older `--playground` one still on `Input.mdx`'s cross-links — that broader inconsistency wasn't in scope here, only the literally-broken link was).

  **`autoFocus` audited and redeclared on both Switch and Checkbox, same session, at explicit direction:** the review's own findings list had originally named a broader "full native `<button>` props audit" as unfinished; checking against `Checkbox`'s actual precedent found it never went beyond `required`/`name`/`value`/`form` either (a plain `<button>` has little else genuinely relevant — `type` is deliberately not exposed on either component, since Radix's own internal `type: "button"` default is overridable by a spread consumer prop, and letting a consumer flip it to `"submit"` would make a toggle accidentally submit its enclosing form), so the real, concrete gap was just `autoFocus` — added to both `SwitchProps` and `CheckboxProps` with matching JSDoc (`control: false` in both stories files, mount-only prop with no live-toggle feedback to demo), both Docs pages' `propOrder`/`PlaygroundControls.exclude` updated, and each Properties-section disclaimer sentence's example prop swapped from `autoFocus` (now a real declared prop, not an example of the undeclared-passthrough set) to `onKeyDown`. Live-verified on both Docs pages via the rendered Properties table's actual row order and content, not just the source. Zero behavioral/DOM/token change to `Checkbox` — purely additive — so per `06-engineering-standards.md` §9's three-question test this is the kind of change that doesn't need a full re-review of an already-finalized component, just this scoped mini-pass.

  Full self-verification, whole package, after both the review and the `autoFocus` follow-up: `tsc` (package + `.storybook`), `eslint --max-warnings 0`, `tsup` build, and both Vitest projects (`unit`: 811/811, `storybook`: 291/291) all clean; the Foundations token-coverage check (79/79 in sync) confirmed after the token addition. Live-verified: full theming matrix (Purple/Emerald × Light/Dark — the unchecked track, hover, and error ring all confirmed visible and correctly resolving via computed-style checks, not just screenshots, after one false-negative screenshot mid-check turned out to be a theme-transition timing artifact, the same category of false signal `Textarea`'s own final review flagged), responsiveness at 375px (Playground reflows cleanly, no overflow), and the Docs page's own Playground/Properties/Variants/Design-tokens/Related-Components sections all rendering correctly with zero console errors attributable to Switch. **Review pass complete — not marked Finalized here.** Per `06-engineering-standards.md` §9, that determination belongs to the user, not something this file should assert on its own; corrected in this same edit after stating it prematurely earlier the same session.

  **Size scale enlarged and thumb icons switched to bold weight, same day, at explicit direction (a preference change to already-shipped surface, not a defect fix — evaluated against the three-question test in `06-engineering-standards.md` §9, but Switch was never actually declared Finalized in the first place, so the question of whether a change "reopens" that status doesn't apply here):** every step moved off the shared `icon-size.*` scale (which every other sized atom in this system uses) onto `space.*` instead, at the user's specific numeric target — `md` sized to land slightly bigger than the *previous* `lg`. New track heights: `xs` `space.5` (20px), `sm` `space.6` (24px), `md` `calc(space.6 + space.1)` (28px — the spacing scale has no step between `space.6`/24px and `space.8`/32px, so this one step needed a calc() composition rather than a single token, same precedent as `Input`'s height-parity work), `lg` `space.8` (32px), `xl` `space.10` (40px) — confirmed via live `getBoundingClientRect()` measurement matching exactly, not just read from the CSS. `iconSizeForSwitchSize` (the thumb-icon-size lookup) re-proportioned to match the larger thumbs: `xs`/`sm` → `xs`, `md`/`lg` → `sm`, `xl` → `md` (previously `xs`/`sm`/`md`/`lg` → `xs`, `xl` → `sm` only) — chosen to keep each step's icon-to-thumb fill ratio in a consistent ~55–75% range rather than carrying the old two-tier mapping forward onto a now-larger track, which would have left the icon looking disproportionately small at every step but `xl`. Thumb icons (`checkedIcon`/`uncheckedIcon`) given `weight="bold"` — `Icon`'s existing `weight` prop (already used for `IconButton`'s own pressed-state fill-weight swap) passes straight through to the underlying Phosphor component, so this needed no new capability, just wiring the prop through. No new tokens added — both changes compose entirely from tokens that already exist. Full self-verification: `tsc`, `eslint --max-warnings 0`, `tsup` build, both Vitest projects (`unit`: 811/811, `storybook`: 291/291), the component bundle-size check (Switch: 1.42KB JS / 1.12KB CSS, still within budget), and the Foundations token-coverage check (79/79, unaffected since no semantic tokens changed) all clean. Live-verified: `All sizes`/`States` stories at the new dimensions, mobile-width reflow, and the Docs page's own Playground — all correct.

  **Finalized 2026-08-30, at explicit user direction** — per `06-engineering-standards.md` §9's own note, don't make further changes to Switch (code, stories, docs, or its tokens) without asking first. A final consolidated self-verification was run immediately before this declaration, covering everything landed across the review, the `autoFocus` follow-up, and the size/icon-weight update together: `tsc` (package + `.storybook`), `eslint --max-warnings 0`, `tsup` build, both Vitest projects (`unit`: 811/811, `storybook`: 291/291), the Foundations token-coverage check (79/79 in sync), and the component bundle-size check (Switch 1.42KB JS / 1.12KB CSS, Checkbox 1.19KB JS / 0.82KB CSS — both within budget) all clean.

**Inputs — all 10 atom-tier components now have a Docs page (Button, IconButton, CloseButton, Input, Textarea, Checkbox, Switch, FieldLabel, FieldError, FieldHelperText) — the first functional category to fully clear this pass.** Molecule/organism-tier Inputs & Forms components (`PasswordInput`, `NumberInput`, `Select`, `Combobox`, etc.) are separately queued per `07-storybook-and-documentation-standards.md` §6's own molecule-sequencing note, not part of this atom-tier count.

## Unchecked track reverted from `bg.track-strong` to `bg.track` (2026-09-15, at explicit direction)

The original review (above) added `bg.track-strong` specifically so the unchecked track would clear
WCAG 1.4.11's 3:1 non-text floor, reasoning that an always-visible, always-interactive control's own
track "must read as real." Revisited after a direct question (asked during `Slider`'s own review,
which had applied the identical reasoning) about whether that rule was actually correct: checking
several comparable production sliders/switches found the majority don't hold their own track to 3:1
either, and WCAG 1.4.11 itself targets whichever element conveys a control's boundary/state — for
`Switch`, that's the thumb (always visible, in either state), not the track behind it. Full reasoning
and the general principle this generalizes to (any current or future track-having component): 
[ADR-0016](../adr/0016-track-vs-track-strong-scoped-to-decorative-need-not-interactivity.md).

**Applying `06-engineering-standards.md` §9's three-question test** (Switch is Finalized, so this
needed authorization before touching it — given explicitly, alongside the same request for `Slider`):
1. Changes rendered output of existing surface? Yes — the unchecked track's own color.
2. Genuine defect fix (something that already violated a guideline requirement)? **No** — the reverse:
   `bg.track-strong` was itself compliant with the rule as originally written; this is a deliberate
   policy change to that rule, not a correction of a violation.
3. Blast radius: touches the shared token-spec convention (`03-token-system-spec.md`'s `bg.track`/
   `bg.track-strong` rows), which `Indicators` also consumes under a related but factually different
   rationale (the dot itself, not a groove behind a thumb, is what a user reads state from there) —
   evaluated and left unchanged; ADR-0016 records explicitly why `Indicators` isn't affected. Result:
   **partial re-finalization** for `Switch` — only Theming and Accessibility/Design-quality (contrast)
   needed re-verification, not the full checklist.

Changed: `Switch.module.css`'s `.root` base rule, `background-color: var(--dbm-bg-track-strong)` →
`var(--dbm-bg-track)`. `Switch.mdx`'s Accessibility callout and its `bg.track-strong` `TokenRow`
updated to match and to state the exception explicitly (deliberate sub-3:1, not an oversight), same
wording pattern used on `Slider.mdx`'s own equivalent line.

Re-verified (Theming + Accessibness/contrast, plus a full regression run since both packages share a
build): `pnpm run lint`, full Vitest `unit` (1327/1327 whole package) and `storybook` (459/459 whole
package) projects, `pnpm run build`, and `check-component-bundle-size` (Switch: 1.44KB JS / 1.15KB
CSS, still within budget) all clean. Live-verified in Storybook: unchecked track now visibly fainter
but the thumb (with its own shadow) still clearly reads the switch's position in both states; checked
state (`bg.brand`) unaffected.

**Finalized status unchanged — this was a partial re-finalization, not a reopening of the full
review.** Updated per `06-engineering-standards.md` §9's own re-finalization note: "Finalized
2026-08-30, unchecked-track color revised 2026-09-15 (re-verified: theming, accessibility/contrast)."

**Follow-up shared-token change, same day.** `bg.track` itself (the token `Switch` now consumes,
per the entry above) had its own light-mode primitive mapping moved `gray.100` → `gray.200` (1.14:1
→ 1.35:1 against `bg.surface`, still a deliberate sub-3:1 exception), at explicit direction — see
[ADR-0016](../adr/0016-track-vs-track-strong-scoped-to-decorative-need-not-interactivity.md)'s own
token, and `03-token-system-spec.md`'s `bg.track` row. No further change to `Switch.module.css`
itself (it already referenced `bg.track` by name from the change above). Re-verified live in
Storybook: the unchecked track is now marginally more visible than immediately after the
`track-strong` → `track` change, still clearly fainter than the checked (`bg.brand`) state. Stays
Finalized — purely a shared-token value adjustment, nothing in `Switch`'s own files changed.

**Second follow-up, same day:** `bg.track`'s dark-mode mapping also moved, `gray.800` → `gray.700`
(1.40:1 → 2.05:1 against `bg.surface`) — live-verified in dark mode, the unchecked track now reads
clearly against the surface. Separately, `bg.track-strong` (the token `Switch`'s *resting* state no
longer consumes, per the first follow-up above) itself moved to `gray.300`/`gray.600` — at that
point irrelevant to `Switch`'s own resting state, but see `guidelines/component-reviews/Indicators.md`
for the consequence to that token's other consumer. Stays Finalized.

**Third follow-up, same day: `Switch`'s unchecked-hover state moved from `bg.neutral` to
`bg.track-strong`, at explicit direction.** `Switch.module.css`'s `.root:hover:not(:disabled)` rule
changed from `var(--dbm-bg-neutral)` to `var(--dbm-bg-track-strong)`; `Switch.mdx`'s own `TokenRow`
updated to match. Live-verified via computed style, not just visually, since the resulting step is
subtle in light mode: resting `rgb(222,221,229)` (`gray.200`) → hover `rgb(198,196,209)` (`gray.300`)
— real, but a visibly smaller jump than `bg.neutral`'s own `gray.600` gave. Dark mode's step is
clearer: resting `rgb(91,88,107)` (`gray.700`) → hover `rgb(117,113,135)` (`gray.600`), confirmed via
both computed style and a live screenshot comparison. Checked (`bg.brand`/`bg.brand-hover`) state
completely unaffected.

Applying `06-engineering-standards.md` §9's three-question test (Switch is Finalized): (1) changes
rendered output of existing surface — yes, the hover color; (2) genuine defect fix — no, a deliberate
preference change; (3) blast radius — scoped to `Switch`'s own files only (this is `bg.track-strong`
gaining a *second* consumer, not a value change to the token itself, so nothing else already
consuming it is affected). **Partial re-finalization** — re-verified Theming and
Accessibility/contrast for this state only. Full regression run: `pnpm run lint`, `unit` (1327/1327),
`storybook` (459/459), `pnpm run build`, `check-component-bundle-size` (Switch: 1.44KB JS / 1.15KB
CSS), and `check-foundations-token-coverage` all clean. Stays Finalized — "Finalized 2026-08-30,
track color revised 2026-09-15, unchecked-hover state revised 2026-09-15 (re-verified: theming,
accessibility/contrast)."

## Post-Finalization follow-up (2026-09-19, at explicit direction) — copy-pasteable "Show code"

Same review as the molecules' and the first seven atoms' (standard: `07-storybook-and-documentation-standards.md` §4.2). Findings: all five generated snippets spelled out defaults (`hasError={false}`, `loading={false}`, `required={false}`, `name=""`, `value=""`), empty placeholders and a no-op `onCheckedChange`, and "With thumb icons" printed both icons as `$$typeof` garbage. Every story now sets `parameters.docs.source.code` to a hand-written snippet from the new `Switch.snippets.ts`, and the Playground builds its snippet from the live controls, including the thumb-icon controls. The snippets and Playground combinations were typechecked against the real types. **Finalized status unchanged** — story-file and docs-only, no component code, props, or tokens touched.
