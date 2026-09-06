import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading } from "./Heading";

const meta: Meta<typeof Heading> = {
  title: "Atoms/Typography/Heading",
  component: Heading,
  parameters: { layout: "padded" },
  // Ordered to match HeadingProps' own declaration order (children, level,
  // size, align, weight, color, fontFamily, wrap, truncate, as, then the
  // inherited native escape-hatch props last) — same sequencing principle
  // the Properties table uses (07-storybook-and-documentation-standards.md
  // §4 item 3).
  argTypes: {
    children: { control: "text", description: "The heading text." },
    level: {
      control: "select",
      options: [1, 2, 3, 4, 5, 6],
      description:
        "Semantic heading level, rendered as h1-h6 by default. When as is set to a non-heading element, this instead drives aria-level on a role=\"heading\" fallback.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"],
      description:
        "Visual size, from the full font-size token scale. Defaults to a sensible size for the given level, but can be set independently.",
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
      description: "Text alignment. Unset by default — inherits the surrounding layout's alignment.",
    },
    weight: {
      control: "select",
      options: ["regular", "medium", "semibold", "bold"],
      description: "Font weight.",
    },
    color: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "tertiary",
        "disabled",
        "link",
        "danger",
        "warning",
        "success",
        "info",
      ],
      description: "Semantic text color.",
    },
    fontFamily: {
      control: "select",
      options: ["primary", "secondary"],
      description:
        "Font family. primary switches to Nunito, for UI-dense/enterprise sections that want headings to stay consistent with the rest of the interface rather than the editorial serif.",
    },
    wrap: {
      control: "select",
      options: ["wrap", "nowrap", "balance", "pretty"],
      description:
        "Line-wrapping behavior (CSS text-wrap). balance or pretty improve how a multi-line heading breaks. nowrap conflicts with a multi-line truncate and warns in development if combined with one.",
    },
    // `control: false` — a `number` control with no starting value renders
    // as an inert "Set number" placeholder button rather than a live
    // input (confirmed live; unlike text/select/boolean controls, this is
    // real Storybook behavior for `number`/`object` controls specifically,
    // not a docgen type-inference failure). `truncate`'s real default is
    // "off" (no truncation, i.e. genuinely `undefined`), and there's no
    // number that honestly represents "off" to pre-fill instead — same
    // reasoning and same fix as `Textarea`'s own `minRows`/`maxRows`. The
    // "truncate (line-clamp)" story demonstrates it with a hardcoded value.
    truncate: {
      control: false,
      description:
        "Truncates text after this many lines, with an ellipsis (-webkit-line-clamp).",
    },
    as: {
      control: "select",
      options: ["div", "span", "p"],
      description:
        "The HTML element (or component) to render as, overriding the element level would normally select. Renders role=\"heading\" and aria-level={level} in this case. Intended for a non-heading element — passing an actual h1-h6 tag warns in development.",
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
  // guidelines/07-storybook-and-documentation-standards.md §5). `size` is
  // the one deliberate exception among the *live* controls: it's left
  // `undefined` because that's its real default (falls back to `level`'s
  // own matched default internally), and giving it a fixed demo value here
  // would silently break the very thing this Playground should
  // demonstrate — changing `level` visibly changing the rendered size for
  // anyone who hasn't explicitly picked a `size` of their own. `align`/
  // `wrap`/`as` have no true default either but, unlike `size`, get a
  // sensible non-blank demo value since doing so doesn't hide any other
  // prop's behavior. `truncate` isn't in this list at all — its control is
  // `control: false` above (see that argType's own comment), so it has no
  // live default to set here, matching `Textarea`'s own `minRows`/
  // `maxRows` (also omitted from `args` for the same reason).
  args: {
    children: "Design builds meaning",
    level: 2,
    size: undefined,
    align: "start",
    weight: "bold",
    color: "primary",
    fontFamily: "secondary",
    wrap: "wrap",
    as: undefined,
  },
};

export default meta;

type Story = StoryObj<typeof Heading>;

/** Drive every prop live. */
export const Playground: Story = {};

export const Default: Story = {
  // `level` is this story's own reason to exist (the default level) — kept
  // fixed so the story keeps demonstrating that specific default rather
  // than becoming a second, unlabeled Playground. Every other prop stays
  // live, matching `Blockquote`'s own established Default pattern.
  argTypes: { level: { control: false } },
  args: { level: 2 },
};

export const AllLevels: Story = {
  name: "All levels (h1-h6, matched default sizes)",
  // `level` is the deliberate varying axis (one instance per level, so no
  // single control value could represent "all of them" — per
  // 06-engineering-standards.md §9's multi-instance-gallery exception);
  // `children` is hardcoded per instance to label which level it is. Every
  // other prop is genuinely shared across all six instances and stays live.
  argTypes: {
    level: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <>
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        <Heading key={level} {...args} level={level}>
          Heading level {level}
        </Heading>
      ))}
    </>
  ),
};

export const SizeIndependentOfLevel: Story = {
  name: "Size set independently of level",
  // `level`/`size`/`children` are all fixed to preserve this story's own
  // specific point (a semantic h2 rendered visually smaller); every other
  // prop stays live.
  argTypes: {
    level: { control: false },
    size: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <Heading {...args} level={2} size="xl">
      Semantic h2, visually smaller (size=&quot;xl&quot;)
    </Heading>
  ),
};

