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

// jsdom doesn't implement ResizeObserver — several Radix primitives (e.g.
// Tooltip/Popover/Select's `Content`) measure themselves with it on mount.
// A no-op stub is enough since layout measurements aren't meaningful in
// jsdom anyway (no real rendering engine behind it).
class ResizeObserverStub {
  observe() {}

  unobserve() {}

  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);

// jsdom doesn't implement IntersectionObserver either (used by Affix's
// stuck-state detection). A no-op default stub is enough for anything that
// merely needs to not crash; tests that need to actually trigger a
// callback (like Affix's own) install a more capable fake locally via
// `vi.stubGlobal` instead.
class IntersectionObserverStub {
  observe() {}

  unobserve() {}

  disconnect() {}

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);

// jsdom implements neither `scrollIntoView` nor the Pointer Capture API —
// both used by Radix Select (`scrollIntoView` for keyboard-navigated
// items/scroll buttons, pointer capture for its Trigger's click-to-open
// handling). No-op/false stubs are enough since jsdom performs no real
// layout or pointer capture regardless.
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.hasPointerCapture = vi.fn(() => false);
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
