import { HeartIcon, WalletIcon } from "@dbm-design-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "./Icon";

const meta: Meta<typeof Icon> = {
  title: "Atoms/Media/Icon",
  component: Icon,
  parameters: { layout: "padded" },
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"],
    },
    weight: {
      control: "select",
      options: ["thin", "light", "regular", "bold", "fill", "duotone"],
    },
    tone: {
      control: "select",
      options: ["default", "secondary", "brand", "disabled"],
    },
  },
  args: {
    icon: WalletIcon,
  },
};

export default meta;

type Story = StoryObj<typeof Icon>;

export const Default: Story = {};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      {(["xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const).map((size) => (
        <Icon key={size} icon={WalletIcon} size={size} tone="brand" />
      ))}
    </div>
  ),
};

export const AllWeights: Story = {
  name: "All weights",
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      {(["thin", "light", "regular", "bold", "fill", "duotone"] as const).map(
        (weight) => (
          <Icon
            key={weight}
            icon={HeartIcon}
            weight={weight}
            size="lg"
            tone="brand"
          />
        ),
      )}
    </div>
  ),
};

export const AllTones: Story = {
  name: "All tones",
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      {(["default", "secondary", "brand", "disabled"] as const).map((tone) => (
        <Icon key={tone} icon={HeartIcon} size="lg" tone={tone} />
      ))}
    </div>
  ),
};

export const Labeled: Story = {
  name: "With accessible label (role=img)",
  args: { icon: HeartIcon, label: "Favorite" },
};
