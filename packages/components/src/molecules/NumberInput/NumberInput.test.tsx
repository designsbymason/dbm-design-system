import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { NumberInput } from "./NumberInput";
import styles from "./NumberInput.module.css";

describe("NumberInput", () => {
  it("renders a native number input", () => {
    render(<NumberInput aria-label="Quantity" />);
    expect(screen.getByRole("spinbutton", { name: "Quantity" })).toHaveAttribute(
      "type",
      "number",
    );
  });

  it("starts at defaultValue when uncontrolled", () => {
    render(<NumberInput aria-label="Quantity" defaultValue={5} />);
    expect(screen.getByRole("spinbutton")).toHaveValue(5);
  });

  it("starts empty when neither value nor defaultValue is set", () => {
    render(<NumberInput aria-label="Quantity" />);
    expect(screen.getByRole("spinbutton")).toHaveValue(null);
  });

  it("increments and decrements by step, calling onValueChange with a real number", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumberInput aria-label="Quantity" defaultValue={5} onValueChange={onValueChange} />,
    );
    const input = screen.getByRole("spinbutton");

    await user.click(screen.getByRole("button", { name: "Increase value" }));
    expect(input).toHaveValue(6);
    expect(onValueChange).toHaveBeenCalledWith(6);

    await user.click(screen.getByRole("button", { name: "Decrease value" }));
    expect(input).toHaveValue(5);
    expect(onValueChange).toHaveBeenCalledWith(5);
  });

  it("respects a custom step", async () => {
    const user = userEvent.setup();
    render(<NumberInput aria-label="Quantity" defaultValue={1} step={0.5} />);
    await user.click(screen.getByRole("button", { name: "Increase value" }));
    expect(screen.getByRole("spinbutton")).toHaveValue(1.5);
  });

  it("rounds away floating-point drift when stepping repeatedly with a decimal step", async () => {
    const user = userEvent.setup();
    render(<NumberInput aria-label="Quantity" defaultValue={0} step={0.1} />);
    const increment = screen.getByRole("button", { name: "Increase value" });
    await user.click(increment);
    await user.click(increment);
    await user.click(increment);
    expect(screen.getByRole("spinbutton")).toHaveValue(0.3);
  });

  it("clamps the increment button at max and disables it once reached", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumberInput
        aria-label="Quantity"
        defaultValue={9}
        max={10}
        onValueChange={onValueChange}
      />,
    );
    const increment = screen.getByRole("button", { name: "Increase value" });
    await user.click(increment);
    expect(screen.getByRole("spinbutton")).toHaveValue(10);
    expect(increment).toBeDisabled();
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("clamps the decrement button at min and disables it once reached", async () => {
    const user = userEvent.setup();
    render(<NumberInput aria-label="Quantity" defaultValue={1} min={0} />);
    const decrement = screen.getByRole("button", { name: "Decrease value" });
    await user.click(decrement);
    expect(screen.getByRole("spinbutton")).toHaveValue(0);
    expect(decrement).toBeDisabled();
  });

  it("increments from min (not 0) when the field starts empty and min is set", async () => {
    const user = userEvent.setup();
    render(<NumberInput aria-label="Quantity" min={5} max={20} />);
    await user.click(screen.getByRole("button", { name: "Increase value" }));
    expect(screen.getByRole("spinbutton")).toHaveValue(6);
  });

  it("decrements from max (not 0) when the field starts empty and max is set", async () => {
    const user = userEvent.setup();
    render(<NumberInput aria-label="Quantity" min={0} max={20} />);
    await user.click(screen.getByRole("button", { name: "Decrease value" }));
    expect(screen.getByRole("spinbutton")).toHaveValue(19);
  });

  it("refocuses the input after a stepper click", async () => {
    const user = userEvent.setup();
    render(<NumberInput aria-label="Quantity" defaultValue={5} />);
    await user.click(screen.getByRole("button", { name: "Increase value" }));
    expect(screen.getByRole("spinbutton")).toHaveFocus();
  });

  it("typing calls both onValueChange (parsed) and onChange (raw event)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    render(
      <NumberInput
        aria-label="Quantity"
        onValueChange={onValueChange}
        onChange={onChange}
      />,
    );
    await user.type(screen.getByRole("spinbutton"), "42");
    expect(onValueChange).toHaveBeenLastCalledWith(42);
    expect(onChange).toHaveBeenCalled();
  });

  it("reports undefined once the field is cleared by typing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumberInput aria-label="Quantity" defaultValue={5} onValueChange={onValueChange} />,
    );
    const input = screen.getByRole("spinbutton");
    await user.clear(input);
    expect(onValueChange).toHaveBeenLastCalledWith(undefined);
  });

  it("supports fully controlled usage", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<number | undefined>(5);
      return (
        <NumberInput aria-label="Quantity" value={value} onValueChange={setValue} />
      );
    }
    render(<Controlled />);
    expect(screen.getByRole("spinbutton")).toHaveValue(5);
    await user.click(screen.getByRole("button", { name: "Increase value" }));
    expect(screen.getByRole("spinbutton")).toHaveValue(6);
  });

  it("disables the input and both stepper buttons when disabled", () => {
    render(<NumberInput aria-label="Quantity" disabled defaultValue={5} />);
    expect(screen.getByRole("spinbutton")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Increase value" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Decrease value" })).toBeDisabled();
  });

  it("disables both stepper buttons (not the input itself) when readOnly", () => {
    render(<NumberInput aria-label="Quantity" readOnly defaultValue={5} />);
    expect(screen.getByRole("spinbutton")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Increase value" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Decrease value" })).toBeDisabled();
  });

  it("shows a clear button that calls onClear, refocuses the input, and actually clears the value when uncontrolled", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(
      <NumberInput aria-label="Quantity" defaultValue={5} onClear={onClear} />,
    );
    const clearButton = screen.getByRole("button", { name: "Clear" });
    await user.click(clearButton);
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("spinbutton")).toHaveFocus();
    expect(screen.getByRole("spinbutton")).toHaveValue(null);
  });

  it("clears a controlled value via onValueChange when the clear button is clicked", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumberInput
        aria-label="Quantity"
        value={5}
        onValueChange={onValueChange}
        onClear={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onValueChange).toHaveBeenCalledWith(undefined);
  });

  it("defaults the stepper to size 'md' and passes an explicit size through to it", () => {
    const { rerender } = render(<NumberInput aria-label="Quantity" />);
    expect(screen.getByRole("button", { name: "Increase value" }).parentElement).toHaveClass(
      styles.stepperMd as string,
    );

    rerender(<NumberInput aria-label="Quantity" size="xl" />);
    expect(screen.getByRole("button", { name: "Increase value" }).parentElement).toHaveClass(
      styles.stepperXl as string,
    );
  });

  it("renders a prefix", () => {
    render(<NumberInput aria-label="Quantity" prefix={<span>#</span>} />);
    expect(screen.getByText("#")).toBeInTheDocument();
  });

  it("sets aria-invalid when hasError is true", () => {
    render(<NumberInput aria-label="Quantity" hasError />);
    expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-invalid", "true");
  });

  it("forwards ref to the native input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<NumberInput aria-label="Quantity" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toHaveAttribute("type", "number");
  });

  it("passes min/max/step through as real native attributes", () => {
    render(<NumberInput aria-label="Quantity" min={0} max={10} step={0.5} />);
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "10");
    expect(input).toHaveAttribute("step", "0.5");
  });

  it("has no accessibility violations, default, with a value, or disabled", async () => {
    const { container: emptyContainer } = render(
      <NumberInput aria-label="Quantity" />,
    );
    expect((await axe(emptyContainer)).violations).toHaveLength(0);

    const { container: valueContainer } = render(
      <NumberInput aria-label="Quantity" defaultValue={5} min={0} max={10} />,
    );
    expect((await axe(valueContainer)).violations).toHaveLength(0);

    const { container: disabledContainer } = render(
      <NumberInput aria-label="Quantity" disabled />,
    );
    expect((await axe(disabledContainer)).violations).toHaveLength(0);
  });
});
