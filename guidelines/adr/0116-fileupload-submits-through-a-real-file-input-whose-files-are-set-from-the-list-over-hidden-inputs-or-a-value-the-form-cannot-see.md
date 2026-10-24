# 0116 — `FileUpload` submits through a real file input whose files are set from the list, over hidden inputs or a value the form cannot see

**Status:** Accepted · **Date:** 2026-10-24

## Context
A `<form>` submits a file only from an `<input type="file">`, and only the files that input holds. `FileUpload` filters
what a person chooses (type, size, count), shows a list the caller can change, and takes files from a drop and a paste
as well as from the browser's own picker. If the visible list and the input disagree, the form submits files the person
removed or refused, or none at all. `required` has the same problem: a hidden input is barred from constraint
validation, so a form would submit an empty required field.
[ADR-0030](./0030-timepicker-holds-its-report-with-commiton-and-validates-through-a-hidden-time-input.md) and
[ADR-0079](./0079-combobox-must-pick-by-default-keeps-the-chosen-value-apart-from-the-typed-text-and-submits-through-a-hidden-validated-input.md)
met the same shape with a value that is text; a file cannot be written as text.

## Decision
- **One visually hidden, real `<input type="file">`** carries `name`, `form`, `accept`, `multiple`, `required` and
  `disabled`. It is not `display: none` and not `type="hidden"`, so it takes part in validation, and it is out of the tab
  order. The trigger opens it.
- **Its `files` are always the list's files.** After any change to the list, and after a choice the component has
  filtered, the input's `files` are rebuilt from the list with a `DataTransfer` and assigned, and the
  input's own selection is cleared when it has been read, so choosing the same file again fires a change. The list is the
  one source of truth; the input follows it.
- **`required` is a real constraint** with a custom message from `labels` while the list is empty. When the browser
  focuses the invalid input, focus is passed to the trigger.
- **Nothing is written when `DataTransfer` cannot be constructed.** The visible field still works; the form then
  submits whatever the browser's own picker last gave it, which a development warning says.

## Alternatives considered
- **An input per file, hidden.** Rejected: a hidden file input cannot be given a `File` programmatically except through
  `DataTransfer`, so it is the same mechanism with more nodes.
- **No input; the caller reads `value` and builds `FormData`.** Rejected: a plain `<form>` and `Form` ([ADR-0074](./0074-form-reads-the-dom-for-values-and-the-browsers-rules-and-calls-the-rules-you-write-over-a-value-store-or-a-schema-library.md))
  read the DOM, and `required` and `FormField`'s errors would not work.
- **Let the browser's picker be the only source, and apply constraints afterwards.** Rejected: dropped and pasted files
  do not come through it.

## Consequences
- `Form` reads a `File` (one) or an array of them (several) from the field with no change of its own.
- The hidden input and its assignment need a real browser to test; jsdom has no `DataTransfer`, so unit tests give the
  component a stand-in and a real-browser check proves a form submission carries the files.
- A caller who wants the field to be a form's value to send over `fetch` reads `value` or the form's data, either works.

## Related
[ADR-0115](./0115-fileupload-collects-files-and-shows-the-progress-it-is-given-and-never-uploads-them-over-owning-the-request.md),
[ADR-0030](./0030-timepicker-holds-its-report-with-commiton-and-validates-through-a-hidden-time-input.md),
[ADR-0079](./0079-combobox-must-pick-by-default-keeps-the-chosen-value-apart-from-the-typed-text-and-submits-through-a-hidden-validated-input.md).
