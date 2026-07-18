import { TrashIcon, WalletIcon } from "@dbm-design-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Atoms/Core/Button",
  component: Button,
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
    },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
  args: {
    children: "Button",
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const AllVariants: Story = {
  name: "All variants",
  render: () => (
    <div style={{ display: "flex", gap: "1rem" }}>
      {(["primary", "secondary", "tertiary", "ghost", "destructive"] as const).map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Button key={size} size={size}>
          Size {size}
        </Button>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  name: "Leading and trailing icons",
  render: () => (
    <div style={{ display: "flex", gap: "1rem" }}>
      <Button icon={WalletIcon}>Pay</Button>
      <Button trailingIcon={WalletIcon}>Pay</Button>
      <Button variant="destructive" icon={TrashIcon}>
        Delete
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  name: "Loading state",
  args: { isLoading: true, children: "Saving" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const AsChild: Story = {
  name: "asChild (renders as an anchor)",
  render: () => (
    <Button asChild>
      <a href="/next">Continue as a link</a>
    </Button>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (does not shrink illegibly)",
  parameters: { chromatic: { viewports: [375] } },
  args: { size: "lg", children: "A button with a longer label" },
};
