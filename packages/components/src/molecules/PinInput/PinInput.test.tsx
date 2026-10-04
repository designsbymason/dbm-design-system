import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { StrictMode, createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PinInput } from "./PinInput";

const field = () => screen.getByLabelText("Code") as HTMLInputElement;
const cells = (container: HTMLElement) => Array.from(container.querySelectorAll<HTMLElement>("[data-cell]"));
const texts = (container: HTMLElement) => cells(container).map((cell) => cell.textContent);

// A Tab selects all of an input's text after the focus event, so the field puts the selection right a frame later.
async function tabIn(user: ReturnType<typeof userEvent.setup>, start: number) {
  await user.tab();
  await waitFor(() => expect(field().selectionStart).toBe(start));
}

describe("PinInput", () => {
  it("is one native text input with the autofill hint and a numeric keyboard", () => {
    render(<PinInput aria-label="Code" />);
    expect(field()).toHaveAttribute("autocomplete", "one-time-code");
    expect(field()).toHaveAttribute("inputmode", "numeric");
    expect(field()).toHaveAttribute("type", "text");
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
  });

  it("draws one cell per character and hides them from assistive technology", () => {
    const { container } = render(<PinInput aria-label="Code" length={4} />);
    expect(cells(container)).toHaveLength(4);
    expect(container.querySelector("[aria-hidden='true']")).toContainElement(cells(container)[0] as HTMLElement);
  });

  it("falls back to six cells for an invalid length, warning in development", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { container } = render(<PinInput aria-label="Code" length={0} />);
    expect(cells(container)).toHaveLength(6);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`length` must be a whole number"));
    warn.mockRestore();
  });

  it("fills the cells as you type, and calls onValueChange with the whole code", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<PinInput aria-label="Code" length={4} onValueChange={onValueChange} />);
    await user.type(field(), "12");
    expect(texts(container)).toEqual(["1", "2", "", ""]);
    expect(onValueChange).toHaveBeenLastCalledWith("12");
  });

  it("drops characters the type does not accept", async () => {
    const user = userEvent.setup();
    render(<PinInput aria-label="Code" length={4} />);
    await user.type(field(), "1a2-3");
    expect(field()).toHaveValue("123");
  });

  it("ignores a rejected key without moving to the next cell or losing the character it would replace", async () => {
    const user = userEvent.setup();
    const { container } = render(<PinInput aria-label="Code" length={4} defaultValue="12" />);
    const active = () => cells(container).findIndex((cell) => cell.dataset.active === "true");
    await tabIn(user, 2);
    await user.keyboard("a");
    expect(field()).toHaveValue("12");
    expect(active()).toBe(2);
    await user.keyboard("{Home}");
    await user.keyboard("a");
    expect(field()).toHaveValue("12");
    expect(active()).toBe(0);
    await user.paste("xyz");
    expect(field()).toHaveValue("12");
  });

  it("accepts letters and digits for alphanumeric, and letters only for text", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PinInput aria-label="Code" type="alphanumeric" length={6} />);
    await user.type(field(), "a1-b2é");
    expect(field()).toHaveValue("a1b2é");
    rerender(<PinInput aria-label="Code" type="text" length={6} defaultValue="" key="text" />);
    await user.type(field(), "a-b 2é9");
    expect(field()).toHaveValue("abé");
    expect(field()).toHaveAttribute("inputmode", "text");
  });

  describe("transform", () => {
    it("writes typed and pasted text in capitals", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<PinInput aria-label="Code" type="alphanumeric" transform="uppercase" length={4} onValueChange={onValueChange} />);
      await user.type(field(), "ab1");
      expect(field()).toHaveValue("AB1");
      expect(onValueChange).toHaveBeenLastCalledWith("AB1");
      await user.paste("cd9");
      expect(field()).toHaveValue("AB1C");
    });

    it("converts a value passed in, and can write in lower case", () => {
      const { rerender } = render(<PinInput aria-label="Code" type="alphanumeric" transform="uppercase" value="ab" onValueChange={() => undefined} />);
      expect(field()).toHaveValue("AB");
      rerender(<PinInput aria-label="Code" type="alphanumeric" transform="lowercase" value="AB" onValueChange={() => undefined} />);
      expect(field()).toHaveValue("ab");
    });

    it("converts before cutting to length, since a letter can become two", () => {
      render(<PinInput aria-label="Code" type="text" transform="uppercase" length={3} defaultValue="ßß" />);
      expect(field()).toHaveValue("SSS");
    });
  });

  describe("isLoading", () => {
    it("sets the field aside from editing without disabling it or losing the value", async () => {
      const user = userEvent.setup();
      render(<PinInput aria-label="Code" length={4} defaultValue="12" isLoading />);
      expect(field()).toHaveAttribute("aria-busy", "true");
      expect(field()).toHaveAttribute("readonly");
      expect(field()).not.toBeDisabled();
      await user.click(field());
      await user.keyboard("9{Backspace}");
      expect(field()).toHaveValue("12");
      expect(field()).toHaveFocus();
    });

    it("shows a spinner and announces the state, in a region that was already there", () => {
      const { container, rerender } = render(<PinInput aria-label="Code" />);
      const status = screen.getByRole("status");
      expect(status).toHaveTextContent("");
      expect(container.querySelector("[class*='spinner']")).toBeNull();
      rerender(<PinInput aria-label="Code" isLoading />);
      expect(screen.getByRole("status")).toBe(status);
      expect(status).toHaveTextContent("Verifying code");
      expect(container.querySelector("[class*='spinner']")).not.toBeNull();
      rerender(<PinInput aria-label="Code" />);
      expect(status).toHaveTextContent("");
    });

    it("translates the announcement, keeping the default when it is undefined", () => {
      const { rerender } = render(<PinInput aria-label="Code" isLoading labels={{ loading: "Vérification" }} />);
      expect(screen.getByRole("status")).toHaveTextContent("Vérification");
      rerender(<PinInput aria-label="Code" isLoading labels={{ loading: undefined }} />);
      expect(screen.getByRole("status")).toHaveTextContent("Verifying code");
    });

    it("can be edited again once loading ends", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<PinInput aria-label="Code" isLoading />);
      rerender(<PinInput aria-label="Code" />);
      await user.type(field(), "12");
      expect(field()).toHaveValue("12");
    });
  });

  describe("the shake when an error appears", () => {
    const shaking = (container: HTMLElement) => container.querySelector("[class*='shake']") !== null;

    it("happens when hasError turns on after mount", () => {
      const { container, rerender } = render(<PinInput aria-label="Code" />);
      expect(shaking(container)).toBe(false);
      rerender(<PinInput aria-label="Code" hasError />);
      expect(shaking(container)).toBe(true);
    });

    it("does not happen for a field that starts invalid", () => {
      const { container } = render(<PinInput aria-label="Code" hasError />);
      expect(shaking(container)).toBe(false);
    });

    it("happens again for a second error, and stops when the error clears", () => {
      const { container, rerender } = render(<PinInput aria-label="Code" />);
      rerender(<PinInput aria-label="Code" hasError />);
      rerender(<PinInput aria-label="Code" />);
      rerender(<PinInput aria-label="Code" hasError />);
      expect(shaking(container)).toBe(true);
      rerender(<PinInput aria-label="Code" />);
      expect(shaking(container)).toBe(false);
    });
  });

  it("cleans a pasted code to the accepted characters and the length", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<PinInput aria-label="Code" onComplete={onComplete} />);
    await user.click(field());
    await user.paste("123-4567 89");
    expect(field()).toHaveValue("123456");
    expect(onComplete).toHaveBeenCalledWith("123456");
  });

  it("calls onComplete when the last cell fills, and not for a value passed in", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<PinInput aria-label="Code" length={3} defaultValue="123" onComplete={onComplete} />);
    expect(onComplete).not.toHaveBeenCalled();
    await tabIn(user, 2);
    await user.keyboard("{Backspace}");
    expect(onComplete).not.toHaveBeenCalled();
    await user.keyboard("9");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("129");
  });

  it("overwrites the last cell when the code is full, and reports the new code", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<PinInput aria-label="Code" length={3} onComplete={onComplete} />);
    await user.type(field(), "123");
    await user.keyboard("9");
    expect(field()).toHaveValue("129");
    expect(onComplete).toHaveBeenLastCalledWith("129");
    await user.keyboard("{Backspace}");
    expect(field()).toHaveValue("12");
  });

  it("treats characters added to the end of a full code as replacing the last one, even before the selection has caught up", () => {
    const onValueChange = vi.fn();
    render(<PinInput aria-label="Code" length={3} defaultValue="123" onValueChange={onValueChange} />);
    field().setSelectionRange(3, 3);
    field().dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, data: "7", inputType: "insertText" }));
    fireEvent.change(field(), { target: { value: "1237" } });
    expect(field()).toHaveValue("127");
    expect(onValueChange).toHaveBeenLastCalledWith("127");
  });

  it("does not call onComplete again while a full code stays the same", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<PinInput aria-label="Code" length={3} defaultValue="123" onComplete={onComplete} />);
    await tabIn(user, 2);
    await user.keyboard("3");
    expect(onComplete).not.toHaveBeenCalled();
    expect(field()).toHaveValue("123");
  });

  it("reports nothing when a paste is cut back to the code it already holds", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onComplete = vi.fn();
    render(<PinInput aria-label="Code" length={3} defaultValue="123" onValueChange={onValueChange} onComplete={onComplete} />);
    await tabIn(user, 2);
    await user.keyboard("{Control>}a{/Control}");
    await user.paste("123999");
    expect(field()).toHaveValue("123");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("cuts a controlled value back to the accepted characters and length", () => {
    const { container } = render(<PinInput aria-label="Code" length={3} value="9x87654" onValueChange={() => undefined} />);
    expect(field()).toHaveValue("987");
    expect(texts(container)).toEqual(["9", "8", "7"]);
  });

  it("follows a controlled value, and is frozen without a handler that updates it", async () => {
    const user = userEvent.setup();
    render(<PinInput aria-label="Code" length={4} value="12" onValueChange={() => undefined} />);
    await user.type(field(), "3");
    expect(field()).toHaveValue("12");
  });

  it("works controlled with state", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [code, setCode] = useState("");
      return (
        <>
          <PinInput aria-label="Code" length={4} value={code} onValueChange={setCode} />
          <button type="button" onClick={() => setCode("")}>
            reset
          </button>
          <p data-testid="code">{code}</p>
        </>
      );
    }
    render(<Controlled />);
    await user.type(field(), "1234");
    expect(screen.getByTestId("code")).toHaveTextContent("1234");
    await user.click(screen.getByRole("button", { name: "reset" }));
    expect(field()).toHaveValue("");
  });

  it("overwrites the character in the cell you are on, rather than inserting", async () => {
    const user = userEvent.setup();
    render(<PinInput aria-label="Code" length={4} defaultValue="1234" />);
    await tabIn(user, 3);
    await user.keyboard("{Home}");
    await user.keyboard("9");
    expect(field()).toHaveValue("9234");
    // And the next cell is the one now selected.
    await user.keyboard("8");
    expect(field()).toHaveValue("9834");
  });

  it("moves between cells with the arrow keys, Home and End", async () => {
    const user = userEvent.setup();
    const { container } = render(<PinInput aria-label="Code" length={4} defaultValue="12" />);
    const active = () => cells(container).findIndex((cell) => cell.dataset.active === "true");
    await tabIn(user, 2);
    expect(active()).toBe(2);
    await user.keyboard("{ArrowLeft}");
    expect(active()).toBe(1);
    await user.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}");
    expect(active()).toBe(0);
    await user.keyboard("{ArrowRight}");
    expect(active()).toBe(1);
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    // Not past the first empty cell.
    expect(active()).toBe(2);
    await user.keyboard("{Home}");
    expect(active()).toBe(0);
    await user.keyboard("{End}");
    expect(active()).toBe(2);
  });

  it("deletes backwards with Backspace from the first empty cell", async () => {
    const user = userEvent.setup();
    render(<PinInput aria-label="Code" length={4} defaultValue="12" />);
    await tabIn(user, 2);
    await user.keyboard("{Backspace}");
    expect(field()).toHaveValue("1");
  });

  it("marks only the focused field's active cell, with a caret in an empty one", async () => {
    const user = userEvent.setup();
    const { container } = render(<PinInput aria-label="Code" length={3} />);
    expect(container.querySelector("[data-active='true']")).toBeNull();
    await user.click(field());
    expect(cells(container)[0]).toHaveAttribute("data-active", "true");
    expect(cells(container)[0]?.querySelector("span")).not.toBeNull();
    await user.tab();
    expect(container.querySelector("[data-active='true']")).toBeNull();
  });

  it("keeps the last cell active when the code is full", async () => {
    const user = userEvent.setup();
    const { container } = render(<PinInput aria-label="Code" length={3} />);
    await user.type(field(), "123");
    expect(cells(container)[2]).toHaveAttribute("data-active", "true");
  });

  it("moves to the cell that is pressed", async () => {
    const user = userEvent.setup();
    const { container } = render(<PinInput aria-label="Code" length={4} defaultValue="123" />);
    const boxes = cells(container);
    boxes.forEach((cell, index) => {
      cell.getBoundingClientRect = () => ({ left: index * 50, width: 40, right: index * 50 + 40, top: 0, bottom: 40, height: 40, x: index * 50, y: 0, toJSON: () => ({}) });
    });
    await user.pointer({ keys: "[MouseLeft]", target: field(), coords: { clientX: 62 } });
    expect(boxes[1]).toHaveAttribute("data-active", "true");
    await user.pointer({ keys: "[MouseLeft]", target: field(), coords: { clientX: 400 } });
    expect(boxes[3]).toHaveAttribute("data-active", "true");
  });

  it("splits cells into groups with a separator that is not read out", () => {
    const { container } = render(<PinInput aria-label="Code" groups={[3, 3]} />);
    const separators = container.querySelectorAll("span[class*='separator']");
    expect(separators).toHaveLength(1);
    expect(separators[0]).toHaveTextContent("–");
    expect(container.querySelectorAll("div[class*='group']")).toHaveLength(2);
  });

  it("shows a custom separator, and puts left-over cells in a last group", () => {
    const { container } = render(<PinInput aria-label="Code" length={5} groups={[2]} separator="/" />);
    expect(container.querySelectorAll("div[class*='group']")).toHaveLength(2);
    expect(container.querySelector("span[class*='separator']")).toHaveTextContent("/");
    expect(cells(container)).toHaveLength(5);
  });

  it("warns in development when the groups do not add up to the length", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<PinInput aria-label="Code" length={6} groups={[2, 2]} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("`groups` adds up to 4"));
    warn.mockRestore();
  });

  it("draws one placeholder character per empty cell, or one repeated", () => {
    const { container, rerender } = render(<PinInput aria-label="Code" length={3} placeholder="○" defaultValue="1" />);
    expect(texts(container)).toEqual(["1", "○", "○"]);
    rerender(<PinInput aria-label="Code" length={3} placeholder="abc" defaultValue="1" />);
    expect(texts(container)).toEqual(["1", "b", "c"]);
  });

  describe("mask", () => {
    it("draws dots and makes the input a password field, without losing the value", () => {
      const { container } = render(<PinInput aria-label="Code" length={3} mask defaultValue="12" />);
      expect(texts(container)).toEqual(["•", "•", ""]);
      expect(field()).toHaveAttribute("type", "password");
      expect(field()).toHaveValue("12");
    });

    it("has no show button unless it is revealable", () => {
      render(<PinInput aria-label="Code" mask />);
      expect(screen.queryByRole("button")).toBeNull();
    });

    it("shows and hides the code with the button, and reports it", async () => {
      const user = userEvent.setup();
      const onRevealedChange = vi.fn();
      const { container } = render(<PinInput aria-label="Code" length={3} mask revealable defaultValue="12" onRevealedChange={onRevealedChange} />);
      const button = screen.getByRole("button", { name: "Show code" });
      expect(button).toHaveAttribute("aria-pressed", "false");
      await user.click(button);
      expect(texts(container)).toEqual(["1", "2", ""]);
      expect(field()).toHaveAttribute("type", "text");
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(onRevealedChange).toHaveBeenLastCalledWith(true);
      await user.click(button);
      expect(texts(container)).toEqual(["•", "•", ""]);
    });

    it("can be controlled, and starts showing with defaultRevealed", () => {
      const { rerender } = render(<PinInput aria-label="Code" mask revealable defaultRevealed defaultValue="1" />);
      expect(field()).toHaveAttribute("type", "text");
      rerender(<PinInput aria-label="Code" mask revealable revealed={false} defaultValue="1" />);
      expect(field()).toHaveAttribute("type", "password");
    });

    it("ignores revealable without mask", () => {
      render(<PinInput aria-label="Code" revealable />);
      expect(screen.queryByRole("button")).toBeNull();
    });

    it("translates the button's name, keeping the default when a label is undefined", () => {
      const { rerender } = render(<PinInput aria-label="Code" mask revealable labels={{ reveal: "Afficher" }} />);
      expect(screen.getByRole("button", { name: "Afficher" })).toBeInTheDocument();
      rerender(<PinInput aria-label="Code" mask revealable labels={{ reveal: undefined }} />);
      expect(screen.getByRole("button", { name: "Show code" })).toBeInTheDocument();
    });
  });

  describe("states", () => {
    it("sets aria-invalid for hasError", () => {
      render(<PinInput aria-label="Code" hasError />);
      expect(field()).toHaveAttribute("aria-invalid", "true");
    });

    it("disables the field and the show button", () => {
      render(<PinInput aria-label="Code" disabled mask revealable />);
      expect(field()).toBeDisabled();
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("shows no active cell and no caret when disabled", () => {
      const { container } = render(<PinInput aria-label="Code" disabled defaultValue="12" />);
      expect(container.querySelector("[data-active='true']")).toBeNull();
    });

    it("drops the active cell and caret when it becomes disabled while focused", async () => {
      const user = userEvent.setup();
      const { container, rerender } = render(<PinInput aria-label="Code" />);
      await user.click(field());
      expect(container.querySelector("[data-active='true']")).not.toBeNull();
      rerender(<PinInput aria-label="Code" disabled />);
      expect(container.querySelector("[data-active='true']")).toBeNull();
      expect(container.querySelector("span[class*='caret']")).toBeNull();
    });

    it("does not edit when read-only, but can be focused", async () => {
      const user = userEvent.setup();
      render(<PinInput aria-label="Code" readOnly defaultValue="12" />);
      await user.click(field());
      await user.keyboard("9{Backspace}");
      expect(field()).toHaveValue("12");
      expect(field()).toHaveFocus();
    });

    it("passes required and a minimum length to the form", () => {
      render(<PinInput aria-label="Code" required length={4} />);
      expect(field()).toBeRequired();
      expect(field()).toHaveAttribute("minlength", "4");
    });
  });

  describe("forms", () => {
    it("submits the code under its name, as one string", () => {
      const onSubmit = vi.fn((event: { preventDefault: () => void; currentTarget: HTMLFormElement }) => {
        event.preventDefault();
        return new FormData(event.currentTarget).get("otp");
      });
      render(
        <form onSubmit={onSubmit}>
          <PinInput aria-label="Code" name="otp" defaultValue="123456" />
          <button type="submit">go</button>
        </form>,
      );
      expect(new FormData(screen.getByRole("button").closest("form") as HTMLFormElement).get("otp")).toBe("123456");
    });

    it("is named by a label that points at its id", () => {
      render(
        <>
          <label htmlFor="otp">One-time code</label>
          <PinInput id="otp" />
        </>,
      );
      expect(screen.getByLabelText("One-time code")).toBe(document.getElementById("otp"));
    });
  });

  describe("props and refs", () => {
    it("puts the ref, id, data-testid and aria props on the input, and className and style on the outer box", () => {
      const ref = createRef<HTMLInputElement>();
      const { container } = render(
        <PinInput ref={ref} id="x" data-testid="t" aria-label="Code" aria-describedby="help" className="mine" style={{ margin: "7px" }} />,
      );
      expect(ref.current).toBe(field());
      expect(field()).toHaveAttribute("id", "x");
      expect(field()).toHaveAttribute("data-testid", "t");
      expect(field()).toHaveAttribute("aria-describedby", "help");
      expect(container.firstElementChild).toHaveClass("mine");
      expect(container.firstElementChild).toHaveStyle({ margin: "7px" });
    });

    it("lets a consumer's props reach the input but not override what it computes", () => {
      // @ts-expect-error `type` and `minLength` are not props
      render(<PinInput aria-label="Code" type2="x" minLength={1} inputMode="tel" length={5} />);
      expect(field()).toHaveAttribute("minlength", "5");
      expect(field()).toHaveAttribute("inputmode", "numeric");
    });

    it("calls the consumer's focus, blur and key handlers", async () => {
      const user = userEvent.setup();
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      const onKeyDown = vi.fn();
      render(<PinInput aria-label="Code" onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown} />);
      await user.click(field());
      await user.keyboard("1");
      await user.tab();
      expect(onFocus).toHaveBeenCalledTimes(1);
      expect(onKeyDown).toHaveBeenCalled();
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it("lets a handler stop the arrow keys moving between cells", async () => {
      const user = userEvent.setup();
      const { container } = render(<PinInput aria-label="Code" length={4} defaultValue="12" onKeyDown={(event) => event.preventDefault()} />);
      await tabIn(user, 2);
      await user.keyboard("{ArrowLeft}");
      expect(cells(container)[2]).toHaveAttribute("data-active", "true");
    });
  });

  it("is always left to right", () => {
    const { container } = render(
      <div dir="rtl">
        <PinInput aria-label="Code" />
      </div>,
    );
    expect(container.querySelector("[dir='ltr']")).not.toBeNull();
  });

  it("reads a value that is not a string as empty, without throwing", () => {
    const { container } = render(<PinInput aria-label="Code" length={3} value={null as unknown as string} onValueChange={() => undefined} />);
    expect(texts(container)).toEqual(["", "", ""]);
  });

  it("takes focus on mount with autoFocus, on the first empty cell", async () => {
    const focusProps = { autoFocus: true };
    const { container } = render(<PinInput aria-label="Code" length={4} defaultValue="12" {...focusProps} />);
    expect(field()).toHaveFocus();
    await waitFor(() => expect(cells(container)[2]).toHaveAttribute("data-active", "true"));
  });

  it("works inside StrictMode", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <StrictMode>
        <PinInput aria-label="Code" length={2} onComplete={onComplete} />
      </StrictMode>,
    );
    await user.type(field(), "12");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  describe("accessibility", () => {
    it("has no axe violations", async () => {
      const { container } = render(<PinInput aria-label="Code" defaultValue="12" />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations masked and revealable, with an error", async () => {
      const { container } = render(<PinInput aria-label="Code" mask revealable hasError groups={[3, 3]} defaultValue="123" />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations while loading", async () => {
      const { container } = render(<PinInput aria-label="Code" isLoading defaultValue="123456" />);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("has no axe violations when disabled", async () => {
      const { container } = render(<PinInput aria-label="Code" disabled />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
