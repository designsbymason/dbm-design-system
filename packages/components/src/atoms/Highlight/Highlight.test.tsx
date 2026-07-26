import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Highlight } from "./Highlight";

describe("Highlight", () => {
  it("renders a native mark element", () => {
    render(<Highlight>design</Highlight>);
    expect(screen.getByText("design").tagName).toBe("MARK");
  });

  it("defaults to the warning tone", () => {
    render(<Highlight>design</Highlight>);
    expect(screen.getByText("design")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-warning-subtle)",
      color: "var(--dbm-text-warning)",
    });
  });

  it("applies a token-driven background/text pairing per tone", () => {
    render(<Highlight tone="danger">deprecated</Highlight>);
    expect(screen.getByText("deprecated")).toHaveStyle({
      backgroundColor: "var(--dbm-bg-danger-subtle)",
      color: "var(--dbm-text-danger)",
    });
  });

  it("forwards ref to the native mark element", () => {
    const ref = createRef<HTMLElement>();
    render(<Highlight ref={ref}>design</Highlight>);
    expect(ref.current?.tagName).toBe("MARK");
  });

  it("applies className", () => {
    render(<Highlight className="custom">design</Highlight>);
    expect(screen.getByText("design")).toHaveClass("custom");
  });

  it("has no accessibility violations across tones", async () => {
    const { container, rerender } = render(
      <Highlight tone="warning">design</Highlight>,
    );
    expect((await axe(container)).violations).toHaveLength(0);

    for (const tone of ["success", "info", "danger"] as const) {
      rerender(<Highlight tone={tone}>design</Highlight>);
      expect((await axe(container)).violations).toHaveLength(0);
    }
  });
});
