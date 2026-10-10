// The code shown under each story's "Show code" button on Dialog's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus
// demo-only wiring (the stage that keeps an open dialog inside its Docs frame, the `container` it is given),
// which can't be pasted anywhere. Each snippet here is the smallest real usage of what its story shows — only
// exports of the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { DialogPlacement, DialogSize } from "./Dialog.types";

const footer = `    <Dialog.Footer>
      <Dialog.Close asChild>
        <Button variant="secondary">Cancel</Button>
      </Dialog.Close>
      <Button>Save changes</Button>
    </Dialog.Footer>`;

const header = `    <Dialog.Header>
      <Dialog.Title>Edit profile</Dialog.Title>
      <Dialog.Description>Changes are saved to your account.</Dialog.Description>
    </Dialog.Header>`;

const body = `    <Dialog.Body>
      <FieldLabel htmlFor="display-name">Display name</FieldLabel>
      <Input id="display-name" placeholder="Jane Doe" />
    </Dialog.Body>`;

const dialog = (rootAttributes: string, contentAttributes: string, inner: string) =>
  `<Dialog${rootAttributes ? ` ${rootAttributes}` : ""}>
  <Dialog.Trigger asChild>
    <Button>Open dialog</Button>
  </Dialog.Trigger>
  <Dialog.Content${contentAttributes ? ` ${contentAttributes}` : ""}>
${inner}
  </Dialog.Content>
</Dialog>`;

const full = [header, body, footer].join("\n");

export const dialogSnippets = {
  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — the panel's maximum width. On a viewport
    narrower than the step, the panel fills the width less a gutter. */}
${dialog("", 'size="lg"', full)}`,

  fullScreen: `{/* fullScreen takes a mobile-first map, like Stack and Grid: full screen on a phone,
    a centred panel from md up. */}
${dialog("", "fullScreen={{ base: true, md: false }}", full)}`,

  longContent: `{/* Dialog.Body scrolls while the header and footer stay put; divided draws a line
    between the three so a scrolling body reads as running under them. */}
${dialog(
  "",
  "divided",
  `${header}
    <Dialog.Body>
      <Text>Long content goes here…</Text>
    </Dialog.Body>
${footer}`,
)}`,

  nonModal: `{/* modal={false}: no scrim, no scroll lock; the page behind stays usable. */}
${dialog("modal={false}", "", full)}`,

  unsavedChanges: `{/* A form with unsaved changes: a stray click or Escape doesn't throw the work away,
    so the only ways out are the footer's own buttons. */}
${dialog("", "closeOnOutsideClick={false} closeOnEscape={false} showCloseButton={false}", full)}`,

  controlled: `{/* const [open, setOpen] = useState(false); */}
<Dialog open={open} onOpenChange={setOpen}>
  <Dialog.Content aria-label="Saved">
    <Dialog.Body>
      <Text>Your changes were saved.</Text>
    </Dialog.Body>
    <Dialog.Footer>
      <Button onClick={() => setOpen(false)}>Done</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>`,

  hiddenTitle: `{/* No visible heading in the design: keep the Title (it names the dialog for screen
    readers) and hide it visually. */}
<Dialog>
  <Dialog.Trigger asChild>
    <Button>Open dialog</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <VisuallyHidden asChild>
      <Dialog.Title>Image preview</Dialog.Title>
    </VisuallyHidden>
    <Dialog.Body>
      <Text>Content</Text>
    </Dialog.Body>
  </Dialog.Content>
</Dialog>`,

  placementTop: `{/* placement: "center" (default) | "top" — a set distance below the top edge, so a panel
    whose height changes doesn't jump. */}
${dialog("", 'placement="top"', full)}`,

  busy: `{/* const [busy, setBusy] = useState(false); */}
{/* While busy, Escape, the scrim, the close button and Dialog.Close all do nothing. */}
<Dialog open={open} onOpenChange={setOpen}>
  <Dialog.Content busy={busy} size="sm">
    <Dialog.Header>
      <Dialog.Title>Save changes</Dialog.Title>
    </Dialog.Header>
    <Dialog.Footer>
      <Dialog.Close asChild>
        <Button variant="secondary">Cancel</Button>
      </Dialog.Close>
      <Button isLoading={busy} onClick={save}>
        Save
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>`,

  keepMounted: `{/* keepMounted: what was typed is still there when the dialog reopens. It is rendered the first
    time it opens, then kept while closed. */}
