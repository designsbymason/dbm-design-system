// The code shown under each story's "Show code" button on GridItem's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code is
// JSX, but every cell repeats a seven-line style object (background, radius, padding…),
// the Playground writes `colSpan={1} rowSpan={1} order={1}` on cells that use none of
// them, and it adds three filler cells only there to demonstrate `order`. A GridItem
// only means something inside a Grid, so each snippet keeps that one Grid and a few
// plain cells. Each snippet here is the smallest real usage of what its story shows —
// only exports of the package, no demo scaffolding — and `storySnippets.test.ts`
// checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

export const gridItemSnippets = {
  colSpan: `{/* colSpan makes an item span several columns; the item after it flows into the next free cell */}
<Grid columns={4} gap={4}>
  <GridItem colSpan={3}>colSpan=3</GridItem>
  <GridItem>1</GridItem>
</Grid>`,

  explicitColumnPlacement: `{/* colStart pins an item to a specific column line (1-based); with colSpan it takes the columns from there */}
<Grid columns={4} gap={4}>
  <GridItem colStart={2} colSpan={2}>Starts at column 2, spans 2</GridItem>
</Grid>`,

  explicitRowPlacement: `{/* rowStart and rowSpan do the same for rows. autoRows gives the grid rows a height to span. */}
<Grid columns={3} gap={4} autoRows="4rem">
  <GridItem rowStart={2} rowSpan={2}>Starts at row 2, spans 2</GridItem>
  <GridItem>1x1</GridItem>
  <GridItem>1x1</GridItem>
</Grid>`,

  rowAndColSpanCombined: `{/* rowSpan and colSpan together make a block */}
<Grid columns={3} gap={4} autoRows="4rem">
  <GridItem rowSpan={2} colSpan={2}>rowSpan=2, colSpan=2</GridItem>
  <GridItem>1x1</GridItem>
  <GridItem>1x1</GridItem>
  <GridItem>1x1</GridItem>
</Grid>`,

  order: `{/* order changes where an item is drawn without changing the DOM order, so reading order and tab order
    stay as written. Items sort by order, lowest first. */}
<Grid columns={3} gap={4}>
  <GridItem order={3}>1st in the DOM, order=3 (drawn last)</GridItem>
  <GridItem order={1}>2nd in the DOM, order=1 (drawn first)</GridItem>
  <GridItem order={2}>3rd in the DOM, order=2 (drawn in the middle)</GridItem>
</Grid>`,

  responsiveSpan: `{/* colSpan takes a mobile-first map: full width on mobile, half from md up */}
<Grid columns={4} gap={4}>
  <GridItem colSpan={{ base: 4, md: 2 }}>colSpan: base=4, md=2</GridItem>
  <GridItem colSpan={{ base: 4, md: 2 }}>colSpan: base=4, md=2</GridItem>
</Grid>`,

  asListItem: `{/* as="li" inside a Grid rendered as="ul" is a real list, with the grid's layout. Reset the list's own
    styling if you don't want it. */}
<Grid as="ul" columns={4} gap={4} style={{ listStyle: "none", margin: 0, padding: 0 }}>
  <GridItem as="li" colSpan={2}>colSpan=2</GridItem>
  <GridItem as="li">1x1</GridItem>
  <GridItem as="li">1x1</GridItem>
</Grid>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface GridItemPlaygroundSnippetArgs {
  children?: unknown;
  colSpan?: number;
  rowSpan?: number;
  /** The control's raw value: a number, or a string (`""` meaning "not set"). */
  colStart?: unknown;
  rowStart?: unknown;
  order?: number;
  as?: string;
}

const lineNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, on one cell inside a `Grid`. The Playground gives the
 * cell an `order` of 1 so its filler cells (drawn only there, to show `order`) sort
 * around it, so `1` isn't written — any other value is. As a list item it's written
 * inside the `ul` it needs.
 */
export function gridItemPlaygroundSnippet(args: GridItemPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  const listItem = args.as === "li";
  if (listItem) attributes.push('as="li"');
  if (args.colSpan !== undefined && args.colSpan !== 1) attributes.push(`colSpan={${args.colSpan}}`);
  if (args.rowSpan !== undefined && args.rowSpan !== 1) attributes.push(`rowSpan={${args.rowSpan}}`);
  const colStart = lineNumber(args.colStart);
  const rowStart = lineNumber(args.rowStart);
  if (colStart !== undefined) attributes.push(`colStart={${colStart}}`);
  if (rowStart !== undefined) attributes.push(`rowStart={${rowStart}}`);
  if (args.order !== undefined && args.order !== 1) attributes.push(`order={${args.order}}`);
  const cell = `<GridItem${attributes.length > 0 ? ` ${attributes.join(" ")}` : ""}>${String(args.children ?? "Grid cell")}</GridItem>`;
  return listItem
    ? `<Grid as="ul" columns={4} gap={4} style={{ listStyle: "none", margin: 0, padding: 0 }}>\n  ${cell}\n</Grid>`
    : `<Grid columns={4} gap={4}>\n  ${cell}\n</Grid>`;
}
