import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../Text";
import { Bleed } from "./Bleed";

const PHOTO_URL =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='160'%3E%3Crect width='400' height='160' fill='%235548A4'/%3E%3C/svg%3E";

const meta: Meta<typeof Bleed> = {
  title: "Atoms/Layout/Bleed",
  component: Bleed,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof Bleed>;

export const Default: Story = {
  name: "Bleeds a full-width image out of a padded article",
  render: () => (
    <div
      style={{
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
        maxWidth: "28rem",
        paddingInline: "var(--dbm-space-6)",
        paddingBlock: "var(--dbm-space-4)",
      }}
    >
      <Text>Padded article copy sits inside the dashed border.</Text>
      <Bleed inset={6} style={{ marginBlock: "var(--dbm-space-4)" }}>
        <img src={PHOTO_URL} alt="" style={{ width: "100%", display: "block" }} />
      </Bleed>
      <Text>
        The image bleeds all the way to the dashed edge; this text stays
        padded.
      </Text>
    </div>
  ),
};
