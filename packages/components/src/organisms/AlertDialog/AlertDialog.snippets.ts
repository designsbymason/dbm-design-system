// The code shown under each story's "Show code" button on AlertDialog's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (the stage that keeps an open alert inside its Docs frame, the `container` it is given), which can't be
// pasted anywhere. Each snippet is the smallest real usage of what its story shows, and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { AlertDialogTone } from "./AlertDialog.types";

const body = (title: string, description: string, cancel: string, action: string) =>
  `    <AlertDialog.Header>
      <AlertDialog.Title>${title}</AlertDialog.Title>
      <AlertDialog.Description>${description}</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>${cancel}</AlertDialog.Cancel>
      <AlertDialog.Action>${action}</AlertDialog.Action>
    </AlertDialog.Footer>`;

const alert = (rootAttributes: string, contentAttributes: string, inner: string, trigger = "Delete project") =>
  `<AlertDialog${rootAttributes ? ` ${rootAttributes}` : ""}>
  <AlertDialog.Trigger asChild>
    <Button variant="destructive">${trigger}</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content${contentAttributes ? ` ${contentAttributes}` : ""}>
${inner}
  </AlertDialog.Content>
</AlertDialog>`;

const deleteBody = body(
  "Delete project?",
  "This removes the project and all of its files for good. It cannot be undone.",
  "Keep it",
  "Delete",
);

export const alertDialogSnippets = {
  tones: `{/* tone: "neutral" (default) | "info" | "warning" | "danger", each with its own icon (icon={false} removes
    it). danger also makes the Action
    destructive. */}
${alert("", 'tone="warning"', body("Discard changes?", "These edits will be lost.", "Keep editing", "Discard"), "Close editor")}`,

  acknowledge: `{/* An alert with one choice: with no Cancel, focus starts on the Action. */}
<AlertDialog>
  <AlertDialog.Trigger asChild>
    <Button>Show error</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content tone="danger">
    <AlertDialog.Header>
      <AlertDialog.Title>Couldn't save</AlertDialog.Title>
      <AlertDialog.Description>The connection dropped. Your changes are still here.</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Action>OK</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog>`,

  withBody: `{/* Content between the header and the footer scrolls on its own. */}
<AlertDialog>
  <AlertDialog.Trigger asChild>
    <Button variant="destructive">Delete 3 files</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content tone="danger">
    <AlertDialog.Header>
      <AlertDialog.Title>Delete 3 files?</AlertDialog.Title>
      <AlertDialog.Description>These files will be removed.</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Body>
      <Text>report.pdf, summary.docx and notes.txt</Text>
    </AlertDialog.Body>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Keep them</AlertDialog.Cancel>
      <AlertDialog.Action>Delete</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog>`,

  busy: `{/* const [busy, setBusy] = useState(false);
    Keep the alert open while the request runs: preventDefault stops the close, busy blocks every way out. */}
<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialog.Content tone="danger" busy={busy}>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete project?</AlertDialog.Title>
      <AlertDialog.Description>It cannot be undone.</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
      <AlertDialog.Action
        isLoading={busy}
        onClick={(event) => {
          event.preventDefault();
          deleteProject();
        }}
      >
        Delete
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog>`,

  reason: `{/* reason: "trigger" | "escape" | "action" | "cancel". */}
<AlertDialog onOpenChange={(open, { reason }) => console.log(open, reason)}>
  <AlertDialog.Trigger asChild>
    <Button>Open alert</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content>
${body("Leave this page?", "You have unsaved changes.", "Stay", "Leave")}
  </AlertDialog.Content>
</AlertDialog>`,

  threeChoices: `{/* Three answers: give each Action a value, which onOpenChange reports as details.value.
    Cancel first and the main choice last: on a phone they stack with the last one on top. */}
<AlertDialog onOpenChange={(open, { reason, value }) => !open && reason === "action" && finish(value)}>
  <AlertDialog.Trigger asChild>
    <Button>Close editor</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content tone="warning">
    <AlertDialog.Header>
      <AlertDialog.Title>Save changes?</AlertDialog.Title>
      <AlertDialog.Description>Your edits will be lost if you don't save them.</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Keep editing</AlertDialog.Cancel>
      <AlertDialog.Action value="discard" variant="tertiary">
        Don't save
      </AlertDialog.Action>
      <AlertDialog.Action value="save" variant="primary">
        Save
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog>`,

  typeToConfirm: `{/* const [typed, setTyped] = useState(""); const nameRef = useRef<HTMLInputElement>(null);
    The Action stays disabled until the name is typed, and focus lands on the field. */}
<AlertDialog>
  <AlertDialog.Trigger asChild>
    <Button variant="destructive">Delete project</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content tone="danger" initialFocus={nameRef}>
    <AlertDialog.Header>
      <AlertDialog.Title>Delete "Atlas"?</AlertDialog.Title>
      <AlertDialog.Description>
        This removes the project and everything in it for good. Type its name to confirm.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Body>
      <Input ref={nameRef} aria-label="Project name" value={typed} onChange={(event) => setTyped(event.target.value)} />
    </AlertDialog.Body>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Keep it</AlertDialog.Cancel>
      <AlertDialog.Action disabled={typed !== "Atlas"}>Delete project</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog>`,

  nudge: `{/* A press on the scrim, or Escape while closeOnEscape is off, gives the panel a short pulse so the alert
    doesn't read as broken. nudge={false} turns it off. */}
${alert("", "closeOnEscape={false}", deleteBody)}`,

  overADialog: `{/* An alert opened from inside a dialog. Escape answers the alert first; lighten its scrim, since
    the two stack. */}
<Dialog>
  <Dialog.Trigger asChild>
    <Button>Open dialog</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Project settings</Dialog.Title>
    </Dialog.Header>
    <Dialog.Footer>
      <AlertDialog>
        <AlertDialog.Trigger asChild>
          <Button variant="destructive">Delete project</Button>
        </AlertDialog.Trigger>
        <AlertDialog.Content tone="danger" scrimOpacity={40}>
${body("Delete project?", "It cannot be undone.", "Keep it", "Delete")}
        </AlertDialog.Content>
      </AlertDialog>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface AlertDialogPlaygroundSnippetArgs {
  tone?: AlertDialogTone;
  size?: "xs" | "sm" | "md" | "lg";
  busy?: boolean;
  closeOnEscape?: boolean;
  nudge?: boolean;
  scrimOpacity?: number;
  scrimBlur?: boolean;
}

/** The Playground's snippet: only the props that differ from their defaults, around a small real alert. */
export function alertDialogPlaygroundSnippet(args: AlertDialogPlaygroundSnippetArgs): string {
  const contentAttributes: string[] = [];
  if (args.tone && args.tone !== "neutral") contentAttributes.push(`tone="${args.tone}"`);
  if (args.size && args.size !== "sm") contentAttributes.push(`size="${args.size}"`);
  if (args.busy) contentAttributes.push("busy");
  if (args.closeOnEscape === false) contentAttributes.push("closeOnEscape={false}");
  if (args.nudge === false) contentAttributes.push("nudge={false}");
  if (args.scrimOpacity !== undefined && args.scrimOpacity !== 60) {
    contentAttributes.push(`scrimOpacity={${args.scrimOpacity}}`);
  }
  if (args.scrimBlur) contentAttributes.push("scrimBlur");
  return alert("", contentAttributes.join(" "), deleteBody);
}
