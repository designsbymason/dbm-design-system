// The code shown under each story's "Show code" button on Drawer's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// wiring (the stage that keeps an open drawer inside its Docs frame, the `container` it is given), which can't be
// pasted anywhere. Each snippet is the smallest real usage of what its story shows, and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { DrawerSide, DrawerSize } from "./Drawer.types";

const sections = `    <Drawer.Header>
      <Drawer.Title>Filters</Drawer.Title>
      <Drawer.Description>Narrow the list of results.</Drawer.Description>
    </Drawer.Header>`;

const footer = `    <Drawer.Footer>
      <Drawer.Close asChild>
        <Button variant="secondary">Cancel</Button>
      </Drawer.Close>
      <Button>Apply</Button>
    </Drawer.Footer>`;

const body = `    <Drawer.Body>
      <Checkbox>In stock</Checkbox>
    </Drawer.Body>`;

const drawer = (rootAttributes: string, contentAttributes: string, inner: string, trigger = "Filters") =>
  `<Drawer${rootAttributes ? ` ${rootAttributes}` : ""}>
  <Drawer.Trigger asChild>
    <Button>${trigger}</Button>
  </Drawer.Trigger>
  <Drawer.Content${contentAttributes ? ` ${contentAttributes}` : ""}>
${inner}
  </Drawer.Content>
</Drawer>`;

const full = `${sections}
${body}
${footer}`;

export const drawerSnippets = {
  sides: `{/* side: "end" (default) | "start" | "top" | "bottom". start and end are logical: the left and right edges
    in left-to-right text, swapped in right-to-left. */}
${drawer("", 'side="start"', full, "Menu")}`,

  responsive: `{/* A mobile-first map, like Stack and Grid: a sheet from the bottom on a phone, a side panel from md. */}
${drawer("", 'side={{ base: "bottom", md: "end" }}', full)}`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl". The panel's width for start and end, and the most
    height it takes for top and bottom. */}
${drawer("", 'size="lg"', full)}`,

  customSize: `{/* size takes a step, or a CSS length / a number of pixels for a size the scale doesn't have. */}
${drawer("", 'size="min(90vw, 40rem)"', full)}`,

  swipe: `{/* swipeToDismiss (on by default): a touch or a pen drags the handle or the header toward the edge; a short
    drag settles back, a long or quick one closes with the reason "swipe". showHandle draws the grab handle
    on a top or bottom drawer. */}
${drawer("onOpenChange={(open, { reason }) => console.log(open, reason)}", 'side="bottom" swipeToDismiss showHandle', full)}`,

  complete: `{/* onOpenChangeComplete: true once it has finished opening, false once it has finished closing and is
    gone. onOpenChange says a change started; this says it is over. */}
${drawer("onOpenChangeComplete={(open) => !open && resetFilters()}", "", full)}`,

  longContent: `{/* Drawer.Body scrolls while the header and footer stay put. divided is "auto" by default: a line
    shows only while there is content scrolled out of view on that side. */}
${drawer("", "", `${sections}
    <Drawer.Body>
      <Text>Long content goes here…</Text>
    </Drawer.Body>
${footer}`)}`,

  nonModal: `{/* modal={false}: no scrim, no scroll lock; the page behind stays usable. Meant for a docked inspector. */}
${drawer("modal={false}", "", full, "Inspector")}`,

  controlled: `{/* const [open, setOpen] = useState(false); */}
<Drawer open={open} onOpenChange={setOpen}>
  <Drawer.Content>
${full}
  </Drawer.Content>
</Drawer>`,

  busy: `{/* const [busy, setBusy] = useState(false);
    Escape, the scrim, the close button and Drawer.Close do nothing while busy; the panel is aria-busy. */}
${drawer("", "busy={busy}", full, "Save")}`,

  keepMounted: `{/* keepMounted: what was typed is still there when the drawer reopens. */}
${drawer("", "keepMounted", full)}`,

  closeReason: `{/* reason: "trigger" | "escape" | "outside" | "close-button" | "close". */}
${drawer("onOpenChange={(open, { reason }) => console.log(open, reason)}", "", full)}`,

  confirmation: `{/* A confirmation opened from inside a drawer. Escape answers the confirmation first. */}
<Drawer>
  <Drawer.Trigger asChild>
    <Button>Settings</Button>
  </Drawer.Trigger>
  <Drawer.Content>
    <Drawer.Header>
      <Drawer.Title>Settings</Drawer.Title>
    </Drawer.Header>
    <Drawer.Footer>
      <ConfirmDialog
        trigger={<Button variant="destructive">Delete account</Button>}
        tone="danger"
        scrimOpacity={40}
        title="Delete account?"
        description="It cannot be undone."
        labels={{ confirm: "Delete", cancel: "Keep it" }}
        onConfirm={deleteAccount}
      />
    </Drawer.Footer>
  </Drawer.Content>
</Drawer>`,

  rightToLeft: `{/* dir="rtl": side="start" is the right edge, and the panel slides in from it. */}
${drawer("", 'side="start" dir="rtl"', full, "القائمة")}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface DrawerPlaygroundSnippetArgs {
  modal?: boolean;
  side?: DrawerSide;
  size?: DrawerSize;
  swipeToDismiss?: boolean;
  showHandle?: boolean;
  /** `false`, `true` or `"auto"`, or the Playground control's option key (`"off"`, `"on"`, `"auto"`). */
  divided?: boolean | "auto" | "off" | "on";
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
 * around a small real drawer.
 */
export function drawerPlaygroundSnippet(args: DrawerPlaygroundSnippetArgs): string {
  const rootAttributes: string[] = [];
  if (args.modal === false) rootAttributes.push("modal={false}");

  const contentAttributes: string[] = [];
  if (args.side && args.side !== "end") contentAttributes.push(`side="${args.side}"`);
  if (args.size && args.size !== "md") contentAttributes.push(`size="${args.size}"`);
  if (args.swipeToDismiss === false) contentAttributes.push("swipeToDismiss={false}");
  if (args.showHandle === false) contentAttributes.push("showHandle={false}");
  // The Playground's select hands over its option key, not the mapped value; `divided` defaults to "auto".
  if (args.divided === true || args.divided === "on") contentAttributes.push("divided");
  if (args.divided === false || args.divided === "off") contentAttributes.push("divided={false}");
  if (args.busy) contentAttributes.push("busy");
  if (args.keepMounted) contentAttributes.push("keepMounted");
  if (args.scrimOpacity !== undefined && args.scrimOpacity !== 60) contentAttributes.push(`scrimOpacity={${args.scrimOpacity}}`);
  if (args.scrimBlur) contentAttributes.push("scrimBlur");
  if (args.showCloseButton === false) contentAttributes.push("showCloseButton={false}");
  if (args.closeOnOutsideClick === false) contentAttributes.push("closeOnOutsideClick={false}");
  if (args.closeOnEscape === false) contentAttributes.push("closeOnEscape={false}");

  return drawer(rootAttributes.join(" "), contentAttributes.join(" "), full);
}
