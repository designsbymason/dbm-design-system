import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { GridItem } from "./GridItem";

describe("GridItem", () => {
  it("renders children", () => {
    render(
      <GridItem>
        <span>Item</span>
      </GridItem>,
    );
    expect(screen.getByText("Item")).toBeInTheDocument();
  });

  it("applies colSpan as a grid-column shorthand", () => {
    render(<GridItem data-testid="item" colSpan={3} />);
    expect(screen.getByTestId("item")).toHaveStyle({ gridColumn: "span 3" });
  });

  it("applies rowSpan as a grid-row shorthand", () => {
    render(<GridItem data-testid="item" rowSpan={2} />);
    expect(screen.getByTestId("item")).toHaveStyle({ gridRow: "span 2" });
  });

  it("combines colStart with colSpan into an explicit placement", () => {
    render(<GridItem data-testid="item" colStart={2} colSpan={3} />);
    expect(screen.getByTestId("item")).toHaveStyle({ gridColumn: "2 / span 3" });
  });

  it("renders with no grid placement styles when no props are given", () => {
    render(<GridItem data-testid="item" />);
    const el = screen.getByTestId("item");
    expect(el.style.gridColumn).toBe("");
    expect(el.style.gridRow).toBe("");
  });

  it("forwards ref to the underlying div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<GridItem ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards className and native props", () => {
    render(<GridItem data-testid="item" className="custom" />);
    expect(screen.getByTestId("item")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <GridItem>
        <button type="button">Accessible</button>
      </GridItem>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
