import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  CursorIcon,
  LinkIcon,
  PencilSimpleIcon,
  TextBIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  TrashIcon,
} from "@dbm-design-system/icons";
import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Tooltip } from "../../atoms/Tooltip";
import { Toolbar } from "./Toolbar";
import { toolbarPlaygroundSnippet, toolbarSnippets } from "./Toolbar.snippets";
import type { ToolbarProps } from "./Toolbar.types";

const noControls = { control: false } as const;
const column = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-5)", alignItems: "flex-start" } as const;

// A small bar to put under test: bold, italic, a rule, then a labelled button.
const DemoItems = () => (
  <>
    <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
    <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
    <Toolbar.IconButton icon={TextUnderlineIcon} aria-label="Underline" />
    <Toolbar.Separator />
    <Toolbar.Button leadingIcon={LinkIcon}>Link</Toolbar.Button>
  </>
);

const meta: Meta<ToolbarProps> = {
  title: "Molecules/Inputs/Toolbar",
  component: Toolbar,
  parameters: { layout: "padded" },
  // Core visual props first, then behavioral/state props, then advanced/escape-hatch props last — the same
  // sequencing as every other component's stories file (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    variant: {
      control: "select",
      options: ["ghost", "outlined", "filled"],
      description: "How the bar itself is drawn: ghost (no surface of its own), outlined (a bordered bar) or filled (a tinted bar).",
      table: { defaultValue: { summary: "ghost" } },
    },
    itemVariant: {
      control: "select",
      options: ["ghost", "tertiary", "secondary", "primary", "destructive"],
      description: "The visual style every Toolbar.Button and Toolbar.IconButton uses unless it sets its own variant.",
      table: { defaultValue: { summary: "ghost" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "The size of the bar's padding and gaps and the default size of every item.",
      table: { defaultValue: { summary: "md" } },
    },
    rounded: {
      control: "boolean",
      description: "Fully rounded items, and a pill-shaped bar when variant draws one. Also the default for each item's own rounded.",
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      control: "boolean",
      description: "Disables every item in the toolbar. A disabled item can't be focused, so arrow keys skip it.",
      table: { defaultValue: { summary: "false" } },
    },
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
      description:
        "Lays the items out in a row or a column; the arrow keys that move between items follow it. Also takes a mobile-first map keyed by breakpoint ({ base: \"vertical\", md: \"horizontal\" }).",
      table: { defaultValue: { summary: "horizontal" } },
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "The reading direction, which decides which arrow key goes forwards in a row. Not read from the page.",
      table: { defaultValue: { summary: "ltr" } },
    },
    loop: {
      control: "boolean",
      description: "Whether the arrow keys wrap from the last item to the first, and back.",
      table: { defaultValue: { summary: "true" } },
    },
    fullWidth: {
      control: "boolean",
      description:
        "Stretches the bar to the width of its container. A bar is as wide as its items otherwise, so a Toolbar.Spacer has nothing to take up until the bar is given more room than its items need.",
      table: { defaultValue: { summary: "false" } },
    },
    wrap: {
      control: "boolean",
      description: "Lets a horizontal bar wrap its items onto more lines when they don't fit. Off, a bar wider than its container overflows it.",
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      ...noControls,
      description:
        "The toolbar's contents: Toolbar.Button, Toolbar.IconButton, Toolbar.Item, Toolbar.Group, Toolbar.Separator and Toolbar.Spacer.",
    },
    "aria-label": {
      control: "text",
      description:
        "Names the toolbar for assistive tech (\"Text formatting\") — announced when focus enters it. Required unless aria-labelledby points at a visible label.",
    },
    "aria-labelledby": { ...noControls, description: "The id of an already-visible element that names the toolbar, in place of aria-label." },
    "aria-describedby": { ...noControls, description: "The id of a helper text or description for the toolbar." },
    id: { ...noControls, description: "Standard DOM id." },
    className: { ...noControls, description: "Additional CSS classes for customization." },
    style: { ...noControls, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { ...noControls, description: "Test identifier for automated testing, on the toolbar's element." },
  },
  // Every controllable prop gets an explicit value here, matching its real default.
  args: {
    variant: "ghost",
    itemVariant: "ghost",
    size: "md",
    rounded: false,
    disabled: false,
    orientation: "horizontal",
    dir: "ltr",
    loop: true,
    fullWidth: false,
    wrap: false,
    "aria-label": "Text formatting",
  },
  render: (args) => (
    <Toolbar {...args}>
      <DemoItems />
    </Toolbar>
  ),
};

export default meta;

type Story = StoryObj<ToolbarProps>;

