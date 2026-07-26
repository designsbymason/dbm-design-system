import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
  it("renders role=progressbar with aria-valuenow/min/max for a determinate value", () => {
    render(<ProgressBar value={40} label="Uploading" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
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

  it("has no accessibility violations, determinate or indeterminate", async () => {
    const { container, rerender } = render(
      <ProgressBar value={50} label="Uploading" />,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<ProgressBar label="Loading" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
