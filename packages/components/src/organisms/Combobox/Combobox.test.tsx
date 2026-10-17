import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { StrictMode, createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PlusIcon } from "@dbm-design-system/icons";
import { Combobox } from "./Combobox";
import type { ComboboxOption, ComboboxProps } from "./Combobox.types";

const countries: ComboboxOption[] = [
  { value: "ca", label: "Canada" },
  { value: "cu", label: "Curaçao" },
  { value: "mx", label: "Mexico", disabled: "Not shipping there yet" },
  { value: "us", label: "United States" },
  { value: "uy", label: "Uruguay" },
];

// A page-level run sees the list portaled outside any landmark, which says nothing about the component.
const noLandmarks = { rules: { region: { enabled: false } } };
const field = () => screen.getByRole("combobox") as HTMLInputElement;
const list = () => screen.queryByRole("listbox");
const labelsOf = () => screen.getAllByRole("option").map((option) => option.textContent?.replace(/, .*/, ""));
const hidden = () => document.querySelector<HTMLInputElement>('input[aria-hidden="true"]');

function setup(props: Partial<ComboboxProps> = {}) {
  return render(<Combobox aria-label="Country" options={countries} {...props} />);
}

describe("Combobox", () => {
  describe("structure and naming", () => {
    it("is a named combobox that points at a listbox only while open", async () => {
      const user = userEvent.setup();
      setup();
      expect(field()).toHaveAccessibleName("Country");
      expect(field()).toHaveAttribute("aria-expanded", "false");
      expect(field()).toHaveAttribute("aria-autocomplete", "list");
      expect(field()).not.toHaveAttribute("aria-controls");
      expect(list()).toBeNull();
      await user.click(field());
      expect(field()).toHaveAttribute("aria-expanded", "true");
      expect(field()).toHaveAttribute("aria-controls", list()?.id);
      expect(list()).toHaveAccessibleName("Country");
    });

    it("names the list from a visible label when there is no aria-label", async () => {
      const user = userEvent.setup();
      render(
        <>
          <label htmlFor="c">Home country</label>
          <Combobox id="c" options={countries} />
        </>,
      );
      expect(field()).toHaveAccessibleName("Home country");
      await user.click(field());
      expect(list()).toHaveAccessibleName("Home country");
    });

    it("takes id, data-testid and ref on the input, and className and style on the outer box", () => {
      const ref = createRef<HTMLInputElement>();
      render(
        <Combobox
          aria-label="Country"
          options={countries}
          id="mine"
          data-testid="cb"
          ref={ref}
          className="outer"
          style={{ margin: "3px" }}
        />,
      );
      expect(ref.current).toBe(field());
      expect(field()).toHaveAttribute("id", "mine");
      expect(field()).toHaveAttribute("data-testid", "cb");
      const box = field().closest(".outer") as HTMLElement;
      expect(box).not.toBeNull();
      expect(box.style.margin).toBe("3px");
    });

    it("lets its own aria attributes win over a same-named prop", async () => {
      const user = userEvent.setup();
      setup({ "aria-expanded": true, "aria-autocomplete": "both", "aria-activedescendant": "nope" });
      expect(field()).toHaveAttribute("aria-expanded", "false");
      expect(field()).toHaveAttribute("aria-autocomplete", "list");
      await user.click(field());
      expect(field().getAttribute("aria-activedescendant")).not.toBe("nope");
    });

    it("keeps a default label when an override is undefined", async () => {
      const user = userEvent.setup();
      setup({ clearable: true, defaultValue: "ca", labels: { clear: undefined, toggle: undefined } });
      expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Toggle options" })).toBeInTheDocument();
      await user.type(field(), "zz");
      await user.click(field());
      expect(screen.getByRole("option", { name: "No results" })).toBeInTheDocument();
    });
  });

  describe("opening and choosing with the pointer", () => {
    it("opens on a press of the field, lists every option, and chooses on a click", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ onValueChange });
      await user.click(field());
      expect(labelsOf()).toEqual(["Canada", "Curaçao", "Mexico", "United States", "Uruguay"]);
      await user.click(screen.getByRole("option", { name: "United States" }));
      expect(onValueChange).toHaveBeenCalledWith("us", countries[3]);
      expect(field()).toHaveValue("United States");
      expect(list()).toBeNull();
      expect(field()).toHaveFocus();
    });

    it("opens from the toggle button, closes from it, and keeps focus in the field", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(screen.getByRole("button", { name: "Toggle options" }));
      expect(list()).not.toBeNull();
      expect(field()).toHaveFocus();
      await user.click(screen.getByRole("button", { name: "Toggle options" }));
      expect(list()).toBeNull();
    });

    it("does not choose a disabled option, and gives its reason to assistive technology", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ onValueChange });
      await user.click(field());
      const mexico = screen.getByRole("option", { name: /Mexico/ });
      expect(mexico).toHaveAttribute("aria-disabled", "true");
      expect(mexico).toHaveAccessibleName(/Mexico.*Not shipping there yet/);
      await user.click(mexico);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(list()).not.toBeNull();
    });

    it("marks the chosen option selected, and shows every option again rather than filtering by its label", async () => {
      const user = userEvent.setup();
      setup({ defaultValue: "us" });
      expect(field()).toHaveValue("United States");
      await user.click(field());
      expect(screen.getAllByRole("option")).toHaveLength(5);
      expect(screen.getByRole("option", { name: "United States" })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("option", { name: "Canada" })).toHaveAttribute("aria-selected", "false");
    });

    it("opens on focus only when asked to", async () => {
      const user = userEvent.setup();
      const { unmount } = setup();
      await user.tab();
      expect(list()).toBeNull();
      unmount();
      setup({ openOnFocus: true });
      await user.tab();
      expect(list()).not.toBeNull();
    });
  });

  describe("typing and filtering", () => {
    it("narrows the list as the person types, ignoring case and accents", async () => {
      const user = userEvent.setup();
      setup();
      await user.type(field(), "CURA");
      expect(labelsOf()).toEqual(["Curaçao"]);
      await user.clear(field());
      await user.type(field(), "u");
      expect(labelsOf()).toEqual(["Curaçao", "United States", "Uruguay"]);
    });

    it("marks the typed text in each label", async () => {
      const user = userEvent.setup();
      setup();
      await user.type(field(), "ura");
      const marks = screen.getAllByRole("option").flatMap((option) => [...option.querySelectorAll("mark")]);
      expect(marks.map((mark) => mark.textContent)).toEqual(["ura"]);
    });

    it("highlights the first match so Enter chooses it", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ onValueChange });
      await user.type(field(), "un");
      expect(field()).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "United States" }).id);
      await user.keyboard("{Enter}");
      expect(onValueChange).toHaveBeenCalledWith("us", countries[3]);
      expect(field()).toHaveValue("United States");
    });

    it("takes a whole string inserted at once", async () => {
      setup();
      fireEvent.change(field(), { target: { value: "uru" } });
      expect(field()).toHaveValue("uru");
      expect(labelsOf()).toEqual(["Uruguay"]);
    });

    it("uses a function filter, and shows the options as given with filter={false}", async () => {
      const user = userEvent.setup();
      const { rerender } = setup({ filter: (option, text) => option.value === text });
      await user.type(field(), "ca");
      expect(labelsOf()).toEqual(["Canada"]);
      rerender(<Combobox aria-label="Country" options={countries} filter={false} />);
      expect(labelsOf()).toHaveLength(5);
    });

    it("reports why the text changed", async () => {
      const user = userEvent.setup();
      const onInputValueChange = vi.fn();
      setup({ onInputValueChange, clearable: true });
      await user.type(field(), "ca");
      expect(onInputValueChange).toHaveBeenLastCalledWith("ca", "input");
      await user.keyboard("{Enter}");
      expect(onInputValueChange).toHaveBeenLastCalledWith("Canada", "select");
      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(onInputValueChange).toHaveBeenLastCalledWith("", "clear");
      await user.type(field(), "zzz");
      await user.tab();
      expect(onInputValueChange).toHaveBeenLastCalledWith("", "reset");
    });
  });

  describe("keyboard", () => {
    it("opens with the arrow keys, moves through the options skipping disabled ones, and wraps", async () => {
      const user = userEvent.setup();
      setup();
      await user.tab();
      await user.keyboard("{ArrowDown}");
      const active = () => document.getElementById(field().getAttribute("aria-activedescendant") ?? "")?.textContent;
      expect(list()).not.toBeNull();
      expect(active()).toBe("Canada");
      await user.keyboard("{ArrowDown}");
      expect(active()).toBe("Curaçao");
      await user.keyboard("{ArrowDown}");
      expect(active()).toBe("United States");
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(active()).toBe("Canada");
      await user.keyboard("{ArrowUp}");
      expect(active()).toBe("Uruguay");
    });

    it("opens on the last option with ArrowUp, and on the chosen one when there is one", async () => {
      const user = userEvent.setup();
      const { unmount } = setup();
      await user.tab();
      await user.keyboard("{ArrowUp}");
      expect(document.getElementById(field().getAttribute("aria-activedescendant") ?? "")).toHaveTextContent("Uruguay");
      unmount();
      setup({ defaultValue: "us" });
      await user.tab();
      await user.keyboard("{ArrowDown}");
      expect(document.getElementById(field().getAttribute("aria-activedescendant") ?? "")).toHaveTextContent("United States");
    });

    it("opens and closes without moving with Alt+ArrowDown and Alt+ArrowUp", async () => {
      const user = userEvent.setup();
      setup();
      await user.tab();
      await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
      expect(list()).not.toBeNull();
      expect(field()).not.toHaveAttribute("aria-activedescendant");
      await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
      expect(list()).toBeNull();
    });

    it("chooses the highlighted option with Enter and keeps a form from submitting while the list is open", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <Combobox aria-label="Country" options={countries} />
          <button type="submit">Send</button>
        </form>,
      );
      await user.tab();
      await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
      expect(field()).toHaveValue("Curaçao");
      expect(onSubmit).not.toHaveBeenCalled();
      await user.keyboard("{Enter}");
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it("closes on Escape and puts back the last choice", async () => {
      const user = userEvent.setup();
      setup({ defaultValue: "ca" });
      await user.click(field());
      await user.type(field(), "xyz");
      await user.keyboard("{Escape}");
      expect(list()).toBeNull();
      expect(field()).toHaveValue("Canada");
    });

    it("moves a page at a time with PageDown and PageUp", async () => {
      const user = userEvent.setup();
      const many = Array.from({ length: 30 }, (_, index) => ({ value: `v${index}`, label: `Item ${index}` }));
      render(<Combobox aria-label="Pick" options={many} />);
      await user.click(field());
      await user.keyboard("{PageDown}");
      expect(document.getElementById(field().getAttribute("aria-activedescendant") ?? "")).toHaveTextContent("Item 9");
      await user.keyboard("{PageUp}");
      expect(document.getElementById(field().getAttribute("aria-activedescendant") ?? "")).toHaveTextContent("Item 0");
    });

    it("leaves a key alone when the caller's own handler prevents it", async () => {
      const user = userEvent.setup();
      setup({ onKeyDown: (event) => event.preventDefault() });
      await user.tab();
      await user.keyboard("{ArrowDown}");
      expect(list()).toBeNull();
    });

    it("does not treat Enter during text composition as a choice", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(field());
      await user.keyboard("{ArrowDown}");
      fireEvent.keyDown(field(), { key: "Enter", isComposing: true });
      expect(field()).toHaveValue("");
    });
  });

  describe("leaving the field", () => {
    it("puts the last choice back when the text matches nothing", async () => {
      const user = userEvent.setup();
      setup({ defaultValue: "ca" });
      await user.clear(field());
      await user.type(field(), "xyz");
      await user.tab();
      expect(field()).toHaveValue("Canada");
      expect(list()).toBeNull();
    });

    it("chooses an option the text names exactly", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ onValueChange, autoHighlight: false });
      await user.type(field(), "uruguay");
      await user.tab();
      expect(onValueChange).toHaveBeenCalledWith("uy", countries[4]);
      expect(field()).toHaveValue("Uruguay");
    });

    it("clears the value when the text is emptied", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ defaultValue: "ca", onValueChange });
      await user.clear(field());
      await user.tab();
      expect(onValueChange).toHaveBeenCalledWith("", undefined);
      expect(field()).toHaveValue("");
    });

    it("takes the typed text as the value with allowCustomValue", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ allowCustomValue: true, onValueChange, name: "place" });
      await user.type(field(), "Atlantis");
      expect(field()).toHaveAttribute("name", "place");
      expect(hidden()).toBeNull();
      await user.tab();
      expect(onValueChange).toHaveBeenCalledWith("Atlantis", undefined);
      expect(field()).toHaveValue("Atlantis");
    });

    it("does not highlight the first match with allowCustomValue, so Enter commits the text", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      setup({ allowCustomValue: true, onValueChange });
      await user.type(field(), "un");
      expect(field()).not.toHaveAttribute("aria-activedescendant");
      await user.keyboard("{Enter}");
      expect(onValueChange).toHaveBeenCalledWith("un", undefined);
    });
  });

  describe("controlled and uncontrolled", () => {
    it("follows a controlled value, and shows its label when the option arrives later", () => {
      const { rerender } = render(<Combobox aria-label="Country" value="us" options={[]} />);
      expect(field()).toHaveValue("");
      rerender(<Combobox aria-label="Country" value="us" options={countries} />);
      expect(field()).toHaveValue("United States");
      rerender(<Combobox aria-label="Country" value="ca" options={countries} />);
      expect(field()).toHaveValue("Canada");
    });

    it("leaves a controlled value alone until the owner changes it", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<Combobox aria-label="Country" value="ca" options={countries} onValueChange={onValueChange} />);
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Uruguay" }));
      expect(onValueChange).toHaveBeenCalledWith("uy", countries[4]);
      expect(field()).toHaveValue("Canada");
    });

    it("works wired to state, with the value and the text both controlled", async () => {
      const user = userEvent.setup();
      function Wired() {
        const [value, setValue] = useState("");
        const [text, setText] = useState("");
        return (
          <>
            <Combobox
              aria-label="Country"
              options={countries}
              value={value}
              onValueChange={setValue}
              inputValue={text}
              onInputValueChange={setText}
            />
            <output data-testid="out">{`${value}|${text}`}</output>
          </>
        );
      }
      render(<Wired />);
      await user.type(field(), "uru");
      expect(screen.getByTestId("out")).toHaveTextContent("|uru");
      await user.keyboard("{Enter}");
      expect(screen.getByTestId("out")).toHaveTextContent("uy|Uruguay");
    });

    it("follows a controlled open state, and reports requests to change it", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      const { rerender } = render(<Combobox aria-label="Country" options={countries} open={false} onOpenChange={onOpenChange} />);
      await user.click(field());
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(list()).toBeNull();
      rerender(<Combobox aria-label="Country" options={countries} open onOpenChange={onOpenChange} />);
      expect(list()).not.toBeNull();
    });

    it("starts open with defaultOpen", () => {
      setup({ defaultOpen: true });
      expect(list()).not.toBeNull();
    });
  });

  describe("states", () => {
    it("shows 'No results' as a disabled row, or the caller's own content", async () => {
      const user = userEvent.setup();
      const { rerender } = setup();
      await user.type(field(), "zzz");
      const row = screen.getByRole("option", { name: "No results" });
      expect(row).toHaveAttribute("aria-disabled", "true");
      rerender(<Combobox aria-label="Country" options={countries} emptyContent="Nothing like that" />);
      expect(screen.getByRole("option", { name: "Nothing like that" })).toBeInTheDocument();
    });

    it("shows a loading row when there is nothing to show, and a footer when there is", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Combobox aria-label="Country" options={[]} loading />);
      await user.click(field());
      expect(screen.getByRole("option", { name: "Loading…" })).toBeInTheDocument();
      expect(list()).toHaveAttribute("aria-busy", "true");
      rerender(<Combobox aria-label="Country" options={countries} loading />);
      expect(screen.getAllByRole("option")).toHaveLength(5);
      expect(screen.getByText("Loading…")).toBeInTheDocument();
    });

    it("shows and announces an error", async () => {
      const user = userEvent.setup();
      const { rerender } = setup();
      await user.click(field());
      rerender(<Combobox aria-label="Country" options={countries} error />);
      expect(screen.getByText("Something went wrong. Try again.")).toBeInTheDocument();
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Something went wrong. Try again."));
    });

    it("draws options under group headings", async () => {
      const user = userEvent.setup();
      render(
        <Combobox
          aria-label="Place"
          options={[
            { value: "a", label: "Alpha", group: "Letters" },
            { value: "1", label: "One", group: "Numbers" },
            { value: "b", label: "Beta", group: "Letters" },
          ]}
        />,
      );
      await user.click(field());
      const groups = screen.getAllByRole("group");
      expect(groups.map((group) => group.getAttribute("aria-labelledby"))).toHaveLength(2);
      expect(within(groups[0] as HTMLElement).getAllByRole("option").map((option) => option.textContent)).toEqual(["Alpha", "Beta"]);
      expect(groups[0]).toHaveAccessibleName("Letters");
    });

    it("draws descriptions, icons and a custom row", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Combobox aria-label="Plan" options={[{ value: "p", label: "Pro", description: "For teams" }]} />,
      );
      await user.click(field());
      expect(screen.getByRole("option", { name: /Pro/ })).toHaveTextContent("For teams");
      rerender(
        <Combobox
          aria-label="Plan"
          options={[{ value: "p", label: "Pro" }]}
          renderOption={(option, state) => <b>{`${option.label}${state.selected ? " ✓" : ""}`}</b>}
        />,
      );
      expect(screen.getByText("Pro").tagName).toBe("B");
    });

    it("does not open when disabled or read-only, and shows no buttons", async () => {
      const user = userEvent.setup();
      setup({ disabled: true });
      await user.click(field());
      expect(list()).toBeNull();
      expect(field()).toBeDisabled();
      cleanup();
      render(<Combobox aria-label="Country" options={countries} readOnly defaultValue="ca" clearable />);
      await user.click(field());
      await user.keyboard("{ArrowDown}");
      expect(list()).toBeNull();
      expect(screen.queryByRole("button")).toBeNull();
      expect(field()).toHaveValue("Canada");
    });

    it("clears the value and text with the clear button, calls onClear and keeps focus", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      const onValueChange = vi.fn();
      setup({ defaultValue: "ca", clearable: true, onClear, onValueChange });
      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(onValueChange).toHaveBeenCalledWith("", undefined);
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(field()).toHaveValue("");
      expect(field()).toHaveFocus();
      expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
    });

    it("sets aria-invalid with hasError", () => {
      setup({ hasError: true });
      expect(field()).toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("announcements", () => {
    it("announces how many options match as the person types, but not when the list merely opens", async () => {
      const user = userEvent.setup();
      setup();
      await user.click(field());
      await new Promise((resolve) => setTimeout(resolve, 250));
      expect(screen.getByRole("status")).toHaveTextContent("");
      await user.type(field(), "u");
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("3 results available"));
    });

    it("announces 'No results' and writes numbers with formatNumber", async () => {
      const user = userEvent.setup();
      setup({ formatNumber: (value) => `#${value}` });
      await user.type(field(), "u");
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("#3 results available"));
      await user.type(field(), "zz");
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("No results"));
    });
  });

  describe("forms", () => {
    it("submits the chosen value, not its label, through a hidden input", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Combobox aria-label="Country" options={countries} name="country" defaultValue="us" />
        </form>,
      );
      const data = () => new FormData(screen.getByTestId("form") as HTMLFormElement).get("country");
      expect(data()).toBe("us");
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Uruguay" }));
      expect(data()).toBe("uy");
      expect(field()).not.toHaveAttribute("name");
    });

    it("refuses a required field with nothing chosen, and text that isn't a choice", async () => {
      const user = userEvent.setup();
      render(
        <form data-testid="form">
          <Combobox aria-label="Country" options={countries} name="country" required />
        </form>,
      );
      const form = screen.getByTestId("form") as HTMLFormElement;
      expect(form.checkValidity()).toBe(false);
      expect(hidden()?.validity.valueMissing).toBe(true);
      await user.click(field());
      await user.click(screen.getByRole("option", { name: "Canada" }));
      expect(form.checkValidity()).toBe(true);
      await user.type(field(), "x");
      expect(form.checkValidity()).toBe(false);
      expect(hidden()?.validationMessage).toBe("Choose one of the options");
    });

    it("sends focus from the hidden control to the visible field", () => {
      render(
        <form>
          <Combobox aria-label="Country" options={countries} name="country" required />
        </form>,
      );
      act(() => hidden()?.focus());
      expect(field()).toHaveFocus();
    });

    it("leaves the hidden input out of the tab order and the accessibility tree", () => {
      setup({ name: "country" });
      expect(hidden()).toHaveAttribute("tabindex", "-1");
      expect(screen.getAllByRole("combobox")).toHaveLength(1);
    });
  });

  describe("accessibility", () => {
    it("has no axe violations closed, open, with groups, and in each state", async () => {
      const user = userEvent.setup();
      const { container, rerender } = setup({ name: "country", required: true });
      expect(await axe(container)).toHaveNoViolations();
      await user.click(field());
      expect(await axe(document.body, noLandmarks)).toHaveNoViolations();
      rerender(
        <Combobox
          aria-label="Country"
          options={[{ ...countries[0], group: "North" } as ComboboxOption, { ...countries[3], group: "North" } as ComboboxOption]}
          clearable
          loading
          error
        />,
      );
      expect(await axe(document.body, noLandmarks)).toHaveNoViolations();
      rerender(<Combobox aria-label="Country" options={[]} />);
      expect(await axe(document.body, noLandmarks)).toHaveNoViolations();
    });
  });

  describe("robustness", () => {
    it("works under StrictMode", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <StrictMode>
          <Combobox aria-label="Country" options={countries} onValueChange={onValueChange} />
        </StrictMode>,
      );
      await user.type(field(), "uru");
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 results available"));
      await user.keyboard("{Enter}");
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(field()).toHaveValue("Uruguay");
    });

    it("copes with options that change while open, and with a highlighted option that goes away", async () => {
      const user = userEvent.setup();
      const { rerender } = setup({ filter: false });
      await user.click(field());
      await user.keyboard("{ArrowDown}{ArrowDown}");
      rerender(<Combobox aria-label="Country" options={countries.slice(0, 1)} filter={false} />);
      expect(labelsOf()).toEqual(["Canada"]);
      await user.keyboard("{ArrowDown}");
      expect(document.getElementById(field().getAttribute("aria-activedescendant") ?? "")).toHaveTextContent("Canada");
    });

    it("renders with no props at all", () => {
      render(<Combobox />);
      expect(field()).toBeInTheDocument();
    });

    it("copes with a duplicate-looking list and an empty label", async () => {
      const user = userEvent.setup();
      render(<Combobox aria-label="x" options={[{ value: "a", label: "" }, { value: "b", label: "B" }]} />);
      await user.click(field());
      expect(screen.getAllByRole("option")).toHaveLength(2);
    });
  });
  describe("matching several words", () => {
    const places: ComboboxOption[] = [
      { value: "ny", label: "New York" },
      { value: "nj", label: "New Jersey" },
      { value: "yk", label: "York, England" },
    ];

    it("keeps an option when it holds every word, in any order", async () => {
      const user = userEvent.setup();
      render(<Combobox aria-label="Place" options={places} />);
      await user.type(field(), "york new");
      expect(labelsOf()).toEqual(["New York"]);
      await user.clear(field());
      await user.type(field(), "new");
      expect(labelsOf()).toEqual(["New York", "New Jersey"]);
    });

    it("marks every word wherever it appears, and joins marks that touch", async () => {
      const user = userEvent.setup();
      render(<Combobox aria-label="Place" options={places} />);
      await user.type(field(), "ne yo");
      const row = screen.getByRole("option", { name: "New York" });
      expect([...row.querySelectorAll("mark")].map((mark) => mark.textContent)).toEqual(["Ne", "Yo"]);
      await user.clear(field());
      await user.type(field(), "new york");
      expect([...screen.getByRole("option", { name: "New York" }).querySelectorAll("mark")].map((mark) => mark.textContent)).toEqual(["New", "York"]);
    });

    it("marks every occurrence of a word in one label", async () => {
      const user = userEvent.setup();
      render(<Combobox aria-label="Place" options={[{ value: "a", label: "Ant and Anne" }]} />);
      await user.type(field(), "an");
      const row = screen.getByRole("option");
      expect([...row.querySelectorAll("mark")].map((mark) => mark.textContent)).toEqual(["An", "an", "An"]);
    });
  });

  describe("icons", () => {
    it("holds a place for the icon in rows that have none, but only when another row has one", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Combobox
          aria-label="Plan"
          options={[
            { value: "a", label: "With", icon: PlusIcon },
            { value: "b", label: "Without" },
          ]}
        />,
      );
      await user.click(field());
      const spacerIn = (name: string) => screen.getByRole("option", { name }).querySelector('span[aria-hidden="true"]:empty');
      expect(spacerIn("Without")).not.toBeNull();
      expect(spacerIn("With")).toBeNull();
      rerender(<Combobox aria-label="Plan" options={[{ value: "b", label: "Without" }]} />);
      expect(spacerIn("Without")).toBeNull();
    });
  });

  describe("creating an option", () => {
    const create = (props: Partial<ComboboxProps> = {}) =>
      render(<Combobox aria-label="Label" options={countries} onCreate={(text) => ({ value: text, label: text })} {...props} />);

    it("offers a Create row only for text that names no option", async () => {
      const user = userEvent.setup();
      create();
      await user.click(field());
      expect(screen.queryByRole("option", { name: /Create/ })).toBeNull();
      await user.type(field(), "Atlantis");
      expect(screen.getByRole("option", { name: "Create “Atlantis”" })).toBeInTheDocument();
      await user.clear(field());
      await user.type(field(), "canada");
      expect(screen.queryByRole("option", { name: /Create/ })).toBeNull();
    });

    it("offers nothing without onCreate", async () => {
      const user = userEvent.setup();
      setup();
      await user.type(field(), "Atlantis");
      expect(screen.queryByRole("option", { name: /Create/ })).toBeNull();
    });

    it("is the highlighted row when nothing else matches, and Enter creates and chooses", async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn((text: string) => ({ value: `id-${text}`, label: text }));
      const onValueChange = vi.fn();
      create({ onCreate, onValueChange });
      await user.type(field(), "Atlantis");
      expect(field()).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: /Create/ }).id);
      await user.keyboard("{Enter}");
      expect(onCreate).toHaveBeenCalledWith("Atlantis");
      expect(onValueChange).toHaveBeenCalledWith("id-Atlantis", { value: "id-Atlantis", label: "Atlantis" });
      expect(field()).toHaveValue("Atlantis");
      expect(list()).toBeNull();
    });

    it("comes after the matches, which keep the highlight", async () => {
      const user = userEvent.setup();
      create();
      await user.type(field(), "Cu");
      const names = screen.getAllByRole("option").map((option) => option.textContent);
      expect(names).toEqual(["Curaçao", "Create “Cu”"]);
      expect(field()).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: "Curaçao" }).id);
    });

    it("is reached with the arrow keys and chosen with a click", async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();
      create({ onCreate });
      await user.type(field(), "Cu");
      await user.keyboard("{ArrowDown}");
      expect(field()).toHaveAttribute("aria-activedescendant", screen.getByRole("option", { name: /Create/ }).id);
      await user.click(screen.getByRole("option", { name: /Create/ }));
      expect(onCreate).toHaveBeenCalledWith("Cu");
    });

    it("closes the list when the owner answers with nothing, and keeps the value alone", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      create({ onCreate: () => undefined, onValueChange });
      await user.type(field(), "Atlantis");
      await user.keyboard("{Enter}");
      expect(list()).toBeNull();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("holds the row while a promise is out, then chooses what it resolves with", async () => {
      const user = userEvent.setup();
      let finish: (option: ComboboxOption) => void = () => undefined;
      const onCreate = vi.fn(() => new Promise<ComboboxOption>((resolve) => (finish = resolve)));
      create({ onCreate });
      await user.type(field(), "Atlantis");
      await user.keyboard("{Enter}");
      expect(screen.getByRole("option", { name: /Create/ })).toHaveAttribute("aria-disabled", "true");
      await user.click(screen.getByRole("option", { name: /Create/ }));
      expect(onCreate).toHaveBeenCalledTimes(1);
      await act(async () => finish({ value: "x", label: "Atlantis" }));
      await waitFor(() => expect(list()).toBeNull());
      expect(field()).toHaveValue("Atlantis");
    });

    it("announces a rejection and keeps the list open", async () => {
      const user = userEvent.setup();
      create({ onCreate: () => Promise.reject(new Error("no")) });
      await user.type(field(), "Atlantis");
      await user.keyboard("{Enter}");
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Something went wrong. Try again."));
      expect(list()).not.toBeNull();
      expect(screen.getByRole("option", { name: /Create/ })).not.toHaveAttribute("aria-disabled", "true");
    });

    it("words the row with labels.create, and leaves the result count alone", async () => {
      const user = userEvent.setup();
      create({ labels: { create: (text) => `Add ${text}` } });
      await user.type(field(), "Cu");
      expect(screen.getByRole("option", { name: "Add Cu" })).toBeInTheDocument();
      await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 results available"));
    });

    it("keeps the created option as the value before the owner has added it to options", async () => {
      const user = userEvent.setup();
      create();
      await user.type(field(), "Atlantis");
      await user.keyboard("{Enter}");
      await user.click(field());
      expect(field()).toHaveValue("Atlantis");
      await user.tab();
      expect(field()).toHaveValue("Atlantis");
    });

    it("has no axe violations with the row in the list", async () => {
      const user = userEvent.setup();
      create();
      await user.type(field(), "Atlantis");
      expect(await axe(document.body, noLandmarks)).toHaveNoViolations();
    });
  });
});
