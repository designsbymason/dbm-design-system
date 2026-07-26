import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackToTop } from "./BackToTop";

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, configurable: true });
}

afterEach(() => {
  setScrollY(0);
});

describe("BackToTop", () => {
  it("is hidden and untabbable below the threshold", () => {
    render(<BackToTop />);
    const button = screen.getByRole("button", { hidden: true });
    expect(button).toHaveAttribute("aria-hidden", "true");
    expect(button).toHaveAttribute("tabIndex", "-1");
  });

  it("becomes visible and focusable once scrolled past the threshold", () => {
    render(<BackToTop threshold={400} />);
    setScrollY(500);
    fireEvent.scroll(window);
    const button = screen.getByRole("button", { name: "Back to top" });
    expect(button).not.toHaveAttribute("aria-hidden");
    expect(button).not.toHaveAttribute("tabIndex", "-1");
  });

  it("hides again when scrolled back above the threshold", () => {
    render(<BackToTop threshold={400} />);
    setScrollY(500);
    fireEvent.scroll(window);
    expect(
      screen.getByRole("button", { name: "Back to top" }),
    ).not.toHaveAttribute("aria-hidden");

    setScrollY(100);
    fireEvent.scroll(window);
    const button = screen.getByRole("button", { hidden: true });
    expect(button).toHaveAttribute("aria-hidden", "true");
  });

  it("respects a custom threshold", () => {
    render(<BackToTop threshold={1000} />);
    setScrollY(500);
    fireEvent.scroll(window);
    expect(screen.getByRole("button", { hidden: true })).toHaveAttribute(
      "aria-hidden",
      "true",
    );

    setScrollY(1500);
    fireEvent.scroll(window);
    expect(
      screen.getByRole("button", { name: "Back to top" }),
    ).not.toHaveAttribute("aria-hidden");
  });

  it("supports a custom accessible label", () => {
    render(<BackToTop label="Scroll to top" />);
    expect(screen.getByRole("button", { hidden: true })).toHaveAttribute(
      "aria-label",
      "Scroll to top",
    );
  });

  it("scrolls to the top smoothly when clicked", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    render(<BackToTop threshold={400} />);
    setScrollY(500);
    fireEvent.scroll(window);
    await user.click(screen.getByRole("button", { name: "Back to top" }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("forwards ref to the underlying button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<BackToTop ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("applies className", () => {
    render(<BackToTop className="custom" />);
    expect(screen.getByRole("button", { hidden: true })).toHaveClass(
      "custom",
    );
  });

  it("has no accessibility violations, hidden or visible", async () => {
    const { container } = render(<BackToTop threshold={400} />);
    expect((await axe(container)).violations).toHaveLength(0);

    setScrollY(500);
    fireEvent.scroll(window);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
