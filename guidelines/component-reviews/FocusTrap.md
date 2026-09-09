# FocusTrap

**Tier:** Atom · **Category:** Utility · **Finalized:** pending — review pass complete, awaiting
user confirmation

## Review pass (2026-09-09)

Full `06-engineering-standards.md` §9 pass — first review for this component. Findings, in the
order fixed (Playground-missing first, Docs-page-missing last, per the standing reporting
convention):

1. **Playground story added.** `FocusTrap.stories.tsx` previously only had a `Default` story with
   args set directly on `meta.args` and no `argTypes` at all (no descriptions, no explicit controls
   for any prop). Now has a dedicated `Playground` with `loop`/`trapped`/`asChild` as real, live
   boolean switches; `children`/`onMountAutoFocus`/`onUnmountAutoFocus`/`id`/`className`/`style`/
   `data-testid` correctly set to `control: false` with real descriptions (none of these are
   meaningfully live-editable — `children` is a fixed illustrative form, the rest are escape
   hatches/callbacks).

2. **A real, confirmed gap found and fixed: `asChild` support was completely missing, and the
   component's own type was silently drifting from what it wraps.** `FocusTrapProps` hand-rolled its
   own `extends ComponentPropsWithoutRef<"div">` plus a manual copy of Radix `FocusScope`'s four
   props (`loop`/`trapped`/`onMountAutoFocus`/`onUnmountAutoFocus`) instead of extending Radix's own
   exported `FocusScopeProps` — which already includes all four of those *and* `asChild` (Radix
   `FocusScope` is built on `Primitive.div`, which supports `asChild` via `Slot`). This is the exact
   established pattern this system already uses for its two other Utility-category Radix wrappers
   (`Portal`, `VisuallyHidden` — both extend the real Radix prop type directly and both document
   `asChild`), confirmed by reading their own `.types.ts` files; `FocusTrap` was the outlier. Fixed
   by switching `FocusTrapProps` to extend the real `FocusScopeProps` import. Verified live, both
   ways, via direct DOM inspection (not assumed): with `asChild` unset, the rendered box is wrapped
   in an extra `<div tabindex="-1">` with no styling of its own; with `asChild` set, that wrapper
   disappears and `tabindex="-1"` merges directly onto the caller's own element — confirmed via the
   Storybook Playground's own live switch (toggled it, read the resulting canvas HTML both ways) and
   codified as a permanent regression test. Documented in the component's own JSDoc and a second
   `@example`, mirroring `Portal`'s established documentation style for the same feature.

3. **`children` had no JSDoc at all** — fixed, now documented in `FocusTrap.types.ts`.

4. **`className`/`style`/`id`/`data-testid` now explicitly redeclared** in `FocusTrap.types.ts` with
   their own JSDoc (previously only worked structurally via the inherited native props, invisible to
   the Properties table per the confirmed docgen gap already documented in
   `05-component-api-conventions.md` §3).

5. **A real, previously completely untested gap: the component's own defining, headline claim
   — "focus cannot escape the trap" — had zero test coverage.** Every prior test only verified
   looping *among* the trap's own children; none verified that `trapped` actually prevents focus
   from reaching an element rendered outside it, which is the entire reason this component exists.
   Added two tests: one confirming `trapped` blocks Tab from reaching an outside button, and a
   negative-control test confirming the same Tab *does* escape without `trapped` — proving the first
   test's result is a real effect of the prop, not an artifact of the DOM structure or jsdom's own
   Tab handling. Also added a reverse (`Shift+Tab`) loop test (only the forward direction was
   previously covered) and two `asChild` tests (DOM-shape + a11y). 9/9 tests passing, up from 4.

