import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Heading } from "./Heading";
import type { HeadingProps } from "./Heading.types";

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

  it("supports the full font-size scale, including xs/sm/base (matching Text's scale)", () => {
    const { rerender } = render(
      <Heading level={2} size="xs">
        Title
      </Heading>,
    );
    expect(screen.getByRole("heading")).toHaveStyle({
      fontSize: "var(--dbm-font-size-xs)",
    });

    rerender(
      <Heading level={2} size="sm">
        Title
      </Heading>,
    );
    expect(screen.getByRole("heading")).toHaveStyle({
      fontSize: "var(--dbm-font-size-sm)",
    });

    rerender(
      <Heading level={2} size="base">
        Title
      </Heading>,
    );
    expect(screen.getByRole("heading")).toHaveStyle({
      fontSize: "var(--dbm-font-size-base)",
    });
  });

  it("applies no text-align by default", () => {
    render(<Heading>Title</Heading>);
    expect(screen.getByRole("heading").style.textAlign).toBe("");
  });

  it("applies align via the text-align property", () => {
    const { rerender } = render(<Heading align="center">Title</Heading>);
    expect(screen.getByRole("heading")).toHaveStyle({ textAlign: "center" });

    rerender(<Heading align="end">Title</Heading>);
    expect(screen.getByRole("heading")).toHaveStyle({ textAlign: "end" });

    rerender(<Heading align="start">Title</Heading>);
    expect(screen.getByRole("heading")).toHaveStyle({ textAlign: "start" });
  });

  it("applies no text-wrap by default", () => {
    render(<Heading>Title</Heading>);
    expect(screen.getByRole("heading").style.textWrap).toBe("");
  });

  it("applies wrap via the text-wrap property", () => {
    const { rerender } = render(<Heading wrap="balance">Title</Heading>);
    expect(screen.getByRole("heading")).toHaveStyle({ textWrap: "balance" });

    rerender(<Heading wrap="pretty">Title</Heading>);
    expect(screen.getByRole("heading")).toHaveStyle({ textWrap: "pretty" });

    rerender(<Heading wrap="nowrap">Title</Heading>);
    expect(screen.getByRole("heading")).toHaveStyle({ textWrap: "nowrap" });
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

  it("does not let a same-named consumer prop override the computed role/aria-level", () => {
    // Regression test for the {...props}-ordering bug class (see
    // 05-component-api-conventions.md §3) — {...props} must spread before
    // the computed role/aria-level attributes, not after, or a same-named
    // consumer prop silently wins. The deliberately-invalid values are
    // passed via a spread object cast through `unknown` (rather than literal
    // JSX attributes, and rather than `any`) so this intentional bad input
    // doesn't trip static TS/jsx-a11y checks that only scan literal
    // attribute values — this simulates a caller whose own values bypass
    // HeadingProps' real types (an untyped JS consumer, or data from an
    // external source).
    const invalidProps = {
      role: "banner",
      "aria-level": 99,
    } as unknown as HeadingProps<"div">;
    render(
      <Heading level={3} as="div" data-testid="heading" {...invalidProps}>
        Card title
      </Heading>,
    );
    const el = screen.getByTestId("heading");
    expect(el).toHaveAttribute("role", "heading");
    expect(el).toHaveAttribute("aria-level", "3");
  });

  it("warns once in development when as is set to an actual heading tag", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <Heading level={2} as="h1">
        Title
      </Heading>,
    );
    rerender(
      <Heading level={2} as="h1">
        Title (renamed)
      </Heading>,
    );

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('`as="h1"` renders a native heading element'),
    );
    consoleWarnSpy.mockRestore();
  });

  it("does not warn when as is set to a non-heading element", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Heading level={2} as="div">
        Title
      </Heading>,
    );
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it("warns once in development when wrap=\"nowrap\" is combined with a multi-line truncate", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { rerender } = render(
      <Heading wrap="nowrap" truncate={2}>
        Title
      </Heading>,
    );
    rerender(
      <Heading wrap="nowrap" truncate={2}>
        Title (renamed)
      </Heading>,
    );

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('`wrap="nowrap"` conflicts with `truncate={2}`'),
    );
    consoleWarnSpy.mockRestore();
  });

  it("does not warn when wrap=\"nowrap\" is combined with truncate={1}", () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Heading wrap="nowrap" truncate={1}>
        Title
      </Heading>,
    );
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
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

  it("forwards id", () => {
    render(<Heading id="page-title">Title</Heading>);
    expect(screen.getByRole("heading")).toHaveAttribute("id", "page-title");
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
