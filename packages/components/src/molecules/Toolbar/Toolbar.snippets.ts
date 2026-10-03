// The code shown under each story's "Show code" button on Toolbar's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out every default
// (`loop={true}`, `disabled={false}`), prints an icon as `{ $$typeof: Symbol(react.forward_ref) … }` and drops the
// compound parts. Each snippet is the smallest real usage of what its story shows — only exports of the package, no
// demo scaffolding — and `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

export const toolbarSnippets = {
  basic: `{/* Icons come from @dbm-design-system/icons: TextBIcon, TextItalicIcon, TextUnderlineIcon, LinkIcon */}
<Toolbar aria-label="Text formatting">
  <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
  <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
  <Toolbar.IconButton icon={TextUnderlineIcon} aria-label="Underline" />
  <Toolbar.Separator />
  <Toolbar.Button leadingIcon={LinkIcon}>Link</Toolbar.Button>
</Toolbar>`,

  variants: `{/* variant: "ghost" (default) | "outlined" | "filled" — how the bar itself is drawn */}
<Toolbar aria-label="Text formatting" variant="outlined">
  <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
  <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
</Toolbar>`,

  itemVariants: `{/* itemVariant: "ghost" (default) | "tertiary" | "secondary" | "primary" | "destructive" — every item's default */}
<Toolbar aria-label="Document" variant="outlined" itemVariant="secondary">
  <Toolbar.Button>Copy</Toolbar.Button>
  <Toolbar.Button>Paste</Toolbar.Button>
  <Toolbar.Button variant="primary">Save</Toolbar.Button>
</Toolbar>`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — the bar's spacing and every item's default size */}
<Toolbar aria-label="Text formatting" variant="outlined" size="sm">
  <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
  <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
</Toolbar>`,

  rounded: `{/* rounded: round items, and a pill-shaped bar when the bar is drawn */}
<Toolbar aria-label="Text formatting" variant="outlined" rounded>
  <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
  <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
</Toolbar>`,

  groups: `{/* Toolbar.Group names a cluster of related items; Toolbar.Separator draws a rule between clusters */}
<Toolbar aria-label="Editor" variant="outlined">
  <Toolbar.Group aria-label="Text style">
    <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
    <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
  </Toolbar.Group>
  <Toolbar.Separator />
  <Toolbar.Group aria-label="History">
    <Toolbar.IconButton icon={ArrowCounterClockwiseIcon} aria-label="Undo" />
    <Toolbar.IconButton icon={ArrowClockwiseIcon} aria-label="Redo" />
  </Toolbar.Group>
</Toolbar>`,

  spacer: `{/* Toolbar.Spacer takes the free space, pushing what follows it to the far end. The bar needs room to
    spare, so fill its container with fullWidth */}
<Toolbar aria-label="Document" variant="outlined" itemVariant="secondary" fullWidth>
  <Toolbar.Button>Edit</Toolbar.Button>
  <Toolbar.Button>Share</Toolbar.Button>
  <Toolbar.Spacer />
  <Toolbar.Button variant="primary">Publish</Toolbar.Button>
</Toolbar>`,

  toggles: `{/* A pressed state makes an icon button a toggle. Controlled: pressed + onPressedChange */}
{/* const [bold, setBold] = useState(true); */}
<Toolbar aria-label="Text style" variant="outlined">
  <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" pressed={bold} onPressedChange={setBold} />
  <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" defaultPressed={false} />
</Toolbar>`,

  vertical: `{/* orientation="vertical": up and down move between items */}
<Toolbar aria-label="Tools" orientation="vertical" variant="outlined">
  <Toolbar.IconButton icon={CursorIcon} aria-label="Select" />
  <Toolbar.IconButton icon={PencilSimpleIcon} aria-label="Draw" />
  <Toolbar.Separator />
  <Toolbar.IconButton icon={TrashIcon} aria-label="Delete" />
</Toolbar>`,

  responsive: `{/* A mobile-first map: a column on a phone, a row from the md breakpoint up */}
<Toolbar aria-label="Actions" variant="outlined" orientation={{ base: "vertical", md: "horizontal" }}>
  <Toolbar.Button>Edit</Toolbar.Button>
  <Toolbar.Button>Share</Toolbar.Button>
</Toolbar>`,

  wrap: `{/* wrap: a horizontal bar that runs out of room wraps its items onto more lines */}
<Toolbar aria-label="Actions" variant="outlined" itemVariant="secondary" wrap>
  <Toolbar.Button>Edit</Toolbar.Button>
  <Toolbar.Button>Share</Toolbar.Button>
  <Toolbar.Button>Export</Toolbar.Button>
  <Toolbar.Button>Archive</Toolbar.Button>
</Toolbar>`,

  disabled: `{/* disabled: every item is disabled, and arrow keys skip them. An item can be disabled on its own too */}
<Toolbar aria-label="Document" variant="outlined" itemVariant="secondary" disabled>
  <Toolbar.Button>Copy</Toolbar.Button>
  <Toolbar.Button>Paste</Toolbar.Button>
</Toolbar>`,

  wrapped: `{/* A tooltip wraps an item as it would a button; Toolbar.Item puts any other single element in the order */}
<Toolbar aria-label="Document" variant="outlined">
  <Tooltip content="Make it bold">
    <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
  </Tooltip>
  <Toolbar.Item>
    <Button variant="ghost" asChild>
      <a href="/docs">Docs</a>
    </Button>
  </Toolbar.Item>
</Toolbar>`,

  rtl: `{/* Pass dir="rtl" so the arrow keys follow the page's direction; the layout mirrors on its own */}
<div dir="rtl">
  <Toolbar aria-label="Text formatting" variant="outlined" dir="rtl">
    <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
    <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
  </Toolbar>
</div>`,

  labelled: `{/* A visible label names the toolbar */}
<span id="format-label">Formatting</span>
<Toolbar aria-labelledby="format-label" variant="outlined">
  <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
  <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
</Toolbar>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ToolbarPlaygroundSnippetArgs {
  variant?: string;
  itemVariant?: string;
  size?: string;
  rounded?: boolean;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  loop?: boolean;
  fullWidth?: boolean;
  wrap?: boolean;
  "aria-label"?: string;
}

const barVariants = ["ghost", "outlined", "filled"] as const;
const itemVariants = ["ghost", "tertiary", "secondary", "primary", "destructive"] as const;
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults,
 * around a small real example. Also serves any story that just changes a few args.
 */
export function toolbarPlaygroundSnippet(args: ToolbarPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Text formatting"}"`];
  if (args.variant && args.variant !== "ghost" && (barVariants as readonly string[]).includes(args.variant)) attributes.push(`variant="${args.variant}"`);
  if (args.itemVariant && args.itemVariant !== "ghost" && (itemVariants as readonly string[]).includes(args.itemVariant)) attributes.push(`itemVariant="${args.itemVariant}"`);
  if (args.size && args.size !== "md" && (sizes as readonly string[]).includes(args.size)) attributes.push(`size="${args.size}"`);
  if (args.rounded === true) attributes.push("rounded");
  if (args.disabled) attributes.push("disabled");
  if (args.orientation === "vertical") attributes.push('orientation="vertical"');
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  if (args.loop === false) attributes.push("loop={false}");
  if (args.fullWidth) attributes.push("fullWidth");
  if (args.wrap) attributes.push("wrap");
  return `{/* Icons come from @dbm-design-system/icons */}
<Toolbar ${attributes.join(" ")}>
  <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
  <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
  <Toolbar.Separator />
  <Toolbar.Button>Link</Toolbar.Button>
</Toolbar>`;
}
