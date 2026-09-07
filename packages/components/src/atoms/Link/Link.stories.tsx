import type { Meta, StoryObj } from "@storybook/react-vite";
import { Link } from "./Link";

const meta: Meta<typeof Link> = {
  title: "Atoms/Typography/Link",
  component: Link,
  parameters: { layout: "padded" },
  // Ordered to match LinkProps' own declaration order, content/destination
  // props first, then behavioral props, then advanced/escape-hatch props
  // last — same sequencing principle the Properties table uses
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    href: {
      control: "text",
      description: "The link destination.",
    },
    children: {
      control: "text",
      description: "The link text/content.",
    },
    external: {
      control: "boolean",
      description:
        "Applies external-link affordances: opens in a new tab, sets rel=\"noopener noreferrer\", appends a trailing icon, and adds a visually-hidden \"(opens in a new tab)\" cue. Auto-detected from href when not set explicitly.",
    },
    underline: {
      control: "radio",
      options: ["always", "hover", "none"],
      description: "Controls when the underline is visible.",
    },
    asChild: {
      control: false,
      description:
        "Merge props onto the single child element instead of rendering an <a> (via Radix Slot). See the \"asChild (composes with a custom element)\" story.",
    },
    disabled: {
      control: "boolean",
      description:
        "Disables the link: applies aria-disabled, blocks click/keyboard activation, and dims the visual treatment. The link stays focusable and its href stays present (no native disabled attribute on <a>).",
    },
    target: {
      control: false,
      description:
        'Native anchor target. Defaults to "_blank" when the link is external; pass explicitly to override.',
    },
    rel: {
      control: false,
      description:
        'Native anchor rel. Defaults to "noopener noreferrer" when the link is external; pass explicitly to override or extend.',
    },
    download: {
      control: false,
      description:
        "Native anchor download — prompts a file download instead of navigating, optionally with a suggested filename.",
    },
    "aria-label": {
      control: "text",
      description:
        "Accessible name override. Needed when children isn't readable text on its own (an icon-only link, a link wrapping an image).",
    },
    "aria-labelledby": {
      control: false,
      description: "References the id of an element that labels this link, as an alternative to aria-label.",
    },
    id: {
      control: false,
      description:
        "DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
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
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert
  // placeholder instead of a live, interactive control (see
  // guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    href: "/docs",
    children: "Documentation",
    external: false,
    underline: "always",
    disabled: false,
    "aria-label": "",
  },
};

export default meta;

type Story = StoryObj<typeof Link>;

/** Drive every prop live. */
export const Playground: Story = {};

export const Internal: Story = {
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => <Link href="/docs">Internal link</Link>,
};

export const External: Story = {
  name: "External (auto-detected, shows icon)",
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => <Link href="https://example.com">External link</Link>,
};

export const ForcedExternal: Story = {
  name: "Forced external via explicit prop",
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <Link href="/download" external>
      Forced external affordance
    </Link>
  ),
};

export const AsChild: Story = {
  name: "asChild (composes with a custom element)",
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  // A real <a>, not a <button> — asChild's real-world use is composing onto
  // a router's own Link component (which itself renders an <a>), so the
  // demo target should be something href/an anchor-like element actually
  // means something on. A previous version of this story used a <button>,
  // which doesn't have href semantics at all — technically harmless (the
  // browser just ignores the unrecognized attribute) but a misleading
  // example of what asChild is actually for.
  render: () => (
    <Link asChild href="/docs" underline="none">
      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid -- this anchor
      intentionally has no literal href in source; Radix Slot merges the
      outer Link's own href onto it at render time (verified in
      Link.test.tsx's own "merging href onto a real anchor" test) — adding
      a hardcoded href here would fight that merge and misrepresent what
      asChild actually does. */}
      <a style={{ fontWeight: "var(--dbm-font-weight-semibold)" }}>
        Rendered as a real Link, styling merged onto this anchor
      </a>
    </Link>
  ),
};

export const Disabled: Story = {
  name: "Disabled (aria-disabled, click blocked)",
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <Link href="/unavailable" disabled>
      Unavailable right now
    </Link>
  ),
};

export const InParagraph: Story = {
  name: "Inline within body text",
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <p style={{ color: "var(--dbm-text-primary)" }}>
      Read the <Link href="/docs">documentation</Link> or check the{" "}
      <Link href="https://example.com">external reference</Link> for more detail.
    </p>
  ),
};

export const UnderlineVariants: Story = {
  name: "underline variants (always / hover / none)",
  argTypes: {
    href: { control: false },
    children: { control: false },
    external: { control: false },
    underline: { control: false },
    disabled: { control: false },
    "aria-label": { control: false },
  },
  render: () => (
    <p style={{ color: "var(--dbm-text-primary)" }}>
      <Link href="/docs" underline="always">
        underline=&quot;always&quot; (default, safe for body text)
      </Link>
      <br />
      <Link href="/docs" underline="hover">
        underline=&quot;hover&quot; (hover to reveal — for non-body-text use only)
      </Link>
      <br />
      <Link href="/docs" underline="none">
        underline=&quot;none&quot; (e.g. navigation, where color+weight distinguish it)
      </Link>
    </p>
  ),
};
