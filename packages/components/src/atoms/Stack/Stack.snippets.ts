// The code shown under each story's "Show code" button on Stack's Docs page.
//
// Hand-written rather than generated from the rendered story: the Playground, "Row" and
// "Align + justify" panels print a `<Swatches />` placeholder where the children belong,
// spell out every default (`align="stretch" as="div" direction="column" gap={0}
// justify="start" wrap={false}`), and six panels show the story object itself, with
// `argTypes: disableAllAxes` and helpers (`Swatches`, `swatchStyle`) from the stories
// file. Each snippet here is the smallest real usage of what its story shows — only
// exports of the package, no demo scaffolding — and `storySnippets.test.ts` checks that
// stays true. See `07-storybook-and-documentation-standards.md` §4.2.

import type { StackAlign, StackDirection, StackJustify } from "./Stack.types";

const three = `  <div>One</div>
  <div>Two</div>
  <div>Three</div>`;

export const stackSnippets = {
  alignAndJustify: `{/* align is the cross axis, justify the main axis. Both only show when the stack has room, so it needs a
    height here. align: "stretch" (default) | "start" | "center" | "end" | "baseline".
    justify: "start" (default) | "center" | "end" | "between" | "around" | "evenly". */}
<Stack direction="row" gap={4} align="center" justify="between" style={{ height: "6rem" }}>
${three}
</Stack>`,

  reversedDirection: `{/* direction: "column" (default) | "row" | "column-reverse" | "row-reverse" */}
<Stack direction="row-reverse" gap={4} align="center">
${three}
</Stack>`,

  allGapSteps: `{/* gap is a step on the spacing scale (0 by default) */}
<Stack direction="row" gap={8} align="center">
${three}
</Stack>`,

  wrapping: `{/* wrap lets a row flow onto new lines instead of overflowing when it runs out of room */}
<Stack direction="row" gap={2} wrap style={{ maxWidth: "16rem" }}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
  <div>Item 5</div>
  <div>Item 6</div>
</Stack>`,

  responsiveDirection: `{/* direction takes a mobile-first map: a column on mobile, a row from md up */}
<Stack direction={{ base: "column", md: "row" }} gap={4}>
${three}
</Stack>`,

  responsiveEverything: `{/* Every layout prop takes the same map: gap, align, justify, and wrap can each change at a breakpoint */}
<Stack
  direction={{ base: "column", md: "row" }}
  gap={{ base: 2, md: 6 }}
  align={{ base: "stretch", md: "center" }}
  justify={{ base: "start", md: "between" }}
  wrap={{ base: false, md: true }}
>
${three}
</Stack>`,

  asUnorderedList: `{/* as="ul" renders a real list, with the stack's layout. Reset the list's own styling if you don't want it. */}
<Stack as="ul" direction="row" gap={3} style={{ listStyle: "none", margin: 0, padding: 0 }}>
  <li>One</li>
  <li>Two</li>
  <li>Three</li>
</Stack>`,

  withDivider: `{/* divider is inserted between every pair of children automatically. A vertical Divider fills its
    row's height, so the row needs one. */}
<Stack direction="row" align="center" style={{ height: "2.5rem" }} divider={<Divider orientation="vertical" />}>
  <span>One</span>
  <span>Two</span>
  <span>Three</span>
</Stack>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface StackPlaygroundSnippetArgs {
  as?: string;
  direction?: StackDirection;
  gap?: number;
  align?: StackAlign;
  justify?: StackJustify;
  wrap?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults (`div`, `column`, a gap of 0, `stretch`, `start`, no wrap),
 * around three plain children. Also serves the "Row" story.
 */
export function stackPlaygroundSnippet(args: StackPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.as && args.as !== "div") attributes.push(`as="${args.as}"`);
  if (args.direction && args.direction !== "column") attributes.push(`direction="${args.direction}"`);
  if (args.gap !== undefined && args.gap !== 0) attributes.push(`gap={${args.gap}}`);
  if (args.align && args.align !== "stretch") attributes.push(`align="${args.align}"`);
  if (args.justify && args.justify !== "start") attributes.push(`justify="${args.justify}"`);
  if (args.wrap) attributes.push("wrap");
  return `<Stack${attributes.length > 0 ? ` ${attributes.join(" ")}` : ""}>\n${three}\n</Stack>`;
}
