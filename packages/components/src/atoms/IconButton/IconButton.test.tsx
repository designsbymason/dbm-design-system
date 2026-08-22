import { TrashIcon } from "@dbm-design-system/icons";
import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("renders a button with the required accessible name", () => {
    render(<IconButton icon={TrashIcon} aria-label="Delete item" />);
    expect(
      screen.getByRole("button", { name: "Delete item" }),
    ).toBeInTheDocument();
  });

  it("renders the given icon", () => {
    render(<IconButton icon={TrashIcon} aria-label="Delete" />);
    expect(screen.getByRole("button").querySelector("svg")).toBeInTheDocument();
  });

  it("applies variant and size tokens", () => {
    render(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        variant="destructive"
        size="xl"
      />,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveStyle({
      backgroundColor: "var(--dbm-bg-danger)",
      color: "var(--dbm-icon-on-danger)",
      paddingBlock: "var(--dbm-space-3)",
      paddingInline: "var(--dbm-space-3)",
    });
  });

  it("shows a spinner and disables the button when isLoading", () => {
    render(<IconButton icon={TrashIcon} aria-label="Delete" isLoading />);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("svg")).not.toBeInTheDocument();
    expect(button.querySelector("[aria-hidden='true']")).toBeInTheDocument();
  });

  it("renders the single child via Slot when asChild is set", () => {
    render(
      <IconButton asChild icon={TrashIcon} aria-label="Delete">
        <a href="/delete">×</a>
      </IconButton>,
    );
    const link = screen.getByRole("link", { name: "Delete" });
    expect(link.tagName).toBe("A");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(
      <IconButton icon={TrashIcon} aria-label="Delete" onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        disabled
        onClick={onClick}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type="button" but respects an explicit type override', () => {
    const { rerender } = render(
      <IconButton icon={TrashIcon} aria-label="Delete" />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");

    rerender(<IconButton icon={TrashIcon} aria-label="Delete" type="submit" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("overrides aria-label with loadingLabel while isLoading, falling back to aria-label otherwise", () => {
    const { rerender } = render(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        isLoading
        loadingLabel="Deleting…"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Deleting…" }),
    ).toBeInTheDocument();

    rerender(<IconButton icon={TrashIcon} aria-label="Delete" isLoading />);
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("applies rounded styling", () => {
    render(<IconButton icon={TrashIcon} aria-label="Delete" rounded />);
    expect(screen.getByRole("button").className).toMatch(/rounded/);
  });

  it("uses a proportionally larger icon at the xl size (matches lg->xl button growth)", () => {
    const { rerender } = render(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        size="lg"
        data-testid="btn"
      />,
    );
    const lgIconClass = screen.getByTestId("btn").querySelector("svg")
      ?.className.baseVal;

    rerender(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        size="xl"
        data-testid="btn"
      />,
    );
    const xlIconClass = screen.getByTestId("btn").querySelector("svg")
      ?.className.baseVal;

    expect(xlIconClass).not.toBe(lgIconClass);
  });

  describe("asChild disabled/isLoading", () => {
    it("applies aria-disabled and blocks the click handler on the slotted element", () => {
      const onClick = vi.fn();
      render(
        <IconButton
          asChild
          icon={TrashIcon}
          aria-label="Delete"
          disabled
          onClick={onClick}
        >
          <a href="/delete">×</a>
        </IconButton>,
      );
      const link = screen.getByRole("link", { name: "Delete" });
      expect(link).toHaveAttribute("aria-disabled", "true");
      fireEvent.click(link);
      expect(onClick).not.toHaveBeenCalled();
    });

    it("does not set aria-disabled when neither disabled nor isLoading is set", () => {
      render(
        <IconButton asChild icon={TrashIcon} aria-label="Delete">
          <a href="/delete">×</a>
        </IconButton>,
      );
      expect(screen.getByRole("link", { name: "Delete" })).not.toHaveAttribute(
        "aria-disabled",
      );
    });
  });

  it("forwards ref to the underlying button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<IconButton ref={ref} icon={TrashIcon} aria-label="Delete" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("forwards className and native button props", () => {
    render(
      <IconButton
        icon={TrashIcon}
        aria-label="Delete"
        className="custom"
        data-testid="btn"
      />,
    );
    expect(screen.getByTestId("btn")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <IconButton icon={TrashIcon} aria-label="Delete item" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
