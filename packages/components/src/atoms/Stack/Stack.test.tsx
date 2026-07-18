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

  it("defaults to column direction", () => {
    render(<Stack data-testid="stack" />);
    expect(screen.getByTestId("stack")).toHaveStyle({ flexDirection: "column" });
  });

  it("applies row direction", () => {
    render(<Stack data-testid="stack" direction="row" />);
    expect(screen.getByTestId("stack")).toHaveStyle({ flexDirection: "row" });
  });

  it("applies gap as a token-driven CSS variable", () => {
    render(<Stack data-testid="stack" gap={4} />);
    expect(screen.getByTestId("stack")).toHaveStyle({ gap: "var(--dbm-space-4)" });
  });

  it("applies align and justify", () => {
    render(<Stack data-testid="stack" align="center" justify="between" />);
    const el = screen.getByTestId("stack");
    expect(el).toHaveStyle({ alignItems: "center", justifyContent: "space-between" });
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
