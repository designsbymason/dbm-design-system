import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Indicators } from "./Indicators";

const meta: Meta<typeof Indicators> = {
  title: "Atoms/Media/Indicators",
  component: Indicators,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof Indicators>;

export const Default: Story = {
  name: "Controlled (click or use arrow keys)",
  render: function DefaultStory() {
    const [index, setIndex] = useState(0);
    return <Indicators count={5} activeIndex={index} onIndexChange={setIndex} />;
  },
};

export const GallerySize: Story = {
  name: "Many slides",
  render: function GallerySizeStory() {
    const [index, setIndex] = useState(3);
    return (
      <Indicators
        count={10}
        activeIndex={index}
        onIndexChange={setIndex}
        getLabel={(i) => `Photo ${i + 1} of 10`}
        aria-label="Gallery navigation"
      />
    );
  },
};
