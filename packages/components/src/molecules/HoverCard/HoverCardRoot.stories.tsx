import type { Meta, StoryObj } from "@storybook/react-vite";
import { HoverCard } from "./HoverCard";

// Docs-only — see HoverCardTrigger.stories.tsx's own comment for the full
// rationale (guidelines/adr/0013). This one resolves the *root* component's
// own argTypes for the main Properties table: the Playground's meta also
// carries `HoverCard.Content`'s props (it has to drive both from one render),
// so a table built from it would list content props as if they were the
// root's own.
const meta: Meta<typeof HoverCard> = {
  title: "Molecules/Overlay/HoverCard/Root",
  component: HoverCard,
  tags: ["!dev"],
  argTypes: {
    children: {
      control: false,
      description: "HoverCard.Trigger and HoverCard.Content.",
    },
    open: {
      control: "boolean",
      description:
        "The controlled open state. Omit (along with defaultOpen) to manage open state uncontrolled internally.",
    },
    defaultOpen: {
      control: "boolean",
      description: "The initial open state for uncontrolled usage — ignored once open is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description:
        "Called with the new open state whenever it changes — the pointer or keyboard focus arriving at the trigger (after openDelay), leaving it (after closeDelay), or Escape dismissing it.",
    },
    openDelay: {
      control: "number",
      description:
        "Milliseconds the pointer or keyboard focus must stay on the trigger before the card opens — long enough that sweeping the pointer across a page of links doesn't flash a card for each one.",
      table: { defaultValue: { summary: "700" } },
    },
    closeDelay: {
      control: "number",
      description:
        "Milliseconds the card stays open after the pointer or focus leaves the trigger and the card — the grace period that lets the pointer cross the gap from the trigger onto the card without closing it.",
      table: { defaultValue: { summary: "300" } },
    },
  },
};

export default meta;

type Story = StoryObj<typeof HoverCard>;

export const Default: Story = {
  render: (args) => (
    <HoverCard {...args}>
      <HoverCard.Trigger href="/people/jane">@jane</HoverCard.Trigger>
      <HoverCard.Content>Content</HoverCard.Content>
    </HoverCard>
  ),
};
