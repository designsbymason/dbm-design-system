import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Text } from "./Text";

describe("Text", () => {
  it("renders a <p> by default", () => {
    render(<Text>Body copy</Text>);
    expect(screen.getByText("Body copy").tagName).toBe("P");
  });

  it("renders as the element passed via `as`", () => {
    render(<Text as="span">Inline</Text>);
    expect(screen.getByText("Inline").tagName).toBe("SPAN");
  });

  it("applies size as a font-size token", () => {
    render(<Text size="2xl">Large</Text>);
    expect(screen.getByText("Large")).toHaveStyle({ fontSize: "var(--dbm-font-size-2xl)" });
  });

  it("applies weight as a font-weight token", () => {
    render(<Text weight="bold">Bold</Text>);
    expect(screen.getByText("Bold")).toHaveStyle({ fontWeight: "var(--dbm-font-weight-bold)" });
  });

  it("applies color as a semantic text-color token", () => {
    render(<Text color="danger">Error text</Text>);
    expect(screen.getByText("Error text")).toHaveStyle({ color: "var(--dbm-text-danger)" });
  });

  it("defaults to size=base, weight=regular, color=primary", () => {
    render(<Text>Default</Text>);
    const el = screen.getByText("Default");
    expect(el).toHaveStyle({
      fontSize: "var(--dbm-font-size-base)",
      fontWeight: "var(--dbm-font-weight-regular)",
      color: "var(--dbm-text-primary)",
    });
  });

  it("forwards ref to the underlying element", () => {
    const ref = createRef<HTMLElement>();
    render(<Text ref={ref}>Content</Text>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it("forwards className and native props", () => {
    render(
      <Text className="custom" data-testid="text">
        Content
      </Text>,
    );
    expect(screen.getByTestId("text")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Text>Accessible body copy</Text>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
