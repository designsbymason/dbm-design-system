import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
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
    render(
      <Input
        prefix={<span>$</span>}
        suffix={<span>USD</span>}
        placeholder="Amount"
      />,
    );
    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("sets aria-invalid when hasError is true", () => {
    render(<Input hasError placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("does not set aria-invalid by default", () => {
    render(<Input placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).not.toHaveAttribute(
      "aria-invalid",
    );
  });

  it("applies size as a token-driven font-size/padding on the wrapper", () => {
    render(
      <Input size="lg" placeholder="Search" data-testid-wrapper="wrapper" />,
    );
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

  it("focuses the input when clicking the wrapper (padding or an affix), not just the input itself", () => {
    render(
      <Input
        prefix={<span data-testid="prefix-icon">$</span>}
        placeholder="Amount"
      />,
    );
    const input = screen.getByPlaceholderText("Amount");
    const wrapper = input.parentElement as HTMLElement;
    expect(input).not.toHaveFocus();

    fireEvent.mouseDown(screen.getByTestId("prefix-icon"));
    expect(input).toHaveFocus();

    input.blur();
    fireEvent.mouseDown(wrapper);
    expect(input).toHaveFocus();
  });

  it("still forwards both the internal focus-on-click ref and the caller's own ref to the same node", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Input
        ref={ref}
        prefix={<span data-testid="prefix-icon">$</span>}
        placeholder="Amount"
      />,
    );
    fireEvent.mouseDown(screen.getByTestId("prefix-icon"));
    expect(ref.current).toHaveFocus();
  });

  describe("onClear", () => {
    it("does not render a clear button when onClear is not provided", () => {
      render(<Input defaultValue="hello" placeholder="Search" />);
      expect(
        screen.queryByRole("button", { name: "Clear" }),
      ).not.toBeInTheDocument();
    });

    it("shows a clear button for a non-empty uncontrolled value and hides it once cleared by typing", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(
        <Input defaultValue="hello" onClear={onClear} placeholder="Search" />,
      );
      const input = screen.getByPlaceholderText("Search");
      expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();

      await user.clear(input);
      expect(
        screen.queryByRole("button", { name: "Clear" }),
      ).not.toBeInTheDocument();
    });

    it("does not show a clear button for an empty uncontrolled value until the user types", async () => {
      const user = userEvent.setup();
      render(<Input onClear={() => {}} placeholder="Search" />);
      expect(
        screen.queryByRole("button", { name: "Clear" }),
      ).not.toBeInTheDocument();

      await user.type(screen.getByPlaceholderText("Search"), "a");
      expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    });

    it("calls onClear and refocuses the input when the clear button is clicked", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(
        <Input defaultValue="hello" onClear={onClear} placeholder="Search" />,
      );
      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(screen.getByPlaceholderText("Search")).toHaveFocus();
    });

    it("tracks a controlled value directly, showing the clear button whenever value is non-empty", () => {
      function Controlled() {
        const [value, setValue] = useState("hello");
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onClear={() => setValue("")}
            placeholder="Search"
          />
        );
      }
      render(<Controlled />);
      expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Clear" }));
      expect(
        screen.queryByRole("button", { name: "Clear" }),
      ).not.toBeInTheDocument();
    });
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

  it("has no accessibility violations, plain, with an error, or with a clear button", async () => {
    const { container, rerender } = render(<Input aria-label="Search" />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Input aria-label="Search" hasError />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(
      <Input aria-label="Search" defaultValue="hello" onClear={() => {}} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
