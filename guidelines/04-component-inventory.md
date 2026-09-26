# DBM Design System — Component Inventory

**Status: v1 draft.** Organizing principle: **9 functional categories** for documentation/discoverability (docs site, Storybook sidebar, manifest grouping), with **atomic-design tier** tracked as metadata per component (internal composition concern, not a navigation axis). See `guidelines/adr/0006` for why this hybrid approach.

**Priority key:** 🟢 v1 (core, build first) · 🟡 v1.5 (comprehensive pass, right after v1 ships) · ⚪ v2/deferred (real, but not blocking launch)

Target v1 scope: **68 components**. Full comprehensive scope (v1 + v1.5): **94 components** — enough to build a real web/enterprise application end to end (forms, navigation, data display, feedback, overlays) without falling back to one-off custom components, not a "basic" starter set.

---

## 1. Layout
Structural primitives everything else is built from.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Box | atom | 🟢 | Base polymorphic primitive (`as` prop), most components compose this |
| Stack | atom | 🟢 | Vertical/horizontal flex layout with gap token |
| Grid | molecule | 🟢 | CSS Grid wrapper, responsive column props — meaningless without child items, so molecule-tier per [ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md) |
| GridItem | atom | 🟢 | A cell within a `Grid` — colSpan/rowSpan/colStart/rowStart placement, plus order (2026-09-07, visual reordering independent of DOM order). Renders/functions correctly standalone (no context coupling to `Grid`), so atom-tier per [ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md) despite typically being used inside a molecule |
| Container | atom | 🟢 | Max-width + centered content wrapper |
| Divider | atom | 🟢 | Horizontal/vertical, with optional label |
| Spacer | atom | 🟢 | Flex-grow spacer utility |
| AspectRatio | atom | 🟡 | Locks child to a ratio (video embeds, image placeholders) |
| Center | atom | 🟡 | Centers children both axes |
| Bleed | atom | ⚪ | Breaks child out of parent padding (editorial layouts) |
| Affix | atom | 🟡 | Sticky-positioning wrapper (sticky table headers, filter bars) |
| ScrollArea | molecule | 🟡 | Custom-styled scrollable region (wraps Radix ScrollArea) |
| Splitter | molecule | ⚪ | Resizable multi-pane layout — drag-to-resize divider between 2+ panes, for enterprise dashboard/IDE-style UIs. Added 2026-09-10 following a molecule feature-completeness gap-check — no existing component covers coordinated multi-pane resize (`ScrollArea` only handles scrolling, not resizing) |

## 2. Typography
Text rendering primitives — Nunito for UI, Lora for editorial/display per the token spec.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Text | atom | 🟢 | Base text primitive, semantic size/weight/color props, plus align/wrap (2026-09-07, mirrors Heading) |
| Heading | atom | 🟢 | h1–h6, maps to fluid type scale |
| Link | atom | 🟢 | Internal/external, visited/hover states, icon-affordance for external, disabled (aria-disabled) |
| Code (inline) | atom | 🟡 | Monospace inline snippet |
| CodeBlock | molecule | 🟡 | A `<figure>` around a scrollable `<pre><code>`: syntax highlighting from a small built-in tokenizer, no dependency ([ADR-0026](adr/0026-codeblock-highlights-with-a-small-built-in-tokenizer-over-a-highlighting-dependency-or-bring-your-own.md)) — `ts`, `tsx`, `js`, `jsx`, `json`, `css`, `html`, `bash`, `diff`, anything else plain; the code is always drawn as text, never HTML; a `title` and `language` header; a copy button (announced, with a check mark; `onCopied`); `showLineNumbers` and `startLine` (numbers drawn by CSS, never selected), `highlightLines` (`[2, "4-6"]`, a band and an edge accent), `wrap`, `maxHeight`, and `collapsible` with `collapsedLines` and controlled or uncontrolled `expanded`; the scrolling area is a named tab stop only while it overflows; code stays left to right in a right-to-left page; `labels` translate it. Built and Finalized 2026-09-26 — see [CodeBlock.md](component-reviews/CodeBlock.md) |
| Blockquote | atom | 🟡 | Uses Lora for editorial feel |
| List | molecule | 🟢 | Ordered/unordered, custom marker support — meaningless without `ListItem` children, so molecule-tier per [ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md) |
| ListItem | atom | 🟢 | A single item within a `List` — optional custom marker icon, trailing content, interactive/selected/disabled states. Renders/functions correctly standalone, so atom-tier per [ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md) despite typically being used inside a molecule |
| Kbd | atom | ⚪ | Keyboard shortcut display |
| Highlight | atom | 🟡 | Inline text-highlight span; wrap the match yourself, or pass `query` to have it find and wrap matches itself |