const playgroundSource = {
  docs: {
    source: {
      type: "dynamic" as const,
      transform: (_code: string, context: StoryContext) => toolbarPlaygroundSnippet(context.args),
    },
  },
};

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {
  // A ghost bar has no edge of its own, so the Playground starts drawn to be visible.
  args: { variant: "outlined" },
  parameters: playgroundSource,
};

export const Variants: Story = {
  name: "Bar variants",
  parameters: { docs: { source: { code: toolbarSnippets.variants } } },
  argTypes: { variant: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={column}>
      {(["ghost", "outlined", "filled"] as const).map((variant) => (
        <Toolbar key={variant} {...args} variant={variant} aria-label={`${variant} bar`}>
          <DemoItems />
        </Toolbar>
      ))}
    </div>
  ),
};

export const ItemVariants: Story = {
  name: "Item variants",
  parameters: { docs: { source: { code: toolbarSnippets.itemVariants } } },
  args: { variant: "outlined" },
  argTypes: { itemVariant: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={column}>
      {(["ghost", "tertiary", "secondary", "primary", "destructive"] as const).map((itemVariant) => (
        <Toolbar key={itemVariant} {...args} itemVariant={itemVariant} aria-label={`${itemVariant} items`}>
          <Toolbar.Button>Copy</Toolbar.Button>
          <Toolbar.Button>Paste</Toolbar.Button>
          <Toolbar.IconButton icon={TrashIcon} aria-label="Delete" />
        </Toolbar>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  parameters: { docs: { source: { code: toolbarSnippets.sizes } } },
  args: { variant: "outlined" },
  argTypes: { size: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={column}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Toolbar key={size} {...args} size={size} aria-label={`Size ${size}`}>
          <DemoItems />
        </Toolbar>
      ))}
    </div>
  ),
};

export const Rounded: Story = {
  parameters: { docs: { source: { code: toolbarSnippets.rounded } } },
  args: { rounded: true, variant: "outlined" },
  argTypes: { rounded: noControls },
  render: (args) => (
    <Toolbar {...args}>
      <DemoItems />
    </Toolbar>
  ),
};

export const Groups: Story = {
  name: "Groups and separators",
  parameters: { docs: { source: { code: toolbarSnippets.groups } } },
  args: { variant: "outlined", "aria-label": "Editor" },
  argTypes: { "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.Group aria-label="Text style">
        <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
        <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
      </Toolbar.Group>
      <Toolbar.Separator />
      <Toolbar.Group aria-label="History">
        <Toolbar.IconButton icon={ArrowCounterClockwiseIcon} aria-label="Undo" />
        <Toolbar.IconButton icon={ArrowClockwiseIcon} aria-label="Redo" />
      </Toolbar.Group>
    </Toolbar>
  ),
};

export const WithSpacer: Story = {
  name: "With a spacer",
  parameters: { docs: { source: { code: toolbarSnippets.spacer } } },
  args: { variant: "outlined", itemVariant: "secondary", fullWidth: true, "aria-label": "Document" },
  argTypes: { itemVariant: noControls, fullWidth: noControls, "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.Button>Edit</Toolbar.Button>
      <Toolbar.Button>Share</Toolbar.Button>
      <Toolbar.Spacer />
      <Toolbar.Button variant="primary">Publish</Toolbar.Button>
    </Toolbar>
  ),
};

export const Toggles: Story = {
  name: "Toggle buttons",
  parameters: { docs: { source: { code: toolbarSnippets.toggles } } },
  args: { variant: "outlined", "aria-label": "Text style" },
  argTypes: { "aria-label": noControls },
  render: function Render(args) {
    const [bold, setBold] = useState(true);
    return (
      <Toolbar {...args}>
        <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" pressed={bold} onPressedChange={setBold} />
        <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" defaultPressed={false} />
      </Toolbar>
    );
  },
};

export const Vertical: Story = {
  parameters: { docs: { source: { code: toolbarSnippets.vertical } } },
  args: { orientation: "vertical", variant: "outlined", "aria-label": "Tools" },
  argTypes: { orientation: noControls, "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.IconButton icon={CursorIcon} aria-label="Select" />
      <Toolbar.IconButton icon={PencilSimpleIcon} aria-label="Draw" />
      <Toolbar.Separator />
      <Toolbar.IconButton icon={TrashIcon} aria-label="Delete" />
    </Toolbar>
  ),
};

export const ResponsiveOrientation: Story = {
  name: "A column on a phone, a row from md up",
  parameters: { docs: { source: { code: toolbarSnippets.responsive } } },
  args: { variant: "outlined", itemVariant: "secondary", orientation: { base: "vertical", md: "horizontal" }, "aria-label": "Actions" },
  argTypes: { orientation: noControls, itemVariant: noControls, "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.Button>Edit</Toolbar.Button>
      <Toolbar.Button>Share</Toolbar.Button>
    </Toolbar>
  ),
};

export const Wrapping: Story = {
  name: "Wrapping onto more lines",
  parameters: { docs: { source: { code: toolbarSnippets.wrap } } },
  args: { wrap: true, variant: "outlined", itemVariant: "secondary", "aria-label": "Actions" },
  argTypes: { wrap: noControls, itemVariant: noControls, "aria-label": noControls },
  render: (args) => (
    <div style={{ maxWidth: "16rem" }}>
      <Toolbar {...args}>
        <Toolbar.Button>Edit</Toolbar.Button>
        <Toolbar.Button>Share</Toolbar.Button>
        <Toolbar.Button>Export</Toolbar.Button>
        <Toolbar.Button>Archive</Toolbar.Button>
      </Toolbar>
    </div>
  ),
};

export const Disabled: Story = {
  parameters: { docs: { source: { code: toolbarSnippets.disabled } } },
  args: { disabled: true, variant: "outlined", itemVariant: "secondary", "aria-label": "Document" },
  argTypes: { disabled: noControls, itemVariant: noControls, "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.Button>Copy</Toolbar.Button>
      <Toolbar.Button>Paste</Toolbar.Button>
    </Toolbar>
  ),
};

export const Wrapped: Story = {
  name: "Wrapped in a tooltip, or a link",
  parameters: { docs: { source: { code: toolbarSnippets.wrapped } } },
  args: { variant: "outlined", "aria-label": "Document" },
  argTypes: { "aria-label": noControls },
  render: (args) => (
    <Toolbar {...args}>
      <Tooltip content="Make it bold">
        <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" />
      </Tooltip>
      <Toolbar.Item>
        <Button variant="ghost" asChild>
          <a href="/docs" onClick={(event) => event.preventDefault()}>
            Docs
          </a>
        </Button>
      </Toolbar.Item>
    </Toolbar>
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  parameters: { docs: { source: { code: toolbarSnippets.rtl } } },
  args: { dir: "rtl", variant: "outlined" },
  argTypes: { dir: noControls },
  render: (args) => (
    <div dir="rtl">
      <Toolbar {...args}>
        <DemoItems />
      </Toolbar>
    </div>
  ),
};

export const LabelledBy: Story = {
  name: "Named by a visible label",
  parameters: { docs: { source: { code: toolbarSnippets.labelled } } },
  args: { variant: "outlined" },
  argTypes: { "aria-label": noControls },
  render: ({ "aria-label": _label, ...args }) => (
    <div style={column}>
      <span id="toolbar-demo-label">Formatting</span>
      <Toolbar {...args} aria-labelledby="toolbar-demo-label">
        <DemoItems />
      </Toolbar>
    </div>
  ),
};

// ---- Hidden real-browser checks (07-storybook-and-documentation-standards.md §5): what jsdom can't evaluate. ----

const hidden = { tags: ["!dev"], argTypes: { variant: noControls } } satisfies Partial<Story>;

const Items = ({ count = 3 }: { count?: number }) => (
  <>
    {["Bold", "Italic", "Underline"].slice(0, count).map((label, index) => (
      <Toolbar.IconButton key={label} icon={[TextBIcon, TextItalicIcon, TextUnderlineIcon][index]!} aria-label={label} />
    ))}
  </>
);

export const KeyboardInteraction: Story = {
  ...hidden,
  name: "Keyboard — interaction test",
  args: { variant: "outlined" },
  render: (args) => (
    <>
      <button>before</button>
      <Toolbar {...args}>
        <Items />
      </Toolbar>
      <button>after</button>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.tab();
    const bold = canvas.getByRole("button", { name: "Bold" });
    await expect(bold).toHaveFocus();
    // The focus ring is drawn on real keyboard focus (jsdom can't evaluate `:focus-visible`).
    await expect(bold.matches(":focus-visible")).toBe(true);
    await expect(getComputedStyle(bold).outlineStyle).not.toBe("none");
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("button", { name: "Italic" })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "after" })).toHaveFocus();
  },
};

