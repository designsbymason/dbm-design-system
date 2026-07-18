import type { Meta, StoryObj } from "@storybook/react-vite";
import { Link } from "./Link";

const meta: Meta<typeof Link> = {
  title: "Atoms/Typography/Link",
  component: Link,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof Link>;

export const Internal: Story = {
  render: () => <Link href="/docs">Internal link</Link>,
};

export const External: Story = {
  name: "External (auto-detected, shows icon)",
  render: () => <Link href="https://example.com">External link</Link>,
};

export const ForcedExternal: Story = {
  name: "Forced external via explicit prop",
  render: () => (
    <Link href="/download" external>
      Forced external affordance
    </Link>
  ),
};

export const AsChild: Story = {
  name: "asChild (composes with a custom element)",
  render: () => (
    <Link asChild href="/docs">
      <button type="button" style={{ background: "none", border: "none", padding: 0 }}>
        Rendered as a real Link, but on a &lt;button&gt; element
      </button>
    </Link>
  ),
};

export const InParagraph: Story = {
  name: "Inline within body text",
  render: () => (
    <p style={{ color: "var(--dbm-text-primary)" }}>
      Read the <Link href="/docs">documentation</Link> or check the{" "}
      <Link href="https://example.com">external reference</Link> for more detail.
    </p>
  ),
};
