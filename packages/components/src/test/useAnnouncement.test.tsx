import { useAnnouncement } from "@dbm-design-system/primitives";
import { act, render, screen } from "@testing-library/react";
import { StrictMode, useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The hook lives in the primitives package, which has no test runner of its own — its behaviour is
// tested here, through a component that uses it the way a real one does.
function Announcer({ text }: { text?: string }) {
  const { message, announce } = useAnnouncement();
  useEffect(() => {
    if (text) announce(text);
  }, [text, announce]);
  return <div role="status">{message}</div>;
}

afterEach(() => vi.useRealTimers());

describe("useAnnouncement", () => {
  it("starts empty, fills a moment after announce is called, then clears", async () => {
    vi.useFakeTimers();
    render(<Announcer text="Page 3 of 20" />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    await act(async () => void vi.advanceTimersByTime(99));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    await act(async () => void vi.advanceTimersByTime(1));
    expect(screen.getByRole("status")).toHaveTextContent("Page 3 of 20");
    await act(async () => void vi.advanceTimersByTime(999));
    expect(screen.getByRole("status")).toHaveTextContent("Page 3 of 20");
    await act(async () => void vi.advanceTimersByTime(1));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("replaces a pending message when announce is called again", async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Announcer text="First" />);
    await act(async () => void vi.advanceTimersByTime(50));
    rerender(<Announcer text="Second" />);
    await act(async () => void vi.advanceTimersByTime(100));
    expect(screen.getByRole("status")).toHaveTextContent("Second");
  });

  it("announces a second message after the first has cleared", async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Announcer text="First" />);
    await act(async () => void vi.advanceTimersByTime(100 + 1000));
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    rerender(<Announcer text="Second" />);
    await act(async () => void vi.advanceTimersByTime(100));
    expect(screen.getByRole("status")).toHaveTextContent("Second");
  });

  it("gives announce a stable identity across renders", () => {
    const seen = new Set<unknown>();
    function Probe() {
      const { announce } = useAnnouncement();
      seen.add(announce);
      return null;
    }
    const { rerender } = render(<Probe />);
    rerender(<Probe />);
    rerender(<Probe />);
    expect(seen.size).toBe(1);
  });

  it("cancels its timers on unmount, with no update afterwards", async () => {
    vi.useFakeTimers();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = render(<Announcer text="Bye" />);
    unmount();
    await act(async () => void vi.advanceTimersByTime(5000));
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });

  it("still announces under StrictMode, which mounts, unmounts, and remounts in development", async () => {
    vi.useFakeTimers();
    render(
      <StrictMode>
        <Announcer text="Under StrictMode" />
      </StrictMode>,
    );
    await act(async () => void vi.advanceTimersByTime(100));
    expect(screen.getByRole("status")).toHaveTextContent("Under StrictMode");
  });
});
