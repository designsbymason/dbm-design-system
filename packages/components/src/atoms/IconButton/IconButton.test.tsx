import { TrashIcon } from "@dbm-design-system/icons";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("renders a button with the required accessible name", () => {
    render(<IconButton icon={TrashIcon} aria-label="Delete item" />);
    expect(screen.getByRole("button", { name: "Delete item" })).toBeInTheDocument();
  });

  it("renders the given icon", () => {
    render(<IconButton icon={TrashIcon} aria-label="Delete" />);
    expect(screen.getByRole("button").querySelector("svg")).toBeInTheDocument();
  });

  it("applies variant and size tokens", () => {
    render(<IconButton icon={TrashIcon} aria-label="Delete" variant="destructive" size="xl" />);
    const button = screen.getByRole("button");
    expect(button).toHaveStyle({
      backgroundColor: "var(--dbm-bg-danger)",
      color: "var(--dbm-text-on-danger)",
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

  it("forwards ref to the underlying button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<IconButton ref={ref} icon={TrashIcon} aria-label="Delete" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("forwards className and native button props", () => {
    render(
      <IconButton icon={TrashIcon} aria-label="Delete" className="custom" data-testid="btn" />,
    );
    expect(screen.getByTestId("btn")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<IconButton icon={TrashIcon} aria-label="Delete item" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
