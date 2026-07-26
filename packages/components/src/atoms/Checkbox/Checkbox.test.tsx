import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("renders an unchecked checkbox by default", () => {
    render(<Checkbox aria-label="Accept" />);
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("renders checked when defaultChecked is true", () => {
    render(<Checkbox defaultChecked aria-label="Accept" />);
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("renders indeterminate via aria-checked='mixed'", () => {
    render(<Checkbox checked="indeterminate" aria-label="Select all" />);
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "mixed",
    );
  });

  it("toggles uncontrolled state on click", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Accept" />);
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "true");
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "false");
  });

  it("calls onCheckedChange with the new value", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox onCheckedChange={onCheckedChange} aria-label="Accept" />);
    await user.click(screen.getByRole("checkbox"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("supports fully controlled usage", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return (
        <Checkbox
          checked={checked}
          onCheckedChange={(value) => setChecked(value === true)}
        >
          Accept
        </Checkbox>
      );
    }
    render(<Controlled />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-checked", "false");
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "true");
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox disabled onCheckedChange={onCheckedChange} aria-label="Accept" />,
    );
    await user.click(screen.getByRole("checkbox"));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("sets aria-invalid when hasError is true", () => {
    render(<Checkbox hasError aria-label="Accept" />);
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("renders an inline label and associates it via htmlFor/id", () => {
    render(<Checkbox>Accept terms</Checkbox>);
    expect(
      screen.getByRole("checkbox", { name: "Accept terms" }),
    ).toBeInTheDocument();
  });

  it("toggles when clicking the label text, not just the box", async () => {
    const user = userEvent.setup();
    render(<Checkbox>Accept terms</Checkbox>);
    await user.click(screen.getByText("Accept terms"));
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("forwards ref to the underlying button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Checkbox ref={ref} aria-label="Accept" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("applies className to the checkbox control", () => {
    render(<Checkbox className="custom" aria-label="Accept" />);
    expect(screen.getByRole("checkbox")).toHaveClass("custom");
  });

  it("has no accessibility violations, unchecked, checked, indeterminate, or with a label", async () => {
    // Separate `render` calls per case, rather than `rerender` across
    // them — `checked="indeterminate"` is controlled while the others
    // aren't, and rerendering across that boundary triggers React's
    // (correct, but unrelated to this test) controlled/uncontrolled
    // console warning.
    const { container: uncheckedContainer } = render(
      <Checkbox aria-label="Accept" />,
    );
    expect((await axe(uncheckedContainer)).violations).toHaveLength(0);

    const { container: checkedContainer } = render(
      <Checkbox defaultChecked aria-label="Accept" />,
    );
    expect((await axe(checkedContainer)).violations).toHaveLength(0);

    const { container: indeterminateContainer } = render(
      <Checkbox checked="indeterminate" aria-label="Accept" />,
    );
    expect((await axe(indeterminateContainer)).violations).toHaveLength(0);

    const { container: labeledContainer } = render(
      <Checkbox>Accept terms</Checkbox>,
    );
    const results = await axe(labeledContainer);
    expect(results).toHaveNoViolations();
  });
});
