import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import styles from "./TimePicker.module.css";
import type { TimePickerLabels } from "./TimePicker.types";
import { hourRange, overlapsRange } from "../../internal/time/timeValue";
import type { HourCycle, Period, Segment, TimeDraft, TimeParts } from "../../internal/time/timeValue";

interface ColumnOption {
  value: number | Period;
  text: string;
  disabled: boolean;
}

interface Column {
  segment: Segment;
  label: string;
  options: ColumnOption[];
}

export interface TimePickerColumnsProps {
  draft: TimeDraft;
  cycle: HourCycle;
  showSeconds: boolean;
  step: number;
  min: TimeParts | undefined;
  max: TimeParts | undefined;
  labels: TimePickerLabels;
  format: (value: number) => string;
  /** Called with the segment and the value picked in it. */
  onPick: (segment: Segment, value: number | Period) => void;
  /** Called when Enter is pressed on an option: the pick is already made, so the picker can close. */
  onDone: () => void;
}

const range = (from: number, to: number, by = 1) => {
  const values: number[] = [];
  for (let n = from; n <= to; n += by) values.push(n);
  return values;
};

/** The 24-hour hour a draft stands for, if its hour (and, in 12-hour, its period) is set. */
function hour24Of(draft: TimeDraft, cycle: HourCycle): number | undefined {
  if (draft.hour === undefined) return undefined;
  if (cycle === "24") return draft.hour;
  if (draft.period === undefined) return undefined;
  return (draft.hour % 12) + (draft.period === "pm" ? 12 : 0);
}

const at = (hours: number, minutes: number, seconds: number): TimeParts => ({ hours, minutes, seconds });

/**
 * The picker's columns: one listbox each of hours, minutes, (seconds and) AM/PM. Choosing an option commits at
 * once (so moving through a column with the arrow keys is choosing), an option no allowed time is reachable
 * through is disabled, and each column is a single tab stop with arrow keys inside it and left and right between
 * columns.
 */
export function TimePickerColumns({
  draft,
  cycle,
  showSeconds,
  step,
  min,
  max,
  labels,
  format,
  onPick,
  onDone,
}: TimePickerColumnsProps) {
  const root = useRef<HTMLDivElement>(null);

  const hour24 = hour24Of(draft, cycle);
  const columns: Column[] = [];

  const hourValues = cycle === "12" ? [12, ...range(1, 11)] : range(hourRange("24").min, hourRange("24").max);
  columns.push({
    segment: "hour",
    label: labels.hour,
    options: hourValues.map((hour) => {
      // Every 24-hour hour this option can mean, in the period chosen (or either one, if none is).
      const candidates =
        cycle === "24"
          ? [hour]
          : draft.period === undefined
            ? [hour % 12, (hour % 12) + 12]
            : [(hour % 12) + (draft.period === "pm" ? 12 : 0)];
      return {
        value: hour,
        text: format(hour),
        disabled: !candidates.some((h) => overlapsRange(at(h, 0, 0), at(h, 59, 59), min, max)),
      };
    }),
  });

  columns.push({
    segment: "minute",
    label: labels.minute,
    options: range(0, 59, step).map((minute) => ({
      value: minute,
      text: format(minute),
      disabled: hour24 === undefined ? false : !overlapsRange(at(hour24, minute, 0), at(hour24, minute, 59), min, max),
    })),
  });

  if (showSeconds) {
    columns.push({
      segment: "second",
      label: labels.second,
      options: range(0, 59).map((second) => ({
        value: second,
        text: format(second),
        disabled:
          hour24 === undefined || draft.minute === undefined
            ? false
            : !overlapsRange(at(hour24, draft.minute, second), at(hour24, draft.minute, second), min, max),
      })),
    });
  }

  if (cycle === "12") {
    columns.push({
      segment: "period",
      label: labels.period,
      options: (["am", "pm"] as const).map((period) => ({
        value: period,
        text: period === "am" ? labels.am : labels.pm,
        disabled: !overlapsRange(at(period === "am" ? 0 : 12, 0, 0), at(period === "am" ? 11 : 23, 59, 59), min, max),
      })),
    });
  }

  const chosen = (segment: Segment): number | Period | undefined =>
    segment === "hour" ? draft.hour : segment === "minute" ? draft.minute : segment === "second" ? draft.second : draft.period;

  // Bring each column's chosen option to the middle once, when the picker opens.
  useEffect(() => {
    root.current?.querySelectorAll<HTMLElement>('[role="listbox"]').forEach((column) => {
      const selected = column.querySelector<HTMLElement>('[aria-selected="true"]');
      if (selected) column.scrollTop = selected.offsetTop - column.clientHeight / 2 + selected.offsetHeight / 2;
    });
  }, []);

  const optionsOf = (column: Element) =>
    [...column.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])')];

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, column: Column, option: ColumnOption) => {
    const listbox = event.currentTarget.closest('[role="listbox"]')!;
    const enabled = optionsOf(listbox);
    const index = enabled.indexOf(event.currentTarget);
    // Moving within a column chooses, as a native listbox does; moving to another column only moves focus.
    const move = (target: HTMLElement | undefined, choose: boolean) => {
      if (!target) return;
      event.preventDefault();
      target.focus();
      if (choose) target.click();
    };
    switch (event.key) {
      case "ArrowDown":
        move(enabled[index + 1], true);
        break;
      case "ArrowUp":
        move(enabled[index - 1], true);
        break;
      case "Home":
        move(enabled[0], true);
        break;
      case "End":
        move(enabled[enabled.length - 1], true);
        break;
      case "ArrowRight":
      case "ArrowLeft": {
        const listboxes = [...(root.current?.querySelectorAll('[role="listbox"]') ?? [])];
        const next = listboxes[listboxes.indexOf(listbox) + (event.key === "ArrowRight" ? 1 : -1)];
        if (next) {
          const target = next.querySelector<HTMLElement>('[tabindex="0"]') ?? optionsOf(next)[0];
          move(target, false);
        }
        break;
      }
      case "Enter":
      case " ":
        event.preventDefault();
        if (!option.disabled) onPick(column.segment, option.value);
        if (event.key === "Enter") onDone();
        break;
    }
  };

  return (
    <div ref={root} className={styles.columns}>
      {columns.map((column) => {
        const current = chosen(column.segment);
        const firstEnabled = column.options.find((option) => !option.disabled);
        const tabStop = column.options.some((option) => option.value === current && !option.disabled)
          ? current
          : firstEnabled?.value;
        return (
          <div key={column.segment} role="listbox" aria-label={column.label} className={styles.column}>
            {column.options.map((option) => (
              <div
                key={option.value}
                role="option"
                aria-selected={option.value === current}
                aria-disabled={option.disabled || undefined}
                tabIndex={option.value === tabStop ? 0 : -1}
                className={styles.option}
                onClick={() => {
                  if (!option.disabled) onPick(column.segment, option.value);
                }}
                onKeyDown={(event) => onKeyDown(event, column, option)}
              >
                {option.text}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
