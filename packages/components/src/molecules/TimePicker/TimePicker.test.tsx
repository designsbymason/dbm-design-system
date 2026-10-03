import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FieldLabel } from "../../atoms/FieldLabel";
import { FormField } from "../FormField";
import { TimePicker } from "./TimePicker";
import styles from "./TimePicker.module.css";

const segment = (name: string) => screen.getByRole("spinbutton", { name });
const texts = () => screen.getAllByRole("spinbutton").map((input) => (input as HTMLInputElement).value);
const scanBody = () => axe(document.body, { rules: { region: { enabled: false } } });

afterEach(() => vi.restoreAllMocks());

describe("TimePicker segments", () => {
  it("is a named group of an hour, a minute and an AM/PM segment by default", () => {
    render(<TimePicker aria-label="Start time" />);
    const group = screen.getByRole("group", { name: "Start time" });
    expect(within(group).getAllByRole("spinbutton").map((input) => input.getAttribute("aria-label"))).toEqual([
      "Hour",
      "Minute",
      "AM/PM",
    ]);
  });

  it("has no AM/PM in the 24-hour cycle, and a seconds segment with showSeconds", () => {
    const { rerender } = render(<TimePicker aria-label="t" hourCycle="24" />);
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
    rerender(<TimePicker aria-label="t" hourCycle="24" showSeconds />);
    expect(screen.getAllByRole("spinbutton").map((input) => input.getAttribute("aria-label"))).toEqual(["Hour", "Minute", "Second"]);
    rerender(<TimePicker aria-label="t" showSeconds />);
    expect(screen.getAllByRole("spinbutton")).toHaveLength(4);
  });

  it("shows an empty field as placeholders for the numbers and AM for the period, announced as empty", () => {
    render(<TimePicker aria-label="t" />);
    expect(texts()).toEqual(["", "", "AM"]);
    expect(segment("Hour")).toHaveAttribute("placeholder", "––");
    expect(segment("Hour")).toHaveAttribute("aria-valuetext", "Empty");
    expect(segment("Hour")).not.toHaveAttribute("aria-valuenow");
  });

  it.each([
    ["00:00", ["12", "00", "AM"]],
    ["09:05", ["09", "05", "AM"]],
    ["12:00", ["12", "00", "PM"]],
    ["15:45", ["03", "45", "PM"]],
    ["23:59", ["11", "59", "PM"]],
  ])("shows %s in the 12-hour cycle as %j", (value, expected) => {
    render(<TimePicker aria-label="t" defaultValue={value} />);
    expect(texts()).toEqual(expected);
  });

  it("shows the 24-hour hour, and the seconds, when asked", () => {
    render(<TimePicker aria-label="t" defaultValue="15:45:09" hourCycle="24" showSeconds />);
    expect(texts()).toEqual(["15", "45", "09"]);
    expect(segment("Second")).toHaveAttribute("aria-valuenow", "9");
  });

  it("gives each segment its range for assistive technology", () => {
    render(<TimePicker aria-label="t" defaultValue="15:45" step={15} />);
    expect(segment("Hour")).toHaveAttribute("aria-valuemin", "1");
    expect(segment("Hour")).toHaveAttribute("aria-valuemax", "12");
    expect(segment("Hour")).toHaveAttribute("aria-valuenow", "3");
    expect(segment("Minute")).toHaveAttribute("aria-valuemax", "45");
    expect(segment("AM/PM")).toHaveAttribute("aria-valuetext", "PM");
  });

  it("puts the id on the first segment, and the other aria on the group", () => {
    render(<TimePicker id="t" aria-labelledby="l" aria-describedby="d" required hasError disabled={false} />);
    expect(segment("Hour")).toHaveAttribute("id", "t");
    expect(screen.getByRole("group")).toHaveAttribute("aria-labelledby", "l");
    expect(screen.getByRole("group")).toHaveAttribute("aria-describedby", "d");
    // Required and invalid are states of the spinbuttons (a group doesn't take them), on every segment.
    for (const input of screen.getAllByRole("spinbutton")) {
      expect(input).toHaveAttribute("aria-required", "true");
      expect(input).toHaveAttribute("aria-invalid", "true");
    }
    expect(screen.getByRole("group")).not.toHaveAttribute("aria-invalid");
  });

  it("warns once when it has no accessible name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<TimePicker />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("TimePicker: no accessible name"));
  });
});

