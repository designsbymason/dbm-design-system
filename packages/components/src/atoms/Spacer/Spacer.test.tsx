import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Spacer } from "./Spacer";

describe("Spacer", () => {
  it("renders a div", () => {
    render(<Spacer data-testid="spacer" />);
    expect(screen.getByTestId("spacer")).toBeInTheDocument();
  });

  it("is hidden from the accessibility tree", () => {
    render(<Spacer data-testid="spacer" />);
    expect(screen.getByTestId("spacer")).toHaveAttribute("aria-hidden", "true");
  });

  it("grows to fill available space", () => {
    render(<Spacer data-testid="spacer" />);
    expect(screen.getByTestId("spacer")).toHaveStyle({ flex: "1 0 0%" });
  });

  it("forwards ref to the underlying div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Spacer ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards className and native props", () => {
    render(<Spacer className="custom" data-testid="spacer" />);
    expect(screen.getByTestId("spacer")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <div style={{ display: "flex" }}>
        <span>Left</span>
        <Spacer />
        <span>Right</span>
      </div>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
