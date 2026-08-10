import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./Select";

function BasicSelect(props: Partial<ComponentProps<typeof Select>> = {}) {
  return (
    <Select aria-label="Variant" placeholder="Choose a variant" {...props}>
      <Select.Option value="primary">Primary</Select.Option>
      <Select.Option value="secondary">Secondary</Select.Option>
      <Select.Option value="tertiary" disabled>
        Tertiary
      </Select.Option>
    </Select>
  );
}

describe("Select", () => {
  it("shows the placeholder when nothing is selected", () => {
    render(<BasicSelect />);
    expect(screen.getByRole("combobox")).toHaveTextContent(
      "Choose a variant",
    );
  });

  it("shows the matching option's label when defaultValue is set", () => {
    render(<BasicSelect defaultValue="secondary" />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Secondary");
  });

  it("opens the listbox and selects an option on click", async () => {
    const user = userEvent.setup();
    render(<BasicSelect />);
    await user.click(screen.getByRole("combobox"));
    const option = await screen.findByRole("option", { name: "Primary" });
    await user.click(option);
    expect(screen.getByRole("combobox")).toHaveTextContent("Primary");
  });

  it("calls onValueChange with the new value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<BasicSelect onValueChange={onValueChange} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Primary" }));
    expect(onValueChange).toHaveBeenCalledWith("primary");
  });

  it("supports fully controlled usage", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string | undefined>(undefined);
      return (
        <Select
          aria-label="Variant"
          placeholder="Choose a variant"
          value={value}
          onValueChange={setValue}
        >
          <Select.Option value="primary">Primary</Select.Option>
          <Select.Option value="secondary">Secondary</Select.Option>
        </Select>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Secondary" }));
    expect(screen.getByRole("combobox")).toHaveTextContent("Secondary");
  });

  it("opens via keyboard and selects with Enter", async () => {
    const user = userEvent.setup();
    render(<BasicSelect />);
    const trigger = screen.getByRole("combobox");
    trigger.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("listbox");
    // With nothing selected yet, Radix highlights the first item
    // ("Primary") by default — one ArrowDown moves to "Secondary".
    await user.keyboard("{ArrowDown}{Enter}");
    expect(trigger).toHaveTextContent("Secondary");
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    render(<BasicSelect disabled />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not select a disabled option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<BasicSelect onValueChange={onValueChange} />);
    await user.click(screen.getByRole("combobox"));
    const disabledOption = await screen.findByRole("option", {
      name: "Tertiary",
    });
    expect(disabledOption).toHaveAttribute("aria-disabled", "true");
    await user.click(disabledOption);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("sets aria-invalid when hasError is true", () => {
    render(<BasicSelect hasError />);
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("forwards ref to the trigger button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Select ref={ref} aria-label="Variant" placeholder="Choose">
        <Select.Option value="a">A</Select.Option>
      </Select>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("applies className to the trigger", () => {
    render(<BasicSelect className="custom" />);
    expect(screen.getByRole("combobox")).toHaveClass("custom");
  });

  it("has no accessibility violations when closed", async () => {
    const { container } = render(<BasicSelect />);
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(<BasicSelect />);
    await user.click(screen.getByRole("combobox"));
    await screen.findByRole("listbox");
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
