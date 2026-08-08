import { HeartIcon, TrashIcon } from "@dbm-design-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "./IconButton";

const meta: Meta<typeof IconButton> = {
  title: "Atoms/Inputs/IconButton",
  component: IconButton,
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
    },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
  args: {
    icon: HeartIcon,
    "aria-label": "Favorite",
  },
};

export default meta;

type Story = StoryObj<typeof IconButton>;

export const Default: Story = {};

export const AllVariants: Story = {
  name: "All variants",
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
      {(
        ["primary", "secondary", "tertiary", "ghost", "destructive"] as const
      ).map((variant) => (
        <IconButton
          key={variant}
          icon={TrashIcon}
          aria-label={`${variant} delete`}
          variant={variant}
        />
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <IconButton
          key={size}
          icon={HeartIcon}
          aria-label={`Favorite (${size})`}
          size={size}
        />
      ))}
    </div>
  ),
};

export const Loading: Story = {
  name: "Loading state",
  args: { isLoading: true },
};

export const LoadingWithLoadingLabel: Story = {
  name: "Loading state with loadingLabel",
  args: { isLoading: true, loadingLabel: "Favoriting…" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Rounded: Story = {
  name: "Rounded (circular)",
  args: { rounded: true },
};

export const AsChild: Story = {
  name: "asChild (renders as an anchor)",
  render: () => (
    <IconButton asChild icon={HeartIcon} aria-label="Favorite">
      <a href="/favorite">
        <HeartIcon />
      </a>
    </IconButton>
  ),
};

export const AsChildDisabled: Story = {
  name: "asChild + disabled (aria-disabled, click blocked)",
  render: () => (
    <IconButton asChild icon={HeartIcon} aria-label="Favorite" disabled>
      <a href="/favorite">
        <HeartIcon />
      </a>
    </IconButton>
  ),
};
