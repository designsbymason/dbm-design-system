import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
  it("renders a native input and accepts typed input", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Search" />);
    const input = screen.getByPlaceholderText("Search");
    await user.type(input, "hello");
    expect(input).toHaveValue("hello");
  });

  it("renders a prefix and suffix", () => {
    render(<Input prefix={<span>$</span>} suffix={<span>USD</span>} placeholder="Amount" />);
    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("sets aria-invalid when hasError is true", () => {
    render(<Input hasError placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid by default", () => {
    render(<Input placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).not.toHaveAttribute("aria-invalid");
  });

  it("applies size as a token-driven font-size/padding on the wrapper", () => {
    render(<Input size="lg" placeholder="Search" data-testid-wrapper="wrapper" />);
    const input = screen.getByPlaceholderText("Search");
    const wrapper = input.parentElement;
    expect(wrapper).toHaveStyle({
      fontSize: "var(--dbm-font-size-md)",
      paddingBlock: "var(--dbm-space-2)",
      paddingInline: "var(--dbm-space-4)",
    });
  });

  it("disables the native input when disabled", () => {
    render(<Input disabled placeholder="Search" />);
    expect(screen.getByPlaceholderText("Search")).toBeDisabled();
  });

  it("forwards ref to the native input, not the wrapper", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Search" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current?.placeholder).toBe("Search");
  });

  it("applies className to the wrapper, not the native input", () => {
    render(<Input className="custom" placeholder="Search" />);
    const input = screen.getByPlaceholderText("Search");
    expect(input).not.toHaveClass("custom");
    expect(input.parentElement).toHaveClass("custom");
  });

  it("forwards native input props", () => {
    render(<Input placeholder="Search" type="email" maxLength={10} />);
    const input = screen.getByPlaceholderText("Search");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("maxlength", "10");
  });

  it("has no accessibility violations, plain or with an error", async () => {
    const { container, rerender } = render(<Input aria-label="Search" />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Input aria-label="Search" hasError />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
