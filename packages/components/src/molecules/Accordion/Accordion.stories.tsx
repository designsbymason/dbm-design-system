import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";
import type { CSSProperties } from "react";
import { RocketLaunchIcon } from "@dbm-design-system/icons";
import { Icon } from "../../atoms/Icon";
import { Text } from "../../atoms/Text";
import { Accordion } from "./Accordion";
import type { AccordionHeadingLevel, AccordionOrientation } from "./Accordion.types";

// `Accordion`'s own root props are a discriminated union keyed by `type`
// (`value`/`defaultValue`/`onValueChange` are a plain `string` under
// `type="single"`, a `string[]` under `type="multiple"`). `type` itself is
// still genuinely interactive here — `render` below branches on
// `args.type` (mirroring `Accordion.tsx`'s own two-arm `rootProps`
// pattern) rather than trying to force one shape to cover both. `defaultValue`
// stays a single-string select either way for a simple, consistent control:
// under `type="multiple"` it's wrapped into a one-element array (or `[]` for
// "none") — demonstrating the mechanism, not every possible combination. The
// dedicated `Multiple` story below still shows the *real* multi-open case
// (two items open at once), which the Playground's own single-string control
// can't represent on its own.
// `Accordion.Item`/`Accordion.Trigger`/`Accordion.Content` each get their
// own Properties table via a hidden docs-only stories file
// (guidelines/adr/0013), where their argTypes are auto-resolved from real
// docgen.
interface PlaygroundArgs {
  type: "single" | "multiple";
  onValueChange: (value: string | string[]) => void;
  disabled: boolean;
  orientation: AccordionOrientation;
  dir: "ltr" | "rtl";
  headingLevel: AccordionHeadingLevel;
  collapsible: boolean;
  defaultValue: string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

const demoContainerStyle = {
  maxWidth: "28rem",
  marginInline: "auto",
} as const;

const DemoItems = () => (
  <>
    <Accordion.Item value="shipping">
      <Accordion.Trigger>How long does shipping take?</Accordion.Trigger>
      <Accordion.Content>
        <Text size="sm">Standard shipping takes 3-5 business days. Express shipping arrives next day.</Text>
      </Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="returns">
      <Accordion.Trigger>What&apos;s your return policy?</Accordion.Trigger>
      <Accordion.Content>
        <Text size="sm">Unused items can be returned within 30 days of delivery for a full refund.</Text>
      </Accordion.Content>
    </Accordion.Item>
    <Accordion.Item value="warranty">
      <Accordion.Trigger>Is there a warranty?</Accordion.Trigger>
      <Accordion.Content>
        <Text size="sm">Every product ships with a 1-year limited manufacturer warranty.</Text>
      </Accordion.Content>
    </Accordion.Item>
  </>
);

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Overlay/Accordion",
  parameters: { layout: "padded" },
  argTypes: {
    type: {
      control: "select",
      options: ["single", "multiple"],
      description:
        "At most one item open at a time (\"single\", the default), or any number open independently (\"multiple\"). Switching this also changes defaultValue's own shape — the Playground wraps it into a one-element array under \"multiple\"; see the dedicated Multiple story for the real multi-open case.",
    },
    defaultValue: {
      // `labels` overrides just the empty-string option's own displayed
      // text ("none" — nothing open by default) via Storybook's own
      // select-control label-mapping mechanism, without changing the
      // underlying value the control actually sets, which still needs to
      // stay `""` (Accordion has no separate sentinel for "nothing open,"
      // matching Radix's own convention). The other three options are left
      // to their default display (the raw `value` string), unaffected.
      control: { type: "select", labels: { "": "none" } },
      options: ["", "shipping", "returns", "warranty"],
      description: "The initial open item's value when uncontrolled (type=\"single\").",
    },
    onValueChange: {
      control: false,
      description: "Called with the newly-open item's value (or values, under type=\"multiple\") whenever it changes.",
    },
    collapsible: {
      control: "boolean",
      description:
        "Whether the open item can be closed by activating its own trigger again, leaving every item closed at once. Only applies to type=\"single\" (the default) — has no effect at all under type=\"multiple\".",
    },
    disabled: {
      control: "boolean",
      description: "Disables every item in the accordion at once.",
    },
    orientation: {
      control: "select",
      options: ["vertical", "horizontal"],
      description:
        "Which arrow-key pair moves roving focus between triggers. Purely a keyboard/data-orientation concern — doesn't lay items out side by side on its own.",
    },
    headingLevel: {
      control: "select",
      options: [1, 2, 3, 4, 5, 6],
      description:
        "The heading level every Accordion.Trigger in this accordion renders as, matching this accordion's real position in the page's own heading outline.",
    },
    dir: {
      control: false,
      description:
        "Text direction, passed through to Radix Accordion — flips which physical arrow key moves focus forward versus back in horizontal orientation.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this accordion.",
    },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    type: "single",
    disabled: false,
    orientation: "vertical",
    headingLevel: 3,
    collapsible: true,
    defaultValue: "shipping",
  },
  render: (args) => {
    const commonProps = {
      disabled: args.disabled,
      orientation: args.orientation,
      headingLevel: args.headingLevel,
    };
    return (
      <div style={demoContainerStyle}>
        {args.type === "multiple" ? (
          <Accordion {...commonProps} type="multiple" defaultValue={args.defaultValue ? [args.defaultValue] : []}>
            <DemoItems />
          </Accordion>
        ) : (
          <Accordion {...commonProps} type="single" collapsible={args.collapsible} defaultValue={args.defaultValue}>
            <DemoItems />
          </Accordion>
        )}
      </div>
    );
  },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Drive every prop live via the Controls panel below, including `type` itself. */
export const Playground: Story = {};

export const Multiple: Story = {
  name: "Multiple items open at once (type=\"multiple\")",
  argTypes: {
    type: { control: false },
    disabled: { control: false },
    orientation: { control: false },
    headingLevel: { control: false },
    collapsible: { control: false },
    defaultValue: { control: false },
  },
  render: () => (
    <div style={demoContainerStyle}>
      <Accordion type="multiple" defaultValue={["shipping", "warranty"]}>
        <DemoItems />
      </Accordion>
    </div>
  ),
};

export const DisabledItem: Story = {
  name: "One item disabled",
  argTypes: {
    type: { control: false },
    disabled: { control: false },
    orientation: { control: false },
    headingLevel: { control: false },
    collapsible: { control: false },
    defaultValue: { control: false },
  },
  render: () => (
    <div style={demoContainerStyle}>
      <Accordion defaultValue="shipping">
        <Accordion.Item value="shipping">
          <Accordion.Trigger>How long does shipping take?</Accordion.Trigger>
          <Accordion.Content>
            <Text size="sm">Standard shipping takes 3-5 business days.</Text>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="returns" disabled>
          <Accordion.Trigger>What&apos;s your return policy? (disabled)</Accordion.Trigger>
          <Accordion.Content>
            <Text size="sm">Unused items can be returned within 30 days of delivery.</Text>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
  ),
};

export const CustomIcon: Story = {
  name: "Custom disclosure icon",
  argTypes: {
    type: { control: false },
    disabled: { control: false },
    orientation: { control: false },
    headingLevel: { control: false },
    collapsible: { control: false },
    defaultValue: { control: false },
  },
  render: () => (
    <div style={demoContainerStyle}>
      <Accordion defaultValue="shipping">
        <Accordion.Item value="shipping">
          <Accordion.Trigger icon={RocketLaunchIcon}>How long does shipping take?</Accordion.Trigger>
          <Accordion.Content>
            <Text size="sm">Standard shipping takes 3-5 business days.</Text>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
  ),
};

export const AsChildTrigger: Story = {
  name: "Fully custom trigger row (asChild)",
  argTypes: {
    type: { control: false },
    disabled: { control: false },
    orientation: { control: false },
    headingLevel: { control: false },
    collapsible: { control: false },
    defaultValue: { control: false },
  },
  render: () => (
    <div style={demoContainerStyle}>
      <Accordion defaultValue="shipping">
        <Accordion.Item value="shipping">
          <Accordion.Trigger asChild>
            <button
              type="button"
              style={{
                alignItems: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                font: "inherit",
                gap: "var(--dbm-space-2)",
                padding: "var(--dbm-space-4)",
                width: "100%",
              }}
            >
              <Icon icon={RocketLaunchIcon} size="sm" tone="brand" />
              <Text size="sm" weight="semibold">
                A fully custom trigger row
              </Text>
            </button>
          </Accordion.Trigger>
          <Accordion.Content>
            <Text size="sm">
              With `asChild`, the trigger is responsible for rendering its own disclosure indicator, if any.
            </Text>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
  ),
};

export const Controlled: Story = {
  name: "Controlled open item",
  argTypes: {
    type: { control: false },
    disabled: { control: false },
    orientation: { control: false },
    headingLevel: { control: false },
    collapsible: { control: false },
    defaultValue: { control: false },
  },
  render: function ControlledStory() {
    const [value, setValue] = useState("shipping");
    return (
      <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-3)" }}>
        <Text size="sm">Open item: {value || "(none)"}</Text>
        <Accordion value={value} onValueChange={setValue}>
          <DemoItems />
        </Accordion>
      </div>
    );
  },
};

export const KeyboardInteraction: Story = {
  name: "Click to open, arrow keys to move between triggers",
  argTypes: {
    type: { control: false },
    disabled: { control: false },
    orientation: { control: false },
    headingLevel: { control: false },
    collapsible: { control: false },
    defaultValue: { control: false },
  },
  render: () => (
    <div style={demoContainerStyle}>
      <Accordion>
        <DemoItems />
      </Accordion>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shippingTrigger = canvas.getByRole("button", { name: "How long does shipping take?" });
    const returnsTrigger = canvas.getByRole("button", { name: "What's your return policy?" });

    await userEvent.click(shippingTrigger);
    await expect(shippingTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getByText(/3-5 business days/)).toBeVisible();

    shippingTrigger.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect(returnsTrigger).toHaveFocus();

    await userEvent.click(shippingTrigger);
    await expect(shippingTrigger).toHaveAttribute("aria-expanded", "false");
  },
};