describe("TimePicker typing", () => {
  it("types a time into the segments, moving on as each is complete", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" onValueChange={onValueChange} />);
    await user.click(segment("Hour"));
    await user.keyboard("0930");
    expect(texts()).toEqual(["09", "30", "AM"]);
    expect(segment("AM/PM")).toHaveFocus();
    // The period starts as AM, so the time is already whole.
    expect(onValueChange).toHaveBeenLastCalledWith("09:30");
    await user.keyboard("p");
    expect(texts()).toEqual(["09", "30", "PM"]);
    expect(onValueChange).toHaveBeenLastCalledWith("21:30");
  });

  it("takes a digit that can't start a two-digit number as the whole number", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" hourCycle="24" />);
    await user.click(segment("Hour"));
    await user.keyboard("7");
    expect(segment("Hour")).toHaveValue("07");
    expect(segment("Minute")).toHaveFocus();
    await user.keyboard("8");
    expect(segment("Minute")).toHaveValue("08");
  });

  it("waits for a second digit that could follow, and carries one that can't", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" />);
    await user.click(segment("Hour"));
    await user.keyboard("1");
    expect(segment("Hour")).toHaveFocus();
    await user.keyboard("3");
    // 13 isn't an hour in the 12-hour cycle: the 1 stays, and the 3 starts the minutes.
    expect(segment("Hour")).toHaveValue("01");
    expect(segment("Minute")).toHaveFocus();
    expect(segment("Minute")).toHaveValue("03");
  });

  it("ignores letters in a number segment, and digits in AM/PM", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" />);
    await user.click(segment("Hour"));
    await user.keyboard("x");
    expect(segment("Hour")).toHaveValue("");
    await user.click(segment("AM/PM"));
    await user.keyboard("5");
    expect(segment("AM/PM")).toHaveValue("AM");
    await user.keyboard("p");
    expect(segment("AM/PM")).toHaveValue("PM");
    await user.keyboard("a");
    expect(segment("AM/PM")).toHaveValue("AM");
  });

  it("reads digits of another script", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" hourCycle="24" />);
    await user.click(segment("Hour"));
    await user.keyboard("٠٩٣٠");
    expect(texts()).toEqual(["09", "30"]);
  });

  it("clears a segment with Backspace and reports no time", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" defaultValue="09:30" onValueChange={onValueChange} />);
    await user.click(segment("Minute"));
    await user.keyboard("{Backspace}");
    expect(texts()).toEqual(["09", "", "AM"]);
    expect(onValueChange).toHaveBeenLastCalledWith("");
    // Fill it again and the time comes back.
    await user.keyboard("45");
    expect(onValueChange).toHaveBeenLastCalledWith("09:45");
  });

  it("moves between segments with the arrow keys and on a colon", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" />);
    await user.click(segment("Hour"));
    await user.keyboard("{ArrowRight}");
    expect(segment("Minute")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(segment("AM/PM")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(segment("Minute")).toHaveFocus();
    await user.keyboard(":");
    expect(segment("AM/PM")).toHaveFocus();
  });

  it("keeps each segment as a tab stop", async () => {
    const user = userEvent.setup();
    render(
      <>
        <TimePicker aria-label="t" showPicker={false} />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(segment("Hour")).toHaveFocus();
    await user.tab();
    expect(segment("Minute")).toHaveFocus();
    await user.tab();
    expect(segment("AM/PM")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("steps a segment with the arrow keys, wrapping", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" hourCycle="24" defaultValue="23:59" />);
    await user.click(segment("Hour"));
    await user.keyboard("{ArrowUp}");
    expect(segment("Hour")).toHaveValue("00");
    await user.keyboard("{ArrowDown}");
    expect(segment("Hour")).toHaveValue("23");
    await user.click(segment("Minute"));
    await user.keyboard("{ArrowUp}");
    expect(segment("Minute")).toHaveValue("00");
  });

  it("steps minutes along the step grid", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" hourCycle="24" defaultValue="10:00" step={15} />);
    await user.click(segment("Minute"));
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(segment("Minute")).toHaveValue("30");
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(segment("Minute")).toHaveValue("45");
  });

  it("jumps to the ends with Home and End, and toggles AM/PM with the arrows", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" defaultValue="06:20" step={15} />);
    await user.click(segment("Hour"));
    await user.keyboard("{End}");
    expect(segment("Hour")).toHaveValue("12");
    await user.keyboard("{Home}");
    expect(segment("Hour")).toHaveValue("01");
    await user.click(segment("Minute"));
    await user.keyboard("{End}");
    expect(segment("Minute")).toHaveValue("45");
    await user.keyboard("{Home}");
    expect(segment("Minute")).toHaveValue("00");
    await user.click(segment("AM/PM"));
    await user.keyboard("{ArrowUp}");
    expect(segment("AM/PM")).toHaveValue("PM");
  });

  it("handles a keyboard that doesn't report keys, through the text it inserted", () => {
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" hourCycle="24" onValueChange={onValueChange} />);
    const hour = segment("Hour") as HTMLInputElement;
    // What a phone's number keyboard does: the text changes and an `input` event says what was inserted.
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(hour, "5");
      hour.dispatchEvent(new InputEvent("input", { bubbles: true, data: "5", inputType: "insertText" }));
    });
    expect(hour).toHaveValue("05");
    expect(segment("Minute")).toHaveFocus();
  });

  it("takes several characters inserted at once, each going where the one before it left off", () => {
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" onValueChange={onValueChange} />);
    const hour = segment("Hour") as HTMLInputElement;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(hour, "0930p");
      hour.dispatchEvent(new InputEvent("input", { bubbles: true, data: "0930p", inputType: "insertText" }));
    });
    expect(texts()).toEqual(["09", "30", "PM"]);
    expect(onValueChange).toHaveBeenLastCalledWith("21:30");
    expect(segment("AM/PM")).toHaveFocus();
  });

  it("reads a pasted time with separators and a period letter", () => {
    render(<TimePicker aria-label="t" />);
    const hour = segment("Hour") as HTMLInputElement;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(hour, "9:5 pm");
      hour.dispatchEvent(new InputEvent("input", { bubbles: true, data: "9:5 pm", inputType: "insertFromPaste" }));
    });
    expect(texts()).toEqual(["09", "05", "PM"]);
  });

  it("ignores a separator before anything was typed in a segment, so it doesn't skip one", () => {
    render(<TimePicker aria-label="t" hourCycle="24" />);
    const hour = segment("Hour") as HTMLInputElement;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(hour, "9:30");
      hour.dispatchEvent(new InputEvent("input", { bubbles: true, data: "9:30", inputType: "insertText" }));
    });
    // The 9 finished the hour by itself, so the colon after it is not a second step forward.
    expect(texts()).toEqual(["09", "30"]);
  });

  it("selects a segment's text when it takes focus", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" defaultValue="09:30" />);
    await user.click(segment("Hour"));
    expect((segment("Hour") as HTMLInputElement).selectionEnd).toBe(2);
  });

  it("stays empty until every segment has something, then reports each change", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" hourCycle="24" showSeconds onValueChange={onValueChange} />);
    await user.click(segment("Hour"));
    await user.keyboard("1430");
    expect(onValueChange).not.toHaveBeenCalled();
    // The first digit of the last segment is already a whole time (a 0 is 00), so it is reported, then the second.
    await user.keyboard("05");
    expect(onValueChange.mock.calls).toEqual([["14:30:00"], ["14:30:05"]]);
  });
});

