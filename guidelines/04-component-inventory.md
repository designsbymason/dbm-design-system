# DBM Design System — Component Inventory

Organizing principle: **9 functional categories** for documentation/discoverability (docs site, Storybook sidebar, manifest grouping), with **atomic-design tier** tracked as metadata per component (internal composition concern, not a navigation axis). See `guidelines/adr/0006` for why this hybrid approach.

**Priority key:** 🟢 v1 (core, build first) · 🟡 v1.5 (comprehensive pass, right after v1 ships) · ⚪ v2/deferred (real, but not blocking launch)

How many components each priority holds, and the totals, are in the Rough count summary below — the one place counts live. **Notes say what a component is for and where its scope was decided; a component's full details (every prop, default and behaviour) are in its JSDoc and its Docs page in Storybook, not here.** Per-component review findings are in `component-reviews/`.

---

## 1. Layout
Structural primitives everything else is built from.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Box | atom | 🟢 | Base polymorphic primitive (`as` prop), most components compose this |
| Stack | atom | 🟢 | Vertical/horizontal flex layout with gap token |
| Grid | molecule | 🟢 | CSS Grid wrapper, responsive column props — meaningless without child items, so molecule-tier per [ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md) |
| GridItem | atom | 🟢 | A cell within a `Grid`: colSpan/rowSpan/colStart/rowStart placement, plus `order` (visual reordering independent of DOM order). Works standalone (no context coupling to `Grid`), so atom-tier per [ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md) despite typically being used inside a molecule |
| Container | atom | 🟢 | Max-width + centered content wrapper |
| Divider | atom | 🟢 | Horizontal/vertical, with optional label |
| Spacer | atom | 🟢 | Flex-grow spacer utility |
| AspectRatio | atom | 🟡 | Locks child to a ratio (video embeds, image placeholders) |
| Center | atom | 🟡 | Centers children both axes |
| Bleed | atom | ⚪ | Breaks child out of parent padding (editorial layouts) |
| Affix | atom | 🟡 | Sticky-positioning wrapper (sticky table headers, filter bars) |
| ScrollArea | molecule | 🟡 | Token-driven overlay scrollbar(s) over Radix ScrollArea, one component. Native props go on the outer frame and only scroll-relevant ones to the viewport ([ADR-0028](adr/0028-scrollarea-puts-native-props-on-the-outer-frame-and-routes-only-scroll-relevant-props-to-the-viewport.md)); its scroll-region handling follows `Table`'s ([ADR-0019](adr/0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md)). Review: [ScrollArea.md](component-reviews/ScrollArea.md) |
| Splitter | molecule | ⚪ | Resizable multi-pane layout for dashboard and IDE-style UIs: compound (`Splitter` + `Splitter.Pane`), hand-rolled on the WAI-ARIA window-splitter pattern with no dependency ([ADR-0037](adr/0037-splitter-is-hand-rolled-on-the-window-splitter-pattern-with-automatic-handles-and-a-percentage-layout.md)). Pane identity and fixed or locked panes: [ADR-0038](adr/0038-splitter-panes-have-an-identity-fixed-panes-are-rescaled-and-locked-panes-have-plain-dividers.md); collapsing: [ADR-0039](adr/0039-a-handle-only-asks-a-controlled-pane-to-collapse.md). Review: [Splitter.md](component-reviews/Splitter.md) |

