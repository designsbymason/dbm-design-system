import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { Select } from "./Select";

function BasicSelect(props: Partial<ComponentProps<typeof Select>> = {}) {
  return (
    <Select aria-label="Variant" placeholder="Choose a variant" {...props}>
      <Select.Option value="primary">Primary</Select.Option>
      <Select.Option value="secondary">Secondary</Select.Option>
      <Select.Option value="tertiary" disabled>
        Tertiary
      </Select.Option>
    </Select>
  );
}

describe("Select", () => {
  it("shows the placeholder when nothing is selected", () => {
    render(<BasicSelect />);
    expect(screen.getByRole("combobox")).toHaveTextContent(
      "Choose a variant",
    );
  });

  it("shows the matching option's label when defaultValue is set", () => {
    render(<BasicSelect defaultValue="secondary" />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Secondary");
  });

  it("opens the listbox and selects an option on click", async () => {
    const user = userEvent.setup();
    render(<BasicSelect />);
    await user.click(screen.getByRole("combobox"));
    const option = await screen.findByRole("option", { name: "Primary" });
    await user.click(option);
    expect(screen.getByRole("combobox")).toHaveTextContent("Primary");
  });

  it("calls onValueChange with the new value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<BasicSelect onValueChange={onValueChange} />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Primary" }));
    expect(onValueChange).toHaveBeenCalledWith("primary");
  });

  it("supports fully controlled usage", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string | undefined>(undefined);
      return (
        <Select
          aria-label="Variant"
          placeholder="Choose a variant"
          value={value}
          onValueChange={setValue}
        >
          <Select.Option value="primary">Primary</Select.Option>
          <Select.Option value="secondary">Secondary</Select.Option>
        </Select>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Secondary" }));
    expect(screen.getByRole("combobox")).toHaveTextContent("Secondary");
  });

  it("opens via keyboard and selects with Enter", async () => {
    const user = userEvent.setup();
    render(<BasicSelect />);
    const trigger = screen.getByRole("combobox");
    trigger.focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("listbox");
    // With nothing selected yet, Radix highlights the first item
    // ("Primary") by default — one ArrowDown moves to "Secondary".
    await user.keyboard("{ArrowDown}{Enter}");
    expect(trigger).toHaveTextContent("Secondary");
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    render(<BasicSelect disabled />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not select a disabled option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<BasicSelect onValueChange={onValueChange} />);
    await user.click(screen.getByRole("combobox"));
    const disabledOption = await screen.findByRole("option", {
      name: "Tertiary",
    });
    expect(disabledOption).toHaveAttribute("aria-disabled", "true");
    await user.click(disabledOption);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("sets aria-invalid when hasError is true", () => {
    render(<BasicSelect hasError />);
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("forwards ref to the trigger button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Select ref={ref} aria-label="Variant" placeholder="Choose">
        <Select.Option value="a">A</Select.Option>
      </Select>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("applies className to the trigger", () => {
    render(<BasicSelect className="custom" />);
    expect(screen.getByRole("combobox")).toHaveClass("custom");
  });

  it("forwards id, style, and data-testid to the trigger", () => {
    render(
      <BasicSelect
        id="my-select"
        style={{ opacity: 0.5 }}
        data-testid="select-trigger"
      />,
    );
    const el = screen.getByTestId("select-trigger");
    expect(el).toHaveAttribute("id", "my-select");
    expect(el).toHaveStyle({ opacity: "0.5" });
  });

  it("never lets a same-named consumer prop override the computed aria-invalid attribute", () => {
    // `aria-invalid` is a genuinely valid native prop here (inherited from
    // `button`'s own `AriaAttributes`, no type error to guard against) —
    // this is exactly the real-world case the props-spread-ordering fix
    // protects against: a consumer passing their own `aria-invalid` must
    // not silently win over Select's own `hasError`-computed value.
    render(<BasicSelect hasError aria-invalid={false} />);
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  describe("side/align", () => {
    it("passes side/align through to the dropdown content", async () => {
      const user = userEvent.setup();
      render(<BasicSelect side="top" align="end" />);
      await user.click(screen.getByRole("combobox"));
      const listbox = await screen.findByRole("listbox");
      // Radix renders the resolved placement on the content element itself.
      expect(listbox.closest("[data-side]")).toHaveAttribute(
        "data-side",
        "top",
      );
      expect(listbox.closest("[data-align]")).toHaveAttribute(
        "data-align",
        "end",
      );
    });
  });

  describe("asChild/trigger", () => {
    it("renders the custom trigger element instead of the built-in button", () => {
      render(
        <Select
          aria-label="Variant"
          asChild
          trigger={<a href="#custom">Custom trigger</a>}
        >
          <Select.Option value="primary">Primary</Select.Option>
        </Select>,
      );
      const el = screen.getByRole("combobox");
      expect(el.tagName).toBe("A");
      expect(el).toHaveTextContent("Custom trigger");
    });

    it("warns when trigger is passed without asChild", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<BasicSelect trigger={<button type="button">Custom</button>} />);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("`trigger` has no effect without `asChild`"),
      );
      warnSpy.mockRestore();
    });

    it("warns when asChild is passed without trigger", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<BasicSelect asChild />);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("`asChild` requires `trigger`"),
      );
      warnSpy.mockRestore();
    });

    it("warns when placeholder is passed alongside asChild", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <Select
          aria-label="Variant"
          placeholder="Choose a variant"
          asChild
          trigger={<button type="button">Custom</button>}
        >
          <Select.Option value="primary">Primary</Select.Option>
        </Select>,
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("`placeholder` has no effect when `asChild` is set"),
      );
      warnSpy.mockRestore();
    });

    it("does not warn for a normal, non-asChild select", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(<BasicSelect />);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("does not merge Select's own built-in trigger chrome onto a custom trigger", () => {
      // Regression test for a real bug (found and fixed 2026-09-14,
      // user-reported): Select's own `.trigger`/size/error classes were
      // being merged onto the custom `trigger` element via Radix `Slot`,
      // fighting the custom element's own styling. Only the custom
      // element's own className should end up on it now.
      render(
        <Select
          aria-label="Variant"
          hasError
          asChild
          trigger={
            <button type="button" className="my-custom-button">
              Custom
            </button>
          }
        >
          <Select.Option value="primary">Primary</Select.Option>
        </Select>,
      );
      const el = screen.getByRole("combobox");
      expect(el.className.split(" ").filter(Boolean)).toEqual(["my-custom-button"]);
    });

    it("still merges Select's own className with a custom trigger's own className", () => {
      render(
        <Select
          aria-label="Variant"
          className="select-level"
          asChild
          trigger={
            <button type="button" className="trigger-level">
              Custom
            </button>
          }
        >
          <Select.Option value="primary">Primary</Select.Option>
        </Select>,
      );
      const el = screen.getByRole("combobox");
      expect(el).toHaveClass("select-level");
      expect(el).toHaveClass("trigger-level");
    });
  });

  describe("onClear", () => {
    it("does not render a clear button when onClear is not provided", () => {
      render(<BasicSelect defaultValue="primary" />);
      expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    });

    it("does not render a clear button when nothing is selected yet", () => {
      render(<BasicSelect onClear={() => {}} />);
      expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    });

    it("renders a clear button once a value is selected, uncontrolled", () => {
      render(<BasicSelect defaultValue="primary" onClear={() => {}} />);
      expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    });

    it("fully resets an uncontrolled selection back to the placeholder when cleared", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(<BasicSelect defaultValue="primary" onClear={onClear} />);
      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Primary");
      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(trigger).toHaveTextContent("Choose a variant");
      expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    });

    it("refocuses the trigger after clearing", async () => {
      const user = userEvent.setup();
      render(<BasicSelect defaultValue="primary" onClear={() => {}} />);
      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(screen.getByRole("combobox")).toHaveFocus();
    });

    it("is keyboard-activatable — Enter and Space both call onClear", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      render(<BasicSelect defaultValue="primary" onClear={onClear} />);
      screen.getByRole("button", { name: "Clear" }).focus();
      await user.keyboard("{Enter}");
      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it("supports fully controlled usage — clearing calls onClear so the caller can reset its own value", async () => {
      const user = userEvent.setup();
      const onClear = vi.fn();
      function Controlled() {
        const [value, setValue] = useState<string | undefined>("primary");
        return (
          <Select
            aria-label="Variant"
            placeholder="Choose a variant"
            value={value}
            onValueChange={setValue}
            onClear={() => {
              onClear();
              setValue(undefined);
            }}
          >
            <Select.Option value="primary">Primary</Select.Option>
          </Select>
        );
      }
      render(<Controlled />);
      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveTextContent("Primary");
      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(onClear).toHaveBeenCalledTimes(1);
      expect(trigger).toHaveTextContent("Choose a variant");
    });

    it("does not render a clear button when disabled, even with a selected value", () => {
      render(<BasicSelect defaultValue="primary" onClear={() => {}} disabled />);
      expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
    });

    it("warns when onClear is passed alongside asChild", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      render(
        <Select
          aria-label="Variant"
          asChild
          onClear={() => {}}
          trigger={<button type="button">Custom</button>}
        >
          <Select.Option value="primary">Primary</Select.Option>
        </Select>,
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("`onClear` has no effect when `asChild` is set"),
      );
      warnSpy.mockRestore();
    });

    it("has no accessibility violations with a clear button shown", async () => {
      const { container } = render(<BasicSelect defaultValue="primary" onClear={() => {}} />);
      expect((await axe(container)).violations).toHaveLength(0);
    });
  });

  describe("Select.Option", () => {
    it("forwards id, style, and data-testid", async () => {
      const user = userEvent.setup();
      render(
        <Select aria-label="Variant" placeholder="Choose">
          <Select.Option
            value="primary"
            id="opt-primary"
            style={{ opacity: 0.5 }}
            data-testid="option-primary"
          >
            Primary
          </Select.Option>
        </Select>,
      );
      await user.click(screen.getByRole("combobox"));
      const option = await screen.findByTestId("option-primary");
      expect(option).toHaveAttribute("id", "opt-primary");
      expect(option).toHaveStyle({ opacity: "0.5" });
    });

    it("accepts a custom textValue for typeahead search", async () => {
      const user = userEvent.setup();
      render(
        <Select aria-label="Variant" placeholder="Choose">
          <Select.Option value="z" textValue="alpha">
            🔤
          </Select.Option>
          <Select.Option value="b">Beta</Select.Option>
        </Select>,
      );
      const trigger = screen.getByRole("combobox");
      trigger.focus();
      await user.keyboard("{Enter}");
      await screen.findByRole("listbox");
      // Typing "a" should move typeahead highlight to the option whose
      // `textValue` starts with "a" ("alpha"), not the one whose visible
      // emoji content obviously can't match a letter search — Enter then
      // commits whichever option is currently highlighted.
      await user.keyboard("a");
      await user.keyboard("{Enter}");
      expect(trigger).toHaveTextContent("🔤");
    });

    describe("asChild", () => {
      it("renders the custom row element instead of the built-in option markup", async () => {
        const user = userEvent.setup();
        render(
          <Select aria-label="Variant" placeholder="Choose">
            <Select.Option value="fr" asChild textValue="France">
              <li className="custom-option-row">
                <strong>France</strong> — Europe
              </li>
            </Select.Option>
          </Select>,
        );
        await user.click(screen.getByRole("combobox"));
        const option = await screen.findByRole("option");
        expect(option.tagName).toBe("LI");
        expect(option).toHaveClass("custom-option-row");
      });

      it("does not visibly duplicate the label via the hidden textValue projection", async () => {
        // Regression test for a real bug (found and fixed 2026-09-14, live
        // in Storybook — `textContent` alone can't catch this, since it
        // ignores CSS `display` entirely; this checks the actual hiding
        // mechanism instead): Radix's own `SelectItemText` silently drops
        // its `style`/`className` props — an inline
        // `style={{ display: "none" }}` on it had no effect, so the hidden
        // textValue-sourced `ItemText` this component injects for the
        // trigger's own benefit rendered fully visible, duplicating every
        // custom row's own label directly beneath it. Fixed by hiding a
        // wrapping `<span>` around `ItemText` instead, which does respect
        // inline styles.
        const user = userEvent.setup();
        render(
          <Select aria-label="Variant" placeholder="Choose">
            <Select.Option value="fr" asChild textValue="France">
              <li>Europe</li>
            </Select.Option>
          </Select>,
        );
        await user.click(screen.getByRole("combobox"));
        const option = await screen.findByRole("option");
        // The visible row ("Europe") has no idea about `textValue`
        // ("France") at all — the only place "France" can appear in the
        // DOM is the injected projection source, so asserting *where* it
        // lives (inside a `display: none` ancestor) directly verifies it's
        // actually hidden, rather than inferring hiding from a count that
        // `textContent` can't distinguish.
        const franceNode = within(option).getByText("France");
        expect(franceNode.closest('[style*="display: none"]')).not.toBeNull();
      });

      it("shows the plain textValue in the trigger once a custom-row option is selected", async () => {
        const user = userEvent.setup();
        render(
          <Select aria-label="Variant" placeholder="Choose">
            <Select.Option value="fr" asChild textValue="France">
              <li>
                <strong>France</strong> — Europe
              </li>
            </Select.Option>
          </Select>,
        );
        const trigger = screen.getByRole("combobox");
        await user.click(trigger);
        await user.click(await screen.findByRole("option"));
        expect(trigger).toHaveTextContent("France");
        expect(trigger).not.toHaveTextContent("Europe");
      });

      it("warns when asChild is passed without textValue", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        render(
          <Select aria-label="Variant" placeholder="Choose">
            <Select.Option value="fr" asChild>
              <li>France</li>
            </Select.Option>
          </Select>,
        );
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining("`asChild` needs `textValue`"),
        );
        warnSpy.mockRestore();
      });

      it("does not merge the built-in option class onto a custom row", async () => {
        const user = userEvent.setup();
        render(
          <Select aria-label="Variant" placeholder="Choose">
            <Select.Option value="fr" asChild textValue="France" className="my-row">
              <li>France</li>
            </Select.Option>
          </Select>,
        );
        await user.click(screen.getByRole("combobox"));
        const option = await screen.findByRole("option");
        expect(option.className.split(" ").filter(Boolean)).toEqual(["my-row"]);
      });
    });
  });

  it("has no accessibility violations when closed", async () => {
    const { container } = render(<BasicSelect />);
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(<BasicSelect />);
    await user.click(screen.getByRole("combobox"));
    await screen.findByRole("listbox");
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations with a custom asChild trigger", async () => {
    const { container } = render(
      <Select
        aria-label="Variant"
        asChild
        trigger={<button type="button">Custom trigger</button>}
      >
        <Select.Option value="primary">Primary</Select.Option>
      </Select>,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