describe("TimePicker value", () => {
  it("is controlled by value, and an owner that ignores a change keeps the old time", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" value="09:30" onValueChange={() => {}} />);
    await user.click(segment("Minute"));
    await user.keyboard("{ArrowUp}");
    expect(segment("Minute")).toHaveValue("30");
  });

  it("follows a value set from outside, including to empty", () => {
    const { rerender } = render(<TimePicker aria-label="t" value="09:30" />);
    expect(texts()).toEqual(["09", "30", "AM"]);
    rerender(<TimePicker aria-label="t" value="21:05" />);
    expect(texts()).toEqual(["09", "05", "PM"]);
    rerender(<TimePicker aria-label="t" value="" />);
    expect(texts()).toEqual(["", "", "AM"]);
  });

  it("reads a value that isn't a time as empty", () => {
    render(<TimePicker aria-label="t" value="25:99" />);
    expect(texts()).toEqual(["", "", "AM"]);
  });

  it("re-reads the same value when the hour cycle changes", () => {
    const { rerender } = render(<TimePicker aria-label="t" value="15:45" />);
    expect(texts()).toEqual(["03", "45", "PM"]);
    rerender(<TimePicker aria-label="t" value="15:45" hourCycle="24" />);
    expect(texts()).toEqual(["15", "45"]);
    rerender(<TimePicker aria-label="t" value="15:45" showSeconds hourCycle="24" />);
    expect(texts()).toEqual(["15", "45", "00"]);
  });

  it("keeps a half-typed time while the value stays empty", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("");
      return <TimePicker aria-label="t" value={value} onValueChange={setValue} />;
    }
    render(<Controlled />);
    await user.click(segment("Hour"));
    await user.keyboard("09");
    expect(texts()).toEqual(["09", "", "AM"]);
  });

  it("submits the 24-hour string under name, and an empty one while incomplete", async () => {
    const user = userEvent.setup();
    const { container } = render(<TimePicker aria-label="t" name="start" form="f" defaultValue="15:45" />);
    const hidden = container.querySelector<HTMLInputElement>('input[type="hidden"]')!;
    expect(hidden).toHaveAttribute("name", "start");
    expect(hidden).toHaveAttribute("form", "f");
    expect(hidden).toHaveValue("15:45");
    await user.click(segment("Minute"));
    await user.keyboard("{Backspace}");
    expect(hidden).toHaveValue("");
  });

  it("writes digits through formatNumber, on screen and to a screen reader", () => {
    render(<TimePicker aria-label="t" defaultValue="09:05" formatNumber={(n) => `<${n}>`} />);
    expect(texts()).toEqual(["<0><9>", "<0><5>", "AM"]);
    expect(segment("Hour")).toHaveAttribute("aria-valuetext", "<0><9>");
  });

  it("translates every word, and keeps the default for a label left undefined", () => {
    render(
      <TimePicker
        aria-label="t"
        defaultValue="15:45"
        labels={{ hour: "Heure", pm: "Soir", am: undefined as unknown as string, clear: "Effacer" }}
        onClear={() => {}}
      />,
    );
    expect(segment("Heure")).toBeInTheDocument();
    expect(segment("AM/PM")).toHaveValue("Soir");
    expect(screen.getByRole("button", { name: "Effacer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose time" })).toBeInTheDocument();
  });

  it("sizes the AM/PM segment for the longer of its two labels", () => {
    render(<TimePicker aria-label="t" labels={{ am: "a.m.", pm: "p.m." }} />);
    expect(segment("AM/PM").style.getPropertyValue("--time-picker-period-chars")).toBe("4");
  });
});

