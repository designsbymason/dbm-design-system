import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover } from "./Popover";

// Docs-only — see PopoverTrigger.stories.tsx's own comment for the full
// rationale (guidelines/adr/0013). Rendered with the popover already open
// (`defaultOpen`, a single instance — see Popover.stories.tsx's own
// "AllSides" comment for why several *simultaneous* pre-opened instances
// would be unsafe, which doesn't apply here) so `Popover.Content` actually
// mounts for this story's own screenshot/reference purposes, even though
// this table's own argTypes come from static docgen, not the live render.
const meta: Meta<typeof Popover.Content> = {
  title: "Molecules/Overlay/Popover/Content",
  component: Popover.Content,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: "text",
      description: "The popover's own content.",
    },
    side: {
      control: "select",
      options: ["top", "right", "bottom", "left"],
      description:
        "Which side of the trigger the content renders on. Radix repositions it automatically to stay within the viewport if the requested side would overflow.",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Alignment along the chosen side.",
    },
    sideOffset: {
      control: "number",
      description: "Pixel gap between the trigger and the content along side.",
    },
    alignOffset: {
      control: "number",
      description: "Pixel offset along align's own axis.",
    },
    avoidCollisions: {
      control: "boolean",
      description:
        "Whether the content repositions itself to stay within the viewport instead of overflowing it.",
    },
    collisionPadding: {
      control: "number",
      description:
        "Minimum distance, in pixels, kept between the content and the edge of the viewport while repositioning to avoid a collision.",
    },
    hideArrow: {
      control: "boolean",
      description: "Hides the small pointer arrow connecting the content to its trigger.",
    },
    showCloseButton: {
      control: "boolean",
      description:
        "Shows a CloseButton in the content's own top-end corner, in addition to the default outside-click/Escape dismissal.",
    },
    container: {
      control: false,
      description:
        "Renders the content into a different DOM node than document.body (Radix's own default).",
    },
    "aria-label": {
      control: "text",
      description:
        "Accessible name for this role=\"dialog\" element — required unless aria-labelledby points at an already-visible heading inside the content.",
    },
    "aria-labelledby": {
      control: false,
      description:
        "Points to the id of an existing, already-visible element (e.g. a heading inside the content) to use as the accessible name instead of aria-label.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id, applied to the content element. Also what the trigger's own aria-controls points at while open.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    children: "Popover content",
    side: "bottom",
    align: "center",
  },
};

export default meta;

type Story = StoryObj<typeof Popover.Content>;

export const Default: Story = {
  render: (args) => (
    <Popover defaultOpen>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Content aria-label="Example popover" {...args} />
    </Popover>
  ),
};