6. **Feature-completeness:** compared against comparable production focus-trap implementations —
   `asChild` (finding 2) was the one real, concrete gap; already fixed. Considered adding a plain
   boolean convenience prop for "restore focus on close" and deliberately did not — Radix's own
   `onUnmountAutoFocus` already returns focus to the previously-focused element by default and gives
   a documented escape hatch for the rare case that default isn't wanted; adding a second, redundant
   API surface on top of an already-thin, faithful Radix wrapper (the same minimal-surface pattern
   `Portal`/`VisuallyHidden` follow) would be exactly the kind of unrequested scope creep
   `06-engineering-standards.md` §9's guardrail warns against.

7. **A real, previously-undetected infrastructure gap found while writing the Docs page: this
   project's MDX pipeline had no GFM table support at all** (`remark-gfm` wasn't in the dependency
   tree anywhere), so a markdown table rendered as raw, unparsed pipe-and-dash text instead of an
   actual table — confirmed live, not assumed (a `| Key | Behavior |`-style table in the
   Accessibility section rendered as literal text on the page). No other Docs page had ever
   attempted a markdown table, so this was invisible until now. Initially worked around within this
   component's own page (converted to a nested bullet list) since adding a new build dependency was
   out of scope for a single-component review; **fixed for good the same day, at explicit user
   request, as its own dedicated follow-up** — `remark-gfm` added as a devDependency and wired into
   `.storybook/main.ts` (full reasoning: `02-tech-stack-and-structure.md`'s own entry,
   `07-storybook-and-documentation-standards.md` §4.1's own gotcha entry). This page's own
   Accessibility section now uses a real table again, re-verified live in both light and dark mode.

8. **Properties table's `Default` column was blank for `loop`/`trapped`/`asChild`.** Docgen didn't
   surface their real `false` defaults automatically (none are set via a destructuring default in
   `FocusTrap.tsx` — they pass straight through via `{...props}` to Radix's own `FocusScope`, which
   applies the default internally). Fixed with an explicit `table: { defaultValue: { summary: "false"
   } }` on each, the same fix pattern already established on `Tooltip`/`ClientOnly`. Confirmed live —
   all three now render `false` instead of `—`.

9. **Docs page added** (`FocusTrap.mdx`) — the second Docs page in the Utility category (after
   `ClientOnly`), full 10-section template, first in the sidebar group. Includes the first
   play-function interaction story in this category (`KeyboardInteraction` — `FocusTrap` is
   genuinely keyboard-interactive, unlike `ClientOnly`), scripting the real Tab-cycle-and-never-
   escape behavior live in the Interactions panel. Live-verified: TOC renders all 10 section
   headings, Properties table renders all 10 props in the declared order with the corrected `false`
   defaults, the Playground's `asChild` switch genuinely drives the canvas (toggled it, confirmed the
   wrapper `<div>` appears/disappears via direct DOM inspection, not just visually), both story
   canvases (`Default`, `MergedOntoChild`) render real content, the `KeyboardInteraction` story's
   play function reports **PASS** with all 7 steps green in the Interactions panel, `Default` and
   `MergedOntoChild` both report "No accessibility violations found" in the live Accessibility panel,
   both `RelatedCard`s (`Backdrop` via its own established `inPortal={false}` preview pattern,
   `Portal` via its own `disablePortal` prop) render live, correctly-scoped previews with correct
   links, zero console errors throughout, and both brand themes × both color modes confirmed with no
   breakage in the shared Docs chrome/Callouts/code blocks/RelatedCards (`FocusTrap` itself has no
   tokens of its own to vary by theme).

## Verification

