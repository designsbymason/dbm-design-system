// The code shown under each story's "Show code" button on ButtonGroup's Docs page.
//
// Hand-written rather than generated from the rendered story: the generated code spells out every default
// (`attached={true}`, `disabled={false}`) and prints an icon as `{ $$typeof: Symbol(react.forward_ref) … }`.
// Each snippet here is the smallest real usage of what its story shows — only exports of the package, no demo
// scaffolding — and `storySnippets.test.ts` checks that stays true. See `07-storybook-and-documentation-standards.md` §4.2.

export const buttonGroupSnippets = {
  variants: `{/* variant: "primary" (default) | "secondary" | "tertiary" | "ghost" | "destructive"
    Each button keeps its own variant unless the group sets one. */}
<ButtonGroup aria-label="Text alignment" variant="secondary">
  <Button>Left</Button>
  <Button>Centre</Button>
  <Button>Right</Button>
</ButtonGroup>`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — the group's size is every button's default */}
<ButtonGroup aria-label="Zoom" size="sm" variant="secondary">
  <Button>Out</Button>
  <Button>Reset</Button>
  <Button>In</Button>
</ButtonGroup>`,

  spaced: `{/* attached={false} keeps the buttons apart, with a gap, and lets a horizontal row wrap */}
<ButtonGroup aria-label="Actions" attached={false} variant="secondary">
  <Button>Cancel</Button>
  <Button variant="primary">Save</Button>
</ButtonGroup>`,

  vertical: `<ButtonGroup aria-label="View" orientation="vertical" variant="secondary">
  <Button>Day</Button>
  <Button>Week</Button>
  <Button>Month</Button>
</ButtonGroup>`,

  rounded: `{/* rounded: fully rounded ends, and the corners where buttons meet stay square */}
<ButtonGroup aria-label="View" rounded variant="secondary">
  <Button>Day</Button>
  <Button>Week</Button>
  <Button>Month</Button>
</ButtonGroup>`,

  icons: `{/* Icons come from @dbm-design-system/icons: BoldIcon, ItalicIcon, UnderlineIcon */}
<ButtonGroup aria-label="Text style" variant="secondary" size="sm">
  <IconButton icon={BoldIcon} aria-label="Bold" />
  <IconButton icon={ItalicIcon} aria-label="Italic" />
  <IconButton icon={UnderlineIcon} aria-label="Underline" />
</ButtonGroup>

<ButtonGroup aria-label="Editing" variant="secondary">
  <Button leadingIcon={CopyIcon}>Copy</Button>
  <Button leadingIcon={ClipboardIcon}>Paste</Button>
</ButtonGroup>`,

  override: `{/* A button's own props win over the group's: here the last one is destructive and larger */}
<ButtonGroup aria-label="Document" variant="secondary" size="sm">
  <Button>Edit</Button>
  <Button>Share</Button>
  <Button variant="destructive" size="md">Delete</Button>
</ButtonGroup>`,

  fullWidth: `{/* fullWidth: the group fills its container and shares the width equally between its buttons */}
<ButtonGroup aria-label="View" fullWidth variant="secondary">
  <Button>Day</Button>
  <Button>Week</Button>
  <Button>Month</Button>
</ButtonGroup>`,

  responsive: `{/* A mobile-first map: stacked on a phone, in a row from the md breakpoint up */}
<ButtonGroup
  aria-label="Actions"
  orientation={{ base: "vertical", md: "horizontal" }}
  fullWidth
  variant="secondary"
>
  <Button>Edit</Button>
  <Button>Share</Button>
  <Button>Export</Button>
</ButtonGroup>`,

  disabled: `{/* disabled disables every button in the group — including one that says disabled={false} */}
<ButtonGroup aria-label="View" disabled variant="secondary">
  <Button>Day</Button>
  <Button>Week</Button>
  <Button>Month</Button>
</ButtonGroup>

{/* A button that is disabled itself stays disabled in an enabled group */}
<ButtonGroup aria-label="Pages" variant="secondary">
  <Button>Previous</Button>
  <Button disabled>Next</Button>
</ButtonGroup>`,

  wrapped: `{/* A button wrapped for a tooltip, or a link, takes the group's settings too */}
<ButtonGroup aria-label="Document" variant="secondary">
  <Tooltip content="Copy the link">
    <Button>Copy</Button>
  </Tooltip>
  <Button asChild>
    <a href="/docs">Docs</a>
  </Button>
</ButtonGroup>`,

  rtl: `{/* The group follows the page's text direction: wrap it (or the page) in dir="rtl" */}
<div dir="rtl">
  <ButtonGroup aria-label="Text alignment" variant="secondary">
    <Button>Left</Button>
    <Button>Centre</Button>
    <Button>Right</Button>
  </ButtonGroup>
</div>`,

  labelled: `{/* A visible label names the group */}
<span id="align-label">Alignment</span>
<ButtonGroup aria-labelledby="align-label" variant="secondary">
  <Button>Left</Button>
  <Button>Right</Button>
</ButtonGroup>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface ButtonGroupPlaygroundSnippetArgs {
  variant?: string;
  size?: string;
  rounded?: boolean;
  disabled?: boolean;
  attached?: boolean;
  orientation?: "horizontal" | "vertical";
  fullWidth?: boolean;
  /** Storybook only: how many buttons the demo group has. */
  count?: number;
  "aria-label"?: string;
}

const labels = ["Copy", "Paste", "Cut", "Undo", "Redo", "Select"] as const;
const variants = ["primary", "secondary", "tertiary", "ghost", "destructive"] as const;
const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults,
 * around as many buttons as the demo shows. Also serves the stories that just change a few args. A group that
 * sets no variant, size or rounded leaves each button its own defaults, which are `primary`, `md` and not
 * rounded, so those three are written only when they differ.
 */
export function buttonGroupPlaygroundSnippet(args: ButtonGroupPlaygroundSnippetArgs): string {
  const attributes: string[] = [`aria-label="${args["aria-label"] || "Clipboard"}"`];
  if (args.variant && args.variant !== "primary" && (variants as readonly string[]).includes(args.variant)) attributes.push(`variant="${args.variant}"`);
  if (args.size && args.size !== "md" && (sizes as readonly string[]).includes(args.size)) attributes.push(`size="${args.size}"`);
  if (args.rounded === true) attributes.push("rounded");
  if (args.disabled) attributes.push("disabled");
  if (args.attached === false) attributes.push("attached={false}");
  if (args.orientation === "vertical") attributes.push('orientation="vertical"');
  if (args.fullWidth) attributes.push("fullWidth");
  const count = Math.min(Math.max(args.count ?? 3, 1), labels.length);
  const buttons = labels.slice(0, count).map((label) => `  <Button>${label}</Button>`);
  return `<ButtonGroup ${attributes.join(" ")}>\n${buttons.join("\n")}\n</ButtonGroup>`;
}
