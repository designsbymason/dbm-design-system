import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { Card } from "../Card";
import { ScrollArea } from "./ScrollArea";
import { scrollAreaPlaygroundSnippet, scrollAreaSnippets } from "./ScrollArea.snippets";

const activityItems = [
  "Signed in from a new device",
  "Password changed",
  "Email address verified",
  "Two-factor authentication enabled",
  "Signed in from a new device",
  "Profile photo updated",
  "Connected a new billing method",
  "Signed out of all other sessions",
];

function DemoList() {
  return (
    <>
      {activityItems.map((item, index) => (
        <p key={index} style={{ margin: 0, padding: "var(--dbm-space-2) 0" }}>
          {item}
        </p>
      ))}
    </>
  );
}

function DemoWideTall() {
  return (
    <div style={{ width: "40rem" }}>
      {activityItems.map((item, index) => (
        <p key={index} style={{ margin: 0, padding: "var(--dbm-space-2) 0", whiteSpace: "nowrap" }}>
          {item} — wide enough, and there are enough lines, to overflow both directions
        </p>
      ))}
    </div>
  );
}

const meta: Meta<typeof ScrollArea> = {
  title: "Molecules/Layout/ScrollArea",
  component: ScrollArea,
  parameters: { layout: "padded" },
  // Content prop first, then core visual props, then behavioral/state props, then
  // advanced/escape-hatch props last (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    children: { control: false, description: "The content to make scrollable." },
    variant: {
      control: "select",
      options: ["bordered", "ghost"],
      description: "The region's own outer frame.",
      table: { defaultValue: { summary: "bordered" } },
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Scrollbar track/thumb thickness.",
      table: { defaultValue: { summary: "md" } },
    },
    scrollbars: {
      control: "select",
      options: ["vertical", "horizontal", "both"],
      description: "Which scrollbar(s) to render, and which axis (or axes) actually scroll.",
      table: { defaultValue: { summary: "vertical" } },
    },
    scrollbarVisibility: {
      control: "select",
      options: ["auto", "always", "scroll", "hover"],
      description: "When the scrollbar(s) are visible.",
      table: { defaultValue: { summary: "hover" } },
    },
    scrollHideDelay: {
      control: "number",
      description:
        "How long, in milliseconds, a scrollbar stays visible after the pointer leaves or scrolling stops. Only meaningful for \"hover\"/\"scroll\".",
      table: { defaultValue: { summary: "600" } },
    },
    maxHeight: {
      control: "text",
      description: "A shortcut for constraining the region's own block-axis size.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description: "Text direction, passed to the underlying Radix primitive and defaulted.",
      table: { defaultValue: { summary: "ltr" } },
    },
    onScroll: { control: false, description: "Fires on the actual scrolling element, not the outer frame." },
    viewportRef: { control: false, description: "A ref to the actual scrolling element." },
    "aria-label": { control: "text", description: "Accessible name for the scrollable region." },
    "aria-labelledby": { control: false, description: "Points to an existing element's id to use as the accessible name instead." },
    id: { control: false, description: "Standard DOM id, applied to the region's own outer frame." },
    className: { control: false, description: "Additional CSS classes for customization. Applies to the outer frame." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": { control: false, description: "Test identifier for automated testing." },
  },
  args: {
    variant: "bordered",
    size: "md",
    scrollbars: "vertical",
    scrollbarVisibility: "hover",
    scrollHideDelay: 600,
    maxHeight: "12rem",
    dir: "ltr",
  },
};

export default meta;

type Story = StoryObj<typeof ScrollArea>;

export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => scrollAreaPlaygroundSnippet(context.args),
      },
    },
  },
  render: (args) => (
    <ScrollArea {...args} style={args.scrollbars === "both" ? { maxWidth: "20rem" } : undefined}>
      {args.scrollbars === "both" ? <DemoWideTall /> : <DemoList />}
    </ScrollArea>
  ),
};

