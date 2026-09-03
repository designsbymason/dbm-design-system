import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Divider } from "./Divider";
import type { DividerProps } from "./Divider.types";

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

  it("applies dotted line style", () => {
    render(<Divider data-testid="divider" variant="dotted" />);
    const line = screen.getByTestId("divider").firstElementChild as HTMLElement;
    expect(line.className).toMatch(/lineDottedHorizontal/);
  });

  it("applies the default tone to a solid line by default", () => {
    render(<Divider data-testid="divider" />);
    const line = screen.getByTestId("divider").firstElementChild as HTMLElement;
    expect(line.style.backgroundColor).toBe("var(--dbm-border-default)");
  });

  it("applies a semantic tone to a solid line", () => {
    render(<Divider data-testid="divider" tone="danger" />);
    const line = screen.getByTestId("divider").firstElementChild as HTMLElement;
    expect(line.style.backgroundColor).toBe("var(--dbm-border-danger)");
  });

  it("applies a semantic tone to a dashed line via border-block-end-color", () => {
    render(<Divider data-testid="divider" variant="dashed" tone="brand" />);
    const line = screen.getByTestId("divider").firstElementChild as HTMLElement;
    expect(line.style.borderBlockEndColor).toBe("var(--dbm-border-brand)");
  });

  it("applies a semantic tone to both double bars", () => {
    render(<Divider data-testid="divider" variant="double" tone="success" />);
    const group = screen.getByTestId("divider").firstElementChild as HTMLElement;
    const [first, second] = Array.from(group.children) as HTMLElement[];
    expect(first?.style.backgroundColor).toBe("var(--dbm-border-success)");
    expect(second?.style.backgroundColor).toBe("var(--dbm-border-success)");
  });

  it("applies thickness to a solid line", () => {
    render(<Divider data-testid="divider" thickness="thick" />);
    const line = screen.getByTestId("divider").firstElementChild as HTMLElement;
    expect(line.style.height).toBe("var(--dbm-border-width-4)");
  });

  it("applies thickness to a dashed line via border-block-end-width", () => {
    render(<Divider data-testid="divider" variant="dashed" thickness="regular" />);
    const line = screen.getByTestId("divider").firstElementChild as HTMLElement;
    expect(line.style.borderBlockEndWidth).toBe("var(--dbm-border-width-2)");
  });

  it("uses border-inline-end-width for a thickness-adjusted vertical dotted line", () => {
    render(
      <Divider
        data-testid="divider"
        variant="dotted"
        orientation="vertical"
        thickness="thick"
      />,
    );
    const line = screen.getByTestId("divider").firstElementChild as HTMLElement;
    expect(line.style.borderInlineEndWidth).toBe("var(--dbm-border-width-4)");
  });

  it("renders a double variant as a two-bar group", () => {
    render(<Divider data-testid="divider" variant="double" />);
    const group = screen.getByTestId("divider").firstElementChild as HTMLElement;
    expect(group.children).toHaveLength(2);
  });

  it("gives both double bars equal weight by default", () => {
    render(<Divider data-testid="divider" variant="double" />);
    const group = screen.getByTestId("divider").firstElementChild as HTMLElement;
    const [first, second] = Array.from(group.children) as HTMLElement[];
    expect(first?.style.height).toBe(second?.style.height);
    expect(first?.style.height).toBe("var(--dbm-border-width-1)");
  });

  it("makes the start bar thicker when emphasis is start", () => {
    render(<Divider data-testid="divider" variant="double" emphasis="start" />);
    const group = screen.getByTestId("divider").firstElementChild as HTMLElement;
    const [first, second] = Array.from(group.children) as HTMLElement[];
    expect(first?.style.height).toBe("var(--dbm-border-width-2)");
    expect(second?.style.height).toBe("var(--dbm-border-width-1)");
  });

  it("makes the end bar thicker when emphasis is end", () => {
    render(<Divider data-testid="divider" variant="double" emphasis="end" />);
    const group = screen.getByTestId("divider").firstElementChild as HTMLElement;
    const [first, second] = Array.from(group.children) as HTMLElement[];
    expect(first?.style.height).toBe("var(--dbm-border-width-1)");
    expect(second?.style.height).toBe("var(--dbm-border-width-2)");
  });

  it("steps the double bars' thickness together with a non-default base thickness", () => {
    // `emphasis` steps one bar up from `thickness` rather than a fixed
    // absolute weight, so the pairing scales together as `thickness`
    // changes — "regular", not "thick", so the step-up isn't capped.
    render(
      <Divider
        data-testid="divider"
        variant="double"
        thickness="regular"
        emphasis="start"
      />,
    );
    const group = screen.getByTestId("divider").firstElementChild as HTMLElement;
    const [first, second] = Array.from(group.children) as HTMLElement[];
    expect(first?.style.height).toBe("var(--dbm-border-width-4)");
    expect(second?.style.height).toBe("var(--dbm-border-width-2)");
  });

  it("caps the emphasized bar at thick when thickness is already thick", () => {
    render(
      <Divider
        data-testid="divider"
        variant="double"
        thickness="thick"
        emphasis="start"
      />,
    );
    const group = screen.getByTestId("divider").firstElementChild as HTMLElement;
    const [first, second] = Array.from(group.children) as HTMLElement[];
    expect(first?.style.height).toBe("var(--dbm-border-width-4)");
    expect(second?.style.height).toBe("var(--dbm-border-width-4)");
  });

  it("uses width instead of height for double bars when orientation is vertical", () => {
    render(
      <Divider
        data-testid="divider"
        variant="double"
        orientation="vertical"
        emphasis="start"
      />,
    );
    const group = screen.getByTestId("divider").firstElementChild as HTMLElement;
    const [first] = Array.from(group.children) as HTMLElement[];
    expect(first?.style.width).toBe("var(--dbm-border-width-2)");
    expect(first?.style.height).toBe("");
  });

  it("shortens the leading double-line group when align is start", () => {
    render(
      <Divider data-testid="divider" variant="double" label="OR" align="start" />,
    );
    const { children } = screen.getByTestId("divider");
    expect(children[0]?.className).toMatch(/lineShort/);
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

  it("applies id and data-testid", () => {
    render(<Divider id="divider-1" data-testid="divider-1" />);
    const el = screen.getByTestId("divider-1");
    expect(el).toHaveAttribute("id", "divider-1");
  });

  it("does not let a same-named consumer prop override the computed role/aria-orientation", () => {
    // Regression test for the {...props}-ordering bug class (see
    // 05-component-api-conventions.md §3) — {...props} must spread before
    // the computed role/aria-orientation attributes, not after, or a
    // same-named consumer prop silently wins. The deliberately-invalid
    // values are passed via a spread object cast through `unknown` (rather
    // than literal JSX attributes, and rather than `any`) so this
    // intentional bad input doesn't trip static TS/jsx-a11y checks that
    // only scan literal attribute values — this simulates a caller whose
    // own values bypass DividerProps' real types (an untyped JS consumer,
    // or data from an external source).
    const invalidProps = {
      role: "not-a-separator",
      "aria-orientation": "wrong-value",
    } as unknown as DividerProps;
    render(<Divider {...invalidProps} data-testid="divider" />);
    const el = screen.getByTestId("divider");
    expect(el).toHaveAttribute("role", "separator");
    expect(el).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("uses a string label as the accessible name by default", () => {
    render(<Divider label="OR" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-label", "OR");
  });

  it("lets an explicit aria-label override the label-derived fallback", () => {
    render(<Divider label="OR" aria-label="Alternative sign-in methods" />);
    expect(screen.getByRole("separator")).toHaveAttribute(
      "aria-label",
      "Alternative sign-in methods",
    );
  });

  it("doesn't set aria-label when there's no label", () => {
    render(<Divider />);
    expect(screen.getByRole("separator")).not.toHaveAttribute("aria-label");
  });

  it("doesn't derive aria-label from a non-string label", () => {
    render(<Divider label={<span>OR</span>} />);
    expect(screen.getByRole("separator")).not.toHaveAttribute("aria-label");
  });

  it("treats an empty-string aria-label as unset, still falling back to the label", () => {
    // Storybook's convention requires every controllable arg to have an
    // explicit default (an undefined arg renders as an inert placeholder
    // instead of a live control) — Divider's own Playground story defaults
    // `aria-label` to "". This test guards that default from silently
    // suppressing the real fallback behavior.
    render(<Divider label="OR" aria-label="" />);
    expect(screen.getByRole("separator")).toHaveAttribute("aria-label", "OR");
  });

  it("treats an empty-string label as no label (single line, no gap)", () => {
    render(<Divider label="" data-testid="divider" />);
    const el = screen.getByTestId("divider");
    expect(el.children).toHaveLength(1);
  });

  it("treats a boolean label as no label (single line, no gap)", () => {
    // Matches React's own behavior for booleans (renders nothing) — guards
    // the common `label={condition && "OR"}` pattern from leaving a
    // labeled-but-invisible gap when `condition` is false.
    render(<Divider label={false} data-testid="divider" />);
    const el = screen.getByTestId("divider");
    expect(el.children).toHaveLength(1);
  });

  it("doesn't set aria-label for an empty-string label", () => {
    render(<Divider label="" />);
    expect(screen.getByRole("separator")).not.toHaveAttribute("aria-label");
  });

  it("centers the label by default (both line segments share flex growth)", () => {
    render(<Divider label="OR" data-testid="divider" />);
    const { children } = screen.getByTestId("divider");
    expect(children[0]?.className).not.toMatch(/lineShort/);
    expect(children[2]?.className).not.toMatch(/lineShort/);
  });

  it('shortens the leading line when align="start"', () => {
    render(<Divider label="OR" align="start" data-testid="divider" />);
    const { children } = screen.getByTestId("divider");
    expect(children[0]?.className).toMatch(/lineShort/);
    expect(children[2]?.className).not.toMatch(/lineShort/);
  });

  it('shortens the trailing line when align="end"', () => {
    render(<Divider label="OR" align="end" data-testid="divider" />);
    const { children } = screen.getByTestId("divider");
    expect(children[0]?.className).not.toMatch(/lineShort/);
    expect(children[2]?.className).toMatch(/lineShort/);
  });

  it("ignores align when there's no label", () => {
    render(<Divider align="start" data-testid="divider" />);
    const { children } = screen.getByTestId("divider");
    expect(children[0]?.className).not.toMatch(/lineShort/);
  });

  it("has no accessibility violations without a label", async () => {
    const { container } = render(<Divider />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with a label", async () => {
    const { container } = render(<Divider label="OR" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations with a vertical, labeled divider", async () => {
    const { container } = render(<Divider orientation="vertical" label="OR" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
