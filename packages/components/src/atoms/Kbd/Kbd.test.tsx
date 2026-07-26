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
