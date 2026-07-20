import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Stack } from "./Stack";

describe("Stack", () => {
  it("renders children", () => {
    render(
      <Stack>
        <span>Item</span>
      </Stack>,
    );
    expect(screen.getByText("Item")).toBeInTheDocument();
  });

  it("defaults to column direction via the CSS custom property", () => {
    render(<Stack data-testid="stack" />);
    expect(screen.getByTestId("stack")).toHaveStyle({ "--stack-direction-base": "column" });
  });

  it("applies row direction via the CSS custom property", () => {
    render(<Stack data-testid="stack" direction="row" />);
    expect(screen.getByTestId("stack")).toHaveStyle({ "--stack-direction-base": "row" });
  });

  it("applies gap as a token-driven CSS variable", () => {
    render(<Stack data-testid="stack" gap={4} />);
    expect(screen.getByTestId("stack")).toHaveStyle({ "--stack-gap-base": "var(--dbm-space-4)" });
  });

  it("applies align and justify via CSS custom properties", () => {
    render(<Stack data-testid="stack" align="center" justify="between" />);
    const el = screen.getByTestId("stack");
    expect(el).toHaveStyle({
      "--stack-align-base": "center",
      "--stack-justify-base": "space-between",
    });
  });

  it("defaults to align=stretch and justify=start", () => {
    render(<Stack data-testid="stack" />);
    const el = screen.getByTestId("stack");
    expect(el).toHaveStyle({
      "--stack-align-base": "stretch",
      "--stack-justify-base": "flex-start",
    });
  });

  it("does not wrap by default", () => {
    render(<Stack data-testid="stack" />);
    expect(screen.getByTestId("stack")).toHaveStyle({ "--stack-wrap-base": "nowrap" });
  });

  it("applies wrap", () => {
    render(<Stack data-testid="stack" wrap />);
    expect(screen.getByTestId("stack")).toHaveStyle({ "--stack-wrap-base": "wrap" });
  });

  it("sets a responsive direction as per-breakpoint CSS variables", () => {
    render(<Stack data-testid="stack" direction={{ base: "column", md: "row" }} />);
    const el = screen.getByTestId("stack");
    expect(el.style.getPropertyValue("--stack-direction-base")).toBe("column");
    expect(el.style.getPropertyValue("--stack-direction-md")).toBe("row");
  });

  it("sets a responsive gap, align, justify, and wrap as per-breakpoint CSS variables", () => {
    render(
      <Stack
        data-testid="stack"
        gap={{ base: 2, lg: 8 }}
        align={{ base: "start", md: "center" }}
        justify={{ base: "start", md: "between" }}
        wrap={{ base: true, lg: false }}
      />,
    );
    const el = screen.getByTestId("stack");
    expect(el.style.getPropertyValue("--stack-gap-base")).toBe("var(--dbm-space-2)");
    expect(el.style.getPropertyValue("--stack-gap-lg")).toBe("var(--dbm-space-8)");
    expect(el.style.getPropertyValue("--stack-align-base")).toBe("flex-start");
    expect(el.style.getPropertyValue("--stack-align-md")).toBe("center");
    expect(el.style.getPropertyValue("--stack-justify-base")).toBe("flex-start");
    expect(el.style.getPropertyValue("--stack-justify-md")).toBe("space-between");
    expect(el.style.getPropertyValue("--stack-wrap-base")).toBe("wrap");
    expect(el.style.getPropertyValue("--stack-wrap-lg")).toBe("nowrap");
  });

  it("renders as the element passed via `as`, keeping Stack's own layout behavior", () => {
    render(
      <Stack as="ul" data-testid="stack" gap={2}>
        <li>One</li>
      </Stack>,
    );
    const el = screen.getByTestId("stack");
    expect(el.tagName).toBe("UL");
    expect(el).toHaveStyle({ display: "flex" });
  });

  it("forwards ref to the element rendered via `as`, not just the default div", () => {
    const ref = createRef<HTMLUListElement>();
    render(
      <Stack as="ul" ref={ref}>
        <li>One</li>
      </Stack>,
    );
    expect(ref.current).toBeInstanceOf(HTMLUListElement);
  });

  it("inserts the divider element between every child, not before the first or after the last", () => {
    render(
      <Stack divider={<hr data-testid="divider" />}>
        <span>One</span>
        <span>Two</span>
        <span>Three</span>
      </Stack>,
    );
    expect(screen.getAllByTestId("divider")).toHaveLength(2);
  });

  it("does not insert dividers when divider is not provided", () => {
    render(
      <Stack>
        <span>One</span>
        <span>Two</span>
      </Stack>,
    );
    expect(screen.queryAllByRole("separator")).toHaveLength(0);
  });

  it("forwards ref to the underlying div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Stack ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards className and merges custom style with the gap variable", () => {
    render(<Stack data-testid="stack" className="custom" style={{ padding: 8 }} />);
    const el = screen.getByTestId("stack");
    expect(el).toHaveClass("custom");
    expect(el).toHaveStyle({ padding: "8px" });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Stack>
        <button type="button">Accessible</button>
      </Stack>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
