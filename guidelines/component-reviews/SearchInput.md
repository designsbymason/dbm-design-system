# SearchInput — Storybook/component review findings

**Inputs & Forms:** SearchInput — initial build + full `06-engineering-standards.md` §9 review
checklist worked through (2026-09-14), item 6 in the itemized molecule-tier build order
(`04-component-inventory.md`), the third and last of the three thin `Input`-wrapping molecules
(`PasswordInput`, `NumberInput`, `SearchInput`). **Not yet Finalized** — per
`06-engineering-standards.md` §9's own reporting convention and the standing rule that only the
user declares a component's review pass done, this file records what was built/checked/found, not
a self-declared Finalized status.

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

**Functional verification:** `SearchInput.test.tsx` (33 tests) covers rendering, immediate
`onChange`, debounced `onSearch` (fake timers — settling, custom `debounceMs`, `debounceMs={0}`),
Enter-immediate (cancels rather than merely pre-empting a pending debounce, verified by advancing
timers past the original delay afterward and confirming no second, stale call), the full `onClear`
family (button click, Escape, Escape no-ops when empty or `onClear` unset, controlled-value contract,
disabled/readOnly gating), controlled usage, the `isLoading` icon swap, native prop forwarding,
`suffix`, timer cleanup on unmount, `aria-invalid`, and jest-axe across 4 states. Full package
self-verification: `tsc` (package + `.storybook`), `eslint --max-warnings 0`, Vitest `unit`
(1283/1283) and `storybook` (444/444, including this component's own 12 story tests) all clean;
`tsup` build and `check-component-bundle-size` clean (1.90KB JS / 1.16KB CSS gzipped, well within
budget).

**Feature completeness:** Named gap comparisons made explicit above (`isLoading`, `onSearch`
debounce/immediate-triggers, Escape-to-clear) rather than an unscoped "make it fancier" pass — each
traces to a concrete, stated rationale, per the §9 scope-creep guardrail.

**Status: built, self-reviewed against the full `06-engineering-standards.md` §9 checklist, all
findings above already actioned — awaiting the user's own confirmation to mark Finalized.**
