import type { Meta, StoryContext, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { CSSProperties } from "react";
import { expect, userEvent, within } from "storybook/test";
import { useArgs } from "storybook/preview-api";
import { Text } from "../../atoms/Text";
import { Calendar } from "./Calendar";
import { calendarPlaygroundSnippet, calendarSnippets } from "./Calendar.snippets";
import type { CalendarMode, CalendarRangeValue, CalendarSize, CalendarWeekStart } from "./Calendar.types";

// `Calendar`'s props are a union (a single date, or a range), so this meta has no `component` and its argTypes
// are written out here. The Playground is controlled: choosing a date in the canvas, or moving to another month,
// writes back to its control. The month and `today` are fixed so every demo shows the same page, whatever day it is.
interface PlaygroundArgs {
  mode: CalendarMode;
  value: string;
  start: string;
  end: string;
  month: string;
  min: string;
  max: string;
  weekStartsOn: CalendarWeekStart;
  showOutsideDays: boolean;
  today: string;
  size: CalendarSize;
  disabled: boolean;
  readOnly: boolean;
  announce: boolean;
  dir: "ltr" | "rtl";
  defaultValue: unknown;
  defaultMonth: unknown;
  onValueChange: unknown;
  onMonthChange: unknown;
  isDateDisabled: unknown;
  autoFocus: boolean;
  labels: unknown;
  formatNumber: unknown;
  "aria-label": string;
  "aria-labelledby": string;
  id: string;
  className: string;
  style: CSSProperties;
  "data-testid": string;
}

const allSizes: CalendarSize[] = ["xs", "sm", "md", "lg", "xl"];
const TODAY = "2026-10-14";
const MONTH = "2026-10";

const labelled: CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--dbm-space-2)" };
const row: CSSProperties = { display: "flex", flexWrap: "wrap", gap: "var(--dbm-space-8)", alignItems: "flex-start" };

// Every fixed-render story below ignores the Playground's own `args`, so each one suppresses every control it
// doesn't consume (a story-level `argTypes` entry merges over the meta-level one per key).
const noControls: Record<keyof PlaygroundArgs, { control: false }> = {
  mode: { control: false },
  value: { control: false },
  start: { control: false },
  end: { control: false },
  month: { control: false },
  min: { control: false },
  max: { control: false },
  weekStartsOn: { control: false },
  showOutsideDays: { control: false },
  today: { control: false },
  size: { control: false },
  disabled: { control: false },
  readOnly: { control: false },
  announce: { control: false },
  dir: { control: false },
  defaultValue: { control: false },
  defaultMonth: { control: false },
  onValueChange: { control: false },
  onMonthChange: { control: false },
  isDateDisabled: { control: false },
  autoFocus: { control: false },
  labels: { control: false },
  formatNumber: { control: false },
  "aria-label": { control: false },
  "aria-labelledby": { control: false },
  id: { control: false },
  className: { control: false },
  style: { control: false },
  "data-testid": { control: false },
};

