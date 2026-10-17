import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FieldLabel } from "../../atoms/FieldLabel";
import { FormField } from "../../molecules/FormField";
import { DatePicker } from "./DatePicker";

const segment = (name: string) => screen.getByRole("spinbutton", { name }) as HTMLInputElement;
const texts = () => screen.getAllByRole("spinbutton").map((input) => (input as HTMLInputElement).value);
const day = (date: string) => document.querySelector<HTMLButtonElement>(`button[data-date="${date}"]`) as HTMLButtonElement;

afterEach(() => vi.restoreAllMocks());

describe("DatePicker segments", () => {
  it("is a named group of a month, a day and a year segment by default", () => {
    render(<DatePicker aria-label="Start date" />);
    const group = screen.getByRole("group", { name: "Start date" });
    expect(within(group).getAllByRole("spinbutton").map((input) => input.getAttribute("aria-label"))).toEqual(["Month", "Day", "Year"]);
  });

  it.each([
    ["dmy", ["Day", "Month", "Year"]],
    ["mdy", ["Month", "Day", "Year"]],
    ["ymd", ["Year", "Month", "Day"]],
  ] as const)("writes the %s format in its own order", (format, names) => {
    render(<DatePicker aria-label="d" format={format} />);
    expect(screen.getAllByRole("spinbutton").map((input) => input.getAttribute("aria-label"))).toEqual(names);
  });

  it("draws the separator between segments, and takes another one", () => {
    const { container, rerender } = render(<DatePicker aria-label="d" />);
    expect([...container.querySelectorAll("span[aria-hidden]")].map((node) => node.textContent)).toEqual(["/", "/"]);
    rerender(<DatePicker aria-label="d" separator="." />);
    expect([...container.querySelectorAll("span[aria-hidden]")].map((node) => node.textContent)).toEqual([".", "."]);
  });

  it("shows an empty field as placeholders, announced as empty", () => {
    render(<DatePicker aria-label="d" />);
    expect(texts()).toEqual(["", "", ""]);
    expect(segment("Month")).toHaveAttribute("placeholder", "––");
    expect(segment("Year")).toHaveAttribute("placeholder", "––––");
    expect(segment("Day")).toHaveAttribute("aria-valuetext", "Empty");
    expect(segment("Day")).not.toHaveAttribute("aria-valuenow");
  });

  it("shows a date padded to each segment's width", () => {
    render(<DatePicker aria-label="d" defaultValue="0026-03-05" />);
    expect(texts()).toEqual(["03", "05", "0026"]);
    expect(segment("Year")).toHaveAttribute("aria-valuenow", "26");
  });

  it("gives each segment its range for assistive technology, the day's following its month", () => {
    render(<DatePicker aria-label="d" defaultValue="2026-02-10" />);
    expect(segment("Month")).toHaveAttribute("aria-valuemax", "12");
    expect(segment("Day")).toHaveAttribute("aria-valuemax", "28");
    expect(segment("Year")).toHaveAttribute("aria-valuemax", "9999");
  });

  it("puts the id on the first segment, and the other aria on the group", () => {
    render(<DatePicker aria-label="d" id="when" aria-describedby="help" />);
    expect(segment("Month")).toHaveAttribute("id", "when");
    expect(screen.getByRole("group")).toHaveAttribute("aria-describedby", "help");
  });

  it("warns once when it has no accessible name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<DatePicker />);
    expect(warn.mock.calls.filter(([message]) => String(message).includes("no accessible name"))).toHaveLength(1);
  });
});

