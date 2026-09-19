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
| CodeBlock | molecule | 🟡 | Multi-line, syntax-highlighted, copy button |
| Blockquote | atom | 🟡 | Uses Lora for editorial feel |
| List | molecule | 🟢 | Ordered/unordered, custom marker support — meaningless without `ListItem` children, so molecule-tier per [ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md) |
| ListItem | atom | 🟢 | A single item within a `List` — optional custom marker icon, trailing content, interactive/selected/disabled states. Renders/functions correctly standalone, so atom-tier per [ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md) despite typically being used inside a molecule |
| Kbd | atom | ⚪ | Keyboard shortcut display |
| Highlight | atom | 🟡 | Inline text-highlight span; wrap the match yourself, or pass `query` to have it find and wrap matches itself |

## 3. Inputs & Forms
Anything that captures user input. Largest category by necessity — this is where "comprehensive" gets tested.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Button | atom | 🟢 | Primary/secondary/tertiary/destructive/ghost variants, loading state |
| ButtonGroup | molecule | 🟡 | Attached/segmented button set, shared border-radius |
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
| Radio | atom | 🟢 | A single radio input — functions correctly standalone, mirroring `Checkbox`'s own atom-tier precedent. Atom-tier per [ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md), which names this exact pair as a future application of its own standing test. **Split out of the former combined "RadioGroup / Radio" row, 2026-09-14** — a new, not-yet-built atom; the "47 of 47 atoms, fully Finalized" figures elsewhere in `guidelines/` predate this split and don't include it |
| RadioGroup | molecule | 🟢 | Manages a group of `Radio` atoms — shared `name`, single selected value, roving-tabindex keyboard semantics. Meaningless without `Radio` children, so molecule-tier per the same ADR |
| Switch | atom | 🟢 | |
| Slider | molecule | 🟢 | Single value |
| RangeSlider | molecule | 🟡 | Dual-handle range |
| SearchInput | molecule | 🟢 | Debounced, clear button, wraps Input |
| PinInput | molecule | ⚪ | OTP/verification code entry |
| DatePicker | organism | 🟢 | Calendar popover, range mode |
| DateRangePicker | organism | 🟡 | |
| TimePicker | molecule | 🟡 | |
| FileUpload / Dropzone | organism | 🟢 | Drag-drop, progress, multi-file |
| ColorPicker | organism | ⚪ | Given token-driven theming, likely low-usage but completes the set |
| RatingInput | molecule | ⚪ | Star/scale rating |
| ToggleGroup | molecule | 🟡 | Segmented control (single/multi select) |
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
| Card | molecule | 🟢 | Header/body/footer slots |
| Badge | atom | 🟢 | Status/count indicator |
| Tag / Chip | atom | 🟢 | Removable variant for filters |
| Avatar | atom | 🟢 | Image/initials fallback, status dot |
| AvatarGroup | molecule | 🟡 | Stacked/overflow-counted |
| DataTable | organism | 🟢 | Sort, select rows, pagination integration — this is the enterprise-critical component |
| Table (simple) | molecule | 🟢 | Lighter-weight, non-interactive tabular display — compound (`Table.Header`/`Body`/`Footer`/`Row`/`HeaderCell`/`Cell`/`Caption`); owns an overflow-aware scroll container, see [ADR-0019](adr/0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md). Also: `stickyHeader`/`stickyFirstColumn`/`stickyLastColumn`, six colour `tone`s, a `numeric` cell option, a `loading` body with skeleton rows, and a `Table.Empty` state. No sorting/selection/pagination — that's `DataTable` |
| Pagination | molecule | 🟢 | (Cross-listed conceptually with Navigation, lives here as it's data-bound) |
| Stat / KPI | molecule | 🟡 | Metric + label + trend indicator |
| Timeline | organism | 🟡 | Vertical event sequence |
| Tree / TreeView | organism | 🟡 | Expandable hierarchical data (file trees, org charts) |
| DescriptionList | molecule | 🟡 | Key/value display block |
| EmptyState | molecule | 🟢 | Icon + message + optional CTA, used across the system |
| Skeleton | atom | 🟢 | Loading placeholder shapes |
| Table Toolbar | molecule | 🟡 | Filters/search/actions bar paired with DataTable |

## 5. Navigation
Wayfinding and app structure.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Navbar / TopNav | organism | 🟢 | App header shell |
| Sidebar / SideNav | organism | 🟢 | Collapsible, nested items — enterprise-critical |
| Tabs | molecule | 🟢 | Wraps Radix Tabs |
| Breadcrumb | molecule | 🟢 | |
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
| Alert / Banner | molecule | 🟢 | Inline, info/success/warning/danger |
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
| ⚪ v2/deferred | 13 |
| **Total planned** | **107** |

Counted directly from the nine category tables above, deduplicated by component name — `Pagination` is deliberately cross-listed under both Data Display and Navigation, so the tables hold 108 rows but 107 distinct components. By tier: 48 atoms, 36 molecules, 23 organisms. Templates (below) are composed patterns, not components, and aren't counted here. **When adding or re-prioritizing a component, recount from the tables rather than adjusting these figures by increments** — they drifted from the tables that way before (see the correction note below).

**Updated 2026-09-10** — added `Toolbar`, `Splitter`, `FieldGroup` (all ⚪, molecule-tier) following a molecule-tier feature-completeness gap-check run before the molecule review phase began; ⚪ count 14→17, total 104→107. A fourth candidate (a typeable tags/token input) was considered and deliberately deferred rather than added — it may already be covered by `MultiSelect`'s "tag-based" rendering, not yet confirmed since `MultiSelect` isn't built; revisit once `MultiSelect` exists.

**Updated 2026-09-14** — split the combined `RadioGroup / Radio` row into `RadioGroup` (molecule) and `Radio` (atom), per [ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md)'s own standing test, which names this exact pair by name as a future application it hadn't yet been applied to. Every "47 of 47 atoms, fully Finalized" figure elsewhere in `guidelines/` (`01-vision-and-goals.md`, `07-storybook-and-documentation-standards.md`) describes the atom tier as it stood before this split and doesn't include `Radio`. 🟢 count 64→65, total 107→108. Atom tier: 48 planned. Molecule tier: unchanged at 36 (`RadioGroup` stays a molecule; only `Radio` moved out, to atom-tier — an earlier version of this note said 36→35, a miscount corrected 2026-09-18 against the tables' actual molecule-tier rows). **`Radio` built and Finalized 2026-09-14, same day** — full `06-engineering-standards.md` §9 pass complete; see [Radio.md](component-reviews/Radio.md).

