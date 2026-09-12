# ListItem

**Tier:** Atom · **Category:** Typography · **Finalized:** ✅ 2026-09-07

## Review pass (2026-09-07)

Full `06-engineering-standards.md` §9 pass — first review for this component. `ListItem` came into
this review already reasonably built (full JSDoc, 15 passing tests, genuine documented ARIA
reasoning for its `role="listitem"` Safari/VoiceOver fix and its role="button"-on-inner-span
pattern) — but a close read turned up one real, confirmed bug and a real accessibility routing gap
that a shallower pass would likely have missed. Findings, in the order fixed (Playground-missing
first, Docs-page-missing last, per the standing reporting convention):

1. **Playground story added.** `ListItem.stories.tsx` previously had three stories, all using a
   bare `render: () => (...)` that ignored `args` entirely — no prop was ever live/interactive.
   Added a full interactive `Playground` (rendered inside a real `List`, since a bare `<li>` outside
   its ancestor has no context to react to) plus `argTypes` for every prop, and gave every existing
   static story `control: false` on the props it doesn't actually drive.

2. **Real, confirmed bug: a caller-supplied `role` silently overrode the component's own computed
   `role="listitem"` accessibility fix.** `{...props}` was spread *after* the computed `role` in the
   JSX — the same recurring ordering bug already documented and fixed on Button/Skeleton/
   ProgressBar/Divider/FieldError/etc. (`05-component-api-conventions.md` §3), just not yet found
   here. Confirmed empirically with a throwaway test *before* fixing: `<ListItem role="menuitem">`
   rendered `role="menuitem"`, not the intended `role="listitem"` — silently defeating the
   Safari/VoiceOver fix this component's own JSDoc describes as load-bearing. Fixed by moving
   `{...props}` to spread first, with `ref`/`role`/`onClick`/`onKeyDown`/`aria-label`/
   `aria-labelledby`/`className` applied after. A permanent regression test was added.

3. **`className`/`style`/`id`/`data-testid`/`value` now explicitly redeclared** in
   `ListItem.types.ts` with their own JSDoc (previously only worked structurally via the native
   `ComponentPropsWithoutRef<"li">` extension, invisible to the Properties table per the confirmed
   docgen gap). `value` (the native `<li>` ordinal-override attribute, meaningful within an ancestor
   `<ol>`) is the one non-escape-hatch native prop genuinely relevant here, per the "audit
   commonly-relevant native props" convention established via `Input`.

4. **`children` prop had no JSDoc at all** — fixed. Also converted `ListItemProps` from a
   `type ... = ComponentPropsWithoutRef<"li"> & {...}` intersection to `interface ... extends
   ComponentPropsWithoutRef<"li">` — a purely stylistic consistency fix, matching every other
   component's props-type declaration in this codebase (no functional difference).

5. **Real accessibility gap, not just a documentation-visibility one: `aria-label`/
   `aria-labelledby` weren't redeclared, and — more importantly — had nowhere correct to apply.**
   `ListItem`'s accessible name in `interactive` mode comes from the inner `<span role="button">`,
   not the outer `<li>` (a semantic wrapper only) — before this fix, an `aria-label` passed to an
   interactive `ListItem` would have landed on the wrong element via the native prop spread, doing
   nothing for the actual name-bearing control. Fixed by explicitly destructuring both props and
   routing them to whichever element is actually accessible in context (the span when `interactive`,
   the `<li>` otherwise). Also added a dev-mode warning — confirmed as a real, previously-unhandled
   case: an icon-only `interactive` item (`<ListItem interactive icon={GearIcon} />`, no children,
   no label) had no accessible name at all and nothing flagged it, matching the same "no accessible
   name" pattern Button/Checkbox/ProgressBar already warn about.

