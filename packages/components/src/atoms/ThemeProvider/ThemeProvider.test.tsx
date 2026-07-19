import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "./ThemeProvider";
import { useTheme } from "./useTheme";

afterEach(() => {
  delete document.documentElement.dataset.theme;
  document.documentElement.className = "";
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

  it("restores the previous document-level theme when unmounted (nesting)", () => {
    document.documentElement.dataset.theme = "emerald-light";

    const { unmount } = render(
      <ThemeProvider brand="purple" mode="dark">
        <div />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.theme).toBe("purple-dark");

    unmount();
    expect(document.documentElement.dataset.theme).toBe("emerald-light");
  });

  it("removes the document-level theme attribute on unmount when none existed before", () => {
    const { unmount } = render(
      <ThemeProvider brand="purple" mode="dark">
        <div />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset.theme).toBe("purple-dark");

    unmount();
    expect(document.documentElement.dataset.theme).toBeUndefined();
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

  it("does not add a transition class on initial mount", () => {
    render(
      <ThemeProvider brand="purple" mode="light">
        <div />
      </ThemeProvider>,
    );
    expect(document.documentElement.className).toBe("");
  });

  it("briefly adds a transition class to the document element on a later theme change, then removes it", () => {
    vi.useFakeTimers();

    const { rerender } = render(
      <ThemeProvider brand="purple" mode="light">
        <div />
      </ThemeProvider>,
    );
    expect(document.documentElement.className).toBe("");

    rerender(
      <ThemeProvider brand="purple" mode="dark">
        <div />
      </ThemeProvider>,
    );
    expect(document.documentElement.className).not.toBe("");

    vi.runAllTimers();
    expect(document.documentElement.className).toBe("");

    vi.useRealTimers();
  });
});

describe("useTheme", () => {
  it("throws when used outside a ThemeProvider", () => {
    const Consumer = () => {
      useTheme();
      return null;
    };
    // React logs the thrown render error to console.error even though this test catches
    // it via toThrow — silence that expected noise for the duration of this test only.
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(/useTheme must be used within a ThemeProvider/);
    consoleErrorSpy.mockRestore();
  });

  it("exposes the active brand, mode, and resolvedMode to descendants", () => {
    let observed: ReturnType<typeof useTheme> | undefined;
    const Consumer = () => {
      observed = useTheme();
      return null;
    };

    render(
      <ThemeProvider brand="emerald" mode="dark">
        <Consumer />
      </ThemeProvider>,
    );

    expect(observed).toEqual({ brand: "emerald", mode: "dark", resolvedMode: "dark" });
  });
});
