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

  it("applies style to the switch control", () => {
    render(
      <Switch style={{ marginTop: 4 }} aria-label="Airplane mode" />,
    );
    expect(screen.getByRole("switch")).toHaveStyle({ marginTop: "4px" });
  });

  it("applies data-testid to the switch control", () => {
    render(<Switch data-testid="airplane-switch" aria-label="Airplane mode" />);
    expect(screen.getByTestId("airplane-switch")).toBeInTheDocument();
  });

  it("warns once in development when there is no accessible name", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<Switch />);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("Switch: no accessible name");
    rerender(<Switch />);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("does not warn when a visible label or aria-label is present", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Switch aria-label="Airplane mode" />);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("sets aria-required when required is true", () => {
    render(<Switch required aria-label="Airplane mode" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-required", "true");
  });

  it("participates in real form submission via name/value, through Radix's own hidden input", async () => {
    const user = userEvent.setup();
    const captured: { submitted: FormData | null } = { submitted: null };
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          captured.submitted = new FormData(event.currentTarget);
        }}
      >
        <Switch name="notifications" value="enabled" aria-label="Notifications" />
        <button type="submit">Submit</button>
      </form>,
    );
    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(captured.submitted?.get("notifications")).toBe("enabled");
  });

  it("sets aria-invalid when hasError is true", () => {
    render(<Switch hasError aria-label="Airplane mode" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-invalid", "true");
  });

  it("never lets a same-named consumer prop override the computed aria-invalid/aria-busy", () => {
    render(
      <Switch
        hasError
        loading
        aria-invalid={false}
        aria-busy={false}
        aria-label="Airplane mode"
      />,
    );
    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-invalid", "true");
    expect(toggle).toHaveAttribute("aria-busy", "true");
  });

  it("renders a spinner and blocks toggling while loading", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const { container } = render(
      <Switch loading onCheckedChange={onCheckedChange} aria-label="Airplane mode" />,
    );
    const toggle = screen.getByRole("switch");
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector("svg")).not.toBeInTheDocument();
    await user.click(toggle);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("blocks toggling when loading even if disabled is explicitly false", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Switch
        loading
        disabled={false}
        onCheckedChange={onCheckedChange}
        aria-label="Airplane mode"
      />,
    );
    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).not.toHaveBeenCalled();
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

  it("has no accessibility violations when disabled", async () => {
    const { container } = render(
      <Switch disabled aria-label="Airplane mode" />,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations with hasError", async () => {
    const { container } = render(
      <Switch hasError aria-label="Airplane mode" />,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations when loading", async () => {
    const { container } = render(
      <Switch loading aria-label="Airplane mode" />,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
