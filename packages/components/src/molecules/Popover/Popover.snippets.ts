// The code shown under each story's "Show code" button on Popover's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object (or, for a story that reuses the Playground's render, just an
// `args` object) plus demo-only wiring, which can't be pasted anywhere. Each
// snippet here is the smallest real usage of what its story shows — only exports
// of the package, no demo scaffolding — and `storySnippets.test.ts` checks that
// stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { PopoverAlign, PopoverSide } from "./Popover.types";

const popover = (rootAttributes: string, contentAttributes: string, trigger: string, body: string) =>
  `<Popover${rootAttributes ? ` ${rootAttributes}` : ""}>
  <Popover.Trigger asChild>
    ${trigger}
  </Popover.Trigger>
  <Popover.Content${contentAttributes ? ` ${contentAttributes}` : ""}>
${body}
  </Popover.Content>
</Popover>`;

const exampleBody = `    <Text size="sm">This is the popover's own content.</Text>`;

export const popoverSnippets = {
  allSides: `{/* side: "top" | "right" | "bottom" (default) | "left" — the side of the trigger the popover
    opens on, flipping to the opposite side if there isn't room. */}
${popover("", 'side="top" aria-label="Popover on the top"', '<Button variant="secondary">top</Button>', `    <Text size="sm">side="top"</Text>`)}`,

  responsiveSide: `{/* side takes a mobile-first map, like Stack and Grid: below the lg breakpoint the popover opens
    below the trigger, from lg up it opens to its right. */}
${popover(
  "",
  'side={{ base: "bottom", lg: "right" }} aria-label="Responsive side example"',
  "<Button>Resize the viewport</Button>",
  `    <Text size="sm">side="bottom" below lg, side="right" from lg up.</Text>`,
)}`,

  hideWhenDetached: `{/* hideWhenDetached hides the popover once its trigger scrolls out of view inside a scrolling
    container, instead of leaving it floating. */}
${popover("", "hideWhenDetached aria-label=\"Hides when detached example\"", "<Button>Trigger</Button>", `    <Text size="sm">Scroll me out of view.</Text>`)}`,

  withForm: `{/* GearIcon comes from @dbm-design-system/icons; const [name, setName] = useState(""); */}
<Popover>
  <Popover.Trigger asChild>
    <IconButton icon={GearIcon} aria-label="Settings" />
  </Popover.Trigger>
  <Popover.Content showCloseButton aria-label="Settings">
    <FieldLabel htmlFor="display-name">Display name</FieldLabel>
    <Input
      id="display-name"
      value={name}
      onChange={(event) => setName(event.target.value)}
      placeholder="Jane Doe"
    />
  </Popover.Content>
</Popover>`,

  disabledTrigger: `{/* A disabled trigger can't open the popover */}
${popover("", 'aria-label="Example popover"', "<Button disabled>Open popover</Button>", exampleBody)}`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface PopoverPlaygroundSnippetArgs {
  defaultOpen?: boolean;
  modal?: boolean;
  side?: PopoverSide;
  align?: PopoverAlign;
  sideOffset?: number;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  hideWhenDetached?: boolean;
  hideArrow?: boolean;
  showCloseButton?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, around a small real popover. The stories that just
 * change one arg (arrow hidden, close button, modal) use the same builder.
 */
export function popoverPlaygroundSnippet(args: PopoverPlaygroundSnippetArgs): string {
  const rootAttributes: string[] = [];
  if (args.defaultOpen) rootAttributes.push("defaultOpen");
  if (args.modal) rootAttributes.push("modal");

  const contentAttributes: string[] = [];
  if (args.side && args.side !== "bottom") contentAttributes.push(`side="${args.side}"`);
  if (args.align && args.align !== "center") contentAttributes.push(`align="${args.align}"`);
  if (args.sideOffset !== undefined && args.sideOffset !== 8) contentAttributes.push(`sideOffset={${args.sideOffset}}`);
  if (args.alignOffset !== undefined && args.alignOffset !== 0) contentAttributes.push(`alignOffset={${args.alignOffset}}`);
  // `avoidCollisions` defaults to true, so it only needs writing when it's off.
  if (args.avoidCollisions === false) contentAttributes.push("avoidCollisions={false}");
  if (args.collisionPadding !== undefined && args.collisionPadding !== 8) {
    contentAttributes.push(`collisionPadding={${args.collisionPadding}}`);
  }
  if (args.hideWhenDetached) contentAttributes.push("hideWhenDetached");
  if (args.hideArrow) contentAttributes.push("hideArrow");
  if (args.showCloseButton) contentAttributes.push("showCloseButton");
  contentAttributes.push('aria-label="Example popover"');

  return popover(rootAttributes.join(" "), contentAttributes.join(" "), "<Button>Open popover</Button>", exampleBody);
}
