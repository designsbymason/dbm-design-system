import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "../Spinner";
import { Center } from "./Center";

const meta: Meta<typeof Center> = {
  title: "Atoms/Layout/Center",
  component: Center,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof Center>;

export const Default: Story = {
  render: () => (
    <Center
      style={{
        height: "12rem",
        border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)",
      }}
    >
      <Spinner tone="brand" label="Loading" />
    </Center>
  ),
};

export const Inline: Story = {
  render: () => (
    <p>
      Text with an{" "}
      <Center
        as="span"
        inline
        style={{ border: "var(--dbm-border-width-1) dashed var(--dbm-border-default)" }}
      >
        inline-centered badge
      </Center>{" "}
      in the middle of a sentence.
    </p>
  ),
};
