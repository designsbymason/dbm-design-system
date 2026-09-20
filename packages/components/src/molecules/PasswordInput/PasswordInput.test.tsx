import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import styles from "./PasswordInput.module.css";
import { PasswordInput } from "./PasswordInput";

describe("PasswordInput", () => {
  it("starts masked (type=password)", () => {
    render(<PasswordInput aria-label="Password" />);
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("accepts typed input while masked", async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" />);
    const input = screen.getByLabelText("Password");
    await user.type(input, "hunter2");
    expect(input).toHaveValue("hunter2");
  });

  it("toggles type between password and text, and the toggle's own accessible name with it", async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" defaultValue="hunter2" />);
    const input = screen.getByLabelText("Password");
    const showButton = screen.getByRole("button", { name: "Show password" });

    await user.click(showButton);
    expect(input).toHaveAttribute("type", "text");
    const hideButton = screen.getByRole("button", { name: "Hide password" });
    expect(screen.queryByRole("button", { name: "Show password" })).not.toBeInTheDocument();

    await user.click(hideButton);
    expect(input).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Show password" })).toBeInTheDocument();
  });

  it("refocuses the input after toggling visibility", async () => {
    const user = userEvent.setup();
    render(<PasswordInput aria-label="Password" defaultValue="hunter2" />);
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveFocus();
  });

  it("disables both the input and the toggle button when disabled", () => {
    render(<PasswordInput aria-label="Password" disabled defaultValue="hunter2" />);
    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Show password" })).toBeDisabled();
  });

  it("shows a clear button that calls onClear and refocuses the input", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <PasswordInput aria-label="Password" defaultValue="hunter2" onClear={onClear} />,
    );
    const clearButton = screen.getByRole("button", { name: "Clear" });
    await user.click(clearButton);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Password")).toHaveFocus();
  });

  it("defaults the toggle button to size 'md' and passes an explicit size through to it", () => {
    const { rerender } = render(<PasswordInput aria-label="Password" />);
    expect(screen.getByRole("button", { name: "Show password" })).toHaveClass(
      styles.toggleMd as string,
    );

    rerender(<PasswordInput aria-label="Password" size="xl" />);
    expect(screen.getByRole("button", { name: "Show password" })).toHaveClass(
      styles.toggleXl as string,
    );
  });

  it("keeps the toggle usable while readOnly, since revealing isn't itself an edit", async () => {
    const user = userEvent.setup();
    render(
      <PasswordInput aria-label="Password" readOnly defaultValue="hunter2" />,
    );
    const input = screen.getByLabelText("Password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("hunter2");
  });

  it("renders a prefix", () => {
    render(
      <PasswordInput aria-label="Password" prefix={<span>🔒</span>} />,
    );
    expect(screen.getByText("🔒")).toBeInTheDocument();
  });

  it("sets aria-invalid when hasError is true", () => {
    render(<PasswordInput aria-label="Password" hasError />);
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("forwards ref to the native input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<PasswordInput aria-label="Password" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toHaveAttribute("type", "password");
  });

  it("has no accessibility violations, masked, revealed, or disabled", async () => {
    const { container: maskedContainer } = render(
      <PasswordInput aria-label="Password" defaultValue="hunter2" />,
    );
    expect((await axe(maskedContainer)).violations).toHaveLength(0);

    const user = userEvent.setup();
    const { container: revealedContainer } = render(
      <PasswordInput aria-label="Password" defaultValue="hunter2" />,
    );
    await user.click(
      within(revealedContainer).getByRole("button", { name: "Show password" }),
    );
    expect((await axe(revealedContainer)).violations).toHaveLength(0);

    const { container: disabledContainer } = render(
      <PasswordInput aria-label="Password" disabled />,
    );
    expect((await axe(disabledContainer)).violations).toHaveLength(0);
  });
  describe("formatNumber", () => {
    it("passes straight through to Input's counter, so the count can be written in a locale's own numerals", async () => {
      const user = userEvent.setup();
      const tagged = (n: number) => `<${n}>`;
      render(<PasswordInput aria-label="Password" maxLength={12} showCount formatNumber={tagged} />);
      expect(screen.getByText("<0>/<12>")).toBeInTheDocument();
      await user.type(screen.getByLabelText("Password"), "abc");
      expect(screen.getByText("<3>/<12>")).toBeInTheDocument();
    });

    it("writes a real locale's numerals, and isn't passed on to the DOM element (React would warn)", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const arabic = new Intl.NumberFormat("ar-EG").format;
      render(<PasswordInput aria-label="Password" maxLength={12} showCount defaultValue="abc" formatNumber={arabic} />);
      expect(screen.getByText(`${arabic(3)}/${arabic(12)}`)).toBeInTheDocument();
      expect(error).not.toHaveBeenCalled();
      error.mockRestore();
    });
  });
});
