import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Kbd } from "./Kbd";

describe("Kbd", () => {
  it("renders a native kbd element", () => {
    render(<Kbd>Esc</Kbd>);
    expect(screen.getByText("Esc").tagName).toBe("KBD");
  });

  it("applies the monospace font family token", () => {
    render(<Kbd>Esc</Kbd>);
    expect(screen.getByText("Esc")).toHaveStyle({
      fontFamily: "var(--dbm-font-family-mono)",
    });
  });

  it("forwards ref to the native kbd element", () => {
    const ref = createRef<HTMLElement>();
    render(<Kbd ref={ref}>Esc</Kbd>);
    expect(ref.current?.tagName).toBe("KBD");
  });

  it("applies className", () => {
    render(<Kbd className="custom">Esc</Kbd>);
    expect(screen.getByText("Esc")).toHaveClass("custom");
  });

  it("applies style", () => {
    render(<Kbd style={{ fontWeight: 700 }}>Esc</Kbd>);
    expect(screen.getByText("Esc")).toHaveStyle({ fontWeight: "700" });
  });

  it("applies id and data-testid", () => {
    render(
      <Kbd id="my-kbd" data-testid="kbd-1">
        Esc
      </Kbd>,
    );
    const el = screen.getByTestId("kbd-1");
    expect(el.id).toBe("my-kbd");
    expect(el.tagName).toBe("KBD");
  });

  it("applies aria-label for symbol-only content", () => {
    render(<Kbd aria-label="Command">⌘</Kbd>);
    expect(screen.getByLabelText("Command")).toHaveTextContent("⌘");
  });

  it("supports composing multiple Kbd for a chord", () => {
    render(
      <span>
        <Kbd>⌘</Kbd> + <Kbd>K</Kbd>
      </span>,
    );
    expect(screen.getByText("⌘").tagName).toBe("KBD");
    expect(screen.getByText("K").tagName).toBe("KBD");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Kbd>Esc</Kbd>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
