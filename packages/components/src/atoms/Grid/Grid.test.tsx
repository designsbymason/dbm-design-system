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
    expect(screen.getByTestId("grid")).toHaveStyle({ gap: "var(--dbm-space-6)" });
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
