import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Indicators } from "./Indicators";
import styles from "./Indicators.module.css";

describe("Indicators", () => {
  it("never lets a same-named consumer prop override the computed role (same recurring bug class as FieldError/Divider — TypeScript's JSX checker allows `role` through regardless of the declared prop type, so this is enforced by JSX attribute order, not by the type system alone)", () => {
    render(
      <Indicators
        count={3}
        activeIndex={0}
        onIndexChange={() => {}}
        role="tablist"
      />,
    );
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("defaults to the md size", () => {
    render(<Indicators count={3} activeIndex={0} onIndexChange={() => {}} />);
    expect(screen.getByRole("group")).toHaveClass(styles.sizeMd as string);
  });

  it("applies size as a token-driven dot diameter", () => {
    render(
      <Indicators
        count={3}
        activeIndex={0}
        onIndexChange={() => {}}
        size="lg"
      />,
    );
    expect(screen.getByRole("group")).toHaveClass(styles.sizeLg as string);
  });

  describe("variant", () => {
    it("defaults to dots (no outline/bars class)", () => {
      render(<Indicators count={3} activeIndex={0} onIndexChange={() => {}} />);
      const group = screen.getByRole("group");
      expect(group).not.toHaveClass(styles.outline as string);
      expect(group).not.toHaveClass(styles.bars as string);
    });

    it("applies the outline class when variant='outline'", () => {
      render(
        <Indicators
          count={3}
          activeIndex={0}
          onIndexChange={() => {}}
          variant="outline"
        />,
      );
      expect(screen.getByRole("group")).toHaveClass(styles.outline as string);
    });

    it("applies the bars class when variant='bars'", () => {
      render(
        <Indicators
          count={3}
          activeIndex={0}
          onIndexChange={() => {}}
          variant="bars"
        />,
      );
      expect(screen.getByRole("group")).toHaveClass(styles.bars as string);
    });

    it("has no accessibility violations with variant='outline'", async () => {
      const { container } = render(
        <Indicators
          count={4}
          activeIndex={1}
          onIndexChange={() => {}}
          variant="outline"
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has no accessibility violations with variant='bars'", async () => {
      const { container } = render(
        <Indicators
          count={4}
          activeIndex={1}
          onIndexChange={() => {}}
          variant="bars"
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("still marks the active dot and supports click/keyboard navigation with variant='bars'", async () => {
      const user = userEvent.setup();
      const onIndexChange = vi.fn();
      render(
        <Indicators
          count={3}
          activeIndex={0}
          onIndexChange={onIndexChange}
          variant="bars"
        />,
      );
      const dots = screen.getAllByRole("button");
      expect(dots[0]).toHaveAttribute("aria-current", "true");
      await user.click(screen.getByRole("button", { name: "Go to slide 3" }));
      expect(onIndexChange).toHaveBeenCalledWith(2);
    });

    it("regression: the outer wrapper's vertical-align is locked to 'middle', not left at inline-flex's default 'baseline' (found live — a real page shift whenever the first dot's own height changed, e.g. bars/vertical-dots activation moving onto or off of it)", () => {
      const { container } = render(
        <Indicators count={3} activeIndex={0} onIndexChange={() => {}} />,
      );
      const wrapper = container.firstElementChild as HTMLElement;
      expect(wrapper).toHaveStyle({ verticalAlign: "middle" });
    });

    it("regression: variant='bars' locks the group's own cross-axis size (height) rather than leaving it to intrinsic 'max of children' sizing, which visibly dipped mid-transition as the outgoing/incoming active bar's thicknesses crossed paths", () => {
      render(
        <Indicators
          count={3}
          activeIndex={0}
          onIndexChange={() => {}}
          variant="bars"
        />,
      );
      expect(screen.getByRole("group")).toHaveStyle({
        height: "var(--dot-size)",
      });
    });

    it("regression: variant='bars' with orientation='vertical' locks the cross-axis size on width instead (the axes swap with orientation)", () => {
      render(
        <Indicators
          count={3}
          activeIndex={0}
          onIndexChange={() => {}}
          variant="bars"
          orientation="vertical"
        />,
      );
      expect(screen.getByRole("group")).toHaveStyle({
        width: "var(--dot-size)",
      });
    });
  });

  describe("orientation", () => {
    it("defaults to horizontal (no vertical class)", () => {
      render(<Indicators count={3} activeIndex={0} onIndexChange={() => {}} />);
      expect(screen.getByRole("group")).not.toHaveClass(
        styles.vertical as string,
      );
    });

    it("applies the vertical class when orientation='vertical'", () => {
      render(
        <Indicators
          count={3}
          activeIndex={0}
          onIndexChange={() => {}}
          orientation="vertical"
        />,
      );
      expect(screen.getByRole("group")).toHaveClass(styles.vertical as string);
    });

    it("has no accessibility violations when vertical", async () => {
      const { container } = render(
        <Indicators
          count={4}
          activeIndex={1}
          onIndexChange={() => {}}
          orientation="vertical"
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("progress label", () => {
    it("does not render a label by default", () => {
      render(<Indicators count={5} activeIndex={2} onIndexChange={() => {}} />);
      expect(screen.queryByText("3/5")).not.toBeInTheDocument();
    });

    it("renders the default '{n}/{count}' label when showLabel is set, as a sibling of the group rather than inside it", () => {
      render(
        <Indicators
          count={5}
          activeIndex={2}
          onIndexChange={() => {}}
          showLabel
        />,
      );
      expect(screen.getByText("3/5")).toBeInTheDocument();
      expect(screen.getByRole("group")).not.toHaveTextContent("3/5");
    });

    it("supports a custom formatLabel", () => {
      render(
        <Indicators
          count={5}
          activeIndex={2}
          onIndexChange={() => {}}
          showLabel
          formatLabel={(activeIndex, count) =>
            `Slide ${activeIndex + 1} of ${count}`
          }
        />,
      );
      expect(screen.getByText("Slide 3 of 5")).toBeInTheDocument();
    });

    it("has no accessibility violations with the label shown", async () => {
      const { container } = render(
        <Indicators
          count={4}
          activeIndex={1}
          onIndexChange={() => {}}
          showLabel
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    describe("formatLabel-without-showLabel warning", () => {
      afterEach(() => {
        vi.restoreAllMocks();
      });

      it("warns once in development when formatLabel is provided without showLabel", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        const { rerender } = render(
          <Indicators
            count={3}
            activeIndex={0}
            onIndexChange={() => {}}
            formatLabel={(i, c) => `${i}/${c}`}
          />,
        );
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0]?.[0]).toContain("formatLabel");
        rerender(
          <Indicators
            count={3}
            activeIndex={0}
            onIndexChange={() => {}}
            formatLabel={(i, c) => `${i}/${c}`}
          />,
        );
        expect(warnSpy).toHaveBeenCalledTimes(1);
      });

      it("does not warn when formatLabel is paired with showLabel", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
        render(
          <Indicators
            count={3}
            activeIndex={0}
            onIndexChange={() => {}}
            showLabel
            formatLabel={(i, c) => `${i}/${c}`}
          />,
        );
        expect(warnSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe("out-of-range activeIndex warning", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("warns once in development when activeIndex is outside [0, count)", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(
        <Indicators count={3} activeIndex={5} onIndexChange={() => {}} />,
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toContain("activeIndex");
      rerender(
        <Indicators count={3} activeIndex={5} onIndexChange={() => {}} />,
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it("does not warn when activeIndex is in range", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(<Indicators count={3} activeIndex={1} onIndexChange={() => {}} />);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  it("renders one button per count", () => {
    render(<Indicators count={5} activeIndex={0} onIndexChange={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("marks only the active dot with aria-current", () => {
    render(<Indicators count={3} activeIndex={1} onIndexChange={() => {}} />);
    const dots = screen.getAllByRole("button");
    expect(dots[0]).not.toHaveAttribute("aria-current");
    expect(dots[1]).toHaveAttribute("aria-current", "true");
    expect(dots[2]).not.toHaveAttribute("aria-current");
  });

  it("uses a default accessible label per dot", () => {
    render(<Indicators count={3} activeIndex={0} onIndexChange={() => {}} />);
    expect(
      screen.getByRole("button", { name: "Go to slide 2" }),
    ).toBeInTheDocument();
  });

  it("supports a custom getLabel", () => {
    render(
      <Indicators
        count={2}
        activeIndex={0}
        onIndexChange={() => {}}
        getLabel={(i) => `Photo ${i + 1} of 2`}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Photo 1 of 2" }),
    ).toBeInTheDocument();
  });

  it("only the active dot is in tab order (roving tabindex)", () => {
    render(<Indicators count={3} activeIndex={1} onIndexChange={() => {}} />);
    const dots = screen.getAllByRole("button");
    expect(dots[0]).toHaveAttribute("tabIndex", "-1");
    expect(dots[1]).toHaveAttribute("tabIndex", "0");
    expect(dots[2]).toHaveAttribute("tabIndex", "-1");
  });

  it("calls onIndexChange when a dot is clicked", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(
      <Indicators count={3} activeIndex={0} onIndexChange={onIndexChange} />,
    );
    await user.click(screen.getByRole("button", { name: "Go to slide 3" }));
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  describe("keyboard navigation", () => {
    it("ArrowRight advances to the next index, wrapping at the end", async () => {
      const user = userEvent.setup();
      const onIndexChange = vi.fn();
      render(
        <Indicators count={3} activeIndex={2} onIndexChange={onIndexChange} />,
      );
      screen.getByRole("button", { name: "Go to slide 3" }).focus();
      await user.keyboard("{ArrowRight}");
      expect(onIndexChange).toHaveBeenCalledWith(0);
    });

    it("ArrowLeft goes to the previous index, wrapping at the start", async () => {
      const user = userEvent.setup();
      const onIndexChange = vi.fn();
      render(
        <Indicators count={3} activeIndex={0} onIndexChange={onIndexChange} />,
      );
      screen.getByRole("button", { name: "Go to slide 1" }).focus();
      await user.keyboard("{ArrowLeft}");
      expect(onIndexChange).toHaveBeenCalledWith(2);
    });

    it("Home jumps to the first index, End jumps to the last", async () => {
      const user = userEvent.setup();
      const onIndexChange = vi.fn();
      render(
        <Indicators count={4} activeIndex={1} onIndexChange={onIndexChange} />,
      );
      screen.getByRole("button", { name: "Go to slide 2" }).focus();
      await user.keyboard("{Home}");
      expect(onIndexChange).toHaveBeenCalledWith(0);
      await user.keyboard("{End}");
      expect(onIndexChange).toHaveBeenCalledWith(3);
    });

    it("moves focus to the newly active dot after a key changes activeIndex, only when focus was already inside the group", () => {
      const { rerender } = render(
        <Indicators count={3} activeIndex={0} onIndexChange={() => {}} />,
      );
      screen.getByRole("button", { name: "Go to slide 1" }).focus();
      rerender(
        <Indicators count={3} activeIndex={1} onIndexChange={() => {}} />,
      );
      expect(screen.getByRole("button", { name: "Go to slide 2" })).toHaveFocus();
    });

    it("when vertical, ArrowDown advances to the next index (ArrowRight is a no-op)", async () => {
      const user = userEvent.setup();
      const onIndexChange = vi.fn();
      render(
        <Indicators
          count={3}
          activeIndex={0}
          onIndexChange={onIndexChange}
          orientation="vertical"
        />,
      );
      screen.getByRole("button", { name: "Go to slide 1" }).focus();
      await user.keyboard("{ArrowRight}");
      expect(onIndexChange).not.toHaveBeenCalled();
      await user.keyboard("{ArrowDown}");
      expect(onIndexChange).toHaveBeenCalledWith(1);
    });

    it("when vertical, ArrowUp goes to the previous index, wrapping at the start (ArrowLeft is a no-op)", async () => {
      const user = userEvent.setup();
      const onIndexChange = vi.fn();
      render(
        <Indicators
          count={3}
          activeIndex={0}
          onIndexChange={onIndexChange}
          orientation="vertical"
        />,
      );
      screen.getByRole("button", { name: "Go to slide 1" }).focus();
      await user.keyboard("{ArrowLeft}");
      expect(onIndexChange).not.toHaveBeenCalled();
      await user.keyboard("{ArrowUp}");
      expect(onIndexChange).toHaveBeenCalledWith(2);
    });

    it("does not steal focus when activeIndex changes externally (focus was outside the group)", () => {
      const { rerender } = render(
        <>
          <button type="button">Outside</button>
          <Indicators count={3} activeIndex={0} onIndexChange={() => {}} />
        </>,
      );
      screen.getByRole("button", { name: "Outside" }).focus();
      rerender(
        <>
          <button type="button">Outside</button>
          <Indicators count={3} activeIndex={1} onIndexChange={() => {}} />
        </>,
      );
      expect(screen.getByRole("button", { name: "Outside" })).toHaveFocus();
    });
  });

  it("uses a default group label of 'Slide navigation'", () => {
    render(<Indicators count={3} activeIndex={0} onIndexChange={() => {}} />);
    expect(screen.getByRole("group", { name: "Slide navigation" })).toBeInTheDocument();
  });

  it("supports a custom aria-label", () => {
    render(
      <Indicators
        count={3}
        activeIndex={0}
        onIndexChange={() => {}}
        aria-label="Gallery navigation"
      />,
    );
    expect(
      screen.getByRole("group", { name: "Gallery navigation" }),
    ).toBeInTheDocument();
  });

  it("forwards ref to the root element", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Indicators ref={ref} count={3} activeIndex={0} onIndexChange={() => {}} />,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("applies className to the root element", () => {
    render(
      <Indicators
        count={3}
        activeIndex={0}
        onIndexChange={() => {}}
        className="custom"
      />,
    );
    expect(screen.getByRole("group")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Indicators count={4} activeIndex={1} onIndexChange={() => {}} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
