# Architecture Decision Records

Short, effectively immutable records of *why* a real architectural or API decision was made — not a changelog, not a debugging log, not a place to narrate how a bug was found and fixed. The numbered docs in `guidelines/` (`01`–`07`) are the current-state reference (what's true right now); an ADR is the "why" behind a specific fork-in-the-road decision, kept separate so the numbered docs can stay short and scannable instead of carrying the full reasoning inline.

See `CLAUDE.md`'s own note on this split before adding either kind of entry.

## When something earns an ADR

A real fork in the road — a choice between genuine alternatives where the reasoning would otherwise get re-derived or re-litigated — or a decision that constrains how future components must be built (a pattern every future component of that kind now has to follow).

**Not every decision qualifies.** A bug fix, a verification pass, a debugging dead-end, a copy tweak, an intermediate wrong turn — none of these get a permanent record anywhere; they belong in the commit that made the change. Recreating the same narrative bloat here that this folder exists to get *out* of the numbered docs defeats the point.

## Naming

`NNNN-short-kebab-title.md` — sequential, zero-padded to 4 digits, numbered in the order written. A number is never reused or reassigned, even if the ADR it belonged to is later superseded.

## Immutability

Once written, an ADR's Context/Decision/Alternatives/Consequences don't get rewritten in place. If a decision later changes, write a **new** ADR that supersedes the old one — update only the old one's `Status` line to point at the new one. This is the whole point of the format: history stays as a sequence of clean, dated files instead of one file accumulating "note (superseded ...): this reasoning no longer applies" corrections stacked on corrections.

**One narrow exception: a small correction to a *detail* of an accepted ADR, when the decision itself hasn't changed.** Say a treatment, a value or an example the ADR spells out turns out to need adjusting, but the choice it records (the fork in the road, and why) still stands. A new superseding ADR would suggest the decision was reversed, which it wasn't, so instead edit the ADR in place **and mark the amendment**:

- add `· **Amended YYYY-MM-DD** — <what was amended>; the decision itself is unchanged` to the `Status` line, and
- put the original wording next to the new in the text, in a short italic note (`*(Amended YYYY-MM-DD: this originally said …, because …)*`), so nobody reading it later mistakes the current text for the original.

Anything that changes *what was decided*, or the reasoning under it, is still a new ADR that supersedes the old one. An amendment is for the detail, never the decision; if you're unsure which it is, write the new ADR. (First used on [ADR-0024](./0024-alert-action-reads-the-alerts-colours-over-tone-props-on-button-or-unrestricted-children.md).) A record that has not been pushed yet can simply be corrected, since nobody has relied on it.

## Template

```markdown
# NNNN — <Decision, phrased as a choice: "X over Y">

**Status:** Accepted · **Date:** YYYY-MM-DD

## Context
The problem or conflict that forced this decision.

## Decision
What was decided, stated plainly.

## Alternatives considered
What was rejected, and why. Usually the most useful section for a future reader.

## Consequences
What this enables, what it costs, what it constrains going forward.

## Related
Pointers to the relevant `guidelines/*.md` section and affected component(s).
```

A superseded ADR's `Status` line becomes: `Status: Superseded by [NNNN](./NNNN-new-title.md) · Date: YYYY-MM-DD` — the rest of the file stays as originally written, unedited.

## Index

| # | Title | Status |
|---|---|---|
| [0001](./0001-avatar-keeps-hand-rolled-image-state-machine.md) | Avatar keeps its own hand-rolled image-load state machine over `@radix-ui/react-avatar` | Accepted |
| [0002](./0002-aa-contrast-floor-aaa-target-for-error-text.md) | WCAG AA is the enforced contrast floor everywhere; AAA is a target, not a requirement, for error/critical-alert text only | Accepted |
| [0003](./0003-a11y-panel-gated-behind-addon-vitest.md) | Storybook's Accessibility addon panel requires `@storybook/addon-vitest`, not just `@storybook/addon-a11y` | Accepted |
| [0004](./0004-radix-ui-primitives-for-accessibility-logic.md) | Radix UI Primitives for accessibility/interaction logic, not hand-rolled | Accepted |
| [0005](./0005-dark-mode-light-fill-dark-text-pattern.md) | Dark-mode solid fills use a light tone-appropriate fill paired with dark text, not a mid-tone fill paired with white text | Accepted |
| [0006](./0006-functional-categories-over-atomic-tier-navigation.md) | Organize the component inventory by functional category, not atomic-design tier | Accepted |
| [0007](./0007-as-vs-aschild-by-content-source.md) | `as` vs. `asChild`: pick based on where the component's visual content comes from | Accepted |
| [0008](./0008-closebutton-reserved-for-modal-surfaces.md) | `CloseButton` is reserved for modal-style overlay surfaces; tone-varying components get their own local remove control | Accepted |
| [0009](./0009-rtl-mirroring-is-a-per-component-judgment-call.md) | Whether a component's rendered result mirrors under RTL is a separate, per-component judgment call | Accepted |
| [0010](./0010-presence-driven-exit-animation-plain-open-boolean.md) | A plain `open` boolean over the full controlled/uncontrolled trio for Presence-driven exit animation | Accepted |
| [0011](./0011-darker-dark-mode-representative-background.md) | Darken dark mode's representative background (`bg.surface`) one step, cascading through dependent tokens, over adjusting brand tokens in isolation | Accepted |
| [0012](./0012-item-components-are-atom-tier-even-when-their-container-is-a-molecule.md) | A "container + item" pair's tier is decided per-component by independent function, not inherited from its partner | Accepted |
| [0013](./0013-compound-sub-part-properties-documented-via-hidden-docs-only-stories-file.md) | A compound sub-part's own props get their own Properties table via a hidden, docs-only stories file | Accepted |
| [0014](./0014-radio-self-wrapping-dual-mode-over-native-input-or-a-narrower-atom-bar.md) | `Radio` self-wraps a private Radix group standalone, over a native `<input>` or a narrower atom bar | Accepted |
| [0015](./0015-formfield-render-prop-over-cloneelement-or-shared-context.md) | `FormField` computes field props and hands them back via a render-prop `children`, over `cloneElement` injection or a shared context | Accepted |
| [0016](./0016-track-vs-track-strong-scoped-to-decorative-need-not-interactivity.md) | `bg.track` vs. `bg.track-strong` is scoped by whether the track itself must convey the boundary, not by whether the control is interactive | Accepted |
| [0017](./0017-popover-omits-anchor-sub-part-pending-upstream-fix.md) | `Popover` omits Radix's own `Anchor` sub-part, over shipping it with a broken-feature warning | Accepted |
| [0018](./0018-accordion-wraps-radix-accordion-content-directly-not-the-collapse-atom.md) | `Accordion` wraps Radix Accordion's own `Content` directly, not the `Collapse` atom | Accepted |
| [0019](./0019-table-owns-an-overflow-aware-scroll-container-and-puts-native-props-on-the-table-element.md) | `Table` owns an overflow-aware scroll container and puts native props on the `<table>` element | Accepted |
| [0020](./0020-show-code-uses-hand-written-snippets-over-storybook-generated-source.md) | "Show code" shows hand-written snippets, not Storybook's own or generated source | Accepted |
| [0021](./0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md) | Text a component supplies is a `labels` object, and displayed numbers go through an optional `formatNumber` that defaults to plain output, over an implicit `Intl` default | Accepted |
| [0022](./0022-dependency-updates-are-a-manual-refresh-pass-not-dependabot-version-prs.md) | Dependency updates are a manual refresh pass, not Dependabot version-update PRs | Accepted |
| [0023](./0023-one-alert-with-banner-and-sticky-options-and-a-separate-persistence-hook.md) | One `Alert` with `banner` and `sticky` options and a separate `usePersistentDismiss` hook, over a separate `Banner` or built-in persistence | Accepted |
| [0024](./0024-alert-action-reads-the-alerts-colours-over-tone-props-on-button-or-unrestricted-children.md) | `Alert.Action`, a `Button` that reads the alert's colours, over tone and surface props on `Button` or unrestricted children | Accepted |
| [0025](./0025-buttongroup-shares-settings-through-a-context-read-by-button-and-iconbutton.md) | `ButtonGroup` hands its settings to the buttons through an internal context that `Button` and `IconButton` read, over layout-only grouping or `cloneElement` | Accepted |
| [0026](./0026-codeblock-highlights-with-a-small-built-in-tokenizer-over-a-highlighting-dependency-or-bring-your-own.md) | `CodeBlock` highlights with a small built-in tokenizer, over a highlighting dependency or bring-your-own | Accepted |
| [0027](./0027-codeblock-languages-are-registered-by-the-app-over-loading-every-grammar-or-loading-them-asynchronously.md) | `CodeBlock` languages beyond the core are registered by the app, over loading every grammar with the component or loading them asynchronously | Accepted |
| [0028](./0028-scrollarea-puts-native-props-on-the-outer-frame-and-routes-only-scroll-relevant-props-to-the-viewport.md) | `ScrollArea` puts native props on the outer frame and routes only scroll-relevant props (`onScroll`, `viewportRef`) to the viewport | Accepted |
| [0029](./0029-timepicker-is-a-segmented-field-with-a-popover-and-an-hhmm-string-value.md) | `TimePicker` is a custom segmented field with a popover, whose value is an `"HH:mm"` string, over a native time input or a slot list | Accepted |
| [0030](./0030-timepicker-holds-its-report-with-commiton-and-validates-through-a-hidden-time-input.md) | `TimePicker` holds `onValueChange` back with `commitOn`, and a form validates it through a hidden time input, over reporting every change and a hidden input nothing validates | Accepted |
| [0031](./0031-timerangepicker-keeps-a-pair-of-times-of-day-and-judges-length-through-the-ends-own-rules.md) | `TimeRangePicker` keeps a pair of times of day and judges overnight and length through each end's own rules, over a date-carrying value or a range-only validity path | Accepted |
| [0032](./0032-toolbar-puts-radix-toolbar-roving-focus-behind-wrapper-parts-and-reuses-buttongroups-context.md) | `Toolbar` gets its roving focus from Radix `Toolbar` through wrapper parts and hands settings down through `ButtonGroup`'s context, over a hand-rolled key handler or a bare container | Accepted |
| [0033](./0033-toolbar-togglegroup-is-togglegroup-with-its-own-roving-focus-turned-off.md) | `Toolbar.ToggleGroup` is the `ToggleGroup` molecule with its own roving focus switched off (a public `rovingFocus` prop), over a second implementation or a group that detects a toolbar | Accepted |
| [0034](./0034-tabletoolbar-is-a-stateless-group-of-parts-with-toolbars-inside-it-not-one-toolbar.md) | `TableToolbar` is a stateless named group of parts, with real `Toolbar`s inside it for the buttons, over one big `role="toolbar"` or a component that owns the filter state | Accepted |
| [0035](./0035-fieldgroup-is-a-native-fieldset-and-hands-disabled-and-size-to-formfield-through-a-context.md) | `FieldGroup` is a native `<fieldset>` and hands `disabled` and `size` to `FormField` through a context, over a `role="group"` div or fieldset-only disabling | Accepted |
| [0036](./0036-a-field-hands-its-size-to-its-control-only-inside-a-fieldgroup-that-sets-one.md) | A `FormField` hands its size to its control only inside a `FieldGroup` that sets one, over always handing it or a context every control reads | Accepted |
| [0037](./0037-splitter-is-hand-rolled-on-the-window-splitter-pattern-with-automatic-handles-and-a-percentage-layout.md) | `Splitter` is hand-rolled on the window-splitter pattern, with automatic handles and a percentage layout, over a dependency, explicit handle parts or pixel sizes | Accepted |
| [0038](./0038-splitter-panes-have-an-identity-fixed-panes-are-rescaled-and-locked-panes-have-plain-dividers.md) | `Splitter` panes have an identity (`id`, else `key`), fixed panes are rescaled by the container's ratio and locked panes get plain dividers, over required ids, a pixel layout or disabled-but-focusable handles | Accepted |
| [0039](./0039-a-handle-only-asks-a-controlled-pane-to-collapse.md) | A `Splitter` handle only asks a controlled pane to collapse, and the pane follows its prop, over applying the gesture and enforcing the prop afterwards | Accepted |
| [0040](./0040-pininput-is-one-real-input-drawn-as-cells-over-an-input-per-cell.md) | `PinInput` is one real input drawn as cells, over an input per cell | Accepted |
| [0041](./0041-ratinginput-is-a-native-radio-group-with-two-radios-per-icon-at-half-steps-over-a-slider-role.md) | `RatingInput` is a native radio group, with two radios per icon at half steps, over a slider role | Accepted |
| [0042](./0042-yellow-is-an-anchored-scale-with-its-own-light-end-chroma-and-the-highlight-semantic-family.md) | Yellow is an anchored scale with its own light-end chroma, and its semantic family is named `highlight` | Accepted |
| [0043](./0043-reordering-is-a-hand-rolled-sortable-hook-in-primitives-for-a-single-list-over-a-drag-and-drop-dependency.md) | Reordering is a hand-rolled sortable hook in `primitives` for a single list, over a drag-and-drop dependency | Accepted |
| [0044](./0044-calendar-dates-are-yyyy-mm-dd-strings-with-a-single-and-a-range-mode-and-a-hand-built-grid.md) | `Calendar` dates are `"YYYY-MM-DD"` strings, one component has a single and a range mode, and the grid is hand-built, over a `Date` value, a separate range component or a date library | Accepted |
| [0045](./0045-calendar-grows-by-months-on-show-select-fields-a-footer-and-a-marker-prop-over-a-view-switcher-or-a-day-render-prop.md) | `Calendar` grows by months on show, select fields for the month and year, a footer and a marker prop, over a month/year view switcher or a day render prop | Accepted |
| [0046](./0046-calendar-multiple-is-a-list-of-dates-a-name-submits-hidden-inputs-and-pointer-gestures-are-shortcuts-over-a-sorted-set-object-or-required-gestures.md) | `Calendar`'s multiple mode is a list of date strings, `name` submits through hidden inputs, and a drag and a swipe are shortcuts, over a set object, a native form field or gestures the keyboard can't do | Accepted |
| [0047](./0047-calendar-gets-year-and-month-grids-behind-its-heading-and-a-whole-week-mode-over-more-select-fields-or-a-separate-week-picker.md) | `Calendar` gets year and month grids behind its heading and a whole-week mode, over more select fields or a separate week picker | Accepted |
| [0048](./0048-editabletext-swaps-a-button-for-a-field-and-reports-only-what-is-committed-over-a-live-field-or-a-controlled-value-per-keystroke.md) | `EditableText` swaps a button for a field and reports only what is committed, over an always-present field or a value reported per keystroke | Accepted |
| [0049](./0049-tagsinput-draws-chips-and-its-own-entry-in-one-wrapping-box-and-adds-on-enter-separator-blur-or-paste-over-the-input-atom-or-a-combobox.md) | `TagsInput` draws its chips and its own entry in one wrapping box, and adds a tag on Enter, a separator, blur or paste, over the `Input` atom or a `Combobox` | Accepted |
| [0050](./0050-tagsinput-chips-are-one-tab-stop-with-arrow-key-movement-and-tag-lets-its-remove-button-leave-the-tab-order.md) | `TagsInput`'s chips are one tab stop with arrow-key movement, and `Tag` lets its remove button leave the tab order | Accepted |
| [0051](./0051-tagsinput-collapses-to-the-width-by-measuring-an-unseen-copy-of-its-chips-over-css-only-clipping-or-a-fixed-count.md) | `TagsInput` collapses to the width by measuring an unseen copy of its chips, over CSS-only clipping or a fixed count | Accepted |
| [0052](./0052-dialog-wraps-radix-dialog-draws-its-scrim-with-backdrop-inside-radixs-overlay-and-pins-the-radix-family-to-one-release-train.md) | `Dialog` wraps Radix Dialog, draws its scrim with `Backdrop` inside Radix's overlay, and keeps the Radix packages on one release train | Accepted |
| [0053](./0053-dialog-alertdialog-and-drawer-are-sibling-components-not-one-dialog-with-a-role-or-placement-prop.md) | `Dialog`, `AlertDialog` and `Drawer` are sibling components, not one `Dialog` with a `role` or `placement` prop | Accepted |

*(Extracted from `01-vision-and-goals.md`/`02-tech-stack-and-structure.md`/`03-token-system-spec.md`/`04-component-inventory.md`/`05-component-api-conventions.md`/`06-engineering-standards.md` during the guidelines retrofit pass, 2026-08-31 — more get added the same way, file by file, as the retrofit continues.)*

## This folder is public and permanent

Same rule as the rest of `guidelines/` (see its own `README.md`): the repo is public and git history doesn't forget. Never record secrets, credentials, personal identifying information, or client/business-sensitive details in an ADR.
