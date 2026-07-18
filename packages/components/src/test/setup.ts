import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { toHaveNoViolations } from "jest-axe";
import { afterEach, expect, vi } from "vitest";

expect.extend(toHaveNoViolations);

// globals: false (see vitest.config.ts) means RTL can't auto-detect afterEach
// to register its own cleanup, so it's wired explicitly here.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement matchMedia — provide a safe default (no preference
// matched) so any component reading prefers-color-scheme doesn't crash.
// Individual tests can override this via vi.stubGlobal for specific behavior.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
