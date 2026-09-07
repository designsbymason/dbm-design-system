import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Highlight } from "./Highlight";

describe("Highlight", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("applies style", () => {
    render(<Highlight style={{ fontWeight: 700 }}>design</Highlight>);
    expect(screen.getByText("design")).toHaveStyle({ fontWeight: "700" });
  });

  it("applies id and data-testid", () => {
    render(
      <Highlight id="my-highlight" data-testid="highlight-1">
        design
      </Highlight>,
    );
    const el = screen.getByTestId("highlight-1");
    expect(el.id).toBe("my-highlight");
    expect(el.tagName).toBe("MARK");
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

  describe("query (auto-matching)", () => {
    it("wraps a matching substring and leaves the rest as plain text", () => {
      render(<Highlight query="design">Results for design system</Highlight>);
      const mark = screen.getByText("design");
      expect(mark.tagName).toBe("MARK");
      expect(mark.parentElement?.textContent).toBe("Results for design system");
    });

    it("matches case-insensitively by default", () => {
      render(<Highlight query="DESIGN">Results for design system</Highlight>);
      expect(screen.getByText("design").tagName).toBe("MARK");
    });

    it("does not match a different case when caseSensitive is true", () => {
      const { container } = render(
        <Highlight query="DESIGN" caseSensitive>
          Results for design system
        </Highlight>,
      );
      expect(container.querySelector("mark")).not.toBeInTheDocument();
    });

    it("wraps every match when query is an array", () => {
      render(
        <Highlight query={["design", "agent"]}>A design system for agents</Highlight>,
      );
      expect(screen.getByText("design").tagName).toBe("MARK");
      expect(screen.getByText("agent").tagName).toBe("MARK");
    });

    it("wraps every occurrence of a repeated match", () => {
      render(<Highlight query="design">design system, design tokens</Highlight>);
      const marks = screen.getAllByText("design");
      expect(marks).toHaveLength(2);
      expect(marks.every((el) => el.tagName === "MARK")).toBe(true);
    });

    it("renders no <mark> at all when nothing matches", () => {
      const { container } = render(
        <Highlight query="nonexistent">Results for design system</Highlight>,
      );
      expect(container.querySelector("mark")).not.toBeInTheDocument();
    });

    it("prefers the longest match when one query is a prefix of another", () => {
      render(
        <Highlight query={["design", "designer"]}>
          Ask a designer about the design
        </Highlight>,
      );
      const marks = screen.getAllByText(/design/i);
      expect(marks).toHaveLength(2);
      expect(marks.map((el) => el.textContent)).toEqual(["designer", "design"]);
      expect(marks.every((el) => el.tagName === "MARK")).toBe(true);
    });

    it("escapes regex-special characters in the query", () => {
      render(<Highlight query="a.b*c">Formula is a.b*c exactly</Highlight>);
      expect(screen.getByText("a.b*c").tagName).toBe("MARK");
    });

    it("forwards ref when query produces exactly one match", () => {
      const ref = createRef<HTMLElement>();
      render(
        <Highlight ref={ref} query="design">
          Results for design system
        </Highlight>,
      );
      expect(ref.current?.tagName).toBe("MARK");
      expect(ref.current?.textContent).toBe("design");
    });

    it("does not attach ref when query produces multiple matches", () => {
      const ref = createRef<HTMLElement>();
      render(
        <Highlight ref={ref} query="design">
          design system, design tokens
        </Highlight>,
      );
      expect(ref.current).toBeNull();
    });

    it("has no accessibility violations with multiple auto-matched marks", async () => {
      const { container } = render(
        <Highlight query="design">design system, design tokens</Highlight>,
      );
      expect((await axe(container)).violations).toHaveLength(0);
    });

    it("warns in development and falls back to highlighting the whole children when children isn't a string", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const { container } = render(
        <Highlight query="design">
          <span>design</span>
        </Highlight>,
      );
      const mark = container.querySelector("mark");
      expect(mark?.querySelector("span")?.textContent).toBe("design");
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("requires `children` to be a plain string"));
    });
  });
});
