import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import styles from "../Slider/Slider.module.css";
import { FormField } from "../FormField";
import { RangeSlider } from "./RangeSlider";
import type { RangeSliderValue } from "./RangeSlider.types";

const thumbs = () => screen.getAllByRole("slider");
const lower = () => screen.getByRole("slider", { name: /Minimum/ });
const upper = () => screen.getByRole("slider", { name: /Maximum/ });
const tagged = (n: number) => `<${n}>`;
// The range text wraps each number in a bidirectional isolate, so it reads left to right in a page of either script.
const isolated = (text: string) => `\u2068${text}\u2069`;
const rangeOf = (low: string, high: string) => `${isolated(low)} – ${isolated(high)}`;

describe("RangeSlider", () => {
  it("renders two slider thumbs spanning the whole track by default", () => {
    render(<RangeSlider aria-label="Price" />);
    expect(thumbs()).toHaveLength(2);
    expect(lower()).toHaveAttribute("aria-valuenow", "0");
    expect(upper()).toHaveAttribute("aria-valuenow", "100");
    expect(lower()).toHaveAttribute("aria-valuemin", "0");
    expect(upper()).toHaveAttribute("aria-valuemax", "100");
  });

  it("starts at defaultValue when uncontrolled, and spans min to max when it is left out", () => {
    const { unmount } = render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} />);
    expect(lower()).toHaveAttribute("aria-valuenow", "20");
    expect(upper()).toHaveAttribute("aria-valuenow", "80");
    unmount();
    render(<RangeSlider aria-label="Price" min={10} max={50} />);
    expect(lower()).toHaveAttribute("aria-valuenow", "10");
    expect(upper()).toHaveAttribute("aria-valuenow", "50");
  });

  it("moves each thumb by step with the arrow keys and reports the pair, lower first", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} step={5} onValueChange={onValueChange} />);
    lower().focus();
    await user.keyboard("{ArrowRight}");
    expect(lower()).toHaveAttribute("aria-valuenow", "25");
    expect(onValueChange).toHaveBeenLastCalledWith([25, 80]);

    upper().focus();
    await user.keyboard("{ArrowLeft}");
    expect(upper()).toHaveAttribute("aria-valuenow", "75");
    expect(onValueChange).toHaveBeenLastCalledWith([25, 75]);
  });

  describe("Home and End", () => {
    // Radix moves the first thumb on Home and the last on End whichever thumb
    // has focus; each thumb here goes to its own limit instead.
    it("sends the focused thumb to its own limit — and never moves the other", async () => {
      const user = userEvent.setup();
      render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} />);
      lower().focus();
      await user.keyboard("{End}");
      // The lower thumb goes as far as the upper one; the upper thumb stays put.
      expect(lower()).toHaveAttribute("aria-valuenow", "80");
      expect(upper()).toHaveAttribute("aria-valuenow", "80");
      await user.keyboard("{Home}");
      expect(lower()).toHaveAttribute("aria-valuenow", "0");
      expect(upper()).toHaveAttribute("aria-valuenow", "80");

      upper().focus();
      await user.keyboard("{Home}");
      // The upper thumb goes as far down as the lower one.
      expect(upper()).toHaveAttribute("aria-valuenow", "0");
      expect(lower()).toHaveAttribute("aria-valuenow", "0");
      await user.keyboard("{End}");
      expect(upper()).toHaveAttribute("aria-valuenow", "100");
      expect(lower()).toHaveAttribute("aria-valuenow", "0");
    });

    it("keeps the thumbs minStepsBetweenThumbs steps apart", async () => {
      const user = userEvent.setup();
      render(<RangeSlider aria-label="Price" defaultValue={[40, 60]} step={5} minStepsBetweenThumbs={2} />);
      lower().focus();
      await user.keyboard("{End}");
      // 2 steps of 5 below the upper thumb.
      expect(lower()).toHaveAttribute("aria-valuenow", "50");
      expect(upper()).toHaveAttribute("aria-valuenow", "60");
      upper().focus();
      await user.keyboard("{Home}");
      expect(upper()).toHaveAttribute("aria-valuenow", "60");
      expect(lower()).toHaveAttribute("aria-valuenow", "50");
    });

    it("stays on the step grid for a fractional step", async () => {
      const user = userEvent.setup();
      render(<RangeSlider aria-label="Ratio" min={0} max={1} step={0.1} defaultValue={[0.1, 0.7]} minStepsBetweenThumbs={3} />);
      lower().focus();
      await user.keyboard("{End}");
      // 0.7 - 3 * 0.1, not 0.39999999999999997.
      expect(lower()).toHaveAttribute("aria-valuenow", "0.4");
    });

    it("reports the new pair to onValueChange and onValueCommit, once, and not when nothing moves", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const onValueCommit = vi.fn();
      render(
        <RangeSlider aria-label="Price" defaultValue={[20, 80]} onValueChange={onValueChange} onValueCommit={onValueCommit} />,
      );
      upper().focus();
      await user.keyboard("{End}");
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith([20, 100]);
      expect(onValueCommit).toHaveBeenCalledTimes(1);
      expect(onValueCommit).toHaveBeenCalledWith([20, 100]);
      await user.keyboard("{End}");
      expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it("works when controlled, leaving the parent in charge of the value", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<RangeSlider aria-label="Price" value={[20, 80]} onValueChange={onValueChange} />);
      lower().focus();
      await user.keyboard("{Home}");
      expect(onValueChange).toHaveBeenCalledWith([0, 80]);
      // The parent did not update, so the thumb has not moved.
      expect(lower()).toHaveAttribute("aria-valuenow", "20");
    });

    it("does nothing when disabled", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} disabled onValueChange={onValueChange} />);
      lower().focus();
      await user.keyboard("{Home}{End}");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("leaves the other keys to Radix: an arrow key moves only the focused thumb", async () => {
      const user = userEvent.setup();
      render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} />);
      upper().focus();
      await user.keyboard("{ArrowLeft}{PageDown}");
      expect(upper()).toHaveAttribute("aria-valuenow", "69");
      expect(lower()).toHaveAttribute("aria-valuenow", "20");
    });
  });

  it("calls onValueCommit with the pair once a keyboard step completes, distinct from onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(
      <RangeSlider
        aria-label="Price"
        defaultValue={[20, 80]}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />,
    );
    upper().focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith([20, 81]);
    expect(onValueCommit).toHaveBeenCalledWith([20, 81]);
  });

  it("supports fully controlled usage", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [range, setRange] = useState<RangeSliderValue>([10, 90]);
      return (
        <>
          <RangeSlider aria-label="Price" value={range} onValueChange={setRange} />
          <p data-testid="live">{`${range[0]}-${range[1]}`}</p>
        </>
      );
    }
    render(<Controlled />);
    lower().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByTestId("live")).toHaveTextContent("12-90");
    expect(lower()).toHaveAttribute("aria-valuenow", "12");
  });

  it("does not respond to keyboard input when disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} disabled onValueChange={onValueChange} />);
    lower().focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(lower()).toHaveAttribute("aria-valuenow", "20");
  });

  describe("accessible names", () => {
    it("adds Minimum and Maximum to an aria-label", () => {
      render(<RangeSlider aria-label="Price" />);
      expect(screen.getByRole("slider", { name: "Price Minimum" })).toBeInTheDocument();
      expect(screen.getByRole("slider", { name: "Price Maximum" })).toBeInTheDocument();
    });

    it("adds Minimum and Maximum to a visible label named by aria-labelledby", () => {
      render(
        <>
          <span id="price-label">Price</span>
          <RangeSlider aria-labelledby="price-label" />
        </>,
      );
      expect(screen.getByRole("slider", { name: "Price Minimum" })).toBeInTheDocument();
      expect(screen.getByRole("slider", { name: "Price Maximum" })).toBeInTheDocument();
    });

    it("lets labels rename the thumbs", () => {
      render(<RangeSlider aria-label="Preis" labels={{ minimum: "von", maximum: "bis" }} />);
      expect(screen.getByRole("slider", { name: "Preis von" })).toBeInTheDocument();
      expect(screen.getByRole("slider", { name: "Preis bis" })).toBeInTheDocument();
    });

    it("puts id on the lower thumb, so a label's htmlFor focuses it, and derives the upper thumb's from it", () => {
      render(<RangeSlider aria-label="Price" id="price" />);
      expect(lower()).toHaveAttribute("id", "price");
      expect(upper()).toHaveAttribute("id", "price-maximum");
    });

    it("gives the thumbs distinct generated ids when none is passed", () => {
      render(<RangeSlider aria-label="Price" />);
      const [first, second] = thumbs();
      expect(first?.id).toBeTruthy();
      expect(second?.id).toBeTruthy();
      expect(first?.id).not.toBe(second?.id);
    });

    it("forwards aria-describedby to both thumbs", () => {
      render(<RangeSlider aria-label="Price" aria-describedby="help" />);
      for (const thumb of thumbs()) expect(thumb).toHaveAttribute("aria-describedby", "help");
    });

    it("warns in development when rendered with no accessible name, once", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(<RangeSlider />);
      rerender(<RangeSlider />);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("no accessible name"));
      warnSpy.mockRestore();
    });

    it("does not warn when aria-label is provided", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(<RangeSlider aria-label="Price" />);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  it("sets aria-invalid on both thumbs with hasError, and not otherwise", () => {
    const { unmount } = render(<RangeSlider aria-label="Price" hasError />);
    for (const thumb of thumbs()) expect(thumb).toHaveAttribute("aria-invalid", "true");
    unmount();
    render(<RangeSlider aria-label="Price" />);
    for (const thumb of thumbs()) expect(thumb).not.toHaveAttribute("aria-invalid");
  });

  it("lets a consumer's aria-invalid never override the computed one", () => {
    render(<RangeSlider aria-label="Price" hasError={false} {...{ "aria-invalid": true }} />);
    // `aria-invalid` on the root is not a thumb prop — the thumbs stay valid.
    for (const thumb of thumbs()) expect(thumb).not.toHaveAttribute("aria-invalid");
  });

  it("focuses the lower thumb on mount with autoFocus", () => {
    // Not React's own `autoFocus` on the thumb, which only works on a button,
    // input, select or textarea: the component focuses the lower thumb itself.
    // eslint-disable-next-line jsx-a11y/no-autofocus -- exercising the component's own opt-in prop
    render(<RangeSlider aria-label="Price" autoFocus />);
    expect(lower()).toHaveFocus();
  });

  it("does not focus anything on mount without autoFocus", () => {
    render(<RangeSlider aria-label="Price" />);
    expect(document.body).toHaveFocus();
  });

  it("tabs through the lower thumb, then the upper", async () => {
    const user = userEvent.setup();
    render(<RangeSlider aria-label="Price" />);
    await user.tab();
    expect(lower()).toHaveFocus();
    await user.tab();
    expect(upper()).toHaveFocus();
  });

  it("applies the size class and the error class", () => {
    const { container } = render(<RangeSlider aria-label="Price" size="xl" hasError />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass(styles.sizeXl as string);
    expect(root).toHaveClass(styles.error as string);
  });

  it("supports vertical orientation", () => {
    render(<RangeSlider aria-label="Price" orientation="vertical" />);
    for (const thumb of thumbs()) expect(thumb).toHaveAttribute("aria-orientation", "vertical");
  });

  it("puts data-testid and className on the root, and forwards ref to it", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<RangeSlider aria-label="Price" ref={ref} data-testid="range" className="custom" />);
    const root = screen.getByTestId("range");
    expect(root).toHaveClass("custom");
    expect(ref.current).toBe(root);
    expect(root).toContainElement(lower());
    expect(root).toContainElement(upper());
  });

  it("submits both values under name[] from hidden inputs inside a form", () => {
    const { container } = render(
      <form>
        <RangeSlider aria-label="Price" name="price" defaultValue={[20, 80]} />
      </form>,
    );
    const inputs = container.querySelectorAll<HTMLInputElement>('input[name="price[]"]');
    expect([...inputs].map((input) => input.value)).toEqual(["20", "80"]);
  });

  describe("showValue", () => {
    it("shows the range as text, and follows changes", async () => {
      const user = userEvent.setup();
      render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} showValue />);
      expect(screen.getByText(rangeOf("20", "80"))).toBeInTheDocument();
      lower().focus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByText(rangeOf("21", "80"))).toBeInTheDocument();
    });

    it("shows no value label by default", () => {
      render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} />);
      expect(screen.queryByText(rangeOf("20", "80"))).not.toBeInTheDocument();
    });

    it("lets labels.range write the text, given the plain numbers", () => {
      const range = vi.fn((low: number, high: number) => `${low} to ${high}`);
      render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} showValue labels={{ range }} />);
      expect(screen.getByText("20 to 80")).toBeInTheDocument();
      expect(range).toHaveBeenCalledWith(20, 80);
    });
  });

  describe("showMinMaxLabels and ticks", () => {
    it("shows min and max labels at each end", () => {
      render(<RangeSlider aria-label="Price" min={10} max={90} showMinMaxLabels />);
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("90")).toBeInTheDocument();
    });

    it("places the slider and the min/max row in the same grid column when shown with the value", () => {
      const { container } = render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} showValue showMinMaxLabels />);
      const sliderSlot = container.querySelector(`.${styles.combinedSlider}`);
      const minMaxRow = container.querySelector(`.${styles.combinedMinMaxRow}`);
      expect(sliderSlot).not.toBeNull();
      expect(minMaxRow).not.toBeNull();
      expect(getComputedStyle(sliderSlot as Element).gridColumn).toBe(
        getComputedStyle(minMaxRow as Element).gridColumn,
      );
    });

    it("renders one tick per tickInterval, excluding min and max, hidden from assistive tech", () => {
      const { container } = render(<RangeSlider aria-label="Price" showTicks tickInterval={25} />);
      const ticks = container.querySelectorAll(`.${styles.tick}`);
      expect(ticks).toHaveLength(3);
      for (const tick of ticks) expect(tick).toHaveAttribute("aria-hidden", "true");
    });

    it("renders no ticks when showTicks is off", () => {
      const { container } = render(<RangeSlider aria-label="Price" />);
      expect(container.querySelectorAll(`.${styles.tick}`)).toHaveLength(0);
    });
  });

  describe("showValueTooltip", () => {
    it("shows the hovered thumb's own value, and not the other's", async () => {
      const user = userEvent.setup();
      render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} showValueTooltip />);
      await user.hover(upper());
      expect(await screen.findByRole("tooltip")).toHaveTextContent("80");
      expect(screen.getAllByRole("tooltip")).toHaveLength(1);
    });

    it("shows no tooltip by default", async () => {
      const user = userEvent.setup();
      render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} />);
      await user.hover(upper());
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("keeps a thumb's tooltip open through a press and release, and closes it when hover ends", async () => {
      render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} showValueTooltip />);
      const thumb = lower();
      fireEvent.pointerEnter(thumb);
      expect(await screen.findByRole("tooltip")).toHaveTextContent("20");
      fireEvent.pointerDown(thumb);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      fireEvent.pointerUp(thumb);
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      fireEvent.pointerLeave(thumb);
      await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
    });

    it("opens on keyboard focus alone, for that thumb only", async () => {
      const user = userEvent.setup();
      render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} showValueTooltip />);
      await user.tab();
      expect(await screen.findByRole("tooltip")).toHaveTextContent("20");
      await user.tab();
      await waitFor(() => expect(screen.getByRole("tooltip")).toHaveTextContent("80"));
      expect(screen.getAllByRole("tooltip")).toHaveLength(1);
    });
  });

  describe("formatNumber", () => {
    it("writes the range, the tooltip and the min and max labels with it", async () => {
      const user = userEvent.setup();
      render(
        <RangeSlider aria-label="Price" defaultValue={[20, 80]} showValue showValueTooltip showMinMaxLabels formatNumber={tagged} />,
      );
      expect(screen.getByText(rangeOf("<20>", "<80>"))).toBeInTheDocument();
      expect(screen.getByText("<0>")).toBeInTheDocument();
      expect(screen.getByText("<100>")).toBeInTheDocument();
      await user.hover(lower());
      expect(await screen.findByRole("tooltip")).toHaveTextContent("<20>");
    });

    it("announces the formatted number on each thumb, and follows changes", async () => {
      const user = userEvent.setup();
      render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} formatNumber={tagged} />);
      expect(lower()).toHaveAttribute("aria-valuetext", "<20>");
      expect(upper()).toHaveAttribute("aria-valuetext", "<80>");
      lower().focus();
      await user.keyboard("{ArrowRight}");
      expect(lower()).toHaveAttribute("aria-valuetext", "<21>");
    });

    it("announces the plain number when there is no formatter", () => {
      render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} />);
      expect(lower()).not.toHaveAttribute("aria-valuetext");
    });

    it("gives the callbacks and the form the plain numbers", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const { container } = render(
        <form>
          <RangeSlider aria-label="Price" name="price" defaultValue={[20, 80]} formatNumber={tagged} onValueChange={onValueChange} />
        </form>,
      );
      lower().focus();
      await user.keyboard("{ArrowRight}");
      expect(onValueChange).toHaveBeenCalledWith([21, 80]);
      const inputs = container.querySelectorAll<HTMLInputElement>('input[name="price[]"]');
      expect([...inputs].map((input) => input.value)).toEqual(["21", "80"]);
    });

    it("lets labels.range receive plain numbers for the consumer to format", () => {
      render(
        <RangeSlider
          aria-label="Price"
          defaultValue={[20, 80]}
          showValue
          formatNumber={tagged}
          labels={{ range: (low, high) => `${tagged(low)} → ${tagged(high)}` }}
        />,
      );
      expect(screen.getByText("<20> → <80>")).toBeInTheDocument();
    });
  });

  describe("dir", () => {
    it("is left-to-right by default", () => {
      const { container } = render(<RangeSlider aria-label="Price" showValue showMinMaxLabels />);
      expect(container.firstElementChild).toHaveAttribute("dir", "ltr");
    });

    it("stays left-to-right inside a right-to-left page when dir is left out", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div dir="rtl">
          <RangeSlider aria-label="Price" defaultValue={[20, 80]} showMinMaxLabels />
        </div>,
      );
      expect(container.querySelector(`.${styles.minMaxWrapper}`)).toHaveAttribute("dir", "ltr");
      lower().focus();
      await user.keyboard("{ArrowRight}");
      expect(lower()).toHaveAttribute("aria-valuenow", "21");
    });

    it("mirrors with dir=\"rtl\": every wrapper gets it, and ArrowLeft raises a thumb", async () => {
      const user = userEvent.setup();
      const { container } = render(<RangeSlider aria-label="Price" dir="rtl" defaultValue={[20, 80]} showValue showMinMaxLabels />);
      for (const element of container.querySelectorAll(`.${styles.combinedWrapper}, .${styles.combinedSlider}, .${styles.combinedMinMaxRow}, .${styles.root}`)) {
        expect(element).toHaveAttribute("dir", "rtl");
      }
      lower().focus();
      await user.keyboard("{ArrowLeft}");
      expect(lower()).toHaveAttribute("aria-valuenow", "21");
      upper().focus();
      await user.keyboard("{ArrowRight}");
      expect(upper()).toHaveAttribute("aria-valuenow", "79");
    });

    it("still sends each thumb to its own limit on Home and End in right-to-left", async () => {
      const user = userEvent.setup();
      render(<RangeSlider aria-label="Price" dir="rtl" defaultValue={[20, 80]} />);
      lower().focus();
      await user.keyboard("{Home}");
      expect(lower()).toHaveAttribute("aria-valuenow", "0");
      expect(upper()).toHaveAttribute("aria-valuenow", "80");
      upper().focus();
      await user.keyboard("{End}");
      expect(upper()).toHaveAttribute("aria-valuenow", "100");
      expect(lower()).toHaveAttribute("aria-valuenow", "0");
    });
  });

  describe("an invalid value", () => {
    it("warns once in development for an unsorted pair", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(<RangeSlider aria-label="Price" value={[80, 20]} />);
      rerender(<RangeSlider aria-label="Price" value={[90, 20]} />);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("lower first"));
      warnSpy.mockRestore();
    });

    it("warns for a value outside the track, from defaultValue as well", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(<RangeSlider aria-label="Price" defaultValue={[-50, 500]} />);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("outside the track"));
      warnSpy.mockRestore();
    });

    it("does not warn for a valid pair, including one thumb on each end and both on the same value", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(<RangeSlider aria-label="Price" value={[0, 100]} />);
      rerender(<RangeSlider aria-label="Price" value={[50, 50]} />);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe("inside a FormField", () => {
    // `FormField` hands back id, aria-labelledby, aria-describedby, hasError, disabled and required to spread
    // onto its control; the slider has to turn those into named, described thumbs.
    it("names each thumb from the field's label and describes both with its helper text", () => {
      render(
        <FormField label="Price" helperText="Between 0 and 100">
          {(fieldProps) => <RangeSlider {...fieldProps} defaultValue={[20, 80]} />}
        </FormField>,
      );
      expect(screen.getByRole("slider", { name: "Price Minimum" })).toBeInTheDocument();
      expect(screen.getByRole("slider", { name: "Price Maximum" })).toBeInTheDocument();
      for (const thumb of thumbs()) expect(thumb).toHaveAccessibleDescription("Between 0 and 100");
    });

    it("carries the field's error state and disabled state to both thumbs", () => {
      render(
        <FormField label="Price" error="Pick a range" disabled>
          {(fieldProps) => <RangeSlider {...fieldProps} defaultValue={[20, 80]} />}
        </FormField>,
      );
      for (const thumb of thumbs()) {
        expect(thumb).toHaveAttribute("aria-invalid", "true");
        expect(thumb).toHaveAccessibleDescription("Pick a range");
        expect(thumb).toHaveAttribute("data-disabled");
      }
    });

    it("has no accessibility violations", async () => {
      const { container } = render(
        <FormField label="Price" helperText="Between 0 and 100" required>
          {(fieldProps) => <RangeSlider {...fieldProps} defaultValue={[20, 80]} />}
        </FormField>,
      );
      expect((await axe(container)).violations).toHaveLength(0);
    });
  });

  it("survives React StrictMode", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <RangeSlider aria-label="Price" defaultValue={[20, 80]} showValue />
      </StrictMode>,
    );
    lower().focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText(rangeOf("21", "80"))).toBeInTheDocument();
  });

  describe("accessibility", () => {
    it.each([
      ["default", {}],
      ["with an error", { hasError: true }],
      ["disabled", { disabled: true }],
      ["with the value shown", { showValue: true }],
      ["vertical, with everything shown", { orientation: "vertical" as const, showValue: true, showMinMaxLabels: true }],
      ["with a tooltip, min and max labels, and ticks", { showValueTooltip: true, showMinMaxLabels: true, showTicks: true, tickInterval: 25 }],
      ["with a formatter", { showValue: true, formatNumber: tagged }],
      ["right to left, with everything shown", { dir: "rtl" as const, showValue: true, showMinMaxLabels: true, showTicks: true, tickInterval: 25 }],
    ])("has no violations, %s", async (_name, extra) => {
      const { container } = render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} {...extra} />);
      expect((await axe(container)).violations).toHaveLength(0);
    });

    it("has no violations when named by a visible label", async () => {
      const { container } = render(
        <>
          <span id="price-label">Price</span>
          <RangeSlider aria-labelledby="price-label" aria-describedby="help" />
          <p id="help">Between 0 and 100</p>
        </>,
      );
      expect((await axe(container)).violations).toHaveLength(0);
    });
  });
});

describe("RangeSlider labels that are undefined", () => {
  it("keeps the default thumb names", () => {
    render(<RangeSlider aria-label="Price" defaultValue={[20, 80]} labels={{ minimum: undefined, maximum: undefined }} />);
    expect(screen.getByRole("slider", { name: "Price Minimum" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Price Maximum" })).toBeInTheDocument();
  });
});
