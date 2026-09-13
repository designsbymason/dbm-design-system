import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "../../atoms/Checkbox";
import checkboxStyles from "../../atoms/Checkbox/Checkbox.module.css";
import { CheckboxGroup } from "./CheckboxGroup";
import styles from "./CheckboxGroup.module.css";

describe("CheckboxGroup", () => {
  it("renders a role=group wrapping its Checkbox children", () => {
    render(
      <CheckboxGroup aria-label="Interests">
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
      </CheckboxGroup>,
    );
    expect(screen.getByRole("group")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("cascades size to every Checkbox child that doesn't set its own", () => {
    render(
      <CheckboxGroup aria-label="Interests" size="sm">
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
      </CheckboxGroup>,
    );
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toHaveClass(checkboxStyles.sizeSm as string);
    }
  });

  it("lets an individual Checkbox's own explicit size override the group's", () => {
    render(
      <CheckboxGroup aria-label="Interests" size="sm">
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music" size="xl">
          Music
        </Checkbox>
      </CheckboxGroup>,
    );
    expect(screen.getByRole("checkbox", { name: "Sports" })).toHaveClass(
      checkboxStyles.sizeSm as string,
    );
    const music = screen.getByRole("checkbox", { name: "Music" });
    expect(music).toHaveClass(checkboxStyles.sizeXl as string);
    expect(music).not.toHaveClass(checkboxStyles.sizeSm as string);
  });

  it("leaves every Checkbox at its own default size when the group sets none", () => {
    render(
      <CheckboxGroup aria-label="Interests">
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
      </CheckboxGroup>,
    );
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toHaveClass(checkboxStyles.sizeMd as string);
    }
  });

  it("checks exactly the options listed in defaultValue when uncontrolled, and none other", () => {
    render(
      <CheckboxGroup aria-label="Interests" defaultValue={["sports"]}>
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
      </CheckboxGroup>,
    );
    expect(screen.getByRole("checkbox", { name: "Sports" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("checkbox", { name: "Music" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("toggles a clicked option independently, leaving the others untouched", async () => {
    const user = userEvent.setup();
    render(
      <CheckboxGroup aria-label="Interests" defaultValue={["sports"]}>
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
      </CheckboxGroup>,
    );
    await user.click(screen.getByRole("checkbox", { name: "Music" }));
    expect(screen.getByRole("checkbox", { name: "Music" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("checkbox", { name: "Sports" })).toHaveAttribute(
      "aria-checked",
      "true",
    );

    await user.click(screen.getByRole("checkbox", { name: "Sports" }));
    expect(screen.getByRole("checkbox", { name: "Sports" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("checkbox", { name: "Music" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("calls onValueChange with the full updated array", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <CheckboxGroup aria-label="Interests" defaultValue={["sports"]} onValueChange={onValueChange}>
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
      </CheckboxGroup>,
    );
    await user.click(screen.getByRole("checkbox", { name: "Music" }));
    expect(onValueChange).toHaveBeenCalledWith(["sports", "music"]);

    await user.click(screen.getByRole("checkbox", { name: "Sports" }));
    expect(onValueChange).toHaveBeenCalledWith(["music"]);
  });

  it("supports fully controlled usage", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string[]>(["sports"]);
      return (
        <CheckboxGroup aria-label="Interests" value={value} onValueChange={setValue}>
          <Checkbox value="sports">Sports</Checkbox>
          <Checkbox value="music">Music</Checkbox>
        </CheckboxGroup>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole("checkbox", { name: "Sports" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await user.click(screen.getByRole("checkbox", { name: "Music" }));
    expect(screen.getByRole("checkbox", { name: "Music" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("disables every Checkbox in the group at once", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <CheckboxGroup aria-label="Interests" disabled onValueChange={onValueChange}>
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
      </CheckboxGroup>,
    );
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toBeDisabled();
    }
    await user.click(screen.getByRole("checkbox", { name: "Sports" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("dims an individual Checkbox's label when disabled only via the group cascade", () => {
    render(
      <CheckboxGroup aria-label="Interests" disabled>
        <Checkbox value="sports">Sports</Checkbox>
      </CheckboxGroup>,
    );
    const label = screen.getByText("Sports").closest("label");
    expect(label).toHaveClass(checkboxStyles.labelDisabled as string);
  });

  it("keeps each option independently focusable via Tab, with no roving focus", async () => {
    const user = userEvent.setup();
    render(
      <CheckboxGroup aria-label="Interests">
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
        <Checkbox value="travel">Travel</Checkbox>
      </CheckboxGroup>,
    );
    await user.tab();
    expect(screen.getByRole("checkbox", { name: "Sports" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("checkbox", { name: "Music" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("checkbox", { name: "Travel" })).toHaveFocus();
  });

  it("shows the colored left-border accent class when hasError is true, not otherwise", () => {
    const { rerender } = render(
      <CheckboxGroup aria-label="Interests">
        <Checkbox value="sports">Sports</Checkbox>
      </CheckboxGroup>,
    );
    expect(screen.getByRole("group")).not.toHaveClass(styles.error as string);

    rerender(
      <CheckboxGroup aria-label="Interests" hasError>
        <Checkbox value="sports">Sports</Checkbox>
      </CheckboxGroup>,
    );
    expect(screen.getByRole("group")).toHaveClass(styles.error as string);
  });

  it("does not set aria-invalid on the group itself (role=group doesn't support it)", () => {
    render(
      <CheckboxGroup aria-label="Interests" hasError>
        <Checkbox value="sports">Sports</Checkbox>
      </CheckboxGroup>,
    );
    expect(screen.getByRole("group")).not.toHaveAttribute("aria-invalid");
  });

  it("cascades name to every Checkbox that doesn't set its own", () => {
    // Radix's own hidden input only renders inside a real <form> (or with
    // an explicit `form` prop) — see the "participates in real form
    // submission" test below for the full end-to-end case.
    const { container } = render(
      <form>
        <CheckboxGroup aria-label="Interests" name="interests" defaultValue={["sports"]}>
          <Checkbox value="sports">Sports</Checkbox>
          <Checkbox value="music" name="music-opt-in">
            Music
          </Checkbox>
        </CheckboxGroup>
      </form>,
    );
    const inputs = Array.from(
      container.querySelectorAll('input[type="checkbox"]'),
    ) as HTMLInputElement[];
    const sportsInput = inputs.find((input) => input.value === "sports")!;
    const musicInput = inputs.find((input) => input.value === "music")!;
    expect(sportsInput.name).toBe("interests");
    expect(musicInput.name).toBe("music-opt-in");
  });

  it("participates in real form submission via shared name, one entry per checked item", async () => {
    const user = userEvent.setup();
    const captured: { submitted: FormData | null } = { submitted: null };
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          captured.submitted = new FormData(event.currentTarget);
        }}
      >
        <CheckboxGroup aria-label="Interests" name="interests" defaultValue={["sports", "music"]}>
          <Checkbox value="sports">Sports</Checkbox>
          <Checkbox value="music">Music</Checkbox>
          <Checkbox value="travel">Travel</Checkbox>
        </CheckboxGroup>
        <button type="submit">Submit</button>
      </form>,
    );
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(captured.submitted?.getAll("interests")).toEqual(["sports", "music"]);
  });

  it("forwards ref to the underlying group div", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <CheckboxGroup aria-label="Interests" ref={ref}>
        <Checkbox value="sports">Sports</Checkbox>
      </CheckboxGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute("role", "group");
  });

  it("applies className to the group", () => {
    render(
      <CheckboxGroup aria-label="Interests" className="custom">
        <Checkbox value="sports">Sports</Checkbox>
      </CheckboxGroup>,
    );
    expect(screen.getByRole("group")).toHaveClass("custom");
  });

  it("forwards style, id, and data-testid to the group", () => {
    render(
      <CheckboxGroup
        aria-label="Interests"
        style={{ marginTop: "1rem" }}
        id="interests-group"
        data-testid="interests-group"
      >
        <Checkbox value="sports">Sports</Checkbox>
      </CheckboxGroup>,
    );
    const group = screen.getByTestId("interests-group");
    expect(group).toHaveStyle({ marginTop: "1rem" });
    expect(group).toHaveAttribute("id", "interests-group");
  });

  it("warns once in development when there is no accessible name", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <CheckboxGroup>
        <Checkbox value="sports">Sports</Checkbox>
      </CheckboxGroup>,
    );
    rerender(
      <CheckboxGroup orientation="horizontal">
        <Checkbox value="sports">Sports</Checkbox>
      </CheckboxGroup>,
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
        <CheckboxGroup aria-label="Interests">
          <Checkbox value="sports">Sports</Checkbox>
        </CheckboxGroup>
        <CheckboxGroup aria-labelledby="external-label">
          <Checkbox value="music">Music</Checkbox>
        </CheckboxGroup>
      </>,
    );
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("has no accessibility violations with real Checkbox children, checked and unchecked alike", async () => {
    const { container } = render(
      <CheckboxGroup aria-label="Interests" defaultValue={["sports"]}>
        <Checkbox value="sports">Sports</Checkbox>
        <Checkbox value="music">Music</Checkbox>
        <Checkbox value="travel">Travel</Checkbox>
      </CheckboxGroup>,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations when disabled or hasError", async () => {
    const { container: disabledContainer } = render(
      <CheckboxGroup aria-label="Interests" disabled>
        <Checkbox value="sports">Sports</Checkbox>
      </CheckboxGroup>,
    );
    expect((await axe(disabledContainer)).violations).toHaveLength(0);

    const { container: errorContainer } = render(
      <CheckboxGroup aria-label="Interests" hasError>
        <Checkbox value="sports">Sports</Checkbox>
      </CheckboxGroup>,
    );
    expect((await axe(errorContainer)).violations).toHaveLength(0);
  });
});
