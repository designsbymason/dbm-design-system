import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { useState } from "react";
import type { CSSProperties } from "react";
import { RocketLaunchIcon } from "@dbm-design-system/icons";
import { Icon } from "../../atoms/Icon";
import { Text } from "../../atoms/Text";
import { Accordion } from "./Accordion";
import type { AccordionHeadingLevel, AccordionOrientation, AccordionSize, AccordionVariant } from "./Accordion.types";

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
  variant: AccordionVariant;
  size: AccordionSize;
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
    variant: {
      control: "select",
      options: ["bordered", "ghost"],
      description:
        "The group's own visual treatment — a self-contained bordered group, or a borderless treatment for embedding inside an already-bordered container (e.g. a Card).",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Trigger padding/typography and the disclosure icon's own size.",
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
    variant: "bordered",
    size: "md",
    disabled: false,
    orientation: "vertical",
    headingLevel: 3,
    collapsible: true,
    defaultValue: "shipping",
  },
  render: (args) => {
    const commonProps = {
      variant: args.variant,
      size: args.size,
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
    variant: { control: false },
    size: { control: false },
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
    variant: { control: false },
    size: { control: false },
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
    variant: { control: false },
    size: { control: false },
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
    variant: { control: false },
    size: { control: false },
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

export const Ghost: Story = {
  name: "Ghost variant (borderless, for embedding in a Card)",
  argTypes: {
    type: { control: false },
    variant: { control: false },
    size: { control: false },
    disabled: { control: false },
    orientation: { control: false },
    headingLevel: { control: false },
    collapsible: { control: false },
    defaultValue: { control: false },
  },
  render: () => (
    // A real `Card`-shaped wrapper isn't built yet (see 04-component-
    // inventory.md), so this fakes one — deliberately with its own title
    // and generous padding (`space-4`, distinct from the accordion's own
    // `radius-md`) so the wrapper's own border reads as a *separate*
    // container the ghost accordion sits inside, not as the accordion's
    // own (removed) border redrawn in the same place. Found live,
    // user-reported: an earlier version of this demo used only `space-2`
    // padding with no title, which put the wrapper's edge close enough to
    // the accordion that the two were visually indistinguishable — the
    // demo looked identical to the default `variant="bordered"` story.
    <div
      style={{
        ...demoContainerStyle,
        background: "var(--dbm-bg-surface)",
        border: `var(--dbm-border-width-1) solid var(--dbm-border-default)`,
        borderRadius: "var(--dbm-radius-lg)",
        padding: "var(--dbm-space-4)",
      }}
    >
      <Text size="md" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-3)" }}>
        Shipping &amp; returns
      </Text>
      <Accordion variant="ghost" defaultValue="shipping">
        <DemoItems />
      </Accordion>
    </div>
  ),
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: {
    type: { control: false },
    variant: { control: false },
    size: { control: false },
    disabled: { control: false },
    orientation: { control: false },
    headingLevel: { control: false },
    collapsible: { control: false },
    defaultValue: { control: false },
  },
  render: () => (
    // Closed by default, deliberately — opening all five simultaneously
    // would create five `role="region"` landmarks sharing the identical
    // accessible name ("How long does shipping take?"), a real
    // `landmark-unique` a11y violation found live via this exact story
    // (`@storybook/addon-vitest`'s own a11y check). The padding/typography
    // difference this gallery exists to show is already fully visible on
    // the closed trigger itself.
    <div style={{ ...demoContainerStyle, display: "flex", flexDirection: "column", gap: "var(--dbm-space-6)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div key={size}>
          <Text size="sm" weight="semibold" style={{ marginBlockEnd: "var(--dbm-space-2)" }}>
            size=&quot;{size}&quot;
          </Text>
          <Accordion size={size}>
            <Accordion.Item value="shipping">
              <Accordion.Trigger>How long does shipping take?</Accordion.Trigger>
              <Accordion.Content>
                <Text size="sm">Standard shipping takes 3-5 business days.</Text>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </div>
      ))}
    </div>
  ),
};

export const Controlled: Story = {
  name: "Controlled open item",
  argTypes: {
    type: { control: false },
    variant: { control: false },
    size: { control: false },
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
    variant: { control: false },
    size: { control: false },
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