describe("DatePicker typing", () => {
  it("types a date into the segments, moving on as each is complete", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="d" onValueChange={onValueChange} />);
    await userEvent.click(segment("Month"));
    await userEvent.keyboard("10032026");
    expect(texts()).toEqual(["10", "03", "2026"]);
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-03");
  });

  it("takes a digit that cannot start a two-digit number as the whole number", async () => {
    render(<DatePicker aria-label="d" />);
    await userEvent.click(segment("Month"));
    await userEvent.keyboard("4");
    expect(texts()).toEqual(["04", "", ""]);
    expect(segment("Day")).toHaveFocus();
  });

  it("waits for a second digit that could follow, and carries one that cannot", async () => {
    render(<DatePicker aria-label="d" />);
    await userEvent.click(segment("Month"));
    await userEvent.keyboard("1");
    expect(segment("Month")).toHaveFocus();
    expect(segment("Month").value).toBe("1");
    await userEvent.keyboard("3");
    // 13 is no month: the month is 1, and the 3 begins the day.
    expect(texts()).toEqual(["01", "3", ""]);
    expect(segment("Day")).toHaveFocus();
    // The carried 3 is a digit waiting for a second: a 1 completes the 31st.
    await userEvent.keyboard("1");
    expect(texts()).toEqual(["01", "31", ""]);
    expect(segment("Year")).toHaveFocus();
  });

  it("reads digits of another script", async () => {
    render(<DatePicker aria-label="d" format="dmy" />);
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("٠٣");
    expect(segment("Day").value).toBe("03");
  });

  it("types a four-digit year one digit at a time, showing the digits so far", async () => {
    render(<DatePicker aria-label="d" format="ymd" />);
    await userEvent.click(segment("Year"));
    await userEvent.keyboard("20");
    expect(segment("Year").value).toBe("20");
    expect(segment("Year")).toHaveFocus();
    await userEvent.keyboard("26");
    expect(segment("Year").value).toBe("2026");
    expect(segment("Month")).toHaveFocus();
  });

  it("pads a short year once focus leaves it", async () => {
    render(<DatePicker aria-label="d" defaultValue="2026-10-03" />);
    await userEvent.click(segment("Year"));
    await userEvent.keyboard("5");
    expect(segment("Year").value).toBe("5");
    await userEvent.tab();
    expect(segment("Year").value).toBe("0005");
  });

  it("ignores letters", async () => {
    render(<DatePicker aria-label="d" />);
    await userEvent.click(segment("Month"));
    await userEvent.keyboard("ab");
    expect(texts()).toEqual(["", "", ""]);
  });

  it("finishes a segment on a separator key, and moves on", async () => {
    render(<DatePicker aria-label="d" separator="." />);
    await userEvent.click(segment("Month"));
    await userEvent.keyboard("1.");
    expect(segment("Month").value).toBe("01");
    expect(segment("Day")).toHaveFocus();
    await userEvent.keyboard("/");
    expect(segment("Year")).toHaveFocus();
  });

  it("clears a segment with Backspace and reports no date", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="d" defaultValue="2026-10-03" onValueChange={onValueChange} />);
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("{Backspace}");
    expect(segment("Day").value).toBe("");
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });

  it("moves between segments with the arrow keys", async () => {
    render(<DatePicker aria-label="d" />);
    await userEvent.click(segment("Month"));
    await userEvent.keyboard("{ArrowRight}");
    expect(segment("Day")).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}{ArrowLeft}");
    expect(segment("Year")).not.toHaveFocus();
    expect(segment("Day")).toHaveFocus();
  });

  it("keeps each segment as a tab stop", async () => {
    render(<DatePicker aria-label="d" />);
    await userEvent.tab();
    expect(segment("Month")).toHaveFocus();
    await userEvent.tab();
    expect(segment("Day")).toHaveFocus();
    await userEvent.tab();
    expect(segment("Year")).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Choose date" })).toHaveFocus();
  });

  it("steps a segment with the arrow keys, wrapping the day within its month", async () => {
    render(<DatePicker aria-label="d" defaultValue="2026-02-28" />);
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("{ArrowUp}");
    expect(segment("Day").value).toBe("01");
    await userEvent.keyboard("{ArrowDown}");
    expect(segment("Day").value).toBe("28");
    await userEvent.click(segment("Month"));
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(segment("Month").value).toBe("12");
  });

  it("starts an empty year at the year given as today, and steps it", async () => {
    render(<DatePicker aria-label="d" today="2030-06-01" />);
    await userEvent.click(segment("Year"));
    await userEvent.keyboard("{ArrowUp}");
    expect(segment("Year").value).toBe("2030");
    await userEvent.keyboard("{ArrowUp}");
    expect(segment("Year").value).toBe("2031");
  });

  it("jumps to the ends with Home and End", async () => {
    render(<DatePicker aria-label="d" defaultValue="2026-02-10" />);
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("{End}");
    expect(segment("Day").value).toBe("28");
    await userEvent.keyboard("{Home}");
    expect(segment("Day").value).toBe("01");
  });

  it("handles a keyboard that does not report keys, through the text it inserted", () => {
    render(<DatePicker aria-label="d" />);
    const month = segment("Month");
    month.focus();
    // What a phone's keyboard does: no usable key events, one `input` event carrying the text.
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    act(() => {
      setValue?.call(month, "7");
      month.dispatchEvent(new InputEvent("input", { data: "7", bubbles: true }));
    });
    expect(texts()).toEqual(["07", "", ""]);
    expect(segment("Day")).toHaveFocus();
  });

  it("takes several characters inserted at once, each going where the one before it left off", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="d" onValueChange={onValueChange} />);
    await userEvent.click(segment("Month"));
    await userEvent.paste("03102026");
    expect(texts()).toEqual(["03", "10", "2026"]);
    expect(onValueChange).toHaveBeenLastCalledWith("2026-03-10");
  });

  it("reads a pasted date with separators", async () => {
    render(<DatePicker aria-label="d" format="dmy" />);
    await userEvent.click(segment("Day"));
    await userEvent.paste("5/3/2026");
    expect(texts()).toEqual(["05", "03", "2026"]);
  });

  it("selects a segment's text when it takes focus", async () => {
    render(<DatePicker aria-label="d" defaultValue="2026-10-03" />);
    await userEvent.click(segment("Month"));
    expect(segment("Month").selectionStart).toBe(0);
    expect(segment("Month").selectionEnd).toBe(2);
  });
});

