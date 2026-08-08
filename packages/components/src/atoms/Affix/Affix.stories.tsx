import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Text } from "../Text";
import { Affix } from "./Affix";

const meta: Meta<typeof Affix> = {
  title: "Atoms/Layout/Affix",
  component: Affix,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof Affix>;

export const StickyHeader: Story = {
  name: "Sticky table-style header (scroll to see it stick)",
  render: function StickyHeaderStory() {
    const [stuck, setStuck] = useState(false);
    return (
      <div style={{ height: "150vh" }}>
        <Affix onStickyChange={setStuck}>
          <div
            style={{
              padding: "1rem 1.5rem",
              background: "var(--dbm-bg-surface)",
              borderBottom: stuck
                ? "var(--dbm-border-width-2) solid var(--dbm-border-strong)"
                : "var(--dbm-border-width-1) solid var(--dbm-border-default)",
            }}
          >
            <Text weight="semibold">
              {stuck ? "Stuck!" : "Scroll down"}
            </Text>
          </div>
        </Affix>
        <div style={{ padding: "var(--dbm-space-6)" }}>
          {Array.from({ length: 30 }, (_, i) => (
            <Text key={i} style={{ marginBlockEnd: "var(--dbm-space-4)" }}>
              Content line {i + 1}.
            </Text>
          ))}
        </div>
      </div>
    );
  },
};
