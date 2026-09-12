import { CheckIcon, GearIcon, HouseIcon } from "@dbm-design-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Badge } from "../../atoms/Badge";
import { IconButton } from "../../atoms/IconButton";
import { ListItem } from "../../atoms/ListItem";
import { List } from "./List";

const meta: Meta<typeof List> = {
  title: "Molecules/Typography/List",
  component: List,
  parameters: { layout: "padded" },
  // Ordered to match ListProps' own declaration order (as, marker, spacing,
  // children, start, reversed, type, then id/className/style/data-testid) —
  // same sequencing principle the Properties table uses
  // (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    as: {
      control: "select",
      options: ["ul", "ol"],
      description: "The list element to render.",
    },
    marker: {
      control: "select",
      options: ["disc", "decimal", "none"],
      description: "Marker style. Defaults to 'disc' for ul and 'decimal' for ol.",
    },
    // `select`, not a plain `number` — `spacing` is a spacing *token* step,
    // matching Grid's/Stack's identical `gap`/`spacing` convention (see
    // Grid.stories.tsx's own `gap` argType for the full rationale: a plain
    // number control lets an invalid, non-token step through silently).
    spacing: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32],
      description:
        "Vertical gap between items, as a spacing token step — a single value, or a mobile-first responsive map keyed by breakpoint.",
    },
    // `children` isn't a meaningful live-editable control for a list
    // rendering multiple structured `ListItem` children — every story
    // hardcodes its own children in `render`.
    children: {
      control: false,
      description: "The list items (typically ListItem).",
    },
    start: {
      control: "number",
      description:
        'Native <ol> start — the ordinal value the first item counts from. Only applies when as="ol".',
    },
    reversed: {
      control: "boolean",
      description:
        'Native <ol> reversed — counts items in descending order. Only applies when as="ol".',
    },
    type: {
      control: "select",
      options: ["1", "a", "A", "i", "I"],
      description:
        'Native <ol> type — the marker character to count with. Only applies when as="ol".',
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this component, or a test/router needs a stable anchor.",
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
  // Every controllable prop gets an explicit value matching its real
  // component default where one exists (spacing=2, reversed=false — the
  // real default per ListProps). `as`/`marker` have no true default value
  // of their own (`as` genuinely renders as `undefined` → `ul`; `marker`
  // genuinely resolves per-`as` rather than one fixed value) — per
  // 06-engineering-standards.md §9, left `undefined` here so the Playground
  // starts from the component's real, unmodified default behavior rather
  // than an arbitrary demo value standing in for one. `start`/`type` have
  // no default either (native `undefined`) and stay unset for the same
  // reason — see the `OrderedListSpecificProps` story below for where
  // they're genuinely demonstrated with a non-default value.
  args: {
    as: undefined,
    marker: undefined,
    spacing: 2,
    start: undefined,
    reversed: false,
    type: undefined,
  },
  render: (args) => (
    <List {...args}>
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </List>
  ),
};

export default meta;

type Story = StoryObj<typeof List>;

export const Playground: Story = {
  name: "Playground",
};

export const Unordered: Story = {
  name: "Unordered (default)",
  // `as` fixed to the default `ul` — the whole point of this story is the
  // default marker/element, so it must never actually receive a live `as`
  // override (explicitly forced `undefined` after the spread below, not
  // just `control: false` — same reasoning as Grid's own `DefaultColumns`
  // story). Every other prop stays live via `{...args}`.
  argTypes: { as: { control: false } },
  render: (args) => (
    <List {...args} as={undefined}>
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </List>
  ),
};

export const Ordered: Story = {
  name: "Ordered",
  argTypes: { as: { control: false } },
  args: { as: "ol" },
  render: (args) => (
    <List {...args}>
      <ListItem>First step</ListItem>
      <ListItem>Second step</ListItem>
      <ListItem>Third step</ListItem>
    </List>
  ),
};

export const NoMarker: Story = {
  name: 'marker="none"',
  // `marker` fixed to `"none"` — the whole point of this story, and the
  // one case exercising the Safari/VoiceOver `role="list"` fix. Every
  // other prop stays live via `{...args}`.
  argTypes: { marker: { control: false } },
  args: { marker: "none" },
  render: (args) => (
    <List {...args}>
      <ListItem>Item without a marker</ListItem>
      <ListItem>Another item</ListItem>
    </List>
  ),
};