export const RightToLeftInteraction: Story = {
  ...hidden,
  name: "Right to left — interaction test",
  args: { dir: "rtl", variant: "outlined" },
  render: (args) => (
    <div dir="rtl">
      <Toolbar {...args}>
        <Items />
      </Toolbar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [bold, italic] = [canvas.getByRole("button", { name: "Bold" }), canvas.getByRole("button", { name: "Italic" })];
    // First item sits at the right in a right-to-left page, and the arrow that points left goes forwards.
    await expect(bold.getBoundingClientRect().left).toBeGreaterThan(italic.getBoundingClientRect().left);
    await userEvent.tab();
    await expect(bold).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(italic).toHaveFocus();
  },
};

export const LayoutInteraction: Story = {
  ...hidden,
  name: "Layout — interaction test",
  args: { variant: "outlined", itemVariant: "secondary", fullWidth: true },
  render: (args) => (
    <div style={{ width: "30rem" }}>
      <Toolbar {...args} data-testid="bar">
        <Toolbar.Button>Edit</Toolbar.Button>
        <Toolbar.Separator data-testid="rule" />
        <Toolbar.Button>Share</Toolbar.Button>
        <Toolbar.Spacer />
        <Toolbar.Button variant="primary">Publish</Toolbar.Button>
      </Toolbar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByTestId("bar").getBoundingClientRect();
    const publish = canvas.getByRole("button", { name: "Publish" }).getBoundingClientRect();
    const share = canvas.getByRole("button", { name: "Share" }).getBoundingClientRect();
    // The spacer pushes Publish to the far end of the bar (its padding and border aside), away from Share.
    await expect(bar.right - publish.right).toBeLessThan(20);
    await expect(publish.left - share.right).toBeGreaterThan(40);
    // The rule is a visible vertical line between the two buttons, not collapsed to nothing.
    const rule = canvas.getByTestId("rule").getBoundingClientRect();
    await expect(rule.width).toBeGreaterThan(0);
    await expect(rule.width).toBeLessThan(4);
    await expect(rule.height).toBeGreaterThan(16);
  },
};

