// Whether the page has finished loading, for deciding whether an alert that mounts now is one that *appeared* (worth an
// entrance animation) or one that was simply there when the page arrived (which should just be there).
//
// An alert that mounts while the page is still loading — a server-rendered one hydrating, or an app's first render — isn't
// news, so it doesn't animate in. From the load event (or, if that has already happened, straight away) plus two animation
// frames, so the first paint of the page is well behind us, anything that mounts is something that appeared afterwards: an
// error after a submit, a message after a route change. Kept in its own module so a test can stand in for it.

let settled = false;

if (typeof window !== "undefined" && typeof document !== "undefined") {
  const settleAfterTwoFrames = () => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => (settled = true)));
  };
  if (document.readyState === "complete") settleAfterTwoFrames();
  else window.addEventListener("load", settleAfterTwoFrames, { once: true });
}

/** Whether the page has finished loading (and painted a couple of frames since). */
export const hasPageSettled = (): boolean => settled;
