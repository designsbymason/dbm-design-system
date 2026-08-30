import { StarIcon, XIcon } from "@dbm-design-system/icons";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";
import styles from "./Checkbox.module.css";

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

  it("renders a custom icon in place of the default check glyph when `icon` is provided", () => {
    const { container: defaultContainer } = render(
      <Checkbox defaultChecked aria-label="Accept" />,
    );
    const defaultMarkup = defaultContainer.querySelector(
      `.${styles.checkIcon}`,
    )?.innerHTML;

    const { container: customContainer } = render(
      <Checkbox defaultChecked icon={StarIcon} aria-label="Accept" />,
    );
    const customMarkup = customContainer.querySelector(
      `.${styles.checkIcon}`,
    )?.innerHTML;

    expect(defaultMarkup).toBeTruthy();
    expect(customMarkup).toBeTruthy();
    expect(customMarkup).not.toEqual(defaultMarkup);
  });

  it("renders a custom icon in place of the default indeterminate glyph when `indeterminateIcon` is provided", () => {
    const { container: defaultContainer } = render(
      <Checkbox checked="indeterminate" aria-label="Select all" />,
    );
    const defaultMarkup = defaultContainer.querySelector(
      `.${styles.minusIcon}`,
    )?.innerHTML;

    const { container: customContainer } = render(
      <Checkbox
        checked="indeterminate"
        indeterminateIcon={XIcon}
        aria-label="Select all"
      />,
    );
    const customMarkup = customContainer.querySelector(
      `.${styles.minusIcon}`,
    )?.innerHTML;

    expect(defaultMarkup).toBeTruthy();
    expect(customMarkup).toBeTruthy();
    expect(customMarkup).not.toEqual(defaultMarkup);
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

  it("is focusable via Tab and toggles via Space on the keyboard", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox onCheckedChange={onCheckedChange} aria-label="Accept" />);
    const checkbox = screen.getByRole("checkbox");

    await user.tab();
    expect(checkbox).toHaveFocus();
    // The WAI-ARIA checkbox pattern activates via Space, not Enter — unlike
    // Button, which is a native <button> where Enter is also expected (see
    // the matching comment on Checkbox.stories.tsx's SpaceKeyInteraction).
    await user.keyboard(" ");
    expect(checkbox).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("is not part of the tab order and blocks keyboard toggling when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Checkbox disabled onCheckedChange={onCheckedChange} aria-label="Accept" />,
    );
    const checkbox = screen.getByRole("checkbox");

    await user.tab();
    expect(checkbox).not.toHaveFocus();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("sets aria-required when required is true", () => {
    render(<Checkbox required aria-label="Accept" />);
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-required",
      "true",
    );
  });

  it("participates in real form submission via name/value, through Radix's own hidden input (a genuine Radix Checkbox feature previously blocked at the type level — `required` wasn't on CheckboxProps, since native <button> has no `required` attribute of its own)", async () => {
    const user = userEvent.setup();
    // A plain `let` reassigned only inside the closure below narrows to its
    // initializer type (`null`) at the `expect` call site, since that
    // reassignment isn't visible to TS's control-flow analysis there —
    // wrapping it in an object sidesteps the narrowing.
    const captured: { submitted: FormData | null } = { submitted: null };
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          captured.submitted = new FormData(event.currentTarget);
        }}
      >
        <Checkbox name="newsletter" value="subscribed" aria-label="Subscribe" />
        <button type="submit">Submit</button>
      </form>,
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(captured.submitted?.get("newsletter")).toBe("subscribed");
  });

  it("sets aria-invalid when hasError is true", () => {
    render(<Checkbox hasError aria-label="Accept" />);
    expect(screen.getByRole("checkbox")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("never lets a same-named consumer prop override the computed aria-invalid (found in review — TypeScript's JSX checker allows aria-* props through regardless of the declared prop type, so this is enforced by JSX attribute order, not by the type system alone)", () => {
    render(<Checkbox hasError aria-invalid={false} aria-label="Accept" />);
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

  it("forwards style and data-testid to the checkbox control", () => {
    render(
      <Checkbox
        style={{ marginTop: "1rem" }}
        data-testid="terms-checkbox"
        aria-label="Accept"
      />,
    );
    const checkbox = screen.getByTestId("terms-checkbox");
    expect(checkbox).toHaveStyle({ marginTop: "1rem" });
    expect(checkbox).toHaveAttribute("role", "checkbox");
  });

  it("generates an id internally when omitted, but respects an explicit one", () => {
    const { rerender } = render(<Checkbox>Accept terms</Checkbox>);
    expect(screen.getByRole("checkbox")).toHaveAttribute("id");

    rerender(<Checkbox id="terms">Accept terms</Checkbox>);
    expect(screen.getByRole("checkbox")).toHaveAttribute("id", "terms");
  });

  it("warns once in development when there is no accessible name", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<Checkbox />);
    rerender(<Checkbox size="lg" />);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("no accessible name"),
    );
    consoleWarnSpy.mockRestore();
  });

  it("does not warn when aria-label, aria-labelledby, or children is present", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <>
        <Checkbox aria-label="Accept" />
        <Checkbox aria-labelledby="external-label" />
        <Checkbox>Accept terms</Checkbox>
      </>,
    );

    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("has no accessibility violations, unchecked, checked, indeterminate, with a label, hasError, or disabled", async () => {
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
    expect((await axe(labeledContainer)).violations).toHaveLength(0);

    // Found in review — every state previously covered here was a
    // *default*-styled checkbox; `hasError`'s red border/`aria-invalid`
    // pairing and `disabled`'s dimmed opacity were never actually run
    // through axe, only assumed safe by inference from the default case
    // (same gap class Button's own final review found and closed).
    const { container: errorContainer } = render(
      <Checkbox hasError>Required field</Checkbox>,
    );
    expect((await axe(errorContainer)).violations).toHaveLength(0);

    const { container: disabledContainer } = render(
      <Checkbox disabled>Accept terms</Checkbox>,
    );
    const results = await axe(disabledContainer);
    expect(results).toHaveNoViolations();
  });
});
