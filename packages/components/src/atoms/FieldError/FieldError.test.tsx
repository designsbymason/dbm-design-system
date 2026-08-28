import { StarIcon } from "@dbm-design-system/icons";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { FieldError } from "./FieldError";

describe("FieldError", () => {
  it("renders its message with role=alert", () => {
    render(<FieldError>Enter a valid email address</FieldError>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Enter a valid email address");
  });

  it("never lets a same-named consumer prop override the computed role (found in review — TypeScript's JSX checker allows role through regardless of the declared prop type, so this is enforced by JSX attribute order, not by the type system alone)", () => {
    render(<FieldError role="button">Enter a valid email address</FieldError>);
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows a warning icon by default", () => {
    const { container } = render(<FieldError>Required</FieldError>);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("hides the icon when icon is false", () => {
    const { container } = render(<FieldError icon={false}>Required</FieldError>);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("renders a custom icon when icon is a component reference", () => {
    const { container } = render(<FieldError icon={StarIcon}>Required</FieldError>);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies the disabled visual style as a token-driven color, matching FieldLabel/FieldHelperText", () => {
    render(<FieldError disabled>Enter a valid email address</FieldError>);
    expect(screen.getByRole("alert")).toHaveStyle({
      color: "var(--dbm-text-disabled)",
    });
  });

  it("supports id for aria-describedby wiring", () => {
    render(<FieldError id="email-error">Invalid email</FieldError>);
    expect(screen.getByRole("alert")).toHaveAttribute("id", "email-error");
  });

  it("forwards ref to the native paragraph", () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<FieldError ref={ref}>Required</FieldError>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it("applies className", () => {
    render(<FieldError className="custom">Required</FieldError>);
    expect(screen.getByRole("alert")).toHaveClass("custom");
  });

  it("has no accessibility violations, with or without the icon", async () => {
    const { container, rerender } = render(
      <FieldError>Enter a valid email address</FieldError>,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<FieldError icon={false}>Enter a valid email address</FieldError>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
