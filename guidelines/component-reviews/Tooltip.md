# Tooltip — Storybook/component review findings

Full `06-engineering-standards.md` §9 review pass run 2026-09-05. Findings included two real
baseline-correctness gaps (no native prop passthrough at all, one hardcoded value) and three
approved judgment-call feature additions, the largest being a real architectural gap in how the
component shares (or rather, doesn't share) hover-delay timing across multiple instances.

**Fixed:**
- **`TooltipProps` accepted zero native passthrough.** Unlike every other atom in this system
  (`05-component-api-conventions.md` §3), the interface didn't extend any base props type at all —
  no `className`/`style`/`id`/`data-testid` support on the rendered tooltip content (a real single
  DOM node, portaled — `Tooltip` itself takes no `ref`, but this is exactly the element these
  props should target). Now extends `Omit<ComponentPropsWithoutRef<"div">, "children" | "content">`
  (both omitted keys collide with this component's own differently-typed `children`/`content` —
  `content` in particular is a genuine, easy-to-miss native `<div>`-adjacent attribute confirmed
  only by `tsc` itself flagging the incompatible-override error, not anticipated in advance),
  spread onto `Tooltip.Content`. `id`/`className`/`style`/`data-testid`/`aria-label` explicitly
  redeclared with their own JSDoc for Properties-table visibility, matching established convention.
- **Hardcoded `max-width: 20rem`** in `Tooltip.module.css` — confirmed via a package-wide grep, the
  only non-token dimension value in any component's CSS. No existing scale value matched 20rem, so
  added a new component-layer token (`packages/tokens/src/component/tooltip.json`,
  `tooltip.max-width`) rather than inline the literal, matching `Indicators`'/`Avatar`'s own
  precedent for exactly this situation (`03-token-system-spec.md`).
- **`skipDelayDuration` was silently non-functional.** *(Judgment call, approved.)* Each `Tooltip`
  wrapped its own isolated Radix `Provider`, so Radix's "don't re-delay when quickly moving between
  adjacent tooltips" behavior could never trigger across separate `Tooltip` instances (a toolbar of
  icon buttons, each with its own tooltip, being the concrete motivating case) — confirmed by
  reading Radix's own compiled source (`skipDelayDuration` lives only on `TooltipProviderProps`,
  never on the per-instance `Tooltip`/`Root` props). Fixed by adding a new co-located
  `TooltipProvider` component (`TooltipProvider.tsx`/`.types.ts`, plus a small
  `TooltipProviderContext.ts` sentinel context) that a consumer can optionally wrap once near their
  app root — `Tooltip` reads that context via `useContext` and skips rendering its own nested
  `Provider` only when an ambient one is already present, falling back to its existing "zero setup"
  auto-wrap otherwise. Purely additive: a standalone `Tooltip` behaves identically to before.
  `delayDuration`/`disableHoverableContent` were changed from hard destructuring defaults to
  `undefined`-unless-set, so an unset value correctly inherits whichever `Provider` (ambient or our
  own auto-wrapped one) is actually in scope, matching Radix's own `?? providerContext.X` fallback
  logic exactly rather than always shadowing it with a JS-level default.
  **Verification note:** the actual cross-tooltip skip-delay behavior depends on Radix's real
  continuous-pointer grace-area tracking, which neither a jsdom unit test nor manual Browser-pane
  event dispatch could reliably reproduce (both looked like the feature was broken; investigated
  rather than accepted at face value) — confirmed genuinely working via a `play` function using
  real `userEvent.hover`/`unhover` sequences in the actual Playwright-driven browser test runner
  (`storybook` Vitest project), which passed cleanly.
- **No `disableHoverableContent` support.** *(Judgment call, approved.)* A real Radix `Root`-level
  prop (confirmed dual Provider/Root, not Provider-only) that closes the tooltip immediately on
  pointer-leave instead of letting the pointer travel into the content — added, with the same
  standalone-vs-ambient-`Provider` inheritance as `delayDuration` above.
- **No arrow-visibility toggle.** *(Judgment call, approved.)* MUI's `arrow`/Chakra's `hasArrow`
  let consumers hide the pointer arrow; ours always rendered one. Added `hideArrow?: boolean`
  (default `false`, preserving the existing visual default rather than flipping it to match those
  libraries' own opt-in default, since this component isn't newly-introduced and changing the
  default would be a visible behavior change to every existing usage).
- **`aria-label` not exposed.** Radix's own `Tooltip.Content` supports a dedicated `aria-label` for
  when the visible `content` isn't a suitable accessible description (rich/non-text content).
  Redeclared with JSDoc — and corrected mid-implementation once its actual behavior was tested: the
  visible bubble doesn't lose `content` at all (still renders normally), and Radix doesn't literally
  remove `role="tooltip"` — it renders a *separate*, visually-hidden element carrying `role="tooltip"`
  and this string, which is what the trigger's `aria-describedby` actually resolves to. The original
  JSDoc draft got this backwards (assumed by reading `role: ariaLabel ? void 0 : "tooltip"` in
  isolation without also reading the `VisuallyHidden` companion element a few lines below); caught by
  a failing unit test asserting the wrong behavior, not assumed correct.
