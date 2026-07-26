import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { CloseButton } from "./CloseButton";

describe("CloseButton", () => {
  it("renders a button with a default aria-label of Close", () => {
    render(<CloseButton />);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("supports a custom aria-label for context", () => {
    render(<CloseButton aria-label="Remove tag" />);
    expect(
      screen.getByRole("button", { name: "Remove tag" }),
    ).toBeInTheDocument();
  });

  it("defaults to type=button so it doesn't submit a surrounding form", () => {
    render(<CloseButton />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CloseButton onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("inherits currentColor for its icon instead of a fixed token", () => {
    const { container } = render(
      <div style={{ color: "rgb(255, 0, 0)" }}>
        <CloseButton />
      </div>,
    );
    // `color: inherit` resolves to the parent's computed color rather than
    // the literal keyword — this proves the inheritance actually applies,
    // instead of some fixed token color winning over it.
    expect(container.querySelector("button")).toHaveStyle({
      color: "rgb(255, 0, 0)",
    });
  });

  it("is disabled when disabled is set", () => {
    render(<CloseButton disabled />);
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
  });

  it("applies size as a token-driven dimension", () => {
    render(<CloseButton size="lg" />);
    expect(screen.getByRole("button", { name: "Close" })).toHaveStyle({
      height: "var(--dbm-icon-size-lg)",
      width: "var(--dbm-icon-size-lg)",
    });
  });

  it("forwards ref to the underlying button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<CloseButton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("applies className", () => {
    render(<CloseButton className="custom" />);
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass(
      "custom",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<CloseButton />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