`tsc --noEmit` (main package build via `tsup`'s `.d.ts` generation, and `.storybook`), `eslint`
(whole package, zero warnings), full `vitest` unit suite (1056/1056 passing across the whole
package, 9/9 for `FocusTrap` itself, up from 4), `tsup` build, and the `@storybook/addon-vitest`
Storybook test project (`pnpm test:storybook`, 369/369 across all 50 component story files,
including `FocusTrap`'s own) all run and passing. Live-verified in a running Storybook instance: the
`asChild` DOM-shape difference was reproduced directly (both states) before writing the permanent
regression test; the play-function interaction story's own PASS/7-step result was read directly from
the Interactions panel, not assumed from the code; the Accessibility panel's live scan was checked on
both `Default` and `MergedOntoChild`; both brand themes and both color modes were toggled and
re-screenshotted, not inferred.

No prior `component-reviews/` entry existed for this component (first pass).

## Post-review fix: Docs page tab order (2026-09-09, same day, user-reported)

User report: on `FocusTrap.mdx`, the first focusable input encountered was inside the "Merged onto
a single child (asChild)" Variants-section story, not the Playground canvas above it — despite
Playground appearing first both visually and in the DOM.

Root cause: **two independent, confirmed Radix `FocusScope` behaviors**, both keyed to mount order
rather than DOM/visual order, both triggered by having two `FocusTrap` instances mounted
simultaneously on the same Docs page (Playground's own Canvas and `MergedOntoChild`'s, both
embedded via `<Canvas of={...}/>` in the MDX). Live-browser observation alone proved too
timing-sensitive to pin down reliably (TOC rendering and Vite HMR introduced real noise across
attempts) — root-caused instead with a deterministic RTL test simulating the actual two-canvas
page structure, then confirmed live afterward.

1. **Ongoing Tab-key capture:** `trapped` keeps a single global stack of active trapped scopes —
   whichever mounted *last* wins document-wide Tab handling, not whichever comes first in the DOM.
   `MergedOntoChild`'s Canvas mounts after Playground's, so its `trapped` (on by default) silently
   stole Tab handling. Fixed by forcing `trapped: false` on `MergedOntoChild`'s own args — this
   story never needed real trapping to make its point (the `asChild` DOM merge).
2. **Initial auto-focus-on-mount:** a second, independent bug, found while re-verifying finding 1
   didn't fully resolve the report — confirmed directly that Radix auto-focuses a `FocusScope`'s own
   first tabbable child on mount whenever nothing else is meaningfully focused yet, and this is
   **not gated by `trapped` at all**. Even with `trapped: false`, `MergedOntoChild`'s later mount
   still stole the page's very first auto-focus from Playground's. Fixed via `onMountAutoFocus`'s
   own documented `preventDefault()` escape hatch, added to `MergedOntoChild`'s `render`.

`loop` was tested and confirmed **not** implicated in either mechanism — no change needed there.

Four new permanent regression tests added to `FocusTrap.test.tsx` (13/13 passing, up from 9),
covering both mechanisms independently (with and without the fix, for each) so a future regression
in either one fails loudly rather than only being catchable by re-noticing the same live-browser
symptom. Re-verified live end to end after the fix: `document.activeElement` on a fresh page load
(zero interaction) is Playground's own first field, confirmed across two independent reloads; the
`asChild` DOM-merge behavior and `MergedOntoChild`'s own zero-violations Accessibility scan were
both re-confirmed unaffected by the added `onMountAutoFocus` handler. Full suite re-run clean:
`tsc`, `eslint`, 1060/1060 unit tests, `tsup` build, `addon-vitest` 369/369.

## Post-review fix #2: `loop` still silently broken on the Docs page (2026-09-09, same day, user-reported)

User report, immediately following the fix above: `loop` toggled on in the Playground still didn't
visibly wrap focus through the example form. The two fixes above addressed *whether MergedOntoChild
steals Tab/auto-focus for itself* — this is a **third, deeper, independent facet of the same root
mechanism**, missed by both.

**Root cause, confirmed by reading `@radix-ui/react-focus-scope`'s own source directly (not
guessed):** every mounted `FocusScope` — *regardless of its own `trapped`/`loop` values* —
unconditionally registers into one shared, module-level `focusScopesStack` on mount
(`focusScopesStack.add(focusScope)`, ungated by any prop). Adding a new scope to that stack
`pause()`s whichever scope was previously active. A paused scope's own `handleKeyDown` — the
function implementing *both* `trapped` and `loop` — returns immediately (`if (focusScope.paused)
return;`), regardless of what that scope's own props say it should do. So `MergedOntoChild`
mounting **at all** — with `trapped: false`, exactly as fixed above — still paused Playground's own
scope, silently disabling Playground's `loop` wrap-around the instant `MergedOntoChild`'s Canvas was
also present on the page. **No prop combination on `MergedOntoChild` can prevent this** — the
`focusScopesStack.add()` call has no opt-out.

Confirmed via a deterministic RTL test simulating the real Docs-page structure with the fix #1
state applied (`trapped={false}`, `onMountAutoFocus` prevented on the second instance): Tab from
Playground's own last field still didn't wrap back to its first — it escaped into the second
instance instead, matching the user's exact report. Live-browser re-verification (real Tab
key-presses on the actual Docs page) confirmed the same, once a reliable click-first-then-Tab
methodology was established — plain live-browser Tab-counting alone proved too timing-sensitive
(TOC rendering / Vite HMR noise) to trust on its own, consistent with fix #1's own note above.

