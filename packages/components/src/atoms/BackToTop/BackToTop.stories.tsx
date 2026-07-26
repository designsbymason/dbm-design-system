import type { Meta, StoryObj } from "@storybook/react-vite";
import { BackToTop } from "./BackToTop";
import { Text } from "../Text";

const meta: Meta<typeof BackToTop> = {
  title: "Atoms/Navigation/BackToTop",
  component: BackToTop,
  parameters: { layout: "fullscreen" },
};

export default meta;

type Story = StoryObj<typeof BackToTop>;

export const Default: Story = {
  name: "Scroll the page to see it appear",
  render: () => (
    <div>
      <div style={{ padding: "1.5rem" }}>
        {Array.from({ length: 40 }, (_, i) => (
          <Text key={i} style={{ marginBlockEnd: "1rem" }}>
            Scroll down to reveal the back-to-top button. Line {i + 1}.
          </Text>
        ))}
      </div>
      <BackToTop threshold={200} />
    </div>
  ),
};
