import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import textStyles from "../../atoms/Text/Text.module.css";
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

  it("scales the showValue label's font size with the slider's own size, lg/xl only (user-reported: fixed size read too small next to lg/xl's own larger thumb)", () => {
    const { container: xsContainer } = render(
      <Slider aria-label="Volume" size="xs" showValue defaultValue={50} />,
    );
    expect(xsContainer.querySelector(`.${styles.value}`)).toHaveClass(
      textStyles.sizeSm as string,
    );

    const { container: mdContainer } = render(
      <Slider aria-label="Volume" size="md" showValue defaultValue={50} />,
    );
    expect(mdContainer.querySelector(`.${styles.value}`)).toHaveClass(
      textStyles.sizeSm as string,
    );

    const { container: lgContainer } = render(
      <Slider aria-label="Volume" size="lg" showValue defaultValue={50} />,
    );
    expect(lgContainer.querySelector(`.${styles.value}`)).toHaveClass(
      textStyles.sizeBase as string,
    );

    const { container: xlContainer } = render(
      <Slider aria-label="Volume" size="xl" showValue defaultValue={50} />,
    );
    expect(xlContainer.querySelector(`.${styles.value}`)).toHaveClass(
      textStyles.sizeMd as string,
    );
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

  it("keeps the value tooltip open through a pointer press and release, not just plain hover (found in user-reported drag regression)", async () => {
    render(<Slider aria-label="Volume" defaultValue={30} showValueTooltip />);
    const slider = screen.getByRole("slider");

    fireEvent.pointerEnter(slider);
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();

    // A real drag starts with a pointerdown on the thumb — Radix Tooltip's
    // own *uncontrolled* hover trigger treats this as a dismiss signal and
    // closes even though the pointer never left the thumb, which is
    // exactly the bug this component's own controlled `open` state (driven
    // by hover/press/focus together) exists to prevent.
    fireEvent.pointerDown(slider);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    fireEvent.pointerUp(slider);
    // Still hovering after release — stays open.
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("hides the value tooltip once hover/press end, even though the thumb is still genuinely DOM-focused from the preceding click (found in user-reported lingering-tooltip regression)", async () => {
    render(<Slider aria-label="Volume" defaultValue={30} showValueTooltip />);
    const slider = screen.getByRole("slider");

    fireEvent.pointerEnter(slider);
    fireEvent.pointerDown(slider);
    fireEvent.pointerUp(slider);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    // A pointerdown/pointerup sequence on the thumb genuinely leaves it
    // focused afterward (confirmed directly elsewhere via
    // `document.activeElement`) — correct, expected browser behavior, not
    // a bug. The tooltip must still close here regardless, since the user
    // is no longer hovering or pressing — counting that leftover click
    // focus as a reason to keep it open is exactly the bug this test
    // guards against.
    fireEvent.pointerLeave(slider);
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
    );
  });

  it("keeps the value tooltip open on genuine keyboard focus alone, without hovering or pressing", async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={30} showValueTooltip />);
    await user.tab();
    expect(screen.getByRole("slider")).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();

    fireEvent.blur(screen.getByRole("slider"));
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
    );
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

  it("places the slider and min/max row in the same grid column, independent of the value label's own width (found in two separate user-reported alignment regressions)", () => {
    const { container } = render(
      <Slider aria-label="Volume" defaultValue={50} showValue showMinMaxLabels />,
    );
    const combinedWrapper = container.querySelector(`.${styles.combinedWrapper}`);
    expect(combinedWrapper).not.toBeNull();
    expect(combinedWrapper?.textContent).toContain("50");
    expect(combinedWrapper?.querySelector('[role="slider"]')).not.toBeNull();

    const sliderSlot = container.querySelector(`.${styles.combinedSlider}`);
    const minMaxRow = container.querySelector(`.${styles.combinedMinMaxRow}`);
    expect(sliderSlot).not.toBeNull();
    expect(minMaxRow).not.toBeNull();
    // Both placed in the grid's first column (`grid-column: 1`) — sized to
    // the slider alone — rather than the value label's own second column,
    // so the min/max row's width always matches the slider's own, not the
    // combined [slider + value label] width. Not something jsdom resolves
    // real column widths for, so this checks the actual mechanism (the
    // shared placement) rather than a computed pixel value.
    expect(getComputedStyle(sliderSlot as Element).gridColumn).toBe(
      getComputedStyle(minMaxRow as Element).gridColumn,
    );
    // The value label sits in the sibling second column, not nested inside
    // either the slider's own slot or the min/max row.
    const valueLabel = container.querySelector(`.${styles.combinedValue}`);
    expect(valueLabel).not.toBeNull();
    expect(sliderSlot?.contains(valueLabel)).toBe(false);
    expect(minMaxRow?.contains(valueLabel)).toBe(false);
  });

  it("adds clearance between the value label and the min-label overlay when both are shown, vertical (found in user-reported overlap regression)", () => {
    const { container } = render(
      <Slider
        aria-label="Volume"
        orientation="vertical"
        defaultValue={50}
        showValue
        showMinMaxLabels
        style={{ height: "12rem" }}
      />,
    );
    const value = container.querySelector(`.${styles.value}`);
    expect(value).toHaveClass(styles.valueClearsMinMaxOverlay as string);
  });

  it("does not add min-overlay clearance to the value label when showMinMaxLabels is off", () => {
    const { container } = render(
      <Slider
        aria-label="Volume"
        orientation="vertical"
        defaultValue={50}
        showValue
        style={{ height: "12rem" }}
      />,
    );
    const value = container.querySelector(`.${styles.value}`);
    expect(value).not.toHaveClass(styles.valueClearsMinMaxOverlay as string);
  });

  it("renders one tick per tickInterval, excluding min and max, when showTicks is set", () => {
    const { container } = render(
      <Slider aria-label="Volume" min={0} max={100} tickInterval={25} showTicks />,
    );
    const ticks = container.querySelectorAll(`.${styles.tick}`);
    // 0, 25, 50, 75, 100 minus the excluded endpoints (0 and 100) — 3 left.
    expect(ticks).toHaveLength(3);
  });

  it("never renders a tick past max, even when the range doesn't divide evenly by tickInterval", () => {
    const { container } = render(
      <Slider aria-label="Volume" min={0} max={100} tickInterval={30} showTicks />,
    );
    const ticks = container.querySelectorAll(`.${styles.tick}`);
    // 0, 30, 60, 90, and (internally) a final computed tick at 100 — minus
    // the excluded endpoints (0 and the computed 100), leaving 30/60/90.
    expect(ticks).toHaveLength(3);
  });

  it("excludes ticks that land exactly on min or max", () => {
    const { container } = render(
      <Slider aria-label="Volume" min={0} max={100} tickInterval={50} showTicks />,
    );
    const ticks = container.querySelectorAll(`.${styles.tick}`);
    // Only 50 (the midpoint) — 0 and 100 are both excluded endpoints.
    expect(ticks).toHaveLength(1);
  });

  it("defaults tickInterval to step when not set explicitly", () => {
    const { container } = render(
      <Slider aria-label="Volume" min={0} max={20} step={5} showTicks />,
    );
    const ticks = container.querySelectorAll(`.${styles.tick}`);
    // 0, 5, 10, 15, 20 minus the excluded endpoints (0 and 20) — 3 left.
    expect(ticks).toHaveLength(3);
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

  it("shows aria-valuetext, not the raw number, in the showValue label when set (found in review, matching the tooltip's own existing preference)", () => {
    render(
      <Slider
        aria-label="Quality"
        defaultValue={2}
        min={1}
        max={3}
        aria-valuetext="Medium"
        showValue
      />,
    );
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });

  it("forwards aria-labelledby to the slider's own thumb", () => {
    render(
      <>
        <span id="volume-label">Volume</span>
        <Slider aria-labelledby="volume-label" />
      </>,
    );
    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-labelledby",
      "volume-label",
    );
  });

  it("forwards aria-describedby to the slider's own thumb", () => {
    render(<Slider aria-label="Volume" aria-describedby="volume-help" />);
    expect(screen.getByRole("slider")).toHaveAttribute(
      "aria-describedby",
      "volume-help",
    );
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

  it("focuses the thumb on mount with autoFocus (React's own autoFocus never focuses a span)", () => {
    // eslint-disable-next-line jsx-a11y/no-autofocus -- exercising the component's own opt-in prop
    render(<Slider aria-label="Volume" autoFocus />);
    expect(screen.getByRole("slider")).toHaveFocus();
  });

  it("focuses nothing on mount without autoFocus", () => {
    render(<Slider aria-label="Volume" />);
    expect(document.body).toHaveFocus();
  });

  describe("dir", () => {
    it("is left-to-right by default, on the slider and on every wrapper", () => {
      const { container } = render(<Slider aria-label="Volume" showValue showMinMaxLabels />);
      expect(container.querySelector('[role="slider"]')?.closest('[dir]')).toHaveAttribute("dir", "ltr");
      for (const wrapper of container.querySelectorAll(`.${styles.combinedWrapper}, .${styles.combinedSlider}, .${styles.combinedMinMaxRow}`)) {
        expect(wrapper).toHaveAttribute("dir", "ltr");
      }
    });

    it("stays left-to-right inside a right-to-left page when dir is left out, so the labels agree with the slider", () => {
      const { container } = render(
        <div dir="rtl">
          <Slider aria-label="Volume" showMinMaxLabels defaultValue={50} />
        </div>,
      );
      expect(container.querySelector(`.${styles.minMaxWrapper}`)).toHaveAttribute("dir", "ltr");
      expect(container.querySelector(`.${styles.minMaxRow}`)?.closest("[dir]")).toHaveAttribute("dir", "ltr");
    });

    it("mirrors with dir=\"rtl\": Radix and every wrapper get it, and ArrowLeft raises the value", async () => {
      const user = userEvent.setup();
      const { container } = render(<Slider aria-label="Volume" dir="rtl" defaultValue={50} showValue showMinMaxLabels />);
      for (const element of container.querySelectorAll(`.${styles.combinedWrapper}, .${styles.combinedSlider}, .${styles.combinedMinMaxRow}, .${styles.root}`)) {
        expect(element).toHaveAttribute("dir", "rtl");
      }
      const thumb = screen.getByRole("slider");
      thumb.focus();
      await user.keyboard("{ArrowLeft}");
      expect(thumb).toHaveAttribute("aria-valuenow", "51");
      await user.keyboard("{ArrowRight}{ArrowRight}");
      expect(thumb).toHaveAttribute("aria-valuenow", "49");
    });

    it("keeps ArrowRight raising the value in left-to-right", async () => {
      const user = userEvent.setup();
      render(<Slider aria-label="Volume" defaultValue={50} />);
      screen.getByRole("slider").focus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "51");
    });

    it("puts dir on the outermost wrapper of a vertical slider too", () => {
      const { container } = render(<Slider aria-label="Volume" dir="rtl" orientation="vertical" showValue style={{ height: "10rem" }} />);
      expect(container.firstElementChild).toHaveAttribute("dir", "rtl");
    });
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
  describe("formatNumber", () => {
    const tagged = (n: number) => `<${n}>`;
    const arabic = new Intl.NumberFormat("ar-EG").format;
    const german = new Intl.NumberFormat("de-DE").format;

    it("changes nothing when it isn't given: the plain number, and no aria-valuetext", () => {
      render(<Slider aria-label="Volume" defaultValue={42} min={0} max={100} showValue showMinMaxLabels />);
      expect(screen.getByText("42")).toBeInTheDocument();
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByRole("slider")).not.toHaveAttribute("aria-valuetext");
    });

    it("writes the value label with it, and keeps it current as the value changes", async () => {
      const user = userEvent.setup();
      render(<Slider aria-label="Volume" defaultValue={42} showValue formatNumber={tagged} />);
      expect(screen.getByText("<42>")).toBeInTheDocument();
      screen.getByRole("slider").focus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByText("<43>")).toBeInTheDocument();
    });

    it("writes the value tooltip with it", async () => {
      const user = userEvent.setup();
      render(<Slider aria-label="Volume" defaultValue={30} showValueTooltip formatNumber={tagged} />);
      await user.hover(screen.getByRole("slider"));
      expect(await screen.findByRole("tooltip")).toHaveTextContent("<30>");
    });

    it.each([
      ["horizontal", { orientation: "horizontal" as const }],
      ["vertical", { orientation: "vertical" as const }],
      ["horizontal with the value label", { orientation: "horizontal" as const, showValue: true }],
      ["vertical with the value label", { orientation: "vertical" as const, showValue: true }],
    ])("writes the min and max labels with it, %s", (_name, extra) => {
      render(<Slider aria-label="Volume" min={0} max={75} defaultValue={10} showMinMaxLabels formatNumber={tagged} {...extra} />);
      expect(screen.getByText("<0>")).toBeInTheDocument();
      expect(screen.getByText("<75>")).toBeInTheDocument();
      expect(screen.queryByText("75")).not.toBeInTheDocument();
    });

    it("announces the formatted number (aria-valuetext) so what is shown is what is announced, and follows changes", async () => {
      const user = userEvent.setup();
      render(<Slider aria-label="Volume" defaultValue={42} showValue formatNumber={tagged} />);
      const thumb = screen.getByRole("slider");
      expect(thumb).toHaveAttribute("aria-valuetext", "<42>");
      thumb.focus();
      await user.keyboard("{ArrowRight}");
      expect(thumb).toHaveAttribute("aria-valuetext", "<43>");
      expect(thumb).toHaveAttribute("aria-valuenow", "43");
    });

    it("lets an aria-valuetext of your own win everywhere, in the label, the tooltip and the announcement — but not over the min and max", async () => {
      const user = userEvent.setup();
      render(
        <Slider aria-label="Quality" defaultValue={2} min={1} max={3} aria-valuetext="Medium" showValue showValueTooltip showMinMaxLabels formatNumber={tagged} />,
      );
      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "Medium");
      await user.hover(screen.getByRole("slider"));
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Medium");
      expect(screen.getByText("<1>")).toBeInTheDocument();
      expect(screen.getByText("<3>")).toBeInTheDocument();
    });

    it("gives onValueChange and onValueCommit the plain number", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const onValueCommit = vi.fn();
      render(<Slider aria-label="Volume" defaultValue={42} formatNumber={tagged} onValueChange={onValueChange} onValueCommit={onValueCommit} />);
      screen.getByRole("slider").focus();
      await user.keyboard("{ArrowRight}");
      expect(onValueChange).toHaveBeenCalledWith(43);
      expect(onValueCommit).toHaveBeenCalledWith(43);
    });

    it("leaves the form value alone: the hidden input still holds the plain number", () => {
      const { container } = render(
        <form>
          <Slider aria-label="Volume" name="volume" defaultValue={42} formatNumber={arabic} />
        </form>,
      );
      expect(container.querySelector<HTMLInputElement>("input[name=volume]")?.value).toBe("42");
    });

    it("writes a real locale's numerals and decimals", () => {
      const { unmount } = render(<Slider aria-label="Volume" defaultValue={50} showValue formatNumber={arabic} />);
      expect(arabic(50)).not.toBe("50");
      expect(screen.getByText(arabic(50))).toBeInTheDocument();
      unmount();
      render(<Slider aria-label="Volume" defaultValue={0.5} min={0} max={1} step={0.5} showValue showMinMaxLabels formatNumber={german} />);
      expect(screen.getByText("0,5")).toBeInTheDocument();
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "0,5");
    });

    it("can add a unit", () => {
      render(<Slider aria-label="Volume" defaultValue={50} showValue formatNumber={(n) => `${n}%`} />);
      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "50%");
    });

    it("has no accessibility violations with it, everything shown", async () => {
      const { container } = render(
        <Slider aria-label="Volume" defaultValue={50} showValue showValueTooltip showMinMaxLabels showTicks tickInterval={25} formatNumber={arabic} />,
      );
      expect((await axe(container)).violations).toHaveLength(0);
    });
  });
});
