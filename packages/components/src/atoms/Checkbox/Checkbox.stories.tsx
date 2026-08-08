import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Checkbox } from "./Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Atoms/Inputs/Checkbox",
  component: Checkbox,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
  },
  args: {
    children: "Accept terms and conditions",
  },
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Checkbox key={size} size={size} defaultChecked>
          Size {size}
        </Checkbox>
      ))}
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
      <Checkbox>Unchecked</Checkbox>
      <Checkbox defaultChecked>Checked</Checkbox>
      <Checkbox checked="indeterminate">Indeterminate</Checkbox>
      <Checkbox disabled>Disabled</Checkbox>
      <Checkbox disabled defaultChecked>
        Disabled + checked
      </Checkbox>
      <Checkbox hasError>Error state</Checkbox>
    </div>
  ),
};

export const IconOnly: Story = {
  name: "Without a label (aria-label required)",
  render: () => <Checkbox aria-label="Select row" />,
};

export const SelectAllPattern: Story = {
  name: "Select-all / indeterminate pattern",
  render: function SelectAllStory() {
    const [items, setItems] = useState([false, false, false]);
    const checkedCount = items.filter(Boolean).length;
    const allChecked = checkedCount === items.length;
    const someChecked = checkedCount > 0 && !allChecked;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" }}>
        <Checkbox
          checked={someChecked ? "indeterminate" : allChecked}
          onCheckedChange={(checked) =>
            setItems(items.map(() => checked === true))
          }
        >
          Select all
        </Checkbox>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--dbm-space-2)",
            paddingInlineStart: "var(--dbm-space-6)",
          }}
        >
          {items.map((checked, index) => (
            <Checkbox
              key={index}
              checked={checked}
              onCheckedChange={(value) =>
                setItems(items.map((v, i) => (i === index ? value === true : v)))
              }
            >
              Item {index + 1}
            </Checkbox>
          ))}
        </div>
      </div>
    );
  },
};
