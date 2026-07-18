import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "./ThemeProvider";

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("ThemeProvider", () => {
  it("renders children", () => {
    render(
      <ThemeProvider brand="purple" mode="light">
        <button type="button">Click</button>
      </ThemeProvider>,
    );
    expect(screen.getByRole("button", { name: "Click" })).toBeInTheDocument();
  });

  it("sets data-theme on the document element from brand + mode", () => {
    render(
      <ThemeProvider brand="emerald" mode="dark">
        <div />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.theme).toBe("emerald-dark");
  });

  it('defaults to brand="purple"', () => {
    render(
      <ThemeProvider mode="light">
        <div />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.theme).toBe("purple-light");
  });

  it("forwards ref to the wrapper element", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ThemeProvider ref={ref} brand="purple" mode="light">
        <div />
      </ThemeProvider>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("forwards className and native div props", () => {
    render(
      <ThemeProvider brand="purple" mode="light" className="custom" data-testid="provider">
        <div />
      </ThemeProvider>,
    );
    const el = screen.getByTestId("provider");
    expect(el).toHaveClass("custom");
  });

  it('resolves mode="system" from prefers-color-scheme and updates live on change', async () => {
    const listeners: Array<(event: MediaQueryListEvent) => void> = [];
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: true, // pretend the OS prefers dark
        media: query,
        addEventListener: (_event: string, cb: (event: MediaQueryListEvent) => void) => {
          listeners.push(cb);
        },
        removeEventListener: vi.fn(),
      })),
    );

    render(
      <ThemeProvider brand="purple" mode="system">
        <div />
      </ThemeProvider>,
    );

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("purple-dark"));

    listeners.forEach((listener) => listener({ matches: false } as MediaQueryListEvent));

    await waitFor(() => expect(document.documentElement.dataset.theme).toBe("purple-light"));

    vi.unstubAllGlobals();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ThemeProvider brand="purple" mode="light">
        <button type="button">Accessible content</button>
      </ThemeProvider>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
