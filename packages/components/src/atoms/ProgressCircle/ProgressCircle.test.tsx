import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { ProgressCircle } from "./ProgressCircle";

// Mirrors the same constants ProgressCircle.tsx computes internally — kept
// in sync deliberately rather than importing them, so a test asserting the
// exact geometry doesn't just echo whatever the component happens to do.
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

describe("ProgressCircle", () => {
  it("renders role=progressbar with aria-valuenow/min/max for a determinate value", () => {
    render(<ProgressCircle value={40} label="Uploading" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("never lets a same-named consumer prop override the computed role/aria-valuenow/aria-valuemax (found in review — TypeScript's JSX checker allows aria-*/role props through regardless of the declared prop type, so this is enforced by JSX attribute order, not by the type system alone)", () => {
    render(
      // eslint-disable-next-line jsx-a11y/role-supports-aria-props -- deliberately invalid combination; the test exists to prove the component ignores it rather than render it
      <ProgressCircle
        value={40}
        label="Uploading"
        aria-valuenow={999}
        aria-valuemax={12345}
        role="button"
      />,
    );
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("role", "progressbar");
  });

  it("sets aria-valuetext when provided, alongside the numeric aria-valuenow", () => {
    render(
      <ProgressCircle
        value={3}
        max={5}
        label="Uploading files"
        aria-valuetext="3 of 5 files uploaded"
      />,
    );
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuetext", "3 of 5 files uploaded");
    expect(bar).toHaveAttribute("aria-valuenow", "3");
  });

  it("omits aria-valuetext when not provided", () => {
    render(<ProgressCircle value={40} label="Uploading" />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute(
      "aria-valuetext",
    );
  });

  it("warns once in development when neither label nor aria-labelledby is provided", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<ProgressCircle value={40} />);
    rerender(<ProgressCircle value={60} />);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("no accessible name"),
    );
    consoleWarnSpy.mockRestore();
  });

  it("does not warn when label is provided", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ProgressCircle value={40} label="Uploading" />);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("does not warn when aria-labelledby is provided instead of label", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ProgressCircle value={40} aria-labelledby="external-label" />);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("omits aria-valuenow when indeterminate", () => {
    render(<ProgressCircle label="Loading" />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute(
      "aria-valuenow",
    );
  });

  it("clamps value within [0, max]", () => {
    const { rerender } = render(
      <ProgressCircle value={150} label="Uploading" />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );

    rerender(<ProgressCircle value={-10} label="Uploading" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("sets strokeDashoffset from value/max for a determinate value (found in review — this geometry had no direct assertion, only an indirect not-NaN check under the invalid-max case)", () => {
    const { container } = render(<ProgressCircle value={40} label="Uploading" />);
    const fillCircle = container.querySelectorAll("circle")[1]!;
    const expectedOffset = CIRCUMFERENCE * (1 - 40 / 100);
    expect(
      Number(fillCircle.getAttribute("stroke-dashoffset")),
    ).toBeCloseTo(expectedOffset, 5);
  });

  it("respects a custom max when computing strokeDashoffset", () => {
    const { container } = render(
      <ProgressCircle value={3} max={5} label="Uploading" />,
    );
    const fillCircle = container.querySelectorAll("circle")[1]!;
    const expectedOffset = CIRCUMFERENCE * (1 - 3 / 5);
    expect(
      Number(fillCircle.getAttribute("stroke-dashoffset")),
    ).toBeCloseTo(expectedOffset, 5);
  });

  it("sets a fixed strokeDasharray/strokeDashoffset while indeterminate, not a value-derived one", () => {
    const { container } = render(<ProgressCircle label="Loading" />);
    const fillCircle = container.querySelectorAll("circle")[1]!;
    expect(fillCircle.getAttribute("stroke-dasharray")).toBe(
      `${CIRCUMFERENCE * 0.25} ${CIRCUMFERENCE}`,
    );
    expect(fillCircle.getAttribute("stroke-dashoffset")).toBe("0");
  });

  it.each([0, -10, NaN])(
    "falls back to the default max of 100 when max is invalid (%s)",
    (invalidMax) => {
      const { container } = render(
        <ProgressCircle value={40} max={invalidMax} label="Uploading" />,
      );
      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveAttribute("aria-valuemax", "100");
      expect(bar).toHaveAttribute("aria-valuenow", "40");
      const fillCircle = container.querySelectorAll("circle")[1]!;
      expect(fillCircle.getAttribute("stroke-dashoffset")).not.toBe("NaN");
    },
  );

  it("warns once in development when max is invalid", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <ProgressCircle value={40} max={0} label="Uploading" />,
    );
    rerender(<ProgressCircle value={60} max={0} label="Uploading" />);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("`max` must be greater than 0"),
    );
    consoleWarnSpy.mockRestore();
  });

  it("does not warn when max is valid", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ProgressCircle value={40} max={200} label="Uploading" />);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("does not render a value label by default", () => {
    render(<ProgressCircle value={40} label="Uploading" />);
    expect(screen.queryByText("40%")).not.toBeInTheDocument();
  });

  it("shows the rounded percentage when showValueLabel is true", () => {
    render(<ProgressCircle value={40.6} showValueLabel label="Uploading" />);
    expect(screen.getByText("41%")).toBeInTheDocument();
  });

  it("does not show a value label while indeterminate, even if showValueLabel is true", () => {
    render(<ProgressCircle showValueLabel label="Loading" />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("uses formatValueLabel to render custom value label content instead of the percentage", () => {
    render(
      <ProgressCircle
        value={3}
        max={5}
        label="Uploading files"
        showValueLabel
        formatValueLabel={(value, max) => `${value}/${max}`}
      />,
    );
    expect(screen.getByText("3/5")).toBeInTheDocument();
    expect(screen.queryByText("60%")).not.toBeInTheDocument();
  });

  it("passes the clamped value and safe max to formatValueLabel, not the raw props", () => {
    const formatValueLabel = vi.fn(() => "formatted");
    render(
      <ProgressCircle
        value={150}
        max={0}
        label="Uploading"
        showValueLabel
        formatValueLabel={formatValueLabel}
      />,
    );
    expect(formatValueLabel).toHaveBeenCalledWith(100, 100);
  });

  it("does not call formatValueLabel while indeterminate", () => {
    const formatValueLabel = vi.fn(() => "formatted");
    render(
      <ProgressCircle
        label="Loading"
        showValueLabel
        formatValueLabel={formatValueLabel}
      />,
    );
    expect(formatValueLabel).not.toHaveBeenCalled();
  });

  it("warns once in development when formatValueLabel is provided without showValueLabel", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <ProgressCircle
        value={40}
        label="Uploading"
        formatValueLabel={() => "x"}
      />,
    );
    rerender(
      <ProgressCircle
        value={60}
        label="Uploading"
        formatValueLabel={() => "x"}
      />,
    );

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("`formatValueLabel` was provided without `showValueLabel`"),
    );
    consoleWarnSpy.mockRestore();
  });

  it("does not warn when formatValueLabel is provided together with showValueLabel", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <ProgressCircle
        value={40}
        label="Uploading"
        showValueLabel
        formatValueLabel={() => "x"}
      />,
    );

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("applies size as a token-driven dimension", () => {
    render(<ProgressCircle value={50} size="lg" label="Uploading" />);
    expect(screen.getByRole("progressbar")).toHaveStyle({
      height: "calc(var(--dbm-icon-size-3xl) * 1.5)",
      width: "calc(var(--dbm-icon-size-3xl) * 1.5)",
    });
  });

  it("applies tone as a token-driven stroke color on the fill", () => {
    const { container } = render(
      <ProgressCircle value={50} tone="success" label="Uploading" />,
    );
    const fillCircle = container.querySelectorAll("circle")[1]!;
    expect(fillCircle).toHaveStyle({ stroke: "var(--dbm-bg-success)" });
  });

  it("forwards ref to the root", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ProgressCircle ref={ref} value={50} label="Uploading" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("applies className to the root", () => {
    render(<ProgressCircle value={50} className="custom" label="Uploading" />);
    expect(screen.getByRole("progressbar")).toHaveClass("custom");
  });

  it("applies id and data-testid to the root", () => {
    render(
      <ProgressCircle
        value={50}
        id="upload-progress"
        data-testid="progress"
        label="Uploading"
      />,
    );
    const bar = screen.getByTestId("progress");
    expect(bar).toBe(screen.getByRole("progressbar"));
    expect(bar).toHaveAttribute("id", "upload-progress");
  });

  it("applies style to the root", () => {
    render(
      <ProgressCircle
        value={50}
        style={{ marginTop: "1rem" }}
        label="Uploading"
      />,
    );
    expect(screen.getByRole("progressbar")).toHaveStyle({
      marginTop: "1rem",
    });
  });

  it("has no accessibility violations, determinate or indeterminate", async () => {
    const { container, rerender } = render(
      <ProgressCircle value={50} label="Uploading" />,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<ProgressCircle label="Loading" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
