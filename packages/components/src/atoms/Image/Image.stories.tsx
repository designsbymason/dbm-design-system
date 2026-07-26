import { ImageIcon } from "@dbm-design-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "../Icon";
import { Image } from "./Image";

const PHOTO_URL =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%235548A4'/%3E%3C/svg%3E";

const meta: Meta<typeof Image> = {
  title: "Atoms/Media/Image",
  component: Image,
  parameters: { layout: "padded" },
  argTypes: {
    objectFit: {
      control: "select",
      options: ["cover", "contain", "fill", "none", "scale-down"],
    },
    radius: {
      control: "select",
      options: ["none", "xs", "sm", "md", "lg", "xl", "2xl", "full"],
    },
  },
  args: {
    src: PHOTO_URL,
    alt: "Placeholder graphic",
  },
};

export default meta;

type Story = StoryObj<typeof Image>;

export const Default: Story = {
  render: (args) => (
    <div style={{ width: "16rem" }}>
      <Image {...args} />
    </div>
  ),
};

export const AspectRatio169: Story = {
  name: "Locked aspect ratio (16:9)",
  args: { aspectRatio: 16 / 9 },
  render: (args) => (
    <div style={{ width: "20rem" }}>
      <Image {...args} />
    </div>
  ),
};

export const Rounded: Story = {
  args: { radius: "full", aspectRatio: 1 },
  render: (args) => (
    <div style={{ width: "8rem" }}>
      <Image {...args} />
    </div>
  ),
};

export const BrokenWithFallback: Story = {
  name: "Broken src, with fallback",
  args: {
    src: "https://broken.invalid/not-found.jpg",
    fallback: <Icon icon={ImageIcon} size="lg" />,
  },
  render: (args) => (
    <div style={{ width: "12rem" }}>
      <Image {...args} aspectRatio={1} radius="md" />
    </div>
  ),
};
