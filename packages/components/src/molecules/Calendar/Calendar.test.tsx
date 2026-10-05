import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import buttonStyles from "../../atoms/Button/Button.module.css";
import { Calendar } from "./Calendar";
import styles from "./Calendar.module.css";
import type { CalendarProps, CalendarRangeValue } from "./Calendar.types";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

// October 2026: the 1st is a Thursday, the 5th a Monday. `today` is fixed so nothing depends on the clock.
function renderCalendar(props: Partial<CalendarProps> = {}) {
  return render(<Calendar month="2026-10" today="2026-10-14" data-testid="calendar" {...(props as CalendarProps)} />);
}

/** A day's button, by its date. */
const day = (date: string): HTMLButtonElement => {
  const button = document.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`);
  if (!button) throw new Error(`no day ${date} on show`);
  return button;
};
const cell = (date: string) => day(date).closest("td") as HTMLTableCellElement;
const heading = () => screen.getByRole("grid").getAttribute("aria-labelledby");
const title = () => document.getElementById(heading() ?? "")?.textContent;
const previous = () => screen.getByRole("button", { name: "Previous month" });
const next = () => screen.getByRole("button", { name: "Next month" });
const focused = () => (document.activeElement as HTMLElement | null)?.dataset.date;

function focusDay(date: string) {
  act(() => day(date).focus());
}

describe("Calendar", () => {
  describe("structure", () => {
    it("is a group named Calendar around a grid named by the month and year", () => {
      renderCalendar();
      expect(screen.getByRole("group", { name: "Calendar" })).toBeInTheDocument();
      expect(screen.getByRole("grid", { name: "October 2026" })).toBeInTheDocument();
    });

    it("draws six weeks of seven days, always, whichever the month", () => {
      renderCalendar();
      expect(within(screen.getByRole("grid")).getAllByRole("row")).toHaveLength(7); // headings + 6 weeks
      expect(document.querySelectorAll("button[data-date]")).toHaveLength(42);
      render(<Calendar month="2026-02" today="2026-02-01" />);
      expect(document.querySelectorAll("button[data-date]")).toHaveLength(84);
    });

    it("starts the first week on the weekStartsOn day and lists the month's days in order", () => {
      renderCalendar();
      const dates = [...document.querySelectorAll<HTMLElement>("button[data-date]")].map((b) => b.dataset.date);
      expect(dates[0]).toBe("2026-09-27");
      expect(dates[4]).toBe("2026-10-01");
      expect(dates[41]).toBe("2026-11-07");
    });

    it("names the columns with the full weekday and shows the short one", () => {
      renderCalendar();
      const headers = screen.getAllByRole("columnheader");
      expect(headers.map((header) => header.textContent)).toEqual([
        "SuSunday",
        "MoMonday",
        "TuTuesday",
        "WeWednesday",
        "ThThursday",
        "FrFriday",
        "SaSaturday",
      ]);
      expect(screen.getByRole("columnheader", { name: "Sunday" })).toBeInTheDocument();
    });

    it("puts the week's first day first", () => {
      renderCalendar({ weekStartsOn: 1 });
      expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName("Monday");
      expect(document.querySelector("button[data-date]")).toHaveAttribute("data-date", "2026-09-28");
      expect(screen.getAllByRole("columnheader")[6]).toHaveAccessibleName("Sunday");
    });

    it("dims the neighbouring months' days and can leave their cells empty", () => {
      renderCalendar();
      expect(day("2026-09-30")).toHaveClass(styles.outside ?? "");
      expect(day("2026-10-01")).not.toHaveClass(styles.outside ?? "");
      renderCalendar({ showOutsideDays: false });
      expect(document.querySelectorAll("button[data-date]").length).toBe(42 + 31);
      expect(document.querySelectorAll("td:empty").length).toBe(11);
    });

    it("forwards the ref to the outermost element and passes className, style, id and data-testid there", () => {
      const ref = createRef<HTMLDivElement>();
      renderCalendar({ ref, className: "mine", style: { marginBlock: "3px" }, id: "cal" } as Partial<CalendarProps>);
      const root = screen.getByTestId("calendar");
      expect(ref.current).toBe(root);
      expect(root).toHaveClass("mine");
      expect(root).toHaveStyle({ marginBlock: "3px" });
      expect(root).toHaveAttribute("id", "cal");
    });

    it("passes other native attributes to the outermost element, but never lets them replace the role", () => {
      renderCalendar({ title: "Pick a day", role: "presentation" } as Partial<CalendarProps>);
      const root = screen.getByTestId("calendar");
      expect(root).toHaveAttribute("title", "Pick a day");
      expect(root).toHaveAttribute("role", "group");
    });

    it("takes its name from aria-label or aria-labelledby", () => {
      renderCalendar({ "aria-label": "Departure" });
      expect(screen.getByRole("group", { name: "Departure" })).toBeInTheDocument();
    });

    it("names a day in full, with its weekday, and shows only its number", () => {
      renderCalendar();
      expect(day("2026-10-05")).toHaveAccessibleName("Monday, October 5, 2026");
      expect(day("2026-10-05")).toHaveTextContent("5");
      expect(day("2026-10-05").textContent).toBe("5");
    });
  });

  describe("choosing a date", () => {
    it("chooses a date on click and calls onValueChange with it", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ onValueChange });
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).toHaveBeenCalledOnce();
      expect(onValueChange).toHaveBeenCalledWith("2026-10-20");
    });

    it("marks the chosen date selected, and only that one", async () => {
      renderCalendar({ defaultValue: "2026-10-06" });
      expect(cell("2026-10-06")).toHaveAttribute("aria-selected", "true");
      expect(cell("2026-10-07")).toHaveAttribute("aria-selected", "false");
      await userEvent.click(day("2026-10-07"));
      expect(cell("2026-10-06")).toHaveAttribute("aria-selected", "false");
      expect(cell("2026-10-07")).toHaveAttribute("aria-selected", "true");
      expect(day("2026-10-07")).toHaveClass(styles.selected ?? "");
    });

    it("does not call onValueChange for the date already chosen", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ defaultValue: "2026-10-06", onValueChange });
      await userEvent.click(day("2026-10-06"));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("chooses with Enter and with Space", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ onValueChange });
      focusDay("2026-10-08");
      await userEvent.keyboard("{Enter}");
      focusDay("2026-10-09");
      await userEvent.keyboard(" ");
      expect(onValueChange.mock.calls).toEqual([["2026-10-08"], ["2026-10-09"]]);
    });

    it("is controlled by value: it shows what it is given and changes only when told", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ value: "2026-10-06", onValueChange });
      await userEvent.click(day("2026-10-12"));
      expect(onValueChange).toHaveBeenCalledWith("2026-10-12");
      expect(cell("2026-10-06")).toHaveAttribute("aria-selected", "true");
      expect(cell("2026-10-12")).toHaveAttribute("aria-selected", "false");
    });

    it("follows a controlled value held in state", async () => {
      function Controlled() {
        const [value, setValue] = useState("2026-10-06");
        return <Calendar month="2026-10" today="2026-10-14" value={value} onValueChange={setValue} />;
      }
      render(<Controlled />);
      await userEvent.click(day("2026-10-12"));
      expect(cell("2026-10-12")).toHaveAttribute("aria-selected", "true");
    });

    it("starts an uncontrolled calendar on defaultValue", () => {
      renderCalendar({ defaultValue: "2026-10-22" });
      expect(cell("2026-10-22")).toHaveAttribute("aria-selected", "true");
    });

    it("moves to the month of a neighbouring day that is chosen", async () => {
      const onMonthChange = vi.fn();
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" onMonthChange={onMonthChange} />);
      await userEvent.click(day("2026-11-03"));
      expect(title()).toBe("November 2026");
      expect(onMonthChange).toHaveBeenCalledWith("2026-11");
      expect(cell("2026-11-03")).toHaveAttribute("aria-selected", "true");
    });

    it("reads a value that is not a real date as none, and says so in development", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderCalendar({ value: "2026-02-30" });
      expect(document.querySelector('[aria-selected="true"]')).toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`value` must be a real date"));
    });

    it("warns when both value and defaultValue are given", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderCalendar({ value: "2026-10-06", defaultValue: "2026-10-07" });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("both `value` and `defaultValue`"));
    });
  });

  describe("unavailable dates", () => {
    it("rules out dates before min and after max", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ min: "2026-10-10", max: "2026-10-20", onValueChange });
      expect(cell("2026-10-09")).toHaveAttribute("aria-disabled", "true");
      expect(cell("2026-10-21")).toHaveAttribute("aria-disabled", "true");
      expect(cell("2026-10-10")).not.toHaveAttribute("aria-disabled");
      await userEvent.click(day("2026-10-09"));
      await userEvent.click(day("2026-10-21"));
      expect(onValueChange).not.toHaveBeenCalled();
      await userEvent.click(day("2026-10-10"));
      expect(onValueChange).toHaveBeenCalledWith("2026-10-10");
    });

    it("rules out dates the isDateDisabled rule names", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ isDateDisabled: (date) => date.endsWith("-13"), onValueChange });
      expect(cell("2026-10-13")).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(day("2026-10-13"));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("keeps an unavailable date focusable, so the arrow keys never skip it", async () => {
      renderCalendar({ isDateDisabled: (date) => date === "2026-10-15", defaultValue: "2026-10-14" });
      focusDay("2026-10-14");
      await userEvent.keyboard("{ArrowRight}");
      expect(focused()).toBe("2026-10-15");
      await userEvent.keyboard("{Enter}");
      expect(cell("2026-10-15")).toHaveAttribute("aria-selected", "false");
    });

    it("does not choose anything when disabled, and marks every date and both buttons unavailable", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ disabled: true, onValueChange });
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(cell("2026-10-20")).toHaveAttribute("aria-disabled", "true");
      expect(screen.getByRole("grid")).toHaveAttribute("aria-disabled", "true");
      expect(previous()).toHaveAttribute("aria-disabled", "true");
      expect(next()).toHaveAttribute("aria-disabled", "true");
      // Not natively disabled: still reachable.
      expect(previous()).not.toBeDisabled();
    });

    it("shows the choice but does not change it when readOnly, and still moves between months and dates", async () => {
      const onValueChange = vi.fn();
      renderCalendar({ readOnly: true, defaultValue: "2026-10-06", onValueChange });
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(cell("2026-10-06")).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("grid")).toHaveAttribute("aria-readonly", "true");
      focusDay("2026-10-06");
      await userEvent.keyboard("{ArrowRight}");
      expect(focused()).toBe("2026-10-07");
    });

    it("warns about a min after max, and a bad date, in development", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderCalendar({ min: "2026-10-20", max: "2026-10-10" });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`min` is after `max`"));
      renderCalendar({ min: "soon" });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`min` must be a real date"));
    });
  });

  describe("choosing a range", () => {
    const range = (props: Partial<CalendarProps> = {}) =>
      renderCalendar({ mode: "range", ...props } as Partial<CalendarProps>);

    it("takes the first choice as the start and the second as the end", async () => {
      const onValueChange = vi.fn();
      range({ onValueChange });
      await userEvent.click(day("2026-10-08"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-08", ""]);
      await userEvent.click(day("2026-10-12"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-08", "2026-10-12"]);
      expect(onValueChange).toHaveBeenCalledTimes(2);
    });

    it("starts again on a third choice", async () => {
      const onValueChange = vi.fn();
      range({ onValueChange, defaultValue: ["2026-10-08", "2026-10-12"] });
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-20", ""]);
    });

    it("moves the start when the second choice is before it", async () => {
      const onValueChange = vi.fn();
      range({ onValueChange, defaultValue: ["2026-10-12", ""] });
      await userEvent.click(day("2026-10-08"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-08", ""]);
    });

    it("lets a range be one day long", async () => {
      const onValueChange = vi.fn();
      range({ onValueChange, defaultValue: ["2026-10-12", ""] });
      await userEvent.click(day("2026-10-12"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-12", "2026-10-12"]);
    });

    it("marks the ends and everything between them selected, and nothing outside", () => {
      range({ defaultValue: ["2026-10-08", "2026-10-12"] });
      for (const date of ["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12"]) {
        expect(cell(date)).toHaveAttribute("aria-selected", "true");
      }
      expect(cell("2026-10-07")).toHaveAttribute("aria-selected", "false");
      expect(cell("2026-10-13")).toHaveAttribute("aria-selected", "false");
      expect(day("2026-10-08")).toHaveClass(styles.selected ?? "");
      expect(day("2026-10-12")).toHaveClass(styles.selected ?? "");
      expect(day("2026-10-10")).not.toHaveClass(styles.selected ?? "");
    });

    it("draws the strip behind the days between and half behind each end", () => {
      range({ defaultValue: ["2026-10-08", "2026-10-12"] });
      expect(cell("2026-10-08")).toHaveClass(styles.bandStart ?? "");
      expect(cell("2026-10-10")).toHaveClass(styles.band ?? "");
      expect(cell("2026-10-12")).toHaveClass(styles.bandEnd ?? "");
      expect(cell("2026-10-13").className).not.toMatch(/band/);
    });

    it("names the ends of the range", () => {
      range({ defaultValue: ["2026-10-08", "2026-10-12"] });
      expect(day("2026-10-08")).toHaveAccessibleName("Thursday, October 8, 2026, range start");
      expect(day("2026-10-12")).toHaveAccessibleName("Monday, October 12, 2026, range end");
    });

    it("previews the range up to the day the pointer is over, while the end is still to be chosen", async () => {
      range({ defaultValue: ["2026-10-08", ""] });
      await userEvent.hover(day("2026-10-11"));
      expect(cell("2026-10-10")).toHaveClass(styles.band ?? "");
      expect(cell("2026-10-11")).toHaveClass(styles.bandEnd ?? "");
      expect(day("2026-10-11")).toHaveClass(styles.previewEnd ?? "");
      // The preview is not a choice.
      expect(cell("2026-10-11")).toHaveAttribute("aria-selected", "false");
      await userEvent.unhover(day("2026-10-11"));
      expect(cell("2026-10-10").className).not.toMatch(/band/);
    });

    it("previews from the focused day for a keyboard user", () => {
      range({ defaultValue: ["2026-10-08", ""] });
      focusDay("2026-10-10");
      expect(cell("2026-10-09")).toHaveClass(styles.band ?? "");
      expect(cell("2026-10-10")).toHaveClass(styles.bandEnd ?? "");
    });

    it("is controlled by value", async () => {
      const onValueChange = vi.fn();
      range({ value: ["2026-10-08", "2026-10-12"] as CalendarRangeValue, onValueChange });
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).toHaveBeenCalledWith(["2026-10-20", ""]);
      expect(cell("2026-10-10")).toHaveAttribute("aria-selected", "true");
    });

    it("runs across months", async () => {
      const onValueChange = vi.fn();
      render(<Calendar mode="range" defaultMonth="2026-10" today="2026-10-14" onValueChange={onValueChange} />);
      await userEvent.click(day("2026-10-28"));
      await userEvent.click(next());
      await userEvent.click(day("2026-11-03"));
      expect(onValueChange).toHaveBeenLastCalledWith(["2026-10-28", "2026-11-03"]);
      expect(cell("2026-11-01")).toHaveClass(styles.band ?? "");
    });
  });

  describe("moving between months", () => {
    it("steps with the previous and next buttons and reports the new month", async () => {
      const onMonthChange = vi.fn();
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" onMonthChange={onMonthChange} />);
      await userEvent.click(next());
      expect(title()).toBe("November 2026");
      await userEvent.click(previous());
      await userEvent.click(previous());
      expect(title()).toBe("September 2026");
      expect(onMonthChange.mock.calls).toEqual([["2026-11"], ["2026-10"], ["2026-09"]]);
    });

    it("crosses a year", async () => {
      render(<Calendar defaultMonth="2026-12" today="2026-10-14" />);
      await userEvent.click(next());
      expect(title()).toBe("January 2027");
      for (let step = 0; step < 12; step += 1) await userEvent.click(previous());
      expect(title()).toBe("January 2026");
    });

    it("is controlled by month: it changes only when told", async () => {
      const onMonthChange = vi.fn();
      renderCalendar({ onMonthChange });
      await userEvent.click(next());
      expect(onMonthChange).toHaveBeenCalledWith("2026-11");
      expect(title()).toBe("October 2026");
    });

    it("starts on the chosen date's month, else today's", () => {
      render(<Calendar defaultValue="2027-03-09" today="2026-10-14" />);
      expect(title()).toBe("March 2027");
      render(<Calendar today="2026-10-14" />);
      expect(screen.getAllByRole("grid")[1]).toHaveAccessibleName("October 2026");
    });

    it("makes the previous button unavailable at the month holding min, and the next at max's, but keeps focus on it", async () => {
      renderCalendar({ min: "2026-10-03", max: "2026-10-28" });
      expect(previous()).toHaveAttribute("aria-disabled", "true");
      expect(next()).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(previous());
      expect(title()).toBe("October 2026");
      act(() => previous().focus());
      expect(previous()).toHaveFocus();
    });

    it("leaves the next button available while there are later months before max", () => {
      renderCalendar({ max: "2027-01-10" });
      expect(next()).not.toHaveAttribute("aria-disabled");
    });

    it("announces the new month, but not the first one", () => {
      vi.useFakeTimers();
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" />);
      const status = screen.getByRole("status");
      // The announcement goes in a moment after it is asked for, so look just after that moment.
      act(() => vi.advanceTimersByTime(150));
      expect(status).toHaveTextContent("");
      fireEvent.click(next());
      act(() => vi.advanceTimersByTime(150));
      expect(status).toHaveTextContent("November 2026");
      act(() => vi.advanceTimersByTime(1200));
      expect(status).toHaveTextContent("");
    });

    it("stays quiet with announce={false}", () => {
      vi.useFakeTimers();
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" announce={false} />);
      fireEvent.click(next());
      act(() => vi.advanceTimersByTime(300));
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("warns about a month that is not YYYY-MM", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<Calendar month="2026-13" today="2026-10-14" />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`month` must be a month"));
    });
  });

  describe("keyboard", () => {
    it("is one tab stop on the grid: the chosen date, else today, else the 1st", () => {
      renderCalendar({ defaultValue: "2026-10-06" });
      const stops = [...document.querySelectorAll("button[data-date]")].filter((b) => b.getAttribute("tabindex") === "0");
      expect(stops).toHaveLength(1);
      expect(stops[0]).toHaveAttribute("data-date", "2026-10-06");
    });

    it("lands on today with nothing chosen, and on the 1st in another month", () => {
      renderCalendar();
      expect(day("2026-10-14")).toHaveAttribute("tabindex", "0");
      render(<Calendar month="2027-01" today="2026-10-14" />);
      expect(screen.getAllByRole("grid")[1]?.querySelector("button[tabindex='0']")).toHaveAttribute("data-date", "2027-01-01");
    });

    it("goes previous month, next month, then the grid when tabbing, and out", async () => {
      renderCalendar({ defaultValue: "2026-10-06" });
      await userEvent.tab();
      expect(previous()).toHaveFocus();
      await userEvent.tab();
      expect(next()).toHaveFocus();
      await userEvent.tab();
      expect(day("2026-10-06")).toHaveFocus();
      await userEvent.tab();
      expect(document.body).toHaveFocus();
    });

    it("moves by a day with the left and right arrows and by a week with up and down", async () => {
      renderCalendar();
      focusDay("2026-10-14");
      await userEvent.keyboard("{ArrowRight}");
      expect(focused()).toBe("2026-10-15");
      await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(focused()).toBe("2026-10-13");
      await userEvent.keyboard("{ArrowDown}");
      expect(focused()).toBe("2026-10-20");
      await userEvent.keyboard("{ArrowUp}{ArrowUp}");
      expect(focused()).toBe("2026-10-06");
    });

    it("keeps one tab stop on the date focus moved to", async () => {
      renderCalendar();
      focusDay("2026-10-14");
      await userEvent.keyboard("{ArrowDown}");
      expect(day("2026-10-21")).toHaveAttribute("tabindex", "0");
      expect(day("2026-10-14")).toHaveAttribute("tabindex", "-1");
    });

    it("moves to the ends of the week with Home and End, by where the week starts", async () => {
      renderCalendar();
      focusDay("2026-10-14");
      await userEvent.keyboard("{Home}");
      expect(focused()).toBe("2026-10-11");
      await userEvent.keyboard("{End}");
      expect(focused()).toBe("2026-10-17");
    });

    it("finds the ends of a week that starts on Monday", async () => {
      renderCalendar({ weekStartsOn: 1 });
      focusDay("2026-10-14");
      await userEvent.keyboard("{Home}");
      expect(focused()).toBe("2026-10-12");
      await userEvent.keyboard("{End}");
      expect(focused()).toBe("2026-10-18");
    });

    it("changes month with Page Up and Page Down, keeping the day, and a year with Shift", async () => {
      const onMonthChange = vi.fn();
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" onMonthChange={onMonthChange} />);
      focusDay("2026-10-14");
      await userEvent.keyboard("{PageDown}");
      expect(title()).toBe("November 2026");
      expect(focused()).toBe("2026-11-14");
      await userEvent.keyboard("{PageUp}{PageUp}");
      expect(focused()).toBe("2026-09-14");
      await userEvent.keyboard("{Shift>}{PageDown}{/Shift}");
      expect(title()).toBe("September 2027");
      expect(focused()).toBe("2027-09-14");
      expect(onMonthChange).toHaveBeenLastCalledWith("2027-09");
    });

    it("falls back to a month's last day when it has no such day", async () => {
      render(<Calendar defaultMonth="2026-01" today="2026-01-31" />);
      focusDay("2026-01-31");
      await userEvent.keyboard("{PageDown}");
      expect(focused()).toBe("2026-02-28");
    });

    it("carries focus into the next month when an arrow runs off the end, and shows it", async () => {
      render(<Calendar defaultMonth="2026-10" today="2026-10-14" />);
      focusDay("2026-10-31");
      await userEvent.keyboard("{ArrowRight}");
      expect(title()).toBe("November 2026");
      expect(focused()).toBe("2026-11-01");
      await userEvent.keyboard("{ArrowLeft}");
      expect(title()).toBe("October 2026");
      expect(focused()).toBe("2026-10-31");
    });

    it("never moves focus before min or after max", async () => {
      renderCalendar({ min: "2026-10-10", max: "2026-10-20" });
      focusDay("2026-10-11");
      await userEvent.keyboard("{ArrowUp}");
      expect(focused()).toBe("2026-10-10");
      await userEvent.keyboard("{PageUp}");
      expect(focused()).toBe("2026-10-10");
      focusDay("2026-10-19");
      await userEvent.keyboard("{ArrowDown}");
      expect(focused()).toBe("2026-10-20");
      expect(title()).toBe("October 2026");
    });

    it("swaps the left and right arrows under right-to-left, so they follow the picture", async () => {
      renderCalendar({ dir: "rtl" });
      focusDay("2026-10-14");
      await userEvent.keyboard("{ArrowLeft}");
      expect(focused()).toBe("2026-10-15");
      await userEvent.keyboard("{ArrowRight}{ArrowRight}");
      expect(focused()).toBe("2026-10-13");
      // Up and down are the same.
      await userEvent.keyboard("{ArrowDown}");
      expect(focused()).toBe("2026-10-20");
    });

    it("leaves keys it does not own alone", async () => {
      renderCalendar();
      focusDay("2026-10-14");
      await userEvent.keyboard("a");
      await userEvent.keyboard("{Control>}{ArrowRight}{/Control}");
      await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
      expect(focused()).toBe("2026-10-14");
    });

    it("focuses the date Tab would land on when autoFocus is set", () => {
      renderCalendar({ autoFocus: true, defaultValue: "2026-10-06" });
      expect(day("2026-10-06")).toHaveFocus();
    });
  });

  describe("today", () => {
    it("marks today with aria-current and names it", () => {
      renderCalendar();
      expect(day("2026-10-14")).toHaveAttribute("aria-current", "date");
      expect(day("2026-10-14")).toHaveAccessibleName("Wednesday, October 14, 2026, today");
      expect(day("2026-10-15")).not.toHaveAttribute("aria-current");
    });

    it("marks nothing when today is in another month", () => {
      renderCalendar({ today: "2026-12-25" });
      expect(document.querySelector("[aria-current]")).toBeNull();
    });

    it("reads the clock in the browser when today is not given", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 9, 14, 12));
      render(<Calendar month="2026-10" />);
      expect(day("2026-10-14")).toHaveAttribute("aria-current", "date");
    });

    it("renders on the server with no today and no clock reading", () => {
      const html = renderToString(<Calendar defaultMonth="2026-10" />);
      expect(html).toContain("October 2026");
      expect(html).not.toContain("aria-current");
    });
  });

  describe("rounded", () => {
    it("is square-cornered by default, and rounds the days and both month buttons with rounded", () => {
      const { rerender } = renderCalendar();
      expect(screen.getByTestId("calendar")).not.toHaveClass(styles.rounded ?? "");
      expect(previous()).not.toHaveClass(buttonStyles.rounded ?? "");
      rerender(<Calendar month="2026-10" today="2026-10-14" rounded data-testid="calendar" />);
      expect(screen.getByTestId("calendar")).toHaveClass(styles.rounded ?? "");
      expect(previous()).toHaveClass(buttonStyles.rounded ?? "");
      expect(next()).toHaveClass(buttonStyles.rounded ?? "");
    });
  });

  describe("key", () => {
    const key = () => screen.queryByRole("list", { name: "Key" });
    const entries = () => within(key() as HTMLElement).queryAllByRole("listitem").map((item) => item.textContent);

    it("is not shown unless asked for", () => {
      renderCalendar();
      expect(key()).toBeNull();
    });

    it("explains only the looks that are on screen: today, and the chosen date once there is one", () => {
      const { rerender } = renderCalendar({ showLegend: true });
      expect(entries()).toEqual(["Today"]);
      rerender(<Calendar key="chosen" month="2026-10" today="2026-10-14" showLegend defaultValue="2026-10-06" />);
      expect(entries()).toEqual(["Today", "Selected"]);
    });

    it("follows the choice: a date chosen adds its entry, and a controlled value cleared takes it away", async () => {
      renderCalendar({ showLegend: true });
      expect(entries()).toEqual(["Today"]);
      await userEvent.click(day("2026-10-20"));
      expect(entries()).toEqual(["Today", "Selected"]);
      const { unmount } = render(<Calendar month="2026-10" today="2026-10-14" showLegend value="" aria-label="b" />);
      expect(within(screen.getAllByRole("list", { name: "Key" })[1] as HTMLElement).queryAllByRole("listitem")).toHaveLength(1);
      unmount();
    });

    it("adds the range once a range is started, and the unavailable look when anything can be unavailable", () => {
      const { rerender } = renderCalendar({ showLegend: true, mode: "range" } as Partial<CalendarProps>);
      expect(entries()).toEqual(["Today"]);
      rerender(<Calendar key="started" month="2026-10" today="2026-10-14" showLegend mode="range" defaultValue={["2026-10-06", ""]} />);
      expect(entries()).toEqual(["Today", "Selected", "In range"]);
      rerender(<Calendar month="2026-10" today="2026-10-14" showLegend min="2026-10-02" />);
      expect(entries()).toEqual(["Today", "Unavailable"]);
      rerender(<Calendar month="2026-10" today="2026-10-14" showLegend isDateDisabled={() => false} />);
      expect(entries()).toContain("Unavailable");
      rerender(<Calendar month="2026-10" today="2026-10-14" showLegend disabled />);
      expect(entries()).toContain("Unavailable");
      rerender(<Calendar month="2026-10" today="2026-10-14" showLegend max="2026-10-30" />);
      expect(entries()).toContain("Unavailable");
    });

    it("leaves today out until the clock is known, so a server render has no entry for it", () => {
      const html = renderToString(<Calendar defaultMonth="2026-10" showLegend defaultValue="2026-10-06" />);
      expect(html).toContain("Selected");
      expect(html).not.toContain("Today");
    });

    it("is a real list in Safari too, and its samples are plain shapes hidden from assistive technology", () => {
      renderCalendar({ showLegend: true, defaultValue: "2026-10-06" });
      expect(key()).toHaveAttribute("role", "list");
      for (const item of within(key() as HTMLElement).getAllByRole("listitem")) {
        expect(item).toHaveAttribute("role", "listitem");
        const sample = item.querySelector("[aria-hidden='true']");
        expect(sample).toBeInTheDocument();
        expect(sample?.textContent).toBe("");
      }
    });

    it("sits below the grid", () => {
      renderCalendar({ showLegend: true });
      const grid = screen.getByRole("grid");
      expect(grid.compareDocumentPosition(key() as HTMLElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("uses the labels it is given, and keeps English for those left undefined", () => {
      renderCalendar({
        showLegend: true,
        defaultValue: "2026-10-06",
        labels: { legend: "Leyenda", legendToday: "Hoy", legendSelected: undefined },
      });
      const list = screen.getByRole("list", { name: "Leyenda" });
      expect(within(list).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Hoy", "Selected"]);
    });

    it("has no axe violations", async () => {
      const { container } = renderCalendar({
        showLegend: true,
        mode: "range",
        defaultValue: ["2026-10-06", "2026-10-09"],
        disabled: true,
      } as Partial<CalendarProps>);
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("text and numbers", () => {
    it("uses the labels it is given for names, months and weekdays, keeping English for the rest", () => {
      renderCalendar({
        labels: {
          calendar: "Calendario",
          previousMonth: "Mes anterior",
          months: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
          weekdays: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
          weekdaysShort: ["do", "lu", "ma", "mi", "ju", "vi", "sá"],
        },
      });
      expect(screen.getByRole("group", { name: "Calendario" })).toBeInTheDocument();
      expect(screen.getByRole("grid", { name: "octubre 2026" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Mes anterior" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Next month" })).toBeInTheDocument();
      expect(day("2026-10-05")).toHaveAccessibleName("lunes, octubre 5, 2026");
    });

    it("lets a label function replace the heading and the day name", () => {
      renderCalendar({
        labels: {
          monthYear: (year, month) => `${year}/${month}`,
          day: ({ year, month, day: dayOfMonth }) => `${dayOfMonth}.${month}.${year}`,
        },
      });
      expect(title()).toBe("2026/10");
      expect(day("2026-10-05")).toHaveAccessibleName("5.10.2026");
    });

    it("keeps the default for a label whose override is undefined", () => {
      renderCalendar({ labels: { calendar: undefined, previousMonth: undefined, monthYear: undefined, day: undefined } });
      expect(screen.getByRole("group", { name: "Calendar" })).toBeInTheDocument();
      expect(previous()).toBeInTheDocument();
      expect(title()).toBe("October 2026");
      expect(day("2026-10-05")).toHaveAccessibleName("Monday, October 5, 2026");
    });

    it("uses English names for a list of the wrong length, and warns", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderCalendar({ labels: { months: ["one"] } });
      expect(title()).toBe("October 2026");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`labels.months` needs 12 entries"));
    });

    it("writes days and years with formatNumber, in the visible text and the names alike", () => {
      const arabic = new Intl.NumberFormat("ar-EG").format;
      renderCalendar({ formatNumber: arabic });
      expect(day("2026-10-05").textContent).toBe(arabic(5));
      expect(title()).toBe(`October ${arabic(2026)}`);
      expect(day("2026-10-05").getAttribute("aria-label")).toContain(arabic(5));
    });
  });

  describe("direction", () => {
    it("sets the direction on the root and swaps the month buttons' arrows", () => {
      const { rerender } = renderCalendar();
      expect(screen.getByTestId("calendar")).toHaveAttribute("dir", "ltr");
      const leftward = previous().innerHTML;
      rerender(<Calendar month="2026-10" today="2026-10-14" dir="rtl" data-testid="calendar" />);
      expect(screen.getByTestId("calendar")).toHaveAttribute("dir", "rtl");
      expect(previous().innerHTML).not.toBe(leftward);
    });
  });

  describe("robustness", () => {
    it("works inside StrictMode", async () => {
      const onValueChange = vi.fn();
      render(
        <StrictMode>
          {/* eslint-disable-next-line jsx-a11y/no-autofocus -- exercising the component's own opt-in prop */}
          <Calendar month="2026-10" today="2026-10-14" onValueChange={onValueChange} autoFocus />
        </StrictMode>,
      );
      expect(day("2026-10-14")).toHaveFocus();
      await userEvent.click(day("2026-10-20"));
      expect(onValueChange).toHaveBeenCalledOnce();
    });

    it("stays within the calendar's years", async () => {
      render(<Calendar defaultMonth="9999-12" today="9999-12-31" />);
      focusDay("9999-12-31");
      await userEvent.keyboard("{ArrowRight}");
      expect(focused()).toBe("9999-12-31");
      expect(next()).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(next());
      expect(title()).toBe("December 9999");
    });

    it("has nothing before January of year 1", async () => {
      render(<Calendar defaultMonth="0001-01" today="0001-01-01" />);
      expect(title()).toBe("January 1");
      expect(previous()).toHaveAttribute("aria-disabled", "true");
      await userEvent.click(previous());
      expect(title()).toBe("January 1");
      await userEvent.click(next());
      expect(title()).toBe("February 1");
      expect(previous()).not.toHaveAttribute("aria-disabled");
    });

    it("uses Sunday for a week start that is not a day", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      renderCalendar({ weekStartsOn: 9 as 0 });
      expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName("Sunday");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`weekStartsOn` must be"));
    });
  });

  describe("accessibility", () => {
    it("has no axe violations as a single-date calendar", async () => {
      const { container } = renderCalendar({ defaultValue: "2026-10-06" });
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations as a range, with unavailable days, in right-to-left and disabled", async () => {
      const { container, rerender } = renderCalendar({
        mode: "range",
        defaultValue: ["2026-10-08", "2026-10-12"],
        isDateDisabled: (date) => date.endsWith("-20"),
      });
      expect(await axe(container)).toHaveNoViolations();
      rerender(<Calendar month="2026-10" today="2026-10-14" dir="rtl" />);
      expect(await axe(container)).toHaveNoViolations();
      rerender(<Calendar month="2026-10" today="2026-10-14" disabled />);
      expect(await axe(container)).toHaveNoViolations();
      rerender(<Calendar month="2026-10" today="2026-10-14" readOnly showOutsideDays={false} />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
