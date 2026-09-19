// The code shown under each story's "Show code" button on Divider's Docs page.
//
// Hand-written rather than generated from the rendered story: twelve of the thirteen
// panels show the story object itself (`{ argTypes: {…}, render: () => … }`), with
// development notes ("same reasoning as Skeleton's `DefaultSizes`") inside it, and the
// Playground's generated code spells out `emphasis="none" thickness="thin"
// tone="default" variant="solid"` and an empty `aria-label=""`. A vertical divider
// needs a flex parent with a height to have anything to fill, so those snippets keep
// that one container; horizontal ones are just the divider. Each snippet here is the
// smallest real usage of what its story shows — only exports of the package, no demo
// scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type {
  DividerAlign,
  DividerEmphasis,
  DividerOrientation,
  DividerThickness,
  DividerTone,
  DividerVariant,
} from "./Divider.types";

export const dividerSnippets = {
  horizontal: `{/* A horizontal rule between sections */}
<p>Content above</p>
<Divider />
<p>Content below</p>`,

  horizontalWithLabel: `{/* label puts text in the line — a section break with a name, like "OR" */}
<p>Sign in with email</p>
<Divider label="OR" />
<p>Sign in with SSO</p>`,

  labelAlignment: `{/* align: "start" | "center" (default) | "end" — where the label sits along the line */}
<Divider label="Section A" align="start" />
<Divider label="Section B" align="center" />
<Divider label="Section C" align="end" />`,

  vertical: `{/* A vertical divider fills the height of its container, so put it in a flex row that has one */}
<div style={{ display: "flex", gap: "var(--dbm-space-3)", height: "4rem" }}>
  <span>Left</span>
  <Divider orientation="vertical" />
  <span>Right</span>
</div>`,

  verticalWithLabel: `{/* A labelled vertical divider, in a flex row with a height */}
<div style={{ display: "flex", height: "6rem" }}>
  <span>Left</span>
  <Divider orientation="vertical" label="OR" />
  <span>Right</span>
</div>`,

  dashed: `{/* variant: "solid" (default) | "dashed" | "dotted" | "double" */}
<Divider variant="dashed" />`,

  dotted: `<Divider variant="dotted" />`,

  double: `{/* A double line, both strokes the same weight */}
<Divider variant="double" />`,

  doubleEmphasisStart: `{/* emphasis: "none" (default) | "start" | "end" — makes one of a double line's strokes thicker */}
<Divider variant="double" emphasis="start" />`,

  doubleEmphasisEnd: `<Divider variant="double" emphasis="end" />`,

  tones: `{/* tone: "default" | "brand" | "info" | "success" | "warning" | "danger" */}
<Divider label="default" tone="default" />
<Divider label="brand" tone="brand" />
<Divider label="danger" tone="danger" />`,

  responsiveOrientation: `{/* orientation takes a mobile-first map: horizontal in a column on mobile, vertical in a row from lg up.
    The row needs a height for the vertical divider to fill. */}
<Stack direction={{ base: "column", lg: "row" }} gap={4} style={{ height: "6rem" }}>
  <span>Section A</span>
  <Divider orientation={{ base: "horizontal", lg: "vertical" }} label="OR" />
  <span>Section B</span>
</Stack>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface DividerPlaygroundSnippetArgs {
  orientation?: DividerOrientation;
  variant?: DividerVariant;
  thickness?: DividerThickness;
  emphasis?: DividerEmphasis;
  tone?: DividerTone;
  label?: string;
  align?: DividerAlign;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults. A vertical divider is written inside a flex row with a
 * height, which is what it needs to show.
 */
export function dividerPlaygroundSnippet(args: DividerPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  const vertical = args.orientation === "vertical";
  if (vertical) attributes.push('orientation="vertical"');
  if (args.variant && args.variant !== "solid") attributes.push(`variant="${args.variant}"`);
  if (args.thickness && args.thickness !== "thin") attributes.push(`thickness="${args.thickness}"`);
  if (args.emphasis && args.emphasis !== "none") attributes.push(`emphasis="${args.emphasis}"`);
  if (args.tone && args.tone !== "default") attributes.push(`tone="${args.tone}"`);
  if (args.label) {
    attributes.push(`label="${args.label}"`);
    if (args.align && args.align !== "center") attributes.push(`align="${args.align}"`);
  }
  if (args["aria-label"]) attributes.push(`aria-label="${args["aria-label"]}"`);
  const divider = `<Divider${attributes.length > 0 ? ` ${attributes.join(" ")}` : ""} />`;
  return vertical
    ? `<div style={{ display: "flex", gap: "var(--dbm-space-3)", height: "6rem" }}>\n  <span>Content start</span>\n  ${divider}\n  <span>Content end</span>\n</div>`
    : divider;
}
