# EmptyState — Storybook/component review findings

**Data Display:** EmptyState — built 2026-09-19, item 12 in the itemized molecule-tier build order
(`04-component-inventory.md`). Adds two component-token families (`empty-state.content-max-width`, `empty-state.media-max-width.*`) and no new dependency.
**Finalized 2026-09-19** — declared by the user after the full `06-engineering-standards.md` §9 pass and the follow-ups and final
review pass recorded below; see the closing entry at the bottom of this file. Everything above it records the build and review history
leading there.

A compound component of native elements and three existing atoms: `EmptyState` (root) with `EmptyState.Media`,
`EmptyState.Icon`, `EmptyState.Title`, `EmptyState.Description`, and `EmptyState.Actions`. Each sub-part's own props get a
`### EmptyState.{Part} properties` subsection on the Docs page via a hidden, docs-only stories file per
[ADR-0013](../adr/0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md).

## Decisions made during the build

The inventory only said "Icon + message + optional CTA". Unlike `Card`, none of these were put to the user first — they
are mine, made where the request left the API open, and listed here so they can be reversed cheaply.

- **Compound, not one props-driven component** (`<EmptyState icon title description action />`). Consistent with `Card` and
  `Table`, the two molecules built just before it; it keeps the heading level, rich description content, and any number of
  actions in the consumer's hands without a growing list of props (`06-engineering-standards.md` §2). The cost is verbosity —
  five lines instead of one — which the Docs page's snippets absorb. If a one-line shorthand is wanted, it can be added on
  top without breaking anything.
- **Sub-parts: `Media`, `Icon`, `Title`, `Description`, `Actions`.** (`Media` was added in the same-day follow-up below; the
  first build had no separate illustration part and just laid any other child out in the column.) Anything else placed among
  the parts is still laid out in the same column.
- **Root props: `variant`, `tone`, `size`, `align`.** Each traces to a named gap, not "make it fancier":
  - `size` — one component has to serve a table cell and a whole page; without it, consumers would re-pad it by hand.
  - `tone` — "nothing here yet", "you're all caught up", and "something went wrong" share one layout and differ only in
    feeling; the shared `tone` scale (`05-component-api-conventions.md` §2) is the established way to say that. It tints the
    icon badge only — a coloured border or fill would read as an alert, which is a different (future) component.
  - `variant` — `ghost` (default, no surface), `outlined`, `dashed`, `filled`. **`ghost` is the default** — the opposite of
    `Card`'s `outlined` — because an empty state is more often *inside* a container that already has a boundary (a `Card`, a
    `Table.Empty` cell) than a surface of its own; doubling the border is the more common failure. `dashed` is the familiar
    "put something here" placeholder; there is no `elevated`, which would make an empty state look like content.
  - `align` — `center` (default) or `start`. A centred empty state looks adrift in a layout that is start-aligned
    throughout. Implemented with logical values, so it mirrors under right-to-left text with no extra work.
- **`size` reaches the atoms through a small internal React context, not custom properties alone.** `Card` needed no context
  because its sections are plain `div`s styled from custom properties. Here the title, description, and icon are `Heading`,
  `Text`, and `Icon`, whose sizes are *props*, not something a stylesheet can override reliably (the atoms' own CSS Module rules
  and mine have equal specificity, so the winner would depend on stylesheet order). The context holds one value (`size`),
  defaults to `md` for a part used outside a root, and is per-root, so a nested empty state reads its own size (tested).
  Everything else — padding, gap, badge diameter, tone colours, alignment — still flows through custom properties.
- **Title is a real `Heading`, `level` defaults to 3.** An empty state sits inside a section, so one below the section's
  heading is the least-wrong guess; the Docs say to set it to fit the outline. `Heading`'s `as` (decoupling structure from
  looks) is deliberately not exposed — `level` is the only lever, and the `color` attribute an `<h3>` inherits from HTML is
  omitted from the props type since it would clash with `Heading`'s semantic `color`.
- **`role` is a documented prop, unset by default, and `announce` is the way to announce.** A static empty state adds no role.
  The first build documented `role="status"` for one that appears because of a search or filter, with a caveat that announcing an
  *inserted, already-filled* live region is inconsistent across screen readers. The follow-up below builds the reliable version
  as `announce` instead, and the docs now steer to it.
