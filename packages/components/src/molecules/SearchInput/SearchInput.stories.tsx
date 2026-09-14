import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";
import { Kbd } from "../../atoms/Kbd";
import { SearchInput } from "./SearchInput";

const meta: Meta<typeof SearchInput> = {
  title: "Molecules/Inputs/SearchInput",
  component: SearchInput,
  parameters: { layout: "padded" },
  // Ordered content-ish prop first (placeholder), then the slot prop, then
  // core visual/behavioral props, then advanced/escape-hatch props last —
  // same sequencing principle as Input's/NumberInput's own stories file
  // (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    placeholder: {
      control: "text",
      description: "Native placeholder text shown when the input is empty.",
    },
    suffix: {
      control: false,
      description: "Trailing slot content — a keyboard-shortcut hint, a result count, etc.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Font size and padding, matching the shared size scale.",
    },
    hasError: {
      control: "boolean",
      description: "Marks the input as invalid, visually and via aria-invalid.",
    },
    isLoading: {
      control: "boolean",
      description: "Swaps the leading search icon for a spinner while an async search is in flight.",
    },
    // `control: false` — driving `value` from Controls without a real
    // `onChange` wired back would freeze the input, same reasoning as
    // Input's own `value`. The Playground demonstrates the uncontrolled
    // path via `defaultValue` instead.
    value: {
      control: false,
      description: "The controlled value.",
    },
    defaultValue: {
      control: "text",
      description: "The initial value when uncontrolled.",
    },
    onChange: {
      control: false,
      description: "The raw native change event, fired on every keystroke. Prefer onSearch for \"the user paused/committed a query.\"",
    },
    onSearch: {
      control: false,
      description:
        "Called with the value once the user pauses typing for debounceMs. Also fires immediately on Enter and when cleared.",
    },
    debounceMs: {
      control: "number",
      description: "Milliseconds to wait after the last keystroke before calling onSearch. 0 disables debouncing.",
    },
    onClear: {
      control: false,
      description:
        "Shows a clear (×) button after suffix whenever the input has a value, calling this when it's clicked or Escape is pressed. The value itself already resets — this is a supplementary notification. See the \"With a clear button\" story for a live demo.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the input and its clear button natively.",
    },
    required: {
      control: "boolean",
      description:
        "Marks the input as required for HTML5 form validation. Pair with a FieldLabel whose own required shows the matching visual asterisk.",
    },
    readOnly: {
      control: "boolean",
      description: "Prevents editing without disabling the input — the clear button is disabled too while read-only.",
    },
    // `control: false` — autoFocus only takes effect on mount, so toggling
    // it live in the Controls panel has no visible feedback to demo.
    autoFocus: {
      control: false,
      description: "Focuses the input automatically on mount. Use sparingly.",
    },
    // `control: false` — has no visible effect inside an isolated
    // Storybook iframe.
    autoComplete: {
      control: false,
      description: "Hints the browser's autofill — typically 'off' for a live search field.",
    },
    maxLength: {
      control: "number",
      description: "Maximum number of characters the input accepts.",
    },
    minLength: {
      control: "number",
      description: "Minimum number of characters required for HTML5 form validation.",
    },
    pattern: {
      control: "text",
      description: "A regular expression the value must match for HTML5 form validation.",
    },
    // `control: false` — only affects which virtual keyboard a mobile
    // device shows, invisible in a desktop browser Storybook preview.
    inputMode: {
      control: false,
      description: "Hints which virtual keyboard a mobile device should show.",
    },
    name: {
      control: "text",
      description: "Form field name, submitted in the surrounding <form>'s data.",
    },
    // `control: false` — only meaningful paired with a real <form> whose
    // id it points to, which the Playground's own plain demo doesn't have.
    form: {
      control: false,
      description: "Associates the input with a <form> by id.",
    },
    "aria-label": {
      control: "text",
      description:
        "Accessible label announced by assistive tech when there's no visible label (e.g. no paired FieldLabel).",
    },
    "aria-labelledby": {
      control: false,
      description:
        "Points to the id of an existing, already-visible element to use as the accessible name instead.",
    },
    "aria-describedby": {
      control: false,
      description:
        "Points to the id of a helper or error message associated with this input (e.g. a paired FieldHelperText or FieldError).",
    },
    id: {
      control: false,
      description: "Standard DOM id, applied to the native <input> element.",
    },
    className: {
      control: false,
      description:
        "Additional CSS classes for customization. Applies to the underlying Input's own wrapper.",
    },
    style: {
      control: false,
      description:
        "Inline styles, merged onto Input's own internal styles. Applies to the same wrapper className targets.",
    },
    "data-testid": {
      control: false,
      description: "Test identifier for automated testing.",
    },
  },
  // Every controllable prop gets an explicit value here, matching its real
  // component default — see guidelines/07-storybook-and-documentation-
  // standards.md §5.
  args: {
    placeholder: "Search…",
    size: "md",
    defaultValue: "",
    hasError: false,
    isLoading: false,
    debounceMs: 300,
    disabled: false,
    required: false,
    readOnly: false,
    name: "",
    "aria-label": "Search",
    onSearch: fn(),
  },
  render: (args) => (
    <div style={{ maxWidth: "16rem" }}>
      <SearchInput {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof SearchInput>;

/** Drive every prop live via the Controls panel below. */
export const Playground: Story = {};

export const AllSizes: Story = {
  name: "All sizes",
  // `size` is the whole point of this grid — each instance intentionally
  // varies it, so no single control value could represent them.
  // `hasError`/`disabled` still stay live and shared via `{...args}`.
  argTypes: { size: { control: false } },
  render: (args) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--dbm-space-3)",
        maxWidth: "16rem",
      }}
    >
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <SearchInput key={size} {...args} size={size} aria-label={`Size ${size}`} />
      ))}
    </div>
  ),
};

