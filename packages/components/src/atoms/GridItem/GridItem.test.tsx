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

  it("applies colSpan via the CSS custom property", () => {
    render(<GridItem data-testid="item" colSpan={3} />);
    expect(screen.getByTestId("item")).toHaveStyle({ "--griditem-col-span-base": "3" });
  });

  it("applies rowSpan via the CSS custom property", () => {
    render(<GridItem data-testid="item" rowSpan={2} />);
    expect(screen.getByTestId("item")).toHaveStyle({ "--griditem-row-span-base": "2" });
  });

  it("applies colStart via the CSS custom property, alongside colSpan", () => {
    render(<GridItem data-testid="item" colStart={2} colSpan={3} />);
    const el = screen.getByTestId("item");
    expect(el).toHaveStyle({
      "--griditem-col-start-base": "2",
      "--griditem-col-span-base": "3",
    });
  });

  it("applies rowStart via the CSS custom property, alongside rowSpan", () => {
    render(<GridItem data-testid="item" rowStart={2} rowSpan={2} />);
    const el = screen.getByTestId("item");
    expect(el).toHaveStyle({
      "--griditem-row-start-base": "2",
      "--griditem-row-span-base": "2",
    });
  });

  it("applies colStart alone, defaulting span to 1 per the CSS fallback", () => {
    render(<GridItem data-testid="item" colStart={2} />);
    const el = screen.getByTestId("item");
    expect(el.style.getPropertyValue("--griditem-col-start-base")).toBe("2");
    expect(el.style.getPropertyValue("--griditem-col-span-base")).toBe("");
  });

  it("applies rowStart alone, defaulting span to 1 per the CSS fallback", () => {
    render(<GridItem data-testid="item" rowStart={2} />);
    const el = screen.getByTestId("item");
    expect(el.style.getPropertyValue("--griditem-row-start-base")).toBe("2");
    expect(el.style.getPropertyValue("--griditem-row-span-base")).toBe("");
  });

  it("sets responsive colSpan and rowSpan as per-breakpoint CSS variables", () => {
    render(<GridItem data-testid="item" colSpan={{ base: 4, md: 2 }} rowSpan={{ base: 1, lg: 2 }} />);
    const el = screen.getByTestId("item");
    expect(el.style.getPropertyValue("--griditem-col-span-base")).toBe("4");
    expect(el.style.getPropertyValue("--griditem-col-span-md")).toBe("2");
    expect(el.style.getPropertyValue("--griditem-row-span-base")).toBe("1");
    expect(el.style.getPropertyValue("--griditem-row-span-lg")).toBe("2");
  });

  it("renders with no grid placement custom properties when no props are given", () => {
    render(<GridItem data-testid="item" />);
    const el = screen.getByTestId("item");
    expect(el.style.getPropertyValue("--griditem-col-start-base")).toBe("");
    expect(el.style.getPropertyValue("--griditem-col-span-base")).toBe("");
    expect(el.style.getPropertyValue("--griditem-row-start-base")).toBe("");
    expect(el.style.getPropertyValue("--griditem-row-span-base")).toBe("");
  });

  it("renders as the element passed via `as`, keeping GridItem's own placement behavior", () => {
    render(
      <GridItem as="li" data-testid="item" colSpan={2}>
        Item
      </GridItem>,
    );
    const el = screen.getByTestId("item");
    expect(el.tagName).toBe("LI");
    expect(el).toHaveStyle({ "--griditem-col-span-base": "2" });
  });

  it("forwards ref to the element rendered via `as`, not just the default div", () => {
    const ref = createRef<HTMLLIElement>();
    render(
      <GridItem as="li" ref={ref}>
        Item
      </GridItem>,
    );
    expect(ref.current).toBeInstanceOf(HTMLLIElement);
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
