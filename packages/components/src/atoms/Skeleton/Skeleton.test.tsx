import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./Skeleton";

describe("Skeleton", () => {
  it("renders a div", () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton").tagName).toBe("DIV");
  });

  it("is hidden from the accessibility tree", () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("applies width and height via inline style", () => {
    render(<Skeleton data-testid="skeleton" width={120} height="2rem" />);
    const el = screen.getByTestId("skeleton");
    expect(el).toHaveStyle({ width: "120px", height: "2rem" });
  });

  it("defaults to the text variant", () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveStyle({ height: "1em" });
  });

  it("gives circular and rectangular variants a default size when no width/height is passed", () => {
    const { rerender } = render(
      <Skeleton variant="circular" data-testid="skeleton" />,
    );
    expect(screen.getByTestId("skeleton").className).toMatch(/variantCircular/);

    rerender(<Skeleton variant="rectangular" data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton").className).toMatch(
      /variantRectangular/,
    );
  });

  it("still lets explicit width/height override the variant's default size", () => {
    render(
      <Skeleton
        variant="circular"
        width={64}
        height={64}
        data-testid="skeleton"
      />,
    );
    expect(screen.getByTestId("skeleton")).toHaveStyle({
      width: "64px",
      height: "64px",
    });
  });

  it("defaults to pulse animation and supports wave/none", () => {
    const { rerender } = render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton").className).toMatch(/animationPulse/);

    rerender(<Skeleton animation="wave" data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton").className).toMatch(/animationWave/);

    rerender(<Skeleton animation="none" data-testid="skeleton" />);
    const cls = screen.getByTestId("skeleton").className;
    expect(cls).not.toMatch(/animationPulse/);
    expect(cls).not.toMatch(/animationWave/);
  });

  it("forwards ref to the underlying div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Skeleton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards className and native props", () => {
    render(<Skeleton className="custom" data-testid="skeleton" />);
    expect(screen.getByTestId("skeleton")).toHaveClass("custom");
  });

  it("has no accessibility violations across variants and animations", async () => {
    const { container, rerender } = render(<Skeleton variant="text" />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Skeleton variant="circular" width={40} height={40} />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Skeleton variant="rectangular" animation="wave" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
