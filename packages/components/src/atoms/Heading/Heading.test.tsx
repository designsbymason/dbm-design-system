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

  it("defaults to weight=bold and color=primary", () => {
    render(<Heading>Title</Heading>);
    const el = screen.getByRole("heading");
    expect(el).toHaveStyle({
      fontWeight: "var(--dbm-font-weight-bold)",
      color: "var(--dbm-text-primary)",
    });
  });

  it("uses the editorial (secondary) font family by default", () => {
    render(<Heading>Title</Heading>);
    expect(screen.getByRole("heading")).toHaveStyle({
      fontFamily: "var(--dbm-font-family-secondary)",
    });
  });

  it("applies the primary font family when set", () => {
    render(<Heading fontFamily="primary">Title</Heading>);
    expect(screen.getByRole("heading")).toHaveStyle({
      fontFamily: "var(--dbm-font-family-primary)",
    });
  });

  it("applies line-clamp truncation when truncate is set", () => {
    render(<Heading truncate={2}>Title</Heading>);
    expect(screen.getByRole("heading")).toHaveStyle({ WebkitLineClamp: "2" });
  });

  it("does not apply line-clamp styles by default", () => {
    render(<Heading>Title</Heading>);
    expect(screen.getByRole("heading").style.webkitLineClamp).toBe("");
  });

  it("renders as the element passed via `as`, applying role=heading and aria-level", () => {
    render(
      <Heading level={3} as="div" data-testid="heading">
        Card title
      </Heading>,
    );
    const el = screen.getByTestId("heading");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveAttribute("role", "heading");
    expect(el).toHaveAttribute("aria-level", "3");
  });

  it("does not add role or aria-level when as is not set (native heading element)", () => {
    render(<Heading level={3}>Title</Heading>);
    const el = screen.getByRole("heading", { level: 3 });
    expect(el).not.toHaveAttribute("role");
    expect(el).not.toHaveAttribute("aria-level");
  });

  it("forwards ref to the underlying heading element", () => {
    const ref = createRef<HTMLHeadingElement>();
    render(<Heading ref={ref}>Title</Heading>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });

  it("forwards ref to the element rendered via `as`, not just the default heading tag", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Heading as="div" ref={ref}>
        Card title
      </Heading>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards className and native props", () => {
    render(
      <Heading className="custom" data-testid="heading">
        Title
      </Heading>,
    );
    expect(screen.getByTestId("heading")).toHaveClass("custom");
  });

  it("is discoverable via its heading role/level when rendered via `as`", () => {
    render(
      <Heading level={3} as="div">
        Card title
      </Heading>,
    );
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Heading level={1}>Accessible heading</Heading>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations when rendered via `as` with the ARIA fallback", async () => {
    const { container } = render(
      <Heading level={2} as="div">
        Accessible card title
      </Heading>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