const meta: Meta<PlaygroundArgs> = {
  title: "Molecules/Inputs/Calendar",
  parameters: { layout: "padded" },
  argTypes: {
    mode: {
      control: "radio",
      options: ["single", "range"],
      description:
        "What choosing a date means: one date (single), or a first and a last (range) — the first choice is the start, the second the end, and a third starts again. The value is a string for single and a [start, end] pair for range.",
      table: { defaultValue: { summary: "'single'" } },
    },
    value: {
      control: "text",
      description:
        "The chosen date as \"YYYY-MM-DD\" (empty for none) — controlled, in single mode. Pair with onValueChange to update it, or the calendar will appear frozen. In range mode the value is a [start, end] pair of those strings instead, an end of \"\" while it is still to be chosen. (In the Playground, choosing a date in the canvas writes it back here.)",
    },
    defaultValue: {
      control: false,
      description:
        "The date (or, in range mode, the [start, end] range) an uncontrolled calendar starts with, which it then tracks itself. Ignored once value is also given.",
      table: { defaultValue: { summary: "''" } },
    },
    onValueChange: {
      control: false,
      description:
        "Called when a date is chosen, with it as \"YYYY-MM-DD\" — or, in range mode, called each time with the range so far: [start, \"\"] after the first choice and [start, end] after the second. Not called for the date already chosen, or when disabled, readOnly or the rules make a date unavailable.",
    },
    month: {
      control: "text",
      description:
        "The month on show, as \"YYYY-MM\" — controlled. Pair with onMonthChange to update it. Without it the calendar shows the chosen date's month, or defaultMonth, or the current month. (In the Playground, moving to another month writes it back here.)",
    },
    defaultMonth: {
      control: false,
      description: "The month an uncontrolled calendar starts on, as \"YYYY-MM\". Ignored once month is also given.",
    },
    onMonthChange: {
      control: false,
      description:
        "Called when the month on show changes — by the previous and next buttons, by Page Up and Page Down, or by moving onto a date in another month — with the new month as \"YYYY-MM\".",
    },
    min: {
      control: "text",
      description:
        "The earliest date that can be chosen, as \"YYYY-MM-DD\". Earlier dates are unavailable, the keys never move focus before it, and the previous-month button is unavailable once the month on show holds it.",
    },
    max: {
      control: "text",
      description: "The latest date that can be chosen, as \"YYYY-MM-DD\". The mirror of min.",
    },
    isDateDisabled: {
      control: false,
      description:
        "A rule for dates that can't be chosen, given a date as \"YYYY-MM-DD\" — weekends, holidays, days that are fully booked. They are dimmed and marked unavailable, and can still be moved onto with the keyboard, but not chosen. Together with min and max. Keep it cheap and pure: it is called for each of the 42 days on every render.",
    },
    weekStartsOn: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6],
      description:
        "The day a week starts on, 0 (Sunday) to 6 (Saturday). The columns, and Home and End, follow it. Explicit and never read from the browser's locale, so a server and a browser agree.",
      table: { defaultValue: { summary: "0" } },
    },
    showOutsideDays: {
      control: "boolean",
      description:
        "Shows the days of the neighbouring months that fill the first and last weeks, dimmed. They can be chosen, which moves the calendar to their month. With false those cells are empty.",
      table: { defaultValue: { summary: "true" } },
    },
    today: {
      control: "text",
      description:
        "Today's date as \"YYYY-MM-DD\", which is marked in the grid. Left out, the calendar reads the clock in the browser once it has mounted, so a server-rendered page and its first client render agree. (The stories fix it, so they look the same on any day.)",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description:
        "The size of the calendar. A day is a square as tall as an IconButton of this step, and the calendar is seven of them wide (less, on a screen narrower than that).",
      table: { defaultValue: { summary: "'md'" } },
    },
    disabled: {
      control: "boolean",
      description:
        "Makes every date and both month buttons unavailable. They stay focusable (aria-disabled, not natively disabled), so keyboard focus isn't lost.",
      table: { defaultValue: { summary: "false" } },
    },
    readOnly: {
      control: "boolean",
      description:
        "Shows the chosen date or range but doesn't let it change. Moving between months and moving focus over the dates still work.",
      table: { defaultValue: { summary: "false" } },
    },
    autoFocus: {
      control: false,
      description:
        "Moves keyboard focus to the date that Tab would land on, when the calendar mounts. A calendar is a grid of buttons, so React's own autoFocus has nothing to act on.",
      table: { defaultValue: { summary: "false" } },
    },
    announce: {
      control: "boolean",
      description:
        "Announces the new month to screen readers whenever it changes — \"November 2026\" — through a visually hidden status region. Set it to false if your own content already announces the change.",
      table: { defaultValue: { summary: "true" } },
    },
    dir: {
      control: "radio",
      options: ["ltr", "rtl"],
      description:
        "The reading direction the calendar is drawn in. Passed on and defaulted, not read from the page: under rtl the first day of the week is at the right, the month buttons and their arrows swap sides, and the left and right arrow keys follow the picture.",
      table: { defaultValue: { summary: "'ltr'" } },
    },
    labels: {
      control: false,
      description:
        "The text the component supplies itself. Any you leave out keep their English default. Keys: calendar, previousMonth, nextMonth, months (twelve names, January first), weekdays and weekdaysShort (seven names, Sunday first), monthYear (a function of the year and month), day (a function of the year, month, day and weekday), today, rangeStart and rangeEnd.",
    },
    formatNumber: {
      control: false,
      description:
        "How a day or a year is written, for a language or region whose numerals differ from the plain 5 and 2026: given a number, returns the text to show (the default is String). Used for every day, the year in the heading and, by the default labels, in the accessible names, so what a day shows is always contained in its name. For example new Intl.NumberFormat(\"ar-EG\").format. Your own labels functions are given the plain numbers.",
      // A function's source would stretch the Default column; the description states the default.
      table: { defaultValue: { summary: "" } },
    },
    "aria-label": {
      control: false,
      description: "An accessible name for the calendar. Defaults to labels.calendar (\"Calendar\").",
    },
    "aria-labelledby": {
      control: false,
      description: "The id of an element that names the calendar; takes the place of aria-label.",
    },
    id: {
      control: false,
      description:
        "Standard DOM id, applied to the outermost element. Rarely needed directly, but required when another element's aria-labelledby/aria-describedby needs to point at this component, or when a test or router needs a stable anchor.",
    },
    className: { control: false, description: "Additional CSS classes for customization." },
    style: { control: false, description: "Inline styles, merged onto the component's own internal styles." },
    "data-testid": {
      control: false,
      description:
        "Test identifier for automated testing (e.g. Testing Library's getByTestId, Playwright/Cypress selectors). Rendered as the DOM data-testid attribute; has no visual or behavioral effect.",
    },
  },
  args: {
    mode: "single",
    value: "2026-10-06",
    month: MONTH,
    min: "",
    max: "",
    weekStartsOn: 0,
    showOutsideDays: true,
    today: TODAY,
    size: "md",
    disabled: false,
    readOnly: false,
    announce: true,
    dir: "ltr",
  },
  render: function PlaygroundRender(args) {
    const [, updateArgs] = useArgs<PlaygroundArgs>();
    const shared = {
      month: args.month,
      onMonthChange: (month: string) => updateArgs({ month }),
      min: args.min || undefined,
      max: args.max || undefined,
      weekStartsOn: args.weekStartsOn,
      showOutsideDays: args.showOutsideDays,
      today: args.today || undefined,
      size: args.size,
      disabled: args.disabled,
      readOnly: args.readOnly,
      announce: args.announce,
      dir: args.dir,
    };
    return args.mode === "range" ? (
      <Calendar
        {...shared}
        mode="range"
        value={[args.start, args.end]}
        onValueChange={([start, end]) => updateArgs({ start, end })}
      />
    ) : (
      <Calendar {...shared} value={args.value} onValueChange={(value) => updateArgs({ value })} />
    );
  },
};

