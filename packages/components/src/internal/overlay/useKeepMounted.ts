import { useCallback, useState, useSyncExternalStore } from "react";
import { overlaySlotClassName } from "./useOverlayPanel";

const subscribeToNothing = () => () => {};

/**
 * False on the server and while the client is hydrating, true from the first render after it: what lets a
 * component leave out anything the server couldn't have drawn, so its first client render matches the server's.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false);
}

/** The element `keepMounted` renders the content into: it is the section container itself. */
function createHost(): HTMLDivElement | null {
  if (typeof document === "undefined") return null;
  const element = document.createElement("div");
  element.className = overlaySlotClassName;
  return element;
}

/**
 * `keepMounted`: Radix removes its content from the page on close, taking whatever is inside it, so the children
 * are rendered once, by React, into an element of our own and that element is moved into the panel each time it
 * opens. Moving a DOM node doesn't remount what React rendered into it. (Radix's `forceMount` keeps the panel in
 * the page, but also keeps the scroll lock and the page's `aria-hidden` on while closed.)
 *
 * The element is made only once the client has rendered: a portal into it can't be hydrated against the server's
 * HTML (the server has no document to make it in), so a first client render with one would not match. Until then a
 * `keepMounted` panel draws no content, which is no change in what shows, since Radix mounts the panel itself only
 * after hydration.
 *
 * Returns the host (null until it exists), whether the content should be portaled into it (it is rendered the
 * first time the panel opens, then kept), and a ref callback for the panel that moves the host into it, before the
 * close button and the hidden title so Tab reaches the panel's own controls first.
 */
export function useKeepMounted({ keepMounted, open }: { keepMounted: boolean; open: boolean }) {
  const isClient = useIsClient();
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  if (keepMounted && isClient && !host) {
    // Made in render, which React allows for a component's own state, rather than a commit later.
    const created = createHost();
    if (created) setHost(created);
  }
  const [everOpened, setEverOpened] = useState(open);
  if (open && !everOpened) setEverOpened(true);
  const attachHost = useCallback(
    (element: HTMLDivElement | null) => {
      if (element && host && keepMounted) element.insertBefore(host, element.firstChild);
    },
    [host, keepMounted],
  );
  return { host, portalContent: keepMounted && Boolean(host) && everOpened, attachHost };
}
