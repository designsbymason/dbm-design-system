import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useRef } from "react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackToTop } from "./BackToTop";

function ScrollContainerDemo({
  threshold = 100,
  children,
}: PropsWithChildren<{ threshold?: number }>) {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={containerRef} data-testid="scroll-container">
      {children}
      <BackToTop threshold={threshold} scrollContainerRef={containerRef} />
    </div>
  );
}

function setScrollY(value: number) {
  Object.defineProperty(window, "scrollY", { value, configurable: true });
}

afterEach(() => {
  setScrollY(0);
});

describe("BackToTop", () => {
  it("defaults to md size and primary variant", () => {
    render(<BackToTop />);
    const button = screen.getByRole("button", { hidden: true });
    expect(button.className).toMatch(/sizeMd/);
    expect(button.className).toMatch(/variantPrimary/);
  });

  it("supports a custom size and variant, passed through to the underlying IconButton", () => {
    render(<BackToTop size="lg" variant="secondary" />);
    const button = screen.getByRole("button", { hidden: true });
    expect(button.className).toMatch(/sizeLg/);
    expect(button.className).toMatch(/variantSecondary/);
  });

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

  describe("scrollContainerRef", () => {
    it("uses the container's own scrollTop instead of window.scrollY when provided", () => {
      render(<ScrollContainerDemo threshold={100} />);
      const container = screen.getByTestId("scroll-container");
      Object.defineProperty(container, "scrollTop", {
        value: 200,
        configurable: true,
      });
      fireEvent.scroll(container);
      expect(
        screen.getByRole("button", { name: "Back to top" }),
      ).not.toHaveAttribute("aria-hidden");
    });

    it("does not react to window scroll when a scrollContainerRef is provided", () => {
      render(<ScrollContainerDemo threshold={100} />);
      setScrollY(500);
      fireEvent.scroll(window);
      expect(screen.getByRole("button", { hidden: true })).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });

    it("scrolls the container itself, not the window, when clicked", async () => {
      const user = userEvent.setup();
      render(<ScrollContainerDemo threshold={100} />);
      const container = screen.getByTestId("scroll-container");
      // jsdom doesn't implement `Element.scrollTo` at all, so there's
      // nothing for `vi.spyOn` to wrap — assign a plain mock directly.
      const containerScrollTo = vi.fn();
      container.scrollTo = containerScrollTo;
      const windowScrollTo = vi.fn();
      vi.stubGlobal("scrollTo", windowScrollTo);

      Object.defineProperty(container, "scrollTop", {
        value: 200,
        configurable: true,
      });
      fireEvent.scroll(container);

      await user.click(screen.getByRole("button", { name: "Back to top" }));
      expect(containerScrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: "smooth",
      });
      expect(windowScrollTo).not.toHaveBeenCalled();
    });
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
