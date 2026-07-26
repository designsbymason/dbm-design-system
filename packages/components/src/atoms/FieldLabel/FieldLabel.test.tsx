import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { FieldLabel } from "./FieldLabel";

describe("FieldLabel", () => {
  it("renders a native label with its text", () => {
    render(<FieldLabel htmlFor="email">Email address</FieldLabel>);
    expect(screen.getByText("Email address").tagName).toBe("LABEL");
  });

  it("associates with a control via htmlFor", () => {
    render(
      <>
        <FieldLabel htmlFor="email">Email address</FieldLabel>
        <input id="email" />
      </>,
    );
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
  });

  it("shows a decorative asterisk when required, hidden from assistive tech", () => {
    render(
      <FieldLabel htmlFor="email" required>
        Email address
      </FieldLabel>,
    );
    const asterisk = screen.getByText("*");
    expect(asterisk).toHaveAttribute("aria-hidden", "true");
  });

  it("does not render an asterisk by default", () => {
    render(<FieldLabel htmlFor="email">Email address</FieldLabel>);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("applies the disabled visual style as a token-driven color", () => {
    render(
      <FieldLabel htmlFor="email" disabled>
        Email address
      </FieldLabel>,
    );
    expect(screen.getByText("Email address")).toHaveStyle({
      color: "var(--dbm-text-disabled)",
    });
  });

  it("forwards ref to the native label", () => {
    const ref = createRef<HTMLLabelElement>();
    render(
      <FieldLabel ref={ref} htmlFor="email">
        Email address
      </FieldLabel>,
    );
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("applies className", () => {
    render(
      <FieldLabel htmlFor="email" className="custom">
        Email address
      </FieldLabel>,
    );
    expect(screen.getByText("Email address")).toHaveClass("custom");
  });

  it("has no accessibility violations, plain or required", async () => {
    const { container, rerender } = render(
      <FieldLabel htmlFor="email">Email address</FieldLabel>,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(
      <FieldLabel htmlFor="email" required>
        Email address
      </FieldLabel>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
