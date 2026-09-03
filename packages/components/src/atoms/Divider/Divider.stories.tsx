import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "../Stack";
import { Divider } from "./Divider";

const meta: Meta<typeof Divider> = {
  title: "Atoms/Layout/Divider",
  component: Divider,
  parameters: { layout: "padded" },
  // Ordered to match DividerProps' own declaration order (orientation,
  // variant, thickness, emphasis, tone, label, align), then the inherited
  // native escape-hatch props last — same sequencing principle the future
  // Properties table will use (guidelines/07-storybook-and-documentation-
  // standards.md §4 item 3).
  argTypes: {
    orientation: {
      // A `select` of the single-value form — `Responsive<DividerOrientation>`
      // (a value, or a breakpoint-keyed map) has no single control shape
      // Storybook can represent, so the Playground demonstrates the common
      // single-value case; the responsive-map form gets its own dedicated
      // static-reference story below instead (same reasoning as
      // Bleed's `inset`/Container's `paddingInline`).
      control: "select",
      options: ["horizontal", "vertical"],
      description:
        "Axis the divider runs along — a single value (shown here) or a mobile-first responsive map keyed by breakpoint (e.g. { base: 'horizontal', lg: 'vertical' }).",
    },
    variant: {
      control: "select",
      options: ["solid", "dashed", "dotted", "double"],
      description:
        "Line style — double renders two parallel lines; pair it with emphasis to make one heavier.",
    },
    thickness: {
      control: "select",
      options: ["thin", "regular", "thick"],
      description:
        "Base stroke weight for every variant — the single line's weight for solid/dashed/dotted, and the default (non-emphasized) weight for double's two lines.",
    },
    emphasis: {
      control: "select",
      options: ["none", "start", "end"],
      description:
        "Which of double's two parallel lines (if either) is heavier, logical (RTL-aware, matching align's own start/end). No effect on other variants.",
    },
    tone: {
      control: "select",
      options: ["default", "brand", "info", "success", "warning", "danger"],
      description:
        "Semantic color, constrained to this system's border.* token family. default is Divider's own original resting color.",
    },
    label: {
      control: "text",
      description:
        "Optional label (e.g. 'OR'). When set, the divider renders as two line segments flanking the label instead of one continuous line.",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description:
        "Where the label sits along the line, logical (RTL-aware). Only meaningful when label is set.",
    },
    "aria-label": {
      control: "text",
      description:
        "Accessible name override. When label is a plain string and this isn't set, it's used automatically as the fallback accessible name.",
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
  // component default — an arg left `undefined` renders as an inert "Set
  // string" placeholder instead of a live, interactive control (see
  // guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    orientation: "horizontal",
    variant: "solid",
    thickness: "thin",
    emphasis: "none",
    tone: "default",
    label: "OR",
    align: "center",
    "aria-label": "",
  },
};

export default meta;

type Story = StoryObj<typeof Divider>;

/**
 * Drive every prop live. Switches its own demo layout based on
 * `orientation` — a vertical divider needs an explicit height from its
 * parent (it doesn't invent one on its own, same as `Vertical`/
 * `VerticalWithLabel` below), which a single static wrapper can't give it
 * for both orientations at once.
 */
export const Playground: Story = {
  render: (args) =>
    args.orientation === "vertical" ? (
      <div
        style={{
          color: "var(--dbm-text-primary)",
          display: "flex",
          gap: "var(--dbm-space-3)",
          height: "var(--dbm-space-24)",
        }}
      >
        <span>Content start</span>
        <Divider {...args} />
        <span>Content end</span>
      </div>
    ) : (
      <div style={{ color: "var(--dbm-text-primary)" }}>
        <p>Content above</p>
        <Divider {...args} />
        <p>Content below</p>
      </div>
    ),
};

export const Horizontal: Story = {
  // `orientation`/`variant`/`thickness`/`emphasis`/`tone`/`label`/`align`
  // are the whole point of each of these gallery stories — a static
  // reference showing one exact, deliberately-chosen combination — so no
  // single control value could represent it without contradicting the
  // story's own point (same reasoning as Skeleton's `DefaultSizes`).
  argTypes: {
    orientation: { control: false },
    variant: { control: false },
    thickness: { control: false },
    emphasis: { control: false },
    tone: { control: false },
    label: { control: false },
    align: { control: false },
  },
  render: () => (
    <div style={{ color: "var(--dbm-text-primary)" }}>
      <p>Content above</p>
      <Divider />
      <p>Content below</p>
    </div>
  ),
};

export const HorizontalWithLabel: Story = {
  name: "Horizontal with label",
  argTypes: {
    orientation: { control: false },
    variant: { control: false },
    thickness: { control: false },
    emphasis: { control: false },
    tone: { control: false },
    label: { control: false },
    align: { control: false },
  },
  render: () => (
    <div style={{ color: "var(--dbm-text-primary)" }}>
      <p>Sign in with email</p>
      <Divider label="OR" />
      <p>Sign in with SSO</p>
    </div>
  ),
};

export const LabelAlignment: Story = {
  name: "Label alignment (start / center / end)",
  argTypes: {
    orientation: { control: false },
    variant: { control: false },
    thickness: { control: false },
    emphasis: { control: false },
    tone: { control: false },
    label: { control: false },
    align: { control: false },
  },
  render: () => (
    <Stack gap={4} style={{ color: "var(--dbm-text-primary)" }}>
      <Divider label="Section A" align="start" />
      <Divider label="Section B" align="center" />
      <Divider label="Section C" align="end" />
    </Stack>
  ),
};

export const Vertical: Story = {
  argTypes: {
    orientation: { control: false },
    variant: { control: false },
    thickness: { control: false },
    emphasis: { control: false },
    tone: { control: false },
    label: { control: false },
    align: { control: false },
  },
  render: () => (
    <div
      style={{
        color: "var(--dbm-text-primary)",
        display: "flex",
        gap: "var(--dbm-space-3)",
        height: "var(--dbm-space-16)",
      }}
    >
      <span>Left</span>
      <Divider orientation="vertical" />
      <span>Right</span>
    </div>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport",
  // `parameters.chromatic` removed (2026-08-29) — Chromatic is a paid SaaS
  // tool this project never adopted (02-tech-stack-and-structure.md picked
  // Playwright's own self-hosted visual regression instead); this
  // parameter was always inert here. See Input.stories.tsx's own review
  // finding for the full writeup.
  argTypes: {
    orientation: { control: false },
    variant: { control: false },
    thickness: { control: false },
    emphasis: { control: false },
    tone: { control: false },
    label: { control: false },
    align: { control: false },
  },
  render: () => (
    <div style={{ color: "var(--dbm-text-primary)", maxWidth: "300px" }}>
      <p>Content above</p>
      <Divider label="OR" />
      <p>Content below</p>
    </div>
  ),
};

export const VerticalWithLabel: Story = {
  name: "Vertical with label",
  argTypes: {
    orientation: { control: false },
    variant: { control: false },
    thickness: { control: false },
    emphasis: { control: false },
    tone: { control: false },
    label: { control: false },
    align: { control: false },
  },
  render: () => (
    <div
      style={{
        color: "var(--dbm-text-primary)",
        display: "flex",
        height: "var(--dbm-space-24)",
      }}
    >
      <span>Left</span>
      <Divider orientation="vertical" label="OR" />
      <span>Right</span>
    </div>
  ),
};

export const Dashed: Story = {
  argTypes: {
    orientation: { control: false },
    variant: { control: false },
    thickness: { control: false },
    emphasis: { control: false },
    tone: { control: false },
    label: { control: false },
    align: { control: false },
  },
  render: () => (
    <div style={{ color: "var(--dbm-text-primary)" }}>
      <p>Content above</p>
      <Divider variant="dashed" />
      <p>Content below</p>
    </div>
  ),
};

export const Dotted: Story = {
  argTypes: {
    orientation: { control: false },
    variant: { control: false },
    thickness: { control: false },
    emphasis: { control: false },
    tone: { control: false },
    label: { control: false },
    align: { control: false },
  },
  render: () => (
    <div style={{ color: "var(--dbm-text-primary)" }}>
      <p>Content above</p>
      <Divider variant="dotted" />
      <p>Content below</p>
    </div>
  ),
};

export const Double: Story = {
  name: "Double (equal weight)",
  argTypes: {
    orientation: { control: false },
    variant: { control: false },
    thickness: { control: false },
    emphasis: { control: false },
    tone: { control: false },
    label: { control: false },
    align: { control: false },
  },
  render: () => (
    <div style={{ color: "var(--dbm-text-primary)" }}>
      <p>Content above</p>
      <Divider variant="double" />
      <p>Content below</p>
    </div>
  ),
};

export const DoubleEmphasisStart: Story = {
  name: "Double (thicker start line)",
  argTypes: {
    orientation: { control: false },
    variant: { control: false },
    thickness: { control: false },
    emphasis: { control: false },
    tone: { control: false },
    label: { control: false },
    align: { control: false },
  },
  render: () => (
    <div style={{ color: "var(--dbm-text-primary)" }}>
      <p>Content above</p>
      <Divider variant="double" emphasis="start" />
      <p>Content below</p>
    </div>
  ),
};

export const DoubleEmphasisEnd: Story = {
  name: "Double (thicker end line)",
  argTypes: {
    orientation: { control: false },
    variant: { control: false },
    thickness: { control: false },
    emphasis: { control: false },
    tone: { control: false },
    label: { control: false },
    align: { control: false },
  },
  render: () => (
    <div style={{ color: "var(--dbm-text-primary)" }}>
      <p>Content above</p>
      <Divider variant="double" emphasis="end" />
      <p>Content below</p>
    </div>
  ),
};

export const Tones: Story = {
  name: "Tones (default / brand / info / success / warning / danger)",
  argTypes: {
    orientation: { control: false },
    variant: { control: false },
    thickness: { control: false },
    emphasis: { control: false },
    tone: { control: false },
    label: { control: false },
    align: { control: false },
  },
  render: () => (
    <Stack gap={4} style={{ color: "var(--dbm-text-primary)" }}>
      <Divider label="default" tone="default" />
      <Divider label="brand" tone="brand" />
      <Divider label="info" tone="info" />
      <Divider label="success" tone="success" />
      <Divider label="warning" tone="warning" />
      <Divider label="danger" tone="danger" />
    </Stack>
  ),
};

export const ResponsiveOrientation: Story = {
  name: "Responsive orientation (horizontal on mobile, vertical from lg up)",
  // `parameters.chromatic` removed (2026-08-29) — see NarrowViewport above,
  // same file, for why.
  argTypes: {
    orientation: { control: false },
    variant: { control: false },
    thickness: { control: false },
    emphasis: { control: false },
    tone: { control: false },
    label: { control: false },
    align: { control: false },
  },
  render: () => (
    // `height`, not `minHeight` — a vertical Divider's own `height: 100%`
    // doesn't resolve against a `min-height`-only ancestor (that CSS
    // property doesn't establish a definite height for a percentage-height
    // child the way `height` does), so it silently collapsed to the
    // divider's own tiny content height instead of stretching — the line
    // itself rendered at 1px tall, invisible next to the "OR" label. Same
    // constraint as `Vertical`/`VerticalWithLabel` above, which already use
    // an explicit `height` for the same reason.
    <Stack
      direction={{ base: "column", lg: "row" }}
      gap={4}
      style={{ color: "var(--dbm-text-primary)", height: "var(--dbm-space-24)" }}
    >
      <span>Section A</span>
      <Divider
        orientation={{ base: "horizontal", lg: "vertical" }}
        label="OR"
      />
      <span>Section B</span>
    </Stack>
  ),
};
