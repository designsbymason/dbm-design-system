# EditableText — build and review findings

**Inputs & Forms:** EditableText — built 2026-10-10, the last of the ⚪ molecules but `TagsInput` (`04-component-inventory.md`). **Not Finalized**: the §9 review pass below is the build-time pass; the user declares Finalized. Decision: [ADR-0048](../adr/0048-editabletext-swaps-a-button-for-a-field-and-reports-only-what-is-committed-over-a-live-field-or-a-controlled-value-per-keystroke.md).

**What it is:** a value shown as text (a native `<button>`) that swaps for an `Input`, or a `Textarea` with `multiline`, while editing. Flat props, `ref` to the outer box; `className`/`style` on the outer box in both modes; `id`, `aria-*`, `data-testid` on whichever of the button and the field is showing. `value`/`defaultValue`/`onValueChange` (a commit, once), `editing`/`defaultEditing`/`onEditingChange`, `size`, `placeholder`, `multiline` (`minRows`/`maxRows`), `blurBehavior` (`commit` default), `activation` (`click`/`doubleClick`), `showControls`, `showEditIcon`, `selectOnFocus`, `inheritFont`, `required`, `validate`, `hasError`/`disabled`/`readOnly`, `maxLength`/`minLength`/`inputMode`/`autoComplete`, `name`/`form` (a hidden input with the committed value), `labels`, `onFocus`/`onBlur` (once, as one field).

**Composition checkpoints (06 §9):** compound sub-parts — not applicable (flat); atom reuse — `Input`, `Textarea`, `IconButton` (confirm, cancel), `Icon`, `FieldError`, `VisuallyHidden`; consumed-atom defects — **one found, `Textarea`'s inner padding, see below**; Radix audit — not applicable (no Radix); cross-part ARIA wiring — a `FormField`'s `id`/`aria-labelledby`/`aria-describedby` land on the showing element (tested; a click on the label starts editing); composed tab order — text → field → confirm → cancel, one tab stop at rest (tested forwards); no context provided.