- **Description is capped at a readable line length via a new component token,** `empty-state.content-max-width` (`28rem`).
  It has no home on the spacing scale (which tops out at `8rem`) and is a content-measure constraint rather than a gap, so
  it went to the component layer per `03-token-system-spec.md`'s order of preference, exactly as `tooltip.max-width` and
  `popover.max-width` did. Recorded in `03-token-system-spec.md`.
- **The icon badge keeps the system's subtle-tint language** (`bg.<tone>-subtle` + `icon.<tone>`; neutral is
  `bg.neutral-subtle` + `icon.default`). The icon is coloured from `icon.*` via `currentColor`, never `text.*`
  (`05-component-api-conventions.md` §6). On the `filled` variant the neutral badge would vanish into its own fill, so it sits
  on `bg.surface` there instead.
- **Static, so no `asChild`/`as`, no interactive states, no motion.** Nothing animates; there is no
  `prefers-reduced-motion` concern.

## Baseline correctness

- `forwardRef` on all 6 parts (root `div`; media `div`; badge `div`; title heading; description `p`; actions `div`); a ref test covers
  each. `className`/`style`/`id`/`data-testid` accepted and documented on all 6, tested on each.
- `{...rest}` is spread first on every part; the only computed attributes (`className`, and on the icon the atom's own
  `role`/`aria-*`) come after it.
- Sub-part completeness: every sub-part has full JSDoc, its native props audited (`label` on the icon; `level` on the title;
  the clashing `color` omitted), and its own Properties table on the Docs page. Every prop in `EmptyState.types.ts` carries JSDoc
  (checked mechanically), and there is no `any`, `@ts-ignore`, or `eslint-disable`.
- **Atom-reuse audit:** the icon is `Icon`, the title `Heading`, the description `Text`. The one hand-rolled piece is the actions
  row — five declarations of flex layout — rather than `Stack`, because its justification follows the *root's* `align` through
  a custom property, which `Stack`'s prop-driven `justify` can't read without threading `align` through context too. The same
  call `Card.Footer` made. No defect was found in any consumed atom, so nothing there was reopened.
- Zero hardcoded values: the only literal in `EmptyState.module.css` is the `640px` in an `@media` condition (the value of
  `breakpoint.sm`, which custom properties cannot be used in — the same documented limitation `Card`, `Stack`, and `Grid` carry).
- One dev-mode warning, for the one combination that does something wrong: `announce` together with `role="status"` on the root,
  which would announce everything twice (tested: warns once, and not for either alone). Every other combination the types allow is
  meaningful.

## Accessibility

- A plain container by default: no role, not focusable, no tab stop. Verified live: on the search example the first Tab lands on
  the action button (2px solid focus ring) and the empty state's own root has no `tabindex`.
- The title is a real heading; `level` is settable. The icon is `aria-hidden` unless given a `label`, which makes it an
  `img` with that name. The parts read in DOM order and nothing is reordered visually, so reading and tab order always match the
  screen.
- `aria-labelledby` pointing at the title's `id` names a `role="region"` empty state (tested); `role="status"` and `aria-label`/
  `aria-describedby` pass through (tested).
- **Contrast, measured from the built token values in all four themes** (non-text 3:1 for the icon; AA 4.5:1 for text):
  icon on its tinted badge — neutral 4.51 / 5.86, brand 7.03 / 8.29 (Purple light / dark) and **3.99** / 9.47 (Emerald light /
  dark), info 4.51 / 10.51, success 6.22 / 10.68, warning 4.59 / 10.44, danger 4.86 / 10.32 (light / dark; identical across
  brands). The lowest is Emerald light's brand icon at 3.99:1, which clears the 3:1 floor for graphics; the icon is also
  decorative by default. Text: `text.primary` on `bg.surface` 14.11 / 13.53, on the `filled` fill 13.53 / 9.66; `text.secondary`
  on `bg.surface` 6.88 / 10.47, on the `filled` fill 6.59 / 7.47 (light / dark). Everything clears AA.
- jest-axe clean on every variant, every tone, the default composition, `role="status"`, a labelled `region`, and inside a heading
  outline; axe also runs on every story in real Chromium.
