import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("is hidden from the accessibility tree by default", () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders role=status with the given label and is no longer aria-hidden", () => {
    render(<Spinner label="Loading" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAccessibleName("Loading");
    expect(status).not.toHaveAttribute("aria-hidden");
  });

  it("applies size as a token-driven dimension", () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.firstChild).toHaveStyle({
      height: "var(--dbm-icon-size-lg)",
      width: "var(--dbm-icon-size-lg)",
    });
  });

  it("applies tone as a token-driven color", () => {
    const { container } = render(<Spinner tone="brand" />);
    expect(container.firstChild).toHaveStyle({
      color: "var(--dbm-icon-brand)",
    });
  });

  it("defaults to no explicit tone (inherits currentColor)", () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).not.toHaveStyle({
      color: "var(--dbm-icon-brand)",
    });
  });

  it("forwards ref to the root span", () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("applies className", () => {
    const { container } = render(<Spinner className="custom" />);
    expect(container.firstChild).toHaveClass("custom");
  });

  it("has no accessibility violations, decorative or labeled", async () => {
    const { container, rerender } = render(<Spinner />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Spinner label="Loading" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
