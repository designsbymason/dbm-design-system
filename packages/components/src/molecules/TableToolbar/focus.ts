const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Moves keyboard focus to the nearest focusable thing outside `container`, within the `TableToolbar` it sits in: the last
 * one before it in the page, or, failing that, the first one after it. For a part that is about to disappear (a row hidden
 * because the selection emptied, the last filter chip removed) while the person's keyboard focus is inside it: hiding a
 * focused control drops focus to the top of the document and the keyboard user loses their place
 * (`06-engineering-standards.md` §9).
 */
export function focusNearestOutside(container: HTMLElement): void {
  const root = container.closest<HTMLElement>("[data-table-toolbar]") ?? container.parentElement;
  if (!root) return;
  const candidates = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => !container.contains(element) && !element.closest("[hidden]"),
  );
  const before = candidates.filter((element) => container.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING);
  const target = before[before.length - 1] ?? candidates.find((element) => container.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
  target?.focus();
}
