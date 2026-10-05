import type { Meta, StoryObj } from "@storybook/react-vite";
import { TableOfContents } from "./TableOfContents";
import type { TableOfContentsItem } from "./TableOfContents.types";

// Docs-only (guidelines/adr/0013) — the fields of one entry of `items` get their own Properties table on
// TableOfContents.mdx, drawn like the main one.
const meta: Meta<TableOfContentsItem> = {
  title: "Molecules/Navigation/TableOfContents/Item",
  tags: ["!dev"],
  argTypes: {
    id: {
      control: false,
      description: "The id of the element the entry points at. The link goes to #id.",
      type: { name: "string", required: true },
    },
    label: {
      control: false,
      description: "The entry's text.",
      type: { name: "other", value: "ReactNode", required: true },
    },
    level: {
      control: false,
      options: [1, 2, 3, 4],
      description: "How deeply nested the entry is. Each level is indented one step.",
      table: { defaultValue: { summary: "1" } },
    },
  },
};

export default meta;

type Story = StoryObj<TableOfContentsItem>;

// A story is needed for the file to be indexed; it is hidden, like the rest of the file.
export const Default: Story = {
  args: { id: "usage", label: "Usage", level: 1 },
  render: (args) => <TableOfContents items={[args]} />,
};
