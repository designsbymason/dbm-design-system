// The code shown under each story's "Show code" button on FileUpload's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// helpers (a simulated uploader, sample files), which can't be pasted anywhere. Each snippet is the smallest real usage
// of what its story shows, and `storySnippets.test.ts` checks that stays true. State and handlers are named in a
// comment, since a snippet is JSX only. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { FileUploadLayout, FileUploadSize } from "./FileUpload.types";

const stateNote = "{/* You own the files: const [files, setFiles] = useState<FileUploadEntry[]>([]); */}";

export const fileUploadSnippets = {
  sizes: `${stateNote}
{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<FileUpload aria-label="Attachments" size="lg" value={files} onValueChange={setFiles} />`,

  layouts: `{/* layout: "dropzone" (default) draws a dashed drop area; "button" draws only a button. */}
<FileUpload aria-label="Photos" layout="button" accept="image/*" value={files} onValueChange={setFiles} />`,

  states: `{/* Write each entry's status and progress yourself as the file is sent:
    status: "idle" | "uploading" | "done" | "error", progress: 0–100 (leave it out if you can't measure it).
    A failed entry shows its \`error\` text, and a retry button when you pass \`onRetry\`. */}
<FileUpload
  aria-label="Attachments"
  value={files}
  onValueChange={setFiles}
  onRetry={(entry) => retry(entry)}
/>`,

  constraints: `{/* accept, maxSize (bytes), minSize, maxFiles and your own validate rule are applied to every file,
    including dropped and pasted ones. A refused file is explained under the field and never enters the list. */}
<FileUpload
  aria-label="Attachments"
  accept="image/*,.pdf"
  maxSize={5 * 1024 * 1024}
  maxFiles={3}
  validate={(file) => (file.name.includes(" ") ? "Remove the spaces from the name" : undefined)}
  value={files}
  onValueChange={setFiles}
/>`,

  singleFile: `{/* With multiple={false} a new file replaces the one already chosen. */}
<FileUpload aria-label="Résumé" multiple={false} accept=".pdf" value={files} onValueChange={setFiles} />`,

  formField: `{/* Inside a form, the field submits real files under its name, and required is a real constraint. */}
<Form onSubmit={handleSubmit}>
  <FormField label="Supporting documents" name="documents" required helperText="PDF files only">
    {(fieldProps) => <FileUpload {...fieldProps} accept=".pdf" />}
  </FormField>
  <Form.Submit>Send</Form.Submit>
</Form>`,

  disabled: `<FileUpload aria-label="Attachments" disabled />`,

  readOnly: `{/* Shows the files and nothing to change them with. */}
<FileUpload aria-label="Attachments" readOnly value={files} />`,

  uploading: `{/* FileUpload sends nothing. Start every entry whose status is "idle" (in an effect, say) and write its
    progress back into the list: status "uploading" with progress 0–100, then "done", or "error" with an \`error\`
    message. A failed entry gets a retry button when you pass onRetry. */}
<FileUpload
  aria-label="Attachments"
  value={files}
  onValueChange={setFiles}
  onRetry={(entry) => send(entry)}
/>`,

  customList: `{/* Draw each entry yourself, usually a FileUpload.Item with something added. */}
<FileUpload aria-label="Attachments" value={files} onValueChange={setFiles}>
  <FileUpload.Dropzone />
  <FileUpload.Rejections />
  <FileUpload.List>
    {(entry) => <FileUpload.Item key={entry.id} entry={entry} />}
  </FileUpload.List>
</FileUpload>`,
};

interface PlaygroundArgs {
  size?: FileUploadSize;
  layout?: FileUploadLayout;
  multiple?: boolean;
  accept?: string;
  maxSizeMb?: number;
  maxFiles?: number;
  required?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  guardPage?: boolean;
}

/** The Playground's snippet, built from the live controls: only what differs from the defaults. */
export function fileUploadPlaygroundSnippet(args: PlaygroundArgs): string {
  const attributes = ['aria-label="Attachments"'];
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.layout && args.layout !== "dropzone") attributes.push(`layout="${args.layout}"`);
  if (args.multiple === false) attributes.push("multiple={false}");
  if (args.accept?.trim()) attributes.push(`accept=${quote(args.accept.trim())}`);
  if (typeof args.maxSizeMb === "number" && args.maxSizeMb > 0) attributes.push(`maxSize={${args.maxSizeMb} * 1024 * 1024}`);
  if (args.multiple !== false && typeof args.maxFiles === "number" && args.maxFiles > 0) attributes.push(`maxFiles={${args.maxFiles}}`);
  if (args.required) attributes.push("required");
  if (args.hasError) attributes.push("hasError");
  if (args.disabled) attributes.push("disabled");
  if (args.readOnly) attributes.push("readOnly");
  if (args.guardPage) attributes.push("guardPage");
  attributes.push("value={files}", "onValueChange={setFiles}");
  return `${stateNote}\n<FileUpload\n${attributes.map((attribute) => `  ${attribute}`).join("\n")}\n/>`;
}