export default meta;

type Story = StoryObj<PlaygroundArgs>;

/** Choose a date, step through the months, and drive every prop from the Controls panel. Choosing writes back to `value`. */
export const Playground: Story = {
  args: { start: "2026-10-08", end: "2026-10-12" },
  // The range's two ends are Playground-only controls (in code the range is the value prop's pair), so they are
  // declared here, not on the meta, where the Properties table would list them as props.
  argTypes: {
    value: { if: { arg: "mode", neq: "range" } },
    start: {
      control: "text",
      if: { arg: "mode", eq: "range" },
      description:
        "The start of the chosen range, as \"YYYY-MM-DD\". A Playground control only: in code the range is the value prop's first entry.",
    },
    end: {
      control: "text",
      if: { arg: "mode", eq: "range" },
      description:
        "The end of the chosen range, as \"YYYY-MM-DD\", or empty while it is still to be chosen. A Playground control only: in code the range is the value prop's second entry.",
    },
  },
  // The snippet is built from the live controls — only the props that differ from their defaults.
  parameters: {
    docs: {
      source: {
        type: "dynamic",
        transform: (_code: string, context: StoryContext<PlaygroundArgs>) => calendarPlaygroundSnippet(context.args),
      },
    },
  },
};

export const Sizes: Story = {
  name: "All sizes",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.sizes } } },
  render: () => (
    <div style={row} data-testid="sizes">
      {allSizes.map((size) => (
        <div key={size} style={labelled}>
          <Text size="sm" weight="semibold">
            size=&quot;{size}&quot;
          </Text>
          <Calendar size={size} defaultMonth={MONTH} today={TODAY} defaultValue="2026-10-06" aria-label={`Size ${size}`} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const calendars = [...canvasElement.querySelectorAll<HTMLElement>("[data-testid=sizes] [role=group]")];
    await expect(calendars.length).toBe(5);
    const days = calendars.map((calendar) => calendar.querySelector("button[data-date]")!.getBoundingClientRect());
    // A day is a square at every step, and each step is larger than the last.
    for (const [index, box] of days.entries()) {
      await expect(Math.abs(box.width - box.height)).toBeLessThan(1);
      if (index > 0) await expect(box.height).toBeGreaterThan(days[index - 1]!.height);
    }
  },
};

export const Range: Story = {
  name: "Choosing a range",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.range } } },
  render: function RangeRender() {
    const [range, setRange] = useState<CalendarRangeValue>(["2026-10-08", "2026-10-14"]);
    return (
      <div style={labelled}>
        <Calendar mode="range" defaultMonth={MONTH} today={TODAY} value={range} onValueChange={setRange} aria-label="Stay" />
        <Text size="sm" color="secondary" data-testid="range-readout">
          {range[0] === "" ? "No dates chosen" : range[1] === "" ? `From ${range[0]}, choose the last day` : `${range[0]} to ${range[1]}`}
        </Text>
      </div>
    );
  },
};