**Corrected 2026-09-18** — the summary table above previously read ~65 / ~26 / ~17 / ~108, kept current by incremental adjustments (the 2026-09-10 and 2026-09-14 notes above) rather than recounts, and had drifted from the actual tables: 🟢 was really 68 and ⚪ 13, and the "108" was the raw row count including `Pagination`'s duplicate listing rather than distinct components. The 2026-09-10/09-14 notes above describe those incremental changes as they were recorded and are left as written; the figures in the table are now the authoritative ones.

This puts v1 alone in "real, comprehensive design system" territory (not a 15-component starter kit), with a clear, sequenced path to full coverage rather than trying to build all 107 at once.

## Sequencing recommendation for actual build order
Not alphabetical, not category-by-category — build in **dependency order**, since many components above are explicitly built on top of others. Steps 1–3 (every atom-tier row in this doc, Grid/GridItem excepted — see the note on step 1) are done as of Phase 4.75 (`01-vision-and-goals.md` §13) — **47 atoms total, none left unbuilt** (corrected 2026-08-12; this doc, `01-vision-and-goals.md`, and `07-storybook-and-documentation-standards.md` all previously said "49," which was simply a miscount against this doc's own table — count the atom-tier rows across all 9 categories above and it's 47):

**Corrected 2026-09-07 ([ADR-0012](adr/0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md)):** `GridItem` and `ListItem` are now atom-tier; `Grid` and `List` are now molecule-tier (previously each pair shared a single combined row/tier — see that ADR for why). Checked against real git history before writing this note, not assumed: `Grid`/`GridItem` were originally authored together on 2026-07-18 (Phase 3, alongside Box/Stack/Container/Divider/Spacer) — genuinely atom-tier at the time, files and all. They moved to `molecules/` on 2026-08-09 in the same commit that added `Select` (`"...moving Grid/GridItem there from atoms/, where they'd been misfiled relative to their documented tier"` — i.e. the inventory doc had *already* called the combined pair molecule-tier before that commit; the move just brought the files in line). Today's change is really GridItem's second tier flip: atom (Phase 3) → molecule (2026-08-09, as part of the undifferentiated pair) → atom again (today, now correctly split from `Grid`). `List`/`ListItem` were also both authored 2026-07-18, stayed atom-tier and in `atoms/` the whole time until today's move splits them the same way. The **47 atoms total** figure is unaffected by today's change — `GridItem` replaces `List` in the count, net zero.

