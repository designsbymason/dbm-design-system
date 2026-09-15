import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Slider } from "./Slider";
import styles from "./Slider.module.css";

describe("Slider", () => {
  it("renders a native slider role at min by default", () => {
    render(<Slider aria-label="Volume" />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuenow", "0");
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "100");
  });

  it("starts at defaultValue when uncontrolled", () => {
    render(<Slider aria-label="Volume" defaultValue={30} />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "30");
  });

  it("respects custom min/max/step", () => {
    render(<Slider aria-label="Volume" min={10} max={20} step={2} defaultValue={12} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuemin", "10");
    expect(slider).toHaveAttribute("aria-valuemax", "20");
    expect(slider).toHaveAttribute("aria-valuenow", "12");
  });

  it("increments and decrements by step via arrow keys, calling onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider aria-label="Volume" defaultValue={50} step={5} onValueChange={onValueChange} />,
    );
    const slider = screen.getByRole("slider");
    slider.focus();

    await user.keyboard("{ArrowRight}");
    expect(slider).toHaveAttribute("aria-valuenow", "55");
    expect(onValueChange).toHaveBeenCalledWith(55);

    await user.keyboard("{ArrowLeft}");
    expect(slider).toHaveAttribute("aria-valuenow", "50");
    expect(onValueChange).toHaveBeenCalledWith(50);
  });

  it("jumps to min/max via Home/End", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={50} min={0} max={100} />);
    const slider = screen.getByRole("slider");
    slider.focus();

    await user.keyboard("{End}");
    expect(slider).toHaveAttribute("aria-valuenow", "100");

    await user.keyboard("{Home}");
    expect(slider).toHaveAttribute("aria-valuenow", "0");
  });

  it("calls onValueCommit once a keyboard step completes, distinct from onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onValueCommit = vi.fn();
    render(
      <Slider
        aria-label="Volume"
        defaultValue={50}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />,
    );
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith(51);
    expect(onValueCommit).toHaveBeenCalledWith(51);
  });

  it("supports fully controlled usage", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState(20);
      return <Slider aria-label="Volume" value={value} onValueChange={setValue} />;
    }
    render(<Controlled />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuenow", "20");
    slider.focus();
    await user.keyboard("{ArrowRight}");
    expect(slider).toHaveAttribute("aria-valuenow", "21");
  });

  it("does not respond to keyboard input when disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Slider aria-label="Volume" defaultValue={50} disabled onValueChange={onValueChange} />,
    );
    const slider = screen.getByRole("slider");
    slider.focus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute("aria-valuenow", "50");
  });

  it("sets aria-invalid when hasError is true", () => {
    render(<Slider aria-label="Volume" hasError />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid by default", () => {
    render(<Slider aria-label="Volume" />);
    expect(screen.getByRole("slider")).not.toHaveAttribute("aria-invalid");
  });

  it("shows the current value as text when showValue is set", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={42} showValue />);
    expect(screen.getByText("42")).toBeInTheDocument();

    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("43")).toBeInTheDocument();
  });

  it("does not render a value label when showValue is false", () => {
    render(<Slider aria-label="Volume" defaultValue={42} />);
    expect(screen.queryByText("42")).not.toBeInTheDocument();
  });

  it("shows the current value in a tooltip on hover when showValueTooltip is set", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={30} showValueTooltip />);
    await user.hover(screen.getByRole("slider"));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("30");
  });

  it("does not render a tooltip trigger when showValueTooltip is false", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={30} />);
    await user.hover(screen.getByRole("slider"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("prefers aria-valuetext over the raw number in the value tooltip", async () => {
    const user = userEvent.setup();
    render(
      <Slider
        aria-label="Quality"
        defaultValue={2}
        min={1}
        max={3}
        aria-valuetext="Medium"
        showValueTooltip
      />,
    );
    await user.hover(screen.getByRole("slider"));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Medium");
  });

  it("shows min and max labels when showMinMaxLabels is set", () => {
    render(<Slider aria-label="Volume" min={0} max={75} showMinMaxLabels />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();
  });

  it("does not show min/max labels by default", () => {
    render(<Slider aria-label="Volume" min={0} max={75} />);
    expect(screen.queryByText("75")).not.toBeInTheDocument();
  });

  it("renders one tick per tickInterval, inclusive of min and max, when showTicks is set", () => {
    const { container } = render(
      <Slider aria-label="Volume" min={0} max={100} tickInterval={25} showTicks />,
    );
    const ticks = container.querySelectorAll(`.${styles.tick}`);
    expect(ticks).toHaveLength(5); // 0, 25, 50, 75, 100
  });

  it("still places a final tick at max when the range doesn't divide evenly by tickInterval", () => {
    const { container } = render(
      <Slider aria-label="Volume" min={0} max={100} tickInterval={30} showTicks />,
    );
    const ticks = container.querySelectorAll(`.${styles.tick}`);
    // 0, 30, 60, 90, and a final tick at 100 even though 100 isn't a clean
    // multiple of 30 past min — the max end is never silently dropped.
    expect(ticks).toHaveLength(5);
  });

  it("defaults tickInterval to step when not set explicitly", () => {
    const { container } = render(
      <Slider aria-label="Volume" min={0} max={20} step={5} showTicks />,
    );
    const ticks = container.querySelectorAll(`.${styles.tick}`);
    expect(ticks).toHaveLength(5); // 0, 5, 10, 15, 20
  });

  it("renders no ticks when showTicks is false", () => {
    const { container } = render(<Slider aria-label="Volume" tickInterval={10} />);
    expect(container.querySelectorAll(`.${styles.tick}`)).toHaveLength(0);
  });

  it("hides tick marks from assistive tech", () => {
    const { container } = render(
      <Slider aria-label="Volume" tickInterval={25} showTicks />,
    );
    const ticks = container.querySelectorAll(`.${styles.tick}`);
    ticks.forEach((tick) => expect(tick).toHaveAttribute("aria-hidden", "true"));
  });

  it("applies the correct size class", () => {
    // The root element (not the slider role's own immediate parent — Radix
    // inserts its own internal positioning wrapper around the thumb) is
    // always the container's first element child, regardless of that
    // internal structure.
    const { container, rerender } = render(<Slider aria-label="Volume" />);
    expect(container.firstElementChild).toHaveClass(styles.sizeMd as string);

    rerender(<Slider aria-label="Volume" size="xl" />);
    expect(container.firstElementChild).toHaveClass(styles.sizeXl as string);
  });

  it("supports vertical orientation", () => {
    const { container } = render(<Slider aria-label="Volume" orientation="vertical" />);
    expect(container.firstElementChild).toHaveAttribute("data-orientation", "vertical");
    expect(screen.getByRole("slider")).toHaveAttribute("aria-orientation", "vertical");
  });

  it("forwards aria-valuetext as a human-readable alternative", () => {
    render(<Slider aria-label="Quality" defaultValue={2} aria-valuetext="Medium" />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "Medium");
  });

  it("renders a hidden native input for form participation when inside a real form", () => {
    // The underlying Radix primitive only renders this when it can detect
    // real form participation — either a `form` prop, or (as here) an
    // actual ancestor `<form>` — not unconditionally just because `name`
    // is set.
    const { container } = render(
      <form>
        <Slider aria-label="Volume" name="volume" defaultValue={50} />
      </form>,
    );
    const hiddenInput = container.querySelector('input[name="volume"]');
    expect(hiddenInput).toBeInTheDocument();
  });

  it("forwards ref to the slider's own root element", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Slider aria-label="Volume" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(ref.current).toContainElement(screen.getByRole("slider"));
  });

  it("warns in development when rendered with no accessible name", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Slider />);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("no accessible name"),
    );
    warnSpy.mockRestore();
  });

  it("does not warn when aria-label is provided", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Slider aria-label="Volume" />);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("has no accessibility violations, default, with an error, disabled, or with showValue", async () => {
    const { container: defaultContainer } = render(<Slider aria-label="Volume" />);
    expect((await axe(defaultContainer)).violations).toHaveLength(0);

    const { container: errorContainer } = render(<Slider aria-label="Volume" hasError />);
    expect((await axe(errorContainer)).violations).toHaveLength(0);

    const { container: disabledContainer } = render(<Slider aria-label="Volume" disabled />);
    expect((await axe(disabledContainer)).violations).toHaveLength(0);

    const { container: showValueContainer } = render(
      <Slider aria-label="Volume" showValue defaultValue={42} />,
    );
    expect((await axe(showValueContainer)).violations).toHaveLength(0);
  });

  it("has no accessibility violations with showValueTooltip, showMinMaxLabels, or showTicks", async () => {
    const { container: tooltipContainer } = render(
      <Slider aria-label="Volume" showValueTooltip defaultValue={30} />,
    );
    expect((await axe(tooltipContainer)).violations).toHaveLength(0);

    const { container: minMaxContainer } = render(
      <Slider aria-label="Volume" showMinMaxLabels />,
    );
    expect((await axe(minMaxContainer)).violations).toHaveLength(0);

    const { container: ticksContainer } = render(
      <Slider aria-label="Volume" showTicks tickInterval={25} />,
    );
    expect((await axe(ticksContainer)).violations).toHaveLength(0);

    const { container: verticalMinMaxContainer } = render(
      <Slider aria-label="Volume" orientation="vertical" showMinMaxLabels style={{ height: "12rem" }} />,
    );
    expect((await axe(verticalMinMaxContainer)).violations).toHaveLength(0);
  });
});