6. **Feature-completeness — two real, concrete gaps named against comparable production
   interactive-list components and closed at explicit direction (not silently added):**
   - **`disabled`** (a common pattern for an interactive list-row component): only meaningful when `interactive`.
     `aria-disabled` plus a **capture-phase** click/keydown guard — capture, not bubble, so a
     disabled row blocks activation outright rather than only preventing a default action after the
     consumer's own `onClick`/`onKeyDown` already ran (the same reasoning as Link's own
     `onClickCapture` fix, `05-component-api-conventions.md` §3, extended here to `onKeyDownCapture`
     too since this row's Enter/Space-to-click bridging is entirely this component's own logic, not
     a native element's default action). Visual treatment (`cursor: not-allowed`, `opacity.40`)
     deliberately mirrors Button's/Link's own `.disabled` class. A dev-mode warning fires for
     `disabled` without `interactive` (mirroring the same warning already added for `selected`
     without `interactive`, prompted by noticing `selected`'s own identical gap while implementing
     `disabled`).
   - **`trailing`** (a common pattern — a secondary action/extra-content slot at the row's end): rendered as a **sibling** of
     the item's own interactive surface, never nested inside it — the key design decision, made
     specifically to avoid an invalid control-inside-a-control when `trailing` itself contains a
     focusable element (an `IconButton`, a `Switch`). Confirmed live and in a dedicated test that a
     focusable `trailing` element is genuinely outside the interactive row's own DOM subtree, and
     that clicking it does not also trigger the row's own `onClick` — no `stopPropagation` hack
     needed, since sibling elements don't bubble through each other's own subtree in the first
     place. Layout: `margin-inline-start: auto` on `.trailing`, with the `<li>` (or the interactive
     `<span>`, whichever is present) becoming a flex row whenever `trailing` exists, regardless of
     `interactive` state. The old `.hasIcon` CSS class was renamed to `.row` since it now triggers
     row layout for two different reasons (a suppressed marker's icon, or `trailing`), not only the
     icon case its old name implied.

7. **Unit tests extended**: added coverage for `style`/`id`/`value`, the `role`-override regression,
   `trailing` (sibling placement, non-interference with the row's own click), `disabled` (aria-
   disabled, tab-order retained, click/keydown blocked, still fires when not disabled, warns
   without `interactive`), `aria-label` routing, and the "no accessible name" warning (and its
   absence when `aria-label` is provided). 32/32 passing (up from 15).

8. **Docs page added** (`ListItem.mdx`), full 10-section template, first in the sidebar group.
   Live-verified: TOC renders all 10 section headings, Properties table renders all 13 props in the
   declared order with non-empty descriptions and correct boolean value-option pills
   (`interactive`/`selected`/`disabled`), all 5 story canvases render real content (including the
   new `trailing` and `disabled` demos), both `RelatedCard`s (`List`, `Badge`) render live previews
   with correct links, zero console errors, both brand themes × both modes confirmed (every token
   `ListItem` uses is brand-agnostic, so appearance is identical Purple vs. Emerald), mobile
   viewport spot-checked (the `trailing` story wraps/aligns cleanly).

## Final review (2026-09-07)

A deeper re-verification pass before finalizing — same methodology as the final reviews for
`Highlight`, `Kbd`, and `Link`: re-reading the newest, most complex logic with a critical eye and
empirically confirming any suspicion before concluding a bug exists. Found one real, confirmed bug:

**A caller-supplied `trailing` silently stripped the item's own native bullet/number marker, even
without a custom `icon` — including in the component's own documented `@example`.** The `<li>`
became the flex container for laying out its main content alongside `trailing` (`needsRowLayout`
applied `.row`, which included `display: flex`, directly to the `<li>`). Confirmed empirically
first: a plain `<li style="display:flex; list-style:disc">` renders **no bullet at all** in a real
browser, regardless of `list-style` — a list item only generates its marker while its own computed
`display` stays `list-item` (or `flow list-item`), and `flex` is not compatible with that box type,
so the marker is dropped unconditionally, `list-style: none` or not. This meant `<List><ListItem
trailing={<Badge>3</Badge>}>Inbox</ListItem></List>` — a plain, non-interactive item with `trailing`
in a default (`disc`) list, exactly this component's own JSDoc example — silently rendered with no
bullet, an unintended and undocumented side effect nothing in the API suggested `trailing` would
cause.

Fixed by separating the two concerns `needsRowLayout` had conflated: marker suppression (only ever
correct when a custom `icon` deliberately replaces the bullet, tracked by the narrower
`suppressesMarker`) and row layout (needed whenever `trailing` is present, or the icon-marker case).
Row layout now always lives on an inner wrapper `<span className={styles.row}>` around `mainContent`
+ `trailing`, never on the `<li>` itself — so the `<li>`'s own `display` (and therefore its marker)
is only ever touched deliberately, via a new `.noMarker { list-style: none }` class applied
independently of layout. A permanent regression test asserts `getComputedStyle(li).display ===
"list-item"` and a non-`"none"` `list-style-type` for a `trailing`-only, non-interactive,
non-`icon` item. 33/33 tests passing (up from 32).

While investigating, also confirmed (and fixed) a related, narrower layout bug in the same area:
the interactive row's own clickable/hoverable surface (`.interactive`) didn't stretch to fill the
row when `trailing` was present — it sized to its own content only, leaving a large dead zone
between the item's text and the trailing element where hovering/clicking did nothing, breaking the
expected full-row nav-item affordance (the exact interactive-list-row pattern this
component's own review cites as its reference). Confirmed live via real mouse hover in Storybook
before and after. Fixed with `flex: 1 1 auto` on `.interactive`, which only takes effect when its
parent is itself a flex container (i.e. when `trailing` triggers the wrapper), so the no-`trailing`
case is unaffected.

Full verification gate rerun and passing: `tsc --noEmit` (main + `.storybook`), `eslint . --max-warnings 0`,
full `vitest` unit suite (1032/1032, 33/33 for `ListItem`), `tsup` build, `check-foundations-token-coverage`,
and `check-component-bundle-size` (1.40KB JS / 0.56KB CSS gzipped, still within budget). Live-verified in
Storybook: the marker bug reproduced live before fixing (a throwaway story matching the JSDoc example) and
re-verified after; the hover dead-zone reproduced and re-verified the same way via real simulated mouse
hover; `Interactive` and `Custom icon marker` stories spot-checked for no visual regression; mobile viewport
spot-checked on `Trailing content`; zero console errors confirmed in a genuinely fresh browser tab.

## Verification

`tsc --noEmit` (main + `.storybook`), `eslint . --max-warnings 0` (whole package), full `vitest`
unit suite (1031/1031 passing across the whole package, 32/32 for `ListItem` itself), `tsup` build,
`check-foundations-token-coverage` (no new semantic color tokens — `ListItem` reuses
already-verified pairings, still in sync), and `check-component-bundle-size` (1.37KB JS / 0.55KB
CSS gzipped — comfortably within budget) all run and passing. Live-verified in Storybook: the
`role`-override bug (finding 2) was reproduced live before fixing and re-verified live after; the
`disabled` row's click-guard confirmed live via a real `dispatchEvent` call returning `false`
(matching `aria-disabled="true"`, `tabIndex=0`, `cursor: not-allowed`, `opacity: 0.4`); the
`trailing` IconButton confirmed live to sit outside the interactive row's own DOM subtree; both
brand themes × both modes and mobile viewport spot-checked.

## Finalized

**2026-09-07**, by explicit user confirmation. This review pass (baseline correctness, a real
confirmed prop-ordering bug, a real accessible-name routing gap, feature-completeness decisions on
`disabled` and `trailing`, a subsequent final review that found and fixed a real marker-suppression
bug and a related full-row-hover layout bug, accessibility, responsiveness, design quality,
theming, Storybook documentation, and functional verification) is complete.

## Post-finalization fix (2026-09-13, authorized)

`ListItem.mdx`'s own "List" `RelatedCard` still pointed at `List`'s raw Storybook story
(`/?path=/story/molecules-typography-list--unordered`), left over from before `List` had a Docs
page — flagged during `List`'s own final review pass, authorized here, fixed by pointing it at
`List`'s Docs page instead (`/?path=/docs/molecules-typography-list--docs`). Re-verified live: the
rendered `<a>`'s `href` now reads the corrected path. Per the finalization re-check test (§9): a
defect fix (stale link, not a design change) — **stays finalized**, no re-review needed.
