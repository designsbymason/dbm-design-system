import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { StrictMode, createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RatingInput } from "./RatingInput";

const radios = () => screen.getAllByRole("radio") as HTMLInputElement[];
const checked = () => radios().find((radio) => radio.checked)?.value;
const fills = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("[data-fill]")).map((item) => Number(item.dataset.fill));

describe("RatingInput", () => {
  it("is a radio group with one named radio for each value", () => {
    render(<RatingInput aria-label="Rating" />);
    expect(screen.getByRole("radiogroup", { name: "Rating" })).toBeInTheDocument();
    expect(radios().map((radio) => radio.getAttribute("aria-label"))).toEqual([
      "1 out of 5",
      "2 out of 5",
      "3 out of 5",
      "4 out of 5",
      "5 out of 5",
    ]);
    expect(checked()).toBeUndefined();
  });

  it("draws an outline and a filled icon for each value, hidden from assistive technology", () => {
    const { container } = render(<RatingInput aria-label="Rating" max={3} />);
    expect(container.querySelectorAll("svg")).toHaveLength(6);
    expect(container.querySelectorAll("[aria-hidden='true'] svg")).toHaveLength(6);
  });

  it("takes a custom number of icons, falling back to five for an invalid one", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { rerender } = render(<RatingInput aria-label="Rating" max={3} />);
    expect(radios()).toHaveLength(3);
    rerender(<RatingInput aria-label="Rating" max={0} />);
    expect(radios()).toHaveLength(5);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`max` must be a whole number"));
    warn.mockRestore();
  });

  describe("choosing", () => {
    it("chooses with a press and reports the value", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { container } = render(<RatingInput aria-label="Rating" onValueChange={onValueChange} />);
      await user.click(radios()[2] as HTMLElement);
      expect(checked()).toBe("3");
      expect(onValueChange).toHaveBeenCalledWith(3);
      expect(fills(container)).toEqual([1, 1, 1, 0, 0]);
    });

    it("starts at defaultValue", () => {
      const { container } = render(<RatingInput aria-label="Rating" defaultValue={4} />);
      expect(checked()).toBe("4");
      expect(fills(container)).toEqual([1, 1, 1, 1, 0]);
    });

    it("moves and chooses with the arrow keys, from a single tab stop", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <>
          <button type="button">before</button>
          <RatingInput aria-label="Rating" defaultValue={2} onValueChange={onValueChange} />
          <button type="button">after</button>
        </>,
      );
      await user.click(screen.getByRole("button", { name: "before" }));
      await user.tab();
      expect(radios()[1]).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(checked()).toBe("3");
      expect(onValueChange).toHaveBeenLastCalledWith(3);
      await user.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(checked()).toBe("1");
      await user.tab();
      expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
    });

    it("follows a controlled value, frozen without a handler that updates it", async () => {
      const user = userEvent.setup();
      render(<RatingInput aria-label="Rating" value={2} onValueChange={() => undefined} />);
      await user.click(radios()[4] as HTMLElement);
      expect(checked()).toBe("2");
    });

    it("works controlled with state", async () => {
      const user = userEvent.setup();
      function Controlled() {
        const [rating, setRating] = useState(0);
        return (
          <>
            <RatingInput aria-label="Rating" value={rating} onValueChange={setRating} />
            <button type="button" onClick={() => setRating(5)}>
              five
            </button>
          </>
        );
      }
      render(<Controlled />);
      await user.click(radios()[1] as HTMLElement);
      expect(checked()).toBe("2");
      await user.click(screen.getByRole("button", { name: "five" }));
      expect(checked()).toBe("5");
    });

    it("clamps a value to the range, and reads one that is not a number as no rating", () => {
      const { container, rerender } = render(<RatingInput aria-label="Rating" value={9} onValueChange={() => undefined} />);
      expect(fills(container)).toEqual([1, 1, 1, 1, 1]);
      rerender(<RatingInput aria-label="Rating" value={-2} onValueChange={() => undefined} />);
      expect(fills(container)).toEqual([0, 0, 0, 0, 0]);
      rerender(<RatingInput aria-label="Rating" value={Number.NaN} onValueChange={() => undefined} />);
      expect(fills(container)).toEqual([0, 0, 0, 0, 0]);
      rerender(<RatingInput aria-label="Rating" value={null as unknown as number} onValueChange={() => undefined} />);
      expect(fills(container)).toEqual([0, 0, 0, 0, 0]);
    });

    it("shows a value between whole steps as the nearest step", () => {
      const { container } = render(<RatingInput aria-label="Rating" value={3.6} onValueChange={() => undefined} />);
      expect(fills(container)).toEqual([1, 1, 1, 1, 0]);
    });

    it("warns in development about value with defaultValue", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<RatingInput aria-label="Rating" value={2} defaultValue={3} onValueChange={() => undefined} />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("either `value` or `defaultValue`"));
      warn.mockRestore();
    });
  });

  describe("half steps", () => {
    it("has two radios for each icon, named by the half", () => {
      render(<RatingInput aria-label="Rating" precision={0.5} max={3} />);
      expect(radios().map((radio) => radio.value)).toEqual(["0.5", "1", "1.5", "2", "2.5", "3"]);
      expect(radios()[0]).toHaveAttribute("aria-label", "0.5 out of 3");
    });

    it("chooses a half, fills half an icon, and steps by halves with the arrow keys", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { container } = render(<RatingInput aria-label="Rating" precision={0.5} onValueChange={onValueChange} />);
      await user.click(radios()[6] as HTMLElement);
      expect(onValueChange).toHaveBeenCalledWith(3.5);
      expect(fills(container)).toEqual([1, 1, 1, 0.5, 0]);
      await user.keyboard("{ArrowRight}");
      expect(checked()).toBe("4");
      await user.keyboard("{ArrowLeft}{ArrowLeft}");
      expect(checked()).toBe("3");
    });

    it("snaps a value to the nearest half", () => {
      const { container } = render(<RatingInput aria-label="Rating" precision={0.5} value={2.3} onValueChange={() => undefined} />);
      expect(fills(container)).toEqual([1, 1, 0.5, 0, 0]);
    });

    it("warns about an invalid precision and uses whole steps", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<RatingInput aria-label="Rating" precision={0.25 as 1} />);
      expect(radios()).toHaveLength(5);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`precision` must be 1 or 0.5"));
      warn.mockRestore();
    });
  });

  describe("clearable", () => {
    it("takes the rating back when the chosen value is pressed again", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { container } = render(<RatingInput aria-label="Rating" clearable defaultValue={3} onValueChange={onValueChange} />);
      await user.click(radios()[2] as HTMLElement);
      expect(onValueChange).toHaveBeenCalledWith(0);
      expect(checked()).toBeUndefined();
      // The pointer is still over the icon, which previews it until the pointer leaves.
      fireEvent.pointerLeave(screen.getByRole("radiogroup"));
      expect(fills(container)).toEqual([0, 0, 0, 0, 0]);
    });

    it.each(["Backspace", "Delete", "Escape"])("takes the rating back with %s", async (key) => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<RatingInput aria-label="Rating" clearable defaultValue={3} onValueChange={onValueChange} />);
      await user.tab();
      await user.keyboard(`{${key}}`);
      expect(onValueChange).toHaveBeenCalledWith(0);
      expect(checked()).toBeUndefined();
    });

    it("does not clear unless it is clearable", async () => {
      const user = userEvent.setup();
      render(<RatingInput aria-label="Rating" defaultValue={3} />);
      await user.click(radios()[2] as HTMLElement);
      expect(checked()).toBe("3");
      await user.keyboard("{Backspace}");
      expect(checked()).toBe("3");
    });

    it("lets a key handler stop the clearing", async () => {
      const user = userEvent.setup();
      render(<RatingInput aria-label="Rating" clearable defaultValue={3} onKeyDown={(event) => event.preventDefault()} />);
      await user.tab();
      await user.keyboard("{Escape}");
      expect(checked()).toBe("3");
    });
  });

  describe("hover preview", () => {
    it("lights the icons under a mouse pointer without choosing, and puts them back on leaving", () => {
      const { container } = render(<RatingInput aria-label="Rating" defaultValue={1} />);
      fireEvent.pointerEnter(radios()[3] as HTMLElement, { pointerType: "mouse" });
      expect(fills(container)).toEqual([1, 1, 1, 1, 0]);
      expect(checked()).toBe("1");
      fireEvent.pointerLeave(screen.getByRole("radiogroup"));
      expect(fills(container)).toEqual([1, 0, 0, 0, 0]);
    });

    it("ignores touch and pen pointers", () => {
      const { container } = render(<RatingInput aria-label="Rating" />);
      fireEvent.pointerEnter(radios()[3] as HTMLElement, { pointerType: "touch" });
      expect(fills(container)).toEqual([0, 0, 0, 0, 0]);
    });

    it("does not preview when disabled", () => {
      const { container } = render(<RatingInput aria-label="Rating" disabled />);
      fireEvent.pointerEnter(radios()[3] as HTMLElement, { pointerType: "mouse" });
      expect(fills(container)).toEqual([0, 0, 0, 0, 0]);
    });

    it("calls the consumer's pointer-leave handler too", () => {
      const onPointerLeave = vi.fn();
      render(<RatingInput aria-label="Rating" onPointerLeave={onPointerLeave} />);
      fireEvent.pointerLeave(screen.getByRole("radiogroup"));
      expect(onPointerLeave).toHaveBeenCalledTimes(1);
    });
  });

  it("stops previewing the pointer's icon once the keyboard is used", async () => {
    const user = userEvent.setup();
    const { container } = render(<RatingInput aria-label="Rating" defaultValue={2} />);
    await user.tab();
    fireEvent.pointerEnter(radios()[4] as HTMLElement, { pointerType: "mouse" });
    expect(fills(container)).toEqual([1, 1, 1, 1, 1]);
    await user.keyboard("{ArrowRight}");
    expect(fills(container)).toEqual([1, 1, 1, 0, 0]);
  });

  describe("read-only", () => {
    it("is one image with a text alternative, not a group of choices", () => {
      render(<RatingInput aria-label="Average rating" readOnly value={4.3} />);
      expect(screen.queryAllByRole("radio")).toHaveLength(0);
      expect(screen.getByRole("img", { name: "Average rating, Rated 4.3 out of 5" })).toBeInTheDocument();
    });

    it("draws a value exactly, filling part of an icon", () => {
      const { container } = render(<RatingInput aria-label="Rating" readOnly value={3.3} />);
      const [first, , , fourth, fifth] = fills(container);
      expect(first).toBe(1);
      expect(fourth).toBeCloseTo(0.3);
      expect(fifth).toBe(0);
    });

    it("says when there is no rating", () => {
      render(<RatingInput readOnly value={0} />);
      expect(screen.getByRole("img", { name: "Not rated" })).toBeInTheDocument();
    });

    it("submits its value under the name with a hidden input", () => {
      const { container } = render(
        <form>
          <RatingInput aria-label="Rating" readOnly value={3.5} name="stars" />
        </form>,
      );
      expect(new FormData(container.querySelector("form") as HTMLFormElement).get("stars")).toBe("3.5");
    });

    it("includes the labelled-by element in its name", () => {
      render(
        <>
          <span id="what">Average rating</span>
          <RatingInput readOnly value={2} aria-labelledby="what" id="r" />
        </>,
      );
      expect(screen.getByRole("img")).toHaveAccessibleName("Average rating Rated 2 out of 5");
    });
  });

  describe("states", () => {
    it("sets aria-invalid for hasError", () => {
      render(<RatingInput aria-label="Rating" hasError />);
      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-invalid", "true");
    });

    it("disables every radio", () => {
      render(<RatingInput aria-label="Rating" disabled />);
      expect(radios().every((radio) => radio.disabled)).toBe(true);
      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-disabled", "true");
    });

    it("makes the rating required for forms", () => {
      render(<RatingInput aria-label="Rating" required />);
      expect(radios().every((radio) => radio.required)).toBe(true);
      expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-required", "true");
    });
  });

  describe("forms", () => {
    it("submits the value under its name, as a number", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <RatingInput aria-label="Rating" name="stars" precision={0.5} />
        </form>,
      );
      await user.click(radios()[5] as HTMLElement);
      expect(new FormData(container.querySelector("form") as HTMLFormElement).get("stars")).toBe("3");
    });

    it("belongs to no form, and submits nothing, without a name, yet still moves as one group", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <RatingInput aria-label="Rating" />
        </form>,
      );
      expect(radios()[0]?.form).toBeNull();
      await user.click(radios()[1] as HTMLElement);
      expect([...new FormData(container.querySelector("form") as HTMLFormElement).keys()]).toEqual([]);
      expect(new Set(radios().map((radio) => radio.name)).size).toBe(1);
    });

    it("treats an empty name as no name, so the radios still move as one group", () => {
      render(<RatingInput aria-label="Rating" name="" defaultValue={2} />);
      expect(new Set(radios().map((radio) => radio.name)).size).toBe(1);
      expect(radios()[0]?.name).not.toBe("");
    });

    it("stops a submit while a required rating has no value", async () => {
      const user = userEvent.setup();
      render(
        <form>
          <RatingInput aria-label="Rating" name="stars" required />
        </form>,
      );
      expect(radios()[0]?.checkValidity()).toBe(false);
      await user.click(radios()[0] as HTMLElement);
      expect(radios()[0]?.checkValidity()).toBe(true);
    });
  });

  describe("value names", () => {
    const names = ["Poor", "Fair", "Good", "Great", "Excellent"];

    it("adds each name to its radio's accessible name", () => {
      render(<RatingInput aria-label="Rating" valueNames={names} precision={0.5} />);
      expect(radios().find((radio) => radio.value === "3")).toHaveAttribute("aria-label", "3 out of 5, Good");
      expect(radios().find((radio) => radio.value === "2.5")).toHaveAttribute("aria-label", "2.5 out of 5");
    });

    it("writes the name of the chosen value beside the icons, and of the one under the pointer", () => {
      const { container } = render(<RatingInput aria-label="Rating" valueNames={names} showValueName defaultValue={3} />);
      const active = () => Array.from(container.querySelectorAll("[data-active='true']")).map((slot) => slot.textContent);
      expect(active()).toEqual(["Good"]);
      fireEvent.pointerEnter(radios()[4] as HTMLElement, { pointerType: "mouse" });
      expect(active()).toEqual(["Excellent"]);
      fireEvent.pointerLeave(screen.getByRole("radiogroup"));
      expect(active()).toEqual(["Good"]);
    });

    it("keeps every name in the page so the space for the longest is kept, and hides them from assistive technology", () => {
      const { container } = render(<RatingInput aria-label="Rating" valueNames={names} showValueName />);
      const wrapper = container.querySelector("[class*='valueName']") as HTMLElement;
      expect(wrapper).toHaveAttribute("aria-hidden", "true");
      expect(wrapper.children).toHaveLength(5);
      expect(container.querySelector("[data-active='true']")).toBeNull();
    });

    it("shows the name of the whole value below a half step", () => {
      const { container } = render(<RatingInput aria-label="Rating" valueNames={names} showValueName precision={0.5} defaultValue={3.5} />);
      expect(container.querySelector("[data-active='true']")).toHaveTextContent("Good");
    });

    it("shows nothing at a half step below the first value, and warns when there are no names", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { container } = render(<RatingInput aria-label="Rating" valueNames={names} showValueName precision={0.5} defaultValue={0.5} />);
      expect(container.querySelector("[data-active='true']")).toBeNull();
      render(<RatingInput aria-label="Other" showValueName />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`showValueName` has no text"));
      warn.mockRestore();
    });
  });

  describe("labels and numbers", () => {
    it("translates the text it writes, keeping the default when a label is undefined", () => {
      const { rerender } = render(
        <RatingInput aria-label="Note" labels={{ itemLabel: (value, max) => `${value} sur ${max}` }} />,
      );
      expect(radios()[0]).toHaveAttribute("aria-label", "1 sur 5");
      rerender(<RatingInput aria-label="Note" readOnly value={0} labels={{ notRated: "Sans note" }} />);
      expect(screen.getByRole("img", { name: "Note, Sans note" })).toBeInTheDocument();
      rerender(<RatingInput aria-label="Note" readOnly value={2} labels={{ valueText: undefined }} />);
      expect(screen.getByRole("img", { name: "Note, Rated 2 out of 5" })).toBeInTheDocument();
    });

    it("writes numbers through formatNumber in the default labels, and keeps plain numbers for the callback", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<RatingInput aria-label="Rating" formatNumber={(value) => `#${value}`} onValueChange={onValueChange} />);
      expect(radios()[1]).toHaveAttribute("aria-label", "#2 out of #5");
      await user.click(radios()[1] as HTMLElement);
      expect(onValueChange).toHaveBeenCalledWith(2);
    });
  });

  describe("props and refs", () => {
    it("puts the ref, id, data-testid and aria props on the group, and className and style on the outer box", () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <RatingInput ref={ref} id="x" data-testid="t" aria-label="Rating" aria-describedby="help" className="mine" style={{ margin: "7px" }} />,
      );
      const group = screen.getByRole("radiogroup");
      expect(ref.current).toBe(group);
      expect(group).toHaveAttribute("id", "x");
      expect(group).toHaveAttribute("data-testid", "t");
      expect(group).toHaveAttribute("aria-describedby", "help");
      expect(container.firstElementChild).toHaveClass("mine");
      expect(container.firstElementChild).toHaveStyle({ margin: "7px" });
    });

    it("keeps the role and attributes it computes when a consumer passes the same ones", () => {
      const stray = { role: "button", "aria-invalid": "true" } as const;
      render(<RatingInput aria-label="Rating" {...stray} />);
      expect(screen.getByRole("radiogroup")).not.toHaveAttribute("aria-invalid");
    });

    it("draws the filled icons in the highlight tone by default, and in another when asked", () => {
    const { container, rerender } = render(<RatingInput aria-label="Rating" defaultValue={2} />);
    const filledColor = () => getComputedStyle(container.querySelector("[class*='filled'] svg") as Element).color;
    expect(filledColor()).toBe("var(--dbm-icon-highlight)");
    rerender(<RatingInput aria-label="Rating" defaultValue={2} tone="warning" />);
    expect(filledColor()).toBe("var(--dbm-icon-warning)");
  });

  it("draws any Phosphor icon", () => {
      const Dot = (props: { className?: string }) => <svg data-testid="dot" className={props.className} />;
      render(<RatingInput aria-label="Rating" max={2} icon={Dot as never} />);
      expect(screen.getAllByTestId("dot")).toHaveLength(4);
    });
  });

  it("is always left to right", () => {
    const { container } = render(
      <div dir="rtl">
        <RatingInput aria-label="Rating" />
      </div>,
    );
    expect(container.querySelector("[dir='ltr']")).not.toBeNull();
  });

  it("renders on the server, with every icon", () => {
    const html = renderToString(<RatingInput aria-label="Rating" max={4} defaultValue={2} />);
    expect(html.match(/type="radio"/g)).toHaveLength(4);
  });

  it("works inside StrictMode", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <RatingInput aria-label="Rating" onValueChange={onValueChange} />
      </StrictMode>,
    );
    await user.click(radios()[1] as HTMLElement);
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  describe("accessibility", () => {
    it("has no axe violations", async () => {
      const { container } = render(<RatingInput aria-label="Rating" defaultValue={3} />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations with half steps, names, an error and required", async () => {
      const { container } = render(
        <RatingInput aria-label="Rating" precision={0.5} valueNames={["a", "b", "c", "d", "e"]} showValueName hasError required defaultValue={2.5} />,
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations read-only or disabled", async () => {
      const { container } = render(
        <>
          <RatingInput aria-label="Average" readOnly value={4.2} />
          <RatingInput aria-label="Locked" disabled defaultValue={2} />
        </>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