describe("DatePicker value", () => {
  it("is controlled by value, and an owner that ignores a change keeps the old date", async () => {
    render(<DatePicker aria-label="d" value="2026-10-03" onValueChange={() => {}} />);
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("{ArrowUp}");
    expect(segment("Day").value).toBe("03");
  });

  it("follows a value set from outside, including to empty", () => {
    const { rerender } = render(<DatePicker aria-label="d" value="2026-10-03" onValueChange={() => {}} />);
    expect(texts()).toEqual(["10", "03", "2026"]);
    rerender(<DatePicker aria-label="d" value="2027-01-15" onValueChange={() => {}} />);
    expect(texts()).toEqual(["01", "15", "2027"]);
    rerender(<DatePicker aria-label="d" value="" onValueChange={() => {}} />);
    expect(texts()).toEqual(["", "", ""]);
  });

  it("reads a value that is not a date as empty", () => {
    render(<DatePicker aria-label="d" defaultValue="2026-02-30" />);
    expect(texts()).toEqual(["", "", ""]);
    render(<DatePicker aria-label="d2" defaultValue={42 as unknown as string} />);
  });

  it("keeps a half-typed date while the controlled value stays empty", async () => {
    function Controlled() {
      const [value, setValue] = useState("");
      return <DatePicker aria-label="d" value={value} onValueChange={setValue} />;
    }
    render(<Controlled />);
    await userEvent.click(segment("Month"));
    await userEvent.keyboard("10");
    expect(texts()).toEqual(["10", "", ""]);
  });

  it("submits the date under name, and an empty one while incomplete", async () => {
    render(
      <form data-testid="form">
        <DatePicker aria-label="d" name="when" defaultValue="2026-10-03" />
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("when")).toBe("2026-10-03");
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("{Backspace}");
    expect(new FormData(form).get("when")).toBe("");
  });

  it("writes digits through formatNumber, on screen and to a screen reader", () => {
    const arabic = (n: number) => String.fromCodePoint(0x660 + n);
    render(<DatePicker aria-label="d" defaultValue="2026-10-03" formatNumber={arabic} />);
    expect(texts()).toEqual(["١٠", "٠٣", "٢٠٢٦"]);
    expect(segment("Day")).toHaveAttribute("aria-valuetext", "٠٣");
  });

  it("translates every word, and keeps the default for a label left undefined", () => {
    render(<DatePicker aria-label="d" labels={{ day: "Jour", month: undefined, openPicker: "Ouvrir" }} />);
    expect(segment("Jour")).toBeInTheDocument();
    expect(segment("Month")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ouvrir" })).toBeInTheDocument();
  });
});

describe("DatePicker validity", () => {
  it("flags a date outside min and max, and reports it anyway", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="d" min="2026-01-01" max="2026-12-31" onValueChange={onValueChange} />);
    await userEvent.click(segment("Month"));
    await userEvent.keyboard("01012027");
    expect(segment("Year")).toHaveAttribute("aria-invalid", "true");
    expect(onValueChange).toHaveBeenLastCalledWith("2027-01-01");
  });

  it("flags a date that isDateDisabled rules out", () => {
    render(<DatePicker aria-label="d" defaultValue="2026-10-03" isDateDisabled={(date) => date.endsWith("-03")} />);
    expect(segment("Day")).toHaveAttribute("aria-invalid", "true");
  });

  it("flags the 31st of February, and reports no date for it", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="d" defaultValue="2026-02-10" onValueChange={onValueChange} />);
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("31");
    expect(segment("Day")).toHaveAttribute("aria-invalid", "true");
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });

  it("does not flag an incomplete date", async () => {
    render(<DatePicker aria-label="d" />);
    await userEvent.click(segment("Month"));
    await userEvent.keyboard("10");
    expect(segment("Month")).not.toHaveAttribute("aria-invalid");
  });

  it("shows the error state with hasError", () => {
    render(<DatePicker aria-label="d" hasError />);
    expect(segment("Month")).toHaveAttribute("aria-invalid", "true");
  });

  it("warns about a bound it cannot use, and ignores it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<DatePicker aria-label="d" defaultValue="2026-10-03" min="soon" />);
    expect(warn.mock.calls.some(([message]) => String(message).includes('`min` must be "YYYY-MM-DD"'))).toBe(true);
    expect(segment("Month")).not.toHaveAttribute("aria-invalid");
  });
});

