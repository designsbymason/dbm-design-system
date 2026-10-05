import { CaretLeftIcon, CaretRightIcon } from "@dbm-design-system/icons";
import { cx } from "@dbm-design-system/primitives";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "../../atoms/Button";
import { Icon } from "../../atoms/Icon";
import type { IconSize } from "../../atoms/Icon/Icon.types";
import { formatMonth, parseDate } from "../../internal/date/dateValue";
import styles from "./Calendar.module.css";
import type { CalendarLabels, CalendarSize } from "./Calendar.types";

// The same icon step `Button` and `Pagination` use at each size.
const iconSize: Record<CalendarSize, IconSize> = { xs: "xs", sm: "xs", md: "sm", lg: "sm", xl: "md" };

const clampYear = (year: number): number => Math.min(Math.max(year, 1), 9999);

export interface CalendarPickerProps {
  /** The month on show when the picker opened: it opens on its year, with its month chosen. */
  shown: { year: number; month: number };
  /** Today as `"YYYY-MM-DD"`, once the clock is known. */
  today: string | undefined;
  min: string;
  max: string;
  size: CalendarSize;
  rounded: boolean;
  disabled: boolean;
  dir: "ltr" | "rtl";
  labels: CalendarLabels;
  formatNumber: (value: number) => string;
  /** Says something to assistive technology (a no-op when the calendar's announcements are off). */
  say: (text: string) => void;
  /** A month has been chosen. */
  onChoose: (year: number, month: number) => void;
  /** The picker has been closed without a choice. */
  onClose: () => void;
}

/**
 * The grid of a year's twelve months, and the grid of twelve years above it (`captionLayout="views"`). It mounts when
 * the heading of the days is chosen and goes when a month is chosen or `Escape` is pressed, so what it remembers — the
 * grid on show, the year it is looking at, the cell that has focus — begins afresh each time. It is as tall as the six
 * rows of days it replaces.
 */