export const Vertical: Story = {
  name: "Vertical (default)",
  parameters: { docs: { source: { code: scrollAreaSnippets.vertical } } },
  argTypes: { scrollbars: { control: false }, maxHeight: { control: false } },
  render: (args) => (
    <ScrollArea {...args} scrollbars="vertical">
      <DemoList />
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  name: "Horizontal",
  parameters: { docs: { source: { code: scrollAreaSnippets.horizontal } } },
  argTypes: { scrollbars: { control: false }, maxHeight: { control: false } },
  args: { maxHeight: undefined },
  render: (args) => (
    <ScrollArea {...args} scrollbars="horizontal" style={{ maxWidth: "20rem" }}>
      <div style={{ display: "flex", gap: "var(--dbm-space-4)", width: "max-content" }}>
        {activityItems.map((item, index) => (
          <p key={index} style={{ margin: 0, whiteSpace: "nowrap" }}>
            {item}
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Both: Story = {
  name: "Both axes",
  parameters: { docs: { source: { code: scrollAreaSnippets.both } } },
  argTypes: { scrollbars: { control: false } },
  render: (args) => (
    <ScrollArea {...args} scrollbars="both" style={{ maxWidth: "20rem" }}>
      <DemoWideTall />
    </ScrollArea>
  ),
};

export const Ghost: Story = {
  name: "Ghost variant, embedded in a Card",
  parameters: { docs: { source: { code: scrollAreaSnippets.ghost } } },
  argTypes: { variant: { control: false } },
  render: (args) => (
    <Card style={{ maxWidth: "20rem" }}>
      <Card.Body>
        <ScrollArea {...args} variant="ghost" style={{ maxHeight: "10rem" }}>
          <DemoList />
        </ScrollArea>
      </Card.Body>
    </Card>
  ),
};

export const Sizes: Story = {
  parameters: { docs: { source: { code: scrollAreaSnippets.sizes } } },
  argTypes: {
    size: { control: false },
    scrollbarVisibility: { control: false },
    maxHeight: { control: false },
  },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-6)", flexWrap: "wrap" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size} style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
          <span style={{ fontSize: "var(--dbm-font-size-xs)", color: "var(--dbm-text-tertiary)" }}>{size}</span>
          <ScrollArea {...args} size={size} scrollbarVisibility="always" style={{ maxHeight: "8rem", width: "10rem" }}>
            <DemoList />
          </ScrollArea>
        </div>
      ))}
    </div>
  ),
};

export const KeyboardScrollInteraction: Story = {
  name: "Overflowing content is a focusable, genuinely scrollable region — interaction test",
  tags: ["!dev"],
  args: { "aria-label": "Recent activity" },
  render: (args) => (
    <ScrollArea {...args} data-testid="scroll-area">
      <DemoList />
    </ScrollArea>
  ),
  // Doesn't assert that a simulated keypress actually moves `scrollTop`: confirmed live (against
  // both this component and a plain, unrelated `tabindex="0"; overflow: scroll` div in the same
  // browser) that this automated environment's synthetic key events don't trigger the browser's
  // own native default-action scrolling, even once genuinely focused — the same reason `Table`'s
  // own scroll-container tests never assert it either. A real user's Page Down/arrow keys do
  // scroll a focused, overflowing region; what's provable here is that it's reachable (tabindex),
  // focusable, and genuinely overflows (scrollHeight > clientHeight) — and that scrollTop, once
  // set, actually moves the content, proving the element really is the scrolling one.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole("region", { name: "Recent activity" });
    expect(region).toHaveAttribute("tabindex", "0");
    region.focus();
    expect(region).toHaveFocus();
    expect(region.scrollHeight).toBeGreaterThan(region.clientHeight);
    region.scrollTop = 50;
    expect(region.scrollTop).toBe(50);
  },
};

export const FitsNoTabStopInteraction: Story = {
  name: "Content that fits is not a keyboard tab stop — interaction test",
  tags: ["!dev"],
  render: (args) => (
    <ScrollArea {...args} maxHeight="20rem" data-testid="scroll-area">
      <p>Short content that fits comfortably.</p>
    </ScrollArea>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId("scroll-area");
    const viewport = frame.querySelector("[data-radix-scroll-area-viewport]");
    expect(viewport).not.toHaveAttribute("tabindex");
    expect(viewport).not.toHaveAttribute("role");
  },
};
