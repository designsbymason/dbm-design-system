import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { FormField } from "../../molecules/FormField";
import { DatePicker } from "./DatePicker";
import { datePickerPlaygroundSnippet, datePickerSnippets } from "./DatePicker.snippets";

const meta: Meta<typeof DatePicker> = {
  title: "Organisms/Inputs/DatePicker",
  component: DatePicker,
  parameters: { layout: "padded" },
  // Core value props first, then the format and constraint props, then visual and state props, then the calendar and
  // form wiring, then advanced/escape-hatch props last (07-storybook-and-documentation-standards.md §4 item 3).
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Overall size, on the shared scale; its height matches Input at the same step.",
      table: { defaultValue: { summary: '"md"' } },
    },
    hasError: {
      control: "boolean",
      description:
        "Shows the error state: a danger-coloured border and aria-invalid. A date outside min/max, one ruled out by isDateDisabled and three numbers that are not a real date show it too without this.",
      table: { defaultValue: { summary: "false" } },
    },
    value: {
      control: false,
      description:
        'The date, as "YYYY-MM-DD". "" or omitted for no date. While the field is only partly filled, or holds numbers that are not a real date, it is "".',
    },
    defaultValue: {
      control: "text",
      description: 'The initial date for uncontrolled usage, as "YYYY-MM-DD" — ignored once value is provided.',
      table: { defaultValue: { summary: '""' } },
    },
    onValueChange: {
      control: false,
      description:
        'Called with the new value whenever it changes: a real date as "YYYY-MM-DD", or "" when a segment is cleared and the date is no longer complete.',
    },
    commitOn: {
      control: "select",
      options: ["change", "complete", "blur"],
      description:
        '"change" reports every change, a year typed one digit at a time included. "complete" waits until no digit is still expected and the calendar is closed. "blur" reports once, when focus leaves, the calendar closes or Enter is pressed. A day chosen in the calendar and the clear button are never held. The segments always show the latest edit.',
      table: { defaultValue: { summary: '"change"' } },
    },
    format: {
      control: "select",
      options: ["mdy", "dmy", "ymd"],
      description:
        'The order the segments are written in: "mdy" (month, day, year), "dmy" or "ymd". Chosen explicitly and never read from the browser\'s locale. The value is "YYYY-MM-DD" whichever is shown.',
      table: { defaultValue: { summary: '"mdy"' } },
    },
    separator: {
      control: "text",
      description: "The text drawn between the segments. A typed separator character moves to the next segment.",
      table: { defaultValue: { summary: '"/"' } },
    },
    min: {
      control: "text",
      description:
        'The earliest allowed date, as "YYYY-MM-DD". An earlier date is flagged invalid, not refused, and the calendar disables the days before it.',
    },
    max: {
      control: "text",
      description:
        'The latest allowed date, as "YYYY-MM-DD". A later date is flagged invalid, not refused, and the calendar disables the days after it.',
    },
    isDateDisabled: {
      control: false,
      description:
        'Rules out particular dates: weekends, holidays, booked days. Called with a date as "YYYY-MM-DD"; return true for one that is not available. A date it rules out is flagged invalid and still reported, and the calendar disables it. Keep it cheap and pure.',
    },
    weekStartsOn: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6],
      description: "The day each calendar week starts on, 0 (Sunday) to 6. Explicit, never read from the locale.",
      table: { defaultValue: { summary: "0" } },
    },
    showTodayButton: {
      control: "boolean",
      description: "Shows a Today button in the calendar that chooses today's date.",
      table: { defaultValue: { summary: "false" } },
    },
    today: {
      control: false,
      description:
        "Today's date as YYYY-MM-DD, for marking today in the calendar and starting an empty year at this year. By default the browser's date is read after the first render, so nothing differs between a server and the browser.",
    },
    calendarProps: {
      control: false,
      description:
        "Any other Calendar prop for the calendar inside the panel: numberOfMonths, captionLayout, showWeekNumbers, getMarker, footer, labels (month and weekday names), size and the rest. The props DatePicker owns itself are not accepted here.",
    },
    showPicker: {
      control: "boolean",
      description:
        "Shows the button that opens the calendar. Turn it off for a field that is only ever typed into. Alt+ArrowDown in a segment opens it too.",
      table: { defaultValue: { summary: "true" } },
    },
    open: {
      control: false,
      description: "The controlled open state of the calendar. Omit (along with defaultOpen) to manage it internally.",
    },
    defaultOpen: {
      control: "boolean",
      description: "The initial open state of the calendar for uncontrolled usage — ignored once open is provided.",
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      control: false,
      description: "Called with the calendar's new open state whenever it changes.",
    },
    clearable: {
      control: "boolean",
      description:
        "Shows a clear (×) button while any segment has something in it. Passing onClear turns it on too; clearable={false} turns it off whatever else is passed.",
      table: { defaultValue: { summary: "false" } },
    },
    onClear: {
      control: false,
      description: "Called after the clear button has emptied the field. Passing it also shows the button, unless clearable={false}.",
    },
    onFocus: {
      control: false,
      description:
        "Called when focus arrives in the field from outside it. Moving between the segments, the buttons or into the calendar is not arriving, so it fires once per visit.",
    },
    onBlur: {
      control: false,
      description:
        "Called when focus leaves the field for somewhere outside it (the calendar counts as part of the field). With commitOn it fires after the held value has been reported.",
    },
    disabled: {
      control: "boolean",
      description: "Disables the whole field: no segment takes focus, the buttons are inert, and nothing changes.",
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      control: "boolean",
      description:
        "Marks the field as required: aria-required on each segment, and a real form constraint, so a surrounding <form> will not submit while the field is empty. A half-filled field, an impossible date and a date outside min/max or ruled out stop a submit too.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description:
        "Makes the field read-only: its segments can be focused and read but not changed, and the calendar and the clear button are hidden.",
      table: { defaultValue: { summary: "false" } },
    },
    autoFocus: {
      control: false,
      description:
        "Focuses the first segment when the field mounts. (React's own autoFocus only works on a native form control, so this is done with a ref and an effect.)",
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      control: "text",
      description:
        'The name a surrounding <form> submits the value under, through a hidden date input holding "YYYY-MM-DD" (and "" while the field is empty or incomplete). The same input is what a form validates.',
    },
    form: {
      control: false,
      description: "Associates the hidden form input with a <form> by id, when this is not inside it.",
    },
    dir: {
      control: "select",
      options: ["ltr", "rtl"],
      description:
        "Text direction of the calendar and the field's buttons. The segments are always drawn left to right, since a date's numbers read in the order its format gives.",
      table: { defaultValue: { summary: '"ltr"' } },
    },
    labels: {
      control: false,
      description:
        "Every piece of text the field writes itself — segment names and the button names — for translation. Pass only the keys you want to change. Defaults: Day, Month, Year, Empty, Choose date, Choose a date, Clear date, Enter a complete date, This date doesn't exist, This date isn't available.",
    },
    formatNumber: {
      control: false,
      description:
        'Writes a number in the digits you want shown: (n) => n.toLocaleString("ar-EG"). Used for the digits on screen, in the calendar and in what a screen reader hears; typing digits of any script still works. Never defaulted to a locale.',
    },
    "aria-label": {
      control: "text",
      description:
        "The field's accessible name when there is no visible label to point aria-labelledby at. Applied to the group the segments sit in.",
    },
    "aria-labelledby": {
      control: false,
      description: "Points at the visible label that names the field. A FormField passes this.",
    },
    "aria-describedby": {
      control: false,
      description: "Points at helper or error text. A FormField passes this.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id, applied to the first segment — which is what a FieldLabel's htmlFor should point at, so clicking the label focuses the field. A FormField already does this.",
    },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  // Every control has a real value (an empty string for the optional text props), so none renders as an inert "Set string" or
  // "Set boolean" placeholder; the defaults match the component's own.
  args: {
    size: "md",
    hasError: false,
    defaultValue: "2026-10-15",
    commitOn: "change",
    format: "mdy",
    separator: "/",
    min: "",
    max: "",
    weekStartsOn: 0,
    showTodayButton: false,
    today: "2026-10-16",
    showPicker: true,
    defaultOpen: false,
    clearable: false,
    disabled: false,
    required: false,
    readOnly: false,
    dir: "ltr",
    name: "",
    "aria-label": "Start date",
    onValueChange: fn(),
  },
};