**Real fix (architectural, not a prop change):** `MergedOntoChild`'s Canvas removed entirely from
`FocusTrap.mdx`'s embed list — the same treatment this project already established for
`BackToTop`'s/`Affix`'s own interaction-sensitive stories that misbehave once embedded alongside
other content on a Docs page (`07-storybook-and-documentation-standards.md` §4.1's "A story whose
own render relies on real `window` scroll..." entry is the direct precedent, same underlying
principle — a story whose correctness depends on being the page's only active instance stays
sidebar-only). Concretely:
- `FocusTrap.mdx`'s Variants section replaces the `<Canvas of={FocusTrapStories.MergedOntoChild}/>`
  with an explanatory `Callout` (naming the real mechanism, not hand-waved) plus a link to the
  standalone story page, where it renders correctly with nothing else competing for focus.
- `MergedOntoChild`'s own story (`FocusTrap.stories.tsx`) reverted to the meta defaults
  (`trapped`/`loop` both on, only `asChild` overridden) — the `trapped: false`/`onMountAutoFocus`
  workaround from fix #1 is no longer needed once it's not coexisting with Playground, and reverting
  gives a more representative demo (`asChild` typically pairs with real trapping, like an actual
  dialog).
- A fifth permanent regression test added to `FocusTrap.test.tsx` (14/14 passing, up from 13),
  codifying this exact mechanism generically: a second mounted `FocusTrap`, even with
  `trapped={false}`, still pauses the first one's own `loop` wrap-around.

**A real, separate, pre-existing bug found and worked around while adding the standalone-story
link:** a plain markdown-syntax link (`[text](/?path=/story/...)`) to that story rendered with a
doubled, broken `href` (`./?path=/?path=/story/...`) — confirmed live, and confirmed **not** caused
by this session's earlier `remark-gfm` addition (reproduces identically with `remark-gfm` fully
removed from `.storybook/main.ts`, tested both ways). This same broken pattern already exists across
at least 8 other, already-Finalized Docs pages (`Center`, `Image`, `GridItem`, `Container`,
`Divider`, `Stack`, `Icon`, `foundations/Color`) — apparently never caught because no prior review
literally clicked through these particular internal links, only confirmed they render. Worked around
in `FocusTrap.mdx` by writing the link as a real inline JSX `<a href="...">` instead of markdown
syntax (confirmed correct — matches the same mechanism `RelatedCard`'s own `href` prop already uses
successfully everywhere). The wider pre-existing bug across the other 8 files is flagged as a
separate follow-up task, not fixed here (out of scope for this component's own review).

Re-verified live end to end: real Tab key-presses on the actual Docs page (First → Second → Third →
wraps back to First, confirmed with only one `FocusTrap` instance now on the page); the standalone
`MergedOntoChild` story's own `href` link renders and navigates correctly; zero accessibility
violations on the standalone story. Full suite re-run clean: `tsc`, `eslint`, 1061/1061 unit tests
(up from 1060), `tsup` build, `addon-vitest` 369/369.
