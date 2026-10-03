// The code shown under each story's "Show code" button on ScrollArea's Docs page.
// See `07-storybook-and-documentation-standards.md` §4.2 and ADR-0020.

import type {
  ScrollAreaScrollbarVisibility,
  ScrollAreaScrollbars,
  ScrollAreaSize,
  ScrollAreaTone,
  ScrollAreaVariant,
} from "./ScrollArea.types";

export const scrollAreaSnippets = {
  vertical: `<ScrollArea style={{ maxHeight: "12rem" }}>
  <p>First item</p>
  <p>Second item</p>
  <p>Third item</p>
  {/* … enough content to overflow 12rem of height */}
</ScrollArea>`,

  horizontal: `{/* scrollbars="horizontal" enables scrolling only sideways — content that overflows vertically would
    be clipped instead. No maxHeight: the region sizes to its own content's natural height. */}
<ScrollArea scrollbars="horizontal">
  <p style={{ whiteSpace: "nowrap" }}>A single line, long enough to overflow the region's own width.</p>
</ScrollArea>`,

  both: `{/* scrollbars="both" offers both axes — for content that can genuinely overflow either way, e.g. a wide,
    tall grid or code block */}
<ScrollArea scrollbars="both" style={{ maxHeight: "12rem" }}>
  <p style={{ whiteSpace: "nowrap" }}>A single wide line…</p>
  {/* …repeated with enough lines to also exceed 12rem of height */}
</ScrollArea>`,

  tone: `{/* tone="brand" colors the thumb with bg.brand/bg.brand-hover and, with showTrack, the track with
    bg.brand-subtle — "neutral" (the default) is the same gray every other track/thumb pair uses */}
<ScrollArea tone="brand" showTrack style={{ maxHeight: "12rem" }}>
  <p>Content styled with the active brand's own colors.</p>
</ScrollArea>`,

  ghost: `{/* variant="ghost" removes the outer border/corners for embedding inside a container that already
    provides its own boundary */}
<Card>
  <Card.Body>
    <ScrollArea variant="ghost" style={{ maxHeight: "10rem" }}>
      <p>Content that scrolls inside the card's own boundary.</p>
    </ScrollArea>
  </Card.Body>
</Card>`,

  labeled: `{/* Once the content actually overflows, the region becomes keyboard-reachable and, with aria-label
    set, an announced landmark region */}
<ScrollArea aria-label="Recent activity" style={{ maxHeight: "12rem" }}>
  <p>Signed in from a new device</p>
  <p>Password changed</p>
  <p>Email address verified</p>
</ScrollArea>`,

  sizes: `{/* size is on the shared 5-step scale: "xs" | "sm" | "md" (default) | "lg" | "xl" */}
<ScrollArea size="lg" scrollbarVisibility="always" style={{ maxHeight: "8rem" }}>
  <p>Thicker scrollbar track and thumb.</p>
</ScrollArea>`,

  imperativeScroll: `{/* const logRef = useRef<HTMLDivElement>(null); */}
{/* viewportRef reaches the actual scrolling element — for imperative scrolling or measuring that the
    outer frame (what ref forwards to) can't provide, since it never scrolls itself */}
<Button onClick={() => logRef.current?.scrollTo({ top: 0, behavior: "smooth" })}>Scroll to top</Button>
<ScrollArea viewportRef={logRef} style={{ maxHeight: "12rem" }}>
  <p>A long log, scrolled to the top on demand.</p>
</ScrollArea>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ScrollAreaPlaygroundSnippetArgs {
  variant?: ScrollAreaVariant;
  size?: ScrollAreaSize;
  scrollbars?: ScrollAreaScrollbars;
  showTrack?: boolean;
  tone?: ScrollAreaTone;
  scrollbarVisibility?: ScrollAreaScrollbarVisibility;
  scrollHideDelay?: number;
  maxHeight?: string;
  dir?: "ltr" | "rtl";
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from
 * their defaults (`bordered`, `md`, `vertical`, `false`, `neutral`, `hover`, 600, `ltr`), around a
 * small real example. `maxHeight` has no built-in default at all (the region simply never scrolls
 * without one), so it's always shown once set — including the Playground's own starting value,
 * which is exactly what makes the live demo scrollable in the first place.
 */
export function scrollAreaPlaygroundSnippet(args: ScrollAreaPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.variant && args.variant !== "bordered") attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.scrollbars && args.scrollbars !== "vertical") attributes.push(`scrollbars="${args.scrollbars}"`);
  if (args.showTrack) attributes.push("showTrack");
  if (args.tone && args.tone !== "neutral") attributes.push(`tone="${args.tone}"`);
  if (args.scrollbarVisibility && args.scrollbarVisibility !== "hover") {
    attributes.push(`scrollbarVisibility="${args.scrollbarVisibility}"`);
  }
  if (args.scrollHideDelay !== undefined && args.scrollHideDelay !== 600) {
    attributes.push(`scrollHideDelay={${args.scrollHideDelay}}`);
  }
  if (args.dir && args.dir !== "ltr") attributes.push(`dir="${args.dir}"`);
  if (args["aria-label"]) attributes.push(`aria-label="${args["aria-label"]}"`);

  const style: string[] = [];
  if (args.maxHeight) style.push(`maxHeight: "${args.maxHeight}"`);
  if (style.length > 0) attributes.push(`style={{ ${style.join(", ")} }}`);

  const open = attributes.length > 0 ? `<ScrollArea ${attributes.join(" ")}>` : "<ScrollArea>";
  const content =
    args.scrollbars === "vertical"
      ? "\n  <p>First item</p>\n  <p>Second item</p>\n  <p>Third item</p>\n"
      : '\n  <p style={{ whiteSpace: "nowrap" }}>A single line, long enough to overflow the region\'s own width.</p>\n';
  return `${open}${content}</ScrollArea>`;
}