- **JSDoc was thin relative to every other reviewed component.** Every prop rewritten with
  elaboration on interaction behavior, defaults, and cross-references, matching the standard
  established on `Collapse`/`Backdrop`/`Indicators`.
- **No test coverage for hover-triggered open or Escape-key dismissal.** Only focus-triggered open
  was tested. Added both, plus coverage for the new `className`/`style`/`id`/`data-testid`/
  `aria-label`/`hideArrow`/`disableHoverableContent` props and `TooltipProvider`'s own basic
  behavior — net 6 → 15 unit tests after also removing the one jsdom-unreliable skip-delay test
  discussed above, replaced by the real-browser `play` function instead.
- **No play-function interaction test.** Added `ToggleInteraction` (hover opens, Escape closes) and
  `SharedProviderInteraction` (the skip-delay verification above) — the latter deliberately **not**
  referenced from `Tooltip.mdx`'s Variants gallery. Found live, the hard way: every `<Canvas>`
  embedded in one Docs page shares one real document
  (`07-storybook-and-documentation-standards.md` §4.1), so when this play function's own
  `document.body`-scoped tooltip query first lived on the *visual* `MultipleWithSharedProvider`
  story (which *is* embedded), it threw "found multiple elements with role tooltip" the moment
  another story's own tooltip was also open on the same shared Docs page. Split into two stories —
  `MultipleWithSharedProvider` stays visual-only (safe to embed), `SharedProviderInteraction` is a
  separate, sidebar-only story carrying the assertions, matching `ToggleInteraction`'s own precedent
  and Collapse's/Backdrop's established pattern for exactly this class of story.
- **Existing stories' Controls panels weren't fully wired.** `Sides`/`IconTrigger` used bare
  `render: () => (...)` with no `args` at all (the "render ignoring args" anti-pattern already
  fixed elsewhere in this codebase); `Default`'s own `argTypes` covered only `side`/`align`. All
  three converted to genuinely `args`-driven renders. Added a `Playground` story (`children`, the
  trigger, mapped via `argTypes.mapping` onto a curated set — matching `Collapse`'s own `trigger`
  precedent for a non-primitive required prop) and the `MultipleWithSharedProvider` demo story.
  **Self-inflicted gap caught during Docs-page verification, not before:** the Storybook
  `argTypes.description` strings written for the Controls-panel tooltips were short paraphrases,
  but the Docs page's own `PropertiesTable` pulls its Description column from that exact same
  `argTypes` field, not the richer TypeScript JSDoc — so the live Properties table initially showed
  the abbreviated versions (missing, for example, `delayDuration`'s entire standalone-vs-
  `TooltipProvider` inheritance explanation). Rewritten to carry the full JSDoc content.
- Docs page (`Tooltip.mdx`) built to the full template — visually verified section by section in a
  running Storybook instance (Playground, the Properties table's full 15-prop list with complete
  descriptions confirmed via direct DOM inspection after the gap above was caught and fixed, all 4
  gallery stories, both Do/Don't Callouts, the Accessibility Callout, the Design tokens section with
  the new `tooltip.max-width` token, both RelatedCards), Purple × Light/Dark, mobile viewport,
  TOC confirmed showing all 10 sections in order, zero console errors on a genuinely fresh page load
  (a stale console-buffer artifact from an earlier, since-fixed run was initially mistaken for a
  live recurrence — confirmed via a brand-new browser tab before concluding the fix actually held).

**Live-verified beyond the automated suite:** hover-open and dark-mode rendering on the Playground;
`side`-based repositioning on the `All sides` story (a `right`-sided tooltip actually rendering to
the right of its own trigger, overlapping the next button as expected); the `bg.neutral`/
`text.on-neutral` pairing correctly staying a light solid-fill even in dark mode (the established
"dark-mode solid-fill" convention already verified for this exact pairing in
`03-token-system-spec.md`, not a new contrast concern); the real skip-delay behavior end-to-end via
the `SharedProviderInteraction` play function, run in the actual Playwright browser rather than
assumed from the implementation alone.

Tests: 6 → 15 (unit) + 7 story tests (up from 3, all now genuinely `args`-driven; 2 carry `play`
functions). Self-verified: `tsc --noEmit`, `eslint --max-warnings 0` (both clean, package-wide), the
full Vitest suite (22/22 for `Tooltip` specifically across both projects, 1310/1310 package-wide), a
real `tsup` build, `pnpm audit` (zero known vulnerabilities), and `check-component-bundle-size`
(0.51KB JS / 0.36KB CSS gzipped for the whole `Tooltip` folder, `TooltipProvider` included — well
under budget).

Review pass complete — all findings actioned. Per `06-engineering-standards.md` §9, "Finalized" is a
status the user declares explicitly, not one a review pass asserts on its own; awaiting that
confirmation before this entry (and `07-storybook-and-documentation-standards.md` §6's status table)
records a Finalized date.

## Related components

`Button`/`IconButton` (the most common `Tooltip` triggers), `Collapse` (the precedent this review's
Docs-page-embedding play-function split and `asChild`-adjacent native-passthrough gap followed),
`ThemeProvider` (the precedent for a co-located, app-root-level provider component,
`skipDelayDuration`'s own reason for existing).
