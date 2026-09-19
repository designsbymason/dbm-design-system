// The code shown under each story's "Show code" button on ListItem's Docs page.
//
// Hand-written rather than generated from the rendered story: the Playground printed
// `aria-label="" disabled={false} interactive={false} selected={false}`, and the five gallery
// panels showed the story object itself — "Interactive" with its own `useState`, and the
// trailing-content and disabled ones with `onClick={() => {}}`. A `ListItem` belongs in a `List`,
// so each snippet keeps that one wrapper. Each snippet here is the smallest real usage of what
// its story shows — only exports of the package, no demo scaffolding — and
// `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import { escapeJsxText, quote } from "../../snippetHelpers";

export const listItemSnippets = {
  default: `{/* A ListItem belongs in a List */}
<List>
  <ListItem>A single list item, rendered within a List</ListItem>
</List>`,

  customIconMarker: `{/* icon replaces the bullet — set the List's marker to "none" so it doesn't draw both. CheckIcon comes
    from @dbm-design-system/icons. */}
<List marker="none">
  <ListItem icon={CheckIcon}>Design tokens defined</ListItem>
  <ListItem icon={CheckIcon}>Core atoms shipped</ListItem>
  <ListItem icon={CheckIcon}>Molecules in progress</ListItem>
</List>`,

  trailingContent: `{/* trailing puts something at the end of the row — a count, or a control. GearIcon comes from
    @dbm-design-system/icons; handleClick is yours. */}
<List marker="none">
  <ListItem trailing={<Badge tone="info">3</Badge>}>Inbox</ListItem>
  <ListItem trailing={<Badge tone="danger">12</Badge>}>Overdue</ListItem>
  <ListItem
    interactive
    onClick={handleClick}
    trailing={<IconButton icon={GearIcon} aria-label="Settings" size="xs" variant="ghost" />}
  >
    Preferences
  </ListItem>
</List>`,

  interactive: `{/* const [selected, setSelected] = useState("home"); */}
{/* interactive makes each row a button, and selected marks the current one. HouseIcon and GearIcon come
    from @dbm-design-system/icons. */}
<List marker="none" as="ul">
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
    onClick={() => setSelected("settings")}
  >
    Settings
  </ListItem>
</List>`,

  disabled: `{/* disabled sets aria-disabled and blocks the click. HouseIcon and GearIcon come from
    @dbm-design-system/icons; handleClick is yours. */}
<List marker="none">
  <ListItem interactive icon={HouseIcon} onClick={handleClick}>
    Home
  </ListItem>
  <ListItem interactive icon={GearIcon} disabled onClick={handleClick}>
    Settings (unavailable)
  </ListItem>
</List>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ListItemPlaygroundSnippetArgs {
  children?: unknown;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}

/**
 * The Playground's snippet, built from its current controls: only the props that are on (all
 * default to off), inside the `List` an item needs. An interactive item gets the click handler it
 * would need, named for the reader to supply.
 */
export function listItemPlaygroundSnippet(args: ListItemPlaygroundSnippetArgs): string {
  const attributes: string[] = [];
  if (args.interactive) attributes.push("interactive");
  if (args.selected) attributes.push("selected");
  if (args.disabled) attributes.push("disabled");
  if (args.interactive) attributes.push("onClick={handleClick}");
  if (args["aria-label"]) attributes.push(`aria-label=${quote(args["aria-label"])}`);
  const open = attributes.length > 0 ? `<ListItem ${attributes.join(" ")}>` : "<ListItem>";
  const comment = args.interactive ? "{/* handleClick is yours */}\n" : "";
  return `${comment}<List>\n  ${open}${escapeJsxText(String(args.children ?? "A single list item"))}</ListItem>\n</List>`;
}
