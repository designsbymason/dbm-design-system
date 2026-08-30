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

  it("never lets a same-named consumer prop override the computed aria-invalid (found in review — TypeScript's JSX checker allows aria-* props through regardless of the declared prop type, so this is enforced by JSX attribute order, not by the type system alone)", () => {
    render(<Input hasError aria-invalid={false} placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute(
      "aria-invalid",
      "true",
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
      // `padding-block` composes two tokens via calc() rather than a bare
      // space token — Button/Input size-parity finding, see Input.module.css's
      // own `.sizeLg` comment for the full reasoning.
      paddingBlock:
        "calc(var(--dbm-space-4) - var(--dbm-border-width-1))",
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

    it("is keyboard-activatable — Enter and Space on the focused clear button both call onClear (found in review, full end-to-end pass)", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(
        <Input defaultValue="hello" onClear={onClear} placeholder="Search" />,
      );
      const clearButton = screen.getByRole("button", { name: "Clear" });
      clearButton.focus();
      expect(clearButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(onClear).toHaveBeenCalledTimes(1);

      clearButton.focus();
      await user.keyboard(" ");
      expect(onClear).toHaveBeenCalledTimes(2);
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

  it("applies style to the wrapper, not the native input (matches className's own target, found in review)", () => {
    render(
      <Input style={{ marginTop: "10px" }} placeholder="Search" />,
    );
    const input = screen.getByPlaceholderText("Search");
    expect(input).not.toHaveStyle({ marginTop: "10px" });
    expect(input.parentElement).toHaveStyle({ marginTop: "10px" });
  });

  it("forwards native input props", () => {
    render(<Input placeholder="Search" type="email" maxLength={10} />);
    const input = screen.getByPlaceholderText("Search");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("maxlength", "10");
  });

  it("resets appearance so type=\"search\" doesn't show a second, browser-drawn clear button in WebKit alongside our own onClear button (found in review)", () => {
    render(<Input type="search" placeholder="Search" />);
    expect(screen.getByPlaceholderText("Search")).toHaveStyle({
      appearance: "none",
    });
  });

  describe("showCount", () => {
    it("does not render a count when showCount is false, even with maxLength set", () => {
      render(<Input placeholder="Search" maxLength={10} />);
      expect(screen.queryByText("0/10")).not.toBeInTheDocument();
    });

    it("does not render a count when showCount is true but maxLength is unset", () => {
      render(<Input placeholder="Search" showCount />);
      expect(screen.queryByText(/\/undefined/)).not.toBeInTheDocument();
    });

    it("renders and live-updates a current/max count while typing (uncontrolled)", async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Bio" maxLength={10} showCount />);
      expect(screen.getByText("0/10")).toBeInTheDocument();

      await user.type(screen.getByPlaceholderText("Bio"), "hello");
      expect(screen.getByText("5/10")).toBeInTheDocument();
    });

    it("updates the count for an externally-driven controlled value change, not just typing", () => {
      function Controlled({ value }: { value: string }) {
        return (
          <Input
            aria-label="Bio"
            value={value}
            onChange={() => {}}
            maxLength={10}
            showCount
          />
        );
      }
      const { rerender } = render(<Controlled value="hi" />);
      expect(screen.getByText("2/10")).toBeInTheDocument();

      rerender(<Controlled value="" />);
      expect(screen.getByText("0/10")).toBeInTheDocument();
    });
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
