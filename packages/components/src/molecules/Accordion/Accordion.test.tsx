import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Accordion } from "./Accordion";

function BasicItems() {
  return (
    <>
      <Accordion.Item value="shipping">
        <Accordion.Trigger>Shipping</Accordion.Trigger>
        <Accordion.Content>Shipping content</Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="returns">
        <Accordion.Trigger>Returns</Accordion.Trigger>
        <Accordion.Content>Returns content</Accordion.Content>
      </Accordion.Item>
    </>
  );
}

describe("Accordion", () => {
  it("renders every trigger and keeps content closed by default", () => {
    render(
      <Accordion>
        <BasicItems />
      </Accordion>,
    );
    expect(screen.getByRole("button", { name: "Shipping" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Returns" })).toBeInTheDocument();
    expect(screen.queryByText("Shipping content")).not.toBeInTheDocument();
  });

  it("opens an item's content when its trigger is clicked, and closes it on a second click", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <BasicItems />
      </Accordion>,
    );
    const trigger = screen.getByRole("button", { name: "Shipping" });

    await user.click(trigger);
    expect(screen.getByText("Shipping content")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    expect(screen.queryByText("Shipping content")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the previously open item when type=\"single\" (the default)", async () => {
    const user = userEvent.setup();
    render(
      <Accordion defaultValue="shipping">
        <BasicItems />
      </Accordion>,
    );

    expect(screen.getByText("Shipping content")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Returns" }));
    expect(screen.queryByText("Shipping content")).not.toBeInTheDocument();
    expect(screen.getByText("Returns content")).toBeInTheDocument();
  });

  it("allows multiple items open at once when type=\"multiple\"", async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="multiple">
        <BasicItems />
      </Accordion>,
    );

    await user.click(screen.getByRole("button", { name: "Shipping" }));
    await user.click(screen.getByRole("button", { name: "Returns" }));

    expect(screen.getByText("Shipping content")).toBeInTheDocument();
    expect(screen.getByText("Returns content")).toBeInTheDocument();
  });

  it("keeps the item open when collapsible is false and its own trigger is activated again", async () => {
    const user = userEvent.setup();
    render(
      <Accordion defaultValue="shipping" collapsible={false}>
        <BasicItems />
      </Accordion>,
    );

    await user.click(screen.getByRole("button", { name: "Shipping" }));
    expect(screen.getByText("Shipping content")).toBeInTheDocument();
  });

  it("supports fully controlled open state", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <Accordion value={value} onValueChange={setValue}>
          <BasicItems />
        </Accordion>
      );
    }
    render(<Controlled />);

    await user.click(screen.getByRole("button", { name: "Shipping" }));
    expect(screen.getByText("Shipping content")).toBeInTheDocument();
  });

  it("starts with the given item open when defaultValue is set", () => {
    render(
      <Accordion defaultValue="returns">
        <BasicItems />
      </Accordion>,
    );
    expect(screen.getByText("Returns content")).toBeInTheDocument();
  });

  it("disables an individual item's own trigger", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <Accordion.Item value="shipping" disabled>
          <Accordion.Trigger>Shipping</Accordion.Trigger>
          <Accordion.Content>Shipping content</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    const trigger = screen.getByRole("button", { name: "Shipping" });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(screen.queryByText("Shipping content")).not.toBeInTheDocument();
  });

  it("disables every item at once via the accordion-level disabled prop", () => {
    render(
      <Accordion disabled>
        <BasicItems />
      </Accordion>,
    );
    expect(screen.getByRole("button", { name: "Shipping" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Returns" })).toBeDisabled();
  });

  it("moves roving focus between triggers with arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <BasicItems />
      </Accordion>,
    );
    const shipping = screen.getByRole("button", { name: "Shipping" });
    const returns = screen.getByRole("button", { name: "Returns" });

    shipping.focus();
    await user.keyboard("{ArrowDown}");
    expect(returns).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(shipping).toHaveFocus();
  });

  it("renders the trigger's heading level via headingLevel", () => {
    render(
      <Accordion headingLevel={2}>
        <BasicItems />
      </Accordion>,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Shipping" })).toBeInTheDocument();
  });

  it("defaults the trigger's heading level to 3", () => {
    render(
      <Accordion>
        <BasicItems />
      </Accordion>,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Shipping" })).toBeInTheDocument();
  });

  it("renders a fully custom trigger row via asChild", () => {
    render(
      <Accordion>
        <Accordion.Item value="shipping">
          <Accordion.Trigger asChild>
            <button type="button">Custom trigger</button>
          </Accordion.Trigger>
          <Accordion.Content>Shipping content</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    expect(screen.getByRole("button", { name: "Custom trigger" })).toBeInTheDocument();
  });

  it("hides the disclosure icon when hideIcon is set", () => {
    const { container } = render(
      <Accordion>
        <Accordion.Item value="shipping">
          <Accordion.Trigger hideIcon>Shipping</Accordion.Trigger>
          <Accordion.Content>Shipping content</Accordion.Content>
        </Accordion.Item>
      </Accordion>,
    );
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("forwards the root ref to the underlying element", () => {
    const ref = vi.fn();
    render(
      <Accordion ref={ref}>
        <BasicItems />
      </Accordion>,
    );
    expect(ref).toHaveBeenCalled();
  });

  it("has no accessibility violations, closed or open", async () => {
    const { container } = render(
      <Accordion>
        <BasicItems />
      </Accordion>,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Shipping" }));
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations for type=\"multiple\" with several items open", async () => {
    const { container } = render(
      <Accordion type="multiple" defaultValue={["shipping", "returns"]}>
        <BasicItems />
      </Accordion>,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });

  it("has no accessibility violations when disabled", async () => {
    const { container } = render(
      <Accordion disabled>
        <BasicItems />
      </Accordion>,
    );
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
