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

  it("sets a single inset as the base-breakpoint CSS custom property", () => {
    render(<Bleed inset={4}>Content</Bleed>);
    expect(screen.getByText("Content")).toHaveStyle({
      "--bleed-inset-base": "var(--dbm-space-4)",
    });
  });

  it("sets a responsive inset as per-breakpoint CSS custom properties", () => {
    render(
      <Bleed inset={{ base: 4, lg: 8 }} data-testid="bleed">
        Content
      </Bleed>,
    );
    const el = screen.getByTestId("bleed");
    expect(el.style.getPropertyValue("--bleed-inset-base")).toBe(
      "var(--dbm-space-4)",
    );
    expect(el.style.getPropertyValue("--bleed-inset-lg")).toBe(
      "var(--dbm-space-8)",
    );
  });

  it('applies the "inline" class by default', () => {
    render(<Bleed inset={4}>Content</Bleed>);
    expect(screen.getByText("Content").className).toMatch(/sideInline/);
  });

  it('applies the "block" class when side="block"', () => {
    render(
      <Bleed inset={6} side="block">
        Content
      </Bleed>,
    );
    expect(screen.getByText("Content").className).toMatch(/sideBlock/);
  });

  it('applies the "all" class when side="all"', () => {
    render(
      <Bleed inset={8} side="all">
        Content
      </Bleed>,
    );
    expect(screen.getByText("Content").className).toMatch(/sideAll/);
  });

  it("merges caller-provided style alongside the bleed custom properties", () => {
    render(
      <Bleed inset={4} style={{ backgroundColor: "red" }}>
        Content
      </Bleed>,
    );
    expect(screen.getByText("Content")).toHaveStyle({
      "--bleed-inset-base": "var(--dbm-space-4)",
      backgroundColor: "rgb(255, 0, 0)",
    });
  });

  it("lets a caller's own margin longhand override the computed bleed margin", () => {
    render(
      <Bleed inset={4} style={{ marginInlineStart: "0px" }}>
        Content
      </Bleed>,
    );
    expect(screen.getByText("Content")).toHaveStyle({
      marginInlineStart: "0px",
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

  it("applies id and data-testid", () => {
    render(
      <Bleed inset={4} id="bleed-1" data-testid="bleed-1">
        Content
      </Bleed>,
    );
    const el = screen.getByTestId("bleed-1");
    expect(el).toHaveAttribute("id", "bleed-1");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Bleed inset={4}>Content</Bleed>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
