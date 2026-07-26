import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Center } from "./Center";

describe("Center", () => {
  it("renders a div by default", () => {
    render(<Center>Content</Center>);
    expect(screen.getByText("Content").tagName).toBe("DIV");
  });

  it("centers children with flex", () => {
    render(<Center>Content</Center>);
    expect(screen.getByText("Content")).toHaveStyle({
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });
  });

  it("renders inline-flex when inline is true", () => {
    render(<Center inline>Content</Center>);
    expect(screen.getByText("Content")).toHaveStyle({
      display: "inline-flex",
    });
  });

  it("renders as a different element via as", () => {
    render(<Center as="span">Content</Center>);
    expect(screen.getByText("Content").tagName).toBe("SPAN");
  });

  it("forwards ref to the underlying element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Center ref={ref}>Content</Center>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("applies className", () => {
    render(<Center className="custom">Content</Center>);
    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Center>Content</Center>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
