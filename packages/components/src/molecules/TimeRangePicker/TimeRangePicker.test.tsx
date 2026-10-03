import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormField } from "../FormField";
import { TimeRangePicker } from "./TimeRangePicker";
import type { TimeRangeValue } from "./TimeRangePicker.types";

// The shared popover names its sections the same, and is later in the document than the fields.
const field = (name: string) => screen.getAllByRole("group", { name })[0]!;
// Invalid is a state of a field's spinbuttons (a group doesn't take it), so ask the first.
const invalid = (end: "Start time" | "End time") => within(field(end)).getAllByRole("spinbutton")[0]!.hasAttribute("aria-invalid");
const part = (end: "Start time" | "End time", segmentName: string) =>
  within(field(end)).getByRole("spinbutton", { name: segmentName });
const texts = (end: "Start time" | "End time") =>
  within(field(end)).getAllByRole("spinbutton").map((input) => (input as HTMLInputElement).value);

afterEach(() => vi.restoreAllMocks());

describe("TimeRangePicker", () => {
  it("is a named group of a start field and an end field", () => {
    render(<TimeRangePicker aria-label="Opening hours" />);
    const group = screen.getByRole("group", { name: "Opening hours" });
    expect(within(group).getAllByRole("group").map((inner) => inner.getAttribute("aria-label"))).toEqual(["Start time", "End time"]);
  });

  it("shows each end of the value", () => {
    render(<TimeRangePicker aria-label="r" defaultValue={["09:00", "17:30"]} />);
    expect(texts("Start time")).toEqual(["09", "00", "AM"]);
    expect(texts("End time")).toEqual(["05", "30", "PM"]);
  });

  it("reports the pair as either end changes, with an empty string for an end not yet complete", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimeRangePicker aria-label="r" hourCycle="24" onValueChange={onValueChange} />);
    await user.click(part("Start time", "Hour"));
    await user.keyboard("0900");
    expect(onValueChange).toHaveBeenLastCalledWith(["09:00", ""]);
    await user.click(part("End time", "Hour"));
    await user.keyboard("1730");
    expect(onValueChange).toHaveBeenLastCalledWith(["09:00", "17:30"]);
    await user.click(part("Start time", "Minute"));
    await user.keyboard("{Backspace}");
    expect(onValueChange).toHaveBeenLastCalledWith(["", "17:30"]);
  });

  it("is controlled by value, and an owner that ignores a change keeps the old range", async () => {
    const user = userEvent.setup();
    render(<TimeRangePicker aria-label="r" hourCycle="24" value={["09:00", "17:30"]} onValueChange={() => {}} />);
    await user.click(part("End time", "Hour"));
    await user.keyboard("{ArrowUp}");
    expect(texts("End time")).toEqual(["17", "30"]);
  });

  it("follows a value set from outside", () => {
    function Controlled() {
      const [range, setRange] = useState<TimeRangeValue>(["", ""]);
      return (
        <>
          <button type="button" onClick={() => setRange(["08:15", "09:45"])}>
            Set
          </button>
          <TimeRangePicker aria-label="r" hourCycle="24" value={range} onValueChange={setRange} />
        </>
      );
    }
    render(<Controlled />);
    screen.getByRole("button", { name: "Set" }).click();
    return waitFor(() => expect(texts("Start time")).toEqual(["08", "15"]));
  });

  it("reads a value that isn't a pair of strings as empty", () => {
    expect(() =>
      render(<TimeRangePicker aria-label="r" value={undefined as unknown as TimeRangeValue} defaultValue={[5, null] as unknown as TimeRangeValue} />),
    ).not.toThrow();
    expect(texts("Start time")).toEqual(["", "", "AM"]);
  });

  it("flags an end earlier than the start, on the end only, and reports it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimeRangePicker aria-label="r" hourCycle="24" defaultValue={["10:00", ""]} onValueChange={onValueChange} />);
    await user.click(part("End time", "Hour"));
    await user.keyboard("0900");
    expect(onValueChange).toHaveBeenLastCalledWith(["10:00", "09:00"]);
    expect(invalid("End time")).toBe(true);
    expect(invalid("Start time")).toBe(false);
    // The end equal to the start is allowed.
    await user.click(part("End time", "Hour"));
    await user.keyboard("10");
    expect(invalid("End time")).toBe(false);
  });

  it("flags a start later than the end on the end, and leaves the start alone", () => {
    render(<TimeRangePicker aria-label="r" hourCycle="24" defaultValue={["12:00", "09:00"]} />);
    expect(invalid("End time")).toBe(true);
    expect(invalid("Start time")).toBe(false);
  });

  it("applies the shared min and max to both ends", () => {
    render(<TimeRangePicker aria-label="r" hourCycle="24" min="09:00" max="17:00" defaultValue={["08:00", "18:00"]} />);
    expect(invalid("Start time")).toBe(true);
    expect(invalid("End time")).toBe(true);
  });

  it("disables, in the end's picker, what is before the start", async () => {
    const user = userEvent.setup();
    render(<TimeRangePicker aria-label="r" hourCycle="24" defaultValue={["10:30", ""]} />);
    await user.click(within(field("End time")).getByRole("button", { name: "Choose time" }));
    const hours = await screen.findByRole("listbox", { name: "Hour" });
    expect(within(hours).getByRole("option", { name: "09" })).toHaveAttribute("aria-disabled", "true");
    expect(within(hours).getByRole("option", { name: "10" })).not.toHaveAttribute("aria-disabled");
  });

  it("passes the shared settings to both ends", () => {
    render(<TimeRangePicker aria-label="r" hourCycle="24" showSeconds size="lg" disabled />);
    for (const end of ["Start time", "End time"] as const) {
      expect(within(field(end)).getAllByRole("spinbutton")).toHaveLength(3);
      expect(field(end)).toHaveAttribute("aria-disabled", "true");
    }
  });

  it("submits both values under name[], start first", () => {
    const { container } = render(<TimeRangePicker aria-label="r" name="hours" form="f" defaultValue={["09:00", "17:30"]} />);
    const hidden = [...container.querySelectorAll<HTMLInputElement>('input[type="time"]')];
    expect(hidden.map((input) => input.name)).toEqual(["hours[]", "hours[]"]);
    expect(hidden.map((input) => input.value)).toEqual(["09:00", "17:30"]);
    expect(hidden.every((input) => input.getAttribute("form") === "f")).toBe(true);
  });

  it("clears an end and says which", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<TimeRangePicker aria-label="r" defaultValue={["09:00", "17:30"]} onClear={onClear} />);
    await user.click(within(field("End time")).getByRole("button", { name: "Clear time" }));
    expect(onClear).toHaveBeenCalledWith("end");
    expect(texts("End time")).toEqual(["", "", "AM"]);
    expect(texts("Start time")).toEqual(["09", "00", "AM"]);
  });

  it("shows the clear buttons with clearable alone, and not with clearable={false}", () => {
    const { rerender } = render(<TimeRangePicker aria-label="r" clearable defaultValue={["09:00", "17:30"]} />);
    expect(screen.getAllByRole("button", { name: "Clear time" })).toHaveLength(2);
    rerender(<TimeRangePicker aria-label="r" clearable={false} onClear={() => {}} defaultValue={["09:00", "17:30"]} />);
    expect(screen.queryByRole("button", { name: "Clear time" })).not.toBeInTheDocument();
  });

  it("translates the end names and the rest, keeping defaults for what is left out", () => {
    render(<TimeRangePicker aria-label="r" labels={{ start: "De", end: "À", hour: "Heure" }} />);
    expect(within(field("De")).getByRole("spinbutton", { name: "Heure" })).toBeInTheDocument();
    expect(within(field("À")).getByRole("spinbutton", { name: "Minute" })).toBeInTheDocument();
  });

  it("puts the id on the start field's first segment", () => {
    render(<TimeRangePicker aria-label="r" id="range" />);
    expect(part("Start time", "Hour")).toHaveAttribute("id", "range");
  });

  it("focuses the start field on mount with autoFocus", () => {
    // eslint-disable-next-line jsx-a11y/no-autofocus -- exercising the component's own opt-in prop
    render(<TimeRangePicker aria-label="r" autoFocus />);
    expect(part("Start time", "Hour")).toHaveFocus();
  });

  it("warns once when it has no accessible name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<TimeRangePicker />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("TimeRangePicker: no accessible name"));
  });

  it("is named by a FormField's label, and takes its error state", () => {
    render(
      <FormField label="Opening hours" error="Needs an end">
        {(fieldProps) => <TimeRangePicker {...fieldProps} />}
      </FormField>,
    );
    expect(screen.getByRole("group", { name: "Opening hours" })).toBeInTheDocument();
    expect(invalid("Start time")).toBe(true);
    expect(invalid("End time")).toBe(true);
  });

  it("forwards its ref to the group, and takes className, style, data-testid and native attributes", () => {
    const ref = createRef<HTMLDivElement>();
    render(<TimeRangePicker ref={ref} aria-label="r" className="mine" style={{ color: "red" }} data-testid="trp" title="Hours" />);
    expect(ref.current).toBe(screen.getByTestId("trp"));
    expect(ref.current).toHaveClass("mine");
    expect(ref.current).toHaveStyle({ color: "rgb(255, 0, 0)" });
    expect(ref.current).toHaveAttribute("title", "Hours");
  });

  it("does not let a native prop replace its role", () => {
    render(<TimeRangePicker aria-label="r" {...({ role: "textbox" } as object)} data-testid="trp" />);
    expect(screen.getByTestId("trp")).toHaveAttribute("role", "group");
  });

  it("works inside StrictMode", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <TimeRangePicker aria-label="r" hourCycle="24" onValueChange={onValueChange} />
      </StrictMode>,
    );
    await user.click(part("Start time", "Hour"));
    await user.keyboard("0930");
    expect(onValueChange).toHaveBeenLastCalledWith(["09:30", ""]);
  });

  it("calls onFocus and onBlur once for the pair, not as focus moves between the ends", async () => {
    const user = userEvent.setup();
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(
      <>
        <TimeRangePicker aria-label="r" onFocus={onFocus} onBlur={onBlur} />
        <button type="button">After</button>
      </>,
    );
    await user.click(part("Start time", "Hour"));
    expect(onFocus).toHaveBeenCalledTimes(1);
    await user.click(part("End time", "Hour"));
    await user.click(within(field("End time")).getByRole("button", { name: "Choose time" }));
    await screen.findByRole("dialog");
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "After" }));
    expect(onBlur).toHaveBeenCalledTimes(1);
    await user.click(part("Start time", "Minute"));
    expect(onFocus).toHaveBeenCalledTimes(2);
  });

  it("passes commitOn to both ends, reporting the pair when each settles", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TimeRangePicker aria-label="r" hourCycle="24" commitOn="complete" onValueChange={onValueChange} />);
    await user.click(part("Start time", "Hour"));
    await user.keyboard("093");
    expect(onValueChange).not.toHaveBeenCalled();
    await user.keyboard("0");
    expect(onValueChange.mock.calls).toEqual([[["09:30", ""]]]);
  });

  it("passes the second step, the period position and the owner's rule to both ends", async () => {
    const user = userEvent.setup();
    render(
      <TimeRangePicker
        aria-label="r"
        showSeconds
        secondStep={15}
        periodPosition="start"
        isTimeDisabled={(time) => time.startsWith("12")}
        defaultValue={["12:30:00", "13:00:00"]}
      />,
    );
    for (const end of ["Start time", "End time"] as const) {
      expect(within(field(end)).getAllByRole("spinbutton")[0]).toHaveAttribute("aria-label", "AM/PM");
    }
    expect(invalid("Start time")).toBe(true);
    expect(invalid("End time")).toBe(false);
    await user.click(within(field("End time")).getByRole("button", { name: "Choose time" }));
    const seconds = await screen.findByRole("listbox", { name: "Second" });
    expect(within(seconds).getAllByRole("option")).toHaveLength(4);
  });

  it("opens an end's picker on arriving at it with openOnFocus", async () => {
    const user = userEvent.setup();
    render(<TimeRangePicker aria-label="r" openOnFocus />);
    await user.click(part("End time", "Hour"));
    await screen.findByRole("dialog");
    expect(part("End time", "Hour")).toHaveFocus();
  });

  it("makes a form refuse a range with an empty or half-filled end", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form" aria-label="f">
        <TimeRangePicker aria-label="r" hourCycle="24" name="hours" required defaultValue={["09:00", ""]} />
      </form>,
    );
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(form.checkValidity()).toBe(false);
    await user.click(part("End time", "Hour"));
    await user.keyboard("1730");
    expect(form.checkValidity()).toBe(true);
    await user.keyboard("{Backspace}");
    expect(form.checkValidity()).toBe(false);
  });

  describe("overnight", () => {
    it("flags an end before the start unless it may be the next day", () => {
      const { rerender } = render(<TimeRangePicker aria-label="r" hourCycle="24" defaultValue={["22:00", "02:00"]} />);
      expect(invalid("End time")).toBe(true);
      rerender(<TimeRangePicker aria-label="r" hourCycle="24" allowOvernight defaultValue={["22:00", "02:00"]} />);
      expect(invalid("End time")).toBe(false);
    });

    it("stops disabling what is before the start in the end's picker", async () => {
      const user = userEvent.setup();
      render(<TimeRangePicker aria-label="r" hourCycle="24" allowOvernight defaultValue={["10:30", ""]} />);
      await user.click(within(field("End time")).getByRole("button", { name: "Choose time" }));
      const hours = await screen.findByRole("listbox", { name: "Hour" });
      expect(within(hours).getByRole("option", { name: "09" })).not.toHaveAttribute("aria-disabled");
    });

    it("counts durations across midnight, and equal times as none", () => {
      const { rerender } = render(
        <TimeRangePicker aria-label="r" hourCycle="24" allowOvernight maxDuration={240} value={["22:00", "02:00"]} />,
      );
      expect(invalid("End time")).toBe(false);
      rerender(<TimeRangePicker aria-label="r" hourCycle="24" allowOvernight maxDuration={180} value={["22:00", "02:00"]} />);
      expect(invalid("End time")).toBe(true);
      rerender(<TimeRangePicker aria-label="r" hourCycle="24" allowOvernight minDuration={1} value={["22:00", "22:00"]} />);
      expect(invalid("End time")).toBe(true);
    });
  });

  describe("duration limits", () => {
    it("flags an end that makes the range too short or too long, and still reports it", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <TimeRangePicker
          aria-label="r"
          hourCycle="24"
          minDuration={30}
          maxDuration={120}
          defaultValue={["09:00", ""]}
          onValueChange={onValueChange}
        />,
      );
      await user.click(part("End time", "Hour"));
      await user.keyboard("0915");
      expect(onValueChange).toHaveBeenLastCalledWith(["09:00", "09:15"]);
      expect(invalid("End time")).toBe(true);
      await user.click(part("End time", "Hour"));
      await user.keyboard("1100");
      expect(invalid("End time")).toBe(false);
      await user.click(part("End time", "Hour"));
      await user.keyboard("1101");
      expect(invalid("End time")).toBe(true);
    });

    it("disables in the end's picker the hours no allowed length reaches", async () => {
      const user = userEvent.setup();
      render(<TimeRangePicker aria-label="r" hourCycle="24" minDuration={60} maxDuration={120} defaultValue={["09:00", ""]} />);
      await user.click(within(field("End time")).getByRole("button", { name: "Choose time" }));
      const hours = await screen.findByRole("listbox", { name: "Hour" });
      const disabled = (name: string) => within(hours).getByRole("option", { name }).hasAttribute("aria-disabled");
      // 10:00 to 11:00 are the lengths of one to two hours; 09:xx is under an hour and 12:xx is over two.
      expect(["09", "10", "11", "12"].map(disabled)).toEqual([true, false, false, true]);
    });

    it("judges nothing until both ends are whole", () => {
      render(<TimeRangePicker aria-label="r" hourCycle="24" minDuration={60} defaultValue={["09:00", ""]} />);
      expect(invalid("End time")).toBe(false);
      expect(invalid("Start time")).toBe(false);
    });
  });

  describe("constrainStart", () => {
    it("leaves the start free by default", () => {
      render(<TimeRangePicker aria-label="r" hourCycle="24" defaultValue={["12:00", "09:00"]} />);
      expect(invalid("Start time")).toBe(false);
    });

    it("flags a start after the end, and disables it in the start's picker", async () => {
      const user = userEvent.setup();
      render(<TimeRangePicker aria-label="r" hourCycle="24" constrainStart defaultValue={["12:00", "09:00"]} />);
      expect(invalid("Start time")).toBe(true);
      await user.click(within(field("Start time")).getByRole("button", { name: "Choose time" }));
      const hours = await screen.findByRole("listbox", { name: "Hour" });
      expect(within(hours).getByRole("option", { name: "10" })).toHaveAttribute("aria-disabled", "true");
      expect(within(hours).getByRole("option", { name: "08" })).not.toHaveAttribute("aria-disabled");
    });

    it("applies the duration limits to the start", () => {
      render(<TimeRangePicker aria-label="r" hourCycle="24" constrainStart maxDuration={60} defaultValue={["07:00", "09:00"]} />);
      expect(invalid("Start time")).toBe(true);
    });

    it("has no latest start when overnight is allowed", () => {
      render(<TimeRangePicker aria-label="r" hourCycle="24" constrainStart allowOvernight defaultValue={["22:00", "02:00"]} />);
      expect(invalid("Start time")).toBe(false);
    });
  });

  describe("sharedPicker", () => {
    const openShared = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(screen.getByRole("button", { name: "Choose time" }));
      return screen.findByRole("dialog", { name: "Choose a time" });
    };

    it("replaces the two picker buttons with one, holding both ends' wheels", async () => {
      const user = userEvent.setup();
      render(<TimeRangePicker aria-label="r" hourCycle="24" sharedPicker defaultValue={["09:00", "17:30"]} />);
      expect(screen.getAllByRole("button", { name: "Choose time" })).toHaveLength(1);
      const dialog = await openShared(user);
      const start = within(within(dialog).getByRole("group", { name: "Start time" }));
      const end = within(within(dialog).getByRole("group", { name: "End time" }));
      expect(start.getByRole("listbox", { name: "Hour" })).toBeInTheDocument();
      expect(within(end.getByRole("listbox", { name: "Hour" })).getByRole("option", { name: "17", selected: true })).toBeInTheDocument();
    });

    it("writes a pick into the end it was made in, and shows it in the field", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<TimeRangePicker aria-label="r" hourCycle="24" sharedPicker defaultValue={["09:00", "17:30"]} onValueChange={onValueChange} />);
      const dialog = await openShared(user);
      const endHours = within(within(dialog).getByRole("group", { name: "End time" })).getByRole("listbox", { name: "Hour" });
      endHours.focus();
      await user.keyboard("{ArrowDown}");
      expect(onValueChange).toHaveBeenLastCalledWith(["09:00", "18:30"]);
      expect(texts("End time")).toEqual(["18", "30"]);
    });

    it("holds picks with commitOn complete until the popover closes", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <TimeRangePicker aria-label="r" hourCycle="24" sharedPicker commitOn="complete" defaultValue={["09:00", "17:30"]} onValueChange={onValueChange} />,
      );
      const dialog = await openShared(user);
      const startHours = within(within(dialog).getByRole("group", { name: "Start time" })).getByRole("listbox", { name: "Hour" });
      startHours.focus();
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(texts("Start time")).toEqual(["11", "00"]);
      expect(onValueChange).not.toHaveBeenCalled();
      await user.keyboard("{Escape}");
      await waitFor(() => expect(onValueChange.mock.calls).toEqual([[["11:00", "17:30"]]]));
    });

    it("applies the end's limits to the end's wheels", async () => {
      const user = userEvent.setup();
      render(<TimeRangePicker aria-label="r" hourCycle="24" sharedPicker defaultValue={["10:30", "12:00"]} />);
      const dialog = await openShared(user);
      const endHours = within(within(dialog).getByRole("group", { name: "End time" })).getByRole("listbox", { name: "Hour" });
      expect(within(endHours).getByRole("option", { name: "09" })).toHaveAttribute("aria-disabled", "true");
      const startHours = within(within(dialog).getByRole("group", { name: "Start time" })).getByRole("listbox", { name: "Hour" });
      expect(within(startHours).getByRole("option", { name: "09" })).not.toHaveAttribute("aria-disabled");
    });

    it("is not a part of leaving: onBlur waits until focus is outside the pair and the popover", async () => {
      const user = userEvent.setup();
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      render(
        <>
          <TimeRangePicker aria-label="r" sharedPicker onFocus={onFocus} onBlur={onBlur} />
          <button type="button">After</button>
        </>,
      );
      await openShared(user);
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onBlur).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: "After" }));
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it("opens on arriving with openOnFocus, without taking focus, and stays open between the ends", async () => {
      const user = userEvent.setup();
      render(<TimeRangePicker aria-label="r" hourCycle="24" sharedPicker openOnFocus />);
      await user.click(part("Start time", "Hour"));
      await screen.findByRole("dialog");
      expect(part("Start time", "Hour")).toHaveFocus();
      await user.click(part("End time", "Hour"));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: "Choose time" })).toHaveLength(1);
    });

    it("needs showPicker, and is disabled with the range", () => {
      const { rerender } = render(<TimeRangePicker aria-label="r" sharedPicker showPicker={false} />);
      expect(screen.queryByRole("button", { name: "Choose time" })).not.toBeInTheDocument();
      rerender(<TimeRangePicker aria-label="r" sharedPicker disabled />);
      expect(screen.getByRole("button", { name: "Choose time" })).toBeDisabled();
    });
  });

  it("has no axe violations, closed and with an end's picker open", { timeout: 30_000 }, async () => {
    const { container, unmount } = render(<TimeRangePicker aria-label="Opening hours" defaultValue={["09:00", "17:30"]} />);
    expect(await axe(container)).toHaveNoViolations();
    unmount();
    const user = userEvent.setup();
    render(<TimeRangePicker aria-label="Opening hours" defaultValue={["09:00", ""]} />);
    await user.click(within(field("End time")).getByRole("button", { name: "Choose time" }));
    await screen.findByRole("dialog");
    expect(await axe(screen.getByRole("dialog"), { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });
});
