# Backdrop — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-05. Core implementation was already
sound (correct tokens throughout, `forwardRef`, SSR-safe via `Portal`, zero hardcoded values,
accessible-by-design click-to-dismiss matching Radix/MUI/Chakra precedent) — findings covered
documentation completeness, Storybook coverage, and two named feature-completeness gaps against
MUI's `Backdrop`. `asChild` support (Radix's own `Dialog.Overlay` has it) was raised but deliberately
not added — Backdrop generates its own visual content from props rather than `children`, which
`05-component-api-conventions.md` §3's `as`-vs-`asChild` rule says doesn't fit `asChild`.

**Fixed:**
- No Playground story existed. Added one, fully `args`-driven, with every prop given an explicit
  `argTypes` entry (matching `Tag`/`Skeleton`'s established pattern) so the rendered Properties table
  has a real description/default for every row, not docgen's unreliable inference.
- `className`/`style`/`id`/`data-testid` weren't explicitly redeclared on `BackdropProps` — added
  with JSDoc, matching `AspectRatio`/`Center`/`Affix`'s established pattern (Storybook's `react-docgen`
  unreliably drops inherited-only native props from the Properties table otherwise,
  `05-component-api-conventions.md` §3).
- `onClick` wasn't explicitly redeclared either, despite being the component's primary documented use
  case — added with JSDoc, same docgen-visibility reasoning.
- No `play`-function interaction story. Added one (`inPortal={false}` so the portaled content stays
  queryable via `within(canvasElement)`) scripting a real click-to-dismiss end-to-end, using
  `waitForElementToBeRemoved` rather than an immediate assertion — confirmed live in a real browser
  that the scrim stays in the DOM with `data-state="closed"` for the ~200ms exit animation before
  actually unmounting (this only surfaces in the real-browser Storybook/Vitest project; the jsdom unit
  tests never detect the CSS animation at all, so `Presence` skips straight to unmounting there —
  both are correct for their own environment, not a discrepancy to fix).
