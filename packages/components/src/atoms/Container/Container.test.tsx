import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Container } from "./Container";

describe("Container", () => {
  it("renders children", () => {
    render(
      <Container>
        <span>Content</span>
      </Container>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it('defaults to size="xl"', () => {
    render(<Container data-testid="container" />);
    expect(screen.getByTestId("container")).toHaveStyle({
      maxWidth: "var(--dbm-breakpoint-xl)",
    });
  });

  it("applies the max-width for each size", () => {
    const { rerender } = render(<Container data-testid="container" size="sm" />);
    expect(screen.getByTestId("container")).toHaveStyle({ maxWidth: "var(--dbm-breakpoint-sm)" });

    rerender(<Container data-testid="container" size="3xl" />);
    expect(screen.getByTestId("container")).toHaveStyle({
      maxWidth: "var(--dbm-breakpoint-3xl)",
    });
  });

  it('removes the max-width constraint for size="full"', () => {
    render(<Container data-testid="container" size="full" />);
    expect(screen.getByTestId("container")).toHaveStyle({ maxWidth: "none" });
  });

  it("forwards ref to the underlying div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Container ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards className and native props", () => {
    render(<Container data-testid="container" className="custom" />);
    expect(screen.getByTestId("container")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Container>
        <main>Accessible content</main>
      </Container>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
