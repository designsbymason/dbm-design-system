// The code shown under each story's "Show code" button on HoverCard's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is
// the story object (or, for a story that reuses the Playground's render, just an
// `args` object) plus demo-only wiring, which can't be pasted anywhere. Each
// snippet here is the smallest real usage of what its story shows — only exports
// of the package, no demo scaffolding — and `storySnippets.test.ts` checks that
// stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { HoverCardAlign, HoverCardSide } from "./HoverCard.types";

const profile = `    <Stack direction="row" gap={3} align="center">
      <Avatar name="Jane Doe" size="md" />
      <Stack gap={1}>
        <Text weight="semibold">Jane Doe</Text>
        <Text size="sm" color="secondary">Design systems engineer</Text>
      </Stack>
    </Stack>`;

const hoverCard = (rootAttributes: string, contentAttributes: string, trigger: string, body: string) =>
  `<HoverCard${rootAttributes ? ` ${rootAttributes}` : ""}>
  <HoverCard.Trigger asChild>
    ${trigger}
  </HoverCard.Trigger>
  <HoverCard.Content${contentAttributes ? ` ${contentAttributes}` : ""}>
${body}
  </HoverCard.Content>
</HoverCard>`;

const link = '<Link href="/people/jane">@jane</Link>';

export const hoverCardSnippets = {
  profilePreview: hoverCard("", "", link, profile),

  allSides: `{/* side: "top" (default) | "right" | "bottom" | "left" — the side of the trigger the card
    opens on, flipping to the opposite side if there isn't room. */}
${hoverCard("", 'side="top"', '<Link href="/people/jane">top</Link>', `    <Text size="sm">side="top"</Text>`)}`,

  responsiveSide: `{/* side takes a mobile-first map, like Stack and Grid: below the lg breakpoint the card opens
    below the trigger, from lg up it opens to its right. */}
${hoverCard(
  "",
  'side={{ base: "bottom", lg: "right" }}',
  '<Link href="/people/jane">Resize the viewport</Link>',
  `    <Text size="sm">side="bottom" below lg, side="right" from lg up.</Text>`,
)}`,

  hideWhenDetached: `{/* hideWhenDetached hides the card once its trigger scrolls out of view inside a scrolling
    container, instead of leaving it floating. */}
${hoverCard("", "hideWhenDetached", link, `    <Text size="sm">Scroll me out of view.</Text>`)}`,

  delays: `{/* openDelay: how long the pointer or focus must rest on the trigger before the card opens
    (default 300). closeDelay: how long it stays open after the pointer leaves (default 300). */}
${hoverCard("openDelay={100} closeDelay={100}", "", link, `    <Text size="sm">Opens after 100ms, closes 100ms after leaving.</Text>`)}`,

  controlled: `{/* const [open, setOpen] = useState(false); */}
<HoverCard open={open} onOpenChange={setOpen}>
  <HoverCard.Trigger asChild>
    <Link href="/people/jane">@jane</Link>
  </HoverCard.Trigger>
  <HoverCard.Content>
    <Text size="sm">{open ? "Open" : "Closed"}</Text>
  </HoverCard.Content>
</HoverCard>`,

  plainTrigger: `{/* Without asChild the trigger is a plain <a>: give it an href so a keyboard user can reach it. */}
<HoverCard>
  <HoverCard.Trigger href="/people/jane">@jane</HoverCard.Trigger>
  <HoverCard.Content>
    <Text size="sm">Jane Doe</Text>
  </HoverCard.Content>
</HoverCard>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface HoverCardPlaygroundSnippetArgs {
  defaultOpen?: boolean;
  openDelay?: number;
  closeDelay?: number;
  side?: HoverCardSide;
  align?: HoverCardAlign;
  sideOffset?: number;
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionPadding?: number;
  hideWhenDetached?: boolean;
  hideArrow?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, around a small real hover card.
 */
export function hoverCardPlaygroundSnippet(args: HoverCardPlaygroundSnippetArgs): string {
  const rootAttributes: string[] = [];
  if (args.defaultOpen) rootAttributes.push("defaultOpen");
  if (args.openDelay !== undefined && args.openDelay !== 300) rootAttributes.push(`openDelay={${args.openDelay}}`);
  if (args.closeDelay !== undefined && args.closeDelay !== 300) rootAttributes.push(`closeDelay={${args.closeDelay}}`);

  const contentAttributes: string[] = [];
  if (args.side && args.side !== "top") contentAttributes.push(`side="${args.side}"`);
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

  return hoverCard(rootAttributes.join(" "), contentAttributes.join(" "), link, profile);
}
