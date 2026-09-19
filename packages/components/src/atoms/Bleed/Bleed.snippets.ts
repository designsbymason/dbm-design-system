// The code shown under each story's "Show code" button on Bleed's Docs page.
//
// Hand-written rather than generated from the rendered story: four of the five panels
// show the story object itself (`{ argTypes: …, render: () => … }`), with development
// notes inside it. Bleed only makes sense inside a parent that pads it, and its `inset`
// has to match that padding — so each snippet keeps that one padded parent and drops
// the demo's dashed border, canvas fills and placeholder text. Each snippet here is
// the smallest real usage of what its story shows — only exports of the package, no
// demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { BleedSide } from "./Bleed.types";

export const bleedSnippets = {
  default: `{/* Bleed cancels its parent's padding on the sides you name, so its content reaches the parent's edges
    while the text around it stays padded. inset is a spacing step and has to match the padding it cancels:
    here 6 matches paddingInline: space.6. */}
<div style={{ paddingInline: "var(--dbm-space-6)" }}>
  <p>Padded article copy.</p>
  <Bleed inset={6}>
    <img src="/hero.jpg" alt="A mountain valley at dawn" style={{ display: "block", width: "100%" }} />
  </Bleed>
  <p>This text stays padded, unaffected by the bleed.</p>
</div>`,

  block: `{/* side: "inline" (default) | "block" | "all". "block" bleeds top and bottom only, matching paddingBlock. */}
<div style={{ paddingBlock: "var(--dbm-space-6)", paddingInline: "var(--dbm-space-4)" }}>
  <Bleed inset={6} side="block">
    <div style={{ padding: "var(--dbm-space-4)" }}>Bleeds top and bottom only</div>
  </Bleed>
</div>`,

  all: `{/* "all" bleeds on every edge, matching a padding on every side */}
<div style={{ padding: "var(--dbm-space-6)" }}>
  <Bleed inset={6} side="all">
    <div style={{ height: "8rem" }}>Bleeds every edge</div>
  </Bleed>
</div>`,

  responsiveInset: `{/* inset takes a mobile-first map, like Container's paddingInline — keep the two in step so the bleed always
    reaches the container's edge, at every width */}
<Container size="md" paddingInline={{ base: 4, lg: 8 }}>
  <p>Container's paddingInline is 4 below the lg breakpoint, 8 from lg up.</p>
  <Bleed inset={{ base: 4, lg: 8 }}>
    <div style={{ padding: "var(--dbm-space-4)" }}>Always bleeds exactly to the Container's edge.</div>
  </Bleed>
  <p>This text stays padded at every width.</p>
</Container>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface BleedPlaygroundSnippetArgs {
  inset?: number;
  side?: BleedSide;
  children?: unknown;
}

const parentPadding: Record<BleedSide, string> = {
  inline: "paddingInline",
  block: "paddingBlock",
  all: "padding",
};

/**
 * The Playground's snippet, built from its current controls: the `side` only when it
 * isn't the default (`inline`), inside a parent whose padding matches `inset` on that
 * side — which is what a `Bleed` needs in order to do anything.
 */
export function bleedPlaygroundSnippet(args: BleedPlaygroundSnippetArgs): string {
  const side = args.side ?? "inline";
  const inset = args.inset ?? 6;
  const attributes = [`inset={${inset}}`];
  if (side !== "inline") attributes.push(`side="${side}"`);
  return `<div style={{ ${parentPadding[side]}: "var(--dbm-space-${inset})" }}>
  <Bleed ${attributes.join(" ")}>${String(args.children ?? "Full-width content placeholder")}</Bleed>
</div>`;
}
