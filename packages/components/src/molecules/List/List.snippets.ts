// The code shown under each story's "Show code" button on List's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source
// spreads the Playground's `args` and calls story-only helpers
// (`parseNumberArg`, `useSyncMarkerToAs`) that don't exist outside the stories
// file, so none of it can be pasted anywhere. Each snippet here is the smallest
// real usage of what its story shows — only exports of the package, no demo
// scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { defaultMarkerFor } from "./List";
import type { ListElement, ListMarker } from "./List.types";

const list = (attributes: string, items: string[]) =>
  `<List${attributes ? ` ${attributes}` : ""}>\n${items.map((item) => `  <ListItem>${item}</ListItem>`).join("\n")}\n</List>`;

export const listSnippets = {
  unordered: `{/* The default: a <ul> with disc markers */}
${list("", ["First item", "Second item", "Third item"])}`,

  ordered: `{/* as="ol" renders an <ol>; its markers default to numbers */}
${list('as="ol"', ["First step", "Second step", "Third step"])}`,

  noMarker: `{/* marker="none" drops the markers — for menus, nav lists, and other lists that aren't really a sequence */}
${list('marker="none"', ["Item without a marker", "Another item"])}`,

  customSpacing: `{/* spacing: the gap between items, on the spacing scale (default 2) */}
${list("spacing={6}", ["First item", "Second item", "Third item"])}`,

  orderedListSpecificProps: `{/* On an <ol>, start, reversed, and type pass through to the native list */}
${list('as="ol" start={5} reversed type="A"', ["Counts down from 5", "Then 4", "Then 3"])}`,

  responsiveSpacing: `{/* spacing takes a mobile-first map: tight on mobile, roomy from lg up */}
${list("spacing={{ base: 1, lg: 6 }}", ["First item", "Second item", "Third item"])}`,

  narrowViewport: `{/* Long items wrap inside the list instead of overflowing it */}
<List>
  <ListItem>
    A longer list item that should wrap gracefully at narrow viewport widths without overflowing its container.
  </ListItem>
  <ListItem>Short item</ListItem>
</List>`,

  withListItemFeatures: `{/* HouseIcon, GearIcon and CheckIcon come from @dbm-design-system/icons;
    const [selected, setSelected] = useState("home"); */}
<List marker="none">
  <ListItem
    interactive
    selected={selected === "home"}
    icon={HouseIcon}
    onClick={() => setSelected("home")}
  >
    Home
  </ListItem>
  <ListItem
    interactive
    selected={selected === "settings"}
    icon={GearIcon}
    trailing={<Badge tone="info">3</Badge>}
    onClick={() => setSelected("settings")}
  >
    Settings
  </ListItem>
  <ListItem
    interactive
    disabled
    icon={CheckIcon}
    trailing={<IconButton icon={GearIcon} aria-label="Configure" size="xs" variant="ghost" />}
    onClick={() => {}}
  >
    Unavailable
  </ListItem>
</List>`,

  nestedLists: `{/* A List inside a ListItem nests naturally */}
<List>
  <ListItem>
    Layout
    <List as="ol" spacing={1} marker="decimal">
      <ListItem>Grid</ListItem>
      <ListItem>Stack</ListItem>
    </List>
  </ListItem>
  <ListItem>Typography</ListItem>
  <ListItem>Inputs &amp; Forms</ListItem>
</List>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ListPlaygroundSnippetArgs {
  as?: ListElement;
  marker?: ListMarker;
  spacing?: unknown;
  /** The control's raw value: a number, or a string (`""` meaning "not set"). */
  start?: unknown;
  reversed?: boolean;
  type?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that
 * differ from their defaults, around three plain items.
 */
export function listPlaygroundSnippet(args: ListPlaygroundSnippetArgs): string {
  const ordered = args.as === "ol";
  const attributes: string[] = [];
  if (ordered) attributes.push('as="ol"');
  // A marker is the natural one for its element unless it says otherwise, so only
  // a different one needs writing.
  if (args.marker && args.marker !== defaultMarkerFor[args.as ?? "ul"]) attributes.push(`marker="${args.marker}"`);
  if (typeof args.spacing === "number" && args.spacing !== 2) attributes.push(`spacing={${args.spacing}}`);
  if (ordered) {
    const start = typeof args.start === "string" && args.start.trim() !== "" ? Number(args.start) : args.start;
    if (typeof start === "number" && !Number.isNaN(start)) attributes.push(`start={${start}}`);
    if (args.reversed) attributes.push("reversed");
    if (args.type) attributes.push(`type="${args.type}"`);
  }
  return list(attributes.join(" "), ["First item", "Second item", "Third item"]);
}
