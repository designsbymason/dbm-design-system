# SearchInput — Storybook/component review findings

**Inputs & Forms:** SearchInput — initial build + full `06-engineering-standards.md` §9 review
checklist worked through (2026-09-14), item 6 in the itemized molecule-tier build order
(`04-component-inventory.md`), the third and last of the three thin `Input`-wrapping molecules
(`PasswordInput`, `NumberInput`, `SearchInput`). **Finalized 2026-09-14.**

**Design choices made without an explicit ask (flagging the reasoning, not a fork-in-the-road
architecture decision on the scale of `NumberInput`'s/`Radio`'s own ADRs):**

- **`value`/`onChange` stayed exactly `Input`'s own string-typed contract** (unlike `NumberInput`,
  which needed a real `number`-typed `onValueChange` for its stepper arithmetic) — a search query is
  already a string with no parsing/domain conversion needed, so there was no fork to resolve here.
- **A new `onSearch: (value: string) => void` callback, debounced via `debounceMs` (default 300),
  separate from `onChange`.** This is the component's actual reason to exist beyond "`Input` plus an
  icon" — named per `05-component-api-conventions.md` §2's `onXxx` convention, deliberately not
  `onValueChange` (already reserved by convention for a custom/controlled-value case, which this
  isn't — the value itself is still plain `onChange`). `onSearch` also fires immediately — cancelling,
  not just pre-empting, any pending debounce timer — on Enter and when the value is cleared, since
  both are "run this now" moments a debounce should never delay. `debounceMs={0}` calls `onSearch` on
  every keystroke instead of debouncing, for a cheap local-filter use case.
- **`isLoading` swaps the leading search icon for the existing `Spinner` atom** — a named,
  feature-completeness gap (comparable production search inputs commonly reflect an in-flight async
  search this way) rather than an unrequested addition; reuses `Spinner` rather than a new
  hand-rolled loading treatment (atom-reuse audit).
- **Escape clears the field, gated on `onClear` being set (same gate as the clear button's own
  visibility) and only when there's a value** — matches the common platform convention (macOS
  Spotlight, browser omnibars). Stops the key event's own propagation when it acts, so it doesn't
  also bubble to, say, a parent `Dialog`'s own Escape-to-close handler.
- **Clear-button contract matches `NumberInput`'s own precedent exactly, not `Input`'s bare-notification
  one**: `SearchInput` tracks its own value (controlled or not), so clicking the clear button — or
  pressing Escape — always actually resets it (and fires `onSearch("")` immediately); `onClear` is a
  supplementary notification, not a requirement for clearing to work. For a controlled `SearchInput`,
  this still means pairing `onClear` with the caller's own state setter (`onClear={() => setQuery("")}`)
  for the reset to reach the caller's own state — the same contract `Input`'s own `onClear` already
  establishes, since `onChange` (not a second callback) is this component's only value-change channel.
- **`suffix` is exposed (a keyboard-shortcut hint, a result count); `prefix` is not** — the leading
  slot is permanently the search icon/spinner, the same reservation pattern `PasswordInput`
  (`suffix` reserved for its toggle) and `NumberInput` (`suffix` reserved for its stepper) each use
  for their own single fixed affordance, just mirrored to the other slot here.

**Consumed-atom defect handling (`06-engineering-standards.md` §9 checkpoint) — two real, pre-existing
defects found in the already-Finalized `Input` atom this component wraps, both fixed at the root
rather than worked around locally; both classified as defect fixes (stays Finalized) per the
three-question test.** Full detail in `Input.md`'s own entry, not restated here:

1. `Input`'s own clear button was never natively disabled when `disabled`/`readOnly` — inconsistent
   with `NumberInput`'s/`PasswordInput`'s own sibling controls, which already got this right.
2. `type="search"` still showed WebKit/Blink's native "×" cancel-button icon — invisible until now
   because every prior consumer's own clear/toggle control masked it in the same position.
   `SearchInput`'s own Loading/AllSizes stories (no `onClear` set) are what exposed it during live
   Docs-page verification.

**Baseline correctness:** Full TypeScript strict mode, no `any`. JSDoc complete on the component and
every prop. `forwardRef` to the native `<input>` (delegates straight to `Input`'s own ref, no local
ref needed — nothing in this component reads or imperatively touches the DOM node itself).
`className`/`style`/`id`/`data-testid` all accepted (via native extension, flowing through to
`Input`). No hardcoded values — the only visual choices this component makes itself (the leading
icon/spinner) are sized via `Icon`'s/`Spinner`'s own token-backed size props; everything else is
`Input`'s own, already-token-driven CSS. No console noise, no silent catches; a pending debounce
timer is cleaned up on unmount (`useEffect` cleanup) so no late `onSearch` call can fire after the
component is gone. SSR-safe — no module-scope or render-time `window`/`document` access
(`setTimeout`/`clearTimeout` only, inside effects/handlers).

