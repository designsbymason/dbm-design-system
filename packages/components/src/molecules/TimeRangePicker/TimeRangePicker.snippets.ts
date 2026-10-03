// The code shown under each story's "Show code" button on TimeRangePicker's Docs page. Hand-written, the smallest
// real usage of what each story shows; `storySnippets.test.ts` checks they stay valid. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { TimePickerCommitOn, TimePickerHourCycle, TimePickerPeriodPosition, TimePickerSize } from "../TimePicker";

export const timeRangePickerSnippets = {
  basic: `<TimeRangePicker aria-label="Opening hours" defaultValue={["09:00", "17:30"]} />`,

  hourCycles: `{/* hourCycle: "12" (default) | "24". Both values are 24-hour strings either way. */}
<TimeRangePicker aria-label="Opening hours" hourCycle="24" defaultValue={["09:00", "17:30"]} />`,

  constrained: `{/* The end can't be before the start: its picker disables earlier times, and an earlier end is flagged. */}
<TimeRangePicker aria-label="Meeting" hourCycle="24" step={15} min="08:00" max="18:00" defaultValue={["14:00", "13:00"]} />`,

  overnight: `{/* allowOvernight: an end before the start is the next day's, so 22:00 to 06:00 is eight hours. */}
<TimeRangePicker aria-label="Night shift" hourCycle="24" allowOvernight defaultValue={["22:00", "06:00"]} />`,

  duration: `{/* minDuration and maxDuration are minutes. A range outside them is flagged (not refused), and the end's picker disables what would be. */}
<TimeRangePicker aria-label="Booking" hourCycle="24" step={15} minDuration={30} maxDuration={120} />`,

  constrainStart: `{/* constrainStart holds the start to the end as well: a start after the end, or one that makes the range too long, is flagged and disabled. */}
<TimeRangePicker aria-label="Slot" hourCycle="24" constrainStart maxDuration={60} defaultValue={["10:00", "13:00"]} />`,

  shared: `{/* sharedPicker: one button after the end opens one popover with the start's wheels and the end's side by side. */}
<TimeRangePicker aria-label="Opening hours" sharedPicker defaultValue={["09:00", "17:30"]} />`,

  controlled: `{/* const [range, setRange] = useState(["09:00", ""]); — an end that isn't complete yet is "". */}
<TimeRangePicker aria-label="Opening hours" value={range} onValueChange={setRange} />`,

  clearable: `{/* clearable shows a clear button on each end while it has something in it; pass onClear as well to be told which end. */}
<TimeRangePicker aria-label="Opening hours" defaultValue={["09:00", "17:30"]} clearable />`,

  formField: `<FormField label="Opening hours" helperText="In your local time">
  {(field) => <TimeRangePicker {...field} />}
</FormField>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface TimeRangePickerPlaygroundSnippetArgs {
  defaultValue?: [string, string];
  commitOn?: TimePickerCommitOn;
  hourCycle?: TimePickerHourCycle;
  periodPosition?: TimePickerPeriodPosition;
  showSeconds?: boolean;
  step?: number;
  secondStep?: number;
  min?: string;
  max?: string;
  minDuration?: number;
  maxDuration?: number;
  allowOvernight?: boolean;
  constrainStart?: boolean;
  sharedPicker?: boolean;
  openOnFocus?: boolean;
  size?: TimePickerSize;
  hasError?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  showPicker?: boolean;
  clearable?: boolean;
}

/** The Playground's snippet, built from its current controls: only the props that differ from their defaults. */
export function timeRangePickerPlaygroundSnippet(args: TimeRangePickerPlaygroundSnippetArgs): string {
  const attributes: string[] = ['aria-label="Opening hours"'];
  if (args.defaultValue) attributes.push(`defaultValue={[${args.defaultValue.map((time) => `"${time}"`).join(", ")}]}`);
  if (args.commitOn && args.commitOn !== "change") attributes.push(`commitOn="${args.commitOn}"`);
  if (args.hourCycle && args.hourCycle !== "12") attributes.push(`hourCycle="${args.hourCycle}"`);
  if (args.periodPosition && args.periodPosition !== "end") attributes.push(`periodPosition="${args.periodPosition}"`);
  if (args.showSeconds) attributes.push("showSeconds");
  if (args.step !== undefined && args.step !== 1) attributes.push(`step={${args.step}}`);
  if (args.secondStep !== undefined && args.secondStep !== 1) attributes.push(`secondStep={${args.secondStep}}`);
  if (args.min) attributes.push(`min="${args.min}"`);
  if (args.max) attributes.push(`max="${args.max}"`);
  if (args.minDuration !== undefined && args.minDuration !== null) attributes.push(`minDuration={${args.minDuration}}`);
  if (args.maxDuration !== undefined && args.maxDuration !== null) attributes.push(`maxDuration={${args.maxDuration}}`);
  if (args.allowOvernight) attributes.push("allowOvernight");
  if (args.constrainStart) attributes.push("constrainStart");
  if (args.sharedPicker) attributes.push("sharedPicker");
  if (args.openOnFocus) attributes.push("openOnFocus");
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.hasError) attributes.push("hasError");
  if (args.disabled) attributes.push("disabled");
  if (args.readOnly) attributes.push("readOnly");
  if (args.required) attributes.push("required");
  if (args.showPicker === false) attributes.push("showPicker={false}");
  if (args.clearable) attributes.push("clearable");
  return `<TimeRangePicker ${attributes.join(" ")} />`;
}
