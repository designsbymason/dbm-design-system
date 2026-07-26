import { MoonIcon, SunIcon } from "@dbm-design-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./Switch";

const meta: Meta<typeof Switch> = {
  title: "Atoms/Core/Switch",
  component: Switch,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
  args: {
    children: "Email notifications",
  },
};

export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Switch key={size} size={size} defaultChecked>
          Size {size}
        </Switch>
      ))}
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <Switch>Off</Switch>
      <Switch defaultChecked>On</Switch>
      <Switch disabled>Disabled</Switch>
      <Switch disabled defaultChecked>
        Disabled + on
      </Switch>
    </div>
  ),
};

export const WithThumbIcons: Story = {
  name: "With thumb icons",
  args: {
    checkedIcon: MoonIcon,
    uncheckedIcon: SunIcon,
    children: "Dark mode",
    defaultChecked: true,
  },
};

export const IconOnly: Story = {
  name: "Without a label (aria-label required)",
  render: () => <Switch aria-label="Airplane mode" />,
};
