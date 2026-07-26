import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Divider } from "./Divider";

describe("Divider", () => {
  it('renders with role="separator"', () => {
    render(<Divider />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("defaults to horizontal orientation", () => {
    render(<Divider />);
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
  });

  it("applies vertical orientation", () => {
    render(<Divider orientation="vertical" />);
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
  });

  it("renders a single line when no label is given", () => {
    render(<Divider />);
    expect(screen.getByRole("separator").children).toHaveLength(1);
  });

  it("renders the label between two line segments when given", () => {
    render(<Divider label="OR" />);
    const separator = screen.getByRole("separator");
    expect(separator.children).toHaveLength(3);
    expect(screen.getByText("OR")).toBeInTheDocument();
  });

  it("renders a label with vertical orientation", () => {
    render(<Divider orientation="vertical" label="OR" />);
    const separator = screen.getByRole("separator");
    expect(separator).toHaveAttribute("aria-orientation", "vertical");
    expect(separator.children).toHaveLength(3);
    expect(screen.getByText("OR")).toBeInTheDocument();
  });

  it("applies solid line style by default", () => {
    render(<Divider data-testid="divider" />);
    const line = screen.getByTestId("divider").firstElementChild as HTMLElement;
    expect(line.className).toMatch(/line/);
  });

  it("applies dashed line style", () => {
    render(<Divider data-testid="divider" variant="dashed" />);
    const line = screen.getByTestId("divider").firstElementChild as HTMLElement;
    expect(line.className).toMatch(/lineDashedHorizontal/);
  });

  it("sets a responsive orientation as per-breakpoint CSS variables driving the visual layout", () => {
    render(
      <Divider
        data-testid="divider"
        orientation={{ base: "horizontal", lg: "vertical" }}
      />,
    );
    const el = screen.getByTestId("divider");
    expect(el.style.getPropertyValue("--divider-flex-direction-base")).toBe(
      "row",
    );
    expect(el.style.getPropertyValue("--divider-flex-direction-lg")).toBe(
      "column",
    );
    expect(el.style.getPropertyValue("--divider-width-base")).toBe("100%");
    expect(el.style.getPropertyValue("--divider-width-lg")).toBe("auto");
    expect(el.style.getPropertyValue("--divider-height-base")).toBe("auto");
    expect(el.style.getPropertyValue("--divider-height-lg")).toBe("100%");
  });

  it("resolves aria-orientation from a responsive map via matchMedia, defaulting to base", () => {
    render(<Divider orientation={{ base: "horizontal", lg: "vertical" }} />);
    // jsdom's default matchMedia (see src/test/setup.ts) reports no query as
    // matching, so this resolves to the `base` entry.
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
  });

  it("updates aria-orientation live when a matchMedia change listener fires", async () => {
    const listeners: Record<string, Array<() => void>> = {};
    const currentMatches: Record<string, boolean> = {
      "(min-width: 1024px)": true,
    };

    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        get matches() {
          return currentMatches[query] ?? false;
        },
        media: query,
        addEventListener: (_event: string, cb: () => void) => {
          (listeners[query] ??= []).push(cb);
        },
        removeEventListener: vi.fn(),
      })),
    );

    render(<Divider orientation={{ base: "horizontal", lg: "vertical" }} />);
    await waitFor(() =>
      expect(screen.getByRole("separator")).toHaveAttribute(
        "aria-orientation",
        "vertical",
      ),
    );

    // Simulate the viewport dropping back below the lg breakpoint.
    currentMatches["(min-width: 1024px)"] = false;
    listeners["(min-width: 1024px)"]?.forEach((cb) => cb());

    await waitFor(() =>
      expect(screen.getByRole("separator")).toHaveAttribute(
        "aria-orientation",
        "horizontal",
      ),
    );

    vi.unstubAllGlobals();
  });

  it("forwards ref to the underlying div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Divider ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards className and native props", () => {
    render(<Divider className="custom" data-testid="divider" />);
    expect(screen.getByTestId("divider")).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Divider label="OR" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