${dialog("", "keepMounted", full)}`,

  dividedAuto: `{/* divided="auto": a line under the header once the body has scrolled, and over the footer
    while more is below. A dialog that fits gets none, and nothing moves when one appears. */}
${dialog(
  "",
  'divided="auto"',
  `${header}
    <Dialog.Body>
      <Text>Long content goes here…</Text>
    </Dialog.Body>
${footer}`,
)}`,

  closeReason: `{/* reason: "trigger" | "escape" | "outside" | "close-button" | "close". A form with unsaved
    changes can ask for confirmation on "outside" and not on its own Cancel. */}
<Dialog onOpenChange={(open, { reason }) => console.log(open, reason)}>
  <Dialog.Trigger asChild>
    <Button>Open dialog</Button>
  </Dialog.Trigger>
  <Dialog.Content size="sm">
    <Dialog.Header>
      <Dialog.Title>How will you leave?</Dialog.Title>
    </Dialog.Header>
    <Dialog.Footer>
      <Dialog.Close asChild>
        <Button>Done</Button>
      </Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>`,

  initialFocus: `{/* const emailRef = useRef<HTMLInputElement>(null); */}
<Dialog>
  <Dialog.Trigger asChild>
    <Button>Open dialog</Button>
  </Dialog.Trigger>
  <Dialog.Content initialFocus={emailRef} size="sm">
    <Dialog.Header>
      <Dialog.Title>Add a recipient</Dialog.Title>
    </Dialog.Header>
    <Dialog.Body>
      <Input aria-label="Name" placeholder="Name" />
      <Input ref={emailRef} aria-label="Email" placeholder="Email" />
    </Dialog.Body>
  </Dialog.Content>
</Dialog>`,

  scrim: `{/* scrimOpacity: from the opacity scale (default 60); scrimBlur also blurs the page behind. */}
${dialog("", "scrimOpacity={80} scrimBlur", full)}`,

  nested: `{/* A confirmation opened from inside a dialog. Escape closes the inner one first. */}
<Dialog>
  <Dialog.Trigger asChild>
    <Button>Open dialog</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Delete project</Dialog.Title>
    </Dialog.Header>
    <Dialog.Footer>
      <Dialog>
        <Dialog.Trigger asChild>
          <Button variant="destructive">Delete</Button>
        </Dialog.Trigger>
        <Dialog.Content size="sm">
          <Dialog.Header>
            <Dialog.Title>Are you sure?</Dialog.Title>
          </Dialog.Header>
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="secondary">Keep it</Button>
            </Dialog.Close>
            <Button variant="destructive">Delete</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface DialogPlaygroundSnippetArgs {
  modal?: boolean;
  size?: DialogSize;
  fullScreen?: boolean;
  /** `false`, `true` or `"auto"`, or the Playground control's option key (`"off"`, `"on"`, `"auto"`). */
  divided?: boolean | "auto" | "off" | "on";
  placement?: DialogPlacement;
  busy?: boolean;
  keepMounted?: boolean;
  scrimOpacity?: number;
  scrimBlur?: boolean;
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults,
 * around a small real dialog.
 */
export function dialogPlaygroundSnippet(args: DialogPlaygroundSnippetArgs): string {
  const rootAttributes: string[] = [];
  // `modal` defaults to true, so it only needs writing when it's off.
  if (args.modal === false) rootAttributes.push("modal={false}");

  const contentAttributes: string[] = [];
  if (args.size && args.size !== "md") contentAttributes.push(`size="${args.size}"`);
  if (args.fullScreen) contentAttributes.push("fullScreen");
  // The Playground's select hands over its option key, not the mapped value.
  if (args.divided === true || args.divided === "on") contentAttributes.push("divided");
  if (args.divided === "auto") contentAttributes.push('divided="auto"');
  if (args.placement && args.placement !== "center") contentAttributes.push(`placement="${args.placement}"`);
  if (args.busy) contentAttributes.push("busy");
  if (args.keepMounted) contentAttributes.push("keepMounted");
  if (args.scrimOpacity !== undefined && args.scrimOpacity !== 60) contentAttributes.push(`scrimOpacity={${args.scrimOpacity}}`);
  if (args.scrimBlur) contentAttributes.push("scrimBlur");
  if (args.showCloseButton === false) contentAttributes.push("showCloseButton={false}");
  if (args.closeOnOutsideClick === false) contentAttributes.push("closeOnOutsideClick={false}");
  if (args.closeOnEscape === false) contentAttributes.push("closeOnEscape={false}");

  return dialog(rootAttributes.join(" "), contentAttributes.join(" "), full);
}