describe("TimePicker validity", () => {
  it("flags a time outside min and max, and reports it anyway", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" hourCycle="24" min="09:00" max="17:00" onValueChange={onValueChange} />);
    expect(segment("Hour")).not.toHaveAttribute("aria-invalid");
    await user.click(segment("Hour"));
    await user.keyboard("0830");
    expect(onValueChange).toHaveBeenLastCalledWith("08:30");
    expect(segment("Hour")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("group")).toHaveClass(styles.error as string);
    await user.click(segment("Hour"));
    await user.keyboard("10");
    expect(segment("Hour")).not.toHaveAttribute("aria-invalid");
  });

  it("flags a minute that is off the step", () => {
    render(<TimePicker aria-label="t" hourCycle="24" defaultValue="10:20" step={15} />);
    expect(segment("Minute")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not flag an incomplete time", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" hourCycle="24" min="09:00" />);
    await user.click(segment("Hour"));
    await user.keyboard("03");
    expect(segment("Hour")).not.toHaveAttribute("aria-invalid");
  });

  it("warns about a step or a bound it can't use, and uses 1 or ignores it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<TimePicker aria-label="t" step={0} min="nine" max="25:00" />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`step` must be a whole number"));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`min` must be"));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`max` must be"));
  });
});

describe("TimePicker states", () => {
  it("disabled: nothing takes input, and the buttons are inert", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" disabled defaultValue="09:30" onClear={() => {}} onValueChange={onValueChange} />);
    expect(screen.getByRole("group")).toHaveAttribute("aria-disabled", "true");
    expect(segment("Hour")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Choose time" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Clear time" })).not.toBeInTheDocument();
    await user.keyboard("{ArrowUp}");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("read-only: segments can be focused and read but not changed, and the buttons are gone or inert", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" readOnly defaultValue="09:30" onClear={() => {}} onValueChange={onValueChange} />);
    await user.click(segment("Hour"));
    expect(segment("Hour")).toHaveFocus();
    await user.keyboard("5{ArrowUp}{Backspace}");
    expect(texts()).toEqual(["09", "30", "AM"]);
    expect(onValueChange).not.toHaveBeenCalled();
    await user.keyboard("{ArrowRight}");
    expect(segment("Minute")).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Clear time" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose time" })).toBeDisabled();
  });

  it("hides the picker button with showPicker off", () => {
    render(<TimePicker aria-label="t" showPicker={false} />);
    expect(screen.queryByRole("button", { name: "Choose time" })).not.toBeInTheDocument();
  });

  it("focuses the first segment on mount with autoFocus", () => {
    // eslint-disable-next-line jsx-a11y/no-autofocus -- exercising the component's own opt-in prop
    render(<TimePicker aria-label="t" autoFocus />);
    expect(segment("Hour")).toHaveFocus();
  });
});