export const WeekStart: Story = {
  name: "Weeks that start on Monday",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.weekStart } } },
  render: () => (
    <div style={row}>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          weekStartsOn=&#123;0&#125; (default)
        </Text>
        <Calendar defaultMonth={MONTH} today={TODAY} aria-label="Sunday first" />
      </div>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          weekStartsOn=&#123;1&#125;
        </Text>
        <Calendar weekStartsOn={1} defaultMonth={MONTH} today={TODAY} aria-label="Monday first" />
      </div>
    </div>
  ),
};

const isWeekend = (date: string): boolean => {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay();
  return weekday === 0 || weekday === 6;
};

export const Unavailable: Story = {
  name: "Unavailable dates",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.unavailable } } },
  render: () => (
    <div style={row}>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          min and max
        </Text>
        <Calendar defaultMonth={MONTH} today={TODAY} min="2026-10-08" max="2026-10-24" aria-label="Within a window" />
      </div>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          isDateDisabled: no weekends
        </Text>
        <Calendar defaultMonth={MONTH} today={TODAY} isDateDisabled={isWeekend} aria-label="Weekdays only" />
      </div>
    </div>
  ),
};

export const OutsideDays: Story = {
  name: "Neighbouring months' days",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.outsideDays } } },
  render: () => (
    <div style={row}>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          showOutsideDays (default)
        </Text>
        <Calendar defaultMonth={MONTH} today={TODAY} aria-label="With neighbours" />
      </div>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          showOutsideDays=&#123;false&#125;
        </Text>
        <Calendar showOutsideDays={false} defaultMonth={MONTH} today={TODAY} aria-label="Month only" />
      </div>
    </div>
  ),
};

export const States: Story = {
  name: "Disabled and read-only",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.states } } },
  render: () => (
    <div style={row}>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          disabled
        </Text>
        <Calendar disabled defaultMonth={MONTH} today={TODAY} defaultValue="2026-10-06" aria-label="Disabled" />
      </div>
      <div style={labelled}>
        <Text size="sm" weight="semibold">
          readOnly
        </Text>
        <Calendar readOnly defaultMonth={MONTH} today={TODAY} defaultValue="2026-10-06" aria-label="Read only" />
      </div>
    </div>
  ),
};

export const Controlled: Story = {
  name: "Controlled value and month",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.controlled } } },
  render: function ControlledRender() {
    const [value, setValue] = useState("2026-10-20");
    const [month, setMonth] = useState("2026-10");
    return (
      <div style={labelled}>
        <Calendar value={value} onValueChange={setValue} month={month} onMonthChange={setMonth} today={TODAY} aria-label="Appointment" />
        <Text size="sm" color="secondary" data-testid="controlled-readout">
          Chosen: {value} · showing {month}
        </Text>
      </div>
    );
  },
};