- RTL: verified live under `dir="rtl"` — with `align="start"` the badge, title, description, and action all sit flush with the
  right edge (25px in, the same as the left edge in LTR).

## Responsiveness and theming

- **A real defect, found live at 375px:** at `xl` the 64px padding each side left the description a 165px-wide sliver on a phone
  (`lg` was similar at 48px). Fixed mobile-first (and now guarded by an automated test — see the follow-up below): `lg` and `xl` start at `space.8`/`space.10` and step up to `space.12`/`space.16`
  at the `sm` breakpoint. Re-measured: at 375px the paddings are 16/24/32/32/40px and `xl`'s text column is 213px; at 768px they
  are 16/24/32/48/64px as designed. `xs`–`md` are unchanged.
- No page-level horizontal overflow at 375px on any story; the actions wrap, and long words break rather than overflow. The
  `Table.Empty` composition holds at phone width.
- All four themes covered by tokens alone — verified live in Purple and Emerald, light and dark (variants and tones),
  including the `filled` variant's badge switching to the surface colour so it stays visible.

## Storybook and documentation

Docs page follows the §4 template (ten sections, hidden Intro heading; the TOC lists exactly the template's sections — checked
in the DOM). Eleven visible stories — Playground, All variants, All tones, All sizes, Alignment, Every part is optional, With an
illustration, Search with no results, On a phone, Inside a card, Inside a table — plus five hidden sub-part stories (one per
part, each with its own Properties table). Five have `play` functions: **All sizes** (each step's icon badge is larger than the
last, and round; and, at desktop widths, the full padding of every step), **Alignment** (centred content sits on the centre line;
start-aligned content begins at the start edge), **With an illustration** (a small illustration keeps its size, a 1200px one is
scaled to its size step's cap with its proportions kept, nothing overflows), **Search with no results** (the status region fills
with the message, the icon stays out of the accessibility tree, the title is a level-3 heading), and **On a phone** (see the
follow-up below). Every fixed-render story suppresses the controls it doesn't consume via a shared `noControls` map. Props read
variant → tone → size → align → announce → role → aria-* → id → className → style → data-testid, matching Controls, Playground, and
the Properties table. The Playground has two Storybook-only controls, kept out of the root Properties table the same way `Card`'s `media` is: `actions`
(a demo `EmptyState.Actions` row) and `stackOnMobile` (a prop of that part, added after a review question — without it the prop had
no live control anywhere visible; it only shows below 640px, so its description says to pick a phone size in the toolbar, and the
Playground's snippet writes it on the `Actions` line).

**"Show code"** — every visible story sets `parameters.docs.source.code` to a hand-written snippet from
`EmptyState.snippets.ts`, and the Playground builds its snippet from the live controls (only what differs from the defaults,
plus the demo's two actions when that control is on). Snippets name icons by name with a comment saying where they come from.
Checked three ways: the guard test `storySnippets.test.ts` (picks the file up automatically; the Playground builder is exercised
across a spread of args); a throwaway typecheck of every snippet and 240 Playground combinations against the real components
(clean, and a planted bad prop was caught); and a settled read of all eleven panels on the live Docs page, none showing generated
artefacts. The Playground's canvas and snippet were both confirmed to follow its controls live.

## Functional verification

- 86 unit tests (React Testing Library + jest-axe; 63 from the first build, 20 from the follow-up, 3 from the final pass): structure and DOM order, every variant, size, tone, and alignment (with the
  atoms' own size classes asserted at each step), nesting isolation, the icon's decorative/labelled modes, every heading level,
  accessibility wiring, native-attribute passthrough, refs on all 6 parts, and jest-axe scenarios. Class-name assertions were
  confirmed to be non-vacuous (the CSS-module classes resolve to real strings in the test environment).
- Full package: `eslint --max-warnings 0` and both `tsc --noEmit` passes clean; `tsup` build; `storybook build`; and all three CI
  checks (`check-component-bundle-size` — `EmptyState` at 2.88KB JS / 1.45KB CSS gzipped, which includes the three atoms it
  composes, within budget; `check-foundations-token-coverage`; `check-storybook-bundle-size`). The final test counts are in the commit
  message of the change that added them.

## Follow-up (2026-09-19, same day, at explicit direction) — four review findings built

The review pass's own list of ideas had four items the user asked for. A fifth thing — a defect in the illustration support — was
found while proposing them and fixed with the first slot.

- **A defect found first:** documented "anything placed among the parts is laid out in the same column", but only a 160px
  illustration had ever been tested. A 1200px image placed loose among the parts overflowed the root by 215px and dragged the whole
  page into horizontal scroll. Fixed in two layers: `EmptyState.Media` (below) is the sanctioned slot, and a safety net caps a bare
  `img`/`picture`/`video`/`svg` placed directly in the column (`max-inline-size: 100%`, `block-size: auto`) so a stray one can no
  longer overflow either. Re-measured: the same 1200px image now fits at 366px inside a 464px card.
- **`EmptyState.Media` — a dedicated illustration slot.** A `div` that is never wider than the empty state or than a per-size cap,
  which is the new token family `empty-state.media-max-width.{xs,sm,md,lg,xl}` (`6`/`8`/`10`/`12`/`15rem`; recorded in
  `03-token-system-spec.md`). A larger image is scaled down keeping its proportions; a smaller one keeps its own size (it is not
  scaled *up*, which would blur a raster image). The cap comes from a custom property the root sets per size, so no context is
  needed. Spacing is the root's usual gap. The Docs page tells authors to supply an image at least the cap's size.
- **`announce` — announcing a user-triggered empty state.** A boolean on the root. A live region reliably announces a *change*, not
  content that arrives with it, so `announce` renders a visually hidden `role="status"` region (the existing `VisuallyHidden` atom,
  inside the root, absolutely positioned so it takes no layout) that starts empty, is filled with the title and description a moment
  after mount, and is cleared again about a second later so the text isn't also read in browse mode. Decisions:
  - **The text is read from the rendered DOM,** not passed as a string, so any content the title or description holds is announced as
    it reads, with nothing for the consumer to duplicate. Each part is made a sentence (a full stop is added unless it already ends
    in punctuation) so a screen reader pauses between them.
  - **It re-announces when the text changes** and not when it re-renders with the same text.
  - **Timers are refs cleared on unmount;** `setState` is only called from the timers, never synchronously from an effect (the repo's
    lint rule for that pattern).
  - **The delays are constants in the component (100ms, 1000ms), not tokens** — they are timings for assistive technology, not design
    values, and a comment says so.
  - **`announce` plus `role="status"` warns once in development.**
  - **Not verified with a real screen reader** — none is available in this environment. The timeline was measured in a real browser
    (region present and empty at 12ms, filled at 117ms, cleared at 1117ms), and the mechanism is the widely used one, but
    announcement wording and timing are ultimately each screen reader's. The Docs page says so and tells authors to check the
    wording in the ones they support.
- **`stackOnMobile` on `EmptyState.Actions`.** Below the `sm` breakpoint the actions are a column with each one the full width of the
  empty state; from `sm` up they are the usual wrapping row. A boolean rather than a `Responsive` map: the need was specifically "on a
  phone", and a map (`{ base: "stacked", md: "row" }`) can be added later without breaking it. Mobile-first, with the same
  documented literal breakpoint as the padding step-down. Order and focus are unchanged (the primary action stays first in the DOM).
  Known limit: the width rule applies to every direct child, so an `IconButton` in a stacked row would also stretch.
- **The 375px padding fix is now asserted, not just checked by hand.** A jsdom test can't evaluate a media query, so a new story,
  **On a phone**, is pinned to a phone width with `globals: { viewport: { value: "mobile1" } }` (the vitest addon applies it — its
  default viewport is 1200px — and the Storybook UI resizes the canvas to match; both confirmed). Its `play` first asserts
  `window.innerWidth < 640`, so it fails loudly if the viewport didn't apply, then asserts `lg`/`xl` padding is 32/40px, the actions
  are a column, each button is exactly the width of the empty state's content box and stacked, and nothing spills sideways. **All sizes** gained the
  matching desktop assertion (16/24/32/48/64px from `sm` up). This technique is now a checklist item in
  `07-storybook-and-documentation-standards.md` §5.
- **A defect in `stackOnMobile`, found by the user on first look, that my own test missed.** The stacked buttons were equal-width but
  not full-width: the actions row is a child of the root, which centres (or start-aligns) its children, so the row shrank to its
  widest button (142px in a 174px content box). My assertion compared each button to the *row*, which is true of any row however
  narrow, so it could never fail; the Docs also over-claimed "the full width of the empty state". Fixed with `align-self: stretch`
  on the stacked row below `sm` (reset to `auto` from `sm` up, so the wide layout is byte-for-byte what it was — re-measured: still a
  centred, side-by-side row at natural widths). The assertion now measures against the empty state's content box, and was re-checked
  the same way as the others: with the fix removed it fails (`expected 142 to be 206`). The lesson is recorded in
  `07-storybook-and-documentation-standards.md` §5: measure against the thing the requirement names, not an element that can itself
  shrink.
- **Verified that the new tests bite,** by breaking the code on purpose and watching them fail: reverting the `lg` phone padding
  (`expected 48 to be 32`), removing the stacking (`'row' to be 'column'`), and removing the media cap (`1200 to be ≤ 193`) each fail the
  intended story; and for `announce`, removing the same-text guard, removing the clear, and removing the delay each fail a unit test
  (the last only after a test for the empty-first property was added — the first version of the suite let it through).
  RTL mirroring is still verified live only (jsdom can't lay it out, and a story that flips `dir` would be a new pattern).
- **Snippets:** the illustration and search stories' snippets now show `EmptyState.Media` and `announce`, a new one shows
  `stackOnMobile`, the Playground builder writes `announce`, and all of it (240 Playground combinations plus every gallery snippet) was
  typechecked against the real components, with a planted bad value caught.

## Final review pass (2026-09-19, before Finalization)

A fresh read of the source and a fresh run of the §9 checklist, testing anything suspicious rather than assuming. Three real defects,
all in `announce`, all confirmed by a failing test before being fixed:

1. **`announce` did nothing under `StrictMode`.** The effect remembers the last text it announced so it doesn't repeat itself;
   `StrictMode` (development) mounts, unmounts, and remounts a component keeping its refs, and the unmount cleanup cleared the timers but
   not that memory — so the remount believed it had already announced and never scheduled anything. Invisible in production and in the
   suite, and would have read as "announce is broken" to anyone testing in a normal dev setup. Fixed by resetting the memory in the
   cleanup; a permanent `StrictMode` test fails without it. Added to the review checklist (`06-engineering-standards.md` §9), since it is
   a class of bug, not a one-off. The other two components in the repo that use timers (`SearchInput`, `ThemeProvider`) were checked and
   don't share it (user-event debounce; a local timer with its own cleanup).
2. **A title ending in full-width or Arabic punctuation got a stray Latin full stop** in the announcement (`検索結果がありません？` became
   `…？.`). The sentence-ender check knew only `.!?…`; it now covers the CJK, Arabic, and Devanagari terminators.
3. **A nested empty state's title and description were announced by the outer one.** The parts are now filtered to the ones whose nearest
   `EmptyState` root is this one.

Also done: the `stackOnMobile` limitation (every action stretches, so an icon-only button would too) was only in this file; it is now a
"Don't" on the Docs page. The newer parts (`Media`, the stacked actions) were only measured in Purple light at the time, so they were
re-checked in Emerald dark (all colours resolve to the dark values; nothing hardcoded).

**Open, and for the user to weigh before Finalizing:**

- **`announce` has never been heard through a real screen reader.** None is available in this environment. The mechanism is the widely used
  one and the timing is measured, but this is the one piece of the component whose real-world behaviour rests on unverified assumptions.
  The Docs page says so. Finalizing means accepting that until someone tests it in VoiceOver/NVDA.
- **A second consumer of the live-region pattern is coming** (`Alert`, `Toast`, `Banner`). Per `06-engineering-standards.md` §1 a shared
  hook belongs in `packages/primitives` once it's used in two places; it was deliberately not extracted for one. *(Done since: `Pagination`
  became the second consumer and the timing was extracted as `useAnnouncement`; `EmptyState` was moved onto it — see the last entry below.)*

## Gaps named, not built

Left out deliberately; each can be added without breaking the current API:

- **A responsive `size`** (`{ base: "sm", md: "lg" }`, as `Stack` and `Card`'s `orientation` take). The two large sizes already
  step their padding down on a phone, which covers the common case; a full map is only worth it if a real case wants a
  different *type* size per breakpoint.
- **An icon without the badge** (a bare, larger, muted glyph). `EmptyState.Media` already covers "no badge" with an illustration; a
  `bare` option is only worth adding if that turns out not to be enough.
- **A one-line props shorthand** (`icon`/`title`/`description` on the root). See the first decision above.
- **`Table` and `Card` docs linking back to `EmptyState`.** Done afterwards at explicit direction — see the follow-up entry in each of
  `Table.md` and `Card.md`.

## Finalized 2026-09-19

Before finalizing, the review checklist (`06-engineering-standards.md` §9) was re-run against the final state, and the full package was
re-confirmed clean immediately before: `eslint --max-warnings 0` plus both `tsc --noEmit` passes; the jsdom `unit` project (64 files /
2253 tests, 86 of them `EmptyState`'s own, including the `StrictMode`, non-Latin-punctuation, and nested-empty-state cases); the
real-browser `storybook` project (87 files / 546 tests, including axe on every story and all five `play` functions — the phone-width
one confirmed to fail when the CSS it guards is broken on purpose); `tsup` build; `storybook build`; and every size, coverage, and audit
check (`EmptyState`: 3.53KB JS / 1.69KB CSS gzipped, which includes the atoms it composes, within budget; `pnpm audit`: no known
vulnerabilities). CI green on the last push before this one.

Final surface: five parts (`Media`, `Icon`, `Title`, `Description`, `Actions`); root props `variant` (four values), `tone` (six), `size`,
`align`, and `announce`; `EmptyState.Title`'s `level`; `EmptyState.Icon`'s `label`; and `EmptyState.Actions`' `stackOnMobile`. Two component-token
families. Every prop in `EmptyState.types.ts` carries JSDoc, there is no `any`, and `{...rest}` is spread before every computed attribute.

**Accepted open risk.** `announce` has never been heard through a real screen reader (none was available). The mechanism is the widely
used one and its timing is measured in a real browser, and the Docs page tells authors to check the wording in the screen readers they
support — but its real-world behaviour rests on that assumption until someone tests it in VoiceOver or NVDA. Finalized with that known.

Per `06-engineering-standards.md` §9, don't make further changes to `EmptyState` (code, stories, docs, or the tokens only it uses) without
asking first.

## Post-Finalization follow-up (2026-09-20, at explicit direction) — `announce` moved onto the shared `useAnnouncement` hook

`Pagination` needed the same "put text into a live region a moment later, then clear it" timing, which made it a second consumer, so the timing was
extracted as `useAnnouncement` in `packages/primitives` (`06-engineering-standards.md` §1). `EmptyState`'s inline copy — the message state, the two
timers, their cleanup — was replaced by the hook. What stays in `EmptyState` is what is specific to it: reading the title and description text from
the DOM (only its own parts, sentence-ended), remembering which text was last announced so it only announces when the text is new, and forgetting
that on unmount (the `StrictMode` fix). The hook's timings (100ms to fill, 1000ms to clear) are the ones `EmptyState` already had.

**Verification that nothing changed:** all 86 existing `EmptyState` tests pass *unchanged*, including the `StrictMode`, non-Latin punctuation, and
nested-empty-state ones; and they were shown to be a real net by breaking the migrated code three ways — dropping the unmount memory reset, never
calling the hook, and never remembering what was announced — each fails the intended tests. In a real browser the announcement timeline is identical
to before the change (region present and empty at 12ms, filled at 117ms, cleared at 1116ms, against 12/117/1117), and the region is the same 1×1
absolutely positioned span. The package's other checks were re-run (lint, both type checks, the full unit and browser suites, both builds, the size
and coverage checks, and the audit).

**Finalized status is unchanged.** Under the three-question test (`06-engineering-standards.md` §9), the change alters no rendered or behavioural
output of anything that existed at finalization time, adds no props, stories, docs, or tokens, and was made only after the user asked for it.