describe("DatePicker states", () => {
  it("disabled: nothing takes input, and the buttons are inert", async () => {
    render(<DatePicker aria-label="d" disabled defaultValue="2026-10-03" clearable />);
    expect(segment("Month")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Choose date" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Clear date" })).toBeNull();
  });

  it("read-only: segments can be focused and read but not changed, and the buttons are gone or inert", async () => {
    render(<DatePicker aria-label="d" readOnly defaultValue="2026-10-03" clearable />);
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("{ArrowUp}5");
    expect(segment("Day").value).toBe("03");
    expect(screen.getByRole("button", { name: "Choose date" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Clear date" })).toBeNull();
  });

  it("hides the picker button with showPicker off", () => {
    render(<DatePicker aria-label="d" showPicker={false} />);
    expect(screen.queryByRole("button", { name: "Choose date" })).toBeNull();
  });

  it("focuses the first segment on mount with autoFocus", () => {
    // eslint-disable-next-line jsx-a11y/no-autofocus -- exercising the component's own opt-in prop
    render(<DatePicker aria-label="d" autoFocus format="ymd" />);
    expect(segment("Year")).toHaveFocus();
  });
});

describe("DatePicker clear", () => {
  it("shows only while there is something to clear, empties the field and calls onClear", async () => {
    const onClear = vi.fn();
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="d" onClear={onClear} onValueChange={onValueChange} defaultValue="2026-10-03" />);
    await userEvent.click(screen.getByRole("button", { name: "Clear date" }));
    expect(texts()).toEqual(["", "", ""]);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith("");
    expect(screen.queryByRole("button", { name: "Clear date" })).toBeNull();
    expect(segment("Month")).toHaveFocus();
  });

  it("shows no clear button by default, clearable alone turns it on, and clearable={false} turns it off", () => {
    const { rerender } = render(<DatePicker aria-label="d" defaultValue="2026-10-03" />);
    expect(screen.queryByRole("button", { name: "Clear date" })).toBeNull();
    rerender(<DatePicker aria-label="d" defaultValue="2026-10-03" clearable />);
    expect(screen.getByRole("button", { name: "Clear date" })).toBeInTheDocument();
    rerender(<DatePicker aria-label="d" defaultValue="2026-10-03" onClear={() => {}} clearable={false} />);
    expect(screen.queryByRole("button", { name: "Clear date" })).toBeNull();
  });
});

