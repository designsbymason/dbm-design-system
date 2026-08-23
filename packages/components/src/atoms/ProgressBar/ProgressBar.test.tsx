import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("renders role=progressbar with aria-valuenow/min/max for a determinate value", () => {
    render(<ProgressBar value={40} label="Uploading" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("never lets a same-named consumer prop override the computed role/aria-valuenow/aria-valuemax (found in review — TypeScript's JSX checker allows aria-*/role props through regardless of the declared prop type, so this is enforced by JSX attribute order, not by the type system alone)", () => {
    render(
      // eslint-disable-next-line jsx-a11y/role-supports-aria-props -- deliberately invalid combination; the test exists to prove the component ignores it rather than render it
      <ProgressBar
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

  it("warns once in development when neither label nor aria-labelledby is provided", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<ProgressBar value={40} />);
    rerender(<ProgressBar value={60} />);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("no accessible name"),
    );
    consoleWarnSpy.mockRestore();
  });

  it("does not warn when label is provided", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ProgressBar value={40} label="Uploading" />);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("does not warn when aria-labelledby is provided instead of label", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ProgressBar value={40} aria-labelledby="external-label" />);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("omits aria-valuenow when indeterminate", () => {
    render(<ProgressBar label="Loading" />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute(
      "aria-valuenow",
    );
  });

  it("sets the fill width from value/max as a percentage", () => {
    const { container } = render(<ProgressBar value={40} label="Uploading" />);
    const fill = container.querySelector(
      "[role='progressbar'] > div",
    ) as HTMLElement;
    expect(fill.style.width).toBe("40%");
  });

  it("respects a custom max when computing the percentage", () => {
    const { container } = render(
      <ProgressBar value={40} max={200} label="Uploading" />,
    );
    const fill = container.querySelector(
      "[role='progressbar'] > div",
    ) as HTMLElement;
    expect(fill.style.width).toBe("20%");
  });

  it.each([0, -10, NaN])(
    "falls back to the default max of 100 when max is invalid (%s)",
    (invalidMax) => {
      const { container } = render(
        <ProgressBar value={40} max={invalidMax} label="Uploading" />,
      );
      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveAttribute("aria-valuemax", "100");
      expect(bar).toHaveAttribute("aria-valuenow", "40");
      const fill = container.querySelector(
        "[role='progressbar'] > div",
      ) as HTMLElement;
      expect(fill.style.width).toBe("40%");
    },
  );

  it("warns once in development when max is invalid", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <ProgressBar value={40} max={0} label="Uploading" />,
    );
    rerender(<ProgressBar value={60} max={0} label="Uploading" />);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("`max` must be greater than 0"),
    );
    consoleWarnSpy.mockRestore();
  });

  it("does not warn when max is valid", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ProgressBar value={40} max={200} label="Uploading" />);

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("clamps value within [0, max]", () => {
    const { rerender, container } = render(
      <ProgressBar value={150} label="Uploading" />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    let fill = container.querySelector(
      "[role='progressbar'] > div",
    ) as HTMLElement;
    expect(fill.style.width).toBe("100%");

    rerender(<ProgressBar value={-10} label="Uploading" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    fill = container.querySelector("[role='progressbar'] > div") as HTMLElement;
    expect(fill.style.width).toBe("0%");
  });

  it("does not set an inline width when indeterminate", () => {
    const { container } = render(<ProgressBar label="Loading" />);
    const fill = container.querySelector(
      "[role='progressbar'] > div",
    ) as HTMLElement;
    expect(fill.style.width).toBe("");
  });

  it("applies tone as a token-driven background color", () => {
    const { container } = render(
      <ProgressBar value={50} tone="success" label="Uploading" />,
    );
    const fill = container.querySelector(
      "[role='progressbar'] > div",
    ) as HTMLElement;
    expect(fill).toHaveStyle({ backgroundColor: "var(--dbm-bg-success)" });
  });

  it("applies size as a token-driven height on the track", () => {
    render(<ProgressBar value={50} size="lg" label="Uploading" />);
    expect(screen.getByRole("progressbar")).toHaveStyle({
      height: "var(--dbm-space-3)",
    });
  });

  it("forwards ref to the track", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ProgressBar ref={ref} value={50} label="Uploading" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("applies className to the track", () => {
    render(<ProgressBar value={50} className="custom" label="Uploading" />);
    expect(screen.getByRole("progressbar")).toHaveClass("custom");
  });

  it("applies id and data-testid to the track", () => {
    render(
      <ProgressBar
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

  it("applies style to the track, merged with the internal width style on the fill", () => {
    const { container } = render(
      <ProgressBar
        value={50}
        style={{ marginTop: "1rem" }}
        label="Uploading"
      />,
    );
    expect(screen.getByRole("progressbar")).toHaveStyle({
      marginTop: "1rem",
    });
    const fill = container.querySelector(
      "[role='progressbar'] > div",
    ) as HTMLElement;
    expect(fill.style.width).toBe("50%");
  });

  it("sets aria-valuetext when provided, alongside the numeric aria-valuenow", () => {
    render(
      <ProgressBar
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
    render(<ProgressBar value={40} label="Uploading" />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute(
      "aria-valuetext",
    );
  });

  it("does not render a value label by default", () => {
    render(<ProgressBar value={40} label="Uploading" />);
    expect(screen.queryByText("40%")).not.toBeInTheDocument();
  });

  it("renders the rounded percentage as text when showValueLabel is set", () => {
    render(<ProgressBar value={33.6} label="Uploading" showValueLabel />);
    expect(screen.getByText("34%")).toBeInTheDocument();
  });

  it("respects a custom max when rendering the value label", () => {
    render(
      <ProgressBar value={50} max={200} label="Uploading" showValueLabel />,
    );
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("does not render a value label while indeterminate, even if showValueLabel is set", () => {
    render(<ProgressBar label="Loading" showValueLabel />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("uses formatValueLabel to render custom value label content instead of the percentage", () => {
    render(
      <ProgressBar
        value={3}
        max={5}
        label="Uploading files"
        showValueLabel
        formatValueLabel={(value, max) => `${value} of ${max} files`}
      />,
    );
    expect(screen.getByText("3 of 5 files")).toBeInTheDocument();
    expect(screen.queryByText("60%")).not.toBeInTheDocument();
  });

  it("passes the clamped value and safe max to formatValueLabel, not the raw props", () => {
    const formatValueLabel = vi.fn(() => "formatted");
    render(
      <ProgressBar
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
      <ProgressBar
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
      <ProgressBar
        value={40}
        label="Uploading"
        formatValueLabel={() => "x"}
      />,
    );
    rerender(
      <ProgressBar
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
      <ProgressBar
        value={40}
        label="Uploading"
        showValueLabel
        formatValueLabel={() => "x"}
      />,
    );

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("has no accessibility violations, determinate or indeterminate, with or without a value label", async () => {
    const { container, rerender } = render(
      <ProgressBar value={50} label="Uploading" />,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<ProgressBar value={50} label="Uploading" showValueLabel />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<ProgressBar label="Loading" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
