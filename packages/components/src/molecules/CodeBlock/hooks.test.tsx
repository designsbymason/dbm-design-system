import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { languageLabel } from "./languageLabel";
import { tokenize } from "./tokenize";
import { useControllableFlag } from "./useControllableFlag";
import { useCopyButton } from "./useCopyButton";
import { useLineNumbers } from "./useLineNumbers";

describe("useControllableFlag", () => {
  it("holds the value itself from its initial value when nothing controls it, and tells onChange", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useControllableFlag(undefined, true, onChange));
    expect(result.current[0]).toBe(true);
    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("shows what it is told, and only asks, when it is controlled", () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook(({ value }: { value: boolean }) => useControllableFlag(value, false, onChange), { initialProps: { value: false } });
    act(() => result.current[1](true));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(result.current[0]).toBe(false);
    rerender({ value: true });
    expect(result.current[0]).toBe(true);
  });

  it("does not need an onChange", () => {
    const { result } = renderHook(() => useControllableFlag(undefined, false));
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
  });

  it("takes false as control, not as absent", () => {
    const { result } = renderHook(() => useControllableFlag(false, true));
    expect(result.current[0]).toBe(false);
  });
});

describe("useLineNumbers", () => {
  const lines = (code: string, language: string) => tokenize(code, language);
  const diff = "@@ -9,2 +9,3 @@\n a\n-b\n+c\n+d";

  it("counts a block's rows from startLine, and sizes the gutter for the largest number", () => {
    const { result } = renderHook(() => useLineNumbers(true, 98, "ts", lines("a\nb\nc\nd", "ts")));
    expect(result.current).toMatchObject({ numbered: true, firstLine: 98, gutterDigits: 3, diff: undefined });
  });

  it("makes room for a minus sign, and takes an unusable startLine for 1", () => {
    expect(renderHook(() => useLineNumbers(true, -5, "ts", lines("a\nb", "ts"))).result.current).toMatchObject({ firstLine: -5, gutterDigits: 2 });
    expect(renderHook(() => useLineNumbers(true, Number.NaN, "ts", lines("a", "ts"))).result.current.firstLine).toBe(1);
    expect(renderHook(() => useLineNumbers(true, 2.9, "ts", lines("a", "ts"))).result.current.firstLine).toBe(2);
  });

  it("has no gutter when line numbers are off", () => {
    expect(renderHook(() => useLineNumbers(false, 1, "diff", lines(diff, "diff"))).result.current).toMatchObject({ numbered: false, diff: undefined });
  });

  it("numbers a diff with hunk headers in two columns, from row 1, whatever startLine says", () => {
    const { result } = renderHook(() => useLineNumbers(true, 50, "diff", lines(diff, "diff")));
    expect(result.current.numbered).toBe(true);
    expect(result.current.firstLine).toBe(1);
    expect(result.current.diff?.digits).toBe(2);
    expect(result.current.gutterDigits).toBe(6);
    expect(result.current.diff?.text).toHaveLength(5);
  });

  it("numbers a diff written under another name for it, and leaves one with no hunk header without a gutter", () => {
    expect(renderHook(() => useLineNumbers(true, 1, "patch", lines(diff, "patch"))).result.current.diff).toBeDefined();
    const bare = renderHook(() => useLineNumbers(true, 7, "diff", lines("- a\n+ b", "diff"))).result.current;
    expect(bare).toMatchObject({ numbered: false, diff: undefined, firstLine: 7 });
  });
});

describe("languageLabel", () => {
  const registered = (label: unknown) => ({ name: "x", label: label as string, tokenize: () => [[]] });

  it("prefers a registered language's label, trimmed, to a built-in name", () => {
    expect(languageLabel(registered("  Typed  "), "ts")).toBe("Typed");
  });

  it("falls back to the built-in name when the registered label is blank, missing or not text", () => {
    for (const label of ["", "   ", undefined, 5, {}, null]) expect(languageLabel(registered(label), "ts")).toBe("TypeScript");
  });

  it("has no name for a language nobody names", () => {
    expect(languageLabel(undefined, "cobol")).toBeUndefined();
    expect(languageLabel(registered(""), "cobol")).toBeUndefined();
    expect(languageLabel(undefined, undefined)).toBeUndefined();
  });
});

describe("useCopyButton", () => {
  let writeText: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.useFakeTimers();
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
  const options = { text: "$ pnpm add x", language: "bash", stripPrompt: true, duration: 1000, copied: "Copied", copyFailed: "Copy failed" };

  it("copies the code without its shell prompt, says so, tells the app what it copied, and goes back after the duration", async () => {
    const onCopied = vi.fn();
    const { result } = renderHook(() => useCopyButton({ ...options, onCopied }));
    expect(result.current.status).toBe("idle");
    await act(async () => void (await result.current.copy()));
    expect(writeText).toHaveBeenCalledWith("pnpm add x");
    expect(onCopied).toHaveBeenCalledWith("pnpm add x");
    expect(result.current.status).toBe("copied");
    act(() => void vi.advanceTimersByTime(999));
    expect(result.current.status).toBe("copied");
    act(() => void vi.advanceTimersByTime(2));
    expect(result.current.status).toBe("idle");
  });

  it("says it failed, and does not tell the app, when copying is blocked", async () => {
    writeText.mockRejectedValue(new Error("blocked"));
    Object.defineProperty(document, "execCommand", { configurable: true, value: () => false });
    const onCopied = vi.fn();
    const { result } = renderHook(() => useCopyButton({ ...options, onCopied }));
    await act(async () => void (await result.current.copy()));
    expect(result.current.status).toBe("failed");
    expect(onCopied).not.toHaveBeenCalled();
  });

  it("starts the time over when it is copied again while the result is showing", async () => {
    const { result } = renderHook(() => useCopyButton(options));
    await act(async () => void (await result.current.copy()));
    act(() => void vi.advanceTimersByTime(800));
    await act(async () => void (await result.current.copy()));
    act(() => void vi.advanceTimersByTime(800));
    expect(result.current.status).toBe("copied");
    act(() => void vi.advanceTimersByTime(300));
    expect(result.current.status).toBe("idle");
  });

  it("keeps the prompt when it is told to", async () => {
    const { result } = renderHook(() => useCopyButton({ ...options, stripPrompt: false }));
    await act(async () => void (await result.current.copy()));
    expect(writeText).toHaveBeenCalledWith("$ pnpm add x");
  });
});