**Accessibility:** Real native `<input type="search">`, exposing the `searchbox` role rather than
`Input`'s own generic `textbox`. Clear button is a real, independently-focusable
`<button aria-label="Clear">`, disabled natively when `disabled`/`readOnly` (via the `Input` fix
above). jest-axe clean across default/loading/error/disabled states — see `SearchInput.test.tsx`.
Keyboard: Enter fires `onSearch` immediately without leaving focus; Escape clears (when eligible)
and stops propagation; clicking the clear button refocuses the input (`Input`'s own existing
behavior, unchanged).

**Responsiveness/Theming:** No component-specific breakpoint or brand/mode logic — inherits
`Input`'s own, already-verified responsive layout and all 4 theme combinations. Live-verified in a
running Storybook instance (Playground's `isLoading` toggle swapping the icon correctly, both
Purple/Light and default states) rather than assumed from the code.

**Storybook documentation:** `SearchInput.mdx` Docs page (first in its sidebar group), full template
— Intro, Playground (with the "no genuinely live prop excluded without a stated reason" bar met),
Properties table (`propOrder` sequenced content→visual→behavioral→escape-hatch), a Variants gallery
(All sizes, Loading, With a clear button, With a suffix hint, No debounce, Error state, Disabled),
Usage guidelines, Best practices, Accessibility, Code examples (including a genuine native-prop
example per the standing requirement), Design tokens used, Related components (cross-linking `Input`,
`FieldLabel`, `FieldHelperText`, `FormField`, and `Kbd` for the suffix-hint pairing). Three
`play`-function interaction stories (debounced search settling, Enter-immediate, clear-button). Every
prop's Controls-panel control is genuinely interactive or has a stated `control: false` reason — no
inert placeholders. Visually verified live in a running Storybook instance (not just `tsc`), including
exercising the Playground's `isLoading` toggle and confirming the sidebar taxonomy
(`Molecules/Inputs/SearchInput`) matches `07-storybook-and-documentation-standards.md` §3.

