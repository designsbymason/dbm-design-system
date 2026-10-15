# Form — build and review findings

**Inputs & Forms:** Form — built 2026-10-13, item 7 in the organism build order (`04-component-inventory.md`). **Not yet Finalized:** only the user declares that. Decisions: [ADR-0074](../adr/0074-form-reads-the-dom-for-values-and-the-browsers-rules-and-calls-the-rules-you-write-over-a-value-store-or-a-schema-library.md) (what the form knows, and where a rule comes from) and [ADR-0075](../adr/0075-form-shows-its-own-messages-and-moves-focus-to-the-first-invalid-control-and-announces-the-count-over-the-browsers-bubbles.md) (its own messages, focus, announcement).

**What it is:** the native `<form>` plus the wiring that makes its fields one thing. Compound: `Form`, `Form.Summary` (a danger `Alert` of links to each problem), `Form.Actions` (a wrapping row, a row each on a phone) and `Form.Submit` (a `Button` that follows the form's busy state). `ref` to the `<form>`.

**Props:** `onSubmit(values, formData, event)` (may return a promise), `onSubmitError`, `onInvalidSubmit`, `validate`, `errors`/`onErrorsChange` (the server's answer), `validateOn` (`submit` default, `blur`, `change`), `focusTarget` (`field` default, `summary`, `false`), `disabled`, `size`, `gap`, `noValidate` (default `true`), `labels`/`formatNumber` (ADR-0021), and the native `action`, `method`, `autoComplete`, `name` and `aria-*`.

**Decisions put to the user before building (all taken as recommended):** the validation model and registration (the DOM is the registry, rules are the caller's functions, no value store, no library), additive `name`/`validate` on `FormField` (it stays Finalized: new surface, absent outside a form), `noValidate` on by default, values as a `FormData` record plus the `FormData`, dirty and touched state deferred, all three parts shipped, focus on the field by default.

**Differences from the plan, and why:**
- `onInvalid` is `onInvalidSubmit`: the form's native `onInvalid` is a different event, and a prop that shadows a native name with another meaning is a trap.
- `onSubmit` is `(values, formData, event)`, not `(event, values)`: the values are what a caller wants first, and it follows the decision to hand a record with the `FormData` second.
- A `gap` prop (default 4) was added, so a plain `<Form>` doesn't stack its fields flush; it is the same step scale `FieldGroup` uses.

**Composition checkpoints (06 §9):** compound sub-parts — each has `forwardRef`, JSDoc, pass-through props and a hidden docs-only stories file (ADR-0013); atom reuse — `Button`, `Link`, `Alert`, `VisuallyHidden`, `FormField`, and `FieldGroup`'s context; consumed-atom defects — none found; Radix audit — not applicable; cross-part ARIA wiring — the error reaches the control through `FormField`'s own ids, and the summary links point at the control's id; composed tab order — the form adds no tab stop, the summary is focused by script (`tabindex="-1"`); nested provider — a form inside a `FieldGroup` merges its `disabled` and `size`, and a form portaled inside a form is ignored by the outer one's handlers (tested, and the guard removed to see the test fail).

**Found by running it (fixed):**
- **The summary's links were 4.49:1 on the danger tint** (`text.link` on `bg.danger-subtle`), a hair under AA. They now take the alert's own text colour, and stay underlined, so there is no new pairing to verify.
- **A disabled field drops focus in a browser.** A form that disables its fields while a submit runs left focus on the page, so the keyboard user lost their place. Focus goes back to the control that had it when the promise settles, only if nothing else has it (a real-browser check; the restore was removed once to see it fail).
- **A hidden validity control must never take focus** (`TimePicker`'s visually hidden time input carries its `required`): focus goes through the field's control id, not the invalid element. Checked in a real browser for `TimePicker` and `Select`.
- **The browser's own message is the message** for a rule it enforces, in its words; jsdom has a generic one, so the unit tests assert the field is described by it rather than by wording.

**Tokens:** none new. It reads `space.1`, `space.3`, `space.4`, `space.5`, `radius.sm`, `border-width.2` and `border.focus`, and the gap steps. No contrast pairing of its own: messages are `FieldError`'s and the summary is an `Alert`.

**Tests:** unit tests for submit and values, refusal and focus order, both kinds of rule and their precedence, an invalid control with no field, `formnovalidate`, native submit with no `onSubmit`, the summary, the announcement, `validateOn`, outside errors, busy and rejection, disabled and nested providers, a portaled form, the unmatched-name warning, spread order, caller handlers, `labels`, StrictMode and jest-axe; server-render and hydration checks; a Docs-page token guard (`Form.docs.test.ts`); and hidden real-browser stories for what jsdom can't see (the counts are in the last section).

**Self-verification (real runs):** `tsc` (package and `.storybook`) and `eslint --max-warnings 0` clean; unit 7,865 (70 in Form's folder, with the token guard and the server-render checks); Storybook (Chromium) 1,671/1,671; `build` clean; `Form` 6.81KB JS / 2.70KB CSS gzipped, within the default budget (it holds `Alert`, `Button` and `Link`); the Docs page opened in a running Storybook: every template section, all four Properties tables with a description in every row, nine "Show code" buttons, no console errors.

**Known and accepted:** values are what the browser reports (a single ticked checkbox of a group is a string, a repeated name an array); an invalid control with no `FormField` has no error slot, so its message is in the summary only; dirty/touched tracking is not here (it needs a value snapshot, which pulls the form toward owning state).

## Second round: the page's words, asking rules, a form-level error and a controller (2026-10-14, at the user's request)

A feature-completeness pass named four gaps, all built the same day ([ADR-0076](../adr/0076-form-rules-may-return-promises-and-the-form-is-reached-from-outside-by-a-controller-and-two-hooks-over-synchronous-rules-or-an-imperative-ref.md)):
1. **The browser's rules in the page's words.** `labels` has a message per validity state (`valueMissing`, `typeMismatch(type)`, `patternMismatch`, `tooShort(n)`, `tooLong(n)`, `rangeUnderflow(min)`, `rangeOverflow(max)`, `stepMismatch`, `badInput`), with the numbers through `formatNumber`; a message a control wrote itself is kept.
2. **Rules that ask.** A field's and the form's rule may return a promise: submit waits (the form `aria-busy`, `Form.Submit` loading, nothing disabled, so focus stays), live checks keep the latest answer and drop a stale one, a field is `aria-busy` while one is out, and a rule that throws shows `labels.validationFailed`.
3. **`Form.Error`** and an `error` prop: the slot for a rejected `onSubmit` or a message the server sent about the whole form.
4. **A controller:** `controllerRef`, `useFormController()` and `useFormState()`.

**Found by running it:**
- **The new code was the first the React compiler lint could analyse.** The earlier `Form.tsx` passed lint because the compiler bailed out on it; once it compiled, reading a warn-once ref during render and writing a ref through a context value were reported. The warnings moved to effects, and the summary hands its element up through a callback in the context instead of a ref object.
- **`validate()` from a button outside the form** had to focus the first invalid field after the click: a real-browser check.
- **A stale answer** to an earlier check of a field replaced the newer one until a token per field was added; a test fails if the token is removed.

**Verification (real runs):** `tsc` and `eslint --max-warnings 0` clean; unit tests for Form (94, with the new groups for the page's words, asking rules, `Form.Error` and the controller); Storybook (Chromium) 27 for Form, with a check that a waiting submit keeps focus in the field and one that `validate()` from outside focuses the field.

## Third round: a required-fields legend, a toast recipe, and what is left to the caller (2026-10-14, at the user's request)

- **`requiredLegend`** (a prop, not a part, so the common case is one word): `true` writes the asterisk, drawn as `FieldLabel` draws it and hidden from assistive technology, and `labels.requiredLegend`; content of your own is shown as it is. It is drawn above the fields and only while a `FormField` in the form is required (a field's registration carries `required`), so it never explains a mark that isn't there. Named `requiredLegend`, not `legend`, because `legend` already means a group's name on `FieldGroup`. It adds two tokens to the Docs table (`text.secondary`, `text.danger`) and no new one.
- **"Saved with a toast"** story and snippet: `useToast()` called from `onSubmit` and `onSubmitError`. No coupling in the component (a built-in handoff would have made `Form` import `Toast` and need its provider, with the bundle already near its budget). Found while building it: helper text is `text.tertiary`, which the token spec forbids on `bg.canvas`, and the Toast stage is the canvas, so the demo form sits on a surface.
- **What `Form` leaves to the caller**, written on the Docs page so it is a decision and not a surprise: dirty and touched state and an unsaved-changes guard (the form owns no values), resetting state-driven controls, announcing success, disabling controls outside a `FormField`, a `FieldGroup`'s own error not joining the summary, a single ticked checkbox arriving as a string, and multi-step flows (`Stepper`).

**Verification (real runs):** lint and both typechecks clean; unit 7,909; Storybook Form 29/29; build clean; `Form` 8.50KB JS / 2.73KB CSS gzipped against a 10KB budget; `check-guidelines` 0 warnings.

## Final review before Finalization (2026-10-14)

A full `06-engineering-standards.md` §9 pass over the finished component, three rounds of features on. Findings, all fixed:

1. **A re-sent submit could leave validation switched off.** After waiting on an asynchronous rule the form re-sends itself with a flag that the next `submit` event clears; a browser that refuses the re-send (`noValidate={false}`) fires none, so the person's next real submit went through unchecked. The flag is cleared in a `finally`; a test stubs `requestSubmit` to do nothing and fails if the `finally` is removed.
2. **The summary's focus target was a nameless `div`.** It is a `role="group"` named by its heading, so focus on it is announced as "3 problems with this form, group".
3. **Eight stories had a dead `aria-label` control** (the story set its own after spreading the args). Each has `control: false` for it.
4. **The native-props audit missed `target` and `encType`**, which matter for the no-`onSubmit` native post, and `onChange`, `onBlur` and `onReset` were composed with the form's own but undeclared. All five are redeclared with JSDoc, controls, and Docs rows.
5. **`Form.tsx` was about 1,000 lines.** Split into the root, `formChecks.ts` (the rule runner, pure), `formHelpers.ts`, `FormSummary.tsx`, `FormError.tsx`, `FormActions.tsx`, `FormSubmit.tsx` and `formHooks.ts`; behaviour unchanged, the root is about 600 lines.
6. **A wasted render of the form per field render.** Measured first: 20 renders for 10 keystrokes in a controlled form with an inline `validate`, from the legend's "is anything required" state being set false then true on every re-registration. It is now set only when the answer changes (10 renders for 10 keystrokes).
7. **Test gaps closed:** a disabled outer form reaching an inner form's fields, the server render and hydration of the legend, `Form.Error`, an outside `error`, a `controllerRef` and the native post attributes, the summary's group name, and `target`/`encType` pass-through.
8. **Documentation currency:** this file's test list and "not done" note, and `FormField`'s JSDoc example (it now shows `name` and `validate`).

**Verification (real runs):** `tsc` (package and `.storybook`) and `eslint --max-warnings 0` clean; unit 7,922/7,922 (121 in Form's folder); Storybook (Chromium) 1,681/1,681; `build` clean; `Form` 8.65KB JS / 2.73KB CSS gzipped against the 10KB budget; `check-guidelines` 0 warnings. The Docs page opened in a running Storybook after a server restart: every template section, five Properties tables with a description in every row, 15 "Show code" buttons, and the Controls and Docs prop orders both reading `children, onSubmit, … data-testid` as declared.

**Not run:** the four themes by eye, a visual look at the Docs page and stories (the preview pane was not on screen, so DOM only), a tablet and desktop width pass, `EditableText` inside a form with a draft open, and a screen-reader pass.