export const CustomSpacing: Story = {
  name: "Custom spacing between items",
  argTypes: { spacing: { control: false } },
  args: { spacing: 6 },
  render: (args) => (
    <List {...args}>
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </List>
  ),
};

export const OrderedListSpecificProps: Story = {
  name: 'as="ol" with start/reversed/type (ol-specific native props)',
  // `as` fixed to `"ol"` — `start`/`reversed`/`type` are inert (and warn in
  // development) on the default `ul`, so this story exists specifically to
  // demonstrate them with a real, non-default value. Every other prop
  // (including `start`/`reversed`/`type` themselves) stays live via
  // `{...args}`.
  argTypes: { as: { control: false } },
  args: { as: "ol", start: 5, reversed: true, type: "A" },
  render: (args) => (
    <List {...args}>
      <ListItem>Counts down from 5</ListItem>
      <ListItem>Then 4</ListItem>
      <ListItem>Then 3</ListItem>
    </List>
  ),
};

export const ResponsiveSpacing: Story = {
  name: "Responsive spacing (tight on mobile, roomy from lg up)",
  // `spacing` is hardcoded to a responsive map here — no single control
  // could represent "1 at base, 6 at lg" as one value, the
  // multi-instance-gallery exception (06-engineering-standards.md §9),
  // matching Grid's own `ResponsiveGap` story. Every other prop stays live.
  argTypes: { spacing: { control: false } },
  render: (args) => (
    <List {...args} spacing={{ base: 1, lg: 6 }}>
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </List>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (long items wrap)",
  render: (args) => (
    <List {...args}>
      <ListItem>
        A longer list item that should wrap gracefully at narrow viewport widths
        without overflowing its container.
      </ListItem>
      <ListItem>Short item</ListItem>
    </List>
  ),
};

export const WithListItemFeatures: Story = {
  name: "Composed with ListItem's icon/trailing/interactive features",
  // `marker` fixed to `"none"` — every item here uses a custom `icon`,
  // which already suppresses the native marker on its own, so an explicit
  // marker style would be a visible no-op competing with it. See
  // ListItem.stories.tsx for each of these features demonstrated in
  // isolation (icon marker, trailing content, interactive/selected/
  // disabled) — this story exists to confirm the realistic *composed*
  // case (all of them together, inside a real List) actually works, not
  // to duplicate that per-feature breakdown.
  argTypes: { marker: { control: false } },
  args: { marker: "none" },
  render: function WithListItemFeaturesStory(args) {
    const [selected, setSelected] = useState("home");
    return (
      <List {...args}>
        <ListItem
          interactive
          selected={selected === "home"}
          icon={HouseIcon}
          onClick={() => setSelected("home")}
        >
          Home
        </ListItem>
        <ListItem
          interactive
          selected={selected === "settings"}
          icon={GearIcon}
          trailing={<Badge tone="info">3</Badge>}
          onClick={() => setSelected("settings")}
        >
          Settings
        </ListItem>
        <ListItem
          interactive
          disabled
          icon={CheckIcon}
          trailing={<IconButton icon={GearIcon} aria-label="Configure" size="xs" variant="ghost" />}
          onClick={() => {}}
        >
          Unavailable
        </ListItem>
      </List>
    );
  },
};

export const NestedLists: Story = {
  name: "Nested lists",
  // Nesting already works mechanically with no code changes needed — a
  // `<ul>`/`<ol>` inside a `<li>`'s own content is standard, unguarded
  // HTML, and `ListItem` renders `children` as-is — this story exists to
  // actually demonstrate it, since nothing previously did.
  render: (args) => (
    <List {...args}>
      <ListItem>
        Layout
        <List as="ol" spacing={1} marker="decimal">
          <ListItem>Grid</ListItem>
          <ListItem>Stack</ListItem>
        </List>
      </ListItem>
      <ListItem>Typography</ListItem>
      <ListItem>Inputs &amp; Forms</ListItem>
    </List>
  ),
};
