import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, StrictMode, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input } from "../../atoms/Input";
import { FieldGroup } from "../../molecules/FieldGroup";
import { FormField } from "../../molecules/FormField";
import { Form } from "./Form";
import styles from "./Form.module.css";
import type { FormErrors, FormProps } from "./Form.types";

const shortUsername = (value: unknown) => {
  const text = String(value ?? "");
  return text && text.length < 3 ? "Use 3 or more characters" : undefined;
};

function Signup({ extra, ...props }: FormProps & { extra?: ReactNode }) {
  return (
    <Form aria-label="Sign up" {...props}>
      <FormField label="Email" name="email" required>
        {(field) => <Input {...field} type="email" />}
      </FormField>
      <FormField label="Username" name="username" validate={shortUsername}>
        {(field) => <Input {...field} />}
      </FormField>
      {extra}
      <Form.Summary />
      <Form.Actions>
        <Form.Submit>Create account</Form.Submit>
      </Form.Actions>
    </Form>
  );
}

const submit = () => userEvent.click(screen.getByRole("button", { name: "Create account" }));
const formElement = () => screen.getByRole("form", { name: "Sign up" }) as HTMLFormElement;

describe("Form", () => {
  afterEach(() => vi.restoreAllMocks());

  it("is a native form with a name, no browser validation bubbles, and the props it is given", () => {
    const ref = createRef<HTMLFormElement>();
    render(
      <Form ref={ref} aria-label="Sign up" className="mine" style={{ margin: 3 }} data-testid="form" id="f">
        <p>content</p>
      </Form>,
    );
    const form = screen.getByRole("form", { name: "Sign up" });
    expect(form.tagName).toBe("FORM");
    expect(ref.current).toBe(form);
    expect(form).toHaveAttribute("novalidate");
    expect(form).toHaveClass("mine", styles.root as string);
    expect(form).toHaveAttribute("id", "f");
    expect(form).toHaveStyle({ margin: "3px" });
    expect(form).not.toHaveAttribute("aria-busy");
  });

  it("lets the browser validate when noValidate is turned off", () => {
    render(<Form aria-label="Sign up" noValidate={false} />);
    expect(formElement()).not.toHaveAttribute("novalidate");
  });

  it("hands onSubmit what the form holds, with repeated names as arrays, the FormData and the event", async () => {
    const onSubmit = vi.fn();
    render(
      <Form aria-label="Sign up" onSubmit={onSubmit}>
        <input name="name" defaultValue="Ada" aria-label="name" />
        <input type="checkbox" name="tag" value="a" defaultChecked aria-label="a" />
        <input type="checkbox" name="tag" value="b" defaultChecked aria-label="b" />
        <button type="submit">Go</button>
      </Form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [values, formData, event] = onSubmit.mock.calls[0] as [Record<string, unknown>, FormData, Event];
    expect(values).toEqual({ name: "Ada", tag: ["a", "b"] });
    expect(formData.get("name")).toBe("Ada");
    expect(event.defaultPrevented).toBe(true);
  });

  it("refuses a submit with an error, shows it in the field, and does not call onSubmit", async () => {
    const onSubmit = vi.fn();
    const onInvalidSubmit = vi.fn();
    render(<Signup onSubmit={onSubmit} onInvalidSubmit={onInvalidSubmit} />);
    await submit();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onInvalidSubmit).toHaveBeenCalledTimes(1);
    expect(Object.keys(onInvalidSubmit.mock.calls[0]?.[0] as FormErrors)).toEqual(["email"]);
    const email = screen.getByRole("textbox", { name: "Email" });
    expect(email).toHaveAccessibleDescription(/Constraints not satisfied|not valid/i);
    expect(email).toHaveAttribute("aria-invalid", "true");
  });

  it("moves focus to the first invalid control, in page order", async () => {
    render(<Signup onSubmit={vi.fn()} />);
    await submit();
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveFocus();

    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "a@b.co");
    await userEvent.type(screen.getByLabelText("Username"), "x");
    await submit();
    expect(screen.getByLabelText("Username")).toHaveFocus();
    expect(screen.getByLabelText("Username")).toHaveAccessibleDescription("Use 3 or more characters");
  });

  it("leaves focus alone when focusTarget is false", async () => {
    render(<Signup onSubmit={vi.fn()} focusTarget={false} />);
    await submit();
    expect(screen.getByRole("textbox", { name: "Email" })).not.toHaveFocus();
  });

  it("runs a field's own rule with its value and every value", async () => {
    const validate = vi.fn(() => undefined);
    render(
      <Form aria-label="Sign up" onSubmit={vi.fn()}>
        <FormField label="A" name="a" validate={validate}>
          {(field) => <Input {...field} defaultValue="one" />}
        </FormField>
        <FormField label="B" name="b">
          {(field) => <Input {...field} defaultValue="two" />}
        </FormField>
        <Form.Submit>Go</Form.Submit>
      </Form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(validate).toHaveBeenCalledWith("one", { a: "one", b: "two" });
  });

  it("says what the browser's own rule says before a custom rule, for the same field", async () => {
    render(
      <Form aria-label="Sign up" onSubmit={vi.fn()}>
        <FormField label="Name" name="name" required validate={() => "custom"}>
          {(field) => <Input {...field} />}
        </FormField>
        <Form.Submit>Go</Form.Submit>
      </Form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(screen.getByRole("textbox", { name: "Name" })).not.toHaveAccessibleDescription("custom");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAccessibleDescription(/Constraints not satisfied|not valid/i);
  });

  it("runs the form's own rule, keeping a field's own message for the same field", async () => {
    const validate = vi.fn((values: Record<string, unknown>) =>
      values.password !== values.confirm ? { confirm: "Passwords differ", username: "ignored", form: "Check the form" } : undefined,
    );
    render(
      <Form aria-label="Sign up" onSubmit={vi.fn()} validate={validate}>
        <FormField label="Password" name="password">
          {(field) => <Input {...field} defaultValue="one" />}
        </FormField>
        <FormField label="Confirm" name="confirm">
          {(field) => <Input {...field} defaultValue="two" />}
        </FormField>
        <FormField label="Username" name="username" validate={shortUsername}>
          {(field) => <Input {...field} defaultValue="x" />}
        </FormField>
        <Form.Summary />
        <Form.Submit>Go</Form.Submit>
      </Form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(screen.getByLabelText("Confirm")).toHaveAccessibleDescription("Passwords differ");
    expect(screen.getByLabelText("Username")).toHaveAccessibleDescription("Use 3 or more characters");
    // a key that matches no field is shown in the summary, unlinked
    expect(screen.getByText("Check the form")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Check the form/ })).toBeNull();
  });

  it("finds an invalid control that has no FormField, by its name, and lists it unlinked", async () => {
    render(
      <Form aria-label="Sign up" onSubmit={vi.fn()}>
        <input name="plain" required aria-label="plain" />
        <Form.Summary />
        <Form.Submit>Go</Form.Submit>
      </Form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(screen.getByLabelText("plain")).toHaveFocus();
    expect(screen.getByText(/Constraints not satisfied|not valid/i)).toBeInTheDocument();
  });

  it("skips validation for a submitter marked formnovalidate", async () => {
    const onSubmit = vi.fn();
    render(
      <Form aria-label="Sign up" onSubmit={onSubmit}>
        <FormField label="Name" name="name" required>
          {(field) => <Input {...field} />}
        </FormField>
        <button type="submit" formNoValidate>
          Save draft
        </button>
      </Form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("leaves a valid submit to the browser when there is no onSubmit", () => {
    render(<Signup />);
    const form = formElement();
    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), { target: { value: "a@b.co" } });
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "ada" } });
    // Heard after React's handlers (the document is above the root), then cancelled so jsdom doesn't try to navigate.
    let prevented: boolean | undefined;
    document.addEventListener(
      "submit",
      (event) => {
        prevented = event.defaultPrevented;
        event.preventDefault();
      },
      { once: true },
    );
    fireEvent.submit(form);
    expect(prevented).toBe(false);
  });

  it("stops an invalid submit with no onSubmit from reaching the browser", () => {
    render(<Signup />);
    expect(fireEvent.submit(formElement())).toBe(false);
  });

  describe("the summary", () => {
    it("is not there until something is wrong, then lists each problem as a link to its control", async () => {
      render(<Signup onSubmit={vi.fn()} />);
      expect(screen.queryByRole("link")).toBeNull();
      await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "a@b.co");
      await userEvent.type(screen.getByLabelText("Username"), "x");
      await submit();
      const link = screen.getByRole("link", { name: "Username: Use 3 or more characters" });
      expect(screen.getByText("There is 1 problem with this form")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("textbox", { name: "Email" }));
      await userEvent.click(link);
      expect(screen.getByLabelText("Username")).toHaveFocus();
    });

    it("counts the problems and takes a title of its own", async () => {
      render(
        <Form aria-label="Sign up" onSubmit={vi.fn()}>
          <FormField label="A" name="a" required>
            {(field) => <Input {...field} />}
          </FormField>
          <FormField label="B" name="b" required>
            {(field) => <Input {...field} />}
          </FormField>
          <Form.Summary />
          <Form.Submit>Go</Form.Submit>
        </Form>,
      );
      await userEvent.click(screen.getByRole("button", { name: "Go" }));
      expect(screen.getByText("There are 2 problems with this form")).toBeInTheDocument();
    });

    it("takes focus instead of the field when focusTarget is summary", async () => {
      render(<Signup onSubmit={vi.fn()} focusTarget="summary" />);
      await submit();
      const summary = screen.getByText("There is 1 problem with this form").closest("[tabindex]");
      expect(summary).toHaveFocus();
    });

    it("renders nothing, with a warning, outside a form", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { container } = render(<Form.Summary data-testid="lonely" />);
      expect(container).toBeEmptyDOMElement();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("Form.Summary: rendered outside a <Form>"));
    });
  });

  it("announces the number of errors in a live region that was already in the page", async () => {
    render(<Signup onSubmit={vi.fn()} />);
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    await submit();
    await waitFor(() => expect(status).toHaveTextContent("1 error."));
  });

  describe("when a field is checked as it is edited", () => {
    it("waits for the first refused submit by default, then clears an error as soon as it is right", async () => {
      render(<Signup onSubmit={vi.fn()} />);
      const username = screen.getByLabelText("Username");
      await userEvent.type(username, "x");
      await userEvent.tab();
      expect(username).not.toHaveAccessibleDescription("Use 3 or more characters");

      await submit();
      expect(username).toHaveAccessibleDescription("Use 3 or more characters");
      await userEvent.type(username, "yz");
      expect(username).not.toHaveAccessibleDescription("Use 3 or more characters");
    });

    it("checks a field when focus leaves it with validateOn=blur", async () => {
      render(<Signup validateOn="blur" />);
      const username = screen.getByLabelText("Username");
      await userEvent.type(username, "x");
      expect(username).not.toHaveAccessibleDescription("Use 3 or more characters");
      await userEvent.tab();
      expect(username).toHaveAccessibleDescription("Use 3 or more characters");
    });

    it("checks a field on every edit with validateOn=change", async () => {
      render(<Signup validateOn="change" />);
      const username = screen.getByLabelText("Username");
      await userEvent.type(username, "x");
      expect(username).toHaveAccessibleDescription("Use 3 or more characters");
      await userEvent.type(username, "yz");
      expect(username).not.toHaveAccessibleDescription("Use 3 or more characters");
    });

    it("keeps the list in page order as errors come and go", async () => {
      render(<Signup onSubmit={vi.fn()} />);
      await userEvent.type(screen.getByLabelText("Username"), "x");
      await submit();
      expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
        expect.stringContaining("Email"),
        expect.stringContaining("Username"),
      ]);
    });
  });

  describe("errors set from outside", () => {
    it("shows them beside the form's own and over them for the same field", () => {
      render(<Signup errors={{ email: "That email is taken", username: "Reserved" }} />);
      expect(screen.getByRole("textbox", { name: "Email" })).toHaveAccessibleDescription("That email is taken");
      expect(screen.getByLabelText("Username")).toHaveAccessibleDescription("Reserved");
    });

    it("asks for the object to use instead, without a field, when the person edits it", async () => {
      const onErrorsChange = vi.fn();
      render(<Signup errors={{ email: "Taken", username: "Reserved" }} onErrorsChange={onErrorsChange} />);
      await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "a");
      expect(onErrorsChange).toHaveBeenCalledWith({ username: "Reserved" });
    });

    it("wired to state, drops the error once the field is edited, and does not loop", async () => {
      function Wired() {
        const [errors, setErrors] = useState<FormErrors>({ email: "Taken" });
        return <Signup errors={errors} onErrorsChange={setErrors} />;
      }
      render(<Wired />);
      const email = screen.getByRole("textbox", { name: "Email" });
      expect(email).toHaveAccessibleDescription("Taken");
      await userEvent.type(email, "a");
      expect(email).not.toHaveAccessibleDescription("Taken");
    });

    it("clears the form's own errors on reset, and asks for the outside ones to go too", async () => {
      const onErrorsChange = vi.fn();
      render(
        <Signup
          onSubmit={vi.fn()}
          errors={{ username: "Reserved" }}
          onErrorsChange={onErrorsChange}
          extra={<button type="reset">Reset</button>}
        />,
      );
      await submit();
      expect(screen.getByRole("textbox", { name: "Email" })).toHaveAccessibleDescription(/Constraints not satisfied|not valid/i);
      await userEvent.click(screen.getByRole("button", { name: "Reset" }));
      expect(screen.getByRole("textbox", { name: "Email" })).not.toHaveAccessibleDescription(/Constraints not satisfied|not valid/i);
      expect(onErrorsChange).toHaveBeenCalledWith({});
    });
  });

  describe("while onSubmit runs", () => {
    function deferred() {
      let resolve!: () => void;
      let reject!: (error: unknown) => void;
      const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    }

    it("is busy, disables its fields and the submit button, and ignores a second submit", async () => {
      const gate = deferred();
      const onSubmit = vi.fn(() => gate.promise);
      render(<Signup onSubmit={onSubmit} />);
      await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "a@b.co");
      await userEvent.type(screen.getByLabelText("Username"), "ada");
      await submit();
      await waitFor(() => expect(formElement()).toHaveAttribute("aria-busy", "true"));
      expect(screen.getByLabelText("Username")).toBeDisabled();
      expect(screen.getByRole("button", { name: /Create account/ })).toBeDisabled();

      fireEvent.submit(formElement());
      expect(onSubmit).toHaveBeenCalledTimes(1);

      await act(async () => gate.resolve());
      await waitFor(() => expect(formElement()).not.toHaveAttribute("aria-busy"));
      expect(screen.getByLabelText("Username")).toBeEnabled();
    });

    it("hands a rejection to onSubmitError and becomes usable again", async () => {
      const gate = deferred();
      const onSubmitError = vi.fn();
      render(<Signup onSubmit={() => gate.promise} onSubmitError={onSubmitError} />);
      await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "a@b.co");
      await userEvent.type(screen.getByLabelText("Username"), "ada");
      await submit();
      const failure = new Error("nope");
      await act(async () => gate.reject(failure));
      await waitFor(() => expect(onSubmitError).toHaveBeenCalledWith(failure));
      await waitFor(() => expect(formElement()).not.toHaveAttribute("aria-busy"));
    });

    it("gives focus back to where it was once it finishes, if nothing else has it", async () => {
      const gate = deferred();
      render(<Signup onSubmit={() => gate.promise} />);
      const username = screen.getByLabelText("Username");
      await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "a@b.co");
      await userEvent.type(username, "ada{Enter}");
      await waitFor(() => expect(formElement()).toHaveAttribute("aria-busy", "true"));
      await act(async () => gate.resolve());
      await waitFor(() => expect(formElement()).not.toHaveAttribute("aria-busy"));
      expect(username).toHaveFocus();
    });

    it("does not set state after it has been unmounted", async () => {
      const gate = deferred();
      const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const view = render(<Signup onSubmit={() => gate.promise} />);
      await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "a@b.co");
      await userEvent.type(screen.getByLabelText("Username"), "ada");
      await submit();
      view.unmount();
      await act(async () => gate.resolve());
      expect(error).not.toHaveBeenCalled();
    });
  });

  describe("disabled", () => {
    it("disables every FormField inside and does nothing on submit", async () => {
      const onSubmit = vi.fn();
      render(<Signup disabled onSubmit={onSubmit} />);
      expect(screen.getByLabelText("Username")).toBeDisabled();
      expect(screen.getByRole("button", { name: "Create account" })).toBeDisabled();
      expect(fireEvent.submit(formElement())).toBe(false);
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("is merged with a surrounding FieldGroup rather than replacing it", () => {
      render(
        <FieldGroup legend="Outer" disabled>
          <Form aria-label="Inner">
            <FormField label="Name" name="name">
              {(field) => <Input {...field} />}
            </FormField>
          </Form>
        </FieldGroup>,
      );
      expect(screen.getByRole("textbox", { name: "Name" })).toBeDisabled();
    });
  });

  it("hands its size to the fields and, through them, their controls; a field's own size wins", () => {
    render(
      <Form aria-label="Sizes" size="lg">
        <FormField label="Inherits" name="a">
          {(field) => <Input {...field} data-testid="a" />}
        </FormField>
        <FormField label="Own" name="b" size="sm">
          {(field) => <Input {...field} data-testid="b" />}
        </FormField>
      </Form>,
    );
    const heights = ["a", "b"].map((id) => screen.getByTestId(id).parentElement?.className);
    expect(heights[0]).not.toBe(heights[1]);
  });

  it("hands each control the name its field was given, and a FormField on its own is unchanged", () => {
    render(
      <>
        <FormField label="Named" name="who">
          {(field) => <Input {...field} />}
        </FormField>
        <FormField label="Plain">{(field) => <Input {...field} />}</FormField>
      </>,
    );
    expect(screen.getByLabelText("Named")).toHaveAttribute("name", "who");
    expect(screen.getByLabelText("Plain")).not.toHaveAttribute("name");
  });

  it("ignores a submit that came from a form portaled inside it", async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    render(
      <Form aria-label="Outer" onSubmit={outer}>
        <FormField label="Outer field" name="o" required>
          {(field) => <Input {...field} />}
        </FormField>
        {createPortal(
          <Form aria-label="Inner" onSubmit={inner}>
            <FormField label="Inner field" name="i">
              {(field) => <Input {...field} defaultValue="v" />}
            </FormField>
            <Form.Submit>Inner go</Form.Submit>
          </Form>,
          document.body,
        )}
      </Form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Inner go" }));
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
    // and the outer form's own required field was not marked invalid by it
    expect(screen.getByRole("textbox", { name: "Outer field" })).not.toHaveAttribute("aria-invalid", "true");
  });

  it("warns once about a field name no control is submitted under", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(
      <Form aria-label="Sign up" onSubmit={vi.fn()}>
        <FormField label="Orphan" name="orphan-field">
          {(field) => <Input id={field.id} aria-labelledby={field["aria-labelledby"]} />}
        </FormField>
        <Form.Submit>Go</Form.Submit>
      </Form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    const calls = warn.mock.calls.filter(([text]) => String(text).includes("orphan-field"));
    expect(calls).toHaveLength(1);
  });

  it("keeps its own computed attributes whatever a same-named prop says", () => {
    render(<Form aria-label="Sign up" aria-busy="true" />);
    // `aria-busy` is the form's to compute: idle is "not busy", not whatever the caller wrote
    expect(formElement()).not.toHaveAttribute("aria-busy");
  });

  it("calls the caller's own onChange, onBlur and onReset as well", async () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const onReset = vi.fn();
    render(
      <Form aria-label="Sign up" onChange={onChange} onBlur={onBlur} onReset={onReset}>
        <input aria-label="x" name="x" />
        <button type="reset">Reset</button>
      </Form>,
    );
    await userEvent.type(screen.getByLabelText("x"), "a");
    await userEvent.tab();
    await userEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onChange).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
    expect(onReset).toHaveBeenCalled();
  });

  it("writes its own text with a labels object, ignores an undefined entry, and uses formatNumber for counts", async () => {
    render(
      <Form
        aria-label="Sign up"
        onSubmit={vi.fn()}
        labels={{ summaryTitle: undefined, errorCount: (count) => `Fix ${count}` }}
        formatNumber={(value) => `#${value}`}
      >
        <FormField label="A" name="a" required>
          {(field) => <Input {...field} />}
        </FormField>
        <FormField label="B" name="b" required>
          {(field) => <Input {...field} />}
        </FormField>
        <Form.Summary />
        <Form.Submit>Go</Form.Submit>
      </Form>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(screen.getByText("There are #2 problems with this form")).toBeInTheDocument();
  });

  it("survives StrictMode: registers, refuses, and submits", async () => {
    const onSubmit = vi.fn();
    render(
      <StrictMode>
        <Signup onSubmit={onSubmit} />
      </StrictMode>,
    );
    await submit();
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveFocus();
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "a@b.co");
    await userEvent.type(screen.getByLabelText("Username"), "ada");
    await submit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  describe("Form.Actions and Form.Submit", () => {
    it("align the row and make a submit button", () => {
      render(
        <Form aria-label="Sign up">
          <Form.Actions align="end" data-testid="actions">
            <Form.Submit>Save</Form.Submit>
          </Form.Actions>
        </Form>,
      );
      expect(screen.getByTestId("actions")).toHaveClass(styles.alignEnd as string);
      expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");
    });

    it("Form.Submit works outside a form as a plain submit button", () => {
      render(<Form.Submit>Alone</Form.Submit>);
      expect(screen.getByRole("button", { name: "Alone" })).toHaveAttribute("type", "submit");
    });

    it("Form.Submit lets isLoading and disabled be set by hand", () => {
      render(<Form.Submit isLoading loadingText="Saving…">Save</Form.Submit>);
      expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    });
  });

  describe("accessibility", () => {
    it("has no violations when valid, invalid with a summary, and busy", async () => {
      const gate = new Promise<void>(() => undefined);
      const { container, rerender } = render(<Signup onSubmit={() => gate} />);
      expect(await axe(container)).toHaveNoViolations();

      await submit();
      expect(await axe(container)).toHaveNoViolations();

      rerender(<Signup onSubmit={() => gate} disabled />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("announces a refused submit once, from a region that was there before", async () => {
      render(<Signup onSubmit={vi.fn()} />);
      const status = within(formElement()).getByRole("status");
      await submit();
      await waitFor(() => expect(status).toHaveTextContent("1 error."));
      await waitFor(() => expect(status).toBeEmptyDOMElement(), { timeout: 3000 });
    });
  });
});
