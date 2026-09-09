import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Portal } from "./Portal";

describe("Portal", () => {
  it("renders children into document.body by default, outside the local tree", () => {
    render(
      <div data-testid="local-root">
        <Portal>
          <div data-testid="portaled">content</div>
        </Portal>
      </div>,
    );
    const local = screen.getByTestId("local-root");
    const portaled = screen.getByTestId("portaled");
    expect(local).not.toContainElement(portaled);
    expect(document.body).toContainElement(portaled);
  });

  it("renders children into a custom container", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    render(
      <Portal container={container}>
        <div data-testid="portaled">content</div>
      </Portal>,
    );

    expect(container).toContainElement(screen.getByTestId("portaled"));
    document.body.removeChild(container);
  });

  it("forwards native div props to the portal root", () => {
    render(
      <Portal data-testid="portal-root">
        <span>content</span>
      </Portal>,
    );
    expect(screen.getByTestId("portal-root")).toBeInTheDocument();
  });

  it("forwards ref to the portaled root element", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Portal ref={ref}>
        <span>content</span>
      </Portal>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(document.body).toContainElement(ref.current);
  });

  it("supports asChild, portaling the child itself instead of wrapping it in a div", () => {
    render(
      <Portal asChild>
        <span data-testid="slot-child">content</span>
      </Portal>,
    );
    const slotChild = screen.getByTestId("slot-child");
    expect(slotChild.tagName).toBe("SPAN");
    expect(document.body).toContainElement(slotChild);
    // Confirms no extra wrapper element exists around it — the slotted
    // child itself is the direct last child of body, not nested one level
    // deeper inside a portal-owned <div>.
    expect(document.body.lastElementChild).toBe(slotChild);
  });

  it("supports asChild together with a custom container", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    render(
      <Portal container={container} asChild>
        <span data-testid="slot-child">content</span>
      </Portal>,
    );
    const slotChild = screen.getByTestId("slot-child");
    expect(container).toContainElement(slotChild);
    expect(container.lastElementChild).toBe(slotChild);
    document.body.removeChild(container);
  });

  // asChild is irrelevant once disablePortal short-circuits to rendering
  // children in place directly — verified directly, not assumed, since
  // this is a real, previously-undocumented interaction between the two
  // props (found during this component's own review pass).
  it("asChild has no effect when disablePortal is also true", () => {
    render(
      <div data-testid="local-root">
        <Portal disablePortal asChild>
          <span data-testid="child">content</span>
        </Portal>
      </div>,
    );
    const local = screen.getByTestId("local-root");
    const child = screen.getByTestId("child");
    expect(local).toContainElement(child);
    expect(local.firstElementChild).toBe(child);
  });

  it("renders children in place with no portal when disablePortal is true", () => {
    render(
      <div data-testid="local-root">
        <Portal disablePortal>
          <div data-testid="not-portaled">content</div>
        </Portal>
      </div>,
    );
    const local = screen.getByTestId("local-root");
    const notPortaled = screen.getByTestId("not-portaled");
    expect(local).toContainElement(notPortaled);
  });

  it("warns once in development when ref is passed alongside disablePortal", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const ref = createRef<HTMLDivElement>();

    const { rerender } = render(
      <Portal ref={ref} disablePortal>
        <div>content</div>
      </Portal>,
    );
    rerender(
      <Portal ref={ref} disablePortal>
        <div>content changed</div>
      </Portal>,
    );

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    consoleWarnSpy.mockRestore();
  });

  it("has no accessibility violations", async () => {
    const { baseElement } = render(
      <Portal>
        <button type="button">Click</button>
      </Portal>,
    );
    // Portaled content renders outside RTL's `container`, so check `baseElement`.
    const results = await axe(baseElement);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with asChild", async () => {
    const { baseElement } = render(
      <Portal asChild>
        <button type="button">Click</button>
      </Portal>,
    );
    const results = await axe(baseElement);
    expect(results).toHaveNoViolations();
  });
});
