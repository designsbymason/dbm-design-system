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

  it("applies id and data-testid to the root element", () => {
    const { container } = render(
      <Collapse id="my-collapse" data-testid="collapse-root">
        Content
      </Collapse>,
    );
    expect(container.firstChild).toHaveAttribute("id", "my-collapse");
    expect(container.firstChild).toHaveAttribute(
      "data-testid",
      "collapse-root",
    );
  });

  it("defaults to a vertical orientation, animating height", () => {
    const { container } = render(<Collapse defaultOpen>Content</Collapse>);
    // Both Root and Content carry `data-state` — scope to the inner
    // content region specifically (Root has no "content"/orientation
    // class of its own to match against).
    const content = container.querySelector(
      '[class*="content"][data-state="open"]',
    );
    expect(content?.className).toMatch(/vertical/);
    expect(content?.className).not.toMatch(/horizontal/);
  });

  it("applies the horizontal orientation, animating width instead of height", () => {
    const { container } = render(
      <Collapse orientation="horizontal" defaultOpen>
        Content
      </Collapse>,
    );
    const content = container.querySelector(
      '[class*="content"][data-state="open"]',
    );
    expect(content?.className).toMatch(/horizontal/);
    expect(content?.className).not.toMatch(/vertical/);
  });

  it("renders the collapsible behavior onto a single child via asChild, without an extra wrapper element", () => {
    const { container } = render(
      <Collapse asChild defaultOpen>
        <section data-testid="host">Content</section>
      </Collapse>,
    );
    const host = screen.getByTestId("host");
    expect(host.tagName).toBe("SECTION");
    // No separate Collapse-owned wrapper <div> around the host element —
    // the host element itself is the root Radix slots onto.
    expect(container.firstChild).toBe(host);
  });

  it("ignores asChild when a trigger is also provided, rendering the normal wrapper instead of crashing", () => {
    const { container } = render(
      <Collapse asChild trigger={<button type="button">Toggle</button>}>
        <section>Content</section>
      </Collapse>,
    );
    // Falls back to a plain <div> root (asChild would need exactly one
    // child, but trigger + content region means two) rather than crashing.
    expect(container.firstChild?.nodeName).toBe("DIV");
  });

  it("warns once in development when disabled is set without a trigger", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(<Collapse disabled open>Content</Collapse>);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("disabled");

    rerender(<Collapse disabled open>Content again</Collapse>);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it("does not warn about disabled when a trigger is present", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Collapse disabled trigger={<button type="button">Toggle</button>}>
        Content
      </Collapse>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("lays the trigger and content out in a row when orientation is horizontal with a trigger present", () => {
    const { container } = render(
      <Collapse
        orientation="horizontal"
        trigger={<button type="button">Toggle</button>}
      >
        Content
      </Collapse>,
    );
    expect((container.firstChild as HTMLElement).className).toMatch(
      /rootRow/,
    );
  });

  it("does not force a row layout for vertical orientation, even with a trigger", () => {
    const { container } = render(
      <Collapse
        orientation="vertical"
        trigger={<button type="button">Toggle</button>}
      >
        Content
      </Collapse>,
    );
    expect((container.firstChild as HTMLElement).className).not.toMatch(
      /rootRow/,
    );
  });

  it("does not force a row layout for horizontal orientation without a trigger", () => {
    const { container } = render(
      <Collapse orientation="horizontal" open>
        Content
      </Collapse>,
    );
    expect((container.firstChild as HTMLElement).className).not.toMatch(
      /rootRow/,
    );
  });

  it("warns once in development when asChild is combined with a trigger", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Collapse asChild trigger={<button type="button">Toggle</button>}>
        <section>Content</section>
      </Collapse>,
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("asChild");
    warnSpy.mockRestore();
  });
});
