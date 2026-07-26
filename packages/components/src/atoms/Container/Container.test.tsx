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
    const { rerender } = render(
      <Container data-testid="container" size="sm" />,
    );
    expect(screen.getByTestId("container")).toHaveStyle({
      maxWidth: "var(--dbm-breakpoint-sm)",
    });

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

  it("defaults paddingInline to space-4 via the CSS custom property", () => {
    render(<Container data-testid="container" />);
    expect(screen.getByTestId("container")).toHaveStyle({
      "--container-padding-base": "var(--dbm-space-4)",
    });
  });

  it("sets a responsive paddingInline as per-breakpoint CSS variables", () => {
    render(
      <Container data-testid="container" paddingInline={{ base: 2, lg: 8 }} />,
    );
    const el = screen.getByTestId("container");
    expect(el.style.getPropertyValue("--container-padding-base")).toBe(
      "var(--dbm-space-2)",
    );
    expect(el.style.getPropertyValue("--container-padding-lg")).toBe(
      "var(--dbm-space-8)",
    );
  });

  it("renders as the element passed via `as`, keeping Container's own layout behavior", () => {
    render(
      <Container as="main" data-testid="container">
        content
      </Container>,
    );
    const el = screen.getByTestId("container");
    expect(el.tagName).toBe("MAIN");
    expect(el).toHaveStyle({ maxWidth: "var(--dbm-breakpoint-xl)" });
  });

  it("forwards ref to the element rendered via `as`, not just the default div", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Container as="main" ref={ref}>
        content
      </Container>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe("MAIN");
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
