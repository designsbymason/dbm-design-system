import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { Code } from "./Code";

describe("Code", () => {
  it("renders a native code element", () => {
    render(<Code>pnpm install</Code>);
    expect(screen.getByText("pnpm install").tagName).toBe("CODE");
  });

  it("applies the monospace font family token", () => {
    render(<Code>pnpm install</Code>);
    expect(screen.getByText("pnpm install")).toHaveStyle({
      fontFamily: "var(--dbm-font-family-mono)",
    });
  });

  it("forwards ref to the native code element", () => {
    const ref = createRef<HTMLElement>();
    render(<Code ref={ref}>pnpm install</Code>);
    expect(ref.current?.tagName).toBe("CODE");
  });

  it("applies className", () => {
    render(<Code className="custom">pnpm install</Code>);
    expect(screen.getByText("pnpm install")).toHaveClass("custom");
  });

  it("forwards native code element props", () => {
    render(<Code lang="bash">pnpm install</Code>);
    expect(screen.getByText("pnpm install")).toHaveAttribute("lang", "bash");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Code>pnpm install</Code>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
