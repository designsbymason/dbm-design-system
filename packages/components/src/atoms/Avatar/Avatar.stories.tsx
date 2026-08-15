import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Avatar } from "./Avatar";

const meta: Meta<typeof Avatar> = {
  title: "Atoms/Data Display/Avatar",
  component: Avatar,
  parameters: { layout: "padded" },
  // Every key below is listed explicitly, in the order it should appear in
  // the Controls panel, matching AvatarProps' own declaration order (as,
  // src, alt, onError, loading, initials, name, colorful, size, shape,
  // status, disabled, aria-label, id, className, style, data-testid).
  // Storybook's automatic docgen-derived order doesn't reliably match
  // source order on its own, so entries with no config override still get
  // an explicit `{}` here purely to anchor their position — confirmed live
  // that omitting them lets Storybook fall back to appending them in its
  // own order instead.
  //
  // `control: false` (`as`, `onError`, `id`, `className`, `style`,
  // `data-testid`) marks props that genuinely can't be meaningfully driven
  // from this panel — a function, an element-type reference (`Stack`/
  // `Container`'s own stories don't expose their `as` as a control
  // either), or a value (DOM id/CSS class/inline style/test hook) that
  // only means something wired up in real consuming code, not in an
  // isolated Storybook canvas. These render as "-" instead of an inert
  // "Set string"/"Set object" placeholder. Matches Button's established
  // precedent for the native-prop subset of this list.
  // Every entry also gets an explicit `description` — Storybook's docgen
  // extracts several of these (native/redeclared props especially) with no
  // description text at all even though the row itself renders, which the
  // Docs page's Properties table makes visible as a blank "–" (confirmed
  // on Button/Box; see guidelines/07-storybook-and-documentation-standards.md
  // §4 item 3 and §5's checklist). Condensed from AvatarProps' own JSDoc in
  // Avatar.types.ts, not re-derived independently.
  argTypes: {
    as: {
      control: false,
      description:
        'The HTML element (or component) to render as — e.g. `as="button"` to make the avatar an interactive trigger, keeping its own generated content exactly as-is.',
    },
    src: {
      // Explicit `control: "text"` — without it, this rendered as an inert
      // "Set string" placeholder button instead of a live text input,
      // unlike the sibling `alt`/`initials` string props (which
      // Storybook's docgen happened to auto-infer a text control for).
      // Confirmed empirically in a running Storybook instance, not assumed.
      control: "text",
      description:
        "Image URL. Falls back to `initials` if unset or if the image fails to load.",
    },
    alt: {
      control: "text",
      description: "Accessible description of the image (e.g. the person's name).",
    },
    onError: {
      control: false,
      description:
        "Fired when `src` fails to load, after the component has already switched to its own fallback — for logging/retry/telemetry, not to control the fallback itself.",
    },
    loading: {
      control: "select",
      options: [undefined, "eager", "lazy"],
      description:
        "Passed through to the underlying `<img>` when an image is showing. Native browser default (`eager`) applies when omitted.",
    },
    initials: {
      control: "text",
      description:
        "Fallback initials shown when there's no image, or it fails to load. Falls back again to a generic person icon when this is also unset.",
    },
    name: {
      control: "text",
      description:
        "Person/entity name — auto-derives `initials` and `alt` when those aren't explicitly provided, and seeds `colorful`'s deterministic color.",
    },
    colorful: {
      control: "boolean",
      description:
        "Derives a deterministic background/text color from the avatar's identity instead of the fixed brand color, so different people render in different (but still AA-verified) colors.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "Controls the avatar's width/height (and proportionally its font size and status dot) — a single value, or a mobile-first responsive map keyed by breakpoint.",
    },
    shape: {
      control: "select",
      options: ["circle", "square"],
      description:
        "`circle` (the default) suits people; `square` reads better for non-person entities like teams or bots.",
    },
    status: {
      control: "select",
      options: [undefined, "online", "offline", "busy", "away"],
      description: "Optional presence indicator, rendered as a small dot.",
    },
    disabled: {
      control: "boolean",
      description:
        "Disables interaction — only meaningful when `as` makes the avatar an interactive trigger; has no effect on the default, non-interactive span.",
    },
    onClick: {
      control: false,
      description:
        "Fires on click. Blocked automatically when `disabled` is set on an interactive (`as`-driven) avatar.",
    },
    "aria-label": {
      control: "text",
      description:
        "Explicit accessible-label override. If omitted, a name is computed automatically from `alt`, combined with `status`'s label when both are present.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id. Required when another element's `aria-labelledby`/`aria-describedby` needs to point at this avatar.",
    },
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Merged with the component's own internal classes.",
    },
    style: {
      control: false,
      description: "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing. Rendered as the DOM `data-testid` attribute; has no visual or behavioral effect.",
    },
  },
  // Every controllable prop gets an explicit value matching its real
  // component default — an arg left `undefined` renders as an inert
  // placeholder instead of a live control (confirmed: `control: "text"`
  // alone on `src` above wasn't enough on its own — the arg itself also
  // needs a defined value, empty string included, not just a declared
  // control type; verified live after adding it below, not assumed). See
  // guidelines/06-engineering-standards.md §9's Storybook-documentation
  // checklist. `status`/`loading` don't need one: their `select` controls
  // above already render as a real dropdown regardless of a default
  // value, same for `colorful`'s `boolean` control (unlike a bare
  // inferred boolean control, which does need one — see `colorful` below).
  args: {
    src: "",
    alt: "Jane Doe",
    onError: fn(),
    initials: "JD",
    name: "",
    colorful: false,
    size: "md",
    shape: "circle",
    disabled: false,
    // Empty-string default, not undefined — needed for this control to be
    // genuinely interactive rather than an inert placeholder (see the
    // comment above). Safe now: Avatar.tsx treats an empty `aria-label` as
    // "no override," falling through to the computed name instead of
    // blanking it — confirmed live (no axe violation on the default state).
    "aria-label": "",
  },
};

