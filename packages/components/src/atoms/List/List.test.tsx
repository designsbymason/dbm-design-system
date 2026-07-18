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
    expect(screen.getByTestId("list")).toHaveStyle({ listStyleType: "decimal" });
  });

  it("allows overriding the marker", () => {
    render(<List marker="none" data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveStyle({ listStyleType: "none" });
  });

  it("applies spacing as a token-driven gap", () => {
    render(<List spacing={4} data-testid="list" />);
    expect(screen.getByTestId("list")).toHaveStyle({ gap: "var(--dbm-space-4)" });
  });

  it("forwards ref to the underlying list element", () => {
    const ref = createRef<HTMLUListElement>();
    render(<List ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLUListElement);
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
