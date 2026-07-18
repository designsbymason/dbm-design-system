import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Box } from "./Box";

describe("Box", () => {
  it("renders a div by default", () => {
    render(<Box data-testid="box">content</Box>);
    expect(screen.getByTestId("box").tagName).toBe("DIV");
  });

  it("renders as the element passed via `as`", () => {
    render(
      <Box as="section" data-testid="box">
        content
      </Box>,
    );
    expect(screen.getByTestId("box").tagName).toBe("SECTION");
  });

  it("type-checks native props of the `as` element", () => {
    render(
      <Box as="button" type="submit" data-testid="box">
        content
      </Box>,
    );
    expect(screen.getByTestId("box")).toHaveAttribute("type", "submit");
  });

  it("forwards ref to the underlying element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Box ref={ref}>content</Box>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards className and native props", () => {
    render(
      <Box className="custom" data-testid="box">
        content
      </Box>,
    );
    expect(screen.getByTestId("box")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Box as="main">Accessible content</Box>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
