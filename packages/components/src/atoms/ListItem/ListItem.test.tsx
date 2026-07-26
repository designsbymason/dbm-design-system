import { CheckIcon } from "@dbm-design-system/icons";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
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

  it("does not add a role by default within a marked list", () => {
    render(
      <List>
        <ListItem data-testid="item">Item</ListItem>
      </List>,
    );
    expect(screen.getByTestId("item")).not.toHaveAttribute("role");
  });

  it('adds role="listitem" when the ancestor List has marker="none"', () => {
    render(
      <List marker="none">
        <ListItem data-testid="item">Item</ListItem>
      </List>,
    );
    expect(screen.getByTestId("item")).toHaveAttribute("role", "listitem");
  });

  it('adds role="listitem" when it has its own icon marker, regardless of the ancestor marker', () => {
    render(
      <List>
        <ListItem icon={CheckIcon} data-testid="item">
          Item
        </ListItem>
      </List>,
    );
    expect(screen.getByTestId("item")).toHaveAttribute("role", "listitem");
  });

  it("renders the icon decoratively before the content", () => {
    render(
      <List>
        <ListItem icon={CheckIcon} data-testid="item">
          Done
        </ListItem>
      </List>,
    );
    const item = screen.getByTestId("item");
    const icon = item.querySelector("svg");
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  describe("interactive", () => {
    it("renders its interactive surface with role=button and tabIndex=0", () => {
      render(
        <List>
          <ListItem interactive>Item</ListItem>
        </List>,
      );
      const row = screen.getByRole("button", { name: "Item" });
      expect(row).toHaveAttribute("tabIndex", "0");
    });

    it("does not put role=button on the <li> itself (ARIA list validity)", () => {
      render(
        <List>
          <ListItem interactive data-testid="item">
            Item
          </ListItem>
        </List>,
      );
      expect(screen.getByTestId("item")).not.toHaveAttribute("role", "button");
    });

    it("calls onClick when clicked", () => {
      const onClick = vi.fn();
      render(
        <List>
          <ListItem interactive onClick={onClick}>
            Item
          </ListItem>
        </List>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Item" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("activates onClick via Enter and Space", () => {
      const onClick = vi.fn();
      render(
        <List>
          <ListItem interactive onClick={onClick}>
            Item
          </ListItem>
        </List>,
      );
      const row = screen.getByRole("button", { name: "Item" });
      fireEvent.keyDown(row, { key: "Enter" });
      fireEvent.keyDown(row, { key: " " });
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    it('applies aria-current="true" and selected styling when selected', () => {
      render(
        <List>
          <ListItem interactive selected>
            Item
          </ListItem>
        </List>,
      );
      const row = screen.getByRole("button", { name: "Item" });
      expect(row).toHaveAttribute("aria-current", "true");
      expect(row.className).toMatch(/selected/);
    });

    it("does not set aria-current when not selected", () => {
      render(
        <List>
          <ListItem interactive>Item</ListItem>
        </List>,
      );
      expect(screen.getByRole("button", { name: "Item" })).not.toHaveAttribute("aria-current");
    });
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

  it("has no accessibility violations when interactive and selected", async () => {
    const { container } = render(
      <List marker="none">
        <ListItem interactive selected onClick={() => {}}>
          Accessible interactive item
        </ListItem>
      </List>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