const spanishLabels = {
  calendar: "Calendario",
  previousMonth: "Mes anterior",
  nextMonth: "Mes siguiente",
  months: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  weekdays: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
  weekdaysShort: ["do", "lu", "ma", "mi", "ju", "vi", "sá"],
  today: "hoy",
  monthYear: (year: number, month: number) =>
    `${["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][month - 1]} de ${year}`,
  day: ({ year, month, day, weekday }: { year: number; month: number; day: number; weekday: number }) =>
    `${["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][weekday]}, ${day} de ${["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][month - 1]} de ${year}`,
};

export const Labels: Story = {
  name: "In another language",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.labels } } },
  render: () => <Calendar weekStartsOn={1} defaultMonth={MONTH} today={TODAY} labels={spanishLabels} defaultValue="2026-10-06" />,
};

export const Locale: Story = {
  name: "Numbers in your own locale",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.locale } } },
  render: () => (
    <Calendar
      defaultMonth={MONTH}
      today={TODAY}
      defaultValue="2026-10-06"
      formatNumber={new Intl.NumberFormat("ar-EG", { useGrouping: false }).format}
      aria-label="Arabic-Indic digits"
    />
  ),
};

export const RightToLeft: Story = {
  name: "Right to left",
  argTypes: noControls,
  parameters: { docs: { source: { code: calendarSnippets.rightToLeft } } },
  render: () => (
    <Calendar
      dir="rtl"
      mode="range"
      weekStartsOn={6}
      defaultMonth={MONTH}
      today={TODAY}
      defaultValue={["2026-10-08", "2026-10-12"]}
      labels={{
        calendar: "التقويم",
        previousMonth: "الشهر السابق",
        nextMonth: "الشهر التالي",
        months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
        weekdays: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
        weekdaysShort: ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
      }}
    />
  ),
};

// Runs the choosing and the keyboard in a real browser without making the visible stories animate: Storybook plays a
// story's `play` whenever it is opened, so a play that changes what a story shows would leave the demo on a different
// state from the one it starts in. Hidden from the sidebar and Docs (`!dev`), still run as a test.
export const ChoosingInteraction: Story = {
  name: "Choosing a date — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: function ChoosingRender() {
    const [value, setValue] = useState("");
    return (
      <div style={labelled}>
        <Calendar defaultMonth={MONTH} today={TODAY} value={value} onValueChange={setValue} />
        <span data-testid="chosen">{value}</span>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Tuesday, October 20, 2026" }));
    await expect(canvas.getByTestId("chosen")).toHaveTextContent("2026-10-20");
    await userEvent.click(canvas.getByRole("button", { name: "Next month" }));
    await expect(canvas.getByRole("grid", { name: "November 2026" })).toBeInTheDocument();
  },
};

export const RangeInteraction: Story = {
  name: "Choosing a range — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: Range.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^Thursday, October 22, 2026/ }));
    await expect(canvas.getByTestId("range-readout")).toHaveTextContent("From 2026-10-22");
    await userEvent.click(canvas.getByRole("button", { name: /^Tuesday, October 27, 2026/ }));
    await expect(canvas.getByTestId("range-readout")).toHaveTextContent("2026-10-22 to 2026-10-27");
  },
};

export const KeyboardInteraction: Story = {
  name: "Moving with the keyboard — interaction test",
  tags: ["!dev"],
  argTypes: noControls,
  render: () => <Calendar defaultMonth={MONTH} today={TODAY} aria-label="Keyboard" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: /^Wednesday, October 14, 2026/ })).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}{ArrowRight}");
    await expect(canvas.getByRole("button", { name: /^Thursday, October 22, 2026/ })).toHaveFocus();
    await userEvent.keyboard("{PageDown}");
    await expect(canvas.getByRole("grid", { name: "November 2026" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /^Sunday, November 22, 2026/ })).toHaveFocus();
  },
};