export default meta;

type Story = StoryObj<typeof Avatar>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {};

export const InitialsFallback: Story = {
  name: "Initials (no image)",
};

export const WithImage: Story = {
  name: "With image",
  args: {
    src: "https://i.pravatar.cc/128?img=5",
  },
};

export const BrokenImage: Story = {
  name: "Broken image URL (falls back to initials)",
  args: {
    src: "https://example.com/does-not-exist.jpg",
  },
};

export const IconFallback: Story = {
  name: "Generic icon (no image, no initials)",
  args: {
    initials: undefined,
  },
};

export const SquareShape: Story = {
  name: "Square shape",
  args: {
    shape: "square",
  },
};

export const AsButton: Story = {
  name: 'Polymorphic: as="button" (interactive trigger, keeps its own content)',
  render: () => (
    // onClick would open a profile menu in a real app — omitted here since
    // this story only demonstrates that `as="button"` renders a real,
    // clickable <button> while keeping Avatar's own generated content.
    <Avatar
      as="button"
      initials="JD"
      alt="Jane Doe"
      status="online"
      style={{ border: "none", cursor: "pointer", padding: 0 }}
    />
  ),
};

export const AsButtonColorful: Story = {
  name: 'Polymorphic: as="button" + colorful (hover steps the family-specific token, not brand)',
  render: () => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
      {["Jane Doe", "John Smith", "Alex Kim", "Maria Garcia"].map((name) => (
        <Avatar
          key={name}
          as="button"
          name={name}
          colorful
          style={{ border: "none", cursor: "pointer", padding: 0 }}
        />
      ))}
    </div>
  ),
};

export const AsButtonSquare: Story = {
  name: 'Polymorphic: as="button" + square shape (square focus ring, sm radius)',
  render: () => (
    <Avatar
      as="button"
      initials="JD"
      alt="Jane Doe"
      status="online"
      shape="square"
      style={{ border: "none", cursor: "pointer", padding: 0 }}
    />
  ),
};

export const AsButtonDisabled: Story = {
  name: 'Polymorphic: as="button" + disabled',
  render: () => (
    <Avatar
      as="button"
      initials="JD"
      alt="Jane Doe"
      status="online"
      disabled
      style={{ border: "none", padding: 0 }}
    />
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Avatar key={size} initials="JD" alt="Jane Doe" size={size} />
      ))}
    </div>
  ),
};

export const ResponsiveSize: Story = {
  name: "Responsive size (sm on mobile, xl from md up)",
  parameters: { chromatic: { viewports: [375, 1024] } },
  render: () => (
    <Avatar initials="JD" alt="Jane Doe" size={{ base: "sm", md: "xl" }} />
  ),
};

export const AllStatuses: Story = {
  name: "All statuses",
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      {(["online", "offline", "busy", "away"] as const).map((status) => (
        <Avatar key={status} initials="JD" alt="Jane Doe" status={status} />
      ))}
    </div>
  ),
};

// Every size × every status together, in one grid — the exact combination
// that shipped a real bug unnoticed (the status dot's fixed 12px size
// completely covered the initials at `xs`/`sm` before it was made
// size-driven). `AllSizes`/`AllStatuses` above each vary only one axis at a
// time and wouldn't have caught it.
export const SizeStatusMatrix: Story = {
  name: "Size × status matrix",
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <div
          key={size}
          style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}
        >
          {(["online", "offline", "busy", "away"] as const).map((status) => (
            <Avatar
              key={status}
              initials="JD"
              alt="Jane Doe"
              size={size}
              status={status}
            />
          ))}
        </div>
      ))}
    </div>
  ),
};
