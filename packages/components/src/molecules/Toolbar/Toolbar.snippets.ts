// The code shown under each story's "Show code" button on Toolbar's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out every default
// (`loop={true}`, `disabled={false}`), prints an icon as `{ $$typeof: Symbol(react.forward_ref) … }` and drops the
// compound parts. Each snippet is the smallest real usage of what its story shows — only exports of the package, no
// demo scaffolding — and `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

// The bar the stories put under test — three icon buttons, a rule, then a labelled button — written out in each
// snippet so what "Show code" shows is what the story draws.
const demo = (indent = "  ") =>
  [
    '<Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />',
    '<Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />',
    '<Toolbar.IconButton icon={TextUnderlineIcon} aria-label="Underline" />',
    "<Toolbar.Separator />",
    '<Toolbar.Button leadingIcon={LinkIcon}>Link</Toolbar.Button>',
  ]
    .map((line) => indent + line)
    .join("\n");

export const toolbarSnippets = {
  surfaces: `{/* surface: "ghost" (default) | "outlined" | "filled" — how the bar itself is drawn */}
<Toolbar aria-label="ghost bar">
${demo()}
</Toolbar>

<Toolbar aria-label="outlined bar" surface="outlined">
${demo()}
</Toolbar>

<Toolbar aria-label="filled bar" surface="filled">
${demo()}
</Toolbar>`,

  variants: `{/* variant: "ghost" (default) | "tertiary" | "secondary" | "primary" | "destructive" — every item's default look.
    Shown: secondary. */}
<Toolbar aria-label="secondary items" surface="outlined" variant="secondary">
  <Toolbar.Button>Copy</Toolbar.Button>
  <Toolbar.Button>Paste</Toolbar.Button>
  <Toolbar.IconButton icon={TrashIcon} aria-label="Delete" />
</Toolbar>`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — the bar's spacing and every item's default size.
    Shown: sm. */}
<Toolbar aria-label="Size sm" surface="outlined" size="sm">
${demo()}
</Toolbar>`,

  rounded: `{/* rounded: round items, and a pill-shaped bar when the bar is drawn */}
<Toolbar aria-label="Text formatting" surface="outlined" rounded>
${demo()}
</Toolbar>`,

  groups: `{/* Toolbar.Group names a cluster of related items; Toolbar.Separator draws a rule between clusters */}
<Toolbar aria-label="Editor" surface="outlined">
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
<Toolbar aria-label="Document" surface="outlined" variant="secondary" fullWidth>
  <Toolbar.Button>Edit</Toolbar.Button>
  <Toolbar.Button>Share</Toolbar.Button>
  <Toolbar.Spacer />
  <Toolbar.Button variant="primary">Publish</Toolbar.Button>
</Toolbar>`,

  align: `{/* align: "start" (default) | "center" | "end" — where the items sit when the bar has room to spare, so it
    needs fullWidth (or a width of its own). Shown: center, then end. */}
<Toolbar aria-label="align center" surface="outlined" fullWidth align="center">
${demo()}
</Toolbar>

<Toolbar aria-label="align end" surface="outlined" fullWidth align="end">
${demo()}
</Toolbar>`,

  toggles: `{/* A pressed state makes an icon button a toggle. Controlled: pressed + onPressedChange */}
{/* const [bold, setBold] = useState(true); */}
<Toolbar aria-label="Text style" surface="outlined">
  <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" pressed={bold} onPressedChange={setBold} />
  <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" defaultPressed={false} />
</Toolbar>`,

  vertical: `{/* orientation="vertical": up and down move between items */}
<Toolbar aria-label="Tools" orientation="vertical" surface="outlined">
  <Toolbar.IconButton icon={CursorIcon} aria-label="Select" />
  <Toolbar.IconButton icon={PencilSimpleIcon} aria-label="Draw" />
  <Toolbar.Separator />
  <Toolbar.IconButton icon={TrashIcon} aria-label="Delete" />
</Toolbar>`,

  responsive: `{/* A mobile-first map: a column on a phone, a row from the md breakpoint up */}
<Toolbar
  aria-label="Actions"
  surface="outlined"
  variant="secondary"
  orientation={{ base: "vertical", md: "horizontal" }}
>
  <Toolbar.Button>Edit</Toolbar.Button>
  <Toolbar.Button>Share</Toolbar.Button>