export const TargetSizeInteraction: Story = {
  ...hidden,
  name: "Target size — interaction test",
  args: { variant: "outlined" },
  render: (args) => (
    <div style={column}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Toolbar key={size} {...args} size={size} aria-label={`Size ${size}`}>
          <Items />
          <Toolbar.Button>Link</Toolbar.Button>
        </Toolbar>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    // WCAG 2.5.8: every item is at least 24 × 24 CSS pixels, at every size.
    for (const button of within(canvasElement).getAllByRole("button")) {
      const { width, height } = button.getBoundingClientRect();
      await expect(width).toBeGreaterThanOrEqual(24);
      await expect(height).toBeGreaterThanOrEqual(24);
    }
  },
};

export const VerticalInteraction: Story = {
  ...hidden,
  name: "Vertical — interaction test",
  args: { variant: "outlined", orientation: "vertical" },
  render: (args) => (
    <Toolbar {...args} aria-label="Tools">
      <Items />
      <Toolbar.Separator data-testid="rule" />
      <Toolbar.IconButton icon={TrashIcon} aria-label="Delete" />
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bold = canvas.getByRole("button", { name: "Bold" }).getBoundingClientRect();
    const italic = canvas.getByRole("button", { name: "Italic" }).getBoundingClientRect();
    await expect(italic.top).toBeGreaterThan(bold.top);
    const rule = canvas.getByTestId("rule").getBoundingClientRect();
    await expect(rule.height).toBeLessThan(4);
    await expect(rule.width).toBeGreaterThan(16);
  },
};

export const PhoneInteraction: Story = {
  ...hidden,
  name: "On a phone — interaction test",
  globals: { viewport: { value: "mobile1", isRotated: false } },
  args: { variant: "outlined", orientation: { base: "vertical", md: "horizontal" } },
  render: (args) => (
    <Toolbar {...args} aria-label="Actions">
      <Toolbar.Button>Edit</Toolbar.Button>
      <Toolbar.Button>Share</Toolbar.Button>
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeLessThan(768);
    const bar = within(canvasElement).getByRole("toolbar");
    await waitFor(() => expect(bar).toHaveAttribute("aria-orientation", "vertical"));
    await expect(getComputedStyle(bar).flexDirection).toBe("column");
  },
};

export const ForcedColoursInteraction: Story = {
  ...hidden,
  name: "Pressed and separator, themes — interaction test",
  args: { variant: "filled" },
  render: (args) => (
    <Toolbar {...args}>
      <Toolbar.IconButton icon={TextBIcon} aria-label="Bold" defaultPressed />
      <Toolbar.Separator data-testid="rule" />
      <Toolbar.IconButton icon={TextItalicIcon} aria-label="Italic" />
    </Toolbar>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // A pressed toggle is announced, not only coloured.
    await expect(canvas.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
    await expect(getComputedStyle(canvas.getByTestId("rule")).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  },
};
