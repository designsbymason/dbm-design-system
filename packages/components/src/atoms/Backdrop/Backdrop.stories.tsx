import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../Button";
import { Backdrop } from "./Backdrop";

const meta: Meta<typeof Backdrop> = {
  title: "Atoms/Overlay/Backdrop",
  component: Backdrop,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof Backdrop>;

export const Default: Story = {
  name: "Click to dismiss",
  render: function DefaultStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Show backdrop</Button>
        {open && <Backdrop onClick={() => setOpen(false)} />}
      </>
    );
  },
};

export const Blurred: Story = {
  name: "With blur",
  render: function BlurredStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Show blurred backdrop</Button>
        {open && <Backdrop blur onClick={() => setOpen(false)} />}
      </>
    );
  },
};

export const InPlace: Story = {
  name: "Rendered in place (no portal)",
  render: () => (
    <div style={{ position: "relative", height: "12rem", overflow: "hidden" }}>
      <Backdrop inPortal={false} style={{ position: "absolute" }} />
    </div>
  ),
};
