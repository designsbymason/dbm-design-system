import {
  ArrowRightIcon,
  CheckIcon,
  DownloadIcon,
  HeartIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  WalletIcon,
} from "@dbm-design-system/icons";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Button } from "./Button";
import type { ButtonProps } from "./Button.types";

// `icon`/`trailingIcon` take component references, not strings (see
// guidelines/05-component-api-conventions.md §5) — Storybook's Controls
// panel can't natively drive an arbitrary component reference, so this maps
// a small curated set of real icons onto string keys via `argTypes.mapping`.
// Selecting "None" maps to `undefined`, letting the control double as an
// on/off toggle for whichever slot it's wired to.
const iconMapping = {
  None: undefined,
  Wallet: WalletIcon,
  Trash: TrashIcon,
  Heart: HeartIcon,
  Star: StarIcon,
  Plus: PlusIcon,
  Check: CheckIcon,
  Download: DownloadIcon,
  ArrowRight: ArrowRightIcon,
};
const iconControl = {
  control: "select" as const,
  options: Object.keys(iconMapping),
  mapping: iconMapping,
};

const meta: Meta<typeof Button> = {
  title: "Atoms/Inputs/Button",
  component: Button,
  // No `tags: ["autodocs"]` — Button.mdx is a hand-authored Docs page (see
  // guidelines/07-storybook-and-documentation-standards.md §4) that embeds
  // this file's stories via `<Meta of={ButtonStories} />`.
  parameters: { layout: "padded" },
  argTypes: {
    // Native props Storybook's docgen extracts with no description at all
    // (not the same "drops the row entirely" bug as the aria-*/className
    // block below — these rows already appear, just blank) — every prop
    // needs an actual description (see
    // guidelines/07-storybook-and-documentation-standards.md §5), so they
    // get one explicitly here too.
    children: { description: "The button's visible label content." },
    disabled: {
      description:
        "Disables the button natively. Prefer this over `isLoading` alone when the button should look and behave as inert, not just busy.",
    },
    onClick: { description: "Fires on click, unless disabled/loading blocks it." },
    variant: {
      control: "select",
      options: ["primary", "secondary", "tertiary", "ghost", "destructive"],
    },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    type: { control: "select", options: ["button", "submit", "reset"] },
    icon: { ...iconControl, description: "Leading icon (select 'None' to omit)." },
    trailingIcon: {
      ...iconControl,
      description: "Trailing icon (select 'None' to omit).",
    },
    asChild: { control: false },
    // `className`/`aria-label`/`aria-labelledby`/`id`/`data-testid` are all
    // explicitly declared (with JSDoc) in ButtonProps, but Storybook's
    // default docgen (babel-based `react-docgen`, not the TS-checker-based
    // `react-docgen-typescript`) silently drops several inherited-and-
    // redeclared native props from the extracted Properties table for
    // reasons that don't reduce to a single clean rule — confirmed
    // empirically, not guessed (see guidelines/07-storybook-and-
    // documentation-standards.md §5). Declaring them here explicitly is the
    // reliable fix, same pattern as `icon`/`trailingIcon`/`type` above.
    "aria-label": {
      control: "text",
      description:
        "Accessible label announced by assistive tech instead of the visible label content.",
    },
    "aria-labelledby": {
      control: false,
      description:
        "Points to the id of an existing, already-visible element to use as the accessible name instead.",
    },
    id: { control: false, description: "Standard DOM id." },
    className: {
      control: false,
      description: "Additional CSS classes for customization.",
    },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — an arg left `undefined` renders as an inert "Set
  // boolean"/"Set string" placeholder button in Controls instead of a live,
  // interactive widget (see guidelines/07-storybook-and-documentation-standards.md §5).
  args: {
    children: "Button",
    variant: "primary",
    size: "md",
    type: "button",
    "aria-label": "",
    // Storybook's `mapping` (see `iconControl` above) resolves these
    // string keys to the real icon component (or `undefined` for "None")
    // before the story renders — the args value here matches the
    // Controls-panel select's option key, not `ButtonProps["icon"]`
    // itself, hence the cast.
    icon: "None" as unknown as ButtonProps["icon"],
    trailingIcon: "None" as unknown as ButtonProps["icon"],
    isLoading: false,
    loadingText: "",
    fullWidth: false,
    disabled: false,
    onClick: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {};

export const AllVariants: Story = {
  name: "All variants",
  render: () => (
    <div style={{ display: "flex", gap: "1rem" }}>
      {(
        ["primary", "secondary", "tertiary", "ghost", "destructive"] as const
      ).map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All sizes",
  render: () => (
    <div style={{ alignItems: "center", display: "flex", gap: "1rem" }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Button key={size} size={size}>
          Size {size}
        </Button>
      ))}
    </div>
  ),
};

export const WithIcons: Story = {
  name: "Leading and trailing icons",
  render: () => (
    <div style={{ display: "flex", gap: "1rem" }}>
      <Button icon={WalletIcon}>Pay</Button>
      <Button trailingIcon={WalletIcon}>Pay</Button>
      {/* `icon` and `trailingIcon` are independent — both render together
          whenever both are passed. */}
      <Button icon={DownloadIcon} trailingIcon={ArrowRightIcon}>
        Export
      </Button>
      <Button variant="destructive" icon={TrashIcon}>
        Delete
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  name: "Loading state",
  args: { isLoading: true, children: "Saving" },
};

export const LoadingWithLoadingText: Story = {
  name: "Loading state with loadingText",
  args: { isLoading: true, loadingText: "Saving…", children: "Save" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const FullWidth: Story = {
  name: "Full width",
  render: () => (
    <div style={{ maxWidth: "24rem" }}>
      <Button fullWidth>Continue</Button>
    </div>
  ),
};

export const AsChild: Story = {
  name: "asChild (renders as an anchor)",
  render: () => (
    <Button asChild>
      <a href="/next">Continue as a link</a>
    </Button>
  ),
};

export const AsChildDisabled: Story = {
  name: "asChild + disabled (aria-disabled, click blocked)",
  render: () => (
    <Button asChild disabled>
      <a href="/next">Continue as a link</a>
    </Button>
  ),
};

export const ClickInteraction: Story = {
  name: "Interaction: fires onClick",
  args: { children: "Click me" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Click me" }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const DisabledInteraction: Story = {
  name: "Interaction: disabled blocks click",
  args: { children: "Click me", disabled: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Click me" });
    await expect(button).toBeDisabled();
    // A disabled native button doesn't dispatch click events at all — this
    // confirms the browser itself is blocking interaction, not just that
    // our handler happens not to fire.
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const KeyboardInteraction: Story = {
  name: "Interaction: focusable and activatable via Enter",
  args: { children: "Click me" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Click me" });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const SpaceKeyInteraction: Story = {
  name: "Interaction: activatable via Space",
  args: { children: "Click me" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Click me" });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    // A native <button> activates on Space as well as Enter — verified
    // separately since it's a distinct browser behavior, not a consequence
    // of the Enter path above.
    await userEvent.keyboard(" ");
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const AsChildDisabledInteraction: Story = {
  name: "Interaction: asChild + disabled blocks click",
  args: { onClick: fn() },
  render: (args) => (
    <Button asChild disabled onClick={args.onClick}>
      <a href="/next">Continue as a link</a>
    </Button>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Continue as a link" });
    await expect(link).toHaveAttribute("aria-disabled", "true");
    // Unlike a native disabled <button>, the slotted <a> is still
    // technically clickable in the DOM — this confirms Button's own
    // click-blocking handler stops the click, not the browser.
    await userEvent.click(link);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