export default meta;

type Story = StoryObj<typeof DatePicker>;

// The fixed-render stories below show one thing each; every control that render ignores is switched off.
const noControls = {
  value: { control: false },
  defaultValue: { control: false },
  onValueChange: { control: false },
  commitOn: { control: false },
  format: { control: false },
  separator: { control: false },
  min: { control: false },
  max: { control: false },
  isDateDisabled: { control: false },
  weekStartsOn: { control: false },
  showTodayButton: { control: false },
  today: { control: false },
  onFocus: { control: false },
  onBlur: { control: false },
  size: { control: false },
  hasError: { control: false },
  disabled: { control: false },
  readOnly: { control: false },
  required: { control: false },
  showPicker: { control: false },
  defaultOpen: { control: false },
  clearable: { control: false },
  onClear: { control: false },
  dir: { control: false },
  name: { control: false },
  "aria-label": { control: false },
} as const;

const stack = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-4)", alignItems: "flex-start" } as const;

// A fixed "today" keeps every story, and its screenshots, the same on any day.
const TODAY = "2026-10-16";

/** Type a date into the segments, step them with the arrow keys, or open the calendar; drive every prop from the Controls panel. */
export const Playground: Story = {
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext) => datePickerPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Sizes: Story = {
  name: "Sizes",
  parameters: { docs: { source: { code: datePickerSnippets.sizes } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <DatePicker key={size} size={size} aria-label={`Start date, ${size}`} defaultValue="2026-10-03" today={TODAY} />
      ))}
    </div>
  ),
};

