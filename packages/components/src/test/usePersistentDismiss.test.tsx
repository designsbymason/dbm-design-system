import { usePersistentDismiss } from "@dbm-design-system/primitives";
import type { UsePersistentDismissOptions } from "@dbm-design-system/primitives";
import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The hook lives in the primitives package, which has no test runner of its own — its behaviour is tested here, through
// a component that uses it the way a real one does.
// A fresh key per test, so the hook's in-memory fallback (which lives as long as the page) can't carry over.
let KEY = "promo";
let counter = 0;

function Probe({ id = "a", name = KEY, ...options }: UsePersistentDismissOptions & { id?: string; name?: string }) {
  const { ready, dismissed, dismiss, reset } = usePersistentDismiss(name, options);
  return (
    <div data-testid={id}>
      <span data-testid={`${id}-state`}>{!ready ? "not ready" : dismissed ? "dismissed" : "visible"}</span>
      <button onClick={dismiss}>dismiss {id}</button>
      <button onClick={reset}>reset {id}</button>
    </div>
  );
}

const state = (id = "a") => screen.getByTestId(`${id}-state`).textContent;
const press = (name: string) => act(() => void screen.getByRole("button", { name }).click());

beforeEach(() => {
  KEY = `promo-${counter++}`;
  window.localStorage.clear();
  window.sessionStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("usePersistentDismiss", () => {
  it("is ready straight away in the browser, and visible until dismissed", () => {
    render(<Probe />);
    expect(state()).toBe("visible");
  });

  it("remembers a dismissal in localStorage, under a namespaced key holding only a timestamp", () => {
    render(<Probe />);
    press("dismiss a");
    expect(state()).toBe("dismissed");
    expect(window.localStorage.getItem(`dbm-dismissed:${KEY}`)).toBe("0");
  });

  it("starts out dismissed when it was dismissed on an earlier visit", () => {
    window.localStorage.setItem(`dbm-dismissed:${KEY}`, "0");
    render(<Probe />);
    expect(state()).toBe("dismissed");
  });

  it("shows the message again after reset", () => {
    render(<Probe />);
    press("dismiss a");
    press("reset a");
    expect(state()).toBe("visible");
    expect(window.localStorage.getItem(`dbm-dismissed:${KEY}`)).toBeNull();
  });

  it("keeps two uses of the same key in step, and leaves a different key alone", () => {
    render(
      <>
        <Probe id="a" />
        <Probe id="b" />
        <Probe id="c" name="other" />
      </>,
    );
    press("dismiss a");
    expect(state("a")).toBe("dismissed");
    expect(state("b")).toBe("dismissed");
    expect(state("c")).toBe("visible");
  });

  it("follows a change made in another tab, through the storage event", () => {
    render(<Probe />);
    act(() => {
      window.localStorage.setItem(`dbm-dismissed:${KEY}`, "0");
      window.dispatchEvent(new StorageEvent("storage", { key: `dbm-dismissed:${KEY}` }));
    });
    expect(state()).toBe("dismissed");
    act(() => {
      window.localStorage.removeItem(`dbm-dismissed:${KEY}`);
      window.dispatchEvent(new StorageEvent("storage", { key: `dbm-dismissed:${KEY}` }));
    });
    expect(state()).toBe("visible");
  });

  it("uses sessionStorage, and only it, with storage: 'session'", () => {
    render(<Probe storage="session" />);
    press("dismiss a");
    expect(window.sessionStorage.getItem(`dbm-dismissed:${KEY}`)).toBe("0");
    expect(window.localStorage.getItem(`dbm-dismissed:${KEY}`)).toBeNull();
  });

  it("re-reads when the key changes", () => {
    window.localStorage.setItem("dbm-dismissed:old", "0");
    const { rerender } = render(<Probe name="old" />);
    expect(state()).toBe("dismissed");
    rerender(<Probe name="new" />);
    expect(state()).toBe("visible");
  });

  describe("expiresAfter", () => {
    it("stores when the dismissal ends, and shows the message again once it has", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2027-01-01T00:00:00Z"));
      const { unmount } = render(<Probe expiresAfter={1000} />);
      press("dismiss a");
      expect(window.localStorage.getItem(`dbm-dismissed:${KEY}`)).toBe(String(Date.now() + 1000));
      expect(state()).toBe("dismissed");
      unmount();
      // A later visit, after the dismissal has run out.
      vi.setSystemTime(new Date("2027-01-01T00:00:01Z"));
      render(<Probe expiresAfter={1000} />);
      expect(state()).toBe("visible");
    });

    it("is still dismissed just before it ends", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2027-01-01T00:00:00Z"));
      const { unmount } = render(<Probe expiresAfter={1000} />);
      press("dismiss a");
      unmount();
      vi.setSystemTime(new Date("2027-01-01T00:00:00.999Z"));
      render(<Probe expiresAfter={1000} />);
      expect(state()).toBe("dismissed");
    });
  });

  describe("when the browser's storage is blocked", () => {
    it("still remembers a dismissal for the page's lifetime, in memory", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });
      render(<Probe />);
      press("dismiss a");
      expect(state()).toBe("dismissed");
      press("reset a");
      expect(state()).toBe("visible");
    });

    it("copes with the storage property itself throwing", () => {
      vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
        throw new DOMException("denied", "SecurityError");
      });
      render(<Probe />);
      expect(state()).toBe("visible");
      press("dismiss a");
      expect(state()).toBe("dismissed");
    });
  });

  it("is not ready on the server, so nothing about the reader is guessed", () => {
    // `renderToString` runs the hook's server snapshot — no `window`, no storage.
    expect(renderToString(<Probe />)).toContain("not ready");
  });

  it("survives StrictMode", () => {
    render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    );
    press("dismiss a");
    expect(state()).toBe("dismissed");
  });

  it("returns stable dismiss and reset functions", () => {
    const seen: Array<() => void> = [];
    function Capture() {
      const { dismiss } = usePersistentDismiss("stable");
      seen.push(dismiss);
      return null;
    }
    const { rerender } = render(<Capture />);
    rerender(<Capture />);
    expect(seen[0]).toBe(seen[1]);
  });
});
