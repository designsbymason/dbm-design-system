import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Collapse } from "./Collapse";

describe("Collapse", () => {
  it("renders closed by default, not rendering its content", () => {
    render(
      <Collapse trigger={<button type="button">Toggle</button>}>
        Hidden content
      </Collapse>,
    );
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument();
  });

  it("renders open when defaultOpen is true", () => {
    render(
      <Collapse defaultOpen trigger={<button type="button">Toggle</button>}>
        Visible content
      </Collapse>,
    );
    expect(screen.getByText("Visible content")).toBeVisible();
  });

  it("toggles uncontrolled state when the trigger is activated", async () => {
    const user = userEvent.setup();
    render(
      <Collapse trigger={<button type="button">Toggle</button>}>
        Content
      </Collapse>,
    );
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.getByText("Content")).toBeVisible();
  });

  it("calls onOpenChange with the new value", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Collapse
        onOpenChange={onOpenChange}
        trigger={<button type="button">Toggle</button>}
      >
        Content
      </Collapse>,
    );
    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("supports fully controlled usage without an internal trigger", () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen((o) => !o)}>
            External toggle
          </button>
          <Collapse open={open}>Externally driven content</Collapse>
        </>
      );
    }
    render(<Controlled />);
    expect(
      screen.queryByText("Externally driven content"),
    ).not.toBeInTheDocument();
  });

  it("reveals content when the external open state flips to true", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen((o) => !o)}>
            External toggle
          </button>
          <Collapse open={open}>Externally driven content</Collapse>
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "External toggle" }));
    expect(screen.getByText("Externally driven content")).toBeVisible();
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    render(
      <Collapse disabled trigger={<button type="button">Toggle</button>}>
        Content
      </Collapse>,
    );
    await user.click(screen.getByRole("button", { name: "Toggle" }));
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("forwards ref to the root element", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Collapse ref={ref} trigger={<button type="button">Toggle</button>}>
        Content
      </Collapse>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("applies className to the root element", () => {
    const { container } = render(
      <Collapse className="custom">Content</Collapse>,
    );
    expect(container.firstChild).toHaveClass("custom");
  });

  it("has no accessibility violations, closed or open", async () => {
    const { container, rerender } = render(
      <Collapse trigger={<button type="button">Toggle</button>}>
        Content
      </Collapse>,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    rerender(
      <Collapse defaultOpen trigger={<button type="button">Toggle</button>}>
        Content
      </Collapse>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
