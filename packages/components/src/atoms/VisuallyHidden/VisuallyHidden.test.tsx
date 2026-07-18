import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { VisuallyHidden } from "./VisuallyHidden";

describe("VisuallyHidden", () => {
  it("keeps children in the accessibility tree", () => {
    render(<VisuallyHidden>Screen-reader-only text</VisuallyHidden>);
    expect(screen.getByText("Screen-reader-only text")).toBeInTheDocument();
  });

  it("applies the visually-hidden clipping technique", () => {
    render(<VisuallyHidden data-testid="vh">text</VisuallyHidden>);
    expect(screen.getByTestId("vh")).toHaveStyle({
      position: "absolute",
      overflow: "hidden",
      width: "1px",
      height: "1px",
    });
  });

  it("forwards ref to the underlying span", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<VisuallyHidden ref={ref}>text</VisuallyHidden>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("forwards className and native span props", () => {
    render(
      <VisuallyHidden className="custom" data-testid="vh">
        text
      </VisuallyHidden>,
    );
    expect(screen.getByTestId("vh")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<VisuallyHidden>Accessible text</VisuallyHidden>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
