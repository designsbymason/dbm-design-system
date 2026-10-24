# 0115 — `FileUpload` collects files and shows the progress it is given, and never uploads them, over owning the request

**Status:** Accepted · **Date:** 2026-10-24

## Context
A file field has two jobs that look like one: letting a person choose files (drag, browse, paste), and sending them
somewhere. The second depends on the app: an endpoint, credentials, chunking, a presigned URL, a retry policy, a queue.
A component that owns the request has to guess all of that, grows a prop for each guess, and pulls network code into a
package that is otherwise presentation and interaction. The list of chosen files also has to show a state per file
(waiting, sending, sent, failed) that only whoever sends them knows.

## Decision
- **`FileUpload` never makes a request.** It holds a list of items, `{ id, file, status, progress, error }`, shows each
  one, and reports what the person wants (add, remove, retry). The caller sends the files and writes `status` and
  `progress` back into the list it passes as `value`.
- **The list is `value` / `defaultValue` / `onValueChange`** like every controlled component, and a gesture asks rather
  than applies ([ADR-0039](./0039-a-handle-only-asks-a-controlled-pane-to-collapse.md)): choosing a file calls
  `onValueChange` with the list it wants, and a controlled list stays as it is until the prop changes. Uncontrolled, it
  keeps the files in `idle` state, which is a field that submits with its form.
- **It is a compound component** (`FileUpload.Dropzone`, `.Trigger`, `.Rejections`, `.List`, `.Item`) with a zero-prop
  default that draws a dropzone, its messages and the list, and a `layout="button"` that draws a button instead.
- **Constraints are checked by the component, and a refused file never enters the list.** `accept`, `maxSize`,
  `minSize`, `maxFiles`, and an optional `validate` (which may return a promise) are applied to files from every source,
  because a dropped or pasted file ignores the browser's `accept`. Each refused file is reported with the reasons
  (`onFilesRejected`) and shown beside the field, in words, with the file's name.
- **A single field replaces.** With `multiple={false}` a new file replaces the current one rather than being refused as
  one too many.
- **Nothing the component does needs a dependency.** Native drag events and a real file input are the whole mechanism.

## Alternatives considered
- **An `uploadUrl` / `onUpload(file, { onProgress })` prop that makes the request.** Rejected: the network is the app's,
  and the props needed to cover real endpoints (headers, method, field name, chunking, retries, cancellation) would be
  larger than the component.
- **Hold status inside the component and let the caller call methods on a ref.** Rejected: two sources of truth for the
  same list, against the controlled pattern every other component follows.
- **Refuse rejected files silently, or put the messages in a `Toast`.** Rejected: a refusal belongs to the field it
  came from, in text next to it that a screen reader reads with the field; a toast leaves the page.

## Consequences
- A caller that wants an uploader writes a small loop around `onFilesAdded` and `onValueChange`; the Docs page shows it.
- Status and progress are only as true as what the caller writes; the component never fakes either.
- A recipe for an uploader stays a recipe, so the package keeps no network code and no backend assumptions.

## Related
[ADR-0043](./0043-reordering-is-a-hand-rolled-sortable-hook-in-primitives-for-a-single-list-over-a-drag-and-drop-dependency.md)
(file drops are a separate native problem), [ADR-0116](./0116-fileupload-submits-through-a-real-file-input-whose-files-are-set-from-the-list-over-hidden-inputs-or-a-value-the-form-cannot-see.md),
[ADR-0021](./0021-labels-object-and-optional-formatnumber-over-an-implicit-intl-default.md).
