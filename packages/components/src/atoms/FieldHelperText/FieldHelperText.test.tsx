import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { FieldHelperText } from "./FieldHelperText";

describe("FieldHelperText", () => {
  it("renders its text", () => {
    render(<FieldHelperText>At least 8 characters</FieldHelperText>);
    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
  });

  it("supports id for aria-describedby wiring", () => {
    render(
      <FieldHelperText id="password-hint">At least 8 characters</FieldHelperText>,
    );
    expect(screen.getByText("At least 8 characters")).toHaveAttribute(
      "id",
      "password-hint",
    );
  });

  it("applies the disabled visual style as a token-driven color", () => {
    render(<FieldHelperText disabled>At least 8 characters</FieldHelperText>);
    expect(screen.getByText("At least 8 characters")).toHaveStyle({
      color: "var(--dbm-text-disabled)",
    });
  });

  it("forwards ref to the native paragraph", () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<FieldHelperText ref={ref}>Hint</FieldHelperText>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it("applies className", () => {
    render(<FieldHelperText className="custom">Hint</FieldHelperText>);
    expect(screen.getByText("Hint")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <FieldHelperText>At least 8 characters</FieldHelperText>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
