import { CheckIcon } from "@dbm-design-system/icons";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { List } from "../../molecules/List";
import { ListItem } from "./ListItem";

describe("ListItem", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("applies style, id, and value", () => {
    render(
      <List as="ol">
        <ListItem style={{ fontWeight: 700 }} id="my-item" value={5} data-testid="item">
          Item
        </ListItem>
      </List>,
    );
    const el = screen.getByTestId("item");
    expect(el).toHaveStyle({ fontWeight: "700" });
    expect(el.id).toBe("my-item");
    expect(el).toHaveAttribute("value", "5");
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

  it("does not let a caller-supplied role override the computed role", () => {
    // Regression test: {...props} previously spread after the computed
    // `role`, so a caller's own `role` silently won — confirmed empirically
    // before fixing (guidelines/05-component-api-conventions.md §3).
    render(
      <List marker="none">
        <ListItem role="menuitem" data-testid="item">
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

  describe("trailing", () => {
    it("keeps the <li>'s own display as list-item, preserving its native marker", () => {
      // Regression test: row layout for `trailing` previously lived
      // directly on the <li> itself (`display: flex`), which drops a list
      // item's marker outright regardless of `list-style` — confirmed
      // empirically before fixing. `trailing` alone must not suppress the
      // marker; only a custom `icon` does that, deliberately.
      render(
        <List>
          <ListItem trailing={<span>3</span>} data-testid="item">
            Inbox
          </ListItem>
        </List>,
      );
      const item = screen.getByTestId("item");
      expect(getComputedStyle(item).display).toBe("list-item");
      expect(getComputedStyle(item).listStyleType).not.toBe("none");
    });

    it("renders trailing content as a sibling of the main content", () => {
      render(
        <List>
          <ListItem trailing={<span data-testid="trailing-content">3</span>}>Inbox</ListItem>
        </List>,
      );
      expect(screen.getByTestId("trailing-content")).toBeInTheDocument();
    });

    it("renders trailing content outside the interactive surface, not nested inside it", () => {
      render(
        <List>
          <ListItem interactive trailing={<button type="button">Edit</button>}>
            Inbox
          </ListItem>
        </List>,
      );
      const row = screen.getByRole("button", { name: "Inbox" });
      const trailingButton = screen.getByRole("button", { name: "Edit" });
      expect(row.contains(trailingButton)).toBe(false);
    });

    it("clicking trailing content does not trigger the row's own onClick", () => {
      const onClick = vi.fn();
      const onTrailingClick = vi.fn();
      render(
        <List>
          <ListItem
            interactive
            onClick={onClick}
            trailing={
              <button type="button" onClick={onTrailingClick}>
                Edit
              </button>
            }
          >
            Inbox
          </ListItem>
        </List>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Edit" }));
      expect(onTrailingClick).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    });
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

    it("warns and has no effect when selected without interactive", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <List>
          <ListItem selected data-testid="item">
            Item
          </ListItem>
        </List>,
      );
      expect(screen.getByTestId("item")).not.toHaveAttribute("aria-current");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("`selected` has no effect"));
    });

    it("applies aria-label to the interactive surface, not the <li>", () => {
      render(
        <List>
          <ListItem interactive aria-label="Home" data-testid="item" />
        </List>,
      );
      expect(screen.getByTestId("item")).not.toHaveAttribute("aria-label");
      expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
    });

    it("warns when an interactive item has no accessible name", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <List>
          <ListItem interactive icon={CheckIcon} />
        </List>,
      );
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("no accessible name"));
    });

    it("does not warn about accessible name when aria-label is provided", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <List>
          <ListItem interactive icon={CheckIcon} aria-label="Done" />
        </List>,
      );
      expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining("no accessible name"));
    });
  });

  describe("disabled", () => {
    it("is not disabled by default", () => {
      render(
        <List>
          <ListItem interactive>Item</ListItem>
        </List>,
      );
      expect(screen.getByRole("button", { name: "Item" })).not.toHaveAttribute("aria-disabled");
    });

    it("applies aria-disabled without removing the item from the tab order", () => {
      render(
        <List>
          <ListItem interactive disabled>
            Item
          </ListItem>
        </List>,
      );
      const row = screen.getByRole("button", { name: "Item" });
      expect(row).toHaveAttribute("aria-disabled", "true");
      expect(row).toHaveAttribute("tabIndex", "0");
    });

    it("blocks the click handler when disabled", () => {
      const onClick = vi.fn();
      render(
        <List>
          <ListItem interactive disabled onClick={onClick}>
            Item
          </ListItem>
        </List>,
      );
      fireEvent.click(screen.getByRole("button", { name: "Item" }));
      expect(onClick).not.toHaveBeenCalled();
    });

    it("blocks Enter/Space activation when disabled", () => {
      const onClick = vi.fn();
      render(
        <List>
          <ListItem interactive disabled onClick={onClick}>
            Item
          </ListItem>
        </List>,
      );
      const row = screen.getByRole("button", { name: "Item" });
      fireEvent.keyDown(row, { key: "Enter" });
      fireEvent.keyDown(row, { key: " " });
      expect(onClick).not.toHaveBeenCalled();
    });

    it("still fires onClick when not disabled", () => {
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

    it("warns and has no effect when disabled without interactive", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const onClick = vi.fn();
      render(
        <List>
          <ListItem disabled onClick={onClick} data-testid="item">
            Item
          </ListItem>
        </List>,
      );
      fireEvent.click(screen.getByTestId("item"));
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("`disabled` has no effect"));
    });

    it("has no accessibility violations when disabled", async () => {
      const { container } = render(
        <List>
          <ListItem interactive disabled>
            Item
          </ListItem>
        </List>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
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

  it("has no accessibility violations with trailing content", async () => {
    const { container } = render(
      <List>
        <ListItem trailing={<span aria-label="3 unread">3</span>}>Inbox</ListItem>
      </List>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
