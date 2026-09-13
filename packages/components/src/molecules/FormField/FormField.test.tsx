import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "../../atoms/Checkbox";
import fieldLabelStyles from "../../atoms/FieldLabel/FieldLabel.module.css";
import { Input } from "../../atoms/Input";
import { Radio } from "../../atoms/Radio";
import { CheckboxGroup } from "../CheckboxGroup";
import { RadioGroup } from "../RadioGroup";
import { FormField } from "./FormField";
import type { FormFieldControlProps } from "./FormField.types";

describe("FormField", () => {
  it("renders the label and control, correctly associated via aria-labelledby", () => {
    render(
      <FormField label="Email address">
        {(fieldProps) => <Input {...fieldProps} />}
      </FormField>,
    );
    expect(screen.getByRole("textbox", { name: "Email address" })).toBeInTheDocument();
  });

  it("also wires htmlFor/id for the native label-click-to-focus behavior", async () => {
    const user = userEvent.setup();
    render(
      <FormField label="Email address">
        {(fieldProps) => <Input {...fieldProps} />}
      </FormField>,
    );
    await user.click(screen.getByText("Email address"));
    expect(screen.getByRole("textbox", { name: "Email address" })).toHaveFocus();
  });

  it("shows helperText and wires it via aria-describedby when there is no error", () => {
    render(
      <FormField label="Email address" helperText="We'll never share this">
        {(fieldProps) => <Input {...fieldProps} />}
      </FormField>,
    );
    const input = screen.getByRole("textbox", { name: "Email address" });
    const describedbyId = input.getAttribute("aria-describedby");
    expect(describedbyId).toBeTruthy();
    expect(screen.getByText("We'll never share this")).toHaveAttribute(
      "id",
      describedbyId,
    );
  });

  it("shows the error message instead of helperText, wired via aria-describedby, and sets hasError on the control", () => {
    render(
      <FormField
        label="Email address"
        helperText="We'll never share this"
        error="Enter a valid email address"
      >
        {(fieldProps) => <Input {...fieldProps} />}
      </FormField>,
    );
    expect(screen.queryByText("We'll never share this")).not.toBeInTheDocument();
    const errorMessage = screen.getByText("Enter a valid email address");
    expect(errorMessage).toHaveAttribute("role", "alert");
    const input = screen.getByRole("textbox", { name: "Email address" });
    expect(input.getAttribute("aria-describedby")).toBe(errorMessage.id);
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("renders no helper/error text when neither is set, and sets no aria-describedby", () => {
    render(
      <FormField label="Email address">
        {(fieldProps) => <Input {...fieldProps} />}
      </FormField>,
    );
    expect(
      screen.getByRole("textbox", { name: "Email address" }),
    ).not.toHaveAttribute("aria-describedby");
  });

  it("marks the label required and passes required through to the control", () => {
    render(
      <FormField label="Email address" required>
        {(fieldProps) => <Input {...fieldProps} />}
      </FormField>,
    );
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeRequired();
  });

  it("defaults the FieldLabel to size 'md' and passes an explicit size through to it", () => {
    const { rerender } = render(
      <FormField label="Email address">
        {(fieldProps) => <Input {...fieldProps} />}
      </FormField>,
    );
    expect(screen.getByText("Email address")).toHaveClass(
      fieldLabelStyles.sizeMd as string,
    );

    rerender(
      <FormField label="Email address" size="lg">
        {(fieldProps) => <Input {...fieldProps} />}
      </FormField>,
    );
    expect(screen.getByText("Email address")).toHaveClass(
      fieldLabelStyles.sizeLg as string,
    );
  });

  it("dims the label/helper text and disables the control when disabled", () => {
    render(
      <FormField label="Email address" helperText="We'll never share this" disabled>
        {(fieldProps) => <Input {...fieldProps} />}
      </FormField>,
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("passes its computed field props onto a Checkbox control, correctly associated", async () => {
    const user = userEvent.setup();
    render(
      <FormField label="Accept terms">
        {(fieldProps) => <Checkbox {...fieldProps}>I agree</Checkbox>}
      </FormField>,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
    expect(checkbox).toHaveAttribute("aria-checked", "false");
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "true");
  });

  it("passes its computed field props onto a RadioGroup control, correctly associated", () => {
    render(
      <FormField label="Contact method">
        {(fieldProps) => (
          <RadioGroup {...fieldProps} defaultValue="email">
            <Radio value="email">Email</Radio>
            <Radio value="sms">SMS</Radio>
          </RadioGroup>
        )}
      </FormField>,
    );
    expect(screen.getByRole("radiogroup", { name: "Contact method" })).toBeInTheDocument();
  });

  it("passes its computed field props onto a CheckboxGroup control, correctly associated", () => {
    render(
      <FormField label="Interests">
        {(fieldProps) => (
          <CheckboxGroup {...fieldProps} defaultValue={["sports"]}>
            <Checkbox value="sports">Sports</Checkbox>
            <Checkbox value="music">Music</Checkbox>
          </CheckboxGroup>
        )}
      </FormField>,
    );
    expect(screen.getByRole("group", { name: "Interests" })).toBeInTheDocument();
  });

  it("derives every sub-part's id from an explicit id override — control, label, and helper text alike", () => {
    render(
      <FormField label="Email address" helperText="We'll never share this" id="email">
        {(fieldProps) => <Input {...fieldProps} data-testid="control" />}
      </FormField>,
    );
    const control = screen.getByTestId("control");
    expect(control).toHaveAttribute("id", "email-control");
    expect(control).toHaveAttribute("aria-labelledby", "email-label");
    expect(control).toHaveAttribute("aria-describedby", "email-helper");
    expect(screen.getByText("Email address")).toHaveAttribute("id", "email-label");
    expect(screen.getByText("We'll never share this")).toHaveAttribute("id", "email-helper");
  });

  it("forwards ref to the outer wrapper", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <FormField label="Email address" ref={ref}>
        {(fieldProps) => <Input {...fieldProps} />}
      </FormField>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("applies className, style, and data-testid to the outer wrapper", () => {
    render(
      <FormField
        label="Email address"
        className="custom"
        style={{ marginTop: "1rem" }}
        data-testid="email-field"
      >
        {(fieldProps) => <Input {...fieldProps} />}
      </FormField>,
    );
    const wrapper = screen.getByTestId("email-field");
    expect(wrapper).toHaveClass("custom");
    expect(wrapper).toHaveStyle({ marginTop: "1rem" });
  });

  it("hands back exactly the documented FormFieldControlProps shape", () => {
    let received: FormFieldControlProps | undefined;
    render(
      <FormField label="Email address" required error="Required">
        {(fieldProps) => {
          received = fieldProps;
          return <Input {...fieldProps} />;
        }}
      </FormField>,
    );
    expect(received).toMatchObject({
      hasError: true,
      disabled: false,
      required: true,
    });
    expect(received?.id).toEqual(expect.any(String));
    expect(received?.["aria-labelledby"]).toEqual(expect.any(String));
    expect(received?.["aria-describedby"]).toEqual(expect.any(String));
  });

  it("has no accessibility violations, with helper text, an error, or disabled", async () => {
    const { container: helperContainer } = render(
      <FormField label="Email address" helperText="We'll never share this">
        {(fieldProps) => <Input {...fieldProps} />}
      </FormField>,
    );
    expect((await axe(helperContainer)).violations).toHaveLength(0);

    const { container: errorContainer } = render(
      <FormField label="Email address" error="Enter a valid email address">
        {(fieldProps) => <Input {...fieldProps} />}
      </FormField>,
    );
    expect((await axe(errorContainer)).violations).toHaveLength(0);

    const { container: disabledContainer } = render(
      <FormField label="Email address" disabled>
        {(fieldProps) => <Input {...fieldProps} />}
      </FormField>,
    );
    expect((await axe(disabledContainer)).violations).toHaveLength(0);
  });
});