**Feature round (2026-10-10, from the gap list, at explicit direction):** four additions, all additive to an un-Finalized component.
- **`isLoading` and `labels.saving`:** the open field is set `readOnly` with `aria-busy` (it keeps focus and its text), a `Spinner` follows it (and replaces the pencil once it has closed), Enter, Escape, the buttons and leaving it do nothing, and a status region that is in the page before it has anything to say announces "Saving" (`PinInput`'s pattern). A first appearance isn't announced.
- **`onDraftChange`, `showCount`, `formatNumber`:** the draft as it changes (not on open, not on cancel), and `Input`'s and `Textarea`'s own counter passed through.
- **`renderValue`:** the resting text (and `readOnly`) is drawn from the value; not called for an empty value; a throw falls back to the raw text with a development warning. The button's name is built from what it renders.
- **F2 and `actionRef`:** F2 on the text starts editing; `actionRef` hands `{ edit, commit, cancel }` for a menu item or shortcut (no-ops when nothing is being edited). "Commit and move to the next cell" needed nothing new: Tab already commits under the default `blurBehavior` and moves on.
- **Tests added:** 17 unit tests (saving, draft, counter, formatted value, F2, actions) and one hidden real-browser story (the spinner changes neither height nor overflows beside a long value).

**Second feature round (2026-10-10, at explicit direction):**
- **`validateOn: "commit" | "change"` (default `commit`):** with `change`, `required` and `validate` also judge the draft as it is typed: the message shows while it is invalid and goes as soon as it is not, nothing shows when the field merely opens, and a commit is still refused while a message shows. The alert is announced when its text changes, not per keystroke. Recorded here rather than as an ADR: it is a timing option on a rule that already existed, with the old behaviour as the default.
- **`enterKeyHint`, `spellCheck`, `autoCapitalize`:** the native-props audit's remaining phone-keyboard attributes, passed to the field. `enterKeyHint` defaults to `"done"` for a single-line value (where Enter commits) and is left to the browser for `multiline` (where Enter adds a line). Playground controls are off (nothing visible on a desktop).
- **Tests added:** 6 unit tests; no new real-browser story (nothing here is layout).

**Deviations from the approved plan, all small:**
- A single-line value is drawn on one line with an ellipsis (the plan said it would wrap), so the text and the one-line field are always the same height whatever the value's length; `multiline` wraps.
- A `readOnly` value is plain text with no `aria-*` (a bare `div` can't carry `aria-label`), and `hasError` on the resting button is visual only (a `button` can't carry `aria-invalid`); the field carries `aria-invalid` while editing.
- The button's name is composed through `aria-labelledby` (a hidden copy of `aria-label`, then the value), so the field's name and the visible text are both in it.
- `maxLength`, `minLength`, `inputMode`, `autoComplete`, `minRows` and `maxRows` have no Playground control (their effect shows only while editing, or needs a form).

**Consumed-atom defect found and fixed (2026-10-10, authorized by the user):** `Textarea`'s inner `<textarea>` kept the browser's own default padding (2px on every side, no token), so a one-row `Textarea` was 4px taller than its padding tokens say and its text sat 2px further in. `EditableText multiline` would have changed height by 4px, and its text moved 2px, when it opened. Fixed in the atom (`padding: 0` on `.textarea`), recorded in [Textarea.md](Textarea.md); the molecule carries no workaround. The hidden story *At every size a multi-line text is exactly as tall as the textarea it becomes* guards it.

**Known limits:**
- A surrounding overlay that listens for Escape at the document level (Radix dialogs do, in the capture phase) sees the key before the field does, so Escape can close it with an edit open. The field stops the key for handlers on its ancestors; closing the overlay is the owner's call (the Docs page says so).
- `required` refuses an empty commit but not a never-edited empty value submitted through `name`, because a hidden input can't take part in constraint validation.
- Blur is judged by `relatedTarget` containment and, when that is null, by where focus is a microtask later (so the button-for-field swap and another window taking focus aren't a leave). A press on the confirm or cancel button is kept from blurring the field with `mousedown` `preventDefault`, since Safari doesn't focus a pressed button. Not run in Safari or on a device.
- A single-line field truncates visually with an ellipsis, so a long value is only fully readable by opening it or using `multiline`.

**Contrast and visibility (no new pairing):** the value is `text.primary` on the page surface, the placeholder `text.tertiary` (`Input`'s own placeholder pairing, shown here as real text), the hover fill `bg.neutral-subtle` (the fill `Input`'s in-field buttons already use under `text.primary` and `icon.default`), the focus ring `border.focus`. A disabled value is dimmed like `Input`. Seen in light and in dark with the emerald brand.

**Contrast, the one pairing the resting text adds:** the placeholder (`text.tertiary`) on the hover fill (`bg.neutral-subtle`), measured in `03-token-system-spec.md` at 4.51:1 in light (razor-thin, clears AA) and 5.86:1 in dark. `text.primary` on that fill is 13.53:1 / 9.66:1. The pencil is `icon.default` (`text.tertiary`'s step), on the same fill.

**Atom reuse:** the resting text is a native `<button>` of its own rather than the `Button` atom, because it is a different thing: no fill or border at rest, text-sized padding that must equal an `Input`'s, and a hover fill only. `Input`, `Textarea`, `IconButton`, `Icon`, `Spinner`, `FieldError` and `VisuallyHidden` are reused as they are.

**Right-to-left:** layout is logical properties only and the pencil sits at the inline end; the pencil is not mirrored (ADR-0009's per-component call): a pencil is a drawn object, not a direction.

**Tokens:** none new. The text's padding is `Input`'s own formula (its padding less the one-pixel border both have), so a single-line value is exactly as tall as an `Input` of the same size (checked at all five sizes in Chromium).

**Tests:** 77 unit tests (display and placeholder name, read-only/disabled, hidden `name` input, non-string value, open/focus/selection, `selectOnFocus`, Enter commit once and focus back, no per-key report, Escape cancel, reopen from the committed value, unchanged commit, Enter and Space from the keyboard, IME Enter, Escape not reaching an ancestor, Tab and press-elsewhere commit, cancel on blur, one focus and one blur, double-click activation, controls shown/commit/cancel/not blurring, tab order, `required`/`validate` refusal and message wiring, a throwing `validate`, a refused blur, `hasError`, multiline Enter and Ctrl+Enter, controlled value, `value` and `editing` wired to state, `editing` asks, `editing` set from outside, no focus on mount, ref/className/id/testid placement, `FormField` wiring, `aria-describedby` joined, `labels` with `undefined`, missing-name warning, server render, StrictMode, jest-axe in five states), a Docs-page token guard (`EditableText.docs.test.ts`), and 17 hidden real-browser stories (same height as `Input` at five sizes, a slow save not pulling focus back, the ring inside a table at five sizes, an open required field not blocking a form, same width and no neighbour shift, long value on one line, focus and selection and return, a control press not read as a blur, text inserted at once, 24px targets at five sizes, right-to-left, forced colours, a rule for the no-hover pencil, a phone width, and the multi-line height check).

**Self-verification (real runs, 2026-10-10):** `pnpm lint` (eslint plus both typechecks) clean; unit project 6,716/6,716; Storybook (Chromium) project 1,290/1,290; `pnpm build` clean; `EditableText` 4.93KB JS / 2.33KB CSS gzipped, within the 10KB budget; `pnpm check-guidelines` clean apart from this file being new; the Docs page opened in a running Storybook (all template sections, 14 canvases, 38 Properties rows with a description each, no error display); the All sizes story hovered, the confirm/cancel story opened, and the Multiline story in dark mode with the emerald brand.

**Not done:** the Docs page's "Show code" panels were typechecked against the real components (a planted bad prop failed, the rest passed) but not each opened by eye on the live page.

## Final review before Finalization (2026-10-10)

A full §9 pass over the finished component (reads, the live checks the repo can run, and the Storybook preview). Findings, all fixed:

1. **Focus was pulled back to the text after an async save, even if the person had moved on.** Enter sets the return-focus flag; with `editing` kept open for the save, the flag was still set when the owner finally closed the field. The return now happens only when focus is still inside the component or nowhere (`body`). Reproduced live in the `Saving` story first; a unit test, and two hidden real-browser stories (moved on: focus stays; stayed: focus returns), guard it.
2. **A dead control in the Playground:** `showCount` did nothing without `maxLength`, which had no control. `maxLength` is now a number control (60), and `showCount` is hidden until it is set (`if`).
3. **The Docs page said the open field ends in an ellipsis.** Only the resting text does; the field scrolls its text. Reworded.
4. **Prop order** in the types file now follows the Docs page's `propOrder` and the stories' `argTypes` (content, look, behaviour and state, advanced and escape hatches).
5. **The focus ring is drawn inside the box** (negative offset, 05 §6): this text lives in table cells, whose scroll frame clipped the outside ring at the smallest table size (measured: 23px of 23.5px needed). A hidden story measures the ring against the frame at all five table sizes.
6. **`touch-action: manipulation` for `activation="doubleClick"`**, so a double tap raises `dblclick` instead of zooming; the Docs page names F2 and `actionRef` as fallbacks. Not confirmed on a device.
7. **A read-only value passes `aria-describedby`** (a `FormField`'s helper text is no longer dropped).
8. **The spread-order test now probes:** a same-named `data-editing` can't win, and `className` and `style` merge, in both modes.
9. **The open field is detached from the surrounding form** (a `form` id that matches nothing): reproduced first, an open, emptied `required` field blocked the surrounding form's submit with the browser's own message although the committed value was fine. The form submits the committed value through the hidden input; `required`, `minLength` and `validate` are the component's own, applied as the edit ends. A hidden story submits the form with the field open and empty.
10. **This file:** the contrast figure, the atom-reuse reason and the right-to-left judgment above.

**Verified live in the preview:** the Docs page (all template sections, 19 canvases, 48 Properties rows each described, no error display, every "Show code" a hand-written snippet), and the open field in all four themes (purple light and dark, emerald light and dark).

**Self-verification (real runs):** `pnpm lint` clean; unit project 6,721/6,721; Storybook (Chromium) project 1,294/1,294; `pnpm check-guidelines` clean.

**Still not run:** Safari and a real phone (the pressed-button focus handling, `relatedTarget`, `enterKeyHint`, double-tap, the no-hover pencil), and a walk through the whole breakpoint scale (only the phone-width story).
