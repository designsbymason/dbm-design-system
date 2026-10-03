import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { Text } from "../../atoms/Text";
import { FormField } from "../FormField";
import { TimeRangePicker } from "./TimeRangePicker";
import { timeRangePickerPlaygroundSnippet, timeRangePickerSnippets } from "./TimeRangePicker.snippets";
import type { TimeRangeValue } from "./TimeRangePicker.types";

const meta: Meta<typeof TimeRangePicker> = {
  title: "Molecules/Inputs/TimeRangePicker",
  component: TimeRangePicker,
  parameters: { layout: "padded" },
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Overall size of both fields, on the shared scale.",
      table: { defaultValue: { summary: '"md"' } },
    },
    hasError: {
      control: "boolean",
      description: "Shows the error state on both ends. An end earlier than the start shows it on that end without this.",
      table: { defaultValue: { summary: "false" } },
    },
    value: {
      control: false,
      description:
        "The range, as [start, end] 24-hour strings: [\"09:00\", \"17:30\"]. Use \"\" for an end with no time yet. Controlled: pair it with onValueChange.",
    },
    defaultValue: {
      control: "object",
      description: "The initial range for uncontrolled usage — ignored once value is provided.",
      table: { defaultValue: { summary: '["", ""]' } },
    },
    onValueChange: {
      control: false,
      description:
        "Called with the new [start, end] whenever either end changes. An end that is empty or still half-filled is \"\". An end earlier than the start is reported as typed and flagged invalid, not refused.",
    },
    hourCycle: {
      control: "select",
      options: ["12", "24"],
      description:
        "\"12\" shows each end with an AM/PM segment; \"24\" does not. Chosen explicitly, never read from the locale.",
      table: { defaultValue: { summary: '"12"' } },
    },
    showSeconds: {
      control: "boolean",
      description: "Shows a seconds segment on both ends, making each value \"HH:mm:ss\".",
      table: { defaultValue: { summary: "false" } },
    },
    step: {
      control: "number",
      description: "Minutes between the minute values either end accepts: 15 allows :00 :15 :30 :45.",
      table: { defaultValue: { summary: "1" } },
    },
    min: {
      control: "text",
      description: "The earliest time either end may be, as \"HH:mm\". The end's earliest is also the start.",
    },
    max: { control: "text", description: "The latest time either end may be, as \"HH:mm\"." },
    showPicker: {
      control: "boolean",
      description: "Shows each end's picker button.",
      table: { defaultValue: { summary: "true" } },
    },
    clearable: {
      control: "boolean",
      description:
        "Shows a clear (×) button while an end has something in it. Pass it to turn the button on without having anything to do when it is used; onClear also turns it on, and clearable={false} turns it off whatever else is passed. Clearing empties that end, calling onClear with which one.",
      table: { defaultValue: { summary: "false" } },
    },
    onClear: {
      control: false,
      description:
        "Called, with which end, after a clear button has emptied that end. Passing it also shows the buttons, unless clearable={false}.",
    },
    disabled: { control: "boolean", description: "Disables both ends.", table: { defaultValue: { summary: "false" } } },
    required: {
      control: "boolean",
      description: "Marks the range as required for assistive technology.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: { control: "boolean", description: "Makes both ends read-only.", table: { defaultValue: { summary: "false" } } },
    autoFocus: {
      control: false,
      description: "Focuses the start field's first segment on mount.",
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      control: false,
      description: "The name a surrounding <form> submits both values under — name[], as RangeSlider does — start first.",
    },
    form: { control: false, description: "Associates the hidden form inputs with a <form> by id." },
    labels: {
      control: false,
      description:
        "Every piece of text the fields write themselves, and the two end names (Start time, End time), for translation. Pass only the keys you want to change.",
    },
    formatNumber: {
      control: false,
      description: "Writes a number in the digits you want shown; see TimePicker. Never defaulted to a locale.",
    },
    "aria-label": { control: "text", description: "The range's accessible name when there is no visible label to point aria-labelledby at." },
    "aria-labelledby": { control: false, description: "Points at the visible label that names the range. A FormField passes this." },
    "aria-describedby": { control: false, description: "Points at helper or error text. A FormField passes this." },
    id: {
      control: false,
      description:
        "Standard DOM id, applied to the start field's first segment — what a FieldLabel's htmlFor should point at. A FormField does this.",
    },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every control has a real value (an empty string for the optional text props), so none renders as an inert "Set string"
  // placeholder; the defaults match the component's own.
  args: {
    size: "md",
    hasError: false,
    defaultValue: ["09:00", "17:30"],
    hourCycle: "12",
    showSeconds: false,
    step: 1,
    min: "",
    max: "",
    showPicker: true,
    clearable: false,
    disabled: false,
    required: false,
    readOnly: false,
    "aria-label": "Opening hours",
    onValueChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof TimeRangePicker>;

const noControls = {
  value: { control: false },
  defaultValue: { control: false },
  onValueChange: { control: false },
  hourCycle: { control: false },
  showSeconds: { control: false },
  step: { control: false },
  min: { control: false },
  max: { control: false },
  size: { control: false },
  hasError: { control: false },
  disabled: { control: false },
  readOnly: { control: false },
  required: { control: false },
  showPicker: { control: false },
  clearable: { control: false },
  onClear: { control: false },
  "aria-label": { control: false },
} as const;

const stack = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", alignItems: "flex-start" } as const;

/** Type each end, step it, or open its picker; drive every prop from the Controls panel. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => timeRangePickerPlaygroundSnippet(context.args),
      },
    },
  },
};

export const HourCycles: Story = {
  name: "12-hour and 24-hour",
  parameters: { docs: { source: { code: timeRangePickerSnippets.hourCycles } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <TimeRangePicker hourCycle="12" aria-label="Opening hours, 12-hour" defaultValue={["09:00", "17:30"]} />
      <TimeRangePicker hourCycle="24" aria-label="Opening hours, 24-hour" defaultValue={["09:00", "17:30"]} />
    </div>
  ),
};

export const Constrained: Story = {
  name: "The end can't be before the start",
  parameters: { docs: { source: { code: timeRangePickerSnippets.constrained } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <TimeRangePicker hourCycle="24" step={15} min="08:00" max="18:00" aria-label="Meeting" defaultValue={["14:00", "13:00"]} />
      <Text size="sm" color="secondary">
        The end is before the start, so it is flagged; open its picker to see the earlier times disabled.
      </Text>
    </div>
  ),
};

export const Controlled: Story = {
  name: "Controlled value",
  parameters: { docs: { source: { code: timeRangePickerSnippets.controlled } } },
  argTypes: { ...noControls },
  render: function ControlledStory() {
    const [range, setRange] = useState<TimeRangeValue>(["09:00", ""]);
    return (
      <div style={stack}>
        <TimeRangePicker aria-label="Opening hours" value={range} onValueChange={setRange} />
        <Text size="sm" color="secondary">
          Value: <code>{JSON.stringify(range)}</code>
        </Text>
      </div>
    );
  },
};

export const Clearable: Story = {
  name: "With clear buttons",
  parameters: { docs: { source: { code: timeRangePickerSnippets.clearable } } },
  argTypes: { ...noControls },
  render: () => <TimeRangePicker aria-label="Opening hours" defaultValue={["09:00", "17:30"]} clearable />,
};

export const InFormField: Story = {
  name: "In a FormField",
  parameters: { docs: { source: { code: timeRangePickerSnippets.formField } } },
  argTypes: { ...noControls },
  render: () => (
    <FormField label="Opening hours" helperText="In your local time">
      {(field) => <TimeRangePicker {...field} />}
    </FormField>
  ),
};
