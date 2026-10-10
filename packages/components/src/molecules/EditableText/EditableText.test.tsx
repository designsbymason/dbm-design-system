import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { StrictMode, createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FormField } from "../FormField";
import { EditableText } from "./EditableText";

const trigger = () => screen.getByRole("button", { name: /Name/ });
const field = () => screen.getByRole("textbox") as HTMLInputElement;

describe("EditableText", () => {
  describe("display mode", () => {
    it("shows the value as a button named by the field and the value, described by the action", () => {
      render(<EditableText aria-label="Name" defaultValue="Ada" />);
      const button = screen.getByRole("button");
      expect(button).toHaveAccessibleName("Name Ada");
      expect(button).toHaveAccessibleDescription("Edit");
      expect(screen.queryByRole("textbox")).toBeNull();
    });

    it("shows the placeholder, still as a button, for an empty value", () => {
      render(<EditableText aria-label="Name" placeholder="Add a name" />);
      expect(screen.getByRole("button")).toHaveAccessibleName("Name Add a name");
    });

    it("keeps a button name from the field when there is neither a value nor a placeholder", () => {
      render(<EditableText aria-label="Name" />);
      expect(screen.getByRole("button")).toHaveAccessibleName("Name");
    });

    it("renders plain text with no button when read-only", () => {
      render(<EditableText aria-label="Name" defaultValue="Ada" readOnly />);
      expect(screen.queryByRole("button")).toBeNull();
      expect(screen.getByText("Ada")).toBeInTheDocument();
    });

    it("cannot be activated when disabled", async () => {
      const user = userEvent.setup();
      render(<EditableText aria-label="Name" defaultValue="Ada" disabled />);
      expect(screen.getByRole("button")).toBeDisabled();
      await user.click(screen.getByRole("button"));
      expect(screen.queryByRole("textbox")).toBeNull();
    });

    it("draws the form value in a hidden input under name", () => {
      const { container } = render(<EditableText aria-label="Name" defaultValue="Ada" name="person" />);
      const hidden = container.querySelector<HTMLInputElement>("input[type=hidden]");
      expect(hidden).toHaveAttribute("name", "person");
      expect(hidden).toHaveValue("Ada");
    });

    it("reads a non-string value as empty without throwing", () => {
      render(<EditableText aria-label="Name" value={undefined as unknown as string} placeholder="Add" />);
      expect(screen.getByRole("button")).toHaveAccessibleName("Name Add");
    });
  });

  describe("starting and finishing an edit", () => {
    it("opens a field on click, focuses it and selects the value", async () => {
      const user = userEvent.setup();
      render(<EditableText aria-label="Name" defaultValue="Ada Lovelace" />);
      await user.click(trigger());
      expect(field()).toHaveFocus();
      expect(field()).toHaveValue("Ada Lovelace");
      expect(field().selectionStart).toBe(0);
      expect(field().selectionEnd).toBe("Ada Lovelace".length);
    });

    it("puts the caret at the end when selectOnFocus is off", async () => {
      const user = userEvent.setup();
      render(<EditableText aria-label="Name" defaultValue="Ada" selectOnFocus={false} />);
      await user.click(trigger());
      expect(field().selectionStart).toBe(3);
      expect(field().selectionEnd).toBe(3);
    });

    it("commits on Enter, calls onValueChange once and returns focus to the text", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<EditableText aria-label="Name" defaultValue="Ada" onValueChange={onValueChange} />);
      await user.click(trigger());
      await user.keyboard("{Control>}a{/Control}Grace{Enter}");
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith("Grace");
      expect(screen.getByRole("button")).toHaveAccessibleName("Name Grace");
      expect(screen.getByRole("button")).toHaveFocus();
    });

    it("does not report each keystroke", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<EditableText aria-label="Name" defaultValue="" onValueChange={onValueChange} />);
      await user.click(screen.getByRole("button"));
      await user.keyboard("abc");
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("cancels on Escape: nothing reported, the old value shown, focus back on the text", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<EditableText aria-label="Name" defaultValue="Ada" onValueChange={onValueChange} />);
      await user.click(trigger());
      await user.keyboard("Grace{Escape}");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByRole("button")).toHaveAccessibleName("Name Ada");
      expect(screen.getByRole("button")).toHaveFocus();
    });

    it("starts again from the committed value after a cancel", async () => {
      const user = userEvent.setup();
      render(<EditableText aria-label="Name" defaultValue="Ada" />);
      await user.click(trigger());
      await user.keyboard("Grace{Escape}");
      await user.click(screen.getByRole("button"));
      expect(field()).toHaveValue("Ada");
    });

    it("reports nothing when the committed text is unchanged", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<EditableText aria-label="Name" defaultValue="Ada" onValueChange={onValueChange} />);
      await user.click(trigger());
      await user.keyboard("{Enter}");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.queryByRole("textbox")).toBeNull();
    });

    it("opens from the keyboard with Enter and with Space", async () => {
      const user = userEvent.setup();
      render(<EditableText aria-label="Name" defaultValue="Ada" />);
      await user.tab();
      await user.keyboard("{Enter}");
      expect(field()).toHaveFocus();
      await user.keyboard("{Escape}");
      await user.keyboard(" ");
      expect(field()).toHaveFocus();
    });

    it("does not commit an Enter that belongs to an IME composition", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<EditableText aria-label="Name" defaultValue="Ada" onValueChange={onValueChange} />);
      await user.click(trigger());
      fireEvent.keyDown(field(), { key: "Enter", isComposing: true, keyCode: 229 });
      expect(onValueChange).not.toHaveBeenCalled();
      expect(field()).toBeInTheDocument();
    });

    it("stops Escape reaching an ancestor's handler while editing", async () => {
      const user = userEvent.setup();
      const onKeyDown = vi.fn();
      render(
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a stand-in for a surrounding surface
        <div onKeyDown={onKeyDown}>
          <EditableText aria-label="Name" defaultValue="Ada" />
        </div>,
      );
      await user.click(trigger());
      onKeyDown.mockClear();
      await user.keyboard("{Escape}");
      expect(onKeyDown).not.toHaveBeenCalled();
    });
  });

  describe("leaving the field", () => {
    const withNeighbour = (props: Partial<React.ComponentProps<typeof EditableText>> = {}) =>
      render(
        <>
          <EditableText aria-label="Name" defaultValue="Ada" {...props} />
          <button type="button">Other</button>
        </>,
      );

    it("commits on Tab by default", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      withNeighbour({ onValueChange });
      await user.click(trigger());
      await user.keyboard("Grace");
      await user.tab();
      expect(onValueChange).toHaveBeenCalledWith("Grace");
      expect(screen.getByRole("button", { name: "Other" })).toHaveFocus();
    });

    it("commits on a press elsewhere without taking focus back", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      withNeighbour({ onValueChange });
      await user.click(trigger());
      await user.keyboard("Grace");
      await user.click(screen.getByRole("button", { name: "Other" }));
      expect(onValueChange).toHaveBeenCalledWith("Grace");
      expect(screen.getByRole("button", { name: "Other" })).toHaveFocus();
    });

    it("throws the edit away on blur with blurBehavior=cancel", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      withNeighbour({ onValueChange, blurBehavior: "cancel" });
      await user.click(trigger());
      await user.keyboard("Grace");
      await user.tab();
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /Name/ })).toHaveAccessibleName("Name Ada");
    });

    it("reports focus and blur once for the whole component", async () => {
      const user = userEvent.setup();
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      withNeighbour({ onFocus, onBlur, showControls: true });
      await user.click(trigger());
      expect(onFocus).toHaveBeenCalledTimes(1);
      await user.tab();
      await user.tab();
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onBlur).not.toHaveBeenCalled();
      await user.tab();
      await waitFor(() => expect(onBlur).toHaveBeenCalledTimes(1));
    });
  });

  describe("activation", () => {
    it("needs a double click when activation is doubleClick, but a keyboard press still works", async () => {
      const user = userEvent.setup();
      render(<EditableText aria-label="Name" defaultValue="Ada" activation="doubleClick" />);
      await user.click(trigger());
      expect(screen.queryByRole("textbox")).toBeNull();
      await user.dblClick(trigger());
      expect(field()).toBeInTheDocument();
      await user.keyboard("{Escape}");
      await user.keyboard("{Enter}");
      expect(field()).toBeInTheDocument();
    });
  });

  describe("controls", () => {
    it("shows named confirm and cancel buttons only when asked", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<EditableText aria-label="Name" defaultValue="Ada" />);
      await user.click(trigger());
      expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
      rerender(<EditableText aria-label="Name" defaultValue="Ada" showControls />);
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });

    it("commits with the confirm button without blurring first", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      const onBlur = vi.fn();
      render(<EditableText aria-label="Name" defaultValue="Ada" showControls onValueChange={onValueChange} onBlur={onBlur} />);
      await user.click(trigger());
      await user.keyboard("Grace");
      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith("Grace");
      expect(screen.getByRole("button")).toHaveFocus();
    });

    it("cancels with the cancel button even under blurBehavior=commit", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<EditableText aria-label="Name" defaultValue="Ada" showControls onValueChange={onValueChange} />);
      await user.click(trigger());
      await user.keyboard("Grace");
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByRole("button")).toHaveAccessibleName("Name Ada");
    });

    it("tabs through the field, then confirm, then cancel", async () => {
      const user = userEvent.setup();
      render(<EditableText aria-label="Name" defaultValue="Ada" showControls />);
      await user.click(trigger());
      expect(field()).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
      await user.tab();
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    });
  });

  describe("validation", () => {
    it("refuses an empty value with required, keeping the field open with the message", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<EditableText aria-label="Name" defaultValue="Ada" required onValueChange={onValueChange} />);
      await user.click(trigger());
      await user.keyboard("{Control>}a{/Control}{Backspace}{Enter}");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(field()).toBeInTheDocument();
      expect(field()).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByRole("alert")).toHaveTextContent("This field is required");
      expect(field()).toHaveAccessibleDescription("This field is required");
    });

    it("clears the message once the draft changes", async () => {
      const user = userEvent.setup();
      render(<EditableText aria-label="Name" defaultValue="" required />);
      await user.click(screen.getByRole("button"));
      await user.keyboard("{Enter}");
      expect(screen.getByRole("alert")).toBeInTheDocument();
      await user.keyboard("A");
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("runs validate and refuses a returned message", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <EditableText
          aria-label="Name"
          defaultValue="Ada"
          validate={(draft) => (draft.length < 5 ? "Too short" : undefined)}
          onValueChange={onValueChange}
        />,
      );
      await user.click(trigger());
      await user.keyboard("{Enter}{Enter}");
      expect(screen.getByRole("alert")).toHaveTextContent("Too short");
      await user.keyboard("{Control>}a{/Control}Grace Hopper{Enter}");
      expect(onValueChange).toHaveBeenCalledWith("Grace Hopper");
    });

    it("accepts the value, with a development warning, when validate throws", async () => {
      const user = userEvent.setup();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const onValueChange = vi.fn();
      render(
        <EditableText
          aria-label="Name"
          defaultValue="Ada"
          validate={() => {
            throw new Error("boom");
          }}
          onValueChange={onValueChange}
        />,
      );
      await user.click(trigger());
      await user.keyboard("B{Enter}");
      expect(onValueChange).toHaveBeenCalledWith("B");
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("`validate` threw"));
      warn.mockRestore();
    });

    it("keeps an edit open under blurBehavior=commit when it is refused", async () => {
      const user = userEvent.setup();
      render(
        <>
          <EditableText aria-label="Name" defaultValue="Ada" required />
          <button type="button">Other</button>
        </>,
      );
      await user.click(trigger());
      await user.keyboard("{Control>}a{/Control}{Backspace}");
      await user.tab();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("marks the field invalid for hasError (a button can't carry aria-invalid)", async () => {
      const user = userEvent.setup();
      render(<EditableText aria-label="Name" defaultValue="Ada" hasError />);
      expect(screen.getByRole("button")).not.toHaveAttribute("aria-invalid");
      await user.click(trigger());
      expect(field()).toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("multiline", () => {
    it("edits in a textarea where Enter adds a line and Ctrl+Enter commits", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<EditableText aria-label="Notes" multiline defaultValue="One" onValueChange={onValueChange} />);
      await user.click(screen.getByRole("button"));
      const textarea = screen.getByRole("textbox");
      expect(textarea.tagName).toBe("TEXTAREA");
      await user.keyboard("{End}{Enter}Two");
      expect(onValueChange).not.toHaveBeenCalled();
      await user.keyboard("{Control>}{Enter}{/Control}");
      expect(onValueChange).toHaveBeenCalledWith("One\nTwo");
    });

    it("still cancels with Escape", async () => {
      const user = userEvent.setup();
      render(<EditableText aria-label="Notes" multiline defaultValue="One" />);
      await user.click(screen.getByRole("button"));
      await user.keyboard("{End}x{Escape}");
      expect(screen.getByRole("button")).toHaveTextContent("One");
    });
  });

  describe("controlled", () => {
    it("shows the value prop until it changes, reporting an edit through onValueChange", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<EditableText aria-label="Name" value="Ada" onValueChange={onValueChange} />);
      await user.click(trigger());
      await user.keyboard("{Control>}a{/Control}Grace{Enter}");
      expect(onValueChange).toHaveBeenCalledWith("Grace");
      expect(screen.getByRole("button")).toHaveAccessibleName("Name Ada");
    });

    it("works wired to its own state, for value and editing together", async () => {
      const user = userEvent.setup();
      function Wired() {
        const [value, setValue] = useState("Ada");
        const [editing, setEditing] = useState(false);
        return (
          <EditableText
            aria-label="Name"
            value={value}
            onValueChange={setValue}
            editing={editing}
            onEditingChange={setEditing}
          />
        );
      }
      render(<Wired />);
      await user.click(trigger());
      expect(field()).toBeInTheDocument();
      await user.keyboard("{Control>}a{/Control}Grace{Enter}");
      expect(screen.getByRole("button")).toHaveAccessibleName("Name Grace");
      await user.click(screen.getByRole("button"));
      await user.keyboard("{Escape}");
      expect(screen.getByRole("button")).toHaveAccessibleName("Name Grace");
    });

    it("asks to stop editing rather than stopping when editing is controlled", async () => {
      const user = userEvent.setup();
      const onEditingChange = vi.fn();
      render(<EditableText aria-label="Name" defaultValue="Ada" editing onEditingChange={onEditingChange} />);
      await user.click(field());
      await user.keyboard("{Escape}");
      expect(onEditingChange).toHaveBeenCalledWith(false);
      expect(field()).toBeInTheDocument();
    });

    it("opens, focused, when editing is set from outside", async () => {
      const { rerender } = render(<EditableText aria-label="Name" defaultValue="Ada" editing={false} />);
      rerender(<EditableText aria-label="Name" defaultValue="Ada" editing />);
      await waitFor(() => expect(field()).toHaveFocus());
    });

    it("does not move focus on mount when it starts editing", () => {
      render(<EditableText aria-label="Name" defaultValue="Ada" defaultEditing />);
      expect(field()).toBeInTheDocument();
      expect(field()).not.toHaveFocus();
    });
  });

  describe("props and wiring", () => {
    it("forwards ref to the outer box and puts className and style there", () => {
      const ref = createRef<HTMLDivElement>();
      render(<EditableText ref={ref} aria-label="Name" className="mine" style={{ margin: 3 }} data-testid="t" />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveClass("mine");
      expect(ref.current).toHaveStyle({ margin: "3px" });
      expect(screen.getByTestId("t").tagName).toBe("BUTTON");
    });

    it("puts id and data-testid on the field while editing, with the same id", async () => {
      const user = userEvent.setup();
      render(<EditableText aria-label="Name" id="x" data-testid="t" defaultValue="Ada" />);
      expect(screen.getByTestId("t")).toHaveAttribute("id", "x");
      await user.click(screen.getByTestId("t"));
      expect(screen.getByTestId("t").tagName).toBe("INPUT");
      expect(screen.getByTestId("t")).toHaveAttribute("id", "x");
    });

    it("lets a label start editing and be the field's name inside a FormField", async () => {
      const user = userEvent.setup();
      render(
        <FormField label="Project name">
          {(fieldProps) => <EditableText {...fieldProps} defaultValue="Apollo" />}
        </FormField>,
      );
      expect(screen.getByRole("button")).toHaveAccessibleName("Project name Apollo");
      await user.click(screen.getByText("Project name"));
      expect(field()).toHaveFocus();
      expect(field()).toHaveAccessibleName("Project name");
    });

    it("joins a described-by of its own with the component's", async () => {
      const user = userEvent.setup();
      render(
        <>
          <p id="help">Shown on the card</p>
          <EditableText aria-label="Name" aria-describedby="help" defaultValue="Ada" />
        </>,
      );
      expect(screen.getByRole("button")).toHaveAccessibleDescription("Shown on the card Edit");
      await user.click(screen.getByRole("button"));
      expect(field()).toHaveAccessibleDescription("Shown on the card");
    });

    it("keeps the default of a label whose override is undefined, and uses one that is set", async () => {
      const user = userEvent.setup();
      render(
        <EditableText
          aria-label="Name"
          defaultValue="Ada"
          showControls
          labels={{ confirm: undefined, cancel: "Discard" }}
        />,
      );
      await user.click(trigger());
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Discard" })).toBeInTheDocument();
    });

    it("lets a consumer's role or aria-hidden through to nothing it computes", () => {
      render(<EditableText aria-label="Name" defaultValue="Ada" {...({ role: "presentation" } as object)} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("warns once in development when it has no accessible name", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<EditableText defaultValue="Ada" />);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("no accessible name"));
      warn.mockRestore();
    });

    it("renders on the server without touching the document", () => {
      expect(() => renderToString(<EditableText aria-label="Name" defaultValue="Ada" />)).not.toThrow();
    });

    it("survives StrictMode: opens, focuses and closes as usual", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <StrictMode>
          <EditableText aria-label="Name" defaultValue="Ada" onValueChange={onValueChange} />
        </StrictMode>,
      );
      await user.click(trigger());
      expect(field()).toHaveFocus();
      await user.keyboard("!{Enter}");
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("button")).toHaveFocus();
    });
  });

  describe("accessibility", () => {
    it("has no axe violations in display, edit, multiline, error and read-only states", async () => {
      const user = userEvent.setup();
      const { container, rerender } = render(<EditableText aria-label="Name" defaultValue="Ada" showControls />);
      expect(await axe(container)).toHaveNoViolations();
      await user.click(trigger());
      expect(await axe(container)).toHaveNoViolations();
      await user.keyboard("{Control>}a{/Control}{Backspace}");
      rerender(<EditableText aria-label="Name" defaultValue="Ada" showControls required />);
      await user.keyboard("{Enter}");
      expect(await axe(container)).toHaveNoViolations();
      rerender(<EditableText aria-label="Notes" multiline defaultEditing defaultValue="One" />);
      expect(await axe(container)).toHaveNoViolations();
      rerender(<EditableText aria-label="Name" defaultValue="Ada" readOnly />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
