import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Heading } from "./Heading";

describe("Heading", () => {
  it("defaults to level 2 (renders an h2)", () => {
    render(<Heading>Title</Heading>);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("renders the element matching each level", () => {
    const { rerender } = render(<Heading level={1}>Title</Heading>);
    expect(screen.getByRole("heading", { level: 1 }).tagName).toBe("H1");

    rerender(<Heading level={6}>Title</Heading>);
    expect(screen.getByRole("heading", { level: 6 }).tagName).toBe("H6");
  });

  it("defaults size to match the level when size is not given", () => {
    render(<Heading level={1}>Title</Heading>);
    expect(screen.getByRole("heading")).toHaveStyle({ fontSize: "var(--dbm-font-size-5xl)" });
  });

  it("allows size to be set independently of level", () => {
    render(
      <Heading level={2} size="xl">
        Title
      </Heading>,
    );
    const el = screen.getByRole("heading", { level: 2 });
    expect(el).toHaveStyle({ fontSize: "var(--dbm-font-size-xl)" });
  });

  it("applies weight and color tokens", () => {
    render(
      <Heading weight="semibold" color="danger">
        Title
      </Heading>,
    );
    const el = screen.getByRole("heading");
    expect(el).toHaveStyle({
      fontWeight: "var(--dbm-font-weight-semibold)",
      color: "var(--dbm-text-danger)",
    });
  });

  it("uses the editorial (secondary) font family", () => {
    render(<Heading>Title</Heading>);
    expect(screen.getByRole("heading")).toHaveStyle({
      fontFamily: "var(--dbm-font-family-secondary)",
    });
  });

  it("forwards ref to the underlying heading element", () => {
    const ref = createRef<HTMLHeadingElement>();
    render(<Heading ref={ref}>Title</Heading>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });

  it("forwards className and native props", () => {
    render(
      <Heading className="custom" data-testid="heading">
        Title
      </Heading>,
    );
    expect(screen.getByTestId("heading")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Heading level={1}>Accessible heading</Heading>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
