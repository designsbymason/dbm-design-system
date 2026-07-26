import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CheckIcon, XIcon } from "@dbm-design-system/icons";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("renders off by default", () => {
    render(<Switch aria-label="Airplane mode" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("renders on when defaultChecked is true", () => {
    render(<Switch defaultChecked aria-label="Airplane mode" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("toggles uncontrolled state on click", async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Airplane mode" />);
    const toggle = screen.getByRole("switch");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("calls onCheckedChange with the new value", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch onCheckedChange={onCheckedChange} aria-label="Airplane mode" />);
    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("supports fully controlled usage", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return (
        <Switch checked={checked} onCheckedChange={setChecked}>
          Notifications
        </Switch>
      );
    }
    render(<Controlled />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Switch disabled onCheckedChange={onCheckedChange} aria-label="Airplane mode" />,
    );
    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("renders an inline label and associates it via htmlFor/id", () => {
    render(<Switch>Airplane mode</Switch>);
    expect(
      screen.getByRole("switch", { name: "Airplane mode" }),
    ).toBeInTheDocument();
  });

  it("toggles when clicking the label text, not just the track", async () => {
    const user = userEvent.setup();
    render(<Switch>Airplane mode</Switch>);
    await user.click(screen.getByText("Airplane mode"));
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("renders checkedIcon/uncheckedIcon inside the thumb", () => {
    const { container } = render(
      <Switch
        defaultChecked
        checkedIcon={CheckIcon}
        uncheckedIcon={XIcon}
        aria-label="Airplane mode"
      />,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  it("forwards ref to the underlying button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Switch ref={ref} aria-label="Airplane mode" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("applies className to the switch control", () => {
    render(<Switch className="custom" aria-label="Airplane mode" />);
    expect(screen.getByRole("switch")).toHaveClass("custom");
  });

  it("has no accessibility violations, off, on, or with a label", async () => {
    const { container, rerender } = render(
      <Switch aria-label="Airplane mode" />,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Switch defaultChecked aria-label="Airplane mode" />);
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(<Switch>Airplane mode</Switch>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
