import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Bleed } from "./Bleed";

describe("Bleed", () => {
  it("renders its children", () => {
    render(<Bleed inset={4}>Content</Bleed>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("applies a negative inline margin by default", () => {
    render(<Bleed inset={4}>Content</Bleed>);
    expect(screen.getByText("Content")).toHaveStyle({
      marginInlineStart: "calc(var(--dbm-space-4) * -1)",
      marginInlineEnd: "calc(var(--dbm-space-4) * -1)",
    });
  });

  it("applies a negative block margin when side is block", () => {
    render(
      <Bleed inset={6} side="block">
        Content
      </Bleed>,
    );
    expect(screen.getByText("Content")).toHaveStyle({
      marginBlockStart: "calc(var(--dbm-space-6) * -1)",
      marginBlockEnd: "calc(var(--dbm-space-6) * -1)",
    });
  });

  it("applies a negative margin on all sides when side is all", () => {
    render(
      <Bleed inset={8} side="all">
        Content
      </Bleed>,
    );
    expect(screen.getByText("Content")).toHaveStyle({
      marginBlockStart: "calc(var(--dbm-space-8) * -1)",
      marginBlockEnd: "calc(var(--dbm-space-8) * -1)",
      marginInlineStart: "calc(var(--dbm-space-8) * -1)",
      marginInlineEnd: "calc(var(--dbm-space-8) * -1)",
    });
  });

  it("merges caller-provided style with the bleed margin", () => {
    render(
      <Bleed inset={4} style={{ backgroundColor: "red" }}>
        Content
      </Bleed>,
    );
    expect(screen.getByText("Content")).toHaveStyle({
      marginInlineStart: "calc(var(--dbm-space-4) * -1)",
      backgroundColor: "rgb(255, 0, 0)",
    });
  });

  it("forwards ref to the underlying element", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Bleed ref={ref} inset={4}>
        Content
      </Bleed>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("applies className", () => {
    render(
      <Bleed inset={4} className="custom">
        Content
      </Bleed>,
    );
    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Bleed inset={4}>Content</Bleed>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
