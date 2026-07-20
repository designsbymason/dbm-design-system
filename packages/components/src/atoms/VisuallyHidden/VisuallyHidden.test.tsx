import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { VisuallyHidden } from "./VisuallyHidden";

describe("VisuallyHidden", () => {
  it("keeps children in the accessibility tree", () => {
    render(<VisuallyHidden>Screen-reader-only text</VisuallyHidden>);
    expect(screen.getByText("Screen-reader-only text")).toBeInTheDocument();
  });

  it("applies the visually-hidden clipping technique", () => {
    render(<VisuallyHidden data-testid="vh">text</VisuallyHidden>);
    expect(screen.getByTestId("vh")).toHaveStyle({
      position: "absolute",
      overflow: "hidden",
      width: "1px",
      height: "1px",
    });
  });

  it("forwards ref to the underlying span", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<VisuallyHidden ref={ref}>text</VisuallyHidden>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("forwards className and native span props", () => {
    render(
      <VisuallyHidden className="custom" data-testid="vh">
        text
      </VisuallyHidden>,
    );
    expect(screen.getByTestId("vh")).toHaveClass("custom");
  });

  it("supports asChild, applying the hidden styles directly to the child instead of wrapping it in a span", () => {
    render(
      <VisuallyHidden asChild>
        <a data-testid="slot-child" href="#x">
          link
        </a>
      </VisuallyHidden>,
    );
    const slotChild = screen.getByTestId("slot-child");
    expect(slotChild.tagName).toBe("A");
    expect(slotChild).toHaveStyle({ position: "absolute" });
  });

  it("stays visually hidden when focused if focusable is not set", () => {
    render(<VisuallyHidden tabIndex={0}>text</VisuallyHidden>);
    const el = screen.getByText("text");
    el.focus();
    expect(el).toHaveFocus();
    expect(getComputedStyle(el).position).toBe("absolute");
  });

  it("reveals content in normal layout flow when a descendant is focused if focusable is true", () => {
    render(
      <VisuallyHidden focusable>
        <a href="#main">Skip to main content</a>
      </VisuallyHidden>,
    );
    const link = screen.getByText("Skip to main content");
    link.focus();
    expect(link).toHaveFocus();
    const wrapper = link.parentElement as HTMLElement;
    expect(getComputedStyle(wrapper).position).toBe("static");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<VisuallyHidden>Accessible text</VisuallyHidden>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
