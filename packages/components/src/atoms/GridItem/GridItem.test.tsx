import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GridItem } from "./GridItem";

describe("GridItem", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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
    expect(screen.getByTestId("item")).toHaveStyle({
      "--griditem-col-span-base": "3",
    });
  });

  it("applies rowSpan via the CSS custom property", () => {
    render(<GridItem data-testid="item" rowSpan={2} />);
    expect(screen.getByTestId("item")).toHaveStyle({
      "--griditem-row-span-base": "2",
    });
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
    render(
      <GridItem
        data-testid="item"
        colSpan={{ base: 4, md: 2 }}
        rowSpan={{ base: 1, lg: 2 }}
      />,
    );
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
    expect(el.style.getPropertyValue("--griditem-order-base")).toBe("");
  });

  it("applies order via the CSS custom property", () => {
    render(<GridItem data-testid="item" order={2} />);
    expect(screen.getByTestId("item").style.getPropertyValue("--griditem-order-base")).toBe("2");
  });

  it("sets responsive order as per-breakpoint CSS variables", () => {
    render(<GridItem data-testid="item" order={{ base: 2, md: 1 }} />);
    const el = screen.getByTestId("item");
    expect(el.style.getPropertyValue("--griditem-order-base")).toBe("2");
    expect(el.style.getPropertyValue("--griditem-order-md")).toBe("1");
  });

  describe("invalid span warning", () => {
    it("warns when colSpan is zero", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<GridItem colSpan={0} />);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("must be a positive integer"),
      );
    });

    it("warns when rowSpan is negative", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<GridItem rowSpan={-1} />);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("must be a positive integer"),
      );
    });

    it("warns when a responsive colSpan map contains a non-positive value", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<GridItem colSpan={{ base: 4, md: 0 }} />);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("must be a positive integer"),
      );
    });

    it("does not warn for a valid positive colSpan/rowSpan", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<GridItem colSpan={2} rowSpan={1} />);
      expect(warnSpy).not.toHaveBeenCalled();
    });
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

  it("merges style and applies id", () => {
    render(<GridItem data-testid="item" id="my-item" style={{ background: "red" }} />);
    const el = screen.getByTestId("item");
    expect(el.id).toBe("my-item");
    expect(el).toHaveStyle({ background: "red" });
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

  it('has no accessibility violations with as="li", used correctly inside a real list', async () => {
    // Per the established convention (a polymorphic component's automated
    // check must also cover a non-default `as`, not just the default) —
    // GridItem sets no ARIA of its own, so there's no latent bug to find
    // here the way Avatar's role conflict was; this instead confirms
    // GridItem introduces no problems under its one realistic non-default
    // `as` usage (a real <ul>/<ol> ancestor, matching the `AsListItem`
    // story). Confirmed empirically first: rendering `as="li"` *without*
    // a real list ancestor does trigger axe's own "listitem" rule — an
    // inherent property of `<li>` outside list context, not something
    // GridItem could or should suppress; it's the caller's responsibility
    // to use `as="li"` inside a real list, same as any other element.
    const { container } = render(
      <ul>
        <GridItem as="li">Item</GridItem>
      </ul>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
