import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Grid } from "./Grid";

describe("Grid", () => {
  it("renders children", () => {
    render(
      <Grid>
        <span>Item</span>
      </Grid>,
    );
    expect(screen.getByText("Item")).toBeInTheDocument();
  });

  it("renders as a CSS grid", () => {
    render(<Grid data-testid="grid" />);
    expect(screen.getByTestId("grid")).toHaveStyle({ display: "grid" });
  });

  it("defaults to 12 base columns via the CSS custom property", () => {
    render(<Grid data-testid="grid" />);
    expect(screen.getByTestId("grid")).toHaveStyle({ "--grid-cols-base": "12" });
  });

  it("accepts a fixed column count", () => {
    render(<Grid data-testid="grid" columns={4} />);
    expect(screen.getByTestId("grid")).toHaveStyle({ "--grid-cols-base": "4" });
  });

  it("accepts a responsive column map, setting one custom property per breakpoint", () => {
    render(<Grid data-testid="grid" columns={{ base: 1, md: 2, lg: 3 }} />);
    const el = screen.getByTestId("grid");
    expect(el).toHaveStyle({
      "--grid-cols-base": "1",
      "--grid-cols-md": "2",
      "--grid-cols-lg": "3",
    });
  });

  it("applies gap as a token-driven CSS variable", () => {
    render(<Grid data-testid="grid" gap={6} />);
    expect(screen.getByTestId("grid")).toHaveStyle({ "--grid-gap-base": "var(--dbm-space-6)" });
  });

  it("accepts a responsive gap map, setting one custom property per breakpoint", () => {
    render(<Grid data-testid="grid" gap={{ base: 2, lg: 8 }} />);
    const el = screen.getByTestId("grid");
    expect(el.style.getPropertyValue("--grid-gap-base")).toBe("var(--dbm-space-2)");
    expect(el.style.getPropertyValue("--grid-gap-lg")).toBe("var(--dbm-space-8)");
  });

  it("overrides the column template with minChildWidth when set", () => {
    render(<Grid data-testid="grid" columns={4} minChildWidth="12rem" />);
    expect(screen.getByTestId("grid")).toHaveStyle({
      gridTemplateColumns: "repeat(auto-fill, minmax(12rem, 1fr))",
    });
  });

  it("applies autoFlow, autoRows, and autoColumns", () => {
    render(
      <Grid data-testid="grid" autoFlow="row dense" autoRows="minmax(6rem, auto)" autoColumns="1fr" />,
    );
    expect(screen.getByTestId("grid")).toHaveStyle({
      gridAutoFlow: "row dense",
      gridAutoRows: "minmax(6rem, auto)",
      gridAutoColumns: "1fr",
    });
  });

  it("renders as the element passed via `as`, keeping Grid's own layout behavior", () => {
    render(
      <Grid as="ul" data-testid="grid" columns={2}>
        <li>One</li>
      </Grid>,
    );
    const el = screen.getByTestId("grid");
    expect(el.tagName).toBe("UL");
    expect(el).toHaveStyle({ display: "grid" });
  });

  it("forwards ref to the element rendered via `as`, not just the default div", () => {
    const ref = createRef<HTMLUListElement>();
    render(
      <Grid as="ul" ref={ref}>
        <li>One</li>
      </Grid>,
    );
    expect(ref.current).toBeInstanceOf(HTMLUListElement);
  });

  it("forwards ref to the underlying div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Grid ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards className and native props", () => {
    render(<Grid data-testid="grid" className="custom" />);
    expect(screen.getByTestId("grid")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Grid columns={2}>
        <button type="button">One</button>
        <button type="button">Two</button>
      </Grid>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
