import type { Meta, StoryObj } from "@storybook/react-vite";
import { AspectRatio } from "./AspectRatio";

const meta: Meta<typeof AspectRatio> = {
  title: "Atoms/Layout/AspectRatio",
  component: AspectRatio,
  parameters: { layout: "padded" },
  // Ordered to match AspectRatioProps' own declaration order (ratio,
  // children), then the inherited native escape-hatch props last — same
  // sequencing principle the future Properties table will use
  // (guidelines/07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    ratio: {
      control: "number",
      description:
        "Width divided by height (e.g. 16 / 9, 1 for square, 4 / 3). Must be a positive, finite number.",
    },
    children: {
      // Explicit `control: "text"` — `ReactNode` isn't a type Storybook can
      // infer a control for automatically, so without this it renders as
      // an inert "-" instead of a live text input. Same reasoning as
      // Box's own `children` control.
      control: "text",
      description:
        "The content to lock to the aspect ratio — typically an image, iframe, or video stretched to fill the box. Renders inside an overflow:hidden wrapper.",
    },
    // `control: false` (className/style/id/data-testid) — values that only
    // mean something wired up in real consuming code, not in an isolated
    // Storybook canvas. Matches Skeleton/Avatar's established precedent.
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Merged with the component's own internal classes rather than replacing them.",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto the component's own internal styles. A style.aspectRatio value here overrides the ratio prop, since it's merged in after.",
    },
    id: {
      control: false,
      description:
        "DOM id. Needed when another element's aria-labelledby/aria-describedby must point at this component, or a test/router needs a stable anchor.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // string"/"Set object" placeholder instead of a live, interactive control
  // (see guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    ratio: 16 / 9,
    children: "Aspect-ratio content placeholder",
  },
};

export default meta;

type Story = StoryObj<typeof AspectRatio>;

/**
 * Drive every prop live. The wrapping `maxWidth`/background on the demo
 * container is Storybook-only chrome (so the box's bounds stay visible even
 * with plain text content) — not part of the component itself.
 */
export const Playground: Story = {
  render: (args) => (
    <div
      style={{
        maxWidth: "24rem",
        background: "var(--dbm-bg-track)",
        color: "var(--dbm-text-tertiary)",
      }}
    >
      <AspectRatio {...args} />
    </div>
  ),
};

export const Default: Story = {
  // `ratio`/`children` are the whole point of this story — a static
  // reference showing one exact, deliberately-chosen combination — so no
  // single control value could represent it without contradicting the
  // story's own point (same reasoning as Skeleton's `DefaultSizes`).
  argTypes: { ratio: { control: false }, children: { control: false } },
  render: () => (
    <div style={{ width: "20rem" }}>
      <AspectRatio ratio={16 / 9}>
        <div style={{ width: "100%", height: "100%", background: "var(--dbm-bg-track)" }} />
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  argTypes: { ratio: { control: false }, children: { control: false } },
  render: () => (
    <div style={{ width: "12rem" }}>
      <AspectRatio ratio={1}>
        <div style={{ width: "100%", height: "100%", background: "var(--dbm-bg-track)" }} />
      </AspectRatio>
    </div>
  ),
};

export const VideoEmbed: Story = {
  name: "Video embed (21:9)",
  argTypes: { ratio: { control: false }, children: { control: false } },
  render: () => (
    <div style={{ width: "24rem" }}>
      <AspectRatio ratio={21 / 9}>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--dbm-bg-track)",
            color: "var(--dbm-text-tertiary)",
          }}
        >
          21:9 video placeholder
        </div>
      </AspectRatio>
    </div>
  ),
};
