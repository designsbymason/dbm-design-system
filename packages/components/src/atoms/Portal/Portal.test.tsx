import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
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
});