describe("DatePicker calendar", () => {
  it("opens a dialog with a calendar on the chosen month, and focuses the chosen day", async () => {
    render(<DatePicker aria-label="d" defaultValue="2026-10-15" />);
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    const dialog = await screen.findByRole("dialog", { name: "Choose a date" });
    expect(within(dialog).getByRole("grid")).toBeInTheDocument();
    await waitFor(() => expect(day("2026-10-15")).toHaveFocus());
  });

  it("opens from a segment with Alt+ArrowDown, and a plain ArrowDown steps instead", async () => {
    render(<DatePicker aria-label="d" defaultValue="2026-10-15" />);
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(segment("Day").value).toBe("14");
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("chooses a day, fills the segments, reports it and closes", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="d" defaultValue="2026-10-15" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    await screen.findByRole("dialog");
    await userEvent.click(day("2026-10-20"));
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-20");
    expect(texts()).toEqual(["10", "20", "2026"]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("chooses a day with the keyboard and returns focus to the button on close", async () => {
    render(<DatePicker aria-label="d" defaultValue="2026-10-15" />);
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    await waitFor(() => expect(day("2026-10-15")).toHaveFocus());
    await userEvent.keyboard("{ArrowRight}{Enter}");
    expect(texts()).toEqual(["10", "16", "2026"]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("button", { name: "Choose date" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the button", async () => {
    render(<DatePicker aria-label="d" defaultValue="2026-10-15" />);
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("button", { name: "Choose date" })).toHaveFocus();
  });

  it("disables the days outside min and max, and the ones isDateDisabled rules out", async () => {
    render(
      <DatePicker
        aria-label="d"
        defaultValue="2026-10-15"
        min="2026-10-10"
        max="2026-10-20"
        isDateDisabled={(date) => date === "2026-10-12"}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    await screen.findByRole("dialog");
    const cell = (date: string) => day(date).closest("td");
    expect(cell("2026-10-09")).toHaveAttribute("aria-disabled", "true");
    expect(cell("2026-10-12")).toHaveAttribute("aria-disabled", "true");
    expect(cell("2026-10-21")).toHaveAttribute("aria-disabled", "true");
    expect(cell("2026-10-11")).not.toHaveAttribute("aria-disabled", "true");
  });

  it("starts the week where weekStartsOn says", async () => {
    render(<DatePicker aria-label="d" defaultValue="2026-10-15" weekStartsOn={1} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByRole("columnheader")[0]).toHaveTextContent(/^Mo/);
  });

  it("passes calendarProps to the calendar, and offers a Today button", async () => {
    render(
      <DatePicker
        aria-label="d"
        today="2026-10-05"
        showTodayButton
        calendarProps={{ showWeekNumbers: true, labels: { todayButton: "Jump to today" } }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    await userEvent.click(await screen.findByRole("button", { name: "Jump to today" }));
    expect(texts()).toEqual(["10", "05", "2026"]);
  });

  it("can be controlled, and is hidden for a disabled or read-only field", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<DatePicker aria-label="d" open={false} onOpenChange={onOpenChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<DatePicker aria-label="d" open onOpenChange={onOpenChange} />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    rerender(<DatePicker aria-label="d" open readOnly onOpenChange={onOpenChange} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("starts open with defaultOpen", async () => {
    render(<DatePicker aria-label="d" defaultOpen />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("follows a value set from outside while the calendar is open", async () => {
    const { rerender } = render(<DatePicker aria-label="d" value="2026-10-15" onValueChange={() => {}} defaultOpen />);
    await screen.findByRole("dialog");
    rerender(<DatePicker aria-label="d" value="2026-10-20" onValueChange={() => {}} defaultOpen />);
    expect(day("2026-10-20").closest("td")).toHaveAttribute("aria-selected", "true");
  });
});

describe("DatePicker in a FormField", () => {
  it("is named by the label, and a click on the label focuses the first segment", async () => {
    render(<FormField label="Birthday">{(field) => <DatePicker {...field} />}</FormField>);
    expect(screen.getByRole("group", { name: "Birthday" })).toBeInTheDocument();
    await userEvent.click(screen.getByText("Birthday"));
    expect(segment("Month")).toHaveFocus();
  });

  it("is wired to helper text, and takes the error state and required", () => {
    render(
      <FormField label="Birthday" helperText="Month first" required error="Pick a date">
        {(field) => <DatePicker {...field} />}
      </FormField>,
    );
    const group = screen.getByRole("group", { name: /Birthday/ });
    expect(group.getAttribute("aria-describedby")).toBeTruthy();
    expect(segment("Month")).toHaveAttribute("aria-required", "true");
    expect(segment("Month")).toHaveAttribute("aria-invalid", "true");
  });

  it("works with a plain FieldLabel and htmlFor", async () => {
    render(
      <>
        <FieldLabel htmlFor="plain">When</FieldLabel>
        <DatePicker id="plain" aria-label="When" />
      </>,
    );
    await userEvent.click(screen.getByText("When"));
    expect(segment("Month")).toHaveFocus();
  });
});

describe("DatePicker standard props", () => {
  it("forwards its ref to the group, and takes className, style, data-testid and native attributes", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <DatePicker ref={ref} aria-label="d" className="mine" style={{ marginTop: 3 }} data-testid="field" title="Pick" />,
    );
    const group = screen.getByTestId("field");
    expect(ref.current).toBe(group);
    expect(group).toHaveClass("mine");
    expect(group).toHaveStyle({ marginTop: "3px" });
    expect(group).toHaveAttribute("title", "Pick");
  });

  it("does not let a native prop replace its role", () => {
    render(<DatePicker aria-label="d" {...({ role: "textbox" } as object)} />);
    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it("takes every size", () => {
    for (const size of ["xs", "sm", "md", "lg", "xl"] as const) {
      const { unmount } = render(<DatePicker aria-label="d" size={size} />);
      expect(screen.getByRole("group")).toBeInTheDocument();
      unmount();
    }
  });

  it("sets the direction on the group when given", () => {
    render(<DatePicker aria-label="d" dir="rtl" />);
    expect(screen.getByRole("group")).toHaveAttribute("dir", "rtl");
  });
});

describe("DatePicker robustness", () => {
  it("works inside StrictMode", async () => {
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <DatePicker aria-label="d" onValueChange={onValueChange} />
      </StrictMode>,
    );
    await userEvent.click(segment("Month"));
    await userEvent.keyboard("10032026");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-03");
    expect(onValueChange.mock.calls.filter(([value]) => value === "2026-10-03")).toHaveLength(1);
  });

  it("copes with an undefined labels entry, a wrong format and a non-string value", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<DatePicker aria-label="d" labels={undefined} format={"zzz" as never} value={7 as unknown as string} />);
    expect(texts()).toEqual(["", "", ""]);
  });
});

describe("DatePicker focus and blur", () => {
  it("calls onFocus once on arriving and onBlur once on leaving, not for each part it moves between", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <>
        <button type="button">before</button>
        <DatePicker aria-label="d" onFocus={onFocus} onBlur={onBlur} />
        <button type="button">after</button>
      </>,
    );
    await userEvent.click(screen.getByText("before"));
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(screen.getByText("after")).toHaveFocus();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("counts the calendar as part of the field", async () => {
    const onBlur = vi.fn();
    render(<DatePicker aria-label="d" defaultValue="2026-10-15" onBlur={onBlur} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    await waitFor(() => expect(day("2026-10-15")).toHaveFocus());
    expect(onBlur).not.toHaveBeenCalled();
  });
});

describe("DatePicker commitOn", () => {
  it('reports every change by default, a year passing through the dates between ("change")', async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="d" defaultValue="2026-10-03" onValueChange={onValueChange} />);
    await userEvent.click(segment("Year"));
    await userEvent.keyboard("2027");
    expect(onValueChange.mock.calls.length).toBeGreaterThan(1);
    expect(onValueChange).toHaveBeenLastCalledWith("2027-10-03");
  });

  it('"complete" waits for the year to be finished, then reports once', async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="d" defaultValue="2026-10-03" commitOn="complete" onValueChange={onValueChange} />);
    await userEvent.click(segment("Year"));
    await userEvent.keyboard("202");
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.keyboard("7");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("2027-10-03");
  });

  it('"blur" reports nothing while typing, then once when focus leaves', async () => {
    const onValueChange = vi.fn();
    render(
      <>
        <DatePicker aria-label="d" defaultValue="2026-10-03" commitOn="blur" onValueChange={onValueChange} />
        <button type="button">after</button>
      </>,
    );
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByText("after"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("2026-10-05");
  });

  it('"blur" also reports on Enter, and the clear button is never held', async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="d" defaultValue="2026-10-03" commitOn="blur" clearable onValueChange={onValueChange} />);
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("{ArrowUp}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-04");
    await userEvent.click(screen.getByRole("button", { name: "Clear date" }));
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });

  it("does not report a day chosen in the calendar late, even when held", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="d" defaultValue="2026-10-15" commitOn="blur" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    await screen.findByRole("dialog");
    await userEvent.click(day("2026-10-20"));
    expect(onValueChange).toHaveBeenCalledWith("2026-10-20");
  });

  it("does not lose a half-filled field when the owner echoes back the empty value it was told", async () => {
    function Echo() {
      const [value, setValue] = useState("2026-10-03");
      return <DatePicker aria-label="d" value={value} onValueChange={setValue} />;
    }
    render(<Echo />);
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("{Backspace}");
    expect(texts()).toEqual(["10", "", "2026"]);
  });
});

describe("DatePicker form validation", () => {
  const input = (container: HTMLElement) => container.querySelector('input[type="date"]') as HTMLInputElement;

  it("won't submit an empty required field, with the browser's own missing-value state", () => {
    const { container } = render(
      <form>
        <DatePicker aria-label="d" name="when" required />
      </form>,
    );
    expect(input(container).validity.valueMissing).toBe(true);
  });

  it("submits once a required field is filled in", async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const { container } = render(
      <form onSubmit={onSubmit}>
        <DatePicker aria-label="d" name="when" required />
        <button type="submit">Save</button>
      </form>,
    );
    await userEvent.click(screen.getByText("Save"));
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.click(segment("Month"));
    await userEvent.keyboard("10032026");
    expect(input(container).checkValidity()).toBe(true);
    await userEvent.click(screen.getByText("Save"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("doesn't block an empty field that isn't required", () => {
    const { container } = render(
      <form>
        <DatePicker aria-label="d" name="when" />
      </form>,
    );
    expect(input(container).checkValidity()).toBe(true);
  });

  it("refuses a half-filled field with the incomplete message", async () => {
    const { container } = render(
      <form>
        <DatePicker aria-label="d" name="when" />
      </form>,
    );
    await userEvent.click(segment("Month"));
    await userEvent.keyboard("10");
    expect(input(container).validationMessage).toBe("Enter a complete date");
  });

  it("refuses an impossible date, and one outside min or ruled out, with their own messages", async () => {
    const { container } = render(
      <form>
        <DatePicker aria-label="d" name="when" defaultValue="2026-02-10" min="2026-02-05" />
      </form>,
    );
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("31");
    expect(input(container).validationMessage).toBe("This date doesn't exist");
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("{Backspace}2");
    expect(input(container).validationMessage).toBe("This date isn't available");
  });

  it("sends focus to the first empty segment when the browser focuses the invalid input", async () => {
    const { container } = render(
      <form>
        <DatePicker aria-label="d" name="when" required defaultValue="2026-10-03" />
      </form>,
    );
    await userEvent.click(segment("Day"));
    await userEvent.keyboard("{Backspace}");
    act(() => input(container).focus());
    expect(segment("Day")).toHaveFocus();
  });
});

describe("DatePicker accessibility", () => {
  it("has no violations closed or open", async () => {
    const { container } = render(<DatePicker aria-label="d" defaultValue="2026-10-03" clearable />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no violations with the calendar open", async () => {
    render(<DatePicker aria-label="d" defaultValue="2026-10-03" />);
    await userEvent.click(screen.getByRole("button", { name: "Choose date" }));
    await screen.findByRole("dialog");
    // The page-level "content in landmarks" rule is about whole pages, not a field.
    expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });
});
