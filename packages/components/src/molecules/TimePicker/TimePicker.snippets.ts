// The code shown under each story's "Show code" button on TimePicker's Docs page.
//
// Hand-written rather than lifted from the story source: a story's own source is the story object (or, for a
// story that reuses the Playground's render, just an `args` object) plus demo-only wiring, which can't be pasted
// anywhere. Each snippet here is the smallest real usage of what its story shows — only exports of the package,
// no demo scaffolding — and `storySnippets.test.ts` checks that stays true. See
// `07-storybook-and-documentation-standards.md` §4.2.

import type { TimePickerHourCycle, TimePickerSize } from "./TimePicker.types";

export const timePickerSnippets = {
  basic: `<TimePicker aria-label="Start time" defaultValue="09:30" />`,

  sizes: `{/* size: "xs" | "sm" | "md" (default) | "lg" | "xl" — each is as tall as an Input or a Button of the same size. */}
<TimePicker aria-label="Start time" size="lg" defaultValue="09:30" />`,

  hourCycles: `{/* hourCycle: "12" (default, with an AM/PM segment) | "24". The value is a 24-hour string either way. */}
<TimePicker aria-label="Start time" hourCycle="24" defaultValue="17:45" />`,

  seconds: `{/* showSeconds adds a seconds segment and wheel, and makes the value "HH:mm:ss". */}
<TimePicker aria-label="Start time" hourCycle="24" showSeconds defaultValue="17:45:30" />`,

  step: `{/* step: minutes between the values the field accepts. The arrow keys move along it and the picker lists only those minutes. */}
<TimePicker aria-label="Appointment" hourCycle="24" step={15} defaultValue="10:15" />`,

  range: `{/* min and max: a time outside them is flagged invalid (not refused), and the picker disables what can't be reached. */}
<TimePicker aria-label="Appointment" hourCycle="24" min="09:00" max="17:00" defaultValue="18:30" />`,

  states: `<TimePicker aria-label="Start time" hasError defaultValue="09:30" />
<TimePicker aria-label="Start time" disabled defaultValue="09:30" />
<TimePicker aria-label="Start time" readOnly defaultValue="09:30" />`,

  clearable: `{/* clearable shows the clear button while there is something to clear; the field empties itself (the AM/PM
    segment goes back to AM). Pass onClear as well if you want to be told.
    const [value, setValue] = useState("09:30"); */}
<TimePicker aria-label="Start time" value={value} onValueChange={setValue} clearable />`,

  withoutPicker: `{/* showPicker={false} drops the button and the popover: a field that is only ever typed into. */}
<TimePicker aria-label="Start time" showPicker={false} defaultValue="09:30" />`,

  controlled: `{/* const [time, setTime] = useState("09:30"); — onValueChange gets "" while the time is incomplete. */}
<TimePicker aria-label="Start time" value={time} onValueChange={setTime} />`,

  formField: `<FormField label="Reminder" helperText="In your local time">
  {(field) => <TimePicker {...field} />}
</FormField>`,

  translated: `{/* labels: every word the field writes. formatNumber: the digits shown, picked and announced. */}
<TimePicker
  aria-label="وقت البدء"
  defaultValue="21:05"
  labels={{ hour: "الساعة", minute: "الدقيقة", period: "ص/م", am: "ص", pm: "م", openPicker: "اختر الوقت", pickerName: "اختر وقتًا", clear: "مسح" }}
  formatNumber={(n) => n.toLocaleString("ar-EG")}
  clearable
/>`,
} as const;

/** The Playground's live controls, as far as the snippet cares. */
export interface TimePickerPlaygroundSnippetArgs {
  defaultValue?: string;
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
  clearable?: boolean;
}

/**
 * The Playground's snippet, built from its current controls: only the props that differ from their defaults, around
 * a small real field. A field needs an accessible name, so the `aria-label` is always written.
 */
export function timePickerPlaygroundSnippet(args: TimePickerPlaygroundSnippetArgs): string {
  const attributes: string[] = ['aria-label="Start time"'];
  if (args.defaultValue) attributes.push(`defaultValue="${args.defaultValue}"`);
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
  // `showPicker` defaults to true, so it only needs writing when it's off.
  if (args.showPicker === false) attributes.push("showPicker={false}");
  if (args.clearable) attributes.push("clearable");
  return `<TimePicker ${attributes.join(" ")} />`;
}