export const Formats: Story = {
  name: "Day, month and year orders",
  parameters: { docs: { source: { code: datePickerSnippets.formats } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <DatePicker format="mdy" aria-label="Start date, month first" defaultValue="2026-10-03" today={TODAY} />
      <DatePicker format="dmy" separator="." aria-label="Start date, day first" defaultValue="2026-10-03" today={TODAY} />
      <DatePicker format="ymd" separator="-" aria-label="Start date, year first" defaultValue="2026-10-03" today={TODAY} />
    </div>
  ),
};

export const DateRange: Story = {
  name: "Limited to a range",
  parameters: { docs: { source: { code: datePickerSnippets.range } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <DatePicker
        min="2026-10-05"
        max="2026-10-25"
        aria-label="Booking date, outside the range"
        defaultValue="2026-10-30"
        today={TODAY}
      />
      <Text size="sm" color="secondary">
        30 October is after the 25th latest, so the field is flagged; open the calendar to see the unreachable days disabled.
      </Text>
    </div>
  ),
};

export const UnavailableDates: Story = {
  name: "Unavailable dates",
  parameters: { docs: { source: { code: datePickerSnippets.unavailable } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <DatePicker
        aria-label="Delivery date"
        defaultValue="2026-10-14"
        today={TODAY}
        isDateDisabled={(date) => new Date(date + "T00:00:00Z").getUTCDay() % 6 === 0}
      />
      <Text size="sm" color="secondary">
        Weekends are ruled out: open the calendar and they are disabled, and typing a Saturday flags the field.
      </Text>
    </div>
  ),
};

export const CalendarOptions: Story = {
  name: "Calendar options",
  parameters: { docs: { source: { code: datePickerSnippets.calendar } } },
  argTypes: { ...noControls },
  render: () => (
    <DatePicker
      aria-label="Start date"
      weekStartsOn={1}
      showTodayButton
      today={TODAY}
      calendarProps={{ showWeekNumbers: true, captionLayout: "views" }}
    />
  ),
};

/** What `commitOn` holds back: each field counts how often it has reported, and what it last said. */
function ReportingField({ commitOn }: { commitOn: "change" | "complete" | "blur" }) {
  const [reports, setReports] = useState<string[]>([]);
  return (
    <div style={stack}>
      <DatePicker
        aria-label={`Start date, commitOn ${commitOn}`}
        defaultValue="2026-10-03"
        today={TODAY}
        commitOn={commitOn}
        onValueChange={(next) => setReports((all) => [...all, next])}
      />
      <Text size="sm" color="secondary">
        <code>{commitOn}</code>: {reports.length} {reports.length === 1 ? "report" : "reports"}, last{" "}
        <code>{reports.length === 0 ? "none yet" : JSON.stringify(reports.at(-1))}</code>
      </Text>
    </div>
  );
}

export const CommitTiming: Story = {
  name: "When it reports",
  parameters: { docs: { source: { code: datePickerSnippets.commitOn } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <ReportingField commitOn="change" />
      <ReportingField commitOn="complete" />
      <ReportingField commitOn="blur" />
    </div>
  ),
};

export const InAForm: Story = {
  name: "Required, in a form",
  parameters: { docs: { source: { code: datePickerSnippets.form } } },
  argTypes: { ...noControls },
  render: function InAFormStory() {
    const [submitted, setSubmitted] = useState<string | null>(null);
    return (
      <form
        style={stack}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(String(new FormData(event.currentTarget).get("checkIn")));
        }}
      >
        <DatePicker aria-label="Check-in" name="checkIn" required min="2026-10-01" today={TODAY} />
        <Button type="submit">Save</Button>
        <Text size="sm" color="secondary">
          {submitted === null ? "Submit it empty, half-filled or out of range: the browser stops it." : `Submitted ${submitted}`}
        </Text>
      </form>
    );
  },
};

export const States: Story = {
  name: "Error, disabled and read-only",
  parameters: { docs: { source: { code: datePickerSnippets.states } } },
  argTypes: { ...noControls },
  render: () => (
    <div style={stack}>
      <DatePicker hasError aria-label="Start date, error" defaultValue="2026-10-03" today={TODAY} />
      <DatePicker disabled aria-label="Start date, disabled" defaultValue="2026-10-03" today={TODAY} />
      <DatePicker readOnly aria-label="Start date, read-only" defaultValue="2026-10-03" today={TODAY} />
    </div>
  ),
};

export const Clearable: Story = {
  name: "With a clear button",
  parameters: { docs: { source: { code: datePickerSnippets.clearable } } },
  argTypes: { ...noControls },
  render: function ClearableStory() {
    const [value, setValue] = useState("2026-10-03");
    return <DatePicker aria-label="Start date" value={value} onValueChange={setValue} today={TODAY} clearable />;
  },
};

export const WithoutPicker: Story = {
  name: "Without the calendar",
  parameters: { docs: { source: { code: datePickerSnippets.withoutPicker } } },
  argTypes: { ...noControls },
  render: () => <DatePicker showPicker={false} aria-label="Start date" defaultValue="2026-10-03" today={TODAY} />,
};

export const Controlled: Story = {
  name: "Controlled value",
  parameters: { docs: { source: { code: datePickerSnippets.controlled } } },
  argTypes: { ...noControls },
  render: function ControlledStory() {
    const [date, setDate] = useState("2026-10-03");
    return (
      <div style={stack}>
        <DatePicker aria-label="Start date" value={date} onValueChange={setDate} today={TODAY} />
        <Text size="sm" color="secondary">
          Value: <code>{date === "" ? '""' : date}</code>
        </Text>
      </div>
    );
  },
};

export const InFormField: Story = {
  name: "In a FormField",
  parameters: { docs: { source: { code: datePickerSnippets.formField } } },
  argTypes: { ...noControls },
  render: () => (
    <FormField label="Birthday" helperText="Month, day, year">
      {(field) => <DatePicker {...field} today={TODAY} />}
    </FormField>
  ),
};

export const Translated: Story = {
  name: "Translated, with its own digits",
  parameters: { docs: { source: { code: datePickerSnippets.translated } } },
  argTypes: { ...noControls },
  render: () => (
    <div dir="rtl">
      <DatePicker
        aria-label="تاريخ البدء"
        dir="rtl"
        format="dmy"
        defaultValue="2026-10-03"
        today={TODAY}
        labels={{
          day: "اليوم",
          month: "الشهر",
          year: "السنة",
          openPicker: "اختر التاريخ",
          pickerName: "اختر تاريخًا",
          clear: "مسح",
        }}
        formatNumber={(n) => n.toLocaleString("ar-EG", { useGrouping: false })}
        clearable
      />
    </div>
  ),
};

// The stories below are hidden from the sidebar and the Docs page (`!dev`): they change the field's state (typing,
// opening the calendar), so shown they would animate and settle somewhere unexpected — but they still run as tests.

export const TypeADate: Story = {
  name: "Type a date, step it, clear a segment — interaction test",
  tags: ["!dev"],
  args: { defaultValue: "" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("spinbutton", { name: "Month" }));
    await userEvent.keyboard("10032026");
    await expect(canvas.getByRole("spinbutton", { name: "Month" })).toHaveValue("10");
    await expect(canvas.getByRole("spinbutton", { name: "Day" })).toHaveValue("03");
    await expect(canvas.getByRole("spinbutton", { name: "Year" })).toHaveValue("2026");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("2026-10-03");
    await userEvent.click(canvas.getByRole("spinbutton", { name: "Day" }));
    await userEvent.keyboard("{ArrowUp}");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("2026-10-04");
    await userEvent.keyboard("{Backspace}");
    await expect(args.onValueChange).toHaveBeenLastCalledWith("");
  },
};

export const ChooseInTheCalendar: Story = {
  name: "Open the calendar and choose a day — interaction test",
  tags: ["!dev"],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Choose date" }));
    const day = await waitFor(() => {
      const found = document.querySelector<HTMLButtonElement>('button[data-date="2026-10-20"]');
      if (!found) throw new Error("the calendar has not opened");
      return found;
    });
    await userEvent.click(day);
    await expect(args.onValueChange).toHaveBeenLastCalledWith("2026-10-20");
    await expect(canvas.getByRole("spinbutton", { name: "Day" })).toHaveValue("20");
  },
};
