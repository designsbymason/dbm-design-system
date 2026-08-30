import { HeartIcon, TrashIcon } from "@dbm-design-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { IconButton } from "./IconButton";
import type { IconButtonProps } from "./IconButton.types";

// `icon` takes a component reference, not a string name (see
// guidelines/05-component-api-conventions.md §5) — Storybook's Controls
// panel can't natively drive an arbitrary component reference, so this maps
// a small curated set of real icons onto string keys via `argTypes.mapping`,
// the same pattern already established on Button's `leadingIcon`/
// `trailingIcon`. Unlike Button's icon slots, there's no "None" option here
// — `icon` is required on `IconButtonProps` (an icon-only button has
// nothing to fall back to), so letting the control resolve to `undefined`
// would just produce a broken, unintentionally-invalid state.
const iconMapping = {
  Heart: HeartIcon,
  Trash: TrashIcon,
};
const iconControl = {
  control: "select" as const,
  options: Object.keys(iconMapping),
  mapping: iconMapping,
};

const meta: Meta<typeof IconButton> = {
  title: "Atoms/Inputs/IconButton",
  component: IconButton,
  parameters: { layout: "padded" },
  // Ordered to match IconButtonProps' own declaration order (content prop
  // → core visual props → behavioral/state props → advanced/escape-hatch
  // props last), the same sequencing principle the future Properties table
  // will use (guidelines/07-storybook-and-documentation-standards.md §4
  // item 3).
  argTypes: {
    icon: {
      ...iconControl,
      description: "The icon to render — a component reference, not a string name.",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
    },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    isLoading: {
      control: "boolean",
      description:
        "Shows a spinner in place of the icon and disables interaction while true.",
    },
    loadingLabel: {
      control: "text",
      description:
        "Overrides aria-label while isLoading is true. Falls back to aria-label when omitted.",
    },
    // A real slotted child isn't wired up in the Playground (Slot requires
    // exactly one child, which a generic Controls toggle can't supply) —
    // see the dedicated `AsChild`/`AsChildDisabled` stories below instead.
    // Same treatment as Button's own Playground.
    asChild: { control: false },
    rounded: {
      control: "boolean",
      description:
        "Renders as a circle instead of the standard rounded-corner shape.",
    },
    // `pressed`/`defaultPressed`/`onPressedChange` don't each get their own
    // Controls-panel widget: `pressed` alone would freeze the button (a
    // controlled value always wins over the click handler's own toggle
    // attempt, and there's no real `onPressedChange` wired back to a live
    // control), and a bare `defaultPressed` boolean can't represent "not a
    // toggle at all" — `false` is still a defined value, so it would leave
    // `isToggle` permanently `true` regardless of which way the switch is
    // set (found in review: every story in this file rendered in toggle
    // mode by default before this fix, since the shared meta-level default
    // below used to set `defaultPressed: false`). Driven instead by the
    // Playground's own "Interaction mode" synthetic select (not a real
    // IconButtonProps field, see `Playground.argTypes.interactionMode`
    // below — same pattern as Tag's own Playground), which composes
    // `defaultPressed`/`onPressedChange` into one coherent, correctly-
    // behaving control, or via the dedicated `Toggle` story.
    pressed: {
      control: false,
      description:
        "Controlled pressed state — pair with onPressedChange. Setting either pressed or defaultPressed opts into toggle-button semantics. Demo via the Playground's \"Interaction mode\" control.",
    },
    defaultPressed: {
      control: false,
      description:
        'Initial pressed state for an uncontrolled toggle button. Demo via the Playground\'s "Interaction mode" control (select "Toggle") or the dedicated "Toggle" story below.',
    },
    onPressedChange: {
      control: false,
      description:
        "Fires when the pressed state changes. Demo via the Playground's \"Interaction mode\" control.",
    },
    "aria-label": {
      control: "text",
      description:
        "Required — an icon-only button has no visible text, so an accessible name must be supplied explicitly.",
    },
    type: { control: "select", options: ["button", "submit", "reset"] },
    disabled: {
      description:
        "Disables the button natively. When asChild is also set, the slotted element can't take a native disabled attribute, so this instead applies aria-disabled plus matching dimmed styling and blocks its click handler.",
    },
    // A function prop was never meant to be live-editable (guidelines/
    // 07-storybook-and-documentation-standards.md §5) — set explicitly
    // rather than relying on inference, same guard Button's own `onClick`
    // needed after a similar redeclaration.
    onClick: { control: false },
    "aria-labelledby": {
      control: false,
      description:
        "Points to the id of an existing, already-visible element to use as the accessible name instead of aria-label.",
    },
    // `control: false` — values that only mean something wired up in real
    // consuming code, not in an isolated Storybook canvas. Matches every
    // other reviewed component's established precedent for this same set
    // of four (Button, ProgressBar, Checkbox…).
    id: { control: false, description: "Standard DOM id." },
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Merged with the component's own internal classes rather than replacing them.",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto the component's own internal styles.",
    },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // boolean"/"Set string" placeholder instead of a live, interactive
  // control (see guidelines/07-storybook-and-documentation-standards.md §5).
  // `loadingLabel` gets a real, non-blank demo value rather than "" —
  // IconButton still resolves it via `loadingLabel ?? aria-label`, and an
  // explicit empty string would silently win over `aria-label` the same
  // way Button's own `loadingText ?? children` once did.
  // `defaultPressed`/`onPressedChange` are deliberately absent here (found
  // in review, fixed at explicit direction) — `defaultPressed: false` used
  // to live in this shared args object, which meant `isToggle` was `true`
  // for every single story in this file (`false` is still a *defined*
  // value), none of which ever demonstrated IconButton's actual default,
  // non-toggle appearance. Toggle mode is opted into per-story instead —
  // the Playground's own "Interaction mode" control, or the dedicated
  // `Toggle` story below.
  args: {
    icon: "Heart" as unknown as IconButtonProps["icon"],
    variant: "primary",
    size: "md",
    isLoading: false,
    loadingLabel: "Favoriting…",
    asChild: false,
    rounded: false,
    "aria-label": "Favorite",
    type: "button",
    disabled: false,
    onClick: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof IconButton>;

type InteractionMode = "Non-toggle" | "Toggle";

// `interactionMode` is a Playground-only Controls axis, not a real
// IconButtonProps field — `defaultPressed`/`onPressedChange` don't have a
// sensible standalone control on their own (see each one's own argTypes
// description above), and a bare `defaultPressed` boolean can't represent
// "not a toggle at all" (see the meta-level comment above `pressed`). This
// one synthetic select composes them into a single, correctly-behaving
// control — same pattern as Tag's own Playground. Defaults to
// "Non-toggle" — IconButton's real zero-extra-props default — so the
// Playground's initial render matches what a plain `<IconButton>` actually
// looks like, rather than starting pre-opted into toggle mode.
interface PlaygroundArgs extends IconButtonProps {
  interactionMode: InteractionMode;
}

export const Playground: Story = {
  // Cast: `interactionMode` isn't part of `IconButtonProps` — see the
  // interface and comment above. `onPressedChange` is created once here
  // (module-eval time, not per-render) so its identity — and Actions-panel
  // call history — stays stable across unrelated control changes, matching
  // every other `fn()` usage in this file.
  args: {
    interactionMode: "Non-toggle",
    defaultPressed: false,
    onPressedChange: fn(),
  } as Partial<PlaygroundArgs>,
  argTypes: {
    interactionMode: {
      name: "Interaction mode",
      control: "select",
      options: ["Non-toggle", "Toggle"],
      description:
        'Playground-only control (not a real IconButtonProps field). "Non-toggle": neither defaultPressed nor onPressedChange is applied — IconButton\'s real default. "Toggle": wires defaultPressed + onPressedChange (uncontrolled, so the button below toggles live on click with no external state needed).',
    },
  } as NonNullable<Meta<typeof IconButton>["argTypes"]>,
  render: (args) => {
    const { interactionMode, defaultPressed, onPressedChange, ...rest } =
      args as PlaygroundArgs;
    if (interactionMode === "Toggle") {
      return (
        <IconButton
          {...rest}
          defaultPressed={defaultPressed}
          onPressedChange={onPressedChange}
        />
      );
    }
    return <IconButton {...rest} />;
  },
};

export const AllVariants: Story = {
  name: "All variants",
  // `variant` is the whole point of this grid, paired with `icon`/
  // `aria-label` (fixed together per instance so every button keeps the
  // "delete" narrative and a distinct accessible name) — no single control
  // value could represent any of the three. Every other prop (`size`,
  // `isLoading`, `rounded`, `disabled`, …) stays live and shared via
  // `{...args}`, matching ProgressBar's own AllTones/AllSizes precedent —
  // previously this story used a bare `render: () => (...)` that ignored
  // args entirely, making every control here a silent no-op (found in
  // review).
  argTypes: {
    variant: { control: false },
    icon: { control: false },
    "aria-label": { control: false },
  },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--dbm-space-4)" }}>
      {(
        ["primary", "secondary", "tertiary", "ghost", "destructive"] as const
      ).map((variant) => (
        <IconButton
          key={variant}
          {...args}
          icon={TrashIcon}
          aria-label={`${variant} delete`}
          variant={variant}
        />
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  // `size` is the whole point of this grid, paired with `icon`/
  // `aria-label` (fixed together per instance, same reasoning as
  // AllVariants above). Every other prop stays live and shared via
  // `{...args}`.
  argTypes: {
    size: { control: false },
    icon: { control: false },
    "aria-label": { control: false },
  },
  render: (args) => (
    <div style={{ alignItems: "center", display: "flex", gap: "var(--dbm-space-4)" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <IconButton
          key={size}
          {...args}
          icon={HeartIcon}
          aria-label={`Favorite (${size})`}
          size={size}
        />
      ))}
    </div>
  ),
};

export const Loading: Story = {
  name: "Loading state",
  args: { isLoading: true },
};

export const LoadingWithLoadingLabel: Story = {
  name: "Loading state with loadingLabel",
  args: { isLoading: true, loadingLabel: "Favoriting…" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Rounded: Story = {
  name: "Rounded (circular)",
  args: { rounded: true },
};

export const Toggle: Story = {
  name: "Toggle (click to favorite)",
  // Uncontrolled (`defaultPressed`) — IconButton manages its own pressed
  // state internally, so clicking directly in the canvas visibly toggles
  // the pressed treatment with no story-level state needed, same pattern
  // as Tag's own `Selectable` story. `ghost` is the clearer variant for
  // this demo — its transparent-at-rest look makes the brand-tinted
  // pressed fill an obvious, unambiguous change; `onPressedChange: fn()`
  // logs each toggle to the Actions panel.
  args: { variant: "ghost", defaultPressed: false, onPressedChange: fn() },
};

export const AsChild: Story = {
  name: "asChild (renders as an anchor)",
  // Every other prop stays live and shared via `{...args}` (`asChild`
  // itself is forced regardless, matching the story's purpose — it's
  // already `control: false` at the meta level). Previously this story
  // used a bare `render: () => (...)` that ignored args entirely, making
  // every control here a silent no-op (found in review) — same regression
  // class, and same fix, as Button's own `AsChild` story.
  render: (args) => (
    <IconButton {...args} asChild>
      <a href="/favorite">
        <HeartIcon />
      </a>
    </IconButton>
  ),
};

export const AsChildDisabled: Story = {
  name: "asChild + disabled (aria-disabled, click blocked)",
  // Same reasoning as AsChild above — `disabled: true` is a story-level
  // arg default (live/toggleable in Controls) rather than hardcoded in
  // render.
  args: { disabled: true },
  render: (args) => (
    <IconButton {...args} asChild>
      <a href="/favorite">
        <HeartIcon />
      </a>
    </IconButton>
  ),
};
