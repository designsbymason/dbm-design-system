# DBM Design System — Component Inventory

**Status: v1 draft.** Organizing principle: **9 functional categories** for documentation/discoverability (docs site, Storybook sidebar, manifest grouping), with **atomic-design tier** tracked as metadata per component (internal composition concern, not a navigation axis). See `guidelines/adr/0006` for why this hybrid approach.

**Priority key:** 🟢 v1 (core, build first) · 🟡 v1.5 (comprehensive pass, right after v1 ships) · ⚪ v2/deferred (real, but not blocking launch)

Target v1 scope: **~65 components**. Full comprehensive scope (v1 + v1.5): **~95 components** — enough to build a real web/enterprise application end to end (forms, navigation, data display, feedback, overlays) without falling back to one-off custom components, not a "basic" starter set.

---

## 1. Layout
Structural primitives everything else is built from.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Box | atom | 🟢 | Base polymorphic primitive (`as` prop), most components compose this |
| Stack | atom | 🟢 | Vertical/horizontal flex layout with gap token |
| Grid / GridItem | molecule | 🟢 | CSS Grid wrapper, responsive column props |
| Container | atom | 🟢 | Max-width + centered content wrapper |
| Divider | atom | 🟢 | Horizontal/vertical, with optional label |
| Spacer | atom | 🟢 | Flex-grow spacer utility |
| AspectRatio | atom | 🟡 | Locks child to a ratio (video embeds, image placeholders) |
| Center | atom | 🟡 | Centers children both axes |
| Bleed | atom | ⚪ | Breaks child out of parent padding (editorial layouts) |
| Affix | atom | 🟡 | Sticky-positioning wrapper (sticky table headers, filter bars) |
| ScrollArea | molecule | 🟡 | Custom-styled scrollable region (wraps Radix ScrollArea) |

## 2. Typography
Text rendering primitives — Nunito for UI, Lora for editorial/display per the token spec.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Text | atom | 🟢 | Base text primitive, semantic size/weight/color props |
| Heading | atom | 🟢 | h1–h6, maps to fluid type scale |
| Link | atom | 🟢 | Internal/external, visited/hover states, icon-affordance for external |
| Code (inline) | atom | 🟡 | Monospace inline snippet |
| CodeBlock | molecule | 🟡 | Multi-line, syntax-highlighted, copy button |
| Blockquote | atom | 🟡 | Uses Lora for editorial feel |
| List / ListItem | atom | 🟢 | Ordered/unordered, custom marker support |
| Kbd | atom | ⚪ | Keyboard shortcut display |
| Highlight | atom | 🟡 | Inline text-highlight span, for search-match emphasis |

## 3. Inputs & Forms
Anything that captures user input. Largest category by necessity — this is where "comprehensive" gets tested.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Button | atom | 🟢 | Primary/secondary/tertiary/destructive/ghost variants, loading state |
| ButtonGroup | molecule | 🟡 | Attached/segmented button set, shared border-radius |
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
| RadioGroup / Radio | molecule | 🟢 | |
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
| Table (simple) | molecule | 🟢 | Lighter-weight, non-interactive tabular display |
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
| BackToTop | atom | ⚪ | |
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
| Tooltip | atom | 🟢 | Wraps Radix Tooltip |
| HoverCard | molecule | 🟡 | Rich preview on hover (user cards, link previews) |
| Accordion | molecule | 🟢 | Wraps Radix Accordion |
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
| 🟢 v1 (core) | ~64 |
| 🟡 v1.5 (comprehensive) | ~26 |
| ⚪ v2/deferred | ~14 |
| **Total planned** | **~104** |

This puts v1 alone in "real, comprehensive design system" territory (not a 15-component starter kit), with a clear, sequenced path to full coverage rather than trying to build all ~104 at once.

## Sequencing recommendation for actual build order
Not alphabetical, not category-by-category — build in **dependency order**, since many components above are explicitly built on top of others. Steps 1–3 (every atom-tier row in this doc, Grid/GridItem excepted — see the note on step 1) are done as of Phase 4.75 (`01-vision-and-goals.md` §13) — **47 atoms total, none left unbuilt** (corrected 2026-08-12; this doc, `01-vision-and-goals.md`, and `07-storybook-and-documentation-standards.md` all previously said "49," which was simply a miscount against this doc's own table — count the atom-tier rows across all 9 categories above and it's 47):
1. Utility primitives (ThemeProvider, Portal, VisuallyHidden, FocusTrap, ClientOnly) + Layout primitives (Box, Stack, Container, Divider, Spacer, AspectRatio, Center, Bleed, Affix) — corrected 2026-08-12: Grid was listed here in error; it's molecule-tier per this doc's own Layout table above and is tracked under step 4 instead.
2. Typography (Text, Heading, Link, Code, Blockquote, Kbd, Highlight)
3. Core atoms (Button, IconButton, CloseButton, Icon, Badge, Tag, Avatar, Input, Textarea, Checkbox, Switch, FieldLabel/FieldError/FieldHelperText, Skeleton, Spinner, ProgressBar, ProgressCircle, Divider, Image, Tooltip, Collapse, Backdrop, BackToTop, Indicators)
4. Form molecules (FormField, RadioGroup, Select) plus Grid/GridItem — Checkbox/Switch/Textarea/Tag already exist as atoms and unlock the form ones. **Started 2026-08-09, ahead of the original plan** (this step was meant to follow Phase 4.9's full documentation pass on the atom tier — see `01-vision-and-goals.md` §13 Phase 5 — but began in parallel instead): `Grid`, `GridItem`, and `Select` are built; `FormField`/`RadioGroup` are not yet.
5. Overlay foundation (Dialog, Popover) — Tooltip/Collapse/Backdrop already exist as atoms and unlock these; Dialog/Popover unlock Drawer, ConfirmDialog, AlertDialog, Menu
6. Data Display core (Card, Table, DataTable, EmptyState)
7. Navigation core (Tabs, Breadcrumb, Navbar, Sidebar)
8. Feedback (Alert, Toast, ProgressBar, Spinner)
9. Everything tagged 🟡, in the same dependency-aware order
10. Templates, once enough organisms exist to compose them meaningfully

## Related documents
- `01-vision-and-goals.md` — why comprehensiveness and agent-legibility are core goals
- `02-tech-stack-and-structure.md` — where each component lives in the monorepo (`packages/components/src/{atoms,molecules,organisms}`)
- `03-token-system-spec.md` — the token layer every component here consumes
