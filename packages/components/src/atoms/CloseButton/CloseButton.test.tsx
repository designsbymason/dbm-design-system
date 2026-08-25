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

  it("always uses the fixed icon.brand token, regardless of an ancestor's own color", () => {
    // Styled to match IconButton's own `tertiary` variant exactly
    // (2026-08-25 review) — a fixed brand token, not context-adaptive
    // `currentColor` inheritance (that was the pre-restyle behavior, when
    // this component still had to serve Tag's tone-adaptive remove
    // control; Tag now implements that locally instead). An ancestor's
    // own `color` must NOT win.
    const { container } = render(
      <div style={{ color: "rgb(255, 0, 0)" }}>
        <CloseButton />
      </div>,
    );
    expect(container.querySelector("button")).toHaveStyle({
      color: "var(--dbm-icon-brand)",
    });
  });

  it("is disabled when disabled is set", () => {
    render(<CloseButton disabled />);
    expect(screen.getByRole("button", { name: "Close" })).toBeDisabled();
  });

  it("applies size as a token-driven box dimension, matching IconButton's own scale", () => {
    render(<CloseButton size="lg" />);
    expect(screen.getByRole("button", { name: "Close" })).toHaveStyle({
      height: "var(--dbm-icon-button-size-lg)",
      width: "var(--dbm-icon-button-size-lg)",
    });
  });

  it.each(["xs", "sm", "md", "lg", "xl"] as const)(
    "sizes the box from icon-button-size and the glyph from icon-size at size=%s — one prop, two matched scales, same relationship as IconButton",
    (size) => {
      const { container } = render(<CloseButton size={size} />);
      expect(screen.getByRole("button", { name: "Close" })).toHaveStyle({
        height: `var(--dbm-icon-button-size-${size})`,
        width: `var(--dbm-icon-button-size-${size})`,
      });
      expect(container.querySelector("svg")).toHaveStyle({
        height: `var(--dbm-icon-size-${size})`,
        width: `var(--dbm-icon-size-${size})`,
      });
    },
  );

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
