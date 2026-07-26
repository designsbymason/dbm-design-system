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
    const ref = createRef<HTMLParagraphElement>();
    render(<Text ref={ref}>Content</Text>);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it("forwards ref to the element rendered via `as`, not just the default p", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Text as="span" ref={ref}>
        Content
      </Text>,
    );
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("type-checks native props of the `as` element", () => {
    render(
      <Text as="label" htmlFor="my-input" data-testid="text">
        Label text
      </Text>,
    );
    expect(screen.getByTestId("text")).toHaveAttribute("for", "my-input");
  });

  it("applies the secondary (editorial) font family", () => {
    render(<Text fontFamily="secondary">Editorial copy</Text>);
    expect(screen.getByText("Editorial copy")).toHaveStyle({
      fontFamily: "var(--dbm-font-family-secondary)",
    });
  });

  it("defaults to the primary font family", () => {
    render(<Text>Default</Text>);
    expect(screen.getByText("Default")).toHaveStyle({
      fontFamily: "var(--dbm-font-family-primary)",
    });
  });

  it("applies line-clamp truncation when truncate is set", () => {
    render(
      <Text truncate={2} data-testid="text">
        Long text
      </Text>,
    );
    expect(screen.getByTestId("text")).toHaveStyle({ WebkitLineClamp: "2" });
  });

  it("does not apply line-clamp styles by default", () => {
    render(<Text data-testid="text">Short text</Text>);
    expect(screen.getByTestId("text").style.webkitLineClamp).toBe("");
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