export const Loading: Story = {
  name: "Loading",
  args: { isLoading: true, defaultValue: "cats" },
};

export const Clearable: Story = {
  name: "With a clear button",
  // `value`/`onChange`/`onClear` are all driven by this story's own local
  // state (the whole point of the demo) — but `size`/`hasError`/`disabled`
  // are still meaningful to preview here and stay live via `{...args}`.
  //
  // `defaultValue: undefined` overrides the meta-level default, same
  // controlled/uncontrolled-conflict fix as Input's/NumberInput's own
  // Clearable stories — this story sets its own controlled `value` below.
  args: { defaultValue: undefined },
  argTypes: { defaultValue: { control: false }, onChange: { control: false } },
  render: function ClearableStory(args) {
    const [value, setValue] = useState("cats");
    return (
      <div style={{ maxWidth: "16rem" }}>
        <SearchInput
          {...args}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onClear={() => setValue("")}
        />
      </div>
    );
  },
};

export const WithSuffix: Story = {
  name: "With a suffix hint",
  args: { suffix: <Kbd aria-label="Command K">⌘K</Kbd> },
};

export const NoDebounce: Story = {
  name: "No debounce (debounceMs=0)",
  args: { debounceMs: 0, defaultValue: "" },
  argTypes: { debounceMs: { control: false } },
};

export const ErrorState: Story = {
  name: "Error state",
  args: { hasError: true, defaultValue: "xk#" },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "cats" },
};

export const SearchInteraction: Story = {
  name: "Interaction: debounced onSearch fires once, after typing settles",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("searchbox");

    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await userEvent.type(input, "cats");
    await expect(args.onSearch).not.toHaveBeenCalled();

    // Real timers in a play function — waits out the actual debounce
    // window rather than faking it, since Storybook's own interaction
    // runner doesn't fake timers the way a unit test can.
    await pause(400);
    await expect(args.onSearch).toHaveBeenCalledWith("cats");
    await pause(400);
  },
};

export const EnterInteraction: Story = {
  name: "Interaction: Enter fires onSearch immediately",
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("searchbox");

    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await userEvent.type(input, "dogs");
    await userEvent.keyboard("{Enter}");
    await expect(args.onSearch).toHaveBeenCalledWith("dogs");
    await pause(500);
  },
};

export const ClearButtonInteraction: Story = {
  name: "Interaction: clear button resets the value and calls onClear",
  args: { defaultValue: "cats", onClear: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("searchbox");
    const clearButton = canvas.getByRole("button", { name: "Clear" });

    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await pause(500);

    await userEvent.click(clearButton);
    await expect(args.onClear).toHaveBeenCalledTimes(1);
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue("");
    await pause(600);
  },
};

export const DisabledInteraction: Story = {
  name: "Interaction: disabled blocks typing",
  args: { disabled: true, defaultValue: "cats" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await expect(canvas.getByRole("searchbox")).toBeDisabled();
    await pause(800);
  },
};
