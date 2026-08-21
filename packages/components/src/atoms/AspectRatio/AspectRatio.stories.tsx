import type { Meta, StoryObj } from "@storybook/react-vite";
import { AspectRatio } from "./AspectRatio";

const PHOTO_URL =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%232E8A7D'/%3E%3C/svg%3E";

const meta: Meta<typeof AspectRatio> = {
  title: "Atoms/Layout/AspectRatio",
  component: AspectRatio,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof AspectRatio>;

export const Default: Story = {
  render: () => (
    <div style={{ width: "20rem" }}>
      <AspectRatio ratio={16 / 9}>
        <img
          src={PHOTO_URL}
          alt="Placeholder graphic"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  render: () => (
    <div style={{ width: "12rem" }}>
      <AspectRatio ratio={1}>
        <img
          src={PHOTO_URL}
          alt="Placeholder graphic"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AspectRatio>
    </div>
  ),
};

export const VideoEmbed: Story = {
  name: "Video embed (21:9)",
  render: () => (
    <div style={{ width: "24rem" }}>
      <AspectRatio ratio={21 / 9}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--dbm-bg-neutral-subtle)",
            color: "var(--dbm-text-tertiary)",
          }}
        >
          21:9 video placeholder
        </div>
      </AspectRatio>
    </div>
  ),
};
