import { TrashIcon } from "@dbm-design-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Tooltip } from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Atoms/Overlay/Tooltip",
  component: Tooltip,
  parameters: { layout: "padded" },
  argTypes: {
    side: { control: "select", options: ["top", "right", "bottom", "left"] },
    align: { control: "select", options: ["start", "center", "end"] },
  },
  args: {
    content: "Save your changes",
  },
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button>Save</Button>
    </Tooltip>
  ),
};

export const Sides: Story = {
  name: "All sides",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-8)", padding: "var(--dbm-space-12)" }}>
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side} content={`Side: ${side}`} side={side}>
          <Button variant="secondary">{side}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const IconTrigger: Story = {
  name: "Icon-only trigger",
  render: () => (
    <Tooltip content="Delete item">
      <IconButton icon={TrashIcon} aria-label="Delete" variant="destructive" />
    </Tooltip>
  ),
};
