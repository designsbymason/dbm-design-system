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
| [0054](./0054-portaled-floating-panels-sit-on-the-popover-z-index-step-not-dropdown.md) | Portaled floating panels sit on the `popover` z-index step, not `dropdown` | Accepted |
| [0055](./0055-dialog-keeps-its-content-mounted-by-moving-one-rendered-element-in-and-out-of-the-panel-over-radixs-forcemount.md) | `Dialog`'s `keepMounted` moves one rendered element in and out of the panel, over Radix's `forceMount` | Accepted |
| [0056](./0056-alertdialog-draws-with-dialogs-sections-and-stylesheet-and-defers-extracting-them-to-the-third-consumer.md) | `AlertDialog` draws with `Dialog`'s sections and stylesheet, and extraction waits for the third consumer | Superseded by 0060 |
| [0057](./0057-confirmdialog-is-a-prop-driven-wrapper-over-alertdialog-with-its-own-trigger-and-a-typed-confirmation-field-over-a-compound-of-its-own.md) | `ConfirmDialog` is a prop-driven wrapper over `AlertDialog`, with its own trigger and a typed-confirmation field, over a compound of its own or a second consumer of `Dialog` | Accepted |
| [0058](./0058-confirmdialogs-onconfirm-may-return-a-promise-that-holds-it-busy-and-a-rejection-keeps-it-open-over-a-caller-managed-busy-state.md) | `ConfirmDialog`'s `onConfirm` may return a promise that holds it busy, and a rejection keeps it open, over a caller-managed busy state | Accepted |
| [0059](./0059-confirmdialog-announces-instead-of-drawing-progress-delays-the-confirm-over-hold-to-confirm-and-remembers-through-the-dismiss-store.md) | `ConfirmDialog` announces progress instead of drawing it, delays the confirm over a hold-to-confirm, and remembers "don't ask again" through the dismiss store | Accepted |
| [0060](./0060-the-overlay-sections-are-extracted-to-internal-overlay-with-the-panel-staying-each-components-own.md) | The overlay sections are extracted to `internal/overlay`, with the panel staying each component's own | Accepted |
| [0061](./0061-drawer-is-attached-to-a-logical-side-that-can-change-with-the-screen-with-its-own-size-tokens-and-no-swipe-yet.md) | `Drawer` is attached to a logical `side` that can change with the screen, with its own size tokens, and swipe-to-dismiss waits | Accepted |
| [0062](./0062-overlays-report-when-they-have-finished-opening-and-closing-through-onopenchangecomplete.md) | Overlays report when they have finished opening and closing through `onOpenChangeComplete` | Accepted |
| [0063](./0063-drawer-gets-swipe-to-dismiss-from-its-handle-and-header-a-size-that-can-be-a-length-and-a-back-button-recipe.md) | `Drawer` gets swipe-to-dismiss from its handle and header, a `size` that can be a length, and a Back-button recipe | Accepted |
| [0064](./0064-menu-wraps-radix-dropdown-menu-on-the-pinned-release-train-holds-its-own-open-state-is-modal-by-default-and-opens-on-arrowup.md) | `Menu` wraps Radix DropdownMenu on the pinned release train, holds its own open state, is modal by default and opens on ArrowUp | Accepted |
| [0065](./0065-menu-draws-its-item-parts-in-its-own-stylesheet-for-contextmenu-and-menubar-to-import-and-aligns-indicators-with-has.md) | `Menu` draws its item parts in its own stylesheet for `ContextMenu` and `Menubar` to import, and aligns indicators with `:has()` | Accepted |
| [0066](./0066-menu-items-take-a-promise-a-close-on-select-setting-a-reason-for-being-disabled-and-a-description-and-a-menu-reports-when-it-has-closed.md) | `Menu` items take a promise, a `closeOnSelect` setting, a reason for being disabled and a description, and the menu reports when it has closed | Accepted |
| [0067](./0067-overlays-return-focus-to-the-element-that-opened-them-when-they-have-no-trigger-and-a-closing-scrim-lets-presses-through.md) | Overlays return focus to the element that opened them when they have no trigger, and a closing scrim lets presses through | Accepted |
| [0068](./0068-toolbar-moves-what-doesnt-fit-into-a-menu-reading-its-parts-as-they-register-over-a-data-driven-item-list.md) | `Toolbar` moves what doesn't fit into a `Menu` (`overflow="menu"`), reading its parts as they register, over a data-driven item list | Accepted |
| [0069](./0069-toast-wraps-radix-toast-pinned-at-1-2-23-on-the-shared-layer-stack-over-a-hand-rolled-toast-or-the-newest-release.md) | `Toast` wraps Radix Toast pinned at 1.2.23, on the shared layer stack, over a hand-rolled toast or the newest release | Accepted |
| [0070](./0070-toast-is-raised-from-code-through-a-provider-and-a-hook-with-a-declarative-toast-beside-it-over-a-module-level-function-or-component-only-use.md) | `Toast` is raised from code through a provider and a hook, with a declarative `Toast` beside it, over a module-level function or component-only use | Accepted |
| [0071](./0071-toast-actions-may-take-a-promise-a-repeated-or-replaced-toast-is-drawn-afresh-and-clear-all-is-a-toast-of-its-own-over-a-plain-button-or-a-timer-nudge.md) | A toast's action may take a promise, a repeated or replaced toast is drawn afresh, and "Clear all" is a toast of its own, over a plain button or a timer nudge | Accepted |
| [0072](./0072-toast-gets-an-optional-fanned-stack-that-expands-on-pointer-or-focus-over-replacing-the-list-or-a-toggle-button.md) | `Toast` gets an optional fanned stack that expands on pointer or focus, over replacing the list or adding a toggle button | Accepted |
| [0073](./0073-toast-list-puts-the-newest-on-top-and-clear-all-at-the-bottom-at-every-edge-over-the-newest-against-the-edge.md) | A toast list puts the newest on top and "Clear all" at the bottom at every edge, over the newest against the edge | Accepted |
| [0074](./0074-form-reads-the-dom-for-values-and-the-browsers-rules-and-calls-the-rules-you-write-over-a-value-store-or-a-schema-library.md) | `Form` reads the DOM for its values and the browser's rules, and calls the rules you write, over owning a value store or taking a schema library | Accepted |
| [0075](./0075-form-shows-its-own-messages-and-moves-focus-to-the-first-invalid-control-and-announces-the-count-over-the-browsers-bubbles.md) | `Form` shows its own messages, moves focus to the first invalid control and announces the count, over the browser's validation bubbles | Accepted |
| [0076](./0076-form-rules-may-return-promises-and-the-form-is-reached-from-outside-by-a-controller-and-two-hooks-over-synchronous-rules-or-an-imperative-ref.md) | `Form` rules may return promises, a form-level error has its own part, and the form is reached from outside by a controller and two hooks, over synchronous rules and a bare form ref | Accepted |
| [0077](./0077-combobox-floats-its-list-with-a-radix-popover-anchor-and-no-trigger-over-popover-popper-and-a-dismissable-layer-or-a-bare-portal.md) | `Combobox` floats its list with a Radix Popover that has an anchor and no trigger, over `Popover` itself, Popper with a dismissable layer, or a bare portal | Accepted |
| [0078](./0078-combobox-takes-its-options-as-data-over-option-parts-mounted-as-children.md) | `Combobox` takes its options as an `options` array, over `Combobox.Option` parts mounted as children | Accepted |
| [0079](./0079-combobox-must-pick-by-default-keeps-the-chosen-value-apart-from-the-typed-text-and-submits-through-a-hidden-validated-input.md) | `Combobox` must be picked from by default, keeps the chosen value apart from the typed text, and submits through a hidden validated input, over submitting the text | Accepted |
| [0080](./0080-long-option-lists-are-drawn-a-window-at-a-time-by-a-hand-rolled-hook-with-fixed-row-heights-from-tokens-over-a-virtualization-dependency-or-measured-rows.md) | Long option lists are drawn a window at a time by a hand-rolled hook with fixed row heights from tokens, over a virtualization dependency or measured rows | Accepted |
| [0081](./0081-combobox-offers-a-full-width-presentation-measured-against-the-visual-viewport-over-a-docked-bottom-sheet.md) | `Combobox` offers a full-width presentation measured against the visual viewport, over a docked bottom sheet | Accepted |

*(Extracted from `01-vision-and-goals.md`/`02-tech-stack-and-structure.md`/`03-token-system-spec.md`/`04-component-inventory.md`/`05-component-api-conventions.md`/`06-engineering-standards.md` during the guidelines retrofit pass, 2026-08-31 — more get added the same way, file by file, as the retrofit continues.)*

## This folder is public and permanent

Same rule as the rest of `guidelines/` (see its own `README.md`): the repo is public and git history doesn't forget. Never record secrets, credentials, personal identifying information, or client/business-sensitive details in an ADR.