## 2. Typography
Text rendering primitives — Nunito for UI, Lora for editorial/display per the token spec.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Text | atom | 🟢 | Base text primitive, semantic size/weight/color props, plus align/wrap (mirrors Heading) |
| Heading | atom | 🟢 | h1–h6, maps to fluid type scale |
| Link | atom | 🟢 | Internal/external, visited/hover states, icon-affordance for external, disabled (aria-disabled) |
| Code (inline) | atom | 🟡 | Monospace inline snippet |
| CodeBlock | molecule | 🟡 | A `<figure>` around a scrollable `<pre><code>` with syntax highlighting from a small built-in tokenizer, no dependency ([ADR-0026](adr/0026-codeblock-highlights-with-a-small-built-in-tokenizer-over-a-highlighting-dependency-or-bring-your-own.md)); the app registers any extra languages ([ADR-0027](adr/0027-codeblock-languages-are-registered-by-the-app-over-loading-every-grammar-or-loading-them-asynchronously.md)). Review: [CodeBlock.md](component-reviews/CodeBlock.md) |
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
| ButtonGroup | molecule | 🟡 | A named `role="group"` of `Button`s and `IconButton`s, attached (one segmented control) or spaced. Shares `variant`, `size`, `rounded` and `disabled` with its buttons through a context ([ADR-0025](adr/0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md)). Not a selection control and no arrow-key movement; that is `ToggleGroup` / `Toolbar`. Review: [ButtonGroup.md](component-reviews/ButtonGroup.md) |
| Toolbar | molecule | ⚪ | A bar of actions that is one tab stop with arrow-key movement between its items, compound over Radix `Toolbar`. Items join the arrow-key order through wrapper parts and take the bar's settings through `ButtonGroup`'s context ([ADR-0032](adr/0032-toolbar-puts-radix-toolbar-roving-focus-behind-wrapper-parts-and-reuses-buttongroups-context.md)); its `ToggleGroup` turns its own roving focus off ([ADR-0033](adr/0033-toolbar-togglegroup-is-togglegroup-with-its-own-roving-focus-turned-off.md)). Review: [Toolbar.md](component-reviews/Toolbar.md) |
| IconButton | atom | 🟢 | Icon-only, requires `aria-label`; optional `tooltip` (`true` shows the label, or any content) with `tooltipSide` |
| CloseButton | atom | 🟢 | Dedicated dismiss control, fixed brand styling — reserved for modal-style surfaces (Dialog, Drawer, lightbox), not tone-varying components (Tag, Alert, Toast), which implement their own local remove control instead — see `05-component-api-conventions.md` §10 |
| Input (text) | atom | 🟢 | With prefix/suffix slot support |
| PasswordInput | molecule | 🟢 | Visibility toggle, wraps Input |
| Textarea | atom | 🟢 | Auto-resize option |
| NumberInput | molecule | 🟢 | Stepper controls, min/max/step, wraps Input |
| Select | molecule | 🟢 | Native-feel, wraps Radix Select |
| Combobox / Autocomplete | organism | 🟢 | Searchable select, async option loading |
| MultiSelect | organism | 🟡 | Tag-based multi-value select |
| TagsInput | molecule | ⚪ | A typeable tags field: type a value and press Enter or a separator, or paste a list, to make removable `Tag` chips; Backspace on an empty entry removes the last. The entry is its own `<input>` in the same wrapping box as the chips, since `Input`'s one-row box can't hold chips that wrap ([ADR-0049](adr/0049-tagsinput-draws-chips-and-its-own-entry-in-one-wrapping-box-and-adds-on-enter-separator-blur-or-paste-over-the-input-atom-or-a-combobox.md)). Standalone, with no list: it sits beside `MultiSelect`, which chooses from one. Review: [TagsInput.md](component-reviews/TagsInput.md) |
| Checkbox | atom | 🟢 | Indeterminate state support |
| CheckboxGroup | molecule | 🟢 | |
| Radio | atom | 🟢 | A single radio input, functioning standalone as `Checkbox` does. Atom-tier per [ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md), which names this pair. Review: [Radio.md](component-reviews/Radio.md) |
| RadioGroup | molecule | 🟢 | Manages a group of `Radio` atoms — shared `name`, single selected value, roving-tabindex keyboard semantics. Meaningless without `Radio` children, so molecule-tier per the same ADR |
| Switch | atom | 🟢 | |
| Slider | molecule | 🟢 | A single-value slider over Radix Slider: track, filled range and thumb on the shared `size` scale, with value label, ticks and tooltip options. `RangeSlider` shares its stylesheet. Review: [Slider.md](component-reviews/Slider.md) |
| RangeSlider | molecule | 🟡 | Dual-handle range with the same look, props and layouts as `Slider` (it shares its stylesheet and layout code); the value is a `[minimum, maximum]` pair, submitted as two values under `name[]`. Review: [RangeSlider.md](component-reviews/RangeSlider.md) |
| SearchInput | molecule | 🟢 | Debounced, clear button, wraps Input |
| PinInput | molecule | ⚪ | A code-entry field (one-time code, PIN) drawn as one cell per character over a single real `<input>`, so autofill, paste, screen readers and form submission work natively ([ADR-0040](adr/0040-pininput-is-one-real-input-drawn-as-cells-over-an-input-per-cell.md)). No dependency, no token. Review: [PinInput.md](component-reviews/PinInput.md) |
| DatePicker | organism | 🟢 | Calendar popover, range mode |
| DateRangePicker | organism | 🟡 | |
| TimePicker | molecule | 🟡 | A time-of-day field of editable hour, minute, optional second and AM/PM segments, plus a `Popover` of wheels; the value is an `"HH:mm"` string ([ADR-0029](adr/0029-timepicker-is-a-segmented-field-with-a-popover-and-an-hhmm-string-value.md)). Holds its change report with `commitOn` and validates through a hidden time input ([ADR-0030](adr/0030-timepicker-holds-its-report-with-commiton-and-validates-through-a-hidden-time-input.md)). Review: [TimePicker.md](component-reviews/TimePicker.md) |
| TimeRangePicker | molecule | 🟡 | A start and an end `TimePicker` in one named group whose value is one `[start, end]` pair; every setting goes to both ends, and it adds overnight and duration limits ([ADR-0031](adr/0031-timerangepicker-keeps-a-pair-of-times-of-day-and-judges-length-through-the-ends-own-rules.md)). A composition of two `TimePicker`s, not a `range` mode of one. Review: [TimeRangePicker.md](component-reviews/TimeRangePicker.md) |
| Calendar | molecule | 🟢 | A standalone month grid with keyboard navigation and single, range, multiple and whole-week selection; dates are `"YYYY-MM-DD"` strings on a hand-built grid ([ADR-0044](adr/0044-calendar-dates-are-yyyy-mm-dd-strings-with-a-single-and-a-range-mode-and-a-hand-built-grid.md)). Months on show, select fields, footer and markers: [ADR-0045](adr/0045-calendar-grows-by-months-on-show-select-fields-a-footer-and-a-marker-prop-over-a-view-switcher-or-a-day-render-prop.md); multiple mode, `name` and gestures: [ADR-0046](adr/0046-calendar-multiple-is-a-list-of-dates-a-name-submits-hidden-inputs-and-pointer-gestures-are-shortcuts-over-a-sorted-set-object-or-required-gestures.md); year and month grids: [ADR-0047](adr/0047-calendar-gets-year-and-month-grids-behind-its-heading-and-a-whole-week-mode-over-more-select-fields-or-a-separate-week-picker.md). 12KB JS budget. `DatePicker` and `DateRangePicker` are a field and a `Popover` around it. Review: [Calendar.md](component-reviews/Calendar.md) |
| FileUpload / Dropzone | organism | 🟢 | Drag-drop, progress, multi-file |
| ColorPicker | organism | ⚪ | Given token-driven theming, likely low-usage but completes the set |
| RatingInput | molecule | ⚪ | A rating field: icons (stars by default) over native radios, so the arrow keys, one tab stop, form submission and `required` are the browser's own. Two radios per icon give half steps ([ADR-0041](adr/0041-ratinginput-is-a-native-radio-group-with-two-radios-per-icon-at-half-steps-over-a-slider-role.md)). Review: [RatingInput.md](component-reviews/RatingInput.md) |
| ToggleGroup | molecule | 🟡 | A segmented control over Radix `ToggleGroup` (`ToggleGroup` + `ToggleGroup.Item`): `single` (a `radiogroup`) or `multiple` (a `toolbar` of toggles), with its own looks and sizes matched to `Button`'s heights. Review: [ToggleGroup.md](component-reviews/ToggleGroup.md) |
| Form | organism | 🟢 | Context provider + validation wiring |
| FormField | molecule | 🟢 | Label + control + helper/error text composition |
| FieldGroup | molecule | ⚪ | Groups `FormField`s under one legend as a native `<fieldset>`/`<legend>`, distinct from `Form`'s validation role and `FormField`'s single-field scope. Hands `disabled` and `size` to the fields inside through a context ([ADR-0035](adr/0035-fieldgroup-is-a-native-fieldset-and-hands-disabled-and-size-to-formfield-through-a-context.md)); a field takes the group's size only inside a group that sets one ([ADR-0036](adr/0036-a-field-hands-its-size-to-its-control-only-inside-a-fieldgroup-that-sets-one.md)). Review: [FieldGroup.md](component-reviews/FieldGroup.md) |
| EditableText | molecule | ⚪ | A value shown as text that becomes a field when activated, committing on Enter or blur and cancelling on Escape: a native button swapped for an `Input` (or a `Textarea` with `multiline`), reporting only what is committed ([ADR-0048](adr/0048-editabletext-swaps-a-button-for-a-field-and-reports-only-what-is-committed-over-a-live-field-or-a-controlled-value-per-keystroke.md)). Review: [EditableText.md](component-reviews/EditableText.md) |
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
| AvatarGroup | molecule | 🟡 | Avatars overlapped into a stack, the ones past `max` collapsing into a "+N" tile. Sets `size`, `shape` and `colorful` once for every avatar through an internal context, the mechanism `ButtonGroup` uses ([ADR-0025](adr/0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md)). Review: [AvatarGroup.md](component-reviews/AvatarGroup.md) |
| DataTable | organism | 🟢 | Sort, select rows, pagination integration — this is the enterprise-critical component |
| Table (simple) | molecule | 🟢 | A lighter-weight, non-interactive tabular display, compound (`Table.Header`/`Body`/`Footer`/`Row`/`HeaderCell`/`Cell`/`Caption`). Owns an overflow-aware scroll container and puts native props on the table element ([ADR-0019](adr/0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md)); `DataTable` builds on it. Review: [Table.md](component-reviews/Table.md) |
| Pagination | molecule | 🟢 | A `<nav>` of previous, page numbers and next around a window of pages that keeps a constant width; every control is a `Button`. Listed under Navigation too; it lives here because it is data-bound. Review: [Pagination.md](component-reviews/Pagination.md) |
| Stat / KPI | molecule | 🟡 | Ships as `Stat`, per the `Tag / Chip` precedent (the first name in the row). Compound (`Stat.Icon`/`Label`/`Value`/`Trend`/`Description`) with `ghost`/`outlined`/`filled` variants and colour `tone`s. Review: [Stat.md](component-reviews/Stat.md) |
| Timeline | organism | 🟡 | Vertical event sequence |
| Tree / TreeView | organism | 🟡 | Expandable hierarchical data (file trees, org charts) |
| DescriptionList | molecule | 🟡 | A key/value display block, compound (`DescriptionList.Item`/`Term`/`Details`), with `bordered`/`ghost` variants (`Table`'s vocabulary) and a responsive `columns` grid. Review: [DescriptionList.md](component-reviews/DescriptionList.md) |
| EmptyState | molecule | 🟢 | Icon, message and optional call to action, used across the system. Compound (`EmptyState.Media`/`Icon`/`Title`/`Description`/`Actions`); fits inside a `Card` or `Table.Empty`; `announce` tells a screen reader about one that appears from a user action. Review: [EmptyState.md](component-reviews/EmptyState.md) |
| Skeleton | atom | 🟢 | Loading placeholder shapes |
| TableToolbar | molecule | 🟡 | The bar above a table of data, compound over `Toolbar`, `Popover`, `Tag`, `SearchInput` and the form controls: search, filter, active filters, summary and bulk selection. A named `role="group"` that owns no data, not a toolbar ([ADR-0034](adr/0034-tabletoolbar-is-a-stateless-group-of-parts-with-toolbars-inside-it-not-one-toolbar.md)). Review: [TableToolbar.md](component-reviews/TableToolbar.md) |

## 5. Navigation
Wayfinding and app structure.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Navbar / TopNav | organism | 🟢 | App header shell |
| Sidebar / SideNav | organism | 🟢 | Collapsible, nested items — enterprise-critical |
| Tabs | molecule | 🟢 | Wraps Radix Tabs, compound (`Tabs.List`/`Trigger`/`Content`), with four variants; a list that outgrows its container scrolls and keeps the selected tab in view. Review: [Tabs.md](component-reviews/Tabs.md) |
| EditorTabs | organism | ⚪ | Data-driven, closable/reorderable/addable tab strip (open files, records, or user-created views) — wraps `Tabs` for the underlying keyboard/ARIA mechanics; distinct from `Tabs`' fixed, author-defined set. Named as a gap in `Tabs`' own review ([Tabs.md](component-reviews/Tabs.md)) |
| Breadcrumb | molecule | 🟢 | Compound (`Breadcrumb.Item`/`Link`/`Page`): a `<nav>` around an ordered list ending in the current page; `Breadcrumb.Link` is the `Link` atom. A long trail collapses (`maxItems`, `compact`). Review: [Breadcrumb.md](component-reviews/Breadcrumb.md) |
| Menu (dropdown) | organism | 🟢 | Wraps Radix DropdownMenu |
| Menubar | organism | ⚪ | A desktop-style horizontal bar of menus (File, Edit, View) with arrow-key movement between them, over Radix `Menubar`; reuses `Menu`'s items |
| Stepper | organism | 🟡 | Multi-step flow indicator (wizards, onboarding) |
| NavigationMenu | organism | 🟡 | The site-header navigation pattern with panels of grouped links that open under their item (a mega menu), over Radix `NavigationMenu`. Distinct from `Navbar`, which is the header shell, and `Menu`, which is a list of actions. Decide at `Navbar` whether `Navbar` alone covers the need |
| CommandPalette | organism | 🟡 | ⌘K-style search/action launcher — high agent/power-user value |
| Pagination | molecule | 🟢 | A `<nav>` of previous, page numbers and next around a window of pages that keeps a constant width; every control is a `Button`. Listed under Navigation too; it lives here because it is data-bound. Review: [Pagination.md](component-reviews/Pagination.md) |
| BackToTop | atom | ⚪ | Floating scroll-to-top button, appears past a scroll threshold — wraps IconButton |
| TableOfContents | molecule | ⚪ | An anchor-linked outline of one page, from an `items` list or read from the page's headings, whose current entry follows the scroll position. One component over the `Link` atom; no dependency. Review: [TableOfContents.md](component-reviews/TableOfContents.md) |

## 6. Feedback
System status communicated to the user.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Alert | molecule | 🟢 | One component for an inline message and a page-level banner ([ADR-0023](adr/0023-one-alert-with-banner-and-sticky-options-and-a-separate-persistence-hook.md)). Compound; status tones, dismissible, optional inline actions ([ADR-0024](adr/0024-alert-action-reads-the-alerts-colours-over-tone-props-on-button-or-unrestricted-children.md)). Review: [Alert.md](component-reviews/Alert.md) |
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
| HoverCard | molecule | 🟡 | A rich preview that opens when the pointer rests on a link or keyboard focus lands on it, over Radix HoverCard; compound (`HoverCard.Trigger`/`Content`) in `Popover`'s shape. Supplementary by design: never opens on touch, no role, contents out of the tab order. Review: [HoverCard.md](component-reviews/HoverCard.md) |
| Tour | organism | ⚪ | A guided product tour: a sequence of steps each anchoring a `Popover`-style card to an element on the page, with a dimmed spotlight, next/back/skip and keyboard control |
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
| 🟢 v1 (core) | 69 |
| 🟡 v1.5 (comprehensive) | 28 |
| ⚪ v2/deferred | 18 |
| **Total planned** | **115** |

Counted directly from the nine category tables above, deduplicated by component name (`Pagination` is listed under both Data Display and Navigation). By tier: 48 atoms, 40 molecules, 27 organisms. Templates (below) are composed patterns, not components, and aren't counted. **When adding or re-prioritizing a component, recount from the tables rather than adjusting these figures by increments** — they drifted from the tables that way before.

Tier placement follows [ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md): an item component that works standalone (`Radio`, `GridItem`, `ListItem`) is an atom even when its container (`RadioGroup`, `Grid`, `List`) is a molecule.

This puts v1 alone in "real, comprehensive design system" territory (not a 15-component starter kit), with a clear, sequenced path to full coverage rather than trying to build all 115 at once.

## Sequencing recommendation for actual build order

Not alphabetical, not category-by-category: build in **dependency order**, since many components above are built on top of others. The atom tier (steps 1–3) is complete, and so is the molecule tier; the organism tier is next.

1. Utility primitives (ThemeProvider, Portal, VisuallyHidden, FocusTrap, ClientOnly) + Layout primitives (Box, Stack, Container, Divider, Spacer, AspectRatio, Center, Bleed, Affix)
2. Typography (Text, Heading, Link, Code, Blockquote, Kbd, Highlight, ListItem)
3. Core atoms (Button, IconButton, CloseButton, Icon, Badge, Tag, Avatar, Input, Textarea, Checkbox, Switch, FieldLabel/FieldError/FieldHelperText, Skeleton, Spinner, ProgressBar, ProgressCircle, Divider, Image, Tooltip, Collapse, Backdrop, BackToTop, Indicators)
4. Form molecules (FormField, RadioGroup, Select) plus Grid and List — Checkbox/Switch/Textarea/Tag already exist as atoms and unlock the form ones
5. Overlay foundation (Dialog, Popover) — Tooltip/Collapse/Backdrop already exist as atoms and unlock these; Dialog/Popover unlock Drawer, ConfirmDialog, AlertDialog, Menu
6. Data Display core (Card, Table, DataTable, EmptyState)
7. Navigation core (Tabs, Breadcrumb, Navbar, Sidebar)
8. Feedback (Alert, Toast, ProgressBar, Spinner)
9. Everything tagged 🟡, in the same dependency-aware order
10. Templates, once enough organisms exist to compose them meaningfully

### Molecule-tier build order, itemized

Dependency order, then priority (🟢 before 🟡 before ⚪). `Grid`, `List` and `Select` were built ahead of schedule and reviewed first; the items below followed one at a time (`Radio`, an atom, was built first as the prerequisite for item 2). All are built and Finalized. `Calendar`, `EditableText` and `TagsInput` joined the molecule tier later, and are built.

| # | Component | Why here | Review |
|---|---|---|---|
| 1 | CheckboxGroup | Simple composition over `Checkbox`; no other dependency | [CheckboxGroup](component-reviews/CheckboxGroup.md) |
| 2 | RadioGroup | Simple composition over `Radio` | [RadioGroup](component-reviews/RadioGroup.md) |
| 3 | FormField | Label, control and helper/error composition; the review checklist's cross-part ARIA/id checkpoint is written around it | [FormField](component-reviews/FormField.md) |
| 4–6 | PasswordInput, NumberInput, SearchInput | Each wraps `Input` independently of 1–3 and of each other | [PasswordInput](component-reviews/PasswordInput.md), [NumberInput](component-reviews/NumberInput.md), [SearchInput](component-reviews/SearchInput.md) |
| 7 | Slider | Standalone | [Slider](component-reviews/Slider.md) |
| 8 | Popover | The overlay pattern later organisms (Menu, Combobox, DatePicker) reuse | [Popover](component-reviews/Popover.md) |
| 9 | Accordion | Wraps Radix Accordion fully, not the `Collapse` atom ([ADR-0018](adr/0018-accordion-wraps-radix-accordion-content-directly-not-the-collapse-atom.md)) | [Accordion](component-reviews/Accordion.md) |
| 10 | Table | Before Card, EmptyState and Pagination, since `DataTable` builds on it | [Table](component-reviews/Table.md) |
| 11–13 | Card, EmptyState, Pagination | Data Display core | [Card](component-reviews/Card.md), [EmptyState](component-reviews/EmptyState.md), [Pagination](component-reviews/Pagination.md) |
| 14–15 | Tabs, Breadcrumb | Navigation core | [Tabs](component-reviews/Tabs.md), [Breadcrumb](component-reviews/Breadcrumb.md) |
| 16 | Alert | One component with a `banner` option ([ADR-0023](adr/0023-one-alert-with-banner-and-sticky-options-and-a-separate-persistence-hook.md)) | [Alert](component-reviews/Alert.md) |
| 17 | RangeSlider | Extends `Slider` (7); built right after it while the shared context was fresh | [RangeSlider](component-reviews/RangeSlider.md) |
| 18–19 | ButtonGroup, ToggleGroup | Both attached/segmented-control patterns, `ButtonGroup` first as the simpler | [ButtonGroup](component-reviews/ButtonGroup.md), [ToggleGroup](component-reviews/ToggleGroup.md) |
| 20–21 | AvatarGroup, CodeBlock | Independent; wrap the finished `Avatar` and `Code` atoms | [AvatarGroup](component-reviews/AvatarGroup.md), [CodeBlock](component-reviews/CodeBlock.md) |
| 22–23 | Stat, DescriptionList | Independent | [Stat](component-reviews/Stat.md), [DescriptionList](component-reviews/DescriptionList.md) |
| 24 | ScrollArea | Wraps Radix ScrollArea; independent | [ScrollArea](component-reviews/ScrollArea.md) |
| 25 | HoverCard | Shares overlay mechanics with `Popover` (8) | [HoverCard](component-reviews/HoverCard.md) |
| 26 | TimePicker | Closely related to the `DatePicker` organism, so the lowest-value 🟡 to front-load; last in its tier | [TimePicker](component-reviews/TimePicker.md) |
| 26b | TimeRangePicker | Composes two `TimePicker`s, so it follows 26 | [TimeRangePicker](component-reviews/TimeRangePicker.md) |
| 27 | Toolbar | Nominally ⚪, promoted ahead of its tier because `TableToolbar` builds on it | [Toolbar](component-reviews/Toolbar.md) |
| 28 | TableToolbar | Follows `Toolbar` | [TableToolbar](component-reviews/TableToolbar.md) |
| 29 | FieldGroup | Depends on `FormField` (3) | [FieldGroup](component-reviews/FieldGroup.md) |
| 30–33 | Splitter, PinInput, RatingInput, TableOfContents | No dependency on anything remaining | [Splitter](component-reviews/Splitter.md), [PinInput](component-reviews/PinInput.md), [RatingInput](component-reviews/RatingInput.md), [TableOfContents](component-reviews/TableOfContents.md) |
| — | Calendar | Added when the organism order was set; built before `DatePicker`, since `DatePicker` and `DateRangePicker` wrap it | [Calendar](component-reviews/Calendar.md) |
| — | EditableText | Added when the organism order was set; standalone, composing `Input` and `Textarea` | [EditableText](component-reviews/EditableText.md) |
| — | TagsInput | Added when the organism order was set; standalone, composing `Tag` around its own entry field. Suggestions from `Combobox` come later, as an additive layer | [TagsInput](component-reviews/TagsInput.md) |

### Organism-tier build order

Dependency order, then priority (🟢 before 🟡 before ⚪). Build one at a time, each with the full `06-engineering-standards.md` §9 pass; note any deviation here. Not started.

**🟢 core**
1. Dialog / Modal — foundation for every modal (uses `FocusTrap`, `Backdrop`, `Portal`, `CloseButton`)
2. AlertDialog, 3. ConfirmDialog — variants and a pattern on the Dialog
4. Drawer / Sheet — a side-panel Dialog; `Navbar` and `Sidebar` need it on a phone
5. Menu (dropdown) — `ContextMenu`, `Menubar`, `Navbar`, `Sidebar` and `DataTable` row actions reuse it
6. Toast / Notification — independent; other organisms report results through it
7. Form — context and validation over `FormField` and `FieldGroup`
8. Combobox / Autocomplete — `MultiSelect` and `CommandPalette` build on it (`TagsInput` is standalone; a suggestions list from this is a later, additive layer)
9. Calendar (molecule, prerequisite; built), then DatePicker
10. DataTable — needs `Table`, `Pagination`, `TableToolbar`, Menu and virtualization
11. Navbar / TopNav, 12. Sidebar / SideNav — use Menu and Drawer
13. FileUpload / Dropzone

**🟡 v1.5**
14. ContextMenu (on Menu), 15. MultiSelect (on Combobox), 16. DateRangePicker (on Calendar and DatePicker), 17. CommandPalette (Dialog plus Combobox-style search), 18. NavigationMenu (decide at `Navbar` whether it is needed), 19. Stepper, 20. Timeline, 21. Tree / TreeView

**⚪ deferred**
22. Menubar (after Menu), 23. EditorTabs (wraps `Tabs`; reordering needs the drag-and-drop decision), 24. Carousel, 25. ImageViewer / Lightbox (Dialog, optionally Carousel), 26. ColorPicker (Popover plus Slider), 27. Tour (Popover-style cards and a spotlight)

**Reordering** (`EditorTabs`, `Tree`, `DataTable` column reordering): one hand-rolled sortable hook in `primitives`, single list, pointer/touch/keyboard, internal for now — [ADR-0043](adr/0043-reordering-is-a-hand-rolled-sortable-hook-in-primitives-for-a-single-list-over-a-drag-and-drop-dependency.md). Build the hook with the first component that needs it.

## Related documents
- `01-vision-and-goals.md` — why comprehensiveness and agent-legibility are core goals
- `02-tech-stack-and-structure.md` — where each component lives in the monorepo (`packages/components/src/{atoms,molecules,organisms}`)
- `03-token-system-spec.md` — the token layer every component here consumes
- `05-component-api-conventions.md` — how each component's props, files and definition of done must look
- `06-engineering-standards.md` — the review checklist a component passes before it is Finalized
- `07-storybook-and-documentation-standards.md` — per-component Docs-page and Finalized status (§6)
- `adr/` and `component-reviews/` — the decisions and per-component findings the Notes link to