</Toolbar>`,

  wrap: `{/* overflow="wrap": a horizontal bar that runs out of room (here, in a container narrower than its items) wraps
    its items onto more lines. "scroll" (default) keeps one line and scrolls it; "visible" lets them overflow */}
<Toolbar aria-label="Actions" surface="outlined" variant="secondary" overflow="wrap">
  <Toolbar.Button>Edit</Toolbar.Button>
  <Toolbar.Button>Share</Toolbar.Button>
  <Toolbar.Button>Export</Toolbar.Button>
  <Toolbar.Button>Archive</Toolbar.Button>
</Toolbar>`,

  scroll: `{/* overflow="scroll" is the default: one line that scrolls (here, in a container narrower than its items), with an
    edge fade and a button at whichever end has more. The arrow keys scroll the focused item into view */}
<Toolbar aria-label="Actions" surface="outlined" variant="secondary">
  <Toolbar.Button>Edit</Toolbar.Button>
  <Toolbar.Button>Share</Toolbar.Button>
  <Toolbar.Button>Export</Toolbar.Button>
  <Toolbar.Button>Archive</Toolbar.Button>
  <Toolbar.Button>Duplicate</Toolbar.Button>
  <Toolbar.Button>Delete</Toolbar.Button>
</Toolbar>`,

  scrollColumn: `{/* A scrolling column needs a height of its own to respond to (here, a container 10rem tall) */}
<Toolbar aria-label="Tools" surface="outlined" orientation="vertical">
  <Toolbar.IconButton icon={CursorIcon} aria-label="Select" />
  <Toolbar.IconButton icon={PencilSimpleIcon} aria-label="Draw" />
  <Toolbar.IconButton icon={TextBIcon} aria-label="Text" />
  <Toolbar.IconButton icon={LinkIcon} aria-label="Link" />
  <Toolbar.IconButton icon={ImageIcon} aria-label="Image" />
  <Toolbar.IconButton icon={TableIcon} aria-label="Table" />
  <Toolbar.IconButton icon={TrashIcon} aria-label="Delete" />
</Toolbar>`,

  sticky: `{/* sticky: the bar stays at the top of the page as it scrolls, with a surface behind it and a shadow while
    stuck. scrollContainerRef names the box that scrolls when it isn't the page (here, a box with a fixed height).
    stickyOffset leaves room for a header that is sticky too. */}
{/* const scrollRef = useRef(null); — and the scrolling box is <div ref={scrollRef} style={{ height: "14rem", overflow: "auto" }}> */}
<Toolbar aria-label="Text formatting" surface="outlined" sticky scrollContainerRef={scrollRef}>
${demo()}
</Toolbar>`,

  attached: `{/* Toolbar.Group attached: the group's buttons fuse into one segmented control, each still in the arrow-key order.
    A group without it keeps its items apart */}
<Toolbar aria-label="Editor" surface="outlined" variant="secondary">
  <Toolbar.Group aria-label="Text style" attached>
    <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
    <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
    <Toolbar.IconButton icon={TextUnderlineIcon} aria-label="Underline" />
  </Toolbar.Group>
  <Toolbar.Separator />
  <Toolbar.Group aria-label="History">
    <Toolbar.IconButton icon={ArrowCounterClockwiseIcon} aria-label="Undo" />
    <Toolbar.IconButton icon={ArrowClockwiseIcon} aria-label="Redo" />
  </Toolbar.Group>
</Toolbar>`,

  toggleGroups: `{/* Toolbar.ToggleGroup: type "multiple" is independent toggles; the default, "single", chooses one of several
    (a radio group). Both stay in the toolbar's arrow-key order, and their size follows the bar's. Their variant is
    "subtle" unless you say "outlined" or "solid" */}
<Toolbar aria-label="Text formatting" surface="outlined">
  <Toolbar.ToggleGroup aria-label="Text style" type="multiple">
    <Toolbar.ToggleItem value="bold" icon={TextBIcon} aria-label="Bold" />
    <Toolbar.ToggleItem value="italic" icon={TextItalicIcon} aria-label="Italic" />
  </Toolbar.ToggleGroup>
  <Toolbar.Separator />
  <Toolbar.ToggleGroup aria-label="Alignment" defaultValue="left">
    <Toolbar.ToggleItem value="left" icon={TextAlignLeftIcon} aria-label="Align left" />
    <Toolbar.ToggleItem value="center" icon={TextAlignCenterIcon} aria-label="Align centre" />
    <Toolbar.ToggleItem value="right" icon={TextAlignRightIcon} aria-label="Align right" />
  </Toolbar.ToggleGroup>