export function CalendarPicker({
  shown,
  today,
  min,
  max,
  size,
  rounded,
  disabled,
  dir,
  labels,
  formatNumber,
  say,
  onChoose,
  onClose,
}: CalendarPickerProps) {
  const [view, setView] = useState<"months" | "years">("months");
  const [pickerYear, setPickerYear] = useState(shown.year);
  const [pickerFocus, setPickerFocus] = useState(shown.month);
  const rootRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(true);
  const flipped = dir === "rtl";

  const minYear = min !== "" ? (parseDate(min)?.year ?? 1) : 1;
  const maxYear = max !== "" ? (parseDate(max)?.year ?? 9999) : 9999;
  const yearAllowed = (year: number): boolean => year >= minYear && year <= maxYear;
  const monthAllowed = (year: number, monthNumber: number): boolean => {
    const key = formatMonth(year, monthNumber);
    return !((min !== "" && key < min.slice(0, 7)) || (max !== "" && key > max.slice(0, 7)));
  };
  // The years grid is a page of twelve, the page that holds `pickerYear`.
  const pageFrom = pickerYear - ((pickerYear - 1) % 12);
  const pageTo = Math.min(pageFrom + 11, 9999);

  // Says which grid has opened, on mounting and each time it changes.
  const announced = useRef("");
  const yearsText = labels.yearsRange(formatNumber(pageFrom), formatNumber(pageTo));
  const monthsText = labels.monthsView(formatNumber(pickerYear));
  useEffect(() => {
    const text = view === "months" ? monthsText : yearsText;
    if (announced.current === text) return;
    announced.current = text;
    say(text);
  }, [view, monthsText, yearsText, say]);

  // Moves focus to the cell that should have it, after the grid is drawn: on opening, and after a key that turns it.
  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    const inPage = view === "years" ? Math.min(Math.max(pickerFocus, pageFrom), pageTo) : pickerFocus;
    rootRef.current?.querySelector<HTMLButtonElement>(`button[data-picker-cell="${inPage}"]`)?.focus();
  });

  const openYears = (): void => {
    setPickerFocus(pickerYear);
    setView("years");
    pendingFocus.current = true;
  };
  const pickMonth = (monthNumber: number): void => {
    if (monthAllowed(pickerYear, monthNumber)) onChoose(pickerYear, monthNumber);
  };
  const pickYear = (year: number): void => {
    if (!yearAllowed(year)) return;
    setPickerYear(year);
    setPickerFocus(year === shown.year ? shown.month : 1);
    setView("months");
    pendingFocus.current = true;
  };
  /** Turns the grid: a year in the months grid, a page of twelve in the years grid. */
  const stepPicker = (by: number): void => {
    setPickerYear(clampYear(pickerYear + (view === "months" ? by : by * 12)));
    if (view === "years") setPickerFocus(clampYear(pickerFocus + by * 12));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    const cell = (event.target as Element).closest<HTMLButtonElement>("button[data-picker-cell]");
    if (!cell) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const current = Number(cell.dataset.pickerCell);
    const first = view === "months" ? 1 : pageFrom;
    const rtl = dir === "rtl";
    let next: number;
    switch (event.key) {
      case "ArrowLeft":
        next = current + (rtl ? 1 : -1);
        break;
      case "ArrowRight":
        next = current + (rtl ? -1 : 1);
        break;
      case "ArrowUp":
        next = current - 3;
        break;
      case "ArrowDown":
        next = current + 3;
        break;
      case "Home":
        next = current - ((current - first) % 3);
        break;
      case "End":
        next = current - ((current - first) % 3) + 2;
        break;
      case "PageUp":
      case "PageDown": {
        event.preventDefault();
        // A year in the months grid, a page in the years grid; the cell that has focus stays where it is.
        stepPicker(event.key === "PageUp" ? -1 : 1);
        pendingFocus.current = true;
        return;
      }
      default:
        return;
    }
    event.preventDefault();
    if (view === "months") {
      // A move past the top, the bottom or either end of the twelve stays where it is.
      if (next < 1 || next > 12) return;
    } else {
      next = clampYear(next);
      // Moving off the page turns to the page that holds the year.
      if (next < pageFrom || next > pageTo) setPickerYear(next);
    }
    setPickerFocus(next);
    pendingFocus.current = true;
  };

  const todayParsed = parseDate(today);
  const previousUnavailable =
    disabled || (view === "months" ? pickerYear - 1 < minYear : pageFrom - 1 < minYear || pageFrom <= 1);
  const nextUnavailable =
    disabled || (view === "months" ? pickerYear + 1 > maxYear : pageTo + 1 > maxYear || pageTo >= 9999);
  const pickerYearText = formatNumber(pickerYear);
  const tabbable = view === "years" ? Math.min(Math.max(pickerFocus, pageFrom), pageTo) : pickerFocus;

  return (
    <div ref={rootRef} className={styles.month}>
      <div className={styles.header}>
        <Button asChild variant="tertiary" size={size} rounded={rounded} disabled={previousUnavailable} className={styles.monthButton}>
          <button type="button" aria-label={view === "months" ? labels.previousYear : labels.previousYears} onClick={() => stepPicker(-1)}>
            <Icon icon={flipped ? CaretRightIcon : CaretLeftIcon} size={iconSize[size]} tone="brand" />
          </button>
        </Button>
        {view === "months" ? (
          <button type="button" className={styles.captionButton} aria-label={labels.openYears(pickerYearText)} onClick={openYears}>
            {pickerYearText}
          </button>
        ) : (
          <div className={styles.caption}>{yearsText}</div>
        )}
        <Button asChild variant="tertiary" size={size} rounded={rounded} disabled={nextUnavailable} className={styles.monthButton}>
          <button type="button" aria-label={view === "months" ? labels.nextYear : labels.nextYears} onClick={() => stepPicker(1)}>
            <Icon icon={flipped ? CaretLeftIcon : CaretRightIcon} size={iconSize[size]} tone="brand" />
          </button>
        </Button>
      </div>
      {/* Roving focus, as in the grid of days: the cells inside are the tab stops, so the grid itself takes none. */}
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- see the comment above. */}
      <div className={styles.picker} role="grid" aria-label={view === "months" ? monthsText : yearsText} onKeyDown={onKeyDown}>
        {[0, 1, 2, 3].map((row) => (
          <div key={row} role="row" className={styles.pickerRow}>
            {[0, 1, 2].map((column) => {
              const slot = row * 3 + column;
              const value = view === "months" ? slot + 1 : pageFrom + slot;
              if (view === "years" && value > 9999) return <div key={slot} role="gridcell" />;
              const allowed = view === "months" ? monthAllowed(pickerYear, value) : yearAllowed(value);
              const chosen = view === "months" ? pickerYear === shown.year && value === shown.month : value === shown.year;
              const current =
                todayParsed !== null &&
                (view === "months" ? todayParsed.year === pickerYear && todayParsed.month === value : todayParsed.year === value);
              return (
                <div key={slot} role="gridcell" aria-selected={chosen} aria-disabled={!allowed || undefined} className={styles.pickerCell}>
                  <button
                    type="button"
                    data-picker-cell={value}
                    tabIndex={value === tabbable ? 0 : -1}
                    aria-label={view === "months" ? (labels.months[value - 1] ?? "") : undefined}
                    aria-current={current ? "date" : undefined}
                    className={cx(styles.day, chosen && styles.selected, current && styles.today, !allowed && styles.unavailable)}
                    onClick={() => (view === "months" ? pickMonth(value) : pickYear(value))}
                    onFocus={() => setPickerFocus(value)}
                  >
                    {view === "months" ? labels.monthsShort[value - 1] : formatNumber(value)}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