- **Feature-completeness gap (named against MUI's `Backdrop`): no way to render content on top of the
  scrim** (a common real pattern — a centered `Spinner` for a full-page loading overlay). Added
  `children?: ReactNode`, rendered explicitly (previously only reachable by accident through the
  untyped `...props` spread) and centered via `.root`'s new `display: flex; align-items: center;
  justify-content: center`. Covered by a new unit test, a new `WithContent` story, and a "Design
  tokens"-adjacent Code example.
- **Feature-completeness gap (named against MUI's `Backdrop`/Chakra's `ModalOverlay`): no enter/exit
  transition.** MUI wraps its own in `Fade`; Chakra animates `ModalOverlay` via Framer Motion.
  `Backdrop` previously mounted/unmounted instantly. Added a plain `open?: boolean` prop (default
  `true`) rendering through Radix `Presence`, with `data-state="open"|"closed"` driving new
  `fadeIn`/`fadeOut` `@keyframes` (`--dbm-motion-duration-base` / `--dbm-motion-easing-standard`,
  mirroring `Collapse`'s own `[data-state]`-keyed animation pattern). The keyframes deliberately omit
  the endpoint that isn't `0` (`from { opacity: var(--dbm-opacity-0) }` for fade-in, `to { opacity:
  var(--dbm-opacity-0) }` for fade-out) so the animation always resolves to whatever the `opacity`
  prop currently sets inline — verified live via `getComputedStyle` that this correctly lands on
  `0.6` (the default), not a hardcoded `1`. See `guidelines/adr/0010` for why this is a plain `open`
  boolean rather than the usual `open`/`defaultOpen`/`onOpenChange` trio, and why `@radix-ui/react-
  presence` (previously only transitive, now an explicit direct dependency) was the right tool over
  a hand-rolled solution or the `motion` peer dependency. `open` defaulting to `true` keeps the
  original `{isOpen && <Backdrop />}` usage pattern working unchanged (still fades in on mount, no
  behavior change) while enabling a new `<Backdrop open={isOpen} />` (always rendered) pattern for a
  real fade-out — both documented on `open`'s own JSDoc and demonstrated in a new `AnimatedDismiss`
  story alongside the original `ClickToDismiss` one.
- Docs page (`Backdrop.mdx`) built to the full template — visually verified section by section in a
  running Storybook instance, both brands × both modes.

**Real bug found and fixed during the Docs-page build, 2026-09-05:** the Playground's `meta.args`
originally set `open: true` (`Backdrop`'s real component default), which — live-verified — portaled a
genuine full-viewport dimming scrim over the *entire Docs page* the instant it loaded, no reader
action needed. Root cause: every `<Canvas>` embedded in one Docs page shares one real underlying
document (`07-storybook-and-documentation-standards.md` §4.1), so a portaled, `position: fixed`
element inside any embedded story's Canvas escapes that Canvas's own bounds and covers the whole
page — the same class of bug already documented there for a `window`-scroll-driven story, just for a
portaled overlay instead. Fixed by defaulting the Playground's `open` arg to `false` (documented
inline in the story file, deliberately diverging from the real component default for exactly this
reason) — the reader can still toggle it on to preview the real behavior, which is a deliberate,
reader-initiated action rather than an unprompted one.

**Second bug found the same way, same session:** once a reader *does* toggle `open` on in the
Playground, the resulting fixed, high-`z-index` scrim sits directly on top of the very Controls panel
that would toggle it back off (both live in the same shared document) — a real dead-end with no
visible way out. Fixed by wiring the Playground's `onClick` (via `useArgs` from `storybook/preview-
api`) to call `updateArgs({ open: false })` in addition to the existing `fn()` logging, so clicking
the scrim itself closes it — this also happens to demonstrate the real click-to-dismiss pattern
accurately rather than leaving the demo inert. Verified live via direct DOM inspection (`aria-checked`
on the Controls switch, `data-state` on the scrim) rather than screenshot alone, since the Browser
pane's screenshot capture proved unreliable for confirming this specific interaction — `getComputedStyle`
and the real Radix `data-state`/`aria-checked` attributes were the trustworthy signal.

**Also found and fixed in passing:** the Accessibility section's first draft cited
`03-token-system-spec.md` by path directly in reader-facing prose — a real instance of the standing
mistake `07-storybook-and-documentation-standards.md` §4 already warns about (never reference an
internal `guidelines/*.md` path in visible page content). Removed; the underlying claim (`bg.overlay`
is exempt from contrast requirements) stands on its own.

**Final end-to-end pass, 2026-09-05.** Re-ran the full `06-engineering-standards.md` §9 checklist
against the current state: `tsc --noEmit`, `eslint --max-warnings 0`, the full Vitest suite (both the
jsdom `unit` project and the real-browser `storybook` project — 22/22 for `Backdrop` specifically,
1281/1281 across the whole package), a real `tsup` package build, `pnpm audit` (zero known
vulnerabilities after adding `@radix-ui/react-presence` as a direct dependency), and
`check-component-bundle-size` (0.56KB JS / 0.25KB CSS gzipped — well under budget, no meaningful
regression from the new dependency). Live-verified in a running Storybook instance: the Playground
and all 5 gallery stories, the Docs page section by section (TOC, both Callouts, all `TokenRow`
swatches, both `RelatedCard` live previews), across Purple/Emerald × Light/Dark.

**Follow-up (2026-09-05, same day):** the Playground's canvas showed literally nothing when `open`
defaults to `false` (see above) — no button, no label, nothing to signal the story wasn't broken.
Added a `Text color="tertiary"` placeholder ("Toggle "open" below to preview the backdrop.") above
the `Backdrop` in the Playground's own render, visually verified in both the standalone story view
and embedded in the Docs page. `InPlace` and the interaction-only story were left as-is — both
already render the backdrop panel itself on load (a visible dimmed box), unlike the Playground's
true-empty default state, so neither has the same "looks broken" gap.

**Follow-up (2026-09-05, same day) — real Controls-panel wiring audit, at explicit request.** Found
three distinct real gaps, none caught by the original pass:
- **`blur` was genuinely applying (`backdrop-filter` correctly resolved in every check above) but
  never visibly demonstrable** — every story dimmed/blurred a flat, empty canvas with nothing behind
  it, so toggling `blur` produced no perceptible change even though it was working. Added a small,
  reusable `DemoBackground` (a colorful grid of token-backed color blocks, Storybook-only) rendered
  behind the scrim in `Playground`, `ClickToDismiss`, `AnimatedDismiss`, `Blurred`, `WithContent`, and
  `InPlace` — confirmed live, both `opacity` and `blur` are now clearly visible against it.
- **Every gallery story's Controls panel was a confirmed instance of the exact "render ignores args"
  anti-pattern** `07-storybook-and-documentation-standards.md` §5 already warns about: `ClickToDismiss`/
  `AnimatedDismiss`/`Blurred`/`WithContent`/`InPlace` all rendered from local `useState`, never
  touching `args`, yet each inherited a full 10-row Controls panel from `meta.argTypes` that looked
  interactive and did nothing. **Corrected same day, at explicit direction, after first reaching for
  `parameters: { controls: { disable: true } }` on all of them** — too blunt, per the standing
  precedent this project already established on Avatar's own matrix stories (`06-engineering-
  standards.md` §9: "a same-day whole-panel-disable attempt at Avatar's matrix stories was reverted
  for being too blunt... reserve whole-panel disabling for stories with no controllable args at
  all"). The correct fix, matching the "all sizes"-style precedent instead: each story's `render` now
  accepts `args` and genuinely forwards whichever props aren't the thing that story is fixed to
  demonstrate (`children`/`opacity`/`blur` stay live throughout), with a per-story `argTypes`
  override (`control: false`) suppressing only the one or two axes that story's own pattern can't
  honor — `open` in `ClickToDismiss`/`Blurred`/`WithContent` (that pattern doesn't use the `open` prop
  at all), `open` in `AnimatedDismiss` (bound to its own trigger button, not the panel), `blur` in
  `Blurred` and `children` in `WithContent` (each the one fixed, whole-point axis of its own story).
  `InPlace` goes the other way — its own local `args: { open: true }` override keeps `open` genuinely
  live (toggling it now plays the real, contained exit animation) while overriding the meta-level
  default that would otherwise show nothing on load. `ClickToDismissInteraction` is the one
  legitimate whole-panel-disable case left (a scripted `play`-function-only story, not part of the
  Docs page's embed list, matching `ThemeProvider.stories.tsx`'s `LiveThemeToggle` precedent for "no
  controllable args at all"). Verified live, story by story: every remaining control genuinely drives
  its own canvas, and every suppressed one shows "-" rather than a dead-looking widget.
- **`inPortal` can never produce a visible difference in any Storybook Canvas** — confirmed live via
  `getComputedStyle`: `position: fixed` resolves against the preview iframe's own viewport regardless
  of where in the DOM the element is portaled to, so toggling it produced identical dimensions/
  position both ways. Its real purpose (skipping a redundant portal inside a future `Dialog`) is
  invisible by design when used correctly. Changed its `argTypes` entry to `control: false` (still
  fully described in the Properties table) rather than leaving a control that could only ever look
  broken — added to `Backdrop.mdx`'s `PlaygroundControls exclude` list to match.

**Follow-up (2026-09-05, same day) — blur intensity increased, at explicit direction.** After the
wiring audit above, the user reported still not perceiving any blur with `blur` toggled on. Diagnosed
by isolating the variable: a standalone, non-Storybook HTML page with the identical `backdrop-filter:
blur(24px)` over the same colored blocks rendered a strong, obvious blur in the same browser session,
while the live `Backdrop` scrim inside the Storybook preview iframe showed only a faint effect at
8px — and, tested live via direct style overrides, an *identical*, still-faint result at 24px and even
64px, ruling out radius as the variable inside that specific context. At the time this was
(incorrectly) attributed to iframe-boundary compositing. Independent of that theory,
`--dbm-space-2` (8px) is on the low end for a "frosted glass" effect by common UI convention
regardless of environment, so the blur radius was doubled to `--dbm-space-4` (16px). Updated
`Backdrop.module.css`, `Backdrop.test.tsx`'s two blur assertions, and `Backdrop.mdx`'s token row to
match. Re-verified: `tsc`, `eslint`, both Vitest projects (22/22) clean.

**Follow-up (2026-09-05, same day) — the actual root cause found and fixed, at the user's insistence
that intensity wasn't the real issue (correctly — see above).** Systematically isolated every
variable between a bare HTML reproduction (blur worked perfectly) and the live `Backdrop` (blur
barely visible), each ruling out one candidate: iframe boundary (a bare iframe reproduced blur
perfectly — not the cause), dynamic DOM insertion timing (not the cause), the `fadeIn`/`fadeOut`
CSS animation running concurrently (not the cause), the Radix `Portal` wrapper `<div>` (moving the
real scrim to be a direct child of `document.body` made no difference — not the cause), stylesheet-
vs-inline CSS (not the cause), `display: flex` on `.root` (not the cause). The one variable that,
when reproduced, exactly reproduced the bug: **the element's own CSS `opacity` property, applied
together with `backdrop-filter` on the same element.** A `position: fixed` scrim with `opacity: 0.6`
(the mechanism `Backdrop` used for its `opacity` prop) is rendered as a whole layer (fill +
backdrop-blur) and then that *entire layer* is blended back with the sharp, unblurred content
behind it at 60% — letting 40% of the sharp original page bleed back through, visibly diluting the
blur. Confirmed by removing element opacity (baking the same alpha into `background-color` via
`color-mix()` instead, leaving element opacity at `1`) with everything else identical: the blur
rendered at full, correct strength. This was a real, structural bug in `Backdrop`'s own
implementation — not a Storybook, React, or screenshot-capture artifact — and it had a second,
previously-undiscovered consequence: `children` (finding #5's own feature, e.g. a loading `Spinner`)
was *also* being unintentionally dimmed by the same element-level opacity, when a loading indicator
should render at full, undimmed opacity on top of the scrim.

**Fix:** `opacity` (the prop) now sets a `--dbm-backdrop-fill-opacity` CSS custom property instead of
the element's own `opacity`; `.root`'s `background-color` is `color-mix(in srgb, var(--dbm-bg-overlay)
calc(var(--dbm-backdrop-fill-opacity, var(--dbm-opacity-60)) * 100%), transparent)` — the alpha is
mixed into the fill itself, fully token-driven (`calc()` against the existing `--dbm-opacity-*`
scale, no raw numbers), with the element's own opacity left at its default `1`. The `fadeIn`/
`fadeOut` keyframes now animate a plain presence fade (`0` → `1` → `0`), decoupled from the dimming
amount, which also simplified them — no longer need the "omit the endpoint, fall through to the
prop-driven inline value" trick from the enter/exit-animation work earlier in this review, since the
animated value is now a constant. Updated `Backdrop.test.tsx`'s opacity assertions to check the new
custom property (and explicitly assert the *old* mechanism, element `opacity`, is no longer set) and
the background-color test to check for `color-mix`/the token reference rather than an exact string
match (`calc()`/`color-mix()` round-trip through jsdom with their source whitespace preserved
verbatim, confirmed empirically, hence the substring checks rather than `toHaveStyle`'s exact
match). Re-verified live in a running Storybook instance: `blur` now shows a strong, unmistakable
frosted-glass effect. Full re-run: `tsc`, `eslint --max-warnings 0`, both Vitest projects (22/22),
1281/1281 package-wide, a real `tsup` build.

**Follow-up (2026-09-05, same day) — blur radius reverted to `--dbm-space-2` (8px), at explicit
direction.** With the opacity/backdrop-filter bug now fixed, the earlier intensity bump to
`--dbm-space-4` (16px) was no longer needed to compensate for anything — 8px renders as a genuinely
visible, correctly-composited blur on its own. Reverted `Backdrop.module.css`, `Backdrop.test.tsx`'s
two blur assertions, and `Backdrop.mdx`'s token row back to `space.2`. Re-verified live: 8px shows a
clear, softer blur (as expected, less intense than 16px, but no longer washed out). `tsc`, `eslint`,
both Vitest projects (22/22), and the full package suite (1281/1281) all clean.

**Follow-up (2026-09-05, same day) — blur radius reduced again to `--dbm-space-1` (4px), at explicit
direction.** Same mechanical change as the previous revert: updated `Backdrop.module.css`,
`Backdrop.test.tsx`'s two blur assertions, and `Backdrop.mdx`'s token row. Re-verified live: 4px
still reads as a clear, visible frosted-glass effect (softer than 8px, not washed out) now that the
underlying opacity/backdrop-filter bug is fixed. `tsc`, `eslint`, both Vitest projects (22/22), and
the full package suite (1281/1281) all clean.

**Follow-up (2026-09-05, same day) — `WithContent` story's `Spinner` had no color token at all, at
the user's request to verify.** The story's `<Spinner size="xl" />` had no `tone` prop, so it
inherited the browser's default black `currentColor` — confirmed live via `getComputedStyle`
(`color: rgb(0, 0, 0)`) in both light and dark mode, functionally invisible against the dark
dimming scrim. Checked every existing `icon.on-*` semantic token as a possible fix and found none
were actually correct: each pairs with a `bg.*` that gets *lighter* in dark mode (so its own `on-*`
counterpart deliberately flips to a *dark* color to match, per the dark-mode solid-fill pattern),
but `bg.overlay` stays `neutral.black` in every theme/mode — an existing `on-*` token would go
dark-on-black in dark mode, i.e. still broken. Added a new semantic token, `icon.on-overlay`
(`packages/tokens/src/semantic/*.json`, all 4 themes, white in every one — mirroring `bg.overlay`'s
own brand/mode-agnostic precedent), rather than reuse an incorrect existing one or inline a hardcoded
color. Added to `Foundations/Color.mdx`'s icon array (`check-foundations-token-coverage.mjs` passes).

**Deliberately did not** add `"on-overlay"` as a named option on `Icon`'s/`Spinner`'s own `IconTone`
union — both are Finalized (`icon.on-overlay` would need adding to `Icon.tsx`'s *and* `Spinner.tsx`'s
own exhaustive `Record<IconTone, ...>` tone-class maps, a change to two Finalized components' own
files, which needs its own explicit confirmation first per `06-engineering-standards.md` §9's
Finalized-components rule — flagged rather than done silently). Fixed the story instead via
`Spinner`'s own `style` prop (`style={{ color: "var(--dbm-icon-on-overlay)" }}`), which needed no
change to either Finalized component. Re-verified live: white spinner, clearly visible, in both
light and dark mode (`getComputedStyle` confirmed `rgb(255, 255, 255)`). `tsc`, `eslint`, the full
Vitest suite (1281/1281), and a real `tsup` build all clean.

**Follow-up (2026-09-05, same day) — `tone="white"` added to `Icon`/`Spinner`, at explicit
direction, resolving the item flagged above.** `icon.on-overlay` (the token added above) was
renamed to `icon.white` the same day, also at explicit direction — a deliberate exception to this
system's usual semantic-over-primitive token naming, since the value is white in all 4 themes and
isn't expected to change (see `guidelines/component-reviews/Icon.md` and `Spinner.md` for the full
write-up of that change, including the three-question-test reasoning for why both stay Finalized).
`Backdrop.stories.tsx`'s `WithContent` story now uses `<Spinner size="xl" tone="white" />` directly,
replacing the earlier manual `style={{ color: "var(--dbm-icon-on-overlay)" }}` override.

## Related components

`Portal` (composition dependency), `Spinner` (a `children` pairing), `guidelines/adr/0010` (the
`open`/`Presence` pattern this review established).