## 3. Inputs & Forms
Anything that captures user input. Largest category by necessity — this is where "comprehensive" gets tested.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Button | atom | 🟢 | Primary/secondary/tertiary/destructive/ghost variants, loading state, optional `rounded` (pill/circle, same prop as `IconButton`/`CloseButton`) |
| ButtonGroup | molecule | 🟡 | A named `role="group"` of `Button`s and `IconButton`s: `attached` (the default: one segmented control, square corners only where buttons meet, a separator drawn to suit each button's variant) or spaced apart (a gap, and a horizontal row wraps); `orientation` (a row or a column, or a breakpoint map to stack on a phone); `variant`, `size`, `rounded` and `disabled` set once for every button through an internal context ([ADR-0025](adr/0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md)), a button's own props winning and a disabled group disabling all; `fullWidth`; the group follows the page's text direction. Not a selection control, and no arrow-key movement — that is `ToggleGroup` / `Toolbar` |
| Toolbar | molecule | ⚪ | Generic action-grouping container (buttons/icon buttons/dividers) with ARIA toolbar keyboard semantics (roving tabindex) — distinct from `ButtonGroup`'s single fused/segmented control. `Table Toolbar` (Data Display, below) likely builds on this once it exists rather than reinventing the same behavior. Added 2026-09-10 following a molecule feature-completeness gap-check |
| IconButton | atom | 🟢 | Icon-only, requires `aria-label` |
| CloseButton | atom | 🟢 | Dedicated dismiss control, fixed brand styling — reserved for modal-style surfaces (Dialog, Drawer, lightbox), not tone-varying components (Tag, Alert, Toast), which implement their own local remove control instead — see `05-component-api-conventions.md` §10 |
| Input (text) | atom | 🟢 | With prefix/suffix slot support |
| PasswordInput | molecule | 🟢 | Visibility toggle, wraps Input |
| Textarea | atom | 🟢 | Auto-resize option |
| NumberInput | molecule | 🟢 | Stepper controls, min/max/step, wraps Input |
| Select | molecule | 🟢 | Native-feel, wraps Radix Select |
| Combobox / Autocomplete | organism | 🟢 | Searchable select, async option loading |
| MultiSelect | organism | 🟡 | Tag-based multi-value select |
| Checkbox | atom | 🟢 | Indeterminate state support |
| CheckboxGroup | molecule | 🟢 | |
| Radio | atom | 🟢 | A single radio input — functions correctly standalone, mirroring `Checkbox`'s own atom-tier precedent. Atom-tier per [ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md), which names this exact pair as a future application of its own standing test. **Split out of the former combined "RadioGroup / Radio" row, 2026-09-14**; built and Finalized the same day — see [Radio.md](component-reviews/Radio.md) |
| RadioGroup | molecule | 🟢 | Manages a group of `Radio` atoms — shared `name`, single selected value, roving-tabindex keyboard semantics. Meaningless without `Radio` children, so molecule-tier per the same ADR |
| Switch | atom | 🟢 | |
| Slider | molecule | 🟢 | Single value — a track, filled range and thumb on the shared `size` scale; `value`/`defaultValue`/`onValueChange` as a plain number, and `onValueCommit` on release; `orientation` (vertical needs a height), `inverted`, `hasError`, `min`/`max`/`step`; `showValue`, `showValueTooltip`, `showMinMaxLabels`, `showTicks`/`tickInterval`, with the value label reserving the width of its widest text so the track never resizes or shifts as the number gains digits; `formatNumber` (a unit or a locale's numerals, also what is announced); `dir="rtl"` (mirrors it; not read from the page); a thumb target of at least 24px at every size; `name` for form submission |
| RangeSlider | molecule | 🟡 | Dual-handle range — the same look, props and layouts as `Slider` (it shares its stylesheet and layout code), with a `[minimum, maximum]` value, `minStepsBetweenThumbs`, a tooltip and an accessible name per thumb ("Price Minimum", "Price Maximum"; `labels`), `showValue` writing the range, each thumb's Home and End going to its own limit, `dir`, and a development warning for an unsorted or out-of-range value; submits two values under `name[]` |
| SearchInput | molecule | 🟢 | Debounced, clear button, wraps Input |
| PinInput | molecule | ⚪ | OTP/verification code entry |
| DatePicker | organism | 🟢 | Calendar popover, range mode |
| DateRangePicker | organism | 🟡 | |
| TimePicker | molecule | 🟡 | |
| FileUpload / Dropzone | organism | 🟢 | Drag-drop, progress, multi-file |
| ColorPicker | organism | ⚪ | Given token-driven theming, likely low-usage but completes the set |
| RatingInput | molecule | ⚪ | Star/scale rating |
| ToggleGroup | molecule | 🟡 | Segmented control over Radix `ToggleGroup` (`ToggleGroup` + `ToggleGroup.Item`): `type` `single` (a `radiogroup`; one item stays chosen once chosen unless `deselectable`) or `multiple` (a `toolbar` of toggles); its own `subtle` / `outlined` / `solid` looks, sizes matched to `Button`'s heights, `attached` or spaced, `orientation` (or a breakpoint map), `fullWidth`, `rounded`, `dir`; one tab stop with roving arrow keys. Built and Finalized 2026-09-26 — see [ToggleGroup.md](component-reviews/ToggleGroup.md) |
| Form | organism | 🟢 | Context provider + validation wiring |
| FormField | molecule | 🟢 | Label + control + helper/error text composition |
| FieldGroup | molecule | ⚪ | Groups multiple `FormField`s under a shared legend/heading with fieldset-equivalent semantic grouping for assistive tech — distinct from `Form`'s context/validation role and `FormField`'s single-field scope. Added 2026-09-10 following a molecule feature-completeness gap-check |
| FieldLabel | atom | 🟢 | |
| FieldError | atom | 🟢 | |
| FieldHelperText | atom | 🟢 | |

## 4. Data Display
Presenting information/content.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Card | molecule | 🟢 | Header/body/footer/media slots — compound (`Card.Media`/`Header`/`Body`/`Footer`); `outlined`/`elevated`/`filled`/`ghost` variants, six colour `tone`s, `size`, `divided`, a responsive `orientation` (media beside the content), `mediaPosition` (media at the start or end), and `interactive` + `asChild` (with `disabled`) for a whole-card link or button |
| Badge | atom | 🟢 | Status/count indicator |
| Tag / Chip | atom | 🟢 | Removable variant for filters |
| Avatar | atom | 🟢 | Image/initials fallback, status dot |
| AvatarGroup | molecule | 🟡 | Avatars overlapped into a stack with a surface-coloured ring between them, the ones past `max` collapsing into a "+N" tile (`total` for a list loaded a page at a time; `onOverflowClick` makes the tile a button; `labels` and `formatNumber` translate it); `size` (a breakpoint map too), `shape` and `colorful` set once for every avatar through an internal context, the same mechanism as `ButtonGroup` ([ADR-0025](adr/0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md)); `stacked={false}` spaces them apart instead; a `<ul>` of `<li>`s named by `aria-label`, the first avatar on top so a status dot is never covered, and the focused one lifted above the rest; follows the page's text direction. Built and Finalized 2026-09-26 — see [AvatarGroup.md](component-reviews/AvatarGroup.md) |
| DataTable | organism | 🟢 | Sort, select rows, pagination integration — this is the enterprise-critical component |
| Table (simple) | molecule | 🟢 | Lighter-weight, non-interactive tabular display — compound (`Table.Header`/`Body`/`Footer`/`Row`/`HeaderCell`/`Cell`/`Caption`); owns an overflow-aware scroll container, see [ADR-0019](adr/0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md). Also: `stickyHeader`/`stickyFirstColumn`/`stickyLastColumn`, six colour `tone`s, a `numeric` cell option, a `loading` body with skeleton rows, and a `Table.Empty` state. No sorting/selection/pagination — that's `DataTable` |
| Pagination | molecule | 🟢 | (Cross-listed conceptually with Navigation, lives here as it's data-bound.) A `<nav>` list of previous / page numbers / next (and optionally first / last) around a window of pages that keeps a constant width; every control is a `Button`; `value`/`defaultValue`/`onValueChange` (1-based), `siblingCount`/`boundaryCount`, `size`, `align`, `disabled`, `getPageHref` (real links), `labels` (translatable text), a `compact` "Page 3 of 20" form that collapses the numbers on a phone-width screen or, with `compact="container"`, whenever they don't fit the component's own width, `variant` (`ghost`/`outlined`/`filled` treatment of the controls), `rounded` (circular controls, pill-shaped for wide numbers), a `showJump` "Go to page" field for very long lists, `announce` (a page change is announced to screen readers, on by default), `formatNumber` (page numbers in a locale's own numerals or digit grouping), and `showLabel` (the words "Previous" and "Next" beside the arrows) |
| Stat / KPI | molecule | 🟡 | Metric + label + trend indicator |
| Timeline | organism | 🟡 | Vertical event sequence |
| Tree / TreeView | organism | 🟡 | Expandable hierarchical data (file trees, org charts) |
| DescriptionList | molecule | 🟡 | Key/value display block |
| EmptyState | molecule | 🟢 | Icon + message + optional CTA, used across the system — compound (`EmptyState.Media`/`Icon`/`Title`/`Description`/`Actions`); `ghost`/`outlined`/`dashed`/`filled` variants, six colour `tone`s (tinting the icon badge), `size` on the shared scale, and `align` (centred or start-aligned); `announce` tells a screen reader about one that appears because of a user action; `EmptyState.Actions` can `stackOnMobile`; the title is a real heading with a settable `level`; fits inside a `Card` or `Table.Empty` |
| Skeleton | atom | 🟢 | Loading placeholder shapes |
| Table Toolbar | molecule | 🟡 | Filters/search/actions bar paired with DataTable |

## 5. Navigation
Wayfinding and app structure.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Navbar / TopNav | organism | 🟢 | App header shell |
| Sidebar / SideNav | organism | 🟢 | Collapsible, nested items — enterprise-critical |
| Tabs | molecule | 🟢 | Wraps Radix Tabs — compound (`Tabs.List`/`Trigger`/`Content`); `underline`/`subtle`/`outlined`/`solid` variants, `size` on the shared scale, `rounded`, `align` on the list, `orientation` (a breakpoint map turns a vertical list into a horizontal strip on a phone), `activationMode`, `fullWidth`, an `icon` per tab, `asChild` and `forceMount`; a list that is too wide scrolls, keeps the selected tab in view, and shows a fade and a button at whichever edge has more |
| EditorTabs | organism | ⚪ | Data-driven, closable/reorderable/addable tab strip (open files, records, or user-created views) — wraps `Tabs` for the underlying keyboard/ARIA mechanics; distinct from `Tabs`' fixed, author-defined set. Named as a gap during `Tabs`' own review, 2026-09-22 |
| Breadcrumb | molecule | 🟢 | Compound (`Breadcrumb.Item`/`Link`/`Page`) — a `<nav>` around an ordered list, ending in the current page (`aria-current="page"`); `Breadcrumb.Link` is the `Link` atom (so it takes `external`, `disabled`, `asChild` for a router) with an optional leading `icon`; `size` on the shared scale, a link `tone` (`info` default / `brand` / `neutral`), an optional resting `underline`, a `separator` (chevron that flips in right-to-left text, slash, or anything), `maxItems` (a number, or `"container"` to collapse only as many as fit the trail's own width)/`itemsBeforeCollapse`/`itemsAfterCollapse` collapsing the middle into a "…" button, `compact` (`never`/`auto`/`always` — one "back to the parent" link, on a phone or always), `truncate` (one line, long labels cut short with an ellipsis), `labels` (translatable text); a long trail wraps |
| Menu (dropdown) | organism | 🟢 | Wraps Radix DropdownMenu |
| Stepper | organism | 🟡 | Multi-step flow indicator (wizards, onboarding) |
| CommandPalette | organism | 🟡 | ⌘K-style search/action launcher — high agent/power-user value |
| Pagination | molecule | 🟢 | (see also Data Display) |
| BackToTop | atom | ⚪ | Floating scroll-to-top button, appears past a scroll threshold — wraps IconButton |
| TableOfContents | molecule | ⚪ | Anchor-linked page outline, docs-site use case |

## 6. Feedback
System status communicated to the user.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Alert | molecule | 🟢 | One component for an inline message and a page-level banner ([ADR-0023](adr/0023-one-alert-with-banner-and-sticky-options-and-a-separate-persistence-hook.md)) — compound (`Alert.Title`/`Description`/`Actions`/`Action`); five `tone`s (`info`/`success`/`warning`/`danger`/`neutral`) each with its own icon and a default live-region role, `subtle`/`outlined`/`solid` variants, `size` on the shared scale, `Alert.Action` (a `Button` that takes the alert's colours and size, so it reads on every tone and variant — [ADR-0024](adr/0024-alert-action-reads-the-alerts-colours-over-tone-props-on-button-or-unrestricted-children.md)), `banner` (edge to edge), `actionsPlacement` (`below`, or `inline` beside the message, wrapping below on its own when the alert's width can't fit both), `align` (`start`, or `center` for an announcement), `sticky` (composes `Affix`), `dismissible` with `open`/`defaultOpen`/`onOpenChange` and a fade-and-collapse exit that moves focus on, and a fade-and-slide entrance for an alert that appears after the page has loaded; the companion `usePersistentDismiss` hook (in `primitives`) remembers a dismissal across visits |
| Toast / Notification | organism | 🟢 | Queue-managed, auto-dismiss, action button |
| ProgressBar | atom | 🟢 | Determinate/indeterminate |
| ProgressCircle | atom | 🟡 | |
| Spinner | atom | 🟢 | Loading indicator |
| ConfirmDialog | organism | 🟢 | Destructive-action confirmation pattern (built on Dialog) |

## 7. Overlay & Disclosure
Content that appears above, or reveals/hides other content.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Backdrop | atom | 🟢 | Dimming scrim layer behind Dialog/Drawer/overlays |
| Dialog / Modal | organism | 🟢 | Wraps Radix Dialog |
| Drawer / Sheet | organism | 🟢 | Side-panel variant of Dialog |
| Popover | molecule | 🟢 | Wraps Radix Popover |
| Tooltip | atom | 🟢 | Wraps Radix Tooltip; ships a co-located `TooltipProvider` (optional shared hover-delay/skip-delay timing across multiple tooltips) as a secondary export from the same folder, not a separate atom entry |
| HoverCard | molecule | 🟡 | Rich preview on hover (user cards, link previews) |
| Accordion | molecule | 🟢 | Wraps Radix Accordion fully (`Root`/`Item`/`Header`/`Trigger`/`Content`) — does not literally reuse the `Collapse` atom's own component, see [ADR-0018](adr/0018-accordion-wraps-radix-accordion-content-directly-not-the-collapse-atom.md) |
| Collapse | atom | 🟢 | Simple expand/collapse, building block for Accordion |
| ContextMenu | organism | 🟡 | Right-click menu |
| AlertDialog | organism | 🟢 | Modal variant requiring explicit acknowledgment |

## 8. Media
Images, icons, visual content handling.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Icon | atom | 🟢 | Phosphor wrapper — typed icon-component-reference prop (not a string name), size/weight/tone tokens |
| Image | atom | 🟢 | Lazy-load, fallback, aspect-ratio integration |
| ImageViewer / Lightbox | organism | ⚪ | Full-screen zoomable image view |
| Carousel | organism | ⚪ | Wraps Radix or headless carousel logic |
| Indicators | atom | ⚪ | Dot/step indicator, horizontal or vertical, for Carousel/ImageViewer position — clickable for direct navigation |

## 9. Utility
Non-visual/structural helpers other components are built from.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| ThemeProvider | atom | 🟢 | Applies brand/mode semantic token set |
| Portal | atom | 🟢 | Wraps Radix Portal, used by overlays |
| VisuallyHidden | atom | 🟢 | Screen-reader-only content |
| FocusTrap | atom | 🟢 | Used internally by Dialog/Drawer |
| ClientOnly | atom | 🟡 | SSR-safe render guard |

---

## Templates (page-level composition, deferred to v1.5/v2)

Not individual components, but composed patterns — worth planning for since a template meaningfully reduces time-to-first-app for a common structure (a dashboard shell, an auth flow) versus composing it from scratch every time, but these should come **after** the underlying components exist, not before.

| Template | Priority | Notes |
|---|---|---|
| Dashboard shell (Sidebar + Navbar + content area) | 🟡 | |
| Settings page (nav + form sections) | ⚪ | |
| Auth flow (login/signup/forgot-password) | ⚪ | |
| Data-table-driven list page (Table + Toolbar + Pagination) | ⚪ | |

---

## Rough count summary

| Priority | Count |
|---|---|
| 🟢 v1 (core) | 68 |
| 🟡 v1.5 (comprehensive) | 26 |
| ⚪ v2/deferred | 14 |
| **Total planned** | **108** |

Counted directly from the nine category tables above, deduplicated by component name — `Pagination` is deliberately cross-listed under both Data Display and Navigation, so the tables hold 109 rows but 108 distinct components. By tier: 48 atoms, 36 molecules, 24 organisms. Templates (below) are composed patterns, not components, and aren't counted here. **When adding or re-prioritizing a component, recount from the tables rather than adjusting these figures by increments** — they drifted from the tables that way before (see the correction note below).

**Updated 2026-09-10** — added `Toolbar`, `Splitter`, `FieldGroup` (all ⚪, molecule-tier) following a molecule-tier feature-completeness gap-check run before the molecule review phase began; ⚪ count 14→17, total 104→107. A fourth candidate (a typeable tags/token input) was considered and deliberately deferred rather than added — it may already be covered by `MultiSelect`'s "tag-based" rendering, not yet confirmed since `MultiSelect` isn't built; revisit once `MultiSelect` exists.

**Updated 2026-09-14** — split the combined `RadioGroup / Radio` row into `RadioGroup` (molecule) and `Radio` (atom), per [ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md)'s own standing test, which names this exact pair by name as a future application it hadn't yet been applied to. 🟢 count 64→65, total 107→108. Atom tier: 48 planned. Molecule tier: unchanged at 36 (`RadioGroup` stays a molecule; only `Radio` moved out, to atom-tier — an earlier version of this note said 36→35, a miscount corrected 2026-09-18 against the tables' actual molecule-tier rows). **`Radio` built and Finalized 2026-09-14, same day** — full `06-engineering-standards.md` §9 pass complete; see [Radio.md](component-reviews/Radio.md).

**Corrected 2026-09-18** — the summary table above previously read ~65 / ~26 / ~17 / ~108, kept current by incremental adjustments (the 2026-09-10 and 2026-09-14 notes above) rather than recounts, and had drifted from the actual tables: 🟢 was really 68 and ⚪ 13, and the "108" was the raw row count including `Pagination`'s duplicate listing rather than distinct components. The 2026-09-10/09-14 notes above describe those incremental changes as they were recorded and are left as written; the figures in the table are now the authoritative ones.

**Updated 2026-09-22** — added `EditorTabs` (⚪, organism-tier, Navigation category), a data-driven closable/reorderable/addable tab strip named as a real gap during `Tabs`' own review (see [Tabs.md](component-reviews/Tabs.md)'s "Gaps named, not built" section) but not needed for v1 — wraps `Tabs` rather than duplicating its keyboard/ARIA handling. ⚪ count 13→14, organism tier 23→24, total 107→108. Not yet sequenced within the organism tier: organisms haven't started (Phase 6, `01-vision-and-goals.md` §13) and have no itemized build order the way molecules do, so "lowest priority, build last" is expressed entirely by the ⚪ tier itself rather than a position in a list.

This puts v1 alone in "real, comprehensive design system" territory (not a 15-component starter kit), with a clear, sequenced path to full coverage rather than trying to build all 108 at once.

## Sequencing recommendation for actual build order
Not alphabetical, not category-by-category — build in **dependency order**, since many components above are explicitly built on top of others. Steps 1–3 (every atom-tier row in this doc, Grid/GridItem excepted — see the note on step 1) are done as of Phase 4.75 (`01-vision-and-goals.md` §13) — **48 atoms total, none left unbuilt** (47, plus `Radio` from the 2026-09-14 split; count the atom-tier rows across all 9 categories above and it's 48. Earlier versions of this doc and its siblings said "49," a miscount corrected 2026-08-12):

**Corrected 2026-09-07 ([ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md)):** `GridItem` and `ListItem` are now atom-tier; `Grid` and `List` are now molecule-tier (previously each pair shared a single combined row/tier — see that ADR for why). Checked against real git history before writing this note, not assumed: `Grid`/`GridItem` were originally authored together on 2026-07-18 (Phase 3, alongside Box/Stack/Container/Divider/Spacer) — genuinely atom-tier at the time, files and all. They moved to `molecules/` on 2026-08-09 in the same commit that added `Select` (`"...moving Grid/GridItem there from atoms/, where they'd been misfiled relative to their documented tier"` — i.e. the inventory doc had *already* called the combined pair molecule-tier before that commit; the move just brought the files in line). Today's change is really GridItem's second tier flip: atom (Phase 3) → molecule (2026-08-09, as part of the undifferentiated pair) → atom again (today, now correctly split from `Grid`). `List`/`ListItem` were also both authored 2026-07-18, stayed atom-tier and in `atoms/` the whole time until today's move splits them the same way. The atom total (47 at that date) is unaffected by that change — `GridItem` replaces `List` in the count, net zero.

1. Utility primitives (ThemeProvider, Portal, VisuallyHidden, FocusTrap, ClientOnly) + Layout primitives (Box, Stack, Container, Divider, Spacer, AspectRatio, Center, Bleed, Affix) — corrected 2026-08-12: Grid was listed here in error; it's molecule-tier per this doc's own Layout table above and is tracked under step 4 instead.
2. Typography (Text, Heading, Link, Code, Blockquote, Kbd, Highlight, ListItem)
3. Core atoms (Button, IconButton, CloseButton, Icon, Badge, Tag, Avatar, Input, Textarea, Checkbox, Switch, FieldLabel/FieldError/FieldHelperText, Skeleton, Spinner, ProgressBar, ProgressCircle, Divider, Image, Tooltip, Collapse, Backdrop, BackToTop, Indicators)
4. Form molecules (FormField, RadioGroup, Select) plus Grid and List — Checkbox/Switch/Textarea/Tag already exist as atoms and unlock the form ones. **Started 2026-08-09, ahead of the original plan** (this step was meant to follow Phase 4.9's full documentation pass on the atom tier — see `01-vision-and-goals.md` §13 Phase 5 — but began in parallel instead): `Grid`, `GridItem` (atom-tier per ADR-0012, but built here regardless — no dependency reason to build it earlier than `Grid`), and `Select` are built; `List` itself has existed since Phase 3 but only became molecule-tier today; `FormField` and `RadioGroup` followed on 2026-09-14 (see the itemized list below).
5. Overlay foundation (Dialog, Popover) — Tooltip/Collapse/Backdrop already exist as atoms and unlock these; Dialog/Popover unlock Drawer, ConfirmDialog, AlertDialog, Menu
6. Data Display core (Card, Table, DataTable, EmptyState)
7. Navigation core (Tabs, Breadcrumb, Navbar, Sidebar)
8. Feedback (Alert, Toast, ProgressBar, Spinner)
9. Everything tagged 🟡, in the same dependency-aware order
10. Templates, once enough organisms exist to compose them meaningfully

### Molecule-tier build order, itemized (added 2026-09-14)

`Grid`, `List`, `Select` (the three review-first molecules, `01-vision-and-goals.md` §13) are Finalized. This itemizes steps 4–9 above across the 33 molecules remaining after those three (36 molecule-tier in total; `RadioGroup` is one of the 33, while `Radio` moved to atom-tier per the Rough count summary above and isn't counted here; as of 2026-09-26, items 1–21 are built and Finalized, leaving 12 not yet started), applying the same dependency-order + priority-tier (🟢 before 🟡 before ⚪) logic the steps above only stated in the abstract. Build one at a time, in this order, unless a later session finds a reason to deviate (note it here if so):

**`Radio` (atom, the prerequisite for item 2 below) built and Finalized 2026-09-14** — see [Radio.md](component-reviews/Radio.md). **`RadioGroup` (item 2) built and Finalized the same day** — full `06-engineering-standards.md` §9 pass complete; see [RadioGroup.md](component-reviews/RadioGroup.md). **Item 1 (`CheckboxGroup`) built and Finalized the same day** — see [CheckboxGroup.md](component-reviews/CheckboxGroup.md). **Item 3 (`FormField`) built and Finalized the same day** — see [FormField.md](component-reviews/FormField.md). **Item 4 (`PasswordInput`) built and Finalized the same day** — see [PasswordInput.md](component-reviews/PasswordInput.md). **Item 5 (`NumberInput`) built and Finalized the same day** — full `06-engineering-standards.md` §9 pass complete, including a final review pass that found and fixed a real defect (`onClear` not actually clearing an uncontrolled value); see [NumberInput.md](component-reviews/NumberInput.md). **Item 6 (`SearchInput`) built and Finalized the same day** — full `06-engineering-standards.md` §9 pass complete, including a final review pass that found and fixed two real defects (Enter firing mid-IME-composition, and jest-axe never exercising the clear-button-rendered state) and one architecture decision asked rather than guessed (Enter now `preventDefault()`s so it never submits a surrounding `<form>` — user chose to block it over leaving native submission available) — see [SearchInput.md](component-reviews/SearchInput.md). Also found and fixed two real, pre-existing defects in the already-Finalized `Input` atom it consumes (a clear button never disabled under `disabled`/`readOnly`, and a native WebKit search-cancel-button icon `Input`'s own `type="search"` support never actually suppressed) — both logged in `Input.md`. **Item 7 (`Slider`) built and Finalized 2026-09-15** — full `06-engineering-standards.md` §9 checklist worked through, including a final review pass and several follow-up fixes (see [Slider.md](component-reviews/Slider.md) for the full history); the first molecule wrapping a compound Radix primitive with no prior atom precedent, adding `@radix-ui/react-slider` as a new dependency. **Item 8 (`Popover`) built 2026-09-16, Finalized 2026-09-17** — full `06-engineering-standards.md` §9 checklist worked through across two full review rounds, including several follow-up fixes (a mobile `max-width` overflow, a `Responsive<PopoverSide>` addition, six missing Radix `Content` event props found in the first review round, two more — `collisionBoundary`/`hideWhenDetached` — found in the second; see [Popover.md](component-reviews/Popover.md) for the full history); the first component in this system exposing real Radix-mirroring compound sub-parts (`Root`/`Trigger`/`Content`/`Close`), adding `@radix-ui/react-popover` as a new dependency. Does not expose Radix's own `Popover.Anchor` sub-part — a confirmed upstream bug in the installed Radix version makes it silently mis-position content; full investigation in `Popover.md`. **Item 9 (`Accordion`) built 2026-09-17, Finalized 2026-09-18** — full baseline/feature/accessibility/responsiveness/theming/Storybook-documentation pass worked through across its build session and a subsequent full `06-engineering-standards.md` §9 review pass (see [Accordion.md](component-reviews/Accordion.md) for the complete history, including six real gaps found and fixed in the review pass and two feature-completeness gaps — `variant`/`size` — built afterward at explicit direction); wraps `@radix-ui/react-accordion` fully rather than literally reusing the `Collapse` atom, a real fork-in-the-road decision recorded as [ADR-0018](adr/0018-accordion-wraps-radix-accordion-content-directly-not-the-collapse-atom.md) — this also corrects the plan this row and `Collapse`'s own JSDoc previously stated. **Item 10 (`Table`, simple) built 2026-09-18, Finalized 2026-09-19** — full baseline/feature/accessibility/responsiveness/theming/Storybook-documentation pass worked through in its build session (see [Table.md](component-reviews/Table.md), including four real defects found and fixed only by live-browser and real-Chromium verification); the first molecule with no Radix primitive underneath it, adding no new dependency and no new token. Its overflow-aware scroll-container design is recorded as [ADR-0019](adr/0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md). **Item 11 (`Card`) built and Finalized 2026-09-19** — compound (`Card.Media`/`Header`/`Body`/`Footer`) with four variants, six colour `tone`s, `size` on the shared scale, `divided` sections, a responsive `orientation` (media beside the content), `mediaPosition` (media at the start or end, top/bottom or either side), and `interactive` + `asChild` with a `disabled` state; adds no new dependency and no new token. Full baseline/feature/accessibility/responsiveness/theming/Storybook-documentation pass worked through in its build session, plus four same-day feature follow-ups at explicit direction (dividers, horizontal + responsive orientation, media position, a disabled state) — see [Card.md](component-reviews/Card.md). **Item 12 (`EmptyState`) built and Finalized 2026-09-19** — compound (`EmptyState.Media`/`Icon`/`Title`/`Description`/`Actions`) with four variants, six colour `tones`, `size` on the shared scale, `align`, an `announce` option (a visually hidden live region filled after mount), and `stackOnMobile` on its actions; the first molecule to pass its `size` to the atoms it renders through a small internal context rather than custom properties alone; adds no new dependency and two component-token families (`empty-state.content-max-width`, `empty-state.media-max-width.*`). Full baseline/feature/accessibility/responsiveness/theming/Storybook-documentation pass worked through in its build session, including a padding defect found only by a live 375px check — see [EmptyState.md](component-reviews/EmptyState.md). **Item 13 (`Pagination`) built 2026-09-19, Finalized 2026-09-20** — a single props-driven component (not a compound) with a window of pages that keeps a constant number of slots however far you are from the ends (its own derivation, tested exhaustively), every control a `Button` slotted onto a `<button>` or a real `<a href>` so an unavailable arrow is `aria-disabled` and keeps keyboard focus, a translatable `labels` object, and a compact form (on a phone, or with `compact="container"` measured in JavaScript against the component's own width, which holds a collapse back while keyboard focus is on a page number); adds no new dependency and no new token (its controls are sized with `IconButton`'s existing size tokens). Built after the first pass, at explicit direction: `variant`, `rounded`, `showJump`, `announce` (a page change is announced to screen readers, through the new shared `useAnnouncement` hook in `primitives`), `formatNumber` and `showLabel`; `rounded` is `Button`'s own new prop, passed through. Full baseline/feature/accessibility/responsiveness/theming/Storybook-documentation pass worked through in its build session, plus a final §9 review pass that found and fixed a spurious announcement, missing list semantics for Safari and a container-mode measuring bug, and closed a right-to-left test gap — see [Pagination.md](component-reviews/Pagination.md). **Item 14 (`Tabs`) built 2026-09-20, Finalized 2026-09-22** — a compound component wrapping `@radix-ui/react-tabs` end to end (`Tabs.List`/`Trigger`/`Content`), with four `variant`s (`underline`/`subtle`/`outlined`/`solid`), `rounded`, `align`, `size` on the shared scale (a trigger is as tall as a `Button` of the same size), `orientation` that also takes a breakpoint map (a vertical list beside its panel that becomes a horizontal strip on a phone), `activationMode`, `fullWidth`, an `icon` per tab, `asChild` for a tab that is another element, and `forceMount` to keep a panel's state; a horizontal list that is too wide scrolls sideways (no scrollbar), keeps the selected tab in view, and shows a fade and a button — held back while it still has keyboard focus — at whichever edge has more. Adds one Radix dependency and no token. Full baseline/feature/accessibility/responsiveness/theming/Storybook-documentation pass worked through in its build session, including four real defects found and fixed (one only by looking at a phone-width screenshot) — see [Tabs.md](component-reviews/Tabs.md). Built afterward, at explicit direction: `outlined`/`outline` naming settled system-wide (`Tag` and `Indicators` renamed to match, see their own review files), new hover fills, the solid variant's focus-ring colour, `rounded`, then `align` on the list and the overflow fades/buttons — see `Tabs.md`'s own follow-up entries for each. A final review pass before Finalizing found and fixed a real, sitewide-relevant defect (every Properties table's Default column silently empty, root-caused to a docgen limitation with compound sub-part `component:` references) — see `Tabs.md`'s own "Final review before Finalizing" entry, including why the same gap in other already-Finalized compound components (`Select.Option`, `Accordion`, `Card`, `EmptyState`, `Popover`, `Table`) was flagged but deliberately not touched here. **Item 15 (`Breadcrumb`) built and Finalized 2026-09-23** — a compound component (`Breadcrumb.Item`/`Link`/`Page`) over a `<nav>` and an ordered list; no Radix primitive underneath, so no new dependency and no new token. `Breadcrumb.Link` composes the `Link` atom (`underline="hover"`, quieter colours) and the "…" button that stands in for collapsed items is an `IconButton`; expanding it moves keyboard focus to the first item it revealed. Full baseline/feature/accessibility/responsiveness/theming/Storybook-documentation pass worked through in its build session, including a contrast correction found by measuring rather than trusting recalled figures — see [Breadcrumb.md](component-reviews/Breadcrumb.md). **Item 16 (`Alert`) built 2026-09-23, Finalized 2026-09-25** — a compound component (`Alert.Title`/`Description`/`Actions`) with the `banner` and `sticky` options that stand in for a separate `Banner`, and a companion hook, `usePersistentDismiss`, in `packages/primitives`; the decision, including why persistence is a hook and not a prop, is [ADR-0023](adr/0023-one-alert-with-banner-and-sticky-options-and-a-separate-persistence-hook.md). It composes `Affix`, `Icon` and Radix `Presence` (already a dependency), adds no new dependency and no token; its dismiss button is built locally per ADR-0008. See [Alert.md](component-reviews/Alert.md). **Item 17 (`RangeSlider`) built and Finalized 2026-09-25** — a single component (not compound) wrapping the `@radix-ui/react-slider` that `Slider` already uses, with the value a `[minimum, maximum]` pair, `minStepsBetweenThumbs`, per-thumb tooltips and names ("Price Minimum", "Price Maximum"; `labels`, ADR-0021), and `showValue` writing the range. It draws through `Slider`'s stylesheet and the layout code extracted from `Slider` into an internal shared module (a zero-output refactor of `Slider`, approved first), so it adds no dependency, no token and no CSS of its own. The build found that Radix moves the first thumb on Home and the last on End whichever has focus (each thumb now handles both keys itself), that React's `autoFocus` does nothing on a thumb (and so has never worked on `Slider`), and that Arabic-Indic digits drew the range backwards (each number is now bidi-isolated); two of them were `Slider` defects (its `autoFocus` never focused, and its thumb's target was under 24px), fixed the same day at explicit direction, and both sliders gained a `dir` prop (`Tabs`' pattern, mirroring under `dir="rtl"`, after the min/max labels were found backwards in a right-to-left page) — see [RangeSlider.md](component-reviews/RangeSlider.md). **Item 18 (`ButtonGroup`) built and Finalized 2026-09-26** — a single component: a named `role="group"` of `Button`s and `IconButton`s, fused into one segmented control (square corners only where buttons meet, a separator drawn to suit each button's variant: a hairline for solid fills, one shared border for `secondary`, a brand-tinted rule for `tertiary` and a focus-coloured one for `ghost`) or spaced apart, in a row or a column (a breakpoint map stacks it on a phone), with `variant`, `size`, `rounded` and `disabled` set once for every button. The choice of how those settings reach the buttons — an internal context that `Button` and `IconButton` read, over layout-only grouping or `cloneElement` — is [ADR-0025](adr/0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md); both atoms changed additively and stay Finalized. Adds no dependency, no token and no component token. The build found `Button`'s and `IconButton`'s Properties-table defaults silently lost when they left destructuring defaults, and that a fused row showed a step beside an `IconButton` until it was let stretch — see [ButtonGroup.md](component-reviews/ButtonGroup.md). **Item 19 (`ToggleGroup`) built and Finalized 2026-09-26** — a compound component (`ToggleGroup` + `ToggleGroup.Item`) over Radix `ToggleGroup`, the first use of `@radix-ui/react-toggle-group`: a segmented control that is a `radiogroup` (`type="single"`, where one item stays chosen once chosen unless `deselectable`, and the arrow keys choose as focus moves, like native radios) or a `toolbar` of toggles (`type="multiple"`). Its items have their own `subtle` / `outlined` / `solid` looks, sizes matched to `Button`'s heights, fused or spaced, a row or a column or a breakpoint map, `fullWidth`, `rounded` and `dir`; the chosen item sits above its neighbours and the focus ring is drawn inside an attached item, in `icon.on-brand` on a filled one. The review found one defect (an item's `role` and checked state could be replaced by props) and the user asked for the arrow-key choice — see [ToggleGroup.md](component-reviews/ToggleGroup.md). **Item 20 (`AvatarGroup`) built and Finalized 2026-09-26** — a single component: a `<ul>` of `Avatar`s overlapped into a stack (one spacing step at every size, a two-letter initials avatar staying legible), a ring in the surface colour between them, and past `max` a "+N" tile that is a plain avatar or, with `onOverflowClick`, a button; `total` gives the real count for a list loaded a page at a time. `size`, `shape` and `colorful` reach the avatars through the same kind of internal context as `ButtonGroup`'s ([ADR-0025](adr/0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md) — followed, so no new ADR); `Avatar` changed additively and stays Finalized. Adds no dependency, no token and no component token. The build found that a proportional overlap clipped two-letter initials from `md` up, only visible in a real browser, and the final review a `NaN` `max`, an `undefined` label that crashed the render, and a target-size check that measured boxes — see [AvatarGroup.md](component-reviews/AvatarGroup.md). **Item 21 (`CodeBlock`) built and Finalized 2026-09-26** — a single component: syntax-highlighted code in a `<figure>`, with a title and language header, a copy button, line numbers, highlighted lines, wrapping, a tallest height, and a collapsible form. The fork in the road — where the highlighting comes from — was put to the user (a small built-in tokenizer, over a highlighting dependency or bring-your-own) and is [ADR-0026](adr/0026-codeblock-highlights-with-a-small-built-in-tokenizer-over-a-highlighting-dependency-or-bring-your-own.md). Adds no dependency, no component token, and twelve semantic tokens in existing categories (ten `text.syntax-*`, `bg.code-block`, `bg.code-highlight`), each measured in all four themes. It follows ADR-0019's overflow-aware scroll frame with its own small hook, and reuses `mergeDefined`, `useAnnouncement`, `IconButton` and `Button`. The build found, by looking rather than measuring, that a highlight band *darker* than the block in dark mode reads as the un-highlighted lines being emphasised, which changed the dark-mode surfaces; 38 mutations found seven gaps in the tests, all closed, and the final review found a quadratic CSS-word tokenizer, a crash on a non-string `code`, and a wrapped collapsed block cut mid-line — see [CodeBlock.md](component-reviews/CodeBlock.md). Item 22 (`Stat / KPI`) is next.

**Form molecules (🟢, step 4's remaining scope)**
1. CheckboxGroup, 2. RadioGroup — simple compositions over already-Finalized atoms (`Checkbox`, and `Radio`), no dependency on anything else in this list
3. FormField — label+control+helper/error composition; the review checklist's "cross-part ARIA/id wiring" checkpoint (`06-engineering-standards.md` §9) is written around this component specifically
4. PasswordInput, 5. NumberInput, 6. SearchInput — each wraps `Input` independently of 1–3 and of each other
7. Slider — standalone

**Overlay foundation (🟢, step 5)**
8. Popover — wraps Radix Popover; prioritized since it's the pattern later organisms (Menu, Combobox, DatePicker) will reuse
9. Accordion — wraps Radix Accordion fully; see [ADR-0018](adr/0018-accordion-wraps-radix-accordion-content-directly-not-the-collapse-atom.md) for why it doesn't literally reuse the `Collapse` atom as originally planned here

**Data Display core (🟢, step 6)**
10. Table (simple) — before Card/EmptyState/Pagination since the future `DataTable` organism builds on it
11. Card, 12. EmptyState, 13. Pagination

**Navigation core (🟢, step 7)**
14. Tabs, 15. Breadcrumb

**Feedback (🟢, step 8)**
16. Alert (one component, with a `banner` option; see ADR-0023)

**🟡, step 9 — dependency-aware order within the tier**
17. RangeSlider — extends Slider (#7); built here, right after Slider, rather than strictly after every 🟢 item, since the shared implementation context is worth reusing while fresh
18. ButtonGroup, 19. ToggleGroup — both attached/segmented-control patterns, ButtonGroup first as the simpler of the two
20. AvatarGroup, 21. CodeBlock — independent, wrap already-Finalized Avatar/Code atoms
22. Stat/KPI, 23. DescriptionList — independent
24. ScrollArea — wraps Radix ScrollArea, independent
25. HoverCard — shares overlay mechanics with Popover (#8); sequenced here to build on that context
26. TimePicker — closely related to the not-yet-built `DatePicker` organism, so lowest-value 🟡 to front-load; last in this tier

**⚪ deferred, last — with one dependency-driven exception**
27. **Toolbar** — nominally ⚪, promoted ahead of its tier because `Table Toolbar` (🟡, item 28) is documented above as likely building on it; building Table Toolbar first would mean either duplicating toolbar logic or refactoring it in later
28. Table Toolbar — sequenced here instead of within the 🟡 batch above, for that reason
29. FieldGroup — depends on FormField (#3), trivial once that exists
30. Splitter, 31. PinInput, 32. RatingInput, 33. TableOfContents — no dependencies on anything else remaining; order among these four doesn't matter

## Related documents
- `01-vision-and-goals.md` — why comprehensiveness and agent-legibility are core goals
- `02-tech-stack-and-structure.md` — where each component lives in the monorepo (`packages/components/src/{atoms,molecules,organisms}`)
- `03-token-system-spec.md` — the token layer every component here consumes