</Toolbar>`,

  tooltips: `{/* tooltip: true shows the aria-label on hover and keyboard focus; any other content is shown instead */}
<Toolbar aria-label="Text formatting" surface="outlined">
  <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" tooltip />
  <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" tooltip />
  <Toolbar.IconButton icon={TextUnderlineIcon} aria-label="Underline" tooltip="Underline (Ctrl+U)" />
</Toolbar>`,

  selectAndPopover: `{/* Toolbar.Item puts a Select, or a popover or menu trigger, into the arrow-key order. Enter or Space opens it,
    Escape (or choosing) gives focus back to it, and the arrow keys carry on along the bar */}
<Toolbar aria-label="Editor" surface="outlined">
  <Toolbar.Item>
    <Select aria-label="Font size" placeholder="Size" size="sm" defaultValue="14">
      <Select.Option value="12">12 pt</Select.Option>
      <Select.Option value="14">14 pt</Select.Option>
      <Select.Option value="18">18 pt</Select.Option>
    </Select>
  </Toolbar.Item>
  <Toolbar.Separator />
  <Popover>
    <Toolbar.Item>
      <Popover.Trigger asChild>
        <Button variant="ghost" leadingIcon={DotsThreeIcon}>
          More
        </Button>
      </Popover.Trigger>
    </Toolbar.Item>
    <Popover.Content aria-label="More options">Extra options live here.</Popover.Content>
  </Popover>
</Toolbar>`,

  disabled: `{/* disabled: every item is disabled, and arrow keys skip them. An item can be disabled on its own too */}
<Toolbar aria-label="Document" surface="outlined" variant="secondary" disabled>
  <Toolbar.Button>Copy</Toolbar.Button>
  <Toolbar.Button>Paste</Toolbar.Button>
</Toolbar>`,

  wrapped: `{/* A tooltip wraps an item as it would a button; Toolbar.Item puts any other single element in the order */}
<Toolbar aria-label="Document" surface="outlined">
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
  <Toolbar aria-label="Text formatting" surface="outlined" dir="rtl">
${demo("    ")}
  </Toolbar>
</div>`,

  labelled: `{/* A visible label names the toolbar */}
<span id="toolbar-demo-label">Formatting</span>
<Toolbar aria-labelledby="toolbar-demo-label" surface="outlined">
${demo()}
</Toolbar>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ToolbarPlaygroundSnippetArgs {
  surface?: string;
  variant?: string;
  size?: string;
  rounded?: boolean;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  loop?: boolean;
  fullWidth?: boolean;
  align?: string;
  overflow?: string;
  "aria-label"?: string;
}

const barSurfaces = ["ghost", "outlined", "filled"] as const;
const variants = ["ghost", "tertiary", "secondary", "primary", "destructive"] as const;
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults,
 * around a small real example. Also serves any story that just changes a few args.
 */
export function toolbarPlaygroundSnippet(args: ToolbarPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Text formatting"}"`];
  if (args.surface && args.surface !== "ghost" && (barSurfaces as readonly string[]).includes(args.surface)) attributes.push(`surface="${args.surface}"`);
  if (args.variant && args.variant !== "ghost" && (variants as readonly string[]).includes(args.variant)) attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md" && (sizes as readonly string[]).includes(args.size)) attributes.push(`size="${args.size}"`);
  if (args.rounded === true) attributes.push("rounded");
  if (args.disabled) attributes.push("disabled");
  if (args.orientation === "vertical") attributes.push('orientation="vertical"');
  if (args.dir === "rtl") attributes.push('dir="rtl"');
  if (args.loop === false) attributes.push("loop={false}");
  if (args.fullWidth) attributes.push("fullWidth");
  if (args.align === "center" || args.align === "end") attributes.push(`align="${args.align}"`);
  // "scroll" is the default, so only the other two are written
  if (args.overflow === "wrap" || args.overflow === "visible") attributes.push(`overflow="${args.overflow}"`);
  return `{/* Icons come from @dbm-design-system/icons */}
<Toolbar ${attributes.join(" ")}>
  <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
  <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
  <Toolbar.IconButton icon={TextUnderlineIcon} aria-label="Underline" />
  <Toolbar.Separator />
  <Toolbar.Button leadingIcon={LinkIcon}>Link</Toolbar.Button>
</Toolbar>`;
}
