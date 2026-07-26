import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { Text } from "../Text";
import { Collapse } from "./Collapse";

const meta: Meta<typeof Collapse> = {
  title: "Atoms/Overlay/Collapse",
  component: Collapse,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof Collapse>;

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: "24rem" }}>
      <Collapse trigger={<Button variant="secondary">Toggle details</Button>}>
        <Text style={{ paddingBlockStart: "0.75rem" }}>
          Hidden content revealed on toggle, with an animated height
          transition.
        </Text>
      </Collapse>
    </div>
  ),
};

export const OpenByDefault: Story = {
  name: "Open by default",
  render: () => (
    <div style={{ maxWidth: "24rem" }}>
      <Collapse
        defaultOpen
        trigger={<Button variant="secondary">Toggle details</Button>}
      >
        <Text style={{ paddingBlockStart: "0.75rem" }}>
          Starts expanded; click the trigger to collapse it.
        </Text>
      </Collapse>
    </div>
  ),
};

export const WithoutTrigger: Story = {
  name: "Externally driven (no built-in trigger)",
  render: () => (
    <div style={{ maxWidth: "24rem" }}>
      <Collapse open>
        <Text>
          Accordion uses Collapse this way — driving open from its own
          trigger UI instead of this component&apos;s internal one.
        </Text>
      </Collapse>
    </div>
  ),
};
