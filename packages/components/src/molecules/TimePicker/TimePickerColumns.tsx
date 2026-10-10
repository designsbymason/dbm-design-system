import { useEffect, useId, useLayoutEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import styles from "./TimePicker.module.css";
import type { TimePickerLabels } from "./TimePicker.types";
import { hasAllowedTime, hourRange } from "../../internal/time/timeValue";
import type { HourCycle, Period, Segment, TimeConstraints, TimeDraft } from "../../internal/time/timeValue";
import {
  copiesFor,
  middleGlobalIndex,
  nearestAllowedIndex,
  nearestGlobalIndex,
  stepAllowedIndex,
  wrapIndex,
} from "./wheelMath";

interface WheelOption {
  value: number | Period;
  text: string;
  disabled: boolean;
}

interface WheelColumn {
  segment: Segment;
  label: string;
  options: WheelOption[];
  /** Hours, minutes and seconds loop (59 is followed by 00); AM/PM does not. */
  loops: boolean;
}

export interface TimePickerColumnsProps {
  draft: TimeDraft;
  cycle: HourCycle;
  showSeconds: boolean;
  /** The range, the minute and second steps and the owner's own rule, which decide what each row is allowed. */
  rules: TimeConstraints;
  /** Puts the AM/PM wheel before the others rather than after. */
  periodFirst: boolean;
  labels: TimePickerLabels;
  /** Writes a number as it is shown: two digits, in the field's own numerals. */
  format: (value: number) => string;
  /** Called with the segment and the value chosen in it, as the wheel comes to a value (or a key or click chooses it). */
  onPick: (segment: Segment, value: number | Period) => void;
  /** Called when Enter is pressed on a wheel: the choice is already made, so the picker can close. */
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

/** How long after the last scroll event a wheel is taken to have come to rest. */
const SETTLE_MS = 140;
/** How many times a wheel still on its way to a chosen row is waited for before it is read as at rest. */
const MAX_SETTLE_WAITS = 12;
/** How far, in rows, a number is from the middle at which it is no longer worth restyling. */
const STYLED_REACH = 3;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface WheelProps {
  column: WheelColumn;
  /** The chosen value, or `undefined` while that segment is empty. */
  chosen: number | Period | undefined;
  onPick: (value: number | Period) => void;
  onDone: () => void;
  /** Called to move focus to the wheel before (-1) or after (1) this one. */
  onNavigate: (direction: 1 | -1) => void;
}

/**
 * One wheel: a column that shows five rows with the chosen one in the middle, behind the picker's band. It scrolls,
 * snaps a row at a time, and the numbers grow and strengthen as they reach the middle. A wheel that loops is drawn as
 * several copies of its values and put back to the middle copy each time it comes to rest, so it never runs out.
 *
 * The chosen value is whichever row is in the middle (live, as it passes, if it is allowed; a disabled row is moved off
 * to the nearest allowed one when the wheel rests). The keys and a click choose a value directly and scroll to it.
 * Only the middle copy is in the accessibility tree: the options are real `role="option"` rows, the rest are `aria-hidden`.
 */
function Wheel({ column, chosen, onPick, onDone, onNavigate }: WheelProps) {
  const { options, loops } = column;
  const count = options.length;
  const copies = loops ? copiesFor(count) : 1;
  const baseId = useId();
  const list = useRef<HTMLDivElement>(null);
  const rowHeight = useRef(0);
  const frame = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** The value index last reported (or shown), so only a change is passed on. */
  const reported = useRef(-1);
  /** The value index a programmatic scroll is heading to; commits are held while it is set. */
  const aimed = useRef<number | null>(null);
  /** Where `aimed` is on the list's scroll axis, and how many settle checks have found the wheel still short of it. */
  const aimedTop = useRef(0);
  const settleWaits = useRef(0);
  const styledRows = useRef<Set<HTMLElement>>(new Set());

  const chosenIndex = options.findIndex((option) => option.value === chosen);
  const allowed = options.map((option) => !option.disabled);
  // The latest of these, read from handlers that outlive a render (the scroll timers).
  const latest = useRef({ options, allowed, loops, count, copies, onPick });
  useEffect(() => {
    latest.current = { options, allowed, loops, count, copies, onPick };
  });

  const scrollTo = (top: number, smooth: boolean) => {
    const element = list.current;
    if (!element) return;
    if (typeof element.scrollTo === "function") element.scrollTo({ top, behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto" });
    else element.scrollTop = top;
  };

  /** Draws the numbers near the middle at their size and strength for how far each is from it. */
  const styleRows = (centre: number) => {
    const element = list.current;
    if (!element) return;
    const first = Math.max(0, Math.floor(centre) - STYLED_REACH);
    const last = Math.min(element.children.length - 1, Math.ceil(centre) + STYLED_REACH);
    const now = new Set<HTMLElement>();
    for (let row = first; row <= last; row += 1) {
      const rowElement = element.children[row] as HTMLElement | undefined;
      if (!rowElement) continue;
      rowElement.style.setProperty("--time-picker-wheel-distance", String(Math.abs(row - centre)));
      now.add(rowElement);
    }
    for (const stale of styledRows.current) if (!now.has(stale)) stale.style.removeProperty("--time-picker-wheel-distance");
    styledRows.current = now;
  };

  const measure = () => {
    const first = list.current?.firstElementChild as HTMLElement | null;
    if (first && first.offsetHeight > 0) rowHeight.current = first.offsetHeight;
    return rowHeight.current;
  };

  const globalIndexNow = () => {
    const row = measure();
    return row > 0 && list.current ? Math.round(list.current.scrollTop / row) : 0;
  };

  /** Scrolls so value `valueIndex` is in the middle, by the short way round, and holds commits until it arrives. */
  const goTo = (valueIndex: number, smooth: boolean) => {
    const row = measure();
    const element = list.current;
    if (!element || row <= 0) return;
    const global = loops ? nearestGlobalIndex(valueIndex, count, copies, globalIndexNow()) : valueIndex;
    const top = global * row;
    if (Math.abs(element.scrollTop - top) >= 1) {
      aimed.current = valueIndex;
      aimedTop.current = top;
      settleWaits.current = 0;
    }
    scrollTo(top, smooth);
    styleRows(global);
  };

  const commit = (valueIndex: number) => {
    reported.current = valueIndex;
    const current = latest.current;
    const option = current.options[valueIndex];
    if (option) current.onPick(option.value);
  };

  // The row in the middle, as a value index (a loop wraps, a wheel that doesn't is held inside its values).
  const centredValueIndex = () => {
    const global = globalIndexNow();
    const current = latest.current;
    return current.loops ? wrapIndex(global, current.count) : Math.min(current.count - 1, Math.max(0, global));
  };

  /** The wheel has come to rest: move off a disabled row, report the value, and put a loop back to its middle copy. */
  const settle = () => {
    const row = measure();
    const element = list.current;
    if (!element || row <= 0) return;
    const current = latest.current;
    const global = globalIndexNow();
    const valueIndex = centredValueIndex();
    if (aimed.current !== null) {
      // Still on its way. The scroll events that keep this timer waiting arrive late on a busy page, so reading the
      // wheel now would report the row it has not yet left and then cancel the scroll; wait for it (a bounded number
      // of times, in case something else took the scroll from it).
      if (Math.abs(element.scrollTop - aimedTop.current) >= 1 && settleWaits.current < MAX_SETTLE_WAITS) {
        settleWaits.current += 1;
        settleTimer.current = setTimeout(settle, SETTLE_MS);
        return;
      }
      const target = aimed.current;
      aimed.current = null;
      settleWaits.current = 0;
      // Arrived where it was sent: nothing to report (the choice was made when it was sent).
      if (valueIndex === target) {
        recentre(global, valueIndex);
        return;
      }
    }
    if (!current.allowed[valueIndex]) {
      const nearest = nearestAllowedIndex(current.allowed, valueIndex, current.loops);
      if (nearest !== undefined) {
        commit(nearest);
        goTo(nearest, true);
      }
      return;
    }
    if (valueIndex !== reported.current) commit(valueIndex);
    recentre(global, valueIndex);
  };

  /** A loop is put back to its middle copy, invisibly, so a long fling never reaches its ends. */
  const recentre = (global: number, valueIndex: number) => {
    const current = latest.current;
    if (!current.loops) return;
    const middle = middleGlobalIndex(valueIndex, current.count, current.copies);
    if (middle === global || list.current === null) return;
    const row = rowHeight.current;
    list.current.scrollTop = middle * row;
    styleRows(middle);
  };

  const onScroll = () => {
    if (frame.current === 0) {
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const row = measure();
        if (row <= 0 || !list.current) return;
        styleRows(list.current.scrollTop / row);
        // The live choice: the row in the middle, as it changes, if it is allowed and nothing is steering the wheel.
        if (aimed.current !== null) return;
        const valueIndex = centredValueIndex();
        if (valueIndex !== reported.current && latest.current.allowed[valueIndex]) commit(valueIndex);
      });
    }
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(settle, SETTLE_MS);
  };

  // At rest on the chosen value (or the first, with nothing chosen) as soon as the wheel is drawn.
  useLayoutEffect(() => {
    reported.current = chosenIndex;
    const start = chosenIndex >= 0 ? chosenIndex : 0;
    const row = measure();
    if (row <= 0 || !list.current) return;
    const global = loops ? middleGlobalIndex(start, count, copies) : start;
    if (Math.abs(list.current.scrollTop - global * row) >= 1) {
      aimed.current = start;
      aimedTop.current = global * row;
      settleWaits.current = 0;
    }
    list.current.scrollTop = global * row;
    styleRows(global);
    // On mount only: later changes of the chosen value are followed by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A value set from outside (a segment typed into while the picker is open) brings the wheel round to it.
  useEffect(() => {
    if (chosenIndex === reported.current) return;
    reported.current = chosenIndex;
    if (chosenIndex >= 0) goTo(chosenIndex, false);
    // `goTo` is rebuilt every render and reads only refs and the stable counts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenIndex]);

  useEffect(
    () => () => {
      clearTimeout(settleTimer.current);
      if (frame.current !== 0) cancelAnimationFrame(frame.current);
    },
    [],
  );

  /** Chooses a value directly (a key, a click) and scrolls it to the middle. */
  const choose = (valueIndex: number | undefined) => {
    if (valueIndex === undefined || !allowed[valueIndex]) return;
    commit(valueIndex);
    goTo(valueIndex, true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        // Stepped from the last value reported, not the one last drawn: a key repeating faster than the page re-renders
        // would otherwise step from the same value twice.
        const from = reported.current >= 0 ? reported.current : chosenIndex;
        if (from < 0) {
          // Nothing chosen yet: the first arrow chooses what is in the middle.
          choose(nearestAllowedIndex(allowed, centredValueIndex(), loops));
          break;
        }
        choose(stepAllowedIndex(allowed, from, event.key === "ArrowDown" ? 1 : -1, loops));
        break;
      }
      case "Home":
        event.preventDefault();
        choose(nearestAllowedIndex(allowed, 0, false));
        break;
      case "End":
        event.preventDefault();
        choose(nearestAllowedIndex(allowed, count - 1, false));
        break;
      case "ArrowLeft":
      case "ArrowRight":
        event.preventDefault();
        onNavigate(event.key === "ArrowRight" ? 1 : -1);
        break;
      case "Enter":
        event.preventDefault();
        onDone();
        break;
    }
  };

  const middleCopy = Math.floor(copies / 2);
  const optionId = (valueIndex: number) => `${baseId}-${valueIndex}`;

  return (
    <div
      ref={list}
      role="listbox"
      aria-label={column.label}
      aria-activedescendant={chosenIndex >= 0 ? optionId(chosenIndex) : undefined}
      tabIndex={0}
      className={styles.wheel}
      onScroll={onScroll}
      onKeyDown={onKeyDown}
    >
      {Array.from({ length: copies * count }, (_, global) => {
        const valueIndex = global % count;
        const option = options[valueIndex]!;
        const inMiddle = Math.floor(global / count) === middleCopy;
        return (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- a click on a row is a pointer convenience (choose this number); the wheel that holds the rows is the keyboard-operable listbox (arrow keys choose), and the rows in the middle copy are real `role="option"`s.
          <div
            key={global}
            // Only the middle copy is in the accessibility tree; the others are the same rows, drawn to loop.
            {...(inMiddle
              ? {
                  id: optionId(valueIndex),
                  role: "option" as const,
                  "aria-selected": valueIndex === chosenIndex,
                  "aria-disabled": option.disabled || undefined,
                }
              : { "aria-hidden": true as const })}
            className={styles.wheelRow}
            // A click is a choice; the wheel itself (the nearest focusable ancestor) takes focus.
            onClick={() => choose(valueIndex)}
          >
            {option.text}
          </div>
        );
      })}
    </div>
  );
}

/**
 * The picker's wheels: an hour, a minute, an optional second and an AM/PM wheel side by side, behind one band across the
 * middle row that marks what is chosen. Hours, minutes and seconds loop; each wheel is a single tab stop whose arrow keys
 * choose, with left and right between wheels and `Enter` to close.
 */
export function TimePickerColumns({
  draft,
  cycle,
  showSeconds,
  rules,
  periodFirst,
  labels,
  format,
  onPick,
  onDone,
}: TimePickerColumnsProps) {
  const root = useRef<HTMLDivElement>(null);
  const hour24 = hour24Of(draft, cycle);
  const columns: WheelColumn[] = [];
  const secondStep = rules.secondStep ?? 1;
  // An option is disabled when no allowed time can still be reached through it: an hour by any of its minutes, a minute
  // by any of its seconds. What is chosen in the segments after it doesn't count, only the ones that decide it (the
  // period for an hour, the hour for a minute, the minute for a second).
  const reachable = (hours: readonly number[], minute?: number, second?: number) =>
    hasAllowedTime(hours, minute, second, rules, showSeconds);

  const hourValues = cycle === "12" ? [12, ...range(1, 11)] : range(hourRange("24").min, hourRange("24").max);
  columns.push({
    segment: "hour",
    label: labels.hour,
    loops: true,
    options: hourValues.map((hour) => {
      // Every 24-hour hour this option can mean, in the period chosen (or either one, if none is).
      const candidates =
        cycle === "24"
          ? [hour]
          : draft.period === undefined
            ? [hour % 12, (hour % 12) + 12]
            : [(hour % 12) + (draft.period === "pm" ? 12 : 0)];
      return { value: hour, text: format(hour), disabled: !reachable(candidates) };
    }),
  });

  columns.push({
    segment: "minute",
    label: labels.minute,
    loops: true,
    options: range(0, 59, rules.step).map((minute) => ({
      value: minute,
      text: format(minute),
      disabled: hour24 === undefined ? false : !reachable([hour24], minute),
    })),
  });

  if (showSeconds) {
    columns.push({
      segment: "second",
      label: labels.second,
      loops: true,
      options: range(0, 59, secondStep).map((second) => ({
        value: second,
        text: format(second),
        disabled: hour24 === undefined || draft.minute === undefined ? false : !reachable([hour24], draft.minute, second),
      })),
    });
  }

  if (cycle === "12") {
    columns[periodFirst ? "unshift" : "push"]({
      segment: "period",
      label: labels.period,
      loops: false,
      options: (["am", "pm"] as const).map((period) => ({
        value: period,
        text: period === "am" ? labels.am : labels.pm,
        disabled: !reachable(range(period === "am" ? 0 : 12, period === "am" ? 11 : 23)),
      })),
    });
  }

  const chosen = (segment: Segment): number | Period | undefined =>
    segment === "hour" ? draft.hour : segment === "minute" ? draft.minute : segment === "second" ? draft.second : draft.period;

  const navigate = (from: number, direction: 1 | -1) => {
    const wheels = [...(root.current?.querySelectorAll<HTMLElement>('[role="listbox"]') ?? [])];
    wheels[from + direction]?.focus();
  };

  return (
    <div ref={root} className={styles.wheels}>
      {/* The chosen row: the same height as a row, across every wheel, behind them. */}
      <div aria-hidden="true" className={styles.band} />
      {columns.map((column, index) => (
        <Wheel
          key={column.segment}
          column={column}
          chosen={chosen(column.segment)}
          onPick={(value) => onPick(column.segment, value)}
          onDone={onDone}
          onNavigate={(direction) => navigate(index, direction)}
        />
      ))}
    </div>
  );
}