export const AllSizes: Story = {
  name: "All sizes (full font-size scale)",
  // `size` is the deliberate varying axis; `children` is hardcoded per
  // instance to label which size it is. `level` stays live and shared
  // (changing it re-renders all 11 instances as a different heading tag,
  // still at their own labeled size).
  argTypes: {
    size: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <>
      {(
        ["xs", "sm", "base", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"] as const
      ).map((size) => (
        <Heading key={size} {...args} size={size}>
          size=&quot;{size}&quot;
        </Heading>
      ))}
    </>
  ),
};

export const FontFamily: Story = {
  name: "Font family (secondary/editorial vs primary)",
  // `fontFamily` is the deliberate varying axis; `children` is hardcoded
  // per instance to describe each. Everything else stays live and shared.
  argTypes: {
    fontFamily: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <>
      <Heading {...args} fontFamily="secondary">
        fontFamily=&quot;secondary&quot; (Lora, default) — editorial heading.
      </Heading>
      <Heading {...args} fontFamily="primary">
        fontFamily=&quot;primary&quot; (Nunito) — UI-dense/enterprise heading.
      </Heading>
    </>
  ),
};

export const Align: Story = {
  name: "Text alignment (start/center/end)",
  // `align` is the deliberate varying axis; `children` is hardcoded per
  // instance to describe each. `level` defaults to 3 via `args` (not a
  // JSX-literal override) specifically so it stays live — a literal
  // `level={3}` on every instance would silently make the `level` control
  // do nothing despite looking enabled, the exact "control exists but has
  // no effect" bug this component's own review flagged elsewhere. Every
  // other prop stays live and shared too.
  args: { level: 3 },
  argTypes: {
    align: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <>
      <Heading {...args} align="start">
        align=&quot;start&quot; (default)
      </Heading>
      <Heading {...args} align="center">
        align=&quot;center&quot;
      </Heading>
      <Heading {...args} align="end">
        align=&quot;end&quot;
      </Heading>
    </>
  ),
};

export const Wrap: Story = {
  name: "Line-wrapping (wrap vs balance vs pretty)",
  // `wrap` is the deliberate varying axis; `children` is hardcoded per
  // instance (text calibrated to actually wrap at the demo width). `level`
  // defaults via `args` rather than a JSX-literal override, same reasoning
  // as `Align`'s own comment — keeps its control genuinely live instead of
  // silently dead. Every other *live* prop stays shared (`truncate` is
  // `control: false` meta-wide — see that argType's own comment — so it
  // isn't live here either).
  args: { level: 2 },
  argTypes: {
    wrap: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <>
      <div style={{ maxWidth: "20rem" }}>
        <Heading {...args} wrap="wrap">
          A longer heading that wraps with the browser&apos;s default line breaks
        </Heading>
      </div>
      <div style={{ maxWidth: "20rem" }}>
        <Heading {...args} wrap="balance">
          A longer heading that wraps with balanced line breaks
        </Heading>
      </div>
      <div style={{ maxWidth: "20rem" }}>
        <Heading {...args} wrap="pretty">
          A longer heading that wraps avoiding an orphaned last word
        </Heading>
      </div>
    </>
  ),
};

export const Truncate: Story = {
  name: "truncate (line-clamp)",
  // `level`/`children`/`truncate` are all fixed — `truncate` is
  // `control: false` meta-wide (a `number` control with no starting value
  // is an inert placeholder, not a live input; see that argType's own
  // comment), so this story demonstrates it with a literal, hardcoded
  // value instead of a live one, same as `Textarea`'s own `minRows`/
  // `maxRows` demo stories. Every other prop stays live.
  argTypes: {
    level: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <div style={{ maxWidth: "20rem" }}>
      <Heading {...args} level={3} truncate={2}>
        A much longer card title than will fit on two lines, so it should be clamped with an
        ellipsis instead of overflowing or wrapping onto a third line.
      </Heading>
    </div>
  ),
};

export const AsCardTitle: Story = {
  name: 'Polymorphic: as="div" (card title, kept out of the page heading outline)',
  // `as`/`level`/`size`/`children` are all fixed to preserve this story's
  // own specific point (a card title using the ARIA-fallback mechanism);
  // every other prop stays live.
  argTypes: {
    as: { control: false },
    level: { control: false },
    size: { control: false },
    children: { control: false },
  },
  render: (args) => (
    <div
      style={{
        background: "var(--dbm-bg-neutral-subtle)",
        borderRadius: "var(--dbm-radius-md)",
        padding: "var(--dbm-space-4)",
      }}
    >
      <Heading {...args} level={3} as="div" size="lg">
        Product card title
      </Heading>
      <p style={{ color: "var(--dbm-text-secondary)", margin: 0 }}>
        Renders as a real page heading (h1) above; this one is a &lt;div&gt; with
        role=&quot;heading&quot; aria-level=&quot;3&quot;, so it&apos;s still announced correctly
        to screen readers without adding another entry to the page&apos;s actual heading outline.
      </p>
    </div>
  ),
};

export const NarrowViewport: Story = {
  name: "Narrow viewport (large heading wraps, never overflows)",
  // `parameters.chromatic` removed (2026-08-29) — Chromatic is a paid SaaS
  // tool this project never adopted (02-tech-stack-and-structure.md picked
  // Playwright's own self-hosted visual regression instead); this
  // parameter was always inert here. See Input.stories.tsx's own review
  // finding for the full writeup.
  //
  // `level`/`children` are fixed — this story exists specifically to show a
  // large heading wrapping at a narrow width, which a smaller level/shorter
  // text wouldn't demonstrate. Every other prop stays live via the default
  // args-spread renderer (no custom `render` needed here).
  argTypes: {
    level: { control: false },
    children: { control: false },
  },
  args: {
    level: 1,
    children: "A longer heading that should wrap gracefully on narrow screens",
  },
};
