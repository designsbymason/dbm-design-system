import { useCallback, useEffect, useRef, useState } from "react";

// Timings for assistive technology, not design values. A live region announces a *change* to
// its content, so the message goes in a moment after the region is already in the page, and is
// taken out again so the same text isn't also read a second time when browsing the page.
const SHOW_DELAY_MS = 100;
const CLEAR_DELAY_MS = 1000;

export interface Announcement {
  /** The text to render inside a live region (`role="status"`). Empty most of the time. */
  message: string;
  /**
   * Announces `text`: puts it into `message` a moment from now, then clears it about a second
   * later. Announcing again before it clears replaces the pending message. Stable across renders.
   */
  announce: (text: string) => void;
}

/**
 * The timing half of announcing something to a screen reader. Render `message` inside a live
 * region (`<VisuallyHidden role="status">{message}</VisuallyHidden>`) that is **already in the
 * page**, and call `announce(text)` when there is news — the hook puts the text in after a short
 * delay and takes it out again. Pending timers are cancelled on unmount.
 *
 * It holds no memory of what was announced, so it is safe under React's `StrictMode` (which
 * mounts, unmounts, and remounts a component in development): the caller decides *when* something
 * is worth announcing.
 *
 * @example
 * ```tsx
 * const { message, announce } = useAnnouncement();
 * useEffect(() => { if (pageChanged) announce(`Page ${page} of ${pageCount}`); }, [page]);
 * return <VisuallyHidden role="status">{message}</VisuallyHidden>;
 * ```
 */
export function useAnnouncement(): Announcement {
  const [message, setMessage] = useState("");
  const timers = useRef<{ show?: number; clear?: number }>({});

  const cancel = useCallback(() => {
    window.clearTimeout(timers.current.show);
    window.clearTimeout(timers.current.clear);
  }, []);

  const announce = useCallback(
    (text: string) => {
      cancel();
      timers.current.show = window.setTimeout(() => {
        setMessage(text);
        timers.current.clear = window.setTimeout(() => setMessage(""), CLEAR_DELAY_MS);
      }, SHOW_DELAY_MS);
    },
    [cancel],
  );

  useEffect(() => cancel, [cancel]);

  return { message, announce };
}
