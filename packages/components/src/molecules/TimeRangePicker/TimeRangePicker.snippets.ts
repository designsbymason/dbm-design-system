// The code shown under each story's "Show code" button on TimeRangePicker's Docs page. Hand-written, the smallest
// real usage of what each story shows; `storySnippets.test.ts` checks they stay valid. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { TimePickerHourCycle, TimePickerSize } from "../TimePicker";

export const timeRangePickerSnippets = {
  basic: `<TimeRangePicker aria-label="Opening hours" defaultValue={["09:00", "17:30"]} />`,

  hourCycles: `{/* hourCycle: "12" (default) | "24". Both values are 24-hour strings either way. */}
<TimeRangePicker aria-label="Opening hours" hourCycle="24" defaultValue={["09:00", "17:30"]} />`,

  constrained: `{/* The end can't be before the start: its picker disables earlier times, and an earlier end is flagged. */}
<TimeRangePicker aria-label="Meeting" hourCycle="24" step={15} min="08:00" max="18:00" defaultValue={["14:00", "13:00"]} />`,

  controlled: `{/* const [range, setRange] = useState(["09:00", ""]); — an end that isn't complete yet is "". */}
<TimeRangePicker aria-label="Opening hours" value={range} onValueChange={setRange} />`,

  clearable: `{/* onClear is told which end was cleared; the field empties itself. */}
<TimeRangePicker aria-label="Opening hours" defaultValue={["09:00", "17:30"]} onClear={() => {}} />`,

  formField: `<FormField label="Opening hours" helperText="In your local time">
  {(field) => <TimeRangePicker {...field} />}
</FormField>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface TimeRangePickerPlaygroundSnippetArgs {
  defaultValue?: [string, string];
  hourCycle?: TimePickerHourCycle;
  showSeconds?: boolean;
  step?: number;
  min?: string;
  max?: string;
  size?: TimePickerSize;
  hasError?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  showPicker?: boolean;
  onClear?: unknown;
}

/** The Playground's snippet, built from its current controls: only the props that differ from their defaults. */
export function timeRangePickerPlaygroundSnippet(args: TimeRangePickerPlaygroundSnippetArgs): string {
  const attributes: string[] = ['aria-label="Opening hours"'];
  if (args.defaultValue) attributes.push(`defaultValue={[${args.defaultValue.map((time) => `"${time}"`).join(", ")}]}`);
  if (args.hourCycle && args.hourCycle !== "12") attributes.push(`hourCycle="${args.hourCycle}"`);
  if (args.showSeconds) attributes.push("showSeconds");
  if (args.step !== undefined && args.step !== 1) attributes.push(`step={${args.step}}`);
  if (args.min) attributes.push(`min="${args.min}"`);
  if (args.max) attributes.push(`max="${args.max}"`);
  if (args.size && args.size !== "md") attributes.push(`size="${args.size}"`);
  if (args.hasError) attributes.push("hasError");
  if (args.disabled) attributes.push("disabled");
  if (args.readOnly) attributes.push("readOnly");
  if (args.required) attributes.push("required");
  if (args.showPicker === false) attributes.push("showPicker={false}");
  if (args.onClear) attributes.push("onClear={() => {}}");
  return `<TimeRangePicker ${attributes.join(" ")} />`;
}
