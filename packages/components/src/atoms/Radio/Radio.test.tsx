import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { createRef, useState, type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { Radio } from "./Radio";
import { RadioGroupContext } from "./RadioGroupContext";
import { RadioGroupSizeContext } from "./RadioGroupSizeContext";
import styles from "./Radio.module.css";
import type { RadioSize } from "./Radio.types";

/**
 * A minimal grouped-mode harness — mirrors what the real `RadioGroup`
 * molecule does internally: render Radix's real `RadioGroupPrimitive.Root`
 * and provide `RadioGroupContext` (plus, now, `RadioGroupSizeContext`) as
 * `RadioGroup` itself does. Kept here rather than importing the real
 * `RadioGroup` so `Radio`'s own atom-tier tests stay self-contained, with
 * no dependency on a molecule — `RadioGroup.test.tsx` is where the real,
 * composed integration (including its own size-cascade tests) is covered.
 */
function GroupHarness({
  children,
  size,
  ...rootProps
}: { children: React.ReactNode; size?: RadioSize } & ComponentProps<
  typeof RadioGroupPrimitive.Root
>) {
  return (
    <RadioGroupPrimitive.Root {...rootProps}>
      <RadioGroupContext.Provider value={true}>
        <RadioGroupSizeContext.Provider value={size}>
          {children}
        </RadioGroupSizeContext.Provider>
      </RadioGroupContext.Provider>
    </RadioGroupPrimitive.Root>
  );
}

describe("Radio", () => {
  describe("standalone (no RadioGroup ancestor)", () => {
    it("renders unchecked by default", () => {
      render(<Radio aria-label="Email" />);
      expect(screen.getByRole("radio")).toHaveAttribute("aria-checked", "false");
    });

    it("defaults to size 'md' with no size prop and no RadioGroup ancestor", () => {
      render(<Radio aria-label="Email" />);
      expect(screen.getByRole("radio")).toHaveClass(styles.sizeMd as string);
    });

    it("renders checked when defaultChecked is true", () => {
      render(<Radio defaultChecked aria-label="Email" />);
      expect(screen.getByRole("radio")).toHaveAttribute("aria-checked", "true");
    });

    it("toggles to checked on click", async () => {
      const user = userEvent.setup();
      render(<Radio aria-label="Email" />);
      const radio = screen.getByRole("radio");
      await user.click(radio);
      expect(radio).toHaveAttribute("aria-checked", "true");
    });

    it("stays checked when clicked again — a radio can't be unchecked by clicking itself, unlike Checkbox", async () => {
      const user = userEvent.setup();
      render(<Radio defaultChecked aria-label="Email" />);
      const radio = screen.getByRole("radio");
      expect(radio).toHaveAttribute("aria-checked", "true");
      await user.click(radio);
      expect(radio).toHaveAttribute("aria-checked", "true");
    });

    it("calls onCheckedChange with true when clicked", async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(<Radio onCheckedChange={onCheckedChange} aria-label="Email" />);
      await user.click(screen.getByRole("radio"));
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it("supports fully controlled usage", async () => {
      const user = userEvent.setup();
      function Controlled() {
        const [checked, setChecked] = useState(false);
        return (
          <Radio checked={checked} onCheckedChange={setChecked}>
            Email
          </Radio>
        );
      }
      render(<Controlled />);
      const radio = screen.getByRole("radio");
      expect(radio).toHaveAttribute("aria-checked", "false");
      await user.click(radio);
      expect(radio).toHaveAttribute("aria-checked", "true");
    });

    it("does not toggle when disabled", async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(
        <Radio disabled onCheckedChange={onCheckedChange} aria-label="Email" />,
      );
      await user.click(screen.getByRole("radio"));
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it("is focusable via Tab and toggles via Space on the keyboard", async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(<Radio onCheckedChange={onCheckedChange} aria-label="Email" />);
      const radio = screen.getByRole("radio");

      await user.tab();
      expect(radio).toHaveFocus();
      await user.keyboard(" ");
      expect(radio).toHaveAttribute("aria-checked", "true");
      expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it("is not part of the tab order and blocks keyboard toggling when disabled", async () => {
      const user = userEvent.setup();
      const onCheckedChange = vi.fn();
      render(
        <Radio disabled onCheckedChange={onCheckedChange} aria-label="Email" />,
      );
      const radio = screen.getByRole("radio");

      await user.tab();
      expect(radio).not.toHaveFocus();
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it("sets aria-required when required is true", () => {
      // Radix's own RadioGroup source sets `aria-required` on the wrapping
      // `role="radiogroup"` div (the standalone self-wrapped Root here),
      // not on the `role="radio"` button itself — confirmed by reading
      // node_modules/@radix-ui/react-radio-group/dist/index.mjs directly,
      // not assumed.
      render(<Radio required aria-label="Email" />);
      expect(screen.getByRole("radiogroup")).toHaveAttribute(
        "aria-required",
        "true",
      );
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
          <Radio name="contact-method" value="email" aria-label="Email" />
          <button type="submit">Submit</button>
        </form>,
      );
      await user.click(screen.getByRole("radio"));
      await user.click(screen.getByRole("button", { name: "Submit" }));
      expect(captured.submitted?.get("contact-method")).toBe("email");
    });

    it("sets aria-invalid when hasError is true", () => {
      render(<Radio hasError aria-label="Email" />);
      expect(screen.getByRole("radio")).toHaveAttribute("aria-invalid", "true");
    });

    it("never lets a same-named consumer prop override the computed aria-invalid", () => {
      render(<Radio hasError aria-invalid={false} aria-label="Email" />);
      expect(screen.getByRole("radio")).toHaveAttribute("aria-invalid", "true");
    });

    it("renders an inline label and associates it via htmlFor/id", () => {
      render(<Radio>Email</Radio>);
      expect(screen.getByRole("radio", { name: "Email" })).toBeInTheDocument();
    });

    it("toggles when clicking the label text, not just the circle", async () => {
      const user = userEvent.setup();
      render(<Radio>Email</Radio>);
      await user.click(screen.getByText("Email"));
      expect(screen.getByRole("radio")).toHaveAttribute("aria-checked", "true");
    });

    it("forwards ref to the underlying button", () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Radio ref={ref} aria-label="Email" />);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it("applies className to the radio control", () => {
      render(<Radio className="custom" aria-label="Email" />);
      expect(screen.getByRole("radio")).toHaveClass("custom");
    });

    it("forwards style and data-testid to the radio control", () => {
      render(
        <Radio
          style={{ marginTop: "1rem" }}
          data-testid="email-radio"
          aria-label="Email"
        />,
      );
      const radio = screen.getByTestId("email-radio");
      expect(radio).toHaveStyle({ marginTop: "1rem" });
      expect(radio).toHaveAttribute("role", "radio");
    });

    it("generates an id internally when omitted, but respects an explicit one", () => {
      const { rerender } = render(<Radio>Email</Radio>);
      expect(screen.getByRole("radio")).toHaveAttribute("id");

      rerender(<Radio id="email-radio">Email</Radio>);
      expect(screen.getByRole("radio")).toHaveAttribute("id", "email-radio");
    });

    it("warns once in development when there is no accessible name", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { rerender } = render(<Radio />);
      rerender(<Radio size="lg" />);

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
          <Radio aria-label="Email" />
          <Radio aria-labelledby="external-label" />
          <Radio>Email</Radio>
        </>,
      );

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it("has no accessibility violations, unchecked, checked, with a label, hasError, or disabled", async () => {
      const { container: uncheckedContainer } = render(
        <Radio aria-label="Email" />,
      );
      expect((await axe(uncheckedContainer)).violations).toHaveLength(0);

      const { container: checkedContainer } = render(
        <Radio defaultChecked aria-label="Email" />,
      );
      expect((await axe(checkedContainer)).violations).toHaveLength(0);

      const { container: labeledContainer } = render(<Radio>Email</Radio>);
      expect((await axe(labeledContainer)).violations).toHaveLength(0);

      const { container: errorContainer } = render(
        <Radio hasError>Required field</Radio>,
      );
      expect((await axe(errorContainer)).violations).toHaveLength(0);

      const { container: disabledContainer } = render(
        <Radio disabled>Email</Radio>,
      );
      expect((await axe(disabledContainer)).violations).toHaveLength(0);
    });
  });

  describe("grouped (real ambient RadioGroup context present)", () => {
    it("reflects checked state from the group's own value matching this item's value", () => {
      render(
        <GroupHarness value="email">
          <Radio value="email">Email</Radio>
          <Radio value="sms">SMS</Radio>
        </GroupHarness>,
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

    it("calls the group's onValueChange with this item's value when clicked", async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <GroupHarness onValueChange={onValueChange}>
          <Radio value="email">Email</Radio>
          <Radio value="sms">SMS</Radio>
        </GroupHarness>,
      );
      await user.click(screen.getByRole("radio", { name: "SMS" }));
      expect(onValueChange).toHaveBeenCalledWith("sms");
    });

    it("supports roving-tabindex keyboard navigation between items in the same group", async () => {
      const user = userEvent.setup();
      render(
        <GroupHarness defaultValue="email">
          <Radio value="email">Email</Radio>
          <Radio value="sms">SMS</Radio>
        </GroupHarness>,
      );
      await user.tab();
      expect(screen.getByRole("radio", { name: "Email" })).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("radio", { name: "SMS" })).toHaveFocus();
      // Radix's real RadioGroup also auto-selects the newly-focused item in
      // a genuine browser (confirmed by reading its source), but that relies
      // on real DOM focus/keydown event ordering jsdom doesn't reproduce
      // reliably in a single ArrowDown press — asserting on it here would
      // test a browser-only timing quirk, not this component's own logic.
      // What's asserted instead is the WAI-ARIA-guaranteed fallback: Space
      // on the now-focused item selects it.
      await user.keyboard(" ");
      expect(screen.getByRole("radio", { name: "SMS" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    });

    it("warns once in development when standalone-only props are passed while grouped", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <GroupHarness>
          <Radio value="email" defaultChecked>
            Email
          </Radio>
        </GroupHarness>,
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("have no effect inside a `RadioGroup`"),
      );
      consoleWarnSpy.mockRestore();
    });

    it("warns once in development when rendered inside a group with no value", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        <GroupHarness>
          <Radio>Email</Radio>
        </GroupHarness>,
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("no `value`"),
      );
      consoleWarnSpy.mockRestore();
    });

    it("inherits size from an ambient RadioGroup context when it has no size of its own", () => {
      render(
        <GroupHarness size="sm">
          <Radio value="email">Email</Radio>
        </GroupHarness>,
      );
      expect(screen.getByRole("radio")).toHaveClass(styles.sizeSm as string);
    });

    it("falls back to 'md' when grouped with no inherited size and no size of its own", () => {
      render(
        <GroupHarness>
          <Radio value="email">Email</Radio>
        </GroupHarness>,
      );
      expect(screen.getByRole("radio")).toHaveClass(styles.sizeMd as string);
    });

    it("prefers its own explicit size over an inherited one", () => {
      render(
        <GroupHarness size="sm">
          <Radio value="email" size="xl">
            Email
          </Radio>
        </GroupHarness>,
      );
      const radio = screen.getByRole("radio");
      expect(radio).toHaveClass(styles.sizeXl as string);
      expect(radio).not.toHaveClass(styles.sizeSm as string);
    });

    it("has no accessibility violations as a real group", async () => {
      const { container } = render(
        <GroupHarness defaultValue="email">
          <Radio value="email">Email</Radio>
          <Radio value="sms">SMS</Radio>
        </GroupHarness>,
      );
      expect((await axe(container)).violations).toHaveLength(0);
    });
  });

  it("renders no visible indicator content in a static snapshot (indicator mounts only when checked)", () => {
    const { container } = render(<Radio aria-label="Email" />);
    expect(container.querySelector(`.${styles.indicator}`)).toBeNull();
  });
});
