// The code shown under each story's "Show code" button on Calendar's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object plus demo-only
// helpers, and the Playground's generated snippet would spell out every default and freeze the controlled date.
// A snippet can't hold state, so where a value is controlled the state is named in a comment above the JSX
// (`{/* const [date, setDate] = useState("2026-10-06"); */}`). Each snippet here is the smallest real usage of what
// its story shows — only exports of the package, no demo scaffolding — and `storySnippets.test.ts` checks that stays
// true. See `07-storybook-and-documentation-standards.md` §4.2.

import { quote } from "../../snippetHelpers";
import type { CalendarMode, CalendarSize, CalendarWeekStart } from "./Calendar.types";

export const calendarSnippets = {
  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl". A day is as tall as an IconButton of the same step. */}
<Calendar size="lg" defaultValue="2026-10-06" />`,

  range: `{/* const [range, setRange] = useState(["2026-10-08", "2026-10-14"]); */}
{/* The first choice is the start, the second the end, and a third starts again. After the first choice the
    value is [start, ""]; after the second, [start, end]. */}
<Calendar mode="range" value={range} onValueChange={setRange} />`,

  weekStart: `{/* weekStartsOn: 0 (Sunday, the default) to 6 (Saturday). Never read from the browser's locale, so a
    server and a browser draw the same grid. */}
<Calendar weekStartsOn={1} />`,

  unavailable: `{/* min and max take dates as "YYYY-MM-DD". Earlier and later dates are unavailable, and the month
    buttons stop at the month holding them. */}
<Calendar min="2026-10-08" max="2026-10-24" />

{/* isDateDisabled rules out any date you like: weekends, holidays, days that are fully booked. Dates are
    "YYYY-MM-DD" strings; keep the rule cheap, as it is called for each of the 42 days on every render. */}
<Calendar isDateDisabled={(date) => [0, 6].includes(new Date(\`\${date}T00:00:00Z\`).getUTCDay())} />`,

  outsideDays: `{/* showOutsideDays (the default) fills the first and last weeks with the neighbouring months' days, dimmed.
    Choosing one moves the calendar to its month. With false those cells are left empty. */}
<Calendar showOutsideDays={false} />`,

  states: `{/* disabled: every date and both month buttons are unavailable, but still focusable */}
<Calendar disabled defaultValue="2026-10-06" />

{/* readOnly: the choice is shown but can't change; the months and the dates can still be moved through */}
<Calendar readOnly defaultValue="2026-10-06" />`,

  rounded: `{/* rounded draws the days and both month buttons round — the days, the chosen ones, today's ring and the focus
    ring. The strip behind a range keeps its straight edges. */}
<Calendar rounded defaultValue="2026-10-06" />`,

  legend: `{/* showLegend adds a key below the calendar. It lists only the looks that are on screen: the ring around today,
    the solid fill once a date is chosen, the soft fill of a range once one is started, and the dimmed look of an
    unavailable date when anything can be. The words are in labels (legendToday, legendSelected, legendRange,
    legendUnavailable). */}
<Calendar showLegend defaultValue="2026-10-06" />

<Calendar showLegend mode="range" isDateDisabled={(date) => date.endsWith("-20")} />`,

  controlled: `{/* const [date, setDate] = useState("2026-10-20"); */}
{/* const [month, setMonth] = useState("2026-10"); */}
{/* The value is a "YYYY-MM-DD" string and the month "YYYY-MM": plain text, so it compares, sorts and submits as it is. */}
<Calendar value={date} onValueChange={setDate} month={month} onMonthChange={setMonth} />`,

  labels: `{/* Every name the calendar writes is in the labels object; anything left out stays English. Translating
    months and weekdays translates the heading and the day names built from them. */}
<Calendar
  weekStartsOn={1}
  labels={{
    calendar: "Calendario",
    previousMonth: "Mes anterior",
    nextMonth: "Mes siguiente",
    months: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    weekdays: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
    weekdaysShort: ["do", "lu", "ma", "mi", "ju", "vi", "sá"],
    today: "hoy",
  }}
/>`,

  locale: `{/* formatNumber writes each day and the year the way a language or region does — here Arabic-Indic digits,
    through the browser's own Intl. The default accessible names use it too, so a day's name always contains
    the number it shows. */}
<Calendar formatNumber={new Intl.NumberFormat("ar-EG", { useGrouping: false }).format} />`,

  rightToLeft: `{/* dir is passed on, not read from the page. Under "rtl" the first day of the week is at the right, the month
    buttons and their arrows swap sides, and the left and right arrow keys follow the picture. */}
<Calendar dir="rtl" mode="range" weekStartsOn={6} />`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface CalendarPlaygroundSnippetArgs {
  mode?: CalendarMode;
  value?: string;
  start?: string;
  end?: string;
  month?: string;
  min?: string;
  max?: string;
  weekStartsOn?: CalendarWeekStart;
  showOutsideDays?: boolean;
  size?: CalendarSize;
  rounded?: boolean;
  showLegend?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  announce?: boolean;
  dir?: "ltr" | "rtl";
}

/**
 * The Playground's snippet, built from its current controls: the controlled value and month (with their state
 * named in a comment), plus only the props that differ from their defaults.
 */
export function calendarPlaygroundSnippet(args: CalendarPlaygroundSnippetArgs): string {
  const range = args.mode === "range";
  const state = range
    ? `{/* const [range, setRange] = useState([${quote(args.start ?? "")}, ${quote(args.end ?? "")}]); */}`
    : `{/* const [date, setDate] = useState(${quote(args.value ?? "")}); */}`;
  const attributes = range
    ? ['mode="range"', "value={range}", "onValueChange={setRange}"]
    : ["value={date}", "onValueChange={setDate}"];
  attributes.push("month={month}", "onMonthChange={setMonth}");
  if (args.min) attributes.push(`min=${quote(args.min)}`);
  if (args.max) attributes.push(`max=${quote(args.max)}`);
  if (args.weekStartsOn !== undefined && Number(args.weekStartsOn) !== 0) attributes.push(`weekStartsOn={${args.weekStartsOn}}`);
  if (args.showOutsideDays === false) attributes.push("showOutsideDays={false}");
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.rounded) attributes.push("rounded");
  if (args.showLegend) attributes.push("showLegend");
  if (args.disabled) attributes.push("disabled");
  if (args.readOnly) attributes.push("readOnly");
  if (args.announce === false) attributes.push("announce={false}");
  if (args.dir && args.dir !== "ltr") attributes.push(`dir="${args.dir}"`);
  return `${state}\n{/* const [month, setMonth] = useState(${quote(args.month ?? "")}); */}\n<Calendar ${attributes.join(" ")} />`;
}
