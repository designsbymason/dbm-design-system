import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { ListItem } from "../ListItem";
import { List } from "./List";

describe("List", () => {
  it("renders a <ul> by default", () => {
    render(
      <List data-testid="list">
        <ListItem>Item</ListItem>
      </List>,
    );
    expect(screen.getByTestId("list").tagName).toBe("UL");
  });

  it('renders an <ol> when as="ol"', () => {
    render(
      <List as="ol" data-testid="list">
        <ListItem>Item</ListItem>
      </List>,
    );
    expect(screen.getByTestId("list").tagName).toBe("OL");
  });

  it("defaults marker to disc for ul and decimal for ol", () => {
    const { rerender } = render(<List data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveStyle({ listStyleType: "disc" });

    rerender(<List as="ol" data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveStyle({
      listStyleType: "decimal",
    });
  });

  it("allows overriding the marker", () => {
    render(<List marker="none" data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveStyle({ listStyleType: "none" });
  });

  it("applies spacing as a token-driven CSS variable", () => {
    render(<List spacing={4} data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveStyle({
      "--list-gap-base": "var(--dbm-space-4)",
    });
  });

  it("sets a responsive spacing as per-breakpoint CSS variables", () => {
    render(<List spacing={{ base: 1, lg: 6 }} data-testid="list" />);
    const el = screen.getByTestId("list");
    expect(el.style.getPropertyValue("--list-gap-base")).toBe(
      "var(--dbm-space-1)",
    );
    expect(el.style.getPropertyValue("--list-gap-lg")).toBe(
      "var(--dbm-space-6)",
    );
  });

  it("does not add role=list when a marker is present", () => {
    render(<List data-testid="list" />);
    expect(screen.getByTestId("list")).not.toHaveAttribute("role");
  });

  it('adds role="list" when marker="none" (Safari/VoiceOver list-role fix)', () => {
    render(<List marker="none" data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveAttribute("role", "list");
  });

  it("renders as ol with ol-specific native props (start, reversed)", () => {
    render(
      <List as="ol" start={5} reversed data-testid="list">
        <ListItem>Item</ListItem>
      </List>,
    );
    const el = screen.getByTestId("list");
    expect(el.tagName).toBe("OL");
    expect(el).toHaveAttribute("start", "5");
    expect(el).toHaveAttribute("reversed");
  });

  it("forwards ref to the underlying list element", () => {
    const ref = createRef<HTMLUListElement>();
    render(<List ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLUListElement);
  });

  it("forwards ref to the element rendered via `as`, not just the default ul", () => {
    const ref = createRef<HTMLOListElement>();
    render(<List as="ol" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLOListElement);
  });

  it("forwards className and native props", () => {
    render(<List className="custom" data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <List>
        <ListItem>One</ListItem>
        <ListItem>Two</ListItem>
      </List>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
