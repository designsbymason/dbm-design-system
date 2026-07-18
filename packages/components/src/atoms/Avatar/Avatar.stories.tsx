import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "Atoms/Core/Avatar",
  component: Avatar,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    status: { control: "select", options: [undefined, "online", "offline", "busy", "away"] },
  },
  args: {
    initials: "JD",
    alt: "Jane Doe",
  },
};

export default meta;

type Story = StoryObj<typeof Avatar>;

export const InitialsFallback: Story = {
  name: "Initials (no image)",
};

export const WithImage: Story = {
  name: "With image",
  args: {
    src: "https://i.pravatar.cc/128?img=5",
  },
};

export const BrokenImage: Story = {
  name: "Broken image URL (falls back to initials)",
  args: {
    src: "https://example.com/does-not-exist.jpg",
  },
};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Avatar key={size} initials="JD" alt="Jane Doe" size={size} />
      ))}
    </div>
  ),
};

export const AllStatuses: Story = {
  name: "All statuses",
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
      {(["online", "offline", "busy", "away"] as const).map((status) => (
        <Avatar key={status} initials="JD" alt="Jane Doe" status={status} />
      ))}
    </div>
  ),
};