**No dedicated `SearchInput.module.css`** — a deliberate omission, not an oversight: this component
renders no visual content of its own beyond an `Icon`/`Spinner` in `Input`'s existing `prefix` slot
(already sized/centered by `Input`'s own `.affix` CSS) and passes `className`/`style` straight
through to `Input` unchanged. Adding an empty or filler stylesheet solely to match the standard
6-file template would itself be the kind of unjustified scaffolding `CLAUDE.md`/
`06-engineering-standards.md` §1 caution against ("don't add abstractions beyond what the task
requires"). Confirmed via the per-component bundle-size check: `SearchInput`'s own reported CSS
(1.16KB gzipped) is entirely `Input`'s own composed styles, not anything of `SearchInput`'s.

**Functional verification:** `SearchInput.test.tsx` (25 tests) covers rendering, immediate
`onChange`, debounced `onSearch` (fake timers — settling, custom `debounceMs`, `debounceMs={0}`),
Enter-immediate (cancels rather than merely pre-empting a pending debounce, verified by advancing
timers past the original delay afterward and confirming no second, stale call), the full `onClear`
family (button click, Escape, Escape no-ops when empty or `onClear` unset, controlled-value contract,
disabled/readOnly gating), controlled usage, the `isLoading` icon swap, native prop forwarding,
`suffix`, timer cleanup on unmount, `aria-invalid`, and jest-axe across 5 states (including one with
the clear button actually rendered — see the final review pass below). Full package
self-verification: `tsc` (package + `.storybook`), `eslint --max-warnings 0`, Vitest `unit`
(1285/1285) and `storybook` (444/444, including this component's own 12 story tests) all clean;
`tsup` build and `check-component-bundle-size` clean (1.93KB JS / 1.21KB CSS gzipped, well within
budget).

**Feature completeness:** Named gap comparisons made explicit above (`isLoading`, `onSearch`
debounce/immediate-triggers, Escape-to-clear) rather than an unscoped "make it fancier" pass — each
traces to a concrete, stated rationale, per the §9 scope-creep guardrail.

**Post-build fixes (2026-09-14, user-reported, before the final review pass):**

1. **`maxLength`/`minLength`/`pattern` showed inert "Set number"/"Set string" placeholders in the
   Playground instead of a real control or `–`.** `maxLength` had a `control: "number"` but no
   matching value in the meta's `args`, leaving it `undefined`; `minLength`/`pattern` had the same
   gap. Fixed to match `Input`'s own established precedent exactly: `maxLength` gets a real default
   (`200`) so its control is genuinely interactive from the start; `minLength`/`pattern` are set to
   `control: false` and added to `PlaygroundControls`' `exclude` list — HTML5 `minLength`/`pattern`
   validation only surfaces on a real `<form>` submit, which the Playground's own plain, form-less
   demo never triggers, so there's nothing to observe by live-editing either one (same reasoning
   `Input.stories.tsx` already established for this exact pair).
2. **Interaction stories played back too fast to actually watch.** Every `play` function jumped
   straight into its first action with no leading pause, and `userEvent.type` used its own
   near-instant default per-keystroke timing. Added a `pause(500)`+ before the first action in every
   interaction story (so the starting state is visible before anything happens) and slowed typing to
   a `150ms`-per-keystroke `delay`, lengthening the gaps between steps to match — confirmed via the
   `storybook` Vitest project's own total runtime for these stories going from ~3.7s to ~8.6s.

**Final review pass (2026-09-14):** re-ran the full `06-engineering-standards.md` §9 checklist from
scratch rather than re-checking only what was previously found. Two real gaps found and fixed, one
genuine design question asked rather than guessed:

1. **Enter fired `onSearch` mid-IME-composition.** `SearchInput` is the first component in this
   system to intercept Enter on a live free-text field, and the handler never accounted for IME
   input (Japanese/Chinese/Korean): pressing Enter to *confirm* a composed character also dispatches
   a plain `key === "Enter"` keydown, which would have run a search against a possibly incomplete or
   wrong in-progress composition. Fixed with the standard, reliable guard —
   `!event.nativeEvent.isComposing` — rather than the older, legacy-Safari-only `keyCode === 229`
   fallback some codebases still carry. Regression test added.
2. **jest-axe never exercised the state where the clear button actually renders.** All four
   pre-existing a11y-check states (default/loading/error/disabled) render with no `onClear`, so the
   clear `<button>` — a real, distinct interactive element — was never scanned. Added a fifth state
   (`defaultValue` + `onClear`) to that test.
3. **Escape's handler now also calls `preventDefault()`** — defensive, bundled in with the fixes
   above: some browsers still tie a native "clear on Escape" behavior to `type="search"` fields, and
   this avoids racing that against `SearchInput`'s own state update, even though both already
   converge on the same empty result either way.
4. **Asked, not guessed — Enter inside a real `<form>`.** A single-text-input `<input>` inside a
   `<form>` submits it natively on Enter; before this pass, `SearchInput` never blocked that, so a
   consumer using its own `name`/`form` props would get both `onSearch` firing *and* a native form
   submission. Two genuinely valid answers existed — leave it (some consumers may want Enter to
   submit a real search-results page as a fallback) or block it (this component stays a purely
   in-page, `onSearch`-driven control) — so this was presented as an explicit choice rather than
   decided unilaterally. **User chose to block it.** `handleKeyDown` now calls `event.preventDefault()`
   on every non-composing Enter, documented on the component's own JSDoc, `onSearch`'s own JSDoc, and
   the Docs page's Intro paragraph. Regression test added asserting `fireEvent`'s own return value
   (`false` — the standard way to observe `preventDefault` having been called) alongside the existing
   "Enter fires `onSearch`" assertion.

Full re-verification after all of the above: `tsc` (package + `.storybook`), `eslint
--max-warnings 0`, Vitest `unit` (1285/1285) and `storybook` (444/444) all clean; `tsup` build and
`check-component-bundle-size` clean (1.93KB JS / 1.21KB CSS gzipped). Docs page re-verified live in a
running Storybook instance after the Intro/Accessibility copy edits (both new sentences confirmed
present in the rendered output, no MDX compile errors — cross-checked against `NumberInput.mdx`'s own
page to confirm a handful of unrelated console errors present on both are pre-existing Storybook-
manager noise, not a regression introduced here).

**Status: Finalized 2026-09-14.** Per `06-engineering-standards.md` §9's finalization rule, further
changes to this component need explicit confirmation first, even an in-scope-looking fix noticed in
passing.
