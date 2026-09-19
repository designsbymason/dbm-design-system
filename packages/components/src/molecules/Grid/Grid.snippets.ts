// The code shown under each story's "Show code" button on Grid's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source
// spreads the Playground's `args` and is built from demo-only helpers
// (`ColumnTrackOverlay`, `Cells`, `Chips`, `toCssContentAlign`) that draw the
// track backgrounds, none of which can be pasted anywhere. Each snippet here is
// the smallest real usage of what its story shows — only exports of the package,
// no demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { GridAutoFlow, GridContentAlign, GridItemsAlign } from "./Grid.types";

// Numbered plain-`div` cells — what a grid's children usually are.
const cells = (count: number, spaces = 2) =>
  Array.from({ length: count }, (_, i) => `${" ".repeat(spaces)}<div>${i + 1}</div>`).join("\n");

const grid = (attributes: string, children: string) =>
  `<Grid${attributes ? ` ${attributes}` : ""}>\n${children}\n</Grid>`;

export const gridSnippets = {
  defaultColumns: `{/* With no columns prop the grid has 12 equal columns: children fill left to right, then wrap. */}
${grid("gap={2}", `${cells(6)}\n  {/* …and so on, 12 to a row */}`)}`,

  fixedColumns: `{/* columns: a number of equal-width columns */}
${grid("columns={4} gap={2}", cells(8))}`,

  responsiveColumns: `{/* columns takes a mobile-first map: 1 column on mobile, 2 from md up, 3 from lg up */}
${grid("columns={{ base: 1, md: 2, lg: 3 }} gap={4}", cells(6))}`,

  withSpanningItems: `{/* GridItem's colSpan makes an item span several columns (rowSpan does the same for rows) */}
<Grid columns={4} gap={4}>
  <GridItem colSpan={2}>Spans 2 columns</GridItem>
  <GridItem>1</GridItem>
  <GridItem>2</GridItem>
  <GridItem colSpan={4}>Spans all 4 columns</GridItem>
</Grid>`,

  responsiveGap: `{/* gap takes the same mobile-first map: tight on mobile, roomy from lg up */}
${grid("columns={3} gap={{ base: 1, lg: 8 }}", cells(6))}`,

  fluidMinChildWidth: `{/* minChildWidth needs no breakpoints: as many columns as fit, each at least this wide */}
${grid('minChildWidth="8rem" gap={4}', cells(8))}`,

  densePacking: `{/* autoFlow="row dense" backfills the gaps that mixed spans leave, instead of leaving them empty */}
<Grid columns={4} autoFlow="row dense" gap={4}>
  <GridItem colSpan={2}>1</GridItem>
  <GridItem>2</GridItem>
  <GridItem colSpan={2}>3</GridItem>
  <GridItem>4</GridItem>
  <GridItem>5</GridItem>
</Grid>`,

  itemAlignment: `{/* justifyItems and alignItems place each item within its own cell:
    "start" | "center" | "end" | "stretch" | "baseline" */}
${grid('columns={2} gap={4} autoRows="6rem" justifyItems="center" alignItems="center"', cells(4))}`,

  contentAlignment: `{/* justifyContent and alignContent position the grid's own tracks, when they take up less room
    than the container: "start" | "center" | "end" | "stretch" | "between" | "around" | "evenly" */}
<Grid
  gap={4}
  justifyContent="between"
  alignContent="center"
  style={{ gridTemplateColumns: "repeat(3, 4rem)", height: "12rem" }}
>
${cells(3)}
</Grid>`,

  asUnorderedList: `{/* as="ul" renders a real list with the grid's layout — reset the list's own styling if you don't want it */}
<Grid as="ul" columns={3} gap={3} style={{ listStyle: "none", margin: 0, padding: 0 }}>
${Array.from({ length: 6 }, (_, i) => `  <li>${i + 1}</li>`).join("\n")}
</Grid>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface GridPlaygroundSnippetArgs {
  columns?: unknown;
  minChildWidth?: string;
  gap?: unknown;
  autoFlow?: GridAutoFlow;
  autoRows?: string;
  autoColumns?: string;
  justifyItems?: GridItemsAlign;
  alignItems?: GridItemsAlign;
  justifyContent?: GridContentAlign;
  alignContent?: GridContentAlign;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, around six plain cells. (The Playground itself
 * falls back to `autoRows="6rem"` so its tracks have a height to see; the snippet
 * writes that too, since it's part of what's on screen.)
 */
export function gridPlaygroundSnippet(args: GridPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (typeof args.columns === "number" && args.columns !== 12) attributes.push(`columns={${args.columns}}`);
  if (args.minChildWidth) attributes.push(`minChildWidth="${args.minChildWidth}"`);
  if (typeof args.gap === "number" && args.gap !== 0) attributes.push(`gap={${args.gap}}`);
  if (args.autoFlow && args.autoFlow !== "row") attributes.push(`autoFlow="${args.autoFlow}"`);
  attributes.push(`autoRows="${args.autoRows || "6rem"}"`);
  if (args.autoColumns) attributes.push(`autoColumns="${args.autoColumns}"`);
  if (args.justifyItems) attributes.push(`justifyItems="${args.justifyItems}"`);
  if (args.alignItems) attributes.push(`alignItems="${args.alignItems}"`);
  if (args.justifyContent) attributes.push(`justifyContent="${args.justifyContent}"`);
  if (args.alignContent) attributes.push(`alignContent="${args.alignContent}"`);
  return grid(attributes.join(" "), cells(6));
}
