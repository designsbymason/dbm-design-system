import type { Ref, RefCallback } from "react";

/**
 * Combines multiple refs (e.g. a `forwardRef` ref and an internal
 * `useRef`) into a single ref callback so all of them stay attached to the
 * same DOM node.
 */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(node);
      } else if (ref && typeof ref === "object") {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}
