import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { ProgressCircle } from "./ProgressCircle";

describe("ProgressCircle", () => {
  it("renders role=progressbar with aria-valuenow/min/max for a determinate value", () => {
    render(<ProgressCircle value={40} label="Uploading" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
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

  it("applies size as a token-driven dimension", () => {
    render(<ProgressCircle value={50} size="lg" label="Uploading" />);
    expect(screen.getByRole("progressbar")).toHaveStyle({
      height: "calc(var(--dbm-icon-size-3xl) * 1.5)",
      width: "calc(var(--dbm-icon-size-3xl) * 1.5)",
    });
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
