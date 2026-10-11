// The code shown under each story's "Show code" button on ConfirmDialog's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (the stage that keeps an open dialog inside its Docs frame, the `container` it is given), which can't be
// pasted anywhere. Each snippet is the smallest real usage of what its story shows, and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { ConfirmDialogTone } from "./ConfirmDialog.types";

const dialog = (attributes: string[], children?: string) => {
  const lines = [
    '  trigger={<Button variant="destructive">Delete project</Button>}',
    '  title="Delete project?"',
    '  description="This removes the project and all of its files for good. It cannot be undone."',
    ...attributes.map((attribute) => `  ${attribute}`),
  ];
  return children
    ? `<ConfirmDialog\n${lines.join("\n")}\n>\n${children}\n</ConfirmDialog>`
    : `<ConfirmDialog\n${lines.join("\n")}\n/>`;
};

export const confirmDialogSnippets = {
  basic: `{/* The destructive confirmation: danger makes the confirm button destructive. Focus starts on Cancel. */}
${dialog(['tone="danger"', 'labels={{ confirm: "Delete", cancel: "Keep it" }}', "onConfirm={() => deleteProject()}"])}`,

  tones: `{/* tone: "neutral" (default) | "info" | "warning" | "danger", each with its own icon (icon={false}
    removes it). */}
<ConfirmDialog
  trigger={<Button>Close editor</Button>}
  tone="warning"
  title="Discard changes?"
  description="These edits will be lost."
  labels={{ confirm: "Discard", cancel: "Keep editing" }}
  onConfirm={discard}
/>`,

  waitForARequest: `{/* onConfirm returns a promise: the dialog stays open and busy until it settles, and closes when it
    resolves. A second press, Escape and Cancel do nothing in the meantime. */}
${dialog(['tone="danger"', 'labels={{ confirm: "Delete" }}', "onConfirm={() => api.deleteProject(id)}"])}`,

  failure: `{/* A rejected promise keeps the dialog open and stops it being busy, so the person can try again.
    const [message, setMessage] = useState<string | null>(null);
    Show your own message in children. */}
<ConfirmDialog
  trigger={<Button variant="destructive">Delete project</Button>}
  tone="danger"
  title="Delete project?"
  description="This removes the project and all of its files for good."
  labels={{ confirm: "Delete" }}
  onConfirm={() => api.deleteProject(id)}
  onConfirmError={(error) => setMessage(String(error))}
>
  {message && <Text>{message}</Text>}
</ConfirmDialog>`,

  typeToConfirm: `{/* requireText: the confirm button stays disabled until the name is typed (spaces at either end are
    ignored, case matters). Focus starts on the field, and Enter in it confirms once it matches. */}
${dialog(['tone="danger"', 'requireText="Atlas"', 'labels={{ confirm: "Delete project" }}', "onConfirm={() => deleteProject()}"])}`,

  withABody: `{/* children sit between the description and the buttons and scroll on their own. */}
<ConfirmDialog
  trigger={<Button variant="destructive">Delete 3 files</Button>}
  tone="danger"
  title="Delete 3 files?"
  description="These files will be removed."
  labels={{ confirm: "Delete", cancel: "Keep them" }}
  onConfirm={deleteFiles}
>
  <Text>report.pdf, summary.docx and notes.txt</Text>
</ConfirmDialog>`,

  controlled: `{/* const [open, setOpen] = useState(false);
    No trigger: open it from your own state. With a promise from onConfirm, onOpenChange(false, { reason: "action" })
    is called once it resolves, and you close it. */}
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  tone="warning"
  title="Leave this page?"
  description="You have unsaved changes."
  labels={{ confirm: "Leave", cancel: "Stay" }}
  onConfirm={leave}
/>`,

  reason: `{/* reason: "trigger" | "escape" | "action" | "cancel". onCancel runs for a cancel or Escape. */}
<ConfirmDialog
  trigger={<Button>Open</Button>}
  title="Leave this page?"
  description="You have unsaved changes."
  onOpenChange={(open, { reason }) => console.log(open, reason)}
  onCancel={() => track("stayed")}
  onConfirm={leave}
/>`,

  overADialog: `{/* A confirmation opened from inside a dialog. Escape answers the confirmation first; lighten its scrim,
    since the two stack. */}
<Dialog>
  <Dialog.Trigger asChild>
    <Button>Open dialog</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Project settings</Dialog.Title>
    </Dialog.Header>
    <Dialog.Footer>
      <ConfirmDialog
        trigger={<Button variant="destructive">Delete project</Button>}
        tone="danger"
        scrimOpacity={40}
        title="Delete project?"
        description="It cannot be undone."
        labels={{ confirm: "Delete", cancel: "Keep it" }}
        onConfirm={deleteProject}
      />
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ConfirmDialogPlaygroundSnippetArgs {
  title?: string;
  description?: string;
  tone?: ConfirmDialogTone;
  size?: "xs" | "sm" | "md" | "lg";
  confirmLabel?: string;
  cancelLabel?: string;
  requireText?: string;
  busy?: boolean;
  closeOnEscape?: boolean;
  nudge?: boolean;
  scrimOpacity?: number;
  scrimBlur?: boolean;
}

/** The Playground's snippet: only the props that differ from their defaults, around a small real confirmation. */
export function confirmDialogPlaygroundSnippet(args: ConfirmDialogPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  attributes.push('trigger={<Button variant="destructive">Delete project</Button>}');
  attributes.push(`title=${quote(args.title || "Delete project?")}`);
  if (args.description) attributes.push(`description=${quote(args.description)}`);
  if (args.tone && args.tone !== "neutral") attributes.push(`tone="${args.tone}"`);
  if (args.size && args.size !== "sm") attributes.push(`size="${args.size}"`);
  const labels: string[] = [];
  if (args.confirmLabel) labels.push(`confirm: ${JSON.stringify(args.confirmLabel)}`);
  if (args.cancelLabel) labels.push(`cancel: ${JSON.stringify(args.cancelLabel)}`);
  if (labels.length > 0) attributes.push(`labels={{ ${labels.join(", ")} }}`);
  if (args.requireText) attributes.push(`requireText=${quote(args.requireText)}`);
  if (args.busy) attributes.push("busy");
  if (args.closeOnEscape === false) attributes.push("closeOnEscape={false}");
  if (args.nudge === false) attributes.push("nudge={false}");
  if (args.scrimOpacity !== undefined && args.scrimOpacity !== 60) {
    attributes.push(`scrimOpacity={${args.scrimOpacity}}`);
  }
  if (args.scrimBlur) attributes.push("scrimBlur");
  attributes.push("onConfirm={() => deleteProject()}");
  return `<ConfirmDialog\n${attributes.map((attribute) => `  ${attribute}`).join("\n")}\n/>`;
}
