import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Radio } from "../../atoms/Radio";
import radioStyles from "../../atoms/Radio/Radio.module.css";
import { RadioGroup } from "./RadioGroup";
import styles from "./RadioGroup.module.css";

describe("RadioGroup", () => {
  it("renders a role=radiogroup wrapping its Radio children", () => {
    render(
      <RadioGroup aria-label="Contact method">
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("cascades size to every Radio child that doesn't set its own", () => {
    render(
      <RadioGroup aria-label="Contact method" size="sm">
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
      </RadioGroup>,
    );
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveClass(radioStyles.sizeSm as string);
    }
  });

  it("lets an individual Radio's own explicit size override the group's", () => {
    render(
      <RadioGroup aria-label="Contact method" size="sm">
        <Radio value="email">Email</Radio>
        <Radio value="sms" size="xl">
          SMS
        </Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radio", { name: "Email" })).toHaveClass(
      radioStyles.sizeSm as string,
    );
    const sms = screen.getByRole("radio", { name: "SMS" });
    expect(sms).toHaveClass(radioStyles.sizeXl as string);
    expect(sms).not.toHaveClass(radioStyles.sizeSm as string);
  });

  it("leaves every Radio at its own default size when the group sets none", () => {
    render(
      <RadioGroup aria-label="Contact method">
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
      </RadioGroup>,
    );
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveClass(radioStyles.sizeMd as string);
    }
  });

  it("checks the option matching defaultValue when uncontrolled, and none other", () => {
    render(
      <RadioGroup aria-label="Contact method" defaultValue="email">
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radio", { name: "Email" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "SMS" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("selects a different option on click, unchecking the previous one", async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup aria-label="Contact method" defaultValue="email">
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
      </RadioGroup>,
    );
    await user.click(screen.getByRole("radio", { name: "SMS" }));
    expect(screen.getByRole("radio", { name: "SMS" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Email" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("calls onValueChange with the newly selected value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup aria-label="Contact method" onValueChange={onValueChange}>
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
      </RadioGroup>,
    );
    await user.click(screen.getByRole("radio", { name: "SMS" }));
    expect(onValueChange).toHaveBeenCalledWith("sms");
  });

  it("supports fully controlled usage", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("email");
      return (
        <RadioGroup aria-label="Contact method" value={value} onValueChange={setValue}>
          <Radio value="email">Email</Radio>
          <Radio value="sms">SMS</Radio>
        </RadioGroup>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole("radio", { name: "Email" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await user.click(screen.getByRole("radio", { name: "SMS" }));
    expect(screen.getByRole("radio", { name: "SMS" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("disables every Radio in the group at once", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup aria-label="Contact method" disabled onValueChange={onValueChange}>
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
      </RadioGroup>,
    );
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toBeDisabled();
    }
    await user.click(screen.getByRole("radio", { name: "Email" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("supports roving-tabindex arrow-key navigation with loop wrap-around by default", async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup aria-label="Contact method" defaultValue="phone">
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
        <Radio value="phone">Phone</Radio>
      </RadioGroup>,
    );
    await user.tab();
    expect(screen.getByRole("radio", { name: "Phone" })).toHaveFocus();
    // Loop defaults to true — arrow-down from the last (checked, so
    // focused) item wraps back around to the first.
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Email" })).toHaveFocus();
  });

  it("does not loop when loop is false", async () => {
    const user = userEvent.setup();
    render(
      <RadioGroup aria-label="Contact method" defaultValue="phone" loop={false}>
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
        <Radio value="phone">Phone</Radio>
      </RadioGroup>,
    );
    await user.tab();
    expect(screen.getByRole("radio", { name: "Phone" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Phone" })).toHaveFocus();
  });

  it("sets aria-required when required is true", () => {
    render(
      <RadioGroup aria-label="Contact method" required>
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-required",
      "true",
    );
  });

  it("sets aria-invalid when hasError is true", () => {
    render(
      <RadioGroup aria-label="Contact method" hasError>
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("never lets a same-named consumer prop override the computed aria-invalid", () => {
    render(
      <RadioGroup aria-label="Contact method" hasError aria-invalid={false}>
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("shows the colored left-border accent class when hasError is true, not otherwise", () => {
    const { rerender } = render(
      <RadioGroup aria-label="Contact method">
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).not.toHaveClass(styles.error as string);

    rerender(
      <RadioGroup aria-label="Contact method" hasError>
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).toHaveClass(styles.error as string);
  });

  it("sets aria-orientation to match the orientation prop", () => {
    const { rerender } = render(
      <RadioGroup aria-label="Contact method" orientation="horizontal">
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );

    rerender(
      <RadioGroup aria-label="Contact method" orientation="vertical">
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
  });

  it("sets a real dir attribute when passed explicitly", () => {
    render(
      <RadioGroup aria-label="Contact method" dir="rtl">
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).toHaveAttribute("dir", "rtl");
  });

  it("participates in real form submission via name, through Radix's own hidden inputs", async () => {
    const user = userEvent.setup();
    const captured: { submitted: FormData | null } = { submitted: null };
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          captured.submitted = new FormData(event.currentTarget);
        }}
      >
        <RadioGroup aria-label="Contact method" name="contact-method" defaultValue="sms">
          <Radio value="email">Email</Radio>
          <Radio value="sms">SMS</Radio>
        </RadioGroup>
        <button type="submit">Submit</button>
      </form>,
    );
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(captured.submitted?.get("contact-method")).toBe("sms");
  });

  it("forwards ref to the underlying radiogroup div", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <RadioGroup aria-label="Contact method" ref={ref}>
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute("role", "radiogroup");
  });

  it("applies className to the radiogroup", () => {
    render(
      <RadioGroup aria-label="Contact method" className="custom">
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );
    expect(screen.getByRole("radiogroup")).toHaveClass("custom");
  });

  it("forwards style, id, and data-testid to the radiogroup", () => {
    render(
      <RadioGroup
        aria-label="Contact method"
        style={{ marginTop: "1rem" }}
        id="contact-method-group"
        data-testid="contact-method-group"
      >
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );
    const group = screen.getByTestId("contact-method-group");
    expect(group).toHaveStyle({ marginTop: "1rem" });
    expect(group).toHaveAttribute("id", "contact-method-group");
  });

  it("warns once in development when there is no accessible name", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <RadioGroup>
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );
    rerender(
      <RadioGroup orientation="horizontal">
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("no accessible name"),
    );
    consoleWarnSpy.mockRestore();
  });

  it("does not warn when aria-label or aria-labelledby is present", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <>
        <RadioGroup aria-label="Contact method">
          <Radio value="email">Email</Radio>
        </RadioGroup>
        <RadioGroup aria-labelledby="external-label">
          <Radio value="sms">SMS</Radio>
        </RadioGroup>
      </>,
    );
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("has no accessibility violations with real Radio children, checked and unchecked alike", async () => {
    const { container } = render(
      <RadioGroup aria-label="Contact method" defaultValue="email">
        <Radio value="email">Email</Radio>
        <Radio value="sms">SMS</Radio>
        <Radio value="phone">Phone</Radio>
      </RadioGroup>,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations when disabled or hasError", async () => {
    const { container: disabledContainer } = render(
      <RadioGroup aria-label="Contact method" disabled>
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );
    expect((await axe(disabledContainer)).violations).toHaveLength(0);

    const { container: errorContainer } = render(
      <RadioGroup aria-label="Contact method" hasError>
        <Radio value="email">Email</Radio>
      </RadioGroup>,
    );
    expect((await axe(errorContainer)).violations).toHaveLength(0);
  });
});