describe("TimePicker clear", () => {
  it("shows only while there is something to clear, empties the field and calls onClear", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" onClear={onClear} onValueChange={onValueChange} />);
    expect(screen.queryByRole("button", { name: "Clear time" })).not.toBeInTheDocument();
    await user.click(segment("Hour"));
    await user.keyboard("9");
    expect(screen.getByRole("button", { name: "Clear time" })).toBeInTheDocument();
    await user.keyboard("30p");
    await user.click(screen.getByRole("button", { name: "Clear time" }));
    expect(texts()).toEqual(["", "", "AM"]);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith("");
    expect(segment("Hour")).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Clear time" })).not.toBeInTheDocument();
  });
});

describe("TimePicker clearable", () => {
  it("shows the clear button with clearable alone, and it empties the field without any callback", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" clearable defaultValue="15:45" />);
    await user.click(screen.getByRole("button", { name: "Clear time" }));
    expect(texts()).toEqual(["", "", "AM"]);
    expect(segment("Hour")).toHaveFocus();
  });

  it("shows no clear button by default, with onClear it does, and clearable={false} turns it off whatever else is passed", () => {
    const { rerender } = render(<TimePicker aria-label="t" defaultValue="15:45" />);
    expect(screen.queryByRole("button", { name: "Clear time" })).not.toBeInTheDocument();
    rerender(<TimePicker aria-label="t" defaultValue="15:45" onClear={() => {}} />);
    expect(screen.getByRole("button", { name: "Clear time" })).toBeInTheDocument();
    rerender(<TimePicker aria-label="t" defaultValue="15:45" onClear={() => {}} clearable={false} />);
    expect(screen.queryByRole("button", { name: "Clear time" })).not.toBeInTheDocument();
  });

  it("puts AM/PM back to AM when cleared from PM, and the button goes with nothing left to clear", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" clearable defaultValue="21:05" onValueChange={onValueChange} />);
    expect(segment("AM/PM")).toHaveValue("PM");
    await user.click(screen.getByRole("button", { name: "Clear time" }));
    expect(segment("AM/PM")).toHaveValue("AM");
    expect(onValueChange).toHaveBeenLastCalledWith("");
    expect(screen.queryByRole("button", { name: "Clear time" })).not.toBeInTheDocument();
  });

  it("counts a PM on its own as something to clear, but not the empty field's own AM", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" clearable />);
    expect(screen.queryByRole("button", { name: "Clear time" })).not.toBeInTheDocument();
    await user.click(segment("AM/PM"));
    await user.keyboard("p");
    expect(screen.getByRole("button", { name: "Clear time" })).toBeInTheDocument();
  });

  it("is also reset to AM when the owner sets the value to empty", () => {
    const { rerender } = render(<TimePicker aria-label="t" value="21:05" />);
    expect(segment("AM/PM")).toHaveValue("PM");
    rerender(<TimePicker aria-label="t" value="" />);
    expect(segment("AM/PM")).toHaveValue("AM");
  });

  it("still lets Backspace empty the AM/PM segment on its own", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" defaultValue="09:30" />);
    await user.click(segment("AM/PM"));
    await user.keyboard("{Backspace}");
    expect(segment("AM/PM")).toHaveValue("");
  });
});

