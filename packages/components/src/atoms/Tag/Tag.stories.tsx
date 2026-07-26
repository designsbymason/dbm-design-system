import { TagIcon } from "@dbm-design-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Tag } from "./Tag";

const meta: Meta<typeof Tag> = {
  title: "Atoms/Core/Tag",
  component: Tag,
  parameters: { layout: "padded" },
  argTypes: {
    tone: {
      control: "select",
      options: ["neutral", "info", "success", "warning", "danger"],
    },
    variant: { control: "select", options: ["subtle", "solid"] },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
  args: {
    children: "Design",
  },
};

export default meta;

type Story = StoryObj<typeof Tag>;

export const Default: Story = {};

export const AllTones: Story = {
  name: "All tones (subtle)",
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {(["neutral", "info", "success", "warning", "danger"] as const).map(
        (tone) => (
          <Tag key={tone} tone={tone}>
            {tone}
          </Tag>
        ),
      )}
    </div>
  ),
};

export const Solid: Story = {
  name: "All tones (solid)",
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {(["neutral", "info", "success", "warning", "danger"] as const).map(
        (tone) => (
          <Tag key={tone} tone={tone} variant="solid">
            {tone}
          </Tag>
        ),
      )}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Tag key={size} size={size}>
          Size {size}
        </Tag>
      ))}
    </div>
  ),
};

export const WithIcon: Story = {
  name: "With leading icon",
  args: { icon: TagIcon, tone: "info" },
};

export const RemovableFilterList: Story = {
  name: "Removable filter list",
  render: function RemovableFilterListStory() {
    const [filters, setFilters] = useState([
      "Design",
      "Engineering",
      "In review",
    ]);
    return (
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {filters.map((filter) => (
          <Tag
            key={filter}
            tone="info"
            removable
            onRemove={() => setFilters(filters.filter((f) => f !== filter))}
          >
            {filter}
          </Tag>
        ))}
      </div>
    );
  },
};
