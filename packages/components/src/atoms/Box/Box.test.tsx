import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef, forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
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

  it("forwards ref to the element rendered via `as`, not just the default div", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Box as="button" ref={ref}>
        content
      </Box>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.tagName).toBe("BUTTON");
  });

  it("renders as a custom component passed via `as`, forwarding that component's own props", () => {
    interface CustomProps extends ComponentPropsWithoutRef<"div"> {
      label: string;
    }
    const Custom = forwardRef<HTMLDivElement, CustomProps>(({ label, ...props }, ref) => (
      <div ref={ref} data-label={label} {...props} />
    ));
    Custom.displayName = "Custom";

    render(
      <Box as={Custom} label="hello" data-testid="box">
        content
      </Box>,
    );
    expect(screen.getByTestId("box")).toHaveAttribute("data-label", "hello");
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
