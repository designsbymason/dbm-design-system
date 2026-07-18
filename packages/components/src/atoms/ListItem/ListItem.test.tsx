import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { List } from "../List";
import { ListItem } from "./ListItem";

describe("ListItem", () => {
  it("renders as an li within a list", () => {
    render(
      <List>
        <ListItem>Item text</ListItem>
      </List>,
    );
    const item = screen.getByText("Item text");
    expect(item.tagName).toBe("LI");
  });

  it("forwards ref to the underlying li", () => {
    const ref = createRef<HTMLLIElement>();
    render(
      <List>
        <ListItem ref={ref}>Item</ListItem>
      </List>,
    );
    expect(ref.current).toBeInstanceOf(HTMLLIElement);
  });

  it("forwards className and native props", () => {
    render(
      <List>
        <ListItem className="custom" data-testid="item">
          Item
        </ListItem>
      </List>,
    );
    expect(screen.getByTestId("item")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <List>
        <ListItem>Accessible item</ListItem>
      </List>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