describe("TimePicker picker", () => {
  const open = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: "Choose time" }));
    return screen.findByRole("dialog", { name: "Choose a time" });
  };
  const wheel = (name: string) => screen.getByRole("listbox", { name });
  const option = (column: string, text: string) => within(wheel(column)).getByRole("option", { name: text });
  const optionTexts = (column: string) => within(wheel(column)).getAllByRole("option").map((o) => o.textContent);

  it("opens a dialog of an hour, a minute and an AM/PM wheel", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" />);
    const dialog = await open(user);
    expect(within(dialog).getAllByRole("listbox").map((box) => box.getAttribute("aria-label"))).toEqual(["Hour", "Minute", "AM/PM"]);
    expect(optionTexts("Hour")).toEqual(["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"]);
    expect(optionTexts("Minute")).toHaveLength(60);
    expect(optionTexts("AM/PM")).toEqual(["AM", "PM"]);
  });

  it("draws a looping wheel as several copies, with only the middle copy in the accessibility tree", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" hourCycle="24" />);
    await open(user);
    const hours = wheel("Hour");
    // 24 values, drawn nine times; one copy of them is options, the rest are hidden rows.
    expect(hours.children).toHaveLength(24 * 9);
    expect(within(hours).getAllByRole("option")).toHaveLength(24);
    expect([...hours.children].filter((row) => row.getAttribute("aria-hidden") === "true")).toHaveLength(24 * 8);
    // AM/PM doesn't loop: one copy.
  });

  it("does not repeat a wheel that doesn't loop", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" />);
    await open(user);
    expect(wheel("AM/PM").children).toHaveLength(2);
  });

  it("lists 24 hours in the 24-hour cycle, seconds when shown, and only minutes on the step", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" hourCycle="24" showSeconds step={15} />);
    await open(user);
    expect(optionTexts("Hour")).toHaveLength(24);
    expect(optionTexts("Minute")).toEqual(["00", "15", "30", "45"]);
    expect(optionTexts("Second")).toHaveLength(60);
    expect(screen.queryByRole("listbox", { name: "AM/PM" })).not.toBeInTheDocument();
  });

  it("marks the chosen option in each wheel, names it as the active one, and gives each wheel one tab stop", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" defaultValue="15:45" />);
    await open(user);
    expect(option("Hour", "03")).toHaveAttribute("aria-selected", "true");
    expect(option("Minute", "45")).toHaveAttribute("aria-selected", "true");
    expect(option("AM/PM", "PM")).toHaveAttribute("aria-selected", "true");
    expect(option("Hour", "04")).toHaveAttribute("aria-selected", "false");
    expect(wheel("Hour")).toHaveAttribute("aria-activedescendant", option("Hour", "03").id);
    for (const name of ["Hour", "Minute", "AM/PM"]) expect(wheel(name)).toHaveAttribute("tabindex", "0");
  });

  it("chooses nothing while a segment is empty, and names no active option", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" />);
    await open(user);
    expect(within(wheel("Hour")).queryAllByRole("option", { selected: true })).toHaveLength(0);
    expect(wheel("Hour")).not.toHaveAttribute("aria-activedescendant");
  });

  it("focuses the hour wheel when it opens", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" defaultValue="15:45" />);
    await open(user);
    await waitFor(() => expect(wheel("Hour")).toHaveFocus());
  });

  it("follows a value set from outside while the picker is open", () => {
    const { rerender } = render(<TimePicker aria-label="t" value="09:30" defaultOpen />);
    expect(option("Hour", "09")).toHaveAttribute("aria-selected", "true");
    rerender(<TimePicker aria-label="t" value="23:15" defaultOpen />);
    expect(option("Hour", "11")).toHaveAttribute("aria-selected", "true");
    expect(option("Hour", "09")).toHaveAttribute("aria-selected", "false");
    expect(option("AM/PM", "PM")).toHaveAttribute("aria-selected", "true");
    expect(option("Minute", "15")).toHaveAttribute("aria-selected", "true");
  });

  it("commits a pick at once, and fills the segments it left empty with their first value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" onValueChange={onValueChange} />);
    await open(user);
    await user.click(option("Hour", "07"));
    expect(onValueChange).toHaveBeenLastCalledWith("07:00");
    expect(texts()).toEqual(["07", "00", "AM"]);
    await user.click(option("Minute", "45"));
    await user.click(option("AM/PM", "PM"));
    expect(onValueChange).toHaveBeenLastCalledWith("19:45");
    // And it stays open for the next pick.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("chooses with the arrow keys, and Enter closes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" hourCycle="24" defaultValue="10:00" onValueChange={onValueChange} />);
    await open(user);
    await waitFor(() => expect(wheel("Hour")).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    expect(onValueChange).toHaveBeenLastCalledWith("11:00");
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith("09:00");
    await user.keyboard("{End}");
    expect(onValueChange).toHaveBeenLastCalledWith("23:00");
    await user.keyboard("{Home}");
    expect(onValueChange).toHaveBeenLastCalledWith("00:00");
    await user.keyboard("{ArrowRight}");
    expect(wheel("Minute")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(wheel("Hour")).toHaveFocus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("loops the hours, minutes and seconds past their ends, and not AM/PM", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" hourCycle="24" showSeconds defaultValue="23:59:59" onValueChange={onValueChange} />);
    await open(user);
    await waitFor(() => expect(wheel("Hour")).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    expect(onValueChange).toHaveBeenLastCalledWith("00:59:59");
    await user.keyboard("{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith("23:59:59");
    wheel("Minute").focus();
    await user.keyboard("{ArrowDown}");
    expect(onValueChange).toHaveBeenLastCalledWith("23:00:59");
    wheel("Second").focus();
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith("23:00:57");
  });

  it("doesn't go past either end of AM/PM", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" defaultValue="03:00" onValueChange={onValueChange} defaultOpen />);
    wheel("AM/PM").focus();
    await user.keyboard("{ArrowUp}");
    expect(onValueChange).not.toHaveBeenCalled();
    await user.keyboard("{ArrowDown}");
    expect(onValueChange).toHaveBeenLastCalledWith("15:00");
    await user.keyboard("{ArrowDown}");
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("chooses what is in the middle on the first arrow when nothing is chosen yet", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" hourCycle="24" onValueChange={onValueChange} defaultOpen />);
    wheel("Hour").focus();
    await user.keyboard("{ArrowDown}");
    // The wheel rests at its first value, 00; choosing it fills the minutes with 00 too.
    expect(onValueChange).toHaveBeenLastCalledWith("00:00");
  });

  it("closes on Escape and returns focus to the button", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" />);
    await open(user);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Choose time" })).toHaveFocus();
  });

  it("disables the options no allowed time could be reached through", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" hourCycle="24" min="09:30" max="17:00" defaultValue="09:45" onValueChange={onValueChange} />);
    await open(user);
    expect(option("Hour", "08")).toHaveAttribute("aria-disabled", "true");
    expect(option("Hour", "09")).not.toHaveAttribute("aria-disabled");
    expect(option("Hour", "18")).toHaveAttribute("aria-disabled", "true");
    // Within 09:xx only :30 and later are allowed.
    expect(option("Minute", "29")).toHaveAttribute("aria-disabled", "true");
    expect(option("Minute", "30")).not.toHaveAttribute("aria-disabled");
    await user.click(option("Hour", "08"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("disables a period no allowed time falls in", async () => {
    const user = userEvent.setup();
    render(<TimePicker aria-label="t" min="13:00" />);
    await open(user);
    expect(option("AM/PM", "AM")).toHaveAttribute("aria-disabled", "true");
    expect(option("AM/PM", "PM")).not.toHaveAttribute("aria-disabled");
  });

  it("steps over disabled values with the arrow keys", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimePicker aria-label="t" hourCycle="24" min="10:00" max="12:00" defaultValue="10:00" onValueChange={onValueChange} />);
    await open(user);
    await waitFor(() => expect(wheel("Hour")).toHaveFocus());
    // Looping up from 10 goes to 09, which is disabled, and on to 12, the nearest allowed the other way round.
    await user.keyboard("{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith("12:00");
    await user.keyboard("{ArrowDown}");
    expect(onValueChange).toHaveBeenLastCalledWith("10:00");
  });

  it("can be controlled, and is hidden for a disabled or read-only field", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(<TimePicker aria-label="t" open onOpenChange={onOpenChange} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(<TimePicker aria-label="t" open disabled />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(<TimePicker aria-label="t" open readOnly />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("starts open with defaultOpen", () => {
    render(<TimePicker aria-label="t" defaultOpen />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("TimePicker in a FormField", () => {
  it("is named by the label, and a click on the label focuses the first segment", async () => {
    const user = userEvent.setup();
    render(<FormField label="Reminder">{(field) => <TimePicker {...field} />}</FormField>);
    expect(screen.getByRole("group", { name: "Reminder" })).toBeInTheDocument();
    await user.click(screen.getByText("Reminder"));
    expect(segment("Hour")).toHaveFocus();
  });

  it("is wired to helper and error text, and takes the error state and required", () => {
    render(
      <FormField label="Reminder" helperText="Local time" error="Pick a time" required>
        {(field) => <TimePicker {...field} />}
      </FormField>,
    );
    const group = screen.getByRole("group");
    expect(segment("Hour")).toHaveAttribute("aria-invalid", "true");
    expect(segment("Hour")).toHaveAttribute("aria-required", "true");
    const described = group.getAttribute("aria-describedby")!.split(" ");
    expect(described.map((id) => document.getElementById(id)?.textContent).join(" ")).toContain("Pick a time");
  });

  it("works with a plain FieldLabel and htmlFor", async () => {
    const user = userEvent.setup();
    render(
      <>
        <FieldLabel htmlFor="start">Start</FieldLabel>
        <TimePicker id="start" aria-label="Start time" />
      </>,
    );
    await user.click(screen.getByText("Start"));
    expect(segment("Hour")).toHaveFocus();
  });
});

describe("TimePicker standard props", () => {
  it("forwards its ref to the group, and takes className, style, data-testid and native attributes", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <TimePicker
        ref={ref}
        aria-label="t"
        className="mine"
        style={{ color: "red" }}
        data-testid="tp"
        // A native attribute straight through to the group.
        title="Pick a time"
      />,
    );
    expect(ref.current).toBe(screen.getByTestId("tp"));
    expect(ref.current).toHaveClass("mine");
    expect(ref.current).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(ref.current).toHaveAttribute("title", "Pick a time");
  });

  it("does not let a native prop replace its role or its aria", () => {
    render(<TimePicker aria-label="t" {...({ role: "textbox", "aria-disabled": "false" } as object)} disabled />);
    expect(screen.getByRole("group")).toHaveAttribute("aria-disabled", "true");
  });

  it("takes every size", () => {
    for (const size of ["xs", "sm", "md", "lg", "xl"] as const) {
      const { unmount } = render(<TimePicker aria-label="t" size={size} />);
      const className = (styles as Record<string, string>)[`size${size[0]!.toUpperCase()}${size.slice(1)}`]!;
      expect(screen.getByRole("group")).toHaveClass(className);
      unmount();
    }
  });
});

describe("TimePicker robustness", () => {
  it("works inside StrictMode", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <TimePicker aria-label="t" hourCycle="24" onValueChange={onValueChange} />
      </StrictMode>,
    );
    await user.click(segment("Hour"));
    await user.keyboard("0930");
    expect(onValueChange.mock.calls).toEqual([["09:03"], ["09:30"]]);
  });

  it("does not loop when the value is not a time", () => {
    expect(() => render(<TimePicker aria-label="t" value="garbage" />)).not.toThrow();
  });

  it("copes with an undefined labels entry, a NaN step and a non-string value", () => {
    expect(() =>
      render(<TimePicker aria-label="t" step={Number.NaN} value={5 as unknown as string} labels={{ hour: undefined as unknown as string }} />),
    ).not.toThrow();
    expect(segment("Hour")).toBeInTheDocument();
  });
});

describe("TimePicker accessibility", () => {
  it("has no axe violations, closed, with a value, disabled, in error and in 24-hour with seconds", async () => {
    for (const props of [
      { defaultValue: "09:30" },
      { disabled: true, defaultValue: "09:30" },
      { hasError: true },
      { hourCycle: "24" as const, showSeconds: true, defaultValue: "09:30:15" },
    ]) {
      const { container, unmount } = render(<TimePicker aria-label="Start time" {...props} />);
      expect(await axe(container)).toHaveNoViolations();
      unmount();
    }
  });

  it("has no axe violations with the picker open", async () => {
    render(<TimePicker aria-label="Start time" defaultValue="15:45" defaultOpen showSeconds />);
    expect(await scanBody()).toHaveNoViolations();
  });
});
