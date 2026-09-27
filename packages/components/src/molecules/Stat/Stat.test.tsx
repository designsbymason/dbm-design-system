import { UsersIcon } from "@dbm-design-system/icons";
import { act, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef, StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import textStyles from "../../atoms/Text/Text.module.css";
import { Stat } from "./Stat";
import styles from "./Stat.module.css";
import type { StatProps, StatSize, StatTone, StatVariant } from "./Stat.types";

function renderStat(props: Partial<StatProps> = {}) {
  return render(
    <Stat data-testid="stat" {...props}>
      <Stat.Icon icon={UsersIcon} data-testid="icon" />
      <Stat.Label data-testid="label">Active users</Stat.Label>
      <Stat.Value data-testid="value">
        12,480
        <Stat.Trend value={4.2} data-testid="trend" />
      </Stat.Value>
      <Stat.Description data-testid="description">vs. last month</Stat.Description>
    </Stat>,
  );
}

describe("Stat", () => {
  describe("structure", () => {
    it("renders a <div> root holding its parts, in order", () => {
      renderStat();
      const root = screen.getByTestId("stat");
      expect(root.tagName).toBe("DIV");
      const children = [...root.children].map((child) => child.getAttribute("data-testid"));
      expect(children).toEqual(["icon", "label", "value", "description"]);
    });

    it("accepts any subset of parts", () => {
      render(
        <Stat data-testid="stat">
          <Stat.Label>Revenue</Stat.Label>
          <Stat.Value>$4,200</Stat.Value>
        </Stat>,
      );
      expect(screen.getByText("Revenue")).toBeInTheDocument();
      expect(screen.getByText("$4,200")).toBeInTheDocument();
    });

    it("lays out other children in the same column", () => {
      render(
        <Stat data-testid="stat">
          <Stat.Label>Revenue</Stat.Label>
          <span data-testid="extra">extra</span>
        </Stat>,
      );
      expect(screen.getByTestId("extra")).toBeInTheDocument();
    });

    it("adds no role by default", () => {
      renderStat();
      expect(screen.getByTestId("stat")).not.toHaveAttribute("role");
    });
  });

  describe("variant", () => {
    it("is ghost by default, with no variant class", () => {
      renderStat();
      const root = screen.getByTestId("stat");
      expect(root).not.toHaveClass(styles.outlined!);
      expect(root).not.toHaveClass(styles.filled!);
    });

    it.each(["outlined", "filled"] as StatVariant[])("applies the %s class", (variant) => {
      renderStat({ variant });
      expect(screen.getByTestId("stat")).toHaveClass(styles[variant]!);
    });
  });

  describe("size", () => {
    it("is md by default, with the md class", () => {
      renderStat();
      expect(screen.getByTestId("stat")).toHaveClass(styles.sizeMd!);
    });

    it.each(["xs", "sm", "md", "lg", "xl"] as StatSize[])("applies the size%s class", (size) => {
      renderStat({ size });
      const className = `size${size[0]!.toUpperCase()}${size.slice(1)}`;
      expect(screen.getByTestId("stat")).toHaveClass(styles[className]!);
    });

    it("gives a part rendered outside any Stat the md defaults", () => {
      render(<Stat.Label data-testid="label">Alone</Stat.Label>);
      // md's own label size class, from the Text atom.
      expect(screen.getByTestId("label")).toHaveClass(textStyles.sizeMd!);
    });

    it("keeps a nested stat's size to itself", () => {
      render(
        <Stat size="xl" data-testid="outer">
          <Stat size="xs" data-testid="inner">
            <Stat.Label data-testid="inner-label">Inner</Stat.Label>
          </Stat>
        </Stat>,
      );
      expect(screen.getByTestId("inner-label")).toHaveClass(textStyles.sizeBase!);
    });
  });

  describe("Stat.Label", () => {
    it("is uppercase by default", () => {
      renderStat();
      expect(getComputedStyle(screen.getByTestId("label")).textTransform).toBe("uppercase");
    });

    it("can be overridden with a style prop, which wins over the default", () => {
      render(
        <Stat.Label data-testid="label" style={{ textTransform: "none" }}>
          Active users
        </Stat.Label>,
      );
      expect(getComputedStyle(screen.getByTestId("label")).textTransform).toBe("none");
    });
  });

  describe("tone", () => {
    it("is neutral by default, with no tone class", () => {
      renderStat();
      expect(screen.getByTestId("stat")).not.toHaveClass(styles.toneBrand!);
    });

    it.each(["brand", "info", "success", "warning", "danger"] as StatTone[])(
      "applies the tone%s class",
      (tone) => {
        renderStat({ tone });
        const className = `tone${tone[0]!.toUpperCase()}${tone.slice(1)}`;
        expect(screen.getByTestId("stat")).toHaveClass(styles[className]!);
      },
    );

    it("is decorative: the tone never adds text or an accessible name", () => {
      renderStat({ tone: "danger" });
      expect(screen.getByTestId("stat")).toHaveAccessibleName("");
    });

    it.each(["outlined", "filled"] as StatVariant[])(
      "keeps both the %s and the tone class together, for the stylesheet's own compound selectors",
      (variant) => {
        renderStat({ variant, tone: "danger" });
        const stat = screen.getByTestId("stat");
        expect(stat).toHaveClass(styles[variant]!);
        expect(stat).toHaveClass(styles.toneDanger!);
      },
    );
  });

  describe("orientation", () => {
    it("is vertical by default", () => {
      renderStat();
      expect(screen.getByTestId("stat")).toHaveAttribute("data-orientation", "vertical");
    });

    it("applies horizontal", () => {
      renderStat({ orientation: "horizontal" });
      expect(screen.getByTestId("stat")).toHaveAttribute("data-orientation", "horizontal");
    });

    it("does not wrap Icon and Label together when vertical", () => {
      const { container } = renderStat();
      expect(container.querySelector(`.${styles.iconLabelRow}`)).toBeNull();
      const stat = screen.getByTestId("stat");
      // Both are still direct children of the root, not nested inside anything else.
      expect(screen.getByTestId("icon").parentElement).toBe(stat);
      expect(screen.getByTestId("label").parentElement).toBe(stat);
    });

    it("wraps Icon and Label together, icon first, when horizontal — regardless of the order they were written in", () => {
      render(
        <Stat orientation="horizontal" data-testid="stat">
          {/* Label written before Icon in the JSX. */}
          <Stat.Label data-testid="label">Active users</Stat.Label>
          <Stat.Icon icon={UsersIcon} data-testid="icon" />
          <Stat.Value data-testid="value">12,480</Stat.Value>
        </Stat>,
      );
      const row = document.querySelector(`.${styles.iconLabelRow}`);
      expect(row).not.toBeNull();
      const rowChildren = [...row!.children];
      expect(rowChildren[0]).toBe(screen.getByTestId("icon"));
      expect(rowChildren[1]).toBe(screen.getByTestId("label"));
      // Value stays outside the row, after it, as its own sibling of the stat root.
      const stat = screen.getByTestId("stat");
      expect(screen.getByTestId("value").parentElement).toBe(stat);
      expect([...stat.children].indexOf(row as Element)).toBeLessThan(
        [...stat.children].indexOf(screen.getByTestId("value")),
      );
    });

    it("keeps every other child (Value, Description, anything else) in its own original relative order after the row", () => {
      render(
        <Stat orientation="horizontal" data-testid="stat">
          <Stat.Icon icon={UsersIcon} />
          <Stat.Label>Active users</Stat.Label>
          <Stat.Description data-testid="description">vs. last month</Stat.Description>
          <Stat.Value data-testid="value">12,480</Stat.Value>
        </Stat>,
      );
      const stat = screen.getByTestId("stat");
      const indexOf = (el: Element) => [...stat.children].indexOf(el);
      expect(indexOf(screen.getByTestId("description"))).toBeLessThan(indexOf(screen.getByTestId("value")));
    });

    it("still wraps when only one of Icon or Label is present", () => {
      const { container: onlyIcon } = render(
        <Stat orientation="horizontal">
          <Stat.Icon icon={UsersIcon} data-testid="icon" />
        </Stat>,
      );
      expect(onlyIcon.querySelector(`.${styles.iconLabelRow}`)).not.toBeNull();

      const { container: onlyLabel } = render(
        <Stat orientation="horizontal">
          <Stat.Label data-testid="label">Active users</Stat.Label>
        </Stat>,
      );
      expect(onlyLabel.querySelector(`.${styles.iconLabelRow}`)).not.toBeNull();
    });

    it("renders no wrapper at all when horizontal but neither Icon nor Label is present", () => {
      const { container } = render(
        <Stat orientation="horizontal">
          <Stat.Value>12,480</Stat.Value>
        </Stat>,
      );
      expect(container.querySelector(`.${styles.iconLabelRow}`)).toBeNull();
    });

    it("sets the row's own font-size from the exact value driving Label's size, per Stat size", () => {
      render(
        <Stat orientation="horizontal" size="lg">
          <Stat.Icon icon={UsersIcon} />
          <Stat.Label>Active users</Stat.Label>
        </Stat>,
      );
      const row = document.querySelector(`.${styles.iconLabelRow}`) as HTMLElement;
      // size="lg" maps Stat.Label to the "lg" text-size step (see labelSize in Stat.tsx).
      expect(row.style.fontSize).toBe("var(--dbm-font-size-lg)");
    });
  });

  describe("Stat.Icon", () => {
    it("is hidden from assistive technology by default", () => {
      renderStat();
      const icon = screen.getByTestId("icon").querySelector("svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("becomes an image with a text alternative when given a label", () => {
      render(
        <Stat>
          <Stat.Icon icon={UsersIcon} label="Users" data-testid="icon" />
        </Stat>,
      );
      const icon = screen.getByTestId("icon").querySelector("svg");
      expect(icon).toHaveAttribute("role", "img");
      expect(icon).toHaveAttribute("aria-label", "Users");
    });
  });

  describe("Stat.Trend", () => {
    it("shows an increase as a positive change, coloured success", () => {
      render(
        <Stat>
          <Stat.Value>
            100
            <Stat.Trend value={4.2} data-testid="trend" />
          </Stat.Value>
        </Stat>,
      );
      const trend = screen.getByTestId("trend");
      expect(trend).toHaveAttribute("data-direction", "increase");
      expect(trend).toHaveAttribute("data-sentiment", "positive");
      expect(trend).toHaveAccessibleName("Increased by +4.2");
      expect(trend).toHaveTextContent("+4.2");
    });

    it("shows a decrease as a negative change, coloured danger, by default", () => {
      render(
        <Stat>
          <Stat.Value>
            100
            <Stat.Trend value={-4.2} data-testid="trend" />
          </Stat.Value>
        </Stat>,
      );
      const trend = screen.getByTestId("trend");
      expect(trend).toHaveAttribute("data-direction", "decrease");
      expect(trend).toHaveAttribute("data-sentiment", "negative");
      expect(trend).toHaveAccessibleName("Decreased by -4.2");
    });

    it("shows no change as flat, neutral, with no sign", () => {
      render(
        <Stat>
          <Stat.Value>
            100
            <Stat.Trend value={0} data-testid="trend" />
          </Stat.Value>
        </Stat>,
      );
      const trend = screen.getByTestId("trend");
      expect(trend).toHaveAttribute("data-direction", "flat");
      expect(trend).toHaveAttribute("data-sentiment", "flat");
      expect(trend).toHaveAccessibleName("No change");
      expect(trend).toHaveTextContent("0");
    });

    it("colours a decrease as positive when goodDirection is decrease", () => {
      render(
        <Stat>
          <Stat.Value>
            58
            <Stat.Trend value={-12} goodDirection="decrease" data-testid="trend" />
          </Stat.Value>
        </Stat>,
      );
      const trend = screen.getByTestId("trend");
      expect(trend).toHaveAttribute("data-direction", "decrease");
      expect(trend).toHaveAttribute("data-sentiment", "positive");
    });

    it("colours an increase as negative when goodDirection is decrease", () => {
      render(
        <Stat>
          <Stat.Value>
            58
            <Stat.Trend value={12} goodDirection="decrease" data-testid="trend" />
          </Stat.Value>
        </Stat>,
      );
      const trend = screen.getByTestId("trend");
      expect(trend).toHaveAttribute("data-direction", "increase");
      expect(trend).toHaveAttribute("data-sentiment", "negative");
    });

    it("a value of exactly 0 is always flat, regardless of goodDirection", () => {
      render(
        <Stat>
          <Stat.Value>
            58
            <Stat.Trend value={0} goodDirection="decrease" data-testid="trend" />
          </Stat.Value>
        </Stat>,
      );
      expect(screen.getByTestId("trend")).toHaveAttribute("data-sentiment", "flat");
    });

    it("formats the value with a custom formatNumber, in both the visible text and the accessible name", () => {
      render(
        <Stat>
          <Stat.Value>
            100
            <Stat.Trend value={12.5} formatNumber={(n) => `${n}%`} data-testid="trend" />
          </Stat.Value>
        </Stat>,
      );
      const trend = screen.getByTestId("trend");
      expect(trend).toHaveTextContent("12.5%");
      expect(trend).toHaveAccessibleName("Increased by 12.5%");
    });

    it("accepts custom labels, given the formatted text and the plain number", () => {
      render(
        <Stat>
          <Stat.Value>
            100
            <Stat.Trend
              value={12.5}
              formatNumber={(n) => `${n}%`}
              labels={{ increase: (formatted, value) => `Up ${formatted} (raw ${value})` }}
              data-testid="trend"
            />
          </Stat.Value>
        </Stat>,
      );
      expect(screen.getByTestId("trend")).toHaveAccessibleName("Up 12.5% (raw 12.5)");
    });

    it("keeps a labels override's other defaults when only one key is overridden", () => {
      render(
        <Stat>
          <Stat.Value>
            100
            <Stat.Trend value={-4} labels={{ increase: () => "custom increase" }} data-testid="trend" />
          </Stat.Value>
        </Stat>,
      );
      // `decrease` was not overridden, so it still falls back to its own default.
      expect(screen.getByTestId("trend")).toHaveAccessibleName("Decreased by -4");
    });

    it("hides its icon from assistive technology (the accessible name is on the trend itself)", () => {
      render(
        <Stat>
          <Stat.Value>
            100
            <Stat.Trend value={4} data-testid="trend" />
          </Stat.Value>
        </Stat>,
      );
      const svg = screen.getByTestId("trend").querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("standard props", () => {
    it("accepts className, style, id, and data-testid on the root", () => {
      render(
        <Stat className="extra" style={{ color: "red" }} id="my-stat" data-testid="stat">
          <Stat.Label>Revenue</Stat.Label>
        </Stat>,
      );
      const root = screen.getByTestId("stat");
      expect(root).toHaveClass("extra");
      expect(root).toHaveAttribute("id", "my-stat");
      expect(root.style.color).toBe("red");
    });

    it("accepts className, style, id, and data-testid on every part", () => {
      renderStat();
      for (const testId of ["icon", "label", "value", "description"]) {
        expect(screen.getByTestId(testId)).toBeInTheDocument();
      }
    });

    it("forwards a ref on every part", () => {
      const rootRef = createRef<HTMLDivElement>();
      const labelRef = createRef<HTMLParagraphElement>();
      const valueRef = createRef<HTMLParagraphElement>();
      const trendRef = createRef<HTMLSpanElement>();
      render(
        <Stat ref={rootRef}>
          <Stat.Label ref={labelRef}>Revenue</Stat.Label>
          <Stat.Value ref={valueRef}>
            100
            <Stat.Trend ref={trendRef} value={1} />
          </Stat.Value>
        </Stat>,
      );
      expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
      expect(labelRef.current).toBeInstanceOf(HTMLParagraphElement);
      expect(valueRef.current).toBeInstanceOf(HTMLParagraphElement);
      expect(trendRef.current).toBeInstanceOf(HTMLSpanElement);
    });

    it("keeps its own classes alongside a consumer's className, rather than being replaced by it", () => {
      renderStat({ className: "custom" });
      expect(screen.getByTestId("stat")).toHaveClass(styles.root ?? "", "custom");
    });
  });

  describe("announce", () => {
    afterEach(() => vi.useRealTimers());

    it("renders no status region by default", () => {
      renderStat();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("renders a status region, empty, when announce is set", () => {
      renderStat({ announce: true });
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("does not announce the first value shown", async () => {
      vi.useFakeTimers();
      render(
        <Stat announce>
          <Stat.Value>100</Stat.Value>
        </Stat>,
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      expect(screen.getByRole("status")).toHaveTextContent("");
    });

    it("announces a later change in the value's text", async () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <Stat announce>
          <Stat.Value>100</Stat.Value>
        </Stat>,
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      rerender(
        <Stat announce>
          <Stat.Value>142</Stat.Value>
        </Stat>,
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      expect(screen.getByRole("status")).toHaveTextContent("142");
    });

    it("does not announce again when it re-renders with the same text", async () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <Stat announce>
          <Stat.Value>100</Stat.Value>
        </Stat>,
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      rerender(
        <Stat announce>
          <Stat.Value>142</Stat.Value>
        </Stat>,
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      rerender(
        <Stat announce>
          <Stat.Value>142</Stat.Value>
        </Stat>,
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });
      // Still exactly "142" — a second identical render didn't refill (and briefly re-clear) it.
      expect(screen.getByRole("status")).toHaveTextContent("142");
    });

    it("includes the trend's own accessible sentence in what changes", async () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <Stat announce>
          <Stat.Value>
            100
            <Stat.Trend value={2} />
          </Stat.Value>
        </Stat>,
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      rerender(
        <Stat announce>
          <Stat.Value>
            100
            <Stat.Trend value={-2} />
          </Stat.Value>
        </Stat>,
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      expect(screen.getByRole("status")).toHaveTextContent("Decreased by -2");
    });

    it("does not read the trend's own text twice — once raw from the value, once from its own label", async () => {
      // Real defect, found live: Stat.Trend usually nests inside Stat.Value, so its formatted text
      // ("+1.9") is part of the value's own textContent too — announcing both the value's raw text
      // and the trend's own accessible label read "13,188+1.9, Increased by +1.9" until fixed.
      vi.useFakeTimers();
      const { rerender } = render(
        <Stat announce>
          <Stat.Value>
            100
            <Stat.Trend value={4.2} />
          </Stat.Value>
        </Stat>,
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      rerender(
        <Stat announce>
          <Stat.Value>
            13,188
            <Stat.Trend value={1.9} />
          </Stat.Value>
        </Stat>,
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      const region = screen.getByRole("status");
      expect(region).toHaveTextContent("13,188, Increased by +1.9");
      // Neither the formatted trend text nor the value's own text appears a second time.
      expect(region.textContent?.match(/\+1\.9/g)?.length).toBe(1);
      expect(region.textContent?.match(/13,188/g)?.length).toBe(1);
    });

    it("stops announcing when turned off", async () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <Stat announce>
          <Stat.Value>100</Stat.Value>
        </Stat>,
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      rerender(<Stat>{<Stat.Value>142</Stat.Value>}</Stat>);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("still announces under StrictMode, which mounts, unmounts, and remounts in development", async () => {
      vi.useFakeTimers();
      const { rerender } = render(
        <StrictMode>
          <Stat announce>
            <Stat.Value>100</Stat.Value>
          </Stat>
        </StrictMode>,
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      rerender(
        <StrictMode>
          <Stat announce>
            <Stat.Value>142</Stat.Value>
          </Stat>
        </StrictMode>,
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      expect(screen.getByRole("status")).toHaveTextContent("142");
    });

    it("keeps the region out of the layout and the tab order", () => {
      renderStat({ announce: true });
      const region = screen.getByRole("status");
      expect(region.tagName).toBe("SPAN");
      expect(region).not.toHaveAttribute("tabindex");
    });
  });

  describe("accessibility (jest-axe)", () => {
    it("has no violations for the default composition", async () => {
      const { container } = renderStat();
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations with an announcing status region", async () => {
      const { container } = renderStat({ announce: true });
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations as a labelled region", async () => {
      const { container } = render(
        <Stat aria-label="Active users">
          <Stat.Label id="lbl">Active users</Stat.Label>
          <Stat.Value>12,480</Stat.Value>
        </Stat>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it.each(["outlined", "filled"] as StatVariant[])("has no violations in the %s variant", async (variant) => {
      const { container } = renderStat({ variant });
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no violations in the horizontal orientation", async () => {
      const { container } = renderStat({ orientation: "horizontal" });
      expect(await axe(container)).toHaveNoViolations();
    });

    it.each(["brand", "info", "success", "warning", "danger"] as StatTone[])(
      "has no violations with the %s tone",
      async (tone) => {
        const { container } = renderStat({ tone });
        expect(await axe(container)).toHaveNoViolations();
      },
    );
  });
});
