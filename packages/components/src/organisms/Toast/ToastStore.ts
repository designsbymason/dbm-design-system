import type { ToastOpenChangeReason, ToastOptions } from "./Toast.types";

/** One toast the provider holds: what it was asked to show, and whether it is open or on its way out. */
export interface ToastEntry {
  id: string;
  options: ToastOptions;
  /** False once it has been told to close, until it has finished leaving and is removed. */
  open: boolean;
  /**
   * How many times it has been replaced or raised again while it was still here. A change of it draws the toast
   * afresh, which is what starts its time again and has a screen reader read it again.
   */
  revision: number;
  /** How many identical messages it stands for (1 unless it merged some). */
  count: number;
  /** Whether its id was made up here, so that nothing else can mean it and it may be merged. */
  generated: boolean;
}

type Listener = () => void;

const isPlainText = (value: unknown) => value === undefined || typeof value === "string" || typeof value === "number";

/**
 * A message that can be told from another by what it says: plain text, no action, no callbacks (a second call's
 * would be lost in a merge), no id of its own, and not a loading state that something else will update.
 */
function isMergeable(options: ToastOptions): boolean {
  return (
    options.id === undefined &&
    options.action === undefined &&
    options.onOpenChange === undefined &&
    options.onOpenChangeComplete === undefined &&
    !options.loading &&
    isPlainText(options.title) &&
    isPlainText(options.description)
  );
}

const sameMessage = (a: ToastOptions, b: ToastOptions) =>
  a.title === b.title &&
  a.description === b.description &&
  a.tone === b.tone &&
  a.variant === b.variant &&
  a.size === b.size &&
  a.icon === b.icon &&
  a.role === b.role &&
  a.dismissible === b.dismissible &&
  a.duration === b.duration;

/**
 * The provider's list of toasts, outside React so that `useToast()` can hand out functions that never change and a
 * toast can be raised from an event handler, an effect or a promise callback alike. One store per provider or per
 * `createToaster()`: there is no module-level state, so two providers (or two server renders) never share toasts.
 *
 * `snapshot` is a new array on every change and the same array between changes, which is what
 * `useSyncExternalStore` needs.
 */
export class ToastStore {
  private entries: ToastEntry[] = [];
  private listeners = new Set<Listener>();
  private counter = 0;
  private reasons = new Map<string, ToastOpenChangeReason>();
  private showing = Number.POSITIVE_INFINITY;
  private merging = true;

  /** How many toasts, from the front of the list, are on screen; the rest are waiting. */
  setShowing(count: number) {
    this.showing = count;
  }

  /** Whether an identical plain message raised again while it is showing is merged into it. */
  setMerging(merging: boolean) {
    this.merging = merging;
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  snapshot = (): readonly ToastEntry[] => this.entries;

  private emit(next: ToastEntry[]) {
    this.entries = next;
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Raises a toast: merged into an identical one that is still open (counted, and drawn afresh so its time starts
   * again), or added. Returns the id.
   */
  raise(options: ToastOptions): string {
    if (this.merging && isMergeable(options)) {
      const twin = this.entries.find(
        (entry) => entry.open && entry.generated && isMergeable({ ...entry.options, id: undefined }) && sameMessage(entry.options, options),
      );
      if (twin) {
        this.emit(
          this.entries.map((entry) =>
            entry.id === twin.id ? { ...entry, count: entry.count + 1, revision: entry.revision + 1 } : entry,
          ),
        );
        return twin.id;
      }
    }
    return this.add(options);
  }

  /**
   * Adds a toast, or, given the id of one that is still here, replaces its options as a whole, reopens it in the same
   * place and draws it afresh (so its time starts again and it is read again). Returns the id.
   */
  add(options: ToastOptions): string {
    const id = options.id ?? `dbm-toast-${(this.counter += 1)}`;
    const existing = this.entries.find((entry) => entry.id === id);
    if (existing) {
      this.reasons.delete(id);
      this.emit(
        this.entries.map((entry) =>
          entry.id === id
            ? { id, options: { ...options, id }, open: true, revision: entry.revision + 1, count: 1, generated: options.id === undefined && entry.generated }
            : entry,
        ),
      );
    } else {
      this.emit([
        ...this.entries,
        { id, options: { ...options, id }, open: true, revision: 0, count: 1, generated: options.id === undefined },
      ]);
    }
    return id;
  }

  /** Changes part of a toast and keeps the rest, without drawing it afresh. */
  update(id: string, options: Partial<ToastOptions>) {
    if (!this.entries.some((entry) => entry.id === id)) return;
    this.emit(this.entries.map((entry) => (entry.id === id ? { ...entry, options: { ...entry.options, ...options, id } } : entry)));
  }

  /** Marks a toast closed (it stays in the list until `remove`, so its exit can play). Returns whether it changed. */
  close(id: string, reason: ToastOpenChangeReason): boolean {
    const entry = this.entries.find((item) => item.id === id);
    if (!entry || !entry.open) return false;
    this.reasons.set(id, reason);
    this.emit(this.entries.map((item) => (item.id === id ? { ...item, open: false } : item)));
    return true;
  }

  /** Closes the toasts on screen and drops the ones still waiting. */
  closeAll() {
    const next = this.entries.slice(0, this.showing).map((entry) => {
      if (entry.open) this.reasons.set(entry.id, "programmatic");
      return { ...entry, open: false };
    });
    this.emit(next);
  }

  /** The reason a toast was closed for, once, for the `onOpenChange` and completion that follow. */
  takeReason(id: string): ToastOpenChangeReason | undefined {
    const reason = this.reasons.get(id);
    this.reasons.delete(id);
    return reason;
  }

  /** Takes a toast out of the list, once it has finished leaving. */
  remove(id: string) {
    if (!this.entries.some((entry) => entry.id === id)) return;
    this.reasons.delete(id);
    this.emit(this.entries.filter((entry) => entry.id !== id));
  }
}