1. Utility primitives (ThemeProvider, Portal, VisuallyHidden, FocusTrap, ClientOnly) + Layout primitives (Box, Stack, Container, Divider, Spacer, AspectRatio, Center, Bleed, Affix) — corrected 2026-08-12: Grid was listed here in error; it's molecule-tier per this doc's own Layout table above and is tracked under step 4 instead.
2. Typography (Text, Heading, Link, Code, Blockquote, Kbd, Highlight, ListItem)
3. Core atoms (Button, IconButton, CloseButton, Icon, Badge, Tag, Avatar, Input, Textarea, Checkbox, Switch, FieldLabel/FieldError/FieldHelperText, Skeleton, Spinner, ProgressBar, ProgressCircle, Divider, Image, Tooltip, Collapse, Backdrop, BackToTop, Indicators)
4. Form molecules (FormField, RadioGroup, Select) plus Grid and List — Checkbox/Switch/Textarea/Tag already exist as atoms and unlock the form ones. **Started 2026-08-09, ahead of the original plan** (this step was meant to follow Phase 4.9's full documentation pass on the atom tier — see `01-vision-and-goals.md` §13 Phase 5 — but began in parallel instead): `Grid`, `GridItem` (atom-tier per ADR-0012, but built here regardless — no dependency reason to build it earlier than `Grid`), and `Select` are built; `List` itself has existed since Phase 3 but only became molecule-tier today; `FormField`/`RadioGroup` are not yet.
5. Overlay foundation (Dialog, Popover) — Tooltip/Collapse/Backdrop already exist as atoms and unlock these; Dialog/Popover unlock Drawer, ConfirmDialog, AlertDialog, Menu
6. Data Display core (Card, Table, DataTable, EmptyState)
7. Navigation core (Tabs, Breadcrumb, Navbar, Sidebar)
8. Feedback (Alert, Toast, ProgressBar, Spinner)
9. Everything tagged 🟡, in the same dependency-aware order
10. Templates, once enough organisms exist to compose them meaningfully

### Molecule-tier build order, itemized (added 2026-09-14)

`Grid`, `List`, `Select` (the three review-first molecules, `01-vision-and-goals.md` §13) are Finalized. This itemizes steps 4–9 above across the 33 molecules remaining after those three (36 molecule-tier in total; `RadioGroup` is one of the 33, while `Radio` moved to atom-tier per the Rough count summary above and isn't counted here; as of 2026-09-19, items 1–10 are built and Finalized, leaving 23 not yet started), applying the same dependency-order + priority-tier (🟢 before 🟡 before ⚪) logic the steps above only stated in the abstract. Build one at a time, in this order, unless a later session finds a reason to deviate (note it here if so):

**`Radio` (atom, the prerequisite for item 2 below) built and Finalized 2026-09-14** — see [Radio.md](component-reviews/Radio.md). **`RadioGroup` (item 2) built and Finalized the same day** — full `06-engineering-standards.md` §9 pass complete; see [RadioGroup.md](component-reviews/RadioGroup.md). **Item 1 (`CheckboxGroup`) built and Finalized the same day** — see [CheckboxGroup.md](component-reviews/CheckboxGroup.md). **Item 3 (`FormField`) built and Finalized the same day** — see [FormField.md](component-reviews/FormField.md). **Item 4 (`PasswordInput`) built and Finalized the same day** — see [PasswordInput.md](component-reviews/PasswordInput.md). **Item 5 (`NumberInput`) built and Finalized the same day** — full `06-engineering-standards.md` §9 pass complete, including a final review pass that found and fixed a real defect (`onClear` not actually clearing an uncontrolled value); see [NumberInput.md](component-reviews/NumberInput.md). **Item 6 (`SearchInput`) built and Finalized the same day** — full `06-engineering-standards.md` §9 pass complete, including a final review pass that found and fixed two real defects (Enter firing mid-IME-composition, and jest-axe never exercising the clear-button-rendered state) and one architecture decision asked rather than guessed (Enter now `preventDefault()`s so it never submits a surrounding `<form>` — user chose to block it over leaving native submission available) — see [SearchInput.md](component-reviews/SearchInput.md). Also found and fixed two real, pre-existing defects in the already-Finalized `Input` atom it consumes (a clear button never disabled under `disabled`/`readOnly`, and a native WebKit search-cancel-button icon `Input`'s own `type="search"` support never actually suppressed) — both logged in `Input.md`. **Item 7 (`Slider`) built and Finalized 2026-09-15** — full `06-engineering-standards.md` §9 checklist worked through, including a final review pass and several follow-up fixes (see [Slider.md](component-reviews/Slider.md) for the full history); the first molecule wrapping a compound Radix primitive with no prior atom precedent, adding `@radix-ui/react-slider` as a new dependency. **Item 8 (`Popover`) built 2026-09-16, Finalized 2026-09-17** — full `06-engineering-standards.md` §9 checklist worked through across two full review rounds, including several follow-up fixes (a mobile `max-width` overflow, a `Responsive<PopoverSide>` addition, six missing Radix `Content` event props found in the first review round, two more — `collisionBoundary`/`hideWhenDetached` — found in the second; see [Popover.md](component-reviews/Popover.md) for the full history); the first component in this system exposing real Radix-mirroring compound sub-parts (`Root`/`Trigger`/`Content`/`Close`), adding `@radix-ui/react-popover` as a new dependency. Does not expose Radix's own `Popover.Anchor` sub-part — a confirmed upstream bug in the installed Radix version makes it silently mis-position content; full investigation in `Popover.md`. **Item 9 (`Accordion`) built 2026-09-17, Finalized 2026-09-18** — full baseline/feature/accessibility/responsiveness/theming/Storybook-documentation pass worked through across its build session and a subsequent full `06-engineering-standards.md` §9 review pass (see [Accordion.md](component-reviews/Accordion.md) for the complete history, including six real gaps found and fixed in the review pass and two feature-completeness gaps — `variant`/`size` — built afterward at explicit direction); wraps `@radix-ui/react-accordion` fully rather than literally reusing the `Collapse` atom, a real fork-in-the-road decision recorded as [ADR-0018](adr/0018-accordion-wraps-radix-accordion-content-directly-not-the-collapse-atom.md) — this also corrects the plan this row and `Collapse`'s own JSDoc previously stated. **Item 10 (`Table`, simple) built 2026-09-18, Finalized 2026-09-19** — full baseline/feature/accessibility/responsiveness/theming/Storybook-documentation pass worked through in its build session (see [Table.md](component-reviews/Table.md), including four real defects found and fixed only by live-browser and real-Chromium verification); the first molecule with no Radix primitive underneath it, adding no new dependency and no new token. Its overflow-aware scroll-container design is recorded as [ADR-0019](adr/0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md). Item 11 (`Card`) is next.

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
16. Alert/Banner

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
