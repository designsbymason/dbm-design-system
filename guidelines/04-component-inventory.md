# DBM Design System — Component Inventory

**Status: v1 draft.** Organizing principle: **9 functional categories** for documentation/discoverability (docs site, Storybook sidebar, manifest grouping), with **atomic-design tier** tracked as metadata per component (internal composition concern, not a navigation axis). See `01-vision-and-goals.md` for why this hybrid approach — functional categories are what MUI, Chakra UI, and Ant Design independently converge on; atomic tiers stay internal.

**Priority key:** 🟢 v1 (core, build first) · 🟡 v1.5 (comprehensive pass, right after v1 ships) · ⚪ v2/deferred (real, but not blocking launch)

Target v1 scope: **~65 components**. Full comprehensive scope (v1 + v1.5): **~95 components**. This is deliberately in Astryx's range (90–150+), not a "basic" starter set.

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

## 3. Inputs & Forms
Anything that captures user input. Largest category by necessity — this is where "comprehensive" gets tested.

| Component | Tier | Priority | Notes |
|---|---|---|---|
| Button | atom | 🟢 | Primary/secondary/tertiary/destructive/ghost variants, loading state |
| IconButton | atom | 🟢 | Icon-only, requires `aria-label` |
| Input (text) | atom | 🟢 | With prefix/suffix slot support |
| Textarea | atom | 🟢 | Auto-resize option |
| NumberInput | molecule | 🟢 | Stepper controls, min/max/step |
| Select | molecule | 🟢 | Native-feel, wraps Radix Select |
| Combobox / Autocomplete | organism | 🟢 | Searchable select, async option loading |
| MultiSelect | organism | 🟡 | Tag-based multi-value select |
| Checkbox | atom | 🟢 | Indeterminate state support |
| CheckboxGroup | molecule | 🟢 | |
| RadioGroup / Radio | molecule | 🟢 | |
| Switch | atom | 🟢 | |
| Slider | molecule | 🟢 | Single value |
| RangeSlider | molecule | 🟡 | Dual-handle range |
| SearchInput | molecule | 🟢 | Debounced, clear button |
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
| Icon | atom | 🟢 | Phosphor wrapper — typed name prop, size/weight tokens |
| Image | atom | 🟢 | Lazy-load, fallback, aspect-ratio integration |
| ImageViewer / Lightbox | organism | ⚪ | Full-screen zoomable image view |
| Carousel | organism | ⚪ | Wraps Radix or headless carousel logic |

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

Not individual components, but composed patterns — worth planning for since Astryx's "templates over composing from scratch" approach is a real differentiator, but these should come **after** the underlying components exist, not before.

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
| 🟢 v1 (core) | ~62 |
| 🟡 v1.5 (comprehensive) | ~24 |
| ⚪ v2/deferred | ~13 |
| **Total planned** | **~99** |

This puts v1 alone in "real, comprehensive design system" territory (not a 15-component starter kit), with a clear, sequenced path to Astryx-scale coverage rather than trying to build all ~99 at once.

## Sequencing recommendation for actual build order
Not alphabetical, not category-by-category — build in **dependency order**, since many components above are explicitly built on top of others:
1. Utility primitives (ThemeProvider, Portal, VisuallyHidden, FocusTrap) + Layout primitives (Box, Stack, Grid)
2. Typography (Text, Heading, Link)
3. Core atoms (Button, IconButton, Icon, Badge, Avatar, Input, Skeleton, Divider)
4. Form molecules (FormField, Checkbox, Radio, Switch, Select) — these unlock most remaining Input components
5. Overlay foundation (Dialog, Popover, Tooltip via Radix) — these unlock Drawer, ConfirmDialog, AlertDialog, Menu
6. Data Display core (Card, Table, DataTable, EmptyState)
7. Navigation core (Tabs, Breadcrumb, Navbar, Sidebar)
8. Feedback (Alert, Toast, ProgressBar, Spinner)
9. Everything tagged 🟡, in the same dependency-aware order
10. Templates, once enough organisms exist to compose them meaningfully

## Related documents
- `01-vision-and-goals.md` — why comprehensiveness and agent-legibility are core goals
- `02-tech-stack-and-structure.md` — where each component lives in the monorepo (`packages/components/src/{atoms,molecules,organisms}`)
- `03-token-system-spec.md` — the token layer every component here consumes
